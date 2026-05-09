'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { BRLogo, BRPrimary } from './BR';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySwitcher from './CurrencySwitcher';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useAuth } from '@/lib/i18n/AuthProvider';

const WA_LINK = 'https://wa.me/6281234567890?text=Hi%2C%20I%E2%80%99d%20like%20to%20rent%20a%20scooter%20in%20Bali!';

export default function SiteHeader({
  dark = false,
  transparent = false,
}: {
  dark?: boolean;
  transparent?: boolean;
}) {
  const { t } = useLocale();
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
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
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(max-width: 760px)');
    const syncViewport = () => setIsMobileViewport(media.matches);

    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
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

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Keep the cinematic transparent header on larger screens, but force
  // a solid mobile header so the navbar is visible before the first scroll.
  const isTransparent = transparent && !scrolled && !isMobileViewport;

  const fg = isTransparent ? '#fff' : (dark ? '#fff' : '#0A0A0F');
  const borderColor = isTransparent
    ? 'rgba(255,255,255,0.16)'
    : dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)';

  const headerBg = isTransparent
    ? 'transparent'
    : dark
      ? 'rgba(10,10,18,0.88)'
      : 'rgba(250,250,245,0.88)';

  const backdropFilter = isTransparent ? 'none' : 'blur(22px) saturate(180%)';

  const closeAll = () => { setMobileMenuOpen(false); setUserMenuOpen(false); };

  const isAdmin = user && (
    user.is_staff || user.is_superuser ||
    ['admin', 'manager', 'staff'].includes((user.role || '').toLowerCase())
  );

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const navLinks = (
    <>
      <Link
        href="/catalog" onClick={closeAll}
        className={`br-nav-link${isActive('/catalog') ? ' br-active' : ''}`}
        style={{ color: fg, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
      >
        {t.nav.catalog}
      </Link>
      <Link
        href="/how-it-works" onClick={closeAll}
        className={`br-nav-link${isActive('/how-it-works') ? ' br-active' : ''}`}
        style={{ color: fg, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
      >
        {t.nav.how}
      </Link>
      <Link
        href="/#delivery" onClick={closeAll}
        className="br-nav-link"
        style={{ color: fg, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
      >
        {t.nav.locations}
      </Link>
      {isAdmin && (
        <Link
          href="/admin" onClick={closeAll}
          className={`br-nav-link${isActive('/admin') ? ' br-active' : ''}`}
          style={{ color: fg, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
        >
          🔧 Admin
        </Link>
      )}
    </>
  );

  const headerActions = (
    <>
      <LanguageSwitcher dark={dark || isTransparent} />
      <CurrencySwitcher dark={dark || isTransparent} />

      {/* WhatsApp button */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="br-header-whatsapp"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 999,
          background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.35)',
          color: isTransparent ? '#4ade80' : '#16a34a',
          fontSize: 12, fontFamily: 'var(--br-mono)', letterSpacing: '0.04em',
          textDecoration: 'none', minHeight: 40,
          transition: 'background 200ms, border-color 200ms',
        }}
        aria-label="Contact via WhatsApp"
      >
        <span style={{ fontSize: 14 }}>💬</span>
        <span>WhatsApp</span>
      </a>

      {user ? (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="br-mono"
            style={{
              padding: '8px 14px', borderRadius: 999,
              border: `1px solid ${borderColor}`,
              background: 'transparent', color: fg,
              fontSize: 12, cursor: 'pointer', minHeight: 40,
            }}
          >
            {(user.full_name || user.email).split(' ')[0]} ▾
          </button>
          {userMenuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              background: dark ? '#141414' : '#fff',
              border: `1px solid ${borderColor}`,
              borderRadius: 14, padding: 6, minWidth: 200,
              boxShadow: 'var(--br-shadow-lg)', zIndex: 50,
            }}>
              <Link href="/profile" onClick={closeAll} style={{ display: 'block', padding: '10px 12px', borderRadius: 8, color: dark ? '#fff' : '#0A0A0F', textDecoration: 'none', fontSize: 13 }}>
                {t.nav.profile}
              </Link>
              <button onClick={() => { closeAll(); signOut(); }} style={{ display: 'block', width: '100%', padding: '10px 12px', borderRadius: 8, border: 0, background: 'transparent', color: dark ? '#fff' : '#0A0A0F', textAlign: 'left', cursor: 'pointer', fontSize: 13 }}>
                {t.nav.logout}
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/login" onClick={closeAll}
          className="br-mono"
          style={{
            padding: '8px 14px', borderRadius: 999,
            border: `1px solid ${borderColor}`,
            color: fg, fontSize: 12, textDecoration: 'none',
            minHeight: 40, display: 'inline-flex', alignItems: 'center',
          }}
        >
          {t.nav.login}
        </Link>
      )}

      <a
        href="/catalog"
        onClick={closeAll}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#FFD700', color: '#0A0A0F',
          fontFamily: 'var(--br-body)', fontSize: 14, fontWeight: 700,
          padding: '0 20px', height: 40, borderRadius: 999,
          textDecoration: 'none', letterSpacing: '-0.01em',
          transition: 'transform 180ms, box-shadow 180ms',
          whiteSpace: 'nowrap',
        }}
        className="br-header-book-btn"
      >
        {t.nav.book} ↗
      </a>
    </>
  );

  return (
    <>
      <div
        ref={headerRef}
        className={`br-site-header${dark ? ' br-dark' : ''}${isTransparent ? ' br-transparent' : ''}`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px clamp(16px, 4vw, 40px)',
          borderBottom: `1px solid ${scrolled ? borderColor : 'transparent'}`,
          position: transparent ? 'fixed' : 'sticky', top: 0, left: 0, right: 0,
          background: headerBg,
          backdropFilter: backdropFilter,
          WebkitBackdropFilter: backdropFilter,
          zIndex: mobileMenuOpen ? 52 : 50,
          gap: 16, flexWrap: 'wrap',
          transition: 'background 280ms var(--br-easing), border-color 280ms, backdrop-filter 280ms',
        }}
      >
        <BRLogo size={22} dark={dark || isTransparent} />

        {/* Hamburger */}
        <button
          type="button"
          className="br-site-header-burger"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="site-header-menu"
          onClick={() => { setUserMenuOpen(false); setMobileMenuOpen((o) => !o); }}
          style={{
            border: `1px solid ${borderColor}`,
            background: 'transparent', color: fg,
            borderRadius: 999, padding: '8px 12px',
            cursor: 'pointer', zIndex: 51, width: 44, height: 44,
          }}
        >
          <span aria-hidden style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center', width: 18, height: 14 }}>
            <span style={{ display: 'block', width: 18, height: 1.5, background: fg, transition: 'transform 220ms var(--br-easing), opacity 180ms', transform: mobileMenuOpen ? 'translateY(5.75px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: 18, height: 1.5, background: fg, transition: 'opacity 180ms', opacity: mobileMenuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 18, height: 1.5, background: fg, transition: 'transform 220ms var(--br-easing)', transform: mobileMenuOpen ? 'translateY(-5.75px) rotate(-45deg)' : 'none' }} />
          </span>
        </button>

        {/* Desktop menu */}
        <div className="br-site-header-menu br-site-header-menu-desktop">
          <nav className="br-site-header-nav" style={{ display: 'flex', gap: 28 }}>
            {navLinks}
          </nav>
          <div className="br-site-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {headerActions}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="site-header-menu"
        className={`br-site-header-menu br-site-header-menu-mobile${mobileMenuOpen ? ' open' : ''}`}
        style={{ paddingTop: 84 }}
      >
        <nav className="br-site-header-nav" style={{ display: 'flex', gap: 28, fontSize: 14, fontWeight: 500 }}>
          {navLinks}
        </nav>
        <div className="br-site-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {headerActions}
        </div>

        {/* Mobile CTA row */}
        <div style={{ padding: '24px 20px 0', borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: 24, display: 'flex', gap: 10, flexDirection: 'column' }}>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', fontFamily: 'var(--br-body)', fontSize: 16, fontWeight: 600, borderRadius: 14, padding: '15px', textDecoration: 'none', width: '100%' }}>
            💬 Chat on WhatsApp
          </a>
          <a href="/catalog" onClick={closeAll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#FFD700', color: '#0A0A0F', fontFamily: 'var(--br-body)', fontSize: 16, fontWeight: 700, borderRadius: 14, padding: '15px', textDecoration: 'none', width: '100%', letterSpacing: '-0.01em' }}>
            {t.nav.book} →
          </a>
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
