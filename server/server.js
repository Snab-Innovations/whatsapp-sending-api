const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
require('dotenv').config();

const { analyzeMessage, generateSmartReplies, batchAnalyzeAllMessages } = require('./services/gemini');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Logger
const logger = pino({ level: 'silent' });

// Global client & connection state
let sock = null;
let clientState = {
  status: 'INITIALIZING', // INITIALIZING, QR_READY, AUTHENTICATED, READY, DISCONNECTED, AUTH_FAILURE
  qrCodeDataUrl: null,
  userInfo: null,
  lastUpdated: new Date().toISOString(),
  error: null
};

// In-memory data store for chats, messages, and AI tasks
const chatsMap = new Map(); // jid -> chatObj
const messagesMap = new Map(); // jid -> messageArray
const tasksMap = new Map(); // taskId -> taskObj
let sseClients = [];

const STORE_PATH = path.join(__dirname, 'data', 'store.json');

function loadStoreFromDisk() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.chats)) {
        data.chats.forEach(c => {
          if (c && c.id) chatsMap.set(c.id, c);
        });
      }
      if (data.messages && typeof data.messages === 'object') {
        Object.entries(data.messages).forEach(([jid, msgs]) => {
          if (Array.isArray(msgs)) messagesMap.set(jid, msgs);
        });
      }
      if (Array.isArray(data.tasks)) {
        data.tasks.forEach(t => {
          if (t && t.id) tasksMap.set(t.id, t);
        });
      }
      console.log(`[Store 💾] Loaded persistent state from disk: ${chatsMap.size} chats, ${messagesMap.size} message threads, ${tasksMap.size} tasks.`);
    }
  } catch (err) {
    console.error('[Store 💾] Error loading store from disk:', err.message);
  }
}

let saveDebounceTimer = null;
function saveStoreToDisk() {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    try {
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const chats = Array.from(chatsMap.values());
      const messagesObj = {};
      for (const [jid, msgs] of messagesMap.entries()) {
        messagesObj[jid] = msgs.slice(-300);
      }
      const tasks = Array.from(tasksMap.values());
      fs.writeFileSync(STORE_PATH, JSON.stringify({ chats, messages: messagesObj, tasks }, null, 2));
    } catch (err) {
      console.error('[Store 💾] Error saving store to disk:', err.message);
    }
  }, 500);
}

// Load persisted state immediately on server boot
loadStoreFromDisk();

async function runBackgroundHistoricalAnalysis() {
  console.log('[Background AI 🤖] Running background historical message & task analysis across all chats...');
  try {
    const report = await batchAnalyzeAllMessages(chatsMap, messagesMap, tasksMap);
    saveStoreToDisk();
    console.log(`[Background AI 🤖] Analysis complete! Extracted ${report.newTasksExtracted} new tasks. Total active tasks: ${tasksMap.size}`);

    const tasksArray = Array.from(tasksMap.values());
    const ssePayload = `data: ${JSON.stringify({
      eventType: 'BULK_ANALYSIS_COMPLETE',
      tasksCount: tasksArray.length,
      report
    })}\n\n`;
    sseClients.forEach(res => res.write(ssePayload));
  } catch (err) {
    console.error('[Background AI 🤖] Historical background analysis error:', err.message);
  }
}

function broadcastState() {
  clientState.lastUpdated = new Date().toISOString();
  const payload = `data: ${JSON.stringify({ eventType: 'STATE_UPDATE', ...clientState })}\n\n`;
  sseClients.forEach(res => res.write(payload));
}

function updateState(updates) {
  clientState = { ...clientState, ...updates };
  console.log(`[Baileys State] -> ${clientState.status}`);
  broadcastState();
}

let isInitializing = false;

