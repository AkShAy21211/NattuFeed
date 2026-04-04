"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { PostFeedSkeleton } from "./PostSkeleton";

/**
 * AuthGuard wraps protected routes. 
 * It ensures that the user is authenticated before rendering children.
 * Redirection logic is handled by AuthContext, but this component 
 * prevents "flicker" and unauthorized data fetching triggers.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // These pages ALWAYS require a logged-in user.
  const protectedPaths = ["/profile", "/leaderboard", "/settings"];
  const isProtectedPath = protectedPaths.some(p => pathname.startsWith(p));
  
  // Login page should not show skeletons
  const isLoginPage = pathname === "/login";

  // If auth is loading, and we're on a protected path, show skeleton
  if (loading && (isProtectedPath || !isLoginPage)) {
    // Note: We show skeleton for the root feed during initial load too,
    // to prevent content jump once auth initializes.
    if (pathname === "/") {
      return (
        <div className="pb-24">
          <div className="h-28 bg-white border-b border-gray-100 animate-pulse" />
          <PostFeedSkeleton />
        </div>
      );
    }
  }

  // If not loading, not authenticated, AND on a protected path, return null
  // (AuthContext will handle the redirect)
  if (!user && isProtectedPath) {
    return null;
  }

  return <>{children}</>;
}
