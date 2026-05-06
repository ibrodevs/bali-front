'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRChip, BREyebrow, BRLogo, BROutline, BRPrimary, BRSecondary } from '@/components/BR';
import { ApiError } from '@/lib/api';
import {
  ApiAddon,
  ApiAnalyticsFunnel,
  ApiAnalyticsRevenue,
  ApiBooking,
  ApiChatThread,
  ApiCustomerProfile,
  ApiScooterDetail,
  ApiStaffTask,
  ApiSupportTicket,
  ApiVehicleModel,
  ApiVehicleType,
  endpoints,
  unwrapList,
} from '@/lib/endpoints';
import { useAuth } from '@/lib/i18n/AuthProvider';

type AdminSection = 'overview' | 'bookings' | 'fleet' | 'calendar' | 'crm' | 'analytics' | 'support';
type FleetDraft = {
  id: number | null;
  model: string;
  title: string;
  slug: string;
  sku: string;
  color: string;
  base_price_usd: string;
  status: string;
  mileage: string;
  is_featured: boolean;
};

const ADMIN_LOCALE = 'ru-RU';
const VEHICLE_STATUSES = ['available', 'rented', 'maintenance', 'inactive'];
const BOOKING_STATUS_FILTERS = ['all', 'created', 'pending_payment', 'paid', 'confirmed', 'delivery', 'active', 'completed', 'cancelled'];

function emptyDraft(): FleetDraft {
  return {
    id: null,
    model: '',
    title: '',
    slug: '',
    sku: '',
    color: '',
    base_price_usd: '',
    status: 'available',
    mileage: '0',
    is_featured: false,
  };
}

function isAdminLike(user: { role?: string; is_staff?: boolean; is_superuser?: boolean } | null) {
  if (!user) return false;
  if (user.is_staff || user.is_superuser) return true;
  return ['admin', 'manager', 'staff'].includes((user.role || '').toLowerCase());
}

function toDraft(scooter: ApiScooterDetail): FleetDraft {
  return {
    id: scooter.id,
    model: scooter.model ? String(scooter.model) : '',
    title: scooter.title || '',
    slug: scooter.slug || '',
    sku: scooter.sku || '',
    color: scooter.color || '',
    base_price_usd: String(scooter.base_price_usd ?? scooter.price_per_day ?? ''),
    status: scooter.status || 'available',
    mileage: String(scooter.mileage ?? 0),
    is_featured: Boolean(scooter.is_featured),
  };
}

