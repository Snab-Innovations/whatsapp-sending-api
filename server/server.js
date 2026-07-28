const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
require('dotenv').config();

const { analyzeMessage, generateSmartReplies, batchAnalyzeAllMessages } = require('./services/gemini');
const {
  syncTaskToFirestore,
  deleteTaskFromFirestore,
  syncChatToFirestore,
  syncMessageToFirestore,
  loadTasksFromFirestore,
  loadChatsFromFirestore
} = require('./services/firebase');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Render Keep-Alive / Health Endpoint
app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Server keep-alive active' });
});

// Logger
const logger = pino({ level: 'silent' });

// Ensure base data directory exists
const DATA_DIR = path.join(__dirname, 'data');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Multi-Tenant Session Store Map
// Map<sessionId, SessionInstance>
const sessionsMap = new Map();

/**
 * Helper to resolve clean, human-readable contact display names
 */
function resolveDisplayName(id, name, pushName) {
  if (pushName && typeof pushName === 'string' && pushName.trim().length > 0) {
    return pushName.trim();
  }
  if (name && typeof name === 'string' && name.trim().length > 0 && !name.includes('@s.whatsapp.net') && !name.includes('@lid') && !/^\d{10,15}$/.test(name.trim())) {
    return name.trim();
  }
  if (id && typeof id === 'string') {
    const rawNumber = id.split('@')[0].split(':')[0];
    if (/^\d{10,15}$/.test(rawNumber)) {
      if (rawNumber.startsWith('91') && rawNumber.length === 12) {
        return `+91 ${rawNumber.substring(2, 7)} ${rawNumber.substring(7)}`;
      } else if (rawNumber.startsWith('1') && rawNumber.length === 11) {
        return `+1 (${rawNumber.substring(1, 4)}) ${rawNumber.substring(4, 7)}-${rawNumber.substring(7)}`;
      } else {
        return `+${rawNumber}`;
      }
    }
  }
  return name || id || 'WhatsApp Contact';
}

function sanitizeSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return 'default';
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64) || 'default';
}

function generatePasscode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates or retrieves a session instance for a given sessionId
 */
function getOrCreateSession(rawSessionId) {
  const sessionId = sanitizeSessionId(rawSessionId);
  if (sessionsMap.has(sessionId)) {
    return sessionsMap.get(sessionId);
  }

  const sessionDir = path.join(SESSIONS_DIR, sessionId);
  const authPath = path.join(sessionDir, 'baileys_auth_info');
  const storePath = path.join(sessionDir, 'store.json');

  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }

  const sessionInstance = {
    sessionId,
    sessionDir,
    authPath,
    storePath,
    passcode: generatePasscode(),
    sock: null,
    clientState: {
      status: 'INITIALIZING', // INITIALIZING, QR_READY, AUTHENTICATED, READY, DISCONNECTED, AUTH_FAILURE
      qrCodeDataUrl: null,
      userInfo: null,
      lastUpdated: new Date().toISOString(),
      error: null
    },
    chatsMap: new Map(),
    messagesMap: new Map(),
    tasksMap: new Map(),
    sseClients: new Set(),
    isInitializing: false
  };

  sessionsMap.set(sessionId, sessionInstance);

  // Load local store & Firestore store for this session
  loadSessionStoreFromDisk(sessionInstance);
  loadSessionFromFirestore(sessionInstance);

  // Initialize WhatsApp Baileys Socket for this session
  initBaileysSocketForSession(sessionInstance);

  return sessionInstance;
}

function loadSessionStoreFromDisk(session) {
  try {
    if (fs.existsSync(session.storePath)) {
      const raw = fs.readFileSync(session.storePath, 'utf-8');
      const data = JSON.parse(raw);
      if (data.passcode) {
        session.passcode = String(data.passcode).trim();
      } else {
        saveSessionStoreToDisk(session);
      }
      if (Array.isArray(data.chats)) {
        data.chats.forEach(c => {
          if (c && c.id) {
            c.name = resolveDisplayName(c.id, c.name, null);
            session.chatsMap.set(c.id, c);
          }
        });
      }
      if (data.messages && typeof data.messages === 'object') {
        Object.entries(data.messages).forEach(([jid, msgs]) => {
          if (Array.isArray(msgs)) session.messagesMap.set(jid, msgs);
        });
      }
      if (Array.isArray(data.tasks)) {
        data.tasks.forEach(t => {
          if (t && t.id) session.tasksMap.set(t.id, t);
        });
      }
      console.log(`[Session 💾 ${session.sessionId}] Loaded persistent state from disk: ${session.chatsMap.size} chats, ${session.messagesMap.size} message threads, ${session.tasksMap.size} tasks (Passcode: ${session.passcode}).`);
    } else {
      saveSessionStoreToDisk(session);
    }
  } catch (err) {
    console.error(`[Session ${session.sessionId}] Error reading store.json:`, err.message);
  }
}

