'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAccessToken } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import GameOverModal from '../../components/game/GameOverModal';
import GameNav from '../../components/game/GameNav';

// ─── Types ──────────────────────────────────────────────
type Puzzle = { id: string; imageUrl: string };
type Difficulty = 'easy' | 'medium' | 'hard';

type GameSession = {
  gameId: string;
  difficulty: Difficulty;
  lives: number;
  score: number;
  pointsPerCorrect: number;
  highScores?: Record<Difficulty, number>;
};

type AnswerResult = {
  correct: boolean;
  correctAnswer?: string;
  pointsAwarded: number;
  score: number;
  lives: number;
  gameOver: boolean;
};

type EndResult = {
  finalScore: number;
  difficulty: Difficulty;
  highScores: Record<Difficulty, number>;
  difficultyBest: number;
  highScore: number;
  isNewRecord: boolean;
};

// ─── Difficulty display config ──────────────────────────
const DIFFICULTIES: Record<
  Difficulty,
  {
    label: string;
    emoji: string;
    tagline: string;
    secondsPerPuzzle: number;
    lives: number;
    pointsPerCorrect: number;
    accent: string;
    ring: string;
    textOnAccent: string;
  }
> = {
  easy: {
    label: 'Easy',
    emoji: '🍦',
    tagline: 'Take your time',
    secondsPerPuzzle: 60,
    lives: 5,
    pointsPerCorrect: 1,
    accent: 'from-emerald-400 to-green-500',
    ring: 'ring-emerald-300',
    textOnAccent: 'text-emerald-950',
  },
  medium: {
    label: 'Medium',
    emoji: '🔥',
    tagline: 'Feel the heat',
    secondsPerPuzzle: 30,
    lives: 3,
    pointsPerCorrect: 2,
    accent: 'from-amber-400 to-orange-500',
    ring: 'ring-amber-300',
    textOnAccent: 'text-amber-950',
  },
  hard: {
    label: 'Hard',
    emoji: '💀',
    tagline: 'No mercy',
    secondsPerPuzzle: 15,
    lives: 2,
    pointsPerCorrect: 3,
    accent: 'from-rose-500 to-red-600',
    ring: 'ring-rose-300',
    textOnAccent: 'text-white',
  },
};

function getStreakBadge(streak: number) {
  if (streak >= 5) return { label: '🔥🔥 ON FIRE', bg: 'from-orange-500 to-red-600' };
  if (streak >= 3) return { label: '🔥 HOT STREAK', bg: 'from-amber-500 to-orange-600' };
  if (streak >= 2) return { label: '✨ STREAK', bg: 'from-emerald-400 to-green-500' };
  return null;
}

