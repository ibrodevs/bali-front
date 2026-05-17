'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, Dict, Locale, LOCALES } from './dictionaries';
import { endpoints } from '@/lib/endpoints';

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override as T) ?? base;
  }

  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    result[key] = isPlainObject(current) && isPlainObject(value)
      ? deepMerge(current, value)
      : value;
  }
  return result as T;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [hydrated, setHydrated] = useState(false);
  const [dictionaryOverrides, setDictionaryOverrides] = useState<Record<string, unknown>>({});

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

  useEffect(() => {
    let cancelled = false;
    setDictionaryOverrides({});
    endpoints.bootstrap(locale)
      .then((bootstrap) => {
        if (!cancelled) {
          setDictionaryOverrides((bootstrap.dictionaryOverrides as Record<string, unknown>) || {});
        }
      })
      .catch(() => {
        if (!cancelled) setDictionaryOverrides({});
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const t = useMemo(() => deepMerge(dictionaries[locale], dictionaryOverrides), [locale, dictionaryOverrides]);
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