function formatMoney(value: string | number | undefined, currency = 'USD') {
  const amount = Number(value || 0);
  return new Intl.NumberFormat(ADMIN_LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatDate(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(ADMIN_LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString(ADMIN_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start || !end) return '—';
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function statusLabel(status?: string | null) {
  const map: Record<string, string> = {
    available: 'Доступен',
    rented: 'В аренде',
    maintenance: 'Сервис',
    inactive: 'Скрыт',
    created: 'Создана',
    pending_payment: 'Ждёт оплату',
    paid: 'Оплачена',
    confirmed: 'Подтверждена',
    delivery: 'Доставка',
    active: 'Активна',
    completed: 'Завершена',
    cancelled: 'Отменена',
    open: 'Открыт',
    closed: 'Закрыт',
    pending: 'Новая',
    in_progress: 'В работе',
  };
  if (!status) return '—';
  return map[status] || status;
}

function sectionTitle(section: AdminSection) {
  const map: Record<AdminSection, string> = {
    overview: 'Обзор',
    bookings: 'Бронирования',
    fleet: 'Парк',
    calendar: 'Календарь',
    crm: 'CRM',
    analytics: 'Аналитика',
    support: 'Поддержка',
  };
  return map[section];
}

function AdminMetric({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className={`br-admin-panel ${accent ? 'accent' : ''}`}>
      <div className="br-admin-kicker">{label}</div>
      <div className="br-display br-admin-metric-value">{value}</div>
      <div className="br-admin-note">{note}</div>
    </div>
  );
}

function AdminTag({ label }: { label: string }) {
  return <span className="br-admin-badge">{label}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="br-admin-empty">{label}</div>;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [section, setSection] = useState<AdminSection>('overview');
  const [booting, setBooting] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fleet, setFleet] = useState<ApiScooterDetail[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [models, setModels] = useState<ApiVehicleModel[]>([]);
  const [types, setTypes] = useState<ApiVehicleType[]>([]);
  const [analyticsRevenue, setAnalyticsRevenue] = useState<ApiAnalyticsRevenue | null>(null);
  const [analyticsFunnel, setAnalyticsFunnel] = useState<ApiAnalyticsFunnel | null>(null);
  const [customerProfiles, setCustomerProfiles] = useState<ApiCustomerProfile[]>([]);
  const [staffTasks, setStaffTasks] = useState<ApiStaffTask[]>([]);
  const [supportTickets, setSupportTickets] = useState<ApiSupportTicket[]>([]);
  const [chatThreads, setChatThreads] = useState<ApiChatThread[]>([]);
  const [addons, setAddons] = useState<ApiAddon[]>([]);

  const [fleetQuery, setFleetQuery] = useState('');
  const [fleetStatus, setFleetStatus] = useState('all');
  const [bookingStatus, setBookingStatus] = useState('all');
  const [calendarWeekStart, setCalendarWeekStart] = useState(startOfWeek(new Date()));

  const [draft, setDraft] = useState<FleetDraft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bookingActionId, setBookingActionId] = useState<number | null>(null);

  const canOpenAdmin = isAdminLike(user);

  async function loadAdminData() {
    setBooting(true);
    setError(null);

    try {
      const core = await Promise.all([
        endpoints.adminScooters(),
        endpoints.adminBookings(),
        endpoints.scooterModels(),
        endpoints.scooterTypes(),
      ]);

      const nextFleet = unwrapList(core[0]);
      setFleet(nextFleet);
      setBookings(unwrapList(core[1]));
      setModels(unwrapList(core[2]));
      setTypes(unwrapList(core[3]));
      setDraft((current) => {
        if (!current.id) return current;
        const fresh = nextFleet.find((item) => item.id === current.id);
        return fresh ? toDraft(fresh) : current;
      });
      setForbidden(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
      } else {
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить данные админки.');
      }
      setBooting(false);
      return;
    }

    const secondary = await Promise.allSettled([
      endpoints.adminAnalyticsRevenue(),
      endpoints.adminAnalyticsFunnel(),
      endpoints.adminCustomerProfiles({ page_size: 100 }),
      endpoints.adminStaffTasks({ page_size: 100 }),
      endpoints.adminSupportTickets({ page_size: 100 }),
      endpoints.adminChatThreads({ page_size: 100 }),
      endpoints.adminAddons({ page_size: 100 }),
    ]);

    const [revenueRes, funnelRes, profilesRes, tasksRes, ticketsRes, threadsRes, addonsRes] = secondary;

    if (revenueRes.status === 'fulfilled') setAnalyticsRevenue(revenueRes.value);
    if (funnelRes.status === 'fulfilled') setAnalyticsFunnel(funnelRes.value);
    if (profilesRes.status === 'fulfilled') setCustomerProfiles(unwrapList(profilesRes.value));
    if (tasksRes.status === 'fulfilled') setStaffTasks(unwrapList(tasksRes.value));
    if (ticketsRes.status === 'fulfilled') setSupportTickets(unwrapList(ticketsRes.value));
    if (threadsRes.status === 'fulfilled') setChatThreads(unwrapList(threadsRes.value));
    if (addonsRes.status === 'fulfilled') setAddons(unwrapList(addonsRes.value));

    setBooting(false);
  }

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setBooting(false);
      return;
    }
    if (!canOpenAdmin) {
      setForbidden(true);
      setBooting(false);
      return;
    }
    loadAdminData();
  }, [loading, user]);

  const fleetStats = useMemo(() => {
    const total = fleet.length;
    const available = fleet.filter((item) => item.status === 'available').length;
    const featured = fleet.filter((item) => item.is_featured).length;
    const avgPrice = total
      ? fleet.reduce((sum, item) => sum + Number(item.base_price_usd ?? item.price_per_day ?? 0), 0) / total
      : 0;
    return { total, available, featured, avgPrice };
  }, [fleet]);

  const bookingStats = useMemo(() => {
    const total = bookings.length;
    const revenue = bookings.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
    const active = bookings.filter((item) => item.status === 'active').length;
    const confirmed = bookings.filter((item) => item.status === 'confirmed' || item.status === 'delivery').length;
    return { total, revenue, active, confirmed };
  }, [bookings]);

  const filteredFleet = useMemo(() => {
    return fleet.filter((item) => {
      const matchesStatus = fleetStatus === 'all' || item.status === fleetStatus;
      const q = fleetQuery.trim().toLowerCase();
      const haystack = [item.title, item.slug, item.sku, item.model_info?.brand, item.model_info?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [fleet, fleetQuery, fleetStatus]);

  const filteredBookings = useMemo(() => {
    if (bookingStatus === 'all') return bookings;
    return bookings.filter((item) => item.status === bookingStatus);
  }, [bookings, bookingStatus]);

  const selectedModel = useMemo(
    () => models.find((item) => String(item.id) === draft.model) || null,
    [models, draft.model],
  );

  const selectedTypeName = useMemo(() => {
    if (selectedModel?.type_name) return selectedModel.type_name;
    const matchedType = types.find((item) => String(item.id) === String(selectedModel?.type || ''));
    return matchedType?.name || 'Не выбрано';
  }, [selectedModel, types]);

  const calendarDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(calendarWeekStart, index)),
    [calendarWeekStart],
  );

  const topScootersByRevenue = useMemo(() => {
    const map = new Map<string, number>();
    for (const booking of bookings) {
      const key = booking.scooter?.title || 'Неизвестный скутер';
      map.set(key, (map.get(key) || 0) + Number(booking.total_price || 0));
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6);
  }, [bookings]);

  const crmRows = useMemo(() => {
    return customerProfiles
      .map((profile) => ({
        id: profile.id,
        name: profile.user?.full_name || profile.user?.email || `Клиент #${profile.id}`,
        email: profile.user?.email || '—',
        phone: profile.user?.phone || '—',
        segment: profile.segment?.name || 'Без сегмента',
        discount: Number(profile.segment?.discount_percent || 0),
        notes: profile.notes?.length || 0,
        interactions: profile.interactions?.length || 0,
        updated_at: profile.updated_at,
      }))
      .sort((left, right) => right.discount - left.discount || right.interactions - left.interactions);
  }, [customerProfiles]);

  function updateDraft<K extends keyof FleetDraft>(key: K, value: FleetDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleCreateNew() {
    setDraft(emptyDraft());
    setSection('fleet');
  }

  function handleSelectScooter(scooter: ApiScooterDetail) {
    setDraft(toDraft(scooter));
    setSection('fleet');
  }

  async function handleSaveScooter() {
    if (!draft.model || !draft.title || !draft.slug || !draft.sku || !draft.base_price_usd) {
      setError('Для сохранения заполните модель, название, slug, SKU и цену за день.');
      return;
    }

    const payload = {
      model: Number(draft.model),
      title: draft.title.trim(),
      slug: draft.slug.trim(),
      sku: draft.sku.trim(),
      color: draft.color.trim(),
      base_price_usd: draft.base_price_usd,
      status: draft.status,
      mileage: Number(draft.mileage || 0),
      is_featured: draft.is_featured,
    };

    setSaving(true);
    setError(null);
    try {
      const saved = draft.id
        ? await endpoints.adminUpdateScooter(draft.id, payload)
        : await endpoints.adminCreateScooter(payload);
      await loadAdminData();
      setDraft(toDraft(saved));
      setSection('fleet');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить карточку техники.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteScooter() {
    if (!draft.id) return;
    setDeleting(true);
    setError(null);
    try {
      await endpoints.adminDeleteScooter(draft.id);
      await loadAdminData();
      setDraft(emptyDraft());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось удалить технику.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleBookingAction(action: 'confirm' | 'delivery' | 'active' | 'complete' | 'cancel', id: number) {
    setBookingActionId(id);
    setError(null);
    try {
      if (action === 'confirm') await endpoints.adminConfirmBooking(id);
      if (action === 'delivery') await endpoints.adminMarkBookingDelivery(id);
      if (action === 'active') await endpoints.adminMarkBookingActive(id);
      if (action === 'complete') await endpoints.adminCompleteBooking(id);
      if (action === 'cancel') await endpoints.adminCancelBooking(id);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось обновить статус брони.');
    } finally {
      setBookingActionId(null);
    }
  }

  if (loading || booting) {
    return (
      <div className="br-admin-gate">
        <div className="br-admin-panel" style={{ maxWidth: 460 }}>
          <BREyebrow>Доступ в админку</BREyebrow>
          <h1 className="br-display" style={{ fontSize: 42, margin: '10px 0 8px' }}>Загружаем панель управления...</h1>
          <p className="br-admin-note">Проверяем сессию, права доступа и актуальные данные по парку и бронированиям.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="br-admin-gate">
        <div className="br-admin-panel" style={{ maxWidth: 500 }}>
          <BREyebrow>Вход администратора</BREyebrow>
          <h1 className="br-display" style={{ fontSize: 42, margin: '10px 0 8px' }}>Эта зона закрыта.</h1>
          <p className="br-admin-note">Для входа в админку нужно авторизоваться под учётной записью сотрудника.</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
            <BRPrimary href="/login">Войти</BRPrimary>
            <BROutline href="/">На сайт</BROutline>
          </div>
        </div>
      </div>
    );
  }

  if (forbidden || !canOpenAdmin) {
    return (
      <div className="br-admin-gate">
        <div className="br-admin-panel" style={{ maxWidth: 520 }}>
          <BREyebrow>Ограничение доступа</BREyebrow>
          <h1 className="br-display" style={{ fontSize: 42, margin: '10px 0 8px' }}>Недостаточно прав.</h1>
          <p className="br-admin-note">Аккаунт авторизован, но API не дал доступ к административным разделам.</p>
          <div className="br-admin-badge-row">
            <span className="br-admin-badge">Роль: {user.role || 'client'}</span>
            <span className="br-admin-badge">Staff: {user.is_staff ? 'да' : 'нет'}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
            <BRPrimary href="/">На сайт</BRPrimary>
            <BROutline onClick={() => router.push('/profile')}>Открыть профиль</BROutline>
          </div>
        </div>
      </div>
    );
  }

  const availabilityRate = fleetStats.total ? Math.round((fleetStats.available / fleetStats.total) * 100) : 0;
  const openTasks = staffTasks.filter((item) => item.status !== 'completed' && item.status !== 'cancelled').length;
  const openTickets = supportTickets.filter((item) => item.status !== 'closed').length;
  const vipCount = crmRows.filter((item) => item.segment !== 'Без сегмента').length;

  return (
    <div className="br-admin-shell">
      <aside className="br-admin-sidebar">
        <div>
          <BRLogo size={20} dark />
          <div style={{ marginTop: 28 }}>
            <BREyebrow style={{ color: 'rgba(255,255,255,0.52)' }}>Панель управления</BREyebrow>
            <div className="br-display" style={{ color: '#fff', fontSize: 26, marginTop: 6 }}>Scoot Bali Admin</div>
          </div>
        </div>

        <nav className="br-admin-nav">
          {(['overview', 'bookings', 'fleet', 'calendar', 'crm', 'analytics', 'support'] as AdminSection[]).map((value) => (
            <button
              key={value}
              type="button"
              className={`br-admin-nav-item ${section === value ? 'active' : ''}`}
              onClick={() => setSection(value)}
            >
              <span>{sectionTitle(value)}</span>
              <span className="br-admin-nav-meta">
                {value === 'fleet'
                  ? fleetStats.total
                  : value === 'bookings'
                    ? bookingStats.total
                    : value === 'crm'
                      ? crmRows.length
                      : value === 'support'
                        ? openTickets
                        : 'Live'}
              </span>
            </button>
          ))}
        </nav>

        <div className="br-admin-sidebar-card">
          <div className="br-admin-kicker">Вы вошли как</div>
          <div className="br-display" style={{ fontSize: 22, color: '#fff', marginTop: 8 }}>
            {user.full_name || user.email}
          </div>
          <div className="br-admin-note" style={{ color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>
            {user.role || 'staff'} · {user.email}
          </div>
        </div>
      </aside>

      <main className="br-admin-main">
        <section className="br-admin-hero">
          <div>
            <BREyebrow>{sectionTitle(section)}</BREyebrow>
            <h1 className="br-display br-admin-hero-title">
              Админка в стиле референса, но на живых данных проекта.
            </h1>
            <p className="br-admin-hero-copy">
              По ТЗ здесь должны быть управление техникой, бронированиями, календарём занятости, CRM, аналитикой,
              коммуникацией с клиентами и задачами сотрудников. Для начала весь интерфейс сделан на статичном русском тексте.
            </p>
          </div>
          <div className="br-admin-hero-actions">
            <BRPrimary onClick={handleCreateNew}>Добавить технику</BRPrimary>
            <BROutline onClick={loadAdminData}>Обновить данные</BROutline>
          </div>
        </section>

        {error && (
          <div className="br-admin-alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)}>Закрыть</button>
          </div>
        )}

        <div className="br-admin-grid">
          <AdminMetric label="Парк техники" value={String(fleetStats.total)} note={`${fleetStats.available} доступны прямо сейчас`} accent />
          <AdminMetric label="Средняя цена / день" value={formatMoney(fleetStats.avgPrice)} note={`${fleetStats.featured} в featured-блоках`} />
          <AdminMetric label="Бронирования" value={String(bookingStats.total)} note={`${bookingStats.active} активны сейчас`} />
          <AdminMetric label="Выручка" value={formatMoney(analyticsRevenue?.revenue ?? bookingStats.revenue)} note={`${bookingStats.confirmed} подтверждены или в доставке`} />
        </div>

        {section === 'overview' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div className="br-admin-two-col">
              <div className="br-admin-panel">
                <div className="br-admin-panel-head">
                  <div>
                    <div className="br-admin-kicker">Техника</div>
                    <h2 className="br-display br-admin-section-title">Что требует внимания</h2>
                  </div>
                </div>
                <div className="br-admin-list">
                  {fleet.slice(0, 6).map((item) => (
                    <button key={item.id} type="button" className="br-admin-list-item" onClick={() => handleSelectScooter(item)}>
                      <div>
                        <div className="br-admin-item-title">{item.title}</div>
                        <div className="br-admin-note">
                          {item.model_info?.brand} {item.model_info?.name} · {formatMoney(item.base_price_usd ?? item.price_per_day)}
                        </div>
                      </div>
                      <BRChip status={item.status || 'available'} />
                    </button>
                  ))}
                  {fleet.length === 0 && <EmptyState label="Техника пока не добавлена." />}
                </div>
              </div>

              <div className="br-admin-panel">
                <div className="br-admin-panel-head">
                  <div>
                    <div className="br-admin-kicker">Последние брони</div>
                    <h2 className="br-display br-admin-section-title">Свежие заказы</h2>
                  </div>
                </div>
                <div className="br-admin-list">
                  {bookings.slice(0, 6).map((booking) => (
                    <div key={booking.id} className="br-admin-list-item static">
                      <div>
                        <div className="br-admin-item-title">#{booking.order_number} · {booking.scooter?.title || 'Скутер'}</div>
                        <div className="br-admin-note">
                          {booking.user || 'Гость'} · {formatDateRange(booking.start_datetime, booking.end_datetime)}
                        </div>
                      </div>
                      <BRChip status={booking.status} />
                    </div>
                  ))}
                  {bookings.length === 0 && <EmptyState label="Бронирований пока нет." />}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              <div className="br-admin-panel">
                <div className="br-admin-kicker">Календарь и загрузка</div>
                <div className="br-display br-admin-section-title" style={{ marginTop: 8 }}>{availabilityRate}% доступности</div>
                <p className="br-admin-note" style={{ marginTop: 10 }}>
                  По ТЗ календарь занятости обязателен. Этот блок уже считает общую загрузку парка и ведёт в недельный календарь.
                </p>
              </div>

              <div className="br-admin-panel">
                <div className="br-admin-kicker">CRM</div>
                <div className="br-display br-admin-section-title" style={{ marginTop: 8 }}>{vipCount} сегментированных клиентов</div>
                <p className="br-admin-note" style={{ marginTop: 10 }}>
                  В профилях клиентов доступны сегменты, заметки и история взаимодействий. Это покрывает базовую CRM-логику из ТЗ.
                </p>
              </div>

              <div className="br-admin-panel">
                <div className="br-admin-kicker">Поддержка и задачи</div>
                <div className="br-display br-admin-section-title" style={{ marginTop: 8 }}>{openTickets} открытых обращений</div>
                <p className="br-admin-note" style={{ marginTop: 10 }}>
                  Плюс {openTasks} активных задач сотрудников. В отдельном разделе собраны тикеты, чаты и операционные задачи.
                </p>
              </div>

              <div className="br-admin-panel">
                <div className="br-admin-kicker">Доп. услуги</div>
                <div className="br-display br-admin-section-title" style={{ marginTop: 8 }}>{addons.length} позиций</div>
                <p className="br-admin-note" style={{ marginTop: 10 }}>
                  В ТЗ указано, что add-ons должны управляться из админки. База услуг уже читается, следующий шаг можно сделать отдельным CRUD-экраном.
                </p>
              </div>
            </div>
          </div>
        )}

        {section === 'fleet' && (
          <div className="br-admin-two-col fleet">
            <div className="br-admin-panel">
              <div className="br-admin-panel-head">
                <div>
                  <div className="br-admin-kicker">Управление техникой</div>
                  <h2 className="br-display br-admin-section-title">Парк скутеров</h2>
                </div>
                <BRSecondary onClick={handleCreateNew}>Новая карточка</BRSecondary>
              </div>

              <div className="br-admin-toolbar">
                <input
                  className="br-admin-input"
                  placeholder="Поиск по названию, бренду, slug или SKU"
                  value={fleetQuery}
                  onChange={(e) => setFleetQuery(e.target.value)}
                />
                <select className="br-admin-input" value={fleetStatus} onChange={(e) => setFleetStatus(e.target.value)}>
                  <option value="all">Все статусы</option>
                  {VEHICLE_STATUSES.map((status) => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </div>

              <div className="br-admin-list">
                {filteredFleet.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`br-admin-list-item ${draft.id === item.id ? 'selected' : ''}`}
                    onClick={() => handleSelectScooter(item)}
                  >
                    <div>
                      <div className="br-admin-item-title">{item.title}</div>
                      <div className="br-admin-note">
                        {item.sku || 'Без SKU'} · {item.model_info?.brand} {item.model_info?.name}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
                      <strong className="br-mono" style={{ fontSize: 12 }}>
                        {formatMoney(item.base_price_usd ?? item.price_per_day)}
                      </strong>
                      <BRChip status={item.status || 'available'} />
                    </div>
                  </button>
                ))}
                {filteredFleet.length === 0 && <EmptyState label="По текущему фильтру техника не найдена." />}
              </div>
            </div>

            <div className="br-admin-panel">
              <div className="br-admin-panel-head">
                <div>
                  <div className="br-admin-kicker">{draft.id ? 'Редактирование' : 'Создание'}</div>
                  <h2 className="br-display br-admin-section-title">{draft.id ? draft.title || 'Карточка техники' : 'Новая техника'}</h2>
                </div>
                {draft.id ? <span className="br-admin-badge">ID {draft.id}</span> : null}
              </div>

              <div className="br-admin-form-grid">
                <label className="br-admin-field">
                  <span>Модель</span>
                  <select className="br-admin-input" value={draft.model} onChange={(e) => updateDraft('model', e.target.value)}>
                    <option value="">Выберите модель</option>
                    {models.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.brand} {item.name} · {item.type_name || 'Тип'}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="br-admin-field">
                  <span>Статус</span>
                  <select className="br-admin-input" value={draft.status} onChange={(e) => updateDraft('status', e.target.value)}>
                    {VEHICLE_STATUSES.map((status) => (
                      <option key={status} value={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                </label>

                <label className="br-admin-field">
                  <span>Название</span>
                  <input className="br-admin-input" value={draft.title} onChange={(e) => updateDraft('title', e.target.value)} />
                </label>

                <label className="br-admin-field">
                  <span>Slug</span>
                  <div className="br-admin-inline">
                    <input className="br-admin-input" value={draft.slug} onChange={(e) => updateDraft('slug', e.target.value)} />
                    <button type="button" className="br-admin-mini-btn" onClick={() => updateDraft('slug', slugify(draft.title || draft.slug))}>
                      Авто
                    </button>
                  </div>
                </label>

                <label className="br-admin-field">
                  <span>SKU</span>
                  <input className="br-admin-input" value={draft.sku} onChange={(e) => updateDraft('sku', e.target.value)} />
                </label>

                <label className="br-admin-field">
                  <span>Цвет</span>
                  <input className="br-admin-input" value={draft.color} onChange={(e) => updateDraft('color', e.target.value)} />
                </label>

                <label className="br-admin-field">
                  <span>Цена за день, USD</span>
                  <input className="br-admin-input" type="number" min="0" step="0.01" value={draft.base_price_usd} onChange={(e) => updateDraft('base_price_usd', e.target.value)} />
                </label>

                <label className="br-admin-field">
                  <span>Пробег</span>
                  <input className="br-admin-input" type="number" min="0" step="1" value={draft.mileage} onChange={(e) => updateDraft('mileage', e.target.value)} />
                </label>
              </div>

              <label className="br-admin-check">
                <input type="checkbox" checked={draft.is_featured} onChange={(e) => updateDraft('is_featured', e.target.checked)} />
                <span>Показывать в избранных блоках сайта</span>
              </label>

              <div className="br-admin-meta-card">
                <div className="br-admin-kicker">Детали модели</div>
                <div className="br-admin-meta-grid">
                  <div><strong>Тип</strong><span>{selectedTypeName}</span></div>
                  <div><strong>Двигатель</strong><span>{selectedModel?.engine_cc ? `${selectedModel.engine_cc} cc` : '—'}</span></div>
                  <div><strong>Трансмиссия</strong><span>{selectedModel?.transmission || '—'}</span></div>
                  <div><strong>Шлемов</strong><span>{selectedModel?.helmets_count ?? '—'}</span></div>
                </div>
              </div>

              <div className="br-admin-actions">
                <BRPrimary onClick={handleSaveScooter} disabled={saving}>
                  {saving ? 'Сохраняем...' : draft.id ? 'Сохранить изменения' : 'Создать технику'}
                </BRPrimary>
                <BROutline onClick={() => setDraft(emptyDraft())}>Сбросить форму</BROutline>
                {draft.id ? (
                  <button type="button" className="br-admin-danger" onClick={handleDeleteScooter} disabled={deleting}>
                    {deleting ? 'Удаляем...' : 'Удалить'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {section === 'bookings' && (
          <div className="br-admin-panel">
            <div className="br-admin-panel-head">
              <div>
                <div className="br-admin-kicker">Управление бронированиями</div>
                <h2 className="br-display br-admin-section-title">Статусы и операционный поток</h2>
              </div>
              <select className="br-admin-input narrow" value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}>
                {BOOKING_STATUS_FILTERS.map((status) => (
                  <option key={status} value={status}>{status === 'all' ? 'Все статусы' : statusLabel(status)}</option>
                ))}
              </select>
            </div>

            <div className="br-admin-booking-table">
              <div className="br-admin-booking-head">
                <span>Бронь</span>
                <span>Клиент</span>
                <span>Техника</span>
                <span>Даты</span>
                <span>Сумма</span>
                <span>Статус</span>
                <span>Действия</span>
              </div>

              {filteredBookings.map((booking) => (
                <div key={booking.id} className="br-admin-booking-row">
                  <span className="br-mono">#{booking.order_number}</span>
                  <span>{booking.user || 'Гость'}</span>
                  <span>{booking.scooter?.title || '—'}</span>
                  <span className="br-admin-note">{formatDateRange(booking.start_datetime, booking.end_datetime)}</span>
                  <span className="br-mono">{formatMoney(booking.total_price, booking.currency || 'USD')}</span>
                  <span><BRChip status={booking.status} /></span>
                  <span className="br-admin-row-actions">
                    {['created', 'pending_payment', 'paid'].includes(booking.status) && (
                      <button type="button" className="br-admin-mini-btn" disabled={bookingActionId === booking.id} onClick={() => handleBookingAction('confirm', booking.id)}>
                        Подтвердить
                      </button>
                    )}
                    {booking.status === 'confirmed' && (
                      <button type="button" className="br-admin-mini-btn" disabled={bookingActionId === booking.id} onClick={() => handleBookingAction('delivery', booking.id)}>
                        В доставку
                      </button>
                    )}
                    {['confirmed', 'delivery'].includes(booking.status) && (
                      <button type="button" className="br-admin-mini-btn" disabled={bookingActionId === booking.id} onClick={() => handleBookingAction('active', booking.id)}>
                        Активировать
                      </button>
                    )}
                    {booking.status === 'active' && (
                      <button type="button" className="br-admin-mini-btn" disabled={bookingActionId === booking.id} onClick={() => handleBookingAction('complete', booking.id)}>
                        Завершить
                      </button>
                    )}
                    {!['completed', 'cancelled'].includes(booking.status) && (
                      <button type="button" className="br-admin-mini-btn danger" disabled={bookingActionId === booking.id} onClick={() => handleBookingAction('cancel', booking.id)}>
                        Отменить
                      </button>
                    )}
                  </span>
                </div>
              ))}

              {filteredBookings.length === 0 && <EmptyState label="По этому статусу броней не найдено." />}
            </div>
          </div>
        )}

        {section === 'calendar' && (
          <div className="br-admin-panel">
            <div className="br-admin-panel-head">
              <div>
                <div className="br-admin-kicker">Календарь занятости</div>
                <h2 className="br-display br-admin-section-title">
                  {formatDate(calendarWeekStart)} - {formatDate(addDays(calendarWeekStart, 6).toISOString())}
                </h2>
              </div>
              <div className="br-admin-row-actions">
                <button type="button" className="br-admin-mini-btn" onClick={() => setCalendarWeekStart((current) => addDays(current, -7))}>Назад</button>
                <button type="button" className="br-admin-mini-btn" onClick={() => setCalendarWeekStart(startOfWeek(new Date()))}>Текущая</button>
                <button type="button" className="br-admin-mini-btn" onClick={() => setCalendarWeekStart((current) => addDays(current, 7))}>Вперёд</button>
              </div>
            </div>

            <div className="br-admin-table-wrap">
              <div style={{ minWidth: 980 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '240px repeat(7, minmax(100px, 1fr))',
                    borderBottom: '1px solid rgba(12, 12, 12, 0.08)',
                  }}
                >
                  <div style={{ padding: '14px 16px' }} className="br-admin-kicker">Техника</div>
                  {calendarDays.map((day) => (
                    <div key={day.toISOString()} style={{ padding: '14px 12px', borderLeft: '1px solid rgba(12, 12, 12, 0.08)', textAlign: 'center' }}>
                      <div className="br-admin-kicker">{day.toLocaleDateString(ADMIN_LOCALE, { weekday: 'short' })}</div>
                      <div style={{ fontWeight: 700, marginTop: 6 }}>{day.getDate()}</div>
                    </div>
                  ))}
                </div>

                {fleet.map((scooter) => (
                  <div
                    key={scooter.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '240px repeat(7, minmax(100px, 1fr))',
                      borderBottom: '1px solid rgba(12, 12, 12, 0.08)',
                      minHeight: 84,
                    }}
                  >
                    <div style={{ padding: '14px 16px' }}>
                      <div className="br-admin-item-title">{scooter.title}</div>
                      <div className="br-admin-note">{scooter.model_info?.brand} {scooter.model_info?.name}</div>
                    </div>

                    {calendarDays.map((day) => {
                      const dayStart = new Date(day);
                      dayStart.setHours(0, 0, 0, 0);
                      const dayEnd = new Date(day);
                      dayEnd.setHours(23, 59, 59, 999);
                      const matches = bookings.filter((item) => {
                        const bookingStart = new Date(item.start_datetime);
                        const bookingEnd = new Date(item.end_datetime);
                        return item.scooter?.id === scooter.id && item.status !== 'cancelled' && bookingStart <= dayEnd && bookingEnd >= dayStart;
                      });

                      return (
                        <div key={`${scooter.id}-${day.toISOString()}`} style={{ borderLeft: '1px solid rgba(12, 12, 12, 0.08)', padding: 6 }}>
                          {matches.length === 0 ? (
                            <div style={{ height: '100%', borderRadius: 10, background: '#f5f5f5' }} />
                          ) : (
                            matches.map((item) => (
                              <div
                                key={item.id}
                                style={{
                                  background: item.status === 'active' ? '#effaf1' : item.status === 'completed' ? '#eef4ff' : '#fff7ed',
                                  borderLeft: item.status === 'active' ? '3px solid #16a34a' : item.status === 'completed' ? '3px solid #2563eb' : '3px solid #ea580c',
                                  borderRadius: '0 8px 8px 0',
                                  padding: '8px 10px',
                                  marginBottom: 4,
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: 12 }}>#{item.order_number}</div>
                                <div className="br-admin-note">{item.user || 'Гость'}</div>
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {fleet.length === 0 && <EmptyState label="Нет техники для отображения календаря." />}
              </div>
            </div>
          </div>
        )}

        {section === 'crm' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <AdminMetric label="Профили клиентов" value={String(crmRows.length)} note="Карточки из CRM" accent />
              <AdminMetric label="VIP / сегменты" value={String(vipCount)} note="Профили с назначенным сегментом" />
              <AdminMetric label="Заметки" value={String(customerProfiles.reduce((sum, item) => sum + (item.notes?.length || 0), 0))} note="Внутренние заметки менеджеров" />
              <AdminMetric label="Касания" value={String(customerProfiles.reduce((sum, item) => sum + (item.interactions?.length || 0), 0))} note="История взаимодействий" />
            </div>

            <div className="br-admin-panel">
              <div className="br-admin-panel-head">
                <div>
                  <div className="br-admin-kicker">Клиентская база</div>
                  <h2 className="br-display br-admin-section-title">Профили, сегменты, скидки</h2>
                </div>
              </div>

              {crmRows.length === 0 ? (
                <EmptyState label="CRM-профили пока не созданы." />
              ) : (
                <div className="br-admin-table-wrap">
                  <div className="br-admin-booking-table" style={{ minWidth: 980 }}>
                    <div className="br-admin-booking-head" style={{ gridTemplateColumns: '1.1fr 1.3fr 0.9fr 0.8fr 0.8fr 0.9fr 1fr' }}>
                      <span>Клиент</span>
                      <span>Контакты</span>
                      <span>Сегмент</span>
                      <span>Скидка</span>
                      <span>Заметки</span>
                      <span>Касания</span>
                      <span>Обновлён</span>
                    </div>
                    {crmRows.map((item) => (
                      <div key={item.id} className="br-admin-booking-row" style={{ gridTemplateColumns: '1.1fr 1.3fr 0.9fr 0.8fr 0.8fr 0.9fr 1fr' }}>
                        <span>{item.name}</span>
                        <span className="br-admin-note">{item.email}<br />{item.phone}</span>
                        <span><AdminTag label={item.segment} /></span>
                        <span>{item.discount}%</span>
                        <span>{item.notes}</span>
                        <span>{item.interactions}</span>
                        <span className="br-admin-note">{formatDateTime(item.updated_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {section === 'analytics' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <AdminMetric label="Выручка" value={formatMoney(analyticsRevenue?.revenue)} note={`${analyticsRevenue?.bookings_count || 0} оплаченных или подтверждённых броней`} accent />
              <AdminMetric label="Посетители" value={String(analyticsFunnel?.visitors || 0)} note="Уникальные сессии из событий аналитики" />
              <AdminMetric label="Начали checkout" value={String(analyticsFunnel?.checkout_started || 0)} note="Шаг воронки оплаты" />
              <AdminMetric label="Конверсия" value={`${analyticsFunnel?.conversion_rate || 0}%`} note="Созданные брони от всех визитов" />
            </div>

            <div className="br-admin-two-col">
              <div className="br-admin-panel">
                <div className="br-admin-panel-head">
                  <div>
                    <div className="br-admin-kicker">Доход по технике</div>
                    <h2 className="br-display br-admin-section-title">Топ моделей по выручке</h2>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 14 }}>
                  {topScootersByRevenue.map((item) => (
                    <div key={item.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                        <span>{item.name}</span>
                        <strong>{formatMoney(item.value)}</strong>
                      </div>
                      <div style={{ height: 6, background: '#f2f2f2', borderRadius: 999 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(item.value / Math.max(...topScootersByRevenue.map((row) => row.value), 1)) * 100}%`,
                            background: '#ffd700',
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {topScootersByRevenue.length === 0 && <EmptyState label="Пока нет данных по выручке от техники." />}
                </div>
              </div>

              <div className="br-admin-panel">
                <div className="br-admin-panel-head">
                  <div>
                    <div className="br-admin-kicker">Воронка</div>
                    <h2 className="br-display br-admin-section-title">Переходы по этапам</h2>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {(analyticsFunnel?.funnel || []).map((step) => (
                    <div key={step.step} style={{ paddingBottom: 12, borderBottom: '1px solid rgba(12, 12, 12, 0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <strong>{step.label}</strong>
                        <strong>{step.count}</strong>
                      </div>
                      <div className="br-admin-note" style={{ marginTop: 4 }}>
                        Потеря на этапе: {step.dropoff_percent}%
                      </div>
                    </div>
                  ))}
                  {!analyticsFunnel?.funnel?.length && <EmptyState label="События аналитики пока не накоплены." />}
                </div>
              </div>
            </div>
          </div>
        )}

        {section === 'support' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <AdminMetric label="Тикеты" value={String(supportTickets.length)} note={`${openTickets} открытых обращений`} accent />
              <AdminMetric label="Чаты" value={String(chatThreads.length)} note="Диалоги с клиентами" />
              <AdminMetric label="Задачи" value={String(staffTasks.length)} note={`${openTasks} активных задач`} />
              <AdminMetric label="Доп. услуги" value={String(addons.length)} note="Список уже доступен в API" />
            </div>

            <div className="br-admin-two-col">
              <div className="br-admin-panel">
                <div className="br-admin-panel-head">
                  <div>
                    <div className="br-admin-kicker">Поддержка</div>
                    <h2 className="br-display br-admin-section-title">Обращения клиентов</h2>
                  </div>
                </div>
                <div className="br-admin-list">
                  {supportTickets.slice(0, 8).map((ticket) => (
                    <div key={ticket.id} className="br-admin-list-item static">
                      <div>
                        <div className="br-admin-item-title">{ticket.subject}</div>
                        <div className="br-admin-note">
                          {ticket.user?.full_name || ticket.user?.email || 'Клиент'} · {ticket.channel} · {formatDateTime(ticket.created_at)}
                        </div>
                      </div>
                      <AdminTag label={statusLabel(ticket.status)} />
                    </div>
                  ))}
                  {supportTickets.length === 0 && <EmptyState label="Тикетов поддержки пока нет." />}
                </div>
              </div>

              <div className="br-admin-panel">
                <div className="br-admin-panel-head">
                  <div>
                    <div className="br-admin-kicker">Чаты</div>
                    <h2 className="br-display br-admin-section-title">Последние диалоги</h2>
                  </div>
                </div>
                <div className="br-admin-list">
                  {chatThreads.slice(0, 8).map((thread) => (
                    <div key={thread.id} className="br-admin-list-item static">
                      <div>
                        <div className="br-admin-item-title">{thread.title || `Диалог #${thread.id}`}</div>
                        <div className="br-admin-note">
                          {thread.last_message?.sender_name || 'Без ответа'} · {formatDateTime(thread.last_message?.created_at || thread.updated_at)}
                        </div>
                        {thread.last_message?.text ? <div className="br-admin-note" style={{ marginTop: 6 }}>{thread.last_message.text}</div> : null}
                      </div>
                      <AdminTag label={statusLabel(thread.status)} />
                    </div>
                  ))}
                  {chatThreads.length === 0 && <EmptyState label="Чатов с клиентами пока нет." />}
                </div>
              </div>
            </div>

            <div className="br-admin-panel">
              <div className="br-admin-panel-head">
                <div>
                  <div className="br-admin-kicker">Задачи сотрудников</div>
                  <h2 className="br-display br-admin-section-title">Операционные таски</h2>
                </div>
              </div>

              {staffTasks.length === 0 ? (
                <EmptyState label="Задач пока нет." />
              ) : (
                <div className="br-admin-booking-table">
                  <div className="br-admin-booking-head" style={{ gridTemplateColumns: '1.4fr 0.8fr 1fr 1fr 0.9fr' }}>
                    <span>Задача</span>
                    <span>Статус</span>
                    <span>Ответственный</span>
                    <span>Срок</span>
                    <span>Чеклист</span>
                  </div>
                  {staffTasks.slice(0, 12).map((task) => (
                    <div key={task.id} className="br-admin-booking-row" style={{ gridTemplateColumns: '1.4fr 0.8fr 1fr 1fr 0.9fr' }}>
                      <span>{task.title}</span>
                      <span><AdminTag label={statusLabel(task.status)} /></span>
                      <span>{task.assigned_to?.full_name || task.assigned_to?.email || 'Не назначен'}</span>
                      <span className="br-admin-note">{formatDateTime(task.due_at)}</span>
                      <span>
                        {(task.checklist_items?.filter((item) => item.is_completed).length || 0)}/{task.checklist_items?.length || 0}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
