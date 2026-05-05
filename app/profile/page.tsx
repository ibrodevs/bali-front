'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BREyebrow, BRChip, BRPrimary, BROutline, BRPhoto } from '@/components/BR';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { Locale, LOCALES } from '@/lib/i18n/dictionaries';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { ApiBooking, ApiPayment, endpoints, unwrapList } from '@/lib/endpoints';
import { ApiError, mediaUrl } from '@/lib/api';

const PROFILE_COPY_EN = {
  overview: 'Overview',
  bookings: 'Bookings',
  settings: 'Settings',
  statsBookings: 'Total bookings',
  statsActive: 'Active rentals',
  statsPaid: 'Paid amount',
  nextRide: 'Next ride',
  noRide: 'No upcoming rides yet',
  noBookings: 'No bookings yet. Your next Bali ride will appear here.',
  profileSaved: 'Profile saved successfully.',
  profileSaveFailed: 'Could not save the profile.',
  bookingCancelled: 'Booking cancelled.',
  bookingCancelFailed: 'Could not cancel the booking.',
  paymentStarted: 'Payment session created.',
  paymentStartFailed: 'Could not start the payment.',
  openPayment: 'Open payment',
  payNow: 'Pay now',
  cancelBooking: 'Cancel booking',
  save: 'Save changes',
  fullName: 'Full name',
  phone: 'Phone',
  country: 'Country',
  language: 'Language',
  currency: 'Currency',
  memberSince: 'Member since',
  delivery: 'Delivery',
  paymentMethod: 'Payment',
  paymentStatus: 'Payment status',
  addons: 'Add-ons',
  bookingId: 'Booking',
  profileHint: 'Update your contact details and language preferences used for future bookings.',
  recentPayments: 'Recent payments',
  noPayments: 'No payments yet.',
  browseFleet: 'Browse fleet',
  signOut: 'Sign out',
};

const PROFILE_COPY_RU = {
  overview: 'Обзор',
  bookings: 'Бронирования',
  settings: 'Настройки',
  statsBookings: 'Всего броней',
  statsActive: 'Активные аренды',
  statsPaid: 'Оплачено',
  nextRide: 'Следующая поездка',
  noRide: 'Пока нет ближайшей поездки',
  noBookings: 'Бронирований пока нет. Следующая поездка по Бали появится здесь.',
  profileSaved: 'Профиль сохранён.',
  profileSaveFailed: 'Не удалось сохранить профиль.',
  bookingCancelled: 'Бронь отменена.',
  bookingCancelFailed: 'Не удалось отменить бронь.',
  paymentStarted: 'Платёжная сессия создана.',
  paymentStartFailed: 'Не удалось запустить оплату.',
  openPayment: 'Открыть оплату',
  payNow: 'Оплатить',
  cancelBooking: 'Отменить бронь',
  save: 'Сохранить изменения',
  fullName: 'Имя и фамилия',
  phone: 'Телефон',
  country: 'Страна',
  language: 'Язык',
  currency: 'Валюта',
  memberSince: 'С нами с',
  delivery: 'Доставка',
  paymentMethod: 'Оплата',
  paymentStatus: 'Статус оплаты',
  addons: 'Дополнения',
  bookingId: 'Бронь',
  profileHint: 'Обнови контакты и языковые настройки, которые будут использоваться в следующих бронированиях.',
  recentPayments: 'Последние оплаты',
  noPayments: 'Оплат пока нет.',
  browseFleet: 'Перейти в каталог',
  signOut: 'Выйти',
};

const PROFILE_COPY: Record<Locale, typeof PROFILE_COPY_EN> = {
  en: PROFILE_COPY_EN,
  ru: PROFILE_COPY_RU,
  zh: PROFILE_COPY_EN,
  id: PROFILE_COPY_EN,
  de: PROFILE_COPY_EN,
  fr: PROFILE_COPY_EN,
};

function formatRange(start: string, end: string, locale: string) {
  return `${new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(start))} - ${new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(end))}`;
}

