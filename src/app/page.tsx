// 'use client';

// import Link from 'next/link';
// import GoogleButton from '@/components/auth/GoogleButton';

// export default function HomePage() {
//   return (
//     <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 p-4">
//       <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xl">
//         <div className="mx-auto mb-4 flex h-20 w-20 -rotate-6 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 to-amber-500 text-4xl shadow-lg shadow-amber-500/40">
//           🍌
//         </div>

//         <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
//           Banana Guesser
//         </h1>
//         <p className="mt-3 text-sm text-slate-500">
//           Guess the value of the banana and climb the leaderboard.
//         </p>

//         <div className="mt-8 space-y-3">
//           <Link
//             href="/login"
//             className="block w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3.5 font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600"
//           >
//             Log In
//           </Link>
//           <Link
//             href="/register"
//             className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50"
//           >
//             Create Account
//           </Link>
//         </div>

//         <div className="relative my-6">
//           <div className="absolute inset-0 flex items-center">
//             <div className="w-full border-t border-slate-200" />
//           </div>
//           <div className="relative flex justify-center text-xs uppercase">
//             <span className="bg-white/90 px-2 text-slate-400">or</span>
//           </div>
//         </div>

//         <GoogleButton />
//       </div>
//     </main>
//   );
// }



// src/app/page.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const FLOATING_BANANAS = [
  { left: '6%',  top: '14%', size: 'text-5xl', delay: '0s',   duration: '9s',  opacity: 'opacity-20' },
  { left: '88%', top: '22%', size: 'text-6xl', delay: '1.2s', duration: '11s', opacity: 'opacity-15' },
  { left: '18%', top: '78%', size: 'text-5xl', delay: '0.6s', duration: '10s', opacity: 'opacity-15' },
  { left: '82%', top: '80%', size: 'text-4xl', delay: '2s',   duration: '8s',  opacity: 'opacity-20' },
  { left: '48%', top: '6%',  size: 'text-3xl', delay: '1.6s', duration: '12s', opacity: 'opacity-15' },
];

const STEPS = [
  {
    n: '01',
    title: 'Study the banana',
    body: 'Each round shows you a fresh banana image pulled from the Banana API.',
  },
  {
    n: '02',
    title: 'Lock in your guess',
    body: 'Type the value you think it’s worth and hit Enter. Fast, focused, one number.',
  },
  {
    n: '03',
    title: 'Stack up the score',
    body: 'Correct guesses earn points. Wrong ones cost a life. You get three.',
  },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Instant rounds',
    body: 'New puzzle every second — no loading screens, no waiting.',
  },
  {
    icon: '🎯',
    title: 'Real Banana API',
    body: 'Every puzzle is generated live, so no two games are the same.',
  },
  {
    icon: '🏆',
    title: 'Personal bests',
    body: 'Every score is saved. Chase your record, then break it again.',
  },
  {
    icon: '📱',
    title: 'Plays anywhere',
    body: 'Full keyboard support on desktop, tap-friendly on mobile.',
  },
];

