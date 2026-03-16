import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator
} from "firebase/auth";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isMessagingSupported
} from "firebase/messaging";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";

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

import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
const storage = getStorage(app);
const functions = getFunctions(app);

// Messaging - only initialize on client
let messaging: any = null;
if (typeof window !== "undefined") {
  isMessagingSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

// Connect to Emulators if explicitly enabled via env var
const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === "true";

if (USE_EMULATOR) {
  try {
    // Determine the host: 127.0.0.1 for server-side, current hostname for client-side (incl. mobile)
    const host = typeof window !== "undefined"
      ? (window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname)
      : "127.0.0.1";
    // Safety check to prevent duplicate connections (important for hot reload)
    const isAuthEmulatorConnected = (auth as any)._emulatorConfig;

    if (!isAuthEmulatorConnected) {
      // Connect all services
      connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
      connectFirestoreEmulator(db, host, 8080);
      connectStorageEmulator(storage, host, 9199);
      connectFunctionsEmulator(functions, host, 5001);

      console.log(`🔥 [Firebase] FORCE CONNECTED to emulators on ${host}`);
    }
  } catch (e) {
    console.warn("⚠️ Firebase Emulator connection warning:", e);
  }
} else {
  if (typeof window !== "undefined") {
    console.log("🌍 [Firebase] Operating in LIVE mode");
  }
}

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

}

export { app, auth, db, storage, functions, analytics, googleProvider, messaging, getToken, onMessage };
