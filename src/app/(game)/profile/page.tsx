'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ─────────────────────────────────────────────
type ProfileUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  highScore: number;
  createdAt: string;
};

type Stats = {
  gamesPlayed: number;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  bestStreak: number;
  rank: number | null;
};

type StatsResponse = {
  user: ProfileUser;
  stats: Stats;
};

// ─── Page ──────────────────────────────────────────────
export default function ProfilePage() {
  const { user: ctxUser, loading: authLoading } = useAuth();

  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!ctxUser) return; // guard handled by layout

    (async () => {
      try {
        const res: StatsResponse = await apiRequest('/users/me/stats');
        setData(res);
      } catch (err) {
        setError((err as Error).message || 'Could not load your profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, ctxUser]);

  if (loading) return <ProfileSkeleton />;
  if (error || !data) return <ProfileError message={error} />;

  const { user, stats } = data;
  const initial = user.username[0]?.toUpperCase() ?? '?';
  const joined = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500">
      <FloatingBananas />

      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* ─── Hero card ────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl shadow-amber-900/20 backdrop-blur-xl">
          <div className="h-24 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400" />
          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 to-amber-500 text-3xl font-extrabold text-amber-950 shadow-xl shadow-amber-500/40 ring-4 ring-white">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="h-full w-full rounded-3xl object-cover"
                  />
                ) : (
                  initial
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {user.username}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <RoleBadge role={user.role} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Joined {joined}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/play"
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2.5 text-sm font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600"
                >
                  Play
                </Link>
                <Link
                  href="/leaderboard"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Stats grid ───────────────────────── */}
        <section className="mt-6">
          <h2 className="mb-3 px-1 text-sm font-extrabold uppercase tracking-wider text-white/90">
            Your Stats
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <StatCard
              icon="🏆"
              label="High Score"
              value={user.highScore}
              accent="amber"
            />
            <StatCard
              icon="📊"
              label="Rank"
              value={stats.rank ? `#${stats.rank}` : '—'}
              accent="orange"
            />
            <StatCard
              icon="🎯"
              label="Accuracy"
              value={`${stats.accuracy}%`}
              accent="green"
            />
            <StatCard
              icon="🔥"
              label="Best Streak"
              value={stats.bestStreak}
              accent="red"
            />
          </div>

          {/* Secondary line: games played + answers */}
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-white/80">
            <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
              {stats.gamesPlayed} {stats.gamesPlayed === 1 ? 'game' : 'games'} played
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
              {stats.correctAnswers} / {stats.totalAnswers} correct answers
            </span>
          </div>
        </section>

        {/* ─── Change password ─────────────────── */}
        <section className="mt-8">
          <ChangePasswordCard />
        </section>

        {/* Footer */}
        <p className="mt-10 text-center text-xs font-semibold text-amber-950/60">
          Keep guessing — every correct answer counts. 🍌
        </p>
      </div>
    </main>
  );
}

// ─── Stat card ─────────────────────────────────────────
const ACCENTS = {
  amber: 'from-amber-400 to-yellow-500 text-amber-950',
  orange: 'from-orange-400 to-amber-500 text-orange-950',
  green: 'from-emerald-400 to-green-500 text-emerald-950',
  red: 'from-rose-400 to-red-500 text-rose-950',
} as const;

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  accent: keyof typeof ACCENTS;
}) {
  return (
    <div className="group rounded-2xl border border-white/60 bg-white/90 p-4 shadow-lg shadow-amber-900/10 backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5">
      <div
        className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${ACCENTS[accent]} text-lg shadow-md`}
      >
        {icon}
      </div>
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'admin';
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
        isAdmin
          ? 'bg-purple-100 text-purple-700'
          : 'bg-emerald-100 text-emerald-700'
      }`}
    >
      {isAdmin ? '👑 Admin' : '✓ Member'}
    </span>
  );
}

// ─── Change password card ──────────────────────────────
function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (next.length < 6) return setError('New password must be at least 6 characters.');
    if (next !== confirm) return setError('New passwords do not match.');
    if (next === current) return setError('New password must be different.');

    setLoading(true);
    try {
      const res = await apiRequest('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setSuccess(res.message || 'Password changed successfully.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-xl shadow-amber-900/10 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-amber-50/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-lg">
            🔐
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900">Change Password</p>
            <p className="text-xs text-slate-500">Update your account password</p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-amber-100 px-5 py-5">
          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm font-semibold text-green-700">
              ✅ {success}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">
              ⚠️ {error}
            </div>
          )}

          <PasswordField
            label="Current Password"
            value={current}
            onChange={setCurrent}
            show={show}
            disabled={loading}
            autoComplete="current-password"
          />
          <PasswordField
            label="New Password"
            value={next}
            onChange={setNext}
            show={show}
            disabled={loading}
            autoComplete="new-password"
            hint="At least 6 characters"
          />
          <PasswordField
            label="Confirm New Password"
            value={confirm}
            onChange={setConfirm}
            show={show}
            disabled={loading}
            autoComplete="new-password"
          />

          <div className="flex items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <input
                type="checkbox"
                checked={show}
                onChange={(e) => setShow(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
              />
              Show passwords
            </label>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-2.5 text-sm font-bold text-amber-950 shadow-md shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600 disabled:opacity-60"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  disabled,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  disabled: boolean;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/25 disabled:opacity-60"
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────
function FloatingBananas() {
  const positions = [
    { left: '5%', top: '10%', size: 'text-5xl', delay: '0s', duration: '9s', opacity: 'opacity-25' },
    { left: '88%', top: '15%', size: 'text-6xl', delay: '1.5s', duration: '11s', opacity: 'opacity-20' },
    { left: '12%', top: '80%', size: 'text-5xl', delay: '0.8s', duration: '10s', opacity: 'opacity-20' },
    { left: '82%', top: '78%', size: 'text-4xl', delay: '2.2s', duration: '8s', opacity: 'opacity-25' },
  ];
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
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

function ProfileSkeleton() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="animate-pulse overflow-hidden rounded-3xl border border-white/60 bg-white/70">
          <div className="h-24 bg-amber-300/50" />
          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-12 h-24 w-24 rounded-3xl bg-slate-300" />
            <div className="mt-4 space-y-2">
              <div className="h-6 w-40 rounded bg-slate-300" />
              <div className="h-4 w-56 rounded bg-slate-200" />
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/70" />
          ))}
        </div>
      </div>
    </main>
  );
}

function ProfileError({ message }: { message: string }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-xl">
        <div className="mb-3 text-4xl">⚠️</div>
        <h1 className="mb-2 text-lg font-extrabold text-slate-900">
          Could not load your profile
        </h1>
        <p className="mb-5 text-sm text-slate-500">{message || 'Please try again.'}</p>
        <Link
          href="/play"
          className="inline-block rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-2.5 text-sm font-bold text-amber-950 shadow-lg shadow-amber-500/30"
        >
          Back to Play
        </Link>
      </div>
    </main>
  );
}
