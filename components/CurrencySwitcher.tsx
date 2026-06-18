'use client';
import { useEffect, useRef, useState } from 'react';
import { useCurrency, CURRENCY_SYMBOLS } from '@/lib/i18n/CurrencyProvider';

export default function CurrencySwitcher({ dark = false }: { dark?: boolean }) {
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleSetCurrency = (curr: string) => {
    setCurrency(curr);
    setOpen(false);
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const fg = dark ? '#fff' : '#000';
  const border = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
  const bg = dark ? '#141414' : '#fff';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} className="br-mono"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, border: `1px solid ${border}`, background: 'transparent', color: fg, fontSize: 12, cursor: 'pointer', letterSpacing: '0.06em' }}>
        <span style={{ fontSize: 14 }}>💱</span>
        <span>{currency}</span>
        <span style={{ fontSize: 9, opacity: 0.5 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: 6,
          minWidth: 140,
          boxShadow: '0 12px 30px -12px rgba(0,0,0,0.35)',
          zIndex: 50,
          top: '100%',
          marginTop: 8,
        }}>
          {availableCurrencies.map((curr) => (
            <button key={curr} onClick={() => handleSetCurrency(curr)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 8, border: 0, background: currency === curr ? (dark ? 'rgba(255,215,0,0.12)' : '#FFF6CC') : 'transparent', color: fg, cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>
              <span>{CURRENCY_SYMBOLS[curr] || curr}</span>
              <span style={{ flex: 1 }}>{curr}</span>
              {currency === curr && <span style={{ fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
