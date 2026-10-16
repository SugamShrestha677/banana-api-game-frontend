// frontend/src/components/game/GameOverModal.tsx
'use client';

import { useEffect, useRef } from 'react';

type Props = {
  isOpen: boolean;
  score: number;
  bestScore?: number;
  roundsPlayed?: number;
  onPlayAgain: () => void;
  onExit?: () => void;
};

export default function GameOverModal({
  isOpen,
  score,
  bestScore,
  roundsPlayed,
  onPlayAgain,
  onExit,
}: Props) {
  const playAgainRef = useRef<HTMLButtonElement>(null);

  // Focus the primary action when the modal opens (accessibility + UX)
  useEffect(() => {
    if (isOpen) playAgainRef.current?.focus();
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onPlayAgain();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onPlayAgain]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isNewBest = bestScore !== undefined && score >= bestScore && score > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="overlay-in absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

      {/* Card */}
      <div className="modal-in relative w-full max-w-sm rounded-3xl border border-white/60 bg-gradient-to-b from-white to-amber-50 p-7 text-center shadow-2xl shadow-black/40">
        {/* Emoji badge */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 text-4xl shadow-lg shadow-amber-500/40">
          🍌
        </div>

        <h2
          id="game-over-title"
          className="text-2xl font-extrabold tracking-tight text-slate-900"
        >
          Game Over
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          You ran out of lives — the bananas won this round.
        </p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Final Score" value={score} highlight />
          {roundsPlayed !== undefined && (
            <Stat label="Rounds" value={roundsPlayed} />
          )}
          {bestScore !== undefined && (
            <Stat
              label={isNewBest ? 'New Best!' : 'Best'}
              value={bestScore}
              full={roundsPlayed === undefined}
            />
          )}
        </div>

        {isNewBest && (
          <p className="mt-4 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">
            🏆 New personal best!
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-2.5">
          <button
            ref={playAgainRef}
            onClick={onPlayAgain}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3.5 font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 active:scale-[0.98]"
          >
            Play Again 🍌
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes overlay-in { from { opacity: 0 } to { opacity: 1 } }
        .overlay-in { animation: overlay-in 0.25s ease-out both; }

        @keyframes modal-in {
          from { opacity: 0; transform: translateY(24px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-in { animation: modal-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }

        @media (prefers-reduced-motion: reduce) {
          .overlay-in, .modal-in { animation: none; }
        }
      `}</style>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
  full = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  full?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-3 ${
        full ? 'col-span-2' : ''
      } ${
        highlight
          ? 'border-amber-300 bg-amber-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div
        className={`mt-0.5 text-2xl font-extrabold tabular-nums ${
          highlight ? 'text-amber-600' : 'text-slate-900'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
