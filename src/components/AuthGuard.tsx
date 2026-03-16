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

  // Define public routes that don't need authentication
  const publicPaths = ["/login", "/privacy", "/terms"];
  const isPublicPath = publicPaths.includes(pathname);

  // If auth is loading, show a skeleton instead of the page content
  if (loading && !isPublicPath) {
    return (
      <div className="pb-24">
        <div className="h-28 bg-white border-b border-gray-100 animate-pulse" />
        <PostFeedSkeleton />
      </div>
    );
  }

  // If not loading and not authenticated (and not public), return null
  // The AuthContext onAuthStateChanged listener will handle the push to /login
  if (!user && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}
