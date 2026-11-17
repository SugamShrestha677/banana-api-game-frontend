'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import GameNav from '../../components/game/GameNav';

// ─── Types ──────────────────────────────────────────────
export type AchievementItem = {
  id: string;
  name: string;
  description: string;
  category: 'milestone' | 'streak' | 'speed' | 'mastery' | 'dedication';
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  targetValue: number;
  orderIndex: number;
  unlocked: boolean;
  progress: number;
  unlockedAt: string | null;
  progressPercentage: number;
};

export type AchievementsSummary = {
  total: number;
  unlockedCount: number;
  lockedCount: number;
  completionPercentage: number;
  badgeScore: number;
  title: string;
};

type ApiResponse = {
  summary: AchievementsSummary;
  owned: AchievementItem[];
  available: AchievementItem[];
  all: AchievementItem[];
};

// ─── Tier Styling ───────────────────────────────────────
const TIER_CONFIG = {
  bronze: {
    label: 'Bronze',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    cardBorder: 'border-amber-300/80 hover:border-amber-400',
    cardBg: 'from-amber-500/10 via-amber-600/5 to-transparent',
    iconGradient: 'from-amber-500 to-amber-700 text-amber-100',
    glow: 'group-hover:shadow-amber-500/20',
    points: 10,
    emoji: '🥉',
  },
  silver: {
    label: 'Silver',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    cardBorder: 'border-slate-300/80 hover:border-slate-400',
    cardBg: 'from-slate-400/15 via-slate-500/5 to-transparent',
    iconGradient: 'from-slate-300 via-slate-400 to-slate-600 text-slate-900',
    glow: 'group-hover:shadow-slate-400/25',
    points: 25,
    emoji: '🥈',
  },
  gold: {
    label: 'Gold',
    badge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    cardBorder: 'border-yellow-400/90 hover:border-yellow-500',
    cardBg: 'from-yellow-400/20 via-amber-500/10 to-transparent',
    iconGradient: 'from-yellow-300 via-amber-400 to-yellow-600 text-amber-950',
    glow: 'group-hover:shadow-yellow-400/35',
    points: 50,
    emoji: '🥇',
  },
  platinum: {
    label: 'Platinum',
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    cardBorder: 'border-purple-400 hover:border-purple-500',
    cardBg: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    iconGradient: 'from-indigo-400 via-purple-500 to-pink-500 text-white',
    glow: 'group-hover:shadow-purple-500/35',
    points: 100,
    emoji: '💎',
  },
} as const;

const CATEGORIES = [
  { id: 'all', label: 'All Badges', emoji: '🌟' },
  { id: 'streak', label: 'Streaks', emoji: '🔥' },
  { id: 'speed', label: 'Speed', emoji: '⚡' },
  { id: 'milestone', label: 'Milestones', emoji: '🏆' },
  { id: 'mastery', label: 'Mastery', emoji: '🎯' },
  { id: 'dedication', label: 'Dedication', emoji: '🌱' },
];

