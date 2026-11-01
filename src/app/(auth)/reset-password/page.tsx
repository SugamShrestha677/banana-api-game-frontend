'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api-client';

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 400);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/60 bg-white/90 p-7 shadow-2xl shadow-amber-900/20 backdrop-blur-xl sm:p-9">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 text-3xl shadow-lg shadow-amber-500/40">
              🔐
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Reset Password
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter the 6-digit OTP and your new password.
            </p>
          </div>

          {success ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              ✅ Password reset. Redirecting to login…
            </div>
          ) : (
            <>
              {error && (
                <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  <span aria-hidden="true">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/25 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label htmlFor="otp" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    OTP (6 digits)
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-lg tracking-[0.5em] text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/25 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-400/25 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">At least 6 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3.5 font-bold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:from-amber-500 hover:to-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="font-semibold text-amber-600 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
