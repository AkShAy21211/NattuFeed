"use client";

import React, { useState, useEffect } from "react";
import {
  doc, deleteDoc, increment, runTransaction, onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  CheckCircle2, AlertTriangle, Loader2,
  User as UserIcon, MapPin, Trash2,
} from "lucide-react";
import KarmaNotification from "./KarmaNotification";
import { useLanguage } from "@/context/LanguageContext";

/* ─── Move config out of component ─────────────────────────────── */
const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID ?? "JB5yQ93TDQVOsgbX4vmYQNNf1JC2";

/* ─── Types ─────────────────────────────────────────────────────── */
export interface Post {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhoto?: string;
  headline: string;
  details?: string;
  landmark?: string;
  category: "Traffic" | "Utility" | "Market" | "Services" | "Health" | "Alerts";
  lat: number;
  lng: number;
  verifiedCount: number;
  flagCount: number;
  isHidden: boolean;
  isBusinessPost: boolean;
  createdAt: any;
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
} as const;

/* ─── PostCard ──────────────────────────────────────────────────── */
const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [isVerified, setIsVerified] = useState(false);
  const [isFlagged, setIsFlagged] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showKarmaPop, setShowKarmaPop] = useState(false);

  const isAuthor = user?.uid === post.authorId;
  const isSuperAdmin = user?.uid === ADMIN_UID;
  const canDelete = isAuthor || isSuperAdmin;

  /* — realtime verified / flagged state — */
  useEffect(() => {
    if (!user) return;

    const vertRef = doc(db, "verifications", `${post.id}_${user.uid}`);
    const flagRef = doc(db, "flags", `${post.id}_${user.uid}`);

    const unsubVert = onSnapshot(vertRef, d => setIsVerified(d.exists()));
    const unsubFlag = onSnapshot(flagRef, d => setIsFlagged(d.exists()));

    return () => { unsubVert(); unsubFlag(); };
  }, [post.id, user]);

  /* — verify — */
  const handleVerify = async () => {
    if (!user || isVerified || verifying) return;
    setVerifying(true);
    try {
      const verificationRef = doc(db, "verifications", `${post.id}_${user.uid}`);
      const postRef = doc(db, "posts", post.id);
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (tx) => {
        tx.set(verificationRef, { postId: post.id, userId: user.uid, createdAt: new Date() });
        tx.update(postRef, { verifiedCount: increment(1) });
        tx.update(userRef, { karmaTotal: increment(1), karmaWeekly: increment(1) });
      });

      setShowKarmaPop(true);
    } catch (err) {
      console.error("Verification failed:", err);
      showToast(t("verifyFail"), "error");
    } finally {
      setVerifying(false);
    }
  };

  /* — report — */
  const handleReport = async () => {
    if (!user || isFlagged) return;

    // Replace window.confirm with toast-based approach
    showToast(t("reportSpam"), "info", {
      action: { label: t("confirm"), onClick: submitReport },
    });
  };

  const submitReport = async () => {
    if (!user) return;
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
          isHidden: currentFlags >= 10 && currentFlags > currentVerified,
        });
      });

      showToast(t("reportSuccess"), "success");
    } catch (err) {
      console.error("Reporting failed:", err);
      showToast(t("reportFail"), "error");
    }
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

  // Fallback to Traffic if the post has a legacy category (e.g., "General", "Public Service")
  const catConfig = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.Traffic;

  /* ─── render ─── */
  return (
    <article
      aria-labelledby={`post-title-${post.id}`}
      className="relative bg-white border border-gray-100 rounded-2xl p-4 pl-5 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-px animate-in fade-in slide-in-from-bottom-2"
    >
      {/* ── Category accent bar ── */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${catConfig.bar} rounded-l-2xl`} />

      {/* ── Karma pop ── */}
      <KarmaNotification isVisible={showKarmaPop} onComplete={() => setShowKarmaPop(false)} />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar src={post.authorPhoto} name={post.authorName} />
          <div className="min-w-0">
            <p className="text-[12px] font-black text-gray-900 uppercase tracking-tight leading-none mb-0.5 truncate">
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

        {/* right side: category badge + delete */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            aria-label={`Category: ${post.category}`}
            className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${catConfig.pill}`}
          >
            {t(catConfig.i18n)}
          </span>

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label={isSuperAdmin ? "Admin delete post" : t("delete")}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all active:scale-90"
            >
              {deleting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Trash2 className="w-3.5 h-3.5" />
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="space-y-2 mb-4">
        <h3
          id={`post-title-${post.id}`}
          className="text-[16px] font-black text-gray-900 leading-snug tracking-tight break-words"
        >
          {post.headline}
        </h3>

        {post.landmark && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
            <MapPin className="w-3 h-3 text-primary/60 shrink-0" />
            <span className="text-[9px] font-black text-primary/60 uppercase tracking-wider">{post.landmark}</span>
          </div>
        )}

        {post.details && (
          <p className="text-[13px] text-gray-500 leading-relaxed break-words pl-3 border-l-2 border-gray-100">
            {post.details}
          </p>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50">

        {/* Verify button / static count for author */}
        {isAuthor ? (
          <div className="flex items-center gap-2 text-gray-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {post.verifiedCount} <span className="font-bold opacity-50">{t("verified")}</span>
            </span>
          </div>
        ) : (
          <button
            onClick={handleVerify}
            disabled={isVerified || verifying}
            aria-pressed={isVerified}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95 ${isVerified
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                : "bg-primary text-white shadow-sm shadow-primary/20 hover:shadow-primary/30"
              }`}
          >
            {verifying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className={`w-3.5 h-3.5 ${isVerified ? "fill-white/30" : "opacity-70"}`} />
                {post.verifiedCount} {isVerified ? t("verified") : t("meToo")}
              </>
            )}
          </button>
        )}

        {/* Report — only non-author */}
        {!isAuthor && (
          <button
            onClick={handleReport}
            disabled={isFlagged}
            aria-label={isFlagged ? "Already reported" : "Report post"}
            title={isFlagged ? "Already reported" : "Report post"}
            className={`p-2 rounded-xl transition-all ${isFlagged
                ? "text-red-400 bg-red-50 cursor-not-allowed opacity-50"
                : "text-gray-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100"
              }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  );
};

export default PostCard;