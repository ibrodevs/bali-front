'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, Dict, Locale, LOCALES } from './dictionaries';

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
  tr: (template: string, vars?: Record<string, string | number>) => string;
};

const LocaleCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = 'br_locale';

function detectInitial(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (saved && saved in dictionaries) return saved;
  const nav = navigator.language?.toLowerCase() || '';
  for (const { code } of LOCALES) {
    if (nav.startsWith(code)) return code;
  }
  return 'en';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocaleState(detectInitial());
    setHydrated(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    }
  }, []);

  useEffect(() => {
    if (hydrated && typeof document !== 'undefined') document.documentElement.lang = locale;
  }, [locale, hydrated]);

  const t = dictionaries[locale];
  const tr = useCallback((template: string, vars?: Record<string, string | number>) => {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
  }, []);

  const value = useMemo(() => ({ locale, setLocale, t, tr }), [locale, setLocale, t, tr]);
  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
  return ctx;
}
