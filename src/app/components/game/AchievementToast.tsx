'use client';

import { useEffect, useState } from 'react';
import { playAchievementSound } from '@/lib/audio';

export type Achievement = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  targetValue: number;
  orderIndex: number;
};

type Props = {
  queue: Achievement[];
  onDismiss: (id: string) => void;
};

const TIER_COLORS = {
  bronze: {
    bg: 'from-amber-600 to-amber-800',
    border: 'border-amber-400',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    glow: 'shadow-amber-500/40',
    label: '🥉 Bronze',
  },
  silver: {
    bg: 'from-slate-400 to-slate-600',
    border: 'border-slate-300',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    glow: 'shadow-slate-400/40',
    label: '🥈 Silver',
  },
  gold: {
    bg: 'from-yellow-400 to-amber-500',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    glow: 'shadow-yellow-400/50',
    label: '🥇 Gold',
  },
  platinum: {
    bg: 'from-indigo-500 via-purple-500 to-pink-500',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    glow: 'shadow-purple-500/50',
    label: '💎 Platinum',
  },
};

export default function AchievementToast({ queue, onDismiss }: Props) {
  const current = queue[0];
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  useEffect(() => {
    if (!current) return;
    playAchievementSound();

    const timer = setTimeout(() => {
      setDismissingId(current.id);
      setTimeout(() => onDismiss(current.id), 300);
    }, 4500);

    return () => clearTimeout(timer);
  }, [current, onDismiss]);

  if (!current) return null;

  const leaving = dismissingId === current.id;
  const tierStyle = TIER_COLORS[current.tier] || TIER_COLORS.bronze;

  return (
    <div className="pointer-events-none fixed top-5 left-1/2 z-50 -translate-x-1/2 px-4">
      <div
        className={`pointer-events-auto relative flex max-w-md items-center gap-4 overflow-hidden rounded-2xl border-2 ${
          tierStyle.border
        } bg-slate-900/95 p-4 text-white shadow-2xl ${
          tierStyle.glow
        } backdrop-blur-xl transition-all duration-300 ${
          leaving ? 'translate-y-[-20px] opacity-0' : 'toast-slide-down'
        }`}
      >
        {/* Shimmer line */}
        <div className="shimmer-effect absolute inset-0 pointer-events-none" />

        {/* Badge Icon Emblem */}
        <div
          className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tierStyle.bg} text-3xl shadow-lg ring-2 ring-white/30`}
        >
          <span>{current.icon}</span>
          <span className="absolute -top-1 -right-1 text-xs">✨</span>
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
              Achievement Unlocked!
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${tierStyle.badge}`}
            >
              {tierStyle.label}
            </span>
          </div>

          <h4 className="mt-0.5 truncate text-base font-extrabold text-white">
            {current.name}
          </h4>
          <p className="line-clamp-2 text-xs text-slate-300">{current.description}</p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => {
            setDismissingId(current.id);
            setTimeout(() => onDismiss(current.id), 200);
          }}
          className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes toast-slide-down {
          0% {
            opacity: 0;
            transform: translateY(-40px) scale(0.9);
          }
          60% {
            opacity: 1;
            transform: translateY(4px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .toast-slide-down {
          animation: toast-slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(25deg); }
          100% { transform: translateX(200%) rotate(25deg); }
        }
        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.12),
            transparent
          );
          animation: shimmer 2.5s infinite;
        }
      `}</style>
    </div>
  );
}
