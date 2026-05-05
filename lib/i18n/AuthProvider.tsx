'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiUser, tokens, userStore } from '@/lib/api';
import { endpoints, loginAndStore } from '@/lib/endpoints';

type Ctx = {
  user: ApiUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<ApiUser>;
  signUp: (data: { email: string; password: string; full_name: string; phone?: string; language?: string }) => Promise<ApiUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = userStore.get();
    if (stored) setUser(stored);
    setLoading(false);
    if (tokens.get()) {
      endpoints.profile().then((u) => { userStore.set(u); setUser(u); }).catch(() => {});
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await loginAndStore(email, password);
    const u = data.user || userStore.get();
    if (u) setUser(u);
    return u as ApiUser;
  }, []);

  const signUp = useCallback(async (payload: { email: string; password: string; full_name: string; phone?: string; language?: string }) => {
    await endpoints.register(payload);
    const data = await loginAndStore(payload.email, payload.password);
    const u = data.user || userStore.get();
    if (u) setUser(u);
    return u as ApiUser;
  }, []);

  const signOut = useCallback(async () => {
    try { await endpoints.logout(); } catch {}
    tokens.clear();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!tokens.get()) return;
    try {
      const u = await endpoints.profile();
      userStore.set(u);
      setUser(u);
    } catch {}
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, signUp, signOut, refresh }), [user, loading, signIn, signUp, signOut, refresh]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
