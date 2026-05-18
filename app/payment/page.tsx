'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BRPhoto, BREyebrow, BRPrimary } from '@/components/BR';
import { CheckIcon, CreditCardIcon, CryptoIcon, LockIcon, WalletIcon, stripLeadingSymbol } from '@/components/Icons';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { ApiError, tokens, userStore } from '@/lib/api';
import { bookingDraftStore } from '@/lib/bookingDraft';
import { ApiBooking, ApiBookingQuote, endpoints, toApiPaymentMethod } from '@/lib/endpoints';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { convertAmount, formatCurrencyAmount, useCurrency } from '@/lib/i18n/CurrencyProvider';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { type PaymentExtraContent, PAYMENT_COPY } from '@/lib/siteContentExtras';
import { useSiteContentPreview } from '@/lib/siteContentPreview';

type PaymentMethod = 'card' | 'cash' | 'crypto';

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentInner />
    </Suspense>
  );
}

function PaymentInner() {
  const { t, tr, locale } = useLocale();
  const { marker } = useSiteContentPreview();
  const copy = {
    ...PAYMENT_COPY.en,
    ...(PAYMENT_COPY[locale as keyof typeof PAYMENT_COPY] || PAYMENT_COPY.en),
    ...(t.payment as Partial<PaymentExtraContent>),
  } as PaymentExtraContent;
  const { user, refresh } = useAuth();
  const { currency: selectedCurrency } = useCurrency();
  const search = useSearchParams();
  const existingBookingId = Number(search.get('booking_id') || '0');
  const [draft, setDraft] = useState(bookingDraftStore.get());
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [quote, setQuote] = useState<ApiBookingQuote | null>(null);
  const [pm, setPm] = useState<PaymentMethod>(
    search.get('payment') === 'cash' ? 'cash' : search.get('payment') === 'crypto' ? 'crypto' : 'card'
  );
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestHasTelegram, setGuestHasTelegram] = useState(false);
  const [guestHasWechat, setGuestHasWechat] = useState(false);
  const [guestHasWhatsapp, setGuestHasWhatsapp] = useState(false);

  // Card form (UI only — actual processing happens at the redirected provider)
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Crypto-specific UI
  const [cryptoCurrency] = useState<'USDT'>('USDT');

  // Cash-specific UI
  const [cashConfirmedTerms, setCashConfirmedTerms] = useState(false);

  const [loading, setLoading] = useState(Boolean(existingBookingId) || Boolean(draft));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const fg = '#000';
  const bg = '#fff';
  const sub = 'rgba(0,0,0,0.55)';
  const surf = '#F5F5F5';
  const border = 'rgba(0,0,0,0.08)';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (existingBookingId) {
          const nextBooking = await endpoints.booking(existingBookingId, locale);
          if (cancelled) return;
          setBooking(nextBooking);
          setPaid(nextBooking.payment_status === 'paid' || nextBooking.latest_payment?.status === 'succeeded');
          return;
        }

        const currentDraft = bookingDraftStore.get();
        if (!currentDraft) {
          if (!cancelled) setError(copy.missingDetails);
          return;
        }

        setDraft(currentDraft);
        const nextQuote = await endpoints.bookingCalculate({
          scooter_id: currentDraft.scooter_id,
          start_datetime: currentDraft.start_datetime,
          end_datetime: currentDraft.end_datetime,
          delivery_time: currentDraft.delivery_time,
          delivery_address: currentDraft.delivery_address,
          add_on_ids: currentDraft.add_on_ids,
          promo_code: currentDraft.promo_code,
          payment_method: toApiPaymentMethod(pm),
          currency: selectedCurrency,
        });
        if (!cancelled) setQuote(nextQuote);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : t.auth.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [copy.missingDetails, existingBookingId, locale, pm, selectedCurrency, t.auth.error]);

  useEffect(() => {
    if (paymentUrl && /^https?:/i.test(paymentUrl)) {
      const timer = setTimeout(() => {
        window.location.href = paymentUrl;
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [paymentUrl]);

  const messengerOptions = [
    { key: 'telegram', label: copy.messengerTelegram, checked: guestHasTelegram, setChecked: setGuestHasTelegram, contentKey: 'payment.messengerTelegram' },
    { key: 'wechat', label: copy.messengerWeChat, checked: guestHasWechat, setChecked: setGuestHasWechat, contentKey: 'payment.messengerWeChat' },
    { key: 'whatsapp', label: copy.messengerWhatsApp, checked: guestHasWhatsapp, setChecked: setGuestHasWhatsapp, contentKey: 'payment.messengerWhatsApp' },
  ] as const;

  function validateMethodForm(): string | null {
    if (pm === 'card') {
      const digits = cardNumber.replace(/\s+/g, '');
      if (!cardName.trim()) return copy.cardNameRequired;
      if (digits.length < 12 || !/^[0-9]+$/.test(digits)) return copy.cardNumberInvalid;
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) return copy.cardExpiryInvalid;
      if (!/^\d{3,4}$/.test(cardCvc)) return copy.cardCvcInvalid;
    }
    if (pm === 'cash' && !cashConfirmedTerms) {
      return copy.cashConsent;
    }
    return null;
  }

  async function handleConfirm() {
    setError(null);
    const formError = validateMethodForm();
    if (formError) {
      setError(formError);
      return;
    }
    setSubmitting(true);
    try {
      let activeBooking = booking;

      if (!activeBooking) {
        const currentDraft = bookingDraftStore.get();
        if (!currentDraft) {
          throw new Error(copy.draftMissing);
        }

        const payload = {
          scooter_id: currentDraft.scooter_id,
          start_datetime: currentDraft.start_datetime,
          end_datetime: currentDraft.end_datetime,
          delivery_time: currentDraft.delivery_time,
          delivery_address: currentDraft.delivery_address,
          add_on_ids: currentDraft.add_on_ids,
          promo_code: currentDraft.promo_code,
          payment_method: toApiPaymentMethod(pm),
          currency: selectedCurrency,
        };

        if (user) {
          activeBooking = await endpoints.createBooking(payload, locale);
        } else {
          if (!guestName.trim() || !guestPhone.trim()) {
            throw new Error(copy.guestRequired);
          }
          const result = await endpoints.guestCreateBooking(
            {
              ...payload,
              guest_full_name: guestName.trim(),
              guest_phone: guestPhone.trim(),
              guest_has_telegram: guestHasTelegram,
              guest_has_wechat: guestHasWechat,
              guest_has_whatsapp: guestHasWhatsapp,
              language: locale,
            },
            locale
          );
          activeBooking = result.booking;
          if (result.auth?.access && result.auth?.refresh) {
            tokens.set({ access: result.auth.access, refresh: result.auth.refresh });
            try {
              const profile = await endpoints.profile();
              userStore.set(profile);
              await refresh();
            } catch {}
          }
        }

        setBooking(activeBooking);
        bookingDraftStore.clear();
      }

      if (pm === 'cash' || activeBooking.payment_method === 'cash_on_delivery') {
        setPaid(true);
        return;
      }

      const provider = pm === 'crypto' ? 'crypto' : 'stripe';
      const payment = await endpoints.createPayment({ booking_id: activeBooking.id, provider });
      if (payment.payment_url) {
        setPaymentUrl(payment.payment_url);
      } else {
        setPaid(true);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : t.auth.error);
    } finally {
      setSubmitting(false);
    }
  }

  const bookingName = booking?.scooter?.title || draft?.name || search.get('name') || copy.bookingName;
  const startLabel = booking
    ? new Date(booking.start_datetime).toLocaleString(locale)
    : draft
      ? new Date(draft.start_datetime).toLocaleString(locale)
      : '—';
  const endLabel = booking
    ? new Date(booking.end_datetime).toLocaleString(locale)
    : draft
      ? new Date(draft.end_datetime).toLocaleString(locale)
      : '—';
  const reserveOnly = booking?.payment_method === 'cash_on_delivery' || pm === 'cash';
  const summary = useMemo(() => {
    const toSelectedCurrency = (amount: string | number | undefined, fromCurrency?: string | null) =>
      convertAmount(Number(amount || 0), fromCurrency || 'USD', selectedCurrency);
    // Keep the final payment step aligned with step 2:
    // pricing amounts still come back from the API in USD even when another currency is requested.
    const pricingSourceCurrency = 'USD';

    if (booking) {
      return {
        base: toSelectedCurrency(booking.base_price, pricingSourceCurrency),
        addons: toSelectedCurrency(booking.add_ons_price, pricingSourceCurrency),
        delivery: toSelectedCurrency(booking.delivery_price, pricingSourceCurrency),
        total: toSelectedCurrency(booking.total_price, pricingSourceCurrency),
        currency: selectedCurrency,
      };
    }
    return {
      base: toSelectedCurrency(quote?.base_price, pricingSourceCurrency),
      addons: toSelectedCurrency(quote?.add_ons_price, pricingSourceCurrency),
      delivery: toSelectedCurrency(quote?.delivery_price, pricingSourceCurrency),
      total: toSelectedCurrency(quote?.total_price, pricingSourceCurrency),
      currency: selectedCurrency,
    };
  }, [booking, quote, selectedCurrency]);

  const trustMarks = [
    { icon: LockIcon, label: stripLeadingSymbol(t.booking.secure), contentKey: 'booking.secure' },
    { icon: CheckIcon, label: stripLeadingSymbol(t.booking.pci), contentKey: 'booking.pci' },
    { icon: CheckIcon, label: stripLeadingSymbol(t.booking.cancel24), contentKey: 'booking.cancel24' },
  ] as const;

  return (
    <div style={{ background: bg, color: fg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />
      <div className="br-payment-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${border}` }}>
        <span className="br-mono" {...marker('payment.topbar')} style={{ fontSize: 11, color: sub, letterSpacing: '0.12em' }}>{copy.topbar}</span>
        <span className="br-mono" style={{ fontSize: 11, color: sub }}>{summary.currency}</span>
      </div>
      <div className="br-payment-shell" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 460px', gap: 0 }}>
        <div className="br-payment-main" style={{ padding: '60px 60px' }}>
          <BREyebrow><span {...marker('payment.step')}>{t.payment.step}</span></BREyebrow>
          <h1 className="br-display" style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 0.98, margin: '10px 0 32px' }}>
            {paid ? t.payment.confirmedTitle : <span {...marker('payment.pageTitle')}>{copy.pageTitle}</span>}
          </h1>

          {loading && <div className="br-mono" style={{ color: sub }}>{t.common.loading}</div>}

          {paymentUrl && (
            <div style={{ background: '#FFF6CC', padding: 20, borderRadius: 12 }}>
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.1em' }}>{t.payment.redirect}</div>
              <a href={paymentUrl} className="br-mono" style={{ display: 'inline-block', marginTop: 8, color: '#000' }}>{paymentUrl}</a>
            </div>
          )}

          {paid ? (
            <div style={{ background: '#FFD700', borderRadius: 14, padding: 32 }}>
              <div className="br-mono" {...marker(reserveOnly ? 'payment.reserved' : 'payment.confirmed')} style={{ fontSize: 11, letterSpacing: '0.14em' }}>{reserveOnly ? copy.reserved : copy.confirmed}</div>
              <div className="br-display" style={{ fontSize: 40, marginTop: 8, letterSpacing: '-0.03em' }}>#{booking?.order_number || booking?.id || '—'}</div>
              <p {...marker(reserveOnly ? 'payment.reservedDesc' : 'payment.confirmedDesc')} style={{ marginTop: 16, fontSize: 15, lineHeight: 1.55, maxWidth: 460 }}>
                {reserveOnly ? copy.reservedDesc : t.payment.confirmedDesc}
              </p>
              <div className="br-payment-success-actions" style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <BRPrimary href="/profile" style={{ background: '#000', color: '#FFD700' }}><span {...marker('payment.openProfile')}>{copy.openProfile}</span></BRPrimary>
                <BRPrimary href="/" style={{ background: '#fff', color: '#000' }}><span {...marker('payment.home')}>{t.payment.home}</span></BRPrimary>
              </div>
            </div>
          ) : (
            !paymentUrl && !loading && (
              <>
                <div className="br-payment-methods" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  {(['card', 'cash', 'crypto'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPm(p)}
                      className="br-mono"
                      style={{
                        padding: '12px 20px',
                        borderRadius: 999,
                        border: `1px solid ${pm === p ? '#FFD700' : border}`,
                        background: pm === p ? '#FFD700' : 'transparent',
                        color: pm === p ? '#000' : fg,
                        cursor: 'pointer',
                        fontSize: 12,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {p === 'card' && <CreditCardIcon size={14} color="currentColor" />}
                        {p === 'cash' && <WalletIcon size={14} color="currentColor" />}
                        {p === 'crypto' && <CryptoIcon size={14} color="currentColor" />}
                        <span {...marker(p === 'card' ? 'payment.methodCard' : p === 'cash' ? 'payment.methodCash' : 'payment.methodCrypto')}>
                          {p === 'card' ? copy.methodCard : p === 'cash' ? copy.methodCash : copy.methodCrypto}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                {!user && (
                  <div className="br-payment-card" style={{ border: `1px solid ${border}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
                    <div className="br-mono" {...marker('payment.contactDetails')} style={{ fontSize: 11, letterSpacing: '0.12em', color: sub }}>{copy.contactDetails}</div>
                    <div className="br-payment-guest-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 14 }}>
                      <Field label={t.auth.name} contentKey="auth.name">
                        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} style={inputStyle} />
                      </Field>
                      <Field label={t.auth.phone} contentKey="auth.phone">
                        <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} style={inputStyle} />
                      </Field>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div className="br-mono" {...marker('payment.messengerTitle')} style={{ fontSize: 11, letterSpacing: '0.1em', color: sub, marginBottom: 8 }}>{copy.messengerTitle}</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {messengerOptions.map((item) => (
                            <label
                              key={item.key}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 12px',
                                borderRadius: 999,
                                border: `1px solid ${border}`,
                                background: '#fff',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: 13,
                                color: fg,
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={(event) => item.setChecked(event.target.checked)}
                              />
                              <span {...marker(item.contentKey)}>{item.label}</span>
                            </label>
                          ))}
                        </div>
                        <div {...marker('payment.messengerHint')} style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: sub, marginTop: 8 }}>{copy.messengerHint}</div>
                      </div>
                      <div style={{ display: 'grid', alignContent: 'end' }}>
                        <Link href="/login" className="br-mono" style={{ color: '#000', fontSize: 12 }}>
                          <span {...marker('payment.alreadyHave')}>{copy.alreadyHave}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {pm === 'card' && (
                  <CardTemplate
                    copy={copy}
                    cardName={cardName}
                    setCardName={setCardName}
                    cardNumber={cardNumber}
                    setCardNumber={setCardNumber}
                    cardExpiry={cardExpiry}
                    setCardExpiry={setCardExpiry}
                    cardCvc={cardCvc}
                    setCardCvc={setCardCvc}
                  />
                )}

                {pm === 'cash' && (
                  <CashTemplate
                    copy={copy}
                    confirmed={cashConfirmedTerms}
                    setConfirmed={setCashConfirmedTerms}
                    deliveryAddress={draft?.delivery_address || booking?.delivery_address || ''}
                  />
                )}

                {pm === 'crypto' && (
                  <CryptoTemplate
                    copy={copy}
                    currency={cryptoCurrency}
                    total={summary.total}
                    displayCurrency={summary.currency}
                  />
                )}

                <div className="br-mono" style={{ display: 'flex', gap: 16, marginTop: 24, fontSize: 11, color: sub, letterSpacing: '0.1em', flexWrap: 'wrap' }}>
                  {trustMarks.map(({ icon: Icon, label, contentKey }) => (
                    <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={12} color="currentColor" />
                      <span {...marker(contentKey)}>{label}</span>
                    </span>
                  ))}
                </div>
                {error && <div className="br-mono" style={{ marginTop: 20, color: '#B91C1C', fontSize: 13 }}>{error}</div>}
                <div className="br-payment-cta-wrap" style={{ marginTop: 40 }}>
                  <BRPrimary onClick={handleConfirm} disabled={submitting || (!booking && !draft)} style={{ padding: '20px 36px', fontSize: 15 }}>
                    {submitting
                      ? t.common.loading
                      : pm === 'cash'
                        ? <span {...marker('payment.reserveCash')}>{copy.reserveCash}</span>
                        : pm === 'crypto'
                          ? <span {...marker('payment.payCrypto')}>{copy.payCrypto.replace('{currency}', cryptoCurrency)}</span>
                          : <span {...marker('payment.pay')}>{tr(t.payment.pay, { amount: formatCurrencyAmount(summary.total, summary.currency) })}</span>}
                  </BRPrimary>
                </div>
              </>
            )
          )}
        </div>
        <div className="br-payment-side" style={{ background: surf, padding: 40 }}>
          {draft?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.image} alt={bookingName} style={{ width: '100%', height: 200, objectFit: 'contain', borderRadius: 12, background: '#fff', padding: 12 }} />
          ) : (
            <div {...marker('payment.bookingLabel')}>
              <BRPhoto tone="sand" label={copy.bookingLabel} style={{ height: 200, borderRadius: 12 }} />
            </div>
          )}
          <h3 className="br-display" style={{ fontSize: 22, marginTop: 18 }}>{bookingName}</h3>
          <div className="br-mono" style={{ fontSize: 12, color: sub }}>{startLabel} → {endLabel}</div>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${border}` }}>
            <BREyebrow><span {...marker('payment.breakdown')}>{t.payment.breakdown}</span></BREyebrow>
            <div style={{ marginTop: 14, fontFamily: 'var(--br-mono)', fontSize: 13 }}>
              {[
                ['payment.base', copy.base, formatCurrencyAmount(summary.base, summary.currency)],
                ['payment.addons', copy.addons, formatCurrencyAmount(summary.addons, summary.currency)],
                ['payment.delivery', t.payment.delivery, summary.delivery === 0 ? t.payment.free : formatCurrencyAmount(summary.delivery, summary.currency)],
              ].map(([key, l, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span {...marker(key)} style={{ color: sub }}>{l}</span><span>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${border}` }}>
              <span className="br-display" style={{ fontSize: 18 }}>{t.detail.total}</span>
              <span style={{ background: '#FFD700', color: '#000', padding: '6px 14px', borderRadius: 999, fontFamily: 'var(--br-mono)', fontSize: 24, fontWeight: 600 }}>{formatCurrencyAmount(summary.total, summary.currency)}</span>
            </div>
          </div>
          <div style={{ marginTop: 28, padding: 16, background: bg, borderRadius: 10 }}>
            <div className="br-mono" style={{ fontSize: 10, color: sub, letterSpacing: '0.14em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <LockIcon size={12} color="currentColor" />
              <span {...marker('payment.protected')}>{stripLeadingSymbol(t.payment.protected)}</span>
            </div>
            <div {...marker('payment.protectedDesc')} style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>{t.payment.protectedDesc}</div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function CardTemplate({
  copy,
  cardName,
  setCardName,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvc,
  setCardCvc,
}: {
  copy: PaymentExtraContent;
  cardName: string;
  setCardName: (v: string) => void;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvc: string;
  setCardCvc: (v: string) => void;
}) {
  const { marker } = useSiteContentPreview();
  function formatNumber(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return (
    <div className="br-payment-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 22, background: '#fff' }}>
      <div className="br-mono" {...marker('payment.bankCard')} style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.55)' }}>
        {copy.bankCard}
      </div>
      <p {...marker('payment.bankCardDesc')} style={{ margin: '10px 0 18px', color: 'rgba(0,0,0,0.62)', fontSize: 13, lineHeight: 1.6 }}>
        {copy.bankCardDesc}
      </p>
      <div style={{ display: 'grid', gap: 14 }}>
        <Field label={copy.cardholder} contentKey="payment.cardholder">
          <input
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            placeholder=""
            style={inputStyle}
            autoComplete="cc-name"
          />
        </Field>
        <Field label={copy.cardNumber} contentKey="payment.cardNumber">
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(formatNumber(e.target.value))}
            placeholder=""
            style={inputStyle}
            inputMode="numeric"
            autoComplete="cc-number"
          />
        </Field>
        <div className="br-payment-card-expiry-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          <Field label={copy.cardExpiry} contentKey="payment.cardExpiry">
            <input
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
              placeholder=""
              style={inputStyle}
              inputMode="numeric"
              autoComplete="cc-exp"
            />
          </Field>
          <Field label="CVC" contentKey="booking.cvc">
            <input
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder=""
              style={inputStyle}
              inputMode="numeric"
              autoComplete="cc-csc"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function CashTemplate({
  copy,
  confirmed,
  setConfirmed,
  deliveryAddress,
}: {
  copy: PaymentExtraContent;
  confirmed: boolean;
  setConfirmed: (v: boolean) => void;
  deliveryAddress: string;
}) {
  const { marker } = useSiteContentPreview();
  return (
    <div className="br-payment-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 22, background: '#fff' }}>
      <div className="br-mono" {...marker('payment.cashTitle')} style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.55)' }}>
        {copy.cashTitle}
      </div>
      <p {...marker('payment.cashDesc')} style={{ margin: '10px 0 14px', color: 'rgba(0,0,0,0.62)', fontSize: 14, lineHeight: 1.6 }}>
        {copy.cashDesc}
      </p>
      {deliveryAddress ? (
        <div style={{ background: '#F5F5F5', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
          <div className="br-mono" {...marker('payment.deliveryAddress')} style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>{copy.deliveryAddress}</div>
          <div style={{ marginTop: 4 }}>{deliveryAddress}</div>
        </div>
      ) : (
        <div className="br-mono" {...marker('payment.noDelivery')} style={{ color: '#B91C1C', fontSize: 12 }}>
          {copy.noDelivery}
        </div>
      )}
      <ul style={{ marginTop: 18, paddingLeft: 20, color: 'rgba(0,0,0,0.7)', fontSize: 13, lineHeight: 1.7 }}>
        <li><span {...marker('payment.cashBullet1')}>{copy.cashBullet1}</span></li>
        <li><span {...marker('payment.cashBullet2')}>{copy.cashBullet2}</span></li>
        <li><span {...marker('payment.cashBullet3')}>{copy.cashBullet3}</span></li>
      </ul>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 18, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ marginTop: 4 }}
        />
        <span {...marker('payment.cashConfirm')} style={{ fontSize: 13, lineHeight: 1.5 }}>
          {copy.cashConfirm}
        </span>
      </label>
    </div>
  );
}

function CryptoTemplate({
  copy,
  currency,
  total,
  displayCurrency,
}: {
  copy: PaymentExtraContent;
  currency: 'USDT';
  total: number;
  displayCurrency: string;
}) {
  const { marker } = useSiteContentPreview();
  return (
    <div className="br-payment-card" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 22, background: '#fff' }}>
      <div className="br-mono" {...marker('payment.cryptoTitle')} style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.55)' }}>
        {copy.cryptoTitle}
      </div>
      <p {...marker('payment.cryptoDesc')} style={{ margin: '10px 0 18px', color: 'rgba(0,0,0,0.62)', fontSize: 14, lineHeight: 1.6 }}>
        {copy.cryptoDesc}
      </p>
      <div className="br-mono" {...marker('payment.selectCurrency')} style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.55)' }}>
        {copy.selectCurrency}
      </div>
      <div className="br-payment-crypto-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10, marginTop: 12 }}>
        <div
          style={{
            padding: '14px 12px',
            borderRadius: 14,
            border: '1px solid #FFD700',
            background: 'rgba(255,215,0,0.16)',
            textAlign: 'left',
          }}
        >
          <div className="br-display" style={{ fontSize: 18 }}>USDT</div>
          <div className="br-mono" {...marker('payment.cryptoNetwork')} style={{ fontSize: 10, color: 'rgba(0,0,0,0.55)', marginTop: 4 }}>
            {copy.cryptoNetwork}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 18, background: '#F5F5F5', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
        <div className="br-mono" {...marker('payment.amount')} style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.55)' }}>{copy.amount}</div>
        <div style={{ marginTop: 4 }}>
          {formatCurrencyAmount(total, displayCurrency)} → {currency} (<span {...marker('payment.amountHint')}>{copy.amountHint}</span>)
        </div>
      </div>
    </div>
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
