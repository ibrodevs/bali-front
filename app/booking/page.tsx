'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BRPhoto, BREyebrow, BRPrimary, BROutline, BRChip } from '@/components/BR';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { Locale } from '@/lib/i18n/dictionaries';
import { useAuth } from '@/lib/i18n/AuthProvider';
import {
  ApiAvailabilityCalendar,
  ApiBookingQuote,
  ApiAddon,
  endpoints,
  GuestBookingPayload,
  BookingCreatePayload,
  toApiPaymentMethod,
  unwrapList,
} from '@/lib/endpoints';
import { ApiError, mediaUrl, tokens } from '@/lib/api';

const bookingQuoteCache = new Map<string, ApiBookingQuote>();
const availabilityCache = new Map<string, ApiAvailabilityCalendar>();

type DeliveryZoneView = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  deliveryFeeUSD: number;
  freeDelivery: boolean;
  timeMinutes: number;
};

type AddonView = {
  id: number;
  name: string;
  price: number;
  description?: string;
};

const BOOKING_COPY_EN = {
  searchPickup: 'Pickup zone',
  startTime: 'Start time',
  endTime: 'Return time',
  promo: 'Promo code',
  preview: 'Live quote',
  eta: 'Delivery ETA',
  selectZone: 'Select a delivery zone',
  summary: 'Booking summary',
  noScooter: 'Pick a scooter from the catalog first.',
  calendar: 'Availability calendar',
  calendarHint: 'Green days are free, orange days have partial occupancy, red days are booked.',
  pickStart: 'Pick-up date',
  pickEnd: 'Return date',
  availability: 'Availability',
  available: 'Available',
  partial: 'Partial',
  booked: 'Booked',
  maintenance: 'Maintenance',
  unavailableDay: 'This day is unavailable.',
  extras: 'Travel extras',
  secureCard: 'After confirmation you will be redirected to a secure payment page.',
  secureCash: 'Booking will be reserved now. You can pay on delivery.',
  secureCrypto: 'We will generate a crypto invoice right after booking.',
  selectedRange: 'Selected range',
};

const BOOKING_COPY_RU = {
  searchPickup: 'Зона получения',
  startTime: 'Время начала',
  endTime: 'Время возврата',
  promo: 'Промокод',
  preview: 'Живой расчёт',
  eta: 'Время доставки',
  selectZone: 'Выбери зону доставки',
  summary: 'Сводка брони',
  noScooter: 'Сначала выбери скутер в каталоге.',
  calendar: 'Календарь занятости',
  calendarHint: 'Зелёные даты свободны, оранжевые заняты частично, красные уже забронированы.',
  pickStart: 'Дата получения',
  pickEnd: 'Дата возврата',
  availability: 'Доступность',
  available: 'Доступно',
  partial: 'Частично',
  booked: 'Забронировано',
  maintenance: 'Сервис',
  unavailableDay: 'Эта дата недоступна.',
  extras: 'Дополнения',
  secureCard: 'После подтверждения откроется защищённая страница оплаты.',
  secureCash: 'Бронь создастся сразу. Оплата будет при получении.',
  secureCrypto: 'Сразу после бронирования мы создадим крипто-инвойс.',
  selectedRange: 'Выбранный период',
};

const BOOKING_COPY: Record<Locale, typeof BOOKING_COPY_EN> = {
  en: BOOKING_COPY_EN,
  ru: BOOKING_COPY_RU,
  zh: BOOKING_COPY_EN,
  id: BOOKING_COPY_EN,
  de: BOOKING_COPY_EN,
  fr: BOOKING_COPY_EN,
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function combineDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

function startOfMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, 1);
}

function shiftMonth(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function formatMonth(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
}

function formatDateRange(start: string, end: string, locale: string) {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function statusTone(status: ApiAvailabilityCalendar['days'][number]['status']) {
  if (status === 'booked') return { bg: '#FEF2F2', border: '#FCA5A5', fg: '#991B1B' };
  if (status === 'partially_booked') return { bg: '#FFF7ED', border: '#FDBA74', fg: '#9A3412' };
  if (status === 'maintenance') return { bg: '#F3F4F6', border: '#D1D5DB', fg: '#374151' };
  return { bg: '#F0FDF4', border: '#86EFAC', fg: '#166534' };
}

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingFlow />
    </Suspense>
  );
}

