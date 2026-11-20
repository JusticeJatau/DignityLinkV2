import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {apiRequest, getStoredToken, setStoredToken} from '../lib/api.ts';
import {AuthUser, HealthStatus} from '../types/index.ts';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  health: HealthStatus | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshHealth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const refreshHealth = useCallback(async () => {
    try {
      const data = await apiRequest<HealthStatus>('/api/health');
      setHealth(data);
    } catch {
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      await refreshHealth();
      const token = getStoredToken();
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const res = await apiRequest<{user: AuthUser}>('/api/auth/me');
        if (mounted) setUser(res.user);
      } catch {
        setStoredToken(null);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, [refreshHealth]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<{token: string; user: AuthUser}>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({email, password}),
    });
    setStoredToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{user, loading, health, login, logout, refreshHealth}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
