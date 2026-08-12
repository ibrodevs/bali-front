'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BREyebrow } from '@/components/BR';
import ScooterCard from '@/components/ScooterCard';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { ApiVehicleType, endpoints, unwrapList } from '@/lib/endpoints';
import { DisplayScooter, fallbackScooters, mapApiScooter } from '@/lib/displayScooter';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useSiteContentPreview } from '@/lib/siteContentPreview';
import { PageTitleSync } from '@/lib/usePageSettings';

function deriveFallbackCategories(scooters: DisplayScooter[]): ApiVehicleType[] {
  const seen = new Set<string>();
  return scooters
    .filter((item) => item.type)
    .map((item) => ({
      id: Number(item.apiId) || 0,
      code: item.typeCode || item.type.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      name: item.type,
      translations: [],
    }))
    .filter((item) => {
      if (seen.has(item.code)) return false;
      seen.add(item.code);
      return true;
    });
}

export default function CatalogPage() {
  const { t, locale, tr } = useLocale();
  const { marker } = useSiteContentPreview();
  const searchParams = useSearchParams();
  const requestedTypeFilter = searchParams.get('type')?.trim().toLowerCase() || 'all';
  const [filter, setFilter] = useState(requestedTypeFilter);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [scooters, setScooters] = useState<DisplayScooter[] | null>(null);
  const [categories, setCategories] = useState<ApiVehicleType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([endpoints.scooters({}, locale), endpoints.scooterTypes(locale)])
      .then(([scootersRes, typesRes]) => {
        if (cancelled) return;
        const list = unwrapList(scootersRes).map(mapApiScooter);
        const fallback = fallbackScooters();
        const nextScooters = list.length ? list : fallback;
        const nextCategories = unwrapList(typesRes);
        setScooters(nextScooters);
        setCategories(nextCategories.length ? nextCategories : deriveFallbackCategories(nextScooters));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = fallbackScooters();
        setScooters(fallback);
        setCategories(deriveFallbackCategories(fallback));
        setError(t.catalog.error);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [locale, t.catalog.error]);

  const fg = '#000';
  const bg = '#fff';
  const sub = 'rgba(0,0,0,0.55)';
  const border = 'rgba(0,0,0,0.08)';
  const typeOptions = useMemo(
    () => [{ code: 'all', name: t.catalog.types.All }, ...categories.map((item) => ({ code: item.code, name: item.name }))],
    [categories, t.catalog.types.All],
  );

  useEffect(() => {
    if (requestedTypeFilter === 'all') return;
    if (typeOptions.some((item) => item.code.toLowerCase() === requestedTypeFilter) && filter !== requestedTypeFilter) {
      setFilter(requestedTypeFilter);
    }
  }, [filter, requestedTypeFilter, typeOptions]);

  useEffect(() => {
    if (!typeOptions.some((item) => item.code === filter)) {
      setFilter('all');
    }
  }, [filter, typeOptions]);

  const visible = (scooters || [])
    .filter((s) => filter === 'all' || s.typeCode === filter)
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
      return (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER);
    });

  return (
    <div style={{ background: bg, color: fg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageTitleSync pageKey="catalog" />
      <SiteHeader />

      <div className="br-catalog-hero" style={{ padding: '64px 40px 32px' }}>
        <BREyebrow><span {...marker('catalog.eyebrow')}>{tr(t.catalog.eyebrow, { n: visible.length })}</span></BREyebrow>
        <h1 className="br-display" style={{ fontSize: 'clamp(48px, 8vw, 96px)', lineHeight: 0.95, letterSpacing: '-0.04em', margin: '16px 0 8px' }}>
          <span {...marker('catalog.title')}>{t.catalog.title}</span>
        </h1>
        <p {...marker('catalog.desc')} style={{ fontSize: 18, color: sub, maxWidth: 540, margin: 0, lineHeight: 1.55 }}>{t.catalog.desc}</p>
        {error && <div {...marker('catalog.error')} className="br-mono" style={{ marginTop: 12, fontSize: 12, color: '#B45309' }}>{error}</div>}
        <div style={{ position: 'relative', marginTop: 24, maxWidth: 480 }}>
          <span aria-hidden style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: sub, fontSize: 16, pointerEvents: 'none' }}>⌕</span>
          <input
            {...marker('catalog.searchPlaceholder')}
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
              {...marker('catalog.clear')}
              onClick={() => setSearch('')}
              aria-label={t.catalog.clear}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'rgba(0,0,0,0.06)', borderRadius: 999, width: 28, height: 28, cursor: 'pointer', color: fg, fontSize: 14 }}
            >×</button>
          )}
        </div>
      </div>

      <div className="br-catalog-toolbar" style={{ position: 'sticky', top: 64, background: 'rgba(255,255,255,0.85)', backdropFilter: 'saturate(160%) blur(14px)', WebkitBackdropFilter: 'saturate(160%) blur(14px)', padding: '14px 40px', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, display: 'flex', gap: 16, alignItems: 'center', zIndex: 4 }}>
        <div className="br-scroll-x" style={{ display: 'flex', gap: 8, flex: 1 }}>
          {typeOptions.map((item) => (
            <button
              {...marker('catalog.types')}
              key={item.code}
              onClick={() => setFilter(item.code)}
              className={`br-filter-chip${filter === item.code ? ' active' : ''}`}
            >
              {item.name.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="br-catalog-sort" style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span {...marker('catalog.sort')} className="br-mono" style={{ fontSize: 11, color: sub, letterSpacing: '0.1em' }}>{t.catalog.sort}</span>
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
            <div {...marker('catalog.empty')} className="br-mono" style={{ color: sub, marginTop: 12, letterSpacing: '0.12em', fontSize: 12 }}>{t.catalog.empty}</div>
            {(search || filter !== 'all') && (
              <button
                {...marker('catalog.resetFilters')}
                onClick={() => { setSearch(''); setFilter('all'); }}
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
