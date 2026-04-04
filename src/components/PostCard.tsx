"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  doc, deleteDoc, increment, runTransaction, collection, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  MessageSquare, MapPin, Trash2, CheckCircle2, ChevronRight,
  Flame, Handshake, Popcorn, SmilePlus, Loader2, Flag, AlertTriangle, Eye, Lock, Bus, ShieldCheck,
  CheckCircle, RefreshCw, Phone, MessageCircle, AlertCircle
} from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import KarmaNotification from "./KarmaNotification";
import { useLanguage } from "@/context/LanguageContext";
import { useLocationContext } from "@/context/LocationContext"; // Shared singleton location
import { calculateDistance } from "@/lib/anchors"; // Added for proximity calculation
import { useRouter } from "next/navigation";
import SharePost from "./SharePost";
import { useDevice } from "@/hooks/useDevice";
import { useGuestActions } from "@/hooks/useGuestActions";
import ConversionModal from "./ConversionModal";
import { PendingAction } from "@/hooks/useGuestActions";

// ─────────────────────────────────────────────
// Constants (outside component — no re-creation on render)
// ─────────────────────────────────────────────
const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID ?? "YIk8fYx3n9Uwj4ygF4tnwVGFS8p2";

const REACTION_TYPES = [
  { type: "verified" as const, Icon: CheckCircle2, color: "text-emerald-500", glow: "shadow-emerald-500/20", label: "verify" },
  { type: "hot" as const, Icon: Flame, color: "text-orange-500", glow: "shadow-orange-500/20", label: "hot" },
  { type: "helpful" as const, Icon: Handshake, color: "text-emerald-500", glow: "shadow-emerald-500/20", label: "helpful" },
  { type: "interesting" as const, Icon: Popcorn, color: "text-amber-500", glow: "shadow-amber-500/20", label: "interesting" },
] as const;

type ReactionType = (typeof REACTION_TYPES)[number]["type"];

const CATEGORY_CONFIG = {
  Traffic: { pill: "bg-red-50    text-red-600    border-red-100", bar: "bg-red-400", glow: "shadow-red-500/10", gradient: "from-red-50/50", i18n: "categoryTraffic", ml: "ഗതാഗതം" },
  Utility: { pill: "bg-amber-50  text-amber-600  border-amber-100", bar: "bg-amber-400", glow: "shadow-amber-500/10", gradient: "from-amber-50/50", i18n: "categoryUtility", ml: "സേവനങ്ങൾ" },
  Market: { pill: "bg-emerald-50 text-emerald-700 border-emerald-100", bar: "bg-emerald-500", glow: "shadow-emerald-500/10", gradient: "from-emerald-50/50", i18n: "categoryMarket", ml: "ചന്ത" },
  Services: { pill: "bg-teal-50   text-teal-700   border-teal-100", bar: "bg-teal-500", glow: "shadow-teal-500/10", gradient: "from-teal-50/50", i18n: "categoryServices", ml: "സേവനങ്ങൾ" },
  Health: { pill: "bg-rose-50   text-rose-600   border-rose-100", bar: "bg-rose-400", glow: "shadow-rose-500/10", gradient: "from-rose-50/50", i18n: "categoryHealth", ml: "ആരോഗ്യം" },
  Alerts: { pill: "bg-orange-50 text-orange-600 border-orange-100", bar: "bg-orange-500", glow: "shadow-orange-500/10", gradient: "from-orange-50/50", i18n: "categoryAlerts", ml: "അലേർട്ട്" },
  TownTalk: { pill: "bg-purple-50 text-purple-600 border-purple-100", bar: "bg-purple-400", glow: "shadow-purple-500/10", gradient: "from-purple-50/50", i18n: "categoryTownTalk", ml: "നാട്ടുകാര്യം" },
  GigsJobs: { pill: "bg-indigo-50 text-indigo-600 border-indigo-100", bar: "bg-indigo-400", glow: "shadow-indigo-500/10", gradient: "from-indigo-50/50", i18n: "categoryGigsJobs", ml: "ജോലി വിവരങ്ങൾ" },
} as const;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type FirestoreTimestamp = { toDate: () => Date };
type Timestamp = FirestoreTimestamp | string | number | Date;

