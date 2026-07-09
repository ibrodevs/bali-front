'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BREyebrow, BRPhoto, BRPrimary, BROutline } from '@/components/BR';
import {
  ArrowRightIcon,
  CheckIcon,
  DeliveryIcon,
  HelmetIcon,
  ShieldIcon,
} from '@/components/Icons';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { ApiError } from '@/lib/api';
import { DisplayScooter, mapApiScooter, resolveScooterImage, resolveScooterImageObjectPosition, resolveScooterRouteId } from '@/lib/displayScooter';
import { ApiScooterRentalRate, endpoints, unwrapList } from '@/lib/endpoints';
import { formatGroupedAmount, useCurrency } from '@/lib/i18n/CurrencyProvider';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { formatBillingLabel, formatRateRange } from '@/lib/rentalRates';
import { useSiteSettings } from '@/lib/siteSettings';
import { PageTitleSync, usePagePath } from '@/lib/usePageSettings';

type RateGroup = {
  scooterId: number;
  slug: string;
  title: string;
  rates: ApiScooterRentalRate[];
  scooter?: DisplayScooter;
  routeId: string;
  minDailyUsd: number;
  minDailyIdr: number | null;
  featuredRateId?: number;
  imageUrl?: string;
  imageObjectPosition?: string;
};

function toNumber(value: string | number | null | undefined) {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
}

function effectiveDailyPrice(rate: ApiScooterRentalRate) {
  const effective = toNumber(rate.effective_daily_price_usd);
  if (effective > 0) return effective;
  const billingDays = Math.max(1, Number(rate.billing_period_days) || 1);
  return toNumber(rate.price_usd) / billingDays;
}

function effectiveDailyPriceIdr(rate: ApiScooterRentalRate) {
  if (rate.price_idr == null) return null;
  const billingDays = Math.max(1, Number(rate.billing_period_days) || 1);
  return Math.round(Number(rate.price_idr) / billingDays);
}

