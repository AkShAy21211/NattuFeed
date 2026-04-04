"use client";

import { PostCategory } from "@/types/post";

/**
 * Represents an action a guest intended to take (Post or Verify).
 * Stored in localStorage while the user is redirected to Login.
 */
export type PendingAction = 
  | { 
      type: "post"; 
      data: {
        headline: string;
        details: string;
        landmark: string;
        category: PostCategory;
        lat: number | null;
        lng: number | null;
        isBusSpott: boolean;
        timingStatus?: string | null;
        colorTag?: string | null;
        anchorId?: string | null;
        anchorName?: string | null;
        subType?: string | null;
        urgencyLevel?: string | null;
        contactMode?: string | null;
        contactPhone?: string;
        isResolved: boolean;
        isInformational?: boolean;
        reward?: string;
      };
    }
  | { 
      type: "verify"; 
      postId: string; 
      reactionType: string;
    };

const KEY = "nattufeed_pending_action";

export function useGuestActions() {
  /**
   * Save a guest's action to localStorage before leading them to sign in.
   */
  const savePendingAction = (action: PendingAction) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(KEY, JSON.stringify({
        ...action,
        timestamp: Date.now()
      }));
    }
  };

  /**
   * Retrieve the pending action (e.g. after successful re-auth).
   */
  const getPendingAction = (): (PendingAction & { timestamp: number }) | null => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(KEY);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          // Expire actions older than 1 hour to prevent stale ghost posts
          if (Date.now() - parsed.timestamp > 60 * 60 * 1000) {
            localStorage.removeItem(KEY);
            return null;
          }
          return parsed;
        } catch (e) {
          console.error("Failed to parse pending guest action", e);
          return null;
        }
      }
    }
    return null;
  };

  /**
   * Clear the storage after the action has been successfully processed/synced.
   */
  const clearPendingAction = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(KEY);
    }
  };

  return { savePendingAction, getPendingAction, clearPendingAction };
}
