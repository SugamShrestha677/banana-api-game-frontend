'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAccessToken } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import GameOverModal from '../../components/game/GameOverModal';
import GameNav from '../../components/game/GameNav';
type Puzzle = { id: string; imageUrl: string };
type Profile = { highScore: number; username: string };

export default function PlayPage() {
  const router = useRouter();

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [loading, setLoading] = useState(false);

  const [highScore, setHighScore] = useState<number | null>(null);
  const [username, setUsername] = useState<string>('');
  const [isNewRecord, setIsNewRecord] = useState(false);

  // 👇 new
  const [gameOver, setGameOver] = useState(false);
  const [roundsPlayed, setRoundsPlayed] = useState(0);

  const { user, loading: authLoading } = useAuth();

  // Auth guard + initial fetch
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        const me = (await apiRequest('/users/me')) as Profile;
        setHighScore(me.highScore);
        setUsername(me.username);
      } catch {
        /* silent */
      }
      loadPuzzle();
    })();
  }, [authLoading, user, router]);

  // Focus the input whenever a fresh puzzle loads (and we're not in a modal)
useEffect(() => {
  if (puzzle && !loading && !gameOver) {
    inputRef.current?.focus();
  }
}, [puzzle, loading, gameOver]);

  async function loadPuzzle() {
    setLoading(true);
    setFeedback(null);
    setAnswer('');
    try {
      const data = await apiRequest('/puzzles/new');
      setPuzzle(data);
    } catch (err) {
      setFeedback({ ok: false, msg: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function handleGameOver(finalScore: number) {
    try {
      const result = (await apiRequest('/users/high-score', {
        method: 'POST',
        body: JSON.stringify({ score: finalScore }),
      })) as { highScore: number };

      if (highScore !== null && result.highScore > highScore) {
        setIsNewRecord(true);
        setHighScore(result.highScore);
      } else {
        setHighScore(result.highScore);
      }
    } catch {
      /* ignore */
    }
  }

  

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puzzle || loading || gameOver) return; // 👈 block while modal is up

    setLoading(true);
    try {
      const result = await apiRequest(`/puzzles/${puzzle.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer }),
      });

      if (result.correct) {
        setScore((s) => s + 1);
        setRoundsPlayed((r) => r + 1);        // 👈 track rounds
        setFeedback({ ok: true, msg: 'Correct! 🍌' });
        setTimeout(loadPuzzle, 900);
      } else {
        const remaining = lives - 1;
        setLives(remaining);
        setFeedback({
          ok: false,
          msg: `Wrong. The answer was ${result.correctAnswer}.`,
        });

        if (remaining <= 0) {
          await handleGameOver(score);        // persist first
          setGameOver(true);                  // 👈 modal takes over
        } else {
          setTimeout(loadPuzzle, 1400);
        }
      }
    } catch (err) {
      setFeedback({ ok: false, msg: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  // 👇 new — reset only when the player clicks "Play Again"
  function handlePlayAgain() {
    setScore(0);
    setLives(3);
    setRoundsPlayed(0);
    setIsNewRecord(false);
    setGameOver(false);
    setFeedback(null);
    loadPuzzle();
  }

  const bestDisplay = highScore ?? 0;
  const inputRef = useRef<HTMLInputElement>(null);


  return (
    <>
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500">
    <GameNav />

    <main className="flex flex-1 items-center justify-center overflow-hidden p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">

        {/* ── Personal Best Banner ─────────────────────── */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-xl shadow-inner">
              🏆
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/70">
                Personal Best
              </p>
              <p className="text-lg font-extrabold text-amber-900">
                {bestDisplay}
                <span className="ml-1 text-xs font-medium text-amber-700/60">pts</span>
              </p>
            </div>
          </div>
          {username && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              @{username}
            </span>
          )}
        </div>

        {/* ── Header with current score / lives ─────────── */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-slate-900">🍌 Banana Guesser</h1>
          <div className="text-right text-sm font-semibold text-slate-600">
            <div>
              Score: <span className="text-amber-600">{score}</span>
            </div>
            <div>
              Lives: <span className="text-red-500">{'❤️'.repeat(lives) || '—'}</span>
            </div>
          </div>
        </div>

        {/* ── New Record Celebration ───────────────────── */}
        {isNewRecord && (
          <div className="mb-4 animate-pulse rounded-xl border border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-3 text-center text-sm font-bold text-amber-800">
            🎉 New Personal Best!
          </div>
        )}

        {/* ── Puzzle image ─────────────────────────────── */}
        <div className="mb-4 flex min-h-[260px] items-center justify-center rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
          {loading && !puzzle && <div className="text-amber-600">Loading puzzle…</div>}
          {puzzle && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={puzzle.imageUrl}
              alt="Guess the value of the banana"
              className="max-h-[320px] w-auto rounded-xl"
            />
          )}
        </div>

        {/* ── Feedback ─────────────────────────────────── */}
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

        {/* ── Answer form ──────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder="Enter your answer"
            pattern="[0-9]*"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={loading || !puzzle}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/25 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !puzzle || !answer}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-3 font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Guess
          </button>
        </form>
      </div>
    </main>
    </div>
    <GameOverModal
        isOpen={gameOver}
        score={score}
        bestScore={bestDisplay}
        roundsPlayed={roundsPlayed}
        onPlayAgain={handlePlayAgain}
        onExit={() => router.push('/')}
      />
    </>
    
  );
}