export interface Post {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhoto?: string;
  headline: string;
  details?: string;
  landmark?: string;
  category: keyof typeof CATEGORY_CONFIG;
  type: "general" | "bus_spott";
  lat: number;
  lng: number;
  authorLat?: number;
  authorLng?: number;
  district?: string;
  localBody?: string;
  verifiedCount: number;
  flagCount: number;
  reactions?: Partial<Record<ReactionType, number>>;
  anchorId?: string | null;
  anchorName?: string | null;
  timingStatus?: "on_time" | "delayed" | "just_missed" | null;
  colorTag?: "red" | "blue" | "green" | "white" | "pink" | "maroon" | "yellow" | "none" | null;
  isHidden: boolean;
  isBusinessPost: boolean;
  authorKarmaAtPost?: number;
  authorRole?: string;
  isOfficial?: boolean;
  trustScore?: number;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  // New Fields
  subType?: string | null;
  urgencyLevel?: "low" | "medium" | "high" | "urgent" | null;
  contactMode?: "whatsapp" | "call" | null;

  contactPhone?: string;
  isResolved?: boolean;
  resolvedAt?: Timestamp;
  reward?: string;
  isInformational?: boolean;
}

interface PostCardProps {
  post: Post;
  initialReactionType?: string;
  isFlagged?: boolean;
  hideLink?: boolean;
}

// ─────────────────────────────────────────────
// Small extracted helpers (keep render clean)
// ─────────────────────────────────────────────
export function toDate(ts: Timestamp): Date {
  if (ts && typeof ts === "object" && "toDate" in ts) return ts.toDate();
  return new Date(ts as string | number | Date);
}

function isWithin15Mins(ts: Timestamp): boolean {
  return Date.now() - toDate(ts).getTime() < 15 * 60 * 1000;
}

function isInternalDirectionKey(val?: string): boolean {
  const v = val?.trim().toLowerCase();
  return v === "to_city" || v === "to_village";
}

const TIMING_STYLES = {
  on_time: "bg-emerald-50 text-emerald-600 border-emerald-100",
  delayed: "bg-amber-50   text-amber-600   border-amber-100",
  just_missed: "bg-rose-50    text-rose-600    border-rose-100",
} as const;

const TIMING_DOT = {
  on_time: "bg-emerald-400",
  delayed: "bg-amber-400",
  just_missed: "bg-rose-400",
} as const;

