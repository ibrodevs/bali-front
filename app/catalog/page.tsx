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

      <div className="br-catalog-hero" style={{ padding: '64px 40px 32px' }}>
        <BREyebrow>{tr(t.catalog.eyebrow, { n: visible.length })}</BREyebrow>
        <h1 className="br-display" style={{ fontSize: 'clamp(48px, 8vw, 96px)', lineHeight: 0.95, letterSpacing: '-0.04em', margin: '16px 0 8px' }}>
          {t.catalog.title}
        </h1>
        <p style={{ fontSize: 18, color: sub, maxWidth: 540, margin: 0, lineHeight: 1.55 }}>{t.catalog.desc}</p>
        {error && <div className="br-mono" style={{ marginTop: 12, fontSize: 12, color: '#B45309' }}>{error}</div>}
        <div style={{ position: 'relative', marginTop: 24, maxWidth: 480 }}>
          <span aria-hidden style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: sub, fontSize: 16, pointerEvents: 'none' }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.catalog.searchPlaceholder}
            style={{
              width: '100%',
              fontFamily: 'var(--br-body)',
              fontSize: 15,
              padding: '14px 44px 14px 44px',
              border: `1px solid ${border}`,
              borderRadius: 999,
              background: bg,
              color: fg,
              minHeight: 52,
              outline: 'none',
              transition: 'border-color 160ms, box-shadow 160ms',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#FFD700'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,215,0,0.25)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = border; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label={t.catalog.clear}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'rgba(0,0,0,0.06)', borderRadius: 999, width: 28, height: 28, cursor: 'pointer', color: fg, fontSize: 14 }}
            >×</button>
          )}
        </div>
      </div>

      <div className="br-catalog-toolbar" style={{ position: 'sticky', top: 64, background: 'rgba(255,255,255,0.85)', backdropFilter: 'saturate(160%) blur(14px)', WebkitBackdropFilter: 'saturate(160%) blur(14px)', padding: '14px 40px', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, display: 'flex', gap: 16, alignItems: 'center', zIndex: 4 }}>
        <div className="br-scroll-x" style={{ display: 'flex', gap: 8, flex: 1 }}>
          {types.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`br-filter-chip${filter === f ? ' active' : ''}`}
            >
              {((t.catalog.types as Record<string, string>)[f] || f).toUpperCase()}
            </button>
          ))}
        </div>
        <div className="br-catalog-sort" style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span className="br-mono" style={{ fontSize: 11, color: sub, letterSpacing: '0.1em' }}>{t.catalog.sort}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ background: bg, border: `1px solid ${border}`, color: fg, padding: '8px 32px 8px 14px', borderRadius: 999, fontFamily: 'var(--br-mono)', fontSize: 12, cursor: 'pointer', minHeight: 40 }}
          >
            <option value="featured">{t.catalog.sortFeatured}</option>
            <option value="price-asc">{t.catalog.sortPriceUp}</option>
            <option value="price-desc">{t.catalog.sortPriceDown}</option>
            <option value="engine">{t.catalog.sortEngine}</option>
            <option value="rating">{t.catalog.sortRating}</option>
          </select>
        </div>
      </div>

      <div className="br-catalog-results" style={{ padding: 40 }}>
        {loading ? (
          <div className="br-catalog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="br-card" style={{ overflow: 'hidden' }}>
                <div className="br-skeleton" style={{ height: 220, borderRadius: 0 }} />
                <div style={{ padding: 22 }}>
                  <div className="br-skeleton" style={{ height: 12, width: '40%' }} />
                  <div className="br-skeleton" style={{ height: 22, marginTop: 10, width: '70%' }} />
                  <div className="br-skeleton" style={{ height: 44, marginTop: 22, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding: 80, textAlign: 'center' }}>
            <div style={{ fontSize: 48, opacity: 0.25 }}>⌕</div>
            <div className="br-mono" style={{ color: sub, marginTop: 12, letterSpacing: '0.12em', fontSize: 12 }}>{t.catalog.empty}</div>
            {(search || filter !== 'All') && (
              <button
                onClick={() => { setSearch(''); setFilter('All'); }}
                className="br-btn br-btn-outline"
                style={{ marginTop: 20 }}
              >
                {t.catalog.resetFilters}
              </button>
            )}
          </div>
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
