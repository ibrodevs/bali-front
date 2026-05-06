'use client';
import Link from 'next/link';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BRChip, BRPrimary, BROutline } from '@/components/BR';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { endpoints } from '@/lib/endpoints';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { useLocale } from '@/lib/i18n/LocaleProvider';

const PROFILE_CURRENCIES = [
  { value: 'USD', label: 'USD (base)' },
  { value: 'RUB', label: 'RUB' },
  { value: 'EUR', label: 'EUR' },
  { value: 'CNY', label: 'CNY' },
  { value: 'AUD', label: 'AUD' },
] as const;

const PROFILE_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'zh', label: '中文' },
  { value: 'id', label: 'Indonesia' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
] as const;

const PROFILE_COPY = {
  en: { signInRequired: 'SIGN IN REQUIRED', signInHint: 'Sign in first to open your profile and bookings.', account: 'ACCOUNT', riderProfile: 'Your rider profile.', riderFallback: 'Bali Rent Rider', language: 'Language', currency: 'Currency', country: 'Country', role: 'Role', editProfile: 'EDIT PROFILE', keepUpdated: 'Keep your rider details up to date.', saveSuccess: 'Profile saved.', saveFailed: 'Unable to save profile.', fullNamePlaceholder: 'Your full name', saveChanges: 'Save changes', saving: 'Saving…', bookings: 'Bookings', active: 'Active', completed: 'Completed', quickActions: 'QUICK ACTIONS', planNextRide: 'Plan the next ride.', quickActionsHint: 'Browse the fleet or jump straight to checkout — your details are saved.', myBookings: 'MY BOOKINGS', bookingHistory: 'Booking history.', noBookings: 'No bookings yet. Open the catalog and we will deliver the scooter the same day.', total: 'Total', payment: 'Payment', days: 'Days' },
  ru: { signInRequired: 'ТРЕБУЕТСЯ ВХОД', signInHint: 'Чтобы открыть профиль и список бронирований, сначала войдите в аккаунт.', account: 'АККАУНТ', riderProfile: 'Ваш профиль райдера.', riderFallback: 'Rider Bali Rent', language: 'Язык', currency: 'Валюта', country: 'Страна', role: 'Роль', editProfile: 'РЕДАКТИРОВАТЬ ПРОФИЛЬ', keepUpdated: 'Держите данные райдера в актуальном состоянии.', saveSuccess: 'Профиль сохранён.', saveFailed: 'Не удалось сохранить профиль.', fullNamePlaceholder: 'Ваше полное имя', saveChanges: 'Сохранить изменения', saving: 'Сохраняем…', bookings: 'Брони', active: 'Активные', completed: 'Завершённые', quickActions: 'БЫСТРЫЕ ДЕЙСТВИЯ', planNextRide: 'Запланируйте следующую поездку.', quickActionsHint: 'Откройте каталог или сразу переходите к оформлению — ваши данные уже сохранены.', myBookings: 'МОИ БРОНИ', bookingHistory: 'История бронирований.', noBookings: 'У вас пока нет бронирований. Откройте каталог, и мы доставим скутер в тот же день.', total: 'Итого', payment: 'Оплата', days: 'Дни' },
  zh: { signInRequired: '需要登录', signInHint: '请先登录以打开个人资料和预订列表。', account: '账户', riderProfile: '您的骑手资料。', riderFallback: 'Bali Rent 骑手', language: '语言', currency: '货币', country: '国家', role: '角色', editProfile: '编辑资料', keepUpdated: '请保持您的骑手信息为最新。', saveSuccess: '资料已保存。', saveFailed: '无法保存资料。', fullNamePlaceholder: '您的全名', saveChanges: '保存更改', saving: '保存中…', bookings: '预订', active: '进行中', completed: '已完成', quickActions: '快捷操作', planNextRide: '规划下一次出行。', quickActionsHint: '浏览车队或直接结账，您的信息已保存。', myBookings: '我的预订', bookingHistory: '预订历史。', noBookings: '您还没有预订。打开车型页，我们可以当天送车。', total: '总计', payment: '支付', days: '天数' },
  id: { signInRequired: 'PERLU MASUK', signInHint: 'Masuk terlebih dahulu untuk membuka profil dan daftar pesanan.', account: 'AKUN', riderProfile: 'Profil pengendara Anda.', riderFallback: 'Rider Bali Rent', language: 'Bahasa', currency: 'Mata uang', country: 'Negara', role: 'Peran', editProfile: 'EDIT PROFIL', keepUpdated: 'Pastikan detail pengendara Anda selalu terbaru.', saveSuccess: 'Profil disimpan.', saveFailed: 'Tidak dapat menyimpan profil.', fullNamePlaceholder: 'Nama lengkap Anda', saveChanges: 'Simpan perubahan', saving: 'Menyimpan…', bookings: 'Pesanan', active: 'Aktif', completed: 'Selesai', quickActions: 'AKSI CEPAT', planNextRide: 'Rencanakan perjalanan berikutnya.', quickActionsHint: 'Jelajahi armada atau langsung ke checkout — detail Anda sudah tersimpan.', myBookings: 'PESANAN SAYA', bookingHistory: 'Riwayat pesanan.', noBookings: 'Belum ada pesanan. Buka katalog dan kami bisa kirim skuter di hari yang sama.', total: 'Total', payment: 'Pembayaran', days: 'Hari' },
  de: { signInRequired: 'ANMELDUNG ERFORDERLICH', signInHint: 'Bitte zuerst anmelden, um Profil und Buchungen zu öffnen.', account: 'KONTO', riderProfile: 'Dein Fahrerprofil.', riderFallback: 'Bali Rent Rider', language: 'Sprache', currency: 'Währung', country: 'Land', role: 'Rolle', editProfile: 'PROFIL BEARBEITEN', keepUpdated: 'Halte deine Fahrerdaten aktuell.', saveSuccess: 'Profil gespeichert.', saveFailed: 'Profil konnte nicht gespeichert werden.', fullNamePlaceholder: 'Dein vollständiger Name', saveChanges: 'Änderungen speichern', saving: 'Speichern…', bookings: 'Buchungen', active: 'Aktiv', completed: 'Abgeschlossen', quickActions: 'SCHNELLAKTIONEN', planNextRide: 'Plane die nächste Fahrt.', quickActionsHint: 'Sieh dir die Flotte an oder gehe direkt zum Checkout — deine Daten sind gespeichert.', myBookings: 'MEINE BUCHUNGEN', bookingHistory: 'Buchungsverlauf.', noBookings: 'Noch keine Buchungen. Öffne den Katalog und wir liefern den Roller noch am selben Tag.', total: 'Gesamt', payment: 'Zahlung', days: 'Tage' },
  fr: { signInRequired: 'CONNEXION REQUISE', signInHint: 'Connectez-vous d’abord pour ouvrir votre profil et vos réservations.', account: 'COMPTE', riderProfile: 'Votre profil pilote.', riderFallback: 'Pilote Bali Rent', language: 'Langue', currency: 'Devise', country: 'Pays', role: 'Rôle', editProfile: 'MODIFIER LE PROFIL', keepUpdated: 'Gardez vos informations pilote à jour.', saveSuccess: 'Profil enregistré.', saveFailed: 'Impossible d’enregistrer le profil.', fullNamePlaceholder: 'Votre nom complet', saveChanges: 'Enregistrer les modifications', saving: 'Enregistrement…', bookings: 'Réservations', active: 'Actives', completed: 'Terminées', quickActions: 'ACTIONS RAPIDES', planNextRide: 'Préparez votre prochaine sortie.', quickActionsHint: 'Parcourez la flotte ou passez directement au paiement — vos informations sont enregistrées.', myBookings: 'MES RÉSERVATIONS', bookingHistory: 'Historique des réservations.', noBookings: 'Vous n’avez pas encore de réservation. Ouvrez le catalogue et nous livrerons le scooter le jour même.', total: 'Total', payment: 'Paiement', days: 'Jours' },
} as const;

