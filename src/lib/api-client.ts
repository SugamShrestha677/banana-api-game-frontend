// frontend/src/lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// A simple in-memory store for the access token
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => { accessToken = token; };
export const getAccessToken = () => accessToken;

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers, credentials: 'include' });
  
  if (!response.ok) throw new Error((await response.json()).error || 'Request failed');
  return response.json();
}