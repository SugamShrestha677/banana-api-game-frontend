'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function GameNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.replace('/login');
  }

  if (!user) return null;

  const initial = user.username?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-40 border-b-3 border-amber-900/30 bg-amber-100/95 backdrop-blur-xl shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Logo → home */}
        <div className="flex justify-between gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-amber-900/30 bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 text-xl shadow-md shadow-amber-900/20 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105">
              🍌
            </span>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-amber-950">
                BANANA EXPEDITION
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900/60 -mt-0.5">
                Tropical Puzzle Arena 🌴
              </span>
            </div>
          </Link>

          {/* Quick links */}
          <nav className="hidden items-center gap-2 sm:flex">
            <Link
              href="/play"
              className="flex items-center gap-1.5 rounded-xl border border-amber-900/15 bg-amber-200/60 px-3.5 py-1.5 text-xs font-black uppercase text-amber-950 shadow-sm transition-all hover:bg-amber-300 hover:shadow active:scale-95"
            >
              <span>🌴</span> Play Trails
            </Link>
            <Link
              href="/achievements"
              className="flex items-center gap-1.5 rounded-xl border border-amber-900/15 bg-amber-200/60 px-3.5 py-1.5 text-xs font-black uppercase text-amber-950 shadow-sm transition-all hover:bg-amber-300 hover:shadow active:scale-95"
            >
              <span>🏅</span> Relic Hut
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-1.5 rounded-xl border border-amber-900/15 bg-amber-200/60 px-3.5 py-1.5 text-xs font-black uppercase text-amber-950 shadow-sm transition-all hover:bg-amber-300 hover:shadow active:scale-95"
            >
              <span>🏆</span> Hall of Fame
            </Link>
          </nav>
        </div>

        {/* User menu */}
        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="flex items-center gap-2 rounded-2xl border-2 border-amber-900/30 bg-amber-50 px-2.5 py-1.5 pr-3.5 text-xs font-black text-amber-950 shadow-sm transition hover:border-amber-900/50 hover:bg-amber-200/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/50 cursor-pointer active:scale-95"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-900/30 bg-gradient-to-br from-amber-300 to-yellow-500 text-xs font-black text-amber-950 shadow-inner">
              {initial}
            </span>
            <span className="hidden max-w-[120px] truncate sm:inline">
              Scout @{user.username}
            </span>
            <svg
              className={`h-3.5 w-3.5 text-amber-900/70 transition-transform ${open ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {open && (
            <div
              role="menu"
              className="dropdown-in absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border-3 border-amber-900/40 bg-amber-50 shadow-2xl shadow-amber-950/20 backdrop-blur-xl"
            >
              <div className="border-b-2 border-amber-900/20 bg-amber-200/70 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🧭</span>
                  <p className="truncate text-sm font-black text-amber-950">
                    Scout @{user.username}
                  </p>
                </div>
                <p className="mt-0.5 truncate text-[11px] font-bold text-amber-900/70">{user.email}</p>
              </div>

              <div className="p-2 space-y-1">
                <Link
                  href="/play"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="sm:hidden flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black text-amber-950 transition hover:bg-amber-200/80"
                >
                  <span aria-hidden="true">🌴</span> Play Trails
                </Link>
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black text-amber-950 transition hover:bg-amber-200/80"
                >
                  <span aria-hidden="true">📜</span> Scout Passport
                </Link>
                <Link
                  href="/achievements"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black text-amber-950 transition hover:bg-amber-200/80"
                >
                  <span aria-hidden="true">🏺</span> Relic Hut & Badges
                </Link>
                <Link
                  href="/leaderboard"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black text-amber-950 transition hover:bg-amber-200/80"
                >
                  <span aria-hidden="true">🏆</span> Temple Hall of Fame
                </Link>
              </div>

              <div className="border-t-2 border-amber-900/20 p-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 cursor-pointer"
                >
                  <span aria-hidden="true">🚪</span> Leave Expedition (Log out)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .dropdown-in { animation: dropdown-in 0.15s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .dropdown-in { animation: none; } }
      `}</style>
    </header>
  );
}