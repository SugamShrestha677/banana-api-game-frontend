'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getAccessToken } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import GameOverModal from '../../components/game/GameOverModal';
import GameNav from '../../components/game/GameNav';
import AchievementToast, { Achievement } from '../../components/game/AchievementToast';
import CartoonMascot, { MascotState } from '../../components/game/CartoonMascot';
import JungleBackground from '../../components/game/JungleBackground';
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

// ─── Cartoon Difficulty Trail Config ────────────────────
const DIFFICULTIES: Record<
  Difficulty,
  {
    label: string;
    trailName: string;
    emoji: string;
    tagline: string;
    secondsPerPuzzle: number;
    lives: number;
    pointsPerCorrect: number;
    cardBg: string;
    cardBorder: string;
    badgeBg: string;
    buttonBg: string;
    buttonShadow: string;
    mascotQuote: string;
  }
> = {
  easy: {
    label: 'Easy',
    trailName: '🌴 Sunshine Cove',
    emoji: '🍦',
    tagline: 'Relaxed trail · 5 Heart Shields · 1 Banana/solve',
    secondsPerPuzzle: 60,
    lives: 5,
    pointsPerCorrect: 1,
    cardBg: 'from-amber-50/95 via-yellow-50/95 to-emerald-50/95',
    cardBorder: 'border-emerald-600/80 hover:border-emerald-500',
    badgeBg: 'bg-emerald-600 text-white',
    buttonBg: 'from-emerald-500 via-teal-500 to-green-600 text-white',
    buttonShadow: 'shadow-emerald-700/40',
    mascotQuote: 'Nice & easy! Lots of time to count the bananas!',
  },
  medium: {
    label: 'Medium',
    trailName: '🌋 Volcano Ridge',
    emoji: '🔥',
    tagline: 'Brisk trail · 3 Heart Shields · 2 Bananas/solve',
    secondsPerPuzzle: 30,
    lives: 3,
    pointsPerCorrect: 2,
    cardBg: 'from-amber-50/95 via-orange-50/95 to-amber-100/95',
    cardBorder: 'border-amber-600/80 hover:border-amber-500',
    badgeBg: 'bg-amber-600 text-white',
    buttonBg: 'from-amber-500 via-orange-500 to-amber-600 text-amber-950',
    buttonShadow: 'shadow-amber-700/40',
    mascotQuote: 'Feel the tropical heat! 30 seconds on the clock!',
  },
  hard: {
    label: 'Hard',
    trailName: '⚡ Temple of Doom',
    emoji: '💀',
    tagline: 'Extreme 15s speed · 2 Heart Shields · 3 Bananas/solve',
    secondsPerPuzzle: 15,
    lives: 2,
    pointsPerCorrect: 3,
    cardBg: 'from-rose-50/95 via-amber-50/95 to-purple-50/95',
    cardBorder: 'border-rose-600/80 hover:border-rose-500',
    badgeBg: 'bg-rose-600 text-white',
    buttonBg: 'from-rose-500 via-red-600 to-purple-700 text-white',
    buttonShadow: 'shadow-rose-700/40',
    mascotQuote: 'Watch out! Lightning reflexes needed here!',
  },
};

function getStreakBadge(streak: number) {
  if (streak >= 10) return { label: '⚡ BANANA DEITY', multiplier: 'x5', bg: 'from-purple-500 to-pink-600' };
  if (streak >= 5) return { label: '🔥🔥 ON FIRE', multiplier: 'x4', bg: 'from-orange-500 to-red-600' };
  if (streak >= 3) return { label: '🔥 HOT STREAK', multiplier: 'x3', bg: 'from-amber-500 to-orange-500' };
  if (streak >= 2) return { label: '✨ COMBO', multiplier: 'x2', bg: 'from-emerald-500 to-teal-600' };
  return null;
}

