'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { LOCALES, Locale } from '@/lib/i18n/dictionaries';

export default function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) || LOCALES[0];

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
        <FlagIcon code={current.code} name={current.name} size={18} />
        <span>{current.code.toUpperCase()}</span>
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
          minWidth: 180,
          boxShadow: '0 12px 30px -12px rgba(0,0,0,0.35)',
          zIndex: 50,
          top: '100%',
          marginTop: 8,
        }}>
          {LOCALES.map((l) => (
            <button key={l.code} onClick={() => { setLocale(l.code as Locale); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 8, border: 0, background: locale === l.code ? (dark ? 'rgba(255,215,0,0.12)' : '#FFF6CC') : 'transparent', color: fg, cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>
              <FlagIcon code={l.code} name={l.name} size={20} />
              <span style={{ flex: 1 }}>{l.name}</span>
              <span className="br-mono" style={{ fontSize: 10, opacity: 0.5 }}>{l.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FlagIcon({ code, name, size }: { code: string; name: string; size: number }) {
  return (
    <span
      style={{
        width: size,
        height: Math.round(size * 0.72),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src={`/flags/${code}.svg`}
        alt={name}
        width={size}
        height={Math.round(size * 0.72)}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </span>
  );
}
