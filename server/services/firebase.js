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

const firebaseConfig = {
  apiKey: "AIzaSyAvMbz8UrtU1fjx3uBndwhBziFaCVtlBG4",
  authDomain: "findyourself-a7369.firebaseapp.com",
  projectId: "findyourself-a7369",
  storageBucket: "findyourself-a7369.firebasestorage.app",
  messagingSenderId: "104779229944",
  appId: "1:104779229944:web:e01808ba5af3ddd7aba90d",
  measurementId: "G-B7QHM0FEQZ"
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
 * Syncs / updates a task in Cloud Firestore collection "tasks"
 */
async function syncTaskToFirestore(task) {
  if (!db || !task || !task.id) return;
  try {
    const taskRef = doc(db, 'tasks', String(task.id));
    await setDoc(taskRef, {
      ...task,
      syncedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`[Firebase ➔ Firestore 💾] Synced Task "${task.id}" to Cloud Firestore.`);
  } catch (err) {
    console.error(`[Firebase ➔ Firestore] Error syncing task ${task.id}:`, err.message);
  }
}

/**
 * Deletes a task from Cloud Firestore
 */
async function deleteTaskFromFirestore(taskId) {
  if (!db || !taskId) return;
  try {
    const taskRef = doc(db, 'tasks', String(taskId));
    await deleteDoc(taskRef);
    console.log(`[Firebase ➔ Firestore 🗑️] Deleted Task "${taskId}" from Cloud Firestore.`);
  } catch (err) {
    console.error(`[Firebase ➔ Firestore] Error deleting task ${taskId}:`, err.message);
  }
}

/**
 * Syncs chat metadata to Cloud Firestore collection "chats"
 */
async function syncChatToFirestore(chat) {
  if (!db || !chat || !chat.id) return;
  try {
    const safeId = String(chat.id).replace(/\//g, '_');
    const chatRef = doc(db, 'chats', safeId);
    await setDoc(chatRef, {
      ...chat,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error(`[Firebase ➔ Firestore] Error syncing chat ${chat.id}:`, err.message);
  }
}

/**
 * Syncs a WhatsApp message & its AI Verdict to Cloud Firestore
 */
async function syncMessageToFirestore(chatId, message) {
  if (!db || !chatId || !message || !message.id) return;
  try {
    const safeChatId = String(chatId).replace(/\//g, '_');
    const msgRef = doc(db, 'chats', safeChatId, 'messages', String(message.id));
    await setDoc(msgRef, {
      ...message,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error(`[Firebase ➔ Firestore] Error syncing message ${message.id}:`, err.message);
  }
}

/**
 * Loads all stored tasks from Cloud Firestore on server startup
 */
async function loadTasksFromFirestore() {
  if (!db) return [];
  try {
    const tasksRef = collection(db, 'tasks');
    const snapshot = await getDocs(tasksRef);
    const tasks = [];
    snapshot.forEach(docSnap => {
      tasks.push(docSnap.data());
    });
    console.log(`[Firebase ➔ Firestore 📥] Loaded ${tasks.length} tasks from Cloud Firestore.`);
    return tasks;
  } catch (err) {
    console.error('[Firebase ➔ Firestore] Error loading tasks from Firestore:', err.message);
    return [];
  }
}

/**
 * Loads all stored chats from Cloud Firestore on server startup
 */
async function loadChatsFromFirestore() {
  if (!db) return [];
  try {
    const chatsRef = collection(db, 'chats');
    const snapshot = await getDocs(chatsRef);
    const chats = [];
    snapshot.forEach(docSnap => {
      chats.push(docSnap.data());
    });
    console.log(`[Firebase ➔ Firestore 📥] Loaded ${chats.length} chats from Cloud Firestore.`);
    return chats;
  } catch (err) {
    console.error('[Firebase ➔ Firestore] Error loading chats from Firestore:', err.message);
    return [];
  }
}

module.exports = {
  db,
  syncTaskToFirestore,
  deleteTaskFromFirestore,
  syncChatToFirestore,
  syncMessageToFirestore,
  loadTasksFromFirestore,
  loadChatsFromFirestore
};
