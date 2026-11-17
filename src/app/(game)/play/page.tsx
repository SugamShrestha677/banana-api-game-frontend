'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAccessToken } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import GameOverModal from '../../components/game/GameOverModal';
import GameNav from '../../components/game/GameNav';
import AchievementToast, { Achievement } from '../../components/game/AchievementToast';
import {
  playAchievementSound,
  playCorrectSound,
  playWrongSound,
  playTimerTickSound,
  playKeypadSound,
  playGameOverSound,
  isSoundEnabled,
  setSoundEnabled,
} from '@/lib/audio';

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
  basePoints?: number;
  streakBonus?: number;
  streak?: number;
  score: number;
  lives: number;
  gameOver: boolean;
  newlyUnlockedAchievements?: Achievement[];
};

type EndResult = {
  finalScore: number;
  difficulty: Difficulty;
  highScores: Record<Difficulty, number>;
  difficultyBest: number;
  highScore: number;
  isNewRecord: boolean;
  newlyUnlockedAchievements?: Achievement[];
};

// ─── Difficulty display config ──────────────────────────
const DIFFICULTIES: Record<
  Difficulty,
  {
    label: string;
    sublabel: string;
    emoji: string;
    tagline: string;
    secondsPerPuzzle: number;
    lives: number;
    pointsPerCorrect: number;
    accent: string;
    border: string;
    glow: string;
    badgeBg: string;
    textOnAccent: string;
  }
> = {
  easy: {
    label: 'Easy',
    sublabel: 'Cadet Banana',
    emoji: '🍦',
    tagline: 'Casual pace · 5 Shields',
    secondsPerPuzzle: 60,
    lives: 5,
    pointsPerCorrect: 1,
    accent: 'from-emerald-400 via-teal-500 to-green-600',
    border: 'border-emerald-400/60 hover:border-emerald-300',
    glow: 'shadow-emerald-500/25 hover:shadow-emerald-500/40',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    textOnAccent: 'text-emerald-950 font-black',
  },
  medium: {
    label: 'Medium',
    sublabel: 'Banana Raider',
    emoji: '🔥',
    tagline: 'Fast pace · 3 Shields',
    secondsPerPuzzle: 30,
    lives: 3,
    pointsPerCorrect: 2,
    accent: 'from-amber-400 via-orange-500 to-amber-600',
    border: 'border-amber-400/60 hover:border-amber-300',
    glow: 'shadow-amber-500/25 hover:shadow-amber-500/40',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    textOnAccent: 'text-amber-950 font-black',
  },
  hard: {
    label: 'Hard',
    sublabel: 'Banana Legend',
    emoji: '💀',
    tagline: 'Insane 15s · 2 Shields',
    secondsPerPuzzle: 15,
    lives: 2,
    pointsPerCorrect: 3,
    accent: 'from-rose-500 via-red-600 to-purple-700',
    border: 'border-rose-400/60 hover:border-rose-300',
    glow: 'shadow-rose-500/25 hover:shadow-rose-500/40',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    textOnAccent: 'text-white font-black',
  },
};

function getStreakInfo(streak: number) {
  if (streak >= 10) {
    return {
      label: '⚡ GODLIKE STREAK',
      badge: 'x5 MULTIPLIER',
      color: 'from-purple-500 via-pink-500 to-rose-500',
      glow: 'shadow-pink-500/60',
      textColor: 'text-pink-200',
    };
  }
  if (streak >= 5) {
    return {
      label: '🔥🔥 ON FIRE!',
      badge: 'x4 MULTIPLIER',
      color: 'from-orange-500 via-red-500 to-amber-500',
      glow: 'shadow-orange-500/50',
      textColor: 'text-orange-200',
    };
  }
  if (streak >= 3) {
    return {
      label: '🔥 HOT STREAK',
      badge: 'x3 MULTIPLIER',
      color: 'from-amber-400 via-orange-500 to-yellow-500',
      glow: 'shadow-amber-500/40',
      textColor: 'text-amber-200',
    };
  }
  if (streak >= 2) {
    return {
      label: '✨ COMBO ACTIVE',
      badge: 'x2 MULTIPLIER',
      color: 'from-emerald-400 via-teal-400 to-green-500',
      glow: 'shadow-emerald-500/30',
      textColor: 'text-emerald-200',
    };
  }
  return null;
}

