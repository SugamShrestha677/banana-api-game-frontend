'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ──────────────────────────────────────────────
type Difficulty = 'easy' | 'medium' | 'hard';
type DifficultyFilter = 'all' | Difficulty;

type Entry = {
  id: string;
  username: string;
  avatarUrl: string | null;
  highScore: number;
  rank: number | string;
};

type CurrentUser = {
  rank: number | string;
  username: string;
  highScore: number;
};

type ApiResponse = {
  entries: Entry[];
  currentUser: CurrentUser | null;
  total: number;
  difficulty: Difficulty | null;
};

// ─── Constants ──────────────────────────────────────────
const PAGE_SIZE = 20;
const MEDALS = ['🥇', '🥈', '🥉'];

const DIFFICULTY_TABS: {
  value: DifficultyFilter;
  label: string;
  emoji: string;
  accent: string;
}[] = [
  { value: 'all', label: 'All Modes', emoji: '🏆', accent: 'from-slate-300 to-slate-400' },
  { value: 'easy', label: 'Easy', emoji: '🍦', accent: 'from-emerald-400 to-green-500' },
  { value: 'medium', label: 'Medium', emoji: '🔥', accent: 'from-amber-400 to-orange-500' },
  { value: 'hard', label: 'Hard', emoji: '💀', accent: 'from-rose-500 to-red-600' },
];

const PODIUM_STYLES = [
  { // #1
    ring: 'ring-amber-400',
    bg: 'from-amber-300 to-yellow-500',
    text: 'text-amber-950',
    glow: 'shadow-amber-500/40',
    avatarSize: 'h-20 w-20 text-2xl',
    border: 'border-amber-300',
  },
  { // #2
    ring: 'ring-slate-300',
    bg: 'from-slate-200 to-slate-400',
    text: 'text-slate-900',
    glow: 'shadow-slate-400/30',
    avatarSize: 'h-16 w-16 text-xl',
    border: 'border-white/60',
  },
  { // #3
    ring: 'ring-orange-300',
    bg: 'from-orange-200 to-amber-400',
    text: 'text-amber-950',
    glow: 'shadow-orange-400/30',
    avatarSize: 'h-14 w-14 text-lg',
    border: 'border-white/60',
  },
];

const FLOATING_BANANAS = [
  { left: '5%', top: '10%', size: 'text-5xl', delay: '0s', duration: '9s', opacity: 'opacity-25' },
  { left: '88%', top: '15%', size: 'text-6xl', delay: '1.5s', duration: '11s', opacity: 'opacity-20' },
  { left: '12%', top: '80%', size: 'text-5xl', delay: '0.8s', duration: '10s', opacity: 'opacity-20' },
  { left: '82%', top: '78%', size: 'text-4xl', delay: '2.2s', duration: '8s', opacity: 'opacity-25' },
];