async function initBaileysSocket() {
  if (isInitializing) {
    console.log('[Baileys] Initialization already in progress, ignoring concurrent call.');
    return;
  }
  isInitializing = true;

  if (sock) {
    console.log('[Baileys] Tearing down existing socket listeners before reconnect...');
    try {
      sock.ev.removeAllListeners();
      if (sock.ws) sock.ws.close();
      sock = null;
    } catch (e) {}
  }

  const authPath = path.join(__dirname, 'baileys_auth_info');
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`[Baileys] Using WhatsApp Web v${version.join('.')}, isLatest: ${isLatest}`);

  const hasSession = Boolean(state.creds && state.creds.me);
  if (hasSession) {
    console.log('[Baileys] Existing session detected for:', state.creds.me.id);
    updateState({
      status: 'AUTHENTICATED',
      qrCodeDataUrl: null,
      error: null
    });
  } else {
    updateState({
      status: 'INITIALIZING',
      qrCodeDataUrl: null,
      userInfo: null,
      error: null
    });
  }

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000
  });

  sock.ev.on('creds.update', saveCreds);

  // Connection Updates (QR code, Ready, Logout)
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      if (!state.creds || !state.creds.me) {
        console.log('[Baileys] QR Code received for new session...');
        try {
          const qrDataUrl = await qrcode.toDataURL(qr, { margin: 2, scale: 8 });
          updateState({
            status: 'QR_READY',
            qrCodeDataUrl: qrDataUrl
          });
        } catch (err) {
          console.error('[Baileys] Error generating QR data URL:', err);
        }
      } else {
        console.log('[Baileys] Suppressed transient QR code since session is already authenticated.');
      }
    }

    if (connection === 'open') {
      isInitializing = false;
      console.log('[Baileys] WebSocket Connection OPEN! WhatsApp Ready!');
      const userJid = sock.user ? jidNormalizedUser(sock.user.id) : (state.creds.me ? jidNormalizedUser(state.creds.me.id) : null);
      const phone = userJid ? userJid.split('@')[0] : '';
      const pushname = (sock.user && sock.user.name) || (state.creds.me && state.creds.me.name) || 'WhatsApp User';

      updateState({
        status: 'READY',
        userInfo: {
          pushname,
          phone,
          wid: userJid,
          platform: 'Baileys WebSocket + Gemini AI'
        },
        qrCodeDataUrl: null
      });

      saveStoreToDisk();
      // Trigger background historical analysis automatically when WhatsApp becomes ready
      setTimeout(() => runBackgroundHistoricalAnalysis(), 3000);
    }

    if (connection === 'close') {
      isInitializing = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isReplaced = statusCode === DisconnectReason.connectionReplaced || statusCode === 440;

      console.log(`[Baileys] Connection closed. StatusCode: ${statusCode}, LoggedOut: ${isLoggedOut}, Replaced: ${isReplaced}`);

      if (isLoggedOut) {
        console.log('[Baileys] Session logged out by WhatsApp.');
        if (fs.existsSync(authPath)) {
          fs.rmSync(authPath, { recursive: true, force: true });
        }
        chatsMap.clear();
        messagesMap.clear();
        tasksMap.clear();
        updateState({ status: 'DISCONNECTED', qrCodeDataUrl: null, error: 'Session logged out. Re-scan QR code.' });
        setTimeout(() => initBaileysSocket(), 1500);
      } else if (isReplaced) {
        console.warn('[Baileys] Connection replaced (440). Pausing 6s to release old stream...');
        setTimeout(() => initBaileysSocket(), 6000);
      } else {
        console.log('[Baileys] Reconnecting WebSocket in 3 seconds...');
        setTimeout(() => initBaileysSocket(), 3000);
      }
    }
  });

  // Handle Full History Sync from Phone (All Chats, Messages & Contacts!)
  sock.ev.on('messaging-history.set', async ({ chats, messages, contacts }) => {
    console.log(`[Baileys] History Sync: ${chats ? chats.length : 0} chats, ${messages ? messages.length : 0} messages, ${contacts ? contacts.length : 0} contacts.`);

    if (contacts) {
      for (const c of contacts) {
        if (!c.id || c.id === 'status@broadcast') continue;
        const existing = chatsMap.get(c.id) || {};
        const contactName = c.name || c.notify || c.verifiedName || existing.name || c.id.split('@')[0];
        chatsMap.set(c.id, {
          ...existing,
          id: c.id,
          name: contactName,
          isGroup: c.id.endsWith('@g.us'),
          isArchived: Boolean(c.archived || existing.isArchived),
          isPinned: Boolean(c.pinned || existing.isPinned),
          unreadCount: c.unreadCount || existing.unreadCount || 0,
          timestamp: c.conversationTimestamp ? Number(c.conversationTimestamp) : (existing.timestamp || 0),
          lastMessage: existing.lastMessage || null,
          profilePicUrl: null
        });
      }
    }

    if (chats) {
      for (const c of chats) {
        if (!c.id || c.id === 'status@broadcast') continue;
        const existing = chatsMap.get(c.id) || {};
        chatsMap.set(c.id, {
          ...existing,
          id: c.id,
          name: c.name || existing.name || c.id.split('@')[0],
          isGroup: c.id.endsWith('@g.us'),
          isArchived: Boolean(c.archived),
          isPinned: Boolean(c.pinned),
          unreadCount: c.unreadCount || existing.unreadCount || 0,
          timestamp: c.conversationTimestamp ? Number(c.conversationTimestamp) : (existing.timestamp || 0),
          lastMessage: existing.lastMessage || null,
          profilePicUrl: null
        });
      }
    }

    if (messages) {
      for (const msg of messages) {
        if (!msg.message || !msg.key || !msg.key.remoteJid || msg.key.remoteJid === 'status@broadcast') continue;
        const remoteJid = jidNormalizedUser(msg.key.remoteJid);
        const body =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          (msg.message.imageMessage ? '📷 Image' : '') ||
          '';

        const timestamp = Number(msg.messageTimestamp || Math.floor(Date.now() / 1000));
        const fromMe = Boolean(msg.key.fromMe);
        const msgId = msg.key.id || String(Date.now());

        const formattedMsg = {
          id: msgId,
          body,
          from: fromMe ? (sock.user ? jidNormalizedUser(sock.user.id) : '') : remoteJid,
          to: fromMe ? remoteJid : (sock.user ? jidNormalizedUser(sock.user.id) : ''),
          fromMe,
          timestamp,
          type: 'chat',
          hasMedia: Boolean(msg.message.imageMessage),
          author: msg.key.participant || null,
          chatId: remoteJid
        };

        if (!messagesMap.has(remoteJid)) {
          messagesMap.set(remoteJid, []);
        }
        const chatMsgs = messagesMap.get(remoteJid);
        if (!chatMsgs.some(m => m.id === msgId)) {
          chatMsgs.push(formattedMsg);
        }

        const chatObj = chatsMap.get(remoteJid) || {
          id: remoteJid,
          name: remoteJid.split('@')[0],
          isGroup: remoteJid.endsWith('@g.us'),
          isArchived: false,
          isPinned: false,
          unreadCount: 0,
          timestamp,
          lastMessage: { body, timestamp, fromMe },
          profilePicUrl: null
        };

        if (!chatObj.timestamp || timestamp >= chatObj.timestamp) {
          chatObj.timestamp = timestamp;
          chatObj.lastMessage = { body, timestamp, fromMe };
        }
        chatsMap.set(remoteJid, chatObj);
      }
    }

    broadcastState();
    saveStoreToDisk();
    // Automatically launch silent background historical analysis worker
    setTimeout(() => runBackgroundHistoricalAnalysis(), 2000);
  });

  // Real-time Messages Listener
  sock.ev.on('messages.upsert', async ({ messages: rawMsgs }) => {
    for (const msg of rawMsgs) {
      if (!msg.message) continue;

      const rawJid = msg.key.remoteJid;
      if (!rawJid || rawJid === 'status@broadcast') continue;
      const remoteJid = jidNormalizedUser(rawJid);

      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        (msg.message.imageMessage ? '📷 Image' : '') ||
        (msg.message.audioMessage ? '🎵 Audio' : '') ||
        (msg.message.documentMessage ? '📄 Document' : '') ||
        '';

      const timestamp = Number(msg.messageTimestamp || Math.floor(Date.now() / 1000));
      const fromMe = Boolean(msg.key.fromMe);
      const msgId = msg.key.id || String(Date.now());

      const formattedMsg = {
        id: msgId,
        body,
        from: fromMe ? (sock.user ? jidNormalizedUser(sock.user.id) : '') : remoteJid,
        to: fromMe ? remoteJid : (sock.user ? jidNormalizedUser(sock.user.id) : ''),
        fromMe,
        timestamp,
        type: msg.message.imageMessage ? 'image' : 'chat',
        hasMedia: Boolean(msg.message.imageMessage || msg.message.videoMessage || msg.message.audioMessage),
        author: msg.key.participant || null,
        chatId: remoteJid
      };

      // 🤖 Analyze message with Gemini AI
      const existingChat = chatsMap.get(remoteJid);
      const chatName = existingChat ? existingChat.name : remoteJid.split('@')[0];
      
      const aiAnalysis = await analyzeMessage(body, chatName).catch(() => null);
      if (aiAnalysis) {
        formattedMsg.aiAnalysis = aiAnalysis;

        if (aiAnalysis.hasTask) {
          const taskId = `task-${msgId}`;
          const taskObj = {
            id: taskId,
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
            createdAt: new Date().toISOString()
          };

          tasksMap.set(taskId, taskObj);
          console.log(`[Gemini AI 🎯] Extracted Actionable Task: "${taskObj.title}" (${taskObj.priority})`);

          // Broadcast NEW_TASK event via SSE
          const taskPayload = `data: ${JSON.stringify({
            eventType: 'NEW_TASK',
            task: taskObj
          })}\n\n`;
          sseClients.forEach(res => res.write(taskPayload));
        }
      }

      // Store message in messagesMap
      if (!messagesMap.has(remoteJid)) {
        messagesMap.set(remoteJid, []);
      }
      const chatMsgs = messagesMap.get(remoteJid);
      if (!chatMsgs.some(m => m.id === msgId)) {
        chatMsgs.push(formattedMsg);
        if (chatMsgs.length > 200) chatMsgs.shift();
      }

      // Update chat in chatsMap
      const updatedChat = existingChat || {
        id: remoteJid,
        name: msg.pushName || remoteJid.split('@')[0],
        isGroup: remoteJid.endsWith('@g.us'),
        isArchived: false,
        isPinned: false,
        unreadCount: 0,
        timestamp,
        profilePicUrl: null
      };

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

      chatsMap.set(remoteJid, updatedChat);
      saveStoreToDisk();

      console.log(`[Baileys SSE] 📩 New message for ${remoteJid}: "${body}"`);

      // Broadcast NEW_MESSAGE to React clients via SSE
      const ssePayload = `data: ${JSON.stringify({
        eventType: 'NEW_MESSAGE',
        message: formattedMsg,
        chat: updatedChat
      })}\n\n`;

      sseClients.forEach(res => res.write(ssePayload));
    }
  });

  // Sync Chats
  sock.ev.on('chats.upsert', (newChats) => {
    for (const c of newChats) {
      if (!c.id) continue;
      const existing = chatsMap.get(c.id) || {};
      chatsMap.set(c.id, {
        ...existing,
        id: c.id,
        name: c.name || existing.name || c.id.split('@')[0],
        isGroup: c.id.endsWith('@g.us'),
        unreadCount: c.unreadCount || existing.unreadCount || 0,
        timestamp: c.conversationTimestamp ? Number(c.conversationTimestamp) : (existing.timestamp || 0)
      });
    }
    broadcastState();
    saveStoreToDisk();
  });

  sock.ev.on('chats.set', ({ chats }) => {
    console.log(`[Baileys] Chats set received: ${chats ? chats.length : 0} chats.`);
    if (chats) {
      for (const c of chats) {
        if (!c.id || c.id === 'status@broadcast') continue;
        const existing = chatsMap.get(c.id) || {};
        chatsMap.set(c.id, {
          ...existing,
          id: c.id,
          name: c.name || existing.name || c.id.split('@')[0],
          isGroup: c.id.endsWith('@g.us'),
          unreadCount: c.unreadCount || existing.unreadCount || 0,
          timestamp: c.conversationTimestamp ? Number(c.conversationTimestamp) : (existing.timestamp || 0)
        });
      }
      broadcastState();
      saveStoreToDisk();
    }
  });

  sock.ev.on('chats.update', (updates) => {
    for (const u of updates) {
      if (!u.id) continue;
      const existing = chatsMap.get(u.id);
      if (existing) {
        chatsMap.set(u.id, {
          ...existing,
          ...u,
          name: u.name || existing.name
        });
      }
    }
    saveStoreToDisk();
  });

  // Sync Contacts
  sock.ev.on('contacts.set', ({ contacts }) => {
    console.log(`[Baileys] Contacts set received: ${contacts ? contacts.length : 0} contacts.`);
    if (contacts) {
      for (const c of contacts) {
        if (!c.id || c.id === 'status@broadcast') continue;
        const existing = chatsMap.get(c.id) || {};
        const contactName = c.name || c.notify || c.verifiedName || existing.name || c.id.split('@')[0];
        chatsMap.set(c.id, {
          ...existing,
          id: c.id,
          name: contactName,
          isGroup: c.id.endsWith('@g.us'),
          isArchived: existing.isArchived || false,
          isPinned: existing.isPinned || false,
          unreadCount: existing.unreadCount || 0,
          timestamp: existing.timestamp || Math.floor(Date.now() / 1000),
          lastMessage: existing.lastMessage || null
        });
      }
      broadcastState();
      saveStoreToDisk();
    }
  });

  sock.ev.on('contacts.upsert', (newContacts) => {
    for (const c of newContacts) {
      if (!c.id || c.id === 'status@broadcast') continue;
      const existing = chatsMap.get(c.id) || {};
      const contactName = c.name || c.notify || c.verifiedName || existing.name || c.id.split('@')[0];
      chatsMap.set(c.id, {
        ...existing,
        id: c.id,
        name: contactName,
        isGroup: c.id.endsWith('@g.us'),
        unreadCount: existing.unreadCount || 0,
        timestamp: existing.timestamp || Math.floor(Date.now() / 1000)
      });
    }
    broadcastState();
    saveStoreToDisk();
  });
}

