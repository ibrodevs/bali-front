'use client';
import { useEffect, useState } from 'react';
import { BREyebrow } from '@/components/BR';
import ScooterCard from '@/components/ScooterCard';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { endpoints, unwrapList } from '@/lib/endpoints';
import { DisplayScooter, fallbackScooters, mapApiScooter } from '@/lib/displayScooter';
import { useLocale } from '@/lib/i18n/LocaleProvider';

export default function CatalogPage() {
  const { t, locale, tr } = useLocale();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [scooters, setScooters] = useState<DisplayScooter[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    endpoints.scooters({}, locale)
      .then((res) => {
        if (cancelled) return;
        const list = unwrapList(res).map(mapApiScooter);
        setScooters(list.length ? list : fallbackScooters());
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setScooters(fallbackScooters());
        setError(t.catalog.error);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [locale, t.catalog.error]);

  const fg = '#000';
  const bg = '#fff';
  const sub = 'rgba(0,0,0,0.55)';
  const border = 'rgba(0,0,0,0.08)';
  const types = ['All', ...Array.from(new Set((scooters || []).map((s) => s.type).filter(Boolean)))];
  const visible = (scooters || [])
    .filter((s) => filter === 'All' || s.type === filter)
    .filter((s) => {
      if (!search.trim()) return true;
      const query = search.trim().toLowerCase();
      return [s.name, s.type, s.tag].join(' ').toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'engine') return b.cc - a.cc;
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
      return Number(Boolean(b.apiId)) - Number(Boolean(a.apiId));
    });

  return (
    <div style={{ background: bg, color: fg }}>
      <SiteHeader />

      <div className="br-catalog-hero" style={{ padding: '64px 40px 40px' }}>
        <BREyebrow>{tr(t.catalog.eyebrow, { n: visible.length })}</BREyebrow>
        <h1 className="br-display" style={{ fontSize: 'clamp(56px, 8vw, 96px)', lineHeight: 0.95, letterSpacing: '-0.04em', margin: '16px 0 8px' }}>
          {t.catalog.title}
        </h1>
        <p style={{ fontSize: 18, color: sub, maxWidth: 540, margin: 0 }}>{t.catalog.desc}</p>
        {error && <div className="br-mono" style={{ marginTop: 12, fontSize: 12, color: '#B45309' }}>{error}</div>}
        <div className="br-field" style={{ marginTop: 22, maxWidth: 420 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder=" " style={{ background: bg, color: fg, borderColor: border }} />
          <label>SEARCH</label>
        </div>
      </div>

      <div className="br-catalog-toolbar" style={{ position: 'sticky', top: 64, background: bg, padding: '16px 40px', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, display: 'flex', gap: 24, alignItems: 'center', zIndex: 4 }}>
        <div className="br-scroll-x" style={{ display: 'flex', gap: 8, flex: 1 }}>
          {types.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="br-mono"
              style={{
                padding: '8px 14px', borderRadius: 999,
                border: `1px solid ${filter === f ? '#000' : border}`,
                background: filter === f ? '#000' : 'transparent',
                color: filter === f ? '#fff' : fg,
                fontSize: 12, letterSpacing: '0.08em', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              {((t.catalog.types as Record<string, string>)[f] || f).toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="br-mono" style={{ fontSize: 11, color: sub }}>{t.catalog.sort}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ background: 'transparent', border: `1px solid ${border}`, color: fg, padding: '6px 10px', borderRadius: 999, fontFamily: 'var(--br-mono)', fontSize: 12 }}
          >
            <option value="featured">{t.catalog.sortFeatured}</option>
            <option value="price-asc">{t.catalog.sortPriceUp}</option>
            <option value="price-desc">{t.catalog.sortPriceDown}</option>
            <option value="engine">{t.catalog.sortEngine}</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      <div className="br-catalog-results" style={{ padding: 40 }}>
        {loading ? (
          <div className="br-mono" style={{ color: sub, padding: 80, textAlign: 'center' }}>{t.catalog.loading}</div>
        ) : visible.length === 0 ? (
          <div className="br-mono" style={{ color: sub, padding: 80, textAlign: 'center' }}>{t.catalog.empty}</div>
        ) : (
          <div className="br-catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {visible.map((s) => <ScooterCard key={s.id} s={s} />)}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