// ─── Page ───────────────────────────────────────────────
export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();

  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = useCallback(
    async (offset: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });
        if (difficulty !== 'all') params.set('difficulty', difficulty);

        const res: ApiResponse = await apiRequest(`/leaderboard?${params.toString()}`);

        const normalized = res.entries.map((e) => ({ ...e, rank: Number(e.rank) }));

        if (append) setEntries((prev) => [...prev, ...normalized]);
        else setEntries(normalized);

        setCurrentUser(
          res.currentUser
            ? { ...res.currentUser, rank: Number(res.currentUser.rank) }
            : null
        );
        setTotal(res.total);
      } catch (err) {
        setError((err as Error).message || 'Could not load the leaderboard.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [difficulty]
  );

  // Re-fetch whenever difficulty changes (after auth bootstrap)
  useEffect(() => {
    if (authLoading) return;
    fetchPage(0);
  }, [authLoading, fetchPage]);

  const handleRefresh = () => fetchPage(0);
  const handleLoadMore = () => fetchPage(entries.length, true);

  const hasMore = entries.length < total;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const userInVisibleList =
    !!user && entries.some((e) => e.username === user.username);

  const activeTab = DIFFICULTY_TABS.find((t) => t.value === difficulty)!;
  const subtitle =
    difficulty === 'all'
      ? total > 0
        ? `${total.toLocaleString()} ${total === 1 ? 'champion' : 'champions'} across all modes`
        : 'Be the first to claim the throne'
      : total > 0
      ? `${total.toLocaleString()} ${total === 1 ? 'champion' : 'champions'} in ${activeTab.label} mode`
      : `No ${activeTab.label} champions yet`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500">
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        {FLOATING_BANANAS.map((b, i) => (
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

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* ─── Hero ─────────────────────────────── */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 to-amber-500 text-4xl shadow-xl shadow-amber-500/40">
            🏆
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl">
            Hall of Fame
          </h1>
          <p className="mt-2 text-sm font-semibold text-amber-950/80">{subtitle}</p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 py-2 text-xs font-bold text-amber-900 shadow-sm backdrop-blur-sm transition hover:bg-white disabled:opacity-60"
            >
              <svg
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
                <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Refresh
            </button>
            <Link
              href="/play"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-900/20 transition hover:from-amber-600 hover:to-yellow-700"
            >
              Play Now →
            </Link>
          </div>
        </div>

        {/* ─── Difficulty tabs ─────────────────── */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {DIFFICULTY_TABS.map((tab) => {
            const active = difficulty === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setDifficulty(tab.value)}
                disabled={loading}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider shadow-md transition ${
                  active
                    ? `bg-gradient-to-r ${tab.accent} text-white ring-2 ring-white/80 scale-105`
                    : 'bg-white/70 text-amber-900 hover:bg-white'
                } disabled:opacity-60`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {!authLoading && user && currentUser && !userInVisibleList && (
          <CurrentUserCard currentUser={currentUser} difficulty={difficulty} />
        )}

        {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

        {loading && <LoadingSkeleton />}

        {!loading && !error && (
          <>
            {entries.length === 0 ? (
              <EmptyState difficulty={difficulty} />
            ) : (
              <>
                {top3.length > 0 && (
                  <Podium top3={top3} currentUsername={user?.username} />
                )}

                {rest.length > 0 && (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-2xl shadow-amber-900/10 backdrop-blur-xl">
                    <div className="divide-y divide-amber-100">
                      {rest.map((entry) => (
                        <RankRow
                          key={entry.id}
                          entry={entry}
                          isCurrentUser={entry.username === user?.username}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-6 py-3 text-sm font-bold text-amber-900 shadow-lg shadow-amber-900/10 backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingMore ? (
                        <>
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <circle cx="12" cy="12" r="9" className="opacity-25" />
                            <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                          </svg>
                          Loading…
                        </>
                      ) : (
                        <>Load more ({total - entries.length} left)</>
                      )}
                    </button>
                  </div>
                )}

                <p className="mt-10 text-center text-xs font-semibold text-amber-950/60">
                  {difficulty === 'all'
                    ? 'Overall best across all difficulties — powered by the Banana API 🍌'
                    : `${activeTab.label} mode leaderboard — powered by the Banana API 🍌`}
                </p>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes banana-float {
          0%, 100% { transform: translateY(0) rotate(-10deg); }
          50%      { transform: translateY(-24px) rotate(10deg); }
        }
        .banana-float { animation: banana-float 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .banana-float { animation: none; } }
      `}</style>
    </main>
  );
}

// ─── Podium (top 3) — fixed mobile order ────────────────
function Podium({
  top3,
  currentUsername,
}: {
  top3: Entry[];
  currentUsername?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
      {top3.map((entry, idx) => {
        const place = idx + 1;
        // Mobile: 1 → 2 → 3 (natural stacking)
        // Desktop: 2 → 1 → 3 (classic podium with 1st centred)
        const orderClass =
          place === 1 ? 'sm:order-2' : place === 2 ? 'sm:order-1' : 'sm:order-3';
        const liftClass = place === 1 ? 'sm:-translate-y-2' : '';
        return (
          <div key={entry.id} className={`${orderClass} ${liftClass}`}>
            <PodiumCard
              entry={entry}
              place={place}
              isCurrentUser={entry.username === currentUsername}
            />
          </div>
        );
      })}
    </div>
  );
}

function PodiumCard({
  entry,
  place,
  isCurrentUser,
}: {
  entry: Entry;
  place: number;
  isCurrentUser: boolean;
}) {
  const s = PODIUM_STYLES[place - 1];
  const initial = entry.username[0]?.toUpperCase() ?? '?';
  const isChampion = place === 1;

  return (
    <div
      className={`relative flex flex-col items-center rounded-2xl border-2 ${s.border} bg-white/90 p-5 backdrop-blur-xl transition-transform duration-200 hover:-translate-y-1 ${
        isChampion ? 'shadow-2xl' : 'shadow-xl'
      } ${s.glow} ${isCurrentUser ? 'ring-4 ring-amber-300/60' : ''}`}
    >
      {isChampion && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-950 shadow-lg shadow-amber-500/50">
          👑 Champion
        </div>
      )}

      <div className="mb-2 text-4xl">{MEDALS[place - 1]}</div>

      <div
        className={`mb-3 flex ${s.avatarSize} items-center justify-center rounded-full bg-gradient-to-br ${s.bg} ${s.text} font-extrabold shadow-lg ${s.glow} ring-2 ${s.ring}`}
      >
        {initial}
      </div>

      <p
        className={`max-w-[140px] truncate text-sm font-extrabold ${
          isCurrentUser ? 'text-amber-700' : 'text-slate-900'
        }`}
      >
        {entry.username}
      </p>

      {isCurrentUser && (
        <span className="mt-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
          You
        </span>
      )}

      <p className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-extrabold tabular-nums text-amber-900">
          {entry.highScore}
        </span>
        <span className="text-xs font-semibold text-amber-700/70">pts</span>
      </p>
    </div>
  );
}

// ─── Rank row ───────────────────────────────────────────
function RankRow({
  entry,
  isCurrentUser,
}: {
  entry: Entry;
  isCurrentUser: boolean;
}) {
  const initial = entry.username[0]?.toUpperCase() ?? '?';
  const rank = Number(entry.rank);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition sm:px-5 ${
        isCurrentUser
          ? 'bg-gradient-to-r from-amber-50 to-yellow-50'
          : 'hover:bg-amber-50/50'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold tabular-nums ${
          isCurrentUser
            ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-500/30'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        {rank}
      </span>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-yellow-400 text-sm font-extrabold text-amber-950 shadow-sm">
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-bold ${
            isCurrentUser ? 'text-amber-900' : 'text-slate-800'
          }`}
        >
          {entry.username}
        </p>
        {isCurrentUser && (
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
            You
          </p>
        )}
      </div>

      <div className="text-right">
        <p className="text-lg font-extrabold tabular-nums text-amber-900">
          {entry.highScore}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          pts
        </p>
      </div>
    </div>
  );
}

// ─── Current user card ─────────────────────────────────
function CurrentUserCard({
  currentUser,
  difficulty,
}: {
  currentUser: CurrentUser;
  difficulty: DifficultyFilter;
}) {
  const tab = DIFFICULTY_TABS.find((t) => t.value === difficulty)!;
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-xl shadow-amber-500/30">
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/95 text-2xl shadow-md">
          🎯
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-amber-900/70">
            Your Rank · {tab.emoji} {tab.label}
          </p>
          <p className="truncate text-xl font-extrabold text-amber-950 sm:text-2xl">
            #{Number(currentUser.rank)}
            <span className="ml-2 text-sm font-bold text-amber-900/70">
              as {currentUser.username}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold tabular-nums text-amber-950">
            {currentUser.highScore}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/70">
            pts
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ───────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border-2 border-white/60 bg-white/70 p-5"
          >
            <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-slate-200" />
            <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-slate-200" />
            <div className="mx-auto mb-2 h-3 w-24 rounded bg-slate-200" />
            <div className="mx-auto h-6 w-12 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-0"
          >
            <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
            <div className="ml-auto h-5 w-12 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────
function EmptyState({ difficulty }: { difficulty: DifficultyFilter }) {
  const tab = DIFFICULTY_TABS.find((t) => t.value === difficulty)!;
  return (
    <div className="rounded-2xl border border-white/60 bg-white/90 p-12 text-center shadow-xl backdrop-blur-xl">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 to-amber-500 text-4xl shadow-lg shadow-amber-500/30">
        🍌
      </div>
      <h2 className="mb-2 text-xl font-extrabold text-slate-900">
        No {tab.label} champions yet
      </h2>
      <p className="mb-6 text-sm text-slate-500">
        Be the first to earn a spot on this leaderboard.
      </p>
      <Link
        href="/play"
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-3 font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600"
      >
        Play {tab.label} Now 🍌
      </Link>
    </div>
  );
}

// ─── Error banner ───────────────────────────────────────
function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm"
    >
      <span className="text-lg leading-none">⚠️</span>
      <p className="flex-1 text-sm font-semibold text-red-700">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-200"
      >
        Retry
      </button>
    </div>
  );
}
