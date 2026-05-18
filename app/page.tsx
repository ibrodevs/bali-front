'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BR_LOCATIONS } from '@/lib/data';
import { BRPhoto } from '@/components/BR';
import {
  ArrowRightIcon, CheckIcon,
  ScooterIcon, StarIcon,
  TelegramIcon,
  WeChatIcon,
  WhatsAppIcon,
} from '@/components/Icons';
import ScooterCard from '@/components/ScooterCard';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { mediaUrl } from '@/lib/api';
import { useCurrency } from '@/lib/i18n/CurrencyProvider';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { endpoints } from '@/lib/endpoints';
import {
  DisplayScooter,
  fallbackScooters,
  resolveScooterImage,
  resolveScooterImageObjectPosition,
} from '@/lib/displayScooter';
import { useSiteContentPreview } from '@/lib/siteContentPreview';

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const { marker } = useSiteContentPreview();
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
        <span {...marker('home.faqs')} style={{ fontFamily: 'var(--br-display)', fontSize: 'clamp(15px, 1.8vw, 19px)', fontWeight: 600, letterSpacing: '-0.01em', color: '#0A0A0F', lineHeight: 1.3 }}>{q}</span>
        <span style={{
          width: 32, height: 32, borderRadius: 999, flexShrink: 0,
          background: open ? '#0A0A0F' : 'rgba(0,0,0,0.07)',
          color: open ? '#FFD700' : '#0A0A0F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 220ms var(--br-easing)', fontSize: 20, lineHeight: 1, fontWeight: 300,
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
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p {...marker('home.faqs')} style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.7, color: 'rgba(0,0,0,0.55)', maxWidth: 680, paddingRight: 48 }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const WA_LINK = 'https://wa.me/628135915173?text=Hi%2C%20I%E2%80%99d%20like%20to%20rent%20a%20scooter%20in%20Bali!';

export default function LandingPage() {
  const { t, locale } = useLocale();
  const { marker } = useSiteContentPreview();
  const { convertPrice, symbol } = useCurrency();
  const [featured, setFeatured] = useState<DisplayScooter[]>(fallbackScooters().slice(0, 3));
  const [zones, setZones] = useState<Array<{ id: number; name: string; freeDelivery?: boolean }>>([]);
  const [apiFaqs, setApiFaqs] = useState<Array<{ q: string; a: string }>>([]);
  const [locationSection, setLocationSection] = useState<{
    title1?: string; title2?: string; desc?: string; mapEyebrow?: string; mapRegion?: string;
  } | null>(null);

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
        setZones((bootstrap.deliveryZones || []).map((z) => ({ id: z.id, name: z.name, freeDelivery: z.freeDelivery })));
        const faqData = (bootstrap.content as Record<string, unknown> | undefined);
        const faqItems = (faqData?.home as Record<string, unknown> | undefined)?.faq;
        const items = (faqItems as Record<string, unknown> | undefined)?.items;
        if (Array.isArray(items) && items.length) setApiFaqs(items as Array<{ q: string; a: string }>);
        const ls = (bootstrap as Record<string, unknown>).locationSection;
        if (ls && typeof ls === 'object') setLocationSection(ls as typeof locationSection);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [locale]);

  const activeZones = useMemo(() => {
    const names = zones.map((z) => z.name);
    return names.length ? names : BR_LOCATIONS;
  }, [zones]);

  const faqs = apiFaqs.length ? apiFaqs : t.home.faqs;
  const homeReviews = t.home.reviews;
  const minPrice = featured[0]?.price || 8;
  const minPriceLabel = `${symbol}${(Math.round(convertPrice(minPrice) * 100) / 100).toFixed(2)}`;

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAF5', color: '#0A0A0F', fontFamily: 'var(--br-body)', WebkitFontSmoothing: 'antialiased' }}>
      <SiteHeader transparent />

      {/* ── 01 HERO ─────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 620, overflow: 'hidden' }}>
        <video autoPlay muted loop playsInline aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src={t.media.home.heroVideo} type="video/mp4" />
        </video>

        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.1) 100%)' }} />

        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: 'clamp(16px, 5vw, 56px) clamp(16px, 5vw, 56px) clamp(40px, 7vw, 80px)',
        }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(13px, 1.4vw, 16px)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--br-mono)' }}
          >
            Bali · Scooter Rental
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: 'var(--br-display)',
              fontSize: 'clamp(52px, 9.5vw, 116px)',
              lineHeight: 0.92, letterSpacing: '-0.04em',
              color: '#fff', margin: '0 0 28px', fontWeight: 800,
            }}
          >
            <span {...marker('home.title1')}>{t.home.title1}</span><br />
            <span {...marker('home.title2')} style={{ color: '#FFD700' }}>{t.home.title2}</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
          >
            <a href="/catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: '#FFD700', color: '#0A0A0F',
              fontFamily: 'var(--br-display)', fontSize: 'clamp(16px, 1.6vw, 20px)', fontWeight: 800,
              padding: '0 clamp(24px, 3vw, 36px)', height: 'clamp(58px, 6vw, 68px)', borderRadius: 16,
              textDecoration: 'none', letterSpacing: '-0.02em', whiteSpace: 'nowrap',
              boxShadow: '0 12px 40px -8px rgba(255,215,0,0.55)',
            }}>
              <ScooterIcon size={20} color="#0A0A0F" strokeWidth={2.2} />
              <span {...marker('hero.cta')}>{t.hero.cta}</span>
              <ArrowRightIcon size={17} color="#0A0A0F" strokeWidth={2.5} />
            </a>

            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontFamily: 'var(--br-body)', fontSize: 15, fontWeight: 500,
              textDecoration: 'none', whiteSpace: 'nowrap',
              padding: '0 20px', height: 'clamp(58px, 6vw, 68px)', borderRadius: 16,
            }}>
              <WhatsAppIcon size={18} color="#25D366" />
              WhatsApp
            </a>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                aria-label="Telegram"
                title="Telegram"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 'clamp(58px, 6vw, 68px)', height: 'clamp(58px, 6vw, 68px)',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#2AABEE',
                  cursor: 'default',
                }}
              >
                <TelegramIcon size={22} color="#2AABEE" />
              </button>

              <button
                type="button"
                aria-label="WeChat"
                title="WeChat"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 'clamp(58px, 6vw, 68px)', height: 'clamp(58px, 6vw, 68px)',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#7BB32E',
                  cursor: 'default',
                }}
              >
                <WeChatIcon size={22} color="#7BB32E" />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <StarIcon size={13} color="#FFD700" />
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: 'var(--br-mono)' }}>
              4.97 · 12 000+ riders · <span {...marker('home.priceFrom')}>{t.home.priceFrom}</span> <strong style={{ color: '#FFD700' }}>{minPriceLabel}/<span {...marker('common.day')}>{t.common.day}</span></strong>
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── 02 КАК ЭТО РАБОТАЕТ ─────────────────────────────────────── */}
      <section style={{ padding: 'clamp(52px, 7vw, 96px) clamp(16px, 5vw, 56px)', background: '#fff' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <motion.h2 variants={fadeUp} className="br-display" style={{
            margin: '0 0 12px', fontSize: 'clamp(28px, 5vw, 58px)',
            lineHeight: 0.97, letterSpacing: '-0.035em', color: '#0A0A0F',
          }}>
            <span {...marker('process.title')}>{t.process.title}</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{
            fontSize: 'clamp(14px, 1.4vw, 16px)', color: 'rgba(0,0,0,0.48)',
            margin: '0 auto', lineHeight: 1.55, maxWidth: 400,
          }}>
            <span {...marker('home.subtitle')}>{t.home.subtitle}</span>
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
                fontFamily: 'var(--br-mono)', fontSize: 15, fontWeight: 800, marginBottom: 22,
                boxShadow: i === 0 ? '0 8px 28px -8px rgba(255,215,0,0.7)' : '0 8px 24px -8px rgba(0,0,0,0.42)',
              }}>
                0{i + 1}
              </div>
              <div className="br-display" style={{ fontSize: 'clamp(17px, 1.9vw, 22px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0A0A0F', marginBottom: 10 }}>
                <span {...marker('process.steps')}>{title}</span>
              </div>
              <p {...marker('process.steps')} style={{ fontSize: 'clamp(13px, 1.2vw, 14px)', lineHeight: 1.65, color: 'rgba(0,0,0,0.52)', margin: 0 }}>
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
      </section>

      {/* ── 03 СКУТЕРЫ ──────────────────────────────────────────────── */}
      <section id="fleet" style={{ padding: 'clamp(52px, 7vw, 100px) clamp(16px, 5vw, 56px)', background: '#FAFAF5' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 36 }}
        >
          <motion.div variants={fadeUp}>
            <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(28px, 5.5vw, 64px)', lineHeight: 0.97, letterSpacing: '-0.035em', color: '#0A0A0F' }}>
              <span {...marker('fleet.title')}>{t.fleet.title}</span>
            </h2>
            <p style={{ marginTop: 10, fontSize: 'clamp(13px, 1.3vw, 15px)', color: 'rgba(0,0,0,0.48)', maxWidth: 340, lineHeight: 1.55 }}>
              <span {...marker('home.priceFrom')}>{t.home.priceFrom}</span> {minPriceLabel}/<span {...marker('common.day')}>{t.common.day}</span> · <span {...marker('home.trustBadges')}>{t.home.trustBadges[1]}</span>
            </p>
          </motion.div>
          <motion.div variants={fadeUp}>
            <a href="/catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--br-body)', fontSize: 14, fontWeight: 600,
              color: '#0A0A0F', textDecoration: 'none',
              padding: '11px 20px', border: '1.5px solid rgba(0,0,0,0.14)',
              borderRadius: 999,
            }}>
              <span {...marker('fleet.viewAll')}>{t.fleet.viewAll}</span>
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
          style={{ textAlign: 'center', marginTop: 40 }}
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
            <span {...marker('home.viewFullFleet')}>{t.home.viewFullFleet}</span>
            <ArrowRightIcon size={15} color="#0A0A0F" strokeWidth={2.5} />
          </a>
        </motion.div>
      </section>

      {/* ── 04 ОТЗЫВЫ ───────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(52px, 7vw, 100px) clamp(16px, 5vw, 56px)', background: '#F4F2ED' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ textAlign: 'center', marginBottom: 44 }}
        >
          <motion.h2 variants={fadeUp} className="br-display" style={{
            margin: '0 0 10px', fontSize: 'clamp(28px, 5.5vw, 64px)',
            lineHeight: 0.97, letterSpacing: '-0.035em', color: '#0A0A0F',
          }}>
            <span {...marker('reviews.title')}>{t.reviews.title}</span>
          </motion.h2>
          <motion.p variants={fadeUp} style={{ fontSize: 14, color: 'rgba(0,0,0,0.42)', margin: 0 }}>
            <span {...marker('reviews.verified')}>{t.reviews.verified}</span>
          </motion.p>
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
              style={{
                background: '#fff', borderRadius: 20, padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2vw, 28px)',
                border: '1px solid rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden',
              }}
            >
              <div aria-hidden style={{ position: 'absolute', top: 10, right: 18, fontFamily: 'var(--br-display)', fontSize: 80, lineHeight: 1, color: 'rgba(255,215,0,0.11)', fontWeight: 800, userSelect: 'none', pointerEvents: 'none' }}>"</div>
              <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                {Array.from({ length: 5 }).map((_, si) => <StarIcon key={si} size={13} color="#FFD700" />)}
              </div>
              <p {...marker('home.reviews')} style={{ fontSize: 'clamp(13px, 1.3vw, 16px)', lineHeight: 1.62, color: '#0A0A0F', margin: '0 0 24px', position: 'relative' }}>
                "{rev.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 18, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <BRPhoto tone={rev.tone} style={{ width: 42, height: 42, borderRadius: 999, flexShrink: 0 }} />
                <div>
                  <div {...marker('home.reviews')} style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0F' }}>{rev.name}</div>
                  <div {...marker('home.reviews')} style={{ fontFamily: 'var(--br-mono)', fontSize: 10, color: 'rgba(0,0,0,0.38)', marginTop: 2 }}>{rev.meta}</div>
                </div>
                <div {...marker('home.reviewVerified')} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.09)', color: '#16A34A', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.1em', padding: '5px 9px', borderRadius: 999, border: '1px solid rgba(34,197,94,0.18)', flexShrink: 0 }}>
                  <CheckIcon size={11} color="#16A34A" strokeWidth={2.5} />
                  {t.home.reviewVerified}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── 05 ДОСТАВКА ─────────────────────────────────────────────── */}
      <div id="delivery" className="br-home-delivery" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0C0C12', color: '#fff' }}>
        <div className="br-home-delivery-copy" style={{ padding: 'clamp(40px, 6vw, 80px) clamp(16px, 5vw, 60px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} className="br-display" style={{ margin: '0 0 14px', fontSize: 'clamp(26px, 4.5vw, 56px)', lineHeight: 0.97, letterSpacing: '-0.03em' }}>
              <span {...marker('delivery.title1')}>{locationSection?.title1 || t.delivery.title1}</span><br /><span {...marker('delivery.title2')} style={{ color: '#FFD700' }}>{locationSection?.title2 || t.delivery.title2}</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{ fontSize: 'clamp(13px, 1.3vw, 16px)', color: 'rgba(255,255,255,0.58)', margin: '0 0 28px', maxWidth: 400, lineHeight: 1.6 }}>
              <span {...marker('delivery.desc')}>{locationSection?.desc || t.delivery.desc}</span>
            </motion.p>
            <motion.div variants={fadeUp} className="br-home-delivery-zones" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {activeZones.slice(0, 8).map((l) => (
                <div key={l} style={{ padding: '10px 14px', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, fontFamily: 'var(--br-mono)', fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span>{l}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckIcon size={10} color="#22C55E" strokeWidth={2.5} />
                    <span {...marker('home.deliveryFree')} style={{ color: '#22C55E', fontSize: 10 }}>{t.home.deliveryFree}</span>
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
            <div {...marker('home.mapEyebrow')} style={{ fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.16em', color: '#FFD700', marginBottom: 4, textTransform: 'uppercase' }}>{locationSection?.mapEyebrow || t.home.mapEyebrow}</div>
            <div {...marker('home.mapRegion')} className="br-display" style={{ fontSize: 16 }}>{locationSection?.mapRegion || t.home.mapRegion}</div>
          </div>
        </div>
      </div>

      {/* ── 06 FAQ ──────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(52px, 7vw, 100px) clamp(16px, 5vw, 56px)', background: '#fff' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="br-display"
            style={{ margin: '0 0 40px', fontSize: 'clamp(28px, 5vw, 58px)', lineHeight: 0.97, letterSpacing: '-0.035em', color: '#0A0A0F' }}
          >
            <span {...marker('home.faqTitle1')}>{t.home.faqTitle1}</span><br /><span {...marker('home.faqTitle2')}>{t.home.faqTitle2}</span>
          </motion.h2>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
            <div {...marker('home.faqs')} style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              {faqs.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 07 ФИНАЛЬНЫЙ CTA ────────────────────────────────────────── */}
      <section style={{ background: '#FFD700', color: '#0A0A0F', padding: 'clamp(60px, 9vw, 120px) clamp(16px, 5vw, 56px)', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="br-display" style={{ fontSize: 'clamp(42px, 9vw, 108px)', lineHeight: 0.92, letterSpacing: '-0.04em', margin: '0 0 16px', color: '#0A0A0F' }}>
            <span {...marker('cta.title')}>{t.cta.title}</span>
          </h2>
          <p {...marker('cta.desc')} style={{ fontSize: 'clamp(14px, 1.7vw, 18px)', maxWidth: 440, margin: '0 auto 44px', lineHeight: 1.55, color: 'rgba(0,0,0,0.58)' }}>
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
              <span {...marker('cta.primary')}>{t.cta.primary}</span>
              <ArrowRightIcon size={15} color="#FFD700" strokeWidth={2.5} />
            </a>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#25D366', color: '#fff',
              fontFamily: 'var(--br-body)', fontSize: 'clamp(14px, 1.4vw, 16px)', fontWeight: 700,
              padding: '0 clamp(20px, 3vw, 32px)', height: 'clamp(58px, 6.5vw, 70px)', borderRadius: 999,
              textDecoration: 'none',
            }}>
              <WhatsAppIcon size={17} color="#fff" />
              <span {...marker('home.whatsappUs')}>{t.home.whatsappUs}</span>
            </a>
          </div>
          <p style={{ fontFamily: 'var(--br-mono)', fontSize: 10, marginTop: 28, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.40)', textTransform: 'uppercase' }}>
            <span {...marker('cta.terms')}>{t.cta.terms}</span>
          </p>
        </motion.div>
      </section>

      <SiteFooter />

      {/* ── МОБИЛЬНАЯ STICKY CTA ─────────────────────────────────────── */}
      <div className="br-sticky-mobile-cta" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(10,10,15,0.97)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.09)',
        padding: '10px 14px calc(10px + env(safe-area-inset-bottom))',
        display: 'none', gap: 10, alignItems: 'center',
      }}>
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
          flexShrink: 0, width: 52, height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#25D366', borderRadius: 12, textDecoration: 'none',
        }}>
          <WhatsAppIcon size={22} color="#fff" />
        </a>
        <a href="/catalog" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#FFD700', color: '#0A0A0F',
          fontFamily: 'var(--br-display)', fontSize: 16, fontWeight: 800,
          borderRadius: 12, height: 52, textDecoration: 'none', letterSpacing: '-0.02em',
        }}>
          <ScooterIcon size={18} color="#0A0A0F" strokeWidth={2} />
          {t.hero.cta}
        </a>
      </div>
    </div>
  );
}