export default function ProfilePage() {
  const { t, locale } = useLocale();
  const copy = PROFILE_COPY[locale as keyof typeof PROFILE_COPY] || PROFILE_COPY.en;
  const { user, loading: authLoading, signOut, refresh } = useAuth();
  const bookings = user?.bookings ?? [];
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    country: '',
    language: 'en',
    currency: 'USD',
  });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const totals = useMemo(() => {
    const active = bookings.filter((item) =>
      ['created', 'confirmed', 'active', 'delivery', 'pending_payment'].includes(item.status),
    ).length;
    const completed = bookings.filter((item) => item.status === 'completed').length;
    return { total: bookings.length, active, completed };
  }, [bookings]);

  const currency = user?.currency || t.common.currency;
  const bg = '#fff';
  const fg = '#000';
  const sub = 'rgba(0,0,0,0.6)';
  const border = 'rgba(0,0,0,0.1)';

  useEffect(() => {
    if (!user) return;
    setForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      country: user.country || '',
      language: user.language || locale,
      currency: user.currency || 'USD',
    });
    setSaveState('idle');
    setSaveMessage('');
  }, [locale, user]);

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState('saving');
    setSaveMessage('');

    try {
      await endpoints.updateProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        language: form.language,
        currency: form.currency,
      });
      await refresh();
      setSaveState('success');
      setSaveMessage(copy.saveSuccess);
    } catch (error) {
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : copy.saveFailed);
    }
  }

  return (
    <div style={{ width: '100%', background: bg, color: fg, fontFamily: 'var(--br-body)' }}>
      <SiteHeader />

      {!authLoading && !user ? (
        <section
          className="br-section"
          style={{ padding: '96px 48px', background: bg, position: 'relative', overflow: 'hidden' }}
        >
          <div
            aria-hidden
            className="br-fleet-bgnum"
            style={{
              position: 'absolute',
              top: -40,
              left: -20,
              fontFamily: 'var(--br-display)',
              fontSize: 'clamp(220px, 28vw, 420px)',
              lineHeight: 0.8,
              fontWeight: 800,
              letterSpacing: '-0.06em',
              color: 'rgba(0,0,0,0.04)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            01
          </div>
          <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
            <div style={{ maxWidth: 760, marginBottom: 40 }}>
              <div
                className="br-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  color: sub,
                  marginBottom: 18,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ width: 28, height: 1, background: '#000' }} />
                <span>01 / 02</span>
                <span>·</span>
                <span style={{ color: '#000', fontWeight: 600 }}>{copy.signInRequired}</span>
              </div>
              <h2
                className="br-display"
                style={{
                  margin: 0,
                  fontSize: 'clamp(40px, 5vw, 64px)',
                  lineHeight: 0.98,
                  letterSpacing: '-0.035em',
                }}
              >
                {t.auth.login}
              </h2>
              <p style={{ margin: '20px 0 0', fontSize: 17, lineHeight: 1.6, color: sub, maxWidth: 560 }}>
                {copy.signInHint}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <BRPrimary href="/login">{t.auth.loginCta}</BRPrimary>
              <BROutline href="/register">{t.auth.register}</BROutline>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* 01 — ACCOUNT */}
          <section
            className="br-section"
            style={{
              padding: '96px 48px',
              background: '#0A0A0A',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 80% 0%, rgba(255,215,0,0.10), transparent 55%), radial-gradient(circle at 0% 100%, rgba(255,215,0,0.06), transparent 50%)',
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden
              className="br-fleet-bgnum"
              style={{
                position: 'absolute',
                bottom: -60,
                left: -20,
                fontFamily: 'var(--br-display)',
                fontSize: 'clamp(220px, 28vw, 420px)',
                lineHeight: 0.8,
                fontWeight: 800,
                letterSpacing: '-0.06em',
                color: 'rgba(255,255,255,0.04)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              01
            </div>
            <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
              <div style={{ maxWidth: 880, marginBottom: 48 }}>
                <div
                  className="br-mono br-profile-section-label"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    color: '#FFD700',
                    marginBottom: 18,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ width: 28, height: 1, background: '#FFD700' }} />
                  <span>01 / 02</span>
                  <span>·</span>
                  <span style={{ fontWeight: 600 }}>{copy.account}</span>
                </div>
                <h2
                  className="br-display"
                  style={{
                    margin: 0,
                    fontSize: 'clamp(40px, 5vw, 64px)',
                    lineHeight: 0.98,
                    letterSpacing: '-0.035em',
                  }}
                >
                  {copy.riderProfile}
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 360px) minmax(0, 1fr)',
                  gap: 24,
                  alignItems: 'start',
                }}
                className="br-profile-grid"
              >
                {/* Identity card */}
                <div
                  className="br-profile-card"
                  style={{
                    position: 'relative',
                    padding: '32px 28px 28px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 18,
                      background: '#FFD700',
                      color: '#000',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--br-display)',
                      fontSize: 28,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {(user?.full_name || user?.email || 'BR').slice(0, 2).toUpperCase()}
                  </div>
                  <div
                    className="br-display br-profile-card-name"
                    style={{ marginTop: 22, fontSize: 30, lineHeight: 1, letterSpacing: '-0.03em' }}
                  >
                    {user?.full_name || copy.riderFallback}
                  </div>
                  <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, fontSize: 14 }}>
                    {user?.email}
                    {user?.phone ? (
                      <>
                        <br />
                        {user.phone}
                      </>
                    ) : null}
                  </div>
                  <div
                    aria-hidden
                    style={{ marginTop: 22, height: 2, width: 32, background: '#FFD700' }}
                  />
                  <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
                    <DarkInfoRow label={copy.language} value={user?.language || locale} />
                    <DarkInfoRow label={copy.currency} value={currency} />
                    <DarkInfoRow label={copy.country} value={user?.country || '—'} />
                    <DarkInfoRow label={copy.role} value={user?.role || 'customer'} />
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="br-btn br-btn-outline dark"
                    style={{ width: '100%', marginTop: 24 }}
                  >
                    {t.nav.logout}
                  </button>
                </div>

                {/* Stats grid */}
                <div className="br-profile-main-column" style={{ display: 'grid', gap: 16 }}>
                  <form
                    className="br-profile-panel"
                    onSubmit={handleSaveProfile}
                    style={{
                      padding: '28px 28px 26px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 16,
                    }}
                  >
                    <div
                      className="br-mono"
                      style={{ fontSize: 11, letterSpacing: '0.18em', color: '#FFD700' }}
                    >
                      {copy.editProfile}
                    </div>
                    <div
                      className="br-display"
                      style={{
                        marginTop: 10,
                        fontSize: 28,
                        lineHeight: 1.05,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {copy.keepUpdated}
                    </div>
                    <div
                      className="br-profile-edit-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: 14,
                        marginTop: 22,
                      }}
                    >
                      <ProfileField label={t.auth.name}>
                        <input
                          value={form.full_name}
                          onChange={(e) => setForm((current) => ({ ...current, full_name: e.target.value }))}
                          style={darkInputStyle}
                          placeholder={copy.fullNamePlaceholder}
                        />
                      </ProfileField>
                      <ProfileField label={t.auth.phone}>
                        <input
                          value={form.phone}
                          onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                          style={darkInputStyle}
                          placeholder="+62..."
                        />
                      </ProfileField>
                      <ProfileField label={copy.country}>
                        <input
                          value={form.country}
                          onChange={(e) => setForm((current) => ({ ...current, country: e.target.value }))}
                          style={darkInputStyle}
                          placeholder="Indonesia"
                        />
                      </ProfileField>
                      <ProfileField label={copy.language}>
                        <select
                          value={form.language}
                          onChange={(e) => setForm((current) => ({ ...current, language: e.target.value }))}
                          style={darkInputStyle}
                        >
                          {PROFILE_LANGUAGES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </ProfileField>
                      <ProfileField label={copy.currency}>
                        <select
                          value={form.currency}
                          onChange={(e) => setForm((current) => ({ ...current, currency: e.target.value }))}
                          style={darkInputStyle}
                        >
                          {PROFILE_CURRENCIES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </ProfileField>
                    </div>
                    {saveMessage ? (
                      <div
                        className="br-mono"
                        style={{
                          marginTop: 16,
                          fontSize: 11,
                          letterSpacing: '0.12em',
                          color: saveState === 'error' ? '#FCA5A5' : '#FFD700',
                        }}
                      >
                        {saveMessage}
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
                      <button
                        type="submit"
                        className="br-btn br-btn-primary"
                        disabled={saveState === 'saving'}
                      >
                        {saveState === 'saving' ? copy.saving : copy.saveChanges}
                      </button>
                    </div>
                  </form>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 16,
                    }}
                    className="br-profile-stats"
                  >
                    <DarkStatCard label={copy.bookings} value={String(totals.total)} number="01" />
                    <DarkStatCard label={copy.active} value={String(totals.active)} number="02" accent />
                    <DarkStatCard label={copy.completed} value={String(totals.completed)} number="03" />
                  </div>

                  <div
                    className="br-profile-panel"
                    style={{
                      padding: '28px 28px 26px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 16,
                    }}
                  >
                    <div
                      className="br-mono"
                      style={{ fontSize: 11, letterSpacing: '0.18em', color: '#FFD700' }}
                    >
                      {copy.quickActions}
                    </div>
                    <div
                      className="br-display"
                      style={{
                        marginTop: 10,
                        fontSize: 28,
                        lineHeight: 1.05,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {copy.planNextRide}
                    </div>
                    <p
                      style={{
                        margin: '12px 0 22px',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      {copy.quickActionsHint}
                    </p>
                    <div className="br-profile-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <BRPrimary href="/booking">{t.nav.book}</BRPrimary>
                      <Link
                        href="/catalog"
                        className="br-btn br-btn-outline dark"
                        style={{ textDecoration: 'none' }}
                      >
                        {t.nav.catalog}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 02 — BOOKINGS */}
          <section
            className="br-section"
            style={{
              padding: '96px 48px',
              background: bg,
              color: fg,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden
              className="br-fleet-bgnum"
              style={{
                position: 'absolute',
                top: -40,
                right: -20,
                fontFamily: 'var(--br-display)',
                fontSize: 'clamp(220px, 28vw, 420px)',
                lineHeight: 0.8,
                fontWeight: 800,
                letterSpacing: '-0.06em',
                color: 'rgba(0,0,0,0.04)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              02
            </div>
            <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
                  <div
                    className="br-profile-bookings-head"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 24,
                  flexWrap: 'wrap',
                  marginBottom: 48,
                }}
              >
                <div style={{ maxWidth: 760 }}>
                  <div
                    className="br-mono br-profile-section-label"
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.18em',
                      color: sub,
                      marginBottom: 18,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span style={{ width: 28, height: 1, background: '#000' }} />
                    <span>02 / 02</span>
                    <span>·</span>
                    <span style={{ color: '#000', fontWeight: 600 }}>{copy.myBookings}</span>
                  </div>
                  <h2
                    className="br-display"
                    style={{
                      margin: 0,
                      fontSize: 'clamp(40px, 5vw, 64px)',
                      lineHeight: 0.98,
                      letterSpacing: '-0.035em',
                    }}
                  >
                    {copy.bookingHistory}
                  </h2>
                </div>
                <BROutline href="/catalog">{t.nav.book}</BROutline>
              </div>

              {authLoading ? (
                <div
                  className="br-mono"
                  style={{ color: sub, padding: '24px 0', letterSpacing: '0.14em', fontSize: 12 }}
                >
                  {t.common.loading}
                </div>
              ) : bookings.length === 0 ? (
                <div
                  style={{
                    padding: '36px 28px',
                    borderRadius: 16,
                    background: '#fff',
                    border: `1px solid ${border}`,
                    color: sub,
                    fontSize: 15,
                    lineHeight: 1.6,
                  }}
                >
                  {copy.noBookings}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {bookings.map((booking, i) => (
                    <article
                      className="br-profile-booking-card"
                      key={booking.id}
                      style={{
                        position: 'relative',
                        padding: '28px 28px 26px',
                        background: '#fff',
                        border: `1px solid ${border}`,
                        borderRadius: 18,
                        overflow: 'hidden',
                        animation: `br-rise 600ms ${i * 80}ms var(--br-easing) both`,
                      }}
                    >
                      <div
                        className="br-profile-booking-top"
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 16,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: '1 1 280px' }}>
                          <div
                            className="br-mono"
                            style={{
                              fontSize: 10,
                              letterSpacing: '0.18em',
                              color: sub,
                              marginBottom: 10,
                            }}
                          >
                            #{booking.order_number}
                          </div>
                          <div
                            className="br-display br-profile-booking-title"
                            style={{ fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.025em' }}
                          >
                            {booking.scooter?.title || `Booking #${booking.id}`}
                          </div>
                          <div style={{ marginTop: 8, color: sub, fontSize: 14 }}>
                            {formatDateRange(booking.start_datetime, booking.end_datetime, locale)}
                          </div>
                        </div>
                        <BRChip status={booking.status} />
                      </div>

                      <div
                        aria-hidden
                        style={{
                          marginTop: 22,
                          height: 1,
                          background: 'linear-gradient(90deg, #000 0%, transparent 60%)',
                        }}
                      />

                      <div
                        className="br-profile-booking-meta"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                          gap: 16,
                          marginTop: 22,
                        }}
                      >
                        <BookingMeta
                          label={copy.total}
                          value={`${booking.currency || currency} ${booking.total_price}`}
                        />
                        <BookingMeta label={copy.payment} value={booking.payment_status} />
                        <BookingMeta label={copy.days} value={String(booking.rental_days)} />
                      </div>

                      {booking.delivery_address ? (
                        <div
                          style={{
                            marginTop: 18,
                            padding: '14px 16px',
                            background: '#FAFAF8',
                            border: `1px solid ${border}`,
                            borderRadius: 12,
                            color: sub,
                            fontSize: 14,
                            lineHeight: 1.55,
                          }}
                        >
                          {booking.delivery_address}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <SiteFooter />
    </div>
  );
}

function DarkStatCard({
  label,
  value,
  number,
  accent,
}: {
  label: string;
  value: string;
  number: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '28px 24px 26px',
        background: accent ? 'linear-gradient(180deg, #FFD700 0%, #F5C518 100%)' : 'rgba(255,255,255,0.04)',
        color: accent ? '#0A0A0A' : '#fff',
        border: accent ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.10)',
        borderRadius: 16,
        boxShadow: accent ? '0 30px 60px -25px rgba(255,215,0,0.5)' : 'none',
        overflow: 'hidden',
      }}
    >
      <div
        className="br-mono"
        style={{
          position: 'absolute',
          top: 18,
          right: 20,
          fontSize: 11,
          letterSpacing: '0.18em',
          color: accent ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.35)',
        }}
      >
        {number}
      </div>
      <div
        className="br-mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.16em',
          color: accent ? 'rgba(0,0,0,0.6)' : '#FFD700',
        }}
      >
        {label.toUpperCase()}
      </div>
      <div
        className="br-display"
        style={{ marginTop: 12, fontSize: 56, lineHeight: 0.95, letterSpacing: '-0.04em' }}
      >
        {value}
      </div>
      <div
        aria-hidden
        style={{
          marginTop: 18,
          height: 2,
          width: 32,
          background: accent ? '#000' : '#FFD700',
        }}
      />
    </div>
  );
}

function DarkInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        alignItems: 'baseline',
        paddingBottom: 8,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span
        className="br-mono"
        style={{ fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)' }}
      >
        {label.toUpperCase()}
      </span>
      <span style={{ textAlign: 'right', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{value}</span>
    </div>
  );
}

function BookingMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="br-mono"
        style={{ fontSize: 10, letterSpacing: '0.16em', color: 'rgba(0,0,0,0.5)' }}
      >
        {label.toUpperCase()}
      </div>
      <div className="br-display" style={{ marginTop: 6, fontSize: 18, letterSpacing: '-0.01em' }}>
        {value}
      </div>
    </div>
  );
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span
        className="br-mono"
        style={{ fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.5)' }}
      >
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  );
}

const darkInputStyle = {
  width: '100%',
  minHeight: 46,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  padding: '12px 14px',
  fontFamily: 'var(--br-body)',
  fontSize: 14,
  outline: 'none',
} satisfies CSSProperties;

function formatDateRange(start: string, end: string, locale: string) {
  const startText = new Date(start).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const endText = new Date(end).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return `${startText} — ${endText}`;
}
