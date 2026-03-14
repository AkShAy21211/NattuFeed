"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin, ChevronRight, User as UserIcon,
  Shield, Star, LogOut, Loader2, FileText,
  Scale
} from "lucide-react";
import {
  collection, query, where, orderBy,
  onSnapshot, limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import EditProfileModal from "@/components/EditProfileModal";
import PostCard from "@/components/PostCard";

/* ─── level helpers ─────────────────────────────────────────────── */
function getLevel(karmaTotal: number) {
  return Math.floor(karmaTotal / 10) + 1;
}

/* ─── Avatar with onError fallback ─────────────────────────────── */
function ProfileAvatar({ src, name }: { src?: string | null; name?: string | null }) {
  const [errored, setErrored] = useState(false);
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-md flex items-center justify-center shrink-0">
      {src && !errored ? (
        <img
          src={src} alt={name ?? "Profile"}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : name ? (
        <span className="text-2xl font-black text-gray-400">{initial}</span>
      ) : (
        <UserIcon className="w-10 h-10 text-gray-300" />
      )}
    </div>
  );
}

/* ─── Stat tile ─────────────────────────────────────────────────── */
function StatTile({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 p-4 rounded-2xl border ${accent ? "bg-primary/5 border-primary/10" : "bg-gray-50 border-gray-100"
      }`}>
      <p className={`text-[9px] font-black uppercase tracking-widest ${accent ? "text-primary/60" : "text-gray-400"}`}>
        {label}
      </p>
      <p className={`text-sm font-black text-center line-clamp-1 ${accent ? "text-primary" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

/* ─── ProfilePage ───────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  /*
   * BUG FIX: was getDocs (one-time fetch).
   * PostCard deletes posts via its own internal handler — the list
   * never reflected those deletions. Switching to onSnapshot means
   * the list stays in sync with Firestore automatically.
   */
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "posts"),
      where("authorId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setMyPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingPosts(false);
      },
      (err) => {
        console.error("Failed to fetch my posts:", err);
        setLoadingPosts(false);
      },
    );

    return unsub;
  }, [user?.uid]);

  /* ── loading ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3 text-gray-400">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t("syncingProfile")}</p>
      </div>
    );
  }

  /* ── derived values ── */
  const karmaTotal = profile?.karmaTotal ?? 0;
  const karmaWeekly = profile?.karmaWeekly ?? 0;
  const level = getLevel(karmaTotal);

  const statusLabels = [
    t("statusNovice"),
    t("statusActive"),
    t("statusHero"),
    t("statusPath"),
    t("statusGuardian"),
  ];
  const statusLabel = statusLabels[Math.min(level - 1, statusLabels.length - 1)];

  const displayName = profile?.name ?? user?.displayName ?? t("nativeMember");
  const photoURL = profile?.photoURL ?? user?.photoURL;

  /* ─── render ─── */
  return (
    <div className="min-h-screen bg-[#F7F6F3] pb-28 animate-in fade-in duration-500">
      <div className="max-w-md mx-auto px-4 pt-6 space-y-4">

        {/* ════════ IDENTITY CARD ════════ */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">

          {/* avatar + name row */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <ProfileAvatar src={photoURL} name={displayName} />
              {/* shield badge */}
              <div className="absolute -bottom-1 -right-1 bg-accent text-white p-1.5 rounded-xl border-2 border-white shadow-sm">
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-gray-900 leading-tight truncate">{displayName}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/8 px-2.5 py-1 rounded-full border border-primary/10">
                  {statusLabel}
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  {t("levelLabel")} {level}
                </span>
              </div>
              {profile?.district && (
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin className="w-3 h-3 text-gray-300 shrink-0" />
                  <span className="text-[10px] text-gray-400 font-bold truncate">{profile.district}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Karma block ── */}
          <div className="bg-primary rounded-2xl px-6 py-5 flex items-center justify-between mb-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1 flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-white/20" />
                {t("totalKarma")}
              </p>
              {/* 
                DESIGN: was text-6xl — looks great on large screens
                but on 320px devices it nudges other elements. text-5xl
                is still impactful but safe across all widths.
              */}
              <p className="text-5xl font-black text-white leading-none">{karmaTotal}</p>
            </div>
            <Star className="w-12 h-12 text-white/10 fill-white/10" />
          </div>

          {/* ── Stats grid ── */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile label={t("weeklyKarma")} value={`+${karmaWeekly}`} accent />
            <StatTile label={t("levelLabel")} value={`Lv. ${level}`} />
            <StatTile label={t("neighborhoodLabel")} value={profile?.localBody ?? t("notSet")} />
            <StatTile label={t("wardLabel")} value={profile?.ward ?? t("notAvailable")} />
          </div>
        </div>

        {/* ════════ EDIT PROFILE BUTTON ════════ */}
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-primary/20 hover:bg-primary/[0.02] transition-all active:scale-[0.98] group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center border border-primary/10 group-hover:bg-primary/15 transition-colors shrink-0">
              <UserIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none mb-0.5">
                {t("editProfile")}
              </p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                {t("updateIdentity")}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors shrink-0" />
        </button>

        <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />

        {/* ════════ MY POSTS ════════ */}
        <div className="pt-2">
          <div className="flex items-center gap-2.5 mb-4 px-1">
            <div className="w-7 h-7 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-100 shrink-0">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.25em]">
              {t("myPostsTitle")}
            </h3>
          </div>

          {loadingPosts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary/30" />
            </div>
          ) : myPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
                <FileText className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm font-black text-gray-800 uppercase tracking-wider mb-1">
                {t("noPostsTitle")}
              </p>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed max-w-[200px] mx-auto">
                {t("noPostsSub")}
              </p>
            </div>
          ) : (
            /*
             * NOTE: PostCard handles its own delete via Firestore.
             * Since we now use onSnapshot above, deleted posts will
             * automatically disappear from this list — no extra prop needed.
             */
            <div className="space-y-3">
              {myPosts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* ════════ LEGAL LINKS ════════ */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href="/privacy"
            className="flex items-center justify-center gap-2 py-3 bg-white rounded-2xl border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary hover:border-primary/20 transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            {t("privacyPolicyTitle")}
          </Link>
          <Link
            href="/terms"
            className="flex items-center justify-center gap-2 py-3 bg-white rounded-2xl border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary hover:border-primary/20 transition-all"
          >
            <Scale className="w-3.5 h-3.5" />
            {t("termsOfServiceTitle")}
          </Link>
        </div>

        {/* ════════ SIGN OUT ════════ */}
        <div className="pt-2 pb-4">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-gray-100 hover:bg-red-50 hover:border-red-100 transition-all active:scale-[0.98] group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:bg-red-100 group-hover:border-red-100 transition-colors shrink-0">
                <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-gray-900 group-hover:text-red-600 uppercase tracking-widest leading-none mb-0.5 transition-colors">
                  {t("signOut")}
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                  {t("secureDisconnect")}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-300 transition-colors shrink-0" />
          </button>
        </div>

        <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-[0.5em] py-4">
          {t("guardianTitle")}
        </p>

      </div>
    </div>
  );
}