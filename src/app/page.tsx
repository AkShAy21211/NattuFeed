"use client";

import React, { useState, useEffect } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { isWithinRadius } from "@/lib/haversine";
import PostCard, { Post } from "@/components/PostCard";
import { MapPin, Plus, MapPinOff, RefreshCcw, Globe, Inbox } from "lucide-react";
import CreatePostModal from "@/components/CreatePostModal";
import { PostFeedSkeleton } from "@/components/PostSkeleton";
import { useToast } from "@/context/ToastContext";
import QuickSetup from "@/components/QuickSetup";
import { useLanguage } from "@/context/LanguageContext";

const RADIUS_OPTIONS = [2, 5, 10] as const;
type RadiusKm = (typeof RADIUS_OPTIONS)[number];
type TimeFilter = 'live' | 'today' | 'yesterday';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [radius, setRadius] = useState<RadiusKm>(2);
  const [isGlobal, setIsGlobal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('live');

  const { showToast } = useToast();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const { lat, lng, error: locationError, loading: locationLoading, refreshLocation } = useLocation();

  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      where("isHidden", "==", false),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        setIsOffline(false);
        const allPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        setPosts(allPosts);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Feed Error:", error);
        if (error.code === "unavailable") {
          setIsOffline(true);
        } else {
          showToast("Failed to load feed. Please try again.", "error");
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [showToast]);

  // Handle filtering logic whenever dependencies change
  useEffect(() => {
    let result = posts;

    // 1. Geography Filter
    if (!isGlobal && lat !== null && lng !== null) {
      result = result.filter(p => isWithinRadius(p.lat, p.lng, lat, lng, radius));
    }

    // 2. Time Filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (timeFilter === 'today') {
      result = result.filter(p => {
        const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
        return d >= today;
      });
    } else if (timeFilter === 'yesterday') {
      result = result.filter(p => {
        const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
        return d >= yesterday && d < today;
      });
    }
    // 'live' shows everything newest first (already handled by orderBy)

    setFilteredPosts(result);
  }, [posts, lat, lng, radius, isGlobal, timeFilter]);

  /* ── Location denied ── */
  if (locationError && !isGlobal && lat === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5 border border-red-100">
          <MapPinOff className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">{t("whereAreYou")}</h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">
          {t("needsLocation")}
        </p>
        <button
          onClick={refreshLocation}
          className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <RefreshCcw className="w-4 h-4" />
          {t("tryAgain")}
        </button>
      </div>
    );
  }

  /* ── Loading skeleton ── */
  if (loading && posts.length === 0) {
    return (
      <div className="pb-24">
        <div className="h-28 bg-white border-b border-gray-100 animate-pulse" />
        <PostFeedSkeleton />
      </div>
    );
  }

  const areaLabel = isGlobal
    ? t("kerala")
    : profile?.localBody || profile?.district || t("yourArea");

  return (
    <div className="pb-28 min-h-screen bg-[#F7F6F3]">

      {/* ── Filter Bar (sticky) ── */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-2">
        <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-sm p-2 flex flex-col gap-2 animate-in slide-in-from-top duration-400">

          {/* top row */}
          <div className="flex items-center justify-between px-2 py-1">
            {/* location label */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                {isGlobal
                  ? <Globe className="w-4 h-4 text-primary" />
                  : <MapPin className="w-4 h-4 text-primary" />}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-black text-gray-900 leading-none truncate">{areaLabel}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary/50 mt-0.5">
                  {isGlobal ? t("viewingEverywhere") : t("localFeed")}
                  {filteredPosts.length > 0 && (
                    <span className="text-gray-400 font-bold">
                      {" "}· {filteredPosts.length} {t("posts").toLowerCase()}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* global toggle */}
            <button
              onClick={() => setIsGlobal(g => !g)}
              className={`h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 shrink-0 ${isGlobal
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-gray-50 text-gray-400 border-gray-100 hover:text-primary hover:border-primary/20"
                }`}
            >
              {isGlobal ? t("local") : t("viewGlobal")}
            </button>
          </div>

          {/* Time & Radius Row */}
          <div className="flex gap-2">
            {/* time pills */}
            <div className="flex flex-1 bg-gray-50 rounded-xl p-1 gap-1 border border-black/[0.03]">
              {(['live', 'today', 'yesterday'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5 ${timeFilter === filter
                      ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                      : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {filter === 'live' && <span className={`w-1.5 h-1.5 rounded-full ${timeFilter === 'live' ? 'bg-primary animate-pulse' : 'bg-gray-300'}`} />}
                  {t(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`)}
                </button>
              ))}
            </div>

            {/* radius selector (only in local mode) */}
            {!isGlobal && (
              <div className="flex bg-gray-50 rounded-xl p-1 gap-1 border border-black/[0.03]">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all duration-200 ${radius === r
                        ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                        : "text-gray-400 hover:text-gray-600"
                      }`}
                  >
                    {r}{t("km")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Feed content ── */}
      <div className="px-4 pt-2 space-y-3">
        <QuickSetup />

        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center text-center py-20 px-8">
            <div className="w-16 h-16 bg-white rounded-2xl border border-gray-100 flex items-center justify-center mb-4 shadow-sm">
              <Inbox className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-base font-black text-gray-800 mb-1">{t("silenceArea")}</h3>
            <p className="text-gray-400 text-sm mb-7 max-w-xs leading-relaxed">
              {t("noUpdates", { radius: radius.toString() })}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {t("postUpdate")}
            </button>
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setIsModalOpen(true)}
        aria-label="Create new post"
        className="fixed bottom-24 right-5 w-14 h-14 bg-accent text-white rounded-2xl shadow-xl shadow-accent/30 flex items-center justify-center transition-transform active:scale-90 z-40 border-4 border-white"
      >
        <Plus className="w-7 h-7" />
      </button>

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}