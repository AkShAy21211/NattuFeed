"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
   Shield, Star, Loader2, FileText,
  Users, ShieldCheck, CheckCircle2,
  Settings, MapPin, ChevronRight, User as UserIcon,
  LayoutGrid, List as ListIcon,
  Pencil
} from "lucide-react";
import {
  collection, query, where, orderBy,
  onSnapshot, limit, doc, setDoc, writeBatch, increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import EditProfileModal from "@/components/EditProfileModal";
import VerificationRequestModal, { ROLES } from "@/components/VerificationRequestModal";
import PostCard from "@/components/PostCard";
import WhatsAppButton from "@/components/WhatsAppButton";

/* ─── level helpers ─────────────────────────────────────────────── */
const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID ?? "YIk8fYx3n9Uwj4ygF4tnwVGFS8p2";

function getLevel(karmaTotal: number) {
  return Math.floor(karmaTotal / 25) + 1;
}

import ProfileAvatar from "@/components/ProfileAvatar";

/* ─── Badge Config ──────────────────────────────────────────────── */
const BADGE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  transit_hero: { 
    label: "Transit Hero", 
    icon: <ShieldCheck className="w-4 h-4" />, 
    color: "text-[#D32F2F]", // KSRTC Red
    bg: "bg-red-50 border-red-100" 
  },
  town_voice: { 
    label: "Town Voice", 
    icon: <Users className="w-4 h-4" />, 
    color: "text-indigo-600", 
    bg: "bg-indigo-50 border-indigo-100" 
  },
  first_settler: { 
    label: "First Settler", 
    icon: <Star className="w-4 h-4" />, 
    color: "text-amber-600", 
    bg: "bg-amber-50 border-amber-100" 
  },
  karma_guardian: { 
    label: "Guardian", 
    icon: <ShieldCheck className="w-4 h-4" />, 
    color: "text-emerald-600", 
    bg: "bg-emerald-50 border-emerald-100" 
  },
};

