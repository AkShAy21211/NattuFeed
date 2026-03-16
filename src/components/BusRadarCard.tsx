"use client";

import React, { useState, useEffect, useMemo } from "react";
import { doc, increment, runTransaction, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { useLocation } from "@/hooks/useLocation";
import { 
  Bus, Navigation, CheckCircle2, AlertTriangle, 
  MapPin, Clock, ArrowRight, ArrowLeft, ChevronRight, User as UserIcon, Trash2
} from "lucide-react";
import KarmaNotification from "./KarmaNotification";
import { useRouter } from "next/navigation";
import SharePost from "./SharePost";

interface BusRadarCardProps {
  post: any;
  initialReactionType?: string;
  isFlagged?: boolean;
  hideLink?: boolean;
  isSuperAdmin?: boolean;
}

/* ─── Avatar with error fallback (reused from PostCard pattern) ─── */
function Avatar({ src, name }: { src?: string; name?: string }) {
  const [errored, setErrored] = useState(false);
  const initials = name
    ? name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
      {src && !errored ? (
        <img
          src={src} alt={name ?? "Author"}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : name ? (
        <span className="text-[10px] font-black text-gray-400">{initials}</span>
      ) : (
        <UserIcon className="w-3.5 h-3.5 text-gray-300" />
      )}
    </div>
  );
}

const BusRadarCard: React.FC<BusRadarCardProps> = ({ 
  post, 
  initialReactionType, 
  isFlagged: initialFlagged, 
  hideLink = false,
  isSuperAdmin = false
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { lat: userLat, lng: userLng, accuracy } = useLocation();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [isVerified, setIsVerified] = useState(!!initialReactionType);
  const [isFlagged, setIsFlagged] = useState(initialFlagged || false);
  const [verifying, setVerifying] = useState(false);
  const [showKarmaPop, setShowKarmaPop] = useState(false);
  const [timeLeftPerc, setTimeLeftPerc] = useState(100);

  // Sync props to state
  useEffect(() => {
    setIsVerified(!!initialReactionType);
    setIsFlagged(initialFlagged || false);
  }, [initialReactionType, initialFlagged]);

  // ── Distance Calculation (Haversine) ──
  const distance = useMemo(() => {
    if (!userLat || !userLng || !post.lat || !post.lng) return null;

    const R = 6371e3; // metres
    const φ1 = (userLat * Math.PI) / 180;
    const φ2 = (post.lat * Math.PI) / 180;
    const Δφ = ((post.lat - userLat) * Math.PI) / 180;
    const Δλ = ((post.lng - userLng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return d;
  }, [userLat, userLng, post.lat, post.lng]);

  const isWithinRange = distance !== null && distance <= 500;

  // ── Decay Logic (20-min Countdown) ──
  useEffect(() => {
    if (!post.createdAt) return;
    
    const start = post.createdAt.toDate ? post.createdAt.toDate().getTime() : new Date(post.createdAt).getTime();
    const expiry = start + 20 * 60000;

    const updateTimer = () => {
      const now = Date.now();
      const total = 20 * 60000;
      const remaining = expiry - now;
      const perc = Math.max(0, (remaining / total) * 100);
      setTimeLeftPerc(perc);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 10000); // Update ogni 10 secondi
    return () => clearInterval(interval);
  }, [post.createdAt]);

  const handleVerify = async () => {
    if (!user || isVerified || verifying) return;
    if (!isWithinRange) {
        showToast(t("tooFarToVerify") || "You must be near the bus to verify!", "warning");
        return;
    }

    setVerifying(true);
    try {
      const verificationRef = doc(db, "verifications", `${post.id}_${user.uid}`);
      const postRef = doc(db, "posts", post.id);
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (tx) => {
        tx.set(verificationRef, { postId: post.id, userId: user.uid, createdAt: new Date() });
        tx.update(postRef, { verifiedCount: increment(1) });
        tx.update(userRef, { karmaTotal: increment(2), karmaWeekly: increment(2) }); // Double karma for radar
      });

      setIsVerified(true);
      setShowKarmaPop(true);
    } catch (err) {
      console.error("Verification failed:", err);
      showToast(t("verifyFail"), "error");
    } finally {
      setVerifying(false);
    }
  };

  const submitDelete = async () => {
    try {
      const postRef = doc(db, "posts", post.id);
      await runTransaction(db, async (tx) => {
        tx.delete(postRef);
      });
      showToast(t("deleteSuccess"), "success");
    } catch (err) {
      console.error("Deletion failed:", err);
      showToast(t("deleteFail"), "error");
    }
  };

  const handleDelete = async () => {
    showToast(
      isSuperAdmin ? t("adminDeleteConfirm") : t("deleteConfirm"),
      "warning",
      { action: { label: t("delete"), onClick: submitDelete } },
    );
  };

  const isAuthor = user?.uid === post.authorId;

  return (
    <article className="relative bg-white border border-gray-100 rounded-[24px] overflow-hidden p-5 shadow-sm hover:shadow-md transition-all animate-in zoom-in-95 duration-300">
      
      {/* ── Progress Bar Decor ── */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-50">
        <div 
          className="h-full bg-emerald-500/80 transition-all duration-1000"
          style={{ width: `${timeLeftPerc}%` }}
        />
      </div>

      <KarmaNotification isVisible={showKarmaPop} onComplete={() => setShowKarmaPop(false)} />

      {/* ── Header: Route & Icon ── */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0 shadow-sm shadow-primary/5">
            <Bus className="w-7 h-7 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`text-[19px] sm:text-[21px] font-black text-gray-900 tracking-tight leading-tight mb-2 fluid-title ${language === 'ml' ? 'ml-text' : ''}`}>
              {post.headline || "Mofussil Bus"}
            </h3>
            
            {/* Unified Radar Pill */}
            <div className="inline-flex items-center gap-2 bg-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-xl px-2 py-1 shadow-sm">
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-emerald-100/50 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                    {t("radarLive") || "Live"}
                  </span>
                </div>
                <div className="w-px h-3 bg-gray-200" />
                <div className="flex items-center gap-1.5 px-1">
                   <Clock className="w-3 h-3 text-gray-400" />
                   <span className="text-[11px] font-black text-gray-700 whitespace-nowrap">
                     {Math.round((20 * timeLeftPerc) / 100)}m
                   </span>
                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">/ 20m</span>
                </div>
            </div>
          </div>
        </div>
        
        {/* Badges Container */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto overflow-x-auto scrollbar-hide py-1 sm:py-0">
          <div className={`px-3 py-1.5 rounded-xl border-2 flex items-center gap-2 shadow-sm ${
            post.details === "to_city" 
            ? "bg-amber-50 border-amber-100/50 text-amber-700" 
            : "bg-blue-50 border-blue-100/50 text-blue-700"
          }`}>
            {post.details === "to_city" ? <ArrowLeft className="w-3 h-3 shrink-0" /> : <ArrowRight className="w-3 h-3 shrink-0" />}
            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              {post.details === "to_city" ? t("towardsCity") : t("towardsVillage")}
            </span>
          </div>

          {post.timingStatus && (
            <div className={`px-2 py-1 rounded-lg border flex items-center gap-1 ${
              post.timingStatus === "on_time" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
              post.timingStatus === "delayed" ? "bg-amber-50 text-amber-600 border-amber-100" :
              "bg-rose-50 text-rose-600 border-rose-100"
            }`}>
               <div className={`w-1 h-1 rounded-full ${
                  post.timingStatus === "on_time" ? "bg-emerald-400" :
                  post.timingStatus === "delayed" ? "bg-amber-400" :
                  "bg-rose-400"
                }`} />
              <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                {post.timingStatus === "on_time" && t("timingOnTime")}
                {post.timingStatus === "delayed" && t("timingDelayed")}
                {post.timingStatus === "just_missed" && t("timingJustMissed")}
              </span>
            </div>
          )}
        </div>
      </div>

      {post.anchorName && (
        <div className="flex items-center gap-1.5 mb-4 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100/50 w-fit">
          <MapPin className="w-3 h-3 text-primary/40" />
          <span className="text-[10px] font-bold text-primary/60 italic uppercase tracking-wider">
            {t("atStop", { stop: post.anchorName })}
          </span>
        </div>
      )}

      {/* ── Stats Body (Clickable) ── */}
      <div 
        className="cursor-pointer active:opacity-70 transition-opacity"
        onClick={() => router.push(`/post/${post.id}`)}
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
          <div className="bg-gray-50 rounded-2xl p-2.5 sm:p-3 border border-gray-100/50">
            <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t("distance") || "Distance"}</p>
            <div className="flex items-center gap-1.5 sm:gap-2">
               <Navigation className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary ${accuracy && accuracy > 3000 ? "animate-pulse" : "opacity-50"}`} />
               <span className="text-[13px] sm:text-[15px] font-black text-gray-900">
                 {distance !== null 
                  ? (accuracy && accuracy > 3000 && distance > accuracy
                     ? (t("locating") || "Locating...")
                     : (distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`))
                  : "--"}
               </span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-2.5 sm:p-3 border border-gray-100/50 min-w-0">
            <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t("status") || "Status"}</p>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
               <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" />
               <span className="text-[13px] sm:text-[15px] font-black text-emerald-600">
                 {timeLeftPerc > 0 ? t("activeNow") : t("expired")}
               </span>
            </div>
          </div>
        </div>

        {!hideLink && (
          <div className="flex items-center gap-1 text-[9px] font-bold text-primary/30 uppercase tracking-widest mb-4">
             {t("viewTrackDetails") || "View Live Tracking"}
             <ChevronRight className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      {/* ── Verification Footer ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
           <Avatar src={post.authorPhoto} name={post.authorName} />
           <div className="min-w-0">
             <p className="text-[11px] font-black text-gray-900 leading-tight">
               {post.authorName || t("citizen")}
             </p>
             <div className="flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-gray-300" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  {t("kerala")}
                </span>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-2 px-1">
          <SharePost post={post} />
          {(isAuthor || isSuperAdmin) && (
            <button
              onClick={handleDelete}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
              title="Delete Radar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {isAuthor ? (
          <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest">
            {post.verifiedCount} {t("verified")}
          </div>
        ) : (
          <button
            onClick={handleVerify}
            disabled={isVerified || verifying}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 ${
              isVerified
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                : isWithinRange
                ? "bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {verifying ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {isVerified ? t("verified") : t("meToo")}
              </>
            )}
          </button>
        )}
      </div>
    </div>

    </article>
  );
};

// Simple helper icon for Loader
const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default BusRadarCard;
