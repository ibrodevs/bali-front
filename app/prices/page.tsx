'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BREyebrow } from '@/components/BR';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { ApiError } from '@/lib/api';
import { ApiScooterRentalRate, endpoints } from '@/lib/endpoints';
import { useCurrency } from '@/lib/i18n/CurrencyProvider';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { formatBillingLabel, formatRateRange } from '@/lib/rentalRates';

type RateGroup = {
  scooterId: number;
  slug: string;
  title: string;
  rates: ApiScooterRentalRate[];
};

export default function PricesPage() {
  const { locale } = useLocale();
  const { convertPrice, symbol } = useCurrency();
  const [rates, setRates] = useState<ApiScooterRentalRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    endpoints.pricingRates()
      .then((response) => {
        if (cancelled) return;
        setRates(response);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Unable to load prices right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const groups = useMemo<RateGroup[]>(() => {
    const grouped = new Map<number, RateGroup>();
    for (const rate of rates) {
      const scooterId = Number(rate.scooter_id || rate.scooter || 0);
      if (!scooterId) continue;
      const existing = grouped.get(scooterId);
      if (existing) {
        existing.rates.push(rate);
        continue;
      }
      grouped.set(scooterId, {
        scooterId,
        slug: rate.scooter_slug || String(scooterId),
        title: rate.scooter_title || `Scooter #${scooterId}`,
        rates: [rate],
      });
    }

    return [...grouped.values()]
      .map((group) => ({
        ...group,
        rates: [...group.rates].sort(
          (a, b) => a.min_days - b.min_days || (a.max_days ?? Number.MAX_SAFE_INTEGER) - (b.max_days ?? Number.MAX_SAFE_INTEGER),
        ),
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [rates]);

  const copy = {
    en: {
      eyebrow: 'Pricing',
      title: 'Prices',
      desc: 'Live tariff grid from the backend. Any change in the admin panel appears here automatically.',
      loading: 'Loading prices…',
      error: 'Unable to load prices right now.',
      empty: 'No tariffs have been configured yet.',
      scooter: 'SCOOTER',
      open: 'Open →',
      rates: 'Rates',
    },
    ru: {
      eyebrow: 'Цены',
      title: 'Цены',
      desc: 'Живая тарифная сетка с backend. Любое изменение в админке автоматически появляется здесь.',
      loading: 'Загружаем цены…',
      error: 'Сейчас не удалось загрузить цены.',
      empty: 'Тарифы пока не настроены.',
      scooter: 'СКУТЕР',
      open: 'Открыть →',
      rates: 'Тарифы',
    },
    id: {
      eyebrow: 'Harga',
      title: 'Harga',
      desc: 'Grid tarif langsung dari backend. Setiap perubahan di admin langsung muncul di sini.',
      loading: 'Memuat harga…',
      error: 'Harga tidak bisa dimuat sekarang.',
      empty: 'Belum ada tarif yang diatur.',
      scooter: 'SKUTER',
      open: 'Buka →',
      rates: 'Tarif',
    },
    zh: {
      eyebrow: '价格',
      title: '价格',
      desc: '来自后端的实时价格网格。后台中的任何修改都会自动显示在这里。',
      loading: '正在加载价格…',
      error: '暂时无法加载价格。',
      empty: '暂未配置价格档位。',
      scooter: '踏板车',
      open: '打开 →',
      rates: '价格档位',
    },
    de: {
      eyebrow: 'Preise',
      title: 'Preise',
      desc: 'Live-Tarifraster aus dem Backend. Jede Aenderung im Admin erscheint hier automatisch.',
      loading: 'Preise werden geladen…',
      error: 'Preise konnten gerade nicht geladen werden.',
      empty: 'Es wurden noch keine Tarife eingerichtet.',
      scooter: 'ROLLER',
      open: 'Oeffnen →',
      rates: 'Tarife',
    },
    fr: {
      eyebrow: 'Tarifs',
      title: 'Tarifs',
      desc: 'Grille tarifaire en direct depuis le backend. Toute modification dans l’admin apparait ici automatiquement.',
      loading: 'Chargement des tarifs…',
      error: 'Impossible de charger les tarifs pour le moment.',
      empty: 'Aucun tarif n’a encore ete configure.',
      scooter: 'SCOOTER',
      open: 'Ouvrir →',
      rates: 'Tarifs',
    },
  }[(locale || 'en').split('-')[0] as 'en' | 'ru' | 'id' | 'zh' | 'de' | 'fr'] || {
    eyebrow: 'Pricing',
    title: 'Prices',
    desc: 'Live tariff grid from the backend. Any change in the admin panel appears here automatically.',
    loading: 'Loading prices…',
    error: 'Unable to load prices right now.',
    empty: 'No tariffs have been configured yet.',
    scooter: 'SCOOTER',
    open: 'Open →',
    rates: 'Rates',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f4eb', color: '#111', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <section
        style={{
          padding: '64px 40px 28px',
          background:
            'radial-gradient(circle at top left, rgba(255,215,0,0.3), transparent 34%), linear-gradient(180deg, #fcfbf7 0%, #f7f4eb 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <BREyebrow>{copy.eyebrow}</BREyebrow>
        <h1 className="br-display" style={{ fontSize: 'clamp(44px, 8vw, 88px)', lineHeight: 0.94, margin: '14px 0 10px', letterSpacing: '-0.04em' }}>
          {copy.title}
        </h1>
        <p style={{ margin: 0, maxWidth: 720, color: 'rgba(0,0,0,0.62)', lineHeight: 1.65 }}>
          {copy.desc}
        </p>
      </section>

      <section style={{ padding: '32px 40px 88px' }}>
        {loading ? (
          <div className="br-mono" style={{ color: 'rgba(0,0,0,0.58)' }}>{copy.loading}</div>
        ) : error ? (
          <div className="br-mono" style={{ color: '#b91c1c' }}>{error || copy.error}</div>
        ) : groups.length === 0 ? (
          <div className="br-mono" style={{ color: 'rgba(0,0,0,0.58)' }}>{copy.empty}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {groups.map((group) => (
              <div
                key={group.scooterId}
                style={{
                  borderRadius: 24,
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(12px)',
                  padding: 22,
                  boxShadow: '0 18px 50px -32px rgba(0,0,0,0.35)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div>
                    <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.48)' }}>{copy.scooter}</div>
                    <h2 className="br-display" style={{ margin: '8px 0 0', fontSize: 30, lineHeight: 0.98 }}>
                      {group.title}
                    </h2>
                  </div>
                  <Link href={`/scooter/${group.slug}`} className="br-mono" style={{ color: '#111', fontSize: 12, textDecoration: 'none' }}>
                    {copy.open}
                  </Link>
                </div>

                <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
                  {group.rates.map((rate) => (
                    <div
                      key={rate.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                        gap: 12,
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: 14,
                        background: rate.billing_period_days === 30 ? '#111' : '#f5f5f5',
                        color: rate.billing_period_days === 30 ? '#fff' : '#111',
                      }}
                    >
                      <div>
                        <div className="br-mono" style={{ fontSize: 12, opacity: 0.72 }}>
                          {formatRateRange(rate.min_days, rate.max_days, locale)}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, opacity: 0.82 }}>{formatBillingLabel(rate.billing_period_days, locale)}</div>
                      </div>
                      <div className="br-display" style={{ fontSize: 28, letterSpacing: '-0.03em' }}>
                        {symbol}
                        {(Math.round(convertPrice(Number(rate.price_usd || 0)) * 100) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