// ─── Cartoon Confetti Burst ─────────────────────────────
function launchJungleConfetti() {
  if (typeof window === 'undefined') return;
  const canvas = document.getElementById('jungle-confetti') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#facc15', '#fbbf24', '#22c55e', '#38bdf8', '#f43f5e', '#ffffff'];
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
    shape: 'rect' | 'circle';
  }> = [];

  for (let i = 0; i < 50; i++) {
    particles.push({
      x: rect.width / 2 + (Math.random() - 0.5) * 100,
      y: rect.height * 0.45,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 12 - 4,
      size: Math.random() * 9 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 18,
      alpha: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
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
      p.vy += 0.45; // gravity
      p.rotation += p.vRot;
      p.alpha -= 0.022;
      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
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

// ─── PlayPage Component ─────────────────────────────────
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
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [floatingPoints, setFloatingPoints] = useState<{ value: number; key: number } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [correctKey, setCorrectKey] = useState(0);
  const [scorePop, setScorePop] = useState(false);

  const [audioOn, setAudioOn] = useState(true);
  const [showKeypad, setShowKeypad] = useState(true);

  const [gameOver, setGameOver] = useState(false);
  const [endResult, setEndResult] = useState<EndResult | null>(null);

  const sessionRef = useRef(session);
  sessionRef.current = session;
  const puzzleRef = useRef(puzzle);
  puzzleRef.current = puzzle;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const gameOverRef = useRef(gameOver);
  gameOverRef.current = gameOver;

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
  useEffect(() => {
    if (gameState !== 'playing' || !puzzleRef.current || timeLeft > 0 || gameOverRef.current) return;
    if (timeoutFiredRef.current) return;
    timeoutFiredRef.current = true;
    submitAnswer('__timeout__');
  }, [timeLeft, gameState]);

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
    const currentSession = sessionRef.current;
    const currentPuzzle = puzzleRef.current;
    if (!currentSession || !currentPuzzle || loadingRef.current || gameOverRef.current) return;
    setLoading(true);
    setAnswer('');
    const timeTakenMs = Math.max(0, Date.now() - puzzleStartTimeRef.current);

    try {
      const result = (await apiRequest(`/games/${currentSession.gameId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ puzzleId: currentPuzzle.id, answer: rawAnswer, timeTakenMs }),
      })) as AnswerResult;

      // Strict numeric point count: in Easy mode this is strictly 1 pt per correct answer
      const pointsAwarded = Number(result.pointsAwarded) || (DIFFICULTIES[currentSession.difficulty]?.pointsPerCorrect ?? 1);
      const newScore = Number(result.score);
      const newLives = Number(result.lives);
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
        setScorePop(true);
        setTimeout(() => setScorePop(false), 300);
        setFloatingPoints({
          value: pointsAwarded,
          key: ++keyCounterRef.current,
        });

        playCorrectSound(newStreak);
        launchJungleConfetti();

        const correctMsg =
          newStreak >= 2
            ? `🎉 Correct! +${pointsAwarded} Banana ${pointsAwarded === 1 ? 'Point' : 'Points'} (${newStreak}x Streak! 🔥)`
            : `✅ Correct! +${pointsAwarded} Banana ${pointsAwarded === 1 ? 'Point' : 'Points'}! 🍌`;

        setFeedback({
          ok: true,
          msg: correctMsg,
        });

        setTimeout(() => loadPuzzle(currentSession.difficulty), 750);
      } else {
        setStreak(0);
        setShakeKey((k) => k + 1);
        playWrongSound();

        const wasTimeout = rawAnswer === '__timeout__';
        setFeedback({
          ok: false,
          msg: wasTimeout
            ? `⏰ TIME'S UP! The answer was ${result.correctAnswer ?? '…'}`
            : `❌ WRONG! The answer was ${result.correctAnswer ?? '…'}`,
        });

        if (result.gameOver) {
          playGameOverSound();
          await finishGame();
        } else {
          setTimeout(() => loadPuzzle(currentSession.difficulty), 1150);
        }
      }
    } catch (err) {
      setFeedback({ ok: false, msg: (err as Error).message });
      if (rawAnswer === '__timeout__') {
        // Fallback safety net so user NEVER gets stuck blinking at 0s
        setSession((prev) => {
          if (!prev) return prev;
          const nextLives = Math.max(0, prev.lives - 1);
          if (nextLives <= 0) {
            setGameOver(true);
          } else {
            setTimeout(() => loadPuzzle(prev.difficulty), 1150);
          }
          return { ...prev, lives: nextLives };
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || loading || !puzzle || gameOver) return;
    await submitAnswer(answer);
  }

  // ─── Keypad Button Press ──────────────────────────────
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

  // Determine Mascot State dynamically
  const mascotState: MascotState = useMemo(() => {
    if (feedback?.ok === true) return 'correct';
    if (feedback?.ok === false) return 'wrong';
    if (timeLeft <= 5 && timeLeft > 0) return 'urgent';
    if (streak >= 3) return 'streak';
    if (loading) return 'thinking';
    return 'idle';
  }, [feedback, timeLeft, streak, loading]);

  // ─── Loading / auth guard ─────────────────────────────
  if (authLoading || !user) {
    return (
      <div className="relative flex min-h-screen flex-col bg-amber-400 text-slate-900">
        <JungleBackground />
        <GameNav />
        <main className="relative z-10 flex flex-1 items-center justify-center p-4">
          <div className="flex items-center gap-3 rounded-3xl border-4 border-amber-900/30 bg-amber-100/95 px-8 py-6 text-base font-black text-amber-950 shadow-2xl backdrop-blur-xl animate-bounce">
            <span className="text-3xl animate-spin">🍌</span>
            <span>Entering the Jungle Expedition…</span>
          </div>
        </main>
      </div>
    );
  }

  const bestDisplay = highScore ?? 0;
  const streakBadge = getStreakBadge(streak);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden text-slate-900 selection:bg-amber-400 selection:text-amber-950">
      {/* ── Cartoon Animated Jungle Background Layer ── */}
      <JungleBackground />

      {/* Confetti overlay canvas */}
      <canvas
        id="jungle-confetti"
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      />

      <GameNav />

      <main className="relative z-10 flex flex-1 items-center justify-center p-3 sm:p-6">
        {gameState === 'selecting' || !config || !session ? (
          /* ═══════════════════════════════════════════════════════ */
          /* ─── CARTOON EXPEDITION MISSION SELECT TRAIL ────────── */
          /* ═══════════════════════════════════════════════════════ */
          <div className="w-full max-w-5xl py-2 sm:py-6">
            {/* Header Wooden Billboard */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-amber-900/40 bg-amber-200/90 px-4 py-1.5 text-xs font-black tracking-widest text-amber-950 uppercase shadow-lg backdrop-blur-md">
                <span>🌴</span>
                <span>JUNGLE EXPEDITION ARENA</span>
                <span>🍌</span>
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-amber-950 drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)] sm:text-5xl lg:text-6xl font-comic">
                CHOOSE YOUR <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">TRAIL</span>
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-sm font-bold text-amber-950/80 sm:text-base">
                Explore the tropical jungle, crack the banana riddles, and build your golden banana stash!
              </p>

              {/* Player Trophy Ribbon */}
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border-3 border-amber-900/30 bg-amber-100/90 px-5 py-2.5 shadow-xl backdrop-blur-md">
                <span className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                  <span className="text-base">🏆</span>
                  <span>Jungle Record:</span>
                  <span className="text-sm font-black text-emerald-800">{bestDisplay} pts</span>
                </span>
                <span className="text-amber-400">|</span>
                <span className="text-xs font-black text-amber-800">
                  Scout: <span className="text-amber-950">@{username || 'Scout'}</span>
                </span>
                <span className="text-amber-400">|</span>
                <button
                  onClick={toggleSound}
                  className="flex items-center gap-1 rounded-xl bg-amber-200/80 px-2.5 py-1 text-xs font-black text-amber-900 transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  title="Toggle Sound"
                >
                  <span>{audioOn ? '🔊 Audio: ON' : '🔇 Audio: OFF'}</span>
                </button>
              </div>
            </div>

            {/* Trail Cards Grid (Chunky Wooden Jungle Signs) */}
            <div className="grid gap-5 sm:grid-cols-3">
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => {
                const c = DIFFICULTIES[d];
                const best = Number(highScores[d]) || 0;
                return (
                  <div
                    key={d}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border-4 ${c.cardBorder} bg-gradient-to-b ${c.cardBg} p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_35px_rgba(69,26,3,0.3)]`}
                  >
                    {/* Top Leaf Banner */}
                    <div className="flex items-center justify-between">
                      <span className={`rounded-xl px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm ${c.badgeBg}`}>
                        {c.label}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-black text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-lg border border-amber-900/20">
                        <span>🍌</span>
                        <span>+{c.pointsPerCorrect} pt/solve</span>
                      </div>
                    </div>

                    {/* Cartoon Icon & Title */}
                    <div className="my-4 text-center">
                      <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-200/60 border-3 border-amber-900/20 text-4xl shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        {c.emoji}
                      </div>
                      <h2 className="text-2xl font-black text-amber-950">{c.trailName}</h2>
                      <p className="mt-1 text-xs font-extrabold text-amber-900/70">{c.tagline}</p>
                    </div>

                    {/* Trail Specs */}
                    <div className="space-y-2 rounded-2xl border-2 border-amber-900/20 bg-amber-100/70 p-3 text-xs font-black text-amber-950">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-amber-900/80">
                          <span>❤️</span> Heart Shields:
                        </span>
                        <span className="text-emerald-800">{c.lives} Lives</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-amber-900/80">
                          <span>⏱️</span> Coconut Fuse:
                        </span>
                        <span className="text-amber-900">{c.secondsPerPuzzle}s / riddle</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-amber-900/80">
                          <span>⭐</span> Reward:
                        </span>
                        <span className="text-amber-950">
                          {c.pointsPerCorrect} Banana {c.pointsPerCorrect === 1 ? 'Point' : 'Points'}
                        </span>
                      </div>
                    </div>

                    {/* Record Chip */}
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-200/50 px-3 py-1.5 text-xs font-black border border-amber-900/15">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                        Trail Record
                      </span>
                      <span className="text-amber-950 tabular-nums">
                        {best > 0 ? `${best} pts` : '—'}
                      </span>
                    </div>

                    {/* Start Action Button */}
                    <button
                      onClick={() => startGame(d)}
                      disabled={loading}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${c.buttonBg} py-3.5 text-sm font-black shadow-lg ${c.buttonShadow} transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer`}
                    >
                      <span>EXPLORE TRAIL</span>
                      <span className="text-base transition-transform group-hover:translate-x-1">→</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════ */
          /* ─── CARTOON JUNGLE ARENA (Tiki Board & Mascot) ─────── */
          /* ═══════════════════════════════════════════════════════ */
          <div
            key={shakeKey}
            className={`${shakeKey > 0 ? 'cartoon-shake' : ''} ${
              correctKey > 0 ? 'cartoon-celebrate' : ''
            } relative w-full max-w-xl lg:max-w-5xl rounded-3xl border-4 border-amber-950/80 bg-amber-50/95 p-4 sm:p-6 shadow-[0_25px_50px_rgba(69,26,3,0.4)] backdrop-blur-xl transition-all duration-300`}
          >
            {/* ── Top Bamboo HUD Bar (Spans full width) ──────── */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-amber-900/30 bg-amber-100/90 p-3 shadow-md">
              {/* Trail Badge & Riddle Number */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-xl bg-amber-900 px-3 py-1 text-xs font-black text-amber-100 uppercase tracking-wide shadow-sm">
                  {config.trailName}
                </span>

                <span className="rounded-xl bg-amber-200/80 border border-amber-900/20 px-2.5 py-1 text-xs font-black text-amber-950">
                  Riddle #{roundsPlayed + 1}
                </span>

                <button
                  type="button"
                  onClick={toggleSound}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-900/30 bg-amber-200/80 text-sm transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  title={audioOn ? 'Mute Sounds' : 'Unmute Sounds'}
                >
                  {audioOn ? '🔊' : '🔇'}
                </button>
              </div>

              {/* Center Streak Badge (if active) */}
              {streakBadge && (
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${streakBadge.bg} px-3 py-1 text-xs font-black text-white shadow-md animate-pulse`}
                >
                  <span>{streakBadge.label}</span>
                  <span className="rounded-full bg-black/20 px-1.5 text-[10px]">
                    {streak}×
                  </span>
                </div>
              )}

              {/* Heart Shields Container & Quick Quit Link */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-amber-900/70 hidden sm:inline">Shields</span>
                  <div className="flex items-center gap-0.5 text-base sm:text-lg">
                    {Array.from({ length: config.lives }).map((_, i) => (
                      <span
                        key={i}
                        className={`transition-transform duration-300 ${
                          i < session.lives
                            ? 'scale-100 opacity-100 drop-shadow-[0_2px_4px_rgba(239,68,68,0.5)]'
                            : 'scale-75 opacity-30 grayscale'
                        }`}
                      >
                        {i < session.lives ? '❤️' : '🖤'}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuit}
                  className="inline-flex items-center gap-1 rounded-xl border border-amber-900/30 bg-amber-200/90 px-2.5 py-1 text-xs font-black text-amber-950 transition hover:bg-amber-300 active:scale-95 cursor-pointer"
                  title="Quit to Trails"
                >
                  <span>←</span>
                  <span className="hidden sm:inline">Quit</span>
                </button>
              </div>
            </div>

            {/* Critical Low Health Warning Banner */}
            {session.lives === 1 && (
              <div className="mb-4 flex items-center justify-center gap-1.5 rounded-xl border-2 border-red-500/80 bg-red-100 py-1.5 text-xs font-black text-red-700 uppercase animate-bounce shadow-md">
                <span>⚠️ WATCH OUT! LAST HEART SHIELD REMAINING! ⚠️</span>
              </div>
            )}

            {/* ── Wide Responsive 2-Column Grid (Zero Scroll on Desktop) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* ════════ LEFT COLUMN: Fuse, Puzzle Card & Mascot (lg:col-span-7) ════════ */}
              <div className="flex flex-col gap-3 lg:col-span-7">
                {/* Cartoon Coconut Fuse Countdown Timer */}
                <div className="rounded-2xl border-2 border-amber-900/25 bg-amber-100/90 p-2.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-black text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <span>🥥</span>
                      <span>COCONUT FUSE COUNTDOWN</span>
                    </span>
                    <span
                      className={`tabular-nums font-black text-sm ${
                        timeLeft <= 5 ? 'text-red-600 animate-ping' : 'text-amber-900'
                      }`}
                    >
                      {timeLeft}s
                    </span>
                  </div>

                  {/* Progress fuse track */}
                  <div className="relative mt-1.5 h-3.5 w-full overflow-hidden rounded-full bg-amber-950/20 p-0.5 border border-amber-900/30">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                        timeLeft <= 5
                          ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.9)]'
                          : timeLeft <= config.secondsPerPuzzle * 0.35
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gradient-to-r from-emerald-500 to-green-600'
                      }`}
                      style={{ width: `${Math.max(0, (timeLeft / config.secondsPerPuzzle) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Puzzle Easel Card */}
                <div className="relative flex min-h-[250px] lg:min-h-[290px] items-center justify-center overflow-hidden rounded-3xl border-3 border-amber-900/40 bg-white p-3 shadow-md">
                  {loading && !puzzle && (
                    <div className="flex flex-col items-center gap-2 text-amber-900 font-black text-sm">
                      <span className="text-4xl animate-bounce">🍌</span>
                      <span>Summoning Jungle Riddle…</span>
                    </div>
                  )}

                  {puzzle && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={puzzle.id}
                      src={puzzle.imageUrl}
                      alt="Banana Puzzle riddle"
                      className="max-h-[270px] lg:max-h-[300px] w-auto rounded-xl object-contain drop-shadow-md select-none"
                    />
                  )}
                </div>

                {/* Animated Cartoon Mascot Widget */}
                <div>
                  <CartoonMascot state={mascotState} streakCount={streak} />
                </div>
              </div>

              {/* ════════ RIGHT COLUMN: Stash, Feedback, Input, Keypad, Big Quit (lg:col-span-5) ════════ */}
              <div className="flex flex-col gap-3 lg:col-span-5">
                {/* Score Stash Box */}
                <div className="flex items-center justify-between rounded-2xl border-2 border-amber-900/25 bg-gradient-to-r from-amber-100/90 via-yellow-100/80 to-amber-100/90 p-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 border-2 border-amber-900/30 text-2xl shadow-md">
                      🍌
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/70">
                        Banana Stash
                      </span>
                      <div className="relative flex items-baseline gap-1.5">
                        <span
                          className={`inline-block text-3xl font-black text-amber-950 tabular-nums transition-transform duration-200 ${
                            scorePop ? 'scale-125 text-emerald-700' : 'scale-100'
                          }`}
                        >
                          {Number(session.score) || 0}
                        </span>
                        <span className="text-xs font-black text-amber-800">PTS</span>

                        {/* Floating +pts pop-up */}
                        {floatingPoints && (
                          <span
                            key={floatingPoints.key}
                            className="float-points pointer-events-none absolute -top-3 left-full ml-1 text-sm font-black text-emerald-700 drop-shadow-sm whitespace-nowrap"
                          >
                            +{floatingPoints.value} {floatingPoints.value === 1 ? 'pt' : 'pts'}!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/70 block">
                      Trail Best
                    </span>
                    <span className="text-sm font-black text-amber-950">
                      {highScores[session.difficulty] ?? 0} pts
                    </span>
                  </div>
                </div>

                {/* Feedback Banner */}
                {feedback && (
                  <div
                    className={`rounded-2xl border-2 p-3 text-center text-sm font-black transition-all ${
                      feedback.ok
                        ? 'border-emerald-600/80 bg-emerald-100 text-emerald-900 shadow-md'
                        : 'border-rose-600/80 bg-rose-100 text-rose-900 shadow-md'
                    }`}
                  >
                    {feedback.msg}
                  </div>
                )}

                {/* Answer Submission Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter answer…"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={loading || !puzzle || gameOver}
                    className="flex-1 rounded-2xl border-3 border-amber-900/40 bg-white px-4 py-3 text-center text-2xl font-black text-amber-950 placeholder:text-amber-900/40 outline-none transition focus:border-amber-600 focus:shadow-[0_0_12px_rgba(245,158,11,0.4)] disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={loading || !puzzle || !answer.trim() || gameOver}
                    className={`rounded-2xl bg-gradient-to-r ${config.buttonBg} px-6 py-3 font-black text-sm sm:text-base shadow-lg ${config.buttonShadow} transition-all duration-150 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer`}
                  >
                    GUESS 🍌
                  </button>
                </form>

                {/* Chunky Wooden Quick-Tap Keypad */}
                <div className="rounded-2xl border-2 border-amber-900/20 bg-amber-100/70 p-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-black uppercase text-amber-900/80">
                    <span>⚡ Touch Keypad</span>
                    <button
                      type="button"
                      onClick={() => setShowKeypad((k) => !k)}
                      className="text-amber-900 hover:underline cursor-pointer"
                    >
                      {showKeypad ? 'Hide ▲' : 'Show ▼'}
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
                          className="flex h-11 items-center justify-center rounded-xl border-2 border-amber-900/30 bg-amber-200/90 text-lg font-black text-amber-950 shadow-sm transition-all active:scale-90 active:bg-amber-400 hover:bg-amber-300 cursor-pointer disabled:opacity-40"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleKeypadPress('clear')}
                        disabled={loading || !puzzle || gameOver}
                        className="col-span-1 flex h-11 items-center justify-center rounded-xl border-2 border-rose-900/30 bg-rose-200 text-xs font-black text-rose-950 shadow-sm transition-all active:scale-90 hover:bg-rose-300 cursor-pointer disabled:opacity-40"
                      >
                        CLR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleKeypadPress('submit')}
                        disabled={loading || !puzzle || !answer.trim() || gameOver}
                        className="col-span-1 flex h-11 items-center justify-center rounded-xl border-2 border-emerald-900/30 bg-emerald-300 text-xs font-black text-emerald-950 shadow-sm transition-all active:scale-90 hover:bg-emerald-400 cursor-pointer disabled:opacity-40"
                      >
                        GO ↵
                      </button>
                    </div>
                  )}
                </div>

                {/* ── HIGH VISIBILITY PROMINENT "QUIT TO TRAILS" BUTTON ── */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleQuit}
                    className="group w-full flex items-center justify-center gap-2.5 rounded-2xl border-3 border-amber-900/50 bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 py-3.5 px-4 text-sm sm:text-base font-black text-amber-950 shadow-md transition-all duration-200 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
                  >
                    <span className="text-xl transition-transform group-hover:-translate-x-1.5">🏕️ ←</span>
                    <span className="tracking-wider uppercase">QUIT TO TRAILS</span>
                  </button>
                </div>
              </div>
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

      {/* Cartoon Animation Styles */}
      <style jsx global>{`
        @keyframes cartoon-shake {
          10%, 90% { transform: translate3d(-3px, 0, 0) rotate(-1deg); }
          20%, 80% { transform: translate3d(5px, 0, 0) rotate(2deg); }
          30%, 50%, 70% { transform: translate3d(-6px, 0, 0) rotate(-2deg); }
          40%, 60% { transform: translate3d(6px, 0, 0) rotate(1deg); }
        }
        .cartoon-shake {
          animation: cartoon-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes cartoon-celebrate {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .cartoon-celebrate {
          animation: cartoon-celebrate 0.5s ease-out;
        }

        @keyframes score-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); color: #15803d; }
          100% { transform: scale(1); }
        }
        .score-pop {
          animation: score-pop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes float-points {
          0% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.8); }
          20% { opacity: 1; transform: translate3d(0, -8px, 0) scale(1.15); }
          100% { opacity: 0; transform: translate3d(0, -35px, 0) scale(1); }
        }
        .float-points {
          animation: float-points 1.2s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .cartoon-shake, .cartoon-celebrate, .score-pop, .float-points {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