function BookingFlow() {
  const { t, locale, tr } = useLocale();
  const copy = BOOKING_COPY[locale];
  const { user, refresh } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const now = new Date();

  const scooterApiId = Number(search.get('scooter_id') || '') || null;
  const routeId = search.get('route_id') || search.get('slug') || 'catalog';
  const fallbackSlug = search.get('slug') || 'scooter';
  const fallbackName = search.get('name') || 'Scooter';
  const fallbackPrice = Number(search.get('price') || '0');
  const initialStartDate = search.get('start_date') || toDateInputValue(addDays(now, 2));
  const initialEndDate = search.get('end_date') || toDateInputValue(addDays(now, 7));
  const initialStartTime = search.get('start_time') || '08:00';
  const initialEndTime = search.get('end_time') || '20:00';
  const initialAddonIds = (search.get('addons') || '')
    .split(',')
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  const [step, setStep] = useState(1);
  const [pm, setPm] = useState<'card' | 'cash' | 'crypto'>('card');
  const [zones, setZones] = useState<DeliveryZoneView[]>([]);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [address, setAddress] = useState('Villa Cendana, Jl. Pantai Berawa, Canggu');
  const [promoCode, setPromoCode] = useState('');
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<number[]>(initialAddonIds);
  const [availableAddons, setAvailableAddons] = useState<AddonView[]>([]);
  const [scooterName, setScooterName] = useState(fallbackName);
  const [scooterSlug, setScooterSlug] = useState(fallbackSlug);
  const [scooterImage, setScooterImage] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(initialStartDate));
  const [calendarMode, setCalendarMode] = useState<'start' | 'end'>('start');
  const [availability, setAvailability] = useState<ApiAvailabilityCalendar | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [quote, setQuote] = useState<ApiBookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    endpoints.bootstrap(locale)
      .then((bootstrap) => {
        if (cancelled) return;
        const nextZones = (bootstrap.deliveryZones || []).map((zone) => ({
          id: zone.id,
          name: zone.name,
          latitude: Number(zone.latitude || 0),
          longitude: Number(zone.longitude || 0),
          deliveryFeeUSD: Number(zone.deliveryFeeUSD || 0),
          freeDelivery: Boolean(zone.freeDelivery),
          timeMinutes: Number(zone.timeMinutes || 30),
        }));
        setZones(nextZones);
        if (nextZones.length && zoneId === null) {
          setZoneId(nextZones[0].id);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [locale, zoneId]);

  useEffect(() => {
    let cancelled = false;
    if (!scooterApiId) {
      setScooterName(fallbackName);
      setScooterSlug(fallbackSlug);
      return;
    }

    endpoints.scooter(scooterApiId, locale)
      .then(async (detail) => {
        if (cancelled) return;
        setScooterName(detail.title || fallbackName);
        setScooterSlug(detail.slug || fallbackSlug);
        setScooterImage(detail.main_image ? mediaUrl(detail.main_image) : null);
        const fromDetail = (detail.available_addons || []).map((addon: ApiAddon) => ({
          id: addon.id,
          name: addon.name,
          price: Number(addon.price_usd ?? addon.price ?? 0),
          description: addon.description,
        }));
        if (fromDetail.length) {
          setAvailableAddons(fromDetail);
          return;
        }
        const addons = unwrapList(await endpoints.addons(locale));
        if (!cancelled) {
          setAvailableAddons(addons.map((addon) => ({
            id: addon.id,
            name: addon.name,
            price: Number(addon.price_usd ?? addon.price ?? 0),
            description: addon.description,
          })));
        }
      })
      .catch(async () => {
        try {
          const addons = unwrapList(await endpoints.addons(locale));
          if (!cancelled) {
            setAvailableAddons(addons.map((addon) => ({
              id: addon.id,
              name: addon.name,
              price: Number(addon.price_usd ?? addon.price ?? 0),
              description: addon.description,
            })));
          }
        } catch {}
      });

    return () => {
      cancelled = true;
    };
  }, [scooterApiId, fallbackName, fallbackSlug, locale]);

  useEffect(() => {
    let cancelled = false;
    if (!scooterApiId) {
      setAvailability(null);
      return;
    }

    const key = `${scooterApiId}:${visibleMonth.getFullYear()}-${visibleMonth.getMonth() + 1}`;
    const cached = availabilityCache.get(key);
    if (cached) {
      setAvailability(cached);
      return;
    }

    setAvailabilityLoading(true);
    endpoints.scooterAvailability(scooterApiId, {
      year: visibleMonth.getFullYear(),
      month: visibleMonth.getMonth() + 1,
    })
      .then((result) => {
        if (cancelled || !('days' in result)) return;
        availabilityCache.set(key, result);
        setAvailability(result);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [scooterApiId, visibleMonth]);

  const selectedZone = useMemo(() => zones.find((zone) => zone.id === zoneId) || null, [zones, zoneId]);
  const startDateTime = combineDateTime(startDate, startTime);
  const endDateTime = combineDateTime(endDate, endTime);
  const dateIsValid = new Date(endDateTime).getTime() > new Date(startDateTime).getTime();

  const quoteRequest = useMemo(() => {
    if (!scooterApiId || !dateIsValid) return null;
    return {
      scooter_id: scooterApiId,
      start_datetime: startDateTime,
      end_datetime: endDateTime,
      delivery_address: address || undefined,
      delivery_latitude: selectedZone?.latitude || undefined,
      delivery_longitude: selectedZone?.longitude || undefined,
      add_on_ids: selectedAddOnIds.length ? selectedAddOnIds : undefined,
      promo_code: promoCode.trim() || undefined,
      payment_method: toApiPaymentMethod(pm),
      currency: 'USD',
    } as const;
  }, [scooterApiId, dateIsValid, startDateTime, endDateTime, address, selectedZone, selectedAddOnIds, promoCode, pm]);

  const quoteRequestKey = useMemo(() => (quoteRequest ? JSON.stringify(quoteRequest) : null), [quoteRequest]);

  useEffect(() => {
    if (!quoteRequest || !quoteRequestKey) {
      setQuote(null);
      return;
    }

    const cached = bookingQuoteCache.get(quoteRequestKey);
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
          bookingQuoteCache.set(quoteRequestKey, nextQuote);
          setQuote(nextQuote);
          setError(null);
        })
        .catch((nextError) => {
          if (controller.signal.aborted) return;
          if (nextError instanceof ApiError && nextError.status === 429) {
            setError('Too many price checks. Please wait a moment.');
            return;
          }
          setQuote(null);
          setError(nextError instanceof ApiError ? nextError.message : t.auth.error);
        })
        .finally(() => {
          if (!controller.signal.aborted) setQuoteLoading(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [quoteRequest, quoteRequestKey, t.auth.error]);

  const fg = '#000';
  const bg = '#fff';
  const sub = 'rgba(0,0,0,0.55)';
  const surf = '#F5F5F5';
  const border = 'rgba(0,0,0,0.08)';

  const rentalDays = Math.max(
    1,
    Math.ceil((new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / (1000 * 60 * 60 * 24))
  );

  const summary = {
    rentalDays: quote?.rental_days || rentalDays,
    base: Number(quote?.base_price || fallbackPrice * rentalDays),
    addons: Number(quote?.add_ons_price || 0),
    delivery: selectedZone ? (selectedZone.freeDelivery ? 0 : Number(selectedZone.deliveryFeeUSD || 0)) : Number(quote?.delivery_price || 0),
    discount: Number(quote?.discount_amount || 0),
    markup: Number(quote?.markup_amount || 0),
  };
  const summaryTotal = Math.max(0, summary.base + summary.addons + summary.delivery - summary.discount + summary.markup);

  const selectedAddOns = useMemo(
    () => availableAddons.filter((addon) => selectedAddOnIds.includes(addon.id)),
    [availableAddons, selectedAddOnIds]
  );

  const canContinueStep1 = Boolean(scooterApiId) && dateIsValid;
  const canContinueStep2 = Boolean(selectedZone) && Boolean(address.trim());
  const canSubmit = Boolean(scooterApiId) && dateIsValid && quote && !submitting;

  function toggleAddOn(addOnId: number) {
    setSelectedAddOnIds((current) =>
      current.includes(addOnId) ? current.filter((value) => value !== addOnId) : [...current, addOnId]
    );
  }

  function onCalendarDayClick(day: ApiAvailabilityCalendar['days'][number]) {
    if (day.status === 'booked' || day.status === 'maintenance') {
      setError(copy.unavailableDay);
      return;
    }

    setError(null);
    const clicked = new Date(`${day.date}T12:00:00`);
    if (calendarMode === 'start') {
      setStartDate(day.date);
      if (new Date(`${endDate}T12:00:00`).getTime() <= clicked.getTime()) {
        setEndDate(toDateInputValue(addDays(clicked, 1)));
      }
      setCalendarMode('end');
    } else {
      const start = new Date(`${startDate}T12:00:00`);
      if (clicked.getTime() <= start.getTime()) {
        setStartDate(day.date);
        setEndDate(toDateInputValue(addDays(clicked, 1)));
      } else {
        setEndDate(day.date);
      }
      setCalendarMode('start');
    }
  }

  async function submitBooking() {
    if (!scooterApiId) {
      setError(copy.noScooter);
      return;
    }
    if (!dateIsValid) {
      setError('Return date must be after pickup date.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const base: BookingCreatePayload = {
        scooter_id: scooterApiId,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        delivery_address: address || undefined,
        delivery_latitude: selectedZone?.latitude || undefined,
        delivery_longitude: selectedZone?.longitude || undefined,
        add_on_ids: selectedAddOnIds.length ? selectedAddOnIds : undefined,
        promo_code: promoCode.trim() || undefined,
        payment_method: toApiPaymentMethod(pm),
        currency: 'USD',
      };

      let bookingId: number;
      if (user) {
        const booking = await endpoints.createBooking(base, locale);
        bookingId = booking.id;
      } else {
        if (!guestEmail || !guestName) {
          setError(`${t.booking.guestEmail} / ${t.booking.guestName}`);
          setSubmitting(false);
          return;
        }
        const response = await endpoints.guestCreateBooking({
          ...base,
          guest_email: guestEmail,
          guest_full_name: guestName,
          guest_phone: guestPhone || undefined,
          language: locale,
        } as GuestBookingPayload, locale);
        if (response.auth?.access && response.auth?.refresh) {
          tokens.set({ access: response.auth.access, refresh: response.auth.refresh });
          await refresh();
        }
        bookingId = response.booking.id;
      }

      router.push(`/payment?booking_id=${bookingId}&name=${encodeURIComponent(scooterName)}&payment=${pm}`);
    } catch (nextError) {
      setError(nextError instanceof ApiError ? nextError.message : t.auth.error);
      setSubmitting(false);
    }
  }

  const calendarDays = availability?.days || [];
  const firstWeekday = calendarDays.length ? new Date(`${calendarDays[0].date}T12:00:00`).getDay() : 0;
  const rangeStart = new Date(`${startDate}T12:00:00`).getTime();
  const rangeEnd = new Date(`${endDate}T12:00:00`).getTime();

  return (
    <div style={{ background: bg, color: fg, minHeight: '100vh' }}>
      <SiteHeader />
      <div className="br-booking-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${border}`, gap: 16, flexWrap: 'wrap' }}>
        <div className="br-mono" style={{ fontSize: 11, color: sub, letterSpacing: '0.12em' }}>BOOKING · {scooterSlug.toUpperCase()}</div>
        <div className="br-booking-steps" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: step >= n ? '#FFD700' : '#E6E6E6' }} />
              <span className="br-mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: step === n ? fg : sub }}>
                {['DATES', 'DELIVERY', 'PAYMENT'][n - 1]}
              </span>
              {n < 3 && <div style={{ width: 24, height: 1, background: border, marginLeft: 8 }} />}
            </div>
          ))}
        </div>
        <button onClick={() => setStep(Math.max(1, step - 1))} className="br-mono" style={{ background: 'transparent', border: `1px solid ${border}`, color: fg, padding: '8px 14px', borderRadius: 999, fontSize: 11, cursor: 'pointer' }}>{t.booking.back}</button>
      </div>

      <div className="br-booking-shell" style={{ gridTemplateColumns: 'minmax(0, 1fr) 430px', gap: 0 }}>
          <div className="br-booking-main" style={{ padding: '56px 56px 64px' }}>
          <BREyebrow>{tr(t.booking.step, { n: step })}</BREyebrow>
          <h1 className="br-display" style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 0.98, margin: '12px 0 16px', letterSpacing: '-0.03em' }}>
            {step === 1 && t.booking.s1Title}
            {step === 2 && t.booking.s2Title}
            {step === 3 && t.booking.s3Title}
          </h1>
          <p style={{ color: sub, maxWidth: 720, fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
            {step === 1 && copy.calendarHint}
            {step === 2 && `${copy.selectZone}. ${copy.eta}: ${selectedZone?.timeMinutes || 30} min.`}
            {step === 3 && (pm === 'cash' ? copy.secureCash : pm === 'crypto' ? copy.secureCrypto : copy.secureCard)}
          </p>

          {step === 1 && (
            <div style={{ display: 'grid', gap: 24 }}>
              <div style={{ background: surf, borderRadius: 22, padding: 22, border: `1px solid ${border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div className="br-display" style={{ fontSize: 28 }}>{copy.calendar}</div>
                    <div className="br-mono" style={{ marginTop: 6, fontSize: 11, color: sub, letterSpacing: '0.12em' }}>
                      {copy.selectedRange}: {formatDateRange(startDate, endDate, locale)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setVisibleMonth(shiftMonth(visibleMonth, -1))} className="br-mono" style={{ border: `1px solid ${border}`, background: '#fff', borderRadius: 999, padding: '8px 12px', cursor: 'pointer' }}>←</button>
                    <div className="br-mono" style={{ padding: '8px 12px', borderRadius: 999, background: '#fff', border: `1px solid ${border}`, minWidth: 190, textAlign: 'center' }}>
                      {formatMonth(visibleMonth, locale)}
                    </div>
                    <button onClick={() => setVisibleMonth(shiftMonth(visibleMonth, 1))} className="br-mono" style={{ border: `1px solid ${border}`, background: '#fff', borderRadius: 999, padding: '8px 12px', cursor: 'pointer' }}>→</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
                  {[
                    ['start', copy.pickStart],
                    ['end', copy.pickEnd],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setCalendarMode(value as 'start' | 'end')}
                      className="br-mono"
                      style={{
                        padding: '10px 14px',
                        borderRadius: 999,
                        border: `1px solid ${calendarMode === value ? '#FFD700' : border}`,
                        background: calendarMode === value ? '#FFF6CC' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 18 }}>
                  <div className="br-calendar-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                      <div key={label} className="br-mono" style={{ fontSize: 11, color: sub, padding: '0 2px 6px', letterSpacing: '0.08em' }}>{label}</div>
                    ))}
                    {Array.from({ length: firstWeekday }).map((_, index) => (
                      <div key={`blank-${index}`} />
                    ))}
                    {availabilityLoading && !calendarDays.length ? (
                      Array.from({ length: 28 }).map((_, index) => (
                        <div key={`loading-${index}`} className="br-calendar-day br-skeleton" />
                      ))
                    ) : (
                      calendarDays.map((day) => {
                        const tone = statusTone(day.status);
                        const dayTs = new Date(`${day.date}T12:00:00`).getTime();
                        const inRange = dayTs >= rangeStart && dayTs <= rangeEnd;
                        const isStart = day.date === startDate;
                        const isEnd = day.date === endDate;
                        return (
                          <button
                            key={day.date}
                            onClick={() => onCalendarDayClick(day)}
                            className="br-calendar-day"
                            style={{
                              borderRadius: 16,
                              border: `1px solid ${inRange ? '#FFD700' : tone.border}`,
                              background: inRange ? '#FFF6CC' : tone.bg,
                              color: tone.fg,
                              padding: 10,
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                          >
                            <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>{day.date.slice(-2)}</div>
                            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600 }}>
                              {day.status === 'partially_booked' ? copy.partial : day.status === 'maintenance' ? copy.maintenance : day.status === 'booked' ? copy.booked : copy.available}
                            </div>
                            {(isStart || isEnd) && (
                              <div className="br-mono" style={{ marginTop: 10, fontSize: 10, color: '#000' }}>
                                {isStart ? copy.pickStart : copy.pickEnd}
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                  {[
                    { label: copy.available, tone: statusTone('available') },
                    { label: copy.partial, tone: statusTone('partially_booked') },
                    { label: copy.booked, tone: statusTone('booked') },
                    { label: copy.maintenance, tone: statusTone('maintenance') },
                  ].map(({ label, tone }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: tone.bg, border: `1px solid ${tone.border}` }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone.fg, display: 'inline-block' }} />
                      <span className="br-mono" style={{ fontSize: 11, color: tone.fg }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="br-booking-payment-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                <div className="br-field">
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} style={{ background: bg, color: fg, borderColor: border }} />
                  <label>{t.booking.pickUp}</label>
                </div>
                <div className="br-field">
                  <input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} style={{ background: bg, color: fg, borderColor: border }} />
                  <label>{t.booking.return}</label>
                </div>
                <div className="br-field">
                  <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} style={{ background: bg, color: fg, borderColor: border }} />
                  <label>{copy.startTime}</label>
                </div>
                <div className="br-field">
                  <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} style={{ background: bg, color: fg, borderColor: border }} />
                  <label>{copy.endTime}</label>
                </div>
              </div>

              <div>
                <div className="br-display" style={{ fontSize: 28, marginBottom: 12 }}>{copy.extras}</div>
                <div className="br-booking-zone-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  {availableAddons.map((addon) => {
                    const selected = selectedAddOnIds.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddOn(addon.id)}
                        style={{
                          textAlign: 'left',
                          padding: 16,
                          borderRadius: 16,
                          border: `1px solid ${selected ? '#FFD700' : border}`,
                          background: selected ? '#FFF9DD' : '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div className="br-display" style={{ fontSize: 20 }}>{addon.name}</div>
                          {selected && <BRChip status="confirmed" />}
                        </div>
                        <div className="br-mono" style={{ marginTop: 8, fontSize: 11, color: sub }}>${addon.price.toFixed(2)}/{t.common.day}</div>
                        {addon.description && <div style={{ marginTop: 8, fontSize: 13, color: sub, lineHeight: 1.5 }}>{addon.description}</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <div className="br-mono" style={{ fontSize: 11, color: sub, letterSpacing: '0.12em', marginBottom: 12 }}>{copy.selectZone}</div>
                <div className="br-booking-zone-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  {zones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => setZoneId(zone.id)}
                      style={{
                        textAlign: 'left',
                        padding: 16,
                        borderRadius: 16,
                        border: `1px solid ${zoneId === zone.id ? '#FFD700' : border}`,
                        background: zoneId === zone.id ? '#FFF9DD' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="br-display" style={{ fontSize: 22 }}>{zone.name}</div>
                      <div className="br-mono" style={{ fontSize: 11, color: sub, marginTop: 6 }}>
                        {zone.freeDelivery ? t.payment.free : `$${zone.deliveryFeeUSD.toFixed(2)}`} · {zone.timeMinutes} min
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="br-field">
                <input value={address} onChange={(event) => setAddress(event.target.value)} style={{ background: '#fff', color: fg, borderColor: border }} />
                <label>{t.booking.address}</label>
              </div>

              <div style={{ position: 'relative', height: 280, borderRadius: 16, overflow: 'hidden', border: `1px solid ${border}` }}>
                <BRPhoto tone="ocean" label="MAP · DELIVERY ZONE" style={{ height: '100%' }} />
                <div style={{ position: 'absolute', bottom: 12, left: 12, background: '#000', color: '#fff', padding: '8px 12px', borderRadius: 8, fontFamily: 'var(--br-mono)', fontSize: 11 }}>
                  {selectedZone ? `${selectedZone.name} · ${copy.eta}: ${selectedZone.timeMinutes} min` : copy.selectZone}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['card', 'cash', 'crypto'] as const).map((value) => (
                  <button key={value} onClick={() => setPm(value)} className="br-mono" style={{
                    padding: '12px 20px', borderRadius: 999,
                    border: `1px solid ${pm === value ? '#FFD700' : border}`,
                    background: pm === value ? '#FFD700' : 'transparent',
                    color: pm === value ? '#000' : fg,
                    cursor: 'pointer', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase'
                  }}>
                    {value === 'card' && '◫ '}{value === 'cash' && '$ '}{value === 'crypto' && '◇ '}{value}
                  </button>
                ))}
              </div>

              {!user && (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div className="br-field">
                    <input value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} type="email" required style={{ background: bg, color: fg, borderColor: border }} />
                    <label>{t.booking.guestEmail}</label>
                  </div>
                  <div className="br-booking-payment-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    <div className="br-field">
                      <input value={guestName} onChange={(event) => setGuestName(event.target.value)} required style={{ background: bg, color: fg, borderColor: border }} />
                      <label>{t.booking.guestName}</label>
                    </div>
                    <div className="br-field">
                      <input value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} style={{ background: bg, color: fg, borderColor: border }} />
                      <label>{t.booking.guestPhone}</label>
                    </div>
                  </div>
                </div>
              )}

              <div className="br-field">
                <input value={promoCode} onChange={(event) => setPromoCode(event.target.value)} style={{ background: bg, color: fg, borderColor: border }} />
                <label>{copy.promo}</label>
              </div>

              <div style={{ background: surf, borderRadius: 18, border: `1px solid ${border}`, padding: 18 }}>
                <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: sub }}>{copy.availability}</div>
                <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.6 }}>
                  {pm === 'cash' ? copy.secureCash : pm === 'crypto' ? copy.secureCrypto : copy.secureCard}
                </div>
              </div>

              <div className="br-mono" style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: sub, letterSpacing: '0.1em', flexWrap: 'wrap' }}>
                <span>{t.booking.secure}</span>
                <span>{t.booking.pci}</span>
                <span>{t.booking.cancel24}</span>
              </div>
            </div>
          )}

          {error && <div className="br-mono" style={{ marginTop: 20, color: '#B91C1C', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap' }}>
            {step > 1 && <BROutline onClick={() => setStep(step - 1)}>{t.booking.back}</BROutline>}
            {step === 1 && <BRPrimary onClick={() => setStep(2)} disabled={!canContinueStep1}>{t.booking.cont}</BRPrimary>}
            {step === 2 && <BRPrimary onClick={() => setStep(3)} disabled={!canContinueStep2}>{t.booking.cont}</BRPrimary>}
            {step === 3 && (
              <BRPrimary onClick={submitBooking} disabled={!canSubmit}>
                {submitting ? t.booking.submitting : `${t.booking.confirm} $${summaryTotal.toFixed(2)} →`}
              </BRPrimary>
            )}
          </div>
        </div>

        <div className="br-booking-side" style={{ background: surf, padding: 32, borderLeft: `1px solid ${border}` }}>
          {scooterImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scooterImage} alt={scooterName} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 14 }} />
          ) : (
            <BRPhoto tone="sand" label={scooterSlug.toUpperCase()} style={{ height: 220, borderRadius: 14 }} />
          )}
          <div style={{ marginTop: 18 }}>
            <div className="br-display" style={{ fontSize: 28, marginTop: 4 }}>{scooterName}</div>
            <div className="br-mono" style={{ fontSize: 12, color: sub, marginTop: 6 }}>
              {startDate} {startTime} → {endDate} {endTime}
            </div>
          </div>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${border}` }}>
            <BREyebrow>{copy.preview}</BREyebrow>
            {quoteLoading ? (
              <div className="br-mono" style={{ marginTop: 14, color: sub }}>{t.common.loading}</div>
            ) : (
              <>
                {[
                  [tr(t.booking.summary.days, { n: summary.rentalDays, p: (summary.base / Math.max(summary.rentalDays, 1)).toFixed(2) }), `$${summary.base.toFixed(2)}`],
                  [copy.extras, selectedAddOns.length ? selectedAddOns.map((addon) => addon.name).join(', ') : '—'],
                  [t.booking.summary.delivery, summary.delivery === 0 ? t.booking.summary.free : `$${summary.delivery.toFixed(2)}`],
                  [copy.searchPickup, selectedZone?.name || '—'],
                  [copy.availability, dateIsValid ? copy.available : '—'],
                ].map(([label, value], index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', fontSize: 13, fontFamily: 'var(--br-mono)' }}>
                    <span style={{ color: sub }}>{label}</span>
                    <span style={{ textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${border}` }}>
              <span className="br-display" style={{ fontSize: 18 }}>{copy.summary}</span>
              <span style={{ background: '#FFD700', color: '#000', padding: '6px 14px', borderRadius: 999, fontFamily: 'var(--br-mono)', fontSize: 22, fontWeight: 600 }}>${summaryTotal.toFixed(2)}</span>
            </div>
            <Link href={`/scooter/${routeId}`} className="br-mono" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 11, color: sub, letterSpacing: '0.12em' }}>{t.booking.summary.changeBike}</Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
