const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc
} = require('firebase/firestore');

require('dotenv').config();

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || (FIREBASE_PROJECT_ID ? `${FIREBASE_PROJECT_ID}.firebaseapp.com` : ""),
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || (FIREBASE_PROJECT_ID ? `${FIREBASE_PROJECT_ID}.firebasestorage.app` : ""),
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || ""
};

let app = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log(`[Firebase ➔ Firestore ⚡] Initialized Cloud Firestore DB for project: ${FIREBASE_PROJECT_ID}`);
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
 * Syncs session credentials (sessionId & passcode) and status to Cloud Firestore
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
    console.log(`[Firebase ➔ Firestore 🔑] Synced Session Passcode & Meta for "${safeSession}" to project ${FIREBASE_PROJECT_ID}.`);
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
 * Deletes session metadata document from Cloud Firestore when session is renamed or deleted
 */
async function deleteSessionMetaFromFirestore(sessionId) {
  if (!db || !sessionId) return;
  try {
    const safeSession = getSafeSessionId(sessionId);
    const metaRef = doc(db, 'sessions', safeSession);
    await deleteDoc(metaRef);
    console.log(`[Firebase ➔ Firestore 🗑️] Deleted old Session metadata document for "${safeSession}".`);
  } catch (err) {
    console.error(`[Firebase ➔ Firestore] Error deleting session meta ${sessionId}:`, err.message);
  }
}

module.exports = {
  db,
  cleanForFirestore,
  syncSessionMetaToFirestore,
  loadSessionMetaFromFirestore,
  deleteSessionMetaFromFirestore
};
