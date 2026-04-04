"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  deleteUser,
  signInWithPopup
} from "firebase/auth";
import {
  doc, getDoc, setDoc, serverTimestamp, onSnapshot,
  collection, query, where, getDocs, writeBatch, deleteDoc
} from "firebase/firestore";
import { auth, db, googleProvider, messaging, getToken, onMessage } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

interface UserProfile {
  name: string;
  fullName?: string; // Descriptive alias for name used in UI
  photoURL: string;
  karmaTotal: number;
  karmaWeekly: number;
  karmaByCategory: Record<string, number>;
  ward: string;
  localBody: string;
  village: string;
  district: string;
  state: string;
  onboarded: boolean;
  onboardingStep?: number;
  badges?: string[];
  isVerified?: boolean;
  professionalRole?: string;
  ageGroup?: string;
  identityBonusReceived?: boolean;
  createdAt: any;
  uid?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithOTP: (phoneNumber: string, name?: string) => Promise<ConfirmationResult>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectChecked, setRedirectChecked] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const [pendingName, setPendingName] = useState<string | null>(null);

  // 0. Handle Google Redirect Result (runs once on app load)
  // Effect 0 — add .finally() to set the gate
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        console.log("✅ Redirect result:", result); // Will show null or a user

        if (!result?.user) return;

        const user = result.user;
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: user.displayName || "Anonymous",
            photoURL: user.photoURL || "",
            karmaTotal: 0,
            karmaWeekly: 0,
            karmaByCategory: {},
            ward: "",
            localBody: "",
            village: "",
            district: "",
            state: "Kerala",
            onboarded: false,
            onboardingStep: 0,
            badges: [],
            createdAt: serverTimestamp(),
          });
        } else {
          const data = userDoc.data() as any;
          const updates: any = {};
          if ((!data.name || data.name === "Anonymous") && user.displayName)
            updates.name = user.displayName;
          if (!data.photoURL && user.photoURL)
            updates.photoURL = user.photoURL;
          if (Object.keys(updates).length > 0)
            await setDoc(userDocRef, updates, { merge: true });
        }
      })
      .catch((error) => {
        console.error("❌ Redirect Result Error:", error);
      })
      .finally(() => {
        setRedirectChecked(true); // ← Gate is now open regardless of outcome
      });
  }, []);

  // 1. Auth Listener (Runs ONCE on mount)
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    // Safety Fallback: If auth state doesn't resolve in 4 seconds, clear loading
    // This prevents the PWA from being stuck on the skeleton screen forever.
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        console.warn("🚿 Auth Fallback: Session resolution took too long. Clearing loading state.");
        setLoading(false);
      }
    }, 4000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      clearTimeout(fallbackTimer);
      console.log("🔐 Auth State Changed:", user ? "User found" : "No user");

      // Always cleanup previous profile listener before setting a new one
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (user) {
        setUser(user);

        const userDocRef = doc(db, "users", user.uid);

        // 1.1 Profile Listener (Real-time sync)
        unsubscribeProfile = onSnapshot(userDocRef, (snapshot: any) => {
          const exists = snapshot.exists();
          const fromCache = snapshot.metadata.fromCache;

          if (exists) {
            const data = snapshot.data();
            setProfile({ 
              ...data as UserProfile, 
              uid: user.uid,
              fullName: data.name // Provide fullName alias for UI consistency
            });
            setLoading(false); // Definitely found a profile
          } else {
            // If it's from cache and empty, maybe it's just not fetched yet.
            // We only trigger 'skeleton' mode if it's verified by the server that it's MISSING,
            // or if we already have some user data from elsewhere.
            if (!fromCache) {
              console.warn("⚠️ Profile missing on server. Providing skeleton profile.");
              setProfile({
                uid: user.uid,
                name: user.displayName || pendingName || "Anonymous",
                photoURL: user.photoURL || "",
                karmaTotal: 0,
                karmaWeekly: 0,
                karmaByCategory: {},
                ward: "",
                localBody: "",
                village: "",
                district: "",
                state: "Kerala",
                onboarded: false,
                createdAt: null,
              });
              setLoading(false);
            } else {
              console.log("⏳ Snapshot empty but from cache; waiting for server confirmation...");
              // We DON'T set Loading to false here yet, to avoid the 'QuickSetup' flicker
            }
          }
        }, (error: any) => {
          if (error.code !== 'cancelled') {
            console.error("👤 Profile Snapshot Error:", error);
            setLoading(false);
          }
        });

        // 1.2 Background Doc Creation (Ensures doc exists)
        getDoc(userDocRef).then(async (userDoc) => {
          if (!userDoc.exists()) {
            console.log("🛠️ Healing: Creating missing user document for:", user.uid);
            await setDoc(userDocRef, {
              uid: user.uid,
              name: user.displayName || pendingName || "Anonymous",
              photoURL: user.photoURL || "",
              karmaTotal: 0,
              karmaWeekly: 0,
              ward: "",
              localBody: "",
              village: "",
              district: "",
              state: "Kerala",
              identityBonusReceived: false,
              onboarded: false,
              createdAt: serverTimestamp(),
            });
          } else {
            // SYNCING: If name/photo are missing or generic, update from Google
            const data = userDoc.data() as any;
            const updates: any = {};
            if (!data.uid) updates.uid = user.uid;

            // Only sync name if it's currently missing or "Anonymous"
            if ((!data.name || data.name === "Anonymous") && user.displayName) {
              console.log("🔄 Syncing name from Auth provider:", user.displayName);
              updates.name = user.displayName;
            }

            // Sync photoURL if currently missing
            if (!data.photoURL && user.photoURL) {
              console.log("🔄 Syncing photoURL from Auth provider");
              updates.photoURL = user.photoURL;
            }

            if (Object.keys(updates).length > 0) {
              await setDoc(userDocRef, updates, { merge: true });
            }
          }
        }).catch(err => {
          if (err.name !== 'AbortError' && err.code !== 'cancelled') {
            console.error("🛠️ Background Profile Setup Error:", err);
          }
        });
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []); // Empty dependency array = Runs once

  // 2. Navigation & Redirect Logic (Optional Authentication for Landing)
  useEffect(() => {
    if (loading || !redirectChecked) return;

    // These pages ALWAYS require a user.
    const protectedPaths = ["/profile", "/leaderboard", "/settings"];
    const isProtectedPath = protectedPaths.some(p => pathname.startsWith(p));
    
    // The Login page has special handling (forward to feed if already logged in)
    const isLoginPage = pathname === "/login";

    if (user) {
      if (isLoginPage) {
        router.replace("/");
      }
    } else {
      if (isProtectedPath) {
        // Only if trying to access profile, leaderboard, etc.
        router.replace("/login");
      }
    }
  }, [user, loading, pathname, router, redirectChecked]);

  // 3. FCM Token Registration
  useEffect(() => {
    if (!user || !messaging) return;

    const registerFCM = async () => {
      try {
        // Only request on user gesture or after initial load
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (!vapidKey) {
            console.warn("⚠️ FCM: Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY in environment.");
            return;
          }

          const token = await getToken(messaging, { vapidKey });
          if (token) {
            console.log("📲 FCM Token Generated:", token);
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, { fcmToken: token }, { merge: true });
          }
        }
      } catch (err) {
        console.error("❌ FCM Registration Error:", err);
      }
    };

    registerFCM();

    // Listen for foreground messages
    const unsubscribeMessage = onMessage(messaging, (payload) => {
      console.log("🔔 Foreground Message received:", payload);
      // You could trigger a toast here if you want
    });

    return () => unsubscribeMessage();
  }, [user]);

  const signInWithGoogle = async () => {
    // Only use redirect for in-app browsers that block popups
    // Regular mobile Chrome/Safari handle popups fine
    const ua = navigator.userAgent;
    const isInAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|FB_IAB|Line\/|Twitter|MicroMessenger/i.test(ua);

    if (isInAppBrowser) {
      await signInWithRedirect(auth, googleProvider);
    } else {
      // Popup for everything else: desktop AND real mobile browsers
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: user.displayName || "Anonymous",
            photoURL: user.photoURL || "",
            karmaTotal: 0,
            karmaWeekly: 0,
            karmaByCategory: {},
            ward: "",
            localBody: "",
            village: "",
            district: "",
            state: "Kerala",
            onboarded: false,
            createdAt: serverTimestamp(),
          });
        } else {
          const data = userDoc.data() as any;
          const updates: any = {};
          if ((!data.name || data.name === "Anonymous") && user.displayName)
            updates.name = user.displayName;
          if (!data.photoURL && user.photoURL)
            updates.photoURL = user.photoURL;
          if (Object.keys(updates).length > 0)
            await setDoc(userDocRef, updates, { merge: true });
        }
      } catch (error) {
        console.error("Google Sign-In Error", error);
        throw error;
      }
    }
  };

  const signInWithOTP = async (phoneNumber: string, name?: string) => {
    if (name) {
      setPendingName(name);
    }
    const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    return await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign-Out Error", error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, data, { merge: true });
    } catch (error) {
      console.error("Update Profile Error", error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      console.log("🧨 Initiating account deletion for:", user.uid);

      // 1. Cascading Deletion of Posts
      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("authorId", "==", user.uid));
      const postSnaps = await getDocs(q);

      if (!postSnaps.empty) {
        const batch = writeBatch(db);
        postSnaps.forEach((postDoc) => {
          batch.delete(postDoc.ref);
          // Also cleanup verifications? (Optional, but cleaner)
        });
        await batch.commit();
        console.log(`✅ Deleted ${postSnaps.size} posts.`);
      }

      // 2. Delete User Profile (Standard Erasure)
      const userDocRef = doc(db, "users", user.uid);
      await deleteDoc(userDocRef); 
      console.log("👋 User profile deleted from Firestore.");

      // 3. Delete from Firebase Auth
      // Note: This requires a 'recent login'. If it fails, the user must re-auth.
      // We'll let the catch block handle the re-auth error.
      await deleteUser(user);
      console.log("👋 Account deleted from Auth.");

    } catch (error: any) {
      console.error("❌ Account Deletion Error:", error);
      if (error.code === 'auth/requires-recent-login') {
        throw new Error("REAUTH_NEEDED");
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithOTP, signOut, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
