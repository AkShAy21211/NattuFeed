"use client";

import React, { useState, useEffect } from "react";
import {
  doc, deleteDoc, increment, runTransaction, onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  MessageSquare,
  MapPin,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Share2,
  ChevronRight,
  Flame,
  Handshake,
  Popcorn,
  Sparkles,
  SmilePlus,
  Loader2,
  User as UserIcon,
  Flag
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
const ml = enUS; // Fallback for Malayalam
import KarmaNotification from "./KarmaNotification";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import SharePost from "./SharePost";

/* ─── Move config out of component ─────────────────────────────── */
const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID ?? "PDSS7Le4eDZetKMw6fBaI5zDaer1";

/* ─── Reaction Configuration ─────────────────────────────────── */
const REACTION_TYPES = [
  {
    type: 'verified' as const,
    Icon: CheckCircle2,
    color: 'text-emerald-500',
    glow: 'shadow-emerald-500/20',
    label: 'verify'
  },
  {
    type: 'hot' as const,
    Icon: Flame,
    color: 'text-orange-500',
    glow: 'shadow-orange-500/20',
    label: 'hot'
  },
  {
    type: 'helpful' as const,
    Icon: Handshake,
    color: 'text-blue-500',
    glow: 'shadow-blue-500/20',
    label: 'helpful'
  },
  {
    type: 'interesting' as const,
    Icon: Popcorn,
    color: 'text-amber-500',
    glow: 'shadow-amber-500/20',
    label: 'interesting'
  }
];

/* ─── Types ─────────────────────────────────────────────────────── */
export interface Post {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhoto?: string;
  headline: string;
  details?: string;
  landmark?: string;
  category: "Traffic" | "Utility" | "Market" | "Services" | "Health" | "Alerts" | "TownTalk";
  type: "general" | "bus_spott";
  lat: number;
  lng: number;
  district?: string;
  localBody?: string;
  verifiedCount: number;
  flagCount: number;
  reactions?: Record<string, number>;
  anchorId?: string | null;
  anchorName?: string | null;
  timingStatus?: "on_time" | "delayed" | "just_missed" | null;
  isHidden: boolean;
  isBusinessPost: boolean;
  createdAt: any;
  expiresAt?: any;
}

/* ─── Avatar with error fallback ───────────────────────────────── */
function Avatar({ src, name }: { src?: string; name?: string }) {
  const [errored, setErrored] = useState(false);
  const initials = name
    ? name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
      {src && !errored ? (
        <img
          src={src} alt={name ?? "Author"}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : name ? (
        <span className="text-[11px] font-black text-gray-400">{initials}</span>
      ) : (
        <UserIcon className="w-4 h-4 text-gray-300" />
      )}
    </div>
  );
}

/* ─── Category config ───────────────────────────────────────────── */
const CATEGORY_CONFIG: Record<string, { pill: string, bar: string, i18n: string }> = {
  Traffic: { pill: "bg-red-50 text-red-600 border-red-100", bar: "bg-red-400", i18n: "categoryTraffic" },
  Utility: { pill: "bg-amber-50 text-amber-600 border-amber-100", bar: "bg-amber-400", i18n: "categoryUtility" },
  Market: { pill: "bg-emerald-50 text-emerald-700 border-emerald-100", bar: "bg-emerald-500", i18n: "categoryMarket" },
  Services: { pill: "bg-blue-50 text-blue-600 border-blue-100", bar: "bg-blue-500", i18n: "categoryServices" },
  Health: { pill: "bg-rose-50 text-rose-600 border-rose-100", bar: "bg-rose-400", i18n: "categoryHealth" },
  Alerts: { pill: "bg-orange-50 text-orange-600 border-orange-100", bar: "bg-orange-500", i18n: "categoryAlerts" },
  TownTalk: { pill: "bg-purple-50 text-purple-600 border-purple-100", bar: "bg-purple-400", i18n: "categoryTownTalk" },
} as const;

/* ─── PostCard ──────────────────────────────────────────────────── */
interface PostCardProps {
  post: Post;
  initialReactionType?: string;
  isFlagged?: boolean;
  hideLink?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, initialReactionType, isFlagged: initialFlagged, hideLink = false }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [isVerified, setIsVerified] = useState(initialReactionType === "verified");
  const [isFlagged, setIsFlagged] = useState(initialFlagged || false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [showKarmaPop, setShowKarmaPop] = useState(false);
  const [showEmojiPopup, setShowEmojiPopup] = useState(false);
  const [showCenterPop, setShowCenterPop] = useState<string | null>(null);
  const [lastTap, setLastTap] = useState(0);

  const [activeReaction, setActiveReaction] = useState<string | null>(initialReactionType || null);

  const isAuthor = user?.uid === post.authorId;
  const isSuperAdmin = user?.uid === ADMIN_UID;
  const canDelete = isAuthor || isSuperAdmin;

  // Sync props to state for immediate feedback
  useEffect(() => {
    setIsFlagged(initialFlagged || false);
    if (initialReactionType) {
      setActiveReaction(initialReactionType);
      setIsVerified(initialReactionType === "verified");
    } else {
      setActiveReaction(null);
      setIsVerified(false);
    }
  }, [initialReactionType, initialFlagged]);

  /* — reaction handler — */
  const handleReact = async (type: string) => {
    if (!user || verifying) return;
    
    // Safety check for incomplete post data
    if (!post || !post.id || !post.authorId) {
      console.error("❌ Reaction failed: Incomplete post data", { postId: post?.id, authorId: post?.authorId });
      showToast(t("verifyFail"), "error");
      return;
    }
    
    // If clicking same reaction, we "un-react" (remove)
    const isRemoving = activeReaction === type;
    const isSwitching = activeReaction && activeReaction !== type;
    
    setVerifying(true);
    try {
      const verificationRef = doc(db, "verifications", `${post.id}_${user.uid}`);
      const postRef = doc(db, "posts", post.id);
      const userRef = doc(db, "users", user.uid);
      const authorRef = doc(db, "users", post.authorId);

      await runTransaction(db, async (tx) => {
        const postSnap = await tx.get(postRef);
        const postData = postSnap.data() || {};
        const reactions = postData.reactions || {};
        const currentVerifiedCount = postData.verifiedCount || 0;

        const isVerifiedUpdate = type === "verified";
        const wasVerifiedUpdate = activeReaction === "verified";

        if (isRemoving) {
          tx.delete(verificationRef);
          const currentTypeCount = reactions[type] || 0;
          tx.update(postRef, { 
            ...(wasVerifiedUpdate ? { verifiedCount: currentVerifiedCount > 0 ? increment(-1) : 0 } : {}),
            [`reactions.${type}`]: currentTypeCount > 0 ? increment(-1) : 0
          });
        } else if (isSwitching) {
          tx.update(verificationRef, { type, updatedAt: new Date() });
          const oldTypeCount = reactions[activeReaction!] || 0;
          tx.update(postRef, { 
            ...(wasVerifiedUpdate ? { verifiedCount: currentVerifiedCount > 0 ? increment(-1) : 0 } : {}),
            ...(isVerifiedUpdate ? { verifiedCount: increment(1) } : {}),
            [`reactions.${activeReaction}`]: oldTypeCount > 0 ? increment(-1) : 0,
            [`reactions.${type}`]: increment(1)
          });
        } else {
          // New reaction
          tx.set(verificationRef, { postId: post.id, userId: user.uid, type, createdAt: new Date() });
          tx.update(postRef, { 
            ...(isVerifiedUpdate ? { verifiedCount: increment(1) } : {}),
            [`reactions.${type}`]: increment(1)
          });
          tx.update(userRef, { karmaTotal: increment(1), karmaWeekly: increment(1) });
          tx.update(authorRef, { karmaTotal: increment(1), karmaWeekly: increment(1) });
        }
      });

      if (isRemoving) {
        setIsVerified(false);
        setActiveReaction(null);
      } else {
        setIsVerified(true);
        setActiveReaction(type);
        if (!isSwitching) {
          setShowKarmaPop(true);
          setShowCenterPop(type);
          setTimeout(() => setShowCenterPop(null), 1000);
        }
      }
      setShowEmojiPopup(false);
    } catch (err) {
      console.error("Reaction adjustment failed:", err);
      showToast(t("verifyFail"), "error");
    } finally {
      setVerifying(false);
    }
  };

  /* — report — */
  const handleReport = async () => {
    if (!user || isFlagged) return;
    showToast(t("reportSpam"), "info", {
      action: { label: t("confirm"), onClick: submitReport },
    });
  };

  const submitReport = async () => {
    if (!user || flagging) return;
    setFlagging(true);
    try {
      const flagRef = doc(db, "flags", `${post.id}_${user.uid}`);
      const postRef = doc(db, "posts", post.id);

      await runTransaction(db, async (tx) => {
        const postSnap = await tx.get(postRef);
        if (!postSnap.exists()) return;
        const data = postSnap.data();
        const currentFlags = (data.flagCount || 0) + 1;
        const currentVerified = data.verifiedCount || 0;

        tx.set(flagRef, { postId: post.id, userId: user.uid, createdAt: new Date() });
        tx.update(postRef, {
          flagCount: increment(1),
          isHidden: currentFlags >= 5 || (currentFlags >= 3 && currentVerified <= 2)
        });
      });
      setIsFlagged(true);
      showToast(t("reportSuccess"), "success");
    } catch (err) {
      console.error("Reporting failed:", err);
      showToast(t("reportFail"), "error");
    } finally {
      setFlagging(false);
    }
  };

  /* — double tap handler — */
  const handleContentClick = () => {
    if (hideLink) return;
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (!isVerified && !isAuthor) {
        handleReact("verified");
      }
    } else {
      setTimeout(() => {
        if (Date.now() - now >= DOUBLE_TAP_DELAY) {
          router.push(`/post/${post.id}`);
        }
      }, DOUBLE_TAP_DELAY);
    }
    setLastTap(now);
  };

  /* — admin delete — */
  const handleDelete = async () => {
    if (!user || deleting) return;
    showToast(
      isSuperAdmin ? t("adminDeleteConfirm") : t("deleteConfirm"),
      "warning",
      { action: { label: t("delete"), onClick: submitDelete } },
    );
  };

  const submitDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "posts", post.id));
      showToast(t("deleteSuccess"), "success");
    } catch (err) {
      console.error("Delete failed:", err);
      showToast(t("deleteFail"), "error");
    } finally {
      setDeleting(false);
    }
  };

  /* — time format — */
  const formatTime = (timestamp: any): string => {
    if (!timestamp) return t("justNow");
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return t("justNow");
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return t("ago", { time: `${mins}m` });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("ago", { time: `${hours}h` });
    return date.toLocaleDateString(language === "ml" ? "ml-IN" : "en-US");
  };

  const catConfig = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.Traffic;

  return (
    <article
      aria-labelledby={`post-title-${post.id}`}
      className="relative bg-white border border-gray-100 rounded-[24px] p-4 pl-5 transition-all duration-300 hover:shadow-md hover:-translate-y-px animate-in fade-in slide-in-from-bottom-2 group"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${catConfig.bar} rounded-l-[24px]`} />

      {/* Center Pop Feedback */}
      {showCenterPop && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          {(() => {
            const config = REACTION_TYPES.find(r => r.type === showCenterPop);
            const Icon = config?.Icon || CheckCircle2;
            return (
              <div className={`bg-white/95 backdrop-blur-xl w-32 h-32 rounded-full flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.2)] border-2 border-white animate-verification-pop ${config?.glow}`}>
                <Icon 
                   className={`w-16 h-16 ${config?.color || 'text-primary'}`} 
                   strokeWidth={2.5}
                   fill="currentColor"
                   fillOpacity={0.1}
                />
              </div>
            );
          })()}
        </div>
      )}

      <KarmaNotification isVisible={showKarmaPop} onComplete={() => setShowKarmaPop(false)} />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar src={post.authorPhoto} name={post.authorName} />
          <div className="min-w-0">
            <p className="text-[11px] sm:text-[12px] font-black text-gray-900 uppercase tracking-tight leading-tight mb-0.5">
              {post.authorName || t("citizen")}
            </p>
            <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
              <time
                className="text-[9px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap"
                dateTime={post.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString()}
              >
                {formatTime(post.createdAt)}
              </time>
              <span className="text-gray-200 text-[8px] shrink-0">·</span>
              <span className="text-[9px] text-primary/40 font-bold uppercase tracking-widest whitespace-nowrap">{t('kerala')}</span>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="space-y-2 mb-4 cursor-pointer active:opacity-70 transition-opacity select-none"
        onClick={handleContentClick}
      >
        <h3
          id={`post-title-${post.id}`}
          className={`text-[15px] sm:text-[16px] font-black text-gray-900 leading-snug tracking-tight break-words fluid-title ${language === 'ml' ? 'ml-text' : ''}`}
        >
          {post.headline}
        </h3>

        {post.landmark && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
            <MapPin className="w-3 h-3 text-primary/60 shrink-0" />
            <span className="text-[9px] font-black text-primary/60 uppercase tracking-wider">{post.landmark}</span>
          </div>
        )}

        {/* Timing & Stop Badge for Radar */}
        {post.type === "bus_spott" && (post.anchorName || post.timingStatus) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.anchorName && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 border border-primary/10 rounded-lg">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-bold text-primary italic uppercase tracking-wider">
                  {t("atStop", { stop: post.anchorName })}
                </span>
              </div>
            )}
            {post.timingStatus && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                post.timingStatus === "on_time" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                post.timingStatus === "delayed" ? "bg-amber-50 text-amber-600 border-amber-100" :
                "bg-rose-50 text-rose-600 border-rose-100"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  post.timingStatus === "on_time" ? "bg-emerald-400" :
                  post.timingStatus === "delayed" ? "bg-amber-400" :
                  "bg-rose-400"
                }`} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {post.timingStatus === "on_time" && t("timingOnTime")}
                  {post.timingStatus === "delayed" && t("timingDelayed")}
                  {post.timingStatus === "just_missed" && t("timingJustMissed")}
                </span>
              </div>
            )}
          </div>
        )}

        {post.details && (
          <p className={`text-[13px] text-gray-500 leading-relaxed break-words pl-3 border-l-2 border-gray-100 ${language === 'ml' ? 'ml-text' : ''}`}>
            {post.details}
          </p>
        )}
        
        {!hideLink && (
          <div className="flex items-center gap-1 text-[9px] font-bold text-primary/30 uppercase tracking-widest pt-1">
             {t("viewDetails") || "View Full Update"}
             <ChevronRight className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-2 relative min-w-0">
          {/* 1. Community Reaction Summary (Visible to Everyone) */}
          {Object.keys(post.reactions || {}).length > 0 && (
            <div className="flex items-center -space-x-1.5 mr-1 pr-1 border-r border-gray-100 shrink-0">
              {REACTION_TYPES.map(({ type, Icon, color }) => {
                const count = post.reactions?.[type] || 0;
                if (count === 0) return null;
                return (
                  <div 
                    key={type} 
                    className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-full border-2 border-white shadow-sm ring-1 ring-black/5"
                    title={`${count} ${type}`}
                  >
                    <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${color}`} strokeWidth={3} />
                  </div>
                );
              })}
              <span className="text-[9px] sm:text-[10px] font-black text-gray-400 pl-2">
                {Object.values(post.reactions || {}).reduce((a, b) => a + b, 0)}
              </span>
            </div>
          )}
          
          {/* 2. Reaction Action Trigger (Only for non-authors) - UNCHANGED REST OF LOGIC */}
          {/* ... keeping the rest of the reaction button logic inside this div ... */}

          {/* 2. Reaction Action Trigger (Only for non-authors) */}
          {!isAuthor && (
            <>
              {showEmojiPopup && (
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowEmojiPopup(false)}
                />
              )}

              {showEmojiPopup && (
                <div className="absolute bottom-full left-0 mb-2 z-30 flex items-center gap-0.5 bg-white/80 backdrop-blur-xl p-1 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-white/40 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300">
                  <div className="absolute bottom-[-5px] left-6 w-2.5 h-2.5 bg-white/80 rotate-45 border-b border-r border-black/5" />
                  {REACTION_TYPES.map(({ type, Icon, color, label }) => {
                    const count = post.reactions?.[type] || 0;
                    const isActive = activeReaction === type;
                    return (
                      <button
                        key={type}
                        onClick={() => handleReact(type)}
                        disabled={verifying}
                        className={`group relative flex flex-col items-center p-1.5 rounded-xl transition-all active:scale-90 min-w-[52px] ${isActive ? "bg-white shadow-sm ring-1 ring-black/5" : "hover:bg-black/5"}`}
                      >
                        <div className={`transition-transform group-hover:scale-110 ${isActive ? "scale-95" : ""}`}>
                          <Icon 
                            className={`w-6 h-6 ${color}`} 
                            strokeWidth={2.5}
                            fill="currentColor"
                            fillOpacity={0.1}
                          />
                        </div>
                        <span className={`text-[7px] font-black uppercase tracking-tighter mt-1 ${isActive ? color : "text-gray-400"}`}>
                          {t(label)}
                        </span>
                        {count > 0 && (
                          <span className="absolute -top-1 -right-1 text-[7px] font-black text-white bg-gray-900 px-1 rounded-full border border-white min-w-[12px] text-center shadow-sm">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setShowEmojiPopup(!showEmojiPopup)}
                disabled={verifying}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all origin-left active:scale-95 ${activeReaction ? "bg-primary/5 text-primary border border-primary/20" : "bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100/80"}`}
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {activeReaction ? (() => {
                      const config = REACTION_TYPES.find(r => r.type === activeReaction);
                      const Icon = config?.Icon || CheckCircle2;
                      return (
                        <>
                          <Icon className={`w-4 h-4 ${config?.color}`} strokeWidth={2.5} />
                          <span>{t("reacted") || "Reacted"}</span>
                        </>
                      );
                    })() : (
                      <>
                        <SmilePlus className="w-4 h-4 opacity-70" strokeWidth={2.5} />
                        <span>{t("react") || "React"} / {t("verify") || "Verify"}</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </>
          )}

          {/* 3. Empty State for Author (If no reactions) */}
          {isAuthor && Object.keys(post.reactions || {}).length === 0 && (
            <div className="flex items-center gap-2 text-gray-300 px-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">{t("noReactionsYet") || "No reactions"}</span>
            </div>
          )}
        </div>

        {/* 4. Actions: Flag, Delete, Share */}
        <div className="flex items-center gap-1">
          {!isAuthor && (
            <button
              onClick={handleReport}
              disabled={isFlagged || flagging}
              className={`p-2 rounded-xl transition-all ${isFlagged
                  ? "text-red-400 bg-red-50 cursor-not-allowed opacity-50"
                  : "text-gray-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100"
                }`}
              title="Flag Content"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
              title="Delete Content"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          <SharePost post={post} />
        </div>
      </div>
    </article>
  );
};

export default PostCard;
