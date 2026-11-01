'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
      startCooldown();
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function startCooldown() {
    setCooldown(60);
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(id);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function goToReset() {
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/60 bg-white/90 p-7 shadow-2xl shadow-amber-900/20 backdrop-blur-xl sm:p-9">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 text-3xl shadow-lg shadow-amber-500/40">
              🔑
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Forgot your password?
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your email and we&apos;ll send you a one-time code.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <span aria-hidden="true">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {sent ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                ✅ If an account exists for <strong>{email}</strong>, a one-time code has been generated.
                <div className="mt-2 text-xs text-green-700">
                  For this demo, check the <strong>backend terminal</strong> for the 6-digit OTP.
                </div>
              </div>

              <button
                type="button"
                onClick={goToReset}
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3.5 font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600"
              >
                Enter OTP →
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={cooldown > 0 || loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3.5 font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Remembered it?{' '}
            <Link href="/login" className="font-semibold text-amber-600 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
