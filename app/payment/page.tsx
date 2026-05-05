'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BRPhoto, BREyebrow, BRPrimary } from '@/components/BR';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { ApiBooking, endpoints } from '@/lib/endpoints';
import { ApiError } from '@/lib/api';

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentInner />
    </Suspense>
  );
}

function PaymentInner() {
  const { t, tr, locale } = useLocale();
  const search = useSearchParams();
  const bookingId = Number(search.get('booking_id') || '0');
  const fallbackName = search.get('name') || `Booking #${bookingId || '—'}`;
  const requestedPayment = search.get('payment');

  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [pm, setPm] = useState<'card' | 'cash' | 'crypto'>(requestedPayment === 'cash' || requestedPayment === 'crypto' ? requestedPayment : 'card');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(Boolean(bookingId));
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
    if (!bookingId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    endpoints.booking(bookingId)
      .then((nextBooking) => {
        if (cancelled) return;
        setBooking(nextBooking);
        if (nextBooking.payment_status === 'paid' || nextBooking.latest_payment?.status === 'succeeded') {
          setPaid(true);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : t.auth.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId, t.auth.error]);

  useEffect(() => {
    if (paymentUrl && /^https?:/i.test(paymentUrl)) {
      const timer = setTimeout(() => {
        window.location.href = paymentUrl;
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [paymentUrl]);

  useEffect(() => {
    if (booking?.payment_method === 'cash_on_delivery') {
      setPm('cash');
    }
  }, [booking?.payment_method]);

  const summary = useMemo(() => {
    const base = Number(booking?.base_price || 0);
    const addons = Number(booking?.add_ons_price || 0);
    const delivery = Number(booking?.delivery_price || 0);
    const total = Number(booking?.total_price || 0);
    return { base, addons, delivery, total };
  }, [booking]);

  async function pay() {
    setError(null);
    setSubmitting(true);
    try {
      if (bookingId) {
        if (booking?.payment_method === 'cash_on_delivery' || pm === 'cash') {
          setPaid(true);
          return;
        }
        const provider = pm === 'crypto' ? 'crypto' : pm === 'card' ? 'stripe' : 'mock';
        const res = await endpoints.createPayment({ booking_id: bookingId, provider });
        if (res.payment_url) {
          setPaymentUrl(res.payment_url);
        } else {
          setPaid(true);
        }
      } else {
        setPaid(true);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t.auth.error;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const bookingName = booking?.scooter?.title || fallbackName;
  const startLabel = booking ? new Date(booking.start_datetime).toLocaleString(locale) : '—';
  const endLabel = booking ? new Date(booking.end_datetime).toLocaleString(locale) : '—';
  const reserveOnly = booking?.payment_method === 'cash_on_delivery' || pm === 'cash';

  return (
    <div style={{ background: bg, color: fg, minHeight: '100vh' }}>
      <SiteHeader />
      <div className="br-payment-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${border}` }}>
        <span className="br-mono" style={{ fontSize: 11, color: sub, letterSpacing: '0.12em' }}>{t.payment.secure} · #{bookingId || '—'}</span>
        <span className="br-mono" style={{ fontSize: 11, color: sub }}>{booking?.currency || 'USD'} ⌄</span>
      </div>
      <div className="br-payment-shell" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 460px', gap: 0 }}>
        <div className="br-payment-main" style={{ padding: '60px 60px' }}>
          <BREyebrow>{t.payment.step}</BREyebrow>
          <h1 className="br-display" style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 0.98, margin: '10px 0 32px' }}>
            {paid ? t.payment.confirmedTitle : t.payment.title}
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
              <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em' }}>{reserveOnly ? 'BOOKING RESERVED' : 'RESERVATION CONFIRMED'}</div>
              <div className="br-display" style={{ fontSize: 40, marginTop: 8, letterSpacing: '-0.03em' }}>#{booking?.order_number || bookingId || '—'}</div>
              <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.55, maxWidth: 460 }}>
                {reserveOnly ? 'Your scooter is reserved. We will confirm delivery details and you can pay on handover.' : t.payment.confirmedDesc}
              </p>
              <div style={{ marginTop: 20 }}>
                <BRPrimary href="/" style={{ background: '#000', color: '#FFD700' }}>{t.payment.home}</BRPrimary>
              </div>
            </div>
          ) : (
            !paymentUrl && !loading && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  {(['card', 'cash', 'crypto'] as const).map((p) => (
                    <button key={p} onClick={() => setPm(p)} className="br-mono" style={{
                      padding: '12px 20px', borderRadius: 999,
                      border: `1px solid ${pm === p ? '#FFD700' : border}`,
                      background: pm === p ? '#FFD700' : 'transparent',
                      color: pm === p ? '#000' : fg,
                      cursor: 'pointer', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase'
                    }}>
                      {p === 'card' && '◫ '}{p === 'cash' && '$ '}{p === 'crypto' && '◇ '}{p}
                    </button>
                  ))}
                </div>

                <div style={{ background: surf, borderRadius: 14, padding: 18, border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                    {pm === 'cash'
                      ? 'No online payment is required. Confirm the booking and pay on delivery.'
                      : pm === 'crypto'
                        ? 'A crypto invoice will be generated for this booking after confirmation.'
                        : 'You will be redirected to the secure payment provider to complete the card payment.'}
                  </div>
                </div>

                <div className="br-mono" style={{ display: 'flex', gap: 16, marginTop: 24, fontSize: 11, color: sub, letterSpacing: '0.1em', flexWrap: 'wrap' }}>
                  <span>{t.booking.secure}</span>
                  <span>{t.booking.pci}</span>
                  <span>{t.booking.cancel24}</span>
                </div>
                {error && <div className="br-mono" style={{ marginTop: 20, color: '#B91C1C', fontSize: 13 }}>{error}</div>}
                <div style={{ marginTop: 40 }}>
                  <BRPrimary onClick={pay} disabled={submitting || !bookingId} style={{ padding: '20px 36px', fontSize: 15 }}>
                    {submitting ? t.common.loading : reserveOnly ? 'Reserve booking →' : tr(t.payment.pay, { amount: `$${summary.total.toFixed(2)}` })}
                  </BRPrimary>
                </div>
              </>
            )
          )}
        </div>
        <div className="br-payment-side" style={{ background: surf, padding: 40 }}>
          <BRPhoto tone="sand" label="BOOKING" style={{ height: 200, borderRadius: 12 }} />
          <h3 className="br-display" style={{ fontSize: 22, marginTop: 18 }}>{bookingName}</h3>
          <div className="br-mono" style={{ fontSize: 12, color: sub }}>{startLabel} → {endLabel}</div>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${border}` }}>
            <BREyebrow>{t.payment.breakdown}</BREyebrow>
            <div style={{ marginTop: 14, fontFamily: 'var(--br-mono)', fontSize: 13 }}>
              {[
                ['Base', `$${summary.base.toFixed(2)}`],
                ['Add-ons', `$${summary.addons.toFixed(2)}`],
                [t.payment.delivery, summary.delivery === 0 ? t.payment.free : `$${summary.delivery.toFixed(2)}`],
              ].map(([l, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: sub }}>{l}</span><span>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${border}` }}>
              <span className="br-display" style={{ fontSize: 18 }}>{t.detail.total}</span>
              <span style={{ background: '#FFD700', color: '#000', padding: '6px 14px', borderRadius: 999, fontFamily: 'var(--br-mono)', fontSize: 24, fontWeight: 600 }}>${summary.total.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ marginTop: 28, padding: 16, background: bg, borderRadius: 10 }}>
            <div className="br-mono" style={{ fontSize: 10, color: sub, letterSpacing: '0.14em' }}>{t.payment.protected}</div>
            <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>{t.payment.protectedDesc}</div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
