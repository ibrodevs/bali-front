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
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const fg = dark ? '#fff' : '#000';
  const border = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const bgSolid = dark ? 'rgba(10,10,10,0.92)' : 'rgba(255,255,255,0.92)';
  const bgScrolled = dark ? 'rgba(10,10,10,0.78)' : 'rgba(255,255,255,0.78)';
  const headerBg = scrolled ? bgScrolled : bgSolid;

  const closeAll = () => { setMobileMenuOpen(false); setUserMenuOpen(false); };

  return (
    <>
      <div
        ref={headerRef}
        className={`br-site-header${dark ? ' br-dark' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 40px',
          borderBottom: `1px solid ${scrolled ? border : 'transparent'}`,
          position: 'sticky',
          top: 0,
          background: headerBg,
          zIndex: 5,
          gap: 16,
          flexWrap: 'wrap',
          transition: 'background 220ms var(--br-easing), border-color 220ms',
        }}
      >
        <BRLogo size={22} dark={dark} />
        <button
          type="button"
          className="br-site-header-burger"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          style={{
            border: `1px solid ${border}`,
            background: 'transparent',
            color: fg,
            borderRadius: 999,
            padding: '8px 12px',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 51,
            width: 44,
            height: 44,
          }}
        >
          <span aria-hidden style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center', width: 18, height: 14 }}>
            <span style={{ display: 'block', width: 18, height: 1.5, background: fg, transition: 'transform 220ms var(--br-easing), opacity 180ms', transform: mobileMenuOpen ? 'translateY(5.75px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: 18, height: 1.5, background: fg, transition: 'opacity 180ms', opacity: mobileMenuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 18, height: 1.5, background: fg, transition: 'transform 220ms var(--br-easing)', transform: mobileMenuOpen ? 'translateY(-5.75px) rotate(-45deg)' : 'none' }} />
          </span>
        </button>
        <div className={`br-site-header-menu${mobileMenuOpen ? ' open' : ''}`} style={{ display: 'contents' }}>
          <nav className="br-site-header-nav" style={{ display: 'flex', gap: 28, fontSize: 14, fontWeight: 500 }}>
            <Link href="/catalog" onClick={closeAll} style={{ color: fg, textDecoration: 'none' }}>{t.nav.catalog}</Link>
            <Link href="/how-it-works" onClick={closeAll} style={{ color: fg, textDecoration: 'none' }}>{t.nav.how}</Link>
            <Link href="/#delivery" onClick={closeAll} style={{ color: fg, textDecoration: 'none' }}>{t.nav.locations}</Link>
          </nav>
          <div className="br-site-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LanguageSwitcher dark={dark} />
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="br-mono"
                  style={{ padding: '8px 14px', borderRadius: 999, border: `1px solid ${border}`, background: 'transparent', color: fg, fontSize: 12, cursor: 'pointer', minHeight: 40 }}
                >
                  {(user.full_name || user.email).split(' ')[0]} ▾
                </button>
                {userMenuOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: dark ? '#141414' : '#fff', border: `1px solid ${border}`, borderRadius: 12, padding: 6, minWidth: 200, boxShadow: 'var(--br-shadow-lg)', zIndex: 50 }}>
                    <Link href="/profile" onClick={closeAll} style={{ display: 'block', padding: '10px 12px', borderRadius: 8, color: fg, textDecoration: 'none', fontSize: 13 }}>{t.nav.profile}</Link>
                    <button onClick={() => { closeAll(); signOut(); }} style={{ display: 'block', width: '100%', padding: '10px 12px', borderRadius: 8, border: 0, background: 'transparent', color: fg, textAlign: 'left', cursor: 'pointer', fontSize: 13 }}>{t.nav.logout}</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" onClick={closeAll} className="br-mono" style={{ padding: '8px 14px', borderRadius: 999, border: `1px solid ${border}`, color: fg, fontSize: 12, textDecoration: 'none', minHeight: 40, display: 'inline-flex', alignItems: 'center' }}>
                {t.nav.login}
              </Link>
            )}
            <BRPrimary href="/catalog" onClick={closeAll}>{t.nav.book} ↗</BRPrimary>
          </div>
        </div>
      </div>
      <div
        className={`br-mobile-drawer-backdrop${mobileMenuOpen ? ' open' : ''}`}
        aria-hidden={!mobileMenuOpen}
        onClick={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
