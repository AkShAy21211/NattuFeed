"use client";

import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Star, Loader2, Zap, Share2 } from 'lucide-react';
import {
  collection, query, orderBy, limit,
  onSnapshot, where, getCountFromServer, doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { endOfWeek, differenceInDays } from 'date-fns';
import ProfileAvatar from '@/components/ProfileAvatar';

interface LeaderboardUser {
  id: string;
  name: string;
  photoURL?: string;
  karmaWeekly: number;
  karmaTotal: number;
}

/* ─── tiny helpers ─────────────────────────────────────────────── */


/* ─── main component ────────────────────────────────────────────── */

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userWeeklyPoints, setUserWeeklyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isGlobalFallback, setIsGlobalFallback] = useState(false);

  /* — listen to top 10 (District-based with Global Fallback) — */
  useEffect(() => {
    const userDistrict = profile?.district || '';
    
    // We start by listening to the district-specific leaderboard
    const districtQuery = query(
      collection(db, 'users'),
      where('district', '==', userDistrict),
      orderBy('karmaWeekly', 'desc'),
      orderBy('karmaTotal', 'desc'),
      orderBy('createdAt', 'asc'),
      limit(10),
    );

    const globalQuery = query(
      collection(db, 'users'),
      orderBy('karmaWeekly', 'desc'),
      orderBy('karmaTotal', 'desc'),
      orderBy('createdAt', 'asc'),
      limit(10),
    );

    let activeUnsub: (() => void) | null = null;

    const startListening = () => {
      // If no district, go straight to global
      if (!userDistrict) {
        activeUnsub = onSnapshot(globalQuery, (snap) => {
          setTopUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaderboardUser)));
          setIsGlobalFallback(false); // It's not a fallback if they have no district
          setLoading(false);
        });
        return;
      }

      // Try district first
      activeUnsub = onSnapshot(districtQuery, (snap) => {
        if (snap.empty) {
          // If district is empty, we must fallback to global
          // We need to unsubscribe from district and start global
          if (activeUnsub) activeUnsub();
          
          activeUnsub = onSnapshot(globalQuery, (gSnap) => {
            setTopUsers(gSnap.docs.map(d => ({ id: d.id, ...d.data() } as LeaderboardUser)));
            setIsGlobalFallback(true);
            setLoading(false);
          });
        } else {
          setTopUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaderboardUser)));
          setIsGlobalFallback(false);
          setLoading(false);
        }
      });
    };

    startListening();

    return () => {
      if (activeUnsub) activeUnsub();
    };
  }, [profile?.district]);

  /* — compute current user's rank (District-based) — */
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      async (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const pts = data.karmaWeekly ?? 0;
        const tot = data.karmaTotal ?? 0;
        const dist = data.district || '';
        const createdAt = data.createdAt; // Can be undefined for new users

        setUserWeeklyPoints(pts);

        // Guard: If we don't have a timestamp yet, we can't accurately compute exact rank tie-breakers
        if (!createdAt) {
          setUserRank(null);
          return;
        }

        try {
          const baseQuery = query(collection(db, 'users'));
          const filteredQuery = dist ? query(baseQuery, where('district', '==', dist)) : baseQuery;

          const [wSnap, tSnap, sSnap] = await Promise.all([
            getCountFromServer(query(filteredQuery, where('karmaWeekly', '>', pts))),
            getCountFromServer(query(filteredQuery, where('karmaWeekly', '==', pts), where('karmaTotal', '>', tot))),
            getCountFromServer(query(filteredQuery, where('karmaWeekly', '==', pts), where('karmaTotal', '==', tot), where('createdAt', '<', createdAt))),
          ]);

          setUserRank(wSnap.data().count + tSnap.data().count + sSnap.data().count + 1);
        } catch (err) {
          console.error("Failed to compute user rank:", err);
        }
      }
    );
    return unsub;
  }, [user]);

  /* — derived state — */
  const isUserInTop10 = topUsers.some(u => u.id === user?.uid);
  const [first, second, third] = topUsers;
  const rest = topUsers.slice(3);

  /**
   * Points needed to beat the user ranked one place above.
   */
  const pointsToNext = (weeklyPts: number, rank: number): number | null => {
    if (rank <= 1) return null;
    
    if (rank > 11) {
      const targetUser = topUsers[topUsers.length - 1]; // #10
      if (!targetUser) return null;
      const diff = targetUser.karmaWeekly - weeklyPts;
      return diff >= 0 ? diff + 1 : 1;
    }

    const targetIndex = rank - 2;
    const above = topUsers[targetIndex];
    if (!above) return null;
    const diff = above.karmaWeekly - weeklyPts;
    return diff >= 0 ? diff + 1 : 1;
  };

  /** Calculation for progress bar */
  const progressPercent = (): number => {
    if (userRank === null || userRank <= 1) return 100;
    
    // Target user is the one we are chasing
    const targetUser = userRank <= 11 
      ? topUsers[userRank - 2] 
      : topUsers[0]; // Chase #1 if far away
      
    if (!targetUser || targetUser.karmaWeekly === 0) return 0;
    return Math.min(100, (userWeeklyPoints / targetUser.karmaWeekly) * 100);
  };

  /** Days until Monday reset */
  const getDaysUntilReset = () => {
    const now = new Date();
    const nextMonday = endOfWeek(now, { weekStartsOn: 1 });
    const diff = differenceInDays(nextMonday, now);
    return diff;
  };

  /** Share/Invite handler */
  const handleInvite = async () => {
    const shareUrl = window.location.origin;
    const text = t('shareText', { district: profile?.district || t('kerala'), url: shareUrl });
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NattuFeed',
          text: text,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${text}`);
        showToast(t('linkCopied'), "success");
      } catch (error) {
        console.error("Clipboard write failed:", error);
        showToast(t('shareFailed') || "Could not copy link", "error");
      }
    }
  };

  /* ─── loading ─── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {t('loadingRankings')}
        </p>
      </div>
    );
  }

  /* ─── empty ─── */
  if (topUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 border border-amber-100 shadow-lg shadow-amber-100/50">
          <Trophy className="w-10 h-10 text-amber-400" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">
          {profile?.district 
            ? t('noRankingsInDistrict', { district: profile.district }) 
            : t('noRankingsYet')}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">
          {t('claimSpotDesc')}
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          {t('startPosting')}
        </button>
      </div>
    );
  }

  /* ─── render ─── */
  return (
    <div className="min-h-screen bg-[#F7F6F3] pb-36 animate-in fade-in duration-500">

      {/* ════════ HEADER + PODIUM ════════ */}
      <div className="bg-white px-4 pt-10 pb-0 rounded-b-[2.5rem] shadow-sm overflow-hidden border-b border-gray-100">

        {/* title */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex flex-col items-center justify-center gap-1 sm:gap-3 px-2">
            <span className="leading-tight">{t('topNattukarans')}</span>
            <span className="hidden sm:block text-primary/20">—</span>
            <span className="text-primary leading-tight">
              {profile?.district && !isGlobalFallback ? profile.district : t('allKerala')}
            </span>
          </h1>
          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="flex flex-col items-center gap-2.5 w-full">
              {/* Explicit Scope Badge */}
              <div className={`px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider border shadow-sm ${
                isGlobalFallback || !profile?.district
                  ? "bg-amber-50 border-amber-200 text-amber-600"
                  : "bg-emerald-50 border-emerald-200 text-emerald-600"
              }`}>
                {isGlobalFallback || !profile?.district ? t('keralaLevel') : t('districtLevel', { district: profile?.district || '' })}
              </div>

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2 bg-gray-50/50 px-3 py-1 rounded-full">
                <Zap className="w-3 h-3 text-primary fill-primary/20" />
                <span className="leading-relaxed">
                  {t('weeklyRankings')} · {t('resetsInDays', { days: String(getDaysUntilReset()) })}
                </span>
              </p>
            </div>

            {isGlobalFallback && profile?.district && (
              <span className="text-[9px] font-black text-primary/60 uppercase tracking-[0.15em] bg-primary/5 px-2 py-0.5 rounded-full">
                {t('showingGlobal')}
              </span>
            )}
          </div>
        </div>

        {/* Pioneer Card (Only when district is empty but user HAS a district) */}
        {isGlobalFallback && profile?.district && (
          <div className="max-w-xs mx-auto mb-8 bg-gradient-to-br from-primary/5 to-amber-50/30 border border-primary/10 rounded-3xl p-5 text-center shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className="w-12 h-12 text-primary" />
             </div>
             <h4 className="text-sm font-black text-gray-900 mb-1">{t('pioneerTitle')}</h4>
             <p className="text-[11px] text-gray-500 leading-snug mb-4">
                {t('pioneerDesc', { district: profile.district })}
             </p>
             <button
               onClick={() => router.push('/')}
               className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-primary/20 active:scale-95 transition-all"
             >
                <Zap className="w-3.5 h-3.5 fill-white" />
                {t('claimRank')}
             </button>
          </div>
        )}

        {/* Lonely Leader Card (Only when exactly 1 person is in local leaderboard) */}
        {topUsers.length === 1 && !isGlobalFallback && (
          <div className="max-w-xs mx-auto mb-8 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-3xl p-5 text-center shadow-sm relative overflow-hidden group">
             <div className="absolute -top-2 -right-2 p-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                <Crown className="w-16 h-16 text-emerald-500" />
             </div>
             <h4 className="text-sm font-black text-emerald-900 mb-1">{t('lonelyLeaderTitle')}</h4>
             <p className="text-[11px] text-emerald-800/60 leading-snug mb-4">
                {t('lonelyLeaderDesc', { district: profile?.district || '' })}
             </p>
             <button
               onClick={handleInvite}
               className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-200 active:scale-95 transition-all"
             >
                <Share2 className="w-3.5 h-3.5 fill-white" />
                {t('inviteNeighbors')}
             </button>
          </div>
        )}

        {/* Profile Completion Card (Only when user HAS NO district) */}
        {!profile?.district && (
          <div className="max-w-xs mx-auto mb-8 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-3xl p-5 text-center shadow-sm relative overflow-hidden group">
             <div className="absolute -top-2 -right-2 p-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                <Crown className="w-16 h-16 text-amber-500" />
             </div>
             <h4 className="text-sm font-black text-amber-900 mb-1">{t('unlockLocalRanking')}</h4>
             <p className="text-[11px] text-amber-800/60 leading-snug mb-4">
                {t('viewingKeralaDesc')}
             </p>
             <button
               onClick={() => router.push('/profile')}
               className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-amber-200 active:scale-95 transition-all"
             >
                <Star className="w-3.5 h-3.5 fill-white" />
                {t('setNeighborhood')}
             </button>
          </div>
        )}

        {/* PODIUM LAYOUT */}
        <div className="flex items-end justify-center gap-2 sm:gap-4 w-full max-w-sm mx-auto">
          {second && (
            <PodiumCard
              user={second} rank={2} isMe={second.id === user?.uid}
              extraBottom="pb-4"
            />
          )}

          {first && (
            <PodiumCard
              user={first} rank={1} isMe={first.id === user?.uid}
              extraBottom="pb-10"
            />
          )}

          {third && (
            <PodiumCard
              user={third} rank={3} isMe={third.id === user?.uid}
              extraBottom="pb-0"
            />
          )}
        </div>

        {/* podium stage bar (Glassmorphic) */}
        <div className="flex items-end justify-center gap-2 sm:gap-4 w-full max-w-sm mx-auto mt-0 relative z-10">
          {second && <div className="flex-1 h-20 bg-slate-100/40 backdrop-blur-md border border-slate-200/50 border-b-0 rounded-t-2xl shadow-sm" />}
          {first && <div className="flex-1 h-32 bg-amber-100/50 backdrop-blur-md border border-amber-200/50 border-b-0 rounded-t-2xl shadow-sm" />}
          {third && <div className="flex-1 h-12 bg-orange-100/40 backdrop-blur-md border border-orange-200/50 border-b-0 rounded-t-2xl shadow-sm" />}
        </div>
      </div>

      {/* ════════ RANKS 4–10 LIST ════════ */}
      <div className="px-4 max-w-lg mx-auto mt-6 space-y-2.5 pb-2">
        {rest.map((item, i) => {
          const rankValue = i + 4;
          const isMe = item.id === user?.uid;
          const toNext = isMe ? pointsToNext(item.karmaWeekly, rankValue) : null;

          return (
            <div
              key={item.id}
              className={`
                flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300
                ${isMe
                  ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-[1.02] ring-4 ring-white'
                  : 'bg-white border border-gray-100 hover:shadow-md hover:border-primary/15'
                }
              `}
            >
              {/* rank number */}
              <span className={`w-7 text-center text-xs font-black shrink-0 ${isMe ? 'text-white/40' : 'text-gray-300'}`}>
                #{rankValue}
              </span>

              {/* avatar */}
              <ProfileAvatar
                src={item.photoURL} 
                name={item.name} 
                size="sm"
                className={isMe ? 'ring-2 ring-white/30 !rounded-2xl' : 'ring-2 ring-gray-50 !rounded-2xl'}
              />

              {/* name + hint */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-black truncate ${isMe ? 'text-white' : 'text-gray-900'}`}>
                  {item.name}
                </p>
                {isMe && toNext ? (
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/50 mt-0.5">
                    {t('ptsToReach', { pts: String(toNext), rank: String(rankValue - 1) })}
                  </p>
                ) : !isMe ? (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {t(['titleLegend', 'titleHelping', 'titleMarketPro', 'titleNeighbor'][i % 4] as any)}
                  </p>
                ) : null}
              </div>

              {/* score */}
              <div className="text-right shrink-0">
                <p className={`text-base font-black leading-tight ${isMe ? 'text-white' : 'text-primary'}`}>
                  {item.karmaWeekly}
                </p>
                <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isMe ? 'text-white/40' : 'text-gray-400'}`}>
                  {t('points')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════ PINNED USER RANK BAR ════════ */}
      {!isUserInTop10 && userRank && (
        <div className="fixed bottom-24 inset-x-0 px-4 z-40 pointer-events-none">
          <div className="
      max-w-lg mx-auto pointer-events-auto
      bg-white dark:bg-gray-900
      border border-gray-200/80 dark:border-white/10
      px-4 py-3.5 rounded-2xl
      shadow-[0_4px_24px_rgba(0,0,0,0.08)]
      flex items-center gap-4
      animate-in slide-in-from-bottom-4 duration-500
    ">

            {/* ── rank badge ── */}
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0 gap-0">
              <span className="text-[9px] font-bold text-primary leading-none">#</span>
              <span className="text-[22px] font-black text-primary leading-none">{userRank}</span>
            </div>

            {/* ── info ── */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-primary/60">
                  {!profile?.district 
                    ? t('allKerala') 
                    : isGlobalFallback ? profile.district : profile.district}
                </p>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">
                  {isGlobalFallback || !profile?.district ? t('keralaLevel') : t('districtLevel', { district: profile?.district || '' })}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                  {userRank === 1 && isGlobalFallback ? t('pioneerMode') : `${t('rank')} #${userRank}`}
                </span>
                <span className="text-[11px] font-bold text-gray-400 dark:text-white/40 uppercase ml-1">
                  ({userWeeklyPoints} pts)
                </span>
              </div>
              
              {!profile?.district ? (
                <button 
                   onClick={() => router.push('/profile')}
                   className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-1 underline underline-offset-2"
                >
                  Set Neighborhood to claim Local #1
                </button>
              ) : (
                userRank > 1 && pointsToNext(userWeeklyPoints, userRank) && (
                  <p className="text-[10px] text-gray-500 dark:text-white/50 mt-0.5 truncate font-bold">
                    <span className="text-primary">
                      {pointsToNext(userWeeklyPoints, userRank)} pts
                    </span>
                    {' '}to reach #{userRank - 1}
                  </p>
                )
              )}
            </div>

            {/* ── divider ── */}
            <div className="w-px h-9 bg-gray-100 dark:bg-white/10 shrink-0" />

            {/* ── progress + cta ── */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {/* progress bar toward next rank */}
              <div className="w-20 sm:w-24">
                <p className="text-[9px] text-gray-400 dark:text-white/30 uppercase tracking-wide mb-1 text-right">
                  to next rank
                </p>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{
                      width: `${progressPercent()}%`,
                    }}
                  />
                </div>
              </div>

              {/* cta pill */}
              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg">
                <Zap className="w-3 h-3 text-primary fill-primary/60" />
                <span className="text-[10px] font-black uppercase tracking-wide text-primary">
                  {t('keepPosting')}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PodiumCard sub-component ──────────────────────────────────── */

