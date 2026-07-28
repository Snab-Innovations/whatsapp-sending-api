import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDLkvxN8tJwQeXx92pKOanznE-gmtcDsf4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "whatsapp-manager-51344.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "whatsapp-manager-51344",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "whatsapp-manager-51344.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1032170059077",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1032170059077:web:41ef65550d83ce6eaffa2c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YMED0S4RQQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
