import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

import { getAnalytics, isSupported } from "firebase/analytics";

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Analytics - only initialize on client and if supported
let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then(yes => {
    if (yes) analytics = getAnalytics(app);
  });
}

// Enable persistence
if (typeof window !== "undefined") {
  // Auth Persistence
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Auth persistence error:", err);
  });

  // Firestore Persistence
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed: Multiple tabs open");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence failed: Browser not supported");
    }
  });
}

export { app, auth, db, analytics, googleProvider };