function formatDateTime(value: string | undefined, locale: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function paymentLabel(payment: ApiPayment | null | undefined) {
  if (!payment) return '—';
  if (payment.status === 'succeeded') return 'Paid';
  if (payment.status === 'pending') return 'Pending';
  if (payment.status === 'failed') return 'Failed';
  return payment.status;
}

export default function ProfilePage() {
  const { t, locale } = useLocale();
  const copy = PROFILE_COPY[locale];
  const { user, signOut, loading, refresh } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'bookings' | 'settings'>('bookings');
  const [bookings, setBookings] = useState<ApiBooking[] | null>(null);
  const [workingBookingId, setWorkingBookingId] = useState<number | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    country: '',
    language: locale,
    currency: 'USD',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const nextLanguage = LOCALES.some((entry) => entry.code === user.language) ? (user.language as Locale) : locale;
    setForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      country: user.country || '',
      language: nextLanguage,
      currency: user.currency || 'USD',
    });
  }, [user, locale]);

  async function loadBookings() {
    if (!user) return;
    try {
      const res = await endpoints.bookingsList(locale);
      setBookings(unwrapList(res));
    } catch (nextError) {
      setBookings([]);
      setError(nextError instanceof ApiError ? nextError.message : t.auth.error);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadBookings();
  }, [user, locale]);

  const payments = useMemo(
    () =>
      (bookings || [])
        .flatMap((booking) => (booking.payments || booking.latest_payment ? [booking.latest_payment || null] : []))
        .filter(Boolean)
        .sort((a, b) => new Date(b!.created_at).getTime() - new Date(a!.created_at).getTime()) as ApiPayment[],
    [bookings]
  );

  const stats = useMemo(() => {
    const list = bookings || [];
    const active = list.filter((booking) => !['cancelled', 'completed'].includes(booking.status));
    const paid = list
      .filter((booking) => booking.payment_status === 'paid')
      .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
    const nextRide = active
      .filter((booking) => new Date(booking.start_datetime).getTime() > Date.now())
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())[0] || null;
    return { total: list.length, active: active.length, paid, nextRide };
  }, [bookings]);

  async function handleSaveProfile() {
    setSavingProfile(true);
    setError(null);
    setNotice(null);
    try {
      await endpoints.updateProfile(form);
      await refresh();
      setNotice(copy.profileSaved);
    } catch (nextError) {
      setError(nextError instanceof ApiError ? nextError.message : copy.profileSaveFailed);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePay(booking: ApiBooking) {
    setWorkingBookingId(booking.id);
    setError(null);
    setNotice(null);
    try {
      if (booking.latest_payment?.status === 'pending' && booking.latest_payment.payment_url) {
        window.open(booking.latest_payment.payment_url, '_blank', 'noopener,noreferrer');
        setNotice(copy.openPayment);
        return;
      }
      const provider = booking.payment_method === 'cash_on_delivery' ? 'mock' : 'stripe';
      const payment = await endpoints.createPayment({ booking_id: booking.id, provider });
      if (payment.payment_url) {
        window.open(payment.payment_url, '_blank', 'noopener,noreferrer');
      }
      setNotice(copy.paymentStarted);
      await loadBookings();
    } catch (nextError) {
      setError(nextError instanceof ApiError ? nextError.message : copy.paymentStartFailed);
    } finally {
      setWorkingBookingId(null);
    }
  }

  async function handleCancel(bookingId: number) {
    setWorkingBookingId(bookingId);
    setError(null);
    setNotice(null);
    try {
      await endpoints.cancelBooking(bookingId, locale);
      setNotice(copy.bookingCancelled);
      await loadBookings();
    } catch (nextError) {
      setError(nextError instanceof ApiError ? nextError.message : copy.bookingCancelFailed);
    } finally {
      setWorkingBookingId(null);
    }
  }

  if (loading || !user) {
    return (
      <div style={{ background: '#fff', color: '#000', minHeight: '100vh' }}>
        <SiteHeader />
        <div className="br-mono" style={{ padding: 80, textAlign: 'center', color: 'rgba(0,0,0,0.55)' }}>{t.common.loading}</div>
      </div>
    );
  }

  const initials = (user.full_name || user.email || 'BR')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const fg = '#000';
  const bg = '#fff';
  const sub = 'rgba(0,0,0,0.55)';
  const border = 'rgba(0,0,0,0.08)';
  const surface = '#F5F5F5';

  return (
    <div style={{ background: bg, color: fg, minHeight: '100vh' }}>
      <SiteHeader />
      <div className="br-profile-shell" style={{ gridTemplateColumns: '280px minmax(0, 1fr)', gap: 28, maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
        <aside>
          <div style={{ background: surface, borderRadius: 22, padding: 24, border: `1px solid ${border}` }}>
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(user.avatar)} alt={user.full_name || user.email} style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFD700' }} />
            ) : (
              <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#FFD700', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--br-display)', fontSize: 28, fontWeight: 700 }}>
                {initials}
              </div>
            )}
            <div style={{ marginTop: 18 }}>
              <div className="br-display" style={{ fontSize: 28, lineHeight: 1 }}>{user.full_name || user.email}</div>
              <div style={{ marginTop: 8, fontSize: 14, color: sub }}>{user.email}</div>
              {user.phone && <div style={{ marginTop: 4, fontSize: 14, color: sub }}>{user.phone}</div>}
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <BRChip status={user.role || 'active'} />
              <span className="br-mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: sub }}>
                {copy.memberSince}: {formatDateTime(user.created_at, locale)}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 16, background: '#fff', borderRadius: 18, overflow: 'hidden', border: `1px solid ${border}` }}>
            {[
              ['bookings', copy.bookings],
              ['settings', copy.settings],
            ].map(([value, label], index) => (
              <button
                key={value}
                onClick={() => setTab(value as 'bookings' | 'settings')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '16px 18px',
                  border: 0,
                  borderTop: index ? `1px solid ${border}` : 'none',
                  background: tab === value ? '#FFF6CC' : '#fff',
                  fontFamily: 'var(--br-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            <BRPrimary href="/catalog" full>{copy.browseFleet}</BRPrimary>
            <BROutline onClick={signOut} full>{copy.signOut}</BROutline>
          </div>
        </aside>

        <main>
          <BREyebrow>BALI-RENT · {copy.overview.toUpperCase()}</BREyebrow>
          <h1 className="br-display" style={{ fontSize: 'clamp(42px, 7vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.04em', margin: '10px 0 12px' }}>
            {t.auth.welcome.replace('{name}', (user.full_name || user.email).split(' ')[0])}
          </h1>
          <p style={{ maxWidth: 620, color: sub, fontSize: 16, lineHeight: 1.6, margin: 0 }}>{copy.profileHint}</p>

          {(notice || error) && (
            <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 14, background: error ? '#FEF2F2' : '#EFF6FF', color: error ? '#991B1B' : '#1D4ED8', fontSize: 14 }}>
              {error || notice}
            </div>
          )}

          <div className="br-profile-stats" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginTop: 28 }}>
            {[
              [copy.statsBookings, String(stats.total)],
              [copy.statsActive, String(stats.active)],
              [copy.statsPaid, `$${stats.paid.toFixed(2)}`],
              [copy.nextRide, stats.nextRide ? formatDateTime(stats.nextRide.start_datetime, locale) : copy.noRide],
            ].map(([label, value]) => (
              <div key={label} style={{ background: surface, borderRadius: 18, border: `1px solid ${border}`, padding: 20 }}>
                <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: sub }}>{label}</div>
                <div className="br-display" style={{ fontSize: label === copy.nextRide ? 22 : 32, marginTop: 10, lineHeight: 1.05 }}>{value}</div>
              </div>
            ))}
          </div>

          {tab === 'bookings' && (
            <section style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <h2 className="br-display" style={{ margin: 0, fontSize: 32 }}>{copy.bookings}</h2>
                <BRPrimary href="/catalog">{copy.browseFleet}</BRPrimary>
              </div>

              {bookings === null ? (
                <div className="br-mono" style={{ color: sub, padding: 30 }}>{t.common.loading}</div>
              ) : bookings.length === 0 ? (
                <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 20, padding: 28 }}>
                  <div style={{ fontSize: 15, color: sub }}>{copy.noBookings}</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {bookings.map((booking) => {
                    const isBusy = workingBookingId === booking.id;
                    const canPay = booking.payment_status !== 'paid' && !['cancelled', 'completed'].includes(booking.status) && booking.payment_method !== 'cash_on_delivery';
                    const canCancel = !['cancelled', 'completed'].includes(booking.status);
                    const addOnsLabel = (booking.add_ons || []).map((item) => `${item.name} x${item.quantity}`).join(', ');
                    return (
                      <article key={booking.id} style={{ background: '#fff', borderRadius: 22, border: `1px solid ${border}`, overflow: 'hidden' }}>
                        <div className="br-profile-booking-card" style={{ display: 'grid', gridTemplateColumns: '180px minmax(0, 1fr)', gap: 0 }}>
                          <div className="br-profile-booking-card-media" style={{ minHeight: 180 }}>
                            <BRPhoto tone="sand" label={booking.scooter.title.toUpperCase()} style={{ height: '100%' }} />
                          </div>
                          <div style={{ padding: 22 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                              <div>
                                <div className="br-display" style={{ fontSize: 28, lineHeight: 1 }}>{booking.scooter.title}</div>
                                <div className="br-mono" style={{ marginTop: 8, fontSize: 11, color: sub, letterSpacing: '0.12em' }}>
                                  {copy.bookingId} #{booking.order_number}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <BRChip status={booking.status} />
                                <BRChip status={booking.payment_status === 'paid' ? 'completed' : booking.payment_status === 'pending' ? 'created' : booking.payment_status} />
                              </div>
                            </div>

                            <div className="br-booking-summary-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 18 }}>
                              <div>
                                <div className="br-mono" style={{ fontSize: 10, color: sub, letterSpacing: '0.12em' }}>{t.booking.pickUp} / {t.booking.return}</div>
                                <div style={{ marginTop: 6, fontSize: 14 }}>{formatRange(booking.start_datetime, booking.end_datetime, locale)}</div>
                              </div>
                              <div>
                                <div className="br-mono" style={{ fontSize: 10, color: sub, letterSpacing: '0.12em' }}>{copy.delivery}</div>
                                <div style={{ marginTop: 6, fontSize: 14 }}>{booking.delivery_address || '—'}</div>
                              </div>
                              <div>
                                <div className="br-mono" style={{ fontSize: 10, color: sub, letterSpacing: '0.12em' }}>{copy.paymentMethod}</div>
                                <div style={{ marginTop: 6, fontSize: 14 }}>{booking.payment_method}</div>
                              </div>
                              <div>
                                <div className="br-mono" style={{ fontSize: 10, color: sub, letterSpacing: '0.12em' }}>{copy.paymentStatus}</div>
                                <div style={{ marginTop: 6, fontSize: 14 }}>{paymentLabel(booking.latest_payment)}</div>
                              </div>
                            </div>

                            {addOnsLabel && (
                              <div style={{ marginTop: 16 }}>
                                <div className="br-mono" style={{ fontSize: 10, color: sub, letterSpacing: '0.12em' }}>{copy.addons}</div>
                                <div style={{ marginTop: 6, fontSize: 14 }}>{addOnsLabel}</div>
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                                <div className="br-display" style={{ fontSize: 28 }}>${Number(booking.total_price).toFixed(2)}</div>
                                <div className="br-mono" style={{ fontSize: 11, color: sub }}>{booking.rental_days} {t.common.day}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {canPay && (
                                  <BRPrimary onClick={() => handlePay(booking)} disabled={isBusy}>
                                    {isBusy ? t.common.loading : copy.payNow}
                                  </BRPrimary>
                                )}
                                {booking.latest_payment?.status === 'pending' && booking.latest_payment.payment_url && (
                                  <BROutline onClick={() => window.open(booking.latest_payment!.payment_url!, '_blank', 'noopener,noreferrer')}>
                                    {copy.openPayment}
                                  </BROutline>
                                )}
                                {canCancel && (
                                  <BROutline onClick={() => handleCancel(booking.id)} disabled={isBusy}>
                                    {isBusy ? t.common.loading : copy.cancelBooking}
                                  </BROutline>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: 28 }}>
                <h3 className="br-display" style={{ fontSize: 28, margin: '0 0 12px' }}>{copy.recentPayments}</h3>
                {payments.length === 0 ? (
                  <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 18, padding: 20, color: sub }}>{copy.noPayments}</div>
                ) : (
                  <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 18, overflow: 'hidden' }}>
                    {payments.slice(0, 6).map((payment, index) => (
                      <div key={payment.id} className="br-profile-payment-row" style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', borderTop: index ? `1px solid ${border}` : 'none' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{payment.provider}</div>
                          <div className="br-mono" style={{ marginTop: 4, fontSize: 11, color: sub }}>{formatDateTime(payment.created_at, locale)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700 }}>${Number(payment.amount_usd).toFixed(2)}</div>
                          <div className="br-mono" style={{ marginTop: 4, fontSize: 11, color: sub }}>{paymentLabel(payment)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === 'settings' && (
            <section style={{ marginTop: 28, background: '#fff', border: `1px solid ${border}`, borderRadius: 22, padding: 24 }}>
              <h2 className="br-display" style={{ margin: 0, fontSize: 32 }}>{copy.settings}</h2>
              <div className="br-booking-payment-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 18 }}>
                <div className="br-field">
                  <input value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} style={{ background: '#fff', color: fg, borderColor: border }} />
                  <label>{copy.fullName}</label>
                </div>
                <div className="br-field">
                  <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} style={{ background: '#fff', color: fg, borderColor: border }} />
                  <label>{copy.phone}</label>
                </div>
                <div className="br-field">
                  <input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} style={{ background: '#fff', color: fg, borderColor: border }} />
                  <label>{copy.country}</label>
                </div>
                <div className="br-field">
                  <select className="br-select" value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value as Locale }))}>
                    {LOCALES.map((entry) => (
                      <option key={entry.code} value={entry.code}>{entry.name}</option>
                    ))}
                  </select>
                  <label>{copy.language}</label>
                </div>
                <div className="br-field">
                  <select className="br-select" value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}>
                    {['USD', 'IDR', 'EUR'].map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                  <label>{copy.currency}</label>
                </div>
              </div>
              <div style={{ marginTop: 22 }}>
                <BRPrimary onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? t.common.loading : copy.save}
                </BRPrimary>
              </div>
            </section>
          )}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
