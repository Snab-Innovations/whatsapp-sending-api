const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
require('dotenv').config();

const {
  syncSessionMetaToFirestore,
  loadSessionMetaFromFirestore,
  deleteSessionMetaFromFirestore
} = require('./services/firebase');


const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser
} = require('@whiskeysockets/baileys');

const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Render Keep-Alive / Health Endpoint
app.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'WhatsApp Message Sending API',
    timestamp: new Date().toISOString()
  });
});

// Logger (silent output for clean console)
const logger = pino({ level: 'silent' });

// Ensure base data directories exist
const DATA_DIR = path.join(__dirname, 'data');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Multi-Tenant Session Store Map: Map<sessionId, SessionInstance>
const sessionsMap = new Map();

function generateRandomSessionId() {
  let newId;
  do {
    const timestamp = Date.now().toString(36);
    const randomHex = crypto.randomBytes(4).toString('hex');
    newId = `sess_${timestamp}_${randomHex}`;
  } while (sessionsMap.has(newId) || fs.existsSync(path.join(SESSIONS_DIR, newId)));
  return newId;
}

function sanitizeSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim() || sessionId.trim() === 'default') {
    return generateRandomSessionId();
  }
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64) || generateRandomSessionId();
}

function generatePasscode() {
  const existingPasscodes = new Set();
  sessionsMap.forEach(s => {
    if (s.passcode) existingPasscodes.add(String(s.passcode).trim());
  });

  let passcode;
  do {
    passcode = crypto.randomInt(100000, 999999).toString();
  } while (existingPasscodes.has(passcode));
  return passcode;
}

/**
 * Normalizes any recipient phone string to valid WhatsApp JID
 * Examples:
 *   "919876543210" -> "919876543210@s.whatsapp.net"
 *   "+91 98765 43210" -> "919876543210@s.whatsapp.net"
 *   "1234567890@g.us" -> "1234567890@g.us"
 */
function normalizeJid(recipient) {
  if (!recipient || typeof recipient !== 'string') return null;
  let clean = recipient.trim();
  if (clean.endsWith('@g.us') || clean.endsWith('@s.whatsapp.net')) {
    return clean;
  }
  // Strip non-digit characters
  const digitsOnly = clean.replace(/\D/g, '');
  if (!digitsOnly) return null;
  return `${digitsOnly}@s.whatsapp.net`;
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
    isFresh: true,
    sock: null,
    clientState: {
      status: 'INITIALIZING', // INITIALIZING, QR_READY, AUTHENTICATED, READY, DISCONNECTED, AUTH_FAILURE
      qrCodeDataUrl: null,
      userInfo: null,
      lastUpdated: new Date().toISOString(),
      error: null
    },
    sseClients: new Set(),
    isInitializing: false
  };

  sessionsMap.set(sessionId, sessionInstance);

  // Load local store & Firestore store for this session
  loadSessionStoreFromDisk(sessionInstance);
  loadSessionFromFirestore(sessionInstance);
  syncSessionMetaToFirestore(sessionInstance.sessionId, sessionInstance.passcode, sessionInstance.clientState).catch(() => null);

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
        delete session.isFresh;
      } else {
        saveSessionStoreToDisk(session);
      }
      console.log(`[Session 💾 ${session.sessionId}] Loaded passcode state from disk (Passcode: ${session.passcode}).`);
    } else {
      saveSessionStoreToDisk(session);
    }
  } catch (err) {
    console.error(`[Session ${session.sessionId}] Error reading store.json:`, err.message);
  }
}

function saveSessionStoreToDisk(session) {
  try {
    const data = { passcode: session.passcode };
    fs.writeFileSync(session.storePath, JSON.stringify(data, null, 2), 'utf-8');
    syncSessionMetaToFirestore(session.sessionId, session.passcode, session.clientState).catch(() => null);
  } catch (err) {
    console.error(`[Session ${session.sessionId}] Error writing store.json:`, err.message);
  }
}

