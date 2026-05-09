'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BR_LOCATIONS } from '@/lib/data';
import { BRPhoto, BRPrice } from '@/components/BR';
import {
  DeliveryIcon, LightningIcon, PriceTagIcon, StarIcon, SupportIcon,
  renderAddonIcon,
} from '@/components/Icons';
import ScooterCard from '@/components/ScooterCard';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { mediaUrl } from '@/lib/api';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { endpoints } from '@/lib/endpoints';
import {
  DisplayScooter,
  fallbackScooters,
  resolveScooterImage,
  resolveScooterImageObjectPosition,
} from '@/lib/displayScooter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useCountUp(target: number, active: boolean, duration = 1400, startVal = 0, decimals = 0) {
  const [value, setValue] = useState(startVal);
  useEffect(() => {
    if (!active) return;
    const startTime = performance.now();
    const range = target - startVal;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(+(startVal + range * eased).toFixed(decimals));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  return value;
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', padding: '22px 0', background: 'transparent', border: 0,
          cursor: 'pointer', textAlign: 'left', gap: 16,
        }}
      >
        <span style={{ fontFamily: 'var(--br-display)', fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 600, letterSpacing: '-0.01em', color: '#0A0A0F', lineHeight: 1.3 }}>{q}</span>
        <span style={{
          width: 32, height: 32, borderRadius: 999, flexShrink: 0,
          background: open ? '#0A0A0F' : 'rgba(0,0,0,0.07)',
          color: open ? '#FFD700' : '#0A0A0F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 220ms var(--br-easing)', fontSize: 20, lineHeight: 1,
          fontWeight: 300,
        }}>
          {open ? '−' : '+'}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="faq-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.7, color: 'rgba(0,0,0,0.58)', maxWidth: 680, paddingRight: 48 }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const WA_LINK = 'https://wa.me/6281234567890?text=Hi%2C%20I%E2%80%99d%20like%20to%20rent%20a%20scooter%20in%20Bali!';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const { t, locale, tr } = useLocale();
  const [pickup] = useState('Canggu');
  const [start] = useState('Aug 14');
  const [end] = useState('Aug 21');
  const [featured, setFeatured] = useState<DisplayScooter[]>(fallbackScooters().slice(0, 3));
  const [addonCards, setAddonCards] = useState<Array<{ id: number; name: string; description?: string; priceUSD?: number; icon?: string }>>([]);
  const [zones, setZones] = useState<Array<{ id: number; name: string; freeDelivery?: boolean }>>([]);
  const [apiFaqs, setApiFaqs] = useState<Array<{ q: string; a: string }>>([]);
  const whyIcons = [DeliveryIcon, PriceTagIcon, LightningIcon, SupportIcon] as const;

  const statsRef = useRef<HTMLDivElement>(null);
  const [statsRevealed, setStatsRevealed] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const count340 = useCountUp(340, statsRevealed, 1400);
  const count12 = useCountUp(12, statsRevealed, 1100);
  const count497 = useCountUp(4.97, statsRevealed, 1600, 4.5, 2);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStatsRevealed(true); obs.disconnect(); }
    }, { threshold: 0.35 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    endpoints.bootstrap(locale)
      .then((bootstrap) => {
        if (cancelled) return;
        const nextFeatured = (bootstrap.fleet?.featured || []).map((item) => ({
          id: item.slug,
          apiId: item.id,
          name: item.name,
          cc: Number(String(item.engine || '').replace(/[^\d]/g, '')) || 0,
          type: item.typeLabel || item.type || 'Scooter',
          price: Number(item.priceUSD) || 0,
          photo: 'sand',
          tag: item.featured ? 'FEATURED' : (item.typeLabel || item.type || 'BIKE').toUpperCase(),
          status: item.available ? 'available' as const : 'booked' as const,
          range: 0, top: 0, weight: 0,
          imageUrl: item.mainImage ? mediaUrl(item.mainImage) : (resolveScooterImage(item.slug, item.name) || undefined),
          imageObjectPosition: resolveScooterImageObjectPosition(item.slug, item.name),
        }));
        if (nextFeatured.length) setFeatured(nextFeatured);
        setAddonCards(bootstrap.addons || []);
        setZones((bootstrap.deliveryZones || []).map((zone) => ({ id: zone.id, name: zone.name, freeDelivery: zone.freeDelivery })));
        const faqData = (bootstrap.content as Record<string, unknown> | undefined);
        const faqItems = (faqData?.home as Record<string, unknown> | undefined)?.faq;
        const items = (faqItems as Record<string, unknown> | undefined)?.items;
        if (Array.isArray(items) && items.length) {
          setApiFaqs(items as Array<{ q: string; a: string }>);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [locale]);

  const activeZones = useMemo(() => {
    const zoneNames = zones.map((z) => z.name);
    return zoneNames.length ? zoneNames : BR_LOCATIONS;
  }, [zones]);

  const addons = addonCards.length ? addonCards : [
    { id: 1, icon: 'shield', name: t.home.addonsFallback[0].name, priceUSD: 5, description: t.home.addonsFallback[0].description },
    { id: 2, icon: 'wifi', name: t.home.addonsFallback[1].name, priceUSD: 4, description: t.home.addonsFallback[1].description },
    { id: 3, icon: 'helmet', name: t.home.addonsFallback[2].name, priceUSD: 2, description: t.home.addonsFallback[2].description },
    { id: 4, icon: 'phone', name: t.home.addonsFallback[3].name, priceUSD: 2, description: t.home.addonsFallback[3].description },
  ];

  const faqs = apiFaqs.length ? apiFaqs : t.home.faqs;
  const homeReviews = t.home.reviews;

  return (
    <div style={{ width: '100%', background: '#FAFAF5', color: '#0A0A0F', fontFamily: 'var(--br-body)', WebkitFontSmoothing: 'antialiased' }}>
      <SiteHeader transparent />

      {/* ═══════════════════════════════════════════════════════════════
          01  HERO — cinematic full-screen
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 700, overflow: 'hidden' }}>
        {/* Background video */}
        <video
          autoPlay muted loop playsInline aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlays — cinematic depth */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.86) 100%)' }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 130% 100% at 50% 105%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.38) 100%)' }} />

        {/* Content pinned to bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: 'clamp(24px, 5vw, 60px) clamp(20px, 5vw, 56px) clamp(44px, 7vw, 80px)',
        }}>

          {/* Status pill */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 999, padding: '8px 16px', marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.9)' }} />
              <span style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.18em', color: '#fff' }}>
                {t.home.status} · {t.home.location}
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 64 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: 'var(--br-display)',
              fontSize: 'clamp(54px, 9.5vw, 120px)',
              lineHeight: 0.91, letterSpacing: '-0.04em',
              color: '#fff', margin: '0 0 20px', fontWeight: 800,
            }}
          >
            {t.home.title1}<br />
            <span style={{ color: '#FFD700' }}>{t.home.title2}</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(14px, 1.8vw, 19px)',
              color: 'rgba(255,255,255,0.78)',
              margin: '0 0 36px', maxWidth: 540, lineHeight: 1.55,
            }}
          >
            {t.home.subtitle}{' '}
            <span style={{ color: '#FFD700', fontWeight: 600 }}>{t.home.priceFrom} ${featured[0]?.price || 8}/{t.common.day}.</span>
          </motion.p>

          {/* Glassmorphism booking widget */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.46, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Desktop bar */}
            <div className="br-hero-search-wrap">
              <div style={{
                background: 'rgba(255,255,255,0.09)',
                backdropFilter: 'blur(28px) saturate(160%)', WebkitBackdropFilter: 'blur(28px) saturate(160%)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 20, padding: 8,
                display: 'flex', alignItems: 'stretch',
                maxWidth: 860,
                boxShadow: '0 32px 80px -20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
              }}>
                {[
                  { label: t.hero.pickup, value: pickup, sub: t.hero.locations },
                  { label: t.hero.pickupDate, value: start, sub: '08:00' },
                  { label: t.hero.returnDate, value: end, sub: '20:00' },
                ].map((f, i) => (
                  <a key={i} href="/catalog" style={{
                    padding: '14px 22px',
                    borderRight: '1px solid rgba(255,255,255,0.12)',
                    flex: 1, cursor: 'pointer', textDecoration: 'none', display: 'block',
                  }}>
                    <div style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.50)', marginBottom: 5 }}>{f.label}</div>
                    <div style={{ fontFamily: 'var(--br-display)', fontSize: 18, color: '#fff', lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.02em' }}>{f.value}</div>
                    <div style={{ fontFamily: 'var(--br-mono)', fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 3 }}>{f.sub}</div>
                  </a>
                ))}
                <div style={{ padding: '8px 8px 8px 10px', display: 'flex', alignItems: 'center' }}>
                  <a href="/catalog" className="br-hero-book-btn" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#FFD700', color: '#0A0A0F',
                    fontFamily: 'var(--br-body)', fontSize: 15, fontWeight: 700,
                    padding: '0 28px', height: 64, borderRadius: 14,
                    textDecoration: 'none', whiteSpace: 'nowrap', letterSpacing: '-0.01em',
                  }}>
                    {t.hero.cta} →
                  </a>
                </div>
              </div>
            </div>

            {/* Mobile CTA */}
            <div className="br-hero-mobile-btn">
              <a href="/catalog" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                background: '#FFD700', color: '#0A0A0F',
                fontFamily: 'var(--br-body)', fontSize: 17, fontWeight: 700,
                height: 60, borderRadius: 14, textDecoration: 'none', letterSpacing: '-0.01em',
                width: '100%',
              }}>
                {t.hero.cta} →
              </a>
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px', marginTop: 20 }}
          >
            {t.home.trustBadges.map((badge) => (
              <span key={badge} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'rgba(255,255,255,0.60)',
                fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.14em',
              }}>
                <span style={{ color: '#22C55E', fontSize: 12 }}>✓</span>
                {badge.toUpperCase()}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.35)', pointerEvents: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          }}
        >
          <span style={{ fontFamily: 'var(--br-mono)', fontSize: 9, letterSpacing: '0.18em' }}>{t.home.scroll.toUpperCase()}</span>
          <svg width="16" height="26" viewBox="0 0 16 26" fill="none">
            <rect x="0.75" y="0.75" width="14.5" height="24.5" rx="7.25" stroke="currentColor" strokeWidth="1.5" />
            <motion.circle cx="8" cy="7" r="2.5" fill="currentColor"
              animate={{ opacity: [1, 0.2, 1], y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
            />
          </svg>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          02  STATS — animated counters
          ═══════════════════════════════════════════════════════════════ */}
      <div ref={statsRef} className="br-home-stats" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)',
      }}>
        {([
          [`${count340}+`, t.stats.fleet],
          [`${count12}k`, t.stats.riders],
          [count497.toFixed(2), t.stats.rating],
          ['24/7', t.stats.support],
        ] as const).map(([n, l], i) => (
          <div key={i} style={{
            padding: 'clamp(22px, 4vw, 44px) clamp(18px, 3vw, 40px)',
            borderRight: i < 3 ? '1px solid rgba(0,0,0,0.07)' : 'none',
          }}>
            <div className="br-display" style={{ fontSize: 'clamp(40px, 5.5vw, 62px)', lineHeight: 1, letterSpacing: '-0.04em', color: '#0A0A0F' }}>{n}</div>
            <div style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.38)', marginTop: 8, textTransform: 'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          03  FLEET — popular scooters
          ═══════════════════════════════════════════════════════════════ */}
      <section id="fleet" style={{ padding: 'clamp(64px, 8vw, 112px) clamp(20px, 5vw, 56px)', background: '#FAFAF5' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 48 }}
        >
          <motion.div variants={fadeUp}>
            <div style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.35)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 24, height: 1, background: 'rgba(0,0,0,0.25)' }} />01 / FLEET
            </div>
            <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.035em', color: '#0A0A0F' }}>
              {t.fleet.title}
            </h2>
          </motion.div>
          <motion.div variants={fadeUp}>
            <a href="/catalog" className="br-outline-link" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--br-body)', fontSize: 14, fontWeight: 600,
              color: '#0A0A0F', textDecoration: 'none',
              padding: '12px 22px', border: '1.5px solid rgba(0,0,0,0.12)',
              borderRadius: 999,
            }}>
              {t.fleet.viewAll} →
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="br-home-fleet-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
        >
          {featured.slice(0, 3).map((s) => (
            <motion.div key={s.id} variants={fadeUp}>
              <ScooterCard s={s} large />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.35 }}
          style={{ textAlign: 'center', marginTop: 52 }}
        >
          <a href="/catalog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#0A0A0F', color: '#FFD700',
            fontFamily: 'var(--br-body)', fontSize: 16, fontWeight: 700,
            padding: '16px 40px', borderRadius: 999,
            textDecoration: 'none', letterSpacing: '-0.01em',
          }}>
            {t.home.viewFullFleet} →
          </a>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          04  WHY CHOOSE US — dark premium section
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) clamp(20px, 5vw, 56px)', background: '#0C0C12', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient glows */}
        <div aria-hidden style={{ position: 'absolute', top: -60, right: -60, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: -80, left: -40, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ marginBottom: 56, position: 'relative' }}
        >
          <motion.div variants={fadeUp} style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.18em', color: '#FFD700', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 24, height: 1, background: '#FFD700' }} />{t.home.whyLabel}
          </motion.div>
          <motion.h2 variants={fadeUp} className="br-display" style={{ margin: 0, fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}>
            {t.why.title}
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="br-home-why-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative' }}
        >
          {(t.why.items as [string, string][]).map(([title, desc], k) => {
            const Icon = whyIcons[k] || SupportIcon;
            return (
              <motion.div
                key={k}
                variants={fadeUp}
                whileHover={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,215,0,0.28)' }}
                style={{
                  position: 'relative', padding: '32px 24px 28px',
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20, overflow: 'hidden',
                  transition: 'background 300ms, border-color 300ms',
                }}
              >
                <div style={{ position: 'absolute', top: 20, right: 20, fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.18)' }}>0{k + 1}</div>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.22)',
                  marginBottom: 24,
                }}>
                  <Icon size={24} color="#FFD700" />
                </div>
                <div className="br-display" style={{ fontSize: 21, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 12 }}>{title}</div>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.50)', margin: '0 0 20px' }}>{desc}</p>
                <div style={{ height: 2, width: 28, background: '#FFD700', borderRadius: 1 }} />
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          05  HOW IT WORKS — 3 steps
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) clamp(20px, 5vw, 56px)', background: '#fff' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ marginBottom: 56 }}
        >
          <motion.div variants={fadeUp} style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.35)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 24, height: 1, background: 'rgba(0,0,0,0.25)' }} />{t.home.processLabel}
          </motion.div>
          <motion.h2 variants={fadeUp} className="br-display" style={{ margin: 0, fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.035em', color: '#0A0A0F' }}>
            {t.process.title}
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="br-home-process-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, position: 'relative' }}
        >
          {/* Connecting line (desktop) */}
          <div aria-hidden className="br-process-connector" style={{ position: 'absolute', top: 50, left: '17%', right: '17%', height: 1, background: 'linear-gradient(90deg, rgba(255,215,0,0.9), rgba(255,215,0,0.2))', zIndex: 0 }} />

          {(t.process.steps as [string, string][]).map(([title, desc], i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              style={{
                position: 'relative', zIndex: 1,
                padding: '36px 28px 32px',
                background: i === 0 ? 'linear-gradient(160deg, rgba(255,215,0,0.07) 0%, transparent 60%)' : '#fff',
                border: i === 0 ? '1.5px solid rgba(255,215,0,0.38)' : '1px solid rgba(0,0,0,0.07)',
                borderRadius: 20,
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: i === 0 ? '#FFD700' : '#0A0A0F',
                color: i === 0 ? '#0A0A0F' : '#FFD700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--br-mono)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
                marginBottom: 24,
                boxShadow: i === 0 ? '0 8px 24px -8px rgba(255,215,0,0.65)' : '0 8px 24px -8px rgba(0,0,0,0.35)',
              }}>
                0{i + 1}
              </div>
              <div style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.35)', marginBottom: 10 }}>{tr(t.home.stepLabel, { n: i + 1 })}</div>
              <div className="br-display" style={{ fontSize: 23, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0A0A0F', marginBottom: 14 }}>{title}</div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(0,0,0,0.52)', margin: 0 }}>{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          06  ADD-ONS — upgrade your ride
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) clamp(20px, 5vw, 56px)', background: '#FAFAF5' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 48 }}
        >
          <motion.div variants={fadeUp}>
            <div style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.35)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 24, height: 1, background: 'rgba(0,0,0,0.25)' }} />{t.home.addonsLabel}
            </div>
            <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.035em', color: '#0A0A0F' }}>
              {t.addons.title}
            </h2>
          </motion.div>
          <motion.div variants={fadeUp}>
            <span style={{ fontFamily: 'var(--br-mono)', fontSize: 11, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.14em', padding: '10px 16px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 999 }}>
              {t.addons.note}
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="br-home-addons-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
        >
          {addons.slice(0, 4).map((item, i) => (
            <motion.div
              key={item.id}
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: '0 24px 48px -16px rgba(0,0,0,0.12)' }}
              style={{
                padding: '28px 24px', background: '#fff',
                borderRadius: 20, border: '1px solid rgba(0,0,0,0.07)',
                transition: 'box-shadow 300ms',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.28)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {renderAddonIcon(item.name, item.icon, { size: 26, color: '#0A0A0F' })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 20, gap: 8 }}>
                <span className="br-display" style={{ fontSize: 20, letterSpacing: '-0.02em', color: '#0A0A0F' }}>{item.name}</span>
                <span style={{ fontFamily: 'var(--br-mono)', fontSize: 13, fontWeight: 700, color: '#0A0A0F', background: '#FFD700', padding: '4px 8px', borderRadius: 6, flexShrink: 0 }}>+${item.priceUSD || 0}/d</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.50)', marginTop: 10, marginBottom: 0, lineHeight: 1.6 }}>{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          07  REVIEWS — social proof
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) clamp(20px, 5vw, 56px)', background: '#F4F2ED' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 52 }}
        >
          <motion.div variants={fadeUp}>
            <div style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.35)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 24, height: 1, background: 'rgba(0,0,0,0.25)' }} />05 / REVIEWS
            </div>
            <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.035em', color: '#0A0A0F' }}>
              {t.reviews.title}
            </h2>
          </motion.div>
          <motion.div variants={fadeUp} style={{ fontFamily: 'var(--br-mono)', fontSize: 11, color: 'rgba(0,0,0,0.40)', letterSpacing: '0.12em' }}>
            {t.reviews.verified}
          </motion.div>
        </motion.div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="br-home-reviews-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}
        >
          {([
            { ...homeReviews[0], tone: 'sand' as const },
            { ...homeReviews[1], tone: 'sunset' as const },
            { ...homeReviews[2], tone: 'mist' as const },
          ]).map((rev, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -4, boxShadow: '0 24px 48px -16px rgba(0,0,0,0.11)' }}
              style={{
                background: '#fff', borderRadius: 20, padding: '32px 28px',
                border: '1px solid rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
                transition: 'box-shadow 300ms, transform 300ms',
              }}
            >
              {/* Decorative quote */}
              <div aria-hidden style={{ position: 'absolute', top: 14, right: 20, fontFamily: 'var(--br-display)', fontSize: 80, lineHeight: 1, color: 'rgba(255,215,0,0.13)', fontWeight: 800, userSelect: 'none', pointerEvents: 'none' }}>"</div>

              {/* Stars */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 18 }}>
                {Array.from({ length: 5 }).map((_, si) => <StarIcon key={si} size={14} color="#FFD700" />)}
              </div>

              {/* Quote */}
              <p style={{ fontSize: 16, lineHeight: 1.62, color: '#0A0A0F', margin: '0 0 28px', letterSpacing: '-0.01em', position: 'relative' }}>
                "{rev.quote}"
              </p>

              {/* User */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <BRPhoto tone={rev.tone} style={{ width: 44, height: 44, borderRadius: 999, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0F' }}>{rev.name}</div>
                  <div style={{ fontFamily: 'var(--br-mono)', fontSize: 11, color: 'rgba(0,0,0,0.40)', marginTop: 2 }}>{rev.meta}</div>
                </div>
                <div style={{ background: 'rgba(34,197,94,0.09)', color: '#16A34A', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.1em', padding: '4px 8px', borderRadius: 999, border: '1px solid rgba(34,197,94,0.18)', flexShrink: 0 }}>
                  ✓ {t.home.reviewVerified}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          08  DELIVERY MAP
          ═══════════════════════════════════════════════════════════════ */}
      <div id="delivery" className="br-home-delivery" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0C0C12', color: '#fff' }}>
        <div className="br-home-delivery-copy" style={{ padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 60px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.18em', color: '#FFD700', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 24, height: 1, background: '#FFD700' }} />{t.home.deliveryLabel}
            </motion.div>
            <motion.h2 variants={fadeUp} className="br-display" style={{ margin: '0 0 16px', fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 0.97, letterSpacing: '-0.03em' }}>
              {t.delivery.title1}<br /><span style={{ color: '#FFD700' }}>{t.delivery.title2}</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ fontSize: 16, color: 'rgba(255,255,255,0.60)', margin: '0 0 32px', maxWidth: 420, lineHeight: 1.6 }}>
              {t.delivery.desc}
            </motion.p>
            <motion.div variants={fadeUp} className="br-home-delivery-zones" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {activeZones.slice(0, 8).map((l) => (
                <div key={l} style={{ padding: '12px 16px', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, fontFamily: 'var(--br-mono)', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{l}</span>
                  <span style={{ color: '#22C55E', fontSize: 10, letterSpacing: '0.1em' }}>{t.home.deliveryFree}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
        <div className="br-home-delivery-map" style={{ position: 'relative', minHeight: 500 }}>
          <iframe
            title={t.home.mapTitle}
            src="https://www.openstreetmap.org/export/embed.html?bbox=114.43%2C-8.95%2C115.72%2C-8.03&layer=mapnik"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, filter: 'grayscale(0.1) saturate(0.92)' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(12,12,18,0.45) 0%, transparent 35%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(12,12,18,0.78)', backdropFilter: 'blur(12px)', color: '#fff', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.16em', color: '#FFD700', marginBottom: 4 }}>{t.home.mapEyebrow}</div>
            <div className="br-display" style={{ fontSize: 16 }}>{t.home.mapRegion}</div>
          </div>
          <div style={{ position: 'absolute', right: 20, bottom: 20, background: 'rgba(12,12,18,0.70)', color: 'rgba(255,255,255,0.6)', padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none' }}>
            <span style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.14em' }}>{t.home.mapDrag}</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          09  FAQ
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(64px, 8vw, 112px) clamp(20px, 5vw, 56px)', background: '#fff' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            style={{ marginBottom: 48 }}
          >
            <motion.div variants={fadeUp} style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.35)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 24, height: 1, background: 'rgba(0,0,0,0.25)' }} />{t.home.faqLabel}
            </motion.div>
            <motion.h2 variants={fadeUp} className="br-display" style={{ margin: 0, fontSize: 'clamp(36px, 5.5vw, 64px)', lineHeight: 0.96, letterSpacing: '-0.035em', color: '#0A0A0F' }}>
              {t.home.faqTitle1}<br />{t.home.faqTitle2}
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.2 }}
          >
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              {faqs.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          10  FINAL CTA — gold section
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FFD700', color: '#0A0A0F', padding: 'clamp(72px, 10vw, 128px) clamp(20px, 5vw, 56px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: -80, right: -60, width: 500, height: 500, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: -100, left: -50, width: 360, height: 360, borderRadius: '50%', background: 'rgba(0,0,0,0.04)', pointerEvents: 'none' }} />

        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.45)', marginBottom: 22 }}>
            {t.cta.eyebrow}
          </div>
          <h2 className="br-display" style={{ fontSize: 'clamp(52px, 10vw, 116px)', lineHeight: 0.91, letterSpacing: '-0.04em', margin: '0 0 22px', color: '#0A0A0F' }}>
            {t.cta.title}
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', maxWidth: 540, margin: '0 auto 48px', lineHeight: 1.55, color: 'rgba(0,0,0,0.60)' }}>
            {t.cta.desc}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a href="/catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#0A0A0F', color: '#FFD700',
              fontFamily: 'var(--br-body)', fontSize: 17, fontWeight: 700,
              padding: '0 44px', height: 68, borderRadius: 999,
              textDecoration: 'none', letterSpacing: '-0.01em',
            }}>
              {t.cta.primary} →
            </a>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#25D366', color: '#fff',
              fontFamily: 'var(--br-body)', fontSize: 17, fontWeight: 600,
              padding: '0 36px', height: 68, borderRadius: 999,
              textDecoration: 'none', letterSpacing: '-0.01em',
            }}>
              💬 {t.home.whatsappUs}
            </a>
          </div>
          <div style={{ fontFamily: 'var(--br-mono)', fontSize: 11, marginTop: 36, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.40)' }}>
            {t.cta.terms}
          </div>
        </motion.div>
      </section>

      <SiteFooter />

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE STICKY CTA — fixed bottom bar
          ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {stickyVisible && (
          <motion.div
            key="sticky"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="br-sticky-mobile-cta"
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
              background: '#0A0A0F',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              padding: '12px 16px 20px',
              display: 'flex', gap: 8,
            }}
          >
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#25D366', color: '#fff',
              fontFamily: 'var(--br-body)', fontSize: 14, fontWeight: 600,
              borderRadius: 12, padding: '13px', textDecoration: 'none',
            }}>
              💬 {t.home.whatsapp}
            </a>
            <a href="/catalog" style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#FFD700', color: '#0A0A0F',
              fontFamily: 'var(--br-body)', fontSize: 15, fontWeight: 700,
              borderRadius: 12, padding: '13px', textDecoration: 'none', letterSpacing: '-0.01em',
            }}>
              {t.home.stickyBookNow} — {t.home.priceFrom.toLowerCase()} ${featured[0]?.price || 8}/{t.common.day} →
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
