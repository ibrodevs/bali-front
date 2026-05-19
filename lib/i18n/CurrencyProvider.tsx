'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthProvider';

export const CURRENCY_RATES: Record<string, number> = {
  'USD': 1,
  'RUB': 98.50,
  'EUR': 0.92,
  'CNY': 7.24,
  'AUD': 1.52,
  'IDR': 15650,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'RUB': '₽',
  'EUR': '€',
  'CNY': '¥',
  'AUD': 'A$',
  'IDR': 'Rp',
};

export function isSupportedCurrency(currency?: string | null): currency is string {
  return Boolean(currency && currency in CURRENCY_RATES);
}

export function convertAmount(amount: number, fromCurrency = 'USD', toCurrency = 'USD'): number {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  const safeFrom = isSupportedCurrency(fromCurrency) ? fromCurrency : 'USD';
  const safeTo = isSupportedCurrency(toCurrency) ? toCurrency : 'USD';
  const fromRate = CURRENCY_RATES[safeFrom] || 1;
  const toRate = CURRENCY_RATES[safeTo] || 1;
  return (normalizedAmount / fromRate) * toRate;
}

export function formatCurrencyAmount(amount: number, currency = 'USD'): string {
  const safeCurrency = isSupportedCurrency(currency) ? currency : 'USD';
  const symbol = CURRENCY_SYMBOLS[safeCurrency] || safeCurrency;
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  return `${symbol}${normalizedAmount.toFixed(2)}`;
}

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
  const saved = localStorage.getItem(STORAGE_KEY) as string | null;
  if (saved && saved in CURRENCY_RATES) return saved;
  if (userCurrency && userCurrency in CURRENCY_RATES) return userCurrency;
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
    return convertAmount(priceUSD, 'USD', target);
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