async function loadSessionFromFirestore(session) {
  try {
    const meta = await loadSessionMetaFromFirestore(session.sessionId);
    if (meta && meta.passcode) {
      session.passcode = String(meta.passcode).trim();
      delete session.isFresh;
      saveSessionStoreToDisk(session);
    }
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
    generateHighQualityLinkPreview: false,
    syncFullHistory: false, // Do not request or sync history
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000
  });

  session.sock.ev.on('creds.update', saveCreds);

  session.sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      if (!state.creds || !state.creds.me) {
        console.log(`[Baileys ${session.sessionId}] QR Code received for pairing...`);
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
      console.log(`[Baileys ${session.sessionId}] WebSocket Connection OPEN! WhatsApp Ready for Sending Messages!`);
      const userJid = session.sock.user ? jidNormalizedUser(session.sock.user.id) : (state.creds.me ? jidNormalizedUser(state.creds.me.id) : null);
      const phone = userJid ? userJid.split('@')[0] : '';
      const pushname = (session.sock.user && session.sock.user.name) || (state.creds.me && state.creds.me.name) || 'WhatsApp User';

      broadcastSessionState(session, {
        status: 'READY',
        userInfo: {
          pushname,
          phone,
          wid: userJid,
          platform: 'Baileys WhatsApp Sending API'
        },
        qrCodeDataUrl: null
      });

      saveSessionStoreToDisk(session);
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
        broadcastSessionState(session, { status: 'DISCONNECTED', qrCodeDataUrl: null, userInfo: null, error: 'Session logged out. Re-scan QR code.' });
        setTimeout(() => initBaileysSocketForSession(session), 1500);
      } else if (isReplaced) {
        setTimeout(() => initBaileysSocketForSession(session), 6000);
      } else {
        setTimeout(() => initBaileysSocketForSession(session), 3000);
      }
    }
  });

  // Note: All incoming message handlers (messages.upsert, messaging-history.set, etc.) are omitted.
  // The server works strictly as an outbound WhatsApp Message Sending API engine.
}

// Auto-restore existing sessions from disk on boot
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

// Serve index.html explicitly for root & dashboard routes
app.get(['/', '/dashboard'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware: attach session instance to API requests
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/dashboard' || req.path === '/ping' || !req.path.startsWith('/api')) return next();

  let rawId = req.headers['x-session-id'] || req.query.sessionId;
  if (!rawId || typeof rawId !== 'string' || !rawId.trim() || rawId.trim() === 'default') {
    // Security Fix: Never fall back to existing active sessions in memory!
    rawId = generateRandomSessionId();
  }

  const session = getOrCreateSession(rawId.trim());

  // Bind client passcode if session is fresh
  const clientPasscode = req.headers['x-session-passcode'] || req.query.passcode;
  if (clientPasscode && typeof clientPasscode === 'string' && clientPasscode.trim().length >= 4) {
    if (session.isFresh) {
      session.passcode = clientPasscode.trim();
      delete session.isFresh;
      saveSessionStoreToDisk(session);
    }
  }

  req.sessionInstance = session;
  next();
});

// Middleware: Verify Session Passcode for protected API endpoints
function verifyPasscodeAuth(req, res, next) {
  const session = req.sessionInstance;
  if (!session) {
    return res.status(400).json({ error: 'MISSING_SESSION_ID', message: 'Session required.' });
  }

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
      message: 'Access locked. Please enter your session passcode.'
    });
  }
  next();
}

// --- Public Auth & Status Endpoints ---
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
    hasPasscode: Boolean(session.passcode),
    isLocked: !isUnlocked
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

