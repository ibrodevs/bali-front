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
import { useLocale } from '@/lib/i18n/LocaleProvider';

type AddonOption = {
  id: number;
  name: string;
  price: number;
};

const quoteCache = new Map<string, ApiBookingQuote>();

const BOOKING_COPY = {
  en: {
    pageEyebrow: 'STEP 2 OF 3',
    pageTitle: 'Dates and delivery address',
    pageDesc: 'Green days are available, red ones are already booked. Choose the rental period and add your delivery address.',
    noScooter: 'Choose a scooter from the catalog first.',
    selectedScooter: 'SELECTED SCOOTER',
    photo: 'PHOTO',
    changeScooter: 'Change scooter',
    timeTitle: 'PICKUP / RETURN TIME',
    startTime: 'Start time',
    endTime: 'End time',
    invalidRange: 'End date/time must be later than start date/time.',
    addressTitle: 'DELIVERY ADDRESS',
    addressLabel: 'Delivery address',
    addressPlaceholder: 'Villa, hotel, or exact delivery address',
    promoCode: 'Promo code',
    optional: 'Optional',
    addonsTitle: 'ADD-ONS',
    addonsHelp: 'Extra options can be added to the booking right away.',
    addonsUnavailable: 'Extra options are not available.',
    summaryTitle: 'STEP 2 SUMMARY',
    pickDates: 'Select dates in the calendar',
    datesNotSelected: 'Dates are not selected',
    noOptions: 'No options selected',
    base: 'Base',
    addons: 'Add-ons',
    delivery: 'Delivery',
    estimatedTotal: 'Estimated total',
    continueToPayment: 'Continue to payment',
    nextStepHint: 'On the next step you will choose the payment method.',
    calendarTitle: 'AVAILABILITY CALENDAR',
    legendAvailable: 'Available',
    legendBooked: 'Booked',
    legendSelected: 'Selected',
    loadAvailabilityFailed: 'Failed to load availability',
    pickEndDate: 'Selected {date} — click the end date.',
    weekdays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    selectedAddons: '{n} add-ons · ${amount}',
  },
  ru: {
    pageEyebrow: 'ШАГ 2 ИЗ 3',
    pageTitle: 'Даты и адрес доставки',
    pageDesc: 'Зелёные дни свободны, красные уже заняты. Выберите период аренды и укажите адрес доставки.',
    noScooter: 'Сначала выберите скутер в каталоге.',
    selectedScooter: 'ВЫБРАННЫЙ СКУТЕР',
    photo: 'ФОТО',
    changeScooter: 'Изменить скутер',
    timeTitle: 'ВРЕМЯ ПОЛУЧЕНИЯ / ВОЗВРАТА',
    startTime: 'Время начала',
    endTime: 'Время окончания',
    invalidRange: 'Дата и время окончания должны быть позже начала.',
    addressTitle: 'АДРЕС ДОСТАВКИ',
    addressLabel: 'Адрес доставки',
    addressPlaceholder: 'Вилла, отель или точный адрес доставки',
    promoCode: 'Промокод',
    optional: 'Необязательно',
    addonsTitle: 'ДОПОЛНЕНИЯ',
    addonsHelp: 'Дополнительные опции можно добавить сразу к бронированию.',
    addonsUnavailable: 'Дополнительные опции недоступны.',
    summaryTitle: 'СВОДКА ШАГА 2',
    pickDates: 'Выберите даты в календаре',
    datesNotSelected: 'Даты не выбраны',
    noOptions: 'Опции не выбраны',
    base: 'База',
    addons: 'Допы',
    delivery: 'Доставка',
    estimatedTotal: 'Примерный итог',
    continueToPayment: 'Перейти к оплате',
    nextStepHint: 'На следующем шаге вы выберете способ оплаты.',
    calendarTitle: 'КАЛЕНДАРЬ ДОСТУПНОСТИ',
    legendAvailable: 'Свободно',
    legendBooked: 'Занято',
    legendSelected: 'Выбрано',
    loadAvailabilityFailed: 'Не удалось загрузить доступность',
    pickEndDate: 'Выбран {date} — нажмите на дату окончания.',
    weekdays: ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'],
    selectedAddons: '{n} допов · ${amount}',
  },
  zh: { pageEyebrow: '第 2 步 / 共 3 步', pageTitle: '日期和送车地址', pageDesc: '绿色日期可用，红色日期已被预订。请选择租期并填写送车地址。', noScooter: '请先在车型页面选择一辆车。', selectedScooter: '已选车型', photo: '照片', changeScooter: '更换车型', timeTitle: '取车 / 还车时间', startTime: '开始时间', endTime: '结束时间', invalidRange: '结束日期和时间必须晚于开始时间。', addressTitle: '送车地址', addressLabel: '送车地址', addressPlaceholder: '别墅、酒店或准确地址', promoCode: '优惠码', optional: '可选', addonsTitle: '附加项', addonsHelp: '可以立即把附加项加入预订。', addonsUnavailable: '暂无附加项。', summaryTitle: '第 2 步摘要', pickDates: '请在日历中选择日期', datesNotSelected: '尚未选择日期', noOptions: '未选择附加项', base: '基础价', addons: '附加项', delivery: '送车', estimatedTotal: '预估总价', continueToPayment: '继续付款', nextStepHint: '下一步选择支付方式。', calendarTitle: '可用日期日历', legendAvailable: '可用', legendBooked: '已订', legendSelected: '已选', loadAvailabilityFailed: '加载可用日期失败', pickEndDate: '已选 {date}，请点击结束日期。', weekdays: ['一', '二', '三', '四', '五', '六', '日'], selectedAddons: '{n} 个附加项 · ${amount}' },
  id: { pageEyebrow: 'LANGKAH 2 DARI 3', pageTitle: 'Tanggal dan alamat pengantaran', pageDesc: 'Hari hijau tersedia, hari merah sudah dipesan. Pilih masa sewa dan isi alamat pengantaran.', noScooter: 'Pilih skuter dari katalog terlebih dahulu.', selectedScooter: 'SKUTER TERPILIH', photo: 'FOTO', changeScooter: 'Ganti skuter', timeTitle: 'WAKTU AMBIL / KEMBALI', startTime: 'Waktu mulai', endTime: 'Waktu selesai', invalidRange: 'Tanggal/waktu selesai harus setelah mulai.', addressTitle: 'ALAMAT PENGANTARAN', addressLabel: 'Alamat pengantaran', addressPlaceholder: 'Vila, hotel, atau alamat lengkap', promoCode: 'Kode promo', optional: 'Opsional', addonsTitle: 'TAMBAHAN', addonsHelp: 'Tambahan bisa langsung dimasukkan ke pesanan.', addonsUnavailable: 'Tambahan tidak tersedia.', summaryTitle: 'RINGKASAN LANGKAH 2', pickDates: 'Pilih tanggal di kalender', datesNotSelected: 'Tanggal belum dipilih', noOptions: 'Belum ada tambahan', base: 'Dasar', addons: 'Tambahan', delivery: 'Antar', estimatedTotal: 'Perkiraan total', continueToPayment: 'Lanjut ke pembayaran', nextStepHint: 'Pada langkah berikutnya Anda memilih metode pembayaran.', calendarTitle: 'KALENDER KETERSEDIAAN', legendAvailable: 'Tersedia', legendBooked: 'Dipesan', legendSelected: 'Dipilih', loadAvailabilityFailed: 'Gagal memuat ketersediaan', pickEndDate: 'Dipilih {date} — klik tanggal akhir.', weekdays: ['S', 'S', 'R', 'K', 'J', 'S', 'M'], selectedAddons: '{n} tambahan · ${amount}' },
  de: { pageEyebrow: 'SCHRITT 2 VON 3', pageTitle: 'Daten und Lieferadresse', pageDesc: 'Grüne Tage sind verfügbar, rote bereits gebucht. Wähle den Mietzeitraum und gib die Lieferadresse ein.', noScooter: 'Bitte zuerst einen Roller im Katalog wählen.', selectedScooter: 'AUSGEWÄHLTER ROLLER', photo: 'FOTO', changeScooter: 'Roller wechseln', timeTitle: 'ABHOL- / RÜCKGABEZEIT', startTime: 'Startzeit', endTime: 'Endzeit', invalidRange: 'Enddatum/-zeit muss nach dem Start liegen.', addressTitle: 'LIEFERADRESSE', addressLabel: 'Lieferadresse', addressPlaceholder: 'Villa, Hotel oder genaue Lieferadresse', promoCode: 'Promocode', optional: 'Optional', addonsTitle: 'EXTRAS', addonsHelp: 'Extras können sofort zur Buchung hinzugefügt werden.', addonsUnavailable: 'Keine Extras verfügbar.', summaryTitle: 'SCHRITT-2-ZUSAMMENFASSUNG', pickDates: 'Bitte Daten im Kalender wählen', datesNotSelected: 'Keine Daten gewählt', noOptions: 'Keine Extras gewählt', base: 'Basis', addons: 'Extras', delivery: 'Lieferung', estimatedTotal: 'Geschätzte Summe', continueToPayment: 'Weiter zur Zahlung', nextStepHint: 'Im nächsten Schritt wählst du die Zahlungsmethode.', calendarTitle: 'VERFÜGBARKEITSKALENDER', legendAvailable: 'Verfügbar', legendBooked: 'Gebucht', legendSelected: 'Ausgewählt', loadAvailabilityFailed: 'Verfügbarkeit konnte nicht geladen werden', pickEndDate: '{date} gewählt — Enddatum anklicken.', weekdays: ['M', 'D', 'M', 'D', 'F', 'S', 'S'], selectedAddons: '{n} Extras · ${amount}' },
  fr: { pageEyebrow: 'ÉTAPE 2 SUR 3', pageTitle: 'Dates et adresse de livraison', pageDesc: 'Les jours verts sont disponibles, les rouges sont déjà réservés. Choisissez la période et ajoutez votre adresse.', noScooter: 'Choisissez d’abord un scooter dans le catalogue.', selectedScooter: 'SCOOTER SÉLECTIONNÉ', photo: 'PHOTO', changeScooter: 'Changer de scooter', timeTitle: 'HEURE DE PRISE / RETOUR', startTime: 'Heure de début', endTime: 'Heure de fin', invalidRange: 'La date/heure de fin doit être après le début.', addressTitle: 'ADRESSE DE LIVRAISON', addressLabel: 'Adresse de livraison', addressPlaceholder: 'Villa, hôtel ou adresse exacte', promoCode: 'Code promo', optional: 'Optionnel', addonsTitle: 'OPTIONS', addonsHelp: 'Les options peuvent être ajoutées immédiatement à la réservation.', addonsUnavailable: 'Aucune option disponible.', summaryTitle: 'RÉSUMÉ DE L’ÉTAPE 2', pickDates: 'Choisissez les dates dans le calendrier', datesNotSelected: 'Dates non choisies', noOptions: 'Aucune option choisie', base: 'Base', addons: 'Options', delivery: 'Livraison', estimatedTotal: 'Total estimé', continueToPayment: 'Continuer vers le paiement', nextStepHint: 'À l’étape suivante, vous choisirez le mode de paiement.', calendarTitle: 'CALENDRIER DE DISPONIBILITÉ', legendAvailable: 'Disponible', legendBooked: 'Réservé', legendSelected: 'Sélectionné', loadAvailabilityFailed: 'Impossible de charger la disponibilité', pickEndDate: '{date} sélectionné — cliquez sur la date de fin.', weekdays: ['L', 'M', 'M', 'J', 'V', 'S', 'D'], selectedAddons: '{n} options · ${amount}' },
} as const;
type BookingCopy = (typeof BOOKING_COPY)[keyof typeof BOOKING_COPY];

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

