'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthProvider';
import { endpoints } from '@/lib/endpoints';

export const DEFAULT_CURRENCY_RATES: Record<string, number> = {
  'IDR': 15650,
  'USD': 1,
  'RUB': 98.50,
  'EUR': 0.92,
  'CNY': 7.24,
  'AUD': 1.52,
};

export const CURRENCY_RATES = DEFAULT_CURRENCY_RATES;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'RUB': '₽',
  'EUR': '€',
  'CNY': '¥',
  'AUD': 'A$',
  'IDR': 'Rp',
};

function normalizeCurrencyCode(value: unknown) {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'IRD') return 'IDR';
  return normalized;
}

function getCurrencyDisplayToken(currency?: string | null) {
  const normalizedCurrency = normalizeCurrencyCode(currency);
  if (!normalizedCurrency) return 'Rp';
  return CURRENCY_SYMBOLS[normalizedCurrency] || normalizedCurrency;
}

function readCurrencyRatesOverride(overrides: unknown) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return undefined;
  }

  const settings = (overrides as Record<string, unknown>).settings;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return undefined;
  }

  return (settings as Record<string, unknown>).currencyRates;
}

function normalizeCurrencyRates(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_CURRENCY_RATES;
  }

  const next: Record<string, number> = {};
  for (const [code, value] of Object.entries(raw)) {
    const normalizedCode = normalizeCurrencyCode(code);
    const numericValue = Number(value);
    if (!normalizedCode || !Number.isFinite(numericValue) || numericValue <= 0) continue;
    next[normalizedCode] = numericValue;
  }

  if (!next.USD) {
    next.USD = 1;
  }
  if (!next.IDR) {
    next.IDR = DEFAULT_CURRENCY_RATES.IDR;
  }

  return Object.keys(next).length ? next : DEFAULT_CURRENCY_RATES;
}

function isSupportedCurrencyCode(currency?: string | null, rates: Record<string, number> = DEFAULT_CURRENCY_RATES): currency is string {
  return Boolean(currency && normalizeCurrencyCode(currency) in rates);
}

function rateFor(code: string, rates: Record<string, number>): number {
  return rates[code] || 1;
}

function convertWithRates(amount: number, rates: Record<string, number>, fromCurrency = 'USD', toCurrency = 'USD'): number {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  const safeFrom = isSupportedCurrencyCode(fromCurrency, rates) ? normalizeCurrencyCode(fromCurrency) : 'USD';
  const safeTo = isSupportedCurrencyCode(toCurrency, rates) ? normalizeCurrencyCode(toCurrency) : 'USD';
  const fromRate = rateFor(safeFrom, rates);
  const toRate = rateFor(safeTo, rates);
  return (normalizedAmount / fromRate) * toRate;
}

export function isSupportedCurrency(currency?: string | null): currency is string {
  return isSupportedCurrencyCode(currency);
}

export function convertAmount(amount: number, fromCurrency = 'USD', toCurrency = 'USD'): number {
  return convertWithRates(amount, DEFAULT_CURRENCY_RATES, fromCurrency, toCurrency);
}

export function formatGroupedAmount(amount: number, decimals = 0): string {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  const fixed = normalizedAmount.toFixed(decimals);
  const [intPart, fracPart] = fixed.split('.');
  const sign = intPart.startsWith('-') ? '-' : '';
  const digits = sign ? intPart.slice(1) : intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return fracPart ? `${sign}${grouped}.${fracPart}` : `${sign}${grouped}`;
}

export function formatCurrencyAmount(
  amount: number,
  currency = 'IDR',
  locale = 'en-US',
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  const normalizedCurrency = normalizeCurrencyCode(currency) || 'IDR';
  const displayToken = getCurrencyDisplayToken(normalizedCurrency);
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(normalizedAmount);
  const needsSpace = !(normalizedCurrency in CURRENCY_SYMBOLS);
  return `${displayToken}${needsSpace ? ' ' : ''}${formattedAmount}`;
}

type Ctx = {
  currency: string;
  setCurrency: (c: string) => void;
  setRates: (nextRates: Record<string, number>) => void;
  convertPrice: (priceUSD: number, targetCurrency?: string) => number;
  convertAmountValue: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  symbol: string;
  rates: Record<string, number>;
  availableCurrencies: string[];
};

const CurrencyCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = 'br_currency';
const RATES_STORAGE_KEY = 'br_currency_rates';

