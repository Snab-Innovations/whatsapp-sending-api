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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAvMbz8UrtU1fjx3uBndwhBziFaCVtlBG4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "findyourself-a7369.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "findyourself-a7369",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "findyourself-a7369.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "104779229944",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:104779229944:web:e01808ba5af3ddd7aba90d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-B7QHM0FEQZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
