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
    <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo → home */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 to-amber-500 text-lg shadow-md shadow-amber-500/30 transition-transform duration-300 group-hover:rotate-12">
            🍌
          </span>
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            Banana Guesser
          </span>
        </Link>

        {/* User menu */}
        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-2 py-1.5 pr-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/50"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-yellow-500 text-xs font-extrabold text-amber-950">
              {initial}
            </span>
            <span className="hidden max-w-[100px] truncate sm:inline">
              {user.username}
            </span>
            <svg
              className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
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
              className="dropdown-in absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-amber-200 bg-white shadow-xl shadow-amber-900/10"
            >
              <div className="border-b border-amber-100 bg-amber-50/60 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.username}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
              </div>

              <div className="p-1.5">
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-amber-50"
                >
                  <span aria-hidden="true">👤</span> Profile
                </Link>
                <Link
                  href="/leaderboard"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-amber-50"
                >
                  <span aria-hidden="true">🏆</span> Leaderboard
                </Link>
              </div>

              <div className="border-t border-amber-100 p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <span aria-hidden="true">↪</span> Log out
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