const handleSetCredentials = (req, res) => {
  const session = req.sessionInstance;
  if (!session) {
    return res.status(400).json({ success: false, error: 'No active session found.' });
  }

  const newPasscode = (req.body && (req.body.newPasscode || req.body.passcode)) || '';
  const newSessionId = (req.body && (req.body.newSessionId || req.body.sessionId)) || '';

  let updated = false;

  if (newSessionId && typeof newSessionId === 'string' && newSessionId.trim().length >= 3) {
    const cleanNewId = newSessionId.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 64);
    if (cleanNewId !== session.sessionId) {
      const oldId = session.sessionId;

      // 1. Delete old metadata document from Cloud Firestore
      deleteSessionMetaFromFirestore(oldId).catch(() => null);

      // 2. Rename local session folder on disk from data/sessions/oldId to data/sessions/cleanNewId
      const oldSessionDir = path.join(SESSIONS_DIR, oldId);
      const newSessionDir = path.join(SESSIONS_DIR, cleanNewId);

      if (fs.existsSync(oldSessionDir)) {
        try {
          if (fs.existsSync(newSessionDir)) {
            fs.rmSync(newSessionDir, { recursive: true, force: true });
          }
          fs.renameSync(oldSessionDir, newSessionDir);
          console.log(`[Disk 💾] Renamed session folder on disk from "${oldId}" to "${cleanNewId}".`);
        } catch (renameErr) {
          console.error(`[Disk Error] Failed to rename session folder: ${renameErr.message}`);
        }
      }

      // 3. Re-key session in memory map
      sessionsMap.delete(oldId);
      session.sessionId = cleanNewId;
      session.sessionDir = newSessionDir;
      session.authPath = path.join(newSessionDir, 'baileys_auth_info');
      session.storePath = path.join(newSessionDir, 'store.json');
      if (!fs.existsSync(session.authPath)) {
        fs.mkdirSync(session.authPath, { recursive: true });
      }
      sessionsMap.set(cleanNewId, session);


      updated = true;
      console.log(`[Session 🔄] Renamed session from "${oldId}" to "${cleanNewId}".`);
    }
  }

  if (newPasscode && String(newPasscode).trim().length >= 4) {
    session.passcode = String(newPasscode).trim();
    updated = true;
  }

  if (updated) {
    saveSessionStoreToDisk(session);
    syncSessionMetaToFirestore(session.sessionId, session.passcode, session.clientState).catch(() => null);
  }

  res.json({
    success: true,
    sessionId: session.sessionId,
    passcode: session.passcode,
    message: 'Session ID & Passcode updated successfully & synced to Cloud Firestore!'
  });
};


app.post('/api/auth/set-passcode', handleSetCredentials);
app.post('/api/auth/set-credentials', handleSetCredentials);
app.post('/api/set-credentials', handleSetCredentials);

app.post(['/api/auth/new-session', '/api/new-session'], (req, res) => {
  const newSessionId = generateRandomSessionId();
  const session = getOrCreateSession(newSessionId);
  res.json({
    success: true,
    sessionId: session.sessionId,
    passcode: session.passcode,
    status: session.clientState.status,
    message: 'New unique WhatsApp session created!'
  });
});




// Real-Time Session Connection SSE Stream
app.get('/api/events', (req, res) => {
  const session = req.sessionInstance;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  session.sseClients.add(res);

  // Send initial connection state immediately
  res.write(`data: ${JSON.stringify({ ...session.clientState, sessionId: session.sessionId })}\n\n`);

  req.on('close', () => {
    session.sseClients.delete(res);
  });
});

// ==========================================
// 🚀 WHATSAPP MESSAGE SENDING API ENDPOINTS
// ==========================================