export default function PricesPage() {
  const { t, locale } = useLocale();
  const { convertPrice, currency, symbol } = useCurrency();
  const { socialLinks } = useSiteSettings();
  const catalogPath = usePagePath('catalog');
  const bookingPath = usePagePath('booking');
  // Prices are always shown in IDR — the real price the admin set, fixed regardless of
  // the currency switcher. formatApprox gives the equivalent in the selected currency.
  const formatPrice = (amountUsd: number) => `Rp ${formatGroupedAmount(convertPrice(amountUsd, 'IDR'), 0)}`;
  // When the exact admin-entered IDR figure is known, show it as-is instead of re-deriving
  // it from price_usd via the live exchange rate, which can disagree with what was typed.
  const formatPriceIdr = (amountIdr: number) => `Rp ${formatGroupedAmount(amountIdr, 0)}`;
  const formatApprox = (amountUsd: number) =>
    currency === 'IDR' ? null : `≈ ${symbol}${formatGroupedAmount(convertPrice(amountUsd), 2)}`;
  const [rates, setRates] = useState<ApiScooterRentalRate[]>([]);
  const [fleet, setFleet] = useState<DisplayScooter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.allSettled([endpoints.pricingRates(), endpoints.scooters({}, locale)])
      .then(([ratesResult, fleetResult]) => {
        if (cancelled) return;

        if (ratesResult.status === 'fulfilled') {
          setRates(ratesResult.value);
        } else {
          const nextError = ratesResult.reason;
          setError(nextError instanceof ApiError ? nextError.message : 'Unable to load prices right now.');
          setRates([]);
        }

        if (fleetResult.status === 'fulfilled') {
          setFleet(unwrapList(fleetResult.value).map(mapApiScooter));
        } else {
          setFleet([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const fleetById = useMemo(() => {
    const next = new Map<number, DisplayScooter>();
    for (const scooter of fleet) {
      const id = Number(scooter.apiId);
      if (id) next.set(id, scooter);
    }
    return next;
  }, [fleet]);

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
        routeId: rate.scooter_slug || String(scooterId),
        minDailyUsd: 0,
        minDailyIdr: null,
      });
    }

    return [...grouped.values()]
      .map((group) => {
        const sortedRates = [...group.rates].sort(
          (a, b) => a.min_days - b.min_days || (a.max_days ?? Number.MAX_SAFE_INTEGER) - (b.max_days ?? Number.MAX_SAFE_INTEGER),
        );
        const scooter = fleetById.get(group.scooterId);
        // Pick the cheapest rate by its USD-equivalent daily price (fine for comparison/ordering),
        // but read its displayed price straight from price_idr — never re-derive the IDR figure
        // from the rounded USD value, which can disagree with what's shown in the tariff rows.
        const featuredRate =
          [...sortedRates].sort((a, b) => effectiveDailyPrice(a) - effectiveDailyPrice(b) || b.billing_period_days - a.billing_period_days)[0];
        const minDailyUsd = featuredRate ? effectiveDailyPrice(featuredRate) : 0;
        const minDailyIdr = featuredRate ? effectiveDailyPriceIdr(featuredRate) : null;
        const routeId = String(
          resolveScooterRouteId(scooter?.id || group.slug, scooter?.name || group.title) ??
            group.slug,
        );
        const imageUrl = scooter?.imageUrl || resolveScooterImage(group.slug, group.title);

        return {
          ...group,
          rates: sortedRates,
          scooter,
          routeId,
          minDailyUsd,
          minDailyIdr,
          featuredRateId: featuredRate?.id,
          imageUrl,
          imageObjectPosition: scooter?.imageObjectPosition || resolveScooterImageObjectPosition(group.slug, group.title),
        };
      })
      .sort((a, b) => a.minDailyUsd - b.minDailyUsd || a.title.localeCompare(b.title));
  }, [fleetById, rates]);

  const lowestDailyUsd = groups[0]?.minDailyUsd || 0;
  const lowestDailyIdr = groups[0]?.minDailyIdr ?? null;
  const minDailyLabel = lowestDailyIdr != null ? formatPriceIdr(lowestDailyIdr) : formatPrice(lowestDailyUsd);
  const headlinePrice = loading ? '...' : lowestDailyUsd ? minDailyLabel : '—';

  const copy = {
    en: {
      live: 'LIVE PRICING · SYNCED WITH BOOKING ENGINE',
      lead: 'Choose the rate that fits the ride.',
      body: 'Compare every duration band, spot the best value, and jump straight into the scooter that matches your plan.',
      metaModels: 'models',
      metaBands: 'rate bands',
      metaValue: 'best daily value',
      cardsIntro: 'Live tariff cards',
      cardsTitle: 'Transparent prices, without the spreadsheet feel.',
      cardsBody: 'Every card updates automatically from the backend, so the page always reflects the latest tariff setup from admin.',
      loading: 'Loading live prices…',
      error: 'Unable to load prices right now.',
      empty: 'No tariffs have been configured yet.',
      scooter: 'SCOOTER',
      from: 'FROM',
      perDay: '/day',
      bestValue: 'Best value',
      rateBands: 'Rate bands',
      open: 'View scooter',
      book: 'Book this scooter',
      ctaEyebrow: 'Need a custom term?',
      ctaTitle: 'Longer stay, multi-bike booking, or business rate?',
      ctaBody: 'Message us for seasonal, team, or mixed-fleet pricing and we will build the right setup for your dates.',
      ctaPrimary: 'Chat on WhatsApp',
    },
    ru: {
      live: 'АКТУАЛЬНЫЕ ЦЕНЫ · СИНХРОНИЗАЦИЯ С СИСТЕМОЙ БРОНИРОВАНИЯ',
      lead: 'Выбери тариф под свой формат поездки.',
      body: 'Сравни все диапазоны аренды, быстро найди лучший value и сразу перейди к нужному скутеру.',
      metaModels: 'моделей',
      metaBands: 'тарифных линий',
      metaValue: 'лучшая цена в день',
      cardsIntro: 'Живые тарифы',
      cardsTitle: 'Прозрачные цены без ощущения таблицы.',
      cardsBody: 'Карточки обновляются автоматически из backend, поэтому страница всегда показывает актуальную тарифную сетку из админки.',
      loading: 'Загружаем актуальные цены…',
      error: 'Сейчас не удалось загрузить цены.',
      empty: 'Тарифы пока не настроены.',
      scooter: 'СКУТЕР',
      from: 'ОТ',
      perDay: '/день',
      bestValue: 'Лучшее предложение',
      rateBands: 'Тарифы',
      open: 'Смотреть скутер',
      book: 'Забронировать',
      ctaEyebrow: 'Нужен особый тариф?',
      ctaTitle: 'Долгая аренда, несколько байков или цена для бизнеса?',
      ctaBody: 'Напиши нам, если нужен сезонный, групповой или смешанный парк. Подберём формат именно под ваши даты.',
      ctaPrimary: 'Написать в WhatsApp',
    },
    id: {
      live: 'HARGA LIVE · TERSINKRON DENGAN MESIN BOOKING',
      lead: 'Pilih tarif yang pas untuk gaya perjalananmu.',
      body: 'Bandingkan semua durasi sewa, lihat value terbaik, lalu langsung buka skuter yang sesuai dengan rencanamu.',
      metaModels: 'model',
      metaBands: 'tier tarif',
      metaValue: 'nilai harian terbaik',
      cardsIntro: 'Kartu tarif live',
      cardsTitle: 'Harga transparan, tanpa rasa spreadsheet.',
      cardsBody: 'Setiap kartu diperbarui otomatis dari backend, jadi halaman ini selalu mengikuti setup tarif terbaru dari admin.',
      loading: 'Memuat harga live…',
      error: 'Harga tidak bisa dimuat sekarang.',
      empty: 'Belum ada tarif yang diatur.',
      scooter: 'SKUTER',
      from: 'DARI',
      perDay: '/hari',
      bestValue: 'Nilai terbaik',
      rateBands: 'Tier tarif',
      open: 'Lihat skuter',
      book: 'Pesan skuter ini',
      ctaEyebrow: 'Butuh tarif khusus?',
      ctaTitle: 'Sewa lama, banyak unit, atau harga bisnis?',
      ctaBody: 'Hubungi kami untuk tarif musiman, tim, atau kombinasi armada dan kami siapkan opsi terbaik untuk tanggalmu.',
      ctaPrimary: 'Chat di WhatsApp',
    },
    zh: {
      live: '实时价格 · 与预订系统同步',
      lead: '选择适合你行程的价格档。',
      body: '比较不同租期价格，快速找到最佳性价比，并直接进入适合你的踏板车。',
      metaModels: '车型',
      metaBands: '价格档',
      metaValue: '最佳日均价格',
      cardsIntro: '实时价格卡片',
      cardsTitle: '透明报价，不再像表格一样生硬。',
      cardsBody: '每张卡片都会从后台自动更新，所以这里始终显示管理员最新配置的价格档位。',
      loading: '正在加载实时价格…',
      error: '暂时无法加载价格。',
      empty: '暂未配置价格档位。',
      scooter: '踏板车',
      from: '起',
      perDay: '/天',
      bestValue: '最佳选择',
      rateBands: '价格档',
      open: '查看车型',
      book: '预订这台车',
      ctaEyebrow: '需要定制报价？',
      ctaTitle: '长期租、多车订单或商务价格？',
      ctaBody: '如果你需要季租、团队或混合车队方案，直接联系我们，我们会按你的日期给出合适报价。',
      ctaPrimary: 'WhatsApp 联系',
    },
    de: {
      live: 'LIVE-PREISE · MIT DEM BUCHUNGSSYSTEM SYNCHRONISIERT',
      lead: 'Waehle den Tarif, der zu deiner Reise passt.',
      body: 'Vergleiche alle Mietdauern, finde sofort das beste Preis-Leistungs-Verhaeltnis und spring direkt zum passenden Roller.',
      metaModels: 'Modelle',
      metaBands: 'Tarifstufen',
      metaValue: 'bester Tageswert',
      cardsIntro: 'Live-Tarifkarten',
      cardsTitle: 'Transparente Preise ohne Tabellen-Gefuehl.',
      cardsBody: 'Jede Karte aktualisiert sich automatisch aus dem Backend und zeigt dadurch immer die aktuelle Tariflogik aus dem Admin.',
      loading: 'Live-Preise werden geladen…',
      error: 'Preise konnten gerade nicht geladen werden.',
      empty: 'Es wurden noch keine Tarife eingerichtet.',
      scooter: 'ROLLER',
      from: 'AB',
      perDay: '/Tag',
      bestValue: 'Bester Wert',
      rateBands: 'Tarife',
      open: 'Roller ansehen',
      book: 'Diesen Roller buchen',
      ctaEyebrow: 'Individueller Tarif?',
      ctaTitle: 'Langzeitmiete, mehrere Bikes oder Business-Preis?',
      ctaBody: 'Schreib uns fuer Saisonpreise, Team-Buchungen oder gemischte Flotten und wir bauen das passende Angebot fuer deine Daten.',
      ctaPrimary: 'Per WhatsApp schreiben',
    },
    fr: {
      live: 'TARIFS EN DIRECT · SYNCHRONISES AVEC LE SYSTEME DE RESERVATION',
      lead: 'Choisis le tarif qui colle a ton voyage.',
      body: 'Compare chaque duree de location, repere la meilleure valeur et ouvre directement le scooter qui correspond a ton plan.',
      metaModels: 'modeles',
      metaBands: 'paliers tarifaires',
      metaValue: 'meilleur prix/jour',
      cardsIntro: 'Cartes tarifaires live',
      cardsTitle: 'Des prix clairs, sans effet tableur.',
      cardsBody: 'Chaque carte se met a jour automatiquement depuis le backend pour refléter a tout moment la grille tarifaire active dans l’admin.',
      loading: 'Chargement des tarifs live…',
      error: 'Impossible de charger les tarifs pour le moment.',
      empty: 'Aucun tarif n’a encore ete configure.',
      scooter: 'SCOOTER',
      from: 'DES',
      perDay: '/jour',
      bestValue: 'Meilleure valeur',
      rateBands: 'Tarifs',
      open: 'Voir le scooter',
      book: 'Reserver ce scooter',
      ctaEyebrow: 'Besoin d’un tarif sur mesure ?',
      ctaTitle: 'Long sejour, plusieurs scooters ou offre business ?',
      ctaBody: 'Ecris-nous pour un tarif saisonnier, equipe ou flotte mixte, et nous preparerons la bonne formule pour tes dates.',
      ctaPrimary: 'Ecrire sur WhatsApp',
    },
  }[(locale || 'en').split('-')[0] as 'en' | 'ru' | 'id' | 'zh' | 'de' | 'fr'] || {
    live: 'LIVE PRICING · SYNCED WITH BOOKING ENGINE',
    lead: 'Choose the rate that fits the ride.',
    body: 'Compare every duration band, spot the best value, and jump straight into the scooter that matches your plan.',
    metaModels: 'models',
    metaBands: 'rate bands',
    metaValue: 'best daily value',
    cardsIntro: 'Live tariff cards',
    cardsTitle: 'Transparent prices, without the spreadsheet feel.',
    cardsBody: 'Every card updates automatically from the backend, so the page always reflects the latest tariff setup from admin.',
    loading: 'Loading live prices…',
    error: 'Unable to load prices right now.',
    empty: 'No tariffs have been configured yet.',
    scooter: 'SCOOTER',
    from: 'FROM',
    perDay: '/day',
    bestValue: 'Best value',
    rateBands: 'Rate bands',
    open: 'View scooter',
    book: 'Book this scooter',
    ctaEyebrow: 'Need a custom term?',
    ctaTitle: 'Longer stay, multi-bike booking, or business rate?',
    ctaBody: 'Message us for seasonal, team, or mixed-fleet pricing and we will build the right setup for your dates.',
    ctaPrimary: 'Chat on WhatsApp',
  };

  const includedItems = [
    { label: t.pricing.inc[0], icon: HelmetIcon },
    { label: t.pricing.inc[1], icon: CheckIcon },
    { label: t.pricing.inc[2], icon: DeliveryIcon },
    { label: t.pricing.inc[3], icon: ShieldIcon },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF5', color: '#0A0A0F', display: 'flex', flexDirection: 'column' }}>
      <PageTitleSync pageKey="prices" />
      <SiteHeader />

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(36px, 6vw, 72px) clamp(16px, 5vw, 48px) clamp(40px, 7vw, 72px)',
          background:
            'radial-gradient(circle at right top, rgba(255,215,0,0.24), transparent 28%), radial-gradient(circle at left 20%, rgba(255,215,0,0.08), transparent 24%), linear-gradient(180deg, #fefdf8 0%, #f6f2e7 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -10,
            right: 'clamp(-8px, 2vw, 12px)',
            fontFamily: 'var(--br-display)',
            fontSize: 'clamp(120px, 22vw, 300px)',
            lineHeight: 0.82,
            letterSpacing: '-0.08em',
            color: 'rgba(0,0,0,0.045)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          04
        </div>

        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            alignItems: 'end',
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div
              className="br-mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                color: 'rgba(0,0,0,0.56)',
                marginBottom: 18,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ width: 28, height: 1, background: '#0A0A0F' }} />
              <span>04 / 04</span>
              <span>·</span>
              <span>{copy.live}</span>
            </div>
            <BREyebrow>{t.pricing.eyebrow}</BREyebrow>
            <h1
              className="br-display"
              style={{
                fontSize: 'clamp(52px, 9vw, 112px)',
                lineHeight: 0.9,
                letterSpacing: '-0.05em',
                margin: '18px 0 18px',
                maxWidth: 820,
              }}
            >
              <span>{t.pricing.title}</span>{' '}
              <span style={{ color: '#FFD700' }}>{headlinePrice}</span>{' '}
              <span>{t.pricing.titleSuffix}</span>
            </h1>
            <p style={{ margin: '0 0 14px', maxWidth: 720, color: 'rgba(0,0,0,0.75)', lineHeight: 1.6, fontSize: 17 }}>
              {copy.lead}
            </p>
            <p style={{ margin: 0, maxWidth: 720, color: 'rgba(0,0,0,0.58)', lineHeight: 1.65, fontSize: 15 }}>
              {copy.body}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 14,
              alignSelf: 'stretch',
            }}
          >
            <div
              className="br-card"
              style={{
                padding: 20,
                borderRadius: 24,
                background: 'rgba(255,255,255,0.76)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                <div>
                  <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.48)' }}>{copy.metaModels}</div>
                  <div className="br-display" style={{ marginTop: 10, fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 0.95 }}>{groups.length || '—'}</div>
                </div>
                <div>
                  <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.48)' }}>{copy.metaBands}</div>
                  <div className="br-display" style={{ marginTop: 10, fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 0.95 }}>{rates.length || '—'}</div>
                </div>
                <div>
                  <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.48)' }}>{copy.metaValue}</div>
                  <div className="br-display" style={{ marginTop: 10, fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 0.95 }}>
                          {lowestDailyUsd ? `${minDailyLabel}${copy.perDay}` : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 12,
              }}
            >
              {includedItems.map((item, index) => (
                <div
                  key={item.label}
                  className="br-card"
                  style={{
                    padding: '18px 16px',
                    borderRadius: 18,
                    background: index === 0 ? '#111' : 'rgba(255,255,255,0.78)',
                    color: index === 0 ? '#fff' : '#0A0A0F',
                    borderColor: index === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    boxShadow: '0 18px 50px -30px rgba(0,0,0,0.24)',
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: index === 0 ? 'rgba(255,215,0,0.14)' : 'rgba(255,215,0,0.12)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 14,
                    }}
                  >
                    <item.icon size={20} color={index === 0 ? '#FFD700' : '#0A0A0F'} />
                  </div>
                  <div className="br-display" style={{ fontSize: 19, lineHeight: 1.12, letterSpacing: '-0.02em' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="price-grid" style={{ padding: 'clamp(32px, 5vw, 48px) clamp(16px, 5vw, 48px) clamp(64px, 7vw, 88px)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              alignItems: 'end',
              marginBottom: 28,
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <BREyebrow>{copy.cardsIntro}</BREyebrow>
              <h2 className="br-display" style={{ fontSize: 'clamp(38px, 6vw, 68px)', lineHeight: 0.96, letterSpacing: '-0.04em', margin: '14px 0 10px' }}>
                {copy.cardsTitle}
              </h2>
              <p style={{ margin: 0, color: 'rgba(0,0,0,0.6)', lineHeight: 1.65, fontSize: 15 }}>{copy.cardsBody}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <BROutline href={catalogPath}>{t.nav.catalog}</BROutline>
              <BRPrimary href={bookingPath}>{t.nav.book}</BRPrimary>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="br-card" style={{ overflow: 'hidden', borderRadius: 24 }}>
                  <div className="br-skeleton" style={{ height: 240, borderRadius: 0 }} />
                  <div style={{ padding: 22 }}>
                    <div className="br-skeleton" style={{ height: 12, width: '36%' }} />
                    <div className="br-skeleton" style={{ height: 30, marginTop: 10, width: '70%' }} />
                    <div className="br-skeleton" style={{ height: 72, marginTop: 18, borderRadius: 18 }} />
                    <div className="br-skeleton" style={{ height: 72, marginTop: 12, borderRadius: 18 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              className="br-card"
              style={{
                padding: '32px clamp(20px, 4vw, 36px)',
                borderRadius: 24,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,243,243,0.9) 100%)',
                borderColor: 'rgba(185,28,28,0.12)',
                color: '#991B1B',
              }}
            >
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.16em', opacity: 0.75 }}>{copy.error}</div>
              <div className="br-display" style={{ marginTop: 10, fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1 }}>{error}</div>
            </div>
          ) : groups.length === 0 ? (
            <div
              className="br-card"
              style={{
                padding: '32px clamp(20px, 4vw, 36px)',
                borderRadius: 24,
                background: 'linear-gradient(180deg, #ffffff 0%, #f7f5ef 100%)',
              }}
            >
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'rgba(0,0,0,0.5)' }}>{copy.empty}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {groups.map((group) => {
                const cc = group.scooter?.cc ? `${group.scooter.cc}CC` : null;
                const typeLabel = group.scooter?.type || copy.scooter;
                const minDaily = group.minDailyIdr != null ? formatPriceIdr(group.minDailyIdr) : formatPrice(group.minDailyUsd);
                const minDailyApprox = formatApprox(group.minDailyUsd);

                return (
                  <div
                    key={group.scooterId}
                    className="br-card br-scooter-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      borderRadius: 24,
                      background: 'linear-gradient(180deg, #ffffff 0%, #f7f5ef 100%)',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        minHeight: 248,
                        overflow: 'hidden',
                        background:
                          'radial-gradient(circle at 50% 58%, rgba(255,215,0,0.18) 0%, rgba(255,215,0,0) 56%), linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(247,245,239,0.4) 100%)',
                      }}
                    >
                      {group.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={group.imageUrl}
                          alt={group.title}
                          loading="lazy"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            objectPosition: group.imageObjectPosition || '50% bottom',
                            padding: '20px 18px 26px',
                            filter: 'drop-shadow(0 24px 18px rgba(0,0,0,0.16))',
                            transition: 'transform 600ms var(--br-easing)',
                          }}
                          className="br-scooter-card-img"
                        />
                      ) : (
                        <BRPhoto tone={group.scooter?.photo || 'sand'} label={`${group.slug.toUpperCase()} · ${cc || copy.scooter}`} style={{ position: 'absolute', inset: 0 }} />
                      )}

                      <div
                        aria-hidden
                        style={{
                          position: 'absolute',
                          left: '10%',
                          right: '10%',
                          bottom: '7%',
                          height: 18,
                          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 70%)',
                          filter: 'blur(2px)',
                        }}
                      />

                      <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span
                          className="br-mono"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '7px 10px',
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.82)',
                            border: '1px solid rgba(0,0,0,0.08)',
                            fontSize: 10,
                            letterSpacing: '0.12em',
                          }}
                        >
                          {typeLabel.toUpperCase()}
                          {cc ? <span style={{ color: 'rgba(0,0,0,0.45)' }}>· {cc}</span> : null}
                        </span>
                      </div>

                      <Link
                        href={`/scooter/${group.routeId}`}
                        className="br-mono"
                        style={{
                          position: 'absolute',
                          top: 14,
                          right: 14,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '9px 12px',
                          borderRadius: 999,
                          background: '#111',
                          color: '#fff',
                          textDecoration: 'none',
                          fontSize: 11,
                          letterSpacing: '0.08em',
                        }}
                      >
                        {copy.open}
                        <ArrowRightIcon size={14} color="#FFD700" />
                      </Link>
                    </div>

                    <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'rgba(0,0,0,0.46)' }}>
                            {copy.scooter}
                          </div>
                          <h3 className="br-display" style={{ margin: '8px 0 0', fontSize: 28, lineHeight: 0.98, letterSpacing: '-0.03em' }}>
                            {group.title}
                          </h3>
                        </div>

                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: 18,
                            background: '#111',
                            color: '#fff',
                            minWidth: 126,
                          }}
                        >
                          <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.58)' }}>{copy.from}</div>
                          <div className="br-display" style={{ marginTop: 6, fontSize: 28, lineHeight: 0.95, letterSpacing: '-0.04em' }}>
                            {minDaily}
                          </div>
                          <div className="br-mono" style={{ marginTop: 4, fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.58)' }}>
                            {copy.perDay}
                          </div>
                          {minDailyApprox ? (
                            <div className="br-mono" style={{ marginTop: 2, fontSize: 10, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.46)' }}>
                              {minDailyApprox}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.46)' }}>
                          {copy.rateBands} · {group.rates.length}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: 10 }}>
                        {group.rates.map((rate) => {
                          const dailyIdr = effectiveDailyPriceIdr(rate);
                          const convertedTotal = rate.price_idr != null ? formatPriceIdr(rate.price_idr) : formatPrice(toNumber(rate.price_usd));
                          const convertedDaily = dailyIdr != null ? formatPriceIdr(dailyIdr) : formatPrice(effectiveDailyPrice(rate));
                          const convertedTotalApprox = formatApprox(toNumber(rate.price_usd));
                          const isFeatured = group.featuredRateId === rate.id;

                          return (
                            <div
                              key={rate.id}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) auto',
                                gap: 12,
                                alignItems: 'center',
                                padding: '14px 14px 13px',
                                borderRadius: 18,
                                background: isFeatured ? '#111' : 'rgba(255,255,255,0.8)',
                                color: isFeatured ? '#fff' : '#111',
                                border: `1px solid ${isFeatured ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', opacity: 0.7 }}>
                                  {formatRateRange(rate.min_days, rate.max_days, locale)}
                                </div>
                                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.4, opacity: 0.86 }}>
                                  {formatBillingLabel(rate.billing_period_days, locale)}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                {isFeatured ? (
                                  <div
                                    className="br-mono"
                                    style={{
                                      marginBottom: 6,
                                      fontSize: 10,
                                      letterSpacing: '0.14em',
                                      color: '#FFD700',
                                    }}
                                  >
                                    {copy.bestValue}
                                  </div>
                                ) : null}
                                <div className="br-display" style={{ fontSize: 28, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
                                  {convertedTotal}
                                </div>
                                <div className="br-mono" style={{ marginTop: 4, fontSize: 10, letterSpacing: '0.1em', opacity: 0.7 }}>
                                  {convertedDaily}
                                  {copy.perDay}
                                </div>
                                {convertedTotalApprox ? (
                                  <div className="br-mono" style={{ marginTop: 2, fontSize: 10, letterSpacing: '0.06em', opacity: 0.55 }}>
                                    {convertedTotalApprox}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Link
                          href={`/scooter/${group.routeId}`}
                          className="br-btn br-btn-primary"
                          style={{ flex: '1 1 200px', textDecoration: 'none', minHeight: 48 }}
                        >
                          {copy.book}
                        </Link>
                        <Link
                          href={`/scooter/${group.routeId}`}
                          className="br-btn br-btn-outline"
                          style={{ flex: '1 1 170px', textDecoration: 'none', minHeight: 48 }}
                        >
                          {copy.open}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          padding: '0 clamp(16px, 5vw, 48px) clamp(72px, 7vw, 96px)',
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            borderRadius: 32,
            overflow: 'hidden',
            background:
              'radial-gradient(circle at right top, rgba(255,215,0,0.2), transparent 26%), linear-gradient(135deg, #0b0b0f 0%, #17171c 100%)',
            color: '#fff',
            padding: 'clamp(24px, 5vw, 40px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            alignItems: 'end',
          }}
        >
          <div style={{ maxWidth: 700 }}>
            <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: '#FFD700', marginBottom: 14 }}>
              {copy.ctaEyebrow}
            </div>
            <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.95, letterSpacing: '-0.04em' }}>
              {copy.ctaTitle}
            </h2>
            <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,0.68)', fontSize: 16, lineHeight: 1.65 }}>
              {copy.ctaBody}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="br-btn br-btn-primary"
              style={{ textDecoration: 'none', minHeight: 48 }}
            >
              {copy.ctaPrimary}
            </a>
            <a href={catalogPath} className="br-btn br-btn-outline dark" style={{ textDecoration: 'none', minHeight: 48 }}>
              {t.cta.secondary}
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
