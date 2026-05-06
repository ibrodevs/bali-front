'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthProvider';

export const CURRENCY_RATES: Record<string, number> = {
  'USD': 1,
  'RUB': 98.50,
  'EUR': 0.92,
  'CNY': 7.24,
  'AUD': 1.52,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'RUB': '₽',
  'EUR': '€',
  'CNY': '¥',
  'AUD': 'A$',
};

type Ctx = {
  currency: string;
  setCurrency: (c: string) => void;
  convertPrice: (priceUSD: number, targetCurrency?: string) => number;
  symbol: string;
};

const CurrencyCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = 'br_currency';

function detectInitial(userCurrency?: string): string {
  if (typeof window === 'undefined') return 'USD';
  if (userCurrency && userCurrency in CURRENCY_RATES) return userCurrency;
  const saved = localStorage.getItem(STORAGE_KEY) as string | null;
  if (saved && saved in CURRENCY_RATES) return saved;
  return 'USD';
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<string>('USD');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCurrencyState(detectInitial(user?.currency));
    setHydrated(true);
  }, [user?.currency]);

  const setCurrency = useCallback((c: string) => {
    if (c in CURRENCY_RATES) {
      setCurrencyState(c);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, c);
      }
    }
  }, []);

  const convertPrice = useCallback((priceUSD: number, targetCurrency?: string) => {
    const target = targetCurrency || currency;
    const fromRate = CURRENCY_RATES['USD'] || 1;
    const toRate = CURRENCY_RATES[target] || 1;
    return (priceUSD / fromRate) * toRate;
  }, [currency]);

  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  const value = useMemo(
    () => ({ currency, setCurrency, convertPrice, symbol }),
    [currency, setCurrency, convertPrice, symbol]
  );

  return (
    <CurrencyCtx.Provider value={value}>
      {hydrated ? children : null}
    </CurrencyCtx.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyCtx);
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>');
  return ctx;
}