function readStoredCurrencyRates() {
  if (typeof window === 'undefined') return undefined;
  const raw = window.localStorage.getItem(RATES_STORAGE_KEY);
  if (!raw) return undefined;

  try {
    return normalizeCurrencyRates(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

function persistCurrencyRates(rates: Record<string, number>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(normalizeCurrencyRates(rates)));
}

function detectInitial(userCurrency?: string, rates: Record<string, number> = DEFAULT_CURRENCY_RATES): string {
  if (typeof window === 'undefined') return 'IDR';
  const saved = localStorage.getItem(STORAGE_KEY) as string | null;
  if (isSupportedCurrencyCode(saved, rates)) return normalizeCurrencyCode(saved);
  if (isSupportedCurrencyCode(userCurrency, rates)) return normalizeCurrencyCode(userCurrency);
  return 'IDR';
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [rates, setRatesState] = useState<Record<string, number>>(DEFAULT_CURRENCY_RATES);
  const [currency, setCurrencyState] = useState<string>('IDR');
  const [hydrated, setHydrated] = useState(false);

  const applyRates = useCallback((nextRatesRaw: Record<string, number>, options?: { persist?: boolean }) => {
    const normalizedRates = normalizeCurrencyRates(nextRatesRaw);
    setRatesState(normalizedRates);
    if (options?.persist !== false) {
      persistCurrencyRates(normalizedRates);
    }
    setCurrencyState((currentCurrency) => {
      if (isSupportedCurrencyCode(currentCurrency, normalizedRates)) {
        return currentCurrency;
      }

      const fallbackCurrency = detectInitial(user?.currency, normalizedRates);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, fallbackCurrency);
      }
      return fallbackCurrency;
    });
  }, [user?.currency]);

  useEffect(() => {
    let cancelled = false;
    const storedRates = readStoredCurrencyRates();

    if (storedRates) {
      setRatesState(storedRates);
    }

    endpoints.bootstrap('en')
      .then((bootstrap) => {
        if (cancelled) return;
        applyRates(normalizeCurrencyRates(
          readCurrencyRatesOverride(bootstrap.dictionaryOverrides),
        ));
      })
      .catch(() => {
        if (!cancelled) {
          applyRates(storedRates || DEFAULT_CURRENCY_RATES);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyRates]);

  useEffect(() => {
    setCurrencyState(detectInitial(user?.currency, rates));
    setHydrated(true);
  }, [rates, user?.currency]);

  const setCurrency = useCallback((c: string) => {
    const normalized = normalizeCurrencyCode(c);
    if (normalized in rates) {
      setCurrencyState(normalized);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, normalized);
      }
    }
  }, [rates]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncRatesFromStorage = (nextValue: string | null) => {
      if (!nextValue) {
        applyRates(DEFAULT_CURRENCY_RATES, { persist: false });
        return;
      }

      try {
        applyRates(JSON.parse(nextValue), { persist: false });
      } catch {
        applyRates(DEFAULT_CURRENCY_RATES, { persist: false });
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue && isSupportedCurrencyCode(event.newValue, rates)) {
        setCurrencyState(normalizeCurrencyCode(event.newValue));
      }

      if (event.key === RATES_STORAGE_KEY) {
        syncRatesFromStorage(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [applyRates, rates]);

  const convertPrice = useCallback((priceUSD: number, targetCurrency?: string) => {
    const target = targetCurrency || currency;
    return convertWithRates(priceUSD, rates, 'USD', target);
  }, [currency, rates]);

  const convertAmountValue = useCallback((amount: number, fromCurrency = 'USD', toCurrency?: string) => {
    const target = toCurrency || currency;
    return convertWithRates(amount, rates, fromCurrency, target);
  }, [currency, rates]);

  const symbol = CURRENCY_SYMBOLS[currency] || (currency ? `${currency} ` : 'Rp');
  const availableCurrencies = useMemo(() => {
    const defaults = Object.keys(DEFAULT_CURRENCY_RATES);
    const extra = Object.keys(rates).filter((code) => !defaults.includes(code));
    return [...defaults.filter((code) => code in rates), ...extra];
  }, [rates]);

  const value = useMemo(
    () => ({ currency, setCurrency, setRates: applyRates, convertPrice, convertAmountValue, symbol, rates, availableCurrencies }),
    [currency, setCurrency, applyRates, convertPrice, convertAmountValue, symbol, rates, availableCurrencies]
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
