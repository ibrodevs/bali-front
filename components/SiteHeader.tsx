'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { BRLogo, BRPrimary } from './BR';
import LanguageSwitcher from './LanguageSwitcher';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useAuth } from '@/lib/i18n/AuthProvider';

export default function SiteHeader({ dark = false }: { dark?: boolean }) {
  const { t } = useLocale();
  const { user, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const bg = dark ? '#0A0A0A' : '#fff';
  const fg = dark ? '#fff' : '#000';
  const border = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';

  return (
    <div ref={headerRef} className="br-site-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${border}`, position: 'sticky', top: 0, background: bg, zIndex: 5, gap: 16, flexWrap: 'wrap' }}>
      <BRLogo size={22} dark={dark} />
      <button
        type="button"
        className="br-site-header-burger br-mono"
        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen((open) => !open)}
        style={{ border: `1px solid ${border}`, background: 'transparent', color: fg, borderRadius: 999, padding: '10px 12px', fontSize: 11, letterSpacing: '0.12em', cursor: 'pointer' }}
      >
        {mobileMenuOpen ? 'CLOSE' : 'MENU'}
      </button>
      <div className={`br-site-header-menu${mobileMenuOpen ? ' open' : ''}`} style={{ display: 'contents' }}>
        <nav className="br-site-header-nav" style={{ display: 'flex', gap: 28, fontSize: 14, fontWeight: 500 }}>
          <Link href="/catalog" onClick={() => setMobileMenuOpen(false)} style={{ color: fg, textDecoration: 'none' }}>{t.nav.catalog}</Link>
          <Link href="/booking" onClick={() => setMobileMenuOpen(false)} style={{ color: fg, textDecoration: 'none' }}>{t.nav.how}</Link>
          <Link href="/#delivery" onClick={() => setMobileMenuOpen(false)} style={{ color: fg, textDecoration: 'none' }}>{t.nav.locations}</Link>
        </nav>
        <div className="br-site-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <LanguageSwitcher dark={dark} />
        {user ? (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setUserMenuOpen((o) => !o)} className="br-mono"
              style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${border}`, background: 'transparent', color: fg, fontSize: 12, cursor: 'pointer' }}>
              {(user.full_name || user.email).split(' ')[0]} ▾
            </button>
            {userMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: dark ? '#141414' : '#fff', border: `1px solid ${border}`, borderRadius: 12, padding: 6, minWidth: 180, boxShadow: '0 12px 30px -12px rgba(0,0,0,0.35)', zIndex: 50 }}>
                <Link href="/profile" onClick={() => { setUserMenuOpen(false); setMobileMenuOpen(false); }} style={{ display: 'block', padding: '8px 10px', borderRadius: 8, color: fg, textDecoration: 'none', fontSize: 13 }}>{t.nav.profile}</Link>
                <button onClick={() => { setUserMenuOpen(false); setMobileMenuOpen(false); signOut(); }} style={{ display: 'block', width: '100%', padding: '8px 10px', borderRadius: 8, border: 0, background: 'transparent', color: fg, textAlign: 'left', cursor: 'pointer', fontSize: 13 }}>{t.nav.logout}</button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="br-mono" style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${border}`, color: fg, fontSize: 12, textDecoration: 'none' }}>
            {t.nav.login}
          </Link>
        )}
        <BRPrimary href="/catalog" onClick={() => setMobileMenuOpen(false)}>{t.nav.book} ↗</BRPrimary>
        </div>
      </div>
    </div>
  );
}
