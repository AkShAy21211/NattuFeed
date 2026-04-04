"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot, setDoc, updateDoc, increment, serverTimestamp, runTransaction, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { 
  ArrowLeft, 
  Share2, 
  MapPin, 
  Calendar, 
  Clock, 
  Loader2, 
  AlertCircle, 
  Flag,
  CheckCircle2,
  Trophy,
  ShieldCheck,
  Navigation,
  Flame,
  Handshake,
  Popcorn,
  SmilePlus,
  Lock
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import { Post } from "@/components/PostCard";
import { useLocationContext } from "@/context/LocationContext";
import { calculateDistance } from "@/lib/anchors";

// ─────────────────────────────────────────────
// Constants & Sub-components
// ─────────────────────────────────────────────

const REACTION_TYPES = [
  { type: "verified" as const, Icon: CheckCircle2, color: "text-emerald-500", glow: "shadow-emerald-500/20", label: "verify" },
  { type: "hot" as const, Icon: Flame, color: "text-orange-500", glow: "shadow-orange-500/20", label: "hot" },
  { type: "helpful" as const, Icon: Handshake, color: "text-emerald-500", glow: "shadow-emerald-500/20", label: "helpful" },
  { type: "interesting" as const, Icon: Popcorn, color: "text-amber-500", glow: "shadow-amber-500/20", label: "interesting" },
] as const;

type ReactionType = (typeof REACTION_TYPES)[number]["type"];

function CenterPop({ type }: { type: string }) {
  const config = REACTION_TYPES.find(r => r.type === type);
  const Icon = config?.Icon ?? CheckCircle2;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className={`bg-white/95 backdrop-blur-xl w-32 h-32 rounded-full flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.2)] border-2 border-white animate-verification-pop ${config?.glow ?? ""}`}>
        <Icon className={`w-16 h-16 ${config?.color ?? "text-primary"}`} strokeWidth={2.5} fill="currentColor" fillOpacity={0.1} />
      </div>
    </div>
  );
}

const GET_CATEGORY_THEME = (category: string) => {
  const configs: Record<string, any> = {
    Traffic: { color: "text-red-600", bg: "bg-red-50", border: "border-red-100", gradient: "from-red-500/10" },
    Utility: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", gradient: "from-amber-500/10" },
    Market: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100", gradient: "from-emerald-500/10" },
    Alerts: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", gradient: "from-orange-500/10" },
  };
  return configs[category] || { color: "text-primary", bg: "bg-primary/5", border: "border-primary/10", gradient: "from-primary/10" };
};

