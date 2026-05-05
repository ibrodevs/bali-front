'use client';
import { useEffect, useMemo, useState } from 'react';
import { BR_LOCATIONS } from '@/lib/data';
import { BRPhoto, BRPrimary, BRSecondary, BROutline, BREyebrow, BRPrice, BRSection } from '@/components/BR';
import ScooterCard from '@/components/ScooterCard';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { endpoints } from '@/lib/endpoints';
import { DisplayScooter, fallbackScooters } from '@/lib/displayScooter';

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
          imageUrl: item.mainImage || undefined,
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
        <BRPhoto tone="sunset" label="HERO · UBUD RIDGELINE · 06:42" style={{ position: 'absolute', inset: 0 }} />
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

      <BRSection eyebrow={t.fleet.eyebrow} title={t.fleet.title} action={<BROutline href="/catalog">{t.fleet.viewAll}</BROutline>}>
        <div className="br-home-fleet-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {featured.slice(0, 3).map((s) => (
            <ScooterCard key={s.id} s={s} large />
          ))}
        </div>
      </BRSection>

      <BRSection eyebrow={t.why.eyebrow} title={t.why.title}>
        <div className="br-home-why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden' }}>
          {([
            ['🚚', ...t.why.items[0]],
            ['💰', ...t.why.items[1]],
            ['⚡', ...t.why.items[2]],
            ['🛠', ...t.why.items[3]],
          ] as const).map(([i, title, desc], k) => (
            <div key={k} style={{ padding: 28, borderRight: k < 3 ? `1px solid ${border}` : 'none', background: bg }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{i}</div>
              <div className="br-display" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{title}</div>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: sub, marginTop: 10 }}>{desc}</p>
            </div>
          ))}
        </div>
      </BRSection>

      <BRSection eyebrow={t.process.eyebrow} title={t.process.title}>
        <div className="br-home-process-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {(t.process.steps as [string, string][]).map(([title, desc], i) => (
            <div key={i} style={{ padding: 24, borderTop: `2px solid #000` }}>
              <div className="br-mono" style={{ fontSize: 12, color: '#FFD700' }}>0{i + 1}</div>
              <div className="br-display" style={{ fontSize: 28, lineHeight: 1.1, margin: '16px 0 12px', letterSpacing: '-0.02em' }}>{title}</div>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: sub, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </BRSection>

      <div className="br-home-pricing" style={{ background: '#F5F5F5', padding: '64px 48px' }}>
        <BREyebrow style={{ color: '#FFD700' }}>{t.pricing.eyebrow}</BREyebrow>
        <h2 className="br-display" style={{ fontSize: 64, lineHeight: 0.98, letterSpacing: '-0.03em', margin: '12px 0 8px', color: fg }}>
          {t.pricing.title} <BRPrice amount={featured[0]?.price || 8} size={64} /> {t.pricing.titleSuffix}
        </h2>
        <p style={{ fontSize: 17, color: sub, margin: '0 0 32px', maxWidth: 620 }}>{t.pricing.desc}</p>
        <div className="br-home-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {featured.slice(0, 4).map((item, i) => (
            <div key={i} style={{ background: bg, borderRadius: 12, padding: 24, border: `1px solid ${border}` }}>
              <div className="br-mono" style={{ fontSize: 10, color: '#FFD700', letterSpacing: '0.14em' }}>{item.type.toUpperCase()}</div>
              <div className="br-display" style={{ fontSize: 22, marginTop: 8, color: fg }}>{item.name}</div>
              <div style={{ marginTop: 12, color: fg }}>
                <span className="br-mono" style={{ fontSize: 11, color: sub }}>{t.pricing.from}</span><br />
                <BRPrice amount={item.price} size={32} />
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--br-mono)', fontSize: 11, color: sub }}>
                {t.pricing.inc.map((line) => (
                  <span key={line} style={line === t.pricing.inc[t.pricing.inc.length - 1] ? { color: fg } : undefined}>{line}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BRSection eyebrow={t.addons.eyebrow} title={t.addons.title} action={<span className="br-mono" style={{ fontSize: 11, color: sub, letterSpacing: '0.14em' }}>{t.addons.note}</span>}>
        <div className="br-home-addons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {(addonCards.length ? addonCards : [
            { id: 1, icon: '🛡️', name: 'Insurance', priceUSD: 5, description: 'Full coverage. Zero excess. Sleep easy.' },
            { id: 2, icon: '📶', name: 'Wi-Fi', priceUSD: 4, description: 'Unlimited data across the island.' },
            { id: 3, icon: '🪖', name: 'Premium helmet', priceUSD: 2, description: 'Sized to fit, cleaned and ready.' },
            { id: 4, icon: '📱', name: 'Phone mount', priceUSD: 2, description: 'Navigate hands-free on every route.' },
          ]).slice(0, 4).map((item) => (
            <div key={item.id} className="br-card" style={{ padding: 24, background: '#fff' }}>
              <div style={{ fontSize: 28 }}>{item.icon || '✦'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14 }}>
                <span className="br-display" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>{item.name}</span>
                <span className="br-mono" style={{ fontSize: 16, fontWeight: 600, color: '#FFD700' }}>+${item.priceUSD || 0}/d</span>
              </div>
              <p style={{ fontSize: 13, color: sub, marginTop: 8, lineHeight: 1.5 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </BRSection>

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
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, filter: 'grayscale(0.08) contrast(1.05) saturate(0.95)', pointerEvents: 'none' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.14) 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 22, left: 22, background: 'rgba(0,0,0,0.68)', color: '#fff', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)' }}>
            <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: '#FFD700' }}>REAL MAP · OPENSTREETMAP</div>
            <div className="br-display" style={{ fontSize: 18, marginTop: 4 }}>South & Central Bali</div>
          </div>
          <div style={{ position: 'absolute', right: 22, bottom: 22, background: 'rgba(0,0,0,0.68)', color: '#fff', padding: '10px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.14)', pointerEvents: 'none' }}>
            <span className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em' }}>FIXED MAP VIEW</span>
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
              <div style={{ display: 'flex', gap: 4, color: '#FFD700', fontSize: 18 }}>★★★★★</div>
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