// ─── Lightweight Canvas Confetti Burst ──────────────────
function launchArcadeConfetti() {
  if (typeof window === 'undefined') return;
  const canvas = document.getElementById('arcade-confetti') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#f59e0b', '#fbbf24', '#10b981', '#38bdf8', '#f43f5e', '#a855f7', '#ffffff'];
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    vRot: number;
    alpha: number;
  }> = [];

  for (let i = 0; i < 45; i++) {
    particles.push({
      x: rect.width / 2 + (Math.random() - 0.5) * 80,
      y: rect.height * 0.45,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 11 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 18,
      alpha: 1,
    });
  }

  let frame = 0;
  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, rect.width, rect.height);
    let alive = false;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.42; // gravity
      p.rotation += p.vRot;
      p.alpha -= 0.022;
      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      }
    });
    frame++;
    if (alive && frame < 85) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  }
  requestAnimationFrame(animate);
}

// ─── Main PlayPage ──────────────────────────────────────
export default function PlayPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutFiredRef = useRef(false);
  const puzzleStartTimeRef = useRef<number>(0);
  const keyCounterRef = useRef<number>(0);

  const [gameState, setGameState] = useState<'selecting' | 'playing'>('selecting');
  const [session, setSession] = useState<GameSession | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    msg: string;
    streakBonus?: number;
    basePoints?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [floatingPoints, setFloatingPoints] = useState<{
    value: number;
    bonus?: number;
    key: number;
  } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [correctKey, setCorrectKey] = useState(0);

  const [audioOn, setAudioOn] = useState(true);
  const [showKeypad, setShowKeypad] = useState(true);

  const [gameOver, setGameOver] = useState(false);
  const [endResult, setEndResult] = useState<EndResult | null>(null);

  // Real-time achievement notifications & session unlocks
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [sessionAchievements, setSessionAchievements] = useState<Achievement[]>([]);

  // Profile + per-difficulty scores
  const [highScore, setHighScore] = useState<number | null>(null);
  const [highScores, setHighScores] = useState<Record<Difficulty, number>>({
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const [username, setUsername] = useState('');

  const config = session ? DIFFICULTIES[session.difficulty] : null;

  // Sync audio toggle with stored setting
  useEffect(() => {
    setAudioOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !audioOn;
    setAudioOn(next);
    setSoundEnabled(next);
  };

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
        setHighScore(Number(me.highScore) || 0);
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

  // ─── Timer countdown + Tick sound ─────────────────────
  useEffect(() => {
    if (gameState !== 'playing' || !puzzle || timeLeft <= 0 || gameOver) return;
    const id = setTimeout(() => {
      setTimeLeft((t) => {
        if (t <= 6 && t > 1) {
          playTimerTickSound();
        }
        return t - 1;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [timeLeft, gameState, puzzle, gameOver]);

  // ─── Timeout handler ──────────────────────────────────
  const handleTimeout = useCallback(() => {
    if (timeoutFiredRef.current) return;
    timeoutFiredRef.current = true;
    submitAnswer('__timeout__');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameState !== 'playing' || !puzzle || timeLeft > 0 || gameOver) return;
    handleTimeout();
  }, [timeLeft, gameState, puzzle, gameOver, handleTimeout]);

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
      puzzleStartTimeRef.current = Date.now();
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
    setSessionAchievements([]);
    try {
      const s = (await apiRequest('/games/start', {
        method: 'POST',
        body: JSON.stringify({ difficulty }),
      })) as GameSession;

      setSession({
        ...s,
        score: Number(s.score) || 0,
        lives: Number(s.lives) || 0,
      });
      if (s.highScores) setHighScores(s.highScores);
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
    const timeTakenMs = Math.max(0, Date.now() - puzzleStartTimeRef.current);

    try {
      const result = (await apiRequest(`/games/${session.gameId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ puzzleId: puzzle.id, answer: rawAnswer, timeTakenMs }),
      })) as AnswerResult;

      const pointsAwarded = Number(result.pointsAwarded) || 0;
      const basePoints = Number(result.basePoints ?? config?.pointsPerCorrect ?? 1);
      const streakBonus = Number(result.streakBonus) || 0;
      const newScore = Number(result.score) || 0;
      const newLives = Number(result.lives) || 0;
      const newStreak = Number(result.streak ?? (result.correct ? streak + 1 : 0));

      setSession((prev) =>
        prev ? { ...prev, score: newScore, lives: newLives } : prev
      );

      // Handle newly unlocked achievements
      if (result.newlyUnlockedAchievements && result.newlyUnlockedAchievements.length > 0) {
        setAchievementQueue((q) => [...q, ...result.newlyUnlockedAchievements!]);
        setSessionAchievements((s) => [...s, ...result.newlyUnlockedAchievements!]);
        playAchievementSound();
      }

      if (result.correct) {
        setStreak(newStreak);
        setRoundsPlayed((r) => r + 1);
        setCorrectKey((k) => k + 1);
        setFloatingPoints({
          value: pointsAwarded,
          bonus: streakBonus,
          key: ++keyCounterRef.current,
        });

        playCorrectSound(newStreak);
        launchArcadeConfetti();

        const streakMsg =
          streakBonus > 0
            ? `🔥 ${newStreak}x Streak! +${pointsAwarded} pts (${basePoints} base + ${streakBonus} combo bonus)`
            : `✅ Correct! +${pointsAwarded} ${pointsAwarded === 1 ? 'pt' : 'pts'}`;

        setFeedback({
          ok: true,
          msg: streakMsg,
          streakBonus,
          basePoints,
        });

        setTimeout(() => loadPuzzle(session.difficulty), 750);
      } else {
        setStreak(0);
        setShakeKey((k) => k + 1);
        playWrongSound();

        const wasTimeout = rawAnswer === '__timeout__';
        setFeedback({
          ok: false,
          msg: wasTimeout
            ? `⏰ TIME UP! The answer was ${result.correctAnswer ?? '…'}`
            : `❌ WRONG! The answer was ${result.correctAnswer ?? '…'}`,
        });

        if (result.gameOver) {
          playGameOverSound();
          await finishGame();
        } else {
          setTimeout(() => loadPuzzle(session.difficulty), 1150);
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
    if (!answer.trim() || loading || !puzzle || gameOver) return;
    await submitAnswer(answer);
  }

  // ─── Keypad Button Click ──────────────────────────────
  const handleKeypadPress = (val: string) => {
    if (loading || !puzzle || gameOver) return;
    playKeypadSound();
    if (val === 'clear') {
      setAnswer('');
    } else if (val === 'submit') {
      if (answer.trim()) {
        submitAnswer(answer);
      }
    } else {
      setAnswer((prev) => (prev.length < 5 ? prev + val : prev));
    }
    inputRef.current?.focus();
  };

  // ─── Finish game ──────────────────────────────────────
  async function finishGame() {
    if (!session) return;
    try {
      const r = (await apiRequest(`/games/${session.gameId}/end`, {
        method: 'POST',
      })) as EndResult;
      setEndResult(r);
      setHighScore(Number(r.highScore) || 0);
      setHighScores(r.highScores);

      if (r.newlyUnlockedAchievements && r.newlyUnlockedAchievements.length > 0) {
        setAchievementQueue((q) => [...q, ...r.newlyUnlockedAchievements!]);
        setSessionAchievements((s) => [...s, ...r.newlyUnlockedAchievements!]);
      }
    } catch {
      setEndResult({
        finalScore: Number(session.score) || 0,
        difficulty: session.difficulty,
        highScores,
        difficultyBest: Number(highScores[session.difficulty]) || 0,
        highScore: Number(highScore ?? session.score) || 0,
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

  // ─── Quit back to menu ────────────────────────────────
  async function handleQuit() {
    if (session && !gameOver) {
      try {
        const r = (await apiRequest(`/games/${session.gameId}/end`, {
          method: 'POST',
        })) as EndResult;
        setHighScores(r.highScores);
        setHighScore(Number(r.highScore) || 0);
      } catch {
        /* silent */
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
      <div className="flex min-h-screen flex-col bg-slate-950 text-white">
        <GameNav />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-slate-900/90 px-8 py-6 text-sm font-bold text-amber-300 shadow-2xl backdrop-blur-xl animate-pulse">
            <span className="text-2xl animate-spin">🍌</span>
            <span>Entering Arcade Arena…</span>
          </div>
        </main>
      </div>
    );
  }

  const bestDisplay = highScore ?? 0;
  const streakInfo = getStreakInfo(streak);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-b from-slate-950 via-[#13111C] to-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950">
      {/* Background Arcade Grid & Floating Particles */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.18)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.12)_0%,transparent_50%)]" />
        <div className="arcade-grid absolute inset-0 opacity-20" />
      </div>

      {/* Confetti canvas overlay */}
      <canvas
        id="arcade-confetti"
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      />

      <GameNav />

      <main className="relative z-10 flex flex-1 items-center justify-center p-3 sm:p-6">
        {gameState === 'selecting' || !config || !session ? (
          /* ═══════════════════════════════════════════════════════ */
          /* ─── ARCADE MISSION SELECT (Gamified Mode Selection) ─── */
          /* ═══════════════════════════════════════════════════════ */
          <div className="w-full max-w-4xl py-4">
            {/* Mission select header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-xs font-black tracking-widest text-amber-400 uppercase shadow-lg shadow-amber-500/10 backdrop-blur-md">
                <span>🎮</span>
                <span>ARCADE CHALLENGE ARENA</span>
                <span>⭐</span>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
                SELECT YOUR <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">MISSION</span>
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm font-semibold text-slate-300 sm:text-base">
                Solve rapid visual math puzzles, ignite your combo streak, and climb the global leaderboards!
              </p>

              {/* Player Trophy Ribbon */}
              <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-2.5 shadow-2xl backdrop-blur-xl">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <span className="text-base">🏆</span>
                  <span>Personal Best:</span>
                  <span className="text-sm font-black text-white">{bestDisplay} pts</span>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-xs font-bold text-slate-400">
                  Operative: <span className="text-amber-300">@{username || 'Guesser'}</span>
                </span>
                <span className="text-slate-600">|</span>
                <button
                  onClick={toggleSound}
                  className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  title="Toggle Sound Effects"
                >
                  <span>{audioOn ? '🔊 Sound: ON' : '🔇 Sound: OFF'}</span>
                </button>
              </div>
            </div>

            {/* Mission Cards Grid */}
            <div className="grid gap-5 sm:grid-cols-3">
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => {
                const c = DIFFICULTIES[d];
                const best = Number(highScores[d]) || 0;
                return (
                  <div
                    key={d}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 ${c.border} bg-slate-900/85 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-2 ${c.glow}`}
                  >
                    {/* Top Tier Tag */}
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${c.badgeBg}`}>
                        {c.sublabel}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-black text-amber-400">
                        <span>⭐</span>
                        <span>+{c.pointsPerCorrect} base</span>
                      </div>
                    </div>

                    {/* Emblem & Title */}
                    <div className="my-5 text-center">
                      <div
                        className={`mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${c.accent} text-4xl shadow-xl shadow-black/40 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                      >
                        {c.emoji}
                      </div>
                      <h2 className="text-2xl font-black text-white">{c.label}</h2>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{c.tagline}</p>
                    </div>

                    {/* Tactical Mission Specs */}
                    <div className="space-y-2 rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 text-xs font-bold text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <span>❤️</span> Shields:
                        </span>
                        <span className="text-white font-extrabold">{c.lives} Lives</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <span>⏱️</span> Time Limit:
                        </span>
                        <span className="text-white font-extrabold">{c.secondsPerPuzzle}s / puzzle</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <span>🔥</span> Streak Bonus:
                        </span>
                        <span className="text-amber-400 font-extrabold">Up to +5 pts/solve</span>
                      </div>
                    </div>

                    {/* Personal Best Ribbon */}
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs">
                      <span className="font-extrabold text-slate-400 uppercase tracking-wide text-[10px]">
                        Your Record
                      </span>
                      <span className="font-black tabular-nums text-amber-400">
                        {best > 0 ? `${best} pts` : '— unranked'}
                      </span>
                    </div>

                    {/* Start Action */}
                    <button
                      onClick={() => startGame(d)}
                      disabled={loading}
                      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${c.accent} py-3.5 text-sm font-black ${c.textOnAccent} shadow-lg transition-all duration-200 hover:brightness-115 active:scale-95 disabled:opacity-60 cursor-pointer`}
                    >
                      <span>START {c.label.toUpperCase()}</span>
                      <span className="text-base transition-transform group-hover:translate-x-1">→</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════ */
          /* ─── ARCADE ARENA (Gamified HUD & Gameplay Screen) ──── */
          /* ═══════════════════════════════════════════════════════ */
          <div
            key={shakeKey}
            className={`${shakeKey > 0 ? 'arcade-shake' : ''} ${
              correctKey > 0 ? 'correct-flash' : ''
            } relative w-full max-w-xl rounded-3xl border-2 ${
              streak >= 5
                ? 'border-orange-500 shadow-orange-500/40'
                : streak >= 3
                ? 'border-amber-400 shadow-amber-500/30'
                : 'border-white/15 shadow-black/80'
            } bg-slate-900/90 p-5 shadow-2xl backdrop-blur-2xl sm:p-7 transition-colors duration-500`}
          >
            {/* Dynamic Streak Flame Aura around the cabinet */}
            {streak >= 3 && (
              <div
                className={`pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-gradient-to-r ${
                  streakInfo?.color || 'from-amber-500 to-red-500'
                } opacity-30 blur-xl animate-pulse`}
              />
            )}

            {/* ── Top Gaming HUD Bar ──────────────────────────── */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-950/70 p-3 shadow-inner">
              {/* Mission Badge & Sound Toggle */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r ${config.accent} px-3 py-1 text-xs font-black uppercase tracking-wider ${config.textOnAccent} shadow-md`}
                >
                  {config.emoji} {config.label}
                </span>

                <button
                  type="button"
                  onClick={toggleSound}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm transition hover:bg-white/15"
                  title={audioOn ? 'Mute Sounds' : 'Unmute Sounds'}
                >
                  {audioOn ? '🔊' : '🔇'}
                </button>
              </div>

              {/* Shields / Hearts */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Shields
                </span>
                <div
                  key={session.lives}
                  className="hearts-pulse flex items-center gap-1 text-lg font-black"
                >
                  {Array.from({ length: config.lives }).map((_, i) => (
                    <span
                      key={i}
                      className={`transition-all duration-300 ${
                        i < session.lives
                          ? 'scale-100 opacity-100 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                          : 'scale-90 opacity-25 grayscale'
                      }`}
                    >
                      {i < session.lives ? '❤️' : '🖤'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Critical Low Health Banner */}
            {session.lives === 1 && (
              <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-950/40 py-1.5 text-xs font-black tracking-widest text-red-400 uppercase animate-pulse shadow-lg shadow-red-500/20">
                <span>⚠️ CRITICAL HEALTH! LAST SHIELD REMAINING! ⚠️</span>
              </div>
            )}

            {/* ── Score & Combo Multiplier Bar ────────────────── */}
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-slate-950 p-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/80">
                  Total Score
                </span>
                <div className="relative flex items-baseline gap-1.5">
                  <span
                    key={session.score}
                    className="score-pop text-3xl font-black tabular-nums text-white drop-shadow-[0_0_12px_rgba(245,158,11,0.5)] sm:text-4xl"
                  >
                    {session.score}
                  </span>
                  <span className="text-xs font-bold text-amber-400">PTS</span>

                  {/* Floating points pop-up */}
                  {floatingPoints && (
                    <div
                      key={floatingPoints.key}
                      className="float-score pointer-events-none absolute -top-4 left-full ml-2 flex items-center gap-1 whitespace-nowrap text-sm font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                    >
                      <span>+{floatingPoints.value}</span>
                      {floatingPoints.bonus && floatingPoints.bonus > 0 ? (
                        <span className="text-[11px] text-amber-300">🔥 +{floatingPoints.bonus} STREAK</span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Combo & Streak Multiplier Display */}
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Round #{roundsPlayed + 1}
                </span>
                {streakInfo ? (
                  <div
                    className={`mt-1 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${streakInfo.color} px-3 py-1 text-xs font-black text-slate-950 shadow-lg ${streakInfo.glow} animate-bounce`}
                  >
                    <span>{streakInfo.label}</span>
                    <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] text-white">
                      {streak}×
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-xs font-extrabold text-slate-500">
                    Record: <span className="text-amber-400">{highScores[session.difficulty] ?? 0}</span> pts
                  </div>
                )}
              </div>
            </div>

            {/* ── High-Stakes Arcade Countdown Timer ─────────── */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>⏱️</span>
                  <span>TIME REMAINING</span>
                </span>
                <span
                  className={`tabular-nums text-sm font-black ${
                    timeLeft <= 5
                      ? 'animate-ping text-red-500'
                      : timeLeft <= config.secondsPerPuzzle * 0.35
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {timeLeft}s
                </span>
              </div>

              {/* Progress track */}
              <div className="relative mt-1.5 h-3 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-white/10 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                    timeLeft <= 5
                      ? 'bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                      : timeLeft <= config.secondsPerPuzzle * 0.35
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  }`}
                  style={{ width: `${Math.max(0, (timeLeft / config.secondsPerPuzzle) * 100)}%` }}
                />
              </div>
            </div>

            {/* ── Arcade Puzzle Screen Frame ─────────────────── */}
            <div className="relative mb-4 flex min-h-[250px] items-center justify-center overflow-hidden rounded-2xl border-2 border-amber-400/30 bg-slate-950 p-3 shadow-2xl">
              {/* Scanline overlay effect */}
              <div className="arcade-scanlines pointer-events-none absolute inset-0 opacity-15" />

              {loading && !puzzle && (
                <div className="flex flex-col items-center gap-2 text-amber-400 font-bold">
                  <span className="text-3xl animate-bounce">🍌</span>
                  <span className="text-xs tracking-wider uppercase">Loading Mission Puzzle…</span>
                </div>
              )}

              {puzzle && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={puzzle.id}
                  src={puzzle.imageUrl}
                  alt="Guess the value of the banana puzzle"
                  className="puzzle-pop max-h-[300px] w-auto rounded-xl object-contain shadow-lg"
                />
              )}
            </div>

            {/* ── Feedback Banner ────────────────────────────── */}
            {feedback && (
              <div
                className={`mb-4 rounded-2xl border p-3.5 text-center text-sm font-black transition-all ${
                  feedback.ok
                    ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300 shadow-lg shadow-emerald-500/20'
                    : 'border-rose-500/60 bg-rose-950/60 text-rose-300 shadow-lg shadow-rose-500/20'
                }`}
              >
                {feedback.msg}
              </div>
            )}

            {/* ── Gamified Input & Submission ────────────────── */}
            <form onSubmit={handleSubmit} className="mb-4 flex gap-2 sm:gap-3">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Type your answer…"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={loading || !puzzle || gameOver}
                className="flex-1 rounded-2xl border-2 border-white/15 bg-slate-950/90 px-4 py-3.5 text-center text-2xl font-black tracking-widest text-white placeholder:text-slate-600 outline-none transition focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={loading || !puzzle || !answer.trim() || gameOver}
                className={`rounded-2xl bg-gradient-to-r ${config.accent} px-6 py-3.5 text-base font-black ${config.textOnAccent} shadow-xl transition-all duration-150 hover:brightness-115 hover:shadow-2xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer`}
              >
                GUESS ⚡
              </button>
            </form>

            {/* ── Arcade Quick-Tap Keypad ────────────────────── */}
            <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400">
                <span>⚡ Quick Arcade Keypad</span>
                <button
                  type="button"
                  onClick={() => setShowKeypad((k) => !k)}
                  className="text-amber-400 hover:underline"
                >
                  {showKeypad ? 'Hide Keypad ▲' : 'Show Keypad ▼'}
                </button>
              </div>

              {showKeypad && (
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      disabled={loading || !puzzle || gameOver}
                      className="flex h-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 text-lg font-black text-white shadow-md transition-all active:scale-90 hover:border-amber-400 hover:bg-amber-400/20 active:bg-amber-500/40 cursor-pointer disabled:opacity-40"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('clear')}
                    disabled={loading || !puzzle || gameOver}
                    className="col-span-1 flex h-11 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-950/40 text-xs font-black text-rose-300 shadow-md transition-all active:scale-90 hover:bg-rose-900/60 cursor-pointer disabled:opacity-40"
                  >
                    CLR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('submit')}
                    disabled={loading || !puzzle || !answer.trim() || gameOver}
                    className="col-span-1 flex h-11 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-950/60 text-xs font-black text-emerald-300 shadow-md transition-all active:scale-90 hover:bg-emerald-900/80 cursor-pointer disabled:opacity-40"
                  >
                    GO ↵
                  </button>
                </div>
              )}
            </div>

            {/* ── Quit / Return ──────────────────────────────── */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <button
                onClick={handleQuit}
                className="transition hover:text-rose-400 flex items-center gap-1"
              >
                <span>←</span>
                <span>Quit to Missions</span>
              </button>

              <span className="text-[11px] text-slate-600">
                Banana Guesser Arcade Edition
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Achievement unlock toast */}
      <AchievementToast
        queue={achievementQueue}
        onDismiss={(id) => setAchievementQueue((q) => q.filter((a) => a.id !== id))}
      />

      {/* Game over modal */}
      <GameOverModal
        isOpen={gameOver}
        score={Number(endResult?.finalScore ?? session?.score ?? 0)}
        bestScore={Number(endResult?.difficultyBest ?? (session ? highScores[session.difficulty] : 0))}
        roundsPlayed={roundsPlayed}
        newAchievements={sessionAchievements}
        onPlayAgain={handlePlayAgain}
        onExit={() => router.push('/')}
      />

      {/* Arcade Visual FX Styles */}
      <style jsx global>{`
        .arcade-grid {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        }

        .arcade-scanlines {
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%,
            rgba(0, 0, 0, 0.25) 50%
          );
          background-size: 100% 4px;
        }

        @keyframes arcade-shake {
          10%, 90% { transform: translate3d(-3px, 0, 0); }
          20%, 80% { transform: translate3d(5px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
          40%, 60% { transform: translate3d(6px, 0, 0); }
        }
        .arcade-shake {
          animation: arcade-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes correct-flash {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          50% { box-shadow: 0 0 35px 8px rgba(16, 185, 129, 0.5); }
          100% { box-shadow: none; }
        }
        .correct-flash {
          animation: correct-flash 0.6s ease-out;
        }

        @keyframes score-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.35); color: #fbbf24; }
          100% { transform: scale(1); }
        }
        .score-pop {
          animation: score-pop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes float-score {
          0% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.8); }
          20% { opacity: 1; transform: translate3d(0, -10px, 0) scale(1.15); }
          100% { opacity: 0; transform: translate3d(0, -45px, 0) scale(1); }
        }
        .float-score {
          animation: float-score 1.2s ease-out forwards;
        }

        @keyframes puzzle-pop {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .puzzle-pop {
          animation: puzzle-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes hearts-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .hearts-pulse {
          animation: hearts-pulse 0.4s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .arcade-shake, .correct-flash, .score-pop, .float-score, .puzzle-pop, .hearts-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
