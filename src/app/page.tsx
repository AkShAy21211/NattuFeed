"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import {
  collection, query, where, orderBy, limit, startAfter, getDocs, onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLocationContext } from "@/context/LocationContext";
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
import { useDevice } from "@/hooks/useDevice";
import PulseBanner from "@/components/PulseBanner";

const RADIUS_OPTIONS = [2, 5, 10] as const;
const INITIAL_POSTS_LIMIT = 10;
const PAGINATION_LIMIT = 10;
type RadiusKm = (typeof RADIUS_OPTIONS)[number];
type TimeFilter = 'live' | 'today' | 'yesterday';

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]); // Use any to allow extended post properties
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [radius, setRadius] = useState<RadiusKm>(5);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [isGlobal, setIsGlobal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [feedRetryKey, setFeedRetryKey] = useState(0);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('live');

  const [lastVisible, setLastVisible] = useState<any>(null);
  const [paginationCursor, setPaginationCursor] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [userInteractions, setUserInteractions] = useState<{ reactions: Record<string, string>, flagged: string[] }>({ reactions: {}, flagged: [] });
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | 'Mixed'>('Mixed');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const paginationStartedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const fetchLockRef = useRef(false);

  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const { user, profile, loading: authLoading } = useAuth();
  const { lat, lng, error: locationError, loading: locationLoading, refreshLocation } = useLocationContext();
  const { isDesktop } = useDevice();
  const isSuperAdmin = user?.uid === (process.env.NEXT_PUBLIC_ADMIN_UID || "YIk8fYx3n9Uwj4ygF4tnwVGFS8p2");

  const handleOpenCreate = () => {
    setIsModalOpen(true);
  };

  const fetchPosts = async () => {
    // We only use getDocs for pagination. Initial load is handled by listener.
    if (fetchLockRef.current || isFetchingMore || !hasMore || !paginationCursor) return;

    fetchLockRef.current = true;
    paginationStartedRef.current = true;
    setIsFetchingMore(true);
    try {
      let q = query(
        collection(db, "posts"),
        where("isHidden", "==", false),
        orderBy("createdAt", "desc"),
        startAfter(paginationCursor),
        limit(PAGINATION_LIMIT)
      );

      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      setPosts(prev => {
        const seen = new Set(prev.map((p: any) => p.id));
        const uniqueNew = newPosts.filter((p: any) => !seen.has(p.id));
        return [...prev, ...uniqueNew];
      });
      if (snapshot.docs.length > 0) {
        setPaginationCursor(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length === PAGINATION_LIMIT);
      setIsOffline(false);
    } catch (error: any) {
      console.error("Firestore Pagination Error:", error);
      showToast("Failed to load more updates.", "error");
    } finally {
      fetchLockRef.current = false;
      setIsFetchingMore(false);
    }
  };

  // Real-time listener for the latest posts
  useEffect(() => {
    if (authLoading) return;

    setLoading(true);
    const q = query(
      collection(db, "posts"),
      where("isHidden", "==", false),
      orderBy("createdAt", "desc"),
      limit(INITIAL_POSTS_LIMIT) // Fixed-size initial load
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const latestPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        setPosts(prev => {
          // Keep previously paginated items while refreshing the real-time "head".
          const latestIds = new Set(latestPosts.map((p: any) => p.id));
          const older = prev.filter((p: any) => !latestIds.has(p.id));
          return [...latestPosts, ...older];
        });

        const initialCursor = snapshot.docs[snapshot.docs.length - 1] ?? null;
        setLastVisible(initialCursor);
        // Only initialize pagination cursor from live head; do not reset after pagination starts.
        setPaginationCursor((prev: any) => prev ?? initialCursor);
        // Only derive hasMore from live-head size before pagination starts.
        if (!paginationStartedRef.current) {
          setHasMore(snapshot.docs.length >= INITIAL_POSTS_LIMIT);
        }
        setLoading(false);
        setIsOffline(false);
      },
      (error: any) => {
        console.error("Firestore Listener Error:", error);
        if (error.code === "unavailable") {
          setIsOffline(true);
        } else if (error.code === "permission-denied") {
          console.warn("🔐 Permission Denied: Guest access might be restricted by Firestore rules.");
          // We keep loading(false) so the 'No Updates' or 'Fallback' UI can show
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, feedRetryKey]); // Removed 'user' from dependencies

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

    // 0. Pre-filter: Radar Decay (Hide expired bus spots)
    result = result.filter(p => {
      if (p.type === 'bus_spott' && p.expiresAt) {
        const expiry = p.expiresAt.toDate ? p.expiresAt.toDate() : new Date(p.expiresAt);
        return expiry > now;
      }
      return true;
    });

    // 1. Time Filter (applied before geo so auto-expand considers time-relevant posts)
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

    // 2. Category Filter
    if (selectedCategory !== 'Mixed') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 3. Geography Filter — AUTO-EXPAND if too few results
    const MIN_POSTS = 3;
    let expandLabel: string | null = null;

    if (!isGlobal && lat !== null && lng !== null) {
      // Try user's selected radius first
      let geoResult = result.filter(p => 
        (user && p.authorId === user.uid) || 
        isWithinRadius(p.lat, p.lng, lat!, lng!, radius)
      );

      if (geoResult.length >= MIN_POSTS) {
        result = geoResult;
      } else {
        // Progressive expansion: try wider radii
        const EXPAND_STEPS = [5, 10, 25] as const;
        let expanded = false;

        for (const r of EXPAND_STEPS) {
          if (r <= radius) continue; // skip radii smaller than current
          geoResult = result.filter(p => 
            (user && p.authorId === user.uid) || 
            isWithinRadius(p.lat, p.lng, lat!, lng!, r)
          );
          if (geoResult.length >= MIN_POSTS) {
            result = geoResult;
            expandLabel = `${r}km`;
            expanded = true;
            break;
          }
        }

        if (!expanded) {
          // If 25km is empty, try district match
          const userDistrict = profile?.district;
          if (userDistrict) {
            const districtResult = result.filter(p => 
              (user && p.authorId === user.uid) || 
              p.district === userDistrict
            );
            if (districtResult.length >= MIN_POSTS) {
              result = districtResult;
              expandLabel = userDistrict;
            } else {
              // Show all posts across Kerala (Fallback to Global logic)
              expandLabel = t('kerala') || 'Kerala';
              // Note: result already contains the full list from previous filtering steps (time, category)
            }
          } else {
            // Guest or missing district: Show all posts across Kerala
            expandLabel = t('kerala') || 'Kerala';
            // result remains the time/category-filtered list (Global)
          }
        }
      }
    }

    setExpandedArea(expandLabel);
    setFilteredPosts(result);
  }, [posts, lat, lng, radius, isGlobal, timeFilter, selectedCategory, profile?.district]);

  // Infinite scroll observer: fetch next page when sentinel enters viewport.
  useEffect(() => {
    scrollContainerRef.current = document.getElementById("main-content");
    if (!loadMoreRef.current || loading || isFetchingMore || !hasMore || !paginationCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          fetchPosts();
        }
      },
      { root: scrollContainerRef.current, rootMargin: "240px 0px", threshold: 0.01 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, isFetchingMore, hasMore, paginationCursor]);

  // Fallback infinite scroll for environments where IO triggers inconsistently.
  useEffect(() => {
    scrollContainerRef.current = document.getElementById("main-content");
    const scrollEl = scrollContainerRef.current;
    if (loading || isFetchingMore || !hasMore || !paginationCursor) return;
    if (!scrollEl) return;

    const onScroll = () => {
      if (loading || isFetchingMore || !hasMore || !paginationCursor) return;
      const scrollTop = scrollEl.scrollTop;
      const viewportHeight = scrollEl.clientHeight;
      const fullHeight = scrollEl.scrollHeight;
      const remaining = fullHeight - (scrollTop + viewportHeight);
      if (remaining < 300) {
        fetchPosts();
      }
    };

    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      scrollEl.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [loading, isFetchingMore, hasMore, paginationCursor]);

  /* ── Location denied ── */
  if (locationError && !locationLoading && !isGlobal && lat === null) {
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
    : expandedArea
      ? expandedArea
      : profile?.localBody || profile?.district || t("yourArea");

  // Summary of active filters for the collapsed state
  const filterSummary = [
    t(`filter${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}`),
    !isGlobal ? (expandedArea || `${radius}${t("km")}`) : null,
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
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-center shrink-0">
                {isGlobal
                  ? <Globe className="w-5 h-5 text-primary" />
                  : <MapPin className="w-5 h-5 text-primary" />}
              </div>
              <div className="min-w-0 flex flex-col">
                <p className="text-[14px] font-black text-gray-900 leading-tight truncate">
                  {isGlobal ? (language === 'ml' ? "കേരളം മുഴുവൻ" : "All Kerala Feed") : (language === 'ml' ? `${profile?.district || 'കണ്ണൂർ'} വിശേഷങ്ങൾ` : `${areaLabel} Updates`)}
                </p>
                <div className="flex items-center gap-1 min-w-0 mt-0.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#25D366] whitespace-nowrap shrink-0">
                    {isGlobal ? t("viewingEverywhere") : (language === 'ml' ? "നിങ്ങളുടെ നാട്ടിൽ നിന്ന്" : t("localFeed"))}
                  </p>
                  {!isFiltersVisible && (
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 truncate opacity-80 animate-in fade-in slide-in-from-left duration-300">
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
                className={`flex min-h-[38px] sm:min-h-[40px] items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest border transition-all active:scale-95 ${isFiltersVisible
                    ? "bg-primary text-white border-primary"
                    : "bg-gray-50 text-gray-400 border-gray-100"
                  }`}
              >
                <span>{t("filters") || "Filters"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isFiltersVisible ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={() => setIsGlobal(g => !g)}
                className={`min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-2 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest border transition-all active:scale-95 shrink-0 ${isGlobal
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  : "bg-gray-50 text-gray-400 border-gray-100 hover:text-primary hover:border-primary/20"
                  }`}
              >
                {isGlobal ? (language === 'ml' ? "ലോക്കൽ" : "Local") : (language === 'ml' ? "കേരളം" : "Global")}
              </button>
            </div>
          </div>

          {/* Collapsible Section */}
          <div className={`grid transition-all duration-300 ease-in-out ${isFiltersVisible ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden flex flex-col gap-1.5">
              {/* Time & Radius Row */}
              <div className="flex flex-row gap-1.5 overflow-x-auto scrollbar-hide py-0.5 border-t border-gray-50 pt-2.5">
                {/* time pills */}
                <div className="flex flex-1 bg-gray-50 rounded-xl p-0.5 gap-0.5 border border-black/[0.02] min-w-[200px]">
                  {(['live', 'today', 'yesterday'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`flex-1 min-h-[36px] py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1 whitespace-nowrap ${timeFilter === filter
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
                        className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all duration-200 ${radius === r
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
              <div id="category-filters" className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-0.5 px-0.5 scrollbar-hide border-t border-gray-50 pt-2.5">
                <button
                  onClick={() => setSelectedCategory('Mixed')}
                  className={`flex-shrink-0 min-h-[36px] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === 'Mixed'
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
                    className={`flex-shrink-0 min-h-[36px] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat
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
        {/* Pulse Banner (For Active Resolution) */}
        {!authLoading && user && <PulseBanner />}

        {/* Guest Welcome Banner */}
        {!user && (
          <div className="rounded-[24px] bg-gradient-to-br from-primary to-primary/80 p-5 shadow-lg shadow-primary/20 text-white mb-4 animate-in fade-in zoom-in duration-500 overflow-hidden relative">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-16 h-16 bg-black/10 rounded-full blur-xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center shrink-0">
                  <span className="text-xl">👋</span>
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight leading-tight">
                    {language === 'ml' ? "നമ്മുടെ നാട്ടിലേക്ക് സ്വാഗതം!" : "Welcome to the Town!"}
                  </h3>
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                    {language === 'ml' ? "നിങ്ങളുടെ ചുറ്റുമുള്ള വിവരങ്ങൾ തത്സമയം അറിയാം" : "Real-time updates from neighbors"}
                  </p>
                </div>
              </div>
              
              <p className="text-xs font-medium text-white/90 leading-relaxed mb-4">
                {language === 'ml' 
                  ? "ഇവിടെ ലോഗിൻ ചെയ്യാതെ തന്നെ വിവരങ്ങൾ കാണാം. സുരക്ഷിതമായി റിപ്പോർട്ടുകൾ നൽകാനും പോയിന്റുകൾ നേടാനും ലോഗിൻ ചെയ്യുക." 
                  : "You are currently peeking into the feed. To report issues, verify buses, and earn Karma points, join our community!"}
              </p>
              
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-white text-primary py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] shadow-xl shadow-black/5 active:scale-[0.98] transition-transform"
              >
                {language === 'ml' ? "ഇപ്പോൾ ജോയിൻ ചെയ്യാം" : "Join the Town Now"}
              </button>
            </div>
          </div>
        )}

        {/* Global Fallback Notice */}
        {!isGlobal && expandedArea && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl mb-2 animate-in slide-in-from-left duration-500">
            <span className="text-sm">🔭</span>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              {language === 'ml' 
                ? `ഇപ്പോൾ കുറച്ച് തിരക്ക് കുറവാണ്. കൂടുതൽ വിവരങ്ങൾക്കായി ഞങ്ങൾ ${expandedArea} തിരയുന്നു.` 
                : `Quiet here! Showing the nearest active updates from ${expandedArea}.`}
            </p>
          </div>
        )}

        {isOffline && (
          <div className="rounded-2xl border border-red-100 bg-red-50/80 p-3 flex items-center justify-between gap-3">
            <p className="text-[12px] font-bold text-red-700">
              {t("offlineFeedNotice") || "Feed is temporarily offline. Please retry."}
            </p>
            <button
              onClick={() => setFeedRetryKey((v) => v + 1)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white border border-red-200 text-[10px] font-black uppercase tracking-wider text-red-700"
            >
              {t("tryAgain")}
            </button>
          </div>
        )}

        <QuickSetup />

        {/* ── Auto-Expanded Area Notice ── */}
        {expandedArea && !isGlobal && (
          <div className="relative overflow-hidden group bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-100/50 rounded-[28px] p-5 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/30 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700" />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100/50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-amber-200/50">
                <MapPin className="w-5 h-5 text-amber-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black text-amber-700 uppercase tracking-[0.15em] opacity-80">
                  {expandedArea} Nearby
                </p>
                <p className="text-[14px] font-bold text-amber-900 leading-tight">
                  {t('expandedAreaNotice')}
                </p>
                <p className="text-[10px] text-amber-600/80 font-medium italic mt-1">
                  Searching progressively to keep you informed.
                </p>
              </div>
            </div>
          </div>
        )}

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
                  {t("onboarding.viewGuideTitle") || "Community Guide"}
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  {t("onboarding.viewGuideDesc") || "Learn how to Radar & earn Karma"}
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

            <div ref={loadMoreRef} className="h-8" aria-hidden="true" />
            <div className="h-14">
              {isFetchingMore && (
                <div className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-white border border-gray-100 rounded-2xl animate-in fade-in duration-200">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t("loading") || "Loading..."}</span>
                </div>
              )}
            </div>
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
                onClick={handleOpenCreate}
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
        id="spott-bus-btn"
        onClick={handleOpenCreate}
        aria-label="Create new post"
        className="fixed bottom-28 right-5 w-14 h-14 bg-accent text-white rounded-2xl shadow-xl shadow-accent/30 flex items-center justify-center transition-transform active:scale-90 z-40 border-4 border-white"
      >
        <Plus className="w-7 h-7" />
      </button>

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}