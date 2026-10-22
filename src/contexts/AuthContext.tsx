'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, setAccessToken, getAccessToken } from '@/lib/api-client';

type User = {
  id: string;
  email: string;
  username: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // Network failure shouldn't trap the user in a logged-in state.
    // The server clears the cookie on the next successful call.
  } finally {
    setAccessToken(null);
    setUser(null);
  }
};

  useEffect(() => {
    // If the user already has an access token in memory (e.g., just logged in),
    // we still need to fetch their profile.
    async function bootstrap() {
      try {
        // Try refresh first if no access token in memory
        if (!getAccessToken()) {
          const refreshResult = await apiRequest('/auth/refresh', {
            method: 'POST',
          });
          setAccessToken(refreshResult.accessToken);
        }

        // Fetch profile using the (now valid) access token
        const me = await apiRequest('/users/me');
        setUser(me);
      } catch {
        // No valid session — user stays logged out
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout  }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