export default function HomePage() {
  const { user, loading } = useAuth();

  const primaryHref = !loading && user ? '/play' : '/register';
  const primaryLabel = !loading && user ? 'Continue playing' : 'Start playing free';

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Nav ───────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 to-amber-500 text-lg shadow-md shadow-amber-500/30 transition-transform duration-300 group-hover:rotate-12">
              🍌
            </span>
            <span className="text-lg font-extrabold tracking-tight">Banana Guesser</span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            {!loading && user ? (
              <Link
                href="/play"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-bold text-amber-950 shadow-sm shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600 active:scale-[0.98]"
              >
                Play now →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-sm font-bold text-amber-950 shadow-sm shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600 active:scale-[0.98]"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950">
        {/* Amber glow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-20%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-amber-500/25 blur-[130px]" />
          <div className="absolute bottom-[-30%] right-[-10%] h-[420px] w-[420px] rounded-full bg-yellow-400/10 blur-[120px]" />
        </div>

        {/* Floating bananas */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
          {FLOATING_BANANAS.map((b, i) => (
            <span
              key={i}
              className={`banana-float absolute ${b.size} ${b.opacity}`}
              style={{
                left: b.left,
                top: b.top,
                animationDelay: b.delay,
                animationDuration: b.duration,
              }}
            >
              🍌
            </span>
          ))}
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            {/* Copy */}
            <div className="reveal">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                </span>
                Powered by the Banana API
              </div>

              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Guess the banana.
                <br />
                <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Beat the bunch.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
                A fast-paced guessing game. Study each banana, lock in your number,
                and stack up points before you run out of lives. Three wrong — you’re out.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-3.5 text-sm font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600 hover:shadow-xl hover:shadow-amber-500/40 active:scale-[0.98]"
                >
                  {primaryLabel} 🍌
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/25 hover:bg-white/10"
                >
                  How it works
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <span className="text-emerald-400">●</span> Free forever
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="text-emerald-400">●</span> No download
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="text-emerald-400">●</span> Plays in seconds
                </span>
              </div>
            </div>

            {/* Mock game card */}
            <div className="reveal relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-400/30 to-yellow-500/10 blur-2xl" />
              <div className="relative rotate-2 rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/50 backdrop-blur-xl transition-transform duration-500 hover:rotate-0">
                {/* Card top row */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Round 4</span>
                  <span className="flex items-center gap-1">
                    <span className="text-red-400">❤️❤️❤️</span>
                  </span>
                </div>

                {/* Banana image area */}
                <div className="mt-3 flex h-48 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 text-7xl shadow-inner">
                  🍌
                </div>

                {/* Fake guess input */}
                <div className="mt-4 flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl font-bold text-white/70">
                  42
                  <span className="ml-1 inline-block h-5 w-px animate-pulse bg-amber-400" />
                </div>

                {/* Fake submit */}
                <div className="mt-3 flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-sm font-bold text-amber-950 shadow-md shadow-amber-500/30">
                  Guess
                </div>

                {/* Score chip */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900/60 px-4 py-3 text-xs">
                  <span className="text-slate-400">Score</span>
                  <span className="font-mono text-base font-bold text-amber-300">12</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade into white */}
        <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white" />
      </section>

      {/* ── Stats bar ─────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-slate-200 px-4 sm:px-6">
          {[
            { value: '1.2M+', label: 'Guesses made' },
            { value: '48k',   label: 'Games played' },
            { value: '3',     label: 'Lives per run' },
          ].map((s) => (
            <div key={s.label} className="px-4 py-8 text-center sm:px-6">
              <div className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:text-sm">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────── */}
      <section id="how" className="scroll-mt-20 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              How it works
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Three steps. One banana at a time.
            </h2>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              No tutorials, no setup. Just open the game and start guessing.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="group relative rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-7 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-sm font-extrabold text-amber-950 shadow-md shadow-amber-500/30">
                    {s.n}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span className="hidden h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent sm:block" />
                  )}
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              Features
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Built to keep you guessing.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 text-xl">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────── */}
      <section className="bg-white pb-20 pt-4 sm:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 px-6 py-14 text-center shadow-2xl shadow-amber-500/30 sm:px-12 sm:py-20">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
              <span className="absolute left-6 top-6 text-5xl opacity-20 sm:text-6xl">🍌</span>
              <span className="absolute right-8 bottom-8 text-6xl opacity-20 sm:text-7xl">🍌</span>
              <span className="absolute right-16 top-10 text-3xl opacity-20">🍌</span>
            </div>

            <div className="relative">
              <h2 className="text-3xl font-extrabold tracking-tight text-amber-950 sm:text-4xl lg:text-5xl">
                Think you can guess them all?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-amber-900/80 sm:text-lg">
                Free to play, no download, and your first round takes about ten seconds.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:bg-slate-800 active:scale-[0.98]"
                >
                  {primaryLabel} 🍌
                </Link>
                {!user && !loading && (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-950/20 bg-white/40 px-6 py-3.5 text-sm font-bold text-amber-950 backdrop-blur-sm transition hover:bg-white/60"
                  >
                    I already have an account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-300 to-amber-500 text-sm">
              🍌
            </span>
            <span className="font-semibold text-slate-700">Banana Guesser</span>
          </div>
          <p className="text-xs">
            Powered by the Banana API · Built with Next.js
          </p>
        </div>
      </footer>

      {/* Local animations */}
      <style>{`
        @keyframes banana-float {
          0%, 100% { transform: translateY(0) rotate(-10deg); }
          50%      { transform: translateY(-26px) rotate(10deg); }
        }
        .banana-float { animation: banana-float 9s ease-in-out infinite; }

        @keyframes reveal {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reveal { animation: reveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }

        @media (prefers-reduced-motion: reduce) {
          .banana-float, .reveal { animation: none; }
        }
      `}</style>
    </div>
  );
}
