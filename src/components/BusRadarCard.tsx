"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  doc, increment, runTransaction, collection, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { useLocationContext } from "@/context/LocationContext";
import {
  Bus, Navigation, CheckCircle2, MapPin, Clock,
  ArrowRight, ArrowLeft, ChevronRight, Trash2, Flag,
} from "lucide-react";
import KarmaNotification from "./KarmaNotification";
import { useRouter } from "next/navigation";
import SharePost from "./SharePost";
import ProfileAvatar from "./ProfileAvatar";
import { getVerifiedAnchors, calculateDistance, Anchor } from "@/lib/anchors";
import { Post, toDate } from "./PostCard";
import { useDevice } from "@/hooks/useDevice";
import { useGuestActions } from "@/hooks/useGuestActions";
import ConversionModal from "./ConversionModal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface BusRadarCardProps {
  post: Post;
  initialReactionType?: string;
  isFlagged?: boolean;
  hideLink?: boolean;
  isSuperAdmin?: boolean;
}

// ─────────────────────────────────────────────
// Helpers (extracted from render for clarity)
// ─────────────────────────────────────────────
type ColorMeta = { pulse: string; bg: string; dot: string; label: string };

function getColorMeta(tag: string | null | undefined, t: (k: string) => string): ColorMeta {
  switch (tag) {
    case "red": 
    case "yellow":
      return { pulse: "bg-red-500", bg: "bg-red-50", dot: "bg-red-400", label: t("busCategoryKSRTC") || "KSRTC" };
    
    case "blue": 
    case "green": 
    case "pink":
    case "maroon":
      return { pulse: "bg-sky-500", bg: "bg-sky-50", dot: "bg-sky-400", label: t("busCategoryPrivate") || "Private" };
    
    case "white": 
      return { pulse: "bg-gray-400", bg: "bg-gray-100", dot: "bg-gray-300", label: t("busCategoryKSRTC") || "KSRTC" };
    
    default: 
      return { pulse: "bg-primary", bg: "bg-primary/5", dot: "bg-primary/40", label: t("bus") || "Bus" };
  }
}

type RadarPhase = "live" | "recent" | "history";

function getRadarPhase(minsSince: number): RadarPhase {
  if (minsSince <= 8) return "live";
  if (minsSince <= 20) return "recent";
  return "history";
}

