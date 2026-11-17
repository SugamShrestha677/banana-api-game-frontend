'use client';

import { useMemo } from 'react';

export type MascotState = 'idle' | 'thinking' | 'correct' | 'wrong' | 'streak' | 'urgent';

type Props = {
  state: MascotState;
  streakCount?: number;
  customMessage?: string;
};

export default function CartoonMascot({ state, streakCount = 0, customMessage }: Props) {
  const speech = useMemo(() => {
    if (customMessage) return customMessage;
    switch (state) {
      case 'correct':
        if (streakCount >= 5) return '🔥 UNSTOPPABLE MONKEY KING!';
        if (streakCount >= 3) return '⚡ WOW! YOU ARE ON FIRE!';
        return '🍌 OOH OOH AAH! That’s correct!';
      case 'wrong':
        return '🙈 Whoops! Slipped on a peel! You got this!';
      case 'streak':
        return `🔥 ${streakCount} IN A ROW! Pure monkey genius!`;
      case 'urgent':
        return '⏰ QUICK QUICK! The coconut is ticking!';
      case 'thinking':
        return '🤔 Hmm, calculate the bananas carefully…';
      case 'idle':
      default:
        return '🐵 Welcome explorer! Crack the banana code!';
    }
  }, [state, streakCount, customMessage]);

  return (
    <div className="relative flex items-center gap-3">
      {/* Cartoon Monkey SVG Character */}
      <div className="relative flex-shrink-0">
        <div
          className={`relative h-20 w-20 sm:h-24 sm:w-24 transition-transform duration-300 ${
            state === 'correct'
              ? 'animate-bounce'
              : state === 'wrong'
              ? 'animate-wobble'
              : state === 'urgent'
              ? 'animate-shake-urgent'
              : 'hover:scale-105'
          }`}
        >
          {/* Glowing Aura for Streak */}
          {(state === 'streak' || streakCount >= 3) && (
            <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 blur-md opacity-80 animate-pulse" />
          )}

          <svg
            viewBox="0 0 120 120"
            className="h-full w-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
          >
            <defs>
              <linearGradient id="monkeyFur" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <linearGradient id="monkeyFace" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fcd34d" />
              </linearGradient>
              <linearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>

            {/* Monkey Ears */}
            <circle cx="28" cy="55" r="18" fill="url(#monkeyFur)" stroke="#451a03" strokeWidth="3" />
            <circle cx="28" cy="55" r="10" fill="url(#monkeyFace)" />
            <circle cx="92" cy="55" r="18" fill="url(#monkeyFur)" stroke="#451a03" strokeWidth="3" />
            <circle cx="92" cy="55" r="10" fill="url(#monkeyFace)" />

            {/* Monkey Head */}
            <circle cx="60" cy="58" r="38" fill="url(#monkeyFur)" stroke="#451a03" strokeWidth="3.5" />

            {/* Explorer Hat */}
            <path
              d="M 32 35 C 32 20, 88 20, 88 35 Z"
              fill="#d97706"
              stroke="#78350f"
              strokeWidth="2.5"
            />
            <path
              d="M 22 35 C 22 33, 98 33, 98 35 C 98 38, 22 38, 22 35 Z"
              fill="#b45309"
              stroke="#78350f"
              strokeWidth="2"
            />
            <circle cx="60" cy="22" r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />

            {/* Face Mask (Heart-ish shaped muzzle) */}
            <path
              d="M 38 60 C 38 48, 52 48, 60 54 C 68 48, 82 48, 82 60 C 82 78, 60 85, 60 85 C 60 85, 38 78, 38 60 Z"
              fill="url(#monkeyFace)"
              stroke="#b45309"
              strokeWidth="2"
            />

            {/* Eyes */}
            {state === 'wrong' ? (
              // Spiral / Dizzy Eyes
              <g stroke="#78350f" strokeWidth="2.5" fill="none">
                <path d="M 44 58 L 54 66 M 54 58 L 44 66" />
                <path d="M 66 58 L 76 66 M 76 58 L 66 66" />
              </g>
            ) : state === 'correct' || state === 'streak' ? (
              // Star / Joyful Happy Eyes
              <g fill="#78350f">
                <path d="M 43 64 C 43 56, 53 56, 53 64 Z" />
                <path d="M 67 64 C 67 56, 77 56, 77 64 Z" />
                {/* Cheerful blush */}
                <ellipse cx="38" cy="68" rx="4" ry="2" fill="#f87171" opacity="0.8" />
                <ellipse cx="82" cy="68" rx="4" ry="2" fill="#f87171" opacity="0.8" />
              </g>
            ) : state === 'urgent' ? (
              // Wide shock eyes
              <g>
                <circle cx="48" cy="60" r="6" fill="#ffffff" stroke="#78350f" strokeWidth="2" />
                <circle cx="48" cy="60" r="3" fill="#1e293b" />
                <circle cx="72" cy="60" r="6" fill="#ffffff" stroke="#78350f" strokeWidth="2" />
                <circle cx="72" cy="60" r="3" fill="#1e293b" />
                {/* Sweat drop */}
                <path
                  d="M 90 42 C 90 38, 95 35, 95 30 C 95 35, 100 38, 100 42 C 100 46, 90 46, 90 42 Z"
                  fill="#38bdf8"
                  className="animate-pulse"
                />
              </g>
            ) : (
              // Friendly normal blinking eyes
              <g fill="#451a03">
                <circle cx="48" cy="60" r="4.5" />
                <circle cx="50" cy="58" r="1.5" fill="#ffffff" />
                <circle cx="72" cy="60" r="4.5" />
                <circle cx="74" cy="58" r="1.5" fill="#ffffff" />
              </g>
            )}

            {/* Nose */}
            <ellipse cx="60" cy="68" rx="3.5" ry="2.5" fill="#78350f" />

            {/* Mouth */}
            {state === 'wrong' ? (
              // Wobbly sad mouth
              <path
                d="M 52 78 C 56 74, 64 74, 68 78"
                fill="none"
                stroke="#78350f"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ) : state === 'correct' || state === 'streak' ? (
              // Big happy open smile
              <path
                d="M 50 73 C 50 82, 70 82, 70 73 Z"
                fill="#b91c1c"
                stroke="#78350f"
                strokeWidth="2"
              />
            ) : (
              // Cute friendly smile
              <path
                d="M 52 73 C 56 78, 64 78, 68 73"
                fill="none"
                stroke="#78350f"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Held Banana in Hand */}
            <g transform="translate(78, 70) rotate(-25)">
              <path
                d="M 0 0 C 12 -4, 25 8, 28 22 C 22 18, 10 10, 0 0 Z"
                fill="url(#bananaGrad)"
                stroke="#854d0e"
                strokeWidth="1.5"
              />
              <path d="M 28 22 L 31 25" stroke="#713f12" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </div>

      {/* Comic Speech Bubble */}
      <div className="relative max-w-xs sm:max-w-sm rounded-2xl border-2 border-amber-900/30 bg-amber-50/95 p-3 sm:p-3.5 shadow-lg backdrop-blur-md">
        {/* Pointer arrow pointing to monkey */}
        <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 h-0 w-0 border-y-[7px] border-y-transparent border-r-[10px] border-r-amber-50/95 drop-shadow-[-2px_0_1px_rgba(120,53,15,0.2)]" />

        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
          <span>🐵 Professor Chimpy</span>
          {streakCount >= 2 && (
            <span className="rounded-full bg-amber-200 px-1.5 py-0.2 text-[9px] text-amber-950 font-bold">
              🔥 {streakCount}x Streak
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs sm:text-sm font-black text-slate-800 leading-snug">
          {speech}
        </p>
      </div>

      <style jsx>{`
        @keyframes wobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        .animate-wobble {
          animation: wobble 0.4s ease-in-out 2;
        }

        @keyframes shake-urgent {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px) scale(1.05); }
        }
        .animate-shake-urgent {
          animation: shake-urgent 0.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
