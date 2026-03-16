"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  collection, query, where, orderBy, limit, startAfter, getDocs, onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { isWithinRadius } from "@/lib/haversine";
import PostCard, { Post } from "@/components/PostCard";
import BusRadarCard from "@/components/BusRadarCard";
import { MapPin, Plus, MapPinOff, RefreshCcw, Globe, Inbox, ChevronDown, Loader2, Sparkles, ChevronRight } from "lucide-react";
import CreatePostModal from "@/components/CreatePostModal";
import { PostFeedSkeleton } from "@/components/PostSkeleton";
import { useToast } from "@/context/ToastContext";
import QuickSetup from "@/components/QuickSetup";
import { useLanguage } from "@/context/LanguageContext";
import { PostCategory, ALL_CATEGORIES } from "@/types/post";

const RADIUS_OPTIONS = [2, 5, 10] as const;
type RadiusKm = (typeof RADIUS_OPTIONS)[number];
type TimeFilter = 'live' | 'today' | 'yesterday';

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([]); // Use any to allow extended post properties
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [radius, setRadius] = useState<RadiusKm>(2);
  const [isGlobal, setIsGlobal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('live');

  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [userInteractions, setUserInteractions] = useState<{ reactions: Record<string, string>, flagged: string[] }>({ reactions: {}, flagged: [] });
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'Mixed'>('Mixed');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const { showToast } = useToast();
  const { t } = useLanguage();
  const { user, profile, loading: authLoading } = useAuth();
  const { lat, lng, error: locationError, loading: locationLoading, refreshLocation } = useLocation();

  const fetchPosts = async (isRefresh = false) => {
    // We only use getDocs for "Load More" (pagination)
    // The initial load is now handled by the real-time listener
    if (loading || !hasMore || isRefresh || !lastVisible) return;

    setLoading(true);
    try {
      let q = query(
        collection(db, "posts"),
        where("isHidden", "==", false),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(15)
      );

      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      setPosts(prev => [...prev, ...newPosts]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 15);
      setIsOffline(false);
    } catch (error: any) {
      console.error("Firestore Pagination Error:", error);
      showToast("Failed to load more updates.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener for the latest posts
  useEffect(() => {
    if (authLoading || !user) return;

    setLoading(true);
    const q = query(
      collection(db, "posts"),
      where("isHidden", "==", false),
      orderBy("createdAt", "desc"),
      limit(20) // Listen to the top 20 posts in real-time
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const latestPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        setPosts(prev => {
          // If we have existing posts beyond the first page, we need to merge carefully
          // or just reset the view if it's the first fetch.
          // For a premium feel: if it's the initial load, just set it.
          // If it's a real-time update, we replace the "head" of the feed.
          return latestPosts;
        });

        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length >= 20);
        setLoading(false);
        setIsOffline(false);
      },
      (error: any) => {
        console.error("Firestore Listener Error:", error);
        if (error.code === "unavailable") {
          setIsOffline(true);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  // Fetch user interactions (verifications & flags) in batches to optimize reads
  useEffect(() => {
    if (!user || posts.length === 0) return;

    const fetchInteractions = async () => {
      const postIds = posts.map(p => p.id);
      
      try {
        const vQuery = query(
          collection(db, "verifications"),
          where("userId", "==", user.uid),
          where("postId", "in", postIds.slice(-30)) 
        );
        const fQuery = query(
          collection(db, "flags"),
          where("userId", "==", user.uid),
          where("postId", "in", postIds.slice(-30))
        );

        const [vSnap, fSnap] = await Promise.all([getDocs(vQuery), getDocs(fQuery)]);
        
        const reactionsMap: Record<string, string> = {};
        vSnap.docs.forEach(d => {
          const data = d.data();
          reactionsMap[data.postId] = data.type || "verified";
        });

        setUserInteractions({
          reactions: reactionsMap,
          flagged: fSnap.docs.map(d => d.data().postId)
        });
      } catch (err) {
        console.error("Error fetching interactions:", err);
      }
    };

    fetchInteractions();
  }, [posts, user]);

  // Handle filtering logic whenever dependencies change
  useEffect(() => {
    let result = posts;
    const now = new Date();

    // 1. Geography Filter
    if (!isGlobal && lat !== null && lng !== null) {
      result = result.filter(p => isWithinRadius(p.lat, p.lng, lat, lng, radius));
    }

    // 2. Radar Decay Filter (Hide expired bus spots)
    result = result.filter(p => {
      if (p.type === 'bus_spott' && p.expiresAt) {
        const expiry = p.expiresAt.toDate ? p.expiresAt.toDate() : new Date(p.expiresAt);
        return expiry > now;
      }
      return true;
    });

    // 3. Time Filter
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

    // 4. Category Filter
    if (selectedCategory !== 'Mixed') {
      result = result.filter(p => p.category === selectedCategory);
    }

    setFilteredPosts(result);
  }, [posts, lat, lng, radius, isGlobal, timeFilter, selectedCategory]);

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

  // Summary of active filters for the collapsed state
  const filterSummary = [
    t(`filter${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}`),
    !isGlobal ? `${radius}${t("km")}` : null,
    selectedCategory !== 'Mixed' ? t(`category${selectedCategory}`) : null
  ].filter(Boolean).join(" · ");

  return (
    <div className="pb-28 min-h-screen bg-[#F7F6F3]">

      {/* ── Filter Bar (sticky) ── */}
      <div className="sticky top-0 z-20 px-3 pt-3 pb-1.5">
        <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-sm p-1.5 flex flex-col gap-1.5 animate-in slide-in-from-top duration-400 overflow-hidden">

          {/* top row: Always visible */}
          <div className="flex items-center justify-between gap-2 px-1.5 py-0.5 min-w-0">
            {/* location label */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                {isGlobal
                  ? <Globe className="w-4 h-4 text-primary" />
                  : <MapPin className="w-4 h-4 text-primary" />}
              </div>
              <div className="min-w-0 flex flex-col">
                <p className="text-[11px] font-black text-gray-900 leading-tight truncate">{areaLabel}</p>
                <div className="flex items-center gap-1 min-w-0 mt-0.5">
                  <p className="text-[7px] font-bold uppercase tracking-widest text-primary/50 whitespace-nowrap shrink-0">
                    {isGlobal ? t("viewingEverywhere") : t("localFeed")}
                  </p>
                  {!isFiltersVisible && (
                    <p className="text-[7px] font-black uppercase tracking-widest text-gray-300 truncate opacity-80 animate-in fade-in slide-in-from-left duration-300">
                      · {filterSummary}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions: Toggle & Global */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                className={`flex items-center gap-1 h-7 px-2 rounded-xl text-[8px] font-black uppercase tracking-tighter border transition-all active:scale-95 ${
                  isFiltersVisible
                    ? "bg-primary/5 text-primary border-primary/20"
                    : "bg-white text-gray-400 border-gray-100"
                }`}
              >
                <span>{t("filters") || "Filters"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isFiltersVisible ? 'rotate-180' : ''}`} />
              </button>
              
              <button
                onClick={() => setIsGlobal(g => !g)}
                className={`h-7 px-2.5 rounded-xl text-[8px] font-black uppercase tracking-tighter border transition-all active:scale-95 shrink-0 ${isGlobal
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                    : "bg-gray-50 text-gray-400 border-gray-100 hover:text-primary hover:border-primary/20"
                  }`}
              >
                {isGlobal ? t("local") : t("viewGlobal")}
              </button>
            </div>
          </div>

          {/* Collapsible Section */}
          <div className={`grid transition-all duration-300 ease-in-out ${isFiltersVisible ? 'grid-rows-[1fr] opacity-100 mt-0.5' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden flex flex-col gap-1.5">
              {/* Time & Radius Row */}
              <div className="flex flex-row gap-1.5 overflow-x-auto scrollbar-hide py-0.5 border-t border-gray-50 pt-2">
                {/* time pills */}
                <div className="flex flex-1 bg-gray-50 rounded-xl p-0.5 gap-0.5 border border-black/[0.02] min-w-[200px]">
                  {(['live', 'today', 'yesterday'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`flex-1 py-1 px-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1 whitespace-nowrap ${timeFilter === filter
                          ? "bg-white text-primary shadow-sm"
                          : "text-gray-400 hover:text-gray-600"
                        }`}
                    >
                      {filter === 'live' && <span className={`w-1 h-1 rounded-full ${timeFilter === 'live' ? 'bg-primary animate-pulse' : 'bg-gray-300'}`} />}
                      {t(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`)}
                    </button>
                  ))}
                </div>

                {/* radius selector (only in local mode) */}
                {!isGlobal && (
                  <div className="flex bg-gray-50 rounded-xl p-0.5 gap-0.5 border border-black/[0.02] shrink-0">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRadius(r)}
                        className={`px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest transition-all duration-200 ${radius === r
                            ? "bg-white text-primary shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                          }`}
                      >
                        {r}{t("km")}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-hide border-t border-gray-50 pt-1.5">
                <button
                  onClick={() => setSelectedCategory('Mixed')}
                  className={`flex-shrink-0 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    selectedCategory === 'Mixed'
                      ? "bg-primary text-white shadow-sm shadow-primary/20"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {t("filterMixed")}
                </button>
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      selectedCategory === cat
                        ? "bg-primary text-white shadow-sm shadow-primary/20"
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    {t(`category${cat}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feed content ── */}
      <div className="px-4 pt-2 space-y-3">
        <QuickSetup />

        {/* ── Guide Banner (For New Users) ── */}
        {(profile?.karmaTotal ?? 0) < 15 && (
          <Link 
            href="/guide"
            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-primary/20 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-tight">
                  {t("readGuide")}
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  Learn how to Radar & earn Karma
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
          </Link>
        )}

        {filteredPosts.length > 0 ? (
          <>
            {filteredPosts.map((post) => (
              post.type === 'bus_spott' 
                ? <BusRadarCard 
                    key={post.id} 
                    post={post} 
                    initialReactionType={userInteractions.reactions[post.id]}
                    isFlagged={userInteractions.flagged.includes(post.id)}
                  /> 
                : <PostCard 
                    key={post.id} 
                    post={post} 
                    initialReactionType={userInteractions.reactions[post.id]}
                    isFlagged={userInteractions.flagged.includes(post.id)}
                  />
            ))}
            
            {hasMore && (
              <button
                onClick={() => fetchPosts()}
                disabled={loading}
                className="w-full py-4 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all active:scale-95"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {t("loadMore") || "Load More Updates"}
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center text-center py-16 px-8">
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

            {/* fallback trending */}
            {!isGlobal && posts.length > 0 && (
               <div className="w-full mt-4 space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Sparkles className="w-4 h-4 text-primary opacity-50" />
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{t("trendingKerala") || "Trending in Kerala"}</h4>
                  </div>
                  <div className="space-y-3">
                    {posts.slice(0, 3).map((post) => (
                      post.type === 'bus_spott' 
                        ? <BusRadarCard 
                            key={`trending-${post.id}`} 
                            post={post} 
                            initialReactionType={userInteractions.reactions[post.id]}
                            isFlagged={userInteractions.flagged.includes(post.id)}
                          /> 
                        : <PostCard 
                            key={`trending-${post.id}`} 
                            post={post} 
                            initialReactionType={userInteractions.reactions[post.id]}
                            isFlagged={userInteractions.flagged.includes(post.id)}
                          />
                    ))}
                    <button 
                      onClick={() => setIsGlobal(true)}
                      className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-primary/60 bg-white border border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      {t("viewEverywhere") || "View Everything Across Kerala"}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
               </div>
            )}
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