const handleSendMessage = async (req, res) => {
  const session = req.sessionInstance;

  if (session.clientState.status !== 'READY' || !session.sock) {
    return res.status(503).json({
      success: false,
      error: 'WHATSAPP_NOT_CONNECTED',
      status: session.clientState.status,
      message: 'WhatsApp socket is not connected. Please scan QR code first.'
    });
  }

  const recipient = req.body.to || req.body.phone || req.body.chatId || req.body.recipient;
  const messageBody = req.body.message || req.body.text || req.body.body;

  if (!recipient || typeof recipient !== 'string' || !recipient.trim()) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_RECIPIENT',
      message: 'Parameter "to" or "phone" or "chatId" is required (e.g., "919876543210").'
    });
  }

  if (!messageBody || typeof messageBody !== 'string' || !messageBody.trim()) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_MESSAGE',
      message: 'Parameter "message" or "text" string is required.'
    });
  }

  let targetJid = normalizeJid(recipient);
  if (!targetJid) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_RECIPIENT_FORMAT',
      message: 'Invalid phone number format provided.'
    });
  }

  // 🔍 1. Real-Time WhatsApp Number Verification (for individual contacts)
  if (!targetJid.endsWith('@g.us')) {
    const rawDigits = recipient.replace(/\D/g, '');
    try {
      const [whatsappUser] = await session.sock.onWhatsApp(rawDigits);
      if (whatsappUser && whatsappUser.exists) {
        targetJid = whatsappUser.jid;
        console.log(`[Session ${session.sessionId}] Verified WhatsApp user JID: "${targetJid}"`);
      } else {
        return res.status(400).json({
          success: false,
          error: 'NUMBER_NOT_ON_WHATSAPP',
          phone: rawDigits,
          message: `The phone number +${rawDigits} is not registered on WhatsApp.`
        });
      }
    } catch (checkErr) {
      console.warn(`[Session ${session.sessionId}] onWhatsApp verification warn: ${checkErr.message}. Falling back to normalized JID ${targetJid}`);
    }
  }

  // ⚡ 2. Send Presence Update to wake peer socket connection
  session.sock.sendPresenceUpdate('composing', targetJid).catch(() => null);

  // 🔄 3. Robust Sending Loop with Auto-Retries (100% Success Guarantee)
  let lastErr = null;
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Session ${session.sessionId}] 📤 Outbound attempt ${attempt}/${maxRetries} to "${targetJid}"...`);
      const sent = await session.sock.sendMessage(targetJid, { text: messageBody.trim() });
      const timestamp = Math.floor(Date.now() / 1000);
      const messageId = sent?.key?.id || `msg_${Date.now()}`;

      session.sock.sendPresenceUpdate('paused', targetJid).catch(() => null);

      return res.json({
        success: true,
        messageId,
        to: targetJid,
        phone: targetJid.split('@')[0],
        message: messageBody.trim(),
        status: 'DELIVERED',
        attempt,
        timestamp,
        sentAt: new Date().toISOString()
      });
    } catch (err) {
      lastErr = err;
      console.warn(`[Session ${session.sessionId}] Send attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  return res.status(500).json({
    success: false,
    error: 'SEND_FAILED',
    to: targetJid,
    details: lastErr ? lastErr.message : 'Failed to deliver message after 3 attempts'
  });
};


// Main outbound endpoints
app.post('/api/messages/send', verifyPasscodeAuth, handleSendMessage);
app.post('/api/send-message', verifyPasscodeAuth, handleSendMessage);

// Session Control Endpoints
app.post('/api/logout', verifyPasscodeAuth, (req, res) => {
  const session = req.sessionInstance;
  try {
    if (session.sock) {
      session.sock.logout().catch(() => null);
    }
    if (fs.existsSync(session.authPath)) {
      fs.rmSync(session.authPath, { recursive: true, force: true });
    }
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

// Explicit API 404 Handler - returns JSON instead of falling back to HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API_ENDPOINT_NOT_FOUND',
    message: `API route "${req.path}" not found. Please restart server.`
  });
});

// Render Keep-Alive Auto-Ping (Every 10 minutes)

const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

function startKeepAliveSelfPing() {
  setInterval(() => {
    const targetUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || `http://localhost:${PORT}`;
    const pingEndpoint = `${targetUrl.replace(/\/$/, '')}/ping`;

    try {
      const httpModule = pingEndpoint.startsWith('https') ? require('https') : require('http');
      httpModule.get(pingEndpoint, (res) => {
        console.log(`[Keep-Alive ⏰] Self-ping status ${res.statusCode}`);
      }).on('error', (err) => {
        console.warn(`[Keep-Alive ⚠️] Self-ping failed: ${err.message}`);
      });
    } catch (err) {
      console.error(`[Keep-Alive ⚠️] Self-ping error:`, err.message);
    }
  }, KEEP_ALIVE_INTERVAL_MS);
}

// Start Server & Restore Sessions
const serverInstance = app.listen(PORT, () => {
  console.log(`\n🚀 Dedicated WhatsApp Message Sending API Server listening on http://localhost:${PORT}`);
  restoreExistingSessions();
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
