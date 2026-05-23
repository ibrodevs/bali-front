import React from 'react';
import { createRoot } from 'react-dom/client';
import { buildApiUrl } from '../src/api';

const STORAGE_KEY = 'scoot-bali-admin-auth';

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

const NAV = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'bookings', icon: '📋', label: 'Bookings' },
  { id: 'fleet', icon: '🛵', label: 'Fleet' },
  { id: 'calendar', icon: '📅', label: 'Calendar' },
  { id: 'crm', icon: '👥', label: 'CRM' },
  { id: 'analytics', icon: '📈', label: 'Analytics' },
  { id: 'support', icon: '💬', label: 'Support' },
  { id: 'promocodes', icon: '🏷️', label: 'Promo Codes' },
];

function loadStoredSession() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistSession(session) {
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

async function parseJson(response) {
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.detail ||
      (typeof data === 'string' ? data : '') ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function resolveUrl(pathOrUrl) {
  if (/^https?:\/\//.test(pathOrUrl)) {
    return pathOrUrl;
  }
  return buildApiUrl(pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);
}

async function requestJson(pathOrUrl, options = {}) {
  const { token, body, headers, ...rest } = options;
  const response = await fetch(resolveUrl(pathOrUrl), {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body,
  });

  return parseJson(response);
}

async function fetchAllPages(path, token) {
  let next = path;
  const items = [];

  while (next) {
    const data = await requestJson(next, { token });
    if (Array.isArray(data)) {
      items.push(...data);
      break;
    }
    if (Array.isArray(data?.results)) {
      items.push(...data.results);
      next = data.next;
      continue;
    }
    break;
  }

  return items;
}

function Badge({ children, color = 'default' }) {
  const map = {
    default: [A.g100, A.g700],
    gold: [A.gold, A.black],
    green: [A.greenBg, A.green],
    red: [A.redBg, A.red],
    blue: [A.blueBg, A.blue],
    orange: [A.orangeBg, A.orange],
  };
  const [bg, text] = map[color] || map.default;
  return (
    <span
      style={{
        background: bg,
        color: text,
        padding: '3px 10px',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'Inter',
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

function Button({ children, variant = 'primary', size = 'sm', onClick, style, disabled, type = 'button' }) {
  const vars = {
    primary: { background: A.gold, color: A.black, border: 'none' },
    dark: { background: A.black, color: A.white, border: 'none' },
    outline: { background: 'transparent', color: A.black, border: `1.5px solid ${A.g200}` },
    ghost: { background: A.g100, color: A.g700, border: 'none' },
    danger: { background: A.red, color: A.white, border: 'none' },
  };
  const sz = size === 'md' ? { padding: '10px 18px', fontSize: 14 } : { padding: '8px 14px', fontSize: 12 };

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
        fontFamily: 'Inter',
        opacity: disabled ? 0.6 : 1,
        ...vars[variant],
        ...sz,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em', color: A.black, marginBottom: 3 }}>{title}</h2>
        {subtitle ? <p style={{ fontFamily: 'Inter', fontSize: 13, color: A.g500 }}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, helper, icon }) {
  return (
    <div style={{ background: A.white, borderRadius: 14, padding: '22px 24px', border: `1px solid ${A.g200}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </div>
        <div style={{ width: 36, height: 36, background: A.g100, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 32, letterSpacing: '-0.04em', color: A.black, marginBottom: 8 }}>{value}</div>
      {helper ? <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>{helper}</div> : null}
    </div>
  );
}

function Panel({ children, style }) {
  return (
    <div style={{ background: A.white, borderRadius: 14, border: `1px solid ${A.g200}`, ...style }}>
      {children}
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: 'grid', gap: 8, ...style }}>
      <span style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: 10,
        border: `1.5px solid ${A.g200}`,
        fontFamily: 'Inter',
        fontSize: 14,
        outline: 'none',
        ...props.style,
      }}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: 10,
        border: `1.5px solid ${A.g200}`,
        fontFamily: 'Inter',
        fontSize: 14,
        outline: 'none',
        background: A.white,
        ...props.style,
      }}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: 10,
        border: `1.5px solid ${A.g200}`,
        fontFamily: 'Inter',
        fontSize: 14,
        outline: 'none',
        resize: 'vertical',
        ...props.style,
      }}
    />
  );
}

function LoadingState({ label = 'Loading…' }) {
  return (
    <Panel style={{ padding: 28 }}>
      <div style={{ fontFamily: 'Inter', fontSize: 14, color: A.g500 }}>{label}</div>
    </Panel>
  );
}

function EmptyState({ label }) {
  return (
    <Panel style={{ padding: 28 }}>
      <div style={{ fontFamily: 'Inter', fontSize: 14, color: A.g500 }}>{label}</div>
    </Panel>
  );
}

function ErrorBanner({ error }) {
  if (!error) {
    return null;
  }

  return (
    <div style={{ marginBottom: 18, background: A.redBg, color: A.red, borderRadius: 12, padding: '14px 16px', fontFamily: 'Inter', fontSize: 14 }}>
      {error}
    </div>
  );
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatShortDate(value) {
  if (!value) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDateRange(start, end) {
  if (!start || !end) {
    return '—';
  }
  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

function paymentBadgeColor(status) {
  if (['succeeded', 'paid'].includes(status)) return 'green';
  if (['failed', 'refunded'].includes(status)) return 'red';
  return 'orange';
}

function bookingBadgeColor(status) {
  if (['active', 'confirmed', 'delivery', 'paid'].includes(status)) return 'green';
  if (status === 'cancelled') return 'red';
  if (status === 'completed') return 'blue';
  return 'orange';
}

function scooterBadgeColor(status) {
  if (status === 'available') return 'green';
  if (status === 'rented') return 'blue';
  if (status === 'maintenance') return 'orange';
  return 'red';
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isoToLocalDatetime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyPromoCodeDraft() {
  return {
    id: null,
    code: '',
    discount_type: 'PERCENT',
    discount_value: '',
    starts_at: '',
    ends_at: '',
    usage_limit: '100',
    current_usage: 0,
    min_booking_amount: '0',
    max_discount_amount: '',
    is_active: true,
  };
}

function promoCodeDraftFrom(item) {
  return {
    id: item.id,
    code: item.code || '',
    discount_type: item.discount_type || 'PERCENT',
    discount_value: String(item.discount_value || ''),
    starts_at: isoToLocalDatetime(item.starts_at),
    ends_at: isoToLocalDatetime(item.ends_at),
    usage_limit: String(item.usage_limit || '1'),
    current_usage: item.current_usage || 0,
    min_booking_amount: String(item.min_booking_amount || '0'),
    max_discount_amount: item.max_discount_amount ? String(item.max_discount_amount) : '',
    is_active: Boolean(item.is_active),
  };
}

function emptyFleetDraft() {
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

function fleetDraftFromScooter(item) {
  return {
    id: item.id,
    model: item.model ? String(item.model) : '',
    title: item.title || '',
    slug: item.slug || '',
    sku: item.sku || '',
    color: item.color || '',
    base_price_usd: String(item.base_price_usd ?? item.price_per_day ?? ''),
    status: item.status || 'available',
    mileage: String(item.mileage ?? 0),
    is_featured: Boolean(item.is_featured),
  };
}

function initials(value) {
  const source = (value || '').trim();
  if (!source) {
    return 'AD';
  }
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function normalizeCollection(data) {
  if (Array.isArray(data)) {
    return data;
  }
  return Array.isArray(data?.results) ? data.results : [];
}

function monthKey(value) {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function OverviewView({ data, onOpenView }) {
  const bookings = data.bookings;
  const payments = data.payments;
  const scooters = data.scooters;
  const users = data.users;
  const revenue = data.revenue;
  const auditLogs = data.auditLogs.slice(0, 5);
  const loginLogs = data.loginLogs.slice(0, 5);
  const webhookLogs = data.webhookLogs.slice(0, 5);

  const paidBookings = bookings.filter((item) => item.payment_status === 'paid' || item.latest_payment?.status === 'succeeded');
  const activeBookings = bookings.filter((item) => ['created', 'pending_payment', 'confirmed', 'delivery', 'active'].includes(item.status));
  const utilization = scooters.length ? Math.round((scooters.filter((item) => item.status !== 'available').length / scooters.length) * 100) : 0;
  const averageBookingValue = paidBookings.length
    ? paidBookings.reduce((sum, item) => sum + Number(item.total_price || 0), 0) / paidBookings.length
    : 0;

  const monthlyMap = new Map();
  for (let index = 11; index >= 0; index -= 1) {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() - index);
    monthlyMap.set(monthKey(date.toISOString()), 0);
  }
  for (const item of paidBookings) {
    const key = monthKey(item.created_at);
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, monthlyMap.get(key) + Number(item.total_price || 0));
    }
  }
  const monthlyRevenue = Array.from(monthlyMap.entries()).map(([key, amount]) => {
    const [year, month] = key.split('-');
    return {
      label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(Date.UTC(Number(year), Number(month) - 1, 1))),
      amount,
    };
  });
  const maxRevenue = Math.max(...monthlyRevenue.map((item) => item.amount), 1);

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Revenue" value={formatMoney(revenue.revenue)} helper={`${revenue.bookings_count} paid bookings`} icon="💰" />
        <StatCard label="Active Bookings" value={String(activeBookings.length)} helper="Current pipeline" icon="📋" />
        <StatCard label="Fleet Utilization" value={`${utilization}%`} helper={`${scooters.length} vehicles`} icon="🛵" />
        <StatCard label="Average Booking" value={formatMoney(averageBookingValue)} helper={`${payments.length} payments tracked`} icon="⭐" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 28 }}>
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
                    background: item.amount === maxRevenue ? A.gold : A.g200,
                    borderRadius: '6px 6px 0 0',
                  }}
                />
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: A.g500 }}>{item.label}</div>
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
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500, marginBottom: 4 }}>Users</div>
              <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 24, color: A.black }}>{users.length}</div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: A.g100 }}>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500, marginBottom: 4 }}>Login Events</div>
              <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 24, color: A.black }}>{data.loginLogs.length}</div>
            </div>
            <div style={{ padding: 14, borderRadius: 12, background: A.g100 }}>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500, marginBottom: 4 }}>Webhook Events</div>
              <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 24, color: A.black }}>{data.webhookLogs.length}</div>
            </div>
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 28 }}>
        <Panel style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${A.g200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: A.black }}>Recent Bookings</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>Live orders from backend</div>
            </div>
            <Button variant="dark" onClick={() => onOpenView('bookings')}>View All</Button>
          </div>
          <div>
            {bookings.slice(0, 6).map((item) => (
              <div key={item.id} style={{ padding: '14px 20px', borderBottom: `1px solid ${A.g200}`, display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 0.9fr 0.9fr', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 13, color: A.black }}>#{item.order_number}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>{formatShortDate(item.created_at)}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.black }}>{item.user}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>{item.scooter?.title || 'Scooter'}</div>
                </div>
                <Badge color={bookingBadgeColor(item.status)}>{item.status}</Badge>
                <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: A.black, textAlign: 'right' }}>{formatMoney(item.total_price)}</div>
              </div>
            ))}
          </div>
        </Panel>

        <div style={{ display: 'grid', gap: 16 }}>
          <Panel style={{ padding: 18 }}>
            <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 12 }}>Audit Trail</div>
            {auditLogs.length === 0 ? <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.g500 }}>No audit events yet.</div> : auditLogs.map((item) => (
              <div key={item.id} style={{ padding: '10px 0', borderBottom: `1px solid ${A.g200}` }}>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>{item.user_email || 'System'} · {item.content_type?.model || 'object'}</div>
                <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 13, color: A.black }}>{item.action}</div>
              </div>
            ))}
          </Panel>
          <Panel style={{ padding: 18 }}>
            <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 12 }}>Access & Webhooks</div>
            {loginLogs.slice(0, 3).map((item) => (
              <div key={`login-${item.id}`} style={{ padding: '10px 0', borderBottom: `1px solid ${A.g200}` }}>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>{item.user_email || 'Unknown'} · {formatDateTime(item.created_at)}</div>
                <Badge color={item.is_success ? 'green' : 'red'}>{item.is_success ? 'login success' : 'login failed'}</Badge>
              </div>
            ))}
            {webhookLogs.slice(0, 2).map((item) => (
              <div key={`webhook-${item.id}`} style={{ padding: '10px 0' }}>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>{item.provider} · {formatDateTime(item.created_at)}</div>
                <Badge color={item.status === 'processed' ? 'green' : 'orange'}>{item.status}</Badge>
              </div>
            ))}
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
  deletingScooterId,
  onPatchScooter,
  onCreateScooter,
  onDeleteScooter,
}) {
  const [selectedId, setSelectedId] = React.useState(null);
  const [draft, setDraft] = React.useState(emptyFleetDraft);

  React.useEffect(() => {
    if (selectedId == null) {
      return;
    }
    const current = scooters.find((item) => item.id === selectedId);
    if (current) {
      setDraft(fleetDraftFromScooter(current));
      return;
    }
    setSelectedId(null);
    setDraft(emptyFleetDraft());
  }, [scooters, selectedId]);

  function handleSelect(item) {
    setSelectedId(item.id);
    setDraft(fleetDraftFromScooter(item));
  }

  function handleCreateNew() {
    setSelectedId(null);
    setDraft(emptyFleetDraft());
  }

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submitFleetForm() {
    if (!draft.model || !draft.title.trim() || !draft.slug.trim() || !draft.sku.trim() || !draft.base_price_usd) {
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

    const saved = await onCreateScooter(payload, draft.id);
    if (saved?.id) {
      setSelectedId(saved.id);
      setDraft(fleetDraftFromScooter(saved));
    }
  }

  async function removeScooter() {
    if (!draft.id) {
      return;
    }
    const shouldDelete = window.confirm(`Delete scooter "${draft.title}"?`);
    if (!shouldDelete) {
      return;
    }
    const removedId = draft.id;
    await onDeleteScooter(removedId);
    if (removedId === selectedId) {
      setSelectedId(null);
      setDraft(emptyFleetDraft());
    }
  }

  const selectedModel = scooterModels.find((item) => String(item.id) === draft.model);

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px' }}>
      <SectionHeader
        title="Fleet Management"
        subtitle={`${scooters.length} vehicles from backend`}
        action={<Button variant="dark" onClick={handleCreateNew}>Add scooter</Button>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 16, alignItems: 'start' }}>
        <div>
          {scooters.length === 0 ? (
            <EmptyState label="No scooters found." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              {scooters.map((item) => {
                const busy = savingScooterId === item.id;
                const selected = draft.id === item.id;
                return (
                  <Panel
                    key={item.id}
                    style={{
                      overflow: 'hidden',
                      border: selected ? `2px solid ${A.gold}` : `1px solid ${A.g200}`,
                    }}
                  >
                    <div
                      onClick={() => handleSelect(item)}
                      style={{ cursor: 'pointer', height: 180, position: 'relative', background: item.main_image ? `center / cover no-repeat url(${item.main_image})` : 'linear-gradient(145deg,#111 0%,#2a2a2a 100%)' }}
                    >
                      {!item.main_image ? (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora', fontWeight: 700, fontSize: 20, color: 'rgba(255,255,255,0.7)', padding: 16, textAlign: 'center' }}>
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
                          <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: A.black }}>{item.title}</div>
                          <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>{item.type} · {item.engine_capacity}cc · {item.slug}</div>
                        </div>
                        <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 20, color: A.black }}>{formatMoney(item.price_per_day)}</div>
                      </div>
                      <div style={{ fontFamily: 'Inter', fontSize: 13, lineHeight: 1.6, color: A.g700, marginBottom: 14 }}>{item.short_description}</div>
                      <div style={{ display: 'grid', gap: 12 }}>
                        <Field label="Quick status">
                          <Select
                            value={item.status}
                            disabled={busy}
                            onChange={(event) => onPatchScooter(item.id, { status: event.target.value })}
                          >
                            <option value="available">available</option>
                            <option value="rented">rented</option>
                            <option value="maintenance">maintenance</option>
                            <option value="inactive">inactive</option>
                          </Select>
                        </Field>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.g700 }}>Featured on website</div>
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

        <Panel style={{ padding: 22, position: 'sticky', top: 28 }}>
          <SectionHeader
            title={draft.id ? 'Edit Scooter' : 'New Scooter'}
            subtitle={draft.id ? `Update item #${draft.id}` : 'Create a new product for catalog'}
          />
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Model">
              <Select value={draft.model} onChange={(event) => updateDraft('model', event.target.value)}>
                <option value="">Select model</option>
                {scooterModels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.brand} {item.name} · {item.type_name || 'Type'}
                  </option>
                ))}
              </Select>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Status">
                <Select value={draft.status} onChange={(event) => updateDraft('status', event.target.value)}>
                  <option value="available">available</option>
                  <option value="rented">rented</option>
                  <option value="maintenance">maintenance</option>
                  <option value="inactive">inactive</option>
                </Select>
              </Field>
              <Field label="Mileage">
                <Input type="number" min="0" value={draft.mileage} onChange={(event) => updateDraft('mileage', event.target.value)} />
              </Field>
            </div>
            <Field label="Title">
              <Input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} placeholder="Honda PCX 160" />
            </Field>
            <Field label="Slug">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                <Input value={draft.slug} onChange={(event) => updateDraft('slug', event.target.value)} placeholder="honda-pcx-160" />
                <Button variant="outline" onClick={() => updateDraft('slug', slugify(draft.title || draft.slug))}>Auto</Button>
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="SKU">
                <Input value={draft.sku} onChange={(event) => updateDraft('sku', event.target.value)} placeholder="PCX-160-BLK" />
              </Field>
              <Field label="Color">
                <Input value={draft.color} onChange={(event) => updateDraft('color', event.target.value)} placeholder="Black" />
              </Field>
            </div>
            <Field label="Price per day, USD">
              <Input type="number" min="0" step="0.01" value={draft.base_price_usd} onChange={(event) => updateDraft('base_price_usd', event.target.value)} />
            </Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter', fontSize: 14, color: A.black }}>
              <input type="checkbox" checked={draft.is_featured} onChange={(event) => updateDraft('is_featured', event.target.checked)} />
              <span>Show as featured on website</span>
            </label>
            <Panel style={{ padding: 14, background: A.g100 }}>
              <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.g500, marginBottom: 10 }}>
                Model info
              </div>
              <div style={{ display: 'grid', gap: 8, fontFamily: 'Inter', fontSize: 13, color: A.g700 }}>
                <div>Brand: <strong style={{ color: A.black }}>{selectedModel?.brand || '—'}</strong></div>
                <div>Type: <strong style={{ color: A.black }}>{selectedModel?.type_name || '—'}</strong></div>
                <div>Engine: <strong style={{ color: A.black }}>{selectedModel?.engine_cc ? `${selectedModel.engine_cc}cc` : '—'}</strong></div>
                <div>Transmission: <strong style={{ color: A.black }}>{selectedModel?.transmission || '—'}</strong></div>
              </div>
            </Panel>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="primary" size="md" disabled={savingFleetForm} onClick={submitFleetForm}>
                {savingFleetForm ? 'Saving…' : draft.id ? 'Save scooter' : 'Create scooter'}
              </Button>
              <Button variant="outline" size="md" onClick={handleCreateNew}>Reset</Button>
              {draft.id ? (
                <Button variant="danger" size="md" disabled={deletingScooterId === draft.id} onClick={removeScooter}>
                  {deletingScooterId === draft.id ? 'Deleting…' : 'Delete'}
                </Button>
              ) : null}
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>
              Required fields: model, title, slug, SKU, price.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function BookingsView({ bookings, busyBookingId, onBookingAction }) {
  const [filter, setFilter] = React.useState('all');
  const filtered = filter === 'all' ? bookings : bookings.filter((item) => item.status === filter);
  const contactBadges = (item) => [
    item.contact_has_telegram ? 'Telegram' : null,
    item.contact_has_wechat ? 'WeChat' : null,
    item.contact_has_whatsapp ? 'WhatsApp' : null,
  ].filter(Boolean);

  function actionButtons(item) {
    const busy = busyBookingId === item.id;
    const buttons = [];
    if (['created', 'pending_payment', 'paid'].includes(item.status)) {
      buttons.push(['confirm', 'Confirm', 'dark']);
    }
    if (item.status === 'confirmed') {
      buttons.push(['mark-delivery', 'Mark delivery', 'outline']);
    }
    if (['confirmed', 'delivery'].includes(item.status)) {
      buttons.push(['mark-active', 'Mark active', 'outline']);
    }
    if (item.status === 'active') {
      buttons.push(['complete', 'Complete', 'dark']);
    }
    if (!['completed', 'cancelled'].includes(item.status)) {
      buttons.push(['cancel', 'Cancel', 'ghost']);
    }
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {buttons.map(([action, label, variant]) => (
          <Button key={action} variant={variant} disabled={busy} onClick={() => onBookingAction(item.id, action)}>
            {busy ? '...' : label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px' }}>
      <SectionHeader title="Bookings" subtitle={`${bookings.length} bookings loaded from backend`} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'created', 'pending_payment', 'confirmed', 'delivery', 'active', 'completed', 'cancelled'].map((value) => (
          <div
            key={value}
            onClick={() => setFilter(value)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: filter === value ? A.black : A.white,
              border: `1px solid ${filter === value ? A.black : A.g200}`,
              color: filter === value ? A.white : A.g700,
              fontFamily: 'Inter',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {value}
          </div>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState label="No bookings for this filter." />
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filtered.map((item) => (
            <Panel key={item.id} style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <Badge color={bookingBadgeColor(item.status)}>{item.status}</Badge>
                    <Badge color={paymentBadgeColor(item.latest_payment?.status || item.payment_status)}>{item.latest_payment?.status || item.payment_status}</Badge>
                  </div>
                  <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 17, color: A.black, marginBottom: 4 }}>#{item.order_number}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.g700 }}>{item.contact_name || item.user || 'Guest'}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.g500 }}>{item.contact_phone || 'Phone not provided'}</div>
                  {contactBadges(item).length > 0 ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {contactBadges(item).map((label) => (
                        <span key={label} style={{ padding: '4px 8px', borderRadius: 999, background: A.g100, color: A.g700, fontFamily: 'Inter', fontSize: 11, fontWeight: 600 }}>
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.g500 }}>{item.scooter?.title || 'Scooter'}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Rental</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.black, lineHeight: 1.6 }}>{formatDateRange(item.start_datetime, item.end_datetime)}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500, marginTop: 8 }}>{item.delivery_address || 'Delivery address not provided'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 20, color: A.black, marginBottom: 8 }}>{formatMoney(item.total_price)}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500, marginBottom: 14 }}>{item.rental_days} days · {item.payment_method}</div>
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

function CRMView({ profiles, users, bookings }) {
  const bookingStats = new Map();
  for (const booking of bookings) {
    const key = booking.user;
    const current = bookingStats.get(key) || { bookings: 0, total: 0, last: null };
    current.bookings += 1;
    current.total += Number(booking.total_price || 0);
    current.last = current.last && new Date(current.last) > new Date(booking.created_at) ? current.last : booking.created_at;
    bookingStats.set(key, current);
  }

  const profileMap = new Map(profiles.map((item) => [item.user?.email, item]));
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
  const averageLtv = customerRows.length ? customerRows.reduce((sum, item) => sum + item.total, 0) / customerRows.length : 0;

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px' }}>
      <SectionHeader title="CRM" subtitle="Customer profiles, segments and booking history" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Customers" value={String(customerRows.length)} helper="Client accounts with CRM data or bookings" icon="👥" />
        <StatCard label="Segmented" value={String(vipCount)} helper="Profiles assigned to a segment" icon="🏷️" />
        <StatCard label="Average LTV" value={formatMoney(averageLtv)} helper="Derived from bookings" icon="💎" />
      </div>
      {customerRows.length === 0 ? (
        <EmptyState label="No customer records available." />
      ) : (
        <Panel style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 0.8fr 0.8fr 0.8fr 0.9fr 1fr', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${A.g200}`, background: A.g100 }}>
            {['Customer', 'Email / Phone', 'Segment', 'Bookings', 'LTV', 'Notes', 'Last Booking'].map((label) => (
              <div key={label} style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: A.g500 }}>
                {label}
              </div>
            ))}
          </div>
          {customerRows.map((item) => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 0.8fr 0.8fr 0.8fr 0.9fr 1fr', gap: 12, padding: '14px 20px', borderBottom: `1px solid ${A.g200}`, alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: A.black }}>{item.name}</div>
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.g700 }}>
                <div>{item.email}</div>
                <div style={{ color: A.g500, fontSize: 12 }}>{item.phone}</div>
              </div>
              <div><Badge color={item.segment === 'Unassigned' ? 'default' : 'gold'}>{item.segment}</Badge></div>
              <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: A.black }}>{item.bookings}</div>
              <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: A.black }}>{formatMoney(item.total)}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.g700 }}>{item.notes} / {item.interactions}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.g500 }}>{formatDateTime(item.last)}</div>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

