// frontend/src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, setAccessToken } from '@/lib/api-client';

const FLOATING_BANANAS = [
  { left: '6%', top: '12%', size: 'text-5xl', delay: '0s', duration: '8s', opacity: 'opacity-40' },
  { left: '85%', top: '18%', size: 'text-6xl', delay: '1.2s', duration: '10s', opacity: 'opacity-30' },
  { left: '14%', top: '72%', size: 'text-6xl', delay: '0.6s', duration: '9s', opacity: 'opacity-30' },
  { left: '78%', top: '76%', size: 'text-4xl', delay: '2s', duration: '7s', opacity: 'opacity-40' },
  { left: '45%', top: '5%', size: 'text-4xl', delay: '1.6s', duration: '11s', opacity: 'opacity-25' },
  { left: '92%', top: '52%', size: 'text-3xl', delay: '0.3s', duration: '8.5s', opacity: 'opacity-25' },
];

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, username, password }),
      });
      setAccessToken(data.accessToken);
      router.push('/play'); // Redirect to game page
      // NOTE: intentionally no setLoading(false) here — we keep the button
      // in its loading state while the route transition happens.
    } catch (err) {
      setError((err as Error).message || 'Could not create your account. Try again.');
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 p-4">
      {/* Floating background bananas */}
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

      {/* Card */}
      <div className="card-in relative w-full max-w-md">
        <div className="rounded-3xl border border-white/60 bg-white/90 p-7 shadow-2xl shadow-amber-900/20 backdrop-blur-xl sm:p-9">
          {/* Brand header */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 rotate-6 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 text-3xl shadow-lg shadow-amber-500/40 transition-transform duration-300 hover:-rotate-6">
              🍌
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Join the Bunch
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Create your account and start guessing banana values
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              key={error}
              role="alert"
              aria-live="polite"
              className="shake mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
            >
              <span aria-hidden="true" className="mt-px">
                ⚠️
              </span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/25 disabled:opacity-60"
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="banana_lover_42"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                minLength={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/25 disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/25 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">At least 6 characters</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3.5 font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600 hover:shadow-xl hover:shadow-amber-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      d="M22 12a10 10 0 0 0-10-10"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="opacity-90"
                    />
                  </svg>
                  Peeling…
                </span>
              ) : (
                'Create Account 🍌'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Already in the bunch?{' '}
            <Link
              href="/login"
              className="font-semibold text-amber-600 underline-offset-2 transition hover:text-amber-700 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-amber-950/60">
          Guess the banana value — powered by the Banana API 🍌
        </p>
      </div>

      {/* Local animations */}
      <style>{`
        @keyframes banana-float {
          0%, 100% { transform: translateY(0) rotate(-10deg); }
          50%      { transform: translateY(-26px) rotate(10deg); }
        }
        .banana-float { animation: banana-float 8s ease-in-out infinite; }

        @keyframes card-in {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .card-in { animation: card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }

        @keyframes shake {
          10%, 90%      { transform: translateX(-2px); }
          20%, 80%      { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60%      { transform: translateX(6px); }
        }
        .shake { animation: shake 0.4s ease-in-out; }

        @media (prefers-reduced-motion: reduce) {
          .banana-float, .card-in, .shake { animation: none; }
        }
      `}</style>
    </main>
  );
}
