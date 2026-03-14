"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const [pendingName, setPendingName] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          const userDocRef = doc(db, "users", user.uid);
          // Try to get cached profile first if possibly available via Firestore persistence?
          // Actually onSnapshot will handle the local cache.
          
          unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              setProfile(snapshot.data() as UserProfile);
            }
            setLoading(false);
          });

          // Background check for existence/update
          getDoc(userDocRef).then(async (userDoc) => {
            if (!userDoc.exists()) {
              await setDoc(userDocRef, {
                name: pendingName || user.displayName || "Anonymous",
                photoURL: user.photoURL || "",
                karmaTotal: 0,
                karmaWeekly: 0,
                ward: "",
                localBody: "",
                village: "",
                district: "",
                state: "Kerala",
                onboarded: false,
                createdAt: serverTimestamp(),
              });
            }
          });
          
        } catch (error) {
          console.error("Error setting up user profile in AuthContext:", error);
          setLoading(false);
        }

        if (pathname === "/login") {
          router.push("/");
        }
      } else {
        setUser(null);
        setProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
        
        if (pathname !== "/login") {
          router.push("/login");
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [router, pathname, pendingName]);

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

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithOTP, signOut, updateProfile }}>
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
