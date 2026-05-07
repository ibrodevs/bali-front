'use client';

import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ApiError, mediaUrl } from '@/lib/api';
import {
  ClipboardIcon,
  CloseIcon,
  DiamondIcon,
  DollarIcon,
  EyeIcon,
  MenuIcon,
  MessageIcon,
  OverviewIcon,
  ReceiptIcon,
  RefreshIcon,
  ScooterIcon,
  TagIcon,
  UsersIcon,
} from '@/components/Icons';
import {
  ApiAnalyticsFunnel,
  ApiAnalyticsRevenue,
  AdminScooterPayload,
  ApiAuditLog,
  ApiBooking,
  ApiChatMessage,
  ApiChatThread,
  ApiCustomerProfile,
  ApiAdminUser,
  ApiLoginLog,
  ApiPayment,
  ApiQuickReply,
  ApiScooterDetail,
  ApiVehicleModel,
  ApiWebhookLog,
  endpoints,
  unwrapList,
} from '@/lib/endpoints';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';

function useWindowWidth() {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

const A = {
  bg: '#f7f7f8',
  sidebar: '#0d0d0d',
  white: '#ffffff',
  black: '#000000',
  gold: '#FFD700',
  g100: '#F5F5F5',
  g200: '#EBEBEB',
  g300: '#CCCCCC',
  g400: '#AAAAAA',
  g500: '#888888',
  g700: '#444444',
  green: '#16a34a',
  red: '#dc2626',
  blue: '#2563eb',
  orange: '#ea580c',
  greenBg: '#f0fdf4',
  redBg: '#fef2f2',
  blueBg: '#eff6ff',
  orangeBg: '#fff7ed',
};

type AdminView = 'overview' | 'bookings' | 'fleet' | 'calendar' | 'crm' | 'analytics' | 'support';

const NAV: { id: AdminView; icon: ReactNode; label: string }[] = [
  { id: 'overview', icon: <OverviewIcon size={18} />, label: 'Overview' },
  { id: 'bookings', icon: <ClipboardIcon size={18} />, label: 'Bookings' },
  { id: 'fleet', icon: <ScooterIcon size={18} />, label: 'Fleet' },
  { id: 'calendar', icon: <ReceiptIcon size={18} />, label: 'Calendar' },
  { id: 'crm', icon: <UsersIcon size={18} />, label: 'CRM' },
  { id: 'analytics', icon: <OverviewIcon size={18} />, label: 'Analytics' },
  { id: 'support', icon: <MessageIcon size={18} />, label: 'Support' },
];

type BadgeColor = 'default' | 'gold' | 'green' | 'red' | 'blue' | 'orange';

function Badge({ children, color = 'default' }: { children: ReactNode; color?: BadgeColor }) {
  const map: Record<BadgeColor, [string, string]> = {
    default: [A.g100, A.g700],
    gold: [A.gold, A.black],
    green: [A.greenBg, A.green],
    red: [A.redBg, A.red],
    blue: [A.blueBg, A.blue],
    orange: [A.orangeBg, A.orange],
  };
  const [bg, text] = map[color];
  return (
    <span
      style={{
        background: bg,
        color: text,
        padding: '3px 10px',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {children}
    </span>
  );
}

type ButtonVariant = 'primary' | 'dark' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

function Button({
  children,
  variant = 'primary',
  size = 'sm',
  onClick,
  style,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  style?: CSSProperties;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: { background: A.gold, color: A.black, border: 'none' },
    dark: { background: A.black, color: A.white, border: 'none' },
    outline: { background: 'transparent', color: A.black, border: `1.5px solid ${A.g200}` },
    ghost: { background: A.g100, color: A.g700, border: 'none' },
    danger: { background: A.red, color: A.white, border: 'none' },
  };
  const sz: CSSProperties =
    size === 'md' ? { padding: '10px 18px', fontSize: 14 } : { padding: '8px 14px', fontSize: 12 };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        opacity: disabled ? 0.6 : 1,
        ...variants[variant],
        ...sz,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, gap: 16 }}>
      <div>
        <h2
          style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '-0.03em',
            color: A.black,
            marginBottom: 3,
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, helper, icon }: { label: string; value: string; helper?: string; icon: ReactNode }) {
  return (
    <div style={{ background: A.white, borderRadius: 14, padding: '22px 24px', border: `1px solid ${A.g200}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: A.g500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            background: A.g100,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      </div>
      <div
        style={{
          fontFamily: 'Sora, sans-serif',
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: '-0.04em',
          color: A.black,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      {helper ? (
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>{helper}</div>
      ) : null}
    </div>
  );
}

function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: A.white, borderRadius: 14, border: `1px solid ${A.g200}`, ...style }}>{children}</div>
  );
}

function Field({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <label style={{ display: 'grid', gap: 8, ...style }}>
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fontWeight: 700,
          color: A.g500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: `1.5px solid ${A.g200}`,
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  outline: 'none',
  background: A.white,
};

function EmptyState({ label }: { label: string }) {
  return (
    <Panel style={{ padding: 28 }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>{label}</div>
    </Panel>
  );
}

function ErrorBanner({ error, onClose }: { error: string | null; onClose?: () => void }) {
  if (!error) return null;
  return (
    <div
      style={{
        margin: '12px 32px 0',
        background: A.redBg,
        color: A.red,
        borderRadius: 12,
        padding: '14px 16px',
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span>{error}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: A.red, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        >
          <CloseIcon size={16} color={A.red} />
        </button>
      ) : null}
    </div>
  );
}

function formatMoney(value: string | number | undefined | null) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatShortDate(value?: string | Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start || !end) return '—';
  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

function paymentBadgeColor(status?: string | null): BadgeColor {
  if (!status) return 'default';
  if (['succeeded', 'paid'].includes(status)) return 'green';
  if (['failed', 'refunded'].includes(status)) return 'red';
  return 'orange';
}

function bookingBadgeColor(status?: string | null): BadgeColor {
  if (!status) return 'default';
  if (['active', 'confirmed', 'delivery', 'paid'].includes(status)) return 'green';
  if (status === 'cancelled') return 'red';
  if (status === 'completed') return 'blue';
  return 'orange';
}

function scooterBadgeColor(status?: string | null): BadgeColor {
  if (status === 'available') return 'green';
  if (status === 'rented') return 'blue';
  if (status === 'maintenance') return 'orange';
  return 'red';
}

function slugify(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function initials(value?: string | null) {
  const source = (value || '').trim();
  if (!source) return 'AD';
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();
}

function isAdminLike(user: { role?: string; is_staff?: boolean; is_superuser?: boolean } | null | undefined) {
  if (!user) return false;
  if (user.is_staff || user.is_superuser) return true;
  return ['admin', 'manager', 'staff'].includes((user.role || '').toLowerCase());
}

function monthKey(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date();
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
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

type AdminData = {
  bookings: ApiBooking[];
  scooters: ApiScooterDetail[];
  scooterModels: ApiVehicleModel[];
  users: ApiAdminUser[];
  profiles: ApiCustomerProfile[];
  revenue: ApiAnalyticsRevenue;
  funnel: ApiAnalyticsFunnel;
  threads: ApiChatThread[];
  quickReplies: ApiQuickReply[];
  payments: ApiPayment[];
  auditLogs: ApiAuditLog[];
  loginLogs: ApiLoginLog[];
  webhookLogs: ApiWebhookLog[];
};

const EMPTY_DATA: AdminData = {
  bookings: [],
  scooters: [],
  scooterModels: [],
  users: [],
  profiles: [],
  revenue: { revenue: 0, bookings_count: 0, currency: 'USD' },
  funnel: { funnel: [], visitors: 0, checkout_started: 0, bookings_created: 0, conversion_rate: 0, checkout_conversion_rate: 0 },
  threads: [],
  quickReplies: [],
  payments: [],
  auditLogs: [],
  loginLogs: [],
  webhookLogs: [],
};

export default function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  const requestedView = searchParams.get('view');
  const initialView = NAV.some((item) => item.id === requestedView) ? (requestedView as AdminView) : 'overview';
  const [view, setView] = useState<AdminView>(initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [data, setData] = useState<AdminData>(EMPTY_DATA);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const [busyBookingId, setBusyBookingId] = useState<number | null>(null);
  const [savingScooterId, setSavingScooterId] = useState<number | null>(null);
  const [savingFleetForm, setSavingFleetForm] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [threadMessages, setThreadMessages] = useState<ApiChatMessage[]>([]);
  const [sendingReply, setSendingReply] = useState(false);

  const canOpenAdmin = isAdminLike(user);

  async function loadAdminData() {
    setLoading(true);
    setError(null);
    try {
      const [bookingsRes, scootersRes, scooterModelsRes, usersRes] = await Promise.all([
        endpoints.adminBookings(),
        endpoints.adminScooters(),
        endpoints.scooterModels(),
        endpoints.adminUsers(),
      ]);

      const bookings = unwrapList(bookingsRes);
      const scooters = unwrapList(scootersRes);
      const scooterModels = unwrapList(scooterModelsRes);
      const users = unwrapList(usersRes);

      const optional = await Promise.allSettled([
        endpoints.adminCustomerProfiles({ page_size: 100 }),
        endpoints.adminAnalyticsRevenue(),
        endpoints.adminAnalyticsFunnel(),
        endpoints.adminChatThreads({ page_size: 100 }),
        endpoints.adminQuickReplies({ is_active: true, page_size: 50 }),
        endpoints.adminPayments({ page_size: 100 }),
        endpoints.adminAuditLogs({ page_size: 50 }),
        endpoints.adminLoginLogs({ page_size: 50 }),
        endpoints.adminWebhookLogs({ page_size: 50 }),
      ]);

      const [profilesR, revenueR, funnelR, threadsR, quickR, paymentsR, auditR, loginR, webhookR] = optional;

      const next: AdminData = {
        bookings,
        scooters,
        scooterModels,
        users,
        profiles: profilesR.status === 'fulfilled' ? unwrapList(profilesR.value) : [],
        revenue:
          revenueR.status === 'fulfilled'
            ? revenueR.value
            : { revenue: 0, bookings_count: 0, currency: 'USD' },
        funnel:
          funnelR.status === 'fulfilled'
            ? funnelR.value
            : {
                funnel: [],
                visitors: 0,
                checkout_started: 0,
                bookings_created: 0,
                conversion_rate: 0,
                checkout_conversion_rate: 0,
              },
        threads: threadsR.status === 'fulfilled' ? unwrapList(threadsR.value) : [],
        quickReplies: quickR.status === 'fulfilled' ? unwrapList(quickR.value) : [],
        payments: paymentsR.status === 'fulfilled' ? unwrapList(paymentsR.value) : [],
        auditLogs: auditR.status === 'fulfilled' ? unwrapList(auditR.value) : [],
        loginLogs: loginR.status === 'fulfilled' ? unwrapList(loginR.value) : [],
        webhookLogs: webhookR.status === 'fulfilled' ? unwrapList(webhookR.value) : [],
      };

      setData(next);
      setActiveThreadId((current) => current || next.threads[0]?.id || null);
      setForbidden(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
      } else {
        setError(err instanceof ApiError ? err.message : 'Unable to load admin data');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadThreadMessages(threadId: number) {
    if (!threadId) {
      setThreadMessages([]);
      return;
    }
    try {
      const res = await endpoints.adminChatMessages(threadId, { page_size: 100 });
      setThreadMessages(unwrapList(res));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load messages');
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!canOpenAdmin) {
      setForbidden(true);
      return;
    }
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, canOpenAdmin]);

  useEffect(() => {
    if (view !== 'support' || !activeThreadId) return;
    loadThreadMessages(activeThreadId);
  }, [activeThreadId, view]);

  useEffect(() => {
    if (view !== 'support') return;
    const id = window.setInterval(() => {
      endpoints
        .adminChatThreads({ page_size: 100 })
        .then((threadsRes) => {
          setData((current) => ({ ...current, threads: unwrapList(threadsRes) }));
        })
        .catch(() => {});
      if (activeThreadId) loadThreadMessages(activeThreadId);
    }, 10000);
    return () => window.clearInterval(id);
  }, [view, activeThreadId]);

  async function handlePatchScooter(scooterId: number, payload: Record<string, unknown>) {
    setSavingScooterId(scooterId);
    setError(null);
    try {
      await endpoints.adminUpdateScooter(scooterId, payload as never);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update scooter');
    } finally {
      setSavingScooterId(null);
    }
  }

  async function handleSaveScooter(payload: AdminScooterPayload) {
    setSavingFleetForm(true);
    setError(null);
    try {
      await endpoints.adminCreateScooter(payload);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to create scooter');
      throw err;
    } finally {
      setSavingFleetForm(false);
    }
  }

  async function handleBookingAction(
    bookingId: number,
    action: 'confirm' | 'mark-delivery' | 'mark-active' | 'complete' | 'cancel',
  ) {
    setBusyBookingId(bookingId);
    setError(null);
    try {
      if (action === 'confirm') await endpoints.adminConfirmBooking(bookingId);
      if (action === 'mark-delivery') await endpoints.adminMarkBookingDelivery(bookingId);
      if (action === 'mark-active') await endpoints.adminMarkBookingActive(bookingId);
      if (action === 'complete') await endpoints.adminCompleteBooking(bookingId);
      if (action === 'cancel') await endpoints.adminCancelBooking(bookingId);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update booking');
    } finally {
      setBusyBookingId(null);
    }
  }

  async function handleSendReply(threadId: number, text: string) {
    setSendingReply(true);
    setError(null);
    try {
      try {
        await endpoints.adminSendChatMessage({ thread_id: threadId, text });
      } catch (err) {
        if (!(err instanceof ApiError) || !user?.id) throw err;
        await endpoints.adminAddChatParticipant({ thread_id: threadId, user_id: user.id, role: 'staff' });
        await endpoints.adminSendChatMessage({ thread_id: threadId, text });
      }
      await loadThreadMessages(threadId);
      const threadsRes = await endpoints.adminChatThreads({ page_size: 100 });
      setData((current) => ({ ...current, threads: unwrapList(threadsRes) }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to send message');
    } finally {
      setSendingReply(false);
    }
  }

  async function handleThreadStatus(threadId: number, status: 'open' | 'closed') {
    setError(null);
    try {
      await endpoints.adminUpdateChatThread(threadId, { status });
      const threadsRes = await endpoints.adminChatThreads({ page_size: 100 });
      setData((current) => ({ ...current, threads: unwrapList(threadsRes) }));
      await loadThreadMessages(threadId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update thread');
    }
  }

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  if (authLoading) {
    return <FullScreenMessage title="Loading..." subtitle="Verifying admin access" />;
  }

  if (!user) {
    return (
      <FullScreenMessage
        title="Sign in required"
        subtitle="The admin panel is only available to authorized staff."
        action={
          <Button variant="primary" size="md" onClick={() => router.push('/login')}>
            Go to login
          </Button>
        }
      />
    );
  }

  if (forbidden || !canOpenAdmin) {
    return (
      <FullScreenMessage
        title="Access denied"
        subtitle="Your account does not have admin privileges."
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="primary" size="md" onClick={() => router.push('/')}>
              Home
            </Button>
            <Button variant="outline" size="md" onClick={() => router.push('/profile')}>
              Profile
            </Button>
          </div>
        }
      />
    );
  }

  const viewMap: Record<AdminView, ReactNode> = {
    overview: <OverviewView data={data} onOpenView={setView} isMobile={isMobile} />,
    fleet: (
      <FleetView
        scooters={data.scooters}
        scooterModels={data.scooterModels}
        savingScooterId={savingScooterId}
        savingFleetForm={savingFleetForm}
        onPatchScooter={handlePatchScooter}
        onCreateScooter={handleSaveScooter}
        isMobile={isMobile}
      />
    ),
    bookings: <BookingsView bookings={data.bookings} busyBookingId={busyBookingId} onBookingAction={handleBookingAction} isMobile={isMobile} />,
    crm: <CRMView profiles={data.profiles} users={data.users} bookings={data.bookings} isMobile={isMobile} />,
    calendar: <CalendarView bookings={data.bookings} scooters={data.scooters} isMobile={isMobile} />,
    analytics: <AnalyticsView revenue={data.revenue} funnel={data.funnel} bookings={data.bookings} isMobile={isMobile} />,
    support: (
      <SupportView
        threads={data.threads}
        messages={threadMessages}
        quickReplies={data.quickReplies}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onSendReply={handleSendReply}
        onUpdateThreadStatus={handleThreadStatus}
        sendingReply={sendingReply}
        isMobile={isMobile}
      />
    ),
  };

  const sidebarContent = (
    <>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: A.gold, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: 15, color: A.black }}>S</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: '-0.03em', color: A.white }}>
              SCOOT <span style={{ color: A.gold }}>BALI</span>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', marginTop: 1 }}>
              ADMIN PANEL
            </div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 10px' }}>
        {NAV.map((item) => (
          <div
            key={item.id}
            onClick={() => { setView(item.id); closeSidebar(); }}
            style={{
              padding: '11px 14px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              marginBottom: 3,
              background: view === item.id ? 'rgba(255,215,0,0.12)' : 'transparent',
            }}
          >
            <span style={{ display: 'inline-flex', color: view === item.id ? A.gold : 'rgba(255,255,255,0.5)' }}>{item.icon}</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: view === item.id ? 700 : 400, color: view === item.id ? A.white : 'rgba(255,255,255,0.5)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </nav>
      <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,215,0,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 14, color: A.gold }}>
            {initials(user.full_name || user.email)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: A.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.full_name || 'Admin'}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout} style={{ width: '100%', color: A.white, borderColor: 'rgba(255,255,255,0.16)' }}>
          Sign out
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', fontFamily: 'Inter, sans-serif', background: A.bg, color: A.black }}>
        {/* Mobile top bar */}
        <div style={{ height: 52, background: A.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, zIndex: 10 }}>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'transparent', border: 'none', color: A.white, cursor: 'pointer', lineHeight: 1, padding: '4px 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Menu"
          >
            <MenuIcon size={20} color={A.white} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, background: A.gold, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: 11, color: A.black }}>S</span>
            </div>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.white }}>
              SCOOT <span style={{ color: A.gold }}>BALI</span>
            </span>
          </div>
          <button
            type="button"
            onClick={loadAdminData}
            disabled={loading}
            style={{ background: 'transparent', border: 'none', color: loading ? 'rgba(255,255,255,0.4)' : A.gold, cursor: loading ? 'not-allowed' : 'pointer', padding: '4px 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Refresh"
          >
            <RefreshIcon size={18} color={loading ? 'rgba(255,255,255,0.4)' : A.gold} />
          </button>
        </div>

        <ErrorBanner error={error} onClose={() => setError(null)} />

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'hidden', paddingBottom: 0 }}>
          {loading && data.bookings.length === 0 && view !== 'support' ? (
            <div style={{ padding: 16 }}>
              <EmptyState label="Loading admin data…" />
            </div>
          ) : (
            viewMap[view]
          )}
        </div>

        {/* Slide-in drawer overlay */}
        {sidebarOpen ? (
          <>
            <div
              onClick={closeSidebar}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
            />
            <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, background: A.sidebar, zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {sidebarContent}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, sans-serif', background: A.bg, color: A.black }}>
      <div style={{ background: A.sidebar, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {sidebarContent}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: A.bg }}>
        <div style={{ height: 56, background: A.white, borderBottom: `1px solid ${A.g200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black, textTransform: 'capitalize' }}>{view}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button variant="outline" onClick={loadAdminData} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <a href="/" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="md">↗ View Website</Button>
            </a>
          </div>
        </div>
        <ErrorBanner error={error} onClose={() => setError(null)} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {loading && data.bookings.length === 0 && view !== 'support' ? (
            <div style={{ padding: 28 }}><EmptyState label="Loading admin data…" /></div>
          ) : (
            viewMap[view]
          )}
        </div>
      </div>
    </div>
  );
}

function FullScreenMessage({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: A.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Panel style={{ width: '100%', maxWidth: 480, padding: 32, textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            width: 56,
            height: 56,
            background: A.gold,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            fontFamily: 'Sora, sans-serif',
            fontWeight: 900,
            fontSize: 22,
            color: A.black,
          }}
        >
          S
        </div>
        <h1
          style={{
            fontFamily: 'Sora, sans-serif',
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: '-0.03em',
            color: A.black,
            marginBottom: 10,
          }}
        >
          {title}
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.6, color: A.g500, marginBottom: 22 }}>
          {subtitle}
        </p>
        {action ? <div style={{ display: 'flex', justifyContent: 'center' }}>{action}</div> : null}
      </Panel>
    </div>
  );
}

