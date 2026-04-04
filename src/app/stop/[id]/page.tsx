"use client";

import React, { useState, useEffect } from "react";
import { 
  collection, query, where, orderBy, onSnapshot, limit, getDocs 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAnchorById, Anchor } from "@/lib/anchors";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import BusRadarCard from "@/components/BusRadarCard";
import PostCard from "@/components/PostCard";
import CreatePostModal from "@/components/CreatePostModal";
import { 
  MapPin, ChevronLeft, Loader2, Sparkles, Plus, Info, 
  Trophy, Share2, Bus, Navigation 
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function StopPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userInteractions, setUserInteractions] = useState<{ reactions: Record<string, string>, flagged: string[] }>({ reactions: {}, flagged: [] });

  // 1. Fetch Anchor Details
  useEffect(() => {
    if (!id) return;
    const fetchAnchor = async () => {
      const data = await getAnchorById(id as string);
      setAnchor(data);
      if (!data) {
        showToast("Stop not found", "error");
        router.push("/");
      }
    };
    fetchAnchor();
  }, [id]);

  // 2. Real-time Listener for Stop-specific Posts
  useEffect(() => {
    if (!id || !user) return;

    const q = query(
      collection(db, "posts"),
      where("anchorId", "==", id),
      where("isHidden", "==", false),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const latestPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(latestPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user]);

  // 3. Fetch User Interactions
  useEffect(() => {
    if (!user || posts.length === 0) return;

    const fetchInteractions = async () => {
      const postIds = posts.map(p => p.id);
      try {
        const vQuery = query(
          collection(db, "verifications"),
          where("userId", "==", user.uid),
          where("postId", "in", postIds.slice(0, 30)) 
        );
        const fQuery = query(
          collection(db, "flags"),
          where("userId", "==", user.uid),
          where("postId", "in", postIds.slice(0, 30))
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

  if (loading && !anchor) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F7F6F3]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 animate-pulse">
          {t("loadingPulse") || "Calibrating Radar..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] pb-24">
      {/* ── Header Layer ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 safe-top transition-all">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </button>
          
          <div className="text-center flex-1 px-4">
            <h1 className="text-[15px] font-black text-gray-900 tracking-tight leading-tight truncate">
              {anchor?.name || "Local Stop"}
            </h1>
            <p className="text-[9px] font-bold text-primary/50 uppercase tracking-[0.2em] mt-0.5">
              Live Station Feed
            </p>
          </div>

          <button 
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 active:scale-95 transition-transform"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `NattuFeed: ${anchor?.name}`,
                  url: window.location.href
                });
              }
            }}
          >
            <Share2 className="w-4 h-4 text-gray-900" />
          </button>
        </div>

        {/* Categories / Routes hint */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-xl shrink-0">
             <Bus className="w-3.5 h-3.5 text-primary" />
             <span className="text-[9px] font-black text-primary uppercase tracking-wider">Active Radar</span>
          </div>
          {anchor?.routes?.map((route, i) => (
             <div key={i} className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl shrink-0 shadow-sm">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{route}</span>
             </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Dynamic Warning if Empty */}
        {posts.length === 0 && !loading && (
          <div className="relative overflow-hidden bg-white rounded-[32px] p-8 border border-gray-100 premium-shadow text-center group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <Trophy className="w-32 h-32 rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-xl shadow-amber-500/10 animate-pioneer-pulse">
                <Sparkles className="w-10 h-10 text-amber-500" />
              </div>
              
              <h2 className="text-[20px] font-black text-gray-900 tracking-tight leading-tight mb-3">
                 No Radar Activity Yet.
              </h2>
              <p className="text-gray-400 text-xs font-medium leading-relaxed mb-8 max-w-[240px] mx-auto">
                Be the <span className="text-amber-600 font-bold">First Pioneer</span> to report a bus at {anchor?.name} and earn <span className="text-emerald-600 font-bold">Double Karma</span>.
              </p>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="group relative flex items-center gap-3 bg-primary text-white pl-8 pr-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span>Start Radar</span>
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Feed of Posts at this Stop */}
        <div className="space-y-4">
          {posts.map((post) => (
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
        </div>

        {/* Small Navigation Hint */}
        {posts.length > 0 && (
           <div className="bg-white rounded-[24px] p-5 border border-gray-100 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Navigation className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none">Scanning Nearby...</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">You are now at {anchor?.name}</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/10 active:scale-90 transition-transform"
              >
                 <Plus className="w-5 h-5" />
              </button>
           </div>
        )}
      </div>

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialAnchorId={id as string}
        isPioneer={posts.length === 0}
      />
    </div>
  );
}
