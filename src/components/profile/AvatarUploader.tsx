// frontend/src/components/profile/AvatarUploader.tsx
'use client';

import { useRef, useState } from 'react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export default function AvatarUploader() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // apiRequest now handles FormData correctly (no Content-Type override)
      const res = (await apiRequest('/users/avatar', {
        method: 'POST',
        body: formData,
      })) as { avatarUrl: string };

      // Update the user in context so the new avatar appears everywhere
      if (setUser && user) {
        setUser({ ...user, avatarUrl: res.avatarUrl });
      }
    } catch (err) {
      setError((err as Error).message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!user) return null;

  const initial = user.username?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="group relative">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="h-24 w-24 rounded-3xl object-cover shadow-xl shadow-amber-500/40 ring-4 ring-white"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 to-amber-500 text-3xl font-extrabold text-amber-950 shadow-xl shadow-amber-500/40 ring-4 ring-white">
            {initial}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 disabled:opacity-50"
          aria-label="Change profile picture"
        >
          {uploading ? (
            <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <span className="text-2xl text-white">📷</span>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
      {error && <p className="max-w-[120px] text-center text-[10px] font-semibold leading-tight text-red-600">{error}</p>}
    </div>
  );
}