function OverviewView({ data, onOpenView, isMobile }: { data: AdminData; onOpenView: (view: AdminView) => void; isMobile: boolean }) {
  const { bookings, scooters, users, revenue, payments } = data;

  const paidBookings = bookings.filter(
    (item) => item.payment_status === 'paid' || item.latest_payment?.status === 'succeeded',
  );
  const activeBookings = bookings.filter((item) =>
    ['created', 'pending_payment', 'confirmed', 'delivery', 'active'].includes(item.status),
  );
  const utilization = scooters.length
    ? Math.round((scooters.filter((item) => item.status !== 'available').length / scooters.length) * 100)
    : 0;
  const averageBookingValue = paidBookings.length
    ? paidBookings.reduce((sum, item) => sum + Number(item.total_price || 0), 0) / paidBookings.length
    : 0;

  const monthlyMap = new Map<string, number>();
  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() - i);
    monthlyMap.set(monthKey(date.toISOString()), 0);
  }
  for (const item of paidBookings) {
    const key = monthKey(item.created_at);
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(item.total_price || 0));
    }
  }
  const monthlyRevenue = Array.from(monthlyMap.entries()).map(([key, amount]) => {
    const [year, month] = key.split('-');
    return {
      label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
        new Date(Date.UTC(Number(year), Number(month) - 1, 1)),
      ),
      amount,
    };
  });
  const maxRevenue = Math.max(...monthlyRevenue.map((item) => item.amount), 1);

  const auditLogs = data.auditLogs.slice(0, 5);
  const loginLogs = data.loginLogs.slice(0, 3);
  const webhookLogs = data.webhookLogs.slice(0, 2);

  const pad = isMobile ? '16px' : '28px 32px';

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: pad }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16, marginBottom: isMobile ? 16 : 28 }}>
        <StatCard label="Revenue" value={formatMoney(revenue.revenue)} helper={`${revenue.bookings_count} paid bookings`} icon={<DollarIcon size={18} color={A.g700} />} />
        <StatCard label="Active Bookings" value={String(activeBookings.length)} helper="Current pipeline" icon={<ClipboardIcon size={18} color={A.g700} />} />
        <StatCard label="Fleet Utilization" value={`${utilization}%`} helper={`${scooters.length} vehicles`} icon={<ScooterIcon size={18} color={A.g700} />} />
        <StatCard label="Average Booking" value={formatMoney(averageBookingValue)} helper={`${payments.length} payments tracked`} icon={<DiamondIcon size={18} color={A.g700} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: isMobile ? 12 : 16, marginBottom: isMobile ? 12 : 28 }}>
        <Panel style={{ padding: 24 }}>
          <SectionHeader
            title="Revenue"
            subtitle="Last 12 months from paid bookings"
            action={<Button variant="dark" onClick={() => onOpenView('analytics')}>Open Analytics</Button>}
          />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180 }}>
            {monthlyRevenue.map((item) => (
              <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div
                  title={`${item.label}: ${formatMoney(item.amount)}`}
                  style={{
                    width: '100%',
                    minHeight: 4,
                    height: `${Math.max(4, (item.amount / maxRevenue) * 140)}px`,
                    background: item.amount === maxRevenue && item.amount > 0 ? A.gold : A.g200,
                    borderRadius: '6px 6px 0 0',
                  }}
                />
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: A.g500 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel style={{ padding: 24 }}>
          <SectionHeader
            title="Security"
            subtitle="Recent admin activity"
            action={<Button variant="outline" onClick={() => onOpenView('support')}>Open Support</Button>}
          />
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 12, background: A.g100 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 4 }}>Users</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 24, color: A.black }}>{users.length}</div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: A.g100 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 4 }}>Login Events</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 24, color: A.black }}>{data.loginLogs.length}</div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: A.g100 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 4 }}>Webhook Events</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 24, color: A.black }}>{data.webhookLogs.length}</div>
            </div>
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: isMobile ? 12 : 16, marginBottom: isMobile ? 12 : 28 }}>
        <Panel style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${A.g200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black }}>Recent Bookings</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>Live orders from backend</div>
            </div>
            <Button variant="dark" onClick={() => onOpenView('bookings')}>View All</Button>
          </div>
          <div>
            {bookings.slice(0, isMobile ? 4 : 6).map((item) => (
              <div
                key={item.id}
                style={{
                  padding: isMobile ? '12px 14px' : '14px 20px',
                  borderBottom: `1px solid ${A.g200}`,
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr auto' : '1.1fr 1.3fr 0.9fr 0.9fr',
                  gap: isMobile ? 8 : 12,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13, color: A.black }}>#{item.order_number}</span>
                    {!isMobile ? null : <Badge color={bookingBadgeColor(item.status)}>{item.status}</Badge>}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                    {item.user || 'Guest'} · {item.scooter?.title || 'Scooter'}
                  </div>
                  {!isMobile ? null : (
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>{formatShortDate(item.created_at)}</div>
                  )}
                </div>
                {isMobile ? (
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black, textAlign: 'right' }}>
                    {formatMoney(item.total_price)}
                  </div>
                ) : (
                  <>
                    <div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black }}>{item.user || 'Guest'}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>{item.scooter?.title || 'Scooter'}</div>
                    </div>
                    <Badge color={bookingBadgeColor(item.status)}>{item.status}</Badge>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black, textAlign: 'right' }}>
                      {formatMoney(item.total_price)}
                    </div>
                  </>
                )}
              </div>
            ))}
            {bookings.length === 0 ? (
              <div style={{ padding: 20, fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>
                No bookings yet.
              </div>
            ) : null}
          </div>
        </Panel>

        <div style={{ display: 'grid', gap: 16 }}>
          <Panel style={{ padding: 18 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 12 }}>
              Audit Trail
            </div>
            {auditLogs.length === 0 ? (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>No audit events yet.</div>
            ) : (
              auditLogs.map((item) => (
                <div key={item.id} style={{ padding: '10px 0', borderBottom: `1px solid ${A.g200}` }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                    {item.user_email || 'System'} · {item.content_type?.model || 'object'}
                  </div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13, color: A.black }}>
                    {item.action}
                  </div>
                </div>
              ))
            )}
          </Panel>
          <Panel style={{ padding: 18 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 12 }}>
              Access & Webhooks
            </div>
            {loginLogs.map((item) => (
              <div key={`login-${item.id}`} style={{ padding: '10px 0', borderBottom: `1px solid ${A.g200}` }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                  {item.user_email || 'Unknown'} · {formatDateTime(item.created_at)}
                </div>
                <Badge color={item.is_success ? 'green' : 'red'}>{item.is_success ? 'login success' : 'login failed'}</Badge>
              </div>
            ))}
            {webhookLogs.map((item) => (
              <div key={`webhook-${item.id}`} style={{ padding: '10px 0' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                  {item.provider} · {formatDateTime(item.created_at)}
                </div>
                <Badge color={item.status === 'processed' ? 'green' : 'orange'}>{item.status}</Badge>
              </div>
            ))}
            {loginLogs.length === 0 && webhookLogs.length === 0 ? (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>No security events yet.</div>
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function FleetView({
  scooters,
  scooterModels,
  savingScooterId,
  savingFleetForm,
  onPatchScooter,
  onCreateScooter,
  isMobile,
}: {
  scooters: ApiScooterDetail[];
  scooterModels: ApiVehicleModel[];
  savingScooterId: number | null;
  savingFleetForm: boolean;
  onPatchScooter: (id: number, payload: Record<string, unknown>) => void;
  onCreateScooter: (payload: AdminScooterPayload) => Promise<void>;
  isMobile: boolean;
}) {
  const emptyDraft = useMemo(
    () => ({
      model: '',
      title: '',
      slug: '',
      sku: '',
      color: '',
      base_price_usd: '',
      status: 'available',
      mileage: '0',
      is_featured: false,
    }),
    [],
  );
  const [draft, setDraft] = useState(emptyDraft);

  function updateDraft<K extends keyof typeof emptyDraft>(key: K, value: (typeof emptyDraft)[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetDraft() {
    setDraft(emptyDraft);
  }

  async function submitFleetForm() {
    if (!draft.model || !draft.title.trim() || !draft.slug.trim() || !draft.sku.trim() || !draft.base_price_usd) {
      window.alert('Fill in required fields: model, title, slug, SKU and price.');
      return;
    }

    await onCreateScooter({
      model: Number(draft.model),
      title: draft.title.trim(),
      slug: draft.slug.trim(),
      sku: draft.sku.trim(),
      color: draft.color.trim(),
      base_price_usd: draft.base_price_usd,
      status: draft.status,
      mileage: Number(draft.mileage || 0),
      is_featured: draft.is_featured,
    });
    resetDraft();
  }

  const selectedModel = scooterModels.find((item) => String(item.id) === draft.model);

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '16px' : '28px 32px' }}>
      <SectionHeader
        title="Fleet Management"
        subtitle={`${scooters.length} vehicles from backend`}
        action={
          <Link href="/admin/scooters/new" style={{ textDecoration: 'none' }}>
            <Button variant="dark" size="md">Add scooter</Button>
          </Link>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.7fr) minmax(320px, 0.9fr)', gap: 16, alignItems: 'start' }}>
        <div>
          {scooters.length === 0 ? (
            <EmptyState label="No scooters found." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: isMobile ? 12 : 16 }}>
              {scooters.map((item) => {
                const busy = savingScooterId === item.id;
                const image = item.main_image ? mediaUrl(item.main_image) : '';
                return (
                  <Panel key={item.id} style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        height: 180,
                        position: 'relative',
                        background: image
                          ? `center / cover no-repeat url(${image})`
                          : 'linear-gradient(145deg,#111 0%,#2a2a2a 100%)',
                      }}
                    >
                      {!image ? (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'Sora, sans-serif',
                            fontWeight: 700,
                            fontSize: 20,
                            color: 'rgba(255,255,255,0.7)',
                            textAlign: 'center',
                            padding: 16,
                          }}
                        >
                          {item.title}
                        </div>
                      ) : null}
                      <div style={{ position: 'absolute', top: 12, left: 12 }}>
                        <Badge color={scooterBadgeColor(item.status)}>{item.status}</Badge>
                      </div>
                      <div style={{ position: 'absolute', top: 12, right: 12 }}>
                        <Badge color={item.is_featured ? 'gold' : 'default'}>{item.is_featured ? 'featured' : 'catalog'}</Badge>
                      </div>
                    </div>
                    <div style={{ padding: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black }}>{item.title}</div>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                            {item.type || '—'} · {item.engine_capacity || 0}cc · {item.slug}
                          </div>
                        </div>
                        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 20, color: A.black }}>
                          {formatMoney(item.base_price_usd ?? item.price_per_day)}
                        </div>
                      </div>
                      {item.short_description ? (
                        <div
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: A.g700,
                            marginBottom: 14,
                          }}
                        >
                          {item.short_description}
                        </div>
                      ) : null}
                      <div style={{ display: 'grid', gap: 12 }}>
                        <Field label="Status">
                          <select
                            value={item.status || 'available'}
                            disabled={busy}
                            onChange={(event) => onPatchScooter(item.id, { status: event.target.value })}
                            style={inputStyle}
                          >
                            <option value="available">available</option>
                            <option value="rented">rented</option>
                            <option value="maintenance">maintenance</option>
                            <option value="inactive">inactive</option>
                          </select>
                        </Field>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>Featured on website</div>
                          <Button
                            variant={item.is_featured ? 'dark' : 'outline'}
                            disabled={busy}
                            onClick={() => onPatchScooter(item.id, { is_featured: !item.is_featured })}
                          >
                            {busy ? 'Saving…' : item.is_featured ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>

        <Panel style={{ padding: 22, position: isMobile ? 'static' : 'sticky', top: 28 }}>
          <SectionHeader title="New Scooter" subtitle="Create a new product for catalog" />
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Model">
              <select value={draft.model} onChange={(event) => updateDraft('model', event.target.value)} style={inputStyle}>
                <option value="">Select model</option>
                {scooterModels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.brand} {item.name} · {item.type_name || 'Type'}
                  </option>
                ))}
              </select>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Status">
                <select value={draft.status} onChange={(event) => updateDraft('status', event.target.value)} style={inputStyle}>
                  <option value="available">available</option>
                  <option value="rented">rented</option>
                  <option value="maintenance">maintenance</option>
                  <option value="inactive">inactive</option>
                </select>
              </Field>
              <Field label="Mileage">
                <input
                  type="number"
                  min="0"
                  value={draft.mileage}
                  onChange={(event) => updateDraft('mileage', event.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>
            <Field label="Title">
              <input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} placeholder="Honda PCX 160" style={inputStyle} />
            </Field>
            <Field label="Slug">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                <input
                  value={draft.slug}
                  onChange={(event) => updateDraft('slug', event.target.value)}
                  placeholder="honda-pcx-160"
                  style={inputStyle}
                />
                <Button variant="outline" onClick={() => updateDraft('slug', slugify(draft.title || draft.slug))}>Auto</Button>
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="SKU">
                <input value={draft.sku} onChange={(event) => updateDraft('sku', event.target.value)} placeholder="PCX-160-BLK" style={inputStyle} />
              </Field>
              <Field label="Color">
                <input value={draft.color} onChange={(event) => updateDraft('color', event.target.value)} placeholder="Black" style={inputStyle} />
              </Field>
            </div>
            <Field label="Price per day, USD">
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.base_price_usd}
                onChange={(event) => updateDraft('base_price_usd', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.black }}>
              <input type="checkbox" checked={draft.is_featured} onChange={(event) => updateDraft('is_featured', event.target.checked)} />
              <span>Show as featured on website</span>
            </label>
            <Panel style={{ padding: 14, background: A.g100 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.g500, marginBottom: 10 }}>
                Model info
              </div>
              <div style={{ display: 'grid', gap: 8, fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
                <div>Brand: <strong style={{ color: A.black }}>{selectedModel?.brand || '—'}</strong></div>
                <div>Type: <strong style={{ color: A.black }}>{selectedModel?.type_name || '—'}</strong></div>
                <div>Engine: <strong style={{ color: A.black }}>{selectedModel?.engine_cc ? `${selectedModel.engine_cc}cc` : '—'}</strong></div>
                <div>Transmission: <strong style={{ color: A.black }}>{selectedModel?.transmission || '—'}</strong></div>
              </div>
            </Panel>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="primary" size="md" disabled={savingFleetForm} onClick={submitFleetForm}>
                {savingFleetForm ? 'Saving…' : 'Create scooter'}
              </Button>
              <Button variant="outline" size="md" onClick={resetDraft}>Reset</Button>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
              Required fields: model, title, slug, SKU, price.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function BookingsView({
  bookings,
  busyBookingId,
  onBookingAction,
  isMobile,
}: {
  bookings: ApiBooking[];
  busyBookingId: number | null;
  onBookingAction: (
    id: number,
    action: 'confirm' | 'mark-delivery' | 'mark-active' | 'complete' | 'cancel',
  ) => void;
  isMobile: boolean;
}) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? bookings : bookings.filter((item) => item.status === filter);

  function actionButtons(item: ApiBooking) {
    const busy = busyBookingId === item.id;
    const buttons: Array<{
      action: 'confirm' | 'mark-delivery' | 'mark-active' | 'complete' | 'cancel';
      label: string;
      variant: ButtonVariant;
    }> = [];
    if (['created', 'pending_payment', 'paid'].includes(item.status)) {
      buttons.push({ action: 'confirm', label: 'Confirm', variant: 'dark' });
    }
    if (item.status === 'confirmed') {
      buttons.push({ action: 'mark-delivery', label: 'Mark delivery', variant: 'outline' });
    }
    if (['confirmed', 'delivery'].includes(item.status)) {
      buttons.push({ action: 'mark-active', label: 'Mark active', variant: 'outline' });
    }
    if (item.status === 'active') {
      buttons.push({ action: 'complete', label: 'Complete', variant: 'dark' });
    }
    if (!['completed', 'cancelled'].includes(item.status)) {
      buttons.push({ action: 'cancel', label: 'Cancel', variant: 'ghost' });
    }
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {buttons.map(({ action, label, variant }) => (
          <Button key={action} variant={variant} disabled={busy} onClick={() => onBookingAction(item.id, action)}>
            {busy ? '...' : label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '16px' : '28px 32px' }}>
      <SectionHeader title="Bookings" subtitle={`${bookings.length} bookings loaded from backend`} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {['all', 'created', 'pending_payment', 'confirmed', 'delivery', 'active', 'completed', 'cancelled'].map((value) => (
          <div
            key={value}
            onClick={() => setFilter(value)}
            style={{
              padding: isMobile ? '6px 12px' : '8px 16px',
              borderRadius: 8,
              background: filter === value ? A.black : A.white,
              border: `1px solid ${filter === value ? A.black : A.g200}`,
              color: filter === value ? A.white : A.g700,
              fontFamily: 'Inter, sans-serif',
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {value}
          </div>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState label="No bookings for this filter." />
      ) : (
        <div style={{ display: 'grid', gap: isMobile ? 10 : 14 }}>
          {filtered.map((item) => (
            <Panel key={item.id} style={{ padding: isMobile ? 14 : 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr 1fr', gap: isMobile ? 10 : 16, alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <Badge color={bookingBadgeColor(item.status)}>{item.status}</Badge>
                    <Badge color={paymentBadgeColor(item.latest_payment?.status || item.payment_status)}>
                      {item.latest_payment?.status || item.payment_status}
                    </Badge>
                  </div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, color: A.black, marginBottom: 4 }}>
                    #{item.order_number}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>{item.user || 'Guest'}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>
                    {item.scooter?.title || 'Scooter'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 12,
                      color: A.g500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 6,
                    }}
                  >
                    Rental
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black, lineHeight: 1.6 }}>
                    {formatDateRange(item.start_datetime, item.end_datetime)}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginTop: 8 }}>
                    {item.delivery_address || 'Delivery address not provided'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      fontWeight: 800,
                      fontSize: 20,
                      color: A.black,
                      marginBottom: 8,
                    }}
                  >
                    {formatMoney(item.total_price)}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 14 }}>
                    {item.rental_days} days · {item.payment_method}
                  </div>
                  {actionButtons(item)}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function CRMView({
  profiles,
  users,
  bookings,
  isMobile,
}: {
  profiles: ApiCustomerProfile[];
  users: ApiAdminUser[];
  bookings: ApiBooking[];
  isMobile: boolean;
}) {
  const bookingStats = new Map<string, { bookings: number; total: number; last: string | null }>();
  for (const booking of bookings) {
    const key = booking.user || 'Guest';
    const current = bookingStats.get(key) || { bookings: 0, total: 0, last: null };
    current.bookings += 1;
    current.total += Number(booking.total_price || 0);
    const created = booking.created_at || null;
    if (created && (!current.last || new Date(created) > new Date(current.last))) {
      current.last = created;
    }
    bookingStats.set(key, current);
  }

  const profileMap = new Map(profiles.map((item) => [item.user?.email || '', item]));

  const customerRows = users
    .filter((item) => item.role === 'client' || profileMap.has(item.email) || bookingStats.has(item.email))
    .map((item) => {
      const profile = profileMap.get(item.email);
      const stats = bookingStats.get(item.email) || { bookings: 0, total: 0, last: null };
      return {
        id: item.id,
        name: item.full_name || item.email,
        email: item.email,
        phone: item.phone || '—',
        segment: profile?.segment?.name || 'Unassigned',
        notes: profile?.notes?.length || 0,
        interactions: profile?.interactions?.length || 0,
        bookings: stats.bookings,
        total: stats.total,
        last: stats.last,
      };
    })
    .sort((left, right) => right.total - left.total);

  const vipCount = customerRows.filter((item) => item.segment && item.segment !== 'Unassigned').length;
  const averageLtv = customerRows.length
    ? customerRows.reduce((sum, item) => sum + item.total, 0) / customerRows.length
    : 0;

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '16px' : '28px 32px' }}>
      <SectionHeader title="CRM" subtitle="Customer profiles, segments and booking history" />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Customers" value={String(customerRows.length)} helper="Client accounts with CRM data or bookings" icon={<UsersIcon size={18} color={A.g700} />} />
        <StatCard label="Segmented" value={String(vipCount)} helper="Profiles assigned to a segment" icon={<TagIcon size={18} color={A.g700} />} />
        <StatCard label="Average LTV" value={formatMoney(averageLtv)} helper="Derived from bookings" icon={<DiamondIcon size={18} color={A.g700} />} />
      </div>
      {customerRows.length === 0 ? (
        <EmptyState label="No customer records available." />
      ) : isMobile ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {customerRows.map((item) => (
            <Panel key={item.id} style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>{item.name}</div>
                <Badge color={item.segment === 'Unassigned' ? 'default' : 'gold'}>{item.segment}</Badge>
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 2 }}>{item.email}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 8 }}>{item.phone}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: A.g500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bookings</div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>{item.bookings}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: A.g500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LTV</div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>{formatMoney(item.total)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: A.g500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: A.g700 }}>{formatShortDate(item.last)}</div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel style={{ overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.4fr 0.8fr 0.8fr 0.8fr 0.9fr 1fr',
              gap: 12,
              padding: '12px 20px',
              borderBottom: `1px solid ${A.g200}`,
              background: A.g100,
            }}
          >
            {['Customer', 'Email / Phone', 'Segment', 'Bookings', 'LTV', 'Notes', 'Last Booking'].map((label) => (
              <div
                key={label}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: A.g500,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          {customerRows.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.4fr 0.8fr 0.8fr 0.8fr 0.9fr 1fr',
                gap: 12,
                padding: '14px 20px',
                borderBottom: `1px solid ${A.g200}`,
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>
                  {item.name}
                </div>
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
                <div>{item.email}</div>
                <div style={{ color: A.g500, fontSize: 12 }}>{item.phone}</div>
              </div>
              <div>
                <Badge color={item.segment === 'Unassigned' ? 'default' : 'gold'}>{item.segment}</Badge>
              </div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>
                {item.bookings}
              </div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>
                {formatMoney(item.total)}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
                {item.notes} / {item.interactions}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>
                {formatDateTime(item.last)}
              </div>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

function CalendarView({ bookings, scooters, isMobile }: { bookings: ApiBooking[]; scooters: ApiScooterDetail[]; isMobile: boolean }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const activeBookings = bookings
    .filter((item) => item.status !== 'cancelled')
    .map((item) => ({
      ...item,
      startDate: new Date(item.start_datetime),
      endDate: new Date(item.end_datetime),
    }));

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '16px' : '28px 32px' }}>
      <SectionHeader
        title="Occupancy Calendar"
        subtitle={`${formatShortDate(weekStart)} – ${formatShortDate(addDays(weekStart, 6))}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" onClick={() => setWeekStart((current) => addDays(current, -7))}>‹</Button>
            <Button variant="dark" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</Button>
            <Button variant="outline" onClick={() => setWeekStart((current) => addDays(current, 7))}>›</Button>
          </div>
        }
      />
      {scooters.length === 0 ? (
        <EmptyState label="No fleet records available." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
        <Panel style={{ overflow: 'hidden', minWidth: isMobile ? 700 : undefined }}>
          <div style={{ display: 'grid', gridTemplateColumns: '240px repeat(7, 1fr)', borderBottom: `1px solid ${A.g200}` }}>
            <div
              style={{
                padding: '14px 16px',
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: A.g500,
              }}
            >
              Vehicle
            </div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                style={{ padding: '14px 12px', borderLeft: `1px solid ${A.g200}`, textAlign: 'center' }}
              >
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 11,
                    color: A.g500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day)}
                </div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 20, color: A.black, marginTop: 2 }}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>
          {scooters.map((scooter) => (
            <div
              key={scooter.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '240px repeat(7, 1fr)',
                borderBottom: `1px solid ${A.g200}`,
                minHeight: 74,
              }}
            >
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>
                  {scooter.title}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                  {scooter.type || '—'} · {scooter.engine_capacity || 0}cc
                </div>
              </div>
              {days.map((day) => {
                const dayStart = new Date(day);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);
                const matches = activeBookings.filter(
                  (item) => item.scooter?.id === scooter.id && item.startDate <= dayEnd && item.endDate >= dayStart,
                );
                return (
                  <div
                    key={`${scooter.id}-${day.toISOString()}`}
                    style={{ borderLeft: `1px solid ${A.g200}`, padding: 6 }}
                  >
                    {matches.length === 0 ? (
                      <div style={{ height: '100%', minHeight: 60, borderRadius: 10, background: A.g100 }} />
                    ) : (
                      matches.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background:
                              item.status === 'completed'
                                ? A.blueBg
                                : item.status === 'active'
                                  ? A.greenBg
                                  : A.orangeBg,
                            borderLeft: `3px solid ${
                              item.status === 'completed' ? A.blue : item.status === 'active' ? A.green : A.orange
                            }`,
                            borderRadius: '0 8px 8px 0',
                            padding: '8px 10px',
                            marginBottom: 4,
                          }}
                        >
                          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 11, color: A.black }}>
                            #{item.order_number}
                          </div>
                          <div
                            style={{
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 11,
                              color: A.g700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.user || 'Guest'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </Panel>
        </div>
      )}
    </div>
  );
}

function AnalyticsView({
  revenue,
  funnel,
  bookings,
  isMobile,
}: {
  revenue: ApiAnalyticsRevenue;
  funnel: ApiAnalyticsFunnel;
  bookings: ApiBooking[];
  isMobile: boolean;
}) {
  const vehicleTotals = new Map<string, number>();
  const zoneTotals = new Map<string, number>();

  for (const booking of bookings) {
    const vehicleName = booking.scooter?.title || 'Unknown scooter';
    vehicleTotals.set(vehicleName, (vehicleTotals.get(vehicleName) || 0) + Number(booking.total_price || 0));
    const zoneLabel = (booking.delivery_address || 'Unknown zone').split(',')[0].trim() || 'Unknown zone';
    zoneTotals.set(zoneLabel, (zoneTotals.get(zoneLabel) || 0) + 1);
  }

  const topVehicles = Array.from(vehicleTotals.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((l, r) => r.amount - l.amount)
    .slice(0, 6);

  const topZones = Array.from(zoneTotals.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((l, r) => r.count - l.count)
    .slice(0, 6);

  const maxVehicle = Math.max(...topVehicles.map((item) => item.amount), 1);
  const maxZone = Math.max(...topZones.map((item) => item.count), 1);

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '16px' : '28px 32px' }}>
      <SectionHeader title="Analytics" subtitle={revenue.period || 'Live backend analytics'} />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14, marginBottom: isMobile ? 16 : 24 }}>
        <StatCard label="Gross Revenue" value={formatMoney(revenue.revenue)} helper={`${revenue.bookings_count} paid bookings`} icon={<DollarIcon size={18} color={A.g700} />} />
        <StatCard label="Visitors" value={String(funnel.visitors || 0)} helper="Analytics events" icon={<EyeIcon size={18} color={A.g700} />} />
        <StatCard
          label="Checkout Starts"
          value={String(funnel.checkout_started || 0)}
          helper={`${funnel.checkout_conversion_rate || 0}% from visitors`}
          icon={<ReceiptIcon size={18} color={A.g700} />}
        />
        <StatCard
          label="Conversion"
          value={`${funnel.conversion_rate || 0}%`}
          helper={`${funnel.bookings_created || 0} bookings created`}
          icon={<OverviewIcon size={18} color={A.g700} />}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 16 }}>
        <Panel style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 4 }}>
            Vehicle Performance
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 20 }}>
            Revenue contribution by scooter
          </div>
          {topVehicles.length === 0 ? (
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>No booking revenue data yet.</div>
          ) : (
            topVehicles.map((item) => (
              <div key={item.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black }}>{item.name}</span>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13, color: A.black }}>
                    {formatMoney(item.amount)}
                  </span>
                </div>
                <div style={{ height: 6, background: A.g100, borderRadius: 3 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(item.amount / maxVehicle) * 100}%`,
                      background: A.gold,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </Panel>
        <div style={{ display: 'grid', gap: 16 }}>
          <Panel style={{ padding: 24 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 4 }}>
              Funnel
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 16 }}>
              Backend analytics event steps
            </div>
            {(funnel.funnel || []).map((item) => (
              <div key={item.step} style={{ padding: '10px 0', borderBottom: `1px solid ${A.g200}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black }}>{item.label}</span>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13, color: A.black }}>
                    {item.count}
                  </span>
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginTop: 4 }}>
                  Dropoff: {item.dropoff_percent}%
                </div>
              </div>
            ))}
            {!funnel.funnel?.length ? (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>No funnel data yet.</div>
            ) : null}
          </Panel>
          <Panel style={{ padding: 24 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 4 }}>
              Delivery Zones
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 16 }}>
              Based on booking delivery addresses
            </div>
            {topZones.length === 0 ? (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>No delivery data yet.</div>
            ) : (
              topZones.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 12,
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black, marginBottom: 4 }}>
                      {item.name}
                    </div>
                    <div style={{ height: 6, background: A.g100, borderRadius: 3 }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(item.count / maxZone) * 100}%`,
                          background: A.black,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13, color: A.black }}>
                    {item.count}
                  </div>
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SupportView({
  threads,
  messages,
  quickReplies,
  activeThreadId,
  onSelectThread,
  onSendReply,
  onUpdateThreadStatus,
  sendingReply,
  isMobile,
}: {
  threads: ApiChatThread[];
  messages: ApiChatMessage[];
  quickReplies: ApiQuickReply[];
  activeThreadId: number | null;
  onSelectThread: (id: number) => void;
  onSendReply: (threadId: number, text: string) => void;
  onUpdateThreadStatus: (threadId: number, status: 'open' | 'closed') => void;
  sendingReply: boolean;
  isMobile: boolean;
}) {
  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0] || null;
  const [draft, setDraft] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    setDraft('');
  }, [activeThreadId]);

  function submit() {
    if (!activeThread || !draft.trim()) return;
    onSendReply(activeThread.id, draft.trim());
    setDraft('');
  }

  const threadList = (
    <div style={{ borderRight: isMobile ? 'none' : `1px solid ${A.g200}`, background: A.white, overflowY: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${A.g200}` }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 6 }}>
            Support Threads
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
            {threads.length} live conversations
          </div>
        </div>
        {threads.length === 0 ? (
          <div style={{ padding: 18, fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>
            No support threads available.
          </div>
        ) : (
          threads.map((thread) => {
            const participants = thread.participants || [];
            const client = participants.find((item) => item.role === 'client')?.user || participants[0]?.user;
            const lastMessage = thread.last_message;
            return (
              <div
                key={thread.id}
                onClick={() => { onSelectThread(thread.id); if (isMobile) setShowChat(true); }}
                style={{
                  padding: '14px 16px',
                  borderBottom: `1px solid ${A.g200}`,
                  cursor: 'pointer',
                  background: activeThread?.id === thread.id ? 'rgba(255,215,0,0.08)' : A.white,
                  borderLeft: activeThread?.id === thread.id ? `3px solid ${A.gold}` : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>
                    {client?.full_name || client?.email || thread.title}
                  </span>
                  <Badge color={thread.status === 'closed' ? 'default' : 'green'}>{thread.status}</Badge>
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 4 }}>
                  {thread.title || 'Untitled thread'}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 12,
                    color: A.g700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {lastMessage?.text || 'No messages yet'}
                </div>
              </div>
            );
          })
        )}
    </div>
  );

  const chatPane = (
    <div style={{ display: 'flex', flexDirection: 'column', background: A.g100, minHeight: 0, height: '100%' }}>
      {!activeThread ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            color: A.g500,
          }}
        >
          Pick a conversation to start.
        </div>
      ) : (
        <>
          <div
            style={{
              padding: isMobile ? '12px 16px' : '16px 24px',
              background: A.white,
              borderBottom: `1px solid ${A.g200}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setShowChat(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, color: A.black, lineHeight: 1, padding: '2px 6px 2px 0', flexShrink: 0 }}
                >
                  ‹
                </button>
              ) : null}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: isMobile ? 14 : 16, color: A.black, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeThread.title || 'Support Thread'}
                </div>
                {!isMobile ? (
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                    {(activeThread.participants || [])
                      .map((item) => item.user?.email)
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                ) : null}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {isMobile ? null : (
                <Button variant="outline" onClick={() => onUpdateThreadStatus(activeThread.id, 'open')}>
                  Reopen
                </Button>
              )}
              <Button variant="dark" onClick={() => onUpdateThreadStatus(activeThread.id, 'closed')}>
                {isMobile ? 'Close' : 'Close Thread'}
              </Button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '14px 12px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 ? (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>
                No messages in this thread.
              </div>
            ) : (
              messages.map((message) => {
                const sender = message.sender;
                const role = sender?.role || '';
                const isAdmin = ['admin', 'manager', 'staff'].includes(role);
                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      flexDirection: isAdmin ? 'row-reverse' : 'row',
                      gap: 10,
                      alignItems: 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: isAdmin ? A.black : A.gold,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Sora, sans-serif',
                        fontWeight: 800,
                        fontSize: 12,
                        color: isAdmin ? A.white : A.black,
                        flexShrink: 0,
                      }}
                    >
                      {initials(sender?.full_name || sender?.email)}
                    </div>
                    <div style={{ maxWidth: isMobile ? '85%' : '74%' }}>
                      <div
                        style={{
                          background: isAdmin ? A.black : A.white,
                          borderRadius: isAdmin ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                          padding: '12px 16px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 14,
                            lineHeight: 1.6,
                            color: isAdmin ? A.white : A.black,
                          }}
                        >
                          {message.text}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 10,
                          color: A.g400,
                          marginTop: 4,
                          textAlign: isAdmin ? 'right' : 'left',
                        }}
                      >
                        {formatDateTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ padding: isMobile ? '12px' : '16px 24px', background: A.white, borderTop: `1px solid ${A.g200}` }}>
            {quickReplies.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, overflowX: 'auto' }}>
                {quickReplies.slice(0, isMobile ? 3 : 4).map((reply) => (
                  <Button key={reply.id} variant="ghost" onClick={() => setDraft(reply.text)}>
                    {reply.title}
                  </Button>
                ))}
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                style={{ ...inputStyle, minHeight: isMobile ? 64 : 90, resize: 'vertical' }}
              />
              <Button
                variant="primary"
                onClick={submit}
                disabled={sendingReply || !draft.trim()}
                style={{ height: 46 }}
              >
                {sendingReply ? '…' : 'Send'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ height: '100%', overflow: 'hidden' }}>
        {showChat ? chatPane : threadList}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%' }}>
      {threadList}
      {chatPane}
    </div>
  );
}