function saveSessionStoreToDisk(session) {
  try {
    const data = {
      passcode: session.passcode,
      chats: Array.from(session.chatsMap.values()),
      messages: Object.fromEntries(session.messagesMap),
      tasks: Array.from(session.tasksMap.values())
    };
    fs.writeFileSync(session.storePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Session ${session.sessionId}] Error writing store.json:`, err.message);
  }
}

async function loadSessionFromFirestore(session) {
  try {
    const firestoreTasks = await loadTasksFromFirestore(session.sessionId);
    if (firestoreTasks && firestoreTasks.length > 0) {
      firestoreTasks.forEach(t => {
        if (t && t.id) session.tasksMap.set(t.id, t);
      });
    }

    const firestoreChats = await loadChatsFromFirestore(session.sessionId);
    if (firestoreChats && firestoreChats.length > 0) {
      firestoreChats.forEach(c => {
        if (c && c.id) {
          const existing = session.chatsMap.get(c.id) || {};
          session.chatsMap.set(c.id, { ...existing, ...c });
        }
      });
    }
    saveSessionStoreToDisk(session);
  } catch (err) {
    console.error(`[Session ${session.sessionId}] Firestore hydrate error:`, err.message);
  }
}

function broadcastSessionState(session, newState) {
  session.clientState = {
    ...session.clientState,
    ...newState,
    lastUpdated: new Date().toISOString()
  };

  const payload = `data: ${JSON.stringify(session.clientState)}\n\n`;
  session.sseClients.forEach(res => res.write(payload));
}

async function initBaileysSocketForSession(session) {
  if (session.isInitializing) return;
  session.isInitializing = true;

  console.log(`[Baileys ${session.sessionId}] Initializing WASocket connection...`);

  const { state, saveCreds } = await useMultiFileAuthState(session.authPath);
  const { version } = await fetchLatestBaileysVersion();

  const hasSession = Boolean(state.creds && state.creds.me);
  if (hasSession) {
    broadcastSessionState(session, {
      status: 'AUTHENTICATED',
      qrCodeDataUrl: null,
      error: null
    });
  } else {
    broadcastSessionState(session, {
      status: 'INITIALIZING',
      qrCodeDataUrl: null,
      userInfo: null,
      error: null
    });
  }

  session.sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    getMessage: async (key) => {
      if (!key || !key.remoteJid || !key.id) return undefined;
      try {
        const remoteJid = jidNormalizedUser(key.remoteJid);
        const chatMsgs = session.messagesMap.get(remoteJid) || [];
        const msgObj = chatMsgs.find(m => m.id === key.id);
        if (msgObj && msgObj.body) {
          return { conversation: msgObj.body };
        }
      } catch (e) {}
      return undefined;
    },
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000
  });

  session.sock.ev.on('creds.update', saveCreds);

  session.sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      if (!state.creds || !state.creds.me) {
        console.log(`[Baileys ${session.sessionId}] QR Code received...`);
        try {
          const qrDataUrl = await qrcode.toDataURL(qr, { margin: 2, scale: 8 });
          broadcastSessionState(session, {
            status: 'QR_READY',
            qrCodeDataUrl: qrDataUrl
          });
        } catch (err) {
          console.error(`[Baileys ${session.sessionId}] QR generation error:`, err);
        }
      }
    }

    if (connection === 'open') {
      session.isInitializing = false;
      console.log(`[Baileys ${session.sessionId}] WebSocket Connection OPEN! WhatsApp Ready!`);
      const userJid = session.sock.user ? jidNormalizedUser(session.sock.user.id) : (state.creds.me ? jidNormalizedUser(state.creds.me.id) : null);
      const phone = userJid ? userJid.split('@')[0] : '';
      const pushname = (session.sock.user && session.sock.user.name) || (state.creds.me && state.creds.me.name) || 'WhatsApp User';

      broadcastSessionState(session, {
        status: 'READY',
        userInfo: {
          pushname,
          phone,
          wid: userJid,
          platform: 'Baileys WebSocket + Gemini AI'
        },
        qrCodeDataUrl: null
      });

      saveSessionStoreToDisk(session);
      setTimeout(() => runBackgroundHistoricalAnalysisForSession(session), 3000);
    }

    if (connection === 'close') {
      session.isInitializing = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isReplaced = statusCode === DisconnectReason.connectionReplaced || statusCode === 440;

      console.log(`[Baileys ${session.sessionId}] Connection closed. StatusCode: ${statusCode}, LoggedOut: ${isLoggedOut}, Replaced: ${isReplaced}`);

      if (isLoggedOut) {
        if (fs.existsSync(session.authPath)) {
          fs.rmSync(session.authPath, { recursive: true, force: true });
        }
        session.chatsMap.clear();
        session.messagesMap.clear();
        session.tasksMap.clear();
        broadcastSessionState(session, { status: 'DISCONNECTED', qrCodeDataUrl: null, error: 'Session logged out. Re-scan QR code.' });
        setTimeout(() => initBaileysSocketForSession(session), 1500);
      } else if (isReplaced) {
        setTimeout(() => initBaileysSocketForSession(session), 6000);
      } else {
        setTimeout(() => initBaileysSocketForSession(session), 3000);
      }
    }
  });

  // Handle Full History Sync
  session.sock.ev.on('messaging-history.set', async ({ chats, messages, contacts }) => {
    console.log(`[Baileys ${session.sessionId}] History Sync: ${chats ? chats.length : 0} chats, ${messages ? messages.length : 0} messages.`);
    if (contacts && Array.isArray(contacts)) {
      contacts.forEach(c => {
        if (!c.id) return;
        const normalizedJid = jidNormalizedUser(c.id);
        const existing = session.chatsMap.get(normalizedJid) || {};
        const resolvedName = resolveDisplayName(normalizedJid, c.name, c.notify);
        existing.name = resolvedName;
        existing.id = normalizedJid;
        session.chatsMap.set(normalizedJid, existing);
      });
    }

    if (chats && Array.isArray(chats)) {
      chats.forEach(c => {
        if (!c.id) return;
        const normalizedJid = jidNormalizedUser(c.id);
        const existing = session.chatsMap.get(normalizedJid) || {};
        const chatObj = {
          id: normalizedJid,
          name: resolveDisplayName(normalizedJid, existing.name || c.name, c.name),
          isGroup: normalizedJid.endsWith('@g.us'),
          isArchived: Boolean(c.archived),
          isPinned: Boolean(c.pinned),
          unreadCount: c.unreadCount || 0,
          timestamp: Number(c.conversationTimestamp || Math.floor(Date.now() / 1000)),
          profilePicUrl: existing.profilePicUrl || null
        };
        session.chatsMap.set(normalizedJid, chatObj);
        syncChatToFirestore(chatObj, session.sessionId).catch(() => null);
      });
    }

    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        if (!msg.message) continue;
        const rawJid = msg.key.remoteJid;
        if (!rawJid || rawJid === 'status@broadcast') continue;
        const remoteJid = jidNormalizedUser(rawJid);

        let content = msg.message;
        if (content?.ephemeralMessage?.message) content = content.ephemeralMessage.message;
        if (content?.viewOnceMessage?.message) content = content.viewOnceMessage.message;

        const body =
          content?.conversation ||
          content?.extendedTextMessage?.text ||
          content?.imageMessage?.caption ||
          content?.videoMessage?.caption ||
          (content?.imageMessage ? '📷 Image' : '') ||
          (content?.audioMessage ? '🎵 Audio' : '') ||
          '';

        const timestamp = Number(msg.messageTimestamp || Math.floor(Date.now() / 1000));
        const fromMe = Boolean(msg.key.fromMe);
        const msgId = msg.key.id || String(Date.now());

        const formattedMsg = {
          id: msgId,
          body,
          from: fromMe ? (session.sock.user ? jidNormalizedUser(session.sock.user.id) : '') : remoteJid,
          to: fromMe ? remoteJid : (session.sock.user ? jidNormalizedUser(session.sock.user.id) : ''),
          fromMe,
          timestamp,
          type: content?.imageMessage ? 'image' : 'chat',
          hasMedia: Boolean(content?.imageMessage || content?.videoMessage || content?.audioMessage),
          author: msg.key.participant || null,
          chatId: remoteJid
        };

        if (!session.messagesMap.has(remoteJid)) {
          session.messagesMap.set(remoteJid, []);
        }
        const chatMsgs = session.messagesMap.get(remoteJid);
        if (!chatMsgs.some(m => m.id === msgId)) {
          chatMsgs.push(formattedMsg);
        }
      }
    }

    saveSessionStoreToDisk(session);
    console.log(`[Baileys ${session.sessionId}] Processed ${session.chatsMap.size} active chats into memory store.`);
  });

  // Real-time Messages Listener
  session.sock.ev.on('messages.upsert', async ({ messages: rawMsgs, type }) => {
    for (const msg of rawMsgs) {
      if (!msg.message) continue;

      const rawJid = msg.key.remoteJid;
      if (!rawJid || rawJid === 'status@broadcast') continue;
      const remoteJid = jidNormalizedUser(rawJid);

      let content = msg.message;
      if (content?.ephemeralMessage?.message) content = content.ephemeralMessage.message;
      if (content?.viewOnceMessage?.message) content = content.viewOnceMessage.message;
      if (content?.viewOnceMessageV2?.message) content = content.viewOnceMessageV2.message;
      if (content?.documentWithCaptionMessage?.message) content = content.documentWithCaptionMessage.message;

      const body =
        content?.conversation ||
        content?.extendedTextMessage?.text ||
        content?.imageMessage?.caption ||
        content?.videoMessage?.caption ||
        content?.documentMessage?.caption ||
        content?.templateButtonReplyMessage?.selectedId ||
        content?.buttonsResponseMessage?.selectedButtonId ||
        content?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
        (content?.imageMessage ? '📷 Image' : '') ||
        (content?.videoMessage ? '🎥 Video' : '') ||
        (content?.audioMessage ? '🎵 Audio' : '') ||
        (content?.documentMessage ? '📄 Document' : '') ||
        (content?.stickerMessage ? '🎨 Sticker' : '') ||
        (content?.contactMessage || content?.contactsArrayMessage ? '👤 Contact' : '') ||
        (content?.locationMessage || content?.liveLocationMessage ? '📍 Location' : '') ||
        '';

      const timestamp = Number(msg.messageTimestamp || Math.floor(Date.now() / 1000));
      const fromMe = Boolean(msg.key.fromMe);
      const msgId = msg.key.id || String(Date.now());

      const formattedMsg = {
        id: msgId,
        body,
        from: fromMe ? (session.sock.user ? jidNormalizedUser(session.sock.user.id) : '') : remoteJid,
        to: fromMe ? remoteJid : (session.sock.user ? jidNormalizedUser(session.sock.user.id) : ''),
        fromMe,
        timestamp,
        type: content?.imageMessage ? 'image' : (content?.videoMessage ? 'video' : (content?.audioMessage ? 'audio' : 'chat')),
        hasMedia: Boolean(content?.imageMessage || content?.videoMessage || content?.audioMessage || content?.documentMessage),
        author: msg.key.participant || null,
        chatId: remoteJid
      };

      const existingChat = session.chatsMap.get(remoteJid);
      const pushName = msg.pushName || null;
      let chatName = resolveDisplayName(remoteJid, existingChat?.name, pushName);
      if (existingChat && pushName) {
        existingChat.name = pushName;
      }

      if (!session.messagesMap.has(remoteJid)) {
        session.messagesMap.set(remoteJid, []);
      }
      const chatMsgs = session.messagesMap.get(remoteJid);
      if (!chatMsgs.some(m => m.id === msgId)) {
        chatMsgs.push(formattedMsg);
        if (chatMsgs.length > 300) chatMsgs.shift();
      }

      const updatedChat = existingChat || {
        id: remoteJid,
        name: chatName,
        isGroup: remoteJid.endsWith('@g.us'),
        isArchived: false,
        isPinned: false,
        unreadCount: 0,
        timestamp,
        profilePicUrl: null
      };

      updatedChat.name = chatName;
      updatedChat.timestamp = timestamp;
      if (!fromMe) {
        updatedChat.unreadCount = (updatedChat.unreadCount || 0) + 1;
      }
      updatedChat.lastMessage = {
        body,
        timestamp,
        fromMe,
        type: formattedMsg.type
      };

      session.chatsMap.set(remoteJid, updatedChat);
      saveSessionStoreToDisk(session);
      syncMessageToFirestore(remoteJid, formattedMsg, session.sessionId).catch(() => null);
      syncChatToFirestore(updatedChat, session.sessionId).catch(() => null);

      console.log(`[Baileys SSE ${session.sessionId}] 📩 Instant New Message for ${remoteJid}: "${body}"`);

      // ⚡ INSTANT SSE BROADCAST TO SESSION CLIENTS
      const ssePayload = `data: ${JSON.stringify({
        eventType: 'NEW_MESSAGE',
        message: formattedMsg,
        chat: updatedChat
      })}\n\n`;
      session.sseClients.forEach(res => res.write(ssePayload));

      // 🤖 Non-blocking Background Gemini AI Task Analysis
      if (body && body.trim().length > 2 && type === 'notify') {
        analyzeMessage(body, chatName)
          .then((aiAnalysis) => {
            if (!aiAnalysis) return;
            formattedMsg.aiAnalysis = aiAnalysis;

            if (aiAnalysis.hasTask) {
              const targetTaskId = `task-${msgId}`;
              let existingId = null;
              if (session.tasksMap.has(targetTaskId)) {
                existingId = targetTaskId;
              } else {
                for (const [id, t] of session.tasksMap.entries()) {
                  if (t.chatId === remoteJid && t.originalMessage === body) {
                    existingId = id;
                    break;
                  }
                }
              }

              let taskObj;
              if (existingId) {
                taskObj = session.tasksMap.get(existingId);
                taskObj.priority = aiAnalysis.priority || taskObj.priority;
                taskObj.category = aiAnalysis.category || taskObj.category;
                taskObj.title = aiAnalysis.taskTitle || taskObj.title;
                taskObj.dueDate = aiAnalysis.dueDate || taskObj.dueDate;
                taskObj.verdict = aiAnalysis.verdict || aiAnalysis.summary || taskObj.verdict;
                session.tasksMap.set(existingId, taskObj);
              } else {
                taskObj = {
                  id: targetTaskId,
                  title: aiAnalysis.taskTitle || body,
                  chatId: remoteJid,
                  chatName,
                  originalMessage: body,
                  priority: aiAnalysis.priority || 'MEDIUM',
                  category: aiAnalysis.category || 'General',
                  status: 'TO_DO',
                  dueDate: aiAnalysis.dueDate || 'Upcoming',
                  sentiment: aiAnalysis.sentiment || 'Neutral',
                  summary: aiAnalysis.summary || '',
                  verdict: aiAnalysis.verdict || aiAnalysis.summary || body,
                  createdAt: new Date().toISOString()
                };
                session.tasksMap.set(targetTaskId, taskObj);
              }

              syncTaskToFirestore(taskObj, session.sessionId).catch(() => null);
              console.log(`[Gemini AI 🎯 ${session.sessionId}] Extracted Task: "${taskObj.title}"`);

              const taskPayload = `data: ${JSON.stringify({
                eventType: 'NEW_TASK',
                task: taskObj
              })}\n\n`;
              session.sseClients.forEach(res => res.write(taskPayload));
            }
          })
          .catch(err => console.error(`[Gemini AI ${session.sessionId}] Background analysis error:`, err));
      }
    }
  });

  // Sync Chats
  session.sock.ev.on('chats.upsert', (newChats) => {
    for (const c of newChats) {
      if (!c.id) continue;
      const existing = session.chatsMap.get(c.id) || {};
      const chatObj = {
        id: c.id,
        name: resolveDisplayName(c.id, existing.name || c.name, c.name),
        isGroup: c.id.endsWith('@g.us'),
        isArchived: Boolean(c.archived || existing.isArchived),
        isPinned: Boolean(c.pinned || existing.isPinned),
        unreadCount: c.unreadCount || existing.unreadCount || 0,
        timestamp: Number(c.conversationTimestamp || existing.timestamp || Math.floor(Date.now() / 1000)),
        profilePicUrl: existing.profilePicUrl || null
      };
      session.chatsMap.set(c.id, chatObj);
    }
    saveSessionStoreToDisk(session);
  });
}

async function runBackgroundHistoricalAnalysisForSession(session) {
  if (!session.chatsMap || session.chatsMap.size === 0) return;
  console.log(`[Gemini AI 🤖 ${session.sessionId}] Background historical analysis starting...`);

  const allRecentMessages = [];
  for (const [jid, msgs] of session.messagesMap.entries()) {
    const chatObj = session.chatsMap.get(jid);
    const chatName = chatObj ? chatObj.name : 'Unknown';
    if (Array.isArray(msgs)) {
      msgs.slice(-15).forEach(m => {
        if (m.body && m.body.trim().length > 3) {
          allRecentMessages.push({ ...m, chatName });
        }
      });
    }
  }

  if (allRecentMessages.length === 0) return;

  try {
    const extractedTasks = await batchAnalyzeAllMessages(allRecentMessages);
    if (Array.isArray(extractedTasks) && extractedTasks.length > 0) {
      console.log(`[Gemini AI 🚀 ${session.sessionId}] Extracted ${extractedTasks.length} tasks from background analysis.`);
      extractedTasks.forEach(task => {
        if (!task.id) task.id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        session.tasksMap.set(task.id, task);
        syncTaskToFirestore(task, session.sessionId).catch(() => null);
      });
      saveSessionStoreToDisk(session);

      const bulkPayload = `data: ${JSON.stringify({ eventType: 'BULK_ANALYSIS_COMPLETE' })}\n\n`;
      session.sseClients.forEach(res => res.write(bulkPayload));
    }
  } catch (err) {
    console.error(`[Gemini AI ${session.sessionId}] Historical analysis error:`, err.message);
  }
}

// Auto-restore any existing sessions on server boot
function restoreExistingSessions() {
  try {
    if (fs.existsSync(SESSIONS_DIR)) {
      const sessionFolders = fs.readdirSync(SESSIONS_DIR);
      sessionFolders.forEach(folderName => {
        const fullPath = path.join(SESSIONS_DIR, folderName);
        if (fs.statSync(fullPath).isDirectory()) {
          console.log(`[Server] Restoring session from disk: "${folderName}"`);
          getOrCreateSession(folderName);
        }
      });
    }
  } catch (err) {
    console.error('[Server] Session restore error:', err.message);
  }
}

// Middleware: attach user's session instance to every request
app.use((req, res, next) => {
  const rawId = req.headers['x-session-id'] || req.query.sessionId || 'default';
  req.sessionInstance = getOrCreateSession(rawId);
  next();
});

// Middleware: Verify Session Passcode for protected endpoints
function verifyPasscodeAuth(req, res, next) {
  const session = req.sessionInstance;
  if (!session) return next();

  const clientPasscode = req.headers['x-session-passcode'] || req.query.passcode;
  const isValid = Boolean(
    session.passcode &&
    clientPasscode &&
    String(clientPasscode).trim() === String(session.passcode).trim()
  );

  if (!isValid) {
    return res.status(401).json({
      error: 'PASSCODE_REQUIRED',
      requiresPasscode: true,
      sessionId: session.sessionId,
      message: 'Access locked. Please enter your 6-digit session passcode.'
    });
  }
  next();
}

// --- Public Auth Endpoints ---
app.get('/api/status', (req, res) => {
  const session = req.sessionInstance;
  const clientPasscode = req.headers['x-session-passcode'] || req.query.passcode;
  const isUnlocked = Boolean(
    session.passcode &&
    clientPasscode &&
    String(clientPasscode).trim() === String(session.passcode).trim()
  );

  res.json({
    ...session.clientState,
    sessionId: session.sessionId,
    hasPasscode: true,
    isLocked: !isUnlocked,
    // Reveal passcode during QR scanning / setup or if unlocked
    passcode: (session.clientState.status === 'QR_READY' || session.clientState.status === 'INITIALIZING' || isUnlocked) ? session.passcode : null
  });
});

app.post('/api/auth/verify-passcode', (req, res) => {
  const session = req.sessionInstance;
  const { passcode } = req.body || {};

  const isValid = Boolean(
    session.passcode &&
    passcode &&
    String(passcode).trim() === String(session.passcode).trim()
  );

  if (!isValid) {
    return res.status(401).json({ success: false, error: 'Invalid session passcode. Access denied.' });
  }

  res.json({
    success: true,
    sessionId: session.sessionId,
    passcode: session.passcode,
    message: 'Passcode verified successfully!'
  });
});

app.post('/api/auth/set-passcode', verifyPasscodeAuth, (req, res) => {
  const session = req.sessionInstance;
  const { newPasscode } = req.body || {};

  if (!newPasscode || String(newPasscode).trim().length < 4) {
    return res.status(400).json({ error: 'Passcode must be at least 4 characters long.' });
  }

  session.passcode = String(newPasscode).trim();
  saveSessionStoreToDisk(session);
  res.json({ success: true, passcode: session.passcode, message: 'Passcode updated successfully!' });
});

// --- Protected API Endpoints ---
app.get('/api/events', verifyPasscodeAuth, (req, res) => {
  const session = req.sessionInstance;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  session.sseClients.add(res);

  // Immediately send initial connection state
  res.write(`data: ${JSON.stringify({ ...session.clientState, sessionId: session.sessionId })}\n\n`);

  req.on('close', () => {
    session.sseClients.delete(res);
  });
});

app.get('/api/chats', verifyPasscodeAuth, (req, res) => {
  const session = req.sessionInstance;
  if (session.clientState.status !== 'READY' && session.chatsMap.size === 0) {
    return res.status(503).json({ error: 'WhatsApp client not ready yet' });
  }

  const sortedChats = Array.from(session.chatsMap.values())
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  res.json({ chats: sortedChats });
});

app.get('/api/chats/:chatId/messages', verifyPasscodeAuth, (req, res) => {
  const session = req.sessionInstance;
  const { chatId } = req.params;
  const limit = parseInt(req.query.limit) || 50;

  const remoteJid = jidNormalizedUser(decodeURIComponent(chatId));
  const msgs = session.messagesMap.get(remoteJid) || [];
  const sliced = msgs.slice(-limit);

  res.json({ chatId: remoteJid, messages: sliced, total: msgs.length });
});

app.post('/api/messages/send', verifyPasscodeAuth, async (req, res) => {
  const session = req.sessionInstance;
  const { chatId, message } = req.body;

  if (session.clientState.status !== 'READY' || !session.sock) {
    return res.status(503).json({ error: 'WhatsApp socket not connected' });
  }

  if (!chatId || !message || typeof message !== 'string') {
    return res.status(400).json({ error: 'chatId and message string required' });
  }

  try {
    const remoteJid = jidNormalizedUser(chatId);
    const sent = await session.sock.sendMessage(remoteJid, { text: message });

    const msgId = sent.key.id || String(Date.now());
    const timestamp = Math.floor(Date.now() / 1000);

    const formattedMsg = {
      id: msgId,
      body: message,
      from: session.sock.user ? jidNormalizedUser(session.sock.user.id) : '',
      to: remoteJid,
      fromMe: true,
      timestamp,
      type: 'chat',
      hasMedia: false,
      author: null,
      chatId: remoteJid
    };

    if (!session.messagesMap.has(remoteJid)) {
      session.messagesMap.set(remoteJid, []);
    }
    session.messagesMap.get(remoteJid).push(formattedMsg);

    const existingChat = session.chatsMap.get(remoteJid) || {
      id: remoteJid,
      name: resolveDisplayName(remoteJid, null, null),
      isGroup: remoteJid.endsWith('@g.us'),
      unreadCount: 0
    };

    existingChat.timestamp = timestamp;
    existingChat.lastMessage = { body: message, timestamp, fromMe: true, type: 'chat' };
    session.chatsMap.set(remoteJid, existingChat);
    saveSessionStoreToDisk(session);

    res.json({ success: true, message: formattedMsg });
  } catch (err) {
    console.error(`[Session ${session.sessionId}] Error sending message:`, err);
    res.status(500).json({ error: 'Failed to send message via WhatsApp' });
  }
});

// Tasks Endpoints
app.get('/api/tasks', verifyPasscodeAuth, (req, res) => {
  const tasks = Array.from(req.sessionInstance.tasksMap.values());
  res.json({ tasks });
});

app.post('/api/tasks', verifyPasscodeAuth, (req, res) => {
  const session = req.sessionInstance;
  const taskData = req.body;
  if (!taskData || !taskData.title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const taskId = taskData.id || `task-${Date.now()}`;
  const taskObj = {
    id: taskId,
    title: taskData.title,
    chatId: taskData.chatId || '',
    chatName: taskData.chatName || 'Manual Entry',
    originalMessage: taskData.originalMessage || taskData.title,
    priority: taskData.priority || 'MEDIUM',
    category: taskData.category || 'General',
    status: taskData.status || 'TO_DO',
    dueDate: taskData.dueDate || 'Upcoming',
    sentiment: taskData.sentiment || 'Neutral',
    summary: taskData.summary || taskData.title,
    verdict: taskData.verdict || taskData.title,
    createdAt: new Date().toISOString()
  };

  session.tasksMap.set(taskId, taskObj);
  saveSessionStoreToDisk(session);
  syncTaskToFirestore(taskObj, session.sessionId).catch(() => null);

  res.json({ success: true, task: taskObj });
});

app.patch('/api/tasks/:id', verifyPasscodeAuth, (req, res) => {
  const session = req.sessionInstance;
  const { id } = req.params;
  const updates = req.body;

  if (!session.tasksMap.has(id)) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const existing = session.tasksMap.get(id);
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  session.tasksMap.set(id, updated);
  saveSessionStoreToDisk(session);
  syncTaskToFirestore(updated, session.sessionId).catch(() => null);

  res.json({ success: true, task: updated });
});

app.delete('/api/tasks/:id', verifyPasscodeAuth, (req, res) => {
  const session = req.sessionInstance;
  const { id } = req.params;

  session.tasksMap.delete(id);
  saveSessionStoreToDisk(session);
  deleteTaskFromFirestore(id, session.sessionId).catch(() => null);

  res.json({ success: true, id });
});

app.post('/api/logout', verifyPasscodeAuth, (req, res) => {
  const session = req.sessionInstance;
  try {
    if (session.sock) {
      session.sock.logout().catch(() => null);
    }
    if (fs.existsSync(session.authPath)) {
      fs.rmSync(session.authPath, { recursive: true, force: true });
    }
    session.chatsMap.clear();
    session.messagesMap.clear();
    session.tasksMap.clear();
    broadcastSessionState(session, {
      status: 'DISCONNECTED',
      qrCodeDataUrl: null,
      userInfo: null,
      error: 'Session logged out manually.'
    });
    setTimeout(() => initBaileysSocketForSession(session), 1000);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/restart', verifyPasscodeAuth, (req, res) => {
  const session = req.sessionInstance;
  try {
    if (session.sock) {
      session.sock.end(new Error('Manual Restart'));
    }
    setTimeout(() => initBaileysSocketForSession(session), 1000);
    res.json({ success: true, message: 'Restarting WhatsApp socket...' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/analyze-all', verifyPasscodeAuth, async (req, res) => {
  const session = req.sessionInstance;
  runBackgroundHistoricalAnalysisForSession(session);
  res.json({ success: true, message: 'Bulk historical analysis triggered in background.' });
});

// --- Render Keep-Alive Auto-Ping (Every 10 minutes) ---
const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function startKeepAliveSelfPing() {
  setInterval(() => {
    const targetUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || `http://localhost:${PORT}`;
    const pingEndpoint = `${targetUrl.replace(/\/$/, '')}/ping`;

    try {
      const httpModule = pingEndpoint.startsWith('https') ? require('https') : require('http');
      httpModule.get(pingEndpoint, (res) => {
        console.log(`[Keep-Alive ⏰] Self-ping to ${pingEndpoint} returned status ${res.statusCode}`);
      }).on('error', (err) => {
        console.warn(`[Keep-Alive ⚠️] Self-ping attempt to ${pingEndpoint} failed: ${err.message}`);
      });
    } catch (err) {
      console.error(`[Keep-Alive ⚠️] Self-ping error:`, err.message);
    }
  }, KEEP_ALIVE_INTERVAL_MS);
}

// Start Server & Restore Sessions
const serverInstance = app.listen(PORT, () => {
  console.log(`\n🚀 Multi-Tenant WhatsApp + Gemini AI Server listening on http://localhost:${PORT}`);
  restoreExistingSessions();
  // Ensure default session is created if none exists
  getOrCreateSession('default');
  // Start Keep-Alive Auto Ping
  startKeepAliveSelfPing();
});

serverInstance.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n🟢 Port ${PORT} is ALREADY IN USE by another process.`);
    process.exit(0);
  } else {
    console.error('Server error:', err);
  }
});

// Clean shutdown
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
