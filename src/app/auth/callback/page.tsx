// frontend/src/app/(auth)/callback/page.tsx
'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { setAccessToken } from '@/lib/api-client';

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    setAccessToken(token);
    router.replace('/play');
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500">
      <div className="rounded-2xl bg-white/90 px-6 py-5 text-center shadow-xl">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-amber-600" />
        <p className="text-sm font-semibold text-slate-700">Signing you in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}