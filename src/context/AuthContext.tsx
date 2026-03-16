"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  deleteUser
} from "firebase/auth";
import { 
  doc, getDoc, setDoc, serverTimestamp, onSnapshot, 
  collection, query, where, getDocs, writeBatch 
} from "firebase/firestore";
import { auth, db, googleProvider, messaging, getToken, onMessage } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

interface UserProfile {
  name: string;
  photoURL: string;
  karmaTotal: number;
  karmaWeekly: number;
  ward: string;
  localBody: string;
  village: string;
  district: string;
  state: string;
  onboarded: boolean;
  ageGroup?: string;
  identityBonusReceived?: boolean;
  createdAt: any;
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
  const router = useRouter();
  const pathname = usePathname();

  const [pendingName, setPendingName] = useState<string | null>(null);

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
        setLoading(false);

        const userDocRef = doc(db, "users", user.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          }
        }, (error) => {
          // Catch snapshots errors (including AbortError during unmount)
          if (error.code !== 'cancelled') {
            console.error("👤 Profile Snapshot Error:", error);
          }
        });

        // Ensure user document exists (background)
        getDoc(userDocRef).then(async (userDoc) => {
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              name: user.displayName || "Anonymous",
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
          }
        }).catch(err => {
          // Suppress AbortError/Network errors in background setup
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

  // 2. Navigation & Redirect Logic (Runs when user, loading, or pathname changes)
  useEffect(() => {
    if (loading) return;

    const publicPaths = ["/login", "/privacy", "/terms"];
    const isPublicPath = publicPaths.includes(pathname);

    if (user) {
      if (pathname === "/login") {
        router.replace("/");
      }
    } else {
      if (!isPublicPath) {
        // Use replace instead of push for more reliable PWA redirection
        router.replace("/login");
      }
    }
  }, [user, loading, pathname, router]);

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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Error", error);
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

      // 2. Delete User Profile
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true }); // Graceful tombstone first
      
      // Wait a bit or just delete it
      // Standard erasure: delete the doc
      // await deleteDoc(userDocRef); // Need to import deleteDoc

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
