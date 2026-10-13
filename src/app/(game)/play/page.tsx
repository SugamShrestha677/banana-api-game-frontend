'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAccessToken } from '@/lib/api-client';

type Puzzle = { id: string; imageUrl: string };

export default function PlayPage() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [loading, setLoading] = useState(false);

  // ── Auth guard + initial fetch ────────────────────────
  useEffect(() => {
    // If no access token in memory, redirect to login.
    // (A refresh attempt could be made here in a full build.)
    if (!getAccessToken()) {
      router.replace('/login');
      return;
    }
    loadPuzzle();
  }, [router]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puzzle || loading) return;

    setLoading(true);
    try {
      const result = await apiRequest(`/puzzles/${puzzle.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer }),
      });

      if (result.correct) {
        setScore((s) => s + 1);
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
          setFeedback({ ok: false, msg: `Game over. Final score: ${score}.` });
          setTimeout(() => {
            setScore(0);
            setLives(3);
            loadPuzzle();
          }, 1800);
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

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-slate-900">🍌 Banana Guesser</h1>
          <div className="text-right text-sm font-semibold text-slate-600">
            <div>Score: <span className="text-amber-600">{score}</span></div>
            <div>Lives: <span className="text-red-500">{'❤️'.repeat(lives) || '—'}</span></div>
          </div>
        </div>

        {/* Puzzle image */}
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
            type="text"
            inputMode="numeric"
            placeholder="Enter your answer"
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
  );
}
