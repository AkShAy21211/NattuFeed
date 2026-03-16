"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { ArrowLeft, Share2, MapPin, Calendar, Clock, User as UserIcon, Loader2, AlertCircle, Navigation, ExternalLink, Flag } from "lucide-react";
import PostCard, { Post } from "@/components/PostCard";
import BusRadarCard from "@/components/BusRadarCard";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { user } = useAuth();
  const [userInteractions, setUserInteractions] = useState<{ reaction?: string, isFlagged: boolean }>({ isFlagged: false });

  useEffect(() => {
    if (!id || !user) return;

    const fetchDetailInteractions = async () => {
      try {
        const vRef = doc(db, "verifications", `${id}_${user.uid}`);
        const fRef = doc(db, "flags", `${id}_${user.uid}`);
        
        const [vSnap, fSnap] = await Promise.all([getDoc(vRef), getDoc(fRef)]);
        
        setUserInteractions({
          reaction: vSnap.exists() ? (vSnap.data().type || "verified") : undefined,
          isFlagged: fSnap.exists()
        });
      } catch (err) {
        console.error("Error fetching detail interactions:", err);
      }
    };

    fetchDetailInteractions();
  }, [id, user]);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      doc(db, "posts", id as string),
      (snapshot) => {
        if (snapshot.exists()) {
          setPost({ id: snapshot.id, ...snapshot.data() } as Post);
          setError(false);
        } else {
          setError(true);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching post details:", err);
        setError(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const formatDate = (createdAt: any): string => {
    try {
      if (!createdAt) return t("justNow") || "Just now";
      const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
      if (isNaN(date.getTime())) return t("justNow") || "Just now";
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return t("justNow") || "Just now";
    }
  };

  const getFreshness = (createdAt: any) => {
    if (!createdAt) return { label: t("filterLive"), color: "bg-emerald-500" };
    const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    const diffMs = new Date().getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 30) return { label: t("filterLive"), color: "bg-emerald-500" };
    if (diffMins < 60) return { label: t("statusChecking") || "Checking...", color: "bg-amber-500" };
    return { label: t("filterYesterday"), color: "bg-gray-400" };
  };

  const handleShare = async () => {
    if (!post) return;
    const shareData = {
      title: `NattuFeed — ${t(`category${post.category}`)}`,
      text: `${post.headline}\n\nVerified by ${post.verifiedCount} neighbors on NattuFeed`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast(t("linkCopied") || "Link copied to clipboard!", "success");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-gray-400 font-bold animate-pulse">{t("loadingDetails") || "Gathering details..."}</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5 border border-red-100">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">{t("postNotFound") || "Post Not Found"}</h3>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          {t("postNotFoundDesc") || "The update you're looking for might have been removed or has expired."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToFeed") || "Return to Feed"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F3] pb-24">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 px-4 py-4 bg-[#F7F6F3]/80 backdrop-blur-xl flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center transition-all active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h2 className="text-[14px] font-black text-gray-900 uppercase tracking-widest">{t("updateDetails") || "Update Details"}</h2>
        <button
          onClick={handleShare}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center transition-all active:scale-90"
        >
          <Share2 className="w-5 h-5 text-primary" />
        </button>
      </div>

      <div className="px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ── Freshness Badge ── */}
        <div className="flex justify-center mb-4">
          <div className="bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${getFreshness(post.createdAt).color} animate-pulse`} />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {getFreshness(post.createdAt).label}
            </span>
          </div>
        </div>

        {/* We reuse the cards but in a "focused" way */}
        {post.type === "bus_spott" ? (
          <BusRadarCard 
            post={post} 
            hideLink={true} 
            initialReactionType={userInteractions.reaction} 
          />
        ) : (
          <PostCard 
            post={post} 
            hideLink={true} 
            initialReactionType={userInteractions.reaction} 
            isFlagged={userInteractions.isFlagged} 
          />
        )}

        {/* ── Additional Info Block ── */}
        <div className="mt-6 bg-white rounded-[24px] border border-gray-100 p-6 space-y-6 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                <Calendar className="w-5 h-5 text-primary/40" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 whitespace-nowrap">{t("postedOn") || "Posted On"}</p>
                <p className="text-[14px] font-black text-gray-900">
                   {formatDate(post.createdAt)}
                </p>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                <MapPin className="w-5 h-5 text-emerald-500/50" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 whitespace-nowrap">{t("location") || "Location"}</p>
                <p className="text-[14px] font-black text-gray-900">
                   {post.landmark || post.district || t("kerala")}
                   {post.landmark && post.district ? `, ${post.district}` : ""}
                </p>
              </div>
           </div>

           {post.type === "bus_spott" && (
             <div className="p-4 bg-emerald-50 rounded-[20px] border border-emerald-100 flex items-start gap-3">
               <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
               <p className="text-[12px] font-bold text-emerald-700 leading-relaxed">
                 {t("radarInfoMsg") || "This is a real-time citizen-tracked bus location. Its accuracy depends on how recently it was reported."}
               </p>
             </div>
           )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="mt-10 py-6 border-t border-gray-100 flex flex-col items-center gap-6">
           <button
             onClick={() => {
                showToast(t("reportSuccess") || "Reported successfully", "success");
             }}
             className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-[2px] bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all active:scale-95 shadow-sm"
           >
             <Flag className="w-4 h-4" />
             {t("reportPost") || "Report this post"}
           </button>
           <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[4px] opacity-50">
             NattuFeed
           </p>
        </div>
      </div>
    </div>
  );
}
