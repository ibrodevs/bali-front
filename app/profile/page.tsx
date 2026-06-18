'use client';
import Link from 'next/link';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BRChip, BRPrimary, BROutline } from '@/components/BR';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { ApiError } from '@/lib/api';
import { ApiChatMessage, ApiChatThread, endpoints, unwrapList } from '@/lib/endpoints';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { formatCurrencyAmount, useCurrency } from '@/lib/i18n/CurrencyProvider';
import { useLocale } from '@/lib/i18n/LocaleProvider';

const PROFILE_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'zh', label: '中文' },
  { value: 'id', label: 'Indonesia' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
] as const;

const PROFILE_COPY = {
  en: { signInRequired: 'Sign in to your account', signInHint: 'Sign in first to open your profile and bookings.', account: 'ACCOUNT', riderProfile: 'Rider profile', riderFallback: 'Bali Rent Rider', language: 'Language', currency: 'Currency', country: 'Country', role: 'Role', editProfile: 'EDIT PROFILE', keepUpdated: 'Keep your rider details up to date.', saveSuccess: 'Profile saved.', saveFailed: 'Unable to save profile.', fullNamePlaceholder: 'Your full name', saveChanges: 'Save changes', saving: 'Saving…', bookings: 'Bookings', active: 'Active', completed: 'Completed', quickActions: 'QUICK ACTIONS', planNextRide: 'Plan the next ride.', quickActionsHint: 'Browse the fleet or jump straight to checkout — your details are saved.', myBookings: 'MY BOOKINGS', bookingHistory: 'Booking history', noBookings: 'No bookings yet. Open the catalog and we will deliver the scooter the same day.', total: 'Total', payment: 'Payment', days: 'Days', support: 'SUPPORT', supportTitle: 'Talk to support in real time.', supportHint: 'Ask about booking, payment, delivery, or documents. Messages from the site appear in the admin panel instantly.', supportEmpty: 'No messages yet. Send a message and our team will reply shortly.', supportPlaceholder: 'Type your message… (Enter to send)', supportCreate: 'Start support chat', supportSend: 'Send', supportSending: 'Sending…', supportStatusOpen: 'Open', supportStatusClosed: 'Closed', supportError: 'Unable to load support chat.', supportReplied: 'Support replied', newReply: 'New reply', all: 'All', filterLabel: 'Show' },
  ru: { signInRequired: 'Войдите в аккаунт', signInHint: 'Чтобы открыть профиль и список бронирований, сначала войдите в аккаунт.', account: 'АККАУНТ', riderProfile: 'Профиль райдера', riderFallback: 'Rider Bali Rent', language: 'Язык', currency: 'Валюта', country: 'Страна', role: 'Роль', editProfile: 'РЕДАКТИРОВАТЬ', keepUpdated: 'Держите данные райдера в актуальном состоянии.', saveSuccess: 'Профиль сохранён.', saveFailed: 'Не удалось сохранить профиль.', fullNamePlaceholder: 'Ваше полное имя', saveChanges: 'Сохранить изменения', saving: 'Сохраняем…', bookings: 'Брони', active: 'Активные', completed: 'Завершённые', quickActions: 'БЫСТРЫЕ ДЕЙСТВИЯ', planNextRide: 'Запланируйте следующую поездку.', quickActionsHint: 'Откройте каталог или сразу переходите к оформлению — ваши данные уже сохранены.', myBookings: 'МОИ БРОНИ', bookingHistory: 'История бронирований', noBookings: 'У вас пока нет бронирований. Откройте каталог, и мы доставим скутер в тот же день.', total: 'Итого', payment: 'Оплата', days: 'Дни', support: 'ПОДДЕРЖКА', supportTitle: 'Напишите поддержке прямо на сайте.', supportHint: 'Можно писать по бронированию, оплате, доставке и документам. Сообщения с сайта сразу появляются в админке.', supportEmpty: 'Сообщений пока нет. Напишите нам, и команда скоро ответит.', supportPlaceholder: 'Введите сообщение… (Enter для отправки)', supportCreate: 'Начать чат с поддержкой', supportSend: 'Отправить', supportSending: 'Отправляем…', supportStatusOpen: 'Открыт', supportStatusClosed: 'Закрыт', supportError: 'Не удалось загрузить чат поддержки.', supportReplied: 'Поддержка ответила', newReply: 'Новый ответ', all: 'Все', filterLabel: 'Показать' },
  zh: { signInRequired: '登录您的账户', signInHint: '请先登录以打开个人资料和预订列表。', account: '账户', riderProfile: '骑手资料', riderFallback: 'Bali Rent 骑手', language: '语言', currency: '货币', country: '国家', role: '角色', editProfile: '编辑资料', keepUpdated: '请保持您的骑手信息为最新。', saveSuccess: '资料已保存。', saveFailed: '无法保存资料。', fullNamePlaceholder: '您的全名', saveChanges: '保存更改', saving: '保存中…', bookings: '预订', active: '进行中', completed: '已完成', quickActions: '快捷操作', planNextRide: '规划下一次出行。', quickActionsHint: '浏览车队或直接结账，您的信息已保存。', myBookings: '我的预订', bookingHistory: '预订历史', noBookings: '您还没有预订。打开车型页，我们可以当天送车。', total: '总计', payment: '支付', days: '天数', support: '客服', supportTitle: '直接在网站上联系支持。', supportHint: '可咨询预订、付款、配送或文件问题。网站消息会立即出现在管理后台。', supportEmpty: '还没有消息。发送消息后，我们会尽快回复。', supportPlaceholder: '输入消息…（Enter 发送）', supportCreate: '开始支持聊天', supportSend: '发送', supportSending: '发送中…', supportStatusOpen: '开启', supportStatusClosed: '关闭', supportError: '无法加载支持聊天。', supportReplied: '客服已回复', newReply: '新回复', all: '全部', filterLabel: '筛选' },
  id: { signInRequired: 'Masuk ke akun Anda', signInHint: 'Masuk terlebih dahulu untuk membuka profil dan daftar pesanan.', account: 'AKUN', riderProfile: 'Profil pengendara', riderFallback: 'Rider Bali Rent', language: 'Bahasa', currency: 'Mata uang', country: 'Negara', role: 'Peran', editProfile: 'EDIT PROFIL', keepUpdated: 'Pastikan detail pengendara Anda selalu terbaru.', saveSuccess: 'Profil disimpan.', saveFailed: 'Tidak dapat menyimpan profil.', fullNamePlaceholder: 'Nama lengkap Anda', saveChanges: 'Simpan perubahan', saving: 'Menyimpan…', bookings: 'Pesanan', active: 'Aktif', completed: 'Selesai', quickActions: 'AKSI CEPAT', planNextRide: 'Rencanakan perjalanan berikutnya.', quickActionsHint: 'Jelajahi armada atau langsung ke checkout — detail Anda sudah tersimpan.', myBookings: 'PESANAN SAYA', bookingHistory: 'Riwayat pesanan', noBookings: 'Belum ada pesanan. Buka katalog dan kami bisa kirim skuter di hari yang sama.', total: 'Total', payment: 'Pembayaran', days: 'Hari', support: 'SUPPORT', supportTitle: 'Hubungi support langsung dari situs.', supportHint: 'Tanyakan soal booking, pembayaran, pengantaran, atau dokumen. Pesan dari situs langsung muncul di panel admin.', supportEmpty: 'Belum ada pesan. Kirim pesan dan tim kami akan segera membalas.', supportPlaceholder: 'Tulis pesan Anda… (Enter untuk kirim)', supportCreate: 'Mulai chat support', supportSend: 'Kirim', supportSending: 'Mengirim…', supportStatusOpen: 'Terbuka', supportStatusClosed: 'Ditutup', supportError: 'Tidak dapat memuat chat support.', supportReplied: 'Support sudah membalas', newReply: 'Balasan baru', all: 'Semua', filterLabel: 'Tampilkan' },
  de: { signInRequired: 'In Ihr Konto einloggen', signInHint: 'Bitte zuerst anmelden, um Profil und Buchungen zu öffnen.', account: 'KONTO', riderProfile: 'Fahrerprofil', riderFallback: 'Bali Rent Rider', language: 'Sprache', currency: 'Währung', country: 'Land', role: 'Rolle', editProfile: 'PROFIL BEARBEITEN', keepUpdated: 'Halte deine Fahrerdaten aktuell.', saveSuccess: 'Profil gespeichert.', saveFailed: 'Profil konnte nicht gespeichert werden.', fullNamePlaceholder: 'Dein vollständiger Name', saveChanges: 'Änderungen speichern', saving: 'Speichern…', bookings: 'Buchungen', active: 'Aktiv', completed: 'Abgeschlossen', quickActions: 'SCHNELLAKTIONEN', planNextRide: 'Plane die nächste Fahrt.', quickActionsHint: 'Sieh dir die Flotte an oder gehe direkt zum Checkout — deine Daten sind gespeichert.', myBookings: 'MEINE BUCHUNGEN', bookingHistory: 'Buchungsverlauf', noBookings: 'Noch keine Buchungen. Öffne den Katalog und wir liefern den Roller noch am selben Tag.', total: 'Gesamt', payment: 'Zahlung', days: 'Tage', support: 'SUPPORT', supportTitle: 'Schreibe dem Support direkt auf der Website.', supportHint: 'Fragen zu Buchung, Zahlung, Lieferung oder Dokumenten. Nachrichten von der Website erscheinen sofort im Adminbereich.', supportEmpty: 'Noch keine Nachrichten. Schreib uns und wir antworten bald.', supportPlaceholder: 'Nachricht eingeben… (Enter zum Senden)', supportCreate: 'Support-Chat starten', supportSend: 'Senden', supportSending: 'Wird gesendet…', supportStatusOpen: 'Offen', supportStatusClosed: 'Geschlossen', supportError: 'Support-Chat konnte nicht geladen werden.', supportReplied: 'Support hat geantwortet', newReply: 'Neue Antwort', all: 'Alle', filterLabel: 'Anzeigen' },
  fr: { signInRequired: 'Connectez-vous à votre compte', signInHint: "Connectez-vous d'abord pour ouvrir votre profil et vos réservations.", account: 'COMPTE', riderProfile: 'Profil pilote', riderFallback: 'Pilote Bali Rent', language: 'Langue', currency: 'Devise', country: 'Pays', role: 'Rôle', editProfile: 'MODIFIER LE PROFIL', keepUpdated: 'Gardez vos informations pilote à jour.', saveSuccess: 'Profil enregistré.', saveFailed: "Impossible d'enregistrer le profil.", fullNamePlaceholder: 'Votre nom complet', saveChanges: 'Enregistrer les modifications', saving: 'Enregistrement…', bookings: 'Réservations', active: 'Actives', completed: 'Terminées', quickActions: 'ACTIONS RAPIDES', planNextRide: 'Préparez votre prochaine sortie.', quickActionsHint: 'Parcourez la flotte ou passez directement au paiement — vos informations sont enregistrées.', myBookings: 'MES RÉSERVATIONS', bookingHistory: 'Historique des réservations', noBookings: "Vous n'avez pas encore de réservation. Ouvrez le catalogue et nous livrerons le scooter le jour même.", total: 'Total', payment: 'Paiement', days: 'Jours', support: 'SUPPORT', supportTitle: 'Parlez au support directement sur le site.', supportHint: "Posez vos questions sur la réservation, le paiement, la livraison ou les documents. Les messages du site apparaissent immédiatement dans l'admin.", supportEmpty: 'Aucun message pour le moment. Écrivez-nous et nous répondrons rapidement.', supportPlaceholder: 'Écrivez votre message… (Entrée pour envoyer)', supportCreate: 'Démarrer le chat support', supportSend: 'Envoyer', supportSending: 'Envoi…', supportStatusOpen: 'Ouvert', supportStatusClosed: 'Fermé', supportError: 'Impossible de charger le chat support.', supportReplied: 'Le support a répondu', newReply: 'Nouvelle réponse', all: 'Tous', filterLabel: 'Afficher' },
} as const;

