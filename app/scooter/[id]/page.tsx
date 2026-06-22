'use client';
import { CSSProperties, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BRPhoto, BREyebrow, BRPrimary } from '@/components/BR';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { formatGroupedAmount, useCurrency } from '@/lib/i18n/CurrencyProvider';
import {
  EngineIcon,
  FuelIcon,
  HelmetIcon,
  LayersIcon,
  PaletteIcon,
  StorageIcon,
  SparkIcon,
  renderAddonIcon,
} from '@/components/Icons';
import { endpoints, ApiAddon, ApiScooterDetail, unwrapList } from '@/lib/endpoints';
import { mediaUrl } from '@/lib/api';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { BR_ADDONS } from '@/lib/data';
import { BR_SCOOTERS } from '@/lib/data';
import { mapApiScooterDetail, DisplayScooter, pickTone, resolveScooterImage, resolveScooterRouteId } from '@/lib/displayScooter';
import { formatBillingLabel, formatRateRange } from '@/lib/rentalRates';
import { useSiteContentPreview } from '@/lib/siteContentPreview';

type AddonView = { id: string | number; apiId?: number; name: string; icon: string; price: number };

const FALLBACK_TONES = ['sand', 'jungle', 'sunset', 'ocean'];
const richTextStyle = {
  margin: '10px 0 0',
  lineHeight: 1.65,
  fontSize: 14,
  color: 'rgba(0,0,0,0.55)',
  whiteSpace: 'pre-wrap',
} satisfies CSSProperties;

function addonPriceValue(addon: ApiAddon): number {
  return Number(addon.priceUSD ?? addon.price_usd ?? addon.price ?? 0);
}

function getAddonName(addon: ApiAddon, locale: string): string {
  if (addon.translations && addon.translations.length > 0) {
    const translation = addon.translations.find((t) => t.language === locale);
    if (translation?.name) return translation.name;
  }
  return addon.name;
}

