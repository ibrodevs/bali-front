'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BR_LOCATIONS } from '@/lib/data';
import { BRPhoto } from '@/components/BR';
import {
  ArrowRightIcon, CheckIcon,
  DeliveryIcon, LightningIcon,
  PriceTagIcon, ScooterIcon, StarIcon, SupportIcon,
  UsersIcon, WhatsAppIcon,
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
        <span style={{ fontFamily: 'var(--br-display)', fontSize: 'clamp(15px, 1.8vw, 19px)', fontWeight: 600, letterSpacing: '-0.01em', color: '#0A0A0F', lineHeight: 1.3 }}>{q}</span>
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
            <p style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.7, color: 'rgba(0,0,0,0.55)', maxWidth: 680, paddingRight: 48 }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const WA_LINK = 'https://wa.me/6281234567890?text=Hi%2C%20I%E2%80%99d%20like%20to%20rent%20a%20scooter%20in%20Bali!';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const { t, locale, tr } = useLocale();
  const [featured, setFeatured] = useState<DisplayScooter[]>(fallbackScooters().slice(0, 3));
  const [addonCards, setAddonCards] = useState<Array<{ id: number; name: string; description?: string; priceUSD?: number; icon?: string }>>([]);
  const [zones, setZones] = useState<Array<{ id: number; name: string; freeDelivery?: boolean }>>([]);
  const [apiFaqs, setApiFaqs] = useState<Array<{ q: string; a: string }>>([]);
  const whyIcons = [DeliveryIcon, PriceTagIcon, LightningIcon, SupportIcon] as const;

  const statsRef = useRef<HTMLDivElement>(null);
  const [statsRevealed, setStatsRevealed] = useState(false);

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
    let cancelled = false;
    endpoints.bootstrap(locale)
      .then((bootstrap) => {
        if (cancelled) return;
        const nextFeatured = (bootstrap.fleet?.featured || []).map((item) => ({
          id: item.slug, apiId: item.id, name: item.name,
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
        setZones((bootstrap.deliveryZones || []).map((z) => ({ id: z.id, name: z.name, freeDelivery: z.freeDelivery })));
        const faqData = (bootstrap.content as Record<string, unknown> | undefined);
        const faqItems = (faqData?.home as Record<string, unknown> | undefined)?.faq;
        const items = (faqItems as Record<string, unknown> | undefined)?.items;
        if (Array.isArray(items) && items.length) setApiFaqs(items as Array<{ q: string; a: string }>);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [locale]);

  const activeZones = useMemo(() => {
    const names = zones.map((z) => z.name);
    return names.length ? names : BR_LOCATIONS;
  }, [zones]);

  const addons = addonCards.length ? addonCards : [
    { id: 1, icon: 'shield', name: t.home.addonsFallback[0].name, priceUSD: 5, description: t.home.addonsFallback[0].description },
    { id: 2, icon: 'wifi',   name: t.home.addonsFallback[1].name, priceUSD: 4, description: t.home.addonsFallback[1].description },
    { id: 3, icon: 'helmet', name: t.home.addonsFallback[2].name, priceUSD: 2, description: t.home.addonsFallback[2].description },
    { id: 4, icon: 'phone',  name: t.home.addonsFallback[3].name, priceUSD: 2, description: t.home.addonsFallback[3].description },
  ];

  const faqs = apiFaqs.length ? apiFaqs : t.home.faqs;
  const homeReviews = t.home.reviews;
  const minPrice = featured[0]?.price || 8;

  return (
    <div style={{ width: '100%', background: '#FAFAF5', color: '#0A0A0F', fontFamily: 'var(--br-body)', WebkitFontSmoothing: 'antialiased' }}>
      <SiteHeader transparent />

      {/* ═══════════════════════════════════════════════════════════════
          01  HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 620, overflow: 'hidden' }}>

        <video autoPlay muted loop playsInline aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Один градиент снизу — чисто и ясно */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15) 100%)' }} />

        {/* Контент прибит к низу */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: 'clamp(16px, 5vw, 56px) clamp(16px, 5vw, 56px) clamp(40px, 7vw, 80px)',
        }}>

          {/* Заголовок */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: 'var(--br-display)',
              fontSize: 'clamp(54px, 10vw, 124px)',
              lineHeight: 0.9, letterSpacing: '-0.04em',
              color: '#fff', margin: '0 0 20px', fontWeight: 800,
            }}
          >
            {t.home.title1}<br />
            <span style={{ color: '#FFD700' }}>{t.home.title2}</span>
          </motion.h1>

          {/* Цена + кнопка в одну строку */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="br-hero-bottom-row"
            style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
          >
            {/* Цена — просто и крупно */}
            <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 'clamp(15px, 1.6vw, 18px)', lineHeight: 1.4 }}>
              {t.home.subtitle}<br />
              <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 'clamp(17px, 1.8vw, 20px)' }}>
                {t.home.priceFrom} ${minPrice}/{t.common.day}
              </span>
            </div>

            {/* Разделитель */}
            <div className="br-hero-divider" style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.2)' }} />

            {/* Главная CTA */}
            <a href="/catalog" className="br-hero-primary-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: '#FFD700', color: '#0A0A0F',
              fontFamily: 'var(--br-display)', fontSize: 'clamp(16px, 1.6vw, 20px)', fontWeight: 800,
              padding: '0 clamp(24px, 3vw, 36px)', height: 'clamp(58px, 6vw, 68px)', borderRadius: 16,
              textDecoration: 'none', letterSpacing: '-0.02em', whiteSpace: 'nowrap',
              boxShadow: '0 12px 40px -8px rgba(255,215,0,0.6)',
              transition: 'transform 200ms, box-shadow 200ms',
            }}>
              <ScooterIcon size={20} color="#0A0A0F" strokeWidth={2.2} />
              {t.hero.cta}
              <ArrowRightIcon size={17} color="#0A0A0F" strokeWidth={2.5} />
            </a>

            {/* WhatsApp — вторичная */}
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="br-hero-wa-btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--br-body)', fontSize: 15, fontWeight: 500,
              textDecoration: 'none', whiteSpace: 'nowrap',
              transition: 'color 200ms',
            }}>
              <WhatsAppIcon size={18} color="#25D366" />
              WhatsApp
            </a>
          </motion.div>

          {/* Три факта — минимально */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{ display: 'flex', gap: 20, marginTop: 22, flexWrap: 'wrap' }}
          >
            {[
              { icon: <StarIcon size={12} color="#FFD700" />, text: '4.97 · 12k riders' },
              { icon: <DeliveryIcon size={12} color="rgba(255,255,255,0.45)" />, text: t.home.trustBadges[0] },
              { icon: <CheckIcon size={12} color="rgba(255,255,255,0.45)" strokeWidth={2.5} />, text: t.home.trustBadges[1] },
            ].map(({ icon, text }, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                {icon}{text}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          02  КАК ЭТО РАБОТАЕТ — 3 шага
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(52px, 7vw, 96px) clamp(16px, 5vw, 56px)', background: '#fff' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          style={{ marginBottom: 48, textAlign: 'center' }}
        >
          <motion.div variants={fadeUp} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18,
            background: '#FFD700', color: '#0A0A0F',
            borderRadius: 999, padding: '7px 18px',
            fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.16em', fontWeight: 700,
          }}>
            {t.home.processLabel}
          </motion.div>
          <motion.h2 variants={fadeUp} className="br-display" style={{
            margin: 0, fontSize: 'clamp(30px, 5vw, 62px)',
            lineHeight: 0.97, letterSpacing: '-0.035em', color: '#0A0A0F',
          }}>
            {t.process.title}
          </motion.h2>
          <motion.p variants={fadeUp} style={{
            marginTop: 14, fontSize: 'clamp(14px, 1.4vw, 16px)',
            color: 'rgba(0,0,0,0.48)', margin: '14px auto 0', lineHeight: 1.55, maxWidth: 440,
          }}>
            Всё просто — от выбора до поездки за несколько минут
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="br-home-process-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, position: 'relative' }}
        >
          <div aria-hidden className="br-process-connector" style={{
            position: 'absolute', top: 43, left: '18%', right: '18%', height: 2,
            background: 'linear-gradient(90deg, #FFD700 0%, rgba(255,215,0,0.12) 100%)', zIndex: 0,
          }} />

          {(t.process.steps as [string, string][]).map(([title, desc], i) => (
            <motion.div key={i} variants={fadeUp} style={{
              position: 'relative', zIndex: 1,
              padding: 'clamp(24px, 3vw, 38px) clamp(18px, 2.5vw, 30px)',
              background: i === 0
                ? 'linear-gradient(145deg, rgba(255,215,0,0.09) 0%, rgba(255,215,0,0.02) 100%)'
                : '#FAFAF5',
              border: i === 0 ? '2px solid rgba(255,215,0,0.45)' : '1.5px solid rgba(0,0,0,0.07)',
              borderRadius: 24,
              boxShadow: i === 0 ? '0 16px 48px -20px rgba(255,215,0,0.22)' : '0 8px 28px -14px rgba(0,0,0,0.07)',
            }}>
              <div style={{
                width: 54, height: 54, borderRadius: '50%',
                background: i === 0 ? '#FFD700' : '#0A0A0F',
                color: i === 0 ? '#0A0A0F' : '#FFD700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--br-mono)', fontSize: 15, fontWeight: 800,
                marginBottom: 22,
                boxShadow: i === 0 ? '0 8px 28px -8px rgba(255,215,0,0.7)' : '0 8px 24px -8px rgba(0,0,0,0.42)',
              }}>
                0{i + 1}
              </div>
              <div className="br-display" style={{ fontSize: 'clamp(17px, 1.9vw, 22px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0A0A0F', marginBottom: 10 }}>
                {title}
              </div>
              <p style={{ fontSize: 'clamp(13px, 1.2vw, 14px)', lineHeight: 1.65, color: 'rgba(0,0,0,0.52)', margin: 0 }}>
                {desc}
              </p>
              {i < 2 && (
                <div className="br-process-step-arrow" style={{
                  position: 'absolute', right: -19, top: '50%', transform: 'translateY(-50%)',
                  width: 38, height: 38, borderRadius: '50%',
                  background: '#FFD700', color: '#0A0A0F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2, boxShadow: '0 4px 14px -4px rgba(255,215,0,0.55)',
                }}>
                  <ArrowRightIcon size={16} color="#0A0A0F" strokeWidth={2.5} />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.6 }}
          style={{ textAlign: 'center', marginTop: 44 }}
        >
          <a href="/catalog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            background: '#0A0A0F', color: '#FFD700',
            fontFamily: 'var(--br-display)', fontSize: 'clamp(14px, 1.4vw, 17px)', fontWeight: 700,
            padding: '0 clamp(28px, 4vw, 44px)', height: 'clamp(54px, 5.5vw, 64px)', borderRadius: 999,
            textDecoration: 'none', letterSpacing: '-0.02em',
            boxShadow: '0 14px 44px -14px rgba(0,0,0,0.38)',
          }}>
            <ScooterIcon size={18} color="#FFD700" strokeWidth={2} />
            Начать — выбрать скутер
            <ArrowRightIcon size={16} color="#FFD700" strokeWidth={2.5} />
          </a>
          <p style={{ marginTop: 14, fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.16em', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase' }}>
            Без регистрации · Ответим за 5 минут · Доставка в отель
          </p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          03  STATS
          ═══════════════════════════════════════════════════════════════ */}
      <div ref={statsRef} className="br-home-stats" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        background: '#0A0A0F', borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {([
          { n: `${count340}+`, l: t.stats.fleet,   Icon: ScooterIcon },
          { n: `${count12}k`,  l: t.stats.riders,  Icon: UsersIcon },
          { n: count497.toFixed(2), l: t.stats.rating, Icon: StarIcon },
          { n: '24/7',         l: t.stats.support, Icon: SupportIcon },
        ]).map(({ n, l, Icon }, i) => (
          <div key={i} style={{
            padding: 'clamp(20px, 3.5vw, 40px) clamp(12px, 2vw, 32px)',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <Icon size={22} color="rgba(255,215,0,0.5)" strokeWidth={1.6} />
            </div>
            <div className="br-display" style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', lineHeight: 1, letterSpacing: '-0.04em', color: '#FFD700' }}>{n}</div>
            <div style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.32)', marginTop: 6, textTransform: 'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          04  FLEET
          ═══════════════════════════════════════════════════════════════ */}
      <section id="fleet" style={{ padding: 'clamp(52px, 7vw, 100px) clamp(16px, 5vw, 56px)', background: '#FAFAF5' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 40 }}
        >
          <motion.div variants={fadeUp}>
            <div style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.32)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
              <span style={{ width: 20, height: 1, background: 'rgba(0,0,0,0.22)' }} />01 / Fleet
            </div>
            <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(30px, 5.5vw, 68px)', lineHeight: 0.97, letterSpacing: '-0.035em', color: '#0A0A0F' }}>
              {t.fleet.title}
            </h2>
            <p style={{ marginTop: 12, fontSize: 'clamp(13px, 1.3vw, 15px)', color: 'rgba(0,0,0,0.48)', maxWidth: 340, lineHeight: 1.55 }}>
              Выбери модель и нажми «Забронировать»
            </p>
          </motion.div>
          <motion.div variants={fadeUp}>
            <a href="/catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--br-body)', fontSize: 14, fontWeight: 600,
              color: '#0A0A0F', textDecoration: 'none',
              padding: '11px 20px', border: '1.5px solid rgba(0,0,0,0.14)',
              borderRadius: 999, transition: 'background 200ms, border-color 200ms',
            }}>
              {t.fleet.viewAll}
              <ArrowRightIcon size={14} color="#0A0A0F" strokeWidth={2.5} />
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="br-home-fleet-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}
        >
          {featured.slice(0, 3).map((s) => (
            <motion.div key={s.id} variants={fadeUp}>
              <ScooterCard s={s} large />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.3 }}
          style={{ textAlign: 'center', marginTop: 44 }}
        >
          <a href="/catalog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            background: '#FFD700', color: '#0A0A0F',
            fontFamily: 'var(--br-display)', fontSize: 'clamp(14px, 1.4vw, 17px)', fontWeight: 800,
            padding: '0 clamp(28px, 4vw, 44px)', height: 'clamp(54px, 5.5vw, 64px)', borderRadius: 999,
            textDecoration: 'none', letterSpacing: '-0.02em',
            boxShadow: '0 12px 36px -12px rgba(255,215,0,0.5)',
          }}>
            <ScooterIcon size={18} color="#0A0A0F" strokeWidth={2} />
            {t.home.viewFullFleet} — {t.home.priceFrom.toLowerCase()} ${minPrice}/{t.common.day}
            <ArrowRightIcon size={15} color="#0A0A0F" strokeWidth={2.5} />
          </a>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          05  WHY CHOOSE US
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(52px, 7vw, 100px) clamp(16px, 5vw, 56px)', background: '#0C0C12', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: -80, right: -80, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ marginBottom: 48, position: 'relative' }}
        >
          <motion.div variants={fadeUp} style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.18em', color: '#FFD700', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
            <span style={{ width: 20, height: 1, background: '#FFD700' }} />{t.home.whyLabel}
          </motion.div>
          <motion.h2 variants={fadeUp} className="br-display" style={{ margin: 0, fontSize: 'clamp(30px, 5.5vw, 68px)', lineHeight: 0.97, letterSpacing: '-0.035em' }}>
            {t.why.title}
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="br-home-why-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}
        >
          {(t.why.items as [string, string][]).map(([title, desc], k) => {
            const Icon = whyIcons[k] || SupportIcon;
            return (
              <motion.div key={k} variants={fadeUp}
                whileHover={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,215,0,0.28)' }}
                style={{
                  position: 'relative', padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2vw, 24px)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 20, overflow: 'hidden',
                  transition: 'background 300ms, border-color 300ms',
                }}
              >
                <div style={{ position: 'absolute', top: 16, right: 16, fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.12)' }}>0{k + 1}</div>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.22)',
                  marginBottom: 20,
                }}>
                  <Icon size={22} color="#FFD700" />
                </div>
                <div className="br-display" style={{ fontSize: 'clamp(16px, 1.7vw, 21px)', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 10 }}>{title}</div>
                <p style={{ fontSize: 'clamp(12px, 1.1vw, 14px)', lineHeight: 1.65, color: 'rgba(255,255,255,0.46)', margin: '0 0 18px' }}>{desc}</p>
                <div style={{ height: 2, width: 24, background: '#FFD700', borderRadius: 1 }} />
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          06  ADD-ONS
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(52px, 7vw, 96px) clamp(16px, 5vw, 56px)', background: '#FAFAF5' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 40 }}
        >
          <motion.div variants={fadeUp}>
            <div style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.32)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
              <span style={{ width: 20, height: 1, background: 'rgba(0,0,0,0.22)' }} />{t.home.addonsLabel}
            </div>
            <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(30px, 5.5vw, 68px)', lineHeight: 0.97, letterSpacing: '-0.035em', color: '#0A0A0F' }}>
              {t.addons.title}
            </h2>
          </motion.div>
          <motion.div variants={fadeUp}>
            <span style={{ fontFamily: 'var(--br-mono)', fontSize: 10, color: 'rgba(0,0,0,0.42)', letterSpacing: '0.14em', padding: '10px 16px', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 999 }}>
              {t.addons.note}
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="br-home-addons-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}
        >
          {addons.slice(0, 4).map((item) => (
            <motion.div key={item.id} variants={fadeUp}
              whileHover={{ y: -5, boxShadow: '0 20px 48px -16px rgba(0,0,0,0.12)' }}
              style={{
                padding: 'clamp(20px, 2.5vw, 28px) clamp(16px, 2vw, 24px)',
                background: '#fff', borderRadius: 20,
                border: '1px solid rgba(0,0,0,0.07)',
                transition: 'box-shadow 300ms, transform 300ms',
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.28)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {renderAddonIcon(item.name, item.icon, { size: 22, color: '#0A0A0F' })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18, gap: 8 }}>
                <span className="br-display" style={{ fontSize: 'clamp(15px, 1.5vw, 19px)', letterSpacing: '-0.02em', color: '#0A0A0F' }}>{item.name}</span>
                <span style={{ fontFamily: 'var(--br-mono)', fontSize: 11, fontWeight: 700, color: '#0A0A0F', background: '#FFD700', padding: '4px 8px', borderRadius: 6, flexShrink: 0 }}>+${item.priceUSD || 0}/d</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.48)', marginTop: 10, marginBottom: 0, lineHeight: 1.6 }}>{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          07  REVIEWS
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(52px, 7vw, 100px) clamp(16px, 5vw, 56px)', background: '#F4F2ED' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 44 }}
        >
          <motion.div variants={fadeUp}>
            <div style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.32)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
              <span style={{ width: 20, height: 1, background: 'rgba(0,0,0,0.22)' }} />Reviews
            </div>
            <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(30px, 5.5vw, 68px)', lineHeight: 0.97, letterSpacing: '-0.035em', color: '#0A0A0F' }}>
              {t.reviews.title}
            </h2>
          </motion.div>
          <motion.div variants={fadeUp} style={{ fontFamily: 'var(--br-mono)', fontSize: 10, color: 'rgba(0,0,0,0.38)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {t.reviews.verified}
          </motion.div>
        </motion.div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="br-home-reviews-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}
        >
          {([
            { ...homeReviews[0], tone: 'sand' as const },
            { ...homeReviews[1], tone: 'sunset' as const },
            { ...homeReviews[2], tone: 'mist' as const },
          ]).map((rev, i) => (
            <motion.div key={i} variants={fadeUp}
              whileHover={{ y: -4, boxShadow: '0 24px 48px -16px rgba(0,0,0,0.10)' }}
              style={{
                background: '#fff', borderRadius: 20, padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2vw, 28px)',
                border: '1px solid rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
                transition: 'box-shadow 300ms, transform 300ms',
              }}
            >
              <div aria-hidden style={{ position: 'absolute', top: 10, right: 18, fontFamily: 'var(--br-display)', fontSize: 80, lineHeight: 1, color: 'rgba(255,215,0,0.11)', fontWeight: 800, userSelect: 'none', pointerEvents: 'none' }}>"</div>
              <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                {Array.from({ length: 5 }).map((_, si) => <StarIcon key={si} size={13} color="#FFD700" />)}
              </div>
              <p style={{ fontSize: 'clamp(13px, 1.3vw, 16px)', lineHeight: 1.62, color: '#0A0A0F', margin: '0 0 24px', position: 'relative' }}>
                "{rev.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 18, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <BRPhoto tone={rev.tone} style={{ width: 42, height: 42, borderRadius: 999, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0F' }}>{rev.name}</div>
                  <div style={{ fontFamily: 'var(--br-mono)', fontSize: 10, color: 'rgba(0,0,0,0.38)', marginTop: 2 }}>{rev.meta}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.09)', color: '#16A34A', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.1em', padding: '5px 9px', borderRadius: 999, border: '1px solid rgba(34,197,94,0.18)', flexShrink: 0 }}>
                  <CheckIcon size={11} color="#16A34A" strokeWidth={2.5} />
                  {t.home.reviewVerified}
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
        <div className="br-home-delivery-copy" style={{ padding: 'clamp(40px, 6vw, 80px) clamp(16px, 5vw, 60px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeUp} style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.18em', color: '#FFD700', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
              <span style={{ width: 20, height: 1, background: '#FFD700' }} />{t.home.deliveryLabel}
            </motion.div>
            <motion.h2 variants={fadeUp} className="br-display" style={{ margin: '0 0 14px', fontSize: 'clamp(26px, 4.5vw, 56px)', lineHeight: 0.97, letterSpacing: '-0.03em' }}>
              {t.delivery.title1}<br /><span style={{ color: '#FFD700' }}>{t.delivery.title2}</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ fontSize: 'clamp(13px, 1.3vw, 16px)', color: 'rgba(255,255,255,0.58)', margin: '0 0 28px', maxWidth: 400, lineHeight: 1.6 }}>
              {t.delivery.desc}
            </motion.p>
            <motion.div variants={fadeUp} className="br-home-delivery-zones" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {activeZones.slice(0, 8).map((l) => (
                <div key={l} style={{ padding: '10px 14px', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, fontFamily: 'var(--br-mono)', fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span>{l}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckIcon size={10} color="#22C55E" strokeWidth={2.5} />
                    <span style={{ color: '#22C55E', fontSize: 10, letterSpacing: '0.08em' }}>{t.home.deliveryFree}</span>
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
        <div className="br-home-delivery-map" style={{ position: 'relative', minHeight: 460 }}>
          <iframe
            title={t.home.mapTitle}
            src="https://www.openstreetmap.org/export/embed.html?bbox=114.43%2C-8.95%2C115.72%2C-8.03&layer=mapnik"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(12,12,18,0.42) 0%, transparent 35%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 18, left: 18, background: 'rgba(12,12,18,0.82)', backdropFilter: 'blur(12px)', color: '#fff', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.16em', color: '#FFD700', marginBottom: 4, textTransform: 'uppercase' }}>{t.home.mapEyebrow}</div>
            <div className="br-display" style={{ fontSize: 16 }}>{t.home.mapRegion}</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          09  FAQ
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(52px, 7vw, 100px) clamp(16px, 5vw, 56px)', background: '#fff' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            style={{ marginBottom: 40 }}
          >
            <motion.div variants={fadeUp} style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.32)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
              <span style={{ width: 20, height: 1, background: 'rgba(0,0,0,0.22)' }} />{t.home.faqLabel}
            </motion.div>
            <motion.h2 variants={fadeUp} className="br-display" style={{ margin: 0, fontSize: 'clamp(28px, 5vw, 60px)', lineHeight: 0.97, letterSpacing: '-0.035em', color: '#0A0A0F' }}>
              {t.home.faqTitle1}<br />{t.home.faqTitle2}
            </motion.h2>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              {faqs.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          10  FINAL CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FFD700', color: '#0A0A0F', padding: 'clamp(60px, 9vw, 120px) clamp(16px, 5vw, 56px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: -80, right: -60, width: 460, height: 460, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: -100, left: -50, width: 340, height: 340, borderRadius: '50%', background: 'rgba(0,0,0,0.04)', pointerEvents: 'none' }} />

        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.48)', marginBottom: 20, textTransform: 'uppercase' }}>
            {t.cta.eyebrow}
          </div>
          <h2 className="br-display" style={{ fontSize: 'clamp(42px, 9vw, 108px)', lineHeight: 0.92, letterSpacing: '-0.04em', margin: '0 0 18px', color: '#0A0A0F' }}>
            {t.cta.title}
          </h2>
          <p style={{ fontSize: 'clamp(14px, 1.7vw, 18px)', maxWidth: 480, margin: '0 auto 44px', lineHeight: 1.55, color: 'rgba(0,0,0,0.58)' }}>
            {t.cta.desc}
          </p>
          <div className="br-cta-btns" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a href="/catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: '#0A0A0F', color: '#FFD700',
              fontFamily: 'var(--br-display)', fontSize: 'clamp(15px, 1.5vw, 18px)', fontWeight: 800,
              padding: '0 clamp(26px, 4vw, 44px)', height: 'clamp(58px, 6.5vw, 70px)', borderRadius: 999,
              textDecoration: 'none', letterSpacing: '-0.02em',
              boxShadow: '0 16px 48px -16px rgba(0,0,0,0.42)',
            }}>
              <ScooterIcon size={18} color="#FFD700" strokeWidth={2} />
              {t.cta.primary}
              <ArrowRightIcon size={15} color="#FFD700" strokeWidth={2.5} />
            </a>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#25D366', color: '#fff',
              fontFamily: 'var(--br-body)', fontSize: 'clamp(14px, 1.4vw, 16px)', fontWeight: 700,
              padding: '0 clamp(20px, 3vw, 32px)', height: 'clamp(58px, 6.5vw, 70px)', borderRadius: 999,
              textDecoration: 'none', letterSpacing: '-0.01em',
            }}>
              <WhatsAppIcon size={17} color="#fff" />
              {t.home.whatsappUs}
            </a>
          </div>
          <div style={{ fontFamily: 'var(--br-mono)', fontSize: 10, marginTop: 32, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.40)', textTransform: 'uppercase' }}>
            {t.cta.terms}
          </div>
        </motion.div>
      </section>

      <SiteFooter />

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE STICKY CTA
          ═══════════════════════════════════════════════════════════════ */}
      <div className="br-sticky-mobile-cta" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(10,10,15,0.97)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.09)',
        padding: '10px 14px calc(10px + env(safe-area-inset-bottom))',
        display: 'none', gap: 10, alignItems: 'center',
      }}>
        {/* WhatsApp — квадратная иконка-кнопка */}
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
          flexShrink: 0,
          width: 52, height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#25D366', borderRadius: 12, textDecoration: 'none',
        }}>
          <WhatsAppIcon size={22} color="#fff" />
        </a>

        {/* Основная CTA — занимает всё оставшееся место */}
        <a href="/catalog" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#FFD700', color: '#0A0A0F',
          fontFamily: 'var(--br-display)', fontSize: 16, fontWeight: 800,
          borderRadius: 12, height: 52, textDecoration: 'none', letterSpacing: '-0.02em',
          minWidth: 0,
        }}>
          <ScooterIcon size={18} color="#0A0A0F" strokeWidth={2} />
          Выбрать скутер
          <ArrowRightIcon size={15} color="#0A0A0F" strokeWidth={2.5} />
        </a>
      </div>
    </div>
  );
}
