"use client";

import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Star, Loader2, Zap } from 'lucide-react';
import {
  collection, query, orderBy, limit,
  onSnapshot, where, getCountFromServer, doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface LeaderboardUser {
  id: string;
  name: string;
  photoURL?: string;
  karmaWeekly: number;
  karmaTotal: number;
}

/* ─── tiny helpers ─────────────────────────────────────────────── */

/** Safe initials: never crashes on empty/undefined names */
function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
}

/** Avatar with onError fallback so broken URLs never leave a blank square */
function Avatar({
  src, name, size = 'md', ring,
}: {
  src?: string; name: string; size?: 'sm' | 'md' | 'lg'; ring?: string;
}) {
  const [errored, setErrored] = useState(false);
  const dims = { sm: 'w-11 h-11 text-xs', md: 'w-14 h-14 text-sm', lg: 'w-20 h-20 text-base' }[size];
  const ringCls = ring ?? 'ring-2 ring-white/60';

  return (
    <div className={`${dims} ${ringCls} rounded-2xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center font-black text-gray-400`}>
      {src && !errored ? (
        <img
          src={src} alt={name}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}

/* ─── main component ────────────────────────────────────────────── */

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userWeeklyPoints, setUserWeeklyPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  /* — listen to top 10 — */
  useEffect(() => {
    const topQuery = query(
      collection(db, 'users'),
      orderBy('karmaWeekly', 'desc'),
      orderBy('karmaTotal', 'desc'),
      orderBy('createdAt', 'asc'),
      limit(10),
    );
    const unsub = onSnapshot(topQuery, (snap) => {
      setTopUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaderboardUser)));
      setLoading(false);
    });
    return unsub;
  }, []);

  /* — compute current user's rank — */
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      async (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const pts = data.karmaWeekly || 0;
        const tot = data.karmaTotal || 0;
        setUserWeeklyPoints(pts);

        try {
          const [wSnap, tSnap, sSnap] = await Promise.all([
            getCountFromServer(query(collection(db, 'users'), where('karmaWeekly', '>', pts))),
            getCountFromServer(query(collection(db, 'users'), where('karmaWeekly', '==', pts), where('karmaTotal', '>', tot))),
            getCountFromServer(query(collection(db, 'users'), where('karmaWeekly', '==', pts), where('karmaTotal', '==', tot), where('createdAt', '<', data.createdAt))),
          ]);

          setUserRank(wSnap.data().count + tSnap.data().count + sSnap.data().count + 1);
        } catch (err) {
          console.error("Failed to compute user rank:", err);
        }
      },
      (err) => {
        console.error("Leaderboard user listener error:", err);
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
   * Returns null when already #1 or when the user above can't be found.
   */
  const pointsToNext = (weeklyPts: number, rank: number): number | null => {
    if (rank <= 1) return null;
    const targetIndex = Math.min(rank - 2, topUsers.length - 1);
    const above = topUsers[targetIndex];
    if (!above) return null;
    const diff = above.karmaWeekly - weeklyPts;
    return diff > 0 ? diff : 1;
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
  if (!topUsers.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-gray-400">
        <Trophy className="w-10 h-10" />
        <p className="text-sm font-black uppercase tracking-widest">{t('noRankingsYet')}</p>
      </div>
    );
  }

  /* ─── render ─── */
  return (
    <div className="min-h-screen bg-[#F7F6F3] pb-36 animate-in fade-in duration-500">

      {/* ════════ HEADER + PODIUM ════════ */}
      <div className="bg-white px-4 pt-10 pb-0 rounded-b-[2.5rem] shadow-sm overflow-hidden">

        {/* title */}
        <h1 className="text-center text-xl font-black text-gray-900 tracking-tight mb-8">
          {t('topNattukarans')}
        </h1>

        {/*
          PODIUM LAYOUT
          — rank-2 and rank-3 columns are shorter (no bottom padding)
          — rank-1 sits on extra height via pb on its inner block
          Container is flex items-end so cards naturally "stand on the stage"
        */}
        <div className="flex items-end justify-center gap-2 sm:gap-4 w-full max-w-sm mx-auto">

          {/* ── Rank 2 ── */}
          {second && (
            <PodiumCard
              user={second} rank={2} isMe={second.id === user?.uid}
              extraBottom="pb-4"
            />
          )}

          {/* ── Rank 1 (tallest) ── */}
          {first && (
            <PodiumCard
              user={first} rank={1} isMe={first.id === user?.uid}
              extraBottom="pb-10"
            />
          )}

          {/* ── Rank 3 ── */}
          {third && (
            <PodiumCard
              user={third} rank={3} isMe={third.id === user?.uid}
              extraBottom="pb-0"
            />
          )}
        </div>

        {/* podium stage bar */}
        <div className="flex items-end justify-center gap-2 sm:gap-4 w-full max-w-sm mx-auto mt-0">
          {second && <div className="flex-1 h-6 bg-gray-100 rounded-t-xl" />}
          {first && <div className="flex-1 h-10 bg-primary/10 rounded-t-xl" />}
          {third && <div className="flex-1 h-4 bg-gray-100 rounded-t-xl" />}
        </div>
      </div>

      {/* ════════ RANKS 4–10 LIST ════════ */}
      <div className="px-4 max-w-lg mx-auto mt-6 space-y-2.5">
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
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.015]'
                  : 'bg-white border border-gray-100 hover:shadow-md hover:border-primary/15'
                }
              `}
            >
              {/* rank number */}
              <span className={`w-7 text-center text-xs font-black shrink-0 ${isMe ? 'text-white/40' : 'text-gray-300'}`}>
                #{rankValue}
              </span>

              {/* avatar */}
              <Avatar
                src={item.photoURL} name={item.name} size="sm"
                ring={isMe ? 'ring-2 ring-white/30' : 'ring-2 ring-gray-50'}
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
                    {t('neighborhoodHero')}
                  </p>
                ) : null}
              </div>

              {/* score */}
              <div className="text-right shrink-0">
                <p className={`text-base font-black leading-none ${isMe ? 'text-white' : 'text-primary'}`}>
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-0.5">
                {t('yourStand')}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                  {userWeeklyPoints}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-white/40 uppercase">
                  {t('points')}
                </span>
              </div>
              {userRank > 1 && pointsToNext(userWeeklyPoints, userRank) && (
                <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5 truncate">
                  <span className="font-black text-gray-800 dark:text-white">
                    {pointsToNext(userWeeklyPoints, userRank)} pts
                  </span>
                  {' '}to reach #{userRank - 1}
                </p>
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
                      width: `${Math.min(
                        100,
                        userRank <= 11
                          ? (userWeeklyPoints / (topUsers[userRank - 2]?.karmaWeekly || 1)) * 100
                          : (userWeeklyPoints / (topUsers[0]?.karmaWeekly || 1)) * 100
                      )}%`,
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
        <Crown className="w-8 h-8 text-amber-400 fill-amber-300 mb-2 drop-shadow animate-bounce [animation-duration:2.5s]" />
      )}

      {/* avatar */}
      <div className="relative mb-2">
        <Avatar src={user.photoURL} name={user.name} size={avatarSize} ring={avatarRing} />
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