'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BRPhoto, BREyebrow, BRPrice, BRPrimary } from '@/components/BR';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { endpoints, ApiAddon, ApiBookingQuote, unwrapList } from '@/lib/endpoints';
import { ApiError, mediaUrl } from '@/lib/api';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { BR_ADDONS } from '@/lib/data';
import { BR_SCOOTERS } from '@/lib/data';
import { mapApiScooterDetail, DisplayScooter, pickTone } from '@/lib/displayScooter';

type AddonView = { id: string | number; apiId?: number; name: string; icon: string; price: number };

const FALLBACK_TONES = ['sand', 'jungle', 'sunset', 'ocean'];
const detailQuoteCache = new Map<string, ApiBookingQuote>();

export default function ScooterDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale, tr } = useLocale();
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
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
  const [startDate, setStartDate] = useState(defaultStart.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<number[]>([]);
  const [quote, setQuote] = useState<ApiBookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    const id = params?.id;
    if (!id) return;

    (async () => {
      try {
        const detail = await endpoints.scooter(id, locale);
        if (cancelled) return;
        const mapped = mapApiScooterDetail(detail);
        setScooter(mapped);
        setDescription(detail.full_description || '');
        setRentalTerms(detail.rental_terms || '');
        setCharacteristics(detail.characteristics || {});
        const imgs = (detail.gallery || []).map((g) => mediaUrl(g.image)).filter(Boolean);
        if (detail.main_image) imgs.unshift(mediaUrl(detail.main_image));
        setGallery(Array.from(new Set(imgs)));
        const apiAddons: AddonView[] = (detail.available_addons || []).map((a: ApiAddon) => ({
          id: a.id, apiId: a.id, name: a.name, icon: a.icon || '◯', price: Number(a.price_usd ?? a.price ?? 0),
        }));
        if (apiAddons.length === 0) {
          try {
            const all = unwrapList(await endpoints.addons(locale)).map((a) => ({
              id: a.id, apiId: a.id, name: a.name, icon: a.icon || '◯', price: Number(a.price_usd ?? a.price ?? 0),
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
  const days = Math.max(
    1,
    Math.ceil((new Date(`${endDate}T${endTime}:00`).getTime() - new Date(`${startDate}T${startTime}:00`).getTime()) / (1000 * 60 * 60 * 24))
  );
  const dateIsValid = new Date(`${endDate}T${endTime}:00`).getTime() > new Date(`${startDate}T${startTime}:00`).getTime();
  const quoteRequest = useMemo(() => {
    if (!scooter?.apiId || !dateIsValid) return null;
    return {
      scooter_id: Number(scooter.apiId),
      start_datetime: `${startDate}T${startTime}:00`,
      end_datetime: `${endDate}T${endTime}:00`,
      add_on_ids: selectedAddOnIds.length ? selectedAddOnIds : undefined,
      payment_method: 'online_card' as const,
      currency: 'USD',
    };
  }, [scooter?.apiId, dateIsValid, startDate, startTime, endDate, endTime, selectedAddOnIds]);
  const quoteRequestKey = useMemo(() => (quoteRequest ? JSON.stringify(quoteRequest) : null), [quoteRequest]);

  useEffect(() => {
    if (!quoteRequest || !quoteRequestKey) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    const cached = detailQuoteCache.get(quoteRequestKey);
    if (cached) {
      setQuote(cached);
      setQuoteLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setQuoteLoading(true);
      endpoints.bookingCalculate(quoteRequest, controller.signal)
        .then((nextQuote) => {
          detailQuoteCache.set(quoteRequestKey, nextQuote);
          setQuote(nextQuote);
          setQuoteError(null);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          setQuote(null);
          setQuoteError(error instanceof ApiError ? error.message : t.auth.error);
        })
        .finally(() => {
          if (!controller.signal.aborted) setQuoteLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [quoteRequest, quoteRequestKey, t.auth.error]);

  const subtotal = Number(quote?.base_price || (scooter?.price || 0) * days);
  const addonTotal = Number(quote?.add_ons_price || 0);
  const total = Number(quote?.total_price || subtotal + addonTotal);

  const goBook = () => {
    if (!scooter) return;
    const query = new URLSearchParams();
    if (scooter.apiId) query.set('scooter_id', String(scooter.apiId));
    query.set('route_id', String(params?.id || scooter.apiId || scooter.id));
    query.set('slug', String(scooter.id));
    query.set('name', scooter.name);
    query.set('price', String(scooter.price));
    query.set('days', String(days));
    query.set('start_date', startDate);
    query.set('end_date', endDate);
    query.set('start_time', startTime);
    query.set('end_time', endTime);
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
      <div style={{ background: bg, color: fg, minHeight: '100vh' }}>
        <SiteHeader />
        <div className="br-mono" style={{ padding: 80, textAlign: 'center', color: sub }}>{t.common.loading}</div>
      </div>
    );
  }

  if (notFound || !scooter) {
    return (
      <div style={{ background: bg, color: fg, minHeight: '100vh' }}>
        <SiteHeader />
        <div style={{ padding: 80, textAlign: 'center' }}>
          <h1 className="br-display" style={{ fontSize: 48 }}>{t.detail.notFound}</h1>
          <Link href="/catalog" className="br-mono" style={{ color: '#000', marginTop: 24, display: 'inline-block' }}>{t.detail.back}</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const photoSrc = gallery[photoIdx];
  const specItems = [
    ['↻', t.detail.engine, characteristics.engine_cc ? `${characteristics.engine_cc}cc` : scooter.cc ? `${scooter.cc}cc` : '—'],
    ['⚙', 'Transmission', characteristics.transmission || '—'],
    ['⛽', 'Fuel', characteristics.fuel_consumption || '—'],
    ['◷', 'Year', characteristics.year ? String(characteristics.year) : '—'],
    ['☐', t.detail.storage, characteristics.trunk || '—'],
    ['◐', t.detail.helmets, characteristics.helmets_count ? String(characteristics.helmets_count) : '—'],
    ['✦', 'Color', characteristics.color || '—'],
    ['◎', 'Type', scooter.type || '—'],
  ] as const;

  return (
    <div style={{ background: bg, color: fg, minHeight: 800 }}>
      <SiteHeader />
      <div className="br-detail-breadcrumb" style={{ padding: '12px 40px', borderBottom: `1px solid ${border}` }}>
        <span className="br-mono" style={{ fontSize: 11, color: sub, letterSpacing: '0.12em' }}>
          {t.nav.catalog} / {scooter.type.toUpperCase()} / {scooter.name.toUpperCase()}
        </span>
      </div>

      <div className="br-detail-shell" style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: 0 }}>
        <div className="br-detail-media-column" style={{ padding: '40px 0 40px 40px' }}>
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt={scooter.name} className="br-detail-main-photo" style={{ width: '100%', height: 540, objectFit: 'cover', borderRadius: 12 }} />
          ) : (
            <BRPhoto tone={FALLBACK_TONES[photoIdx % FALLBACK_TONES.length]} label={`${scooter.name.toUpperCase()} · FRAME ${photoIdx + 1}`} className="br-detail-main-photo" style={{ height: 540, borderRadius: 12 }} />
          )}
          <div className="br-detail-thumbs" style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {(gallery.length ? gallery : FALLBACK_TONES).map((src, i) => (
              <button key={i} onClick={() => setPhotoIdx(i)}
                style={{ flex: 1, height: 88, padding: 0, border: photoIdx === i ? `2px solid #000` : `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'none' }}>
                {gallery.length ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <BRPhoto tone={src} style={{ height: '100%' }} />
                )}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 48 }}>
            <BREyebrow>{t.detail.specs}</BREyebrow>
            <div className="br-detail-specs" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginTop: 16, background: border }}>
              {specItems.map(([icon, l, v], i) => (
                <div key={i} style={{ background: bg, padding: '20px 16px' }}>
                  <div style={{ fontSize: 22, color: '#FFD700' }}>{icon}</div>
                  <div className="br-mono" style={{ fontSize: 10, color: sub, marginTop: 8, letterSpacing: '0.12em' }}>{l.toUpperCase()}</div>
                  <div className="br-display" style={{ fontSize: 18, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            {(description || rentalTerms) && (
              <div className="br-detail-text-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 20 }}>
                {description && (
                  <div style={{ background: surf, borderRadius: 12, padding: 18 }}>
                    <BREyebrow>Description</BREyebrow>
                    <p style={{ margin: '10px 0 0', lineHeight: 1.65, fontSize: 14, color: sub }}>{description}</p>
                  </div>
                )}
                {rentalTerms && (
                  <div style={{ background: surf, borderRadius: 12, padding: 18 }}>
                    <BREyebrow>Rental Terms</BREyebrow>
                    <p style={{ margin: '10px 0 0', lineHeight: 1.65, fontSize: 14, color: sub }}>{rentalTerms}</p>
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
              <BRPrice amount={scooter.price} size={36} />
              <span className="br-mono" style={{ fontSize: 12, color: sub }}>
                · {tr(t.detail.days, { n: quote?.rental_days || days })} · ${subtotal.toFixed(2)}
              </span>
            </div>

            <div className="br-detail-dates-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 24 }}>
              <div style={{ background: bg, padding: 14, borderRadius: 10 }}>
                <div className="br-mono" style={{ fontSize: 9, color: sub, letterSpacing: '0.14em' }}>{t.detail.pickUp}</div>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ marginTop: 8, width: '100%', border: `1px solid ${border}`, borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--br-mono)' }} />
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ marginTop: 8, width: '100%', border: `1px solid ${border}`, borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--br-mono)' }} />
              </div>
              <div style={{ background: bg, padding: 14, borderRadius: 10 }}>
                <div className="br-mono" style={{ fontSize: 9, color: sub, letterSpacing: '0.14em' }}>{t.detail.return}</div>
                <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} style={{ marginTop: 8, width: '100%', border: `1px solid ${border}`, borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--br-mono)' }} />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ marginTop: 8, width: '100%', border: `1px solid ${border}`, borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--br-mono)' }} />
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <BREyebrow>{t.detail.addonsTitle}</BREyebrow>
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
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: surf, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{a.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</div>
                        <div className="br-mono" style={{ fontSize: 11, color: sub }}>${a.price}/{t.common.day}</div>
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
                        {selected ? 'SELECTED' : 'ADD'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${border}` }}>
              {quoteError && <div className="br-mono" style={{ marginBottom: 12, fontSize: 11, color: '#B45309' }}>{quoteError}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 16, borderTop: `1px solid ${border}` }}>
                <span className="br-display" style={{ fontSize: 16 }}>{t.detail.total}</span>
                <span style={{ background: '#FFD700', color: '#000', padding: '6px 14px', borderRadius: 999, fontFamily: 'var(--br-mono)', fontSize: 22, fontWeight: 600 }}>
                  {quoteLoading ? '...' : `$${total.toFixed(2)}`}
                </span>
              </div>
              <BRPrimary onClick={goBook} full style={{ marginTop: 20, padding: '18px', fontSize: 15 }}>{t.detail.reserve}</BRPrimary>
              <div className="br-mono" style={{ fontSize: 10, color: sub, marginTop: 12, textAlign: 'center', letterSpacing: '0.1em' }}>{t.detail.cancel}</div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
