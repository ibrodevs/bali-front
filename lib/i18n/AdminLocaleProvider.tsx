'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ADMIN_UI_LOCALES, AdminUiLocale } from './adminUi';

type AdminLocaleContextValue = {
  locale: AdminUiLocale;
  setLocale: (locale: AdminUiLocale) => void;
};

const STORAGE_KEY = 'br_admin_locale';
const AdminLocaleContext = createContext<AdminLocaleContextValue | null>(null);

function detectInitialLocale(): AdminUiLocale {
  if (typeof window === 'undefined') return 'en';

  const saved = window.localStorage.getItem(STORAGE_KEY) as AdminUiLocale | null;
  if (saved && ADMIN_UI_LOCALES.some((item) => item.code === saved)) {
    return saved;
  }

  const browserLocale = window.navigator.language.toLowerCase();
  if (browserLocale.startsWith('ru')) return 'ru';
  if (browserLocale.startsWith('id')) return 'id';
  return 'en';
}

export function AdminLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AdminUiLocale>('en');

  useEffect(() => {
    setLocaleState(detectInitialLocale());
  }, []);

  const setLocale = useCallback((nextLocale: AdminUiLocale) => {
    setLocaleState(nextLocale);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
    }
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <AdminLocaleContext.Provider value={value}>
      {children}
    </AdminLocaleContext.Provider>
  );
}

export function useAdminLocale() {
  const context = useContext(AdminLocaleContext);
  if (!context) {
    throw new Error('useAdminLocale must be used inside <AdminLocaleProvider>');
  }
  return context;
}