const PHASE_STYLES: Record<RadarPhase, { wrapper: string; badge: string; dot: string; text: string; clock: string }> = {
  live: { wrapper: "bg-emerald-50/80 border-emerald-100", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500 animate-pulse", text: "text-gray-700", clock: "text-emerald-500" },
  recent: { wrapper: "bg-amber-50/80   border-amber-100", badge: "bg-amber-100   text-amber-700", dot: "", text: "text-gray-700", clock: "text-amber-500" },
  history: { wrapper: "bg-gray-50/80    border-gray-200", badge: "bg-gray-100    text-gray-500", dot: "", text: "text-gray-500", clock: "text-gray-400" },
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const BusRadarCard: React.FC<BusRadarCardProps> = ({
  post,
  initialReactionType,
  isFlagged: initialFlagged,
  hideLink = false,
  isSuperAdmin = false,
}) => {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { lat: userLat, lng: userLng, accuracy } = useLocationContext();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const { isDesktop } = useDevice();
  const [showConversionModal, setShowConversionModal] = useState(false);
  const { savePendingAction } = useGuestActions();

  const [isVerified, setIsVerified] = useState(!!initialReactionType);
  const [isFlagged, setIsFlagged] = useState(initialFlagged || false);
  const [verifying, setVerifying] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [showKarmaPop, setShowKarmaPop] = useState(false);
  const [timeLeftPerc, setTimeLeftPerc] = useState(100);
  const [anchors, setAnchors] = useState<Anchor[]>([]);

  const isDev = process.env.NODE_ENV === 'development';
  const isAdmin = user?.uid === (process.env.NEXT_PUBLIC_ADMIN_UID || "YIk8fYx3n9Uwj4ygF4tnwVGFS8p2") || isDev;
  const effectiveAdmin = isSuperAdmin || isAdmin;

  // Fetch verified anchors once
  useEffect(() => { getVerifiedAnchors().then(setAnchors); }, []);

  // Sync external prop changes (e.g. list re-render)
  useEffect(() => {
    setIsVerified(!!initialReactionType);
    setIsFlagged(initialFlagged || false);
  }, [initialReactionType, initialFlagged]);

  // Countdown timer (30-min decay)
  useEffect(() => {
    if (!post.createdAt) return;
    const start = toDate(post.createdAt).getTime();
    const expiry = start + 30 * 60_000;

    const tick = () => {
      const remaining = expiry - Date.now();
      setTimeLeftPerc(Math.max(0, (remaining / (30 * 60_000)) * 100));
    };

    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [post.createdAt]);

  // Distance from user to post
  const distance = useMemo(() => {
    if (userLat === null || userLng === null) return null;
    return calculateDistance(userLat, userLng, post.lat, post.lng);
  }, [userLat, userLng, post.lat, post.lng]);

  // Nearest verified anchor (within 500 m)
  const nearestAnchor = useMemo(() => {
    if (!userLat || !userLng || anchors.length === 0) return null;
    const sorted = [...anchors].sort(
      (a, b) => calculateDistance(userLat, userLng, a.lat, a.lng) - calculateDistance(userLat, userLng, b.lat, b.lng),
    );
    const closest = sorted[0];
    return calculateDistance(userLat, userLng, closest.lat, closest.lng) <= 500 ? closest : null;
  }, [userLat, userLng, anchors]);

  const isWithinRange = (distance !== null && distance <= 500) || nearestAnchor !== null || effectiveAdmin;
  const isExpired = timeLeftPerc <= 0;
  const isAuthor = user?.uid === post.authorId;
  const colorMeta = getColorMeta(post.colorTag, t);

  const minsSince = Math.round(30 - (30 * timeLeftPerc) / 100);
  const phase = getRadarPhase(minsSince);
  const phaseStyle = PHASE_STYLES[phase];

  const phaseLabel =
    phase === "live" ? t("radarLive")
      : phase === "recent" ? (language === "ml" ? "കുറച്ച് മുൻപ്" : "Recent")
        : (language === "ml" ? "അര മണിക്കൂർ മുൻപ്" : "History");

  const timeLabel = minsSince === 0 ? t("justNow") : t("minsAgo", { mins: String(minsSince) });

  // ── Distance display ──────────────────────────────────
  const distanceLabel = (() => {
    if (distance === null) return "--";
    if (accuracy && accuracy > 3000 && distance > accuracy) return t("locating") || "Locating…";
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;
  })();

  // ── Progress bar colour ───────────────────────────────
  const progressColour =
    timeLeftPerc > 66 ? "bg-emerald-500/80"
      : timeLeftPerc > 33 ? "bg-amber-500/80"
        : "bg-gray-300/80";

  // ─────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────
  const handleVerify = async () => {
    if (!user) {
      // Phase 3: Guest Mode - Store and Convert
      savePendingAction({
        type: "verify",
        postId: post.id,
        reactionType: "verified"
      });
      setShowConversionModal(true);
      return;
    }
    if (isVerified || verifying) return;
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
        const postDoc = await tx.get(postRef);
        if (!postDoc.exists()) return;
        const postData = postDoc.data();

        let updateData: Record<string, unknown> = { verifiedCount: increment(1) };

        if (nearestAnchor && nearestAnchor.id !== post.anchorId) {
          const distCovered = calculateDistance(postData.lat, postData.lng, nearestAnchor.lat, nearestAnchor.lng);
          const timeDeltaSeconds = (Date.now() - postData.createdAt.toDate().getTime()) / 1000;
          const speedKph = (distCovered / 1000) / (timeDeltaSeconds / 3600);
          const isGhostSnap = timeLeftPerc < 8;

          if (speedKph < 80 && !isGhostSnap) {
            updateData = {
              ...updateData,
              anchorId: nearestAnchor.id,
              anchorName: nearestAnchor.name,
              lat: nearestAnchor.lat,
              lng: nearestAnchor.lng,
              createdAt: serverTimestamp(),
              expiresAt: new Date(Date.now() + 30 * 60_000),
            };
          } else if (speedKph < 80 && isGhostSnap) {
            showToast("Bus is nearly at destination (History mode)", "info");
          }
        }

        tx.set(verificationRef, { postId: post.id, userId: user.uid, createdAt: new Date() });
        tx.update(postRef, updateData);
        tx.update(userRef, { karmaTotal: increment(2), karmaWeekly: increment(2) });
        tx.update(doc(db, "users", post.authorId), { karmaTotal: increment(1), karmaWeekly: increment(1) });
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

  const handleReport = () => {
    if (!user || isFlagged) return;
    showToast(t("reportSpam"), "info", { action: { label: t("confirm"), onClick: submitReport } });
  };

  const submitReport = async () => {
    if (!user || flagging) return;
    setFlagging(true);
    try {
      const flagRef = doc(db, "flags", `${post.id}_${user.uid}`);
      const postRef = doc(db, "posts", post.id);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(postRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const currentFlags = (data.flagCount || 0) + 1;
        const currentVeri = data.verifiedCount || 0;

        tx.set(flagRef, { postId: post.id, userId: user.uid, createdAt: new Date() });
        tx.update(postRef, {
          flagCount: increment(1),
          isHidden: currentFlags >= 5 || (currentFlags >= 3 && currentVeri <= 2),
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

  const submitDelete = async () => {
    try {
      await runTransaction(db, async (tx) => tx.delete(doc(db, "posts", post.id)));
      showToast(t("deleteSuccess"), "success");
    } catch (err) {
      console.error("Deletion failed:", err);
      showToast(t("deleteFail"), "error");
    }
  };

  const handleDelete = () => {
    showToast(
      isSuperAdmin ? t("adminDeleteConfirm") : t("deleteConfirm"),
      "warning",
      { action: { label: t("delete"), onClick: submitDelete } },
    );
  };

  const onVerifyPress = () => {
    if (isDesktop && !effectiveAdmin) {
      showToast(t("mobileOnlyFeature") || "Witness verification is mobile-only.", "warning");
      return;
    }

    if (post.details === "to_city" || post.details === "to_village") {
      showToast(
        `${t("confirm")} ${post.colorTag || ""} ${t("busRadarMode")} ${post.details === "to_city" ? t("towardsCity") : t("towardsVillage")}?`,
        "info",
        { action: { label: t("verify"), onClick: handleVerify } },
      );
    } else {
      handleVerify();
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div
      className={`
        relative overflow-hidden bg-white rounded-3xl border border-gray-100
        shadow-sm transition-all duration-500 group
        ${isExpired ? "opacity-60 grayscale-[0.3]" : ""}
      `}
    >
      {/* ── Decay progress bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
        <div
          className={`h-full transition-all duration-1000 ${progressColour}`}
          style={{ width: `${timeLeftPerc}%` }}
        />
      </div>

      <KarmaNotification isVisible={showKarmaPop} onComplete={() => setShowKarmaPop(false)} />

      <div className="p-4 sm:p-5">

        {/* ══════════════════════════════════════════
            SECTION 1 — Bus icon · Route name · Phase
        ═══════════════════════════════════════════ */}
        <div className="flex items-start gap-3 sm:gap-4 mb-4">

          {/* Bus icon */}
          <div
            className={`
              relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center
              border border-primary/10 shadow-sm shrink-0
              transition-transform group-hover:scale-105 duration-300
              ${colorMeta.bg}
            `}
          >
            <Bus className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            {post.colorTag && post.colorTag !== "none" && (
              <span
                className={`
                  absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full
                  border-2 border-white shadow ${colorMeta.pulse} animate-pulse
                `}
              />
            )}
          </div>

          {/* Route name + type badge + phase pill */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <h3
                className={`
                  text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-tight truncate
                  ${language === "ml" ? "ml-text" : ""}
                `}
              >
                {post.headline || "Bus"}
              </h3>
              {post.colorTag && post.colorTag !== "none" && (
                <span
                  className={`
                    px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-widest
                    ${colorMeta.pulse} text-white shadow-sm shrink-0 border border-white/20
                  `}
                >
                  {colorMeta.label}
                </span>
              )}
            </div>

            {/* Phase pill */}
            <div
              className={`
                inline-flex items-center gap-2 border rounded-xl px-2.5 py-1.5 text-xs
                ${phaseStyle.wrapper}
              `}
            >
              <span className={`flex items-center gap-1.5 font-black uppercase tracking-wide ${phaseStyle.badge} px-2 py-0.5 rounded-lg`}>
                {phase === "live" && <span className={`w-1.5 h-1.5 rounded-full ${phaseStyle.dot}`} />}
                {phaseLabel}
              </span>
              <div className="w-px h-3.5 bg-gray-200" />
              <span className={`flex items-center gap-1 ${phaseStyle.text} font-semibold`}>
                <Clock className={`w-3 h-3 ${phaseStyle.clock}`} />
                {timeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 2 — Direction · Timing (row, always visible)
        ═══════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Direction */}
          <div
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-black
              uppercase tracking-wider shadow-sm
              ${post.details === "to_city"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"}
            `}
          >
            {post.details === "to_city"
              ? <ArrowLeft className="w-3 h-3 shrink-0" />
              : <ArrowRight className="w-3 h-3 shrink-0" />
            }
            <span>
              {post.details === "to_city" ? t("towardsCity") : t("towardsVillage")}
            </span>
          </div>

          {/* Timing status */}
          {post.timingStatus && (
            <div
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider
                ${post.timingStatus === "on_time" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : post.timingStatus === "delayed" ? "bg-amber-50   text-amber-700   border-amber-200"
                    : "bg-rose-50    text-rose-700    border-rose-200"}
              `}
            >
              <span
                className={`
                  w-1.5 h-1.5 rounded-full shrink-0
                  ${post.timingStatus === "on_time" ? "bg-emerald-400"
                    : post.timingStatus === "delayed" ? "bg-amber-400"
                      : "bg-rose-400"}
                `}
              />
              {post.timingStatus === "on_time" && t("timingOnTime")}
              {post.timingStatus === "delayed" && t("timingDelayed")}
              {post.timingStatus === "just_missed" && t("timingJustMissed")}
            </div>
          )}

          {/* Anchor / stop name */}
          {post.anchorName && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500">
              <MapPin className="w-3 h-3 text-primary/40 shrink-0" />
              {t("atStop", { stop: post.anchorName })}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            SECTION 3 — Stats (clickable to detail page)
        ═══════════════════════════════════════════ */}
        <div
          className="cursor-pointer active:opacity-70 transition-opacity"
          onClick={() => router.push(`/post/${post.id}`)}
        >
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
            {/* Distance */}
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
              <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                {t("distance") || "Distance"}
              </p>
              <div className="flex items-center gap-2">
                <Navigation
                  className={`
                    w-4 h-4 text-primary shrink-0
                    ${accuracy && accuracy > 3000 ? "animate-pulse" : "opacity-40"}
                  `}
                />
                <span className="text-base sm:text-lg font-black text-gray-900 leading-none">
                  {distanceLabel}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
              <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                {t("status") || "Status"}
              </p>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 shrink-0 ${timeLeftPerc > 0 ? "text-emerald-500" : "text-gray-300"}`} />
                <span className={`text-base sm:text-lg font-black leading-none ${timeLeftPerc > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                  {timeLeftPerc > 0 ? t("activeNow") : t("expired")}
                </span>
              </div>
            </div>
          </div>

          {!hideLink && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-primary/30 uppercase tracking-widest mb-4">
              {t("viewTrackDetails") || "View Live Tracking"}
              <ChevronRight className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            SECTION 4 — Community radar banner
        ═══════════════════════════════════════════ */}
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs sm:text-[13px] font-semibold text-emerald-800/80 leading-snug">
            {isAuthor ? t("radarStillHerePrompt") : t("radarHelpDesc")}
          </p>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 5 — Footer: author info + actions
            Mobile : author row → verify row (stacked)
            Desktop: single row, space-between
        ═══════════════════════════════════════════ */}
        <div className="border-t border-gray-100 pt-3 mt-1 flex flex-col gap-3">

          {/* Row 1 — Author + secondary icon actions */}
          <div className="flex items-center justify-between gap-3">

            {/* Author block */}
            <div className="flex items-center gap-2.5 min-w-0">
              <ProfileAvatar
                src={post.authorPhoto}
                name={post.authorName}
                size="sm"
                border={false}
                className="rounded-lg shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-black text-gray-900 leading-tight truncate">
                  {post.authorName || t("citizen")}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    <MapPin className="w-2.5 h-2.5 text-gray-300 shrink-0" />
                    {t("kerala")}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-200 shrink-0" />
                  <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">
                    {post.verifiedCount} {t("verified")}
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary icon actions (share / flag / delete) */}
            <div className="flex items-center gap-1 shrink-0">
              <SharePost post={post} />

              {!isAuthor && (
                <button
                  onClick={handleReport}
                  disabled={isFlagged || flagging}
                  title="Flag Content"
                  className={`
                    p-2 rounded-xl transition-all border
                    ${isFlagged
                      ? "text-red-400 bg-red-50 border-red-100 cursor-not-allowed opacity-50"
                      : "text-gray-300 border-transparent hover:text-red-500 hover:bg-red-50 hover:border-red-100"}
                  `}
                >
                  <Flag className="w-4 h-4" />
                </button>
              )}

              {(isAuthor || isSuperAdmin) && (
                <button
                  onClick={handleDelete}
                  title="Delete Radar"
                  className="p-2 text-gray-300 border border-transparent hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2 — Primary verify button (full width on mobile) */}
          <button
            onClick={onVerifyPress}
            disabled={isVerified || verifying}
            className={`
              w-full sm:w-auto sm:self-end
              flex items-center justify-center gap-2
              px-5 py-3 rounded-xl text-sm font-black uppercase tracking-wider
              transition-all active:scale-[0.98]
              ${isVerified
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-200 cursor-default"
                : isWithinRange
                  ? "bg-primary text-white shadow-md shadow-primary/20 hover:shadow-primary/30"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"}
            `}
          >
            {verifying ? (
              <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>
              {isVerified
                ? t("verified")
                : isAuthor
                  ? t("stillHere")
                  : `${t("meToo")}${post.colorTag ? ` (${post.colorTag})` : ""}`}
            </span>
          </button>

        </div>

      </div>
      {/* Conversion Modal for Guests */}
      <ConversionModal 
        isOpen={showConversionModal} 
        onClose={() => setShowConversionModal(false)}
        actionType="verify"
        karmaAmount={1}
      />
    </div>
  );
};

export default BusRadarCard;