'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BREyebrow, BRChip, BRPrimary } from '@/components/BR';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { ApiError, mediaUrl } from '@/lib/api';
import { resolveScooterRouteId } from '@/lib/displayScooter';
import {
  ApiAddon,
  ApiAvailabilityCalendar,
  ApiBookingQuote,
  ApiScooterDetail,
  AvailabilityDayStatus,
  endpoints,
  unwrapList,
} from '@/lib/endpoints';
import { bookingDraftStore } from '@/lib/bookingDraft';
import { convertAmount, formatCurrencyAmount, useCurrency } from '@/lib/i18n/CurrencyProvider';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { type BookingExtraContent, BOOKING_COPY } from '@/lib/siteContentExtras';
import { useSiteContentPreview } from '@/lib/siteContentPreview';

const quoteCache = new Map<string, ApiBookingQuote>();

function numberParam(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAddonIds(value: string | null) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function addonPriceValue(addon: ApiAddon) {
  return Number(addon.priceUSD ?? addon.price_usd ?? addon.price ?? 0);
}

function getAddonName(addon: ApiAddon, locale: string): string {
  if (addon.translations && addon.translations.length > 0) {
    const translation = addon.translations.find((t) => t.language === locale);
    if (translation?.name) return translation.name;
  }
  return addon.name;
}

function toAddonOptions(addons: ApiAddon[], locale: string) {
  return addons;
}

function formatDateKey(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseDateKey(key: string): Date | null {
  if (!key) return null;
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function compareKey(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingPageInner />
    </Suspense>
  );
}

function BookingPageInner() {
  const { t, locale } = useLocale();
  const { marker } = useSiteContentPreview();
  const { currency: selectedCurrency, convertPrice } = useCurrency();
  const copy = {
    ...BOOKING_COPY.en,
    ...(BOOKING_COPY[locale as keyof typeof BOOKING_COPY] || BOOKING_COPY.en),
    ...(t.booking as Partial<BookingExtraContent>),
  } as BookingExtraContent;
  const addressRequiredMessage = copy.addressRequired;
  const router = useRouter();
  const search = useSearchParams();

  const scooterId = numberParam(search.get('scooter_id'));
  const initialName = search.get('name') || 'Scooter';
  const rawRouteId = search.get('route_id') || search.get('slug') || search.get('name') || '';
  const routeId = resolveScooterRouteId(rawRouteId, initialName) || rawRouteId;
  const initialPrice = Number(search.get('price') || '0') || 0;

  const [scooter, setScooter] = useState<ApiScooterDetail | null>(null);
  const [addons, setAddons] = useState<ApiAddon[]>([]);
  const [loadingScooter, setLoadingScooter] = useState(Boolean(scooterId || routeId));
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedAddOnIds, setSelectedAddOnIds] = useState<number[]>(parseAddonIds(search.get('addons')));

  const [startDateKey, setStartDateKey] = useState<string>('');
  const [endDateKey, setEndDateKey] = useState<string>('');
  const [startTime, setStartTime] = useState(search.get('start_time') || '09:00');
  const [endTime, setEndTime] = useState(search.get('end_time') || '18:00');

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [promoCode, setPromoCode] = useState('');

  const [quote, setQuote] = useState<ApiBookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!scooterId && !routeId) {
      setLoadingScooter(false);
      setLoadError(copy.noScooter);
      return;
    }

    setLoadingScooter(true);
    setLoadError(null);

    const detailRequest = scooterId
      ? endpoints.scooter(scooterId, locale)
      : endpoints.scooter(routeId, locale);

    detailRequest
      .then(async (detail) => {
        if (cancelled) return;
        setScooter(detail);
        if (detail.available_addons?.length) {
          setAddons(toAddonOptions(detail.available_addons, locale));
        } else {
          const addonList = unwrapList(await endpoints.addons(locale));
          if (!cancelled) setAddons(toAddonOptions(addonList, locale));
        }
      })
      .catch(async (error) => {
        if (cancelled) return;
        try {
          const addonList = unwrapList(await endpoints.addons(locale));
          if (!cancelled) setAddons(toAddonOptions(addonList, locale));
        } catch {}
        setLoadError(error instanceof ApiError ? error.message : t.auth.error);
      })
      .finally(() => {
        if (!cancelled) setLoadingScooter(false);
      });

    return () => {
      cancelled = true;
    };
  }, [copy.noScooter, locale, routeId, scooterId, t.auth.error]);

  const effectiveScooterId = scooterId || (scooter ? Number(scooter.id) : null);

  const isDateRangeValid = Boolean(
    startDateKey &&
      endDateKey &&
      compareKey(startDateKey, endDateKey) <= 0 &&
      new Date(`${endDateKey}T${endTime}:00`).getTime() >
        new Date(`${startDateKey}T${startTime}:00`).getTime()
  );

  const quoteRequest = useMemo(() => {
    if (!effectiveScooterId || !isDateRangeValid) return null;
    return {
      scooter_id: effectiveScooterId,
      start_datetime: `${startDateKey}T${startTime}:00`,
      end_datetime: `${endDateKey}T${endTime}:00`,
      delivery_time: `${startDateKey}T${startTime}:00`,
      delivery_address: deliveryAddress.trim() || undefined,
      add_on_ids: selectedAddOnIds.length ? selectedAddOnIds : undefined,
      promo_code: promoCode.trim() || undefined,
      payment_method: 'online_card' as const,
    };
  }, [
    deliveryAddress,
    effectiveScooterId,
    endDateKey,
    endTime,
    isDateRangeValid,
    promoCode,
    selectedAddOnIds,
    startDateKey,
    startTime,
  ]);

  const quoteKey = useMemo(() => (quoteRequest ? JSON.stringify(quoteRequest) : null), [quoteRequest]);

  useEffect(() => {
    if (!quoteRequest || !quoteKey) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    const cached = quoteCache.get(quoteKey);
    if (cached) {
      setQuote(cached);
      setQuoteError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setQuoteLoading(true);
      endpoints.bookingCalculate(quoteRequest, controller.signal)
        .then((response) => {
          quoteCache.set(quoteKey, response);
          setQuote(response);
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
  }, [quoteKey, quoteRequest, t.auth.error]);

  function handleContinueToPayment() {
    if (!deliveryAddress.trim() || !quoteRequest || !effectiveScooterId || !quote || quoteError) {
      return;
    }

    bookingDraftStore.set({
      scooter_id: effectiveScooterId,
      route_id: routeId || undefined,
      name: scooter?.title || initialName,
      image: scooter?.main_image ? mediaUrl(scooter.main_image) : null,
      currency: selectedCurrency,
      start_datetime: quoteRequest.start_datetime,
      end_datetime: quoteRequest.end_datetime,
      delivery_time: quoteRequest.delivery_time,
      delivery_address: quoteRequest.delivery_address,
      add_on_ids: quoteRequest.add_on_ids,
      promo_code: quoteRequest.promo_code,
    });

    const paymentQuery = new URLSearchParams({
      scooter_id: String(effectiveScooterId),
      name: scooter?.title || initialName,
      step: '3',
    });

    if (routeId) paymentQuery.set('route_id', routeId);
    router.push(`/payment?${paymentQuery.toString()}`);
  }

  const displayName = scooter?.title || initialName;
  const displayImage = scooter?.main_image ? mediaUrl(scooter.main_image) : null;
  const displayStatus = scooter?.status || 'available';
  const hasDeliveryAddress = Boolean(deliveryAddress.trim());
  // Always use the user-selected currency for display — never let the API currency override it.
  const currency = selectedCurrency;
  const rentalDays = Number(quote?.rental_days || 0);

  const addonsSubtotal = useMemo(() => {
    return selectedAddOnIds.reduce((sum, id) => {
      const found = addons.find((a) => a.id === id);
      return sum + (found ? addonPriceValue(found) : 0);
    }, 0);
  }, [addons, selectedAddOnIds]);

  // The API always returns amounts in USD regardless of the currency param in the request.
  const quoteCurrency = 'USD';
  const baseTotal = quote
    ? convertAmount(Number(quote.base_price || 0), quoteCurrency, selectedCurrency)
    : convertPrice(initialPrice || 0);
  const addonsTotal = quote
    ? convertAmount(Number(quote.add_ons_price || 0), quoteCurrency, selectedCurrency)
    : convertPrice(addonsSubtotal);
  const deliveryTotal = quote
    ? convertAmount(Number(quote.delivery_price || 0), quoteCurrency, selectedCurrency)
    : 0;
  const rawGrandTotal = quote ? Number(quote.total_price || 0) : 0;
  const grandTotal = quote && rawGrandTotal > 0
    ? convertAmount(rawGrandTotal, quoteCurrency, selectedCurrency)
    : baseTotal + addonsTotal + deliveryTotal;
  const discountTotal = quote && Number(quote.discount_amount || 0) > 0
    ? convertAmount(Number(quote.discount_amount), quoteCurrency, selectedCurrency)
    : 0;
  const promoApplied = Boolean(promoCode.trim() && discountTotal > 0);
  const selectedAddonsLabel = copy.selectedAddons
    .replace('{n}', String(selectedAddOnIds.length))
    .replace('${amount}', formatCurrencyAmount(convertPrice(addonsSubtotal), selectedCurrency))
    .replace('{amount}', formatCurrencyAmount(convertPrice(addonsSubtotal), selectedCurrency));

  const canConfirmDates = Boolean(quote && !quoteLoading && !quoteError && isDateRangeValid && hasDeliveryAddress);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', color: '#000' }}>
      <SiteHeader />

      <section className="br-booking-hero" style={{ padding: '56px 48px 28px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <BREyebrow><span {...marker('booking.pageEyebrow')}>{copy.pageEyebrow}</span></BREyebrow>
        <h1 className="br-display" style={{ fontSize: 'clamp(40px, 7vw, 76px)', lineHeight: 0.94, letterSpacing: '-0.04em', margin: '12px 0 14px' }}>
          <span {...marker('booking.pageTitle')}>{copy.pageTitle}</span>
        </h1>
        <p {...marker('booking.pageDesc')} style={{ margin: 0, maxWidth: 760, color: 'rgba(0,0,0,0.62)', lineHeight: 1.65 }}>
          {copy.pageDesc}
        </p>
      </section>

      <section className="br-booking-content" style={{ padding: '32px 48px 88px' }}>
        <div className="br-booking-payment-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 24, alignItems: 'start' }}>
          <div className="br-booking-main-column" style={{ display: 'grid', gap: 24 }}>
            <div className="br-booking-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 22, padding: 24 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>
                <span {...marker('booking.selectedScooter')}>{copy.selectedScooter}</span>
              </div>
              {loadingScooter ? (
                <div className="br-mono" style={{ marginTop: 16, color: 'rgba(0,0,0,0.55)' }}>{t.common.loading}</div>
              ) : (
                <div className="br-booking-selected-grid" style={{ display: 'grid', gridTemplateColumns: '160px minmax(0, 1fr)', gap: 18, marginTop: 16 }}>
                  <div style={{ borderRadius: 16, background: '#F5F5F5', minHeight: 120, overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                    {displayImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={displayImage} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
                    ) : (
                      <div className="br-mono" style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}><span {...marker('booking.photo')}>{copy.photo}</span></div>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div className="br-display" style={{ fontSize: 28, lineHeight: 1 }}>
                        {displayName}
                      </div>
                      <BRChip status={displayStatus} />
                    </div>
                    <div style={{ marginTop: 10, color: 'rgba(0,0,0,0.58)', fontSize: 14, lineHeight: 1.55 }}>
                      {scooter?.type || t.nav.book}
                      {scooter?.engine_capacity ? ` · ${scooter.engine_capacity}cc` : ''}
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <Link href={routeId ? `/scooter/${routeId}` : '/catalog'} className="br-mono" style={{ color: '#000', fontSize: 12 }}>
                        <span {...marker('booking.changeScooter')}>{copy.changeScooter}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              {loadError ? <div className="br-mono" style={{ marginTop: 16, color: '#B91C1C' }}>{loadError}</div> : null}
            </div>

            <AvailabilityCalendarBlock
              scooterId={effectiveScooterId}
              locale={locale}
              copy={copy}
              startDateKey={startDateKey}
              endDateKey={endDateKey}
              onPick={(start, end) => {
                setStartDateKey(start);
                setEndDateKey(end);
              }}
            />

            <div className="br-booking-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 22, padding: 24 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>
                <span {...marker('booking.timeTitle')}>{copy.timeTitle}</span>
              </div>
              <div className="br-booking-time-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 18 }}>
                <Field label={copy.startTime} contentKey="booking.startTime">
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
                </Field>
                <Field label={copy.endTime} contentKey="booking.endTime">
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
                </Field>
              </div>
              {startDateKey && endDateKey && !isDateRangeValid ? (
                <div className="br-mono" {...marker('booking.invalidRange')} style={{ marginTop: 14, color: '#B91C1C', fontSize: 12 }}>
                  {copy.invalidRange}
                </div>
              ) : null}
            </div>

            <div className="br-booking-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 22, padding: 24 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>
               
              </div>
              <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
                <Field label={copy.addressLabel} contentKey="booking.addressLabel">
                  <textarea
                    {...marker('booking.addressPlaceholder')}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                    placeholder={copy.addressPlaceholder}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 96 }}
                  />
                </Field>
                {!hasDeliveryAddress && isDateRangeValid ? (
                  <div className="br-mono" {...marker('booking.addressRequired')} style={{ color: '#B91C1C', fontSize: 12 }}>
                    {addressRequiredMessage}
                  </div>
                ) : null}
                <Field label={copy.promoCode} contentKey="booking.promoCode">
                  <input {...marker('booking.optional')} value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder={copy.optional} style={inputStyle} />
                  {promoCode.trim() && !quoteLoading && (
                    promoApplied
                      ? <div className="br-mono" {...marker('booking.promoApplied')} style={{ marginTop: 8, color: '#16A34A', fontSize: 12 }}>
                          {copy.promoApplied.replace('{amount}', formatCurrencyAmount(discountTotal, selectedCurrency))}
                        </div>
                      : quote
                        ? <div className="br-mono" {...marker('booking.promoInvalid')} style={{ marginTop: 8, color: '#B91C1C', fontSize: 12 }}>
                            {copy.promoInvalid}
                          </div>
                        : null
                  )}
                </Field>
              </div>
            </div>

            <div className="br-booking-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 22, padding: 24 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>
                <span {...marker('booking.addonsTitle')}>{copy.addonsTitle}</span>
              </div>
              <p {...marker('booking.addonsHelp')} style={{ margin: '12px 0 0', color: 'rgba(0,0,0,0.62)', lineHeight: 1.55 }}>
                {copy.addonsHelp}
              </p>
              {addons.length > 0 ? (
                <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
                  {addons.map((addon) => {
                    const selected = selectedAddOnIds.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() =>
                          setSelectedAddOnIds((current) =>
                            current.includes(addon.id)
                              ? current.filter((item) => item !== addon.id)
                              : [...current, addon.id]
                          )
                        }
                        className="br-booking-addon-option"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                          width: '100%',
                          textAlign: 'left',
                          padding: '14px 16px',
                          borderRadius: 14,
                          border: selected ? '1px solid #FFD700' : '1px solid rgba(0,0,0,0.08)',
                          background: selected ? 'rgba(255,215,0,0.16)' : '#F5F5F5',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{getAddonName(addon, locale)}</span>
                        <span className="br-mono">{formatCurrencyAmount(convertPrice(addonPriceValue(addon)), selectedCurrency)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="br-mono" {...marker('booking.addonsUnavailable')} style={{ marginTop: 16, color: 'rgba(0,0,0,0.55)', fontSize: 12 }}>
                  {copy.addonsUnavailable}
                </div>
              )}
            </div>
          </div>

          <aside className="br-booking-summary-aside" style={{ position: 'sticky', top: 90, display: 'grid', gap: 18 }}>
            <div className="br-booking-summary-card" style={{ borderRadius: 22, background: '#F5F5F5', padding: 24 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>
                <span {...marker('booking.summaryTitle')}>{copy.summaryTitle}</span>
              </div>
              <div className="br-display" style={{ marginTop: 12, fontSize: 28, lineHeight: 1 }}>
                {displayName}
              </div>
              <div style={{ marginTop: 10, color: 'rgba(0,0,0,0.58)', lineHeight: 1.55 }}>
                {startDateKey && endDateKey
                  ? `${startDateKey} ${startTime} — ${endDateKey} ${endTime}`
                  : <span {...marker('booking.pickDates')}>{copy.pickDates}</span>}
              </div>
              <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.58)', lineHeight: 1.55 }}>
                {rentalDays ? `${rentalDays} ${t.common.day}` : <span {...marker('booking.datesNotSelected')}>{copy.datesNotSelected}</span>}
              </div>
              <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.58)', lineHeight: 1.55 }}>
                {selectedAddOnIds.length
                  ? selectedAddonsLabel
                  : <span {...marker('booking.noOptions')}>{copy.noOptions}</span>}
              </div>

              <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
                <PriceRow contentKey="booking.base" label={copy.base} value={formatCurrencyAmount(baseTotal, currency)} />
                <PriceRow contentKey="booking.addons" label={copy.addons} value={formatCurrencyAmount(addonsTotal, currency)} />
                <PriceRow contentKey="booking.delivery" label={copy.delivery} value={formatCurrencyAmount(deliveryTotal, currency)} />
                {discountTotal > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                    <span {...marker('booking.discountLabel')} style={{ color: '#16A34A', fontSize: 13 }}>{copy.discountLabel} ({promoCode})</span>
                    <span className="br-mono" style={{ color: '#16A34A', fontWeight: 700 }}>−{formatCurrencyAmount(discountTotal, currency)}</span>
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                <span className="br-display" {...marker('booking.estimatedTotal')} style={{ fontSize: 20 }}>{copy.estimatedTotal}</span>
                <span className="br-mono" style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrencyAmount(grandTotal, currency)}</span>
              </div>

              {quoteLoading ? <div className="br-mono" style={{ marginTop: 16, color: 'rgba(0,0,0,0.55)' }}>{t.common.loading}</div> : null}
              {quoteError ? <div className="br-mono" style={{ marginTop: 16, color: '#B91C1C' }}>{quoteError}</div> : null}

              <BRPrimary onClick={handleContinueToPayment} disabled={!canConfirmDates} full style={{ marginTop: 22 }}>
                <span {...marker('booking.continueToPayment')}>{copy.continueToPayment}</span>
              </BRPrimary>

              <div {...marker('booking.nextStepHint')} style={{ marginTop: 14, color: 'rgba(0,0,0,0.58)', fontSize: 13, lineHeight: 1.55 }}>
                {copy.nextStepHint}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

type CalendarMonth = {
  year: number;
  month: number;
  data: ApiAvailabilityCalendar | null;
};

function AvailabilityCalendarBlock({
  scooterId,
  locale,
  copy,
  startDateKey,
  endDateKey,
  onPick,
}: {
  scooterId: number | null;
  locale: string;
  copy: BookingExtraContent;
  startDateKey: string;
  endDateKey: string;
  onPick: (start: string, end: string) => void;
}) {
  const { t } = useLocale();
  const { marker } = useSiteContentPreview();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [calendar, setCalendar] = useState<CalendarMonth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scooterId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    endpoints.scooterAvailability(scooterId, {
      year: cursor.year,
      month: cursor.month + 1,
    })
      .then((data) => {
        if (cancelled) return;
        setCalendar({
          year: cursor.year,
          month: cursor.month,
          data: 'days' in data ? (data as ApiAvailabilityCalendar) : null,
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : copy.loadAvailabilityFailed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [copy.loadAvailabilityFailed, cursor.month, cursor.year, scooterId]);

  const dayStatusMap = useMemo(() => {
    const map = new Map<string, AvailabilityDayStatus>();
    if (calendar?.data) {
      for (const day of calendar.data.days) {
        map.set(day.date, day.status);
      }
    }
    return map;
  }, [calendar]);

  const handleDayClick = useCallback(
    (key: string) => {
      const status = dayStatusMap.get(key) || 'available';
      if (status !== 'available') return;
      const dayDate = parseDateKey(key);
      if (!dayDate || dayDate < today) return;

      if (!startDateKey || (startDateKey && endDateKey)) {
        onPick(key, '');
        return;
      }
      if (compareKey(key, startDateKey) < 0) {
        onPick(key, '');
        return;
      }
      // Validate that range has no booked days
      const start = parseDateKey(startDateKey);
      const end = parseDateKey(key);
      if (!start || !end) return;
      const cursorD = new Date(start);
      while (cursorD <= end) {
        const k = formatDateKey(cursorD.getFullYear(), cursorD.getMonth(), cursorD.getDate());
        const s = dayStatusMap.get(k) || 'available';
        if (s !== 'available') {
          onPick(key, '');
          return;
        }
        cursorD.setDate(cursorD.getDate() + 1);
      }
      onPick(startDateKey, key);
    },
    [dayStatusMap, endDateKey, onPick, startDateKey, today]
  );

  function shiftMonth(delta: number) {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
    if (next < minDate) return;
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <div className="br-booking-card br-booking-calendar-panel" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 22, padding: 24 }}>
      <div className="br-booking-calendar-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>
          <span {...marker('booking.calendarTitle')}>{copy.calendarTitle}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => shiftMonth(-1)} className="br-mono" style={navButtonStyle}>←</button>
          <button type="button" onClick={() => shiftMonth(1)} className="br-mono" style={navButtonStyle}>→</button>
        </div>
      </div>

      <div className="br-booking-calendar-legend" style={{ display: 'flex', gap: 16, marginTop: 14, color: 'rgba(0,0,0,0.62)', fontSize: 12 }}>
        <Legend color="#16A34A" label={copy.legendAvailable} contentKey="booking.legendAvailable" />
        <Legend color="#DC2626" label={copy.legendBooked} contentKey="booking.legendBooked" />
        <Legend color="#FFD700" label={copy.legendSelected} contentKey="booking.legendSelected" />
      </div>

      {loading && <div className="br-mono" style={{ marginTop: 14, color: 'rgba(0,0,0,0.55)', fontSize: 12 }}>{t.common.loading}</div>}
      {error && <div className="br-mono" style={{ marginTop: 14, color: '#B91C1C', fontSize: 12 }}>{error}</div>}

      <div className="br-booking-calendar-months" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, marginTop: 18 }}>
        {calendar ? (
          <MonthGrid
            key={`${calendar.year}-${calendar.month}`}
            year={calendar.year}
            month={calendar.month}
            locale={locale}
            weekdays={copy.weekdays}
            today={today}
            startDateKey={startDateKey}
            endDateKey={endDateKey}
            statusMap={dayStatusMap}
            onPick={handleDayClick}
          />
        ) : null}
      </div>

      {startDateKey && !endDateKey ? (
        <div className="br-mono" {...marker('booking.pickEndDate')} style={{ marginTop: 14, color: 'rgba(0,0,0,0.62)', fontSize: 12 }}>
          {copy.pickEndDate.replace('{date}', startDateKey)}
        </div>
      ) : null}
    </div>
  );
}

function MonthGrid({
  year,
  month,
  locale,
  weekdays,
  today,
  startDateKey,
  endDateKey,
  statusMap,
  onPick,
}: {
  year: number;
  month: number;
  locale: string;
  weekdays: readonly string[];
  today: Date;
  startDateKey: string;
  endDateKey: string;
  statusMap: Map<string, AvailabilityDayStatus>;
  onPick: (key: string) => void;
}) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7; // Monday = 0

  const monthLabel = firstDay.toLocaleString(locale, { month: 'long', year: 'numeric' });
  const cells: Array<{ day: number; key: string } | null> = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: formatDateKey(year, month, d) });
  }

  return (
    <div className="br-booking-month-grid">
      <div className="br-mono" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.62)' }}>
        {monthLabel}
      </div>
      <div className="br-booking-month-days" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 10, fontSize: 11 }}>
        {weekdays.map((d, i) => (
          <div key={i} className="br-mono" style={{ textAlign: 'center', color: 'rgba(0,0,0,0.45)', padding: '4px 0' }}>
            {d}
          </div>
        ))}
        {cells.map((cell, idx) => {
          if (!cell) return <div key={idx} />;
          const dayDate = new Date(year, month, cell.day);
          const isPast = dayDate < today;
          const status = statusMap.get(cell.key) || (isPast ? 'booked' : 'available');
          const isAvailable = status === 'available' && !isPast;
          const inRange =
            startDateKey &&
            endDateKey &&
            compareKey(cell.key, startDateKey) >= 0 &&
            compareKey(cell.key, endDateKey) <= 0;
          const isStart = cell.key === startDateKey;
          const isEnd = cell.key === endDateKey;
          const selected = isStart || isEnd || inRange;

          let bg = '#F5F5F5';
          let color = 'rgba(0,0,0,0.4)';
          if (isAvailable) {
            bg = 'rgba(22,163,74,0.12)';
            color = '#15803D';
          }
          if (status !== 'available' || isPast) {
            bg = 'rgba(220,38,38,0.12)';
            color = 'rgba(220,38,38,0.9)';
          }
          if (selected) {
            bg = '#FFD700';
            color = '#000';
          }

          return (
            <button
              key={cell.key}
              type="button"
              disabled={!isAvailable}
              onClick={() => onPick(cell.key)}
              style={{
                aspectRatio: '1 / 1',
                border: 'none',
                borderRadius: 8,
                background: bg,
                color,
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                fontSize: 13,
                fontFamily: 'var(--br-mono)',
                fontWeight: selected ? 700 : 500,
              }}
              aria-label={`${cell.key} ${status}`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ color, label, contentKey }: { color: string; label: string; contentKey?: string }) {
  const { marker } = useSiteContentPreview();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: 'inline-block' }} />
      <span {...(contentKey ? marker(contentKey) : {})}>{label}</span>
    </span>
  );
}

function Field({ label, children, contentKey }: { label: string; children: ReactNode; contentKey?: string }) {
  const { marker } = useSiteContentPreview();
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span {...(contentKey ? marker(contentKey) : {})} className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.55)' }}>
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  );
}

function PriceRow({ label, value, contentKey }: { label: string; value: string; contentKey?: string }) {
  const { marker } = useSiteContentPreview();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
      <span {...(contentKey ? marker(contentKey) : {})} style={{ color: 'rgba(0,0,0,0.58)' }}>{label}</span>
      <span className="br-mono">{value}</span>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 48,
  borderRadius: 14,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  padding: '12px 14px',
  fontSize: 15,
  color: '#000',
  outline: 'none',
};

const navButtonStyle: CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  width: 32,
  height: 32,
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
};
