// src/firebaseConfig.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from 'firebase/analytics'; // Optional

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkvHZgkrNlneFjv_Dj0Jqw3ZAyVBWiZ3k",
  authDomain: "flatfacts-a2cba.firebaseapp.com",
  projectId: "flatfacts-a2cba",
  storageBucket: "flatfacts-a2cba.firebasestorage.app", // <-- FIXED
  messagingSenderId: "671980222661",
  appId: "1:671980222661:web:3991a63651d849111098ac",
  measurementId: "G-HS21JZPZWR"
};

// Prevent re-initialization in hot-reload environments
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
// export const analytics = typeof window !== "undefined" ? getAnalytics(app) : undefined; // Optional 