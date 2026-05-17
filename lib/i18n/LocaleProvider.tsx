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

function detectPreviewLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('previewLocale') as Locale | null;
  if (requested && requested in dictionaries) return requested;
  return null;
}

function detectInitial(): Locale {
  if (typeof window === 'undefined') return 'en';
  const previewLocale = detectPreviewLocale();
  if (previewLocale) return previewLocale;
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
  const [previewOverrides, setPreviewOverrides] = useState<Record<string, unknown>>({});

  const previewMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('sitePreview') === '1';
  }, []);

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
    setPreviewOverrides({});
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

  useEffect(() => {
    if (!previewMode || typeof window === 'undefined') return undefined;

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; payload?: Record<string, unknown> } | null;
      if (!data || data.type !== 'br-preview-overrides') return;
      setPreviewOverrides(data.payload || {});
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [previewMode]);

  const t = useMemo(
    () => deepMerge(deepMerge(dictionaries[locale], dictionaryOverrides), previewOverrides),
    [locale, dictionaryOverrides, previewOverrides],
  );
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
