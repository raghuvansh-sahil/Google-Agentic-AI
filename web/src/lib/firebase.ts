// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDEYWIDhrJIJeWd49A_cgxX6WS2Nqri9Gg",
  authDomain: "walletwise-ai-ejjg8-58a73.firebaseapp.com",
  projectId: "walletwise-ai-ejjg8-58a73",
  storageBucket: "walletwise-ai-ejjg8-58a73.appspot.com",
  messagingSenderId: "623177841771",
  appId: "1:623177841771:web:3ad486550c3b0a9070852e",
  measurementId: "G-FCCQNZWMS1"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };