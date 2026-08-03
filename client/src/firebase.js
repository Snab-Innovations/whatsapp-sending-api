import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyChelYaSt260BW_vl-8n-p60b-l8Rr51cA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "whatsapp-api-snab.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "whatsapp-api-snab",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "whatsapp-api-snab.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "769746608880",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:769746608880:web:a801f6888b83198f749835",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-P1KRJCNTCG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