function BadgeItem({ type }: { type: string }) {
  const cfg = BADGE_CONFIG[type];
  if (!cfg) return null;
  return (
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border ${cfg.bg} min-w-[80px] shrink-0 animate-in zoom-in-95 duration-300`}>
      <div className={`${cfg.color}`}>{cfg.icon}</div>
      <p className={`text-[8px] font-black uppercase tracking-tighter text-center ${cfg.color}`}>
        {cfg.label}
      </p>
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
  const router = useRouter();
  const { user, profile, loading, signOut, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [isModerator, setIsModerator] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

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

  // Moderation Queue Fetch
  useEffect(() => {
    if (!user || user.uid !== ADMIN_UID) {
      setIsModerator(false);
      return;
    }
    setIsModerator(true);

    const q = query(
      collection(db, "verification_requests"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      setVerificationRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return unsub;
  }, [user]);


  const handleApprove = async (reqId: string, userId: string, roleId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const reqRef = doc(db, "verification_requests", reqId);

      const roleCfg = ROLES.find(r => r.id === roleId);
      const displayRole = roleCfg 
        ? roleCfg.label.split("/")[0].trim() 
        : roleId.charAt(0).toUpperCase() + roleId.slice(1);

      const batch = writeBatch(db);
      batch.update(userRef, {
        isVerified: true,
        karmaTotal: increment(50), 
      });
      batch.update(reqRef, { status: "approved" });

      await batch.commit();
      showToast("User verified successfully!", "success");
    } catch (err) {
      console.error("Approve error:", err);
      showToast("Failed to approve", "error");
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      const reqRef = doc(db, "verification_requests", reqId);
      await setDoc(reqRef, { status: "rejected" }, { merge: true });
      showToast("Request rejected", "info");
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3 text-gray-400">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t("syncingProfile")}</p>
      </div>
    );
  }

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


  const ageLabels: Record<string, string> = {
    youth: t('ageYouth'),
    youngAdult: t('ageYoungAdult'),
    middleAge: t('ageMiddleAge'),
    senior: t('ageSenior')
  };
  const userAgeLabel = profile?.ageGroup ? ageLabels[profile.ageGroup] : null;

  return (
    <div className="min-h-screen bg-[#F7F6F3] pb-28 animate-in fade-in duration-500 text-[#212121]">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-black text-gray-900 tracking-tight">
          {t("profileTitle") || "My Dashboard"}
        </h1>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-primary"
            title={t("editProfile")}
          >
            <Pencil size={20} />
          </button>
          <button 
            onClick={() => router.push('/settings')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-primary"
            title={t("settingsTitle")}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <ProfileAvatar src={photoURL} name={displayName} size="xl" />
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

                {profile?.isVerified && (
                  <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                    <CheckCircle2 size={10} />
                    {"Verified"}
                  </span>
                )}
              </div>
              {profile?.district && (
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin className="w-3 h-3 text-gray-300 shrink-0" />
                  <span className="text-[10px] text-gray-400 font-bold truncate">{profile.district}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-primary rounded-2xl px-6 py-5 flex items-center justify-between mb-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1 flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-white/20" />
                {t("totalKarma")}
              </p>
              <p className="text-5xl font-black text-white leading-none">{karmaTotal}</p>
            </div>
            <Star className="w-12 h-12 text-white/10 fill-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatTile label={t("weeklyKarma")} value={`+${karmaWeekly}`} accent />
            <StatTile label={t("levelLabel")} value={`Lv. ${level}`} />
            <StatTile label={t("neighborhoodLabel")} value={profile?.localBody ?? t("notSet")} />
            <StatTile label={t("wardLabel")} value={profile?.ward ?? t("notAvailable")} />
            {userAgeLabel && (
              <div className="col-span-2">
                <StatTile label={t("ageGroup")} value={userAgeLabel} />
              </div>
            )}
          </div>

          {/* ─── BADGES SECTION ─── */}
          {(profile?.badges && profile.badges.length > 0) && (
            <div className="mt-8">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 px-1">
                Karma Badges
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                {profile.badges.map((badge: string) => (
                  <BadgeItem key={badge} type={badge} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── ACTIVITY SECTION ─── */}
        <div className="pt-8">
          <div className="flex items-center gap-2.5 mb-4 px-1">
            <div className="w-7 h-7 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-100 shrink-0">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.25em]">
              {t("myPostsTitle")}
            </h3>
            <div className="ml-auto flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button 
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}
              >
                <ListIcon size={14} />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto scroll-smooth no-scrollbar">
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
            <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3 pb-4" : "space-y-3"}>
              {myPosts.map((post: any) => {
                const isSpecialized = ["Health", "Services", "Utility"].includes(post.category);
                const isUnresolved = !post.isResolved;
                const shouldHighlight = isSpecialized && isUnresolved;

                if (viewMode === "grid") {
                  return (
                    <Link 
                      key={post.id} 
                      href={`/post/${post.id}`}
                      className={`
                        relative aspect-square bg-white rounded-3xl p-4 border transition-all active:scale-95
                        ${shouldHighlight ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary/20" : "border-gray-100 shadow-sm"}
                      `}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                             <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0 bg-gray-50 text-gray-400`}>
                              {t(`category${post.category}`)}
                            </span>
                            {shouldHighlight && <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-sm shadow-primary/40" />}
                          </div>
                          <h4 className="text-xs font-black text-gray-900 line-clamp-3 leading-tight tracking-tight uppercase">
                            {post.headline}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                           <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                            {post.isResolved ? "Resolved" : "Active"}
                          </span>
                           <ChevronRight size={10} className="text-gray-300" />
                        </div>
                      </div>
                    </Link>
                  );
                }

                return (
                  <div key={post.id} className={shouldHighlight ? "ring-2 ring-primary/20 rounded-[24px] overflow-hidden" : ""}>
                    <PostCard post={post} />
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>

        {/* ════════ MODERATION QUEUE (ADMINS ONLY) ════════ */}
        {isModerator && (
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Moderation Queue</h3>
              <span className="ml-auto text-[10px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full">
                {verificationRequests.length}
              </span>
            </div>

            {verificationRequests.length === 0 ? (
              <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verificationRequests.map((req) => (
                  <div key={req.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase">{req.userName}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">{req.role}</p>
                      </div>
                      <time className="text-[8px] font-bold text-gray-400">
                        {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : ""}
                      </time>
                    </div>
                    <div className="space-y-1.5 min-h-0 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Registration / Proof</p>
                      <p className="text-[10px] text-gray-800 font-bold leading-relaxed">
                        {req.proofDetails || "No ID provided"}
                      </p>
                      <hr className="border-gray-200 my-1.5 opacity-50" />
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Community Bio</p>
                      <p className="text-[10px] text-gray-500 font-medium italic leading-relaxed">
                        "{req.description}"
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(req.id, req.userId, req.role)}
                        className="flex-1 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-[0.5em] py-16">
          {t("guardianTitle")}
        </p>

        <VerificationRequestModal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} />
        <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      </div>
    </div>
  );
}