// Routes
// 1. SSE Event Stream
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ eventType: 'STATE_UPDATE', ...clientState })}\n\n`);
  sseClients.push(res);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

// 2. GET /api/status
app.get('/api/status', (req, res) => {
  res.json(clientState);
});

// 3. GET /api/chats - Return all chats
app.get('/api/chats', (req, res) => {
  if (clientState.status !== 'READY' || !sock) {
    return res.status(400).json({ error: 'WhatsApp client is not ready.' });
  }

  const chats = Array.from(chatsMap.values());
  chats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  res.json({ chats, count: chats.length });
});

// 4. GET /api/chats/:chatId/messages - Return message history
app.get('/api/chats/:chatId/messages', (req, res) => {
  if (clientState.status !== 'READY' || !sock) {
    return res.status(400).json({ error: 'WhatsApp client is not ready.' });
  }

  let { chatId } = req.params;
  const reqUser = chatId.split('@')[0].split(':')[0];
  const matchedMessages = [];

  for (const [key, msgList] of messagesMap.entries()) {
    const keyUser = key.split('@')[0].split(':')[0];
    if (key === chatId || keyUser === reqUser) {
      matchedMessages.push(...msgList);
    }
  }

  const uniqueMap = new Map();
  matchedMessages.forEach(m => uniqueMap.set(m.id, m));
  const sortedMessages = Array.from(uniqueMap.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  res.json({ chatId, messages: sortedMessages });
});

// 5. POST /api/messages/send - Send a message to chat or phone number
app.post('/api/messages/send', async (req, res) => {
  if (clientState.status !== 'READY' || !sock) {
    return res.status(400).json({ error: 'WhatsApp client is not ready. Please connect first.' });
  }

  let { chatId, message } = req.body;
  if (!chatId || !message) {
    return res.status(400).json({ error: 'chatId and message are required.' });
  }

  const cleanDigits = chatId.replace(/[^0-9]/g, '');
  let targetJid = chatId.trim();

  if (!targetJid.includes('@')) {
    targetJid = `${cleanDigits}@s.whatsapp.net`;
  }

  try {
    console.log(`[API] Baileys sending text message to ${targetJid}...`);
    const sentMsg = await sock.sendMessage(targetJid, { text: message });

    const timestamp = Math.floor(Date.now() / 1000);
    const msgId = sentMsg?.key?.id || String(Date.now());

    // 🤖 Analyze sent message with Gemini AI
    const existingChat = chatsMap.get(targetJid);
    const chatName = existingChat ? existingChat.name : cleanDigits;
    const aiAnalysis = await analyzeMessage(message, chatName).catch(() => null);

    const formattedMsg = {
      id: msgId,
      body: message,
      fromMe: true,
      timestamp,
      chatId: targetJid,
      aiAnalysis
    };

    if (aiAnalysis && aiAnalysis.hasTask) {
      const taskId = `task-${msgId}`;
      const taskObj = {
        id: taskId,
        title: aiAnalysis.taskTitle || message,
        chatId: targetJid,
        chatName,
        originalMessage: message,
        priority: aiAnalysis.priority || 'MEDIUM',
        category: aiAnalysis.category || 'General',
        status: 'TO_DO',
        dueDate: aiAnalysis.dueDate || 'Upcoming',
        sentiment: aiAnalysis.sentiment || 'Neutral',
        summary: aiAnalysis.summary || '',
        createdAt: new Date().toISOString()
      };

      tasksMap.set(taskId, taskObj);
      console.log(`[Gemini AI 🎯] Extracted Actionable Task from sent message: "${taskObj.title}"`);

      const taskPayload = `data: ${JSON.stringify({
        eventType: 'NEW_TASK',
        task: taskObj
      })}\n\n`;
      sseClients.forEach(res => res.write(taskPayload));
    }

    // Store in messagesMap
    if (!messagesMap.has(targetJid)) {
      messagesMap.set(targetJid, []);
    }
    messagesMap.get(targetJid).push(formattedMsg);

    // Update in chatsMap
    const updatedChat = existingChat || {
      id: targetJid,
      name: cleanDigits || targetJid.split('@')[0],
      isGroup: targetJid.endsWith('@g.us'),
      isArchived: false,
      isPinned: false,
      unreadCount: 0,
      timestamp,
      profilePicUrl: null
    };

    updatedChat.timestamp = timestamp;
    updatedChat.lastMessage = {
      body: message,
      timestamp,
      fromMe: true
    };
    chatsMap.set(targetJid, updatedChat);
    saveStoreToDisk();

    res.json({
      success: true,
      chatId: targetJid,
      message: formattedMsg
    });
  } catch (err) {
    console.error(`[API] Baileys send error for ${targetJid}:`, err);
    res.status(400).json({
      error: 'Could not send message via Baileys WebSocket: ' + (err.message || String(err))
    });
  }
});

// 📋 6. GET /api/tasks - Fetch all extracted AI tasks
app.get('/api/tasks', (req, res) => {
  const tasks = Array.from(tasksMap.values());
  tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ tasks, count: tasks.length });
});

// 📋 7. POST /api/tasks - Manually create a task
app.post('/api/tasks', (req, res) => {
  const { title, chatId, chatName, priority, category, dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required.' });

  const taskId = `task-manual-${Date.now()}`;
  const newTask = {
    id: taskId,
    title,
    chatId: chatId || null,
    chatName: chatName || 'Manual Task',
    originalMessage: title,
    priority: priority || 'MEDIUM',
    category: category || 'General',
    status: 'TO_DO',
    dueDate: dueDate || 'Today',
    sentiment: 'Neutral',
    summary: title,
    createdAt: new Date().toISOString()
  };

  tasksMap.set(taskId, newTask);
  saveStoreToDisk();
  res.json({ success: true, task: newTask });
});

// 📋 8. PATCH /api/tasks/:id - Update task status
app.patch('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { status, priority } = req.body;

  const task = tasksMap.get(id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  if (status) task.status = status;
  if (priority) task.priority = priority;

  tasksMap.set(id, task);
  saveStoreToDisk();
  res.json({ success: true, task });
});

// 📋 9. DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  tasksMap.delete(id);
  saveStoreToDisk();
  res.json({ success: true, id });
});

// 🤖 10. POST /api/ai/replies - Generate 3 Gemini AI reply suggestions
app.post('/api/ai/replies', async (req, res) => {
  const { chatId } = req.body;
  const messages = messagesMap.get(chatId) || [];
  const chatObj = chatsMap.get(chatId);
  const contactName = chatObj ? chatObj.name : 'Contact';

  const replies = await generateSmartReplies(messages, contactName);
  res.json({ replies });
});

// 11. POST /api/logout - Purge auth & restart socket
app.post('/api/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout().catch(() => {});
    }

    const authPath = path.join(__dirname, 'baileys_auth_info');
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }

    chatsMap.clear();
    messagesMap.clear();
    tasksMap.clear();
    if (fs.existsSync(STORE_PATH)) {
      fs.rmSync(STORE_PATH, { force: true });
    }

    console.log('[Baileys] Auth info cleared. Restarting connection...');
    initBaileysSocket();
    res.json({ success: true, message: 'Logged out. Re-generating QR code...' });
  } catch (err) {
    console.error('[API] Logout error:', err);
    res.status(500).json({ error: 'Failed to logout: ' + err.message });
  }
});

// 12. POST /api/restart
app.post('/api/restart', (req, res) => {
  chatsMap.clear();
  messagesMap.clear();
  tasksMap.clear();
  initBaileysSocket();
  res.json({ success: true, message: 'Re-initializing Baileys WebSocket...' });
});

// 12.1 POST /api/chats/sync - Soft reconnect to trigger WhatsApp contacts/chats sync
app.post('/api/chats/sync', (req, res) => {
  console.log('[Baileys] Manual chat & contact sync requested. Re-connecting socket...');
  if (sock && sock.ws) {
    try {
      sock.ws.close();
    } catch (e) {}
  }
  setTimeout(() => initBaileysSocket(), 800);
  res.json({ success: true, message: 'Syncing chats and contacts from WhatsApp device...' });
});

// 📊 13. POST /api/ai/analyze-all - Scan and analyze all historical messages across all chats
app.post('/api/ai/analyze-all', async (req, res) => {
  try {
    console.log('[Gemini AI ⚡] Starting bulk message analysis across all chats...');
    const report = await batchAnalyzeAllMessages(chatsMap, messagesMap, tasksMap);

    const tasksArray = Array.from(tasksMap.values());
    const ssePayload = `data: ${JSON.stringify({
      eventType: 'BULK_ANALYSIS_COMPLETE',
      tasksCount: tasksArray.length,
      report
    })}\n\n`;
    sseClients.forEach(c => c.write(ssePayload));

    res.json({ success: true, report, tasks: tasksArray });
  } catch (err) {
    console.error('[API] Bulk analysis error:', err);
    res.status(500).json({ error: 'Bulk analysis failed: ' + err.message });
  }
});

// 📊 14. GET /api/ai/analytics - Get computed analytics data for dedicated report page
app.get('/api/ai/analytics', (req, res) => {
  const tasks = Array.from(tasksMap.values());
  const chats = Array.from(chatsMap.values());

  let totalMessagesCount = 0;
  for (const msgs of messagesMap.values()) {
    totalMessagesCount += msgs.length;
  }

  const highPriority = tasks.filter(t => t.priority === 'HIGH').length;
  const mediumPriority = tasks.filter(t => t.priority === 'MEDIUM').length;
  const lowPriority = tasks.filter(t => t.priority === 'LOW').length;

  const urgentCategory = tasks.filter(t => t.category === 'Urgent').length;
  const meetingCategory = tasks.filter(t => t.category === 'Meeting').length;
  const workCategory = tasks.filter(t => t.category === 'Work').length;
  const followUpCategory = tasks.filter(t => t.category === 'Follow-up').length;
  const paymentCategory = tasks.filter(t => t.category === 'Payment').length;

  const chatInsights = chats.map(c => {
    const msgs = messagesMap.get(c.id) || [];
    const chatTasks = tasks.filter(t => t.chatId === c.id);
    return {
      chatId: c.id,
      chatName: c.name,
      messagesCount: msgs.length,
      taskCount: chatTasks.length,
      lastTimestamp: c.timestamp || 0
    };
  });

  res.json({
    totalChats: chats.length,
    totalMessages: totalMessagesCount,
    totalTasks: tasks.length,
    priorityBreakdown: { high: highPriority, medium: mediumPriority, low: lowPriority },
    categoryBreakdown: {
      urgent: urgentCategory,
      meeting: meetingCategory,
      work: workCategory,
      followUp: followUpCategory,
      payment: paymentCategory
    },
    chatInsights
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Baileys + Gemini AI Server listening on http://localhost:${PORT}`);
  initBaileysSocket();
});

// Clean shutdown signal handlers
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down cleanly...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Shutting down cleanly...');
  process.exit(0);
});
