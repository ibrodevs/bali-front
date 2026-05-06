'use client';
import { useEffect, useMemo, useState } from 'react';
import { BR_LOCATIONS } from '@/lib/data';
import { BRPhoto, BRPrimary, BRSecondary, BROutline, BREyebrow, BRPrice, BRSection } from '@/components/BR';
import {
  CheckIcon,
  DeliveryIcon,
  HelmetIcon,
  LightningIcon,
  PhoneIcon,
  PriceTagIcon,
  ShieldIcon,
  StarIcon,
  SupportIcon,
  WifiIcon,
  renderAddonIcon,
  stripLeadingSymbol,
} from '@/components/Icons';
import ScooterCard from '@/components/ScooterCard';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { mediaUrl } from '@/lib/api';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { endpoints } from '@/lib/endpoints';
import { DisplayScooter, fallbackScooters, resolveScooterImage, resolveScooterImageObjectPosition } from '@/lib/displayScooter';

export default function LandingPage() {
  const { t, locale, tr } = useLocale();
  const dark = false;
  const bg = '#fff';
  const fg = '#000';
  const sub = 'rgba(0,0,0,0.6)';
  const border = 'rgba(0,0,0,0.1)';
  const [pickup] = useState('Canggu');
  const [start] = useState('Aug 14');
  const [end] = useState('Aug 21');
  const [featured, setFeatured] = useState<DisplayScooter[]>(fallbackScooters().slice(0, 3));
  const [addonCards, setAddonCards] = useState<Array<{ id: number; name: string; description?: string; priceUSD?: number; icon?: string }>>([]);
  const [zones, setZones] = useState<Array<{ id: number; name: string; freeDelivery?: boolean }>>([]);
  const whyIcons = [DeliveryIcon, PriceTagIcon, LightningIcon, SupportIcon] as const;

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
          range: 0,
          top: 0,
          weight: 0,
          imageUrl: item.mainImage ? mediaUrl(item.mainImage) : (resolveScooterImage(item.slug, item.name) || undefined),
          imageObjectPosition: resolveScooterImageObjectPosition(item.slug, item.name),
        }));
        if (nextFeatured.length) setFeatured(nextFeatured);
        setAddonCards(bootstrap.addons || []);
        setZones((bootstrap.deliveryZones || []).map((zone) => ({ id: zone.id, name: zone.name, freeDelivery: zone.freeDelivery })));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const activeZones = useMemo(() => {
    const zoneNames = zones.map((zone) => zone.name);
    return zoneNames.length ? zoneNames : BR_LOCATIONS;
  }, [zones]);

  return (
    <div style={{ width: '100%', background: bg, color: fg, fontFamily: 'var(--br-body)' }}>
      <SiteHeader dark={dark} />

      <div className="br-hero" style={{ position: 'relative', minHeight: 720, overflow: 'hidden' }}>
        <video
          className="br-hero-video"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="br-hero-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.6) 100%)' }} />

        <div className="br-hero-inner" style={{ position: 'relative', zIndex: 1, minHeight: 720, padding: '32px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 40 }}>
          <div className="br-hero-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div className="br-hero-meta-left" style={{ color: '#fff' }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.16em', opacity: 0.7 }}>EST. 2019 · LICENSED · INSURED</div>
            </div>
            <div className="br-hero-meta-right" style={{ color: '#fff', textAlign: 'right' }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.16em', opacity: 0.7 }}>N 8°30&apos;21&quot; · E 115°15&apos;10&quot;</div>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.16em', opacity: 0.7, marginTop: 4 }}>27°C · TRADE WINDS · 12 KM/H</div>
            </div>
          </div>

          <div className="br-hero-bottom" style={{ display: 'grid', gap: 32, marginTop: 'auto' }}>
            <div className="br-hero-copy" style={{ color: '#fff', maxWidth: 1100 }}>
              <div className="br-mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: '#FFD700', marginBottom: 24 }}>{t.hero.eyebrow}</div>
              <h1 className="br-display" style={{ fontSize: 'clamp(56px, 10vw, 132px)', lineHeight: 0.92, margin: 0, letterSpacing: '-0.04em', fontWeight: 700 }}>
                {t.hero.title1}<br />
                {t.hero.title2} <span style={{ background: '#FFD700', color: '#000', padding: '0 14px', display: 'inline-block', transform: 'skewX(-4deg)' }}>{t.hero.title3}</span>
              </h1>
            </div>

            <div className="br-hero-search-wrap">
              <div className="br-hero-search" style={{ background: '#fff', borderRadius: 16, padding: 18, display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr auto', gap: 1, alignItems: 'center', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)' }}>
                {[
                  { k: t.hero.pickup, v: pickup, sub: t.hero.locations },
                  { k: t.hero.pickupDate, v: start, sub: '08:00' },
                  { k: t.hero.returnDate, v: end, sub: '20:00' },
                  { k: t.hero.model, v: featured[0]?.type || 'Touring', sub: tr(t.hero.available, { n: featured.length || 3 }) },
                ].map((f, i) => (
                  <div key={i} className="br-hero-search-field" style={{ padding: '10px 22px', borderRight: i < 3 ? '1px solid #eee' : 'none' }}>
                    <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: '#888' }}>{f.k}</div>
                    <div className="br-display" style={{ fontSize: 22, lineHeight: 1.1, marginTop: 4 }}>{f.v}</div>
                    <div className="br-mono" style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{f.sub}</div>
                  </div>
                ))}
                <div className="br-hero-search-action" style={{ paddingLeft: 18 }}>
                  <BRPrimary href="/catalog" style={{ height: 80, padding: '0 32px', fontSize: 16 }}>
                    {t.hero.cta} <span style={{ fontSize: 18 }}>→</span>
                  </BRPrimary>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="br-home-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `1px solid ${border}`, background: bg }}>
        {([['340+', t.stats.fleet], ['12k', t.stats.riders], ['4.97', t.stats.rating], ['24/7', t.stats.support]] as const).map(([n, l], i) => (
          <div key={i} style={{ padding: '36px 40px', borderRight: i < 3 ? `1px solid ${border}` : 'none' }}>
            <div className="br-display" style={{ fontSize: 56, lineHeight: 1, letterSpacing: '-0.03em' }}>{n}</div>
            <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: sub, marginTop: 8, textTransform: 'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* 01 — FLEET */}
      <section className="br-section br-fleet-section" style={{ padding: '96px 48px 88px', background: bg, color: fg, position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden className="br-fleet-bgnum" style={{ position: 'absolute', top: -40, right: -20, fontFamily: 'var(--br-display)', fontSize: 'clamp(220px, 28vw, 420px)', lineHeight: 0.8, fontWeight: 800, letterSpacing: '-0.06em', color: 'rgba(0,0,0,0.04)', pointerEvents: 'none', userSelect: 'none' }}>01</div>
        <div className="br-fleet-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 44, position: 'relative' }}>
          <div style={{ maxWidth: 760 }}>
            <div className="br-mono br-fleet-stepper" style={{ fontSize: 11, letterSpacing: '0.18em', color: sub, marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 28, height: 1, background: '#000' }} />
              <span>01 / 06</span>
              <span>·</span>
              <span style={{ color: '#000', fontWeight: 600 }}>{t.fleet.eyebrow}</span>
            </div>
            <h2 className="br-display br-fleet-title" style={{ margin: 0, fontSize: 'clamp(44px, 6vw, 76px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}>
              {t.fleet.title}
            </h2>
          </div>
          <BROutline href="/catalog">{t.fleet.viewAll} <span aria-hidden style={{ marginLeft: 8 }}>→</span></BROutline>
        </div>
        <div className="br-home-fleet-grid br-fleet-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, position: 'relative' }}>
          {featured.slice(0, 3).map((s, i) => (
            <div key={s.id} className="br-fleet-cell" style={{ animation: `br-rise 700ms ${i * 90}ms var(--br-easing) both` }}>
              <ScooterCard s={s} large />
            </div>
          ))}
        </div>
      </section>

      {/* 02 — WHY BALI-RENT */}
      <section className="br-section br-why-section" style={{ padding: '96px 48px', background: '#0A0A0A', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 0%, rgba(255,215,0,0.10), transparent 55%), radial-gradient(circle at 0% 100%, rgba(255,215,0,0.06), transparent 50%)', pointerEvents: 'none' }} />
        <div aria-hidden className="br-fleet-bgnum" style={{ position: 'absolute', bottom: -60, left: -20, fontFamily: 'var(--br-display)', fontSize: 'clamp(220px, 28vw, 420px)', lineHeight: 0.8, fontWeight: 800, letterSpacing: '-0.06em', color: 'rgba(255,255,255,0.04)', pointerEvents: 'none', userSelect: 'none' }}>02</div>
        <div style={{ position: 'relative', maxWidth: 880, marginBottom: 56 }}>
          <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: '#FFD700', marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 28, height: 1, background: '#FFD700' }} />
            <span>02 / 06</span>
            <span>·</span>
            <span style={{ fontWeight: 600 }}>{t.why.eyebrow}</span>
          </div>
          <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(44px, 6vw, 76px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}>
            {t.why.title}
          </h2>
        </div>
        <div className="br-home-why-grid br-why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative' }}>
          {(t.why.items as [string, string][]).map(([title, desc], k) => {
            const Icon = whyIcons[k] || SupportIcon;
            return (
            <div
              key={k}
              className="br-why-card"
              style={{
                position: 'relative',
                padding: '32px 24px 28px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 16,
                overflow: 'hidden',
                animation: `br-rise 600ms ${k * 90}ms var(--br-easing) both`,
              }}
            >
              <div className="br-why-num br-mono" style={{ position: 'absolute', top: 18, right: 20, fontSize: 11, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)' }}>0{k + 1}</div>
              <div className="br-why-icon" style={{ width: 56, height: 56, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.28)', marginBottom: 22 }}>
                <Icon size={28} color="#FFD700" />
              </div>
              <div className="br-display" style={{ fontSize: 24, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{title}</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.6)', marginTop: 12, marginBottom: 0 }}>{desc}</p>
              <div aria-hidden className="br-why-underline" style={{ marginTop: 22, height: 2, width: 32, background: '#FFD700', transition: 'width 360ms var(--br-easing)' }} />
            </div>
            );
          })}
        </div>
      </section>

      {/* 03 — PROCESS */}
      <section className="br-section br-process-section" style={{ padding: '96px 48px', background: bg, color: fg, position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden className="br-fleet-bgnum" style={{ position: 'absolute', top: -40, right: -20, fontFamily: 'var(--br-display)', fontSize: 'clamp(220px, 28vw, 420px)', lineHeight: 0.8, fontWeight: 800, letterSpacing: '-0.06em', color: 'rgba(0,0,0,0.04)', pointerEvents: 'none', userSelect: 'none' }}>03</div>
        <div style={{ maxWidth: 760, marginBottom: 56, position: 'relative' }}>
          <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: sub, marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 28, height: 1, background: '#000' }} />
            <span>03 / 06</span>
            <span>·</span>
            <span style={{ color: '#000', fontWeight: 600 }}>{t.process.eyebrow}</span>
          </div>
          <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(44px, 6vw, 76px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}>
            {t.process.title}
          </h2>
        </div>
        <div className="br-home-process-grid br-process-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, position: 'relative' }}>
          {(t.process.steps as [string, string][]).map(([title, desc], i) => (
            <div
              key={i}
              className="br-process-step"
              style={{
                position: 'relative',
                padding: '36px 28px 32px',
                background: '#fff',
                border: `1px solid ${border}`,
                borderRadius: 18,
                overflow: 'hidden',
                animation: `br-rise 600ms ${i * 110}ms var(--br-easing) both`,
              }}
            >
              <div aria-hidden style={{ position: 'absolute', inset: 0, background: i === 0 ? 'linear-gradient(180deg, rgba(255,215,0,0.06), transparent 40%)' : 'none', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                <div className="br-display br-process-num" style={{ fontSize: 88, lineHeight: 0.85, letterSpacing: '-0.05em', color: '#FFD700', WebkitTextStroke: '1px rgba(0,0,0,0.06)' }}>0{i + 1}</div>
                <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: sub, marginTop: 10 }}>STEP {i + 1}</div>
              </div>
              <div style={{ marginTop: 24, height: 1, background: 'linear-gradient(90deg, #000 0%, transparent 60%)', position: 'relative' }} />
              <div className="br-display" style={{ fontSize: 26, lineHeight: 1.1, margin: '20px 0 12px', letterSpacing: '-0.02em', position: 'relative' }}>{title}</div>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: sub, margin: 0, position: 'relative' }}>{desc}</p>
              {i < 2 && (
                <div aria-hidden className="br-process-arrow" style={{ position: 'absolute', top: '50%', right: -18, width: 36, height: 36, borderRadius: 999, background: '#000', color: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transform: 'translateY(-50%)', boxShadow: '0 8px 18px -8px rgba(0,0,0,0.4)', zIndex: 2 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 04 — PRICING */}
      <section className="br-home-pricing br-pricing-section" style={{ position: 'relative', background: 'linear-gradient(180deg, #0A0A0A 0%, #111 100%)', color: '#fff', padding: '96px 48px', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)' }} />
        <div aria-hidden className="br-fleet-bgnum" style={{ position: 'absolute', bottom: -80, right: -40, fontFamily: 'var(--br-display)', fontSize: 'clamp(220px, 28vw, 420px)', lineHeight: 0.8, fontWeight: 800, letterSpacing: '-0.06em', color: 'rgba(255,255,255,0.04)', pointerEvents: 'none', userSelect: 'none' }}>04</div>
        <div style={{ maxWidth: 880, marginBottom: 48, position: 'relative' }}>
          <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: '#FFD700', marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 28, height: 1, background: '#FFD700' }} />
            <span>04 / 06</span>
            <span>·</span>
            <span style={{ fontWeight: 600 }}>{t.pricing.eyebrow}</span>
          </div>
          <h2 className="br-display" style={{ fontSize: 'clamp(44px, 6vw, 76px)', lineHeight: 0.96, letterSpacing: '-0.035em', margin: '0 0 12px' }}>
            {t.pricing.title} <span style={{ color: '#FFD700' }}><BRPrice amount={featured[0]?.price || 8} size={64} /></span> {t.pricing.titleSuffix}
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 620, lineHeight: 1.55 }}>{t.pricing.desc}</p>
        </div>
        <div className="br-home-pricing-grid br-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative' }}>
          {featured.slice(0, 4).map((item, i) => {
            const featuredPick = i === 1;
            return (
              <div
                key={i}
                className={`br-pricing-card ${featuredPick ? 'featured' : ''}`}
                style={{
                  position: 'relative',
                  background: featuredPick ? 'linear-gradient(180deg, #FFD700 0%, #F5C518 100%)' : 'rgba(255,255,255,0.04)',
                  color: featuredPick ? '#0A0A0A' : '#fff',
                  borderRadius: 16,
                  padding: '28px 24px 26px',
                  border: featuredPick ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.10)',
                  boxShadow: featuredPick ? '0 30px 60px -25px rgba(255,215,0,0.5)' : 'none',
                  transform: featuredPick ? 'translateY(-8px)' : 'none',
                  animation: `br-rise 600ms ${i * 90}ms var(--br-easing) both`,
                }}
              >
                {featuredPick && (
                  <div className="br-mono" style={{ position: 'absolute', top: -12, left: 24, background: '#000', color: '#FFD700', fontSize: 10, padding: '6px 10px', letterSpacing: '0.16em', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <StarIcon size={12} color="#FFD700" />
                    POPULAR
                  </div>
                )}
                <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: featuredPick ? 'rgba(0,0,0,0.6)' : '#FFD700' }}>{item.type.toUpperCase()}</div>
                <div className="br-display" style={{ fontSize: 24, marginTop: 8, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{item.name}</div>
                <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="br-mono" style={{ fontSize: 11, color: featuredPick ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }}>{t.pricing.from}</span>
                  <BRPrice amount={item.price} size={36} />
                </div>
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: featuredPick ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.10)', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--br-mono)', fontSize: 12 }}>
                  {t.pricing.inc.map((line, li) => {
                    const last = li === t.pricing.inc.length - 1;
                    return (
                      <span key={line} style={{ display: 'flex', alignItems: 'center', gap: 8, color: last ? (featuredPick ? '#000' : '#fff') : (featuredPick ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.6)') }}>
                        <span aria-hidden style={{ display: 'inline-flex', width: 14, height: 14, borderRadius: 999, background: featuredPick ? '#000' : '#FFD700', color: featuredPick ? '#FFD700' : '#000', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckIcon size={9} color={featuredPick ? '#FFD700' : '#000'} strokeWidth={2.6} />
                        </span>
                        {stripLeadingSymbol(line)}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 05 — UPGRADE THE RIDE */}
      <section className="br-section br-addons-section" style={{ padding: '96px 48px', background: bg, color: fg, position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden className="br-fleet-bgnum" style={{ position: 'absolute', top: -40, left: -20, fontFamily: 'var(--br-display)', fontSize: 'clamp(220px, 28vw, 420px)', lineHeight: 0.8, fontWeight: 800, letterSpacing: '-0.06em', color: 'rgba(0,0,0,0.04)', pointerEvents: 'none', userSelect: 'none' }}>05</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 48, position: 'relative' }}>
          <div style={{ maxWidth: 760 }}>
            <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: sub, marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 28, height: 1, background: '#000' }} />
              <span>05 / 06</span>
              <span>·</span>
              <span style={{ color: '#000', fontWeight: 600 }}>{t.addons.eyebrow}</span>
            </div>
            <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(44px, 6vw, 76px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}>
              {t.addons.title}
            </h2>
          </div>
          <span className="br-mono" style={{ fontSize: 11, color: sub, letterSpacing: '0.16em', padding: '10px 14px', border: `1px solid ${border}`, borderRadius: 999 }}>{t.addons.note}</span>
        </div>
        <div className="br-home-addons-grid br-addons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, position: 'relative' }}>
          {(addonCards.length ? addonCards : [
            { id: 1, icon: 'shield', name: 'Insurance', priceUSD: 5, description: 'Full coverage. Zero excess. Sleep easy.' },
            { id: 2, icon: 'wifi', name: 'Wi-Fi', priceUSD: 4, description: 'Unlimited data across the island.' },
            { id: 3, icon: 'helmet', name: 'Premium helmet', priceUSD: 2, description: 'Sized to fit, cleaned and ready.' },
            { id: 4, icon: 'phone', name: 'Phone mount', priceUSD: 2, description: 'Navigate hands-free on every route.' },
          ]).slice(0, 4).map((item, i) => (
            <div
              key={item.id}
              className="br-card br-addon-card"
              style={{
                position: 'relative',
                padding: '28px 24px 26px',
                background: '#fff',
                borderRadius: 18,
                overflow: 'hidden',
                animation: `br-rise 600ms ${i * 90}ms var(--br-easing) both`,
              }}
            >
              <div aria-hidden className="br-addon-glow" style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.35) 0%, transparent 70%)', opacity: 0, transition: 'opacity 360ms var(--br-easing)', pointerEvents: 'none' }} />
              <div className="br-addon-icon" style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {renderAddonIcon(item.name, item.icon, { size: 28, color: '#000' })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 22, position: 'relative' }}>
                <span className="br-display" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{item.name}</span>
                <span className="br-mono" style={{ fontSize: 14, fontWeight: 700, color: '#000', background: '#FFD700', padding: '4px 8px', borderRadius: 6 }}>+${item.priceUSD || 0}/d</span>
              </div>
              <p style={{ fontSize: 13, color: sub, marginTop: 10, marginBottom: 0, lineHeight: 1.55, position: 'relative' }}>{item.description}</p>
              <div aria-hidden className="br-addon-bar" style={{ marginTop: 22, height: 2, width: 24, background: '#000', transition: 'width 360ms var(--br-easing)', position: 'relative' }} />
            </div>
          ))}
        </div>
      </section>

      <div id="delivery" className="br-home-delivery" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#000', color: '#fff' }}>
        <div className="br-home-delivery-copy" style={{ padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <BREyebrow style={{ color: '#FFD700' }}>{t.delivery.eyebrow}</BREyebrow>
          <h2 className="br-display" style={{ fontSize: 64, lineHeight: 0.98, margin: '12px 0 20px', letterSpacing: '-0.03em' }}>
            {t.delivery.title1}<br />
            <span style={{ color: '#FFD700' }}>{t.delivery.title2}</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', margin: '0 0 28px', maxWidth: 480, lineHeight: 1.55 }}>{t.delivery.desc}</p>
          <div className="br-home-delivery-zones" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {activeZones.map((l) => (
              <div key={l} style={{ padding: '12px 16px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontFamily: 'var(--br-mono)', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span>{l}</span><span style={{ color: '#FFD700' }}>{t.delivery.free}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="br-home-delivery-map" style={{ position: 'relative', minHeight: 600 }}>
          <iframe
            title="Bali map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=114.43%2C-8.95%2C115.72%2C-8.03&layer=mapnik"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, filter: 'grayscale(0.08) contrast(1.05) saturate(0.95)' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.14) 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 22, left: 22, background: 'rgba(0,0,0,0.68)', color: '#fff', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)' }}>
            <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: '#FFD700' }}>REAL MAP · OPENSTREETMAP</div>
            <div className="br-display" style={{ fontSize: 18, marginTop: 4 }}>South & Central Bali</div>
          </div>
          <div style={{ position: 'absolute', right: 22, bottom: 22, background: 'rgba(0,0,0,0.68)', color: '#fff', padding: '10px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.14)', pointerEvents: 'none' }}>
            <span className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em' }}>DRAG TO EXPLORE</span>
          </div>
        </div>
      </div>

      <BRSection eyebrow={t.reviews.eyebrow} title={t.reviews.title} action={<span className="br-mono" style={{ fontSize: 11, color: sub, letterSpacing: '0.14em' }}>{t.reviews.verified}</span>}>
        <div className="br-home-reviews-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {([
            ['Léa M.', 'Paris · Stayed 14 days', 'Picked up at the airport, dropped at the villa. Tank full. The Vespa made every café look like a movie set.', 'sand'],
            ['Marco D.', 'Milano · Surf trip', 'XMAX 300 to Uluwatu and back, three days straight. Bike was perfect. Mechanic met us in 25 min for a flat.', 'sunset'],
            ['Aisha K.', 'Dubai · Honeymoon', 'They threw in a second helmet and a top box without asking. Felt cared for, not transactional. Coming back.', 'mist'],
          ] as const).map(([n, m, q, t], i) => (
            <div key={i} className="br-card" style={{ padding: 28, background: '#fff' }}>
              <div style={{ display: 'flex', gap: 4, color: '#FFD700' }}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon key={index} size={16} color="#FFD700" />
                ))}
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.5, margin: '16px 0 24px', letterSpacing: '-0.01em' }}>&quot;{q}&quot;</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: `1px solid ${border}` }}>
                <BRPhoto tone={t} style={{ width: 44, height: 44, borderRadius: 999, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{n}</div>
                  <div className="br-mono" style={{ fontSize: 11, color: sub }}>{m}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </BRSection>

      <div className="br-home-cta" style={{ background: '#FFD700', color: '#000', padding: '100px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <BREyebrow style={{ color: 'rgba(0,0,0,0.6)' }}>{t.cta.eyebrow}</BREyebrow>
        <div className="br-display" style={{ fontSize: 'clamp(64px, 12vw, 128px)', lineHeight: 0.92, letterSpacing: '-0.04em', margin: '12px 0 28px' }}>
          {t.cta.title}
        </div>
        <p style={{ fontSize: 19, maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.5 }}>{t.cta.desc}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <BRSecondary href="/catalog" style={{ height: 72, padding: '0 44px', fontSize: 18 }}>{t.cta.primary}</BRSecondary>
          <BROutline href="/catalog" style={{ height: 72, padding: '0 32px', fontSize: 16, borderColor: '#000' }}>{t.cta.secondary}</BROutline>
        </div>
        <div className="br-mono" style={{ fontSize: 11, marginTop: 32, letterSpacing: '0.14em', opacity: 0.7 }}>{t.cta.terms}</div>
      </div>

      <SiteFooter />
    </div>
  );
}
