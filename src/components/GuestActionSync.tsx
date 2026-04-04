"use client";

import { useEffect, useRef } from "react";
import { 
  doc, setDoc, updateDoc, increment, collection, 
  serverTimestamp, runTransaction, getDoc, addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";

/**
 * GuestActionSync
 * 
 * Automatically detects and executes pending guest actions 
 * once a user successfully signs in. This fulfills the 
 * "Store-and-Convert" strategy for NattuFeed.
 */
const GuestActionSync = () => {
  const { user, profile, loading } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const isSyncing = useRef(false);

  useEffect(() => {
    // Only attempt sync when auth is fully resolved and user profile is available
    if (loading || !user || !profile || isSyncing.current) return;

    const syncPendingAction = async () => {
      const stored = localStorage.getItem("nattufeed_pending_action");
      if (!stored) return;

      try {
        const action = JSON.parse(stored);
        const now = Date.now();

        // 1. Check for expiration (1 hour)
        if (now > action.expiry) {
          console.log("🕒 Guest action expired, removing.");
          localStorage.removeItem("nattufeed_pending_action");
          return;
        }

        isSyncing.current = true;
        console.log("🔄 Auto-syncing guest action:", action.type);

        // 2. Handle POST creation
        if (action.type === "post" && action.data) {
          const postRef = collection(db, "posts");
          const postData = {
            ...action.data,
            authorId: user.uid,
            authorName: profile.name || user.displayName || "Anonymous",
            authorPhoto: profile.photoURL || user.photoURL || "",
            createdAt: serverTimestamp(),
            // Auto-calculate expiry for bus radar if needed
            ...(action.data.type === "bus_spott" ? { 
              expiresAt: new Date(Date.now() + 30 * 60_000) 
            } : {})
          };

          await addDoc(postRef, postData);
          
          // Update User Karma for the newly saved post
          const karmaAmount = action.data.type === "bus_spott" ? 5 : 2;
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            karmaTotal: increment(karmaAmount),
            karmaWeekly: increment(karmaAmount)
          });

          showToast(t("successPostClaimed") || "Contribution saved! +Karma awarded.", "success");
        } 
        
        // 3. Handle VERIFICATION (Witness)
        else if (action.type === "verify" && action.postId) {
          const verificationRef = doc(db, "verifications", `${action.postId}_${user.uid}`);
          const postRef = doc(db, "posts", action.postId);
          const userRef = doc(db, "users", user.uid);

          await runTransaction(db, async (tx) => {
            const postSnap = await tx.get(postRef);
            if (!postSnap.exists()) return;

            const postData = postSnap.data();
            const reactionType = action.reactionType || "verified";
            const isVerifiedUpdate = reactionType === "verified";

            // Create verification doc
            tx.set(verificationRef, {
              postId: action.postId,
              userId: user.uid,
              type: reactionType,
              createdAt: serverTimestamp()
            });

            // Increment counts on post
            tx.update(postRef, {
              ...(isVerifiedUpdate ? { verifiedCount: increment(1) } : {}),
              [`reactions.${reactionType}`]: increment(1)
            });

            // Reward author of the post (if it was a verified/high-trust reaction)
            if (isVerifiedUpdate && postData.authorId) {
              const authorRef = doc(db, "users", postData.authorId);
              tx.update(authorRef, {
                karmaTotal: increment(1),
                karmaWeekly: increment(1)
              });
            }

            // Reward the current user (the witness)
            tx.update(userRef, {
              karmaTotal: increment(1),
              karmaWeekly: increment(1)
            });
          });

          showToast(t("successWitnessClaimed") || "Verification synced! +Karma earned.", "success");
        }

        // Cleanup
        localStorage.removeItem("nattufeed_pending_action");
      } catch (error) {
        console.error("❌ Guest Action Sync Failed:", error);
      } finally {
        isSyncing.current = false;
      }
    };

    syncPendingAction();
  }, [user, profile, loading, t, showToast]);

  return null; // Silent background worker
};

export default GuestActionSync;