// ─────────────────────────────────────────────
// Sub-component: Center pop feedback
// ─────────────────────────────────────────────
function CenterPop({ type }: { type: string }) {
  const config = REACTION_TYPES.find(r => r.type === type);
  const Icon = config?.Icon ?? CheckCircle2;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className={`bg-white/95 backdrop-blur-xl w-32 h-32 rounded-full flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.2)] border-2 border-white animate-verification-pop ${config?.glow ?? ""}`}>
        <Icon className={`w-16 h-16 ${config?.color ?? "text-primary"}`} strokeWidth={2.5} fill="currentColor" fillOpacity={0.1} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const PostCard: React.FC<PostCardProps> = ({
  post,
  initialReactionType,
  isFlagged: initialFlagged,
  hideLink = false,
}) => {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const { lat: currentLat, lng: currentLng, isWithinKerala } = useLocationContext(); // Get current user location
  const cardRef = useRef<HTMLDivElement>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [viewed, setViewed] = useState(false);
  const { isDesktop } = useDevice();
  const [showConversionModal, setShowConversionModal] = useState(false);
  const { savePendingAction } = useGuestActions();

  const [activeReaction, setActiveReaction] = useState<string | null>(initialReactionType || null);
  const [isFlagged, setIsFlagged] = useState(initialFlagged || false);
  const [verifying, setVerifying] = useState(false);
  const [freshness, setFreshness] = useState(100);

  // ── Freshness Decay Logic ────────────────────────────────
  useEffect(() => {
    if (post.type !== "bus_spott" || !post.createdAt) return;
    
    const calculateFreshness = () => {
      const created = toDate(post.createdAt).getTime();
      const now = Date.now();
      const ageMins = (now - created) / (60 * 1000);
      const percent = Math.max(0, 100 - (ageMins / 20) * 100); // 20m decay
      setFreshness(percent);
    };

    calculateFreshness();
    const timer = setInterval(calculateFreshness, 15000); // 15s refresh
    return () => clearInterval(timer);
  }, [post.createdAt, post.type]);

  // ── Impression Tracking (View Count) ────────────────────────
  useEffect(() => {
    if (!post?.id || viewed) return;

    // Check if already viewed in this session
    const sessionViews = JSON.parse(sessionStorage.getItem("nattufeed_views") || "[]");
    if (sessionViews.includes(post.id)) {
      setViewed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // If user stays for 2 seconds, count as a view
          viewTimerRef.current = setTimeout(async () => {
            try {
              const postRef = doc(db, "posts", post.id);
              await updateDoc(postRef, {
                viewCount: increment(1)
              });

              // Mark as viewed locally
              const updatedViews = [...sessionViews, post.id];
              sessionStorage.setItem("nattufeed_views", JSON.stringify(updatedViews));
              setViewed(true);
            } catch (err) {
              console.error("View tracking failed:", err);
            }
          }, 2000);
        } else {
          // User scrolled away – cancel the scheduled view increment
          if (viewTimerRef.current) {
            clearTimeout(viewTimerRef.current);
            viewTimerRef.current = null;
          }
        }
      },
      { threshold: 0.8 } // Card must be 80% visible
    );

    if (cardRef.current) observer.observe(cardRef.current);

    console.log(`View tracking active for post: ${post.id}`);

    return () => {
      observer.disconnect();
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
    };
  }, [post?.id, viewed]);

  const [deleting, setDeleting] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [showKarmaPop, setShowKarmaPop] = useState(false);
  const [showEmojiPopup, setShowEmojiPopup] = useState(false);
  const [centerPop, setCenterPop] = useState<string | null>(null);

  // Double-tap: use a ref so we don't trigger re-renders on every tap
  const lastTapRef = useRef(0);

  const isAuthor = user?.uid === post.authorId;
  const isSuperAdmin = user?.uid === ADMIN_UID;
  const canDelete = isAuthor || isSuperAdmin;
  const catConfig = CATEGORY_CONFIG[post.category] ?? CATEGORY_CONFIG.Traffic;

  const totalReactions = Object.values(post.reactions ?? {}).reduce((a, b) => a + b, 0);
  const hasReactions = totalReactions > 0;

  // ── Determine if detail page has unique content worth visiting ──
  // Suppress navigation & link when the page would feel empty.
  // Details must be long enough (> 120 chars) to add value beyond what the card already shows.
  const DETAILS_MIN_CHARS = 120;
  const hasRichDetail = (
    !!(post.details && !isInternalDirectionKey(post.details) && post.details.trim().length > DETAILS_MIN_CHARS)
    || post.type === "bus_spott"
    || !!(post.contactPhone)
    || !!(post.subType)
    || post.urgencyLevel === "high"
    || post.urgencyLevel === "urgent"
  );

  // Sync external prop changes
  useEffect(() => {
    setIsFlagged(initialFlagged || false);
    setActiveReaction(initialReactionType || null);
  }, [initialReactionType, initialFlagged]);

  // Format relative time
  const formatTime = (ts: Timestamp): string => {
    if (!ts) return t("justNow");
    const seconds = Math.floor((Date.now() - toDate(ts).getTime()) / 1000);
    if (seconds < 60) return t("justNow");
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return t("ago", { time: `${mins}m` });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("ago", { time: `${hours}h` });
    return toDate(ts).toLocaleDateString(language === "ml" ? "ml-IN" : "en-US");
  };

  // ── Legacy Direction Helper ────────────────────────
  const getDisplayHeadline = () => {
    const raw = post.headline || "";
    // If it's a legacy post with a technical key or empty headline
    if (isInternalDirectionKey(post.details) && (!raw || raw.includes("to_") || raw.includes("TO_"))) {
      const isIntercity = post.colorTag === "yellow" || post.colorTag === "red" || post.colorTag === "maroon";
      
      if (post.details === "to_city") {
        return isIntercity ? (t("snapHeadingMajorDist") || "Major District") : (t("towardsTown") || "Towards Town");
      }
      return isIntercity ? (t("snapHeadingReturnRoute") || "Return Route") : (t("towardsVillage") || "Towards Village");
    }
    return raw;
  };

  // Format large numbers (e.g., 1200 -> 1.2k)
  const formatNumber = (num: number): string => {
    if (!num) return "0";
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  };

  // ── Reaction handler ────────────────────────
  const handleReact = async (type: string) => {
    if (!user) {
      // Phase 3: Guest Mode - Store and Convert
      savePendingAction({
        type: "verify",
        postId: post.id,
        reactionType: type
      } as PendingAction);
      setShowConversionModal(true);
      return;
    }
    
    if (verifying || !post?.id || !post?.authorId) return;

    // 🛡️ Bus Radar Witness Lock (Mobile Only for high-trust transit reports)
    if (type === "verified" && post.type === "bus_spott" && isDesktop && !isSuperAdmin) {
      showToast(t("mobileOnlyVerification") || "Witnessing is for neighbors on the move! Please use your mobile to verify. 🤳", "warning");
      return;
    }

    // 🛡️ Witness Zone Lock (200m) for high-trust reactions
    const isStationaryReaction = type === "verified";

    // 🛡️ Global Kerala Guard for high-trust reactions
    if (isStationaryReaction && !isWithinKerala) {
      showToast(t("keralaOnlyReaction") || "Witnessing is local-only for now! Join the talk from Kerala. 🌴", "warning");
      return;
    }

    if (isStationaryReaction && post.type === "bus_spott") {
      if (!currentLat || !currentLng) {
        showToast(t("locationRequired") || "Location required to verify.", "error");
        return;
      }
      const dist = calculateDistance(currentLat, currentLng, post.lat, post.lng);
      if (dist > 200) {
        showToast(t("tooFarToVerify") || "Are you near the bus? Move a bit closer to verify this snap! 🚌", "warning");
        return;
      }
    }

    const isRemoving = activeReaction === type;
    const isSwitching = !!activeReaction && activeReaction !== type;

    setVerifying(true);
    try {
      const verificationRef = doc(db, "verifications", `${post.id}_${user.uid}`);
      const postRef = doc(db, "posts", post.id);
      const userRef = doc(db, "users", user.uid);
      const authorRef = doc(db, "users", post.authorId);

      await runTransaction(db, async (tx) => {
        const postSnap = await tx.get(postRef);
        const data = postSnap.data() ?? {};
        const reactions = data.reactions ?? {};
        const currentVerifiedCount = data.verifiedCount ?? 0;

        const isVerifiedUpdate = type === "verified";
        const wasVerifiedUpdate = activeReaction === "verified";

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
            [`reactions.${activeReaction}`]: Math.max(0, (reactions[activeReaction!] ?? 0) - 1),
            [`reactions.${type}`]: increment(1),
          });

          // Switch Karma if verified is involved
          if (wasVerifiedUpdate && !isVerifiedUpdate) {
            tx.update(authorRef, { karmaTotal: increment(-1), karmaWeekly: increment(-1) });
          } else if (!wasVerifiedUpdate && isVerifiedUpdate) {
            tx.update(authorRef, { karmaTotal: increment(1), karmaWeekly: increment(1) });
          }

        } else {
          tx.set(verificationRef, { postId: post.id, userId: user.uid, type, createdAt: new Date() });
          tx.update(postRef, {
            ...(isVerifiedUpdate ? { verifiedCount: increment(1) } : {}),
            [`reactions.${type}`]: increment(1),
          });
          if (isVerifiedUpdate) {
            tx.update(authorRef, { karmaTotal: increment(1), karmaWeekly: increment(1) });
          }
        }
      });

      if (isRemoving) {
        setActiveReaction(null);
      } else {
        setActiveReaction(type);
        if (!isSwitching) {
          setShowKarmaPop(true);
          setCenterPop(type);
          setTimeout(() => setCenterPop(null), 1000);
        }
      }
      setShowEmojiPopup(false);
    } catch (err) {
      console.error("Reaction failed:", err);
      showToast(t("verifyFail"), "error");
    } finally {
      setVerifying(false);
    }
  };

  // ── Report handler ──────────────────────────
  const handleReport = () => {
    if (!user || isFlagged) return;
    showToast(t("reportSpam"), "info", { action: { label: t("confirm"), onClick: submitReport } });
  };

  const submitReport = async () => {
    if (!user || flagging) return;
    setFlagging(true);
    try {
      await runTransaction(db, async (tx) => {
        const postRef = doc(db, "posts", post.id);
        const snap = await tx.get(postRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const flags = (data.flagCount ?? 0) + 1;
        const verified = data.verifiedCount ?? 0;

        tx.set(doc(db, "flags", `${post.id}_${user.uid}`), { postId: post.id, userId: user.uid, createdAt: new Date() });
        tx.update(postRef, {
          flagCount: increment(1),
          isHidden: flags >= 5 || (flags >= 3 && verified <= 2),
        });
      });
      setIsFlagged(true);
      showToast(t("reportSuccess"), "success");
    } catch (err) {
      console.error("Report failed:", err);
      showToast(t("reportFail"), "error");
    } finally {
      setFlagging(false);
    }
  };

  // ── Delete handler ──────────────────────────
  const handleDelete = () => {
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

  // ── Resolution handler ───────────────────────
  const [resolving, setResolving] = useState(false);
  const handleResolution = async (type: "resolve" | "refresh") => {
    if (!user || resolving || !isAuthor) return;
    setResolving(true);
    try {
      const postRef = doc(db, "posts", post.id);
      const userRef = doc(db, "users", user.uid);
      const karmaAmount = type === "resolve" ? 5 : 1;

      await runTransaction(db, async (tx) => {
        if (type === "resolve") {
          tx.update(postRef, { 
            isResolved: true, 
            resolvedAt: serverTimestamp() 
          });
        } else {
          tx.update(postRef, { 
            createdAt: serverTimestamp() 
          });
        }
        tx.update(userRef, {
          karmaTotal: increment(karmaAmount),
          karmaWeekly: increment(karmaAmount),
        });
      });

      showToast(
        type === "resolve" ? t("markResolved") : t("stillOngoing"), 
        "success"
      );
      setShowKarmaPop(true);
    } catch (err) {
      console.error("Resolution failed:", err);
      showToast("Failed to update status", "error");
    } finally {
      setResolving(false);
    }
  };

  // ── Double-tap to verify, single-tap to navigate ──
  // Using a ref prevents stale closures and avoids re-renders on every tap
  const handleContentClick = () => {
    if (hideLink || !hasRichDetail) return; // Don't navigate if detail page would be empty
    const now = Date.now();
    const DELAY = 300;

    if (now - lastTapRef.current < DELAY) {
      // Double tap — verify in place
      if (!activeReaction && !isAuthor) {
      if (post.type === "bus_spott" && isDesktop && !isSuperAdmin) {
        showToast(t("mobileOnlyVerification") || "Witnessing is for neighbors on the move! Please use your mobile to verify. 🤳", "warning");
      } else {
        handleReact("verified");
      }
      }
    } else {
      // Single tap — navigate after delay (only if no second tap follows)
      const tapTime = now;
      setTimeout(() => {
        if (Date.now() - tapTime >= DELAY) router.push(`/post/${post.id}`);
      }, DELAY);
    }

    lastTapRef.current = now;
  };

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (hideLink || !hasRichDetail) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(`/post/${post.id}`);
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <article
      ref={cardRef}
      aria-labelledby={`post-title-${post.id}`}
      className={`
        relative bg-white rounded-[24px] sm:rounded-[28px] p-3 sm:p-4
        border border-gray-100/50 mb-3 isolate group
        transition-all duration-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.03)]
        premium-shadow ${catConfig.glow}
      `}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden rounded-[28px] sm:rounded-[32px] pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-br ${catConfig.gradient} to-transparent opacity-30 transition-opacity group-hover:opacity-40`} />
        {post.isResolved ? (
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 opacity-60" />
        ) : (
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${catConfig.bar} opacity-60`} />
        )}
      </div>

      {centerPop && <CenterPop type={centerPop} />}
      <KarmaNotification isVisible={showKarmaPop} onComplete={() => setShowKarmaPop(false)} />

      {/* ══════════════════════════════════════
          SECTION 1 — Author row
      ══════════════════════════════════════ */}
      <div className="flex items-center gap-2 mb-2">
        <ProfileAvatar
          src={post.authorPhoto}
          name={post.authorName}
          size="sm"
          border={false}
          className="rounded-lg shrink-0"
        />

        <div className="min-w-0 flex-1">
          {/* Name + LIVE badge + category pill */}
          <div className="flex items-center gap-1.5 mb-0 flex-wrap">
            <p className="text-[11px] sm:text-xs font-black text-gray-900 uppercase tracking-tight leading-none truncate">
              {post.authorName || t("citizen")}
            </p>

            {post.isOfficial && (
              <span className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-100 animate-in fade-in duration-700">
                <ShieldCheck size={8} className="fill-emerald-600/10" />
                <span className="text-[7px] font-black uppercase tracking-[0.15em] leading-none">Official</span>
              </span>
            )}

            {/* Author Role Badge hidden for now */}


            {isWithin15Mins(post.createdAt) && (post.category !== "Alerts" || (post.trustScore ?? 0) >= 1 || (post.verifiedCount ?? 0) >= 2) && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-600 text-[8px] font-black text-white uppercase tracking-widest animate-pulse shadow-sm shadow-red-500/20 shrink-0">
                <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                LIVE
              </span>
            )}
            <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0 ${catConfig.pill}`}>
              {language === "ml" ? catConfig.ml : t(catConfig.i18n)}
            </span>

            {post.isResolved && !post.isInformational && (
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-100 shadow-sm animate-in zoom-in-95">
                <CheckCircle2 size={10} className="fill-emerald-600/10" />
                <span className="text-[8px] font-black uppercase tracking-[0.1em]">{t("resolvedBadge") || "Resolved"}</span>
              </span>
            )}

            {/* Minimal View Count - Top Right (Commented out for now)
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest px-1 shrink-0 ml-auto opacity-70">
              <Eye className="w-3 h-3 opacity-60" strokeWidth={3} />
              {formatNumber((post as any).viewCount || 0)}
            </span>
            */}
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0 mt-0.5">
            <time
              className="text-[9px] text-gray-400 font-black uppercase tracking-widest shrink-0"
              dateTime={toDate(post.createdAt).toISOString()}
            >
              {formatTime(post.createdAt)}
            </time>
          </div>
        </div>

        {/* Freshness Hub / Radar Pulse */}
        {post.type === "bus_spott" && (
          <div className="ml-auto relative w-10 h-10 flex items-center justify-center">
            {/* Decay Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="20" cy="20" r="18"
                className="stroke-gray-100 fill-none"
                strokeWidth="2.5"
              />
              <circle
                cx="20" cy="20" r="18"
                className={`fill-none transition-all duration-1000 ${freshness > 50 ? "stroke-emerald-500" : freshness > 20 ? "stroke-amber-400" : "stroke-rose-500"}`}
                strokeWidth="2.5"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * freshness) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className={`
              w-7 h-7 rounded-full flex items-center justify-center relative
              ${freshness > 0 ? "animate-pulse" : "opacity-30"}
              ${freshness > 50 ? "bg-emerald-50 text-emerald-600" : freshness > 20 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"}
            `}>
              <Bus className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          SECTION 2 — Content body (clickable)
      ══════════════════════════════════════ */}
      <div
        className={`space-y-1 mb-3 transition-opacity select-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${!hideLink && hasRichDetail ? "cursor-pointer active:opacity-70" : ""}`}
        onClick={handleContentClick}
        onKeyDown={handleContentKeyDown}
        role={!hideLink && hasRichDetail ? "button" : undefined}
        tabIndex={!hideLink && hasRichDetail ? 0 : -1}
        aria-label={!hideLink && hasRichDetail ? t("viewDetails") : undefined}
      >
        <h3
          id={`post-title-${post.id}`}
          className={`text-[15px] sm:text-base font-black text-gray-900 leading-tight tracking-tight break-words ${language === "ml" ? "ml-text" : ""}`}
        >
          {getDisplayHeadline()}
        </h3>

        {/* Landmark */}
        {post.landmark && (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-md border border-gray-100">
            <MapPin className="w-2.5 h-2.5 text-primary/60 shrink-0" />
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">{post.landmark}</span>
          </div>
        )}

        {/* Bus radar: anchor + timing */}
        {post.type === "bus_spott" && (post.anchorName || post.timingStatus) && (
          <div className="flex flex-wrap gap-1">
            {post.anchorName && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 border border-primary/10 rounded-md">
                <MapPin className="w-2.5 h-2.5 text-primary shrink-0" />
                <span className="text-[10px] font-bold text-primary italic uppercase tracking-wider">
                  {t("atStop", { stop: post.anchorName })}
                </span>
              </div>
            )}
            {post.timingStatus && (
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${TIMING_STYLES[post.timingStatus]}`}>
                <span className={`w-1 h-1 rounded-full shrink-0 ${TIMING_DOT[post.timingStatus]}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {post.timingStatus === "on_time" && t("timingOnTime")}
                  {post.timingStatus === "delayed" && t("timingDelayed")}
                  {post.timingStatus === "just_missed" && t("timingJustMissed")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Specialized Metadata Chips */}
        {(post.subType || post.urgencyLevel || post.reward) && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {post.subType && (
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                post.category === 'GigsJobs' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {t(`subType${post.subType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`) || post.subType}
              </span>
            )}
            {post.reward && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                <Flame size={8} className="fill-emerald-700/10" />
                {post.reward}
              </span>
            )}
            {post.urgencyLevel && (
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${
                post.urgencyLevel === 'urgent' ? 'bg-red-50 text-red-600 border-red-100' : 
                post.urgencyLevel === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                <AlertCircle size={8} />
                {t(`urgency${post.urgencyLevel.charAt(0).toUpperCase() + post.urgencyLevel.slice(1)}`) || post.urgencyLevel}
              </span>
            )}
          </div>
        )}

        {/* Contact info for active help posts and general info */}
        {post.contactMode && (!post.isResolved || post.isInformational) && (
          <div className="mt-2 flex items-center gap-2">
            <a 
              href={post.contactMode === 'call' ? `tel:${post.contactPhone}` : `https://wa.me/${post.contactPhone?.replace(/\s/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary rounded-xl border border-primary/20 transition-all hover:bg-primary/10 active:scale-95 group/contact"
            >
              {post.contactMode === 'whatsapp' ? <MessageCircle size={14} /> : <Phone size={14} />}
              <span className="text-[10px] font-black uppercase tracking-widest">
                {post.contactMode === 'whatsapp' ? t("modeWhatsapp") : t("modeCall")}
                {post.contactPhone && <span className="ml-1 opacity-50 font-bold">{post.contactPhone}</span>}
              </span>
            </a>
          </div>
        )}

        {/* Body text (skip internal direction keys) */}
        {post.details && !isInternalDirectionKey(post.details) && (
          <p className={`text-sm text-gray-600/80 leading-relaxed break-words pl-4 border-l-2 border-gray-200/50 ${language === "ml" ? "ml-text font-medium" : "font-medium"}`}>
            {post.details}
          </p>
        )}

        {/* Only show "View Full Update" when the detail page has meaningful content */}
        {!hideLink && hasRichDetail && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-primary/30 uppercase tracking-widest pt-0.5">
            {t("viewDetails") || "View Full Update"}
            <ChevronRight className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Author Resolution Bar */}
      {isAuthor && !post.isResolved && ["Health", "Services", "Utility", "GigsJobs"].includes(post.category) && (
        <div className="mb-3 p-2 bg-primary/[0.03] rounded-2xl border border-primary/10 flex items-center justify-between gap-2 animate-in slide-in-from-bottom-2 duration-500 delay-300">
          <div className="pl-1">
            <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{t("authorActionTitle") || "Update Status"}</p>
          </div>
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => { e.stopPropagation(); handleResolution("refresh"); }}
              disabled={resolving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100 shadow-sm transition-all hover:border-primary/20 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={10} className={resolving ? "animate-spin" : ""} />
              {t("stillOngoing")}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleResolution("resolve"); }}
              disabled={resolving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle size={10} />
              {post.category === "GigsJobs" ? t("markAsFilled") : t("markResolved")}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          SECTION 3 — Footer
      ══════════════════════════════════════ */}
      <div className="border-t border-gray-50 pt-2 flex items-center justify-between gap-2">

        {/* Row A — Reactions */}
        <div className="flex items-center gap-2 relative min-w-0">

          {/* Reaction summary bubbles */}
          {hasReactions && (
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex -space-x-1.5">
                {REACTION_TYPES.map(({ type, Icon, color }) => {
                  const count = post.reactions?.[type] ?? 0;
                  if (!count) return null;
                  return (
                    <div
                      key={type}
                      className="w-6 h-6 bg-white rounded-full border-2 border-white shadow-sm ring-1 ring-black/5 flex items-center justify-center"
                      title={`${count} ${type}`}
                    >
                      <Icon className={`w-3 h-3 ${color}`} strokeWidth={3} />
                    </div>
                  );
                })}
              </div>
              <span className="text-[10px] font-black text-gray-400">{totalReactions}</span>
            </div>
          )}

          {/* Reaction trigger button (non-authors only) */}
          {!isAuthor && (
            <div className="relative flex-1">
              {/* Backdrop for popup dismiss */}
              {showEmojiPopup && (
                <div className="fixed inset-0 z-20" onClick={() => setShowEmojiPopup(false)} />
              )}

              {/* Reaction picker popup */}
              {showEmojiPopup && (
                <div className="absolute bottom-full left-0 mb-3 z-40 flex items-center gap-1 glass-panel p-1.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/60 animate-in fade-in zoom-in slide-in-from-bottom-3 duration-300">
                  <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white/40 backdrop-blur-md rotate-45 border-b border-r border-white/20" />
                  {REACTION_TYPES.map(({ type, Icon, color, label }) => {
                    const count = post.reactions?.[type] ?? 0;
                    const isActive = activeReaction === type;
                    const isLocked = (type === "verified" && post.type === "bus_spott") && (isDesktop || (!isWithinKerala && currentLat !== null));

                    return (
                      <button
                        key={type}
                        onClick={() => handleReact(type)}
                        disabled={verifying}
                        className={`relative flex flex-col items-center p-2 rounded-xl transition-all active:scale-90 min-w-[52px] ${isActive ? "bg-white shadow-sm ring-1 ring-black/5" : "hover:bg-black/5"} ${isLocked ? "opacity-40" : ""}`}
                      >
                        {isLocked && (
                          <div className="absolute top-1 right-1 z-10">
                            <Lock className="w-2.5 h-2.5 text-gray-400" />
                          </div>
                        )}
                        <Icon
                          className={`w-6 h-6 ${color} transition-transform ${isActive ? "scale-95" : "hover:scale-110"}`}
                          strokeWidth={2.5}
                          fill="currentColor"
                          fillOpacity={0.1}
                        />
                        <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${isActive ? color : "text-gray-400"}`}>
                          {t(label)}
                        </span>
                        {count > 0 && (
                          <span className="absolute -top-1 -right-1 text-[9px] font-black text-white bg-gray-900 px-1 rounded-full border border-white min-w-[14px] text-center shadow-sm">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Trigger */}
              <button
                id="me-too-action"
                onClick={() => setShowEmojiPopup(v => !v)}
                disabled={verifying}
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black
                  uppercase tracking-wider transition-all active:scale-95
                  ${activeReaction
                    ? "bg-primary/5 text-primary border border-primary/20"
                    : "bg-gray-50 text-gray-400 border border-transparent hover:bg-gray-100"}
                `}
              >
                {verifying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : activeReaction ? (
                  (() => {
                    const cfg = REACTION_TYPES.find(r => r.type === activeReaction);
                    const Icon = cfg?.Icon ?? CheckCircle2;
                    return (
                      <>
                        <Icon className={`w-3.5 h-3.5 ${cfg?.color} shrink-0`} strokeWidth={2.5} />
                        <span>{t("reacted")}</span>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <SmilePlus className="w-3.5 h-3.5 opacity-70 shrink-0" strokeWidth={2.5} />
                    <span>{t("verify")}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Author — no reactions yet */}
          {isAuthor && !hasReactions && (
            <div className="flex items-center gap-2 text-gray-300 px-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">{t("noReactionsYet")}</span>
            </div>
          )}
        </div>

        {/* Action Row — Secondary actions */}
        <div className="flex items-center justify-end gap-0.5 shrink-0">
          {!isAuthor && (
            <button
              onClick={handleReport}
              disabled={isFlagged || flagging}
              aria-label={t("reportSpam")}
              title="Flag Content"
              className={`
                p-1.5 rounded-lg transition-all border
                ${isFlagged
                  ? "text-red-400 bg-red-50 border-red-100 cursor-not-allowed opacity-50"
                  : "text-gray-300 border-transparent hover:text-red-500 hover:bg-red-50 hover:border-red-100"}
              `}
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label={t("delete")}
              title="Delete Content"
              className="p-1.5 text-gray-300 border border-transparent hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <SharePost post={post} />
        </div>

      </div>
      {/* Conversion Modal for Guests */}
      <ConversionModal 
        isOpen={showConversionModal} 
        onClose={() => setShowConversionModal(false)}
        actionType={post.type === "bus_spott" ? "verify" : "post"}
        karmaAmount={1}
      />
    </article>
  );
};

export default PostCard;