export default function AchievementsPage() {
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Tabs
  const [viewTab, setViewTab] = useState<'all' | 'owned' | 'available'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedBadge, setSelectedBadge] = useState<AchievementItem | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    (async () => {
      try {
        const res: ApiResponse = await apiRequest('/achievements');
        setData(res);
      } catch (err) {
        setError((err as Error).message || 'Failed to load achievements.');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500">
        <GameNav />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/90 px-8 py-6 shadow-xl backdrop-blur-md">
            <span className="text-4xl animate-bounce">🍌</span>
            <p className="text-sm font-extrabold text-amber-900">Loading Badges Vault…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500">
        <GameNav />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-xl">
            <div className="mb-3 text-4xl">⚠️</div>
            <h1 className="mb-2 text-lg font-extrabold text-slate-900">Could not load badges</h1>
            <p className="mb-5 text-sm text-slate-500">{error || 'Please try again.'}</p>
            <Link
              href="/play"
              className="inline-block rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-2.5 text-sm font-bold text-amber-950 shadow-lg"
            >
              Back to Play
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { summary, owned, available, all } = data;

  // Filter badges according to Tab + Category
  let currentList = all;
  if (viewTab === 'owned') currentList = owned;
  if (viewTab === 'available') currentList = available;

  if (categoryFilter !== 'all') {
    currentList = currentList.filter((b) => b.category === categoryFilter);
  }

  function handleShare(badge: AchievementItem) {
    const text = badge.unlocked
      ? `🍌 I unlocked the "${badge.name}" badge in Banana Guesser! (${badge.description}) Can you beat my score?`
      : `🍌 Checking out the "${badge.name}" badge in Banana Guesser! Can you unlock it?`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500">
      <GameNav />

      {/* Floating background bananas */}
      <FloatingBananas />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* ─── Hero Header & Player Trophy Rank ──────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-amber-950/20 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            {/* Player Info & Title */}
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 text-4xl shadow-xl shadow-amber-500/30 ring-4 ring-white">
                🏆
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Badges & Achievements
                  </h1>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Player Rank: <span className="text-amber-600 font-extrabold">{summary.title}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-amber-100 px-3 py-1 font-extrabold text-amber-900">
                    ⭐ {summary.badgeScore} Badge Points
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
                    {summary.unlockedCount} of {summary.total} Completed ({summary.completionPercentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Link
                href="/play"
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-3 text-sm font-black text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600 active:scale-95"
              >
                <span>🍌</span> Play & Unlock More
              </Link>
            </div>
          </div>

          {/* Master Progress Bar */}
          <div className="mt-6 border-t border-amber-100 pt-5">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              <span>Collection Progress</span>
              <span className="text-amber-700 font-black">{summary.completionPercentage}% Complete</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 shadow-sm transition-all duration-700 ease-out"
                style={{ width: `${Math.max(4, summary.completionPercentage)}%` }}
              />
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Owned Badges</p>
              <p className="mt-1 text-2xl font-black text-amber-950">{summary.unlockedCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">Available to Claim</p>
              <p className="mt-1 text-2xl font-black text-slate-800">{summary.lockedCount}</p>
            </div>
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50/70 p-3.5 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-yellow-800">Badge Score</p>
              <p className="mt-1 text-2xl font-black text-yellow-950">{summary.badgeScore} XP</p>
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-3.5 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-orange-800">Completion</p>
              <p className="mt-1 text-2xl font-black text-orange-950">{summary.completionPercentage}%</p>
            </div>
          </div>
        </section>

        {/* ─── Gamified Collection View Selector (Owned vs Available) ─── */}
        <section className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Main 3 Section Tabs */}
          <div className="inline-flex rounded-2xl bg-white/90 p-1.5 shadow-lg shadow-amber-950/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setViewTab('all')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                viewTab === 'all'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🌟</span> All Badges
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px]">
                {all.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab('owned')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                viewTab === 'owned'
                  ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-emerald-950 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏆</span> Owned Badges
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px]">
                {owned.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab('available')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                viewTab === 'available'
                  ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🔒</span> Available / Locked
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                {available.length}
              </span>
            </button>
          </div>

          {/* Quick Counter Banner */}
          <div className="text-right text-xs font-bold text-amber-950">
            Showing <span className="font-extrabold">{currentList.length}</span> badges
          </div>
        </section>

        {/* ─── Category Filter Pills ─────────────────────────────────── */}
        <section className="mt-4 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition shadow-sm ${
                  active
                    ? 'border-2 border-amber-950 bg-amber-950 text-white shadow-md'
                    : 'border border-white/60 bg-white/80 text-slate-700 hover:bg-white'
                }`}
              >
                <span>{cat.emoji}</span> {cat.label}
              </button>
            );
          })}
        </section>

        {/* ─── Badges Grid ────────────────────────────────────────────── */}
        <section className="mt-6">
          {currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/60 bg-white/80 p-12 text-center shadow-xl">
              <span className="text-5xl">🍌</span>
              <h3 className="mt-4 text-lg font-black text-slate-800">No badges found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {viewTab === 'owned'
                  ? "You haven't unlocked badges in this category yet. Keep playing to earn them!"
                  : 'No badges match this category.'}
              </p>
              {viewTab === 'owned' && (
                <Link
                  href="/play"
                  className="mt-5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-2.5 text-sm font-extrabold text-amber-950 shadow-lg"
                >
                  Play Now 🍌
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentList.map((badge) => {
                const tier = TIER_CONFIG[badge.tier] || TIER_CONFIG.bronze;
                const isOwned = badge.unlocked;

                return (
                  <div
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className={`group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border-2 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
                      isOwned
                        ? `bg-white/95 ${tier.cardBorder} ${tier.glow} shadow-amber-950/10`
                        : 'border-slate-200/80 bg-white/70 opacity-90 hover:opacity-100 hover:border-slate-300'
                    }`}
                  >
                    {/* Background subtle gradient */}
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${
                        isOwned ? tier.cardBg : 'from-slate-200/20 to-transparent'
                      }`}
                    />

                    <div>
                      {/* Top Bar: Icon + Tier + Status */}
                      <div className="flex items-start justify-between gap-3">
                        {/* Emblem Icon */}
                        <div
                          className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-md transition-transform duration-300 group-hover:scale-105 ${
                            isOwned
                              ? `bg-gradient-to-br ${tier.iconGradient} ring-2 ring-white/60`
                              : 'bg-slate-200 text-slate-400 grayscale'
                          }`}
                        >
                          <span>{badge.icon}</span>
                          {!isOwned && (
                            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] text-white shadow-md">
                              🔒
                            </span>
                          )}
                          {isOwned && (
                            <span className="absolute -top-1 -right-1 text-xs">✨</span>
                          )}
                        </div>

                        {/* Badges / Chips */}
                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${tier.badge}`}
                          >
                            {tier.emoji} {tier.label}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold text-slate-600 uppercase">
                            +{tier.points} XP
                          </span>
                        </div>
                      </div>

                      {/* Title & Lore */}
                      <div className="mt-4">
                        <h3 className="text-base font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                          {badge.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {badge.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Status / Progress Section */}
                    <div className="mt-5 border-t border-slate-100 pt-3">
                      {isOwned ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 font-extrabold text-emerald-600">
                            <span>✓</span> UNLOCKED
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {badge.unlockedAt
                              ? new Date(badge.unlockedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Owned'}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 mb-1.5">
                            <span>Progress</span>
                            <span className="font-bold text-slate-700">
                              {badge.progress} / {badge.targetValue} ({badge.progressPercentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
                              style={{ width: `${badge.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── Badge Inspection Modal ───────────────────────────────── */}
        {selectedBadge && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              onClick={() => setSelectedBadge(null)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-white/80 bg-gradient-to-b from-white to-amber-50 p-6 text-center shadow-2xl">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Large Animated Emblem */}
              {(() => {
                const tier = TIER_CONFIG[selectedBadge.tier] || TIER_CONFIG.bronze;
                const isOwned = selectedBadge.unlocked;

                return (
                  <div>
                    <div
                      className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl text-5xl shadow-2xl ${
                        isOwned
                          ? `bg-gradient-to-br ${tier.iconGradient} ring-4 ring-amber-300/40 animate-pulse`
                          : 'bg-slate-200 text-slate-400 grayscale ring-4 ring-slate-300/40'
                      }`}
                    >
                      <span>{selectedBadge.icon}</span>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className={`rounded-full border px-3 py-0.5 text-xs font-black uppercase ${tier.badge}`}>
                        {tier.emoji} {tier.label} Tier
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-black text-amber-900 uppercase">
                        {selectedBadge.category}
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900">{selectedBadge.name}</h2>
                    <p className="mt-2 text-sm text-slate-600 px-4">{selectedBadge.description}</p>

                    {/* Progress / Unlock Info */}
                    <div className="mt-6 rounded-2xl border border-amber-200/80 bg-white/80 p-4 text-left shadow-xs">
                      <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Status</span>
                        {isOwned ? (
                          <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                            ✓ Unlocked on{' '}
                            {selectedBadge.unlockedAt
                              ? new Date(selectedBadge.unlockedAt).toLocaleDateString()
                              : 'Completed'}
                          </span>
                        ) : (
                          <span className="text-amber-800 font-extrabold">🔒 In Progress</span>
                        )}
                      </div>

                      {!isOwned && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                            <span>Requirement Progress</span>
                            <span>
                              {selectedBadge.progress} / {selectedBadge.targetValue}
                            </span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
                              style={{ width: `${selectedBadge.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Share / Brag CTA */}
                    <div className="mt-6 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleShare(selectedBadge)}
                        className="w-full rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white transition hover:bg-slate-800 active:scale-98"
                      >
                        {copied ? '✅ Copied to clipboard!' : '📣 Brag & Share Badge'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBadge(null)}
                        className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Floating Bananas ───────────────────────────────────
function FloatingBananas() {
  const positions = [
    { left: '4%', top: '8%', size: 'text-5xl', delay: '0s', duration: '9s', opacity: 'opacity-20' },
    { left: '90%', top: '12%', size: 'text-6xl', delay: '1.5s', duration: '12s', opacity: 'opacity-15' },
    { left: '10%', top: '75%', size: 'text-5xl', delay: '0.8s', duration: '10s', opacity: 'opacity-15' },
    { left: '88%', top: '70%', size: 'text-4xl', delay: '2.2s', duration: '8s', opacity: 'opacity-20' },
  ];
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        {positions.map((b, i) => (
          <span
            key={i}
            className={`banana-float absolute ${b.size} ${b.opacity}`}
            style={{
              left: b.left,
              top: b.top,
              animationDelay: b.delay,
              animationDuration: b.duration,
            }}
          >
            🍌
          </span>
        ))}
      </div>
      <style>{`
        @keyframes banana-float {
          0%, 100% { transform: translateY(0) rotate(-10deg); }
          50%      { transform: translateY(-24px) rotate(10deg); }
        }
        .banana-float { animation: banana-float 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .banana-float { animation: none; } }
      `}</style>
    </>
  );
}
