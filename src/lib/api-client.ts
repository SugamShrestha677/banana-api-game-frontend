// frontend/src/lib/api-client.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => { accessToken = token; };
export const getAccessToken = () => accessToken;

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});

  // Only set JSON content type when the body is NOT FormData.
  // For FormData, the browser must set `multipart/form-data; boundary=...` itself.
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body.error || 'Request failed') as Error & { status?: number; code?: string };
    err.status = response.status;
    err.code = body.code;
    throw err;
  }

  return response.json();
}