interface PodiumCardProps {
  user: LeaderboardUser;
  rank: 1 | 2 | 3;
  isMe: boolean;
  extraBottom: string; // tailwind pb-* class to set visual height
}

function PodiumCard({ user, rank, isMe, extraBottom }: PodiumCardProps) {
  const rankColors = {
    1: { score: 'text-amber-500', bg: 'bg-amber-50 border-amber-200/60', badge: 'bg-amber-500' },
    2: { score: 'text-gray-500', bg: 'bg-gray-50 border-gray-200/60', badge: 'bg-gray-300' },
    3: { score: 'text-orange-400', bg: 'bg-orange-50 border-orange-200/60', badge: 'bg-orange-300' },
  }[rank];

  const avatarSize = rank === 1 ? 'lg' : 'md';
  const avatarRing = isMe ? 'ring-4 ring-primary/40' : rank === 1 ? 'ring-4 ring-amber-300/60' : 'ring-2 ring-white';

  return (
    <div className={`flex-1 flex flex-col items-center ${extraBottom} animate-in fade-in slide-in-from-bottom-2 duration-500`}>

      {/* crown for #1 */}
      {rank === 1 && (
        <Crown className="w-8 h-8 text-amber-400 fill-amber-300 mb-2 drop-shadow" />
      )}

      {/* avatar */}
      <div className="relative mb-2">
        <ProfileAvatar 
          src={user.photoURL} 
          name={user.name} 
          size={avatarSize} 
          className={`${avatarRing} !rounded-2xl`} 
        />
        {/* rank badge */}
        <span className={`
          absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg text-[10px] font-black
          text-white flex items-center justify-center border-2 border-white shadow-sm
          ${rankColors.badge}
        `}>
          {rank === 1 ? <Star className="w-3 h-3 fill-white text-white" /> : rank}
        </span>
      </div>

      {/* name */}
      <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-gray-800 text-center truncate w-full px-1 mb-1.5">
        {user.name}
      </p>

      {/* score pill */}
      <div className={`px-3 py-1 rounded-full border text-[11px] font-black ${rankColors.bg} ${rankColors.score}`}>
        {user.karmaWeekly}
      </div>
    </div>
  );
}