type Tab = 'profile' | 'bookings' | 'support';
type BookingFilter = 'all' | 'active' | 'completed';

const ACTIVE_STATUSES = ['created', 'confirmed', 'active', 'delivery', 'pending_payment'];
const BOOKING_PRICE_SOURCE_CURRENCY = 'USD';

function messageIsFromSupport(
  message?: Pick<ApiChatMessage, 'is_from_support' | 'sender'> | null
) {
  if (!message) {
    return false;
  }
  return Boolean(
    message.is_from_support ||
    (message.sender?.role && ['admin', 'manager', 'staff'].includes(message.sender.role))
  );
}

function canUseBrowserNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export default function ProfilePage() {
  const { t, locale } = useLocale();
  const copy = PROFILE_COPY[locale as keyof typeof PROFILE_COPY] || PROFILE_COPY.en;
  const { user, loading: authLoading, signOut, refresh } = useAuth();
  const { currency: activeCurrency, setCurrency, availableCurrencies, convertAmountValue } = useCurrency();
  const searchParams = useSearchParams();
  const bookings = user?.bookings ?? [];
  const profileCurrencies = useMemo(
    () => availableCurrencies.map((value) => ({ value, label: value === 'USD' ? 'USD (base)' : value })),
    [availableCurrencies],
  );

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all');

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    country: '',
    language: 'en',
    currency: 'USD',
  });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const [supportThreads, setSupportThreads] = useState<ApiChatThread[]>([]);
  const [supportMessages, setSupportMessages] = useState<ApiChatMessage[]>([]);
  const [activeSupportThreadId, setActiveSupportThreadId] = useState<number | null>(null);
  const [supportDraft, setSupportDraft] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const supportUnreadIdsRef = useRef<number[] | null>(null);

  const totals = useMemo(() => {
    const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)).length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    return { total: bookings.length, active, completed };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (bookingFilter === 'active') return bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
    if (bookingFilter === 'completed') return bookings.filter((b) => b.status === 'completed');
    return bookings;
  }, [bookings, bookingFilter]);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab === 'profile' || requestedTab === 'bookings' || requestedTab === 'support') {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages]);

  const unreadSupportCount = useMemo(
    () => supportThreads.filter((thread) => thread.has_unread_support_reply).length,
    [supportThreads],
  );

  async function requestBrowserNotificationPermission() {
    if (!canUseBrowserNotifications() || window.Notification.permission !== 'default') {
      return;
    }
    try {
      await window.Notification.requestPermission();
    } catch {}
  }

  async function loadSupportThreads() {
    const res = await endpoints.chatThreads({ page_size: 100 });
    const threads = unwrapList(res);
    const unreadIds = threads
      .filter((thread) => thread.has_unread_support_reply)
      .map((thread) => thread.id);
    const previousUnreadIds = supportUnreadIdsRef.current;
    if (previousUnreadIds) {
      threads
        .filter((thread) => thread.has_unread_support_reply && !previousUnreadIds.includes(thread.id))
        .forEach((thread) => {
          if (
            canUseBrowserNotifications() &&
            window.Notification.permission === 'granted' &&
            (document.visibilityState !== 'visible' || activeTab !== 'support' || activeSupportThreadId !== thread.id)
          ) {
            new window.Notification(copy.supportReplied, {
              body: thread.last_message?.text || thread.title || copy.support,
            });
          }
        });
    }
    supportUnreadIdsRef.current = unreadIds;
    setSupportThreads(threads);
    setActiveSupportThreadId((current) => current || threads[0]?.id || null);
    return threads;
  }

  async function loadSupportMessages(threadId: number) {
    const res = await endpoints.chatMessages(threadId, { page_size: 100 });
    setSupportMessages(unwrapList(res));
  }

  async function markSupportThreadRead(threadId: number) {
    await endpoints.markSupportThreadRead(threadId);
    setSupportThreads((current) =>
      current.map((thread) => (thread.id === threadId ? { ...thread, has_unread_support_reply: false } : thread)),
    );
    supportUnreadIdsRef.current = (supportUnreadIdsRef.current || []).filter((id) => id !== threadId);
  }

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadSupport() {
      setSupportLoading(true);
      setSupportError('');
      try {
        const threads = await loadSupportThreads();
        if (cancelled) return;
        const nextThreadId = threads[0]?.id || null;
        setActiveSupportThreadId(nextThreadId);
        setSupportMessages([]);
      } catch (error) {
        if (cancelled) return;
        setSupportError(error instanceof ApiError ? error.message : copy.supportError);
      } finally {
        if (!cancelled) setSupportLoading(false);
      }
    }
    loadSupport();
    return () => { cancelled = true; };
  }, [user, copy.supportError]);

  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(async () => {
      try {
        await loadSupportThreads();
        if (activeTab === 'support' && activeSupportThreadId) {
          await loadSupportMessages(activeSupportThreadId);
        }
      } catch {}
    }, 5000);
    return () => window.clearInterval(id);
  }, [activeSupportThreadId, activeTab, user, copy.support, copy.supportReplied]);

  useEffect(() => {
    if (activeTab !== 'support') {
      setSupportMessages([]);
      return;
    }
    if (!activeSupportThreadId) { setSupportMessages([]); return; }
    loadSupportMessages(activeSupportThreadId).then(() => markSupportThreadRead(activeSupportThreadId)).catch((error) => {
      setSupportError(error instanceof ApiError ? error.message : copy.supportError);
    });
  }, [activeSupportThreadId, activeTab, copy.supportError]);

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
      setCurrency(form.currency);
      await refresh();
      setSaveState('success');
      setSaveMessage(copy.saveSuccess);
    } catch (error) {
      setSaveState('error');
      setSaveMessage(error instanceof Error ? error.message : copy.saveFailed);
    }
  }

  async function handleCreateSupportThread() {
    setSupportLoading(true);
    setSupportError('');
    try {
      const thread = await endpoints.ensureSupportChatThread({ title: 'Support Chat' });
      await requestBrowserNotificationPermission();
      const threads = await loadSupportThreads();
      const resolved = threads.find((t) => t.id === thread.id) || thread;
      setActiveSupportThreadId(resolved.id);
      await loadSupportMessages(resolved.id);
    } catch (error) {
      setSupportError(error instanceof ApiError ? error.message : copy.supportError);
    } finally {
      setSupportLoading(false);
    }
  }

  async function handleSendSupportMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supportDraft.trim()) return;
    let threadId = activeSupportThreadId;
    setSupportSending(true);
    setSupportError('');
    try {
      if (!threadId) {
        const thread = await endpoints.ensureSupportChatThread({ title: 'Support Chat' });
        threadId = thread.id;
        setActiveSupportThreadId(thread.id);
      }
      await endpoints.sendChatMessage({ thread_id: threadId, text: supportDraft.trim() });
      await requestBrowserNotificationPermission();
      setSupportDraft('');
      await loadSupportThreads();
      await loadSupportMessages(threadId);
    } catch (error) {
      setSupportError(error instanceof ApiError ? error.message : copy.supportError);
    } finally {
      setSupportSending(false);
    }
  }

  const activeSupportThread = supportThreads.find((th) => th.id === activeSupportThreadId) || null;

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'profile', label: copy.editProfile },
    { key: 'bookings', label: copy.myBookings, count: totals.total },
    { key: 'support', label: copy.support, count: unreadSupportCount || undefined },
  ];

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--br-body)', background: '#0A0A0A' }}>
      <SiteHeader />

      {!authLoading && !user ? (
        /* ── Sign-in gate ── */
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 48px', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 70% 0%, rgba(255,215,0,0.10) 0%, transparent 100%)', pointerEvents: 'none' }} />
          <div aria-hidden style={{ position: 'absolute', bottom: -60, left: -20, fontFamily: 'var(--br-display)', fontSize: 'clamp(180px, 24vw, 360px)', fontWeight: 800, letterSpacing: '-0.06em', lineHeight: 0.8, color: 'rgba(255,255,255,0.025)', userSelect: 'none', pointerEvents: 'none' }}>01</div>
          <div style={{ maxWidth: 520, textAlign: 'center', position: 'relative' }}>
            <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#FFD700', marginBottom: 20 }}>BALI RENT — RIDER PORTAL</div>
            <h1 className="br-display" style={{ margin: '0 0 16px', fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1.0, letterSpacing: '-0.03em', color: '#fff' }}>
              {copy.signInRequired}
            </h1>
            <p style={{ margin: '0 0 36px', color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.65 }}>
              {copy.signInHint}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <BRPrimary href="/login">{t.auth.loginCta}</BRPrimary>
              <BROutline href="/register" dark>{t.auth.register}</BROutline>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── Hero ── */}
          <section style={{ background: '#0A0A0A', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 45% at 85% -5%, rgba(255,215,0,0.13) 0%, transparent 100%), radial-gradient(ellipse 40% 50% at -5% 110%, rgba(255,215,0,0.07) 0%, transparent 100%)', pointerEvents: 'none' }} />

            <div style={{ maxWidth: 1240, margin: '0 auto', padding: '56px 48px 0', position: 'relative' }}>
              {/* Profile info row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, marginBottom: 36, flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div style={{ width: 88, height: 88, borderRadius: 22, flexShrink: 0, background: 'linear-gradient(135deg, #FFD700 0%, #E8A800 100%)', display: 'grid', placeItems: 'center', fontFamily: 'var(--br-display)', fontSize: 30, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em', boxShadow: '0 8px 32px rgba(255,215,0,0.28)' }}>
                  {(user?.full_name || user?.email || 'BR').slice(0, 2).toUpperCase()}
                </div>

                {/* Name + info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#FFD700', marginBottom: 10 }}>
                    {copy.riderProfile.toUpperCase()}
                  </div>
                  <h1 className="br-display" style={{ margin: 0, fontSize: 'clamp(28px, 3.5vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
                    {user?.full_name || copy.riderFallback}
                  </h1>
                  <div style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                    {user?.email}
                    {user?.phone ? <span style={{ marginLeft: 14, color: 'rgba(255,255,255,0.3)' }}>· {user.phone}</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,215,0,0.15)', color: '#FFD700', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.1em' }}>
                      {(user?.role || 'rider').toUpperCase()}
                    </span>
                    <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.1em' }}>
                      {activeCurrency}
                    </span>
                    <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.1em' }}>
                      {PROFILE_LANGUAGES.find((l) => l.value === (user?.language || locale))?.label || locale}
                    </span>
                    {user?.country ? (
                      <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.1em' }}>
                        {user.country}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Sign out */}
                <button onClick={() => signOut()} className="br-btn br-btn-outline dark" style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
                  {t.nav.logout}
                </button>
              </div>

              {/* Stats strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 40 }} className="br-profile-stats">
                <StatCell label={copy.bookings} value={totals.total} />
                <StatCell label={copy.active} value={totals.active} accent />
                <StatCell label={copy.completed} value={totals.completed} />
              </div>

              {/* Tab bar */}
              <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.08)', gap: 0 }}>
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="br-mono"
                    style={{ padding: '18px 24px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab.key ? '#FFD700' : 'transparent'}`, color: activeTab === tab.key ? '#FFD700' : 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.18em', cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span style={{ minWidth: 20, height: 20, borderRadius: 10, background: activeTab === tab.key ? '#FFD700' : 'rgba(255,255,255,0.1)', color: activeTab === tab.key ? '#0A0A0A' : 'rgba(255,255,255,0.45)', fontSize: 10, display: 'grid', placeItems: 'center', padding: '0 6px' }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Profile tab ── */}
          {activeTab === 'profile' && (
            <div style={{ flex: 1, background: '#111213', color: '#fff', padding: '40px 48px 80px' }}>
              <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 600px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }} className="br-profile-grid">

                {/* Edit form */}
                <form onSubmit={handleSaveProfile} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px' }}>
                  <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#FFD700', marginBottom: 10 }}>
                    {copy.editProfile}
                  </div>
                  <div className="br-display" style={{ fontSize: 26, letterSpacing: '-0.025em', marginBottom: 28, lineHeight: 1.1 }}>
                    {copy.keepUpdated}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} className="br-profile-edit-grid">
                    <ProfileField label={t.auth.name}>
                      <input value={form.full_name} onChange={(e) => setForm((c) => ({ ...c, full_name: e.target.value }))} style={darkInputStyle} placeholder={copy.fullNamePlaceholder} />
                    </ProfileField>
                    <ProfileField label={t.auth.phone}>
                      <input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} style={darkInputStyle} placeholder="+62..." />
                    </ProfileField>
                    <ProfileField label={copy.country}>
                      <input value={form.country} onChange={(e) => setForm((c) => ({ ...c, country: e.target.value }))} style={darkInputStyle} placeholder="Indonesia" />
                    </ProfileField>
                    <ProfileField label={copy.language}>
                      <select value={form.language} onChange={(e) => setForm((c) => ({ ...c, language: e.target.value }))} style={darkInputStyle}>
                        {PROFILE_LANGUAGES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </ProfileField>
                    <ProfileField label={copy.currency}>
                      <select value={form.currency} onChange={(e) => setForm((c) => ({ ...c, currency: e.target.value }))} style={darkInputStyle}>
                        {profileCurrencies.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </ProfileField>
                  </div>

                  {saveMessage ? (
                    <div className="br-mono" style={{ marginTop: 16, fontSize: 11, letterSpacing: '0.12em', color: saveState === 'error' ? '#FCA5A5' : '#86EFAC' }}>
                      {saveMessage}
                    </div>
                  ) : null}

                  <div style={{ marginTop: 24 }}>
                    <button type="submit" className="br-btn br-btn-primary" disabled={saveState === 'saving'}>
                      {saveState === 'saving' ? copy.saving : copy.saveChanges}
                    </button>
                  </div>
                </form>

                {/* Quick actions */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px' }}>
                  <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#FFD700', marginBottom: 10 }}>
                    {copy.quickActions}
                  </div>
                  <div className="br-display" style={{ fontSize: 26, letterSpacing: '-0.025em', marginBottom: 12, lineHeight: 1.1 }}>
                    {copy.planNextRide}
                  </div>
                  <p style={{ margin: '0 0 28px', color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7 }}>
                    {copy.quickActionsHint}
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} className="br-profile-actions">
                    <BRPrimary href="/booking">{t.nav.book}</BRPrimary>
                    <Link href="/catalog" className="br-btn br-btn-outline dark" style={{ textDecoration: 'none' }}>{t.nav.catalog}</Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Bookings tab ── */}
          {activeTab === 'bookings' && (
            <div style={{ flex: 1, background: '#F8F8F6', color: '#000', padding: '40px 48px 80px' }}>
              <div style={{ maxWidth: 1240, margin: '0 auto' }}>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
                  <div>
                    <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>{copy.myBookings}</div>
                    <h2 className="br-display" style={{ margin: 0, fontSize: 'clamp(28px, 3vw, 40px)', letterSpacing: '-0.03em', lineHeight: 1 }}>{copy.bookingHistory}</h2>
                  </div>
                  <BROutline href="/catalog">{t.nav.book}</BROutline>
                </div>

                {/* Filter chips */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="br-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'rgba(0,0,0,0.35)', marginRight: 4 }}>{copy.filterLabel.toUpperCase()}</span>
                  {([
                    { key: 'all' as BookingFilter, label: copy.all, count: totals.total },
                    { key: 'active' as BookingFilter, label: copy.active, count: totals.active },
                    { key: 'completed' as BookingFilter, label: copy.completed, count: totals.completed },
                  ]).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setBookingFilter(f.key)}
                      className="br-mono"
                      style={{ padding: '7px 16px', borderRadius: 100, border: 'none', cursor: 'pointer', background: bookingFilter === f.key ? '#0A0A0A' : 'rgba(0,0,0,0.07)', color: bookingFilter === f.key ? '#fff' : 'rgba(0,0,0,0.5)', fontSize: 10, letterSpacing: '0.14em', transition: 'all 0.18s' }}
                    >
                      {f.label.toUpperCase()} ({f.count})
                    </button>
                  ))}
                </div>

                {authLoading ? (
                  <div className="br-mono" style={{ color: 'rgba(0,0,0,0.4)', fontSize: 12, letterSpacing: '0.14em', padding: '24px 0' }}>{t.common.loading}</div>
                ) : filteredBookings.length === 0 ? (
                  <div style={{ padding: '60px 40px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.07)', background: '#fff', textAlign: 'center' }}>
                    <div className="br-display" style={{ fontSize: 22, letterSpacing: '-0.02em', marginBottom: 10, color: 'rgba(0,0,0,0.7)' }}>
                      {bookingFilter === 'all' ? copy.noBookings.split('.')[0] : `${filteredBookings.length} ${bookingFilter === 'active' ? copy.active : copy.completed}`}
                    </div>
                    <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
                      {bookingFilter === 'all' ? copy.noBookings.split('.').slice(1).join('.').trim() : ''}
                    </p>
                    <BRPrimary href="/catalog">{t.nav.catalog}</BRPrimary>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 14 }}>
                    {filteredBookings.map((booking, i) => (
                      <article
                        key={booking.id}
                        className="br-profile-booking-card"
                        style={{ padding: '26px 28px', background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, overflow: 'hidden', animation: `br-rise 500ms ${i * 55}ms var(--br-easing) both` }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 260px' }}>
                            <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.35)', marginBottom: 10 }}>
                              #{booking.order_number}
                            </div>
                            <div className="br-display" style={{ fontSize: 24, lineHeight: 1.05, letterSpacing: '-0.025em' }}>
                              {booking.scooter?.title || `Booking #${booking.id}`}
                            </div>
                            <div style={{ marginTop: 6, color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                              {formatDateRange(booking.start_datetime, booking.end_datetime, locale)}
                            </div>
                          </div>
                          <BRChip status={booking.status} />
                        </div>

                        <div style={{ marginTop: 18, height: 1, background: 'rgba(0,0,0,0.06)' }} />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 18 }} className="br-profile-booking-meta">
                          <BookingMeta
                            label={copy.total}
                            value={formatCurrencyAmount(
                              convertAmountValue(
                                Number(booking.total_price || 0),
                                BOOKING_PRICE_SOURCE_CURRENCY,
                                activeCurrency,
                              ),
                              activeCurrency,
                            )}
                          />
                          <BookingMeta label={copy.payment} value={booking.payment_status} />
                          <BookingMeta label={copy.days} value={String(booking.rental_days)} />
                        </div>

                        {booking.delivery_address ? (
                          <div style={{ marginTop: 14, padding: '11px 14px', background: '#F8F8F6', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, color: 'rgba(0,0,0,0.5)', fontSize: 13, lineHeight: 1.55 }}>
                            {booking.delivery_address}
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Support tab ── */}
          {activeTab === 'support' && (
            <div style={{ flex: 1, background: '#111213', color: '#fff', padding: '40px 48px 80px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                  <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#FFD700', marginBottom: 10 }}>{copy.support}</div>
                  <h2 className="br-display" style={{ margin: '0 0 10px', fontSize: 'clamp(24px, 3vw, 36px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}>{copy.supportTitle}</h2>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.65, maxWidth: 560 }}>{copy.supportHint}</p>
                </div>

                {/* Thread selector (multiple threads) */}
                {supportThreads.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    {supportThreads.map((thread) => (
                      <button
                        key={thread.id}
                        onClick={() => setActiveSupportThreadId(thread.id)}
                        className="br-mono"
                        style={{ padding: '6px 14px', borderRadius: 100, border: 'none', cursor: 'pointer', background: activeSupportThreadId === thread.id ? '#FFD700' : 'rgba(255,255,255,0.08)', color: activeSupportThreadId === thread.id ? '#0A0A0A' : 'rgba(255,255,255,0.55)', fontSize: 10, letterSpacing: '0.14em' }}
                      >
                        {thread.title || 'Support Chat'}
                        {thread.status === 'closed' ? ` · ${copy.supportStatusClosed}` : ''}
                        {thread.has_unread_support_reply ? ` · ${copy.newReply}` : thread.last_message?.is_from_support ? ` · ${copy.supportReplied}` : ''}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat window */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', minHeight: 480 }}>

                  {/* Status bar */}
                  {activeSupportThread && (
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeSupportThread.status === 'closed' ? 'rgba(255,255,255,0.3)' : '#22C55E', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{activeSupportThread.title || 'Support Chat'}</span>
                      <span className="br-mono" style={{ marginLeft: 'auto', fontSize: 10, letterSpacing: '0.12em', color: activeSupportThread.status === 'closed' ? 'rgba(255,255,255,0.3)' : '#FFD700' }}>
                        {activeSupportThread.status === 'closed' ? copy.supportStatusClosed : copy.supportStatusOpen}
                      </span>
                      {activeSupportThread.has_unread_support_reply ? (
                        <span className="br-mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: '#0A0A0A', padding: '5px 8px', borderRadius: 999, background: '#FFD700' }}>
                          {copy.newReply}
                        </span>
                      ) : activeSupportThread.last_message?.is_from_support ? (
                        <span className="br-mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: '#86EFAC', padding: '5px 8px', borderRadius: 999, background: 'rgba(34,197,94,0.12)' }}>
                          {copy.supportReplied}
                        </span>
                      ) : null}
                    </div>
                  )}

                  {/* Messages area */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 460 }}>
                    {supportLoading && supportThreads.length === 0 ? (
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'var(--br-mono)', letterSpacing: '0.12em' }}>{t.common.loading}</div>
                    ) : supportError ? (
                      <div className="br-mono" style={{ fontSize: 12, color: '#FCA5A5', letterSpacing: '0.12em' }}>{supportError}</div>
                    ) : supportMessages.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.06)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', fontSize: 22 }}>
                            <span style={{ fontFamily: 'var(--br-mono)', fontSize: 18, color: '#FFD700' }}>?</span>
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}>{copy.supportEmpty}</div>
                          {supportThreads.length === 0 && (
                            <button type="button" onClick={handleCreateSupportThread} className="br-btn br-btn-primary" disabled={supportLoading} style={{ marginTop: 20 }}>
                              {copy.supportCreate}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {supportMessages.map((message) => {
                          const isSupport = messageIsFromSupport(message);
                          return (
                            <div key={message.id} style={{ display: 'flex', justifyContent: isSupport ? 'flex-start' : 'flex-end' }}>
                              <div style={{ maxWidth: '72%', borderRadius: isSupport ? '4px 18px 18px 18px' : '18px 4px 18px 18px', padding: '12px 16px', background: isSupport ? 'rgba(255,255,255,0.09)' : '#FFD700', color: isSupport ? '#fff' : '#0A0A0A' }}>
                                {isSupport && (
                                  <div className="br-mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: '#FFD700', marginBottom: 6, opacity: 0.85 }}>SUPPORT</div>
                                )}
                                <div style={{ fontSize: 14, lineHeight: 1.6 }}>{message.text}</div>
                                <div style={{ marginTop: 6, fontSize: 11, opacity: 0.5, textAlign: 'right', fontFamily: 'var(--br-mono)' }}>
                                  {formatDateTime(message.created_at, locale)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input */}
                  <form
                    onSubmit={handleSendSupportMessage}
                    style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, alignItems: 'flex-end' }}
                  >
                    <textarea
                      value={supportDraft}
                      onChange={(e) => setSupportDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder={copy.supportPlaceholder}
                      rows={2}
                      style={{ ...darkInputStyle, flex: 1, resize: 'none', minHeight: 52 }}
                    />
                    <button type="submit" className="br-btn br-btn-primary" disabled={supportSending || !supportDraft.trim()} style={{ flexShrink: 0, alignSelf: 'stretch', minHeight: 52 }}>
                      {supportSending ? copy.supportSending : copy.supportSend}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <SiteFooter />
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div style={{ padding: '22px 28px', background: accent ? 'rgba(255,215,0,0.07)' : 'transparent', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="br-display" style={{ fontSize: 52, lineHeight: 1, letterSpacing: '-0.04em', color: accent ? '#FFD700' : '#fff' }}>
        {value}
      </div>
      <div className="br-mono" style={{ marginTop: 8, fontSize: 10, letterSpacing: '0.18em', color: accent ? 'rgba(255,215,0,0.55)' : 'rgba(255,255,255,0.35)' }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}

function BookingMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'rgba(0,0,0,0.4)' }}>{label.toUpperCase()}</div>
      <div className="br-display" style={{ marginTop: 6, fontSize: 17, letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span className="br-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.45)' }}>
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
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  padding: '12px 14px',
  fontFamily: 'var(--br-body)',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.18s',
} satisfies CSSProperties;

function formatDateRange(start: string, end: string, locale: string) {
  const s = new Date(start).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const e = new Date(end).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return `${s} — ${e}`;
}

function formatDateTime(value?: string, locale?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString(locale || 'en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