// ─── Page ──────────────────────────────────────────────
export default function PlayPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutFiredRef = useRef(false);

  const [gameState, setGameState] = useState<'selecting' | 'playing'>('selecting');
  const [session, setSession] = useState<GameSession | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [floatingPoints, setFloatingPoints] = useState<{ value: number; key: number } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const [gameOver, setGameOver] = useState(false);
  const [endResult, setEndResult] = useState<EndResult | null>(null);

  // Profile + per-difficulty scores
  const [highScore, setHighScore] = useState<number | null>(null);   // overall
  const [highScores, setHighScores] = useState<Record<Difficulty, number>>({
    easy: 0,
    medium: 0,
    hard: 0,
  });                                                                // per-difficulty
  const [username, setUsername] = useState('');

  const config = session ? DIFFICULTIES[session.difficulty] : null;

  // ─── Auth guard + initial profile load ────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    (async () => {
      try {
        const [me, scores] = await Promise.all([
          apiRequest('/users/me') as Promise<{ highScore: number; username: string }>,
          apiRequest('/users/me/high-scores') as Promise<Record<Difficulty, number>>,
        ]);
        setHighScore(me.highScore);
        setUsername(me.username);
        setHighScores(scores);
      } catch (err) {
        console.error('[play] load failed:', err);
      }
    })();
  }, [authLoading, user, router]);

  // ─── Focus input on new puzzle ────────────────────────
  useEffect(() => {
    if (puzzle && !loading && !gameOver && gameState === 'playing') {
      inputRef.current?.focus();
    }
  }, [puzzle, loading, gameOver, gameState]);

  // ─── Timer ────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing' || !puzzle || timeLeft <= 0 || gameOver) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, gameState, puzzle, gameOver]);

  // ─── Timeout ──────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing' || !puzzle || timeLeft > 0 || gameOver) return;
    if (timeoutFiredRef.current) return;
    timeoutFiredRef.current = true;
    submitAnswer('__timeout__');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, gameState, puzzle, gameOver]);

  // ─── Auto-end game on tab close / navigation ──────────
  useEffect(() => {
    if (gameState !== 'playing' || !session || gameOver) return;

    const endGameNow = () => {
      const token = getAccessToken();
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      fetch(`${base}/games/${session.gameId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', endGameNow);
    window.addEventListener('pagehide', endGameNow);
    return () => {
      window.removeEventListener('beforeunload', endGameNow);
      window.removeEventListener('pagehide', endGameNow);
    };
  }, [gameState, session, gameOver]);

  // ─── Load puzzle ──────────────────────────────────────
  async function loadPuzzle(difficulty: Difficulty) {
    setLoading(true);
    setFeedback(null);
    setAnswer('');
    timeoutFiredRef.current = false;
    try {
      const p = (await apiRequest('/puzzles/new')) as Puzzle;
      setPuzzle(p);
      setTimeLeft(DIFFICULTIES[difficulty].secondsPerPuzzle);
    } catch (err) {
      setFeedback({ ok: false, msg: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  // ─── Start game ───────────────────────────────────────
  async function startGame(difficulty: Difficulty) {
    setLoading(true);
    setFeedback(null);
    setPuzzle(null);
    setStreak(0);
    setRoundsPlayed(0);
    setGameOver(false);
    setEndResult(null);
    setFloatingPoints(null);
    try {
      const s = (await apiRequest('/games/start', {
        method: 'POST',
        body: JSON.stringify({ difficulty }),
      })) as GameSession;

      setSession(s);
      if (s.highScores) setHighScores(s.highScores);   // ← sync from server
      setGameState('playing');
      await loadPuzzle(difficulty);
    } catch (err) {
      setFeedback({ ok: false, msg: (err as Error).message });
      setLoading(false);
    }
  }

  // ─── Submit answer ────────────────────────────────────
  async function submitAnswer(rawAnswer: string) {
    if (!session || !puzzle || loading) return;
    setLoading(true);
    setAnswer('');
    try {
      const result = (await apiRequest(`/games/${session.gameId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ puzzleId: puzzle.id, answer: rawAnswer }),
      })) as AnswerResult;

      setSession((prev) =>
        prev ? { ...prev, score: result.score, lives: result.lives } : prev
      );

      if (result.correct) {
        setStreak((s) => s + 1);
        setRoundsPlayed((r) => r + 1);
        setFloatingPoints({ value: result.pointsAwarded, key: Date.now() });
        setFeedback({
          ok: true,
          msg: `✅ Correct! +${result.pointsAwarded} ${
            result.pointsAwarded === 1 ? 'point' : 'points'
          }`,
        });
        setTimeout(() => loadPuzzle(session.difficulty), 700);
      } else {
        setStreak(0);
        setShakeKey((k) => k + 1);
        const wasTimeout = rawAnswer === '__timeout__';
        setFeedback({
          ok: false,
          msg: wasTimeout
            ? `⏰ Time's up! The answer was ${result.correctAnswer ?? '…'}`
            : `❌ Wrong. The answer was ${result.correctAnswer ?? '…'}`,
        });
        if (result.gameOver) {
          await finishGame();
        } else {
          setTimeout(() => loadPuzzle(session.difficulty), 1200);
        }
      }
    } catch (err) {
      setFeedback({ ok: false, msg: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    await submitAnswer(answer);
  }

  // ─── Finish game ──────────────────────────────────────
  async function finishGame() {
    if (!session) return;
    try {
      const r = (await apiRequest(`/games/${session.gameId}/end`, {
        method: 'POST',
      })) as EndResult;
      setEndResult(r);
      setHighScore(r.highScore);
      setHighScores(r.highScores);   // ← sync per-difficulty from server
    } catch {
      setEndResult({
        finalScore: session.score,
        difficulty: session.difficulty,
        highScores,
        difficultyBest: highScores[session.difficulty],
        highScore: highScore ?? session.score,
        isNewRecord: false,
      });
    }
    setGameOver(true);
  }

  // ─── Reset for Play Again ─────────────────────────────
  function handlePlayAgain() {
    if (!session) return;
    setGameOver(false);
    startGame(session.difficulty);
  }

  // ─── Quit — end the game server-side before reset ────
  async function handleQuit() {
    if (session && !gameOver) {
      try {
        const r = (await apiRequest(`/games/${session.gameId}/end`, {
          method: 'POST',
        })) as EndResult;
        setHighScores(r.highScores);
        setHighScore(r.highScore);
      } catch {
        /* silent — don't block the UI on end-call failure */
      }
    }

    setGameState('selecting');
    setSession(null);
    setPuzzle(null);
    setStreak(0);
    setRoundsPlayed(0);
    setTimeLeft(0);
    setFeedback(null);
    setFloatingPoints(null);
    setGameOver(false);
    setEndResult(null);
  }

  // ─── Loading / auth guard ─────────────────────────────
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500">
        <GameNav />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="rounded-2xl bg-white/90 px-6 py-5 text-sm font-semibold text-amber-800 shadow-xl">
            Loading…
          </div>
        </main>
      </div>
    );
  }

  const bestDisplay = highScore ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500">
      <GameNav />

      <main className="flex flex-1 items-center justify-center overflow-hidden p-4">
        {gameState === 'selecting' || !config || !session ? (
          /* ─── Difficulty Selector ─────────────────── */
          <div className="w-full max-w-3xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 text-3xl shadow-lg shadow-amber-500/40">
                🍌
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-4xl">
                Choose Your Challenge
              </h1>
              <p className="mt-2 text-sm font-semibold text-amber-950/80">
                Higher difficulty · fewer lives · bigger rewards
              </p>
              {username && (
                <p className="mt-3 inline-block rounded-full bg-white/30 px-3 py-1 text-xs font-bold text-amber-950 backdrop-blur-sm">
                  🏆 Overall Best: {bestDisplay} pts · @{username}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => {
                const c = DIFFICULTIES[d];
                const best = highScores[d] ?? 0;
                return (
                  <button
                    key={d}
                    onClick={() => startGame(d)}
                    disabled={loading}
                    className={`group relative overflow-hidden rounded-2xl border-2 border-white/70 bg-white/90 p-5 text-left shadow-xl shadow-amber-900/10 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-4 disabled:opacity-60 ${c.ring}`}
                  >
                    <div
                      className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.accent} text-2xl shadow-lg transition-transform duration-300 group-hover:rotate-6`}
                    >
                      {c.emoji}
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">{c.label}</h2>
                    <p className="text-xs font-semibold text-slate-500">{c.tagline}</p>

                    <ul className="mt-4 space-y-1.5 text-xs font-semibold text-slate-600">
                      <li className="flex items-center gap-2">
                        <span>❤️</span> {c.lives} lives
                      </li>
                      <li className="flex items-center gap-2">
                        <span>⏱️</span> {c.secondsPerPuzzle}s per puzzle
                      </li>
                      <li className="flex items-center gap-2">
                        <span>⭐</span> {c.pointsPerCorrect} pt
                        {c.pointsPerCorrect === 1 ? '' : 's'} per correct
                      </li>
                    </ul>

                    {/* ─── Per-difficulty personal best ─────── */}
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Your best
                      </span>
                      <span className="text-sm font-extrabold tabular-nums text-amber-700">
                        {best > 0 ? `${best} pts` : '—'}
                      </span>
                    </div>

                    <div
                      className={`mt-4 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r ${c.accent} px-3 py-1.5 text-xs font-extrabold ${c.textOnAccent} shadow-md`}
                    >
                      Start {c.label} →
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ─── Playing Screen ──────────────────────── */
          <div
            key={shakeKey}
            className={`${shakeKey > 0 ? 'shake' : ''} w-full max-w-lg rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8`}
          >
            {/* Per-difficulty personal best banner */}
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-xl shadow-inner">
                  🏆
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/70">
                    {config.label} Best
                  </p>
                  <p className="text-lg font-extrabold text-amber-900">
                    {highScores[session.difficulty] ?? 0}       {/* ✅ per-difficulty */}
                    <span className="ml-1 text-xs font-medium text-amber-700/60">pts</span>
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${config.accent} px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${config.textOnAccent} shadow-md`}
              >
                {config.emoji} {config.label}
              </span>
            </div>

            {/* Score / lives / streak */}
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-xl font-extrabold text-slate-900">🍌 Banana Guesser</h1>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span
                    key={session.score}
                    className="score-pop inline-block text-lg font-extrabold tabular-nums text-amber-700"
                  >
                    {session.score}
                  </span>
                  <span className="ml-1 text-xs font-bold text-slate-500">pts</span>

                  {floatingPoints && (
                    <span
                      key={floatingPoints.key}
                      className="float-up pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-extrabold text-emerald-600"
                    >
                      +{floatingPoints.value}
                    </span>
                  )}
                </div>

                <div key={session.lives} className="hearts-shake text-sm font-bold tabular-nums">
                  {'❤️'.repeat(session.lives) || '💔'}
                </div>
              </div>
            </div>

            {/* Streak badge */}
            {(() => {
              const badge = getStreakBadge(streak);
              if (!badge) return null;
              return (
                <div
                  className={`mb-3 inline-flex animate-pulse items-center gap-1 rounded-full bg-gradient-to-r ${badge.bg} px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md`}
                >
                  {badge.label} · {streak}×
                </div>
              );
            })()}

            {/* Timer bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>⏱️ Time left</span>
                <span
                  className={`tabular-nums ${
                    timeLeft <= 5 ? 'animate-pulse text-red-600' : 'text-slate-600'
                  }`}
                >
                  {timeLeft}s
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
                <div
                  className={`h-full rounded-full ${
                    timeLeft <= 5
                      ? 'bg-red-500'
                      : timeLeft <= config.secondsPerPuzzle * 0.33
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  } transition-[width] duration-1000 ease-linear`}
                  style={{ width: `${(timeLeft / config.secondsPerPuzzle) * 100}%` }}
                />
              </div>
            </div>

            {/* Puzzle image */}
            <div className="mb-4 flex min-h-[240px] items-center justify-center rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
              {loading && !puzzle && <div className="text-amber-600">Loading puzzle…</div>}
              {puzzle && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={puzzle.id}
                  src={puzzle.imageUrl}
                  alt="Guess the value of the banana"
                  className="puzzle-in max-h-[300px] w-auto rounded-xl"
                />
              )}
            </div>

            {/* Feedback */}
            {feedback && (
              <div
                className={`mb-4 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  feedback.ok
                    ? 'border border-green-200 bg-green-50 text-green-700'
                    : 'border border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {feedback.msg}
              </div>
            )}

            {/* Answer form */}
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter your answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={loading || !puzzle || gameOver}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/25 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !puzzle || !answer || gameOver}
                className={`rounded-xl bg-gradient-to-r ${config.accent} px-5 py-3 font-bold ${config.textOnAccent} shadow-lg transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60`}
              >
                Guess
              </button>
            </form>

            <button
              onClick={handleQuit}
              className="mt-4 w-full rounded-xl py-2 text-xs font-semibold text-slate-400 transition hover:text-red-500"
            >
              ← Quit to difficulty selection
            </button>
          </div>
        )}
      </main>

      {/* Game over modal — per-difficulty best */}
      <GameOverModal
        isOpen={gameOver}
        score={endResult?.finalScore ?? 0}
        bestScore={endResult?.difficultyBest ?? (session ? highScores[session.difficulty] : 0)}
        roundsPlayed={roundsPlayed}
        onPlayAgain={handlePlayAgain}
        onExit={() => router.push('/')}
      />

      <style jsx global>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60% { transform: translateX(6px); }
        }
        .shake { animation: shake 0.45s ease-in-out; }

        @keyframes score-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.35); color: #059669; }
          100% { transform: scale(1); }
        }
        .score-pop { animation: score-pop 0.5s ease-out; }

        @keyframes float-up {
          0% { opacity: 0; transform: translate(-50%, 0) scale(0.9); }
          20% { opacity: 1; transform: translate(-50%, -8px) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -40px) scale(1); }
        }
        .float-up { animation: float-up 1.2s ease-out forwards; }

        @keyframes hearts-shake {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .hearts-shake { animation: hearts-shake 0.4s ease-out; }

        @keyframes puzzle-in {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .puzzle-in { animation: puzzle-in 0.35s ease-out; }

        @media (prefers-reduced-motion: reduce) {
          .shake, .score-pop, .float-up, .hearts-shake, .puzzle-in { animation: none; }
        }
      `}</style>
    </div>
  );
}