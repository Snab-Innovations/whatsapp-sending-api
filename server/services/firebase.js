const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  query,
  orderBy
} = require('firebase/firestore');

require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAvMbz8UrtU1fjx3uBndwhBziFaCVtlBG4",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "findyourself-a7369.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "findyourself-a7369",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "findyourself-a7369.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "104779229944",
  appId: process.env.FIREBASE_APP_ID || "1:104779229944:web:e01808ba5af3ddd7aba90d",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-B7QHM0FEQZ"
};

let app = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('[Firebase ➔ Firestore ⚡] Initialized Cloud Firestore DB for project: findyourself-a7369');
} catch (err) {
  console.error('[Firebase ➔ Firestore] Initialization error:', err.message);
}

/**
 * Recursively cleans an object for Firestore by replacing `undefined` with `null`
 */
function cleanForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      cleaned[key] = null;
    } else if (value !== null && typeof value === 'object') {
      cleaned[key] = cleanForFirestore(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function getSafeSessionId(sessionId) {
  return String(sessionId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Syncs / updates a task in Cloud Firestore collection
 */
async function syncTaskToFirestore(task, sessionId = 'default') {
  if (!db || !task || !task.id) return;
  try {
    const safeSession = getSafeSessionId(sessionId);
    const taskRef = doc(db, 'users', safeSession, 'tasks', String(task.id));
    const cleanedPayload = cleanForFirestore({
      ...task,
      syncedAt: new Date().toISOString()
    });
    await setDoc(taskRef, cleanedPayload, { merge: true });
    console.log(`[Firebase ➔ Firestore 💾] Synced Task "${task.id}" for session "${safeSession}".`);
  } catch (err) {
    console.error(`[Firebase ➔ Firestore] Error syncing task ${task.id}:`, err.message);
  }
}

/**
 * Deletes a task from Cloud Firestore
 */
async function deleteTaskFromFirestore(taskId, sessionId = 'default') {
  if (!db || !taskId) return;
  try {
    const safeSession = getSafeSessionId(sessionId);
    const taskRef = doc(db, 'users', safeSession, 'tasks', String(taskId));
    await deleteDoc(taskRef);
    console.log(`[Firebase ➔ Firestore 🗑️] Deleted Task "${taskId}" for session "${safeSession}".`);
  } catch (err) {
    console.error(`[Firebase ➔ Firestore] Error deleting task ${taskId}:`, err.message);
  }
}

/**
 * Syncs chat metadata to Cloud Firestore
 */
async function syncChatToFirestore(chat, sessionId = 'default') {
  if (!db || !chat || !chat.id) return;
  try {
    const safeSession = getSafeSessionId(sessionId);
    const safeId = String(chat.id).replace(/\//g, '_');
    const chatRef = doc(db, 'users', safeSession, 'chats', safeId);
    const cleanedPayload = cleanForFirestore({
      ...chat,
      syncedAt: new Date().toISOString()
    });
    await setDoc(chatRef, cleanedPayload, { merge: true });
  } catch (err) {
    console.error(`[Firebase ➔ Firestore] Error syncing chat ${chat.id}:`, err.message);
  }
}

/**
 * Syncs a WhatsApp message & its AI Verdict to Cloud Firestore
 */
async function syncMessageToFirestore(chatId, message, sessionId = 'default') {
  if (!db || !chatId || !message || !message.id) return;
  try {
    const safeSession = getSafeSessionId(sessionId);
    const safeChatId = String(chatId).replace(/\//g, '_');
    const msgRef = doc(db, 'users', safeSession, 'chats', safeChatId, 'messages', String(message.id));
    const cleanedPayload = cleanForFirestore({
      ...message,
      syncedAt: new Date().toISOString()
    });
    await setDoc(msgRef, cleanedPayload, { merge: true });
  } catch (err) {
    console.error(`[Firebase ➔ Firestore] Error syncing message ${message.id}:`, err.message);
  }
}

/**
 * Loads all stored tasks from Cloud Firestore for a given session
 */
async function loadTasksFromFirestore(sessionId = 'default') {
  if (!db) return [];
  try {
    const safeSession = getSafeSessionId(sessionId);
    const tasksRef = collection(db, 'users', safeSession, 'tasks');
    const snapshot = await getDocs(tasksRef);
    const tasks = [];
    snapshot.forEach(docSnap => {
      tasks.push(docSnap.data());
    });
    return tasks;
  } catch (err) {
    console.error('[Firebase ➔ Firestore] Error loading tasks from Firestore:', err.message);
    return [];
  }
}

/**
 * Loads all stored chats from Cloud Firestore for a given session
 */
async function loadChatsFromFirestore(sessionId = 'default') {
  if (!db) return [];
  try {
    const safeSession = getSafeSessionId(sessionId);
    const chatsRef = collection(db, 'users', safeSession, 'chats');
    const snapshot = await getDocs(chatsRef);
    const chats = [];
    snapshot.forEach(docSnap => {
      chats.push(docSnap.data());
    });
    return chats;
  } catch (err) {
    console.error('[Firebase ➔ Firestore] Error loading chats from Firestore:', err.message);
    return [];
  }
}

/**
 * Syncs session credentials (sessionId & passcode) to Cloud Firestore
 */
async function syncSessionMetaToFirestore(sessionId, passcode, clientState = {}) {
  if (!db || !sessionId) return;
  try {
    const safeSession = getSafeSessionId(sessionId);
    const metaRef = doc(db, 'sessions', safeSession);
    const cleanedPayload = cleanForFirestore({
      sessionId: safeSession,
      passcode: passcode ? String(passcode).trim() : null,
      status: clientState.status || 'INITIALIZING',
      userInfo: clientState.userInfo || null,
      updatedAt: new Date().toISOString()
    });
    await setDoc(metaRef, cleanedPayload, { merge: true });
    console.log(`[Firebase ➔ Firestore 🔑] Synced Session Passcode & Meta for "${safeSession}".`);
  } catch (err) {
    console.error(`[Firebase ➔ Firestore] Error syncing session meta ${sessionId}:`, err.message);
  }
}

/**
 * Loads session credentials & passcode from Cloud Firestore
 */
async function loadSessionMetaFromFirestore(sessionId) {
  if (!db || !sessionId) return null;
  try {
    const safeSession = getSafeSessionId(sessionId);
    const metaRef = doc(db, 'sessions', safeSession);
    const snapshot = await getDoc(metaRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (err) {
    console.error(`[Firebase ➔ Firestore] Error loading session meta for ${sessionId}:`, err.message);
    return null;
  }
}

/**
 * Loads stored message history for a chat thread from Cloud Firestore
 */
async function loadMessagesFromFirestore(sessionId = 'default', chatId) {
  if (!db || !chatId) return [];
  try {
    const safeSession = getSafeSessionId(sessionId);
    const safeChatId = String(chatId).replace(/\//g, '_');
    const msgsRef = collection(db, 'users', safeSession, 'chats', safeChatId, 'messages');
    const snapshot = await getDocs(msgsRef);
    const messages = [];
    snapshot.forEach(docSnap => {
      messages.push(docSnap.data());
    });
    return messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  } catch (err) {
    console.error('[Firebase ➔ Firestore] Error loading messages from Firestore:', err.message);
    return [];
  }
}

module.exports = {
  db,
  cleanForFirestore,
  syncTaskToFirestore,
  deleteTaskFromFirestore,
  syncChatToFirestore,
  syncMessageToFirestore,
  loadTasksFromFirestore,
  loadChatsFromFirestore,
  loadMessagesFromFirestore,
  syncSessionMetaToFirestore,
  loadSessionMetaFromFirestore
};
