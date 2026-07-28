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
  apiKey: "AIzaSyAvMbz8UrtU1fjx3uBndwhBziFaCVtlBG4",
  authDomain: "findyourself-a7369.firebaseapp.com",
  projectId: "findyourself-a7369",
  storageBucket: "findyourself-a7369.firebasestorage.app",
  messagingSenderId: "104779229944",
  appId: "1:104779229944:web:e01808ba5af3ddd7aba90d",
  measurementId: "G-B7QHM0FEQZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