const GET_BUS_COLOR_THEME = (color?: string | null) => {
  const themes: Record<string, string> = {
    red: "from-red-600/10",
    blue: "from-blue-600/10",
    green: "from-emerald-600/10",
    maroon: "from-rose-900/10",
    yellow: "from-amber-400/10",
    premium: "from-purple-600/10",
    white: "from-gray-400/10",
  };
  return themes[color || "none"] || "from-transparent";
};

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const { user, profile } = useAuth();
  const { lat: currentLat, lng: currentLng, isWithinKerala } = useLocationContext();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userInteractions, setUserInteractions] = useState<{ reaction?: string, isFlagged: boolean }>({ isFlagged: false });
  const [verifying, setVerifying] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [showEmojiPopup, setShowEmojiPopup] = useState(false);
  const [centerPop, setCenterPop] = useState<string | null>(null);

  // 1. Fetch User Interactions
  useEffect(() => {
    if (!id || !user) return;
    const fetchInteractions = async () => {
      try {
        const vRef = doc(db, "verifications", `${id}_${user.uid}`);
        const fRef = doc(db, "flags", `${id}_${user.uid}`);
        const [vSnap, fSnap] = await Promise.all([getDoc(vRef), getDoc(fRef)]);
        setUserInteractions({
          reaction: vSnap.exists() ? (vSnap.data().type || "verified") : undefined,
          isFlagged: fSnap.exists()
        });
      } catch (err) { console.error(err); }
    };
    fetchInteractions();
  }, [id, user]);

  // 2. Real-time Post Sync
  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, "posts", id as string), (snapshot) => {
      if (snapshot.exists()) {
        setPost({ id: snapshot.id, ...snapshot.data() } as Post);
        setError(false);
      } else { setError(true); }
      setLoading(false);
    }, (err) => { setError(true); setLoading(false); });
    return () => unsubscribe();
  }, [id]);

  const formatDate = (createdAt: any): string => {
    try {
      if (!createdAt) return t("justNow") || "Just now";
      const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
      return date.toLocaleString(language === "ml" ? "ml-IN" : "en-IN", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true
      });
    } catch { return t("justNow") || "Just now"; }
  };

  const handleShare = async () => {
    if (!post) return;
    const shareData = {
      title: `NattuFeed — ${t(`category${post.category}`)}`,
      text: `${post.headline}\n\n#NattuFeed #${post.landmark || "Kerala"}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) { await navigator.share(shareData); } 
      else {
        await navigator.clipboard.writeText(window.location.href);
        showToast(t("linkCopied") || "Link copied!", "success");
      }
    } catch (err) { console.error(err); }
  };

  const handleReact = async (type: string) => {
    if (!id || !user || !post || verifying) return;

    // Guards
    const isStationaryReaction = type === "verified";
    if (isStationaryReaction && !isWithinKerala) {
        showToast(t("keralaOnlyReaction") || "Witness reactions are local-only.", "warning");
        return;
    }

    if (isStationaryReaction && post.type === "bus_spott") {
        if (!currentLat || !currentLng) {
            showToast(t("locationRequired") || "Location required to verify.", "error");
            return;
        }
        const dist = calculateDistance(currentLat, currentLng, post.lat, post.lng);
        if (dist > 200) {
            showToast(t("tooFarToVerify") || "You must be within 200m of the stop to verify.", "warning");
            return;
        }
    }

    const isRemoving = userInteractions.reaction === type;
    const isSwitching = !!userInteractions.reaction && userInteractions.reaction !== type;

    setVerifying(true);
    try {
      const verificationRef = doc(db, "verifications", `${id}_${user.uid}`);
      const postRef = doc(db, "posts", id as string);
      const authorRef = doc(db, "users", post.authorId);

      await runTransaction(db, async (tx) => {
        const postSnap = await tx.get(postRef);
        const data = postSnap.data() ?? {};
        const reactions = data.reactions ?? {};
        const currentVerifiedCount = data.verifiedCount ?? 0;

        const isVerifiedUpdate = type === "verified";
        const wasVerifiedUpdate = userInteractions.reaction === "verified";

        if (isRemoving) {
          tx.delete(verificationRef);
          tx.update(postRef, {
            ...(wasVerifiedUpdate ? { verifiedCount: Math.max(0, currentVerifiedCount - 1) } : {}),
            [`reactions.${type}`]: Math.max(0, (reactions[type] ?? 0) - 1),
          });
          if (wasVerifiedUpdate) {
            tx.update(authorRef, { karmaTotal: increment(-1), karmaWeekly: increment(-1) });
          }
        } else if (isSwitching) {
          tx.update(verificationRef, { type, updatedAt: new Date() });
          tx.update(postRef, {
            ...(wasVerifiedUpdate ? { verifiedCount: Math.max(0, currentVerifiedCount - 1) } : {}),
            ...(isVerifiedUpdate ? { verifiedCount: increment(1) } : {}),
            [`reactions.${userInteractions.reaction}`]: Math.max(0, (reactions[userInteractions.reaction!] ?? 0) - 1),
            [`reactions.${type}`]: increment(1),
          });
          if (wasVerifiedUpdate && !isVerifiedUpdate) {
            tx.update(authorRef, { karmaTotal: increment(-1), karmaWeekly: increment(-1) });
          } else if (!wasVerifiedUpdate && isVerifiedUpdate) {
            tx.update(authorRef, { karmaTotal: increment(1), karmaWeekly: increment(1) });
          }
        } else {
          tx.set(verificationRef, { postId: id, userId: user.uid, type, createdAt: new Date() });
          tx.update(postRef, {
            ...(isVerifiedUpdate ? { verifiedCount: increment(1) } : {}),
            [`reactions.${type}`]: increment(1),
          });
        }
      });

      if (window.navigator.vibrate) window.navigator.vibrate([50, 30, 50]);
      
      if (isRemoving) {
        setUserInteractions(prev => ({ ...prev, reaction: undefined }));
      } else {
        setUserInteractions(prev => ({ ...prev, reaction: type }));
        if (!isSwitching) {
          setCenterPop(type);
          setTimeout(() => setCenterPop(null), 1000);
        }
      }
      setShowEmojiPopup(false);
    } catch (err) {
      console.error(err);
      showToast(t("errorOccurred"), "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleReport = () => {
    if (!id || !user || userInteractions.isFlagged) return;
    showToast(t("reportConfirm") || "Flag this content for review?", "info", { 
        action: { label: t("confirm") || "Confirm", onClick: submitReport } 
    });
  };

  const submitReport = async () => {
    if (!id || !user || flagging) return;
    setFlagging(true);
    try {
      await runTransaction(db, async (tx) => {
        const postRef = doc(db, "posts", id as string);
        const snap = await tx.get(postRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const flags = (data.flagCount ?? 0) + 1;
        const verified = data.verifiedCount ?? 0;

        tx.set(doc(db, "flags", `${id}_${user.uid}`), { postId: id, userId: user.uid, createdAt: new Date() });
        tx.update(postRef, {
          flagCount: increment(1),
          isHidden: flags >= 5 || (flags >= 3 && verified <= 2),
        });
      });

      setUserInteractions(prev => ({ ...prev, isFlagged: true }));
      showToast(t("reportSuccess") || "Flagged for review.", "success");
    } catch (err) {
      console.error(err);
      showToast(t("reportFail"), "error");
    } finally {
        setFlagging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#F7F6F3]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">{t("loadingDetails") || "Gathering..."}</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center bg-[#F7F6F3]">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">{t("postNotFound") || "Update Removed"}</h3>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
            {t("postNotFoundDesc") || "This community update is no longer available or has been moved."}
        </p>
        <button onClick={() => router.push("/")} className="bg-primary text-white px-8 py-4 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4" /> {t("backToFeed") || "Return to Feed"}
        </button>
      </div>
    );
  }

  const theme = GET_CATEGORY_THEME(post.category);
  const busTheme = GET_BUS_COLOR_THEME(post.colorTag);

  return (
    <main className="min-h-screen bg-[#F7F6F3] selection:bg-primary/10">
      {/* ── FEEDBACK ANIMATIONS ── */}
      {centerPop && <CenterPop type={centerPop} />}

      {/* ── IMMERSIVE BACKGROUND ── */}
      <div className={`fixed inset-0 bg-gradient-to-b ${busTheme} via-transparent to-transparent pointer-events-none opacity-40`} />

      {/* ── TOP NAVIGATION ── */}
      <nav className="sticky top-0 z-50 px-4 pt-4 pb-2 flex items-center justify-center min-h-[72px]">
        <button 
          onClick={() => router.back()} 
          className="absolute left-4 w-11 h-11 bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center transition-all active:scale-90 z-20"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className={`px-4 py-2 rounded-full border shadow-sm backdrop-blur-xl ${theme.bg} ${theme.border} relative z-10`}>
            <p className={`text-[10px] font-black uppercase tracking-[2px] ${theme.color}`}>
                {t(`category${post.category}`)}
            </p>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-5 pt-6 pb-40">
        <article className="animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both">
            {/* ── HERO HEADLINE ── */}
            <h1 className={`text-3xl sm:text-5xl font-black text-gray-900 leading-[1.1] tracking-tight mb-10 ${language === "ml" ? "ml-text leading-[1.3]" : ""}`}>
                {post.headline}
            </h1>

            {/* ── AUTHOR & METADATA ROW ── */}
            <div className="flex items-center gap-3 mb-6">
                <ProfileAvatar src={post.authorPhoto} name={post.authorName} size="sm" className="rounded-xl shrink-0 border border-gray-100/50 shadow-sm" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight truncate leading-none">
                            {post.authorName || t("citizen")}
                        </p>
                        <div className="flex items-center gap-1 text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-50/50 px-1.5 py-0.5 rounded border border-amber-100/30">
                            <Trophy className="w-2 h-2" strokeWidth={3} />
                            <span>{(post as any).authorKarmaAtPost || 0}</span>
                        </div>
                    </div>
                    {/* Metadata Inline */}
                    <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 opacity-60" />
                            <span>{formatDate(post.createdAt)}</span>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                        <div className="flex items-center gap-1 min-w-0">
                            <Navigation className="w-3 h-3 opacity-60 shrink-0" />
                            <span className="truncate">{post.anchorName || post.landmark || t("kerala")}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BODY CONTENT ── */}
            {post.details && (
                <div className="mb-10 relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/10 rounded-full" />
                    <p className={`text-[17px] sm:text-[21px] text-gray-700 leading-relaxed font-medium break-words whitespace-pre-wrap ${language === "ml" ? "ml-text leading-[1.6]" : ""}`}>
                        {post.details}
                    </p>
                </div>
            )}

            {/* ── RADAR CONTEXT (IF BUS) ── */}
            {post.type === "bus_spott" && (
                <div className="p-5 bg-primary/5 rounded-[24px] border border-primary/10 flex items-start gap-4 mb-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                        <Navigation className="w-20 h-20 rotate-45" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-primary/5">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[2px] mb-1.5">{t("verifiedRadar") || "Verified Radar Link"}</p>
                        <p className="text-[12px] font-bold text-primary/60 leading-relaxed italic">
                            {t("radarInfoMsg") || "Real-time witness report. Accuracy peak is within 15 mins of posting."}
                        </p>
                    </div>
                </div>
            )}

            {/* ─── MINIMALIST WATERMARK ─── */}
            <div className="mt-24 py-12 flex flex-col items-center justify-center opacity-[0.03] select-none pointer-events-none">
              <span className="text-4xl font-black tracking-[0.4em] uppercase">
                NattuFeed
              </span>
            </div>
        </article>
      </div>

      {/* ── STICKY INTERACTION BAR ── */}
      <div className="fixed bottom-8 left-0 right-0 z-50 px-6">
          <div className="relative max-w-sm mx-auto">
              {/* Emoji picker popup */}
              {showEmojiPopup && (
                  <div className="absolute bottom-full left-0 right-0 mb-4 px-2 z-[60] flex items-center justify-center gap-1.5 glass-panel p-2 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/60 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300 overflow-hidden">
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r border-gray-100" />
                      {REACTION_TYPES.map(({ type, Icon, color, label }) => {
                          const isActive = userInteractions.reaction === type;
                          const isLocked = !isWithinKerala && (type === "verified");

                          return (
                              <button
                                  key={type}
                                  onClick={() => handleReact(type)}
                                  disabled={verifying}
                                  className={`relative flex flex-col items-center p-2 rounded-xl transition-all active:scale-90 min-w-[60px] ${isActive ? "bg-white shadow-sm ring-1 ring-black/5" : "hover:bg-black/5"} ${isLocked ? "opacity-30" : ""}`}
                              >
                                  {isLocked && <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-gray-400" />}
                                  <Icon className={`w-6 h-6 ${color} transition-transform ${isActive ? "scale-95" : "hover:scale-110"}`} strokeWidth={2.5} fill="currentColor" fillOpacity={isActive ? 0.2 : 0.1} />
                                  <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${isActive ? color : "text-gray-400"}`}>
                                      {t(label)}
                                  </span>
                              </button>
                          );
                      })}
                  </div>
              )}

              {/* Backdrop for popup dismiss */}
              {showEmojiPopup && <div className="fixed inset-0 z-50" onClick={() => setShowEmojiPopup(false)} />}

              {/* Main Bar */}
              <div className="relative z-50 bg-white/90 backdrop-blur-3xl px-2 py-2 rounded-[24px] border border-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] flex items-center gap-2">
                    <button
                        onClick={handleShare}
                        className="w-10 h-10 bg-gray-50/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary transition-all active:scale-90 border border-transparent"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                    
                    <button 
                      onClick={() => setShowEmojiPopup(v => !v)}
                      disabled={verifying}
                      className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 font-black uppercase text-[11px] tracking-[1px]
                        ${userInteractions.reaction 
                            ? "bg-primary/5 text-primary border border-primary/20" 
                            : "bg-primary text-white shadow-lg shadow-primary/20"}
                      `}
                    >
                        {verifying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (() => {
                            const active = REACTION_TYPES.find(r => r.type === userInteractions.reaction);
                            const Icon = active?.Icon ?? SmilePlus;
                            return (
                                <>
                                    <Icon className={`w-4 h-4 ${active?.color || ""}`} strokeWidth={3} />
                                    {userInteractions.reaction ? t("reacted") : (t("verify") || "Verify")}
                                </>
                            );
                        })()}
                    </button>

                    <button 
                      onClick={handleReport}
                      disabled={userInteractions.isFlagged || flagging}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border border-transparent
                        ${userInteractions.isFlagged ? "text-red-500 bg-red-50 border-red-100" : "bg-gray-50/50 text-gray-300 hover:text-red-500"}
                      `}
                    >
                        {flagging ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Flag className="w-5 h-5" />}
                    </button>
              </div>
          </div>
      </div>
    </main>
  );
}