function CalendarView({ bookings, scooters }) {
  const [weekStart, setWeekStart] = React.useState(startOfWeek(new Date()));
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const activeBookings = bookings
    .filter((item) => !['cancelled'].includes(item.status))
    .map((item) => ({
      ...item,
      startDate: new Date(item.start_datetime),
      endDate: new Date(item.end_datetime),
    }));

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px' }}>
      <SectionHeader
        title="Occupancy Calendar"
        subtitle={`${formatShortDate(weekStart)} – ${formatShortDate(addDays(weekStart, 6))}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" onClick={() => setWeekStart((current) => addDays(current, -7))}>‹ Prev</Button>
            <Button variant="dark" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</Button>
            <Button variant="outline" onClick={() => setWeekStart((current) => addDays(current, 7))}>Next ›</Button>
          </div>
        }
      />
      {scooters.length === 0 ? (
        <EmptyState label="No fleet records available." />
      ) : (
        <Panel style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '240px repeat(7, 1fr)', borderBottom: `1px solid ${A.g200}` }}>
            <div style={{ padding: '14px 16px', fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.g500 }}>
              Vehicle
            </div>
            {days.map((day) => (
              <div key={day.toISOString()} style={{ padding: '14px 12px', borderLeft: `1px solid ${A.g200}`, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Inter', fontSize: 11, color: A.g500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day)}
                </div>
                <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 20, color: A.black, marginTop: 2 }}>{day.getDate()}</div>
              </div>
            ))}
          </div>
          {scooters.map((scooter) => (
            <div key={scooter.id} style={{ display: 'grid', gridTemplateColumns: '240px repeat(7, 1fr)', borderBottom: `1px solid ${A.g200}`, minHeight: 74 }}>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: A.black }}>{scooter.title}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>{scooter.type} · {scooter.engine_capacity}cc</div>
              </div>
              {days.map((day) => {
                const dayStart = new Date(day);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);
                const matches = activeBookings.filter((item) => item.scooter?.id === scooter.id && item.startDate <= dayEnd && item.endDate >= dayStart);
                return (
                  <div key={`${scooter.id}-${day.toISOString()}`} style={{ borderLeft: `1px solid ${A.g200}`, padding: 6 }}>
                    {matches.length === 0 ? (
                      <div style={{ height: '100%', borderRadius: 10, background: A.g100 }} />
                    ) : matches.map((item) => (
                      <div key={item.id} style={{ background: item.status === 'completed' ? A.blueBg : item.status === 'active' ? A.greenBg : A.orangeBg, borderLeft: `3px solid ${item.status === 'completed' ? A.blue : item.status === 'active' ? A.green : A.orange}`, borderRadius: '0 8px 8px 0', padding: '8px 10px', marginBottom: 4 }}>
                        <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 11, color: A.black }}>#{item.order_number}</div>
                        <div style={{ fontFamily: 'Inter', fontSize: 11, color: A.g700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.user}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

function AnalyticsView({ revenue, funnel, bookings }) {
  const vehicleTotals = new Map();
  const zoneTotals = new Map();

  for (const booking of bookings) {
    const vehicleName = booking.scooter?.title || 'Unknown scooter';
    vehicleTotals.set(vehicleName, (vehicleTotals.get(vehicleName) || 0) + Number(booking.total_price || 0));

    const zoneLabel = (booking.delivery_address || 'Unknown zone').split(',')[0].trim() || 'Unknown zone';
    zoneTotals.set(zoneLabel, (zoneTotals.get(zoneLabel) || 0) + 1);
  }

  const topVehicles = Array.from(vehicleTotals.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 6);

  const topZones = Array.from(zoneTotals.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);

  const maxVehicle = Math.max(...topVehicles.map((item) => item.amount), 1);
  const maxZone = Math.max(...topZones.map((item) => item.count), 1);

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px' }}>
      <SectionHeader title="Analytics" subtitle={revenue.period || 'Live backend analytics'} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Gross Revenue" value={formatMoney(revenue.revenue)} helper={`${revenue.bookings_count} paid bookings`} icon="💰" />
        <StatCard label="Visitors" value={String(funnel.visitors || 0)} helper="Analytics events" icon="👀" />
        <StatCard label="Checkout Starts" value={String(funnel.checkout_started || 0)} helper={`${funnel.checkout_conversion_rate || 0}% from visitors`} icon="🧾" />
        <StatCard label="Conversion" value={`${funnel.conversion_rate || 0}%`} helper={`${funnel.bookings_created || 0} bookings created`} icon="📈" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Panel style={{ padding: 24 }}>
          <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 4 }}>Vehicle Performance</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500, marginBottom: 20 }}>Revenue contribution by scooter</div>
          {topVehicles.length === 0 ? (
            <div style={{ fontFamily: 'Inter', fontSize: 14, color: A.g500 }}>No booking revenue data yet.</div>
          ) : topVehicles.map((item) => (
            <div key={item.name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontFamily: 'Inter', fontSize: 13, color: A.black }}>{item.name}</span>
                <span style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 13, color: A.black }}>{formatMoney(item.amount)}</span>
              </div>
              <div style={{ height: 6, background: A.g100, borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${(item.amount / maxVehicle) * 100}%`, background: A.gold, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </Panel>
        <div style={{ display: 'grid', gap: 16 }}>
          <Panel style={{ padding: 24 }}>
            <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 4 }}>Funnel</div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500, marginBottom: 16 }}>Backend analytics event steps</div>
            {(funnel.funnel || []).map((item) => (
              <div key={item.step} style={{ padding: '10px 0', borderBottom: `1px solid ${A.g200}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontFamily: 'Inter', fontSize: 13, color: A.black }}>{item.label}</span>
                  <span style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 13, color: A.black }}>{item.count}</span>
                </div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500, marginTop: 4 }}>Dropoff: {item.dropoff_percent}%</div>
              </div>
            ))}
          </Panel>
          <Panel style={{ padding: 24 }}>
            <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 4 }}>Delivery Zones</div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500, marginBottom: 16 }}>Based on booking delivery addresses</div>
            {topZones.length === 0 ? (
              <div style={{ fontFamily: 'Inter', fontSize: 14, color: A.g500 }}>No delivery data yet.</div>
            ) : topZones.map((item) => (
              <div key={item.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.black, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ height: 6, background: A.g100, borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${(item.count / maxZone) * 100}%`, background: A.black, borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 13, color: A.black }}>{item.count}</div>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SupportView({ threads, messages, quickReplies, activeThreadId, currentAdminId, currentAdminEmail, onSelectThread, onSendReply, onUpdateThreadStatus, sendingReply }) {
  const activeThread = threads.find((item) => item.id === activeThreadId) || threads[0] || null;
  const [draft, setDraft] = React.useState('');
  const threadAvatar = initials(activeThread?.title || 'Support');

  React.useEffect(() => {
    setDraft('');
  }, [activeThreadId]);

  function submitReply() {
    if (!activeThread || !draft.trim()) {
      return;
    }
    onSendReply(activeThread.id, draft.trim());
    setDraft('');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%' }}>
      <div style={{ borderRight: `1px solid ${A.g200}`, background: A.white, overflowY: 'auto' }}>
        <div style={{ padding: '20px 16px', borderBottom: `1px solid ${A.g200}` }}>
          <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 6 }}>Support Threads</div>
          <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>{threads.length} live conversations</div>
        </div>
        {threads.length === 0 ? (
          <div style={{ padding: 18, fontFamily: 'Inter', fontSize: 14, color: A.g500 }}>No support threads available.</div>
        ) : threads.map((thread) => {
          const participants = thread.participants || [];
          const client = participants.find((item) => item.role === 'client')?.user || participants[0]?.user;
          const lastMessage = thread.last_message;
          return (
            <div
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${A.g200}`,
                cursor: 'pointer',
                background: activeThread?.id === thread.id ? 'rgba(255,215,0,0.08)' : A.white,
                borderLeft: activeThread?.id === thread.id ? `3px solid ${A.gold}` : '3px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: A.black }}>{client?.full_name || client?.email || thread.title}</span>
                <Badge color={thread.status === 'closed' ? 'default' : 'green'}>{thread.status}</Badge>
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500, marginBottom: 4 }}>{thread.title || 'Untitled thread'}</div>
              <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lastMessage?.text || 'No messages yet'}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', background: A.g100 }}>
        {!activeThread ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', fontSize: 14, color: A.g500 }}>
            Pick a conversation to start.
          </div>
        ) : (
          <>
            <div style={{ padding: '16px 24px', background: A.white, borderBottom: `1px solid ${A.g200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: A.black }}>{activeThread.title || 'Support Thread'}</div>
                <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>{(activeThread.participants || []).map((item) => item.user?.email).filter(Boolean).join(', ')}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" onClick={() => onUpdateThreadStatus(activeThread.id, 'open')}>Reopen</Button>
                <Button variant="dark" onClick={() => onUpdateThreadStatus(activeThread.id, 'closed')}>Close Thread</Button>
              </div>
            </div>
            <div style={{ flex: 1, padding: '16px 24px 18px' }}>
              <div style={{ height: '100%', borderRadius: 30, background: '#F7F7F8', padding: '14px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 ? (
                <div style={{ fontFamily: 'Inter', fontSize: 14, color: A.g500 }}>No messages in this thread.</div>
              ) : messages.map((message) => {
                const sender = message.sender || {};
                const own =
                  (currentAdminEmail && sender.email && String(sender.email).toLowerCase() === String(currentAdminEmail).toLowerCase()) ||
                  (currentAdminId != null && sender.id != null && String(sender.id) === String(currentAdminId));
                return (
                  <div key={message.id} style={{ display: 'flex', justifyContent: own ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                    {!own ? (
                      <div style={{ width: 28, height: 28, borderRadius: 14, padding: 1.5, background: 'linear-gradient(135deg, #FEDA75 0%, #FA7E1E 30%, #D62976 60%, #962FBF 80%, #4F5BD5 100%)' }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: 12.5, background: A.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', fontWeight: 700, fontSize: 9, color: A.black }}>
                          {threadAvatar || 'SP'}
                        </div>
                      </div>
                    ) : null}
                    <div style={{ maxWidth: '78%', borderRadius: 24, borderBottomRightRadius: own ? 8 : 24, borderBottomLeftRadius: own ? 24 : 8, background: own ? '#3797F0' : A.white, border: own ? 'none' : `1px solid ${A.g200}`, padding: '11px 14px' }}>
                      <div style={{ fontFamily: 'Inter', fontSize: 14, lineHeight: 1.45, color: own ? A.white : A.black }}>{message.text}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                        <div style={{ fontFamily: 'Inter', fontSize: 11, color: own ? 'rgba(255,255,255,0.72)' : '#8E8E93' }}>{formatDateTime(message.created_at)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
            <div style={{ padding: '16px 24px', background: A.white, borderTop: `1px solid ${A.g200}` }}>
              {quickReplies.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {quickReplies.slice(0, 4).map((reply) => (
                    <Button key={reply.id} variant="ghost" onClick={() => setDraft(reply.text)}>{reply.title}</Button>
                  ))}
                </div>
              ) : null}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minHeight: 54, borderRadius: 28, background: '#F7F7F8', border: `1px solid ${A.g200}`, padding: '8px 16px' }}>
                  <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type a message..." style={{ minHeight: 38, border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, resize: 'none' }} />
                </div>
                <Button variant="primary" onClick={submitReply} disabled={sendingReply || !draft.trim()} style={{ width: 50, height: 50, borderRadius: 25, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {sendingReply ? 'Sending…' : 'Send'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PromoCodesView({ promocodes, savingId, deletingId, onSave, onDelete }) {
  const [selectedId, setSelectedId] = React.useState(null);
  const [draft, setDraft] = React.useState(emptyPromoCodeDraft);
  const [formError, setFormError] = React.useState('');

  React.useEffect(() => {
    if (selectedId == null) return;
    const found = promocodes.find((p) => p.id === selectedId);
    if (found) {
      setDraft(promoCodeDraftFrom(found));
    } else {
      setSelectedId(null);
      setDraft(emptyPromoCodeDraft());
    }
  }, [promocodes, selectedId]);

  function handleNew() {
    setSelectedId(null);
    setDraft(emptyPromoCodeDraft());
    setFormError('');
  }

  function handleSelect(item) {
    setSelectedId(item.id);
    setDraft(promoCodeDraftFrom(item));
    setFormError('');
  }

  function update(key, value) {
    setDraft((cur) => ({ ...cur, [key]: value }));
  }

  async function handleSubmit() {
    setFormError('');
    if (!draft.code.trim()) { setFormError('Code is required'); return; }
    if (!draft.discount_value) { setFormError('Discount value is required'); return; }

    const payload = {
      code: draft.code.trim().toUpperCase(),
      discount_type: draft.discount_type,
      discount_value: draft.discount_value,
      is_active: draft.is_active,
      usage_limit: Number(draft.usage_limit) || 1,
      min_booking_amount: draft.min_booking_amount || '0.00',
      max_discount_amount: draft.max_discount_amount ? draft.max_discount_amount : null,
      starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
      ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
    };

    const saved = await onSave(payload, draft.id);
    if (saved?.id) {
      setSelectedId(saved.id);
      setDraft(promoCodeDraftFrom(saved));
    }
  }

  async function handleDelete() {
    if (!draft.id) return;
    if (!window.confirm(`Delete promo code "${draft.code}"?`)) return;
    const deletedId = draft.id;
    await onDelete(deletedId);
    if (deletedId === selectedId) {
      setSelectedId(null);
      setDraft(emptyPromoCodeDraft());
    }
  }

  const isSaving = savingId === (draft.id || 'new');
  const isDeleting = deletingId === draft.id;

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px' }}>
      <SectionHeader
        title="Promo Codes"
        subtitle={`${promocodes.length} codes · manage discounts for customers`}
        action={<Button variant="dark" onClick={handleNew}>New code</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 16, alignItems: 'start' }}>
        <div>
          {promocodes.length === 0 ? (
            <EmptyState label="No promo codes yet. Create your first one." />
          ) : (
            <Panel style={{ overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 0.9fr 0.8fr', gap: 12, padding: '12px 20px', background: A.g100, borderBottom: `1px solid ${A.g200}` }}>
                {['Code', 'Discount', 'Usage', 'Valid Until', 'Status'].map((label) => (
                  <div key={label} style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: A.g500 }}>{label}</div>
                ))}
              </div>
              {promocodes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 0.8fr 0.9fr 0.8fr',
                    gap: 12,
                    padding: '14px 20px',
                    borderBottom: `1px solid ${A.g200}`,
                    cursor: 'pointer',
                    background: draft.id === item.id ? 'rgba(255,215,0,0.06)' : A.white,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: A.black, letterSpacing: '0.04em' }}>{item.code}</div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.g700 }}>
                    {item.discount_type === 'PERCENT'
                      ? <><strong style={{ color: A.black }}>{item.discount_value}%</strong> <span style={{ color: A.g500, fontSize: 11 }}>off</span></>
                      : <><strong style={{ color: A.black }}>${item.discount_value}</strong> <span style={{ color: A.g500, fontSize: 11 }}>fixed</span></>}
                  </div>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, color: A.g700 }}>
                    <span style={{ fontWeight: 700 }}>{item.current_usage}</span>
                    <span style={{ color: A.g500 }}> / {item.usage_limit}</span>
                  </div>
                  <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>
                    {item.ends_at ? formatShortDate(item.ends_at) : '∞'}
                  </div>
                  <Badge color={item.is_active ? 'green' : 'default'}>{item.is_active ? 'Active' : 'Off'}</Badge>
                </div>
              ))}
            </Panel>
          )}
        </div>

        <Panel style={{ padding: 22, position: 'sticky', top: 28 }}>
          <SectionHeader
            title={draft.id ? 'Edit Code' : 'New Code'}
            subtitle={draft.id ? `#${draft.id} · ${draft.current_usage} uses` : 'Fill in the fields below'}
          />
          {formError ? (
            <div style={{ marginBottom: 14, background: A.redBg, color: A.red, borderRadius: 10, padding: '10px 14px', fontFamily: 'Inter', fontSize: 13 }}>
              {formError}
            </div>
          ) : null}
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Promo code">
              <Input
                value={draft.code}
                onChange={(e) => update('code', e.target.value.toUpperCase())}
                placeholder="SUMMER20"
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Type">
                <Select value={draft.discount_type} onChange={(e) => update('discount_type', e.target.value)}>
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FIXED">Fixed ($)</option>
                </Select>
              </Field>
              <Field label={draft.discount_type === 'PERCENT' ? 'Discount %' : 'Discount $'}>
                <Input
                  type="number"
                  min="0"
                  step={draft.discount_type === 'PERCENT' ? '1' : '0.01'}
                  max={draft.discount_type === 'PERCENT' ? '100' : undefined}
                  value={draft.discount_value}
                  onChange={(e) => update('discount_value', e.target.value)}
                  placeholder={draft.discount_type === 'PERCENT' ? '20' : '10.00'}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Start date">
                <Input type="datetime-local" value={draft.starts_at} onChange={(e) => update('starts_at', e.target.value)} />
              </Field>
              <Field label="End date">
                <Input type="datetime-local" value={draft.ends_at} onChange={(e) => update('ends_at', e.target.value)} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Usage limit">
                <Input type="number" min="1" value={draft.usage_limit} onChange={(e) => update('usage_limit', e.target.value)} />
              </Field>
              <Field label="Min order, $">
                <Input type="number" min="0" step="0.01" value={draft.min_booking_amount} onChange={(e) => update('min_booking_amount', e.target.value)} />
              </Field>
            </div>

            {draft.discount_type === 'PERCENT' ? (
              <Field label="Max discount, $ (optional)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.max_discount_amount}
                  onChange={(e) => update('max_discount_amount', e.target.value)}
                  placeholder="No limit"
                />
              </Field>
            ) : null}

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter', fontSize: 14, color: A.black, cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.is_active} onChange={(e) => update('is_active', e.target.checked)} />
              <span>Active (visible to users)</span>
            </label>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
              <Button variant="primary" size="md" disabled={isSaving} onClick={handleSubmit}>
                {isSaving ? 'Saving…' : draft.id ? 'Save changes' : 'Create code'}
              </Button>
              <Button variant="outline" size="md" onClick={handleNew}>Reset</Button>
              {draft.id ? (
                <Button variant="danger" size="md" disabled={isDeleting} onClick={handleDelete}>
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </Button>
              ) : null}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function LoginView({ form, setForm, error, loading, onSubmit }) {
  return (
    <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Panel style={{ width: '100%', maxWidth: 520, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, background: A.gold, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora', fontWeight: 900, fontSize: 16, color: A.black }}>S</div>
          <div>
            <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 18, color: A.black }}>Scoot Bali Admin</div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: A.g500 }}>Authenticate with backend JWT</div>
          </div>
        </div>
        <h1 style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 34, letterSpacing: '-0.04em', color: A.black, marginBottom: 10 }}>Admin sign in</h1>
        <p style={{ fontFamily: 'Inter', fontSize: 15, lineHeight: 1.7, color: A.g500, marginBottom: 24 }}>
          This panel now reads live data from backend endpoints. Use an account with admin access.
        </p>
        <div style={{ display: 'grid', gap: 16 }}>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="admin@example.com" />
          </Field>
          <Field label="Password">
            <Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="••••••••" />
          </Field>
        </div>
        <ErrorBanner error={error} />
        <Button variant="primary" size="md" onClick={onSubmit} disabled={loading} style={{ width: '100%', marginTop: 8 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </Panel>
    </div>
  );
}

function AdminApp() {
  const [session, setSession] = React.useState(loadStoredSession);
  const [profile, setProfile] = React.useState(null);
  const [view, setView] = React.useState('overview');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loginForm, setLoginForm] = React.useState({ email: '', password: '' });
  const [busyBookingId, setBusyBookingId] = React.useState(null);
  const [savingScooterId, setSavingScooterId] = React.useState(null);
  const [savingFleetForm, setSavingFleetForm] = React.useState(false);
  const [deletingScooterId, setDeletingScooterId] = React.useState(null);
  const [sendingReply, setSendingReply] = React.useState(false);
  const [savingPromoCodeId, setSavingPromoCodeId] = React.useState(null);
  const [deletingPromoCodeId, setDeletingPromoCodeId] = React.useState(null);
  const [activeThreadId, setActiveThreadId] = React.useState(null);
  const [threadMessages, setThreadMessages] = React.useState([]);
  const [data, setData] = React.useState({
    bookings: [],
    scooters: [],
    scooterModels: [],
    users: [],
    profiles: [],
    revenue: { revenue: 0, bookings_count: 0 },
    funnel: { funnel: [] },
    threads: [],
    quickReplies: [],
    payments: [],
    auditLogs: [],
    loginLogs: [],
    webhookLogs: [],
    promocodes: [],
  });

  async function loadSupportMessages(threadId, accessToken = session?.access) {
    if (!accessToken || !threadId) {
      setThreadMessages([]);
      return;
    }

    try {
      const messages = await fetchAllPages(`/admin/chat/messages/?thread=${threadId}&ordering=created_at&page_size=100`, accessToken);
      setThreadMessages(messages);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load support messages');
    }
  }

  async function loadAdminData(accessToken = session?.access) {
    if (!accessToken) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profileData = await requestJson('/profile/', { token: accessToken });
      const requiredResults = await Promise.all([
        fetchAllPages('/admin/bookings/?ordering=-created_at', accessToken),
        fetchAllPages('/admin/scooters/', accessToken),
        fetchAllPages('/scooter-models/', accessToken),
        fetchAllPages('/admin/users/', accessToken),
      ]);

      const optionalDefs = [
        ['profiles', fetchAllPages('/admin/crm/customer-profiles/?ordering=-updated_at', accessToken), []],
        ['revenue', requestJson('/admin/analytics/revenue/', { token: accessToken }), { revenue: 0, bookings_count: 0 }],
        ['funnel', requestJson('/admin/analytics/funnel/', { token: accessToken }), { funnel: [] }],
        ['threads', fetchAllPages('/admin/chat/threads/?ordering=-updated_at', accessToken), []],
        ['quickReplies', fetchAllPages('/admin/chat/quick-replies/?is_active=true', accessToken), []],
        ['payments', fetchAllPages('/payments/', accessToken), []],
        ['auditLogs', fetchAllPages('/admin/audit/', accessToken), []],
        ['loginLogs', fetchAllPages('/admin/security/logins/', accessToken), []],
        ['webhookLogs', fetchAllPages('/admin/security/webhooks/', accessToken), []],
        ['promocodes', fetchAllPages('/admin/marketing/promocodes/', accessToken), []],
      ];

      const optionalResults = await Promise.allSettled(optionalDefs.map((item) => item[1]));
      const resolved = {};
      const failedSections = [];
      optionalDefs.forEach(([key, _promise, fallback], index) => {
        const result = optionalResults[index];
        if (result.status === 'fulfilled') {
          resolved[key] = result.value;
          return;
        }
        resolved[key] = fallback;
        failedSections.push(key);
      });

      setProfile(profileData);
      setData({
        bookings: requiredResults[0],
        scooters: requiredResults[1],
        scooterModels: requiredResults[2],
        users: requiredResults[3],
        profiles: resolved.profiles,
        revenue: resolved.revenue,
        funnel: resolved.funnel,
        threads: resolved.threads,
        quickReplies: resolved.quickReplies,
        payments: resolved.payments,
        auditLogs: resolved.auditLogs,
        loginLogs: resolved.loginLogs,
        webhookLogs: resolved.webhookLogs,
        promocodes: resolved.promocodes,
      });
      setActiveThreadId((current) => current || resolved.threads?.[0]?.id || null);
      if (failedSections.length > 0) {
        setError(`Some admin sections are temporarily unavailable: ${failedSections.join(', ')}`);
      }
    } catch (loadError) {
      persistSession(null);
      setSession(null);
      setProfile(null);
      setError(loadError.message || 'Unable to load admin data');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    persistSession(session);
  }, [session]);

  React.useEffect(() => {
    if (session?.access) {
      loadAdminData(session.access);
    }
  }, [session?.access]);

  React.useEffect(() => {
    if (!session?.access || view !== 'support') {
      return;
    }
    loadSupportMessages(activeThreadId, session.access);
  }, [activeThreadId, session?.access, view]);

  React.useEffect(() => {
    if (!session?.access || view !== 'support') {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadAdminData(session.access);
      if (activeThreadId) {
        loadSupportMessages(activeThreadId, session.access);
      }
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [activeThreadId, session?.access, view]);

  async function handleSavePromoCode(payload, promoId = null) {
    setSavingPromoCodeId(promoId || 'new');
    setError('');
    try {
      const res = await requestJson(
        promoId ? `/admin/marketing/promocodes/${promoId}/` : '/admin/marketing/promocodes/',
        {
          method: promoId ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
          token: session.access,
        }
      );
      await loadAdminData(session.access);
      return res;
    } catch (saveError) {
      setError(saveError.message || 'Unable to save promo code');
      return null;
    } finally {
      setSavingPromoCodeId(null);
    }
  }

  async function handleDeletePromoCode(promoId) {
    setDeletingPromoCodeId(promoId);
    setError('');
    try {
      await requestJson(`/admin/marketing/promocodes/${promoId}/`, {
        method: 'DELETE',
        token: session.access,
      });
      await loadAdminData(session.access);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete promo code');
    } finally {
      setDeletingPromoCodeId(null);
    }
  }

  async function handleLogin() {
    setLoading(true);
    setError('');
    try {
      const auth = await requestJson('/auth/login/', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      });
      setSession(auth);
      setLoginForm({ email: '', password: '' });
    } catch (loginError) {
      setLoading(false);
      setError(loginError.message || 'Unable to sign in');
    }
  }

  function handleLogout() {
    persistSession(null);
    setSession(null);
    setProfile(null);
    setData({
      bookings: [],
      scooters: [],
      scooterModels: [],
      users: [],
      profiles: [],
      revenue: { revenue: 0, bookings_count: 0 },
      funnel: { funnel: [] },
      threads: [],
      quickReplies: [],
      payments: [],
      auditLogs: [],
      loginLogs: [],
      webhookLogs: [],
      promocodes: [],
    });
    setActiveThreadId(null);
    setThreadMessages([]);
  }

  async function handlePatchScooter(scooterId, payload) {
    setSavingScooterId(scooterId);
    setError('');
    try {
      await requestJson(`/admin/scooters/${scooterId}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
        token: session.access,
      });
      await loadAdminData(session.access);
    } catch (patchError) {
      setError(patchError.message || 'Unable to update scooter');
    } finally {
      setSavingScooterId(null);
    }
  }

  async function handleSaveScooter(payload, scooterId = null) {
    setSavingFleetForm(true);
    setError('');
    try {
      const response = await requestJson(scooterId ? `/admin/scooters/${scooterId}/` : '/admin/scooters/', {
        method: scooterId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
        token: session.access,
      });
      await loadAdminData(session.access);
      return response;
    } catch (saveError) {
      setError(saveError.message || 'Unable to save scooter');
      return null;
    } finally {
      setSavingFleetForm(false);
    }
  }

  async function handleDeleteScooter(scooterId) {
    setDeletingScooterId(scooterId);
    setError('');
    try {
      await requestJson(`/admin/scooters/${scooterId}/`, {
        method: 'DELETE',
        token: session.access,
      });
      await loadAdminData(session.access);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete scooter');
    } finally {
      setDeletingScooterId(null);
    }
  }

  async function handleBookingAction(bookingId, action) {
    setBusyBookingId(bookingId);
    setError('');
    try {
      await requestJson(`/admin/bookings/${bookingId}/${action}/`, {
        method: 'POST',
        body: JSON.stringify({}),
        token: session.access,
      });
      await loadAdminData(session.access);
    } catch (actionError) {
      setError(actionError.message || 'Unable to update booking');
    } finally {
      setBusyBookingId(null);
    }
  }

  async function handleSendReply(threadId, text) {
    setSendingReply(true);
    setError('');
    try {
      try {
        await requestJson('/admin/chat/messages/', {
          method: 'POST',
          body: JSON.stringify({ thread_id: threadId, text }),
          token: session.access,
        });
      } catch (messageError) {
        if (!profile?.id) {
          throw messageError;
        }
        await requestJson('/admin/chat/participants/', {
          method: 'POST',
          body: JSON.stringify({ thread_id: threadId, user_id: profile.id, role: 'staff' }),
          token: session.access,
        });
        await requestJson('/admin/chat/messages/', {
          method: 'POST',
          body: JSON.stringify({ thread_id: threadId, text }),
          token: session.access,
        });
      }
      await loadAdminData(session.access);
      await loadSupportMessages(threadId, session.access);
    } catch (sendError) {
      setError(sendError.message || 'Unable to send message');
    } finally {
      setSendingReply(false);
    }
  }

  async function handleThreadStatus(threadId, status) {
    setError('');
    try {
      await requestJson(`/admin/chat/threads/${threadId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        token: session.access,
      });
      await loadAdminData(session.access);
      await loadSupportMessages(threadId, session.access);
    } catch (threadError) {
      setError(threadError.message || 'Unable to update thread');
    }
  }

  if (!session?.access) {
    return <LoginView form={loginForm} setForm={setLoginForm} error={error} loading={loading} onSubmit={handleLogin} />;
  }

  const viewMap = {
    overview: (
      <OverviewView
        data={data}
        onOpenView={setView}
      />
    ),
    fleet: (
      <FleetView
        scooters={data.scooters}
        scooterModels={data.scooterModels}
        savingScooterId={savingScooterId}
        savingFleetForm={savingFleetForm}
        deletingScooterId={deletingScooterId}
        onPatchScooter={handlePatchScooter}
        onCreateScooter={handleSaveScooter}
        onDeleteScooter={handleDeleteScooter}
      />
    ),
    bookings: (
      <BookingsView
        bookings={data.bookings}
        busyBookingId={busyBookingId}
        onBookingAction={handleBookingAction}
      />
    ),
    crm: <CRMView profiles={data.profiles} users={data.users} bookings={data.bookings} />,
    calendar: <CalendarView bookings={data.bookings} scooters={data.scooters} />,
    analytics: <AnalyticsView revenue={data.revenue} funnel={data.funnel} bookings={data.bookings} />,
    support: (
      <SupportView
        threads={data.threads}
        messages={threadMessages}
        quickReplies={data.quickReplies}
        activeThreadId={activeThreadId}
        currentAdminId={profile?.id ?? null}
        currentAdminEmail={profile?.email ?? ''}
        onSelectThread={setActiveThreadId}
        onSendReply={handleSendReply}
        onUpdateThreadStatus={handleThreadStatus}
        sendingReply={sendingReply}
      />
    ),
    promocodes: (
      <PromoCodesView
        promocodes={data.promocodes}
        savingId={savingPromoCodeId}
        deletingId={deletingPromoCodeId}
        onSave={handleSavePromoCode}
        onDelete={handleDeletePromoCode}
      />
    ),
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', height: '100vh', overflow: 'hidden' }}>
      <div style={{ background: A.sidebar, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: A.gold, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Sora', fontWeight: 900, fontSize: 15, color: A.black }}>S</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, letterSpacing: '-0.03em', color: A.white }}>
                SCOOT <span style={{ color: A.gold }}>BALI</span>
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', marginTop: 1 }}>
                ADMIN PANEL
              </div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 10px' }}>
          {NAV.map((item) => (
            <div
              key={item.id}
              onClick={() => setView(item.id)}
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
              <span style={{ fontSize: 16, filter: view === item.id ? 'none' : 'grayscale(0.5) opacity(0.6)' }}>{item.icon}</span>
              <span style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: view === item.id ? 700 : 400, color: view === item.id ? A.white : 'rgba(255,255,255,0.5)' }}>
                {item.label}
              </span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,215,0,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora', fontWeight: 800, fontSize: 14, color: A.gold }}>
              {initials(profile?.full_name || profile?.email)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: A.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || 'Admin'}
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.email || 'admin@scootbali.com'}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} style={{ width: '100%', color: A.white, borderColor: 'rgba(255,255,255,0.16)' }}>
            Sign out
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: A.bg }}>
        <div style={{ height: 56, background: A.white, borderBottom: `1px solid ${A.g200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: A.black, textTransform: 'capitalize' }}>{view}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button variant="outline" onClick={() => loadAdminData(session.access)} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <a href="../" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="md">↗ View Website</Button>
            </a>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ErrorBanner error={error} />
          {loading && data.bookings.length === 0 && view !== 'support' ? <LoadingState label="Loading admin data…" /> : viewMap[view]}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<AdminApp />);