export default function ScooterDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useLocale();
  const { marker } = useSiteContentPreview();
  const { convertPrice, symbol, currency } = useCurrency();
  const [scooter, setScooter] = useState<DisplayScooter | null>(null);
  const [addons, setAddons] = useState<AddonView[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [description, setDescription] = useState('');
  const [rentalTerms, setRentalTerms] = useState('');
  const [characteristics, setCharacteristics] = useState<{
    engine_cc?: number;
    transmission?: string;
    fuel_consumption?: string;
    year?: number;
    trunk?: string;
    helmets_count?: number;
    color?: string;
  }>({});
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<ApiScooterDetail['pricing_tiers']>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    const id = params?.id;
    if (!id) return;

    (async () => {
      try {
        const detail = await endpoints.scooter(resolveScooterRouteId(id, id) || id, locale);
        if (cancelled) return;
        const mapped = mapApiScooterDetail(detail);
        setScooter(mapped);
        setDescription(detail.full_description || '');
        setRentalTerms(detail.rental_terms || '');
        setCharacteristics(detail.characteristics || {});
        setPricingTiers(detail.pricing_tiers || []);
        const imgs = (detail.gallery || []).map((g) => mediaUrl(g.image)).filter(Boolean);
        if (detail.main_image) imgs.unshift(mediaUrl(detail.main_image));
        const localImage = resolveScooterImage(detail.slug || detail.id, detail.title);
        if (!imgs.length && localImage) imgs.unshift(localImage);
        setGallery(Array.from(new Set(imgs)));
        setPhotoIdx(0);
        const apiAddons: AddonView[] = (detail.available_addons || []).map((a: ApiAddon) => ({
          id: a.id, apiId: a.id, name: getAddonName(a, locale), icon: a.icon || 'spark', price: addonPriceValue(a),
        }));
        if (apiAddons.length === 0) {
          try {
            const all = unwrapList(await endpoints.addons(locale)).map((a) => ({
              id: a.id, apiId: a.id, name: getAddonName(a, locale), icon: a.icon || 'spark', price: addonPriceValue(a),
            }));
            setAddons(all);
          } catch {
            setAddons(BR_ADDONS.map((a) => ({ id: a.id, name: a.name, icon: a.icon, price: a.price })));
          }
        } else {
          setAddons(apiAddons);
        }
        setLoading(false);
      } catch (e) {
        const fallback = BR_SCOOTERS.find((s) => s.id === id);
        if (fallback) {
          setScooter({ ...fallback, photo: pickTone(fallback.id) });
          setDescription('');
          setRentalTerms('');
          setCharacteristics({});
          setPricingTiers([]);
          setPhotoIdx(0);
          setAddons(BR_ADDONS.map((a) => ({ id: a.id, name: a.name, icon: a.icon, price: a.price })));
          setLoading(false);
        } else {
          setNotFound(true);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [params, locale]);

  const fg = '#000';
  const bg = '#fff';
  const sub = 'rgba(0,0,0,0.55)';
  const surf = '#F5F5F5';
  const border = 'rgba(0,0,0,0.08)';
  const addonTotal = useMemo(
    () =>
      selectedAddOnIds.reduce((sum, id) => {
        const addon = addons.find((item) => Number(item.id) === id);
        return sum + (addon?.price || 0);
      }, 0),
    [addons, selectedAddOnIds]
  );
  const total = Number((scooter?.price || 0) + addonTotal);
  const baseDailyPrice = Number(scooter?.price || 0);
  // Headline price is always IDR — the real price the admin set. The hint next to it
  // shows the equivalent in whatever currency the switcher is set to.
  const displayDailyPriceLabel = `Rp ${formatGroupedAmount(convertPrice(baseDailyPrice, 'IDR'), 0)}`;
  const dailyBillingLabel = formatBillingLabel(1, locale);
  const approxUsdLabel = currency === 'IDR'
    ? null
    : `≈ ${symbol} ${formatGroupedAmount(convertPrice(baseDailyPrice), 2)}`;

  const goBook = () => {
    if (!scooter) return;
    const query = new URLSearchParams();
    if (scooter.apiId) query.set('scooter_id', String(scooter.apiId));
    query.set('route_id', String(params?.id || scooter.apiId || scooter.id));
    query.set('slug', String(scooter.id));
    query.set('name', scooter.name);
    query.set('price', String(scooter.price));
    const addonIds = selectedAddOnIds.join(',');
    if (addonIds) query.set('addons', addonIds);
    router.push(`/booking?${query.toString()}`);
  };

  function toggleAddOn(addOnId: number) {
    setSelectedAddOnIds((current) =>
      current.includes(addOnId) ? current.filter((value) => value !== addOnId) : [...current, addOnId]
    );
  }

  if (loading) {
    return (
      <div style={{ background: bg, color: fg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader />
        <div className="br-mono" style={{ padding: 80, textAlign: 'center', color: sub }}>{t.common.loading}</div>
      </div>
    );
  }

  if (notFound || !scooter) {
    return (
      <div style={{ background: bg, color: fg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader />
        <div style={{ padding: 80, textAlign: 'center' }}>
          <h1 className="br-display" style={{ fontSize: 48 }}><span {...marker('detail.notFound')}>{t.detail.notFound}</span></h1>
          <Link href="/catalog" className="br-mono" style={{ color: '#000', marginTop: 24, display: 'inline-block' }}><span {...marker('detail.back')}>{t.detail.back}</span></Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const photoSrc = gallery[photoIdx];
  const fallbackTone = FALLBACK_TONES[photoIdx % FALLBACK_TONES.length];
  const breadcrumbTypeCode = scooter.typeCode || scooter.type.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const breadcrumbScooterHref = `/scooter/${resolveScooterRouteId(scooter.id, scooter.name) || scooter.id}`;
  const breadcrumbLinkStyle = {
    color: sub,
    textDecoration: 'none',
    transition: 'color 160ms ease',
  } satisfies CSSProperties;
  const specItems = [
    [EngineIcon, t.detail.engine, characteristics.engine_cc ? `${characteristics.engine_cc}cc` : scooter.cc ? `${scooter.cc}cc` : '—'],
    [SparkIcon, t.detail.transmission, characteristics.transmission || '—'],
    [FuelIcon, t.detail.fuel, characteristics.fuel_consumption ? String(characteristics.fuel_consumption) : '—'],
    [SparkIcon, t.detail.year, characteristics.year ? String(characteristics.year) : '—'],
    [StorageIcon, t.detail.storage, characteristics.trunk || '—'],
    [HelmetIcon, t.detail.helmets, characteristics.helmets_count ? String(characteristics.helmets_count) : '—'],
    [PaletteIcon, t.detail.color, characteristics.color || '—'],
    [LayersIcon, t.detail.vehicleType, scooter.type || '—'],
  ] as const;

  return (
    <div className="br-has-mobile-cta" style={{ background: bg, color: fg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />
      <div className="br-detail-breadcrumb" style={{ padding: '12px 40px', borderBottom: `1px solid ${border}` }}>
        <nav
          aria-label="Breadcrumb"
          className="br-mono"
          style={{ fontSize: 11, color: sub, letterSpacing: '0.12em', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, rowGap: 4 }}
        >
          <Link href="/catalog" style={breadcrumbLinkStyle}>
            {t.nav.catalog}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/catalog?type=${encodeURIComponent(breadcrumbTypeCode)}`} style={breadcrumbLinkStyle}>
            {scooter.type.toUpperCase()}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={breadcrumbScooterHref} aria-current="page" style={{ ...breadcrumbLinkStyle, color: '#000' }}>
            {scooter.name.toUpperCase()}
          </Link>
        </nav>
      </div>

      <div className="br-detail-shell" style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: 0 }}>
        <div className="br-detail-media-column" style={{ padding: '40px 0 40px 40px' }}>
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <div
              className="br-detail-main-photo"
              style={{
                width: '100%',
                height: 540,
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: 'linear-gradient(180deg, #fbfaf6 0%, #f1ebdc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 20px 28px',
                overflow: 'hidden',
              }}
            >
              <img
                src={photoSrc}
                alt={scooter.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center bottom',
                  display: 'block',
                }}
              />
            </div>
          ) : !gallery.length ? (
            <BRPhoto tone={fallbackTone} label={`${scooter.name.toUpperCase()} · PREVIEW`} className="br-detail-main-photo" style={{ height: 540, borderRadius: 12 }} />
          ) : (
            <button
              type="button"
              onClick={() => setPhotoIdx(0)}
              className="br-detail-main-photo"
              style={{
                width: '100%',
                height: 540,
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: 'linear-gradient(180deg, #F8F6F0 0%, #EEE8D8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: gallery.length ? 'pointer' : 'default',
                padding: 24,
              }}
            >
              <div style={{ textAlign: 'center', maxWidth: 340 }}>
                <div className="br-mono" style={{ fontSize: 11, color: sub, letterSpacing: '0.14em' }}>
                  <span {...marker(gallery.length ? 'detail.photoGallery' : 'detail.photoPreview')}>{gallery.length ? t.detail.photoGallery : t.detail.photoPreview}</span>
                </div>
                <div className="br-display" style={{ fontSize: 36, lineHeight: 1, marginTop: 12 }}>
                  {gallery.length ? <span {...marker('detail.choosePhoto')}>{t.detail.choosePhoto}</span> : scooter.name}
                </div>
                <div {...marker(gallery.length ? 'detail.openThumbnailHint' : 'detail.photoUnavailable')} style={{ marginTop: 14, fontSize: 14, color: sub, lineHeight: 1.6 }}>
                  {gallery.length ? t.detail.openThumbnailHint : t.detail.photoUnavailable}
                </div>
              </div>
            </button>
          )}
          <div className="br-detail-thumbs" style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {(gallery.length ? gallery : FALLBACK_TONES).map((src, i) => (
              <button key={i} onClick={() => setPhotoIdx(i)}
                style={{ flex: 1, height: 88, padding: 0, border: photoIdx === i ? `2px solid #000` : `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'linear-gradient(180deg, #fbfaf6 0%, #f1ebdc 100%)' }}>
                {gallery.length ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', display: 'block', padding: '6px 8px 10px' }} />
                ) : (
                  <BRPhoto tone={src} style={{ height: '100%' }} />
                )}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 48 }}>
            <BREyebrow><span {...marker('detail.specs')}>{t.detail.specs}</span></BREyebrow>
            <div className="br-detail-specs" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginTop: 16, background: border }}>
              {specItems.map(([Icon, l, v], i) => (
                <div key={i} style={{ background: bg, padding: '20px 16px' }}>
                  <div style={{ color: '#FFD700' }}><Icon size={22} color="#D4A400" /></div>
                  <div className="br-mono" style={{ fontSize: 10, color: sub, marginTop: 8, letterSpacing: '0.12em' }}>{l.toUpperCase()}</div>
                  <div className="br-display" style={{ fontSize: 18, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            {(description || rentalTerms) && (
              <div className="br-detail-text-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 20 }}>
                {description && (
                  <div style={{ background: surf, borderRadius: 12, padding: 18 }}>
                    <BREyebrow><span {...marker('detail.descriptionTitle')}>{t.detail.descriptionTitle}</span></BREyebrow>
                    <p style={richTextStyle}>{description}</p>
                  </div>
                )}
                {rentalTerms && (
                  <div style={{ background: surf, borderRadius: 12, padding: 18 }}>
                    <BREyebrow><span {...marker('detail.rentalTermsTitle')}>{t.detail.rentalTermsTitle}</span></BREyebrow>
                    <p style={richTextStyle}>{rentalTerms}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="br-detail-side-column" style={{ padding: 40 }}>
          <div className="br-detail-side" style={{ background: surf, borderRadius: 16, padding: 28, position: 'sticky', top: 96 }}>
            <BREyebrow>{scooter.type.toUpperCase()}{scooter.cc ? ` · ${scooter.cc}CC` : ''} · {scooter.tag}</BREyebrow>
            <h1 className="br-display" style={{ fontSize: 48, lineHeight: 0.98, margin: '12px 0 4px', letterSpacing: '-0.03em' }}>{scooter.name}</h1>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginTop: 16,
                padding: '16px 18px',
                borderRadius: 14,
                background: bg,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="br-display" style={{ fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
                  {displayDailyPriceLabel} / {dailyBillingLabel}
                </div>
              </div>
              {approxUsdLabel ? (
                <div className="br-mono" style={{ fontSize: 14, color: fg, whiteSpace: 'nowrap' }}>
                  {approxUsdLabel}
                </div>
              ) : null}
            </div>

            {pricingTiers && pricingTiers.length > 0 ? (
              <div style={{ marginTop: 20, display: 'grid', gap: 8 }}>
                <BREyebrow>Rates</BREyebrow>
                {pricingTiers.map((tier) => (
                  <div
                    key={tier.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      alignItems: 'baseline',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: bg,
                    }}
                  >
                    <span className="br-mono" style={{ fontSize: 12, color: sub }}>
                      {formatRateRange(tier.min_days, tier.max_days, locale)} · {formatBillingLabel(tier.billing_period_days, locale)}
                    </span>
                    <span className="br-mono" style={{ fontSize: 12, color: fg, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <span>
                        Rp {formatGroupedAmount(tier.price_idr != null ? Number(tier.price_idr) : convertPrice(Number(tier.price_usd || 0), 'IDR'), 0)}
                      </span>
                      {currency !== 'IDR' ? (
                        <span style={{ fontSize: 10, opacity: 0.65 }}>
                          ≈ {symbol}{formatGroupedAmount(convertPrice(Number(tier.price_usd || 0)), 2)}
                        </span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <div style={{ marginTop: 24 }}>
              <BREyebrow><span {...marker('detail.addonsTitle')}>{t.detail.addonsTitle}</span></BREyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {addons.map((a) => {
                  const selected = selectedAddOnIds.includes(Number(a.id));
                  return (
                    <button
                      key={String(a.id)}
                      onClick={() => toggleAddOn(Number(a.id))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        background: bg,
                        borderRadius: 10,
                        padding: '10px 14px',
                        border: selected ? `1px solid #FFD700` : `1px solid transparent`,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: surf, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {renderAddonIcon(a.name, a.icon, { size: 18, color: '#000' })}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</div>
                        <div className="br-mono" style={{ fontSize: 11, color: sub }}>
                          {symbol}
                          {(Math.round(convertPrice(a.price) * 100) / 100).toFixed(2)}/{t.common.day}
                        </div>
                      </div>
                      <div
                        className="br-mono"
                        style={{
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: `1px solid ${selected ? '#FFD700' : border}`,
                          background: selected ? '#FFD700' : 'transparent',
                          color: selected ? '#000' : fg,
                          fontSize: 11,
                          letterSpacing: '0.08em',
                        }}
                      >
                        <span {...marker(selected ? 'detail.selected' : 'detail.add')}>{selected ? t.detail.selected : t.detail.add}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 16, borderTop: `1px solid ${border}` }}>
                <span {...marker('detail.total')} className="br-display" style={{ fontSize: 16 }}>{t.detail.total}</span>
                <span style={{ background: '#FFD700', color: '#000', padding: '6px 14px', borderRadius: 999, fontFamily: 'var(--br-mono)', fontSize: 22, fontWeight: 600 }}>
                  {symbol}
                  {formatGroupedAmount(convertPrice(total), currency === 'IDR' ? 0 : 2)}
                </span>
              </div>
              <BRPrimary onClick={goBook} full style={{ marginTop: 20, padding: '18px', fontSize: 15 }}><span {...marker('detail.reserve')}>{t.detail.reserve}</span></BRPrimary>
              <div {...marker('detail.cancel')} className="br-mono" style={{ fontSize: 10, color: sub, marginTop: 12, textAlign: 'center', letterSpacing: '0.1em' }}>{t.detail.cancel}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="br-mobile-sticky-cta">
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span className="br-mono" style={{ fontSize: 10, color: sub, letterSpacing: '0.12em' }}><span {...marker('detail.total')}>{t.detail.total.toUpperCase()}</span> · <span {...marker('detail.withAddons')}>{t.detail.withAddons}</span></span>
          <span className="br-display" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
            {symbol}
            {formatGroupedAmount(convertPrice(total), currency === 'IDR' ? 0 : 2)}
          </span>
        </div>
        <BRPrimary onClick={goBook} style={{ flexShrink: 0, padding: '14px 22px' }}><span {...marker('detail.reserve')}>{t.detail.reserve}</span> →</BRPrimary>
      </div>

      <SiteFooter />
    </div>
  );
}