function toAddonOptions(addons: ApiAddon[]) {
  return addons.map((addon) => ({
    id: addon.id,
    name: addon.name,
    price: addonPriceValue(addon),
  }));
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
  const copy = BOOKING_COPY[locale as keyof typeof BOOKING_COPY] || BOOKING_COPY.en;
  const router = useRouter();
  const search = useSearchParams();

  const scooterId = numberParam(search.get('scooter_id'));
  const initialName = search.get('name') || 'Scooter';
  const rawRouteId = search.get('route_id') || search.get('slug') || search.get('name') || '';
  const routeId = resolveScooterRouteId(rawRouteId, initialName) || rawRouteId;
  const initialPrice = Number(search.get('price') || '0') || 0;

  const [scooter, setScooter] = useState<ApiScooterDetail | null>(null);
  const [addons, setAddons] = useState<AddonOption[]>([]);
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
          setAddons(toAddonOptions(detail.available_addons));
        } else {
          const addonList = unwrapList(await endpoints.addons(locale));
          if (!cancelled) setAddons(toAddonOptions(addonList));
        }
      })
      .catch(async (error) => {
        if (cancelled) return;
        try {
          const addonList = unwrapList(await endpoints.addons(locale));
          if (!cancelled) setAddons(toAddonOptions(addonList));
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
      currency: 'USD',
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
    if (!quoteRequest || !effectiveScooterId || !quote || quoteError) {
      return;
    }

    bookingDraftStore.set({
      scooter_id: effectiveScooterId,
      route_id: routeId || undefined,
      name: scooter?.title || initialName,
      image: scooter?.main_image ? mediaUrl(scooter.main_image) : null,
      currency: quote.currency || 'USD',
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
  const currency = quote?.currency || 'USD';
  const baseTotal = Number(quote?.base_price || initialPrice || 0);
  const addonsTotal = Number(quote?.add_ons_price || 0);
  const deliveryTotal = Number(quote?.delivery_price || 0);
  const grandTotal = Number(quote?.total_price || baseTotal + addonsTotal + deliveryTotal);
  const rentalDays = Number(quote?.rental_days || 0);

  const addonsSubtotal = useMemo(() => {
    return selectedAddOnIds.reduce((sum, id) => {
      const found = addons.find((a) => a.id === id);
      return sum + (found?.price || 0);
    }, 0);
  }, [addons, selectedAddOnIds]);

  const canConfirmDates = Boolean(quote && !quoteLoading && !quoteError && isDateRangeValid);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#000' }}>
      <SiteHeader />

      <section className="br-booking-hero" style={{ padding: '56px 48px 28px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <BREyebrow>{copy.pageEyebrow}</BREyebrow>
        <h1 className="br-display" style={{ fontSize: 'clamp(40px, 7vw, 76px)', lineHeight: 0.94, letterSpacing: '-0.04em', margin: '12px 0 14px' }}>
          {copy.pageTitle}
        </h1>
        <p style={{ margin: 0, maxWidth: 760, color: 'rgba(0,0,0,0.62)', lineHeight: 1.65 }}>
          {copy.pageDesc}
        </p>
      </section>

      <section className="br-booking-content" style={{ padding: '32px 48px 88px' }}>
        <div className="br-booking-payment-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 24, alignItems: 'start' }}>
          <div className="br-booking-main-column" style={{ display: 'grid', gap: 24 }}>
            <div className="br-booking-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 22, padding: 24 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>
                {copy.selectedScooter}
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
                      <div className="br-mono" style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>{copy.photo}</div>
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
                        {copy.changeScooter}
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
                {copy.timeTitle}
              </div>
              <div className="br-booking-time-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 18 }}>
                <Field label={copy.startTime}>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
                </Field>
                <Field label={copy.endTime}>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
                </Field>
              </div>
              {startDateKey && endDateKey && !isDateRangeValid ? (
                <div className="br-mono" style={{ marginTop: 14, color: '#B91C1C', fontSize: 12 }}>
                  {copy.invalidRange}
                </div>
              ) : null}
            </div>

            <div className="br-booking-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 22, padding: 24 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>
                {copy.addressTitle}
              </div>
              <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
                <Field label={copy.addressLabel}>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                    placeholder={copy.addressPlaceholder}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 96 }}
                  />
                </Field>
                <Field label={copy.promoCode}>
                  <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder={copy.optional} style={inputStyle} />
                </Field>
              </div>
            </div>

            <div className="br-booking-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 22, padding: 24 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>
                {copy.addonsTitle}
              </div>
              <p style={{ margin: '12px 0 0', color: 'rgba(0,0,0,0.62)', lineHeight: 1.55 }}>
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
                        <span>{addon.name}</span>
                        <span className="br-mono">${addon.price.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="br-mono" style={{ marginTop: 16, color: 'rgba(0,0,0,0.55)', fontSize: 12 }}>
                  {copy.addonsUnavailable}
                </div>
              )}
            </div>
          </div>

          <aside className="br-booking-summary-aside" style={{ position: 'sticky', top: 90, display: 'grid', gap: 18 }}>
            <div className="br-booking-summary-card" style={{ borderRadius: 22, background: '#F5F5F5', padding: 24 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>
                {copy.summaryTitle}
              </div>
              <div className="br-display" style={{ marginTop: 12, fontSize: 28, lineHeight: 1 }}>
                {displayName}
              </div>
              <div style={{ marginTop: 10, color: 'rgba(0,0,0,0.58)', lineHeight: 1.55 }}>
                {startDateKey && endDateKey
                  ? `${startDateKey} ${startTime} — ${endDateKey} ${endTime}`
                  : copy.pickDates}
              </div>
              <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.58)', lineHeight: 1.55 }}>
                {rentalDays ? `${rentalDays} ${t.common.day}` : copy.datesNotSelected}
              </div>
              <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.58)', lineHeight: 1.55 }}>
                {selectedAddOnIds.length
                  ? copy.selectedAddons.replace('{n}', String(selectedAddOnIds.length)).replace('{amount}', addonsSubtotal.toFixed(2))
                  : copy.noOptions}
              </div>

              <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
                <PriceRow label={copy.base} value={`${currency} ${baseTotal.toFixed(2)}`} />
                <PriceRow label={copy.addons} value={`${currency} ${addonsTotal.toFixed(2)}`} />
                <PriceRow label={copy.delivery} value={`${currency} ${deliveryTotal.toFixed(2)}`} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                <span className="br-display" style={{ fontSize: 20 }}>{copy.estimatedTotal}</span>
                <span className="br-mono" style={{ fontSize: 28, fontWeight: 700 }}>{currency} {grandTotal.toFixed(2)}</span>
              </div>

              {quoteLoading ? <div className="br-mono" style={{ marginTop: 16, color: 'rgba(0,0,0,0.55)' }}>{t.common.loading}</div> : null}
              {quoteError ? <div className="br-mono" style={{ marginTop: 16, color: '#B91C1C' }}>{quoteError}</div> : null}

              <BRPrimary onClick={handleContinueToPayment} disabled={!canConfirmDates} full style={{ marginTop: 22 }}>
                {copy.continueToPayment}
              </BRPrimary>

              <div style={{ marginTop: 14, color: 'rgba(0,0,0,0.58)', fontSize: 13, lineHeight: 1.55 }}>
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
  copy: BookingCopy;
  startDateKey: string;
  endDateKey: string;
  onPick: (start: string, end: string) => void;
}) {
  const { t } = useLocale();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [calendars, setCalendars] = useState<CalendarMonth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthsToShow = useMemo(() => {
    const second = new Date(cursor.year, cursor.month + 1, 1);
    return [
      { year: cursor.year, month: cursor.month },
      { year: second.getFullYear(), month: second.getMonth() },
    ];
  }, [cursor]);

  useEffect(() => {
    if (!scooterId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all(
      monthsToShow.map(async (m) => {
        try {
          const data = await endpoints.scooterAvailability(scooterId, {
            year: m.year,
            month: m.month + 1,
          });
          if ('days' in data) return { ...m, data: data as ApiAvailabilityCalendar };
          return { ...m, data: null };
        } catch {
          return { ...m, data: null };
        }
      })
    )
      .then((result) => {
        if (cancelled) return;
        setCalendars(result);
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
  }, [copy.loadAvailabilityFailed, monthsToShow, scooterId]);

  const dayStatusMap = useMemo(() => {
    const map = new Map<string, AvailabilityDayStatus>();
    for (const cal of calendars) {
      if (!cal.data) continue;
      for (const day of cal.data.days) {
        map.set(day.date, day.status);
      }
    }
    return map;
  }, [calendars]);

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
          {copy.calendarTitle}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => shiftMonth(-1)} className="br-mono" style={navButtonStyle}>←</button>
          <button type="button" onClick={() => shiftMonth(1)} className="br-mono" style={navButtonStyle}>→</button>
        </div>
      </div>

      <div className="br-booking-calendar-legend" style={{ display: 'flex', gap: 16, marginTop: 14, color: 'rgba(0,0,0,0.62)', fontSize: 12 }}>
        <Legend color="#16A34A" label={copy.legendAvailable} />
        <Legend color="#DC2626" label={copy.legendBooked} />
        <Legend color="#FFD700" label={copy.legendSelected} />
      </div>

      {loading && <div className="br-mono" style={{ marginTop: 14, color: 'rgba(0,0,0,0.55)', fontSize: 12 }}>{t.common.loading}</div>}
      {error && <div className="br-mono" style={{ marginTop: 14, color: '#B91C1C', fontSize: 12 }}>{error}</div>}

      <div className="br-booking-calendar-months" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18, marginTop: 18 }}>
        {monthsToShow.map((m) => (
          <MonthGrid
            key={`${m.year}-${m.month}`}
            year={m.year}
            month={m.month}
            locale={locale}
            weekdays={copy.weekdays}
            today={today}
            startDateKey={startDateKey}
            endDateKey={endDateKey}
            statusMap={dayStatusMap}
            onPick={handleDayClick}
          />
        ))}
      </div>

      {startDateKey && !endDateKey ? (
        <div className="br-mono" style={{ marginTop: 14, color: 'rgba(0,0,0,0.62)', fontSize: 12 }}>
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.55)' }}>
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
      <span style={{ color: 'rgba(0,0,0,0.58)' }}>{label}</span>
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
