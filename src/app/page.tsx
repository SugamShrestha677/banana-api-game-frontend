'use client';

import Link from 'next/link';
import GoogleButton from '@/components/auth/GoogleButton';

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-20 w-20 -rotate-6 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 to-amber-500 text-4xl shadow-lg shadow-amber-500/40">
          🍌
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          Banana Guesser
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Guess the value of the banana and climb the leaderboard.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/login"
            className="block w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3.5 font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Create Account
          </Link>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/90 px-2 text-slate-400">or</span>
          </div>
        </div>

        <GoogleButton />
      </div>
    </main>
  );
}
