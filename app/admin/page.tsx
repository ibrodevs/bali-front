'use client';

import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AdminSidebarCurrencySwitcher, AdminSidebarLanguageSwitcher } from '@/components/AdminRouteShell';
import { ApiError, ApiUser, mediaUrl } from '@/lib/api';
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
  ApiAdminSiteContentEntry,
  ApiAnalyticsFunnel,
  ApiAnalyticsRevenue,
  AdminScooterPayload,
  ApiAddon,
  ApiAddonTranslation,
  ApiAuditLog,
  ApiBooking,
  ApiChatMessage,
  ApiChatThread,
  ApiCustomerProfile,
  ApiAdminUser,
  ApiAdminDeliveryZone,
  ApiPromoCode,
  PromoCodePayload,
  ApiLoginLog,
  ApiNewsArticle,
  ApiPayment,
  ApiQuickReply,
  ApiScooterDetail,
  ApiVehicleModel,
  ApiVehicleType,
  ApiVehicleTypeTranslation,
  ApiWebhookLog,
  endpoints,
  unwrapList,
} from '@/lib/endpoints';
import { useAdminLocale } from '@/lib/i18n/AdminLocaleProvider';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { CURRENCY_SYMBOLS, DEFAULT_CURRENCY_RATES, formatCurrencyAmount, useCurrency } from '@/lib/i18n/CurrencyProvider';
import { SITE_CONTENT_FIELDS, SITE_CONTENT_LANGUAGES, SITE_CONTENT_PAGES, getDefaultSiteContentValue, pageMatchesField } from '@/lib/siteContentSchema';
import { useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_ADDRESS_SETTINGS, DEFAULT_SOCIAL_LINKS, type AddressSettingKey, type AddressSettings, type SocialLinkKey, type SocialLinks } from '@/lib/siteSettings';

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

type AdminView = 'overview' | 'bookings' | 'fleet' | 'calendar' | 'crm' | 'analytics' | 'support' | 'news' | 'addons' | 'categories' | 'locations' | 'site' | 'appContent' | 'currencies' | 'socials' | 'addresses' | 'users' | 'promocodes';
type AdminPermission = AdminView | 'team';

const NAV: { id: AdminView; icon: ReactNode; label: string }[] = [
  { id: 'overview', icon: <OverviewIcon size={18} />, label: 'Overview' },
  { id: 'bookings', icon: <ClipboardIcon size={18} />, label: 'Bookings' },
  { id: 'fleet', icon: <ScooterIcon size={18} />, label: 'Fleet' },
  { id: 'calendar', icon: <ReceiptIcon size={18} />, label: 'Calendar' },
  { id: 'crm', icon: <UsersIcon size={18} />, label: 'CRM' },
  { id: 'analytics', icon: <OverviewIcon size={18} />, label: 'Analytics' },
  { id: 'support', icon: <MessageIcon size={18} />, label: 'Support' },
  { id: 'news', icon: <TagIcon size={18} />, label: 'News' },
  { id: 'addons', icon: <DiamondIcon size={18} />, label: 'Add-ons' },
  { id: 'categories', icon: <TagIcon size={18} />, label: 'Categories' },
  { id: 'locations', icon: <EyeIcon size={18} />, label: 'Locations' },
  { id: 'site', icon: <EyeIcon size={18} />, label: 'Site Content' },
  { id: 'appContent', icon: <EyeIcon size={18} />, label: 'App Content' },
  { id: 'currencies', icon: <DollarIcon size={18} />, label: 'Currencies' },
  { id: 'socials', icon: <MessageIcon size={18} />, label: 'Socials' },
  { id: 'addresses', icon: <ReceiptIcon size={18} />, label: 'Addresses' },
  { id: 'users', icon: <UsersIcon size={18} />, label: 'Users & Team' },
  { id: 'promocodes', icon: <DollarIcon size={18} />, label: 'Promo Codes' },
];

const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  overview: 'Overview',
  bookings: 'Bookings',
  fleet: 'Fleet',
  calendar: 'Calendar',
  crm: 'CRM',
  analytics: 'Analytics',
  support: 'Support',
  news: 'News',
  addons: 'Add-ons',
  categories: 'Categories',
  locations: 'Locations',
  site: 'Site Content',
  appContent: 'App Content',
  currencies: 'Currencies',
  socials: 'Socials',
  addresses: 'Addresses',
  users: 'Users & Team',
  promocodes: 'Promo Codes',
  team: 'Team Access',
};

const ADMIN_PERMISSION_OPTIONS: AdminPermission[] = [
  'overview',
  'bookings',
  'fleet',
  'calendar',
  'crm',
  'analytics',
  'support',
  'news',
  'addons',
  'categories',
  'locations',
  'site',
  'currencies',
  'socials',
  'addresses',
  'promocodes',
  'team',
];

function serializeAdminPermissions(permissions: AdminPermission[]) {
  return Array.from(
    new Set(
      permissions.map((permission) => {
        if (permission === 'appContent') return 'site';
        return permission;
      }),
    ),
  );
}

function defaultAdminPermissionsForRole(role?: string | null): AdminPermission[] {
  const normalizedRole = (role || '').toLowerCase();
  if (normalizedRole === 'admin') {
    return [...ADMIN_PERMISSION_OPTIONS];
  }
  if (normalizedRole === 'manager') {
    return ['overview', 'bookings', 'fleet', 'calendar', 'crm', 'analytics', 'support', 'news', 'addons', 'categories', 'locations', 'site', 'promocodes'];
  }
  if (normalizedRole === 'staff') {
    return ['overview', 'bookings', 'calendar', 'support'];
  }
  return [];
}

function normalizeAdminPermissions(raw: unknown, role?: string | null, isSuperuser?: boolean | null): AdminPermission[] {
  if (isSuperuser) {
    return [...ADMIN_PERMISSION_OPTIONS];
  }

  const fallback = defaultAdminPermissionsForRole(role);
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallback;
  }

  const normalized = raw
    .map((item) => {
      const value = String(item || '').trim().toLowerCase();
      if (value === 'appcontent' || value === 'app_content') return 'site';
      return value;
    })
    .filter((item): item is AdminPermission => ADMIN_PERMISSION_OPTIONS.includes(item as AdminPermission));

  return normalized.length ? Array.from(new Set(normalized)) : fallback;
}

function permissionForView(view: AdminView): AdminPermission {
  if (view === 'appContent') {
    return 'site';
  }
  if (view === 'users') {
    return 'team';
  }
  return view;
}

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
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
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

function Field({ label, children, style, hint }: { label: string; children: ReactNode; style?: CSSProperties; hint?: string }) {
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
      {hint ? (
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: A.g500 }}>{hint}</span>
      ) : null}
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

const CURRENCY_RATES_ENTRY_KEY = 'settings.currencyRates';

function normalizeAdminCurrencyRates(raw: unknown) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_CURRENCY_RATES };
  }

  const next: Record<string, number> = {};
  for (const [code, value] of Object.entries(raw)) {
    const normalizedCode = String(code || '').trim().toUpperCase();
    const numericValue = Number(value);
    if (!normalizedCode || !Number.isFinite(numericValue) || numericValue <= 0) continue;
    next[normalizedCode] = numericValue;
  }

  if (!next.USD) next.USD = 1;
  next.IDR = DEFAULT_CURRENCY_RATES.IDR;
  return Object.keys(next).length ? next : { ...DEFAULT_CURRENCY_RATES };
}

const SOCIAL_LINKS_ENTRY_KEY = 'settings.socialLinks';
const ADDRESS_SETTINGS_ENTRY_KEY = 'settings.addresses';
const SOCIAL_LINK_LABELS: Record<SocialLinkKey, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  telegram: 'Telegram',
  wechat: 'WeChat',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
};
const ADDRESS_SETTING_LABELS: Record<AddressSettingKey, string> = {
  businessName: 'Business name',
  street: 'Street address',
  district: 'District / Area',
  postalCode: 'Postal code',
  country: 'Country / Region',
  license: 'License line',
  copyright: 'Copyright line',
};

function normalizeAdminSocialLinks(raw: unknown): SocialLinks {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_SOCIAL_LINKS };
  }

  const next: SocialLinks = { ...DEFAULT_SOCIAL_LINKS };
  for (const key of Object.keys(DEFAULT_SOCIAL_LINKS) as SocialLinkKey[]) {
    next[key] = typeof (raw as Record<string, unknown>)[key] === 'string'
      ? String((raw as Record<string, unknown>)[key] || '').trim()
      : DEFAULT_SOCIAL_LINKS[key];
  }
  return next;
}

function normalizeAdminAddressSettings(raw: unknown): AddressSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_ADDRESS_SETTINGS };
  }

  const next: AddressSettings = { ...DEFAULT_ADDRESS_SETTINGS };
  for (const key of Object.keys(DEFAULT_ADDRESS_SETTINGS) as AddressSettingKey[]) {
    next[key] = typeof (raw as Record<string, unknown>)[key] === 'string'
      ? String((raw as Record<string, unknown>)[key] || '').trim()
      : DEFAULT_ADDRESS_SETTINGS[key];
  }
  return next;
}

function CurrencySettingsView({ isMobile }: { isMobile: boolean }) {
  const { setRates: syncCurrencyRates } = useCurrency();
  const [entry, setEntry] = useState<ApiAdminSiteContentEntry | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({ ...DEFAULT_CURRENCY_RATES });
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyRate, setNewCurrencyRate] = useState('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const orderedCodes = useMemo(() => {
    const defaults = Object.keys(DEFAULT_CURRENCY_RATES);
    const extras = Object.keys(rates).filter((code) => !defaults.includes(code)).sort((a, b) => a.localeCompare(b));
    return [...defaults, ...extras];
  }, [rates]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    setSaveMessage(null);
    endpoints.adminSiteContent()
      .then((response) => {
        const entries = unwrapList(response);
        const currentEntry = entries.find((item) => item.key === CURRENCY_RATES_ENTRY_KEY && item.language === 'all') || null;
        const normalizedRates = normalizeAdminCurrencyRates(currentEntry?.json_value);
        setEntry(currentEntry);
        setRates(normalizedRates);
        syncCurrencyRates(normalizedRates);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Unable to load currency settings'))
      .finally(() => setLoading(false));
  }, [syncCurrencyRates]);

  useEffect(() => {
    load();
  }, [load]);

  function updateRate(code: string, value: string) {
    const numericValue = Number(value);
    setRates((current) => ({
      ...current,
      [code]: value === '' ? 0 : (Number.isFinite(numericValue) ? numericValue : current[code] || 0),
    }));
    setSaveMessage(null);
  }

  function addCurrency() {
    const normalizedCode = String(newCurrencyCode || '').trim().toUpperCase();
    const numericRate = Number(newCurrencyRate);
    if (!/^[A-Z]{3}$/.test(normalizedCode)) {
      setError('Enter a currency code like AED or GBP.');
      return;
    }
    if (rates[normalizedCode]) {
      setError(`Currency ${normalizedCode} already exists.`);
      return;
    }
    if (!Number.isFinite(numericRate) || numericRate <= 0) {
      setError('Enter a valid rate greater than 0.');
      return;
    }
    setRates((current) => ({ ...current, [normalizedCode]: numericRate }));
    setNewCurrencyCode('');
    setNewCurrencyRate('1');
    setError(null);
    setSaveMessage(null);
  }

  function renameCurrency(code: string, nextCodeRaw: string) {
    const nextCode = String(nextCodeRaw || '').trim().toUpperCase();
    if (!nextCode || nextCode === code) return;
    if (!/^[A-Z]{3}$/.test(nextCode)) {
      setError('Enter a currency code like AED or GBP.');
      return;
    }
    setRates((current) => {
      if (current[nextCode]) return current;
      const next = { ...current };
      next[nextCode] = next[code];
      delete next[code];
      return next;
    });
    setError(null);
    setSaveMessage(null);
  }

  function removeCurrency(code: string) {
    if (code === 'USD') return;
    setRates((current) => {
      const next = { ...current };
      delete next[code];
      return next;
    });
    setSaveMessage(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const normalizedRates = normalizeAdminCurrencyRates(rates);
      const body = {
        key: CURRENCY_RATES_ENTRY_KEY,
        language: 'all',
        value_type: 'json' as const,
        value: '',
        json_value: normalizedRates,
        is_active: true,
      };
      const saved = entry
        ? await endpoints.adminUpdateSiteContent(entry.id, body)
        : await endpoints.adminCreateSiteContent(body);
      const normalizedSavedRates = normalizeAdminCurrencyRates(saved.json_value);
      setEntry(saved);
      setRates(normalizedSavedRates);
      syncCurrencyRates(normalizedSavedRates);
      setSaveMessage('Currency rates saved. Public prices now update immediately across the app.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save currency settings');
    } finally {
      setSaving(false);
    }
  }

  function resetDefaults() {
    setRates({ ...DEFAULT_CURRENCY_RATES });
    setSaveMessage(null);
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? 16 : '28px 32px' }}>
      <SectionHeader
        title="Currencies"
        subtitle="Manage exchange rates for every public price on the website. USD stays the base currency and all other amounts are recalculated from it."
        action={<Button variant="outline" size="md" onClick={load}>Reload</Button>}
      />

      <ErrorBanner error={error} onClose={() => setError(null)} />

      {loading ? (
        <EmptyState label="Loading currency settings…" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.35fr) minmax(320px, 0.8fr)', gap: 16, alignItems: 'start' }}>
          <Panel style={{ padding: isMobile ? 16 : 20 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Exchange Rates
                  </div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, color: A.black, marginBottom: 6 }}>
                    {`${orderedCodes.length} active currencies`}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                    Set how much of each currency equals 1 USD. Example: if 1 USD = 98.5 RUB, enter <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>98.5</span> for RUB.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button variant="outline" onClick={resetDefaults}>Reset to defaults</Button>
                  <Button variant="dark" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save rates'}</Button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '140px minmax(0, 1fr) 160px', gap: 10, alignItems: 'end', border: `1px solid ${A.g200}`, borderRadius: 14, padding: 12, background: A.g100 }}>
                <Field label="New code" style={{ margin: 0 }}>
                  <input
                    value={newCurrencyCode}
                    onChange={(event) => setNewCurrencyCode(event.target.value)}
                    placeholder="AED"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Rate vs USD" style={{ margin: 0 }}>
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={newCurrencyRate}
                    onChange={(event) => setNewCurrencyRate(event.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Button variant="ghost" onClick={addCurrency} style={{ width: '100%' }}>
                  Add currency
                </Button>
              </div>

              {saveMessage ? (
                <div style={{ borderRadius: 12, border: `1px solid ${A.green}`, background: A.greenBg, padding: '12px 14px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.green }}>
                  {saveMessage}
                </div>
              ) : null}

              <div style={{ display: 'grid', gap: 10 }}>
                {orderedCodes.map((code) => (
                  <div
                    key={code}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '120px minmax(0, 1fr) 160px 96px',
                      gap: 10,
                      alignItems: 'center',
                      border: `1px solid ${A.g200}`,
                      borderRadius: 14,
                      padding: 12,
                      background: A.white,
                    }}
                  >
                    <Field label="Code" style={{ margin: 0 }}>
                      <input
                        defaultValue={code}
                        onBlur={(event) => renameCurrency(code, event.target.value)}
                        style={inputStyle}
                        disabled={code === 'USD'}
                      />
                    </Field>
                    <Field label="Rate vs USD" style={{ margin: 0 }} hint={code === 'IDR' ? 'Fixed — IDR is the real price, never recalculated.' : undefined}>
                      <input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={rates[code] ?? 0}
                        onChange={(event) => updateRate(code, event.target.value)}
                        style={inputStyle}
                        disabled={code === 'USD' || code === 'IDR'}
                      />
                    </Field>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>
                      Symbol: <strong style={{ color: A.black }}>{CURRENCY_SYMBOLS[code] || code}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                      <Button variant="danger" onClick={() => removeCurrency(code)} disabled={code === 'USD' || code === 'IDR'} style={{ width: isMobile ? '100%' : undefined }}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel style={{ padding: isMobile ? 16 : 20 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Where it applies
                </div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: A.black, marginBottom: 8 }}>
                  All public price displays
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                  Catalog cards, scooter pages, booking totals, payment summary, profile bookings, prices page, footer currency list, and currency switcher options all use this shared configuration.
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <Badge color="blue">Stored in site content</Badge>
                <Badge color="default">{CURRENCY_RATES_ENTRY_KEY}</Badge>
              </div>

              <div style={{ borderTop: `1px solid ${A.g200}`, paddingTop: 14, display: 'grid', gap: 10 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Current JSON payload
                </div>
                <pre
                  style={{
                    margin: 0,
                    borderRadius: 14,
                    padding: 14,
                    background: A.g100,
                    border: `1px solid ${A.g200}`,
                    overflowX: 'auto',
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: A.black,
                  }}
                >
                  {JSON.stringify(normalizeAdminCurrencyRates(rates), null, 2)}
                </pre>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function SocialSettingsView({ isMobile }: { isMobile: boolean }) {
  const [entry, setEntry] = useState<ApiAdminSiteContentEntry | null>(null);
  const [links, setLinks] = useState<SocialLinks>({ ...DEFAULT_SOCIAL_LINKS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    setSaveMessage(null);
    endpoints.adminSiteContent()
      .then((response) => {
        const entries = unwrapList(response);
        const currentEntry = entries.find((item) => item.key === SOCIAL_LINKS_ENTRY_KEY && item.language === 'all') || null;
        setEntry(currentEntry);
        setLinks(normalizeAdminSocialLinks(currentEntry?.json_value));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Unable to load social links'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateLink(key: SocialLinkKey, value: string) {
    setLinks((current) => ({ ...current, [key]: value }));
    setSaveMessage(null);
  }

  function resetDefaults() {
    setLinks({ ...DEFAULT_SOCIAL_LINKS });
    setSaveMessage(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const body = {
        key: SOCIAL_LINKS_ENTRY_KEY,
        language: 'all',
        value_type: 'json' as const,
        value: '',
        json_value: links,
        is_active: true,
      };
      const saved = entry
        ? await endpoints.adminUpdateSiteContent(entry.id, body)
        : await endpoints.adminCreateSiteContent(body);
      setEntry(saved);
      setLinks(normalizeAdminSocialLinks(saved.json_value));
      setSaveMessage('Social links saved. Header, footer, home page, locations, and prices now use these values.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save social links');
    } finally {
      setSaving(false);
    }
  }

  const socialKeys = Object.keys(DEFAULT_SOCIAL_LINKS) as SocialLinkKey[];

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? 16 : '28px 32px' }}>
      <SectionHeader
        title="Socials"
        subtitle="Manage the social and contact links used on the public website without editing code."
        action={<Button variant="outline" size="md" onClick={load}>Reload</Button>}
      />

      <ErrorBanner error={error} onClose={() => setError(null)} />

      {loading ? (
        <EmptyState label="Loading social links…" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.35fr) minmax(320px, 0.8fr)', gap: 16, alignItems: 'start' }}>
          <Panel style={{ padding: isMobile ? 16 : 20 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Social Links
                  </div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, color: A.black, marginBottom: 6 }}>
                    Website contact links
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                    Use the WhatsApp fields for CTA buttons and add any public social profiles you want shown in the footer.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button variant="outline" onClick={resetDefaults}>Reset defaults</Button>
                  <Button variant="dark" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save links'}</Button>
                </div>
              </div>

              {saveMessage ? (
                <div style={{ borderRadius: 12, border: `1px solid ${A.green}`, background: A.greenBg, padding: '12px 14px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.green }}>
                  {saveMessage}
                </div>
              ) : null}

              <div style={{ display: 'grid', gap: 12 }}>
                {socialKeys.map((key) => (
                  <div key={key} style={{ border: `1px solid ${A.g200}`, borderRadius: 14, padding: 12, background: A.white }}>
                    <Field label={SOCIAL_LINK_LABELS[key]} style={{ margin: 0 }}>
                      <input
                        value={links[key]}
                        onChange={(event) => updateLink(key, event.target.value)}
                        style={inputStyle}
                        placeholder={DEFAULT_SOCIAL_LINKS[key] || 'https://'}
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel style={{ padding: isMobile ? 16 : 20 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Where it applies
                </div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: A.black, marginBottom: 8 }}>
                  Shared public website links
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                  WhatsApp CTA buttons in the header, home page, locations page, prices page, and footer all use this configuration. Extra social profiles appear in the footer when links are filled in.
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <Badge color="blue">Stored in site content</Badge>
                <Badge color="default">{SOCIAL_LINKS_ENTRY_KEY}</Badge>
              </div>

              <div style={{ borderTop: `1px solid ${A.g200}`, paddingTop: 14, display: 'grid', gap: 10 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Current JSON payload
                </div>
                <pre
                  style={{
                    margin: 0,
                    borderRadius: 14,
                    padding: 14,
                    background: A.g100,
                    border: `1px solid ${A.g200}`,
                    overflowX: 'auto',
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: A.black,
                  }}
                >
                  {JSON.stringify(links, null, 2)}
                </pre>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function AddressSettingsView({ isMobile }: { isMobile: boolean }) {
  const [entry, setEntry] = useState<ApiAdminSiteContentEntry | null>(null);
  const [addresses, setAddresses] = useState<AddressSettings>({ ...DEFAULT_ADDRESS_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    setSaveMessage(null);
    endpoints.adminSiteContent()
      .then((response) => {
        const entries = unwrapList(response);
        const currentEntry = entries.find((item) => item.key === ADDRESS_SETTINGS_ENTRY_KEY && item.language === 'all') || null;
        setEntry(currentEntry);
        setAddresses(normalizeAdminAddressSettings(currentEntry?.json_value));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Unable to load address settings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateAddress(key: AddressSettingKey, value: string) {
    setAddresses((current) => ({ ...current, [key]: value }));
    setSaveMessage(null);
  }

  function resetDefaults() {
    setAddresses({ ...DEFAULT_ADDRESS_SETTINGS });
    setSaveMessage(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const body = {
        key: ADDRESS_SETTINGS_ENTRY_KEY,
        language: 'all',
        value_type: 'json' as const,
        value: '',
        json_value: addresses,
        is_active: true,
      };
      const saved = entry
        ? await endpoints.adminUpdateSiteContent(entry.id, body)
        : await endpoints.adminCreateSiteContent(body);
      setEntry(saved);
      setAddresses(normalizeAdminAddressSettings(saved.json_value));
      setSaveMessage('Address settings saved. Footer address line now uses these values across the website.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save address settings');
    } finally {
      setSaving(false);
    }
  }

  const addressKeys = Object.keys(DEFAULT_ADDRESS_SETTINGS) as AddressSettingKey[];

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? 16 : '28px 32px' }}>
      <SectionHeader
        title="Addresses"
        subtitle="Manage the business address and footer address details for the public website."
        action={<Button variant="outline" size="md" onClick={load}>Reload</Button>}
      />

      <ErrorBanner error={error} onClose={() => setError(null)} />

      {loading ? (
        <EmptyState label="Loading address settings…" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.35fr) minmax(320px, 0.8fr)', gap: 16, alignItems: 'start' }}>
          <Panel style={{ padding: isMobile ? 16 : 20 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Address Fields
                  </div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, color: A.black, marginBottom: 6 }}>
                    Public business address
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                    These values build the footer address line and act as the shared address settings for the whole website.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button variant="outline" onClick={resetDefaults}>Reset defaults</Button>
                  <Button variant="dark" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save addresses'}</Button>
                </div>
              </div>

              {saveMessage ? (
                <div style={{ borderRadius: 12, border: `1px solid ${A.green}`, background: A.greenBg, padding: '12px 14px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.green }}>
                  {saveMessage}
                </div>
              ) : null}

              <div style={{ display: 'grid', gap: 12 }}>
                {addressKeys.map((key) => (
                  <div key={key} style={{ border: `1px solid ${A.g200}`, borderRadius: 14, padding: 12, background: A.white }}>
                    <Field label={ADDRESS_SETTING_LABELS[key]} style={{ margin: 0 }}>
                      <input
                        value={addresses[key]}
                        onChange={(event) => updateAddress(key, event.target.value)}
                        style={inputStyle}
                        placeholder={DEFAULT_ADDRESS_SETTINGS[key]}
                      />
                    </Field>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel style={{ padding: isMobile ? 16 : 20 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Where it applies
                </div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: A.black, marginBottom: 8 }}>
                  Shared business address line
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                  The public footer uses these values to build the address line shown across the website.
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <Badge color="blue">Stored in site content</Badge>
                <Badge color="default">{ADDRESS_SETTINGS_ENTRY_KEY}</Badge>
              </div>

              <div style={{ borderTop: `1px solid ${A.g200}`, paddingTop: 14, display: 'grid', gap: 10 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Preview line
                </div>
                <div style={{ borderRadius: 14, padding: 14, background: A.g100, border: `1px solid ${A.g200}`, fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black, lineHeight: 1.6 }}>
                  {[addresses.businessName, addresses.street, addresses.district, addresses.postalCode, addresses.country, addresses.license, addresses.copyright].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

type SiteContentFieldMeta = (typeof SITE_CONTENT_FIELDS)[number];
type AppPreviewTextVariant = 'badge' | 'title' | 'body' | 'button' | 'label' | 'input' | 'tab';

function AppPreviewText({
  fieldKey,
  value,
  selected,
  variant = 'body',
  onSelect,
}: {
  fieldKey: string;
  value: string;
  selected: boolean;
  variant?: AppPreviewTextVariant;
  onSelect: (fieldKey: string) => void;
}) {
  const isOnboardingField = fieldKey.startsWith('app.onboarding');
  const variantStyle: Record<AppPreviewTextVariant, CSSProperties> = {
    badge: { alignSelf: 'center', background: 'transparent', color: isOnboardingField ? 'rgba(255,255,255,0.24)' : A.black, fontSize: 11, fontWeight: 500, padding: 0, textTransform: 'uppercase', letterSpacing: isOnboardingField ? '0.16em' : undefined },
    title: { color: isOnboardingField ? A.white : A.black, fontSize: isOnboardingField ? 38 : 26, lineHeight: isOnboardingField ? 1.05 : 1.05, fontWeight: 900, whiteSpace: 'pre-wrap' },
    body: { color: isOnboardingField ? 'rgba(255,255,255,0.54)' : A.g700, fontSize: isOnboardingField ? 15 : 13, lineHeight: isOnboardingField ? 1.73 : 1.45, whiteSpace: 'pre-wrap' },
    button: { borderRadius: 999, background: isOnboardingField ? A.gold : A.black, color: isOnboardingField ? A.black : A.white, fontSize: 14, fontWeight: 800, padding: isOnboardingField ? '15px 18px' : '12px 14px', textAlign: 'center', width: isOnboardingField ? '100%' : undefined },
    label: { color: A.g500, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' },
    input: { borderRadius: 14, border: `1px solid ${A.g200}`, background: A.white, color: A.g500, fontSize: 13, padding: '12px 14px' },
    tab: { color: A.black, fontSize: 11, fontWeight: 800, textAlign: 'center' },
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(fieldKey)}
      title={fieldKey}
      style={{
        border: selected ? `2px solid ${A.gold}` : '2px solid transparent',
        outline: 'none',
        boxShadow: selected ? '0 0 0 5px rgba(255,215,0,0.18)' : 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        textAlign: variant === 'badge' ? 'center' : 'left',
        background: 'transparent',
        transition: 'border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
        ...variantStyle[variant],
      }}
    >
      {value}
    </button>
  );
}

function AppPreviewMedia({
  fieldKey,
  value,
  selected,
  onSelect,
}: {
  fieldKey: string;
  value: string;
  selected: boolean;
  onSelect: (fieldKey: string) => void;
}) {
  const hasImage = Boolean(value.trim());

  return (
    <button
      type="button"
      onClick={() => onSelect(fieldKey)}
      title={fieldKey}
      style={{
        border: selected ? `2px solid ${A.gold}` : '2px solid transparent',
        outline: 'none',
        boxShadow: selected ? '0 0 0 5px rgba(255,215,0,0.18)' : 'none',
        cursor: 'pointer',
        minHeight: 212,
        height: '100%',
        borderRadius: 0,
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent',
        transition: 'border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease',
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: 16,
          bottom: 18,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            borderRadius: 999,
            background: selected ? A.gold : 'rgba(0,0,0,0.45)',
            color: selected ? A.black : 'rgba(255,255,255,0.78)',
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 800,
            padding: '7px 10px',
          }}
        >
          {selected ? 'Editing image' : hasImage ? 'Change image' : 'Add image'}
        </span>
      </div>
    </button>
  );
}

function AppContentPhonePreview({
  activeOnboardingStep,
  activeLanguage,
  selectedFieldKey,
  getValue,
  getMediaValue,
  onSelectField,
  onSelectOnboardingStep,
}: {
  activeOnboardingStep: 1 | 2 | 3;
  activeLanguage: string;
  selectedFieldKey: string | null;
  getValue: (fieldKey: string) => string;
  getMediaValue: (fieldKey: string) => string;
  onSelectField: (fieldKey: string) => void;
  onSelectOnboardingStep: (step: 1 | 2 | 3) => void;
}) {
  const text = (key: string) => getValue(`app.${key}`);
  const image = (key: string) => getMediaValue(`app.${key}`);
  const textNode = (key: string, variant?: AppPreviewTextVariant) => {
    const fieldKey = `app.${key}`;
    return (
      <AppPreviewText
        fieldKey={fieldKey}
        value={text(key)}
        selected={selectedFieldKey === fieldKey}
        variant={variant}
        onSelect={onSelectField}
      />
    );
  };
  const mediaNode = (key: string) => {
    const fieldKey = `app.${key}`;
    return (
      <AppPreviewMedia
        fieldKey={fieldKey}
        value={image(key)}
        selected={selectedFieldKey === fieldKey}
        onSelect={onSelectField}
      />
    );
  };

  const currentStep = activeOnboardingStep;
  const currentImage = image(`onboarding${currentStep}Image`);
  const hasImage = Boolean(currentImage.trim());
  const gradientMap: Record<1 | 2 | 3, string> = {
    1: 'linear-gradient(180deg, #1A1A1A 0%, #080808 100%)',
    2: 'linear-gradient(180deg, #141824 0%, #080808 100%)',
    3: 'linear-gradient(180deg, #1A1410 0%, #080808 100%)',
  };
  const screenBody = (
    <div style={{ display: 'grid', minHeight: 610 }}>
      <div
        style={{
          minHeight: 305,
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          background: hasImage ? undefined : gradientMap[currentStep],
          overflow: 'hidden',
        }}
      >
        {hasImage ? (
          <div style={{ position: 'absolute', inset: 0, background: `center / cover no-repeat url(${currentImage})` }} />
        ) : null}
        {hasImage ? (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(6,6,8,0.18) 0%, rgba(6,6,8,0.68) 72%, rgba(6,6,8,0.92) 100%)' }} />
        ) : null}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: 'linear-gradient(180deg, rgba(8,8,8,0) 0%, #060608 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
          <div style={{ width: '100%', height: '100%' }}>
            {mediaNode(`onboarding${currentStep}Image`)}
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 3, width: '100%', display: 'grid', placeItems: 'center', paddingInline: 18 }}>
          {textNode('onboardingBadge', 'badge')}
        </div>
      </div>

      <div style={{ background: '#060608', padding: '32px 28px 28px', display: 'grid', alignContent: 'space-between', gap: 24, minHeight: 345 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          {textNode(`onboarding${currentStep}Title`, 'title')}
          {textNode(`onboarding${currentStep}Sub`, 'body')}
        </div>
        <div style={{ display: 'grid', gap: 28 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                style={{
                  flex: index === currentStep ? 1.5 : 1,
                  height: 4,
                  borderRadius: 999,
                  background: index === currentStep ? A.gold : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
          {textNode(`onboarding${currentStep}Cta`, 'button')}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => onSelectOnboardingStep(step as 1 | 2 | 3)}
              style={{
                borderRadius: 999,
                border: `1px solid ${currentStep === step ? A.black : A.g200}`,
                background: currentStep === step ? A.black : A.white,
                color: currentStep === step ? A.white : A.black,
                cursor: 'pointer',
                padding: '8px 12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                fontWeight: currentStep === step ? 800 : 600,
              }}
            >
              {`Slide ${step}`}
            </button>
          ))}
        </div>
        <div style={{ borderRadius: 999, background: A.g100, border: `1px solid ${A.g200}`, padding: '8px 12px', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 800, color: A.g700 }}>
          {activeLanguage.toUpperCase()}
        </div>
      </div>
      <div style={{ maxWidth: 390, margin: '0 auto', width: '100%', borderRadius: 38, background: '#121212', padding: 12, boxShadow: '0 24px 70px rgba(0,0,0,0.18)' }}>
        <div style={{ borderRadius: 30, background: '#060608', minHeight: 650, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.18)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)', width: 86, height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.22)', zIndex: 10 }} />
          {screenBody}
        </div>
      </div>
    </div>
  );
}

function getSiteFieldTail(key: string) {
  const parts = key.split('.');
  return parts[parts.length - 1] || key;
}

function getSiteFieldElementLabel(field: SiteContentFieldMeta) {
  const tail = getSiteFieldTail(field.key);

  if (field.valueType === 'image') return 'Image asset';
  if (field.valueType === 'video') return 'Video asset';
  if (field.valueType === 'file') return 'Downloadable file';
  if (field.valueType === 'json') return 'Structured content block';

  if (/^(title|title\d+|confirmedTitle|loginHero|registerHero)$/i.test(tail)) return 'Main heading';
  if (/^(desc|description|tagline|subtitle|protectedDesc|confirmedDesc)$/i.test(tail)) return 'Supporting text';
  if (/^(eyebrow|label|mapEyebrow|zonesLabel|howLabel|step|stepLabel|from)$/i.test(tail)) return 'Section label';
  if (/^(cta|primary|secondary|reserve|viewAll|readMore|save|cancel|cont|confirm|pay|clear|back|home|changeBike|loginCta|registerCta|stickyBookNow|book|viewFullFleet|whatsappUs)$/i.test(tail)) {
    return 'Button label';
  }
  if (/placeholder/i.test(tail)) return 'Input placeholder';
  if (/^(note|terms|verified|secure|pci|cancel24|free|freeZone|reviewVerified|available|status|location|month)$/i.test(tail)) return 'Helper text';
  if (/^(quote|quoteMeta|meta)$/i.test(tail)) return 'Review content';
  return 'Text content';
}

function getSiteFieldHint(field: SiteContentFieldMeta) {
  const tail = getSiteFieldTail(field.key);
  const prefix = `${field.pageLabel} -> ${field.sectionLabel}`;

  if (field.valueType === 'json') {
    return `${prefix}. This block controls multiple repeated items at once, such as cards, FAQ items, benefits, or steps.`;
  }
  if (/placeholder/i.test(tail)) {
    return `${prefix}. Visitors see this text inside an empty input field before they type.`;
  }
  if (/^(cta|primary|secondary|reserve|viewAll|readMore|save|cancel|cont|confirm|pay|clear|back|home|changeBike|loginCta|registerCta|stickyBookNow|book|viewFullFleet|whatsappUs)$/i.test(tail)) {
    return `${prefix}. Visitors see this as an actionable button or link.`;
  }
  if (/^(title|title\d+|confirmedTitle|loginHero|registerHero)$/i.test(tail)) {
    return `${prefix}. This is a headline, so even short wording changes will be visually noticeable on the page.`;
  }
  if (/^(eyebrow|label|mapEyebrow|zonesLabel|howLabel|step|stepLabel|from)$/i.test(tail)) {
    return `${prefix}. This is a small navigation or section marker that helps users orient themselves on the page.`;
  }
  if (/^(desc|description|tagline|subtitle|protectedDesc|confirmedDesc)$/i.test(tail)) {
    return `${prefix}. This copy explains or supports the main message around the block.`;
  }
  return `${prefix}. This text is shown directly to visitors in the selected section.`;
}

function getTemplateTokens(value: string) {
  return Array.from(new Set((value.match(/\{[^}]+\}/g) || []).map((token) => token.trim())));
}

function parsePreviewJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function collectPreviewStrings(value: unknown, output: string[]) {
  if (typeof value === 'string') {
    output.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectPreviewStrings(item, output);
    return;
  }
  if (isPreviewObject(value)) {
    for (const item of Object.values(value)) collectPreviewStrings(item, output);
  }
}

function isPreviewObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function renderStructuredPreview(data: unknown) {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>
          Empty list
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {data.slice(0, 3).map((item, index) => (
          <div
            key={index}
            style={{
              border: `1px solid ${A.g200}`,
              borderRadius: 10,
              background: A.white,
              padding: '10px 12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              color: A.black,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {typeof item === 'string'
              ? item
              : Array.isArray(item)
                ? item.filter(Boolean).join(' — ')
                : JSON.stringify(item, null, 2)}
          </div>
        ))}
        {data.length > 3 ? (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
            {`+${data.length - 3} more items in this block`}
          </div>
        ) : null}
      </div>
    );
  }

  if (isPreviewObject(data)) {
    const entries = Object.entries(data);
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {entries.slice(0, 5).map(([key, value]) => (
          <div
            key={key}
            style={{
              border: `1px solid ${A.g200}`,
              borderRadius: 10,
              background: A.white,
              padding: '10px 12px',
            }}
          >
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              {key}
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>
      Preview unavailable
    </div>
  );
}

function SiteContentValuePreview({
  field,
  value,
  mediaPreviewUrl,
  compact = false,
}: {
  field: SiteContentFieldMeta;
  value: string;
  mediaPreviewUrl?: string;
  compact?: boolean;
}) {
  const tail = getSiteFieldTail(field.key);
  const previewPadding = compact ? '14px 14px' : '18px 18px';
  const fontBase = compact ? 13 : 14;

  if (field.valueType === 'image') {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {mediaPreviewUrl ? (
          <img
            src={mediaPreviewUrl}
            alt={field.label}
            style={{ width: '100%', maxHeight: compact ? 220 : 280, objectFit: 'cover', borderRadius: 14, border: `1px solid ${A.g200}`, background: A.g100 }}
          />
        ) : (
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: fontBase, color: A.g500 }}>No image selected yet.</div>
        )}
      </div>
    );
  }

  if (field.valueType === 'video') {
    return mediaPreviewUrl ? (
      <video
        controls
        muted
        playsInline
        style={{ width: '100%', maxHeight: compact ? 240 : 300, borderRadius: 14, border: `1px solid ${A.g200}`, background: A.black }}
      >
        <source src={mediaPreviewUrl} />
      </video>
    ) : (
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: fontBase, color: A.g500 }}>No video selected yet.</div>
    );
  }

  if (field.valueType === 'file') {
    return mediaPreviewUrl ? (
      <a href={mediaPreviewUrl} target="_blank" rel="noreferrer" style={{ color: A.blue, fontFamily: 'Inter, sans-serif', fontSize: fontBase, textDecoration: 'none' }}>
        Open current file
      </a>
    ) : (
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: fontBase, color: A.g500 }}>No file selected yet.</div>
    );
  }

  if (field.valueType === 'json') {
    const parsed = parsePreviewJson(value);
    if (parsed === null && value.trim()) {
      return (
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: fontBase, color: A.red }}>
          Invalid JSON. Fix the syntax to preview this block.
        </div>
      );
    }
    return renderStructuredPreview(parsed);
  }

  if (!value.trim()) {
    return (
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: fontBase, color: A.g400 }}>
        Empty value
      </div>
    );
  }

  if (/placeholder/i.test(tail)) {
    return (
      <div
        style={{
          border: `1px solid ${A.g200}`,
          borderRadius: 12,
          background: A.white,
          padding: compact ? '12px 14px' : '14px 16px',
          fontFamily: 'Inter, sans-serif',
          fontSize: fontBase,
          color: A.g400,
        }}
      >
        {value}
      </div>
    );
  }

  if (/^(cta|primary|secondary|reserve|viewAll|readMore|save|cancel|cont|confirm|pay|clear|back|home|changeBike|loginCta|registerCta|stickyBookNow|book|viewFullFleet|whatsappUs)$/i.test(tail)) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: compact ? 40 : 44,
            borderRadius: 999,
            padding: compact ? '0 16px' : '0 18px',
            background: A.black,
            color: A.white,
            fontFamily: 'Inter, sans-serif',
            fontSize: fontBase,
            fontWeight: 700,
          }}
        >
          {value}
        </div>
      </div>
    );
  }

  if (/^(eyebrow|label|mapEyebrow|zonesLabel|howLabel|step|stepLabel|from)$/i.test(tail)) {
    return (
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: compact ? 11 : 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: A.g500,
        }}
      >
        {value}
      </div>
    );
  }

  if (/^(title|title\d+|confirmedTitle|loginHero|registerHero)$/i.test(tail)) {
    return (
      <div
        style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: compact ? 24 : 30,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.02,
          color: A.black,
        }}
      >
        {value}
      </div>
    );
  }

  if (/^(note|terms|verified|secure|pci|cancel24|free|freeZone|reviewVerified|available|status|location|month)$/i.test(tail)) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: compact ? 30 : 34,
          borderRadius: 999,
          padding: '0 12px',
          background: A.g100,
          color: A.g700,
          fontFamily: 'Inter, sans-serif',
          fontSize: compact ? 11 : 12,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {value}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(245,245,245,0.7) 0%, rgba(255,255,255,1) 100%)',
        border: `1px solid ${A.g200}`,
        borderRadius: 14,
        padding: previewPadding,
        fontFamily: 'Inter, sans-serif',
        fontSize: fontBase,
        lineHeight: 1.65,
        color: A.black,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {value}
    </div>
  );
}

const SITE_PREVIEW_ROUTES: Record<string, string> = {
  home: '/',
  catalog: '/catalog',
  how: '/how-it-works',
  detail: '/scooter/pcx160',
  booking: '/booking?scooter_id=1&route_id=pcx160&slug=pcx160&name=Honda%20PCX%20160&price=18',
  payment: '/payment',
  auth: '/login',
  register: '/register',
  news: '/news',
  shared: '/',
  navbar: '/',
};

const SITE_PREVIEW_VARIANTS: Record<string, Array<{ key: string; label: string; route: string }>> = {
  home: [
    { key: 'home-main', label: 'Home', route: '/' },
    { key: 'home-how', label: 'How It Works', route: '/how-it-works' },
    { key: 'home-locations', label: 'Locations', route: '/locations' },
  ],
  auth: [
    { key: 'auth-login', label: 'Login', route: '/login' },
    { key: 'auth-register', label: 'Register', route: '/register' },
  ],
  navbar: [
    { key: 'navbar-home', label: 'Home header', route: '/' },
    { key: 'navbar-catalog', label: 'Catalog header', route: '/catalog' },
    { key: 'navbar-how', label: 'How It Works header', route: '/how-it-works' },
    { key: 'navbar-register', label: 'Register header', route: '/register' },
  ],
};

function setPreviewValue(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.');
  let cursor: Record<string, unknown> = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (typeof cursor[part] !== 'object' || cursor[part] === null || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

function normalizePreviewText(value: string) {
  return value
    .replace(/[\u2190-\u21ff\u2600-\u27bf]/g, ' ')
    .replace(/[`~!@#$%^&*()_=+[{\]}\\|;:'",.<>/?-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getOwnPreviewText(element: HTMLElement) {
  return Array.from(element.childNodes)
    .filter((node): node is Text => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent || '')
    .join(' ');
}

function getPreviewTextCandidates(element: HTMLElement) {
  const rawCandidates = [
    getOwnPreviewText(element),
    element.textContent || '',
    element.innerText || '',
    element.getAttribute('aria-label') || '',
    element.getAttribute('title') || '',
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.placeholder || '' : '',
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value || '' : '',
  ];

  return Array.from(new Set(rawCandidates.map((value) => normalizePreviewText(value)).filter(Boolean)));
}

function isPreviewCandidateElement(element: HTMLElement) {
  const tag = element.tagName.toLowerCase();
  if (['html', 'body', 'script', 'style', 'noscript', 'svg', 'path'].includes(tag)) return false;
  if (element.closest('script, style, noscript, svg')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  if (element.hasAttribute('hidden')) return false;
  return getPreviewTextCandidates(element).length > 0;
}

function scorePreviewTextMatch(candidate: string, variant: string) {
  if (!candidate || !variant) return 0;
  if (candidate === variant) return 1000 + variant.length;

  const candidateTokens = candidate.split(' ').filter(Boolean);
  const variantTokens = variant.split(' ').filter(Boolean);

  if (candidate.startsWith(variant) || candidate.endsWith(variant)) {
    return 860 + variant.length;
  }

  if (candidate.includes(variant)) {
    return variant.length >= 3 ? 700 + variant.length : 0;
  }

  if (variant.includes(candidate)) {
    return candidate.length >= 3 ? 520 + candidate.length : 0;
  }

  if (variantTokens.length === 1 && candidateTokens.includes(variantTokens[0]) && variantTokens[0].length >= 3) {
    return 640 + variantTokens[0].length;
  }

  if (candidateTokens.length === 1 && variantTokens.includes(candidateTokens[0]) && candidateTokens[0].length >= 3) {
    return 500 + candidateTokens[0].length;
  }

  return 0;
}

function useAdminMoneyFormatter() {
  const { currency, convertAmountValue } = useCurrency();
  const { locale } = useAdminLocale();

  return useCallback((value: string | number | undefined | null, sourceCurrency = 'USD') => {
    const amount = Number(value ?? 0);
    const normalizedAmount = Number.isFinite(amount) ? amount : 0;
    const convertedAmount = convertAmountValue(normalizedAmount, sourceCurrency, currency);
    const intlLocale = locale === 'ru' ? 'ru-RU' : locale === 'id' ? 'id-ID' : 'en-US';
    const hasFraction = Math.abs(convertedAmount % 1) > 0.000001;

    return formatCurrencyAmount(convertedAmount, currency, intlLocale, {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? 2 : 0,
    });
  }, [convertAmountValue, currency, locale]);
}

const ADMIN_IDR_RATE = DEFAULT_CURRENCY_RATES.IDR || 15650;

function usdToIdrInput(value?: string | number | null) {
  const amountUsd = Number(value ?? 0);
  const normalizedUsd = Number.isFinite(amountUsd) ? amountUsd : 0;
  return String(Math.round(normalizedUsd * ADMIN_IDR_RATE));
}

function idrToUsdNumber(value?: string | number | null) {
  const amountIdr = Number(value ?? 0);
  const normalizedIdr = Number.isFinite(amountIdr) ? amountIdr : 0;
  // 4 decimal places matches the backend's storage precision (max_digits=12, decimal_places=4).
  return Number((normalizedIdr / ADMIN_IDR_RATE).toFixed(4));
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

function hasAdminPermission(
  user: { role?: string; is_superuser?: boolean; admin_permissions?: string[] } | null | undefined,
  permission: AdminPermission,
) {
  if (!user) return false;
  return normalizeAdminPermissions(user.admin_permissions, user.role, user.is_superuser).includes(permission);
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

function toDateTimeLocalValue(date: Date) {
  const copy = new Date(date);
  copy.setSeconds(0, 0);
  const timezoneOffset = copy.getTimezoneOffset();
  const local = new Date(copy.getTime() - timezoneOffset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function withTime(date: Date, hours: number, minutes: number) {
  const copy = new Date(date);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

function buildManualBlockDayRange(day: Date) {
  return {
    start: withTime(day, 9, 0),
    end: withTime(day, 18, 0),
  };
}

function buildManualBlockFullDayRange(day: Date) {
  return {
    start: withTime(day, 0, 0),
    end: withTime(day, 23, 59),
  };
}

function buildManualBlockDateRange(startDay: Date, endDay: Date) {
  const startSource = startDay <= endDay ? startDay : endDay;
  const endSource = startDay <= endDay ? endDay : startDay;
  return {
    start: withTime(startSource, 0, 0),
    end: withTime(endSource, 23, 59),
  };
}

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function buildManualBlockComment(guestName: string, guestPhone: string, note: string) {
  const parts = [
    guestName.trim() ? `Guest: ${guestName.trim()}` : '',
    guestPhone.trim() ? `Phone: ${guestPhone.trim()}` : '',
    note.trim() ? `Note: ${note.trim()}` : '',
  ].filter(Boolean);
  return parts.join(' | ');
}

function parseManualBlockComment(comment?: string | null) {
  const result = { guest_name: '', guest_phone: '', note: comment || '' };
  if (!comment) return result;

  const parts = comment.split('|').map((item) => item.trim());
  const noteParts: string[] = [];
  for (const part of parts) {
    if (part.startsWith('Guest: ')) {
      result.guest_name = part.slice(7).trim();
      continue;
    }
    if (part.startsWith('Phone: ')) {
      result.guest_phone = part.slice(7).trim();
      continue;
    }
    if (part.startsWith('Note: ')) {
      result.note = part.slice(6).trim();
      continue;
    }
    noteParts.push(part);
  }

  if (noteParts.length > 0 && !result.note) {
    result.note = noteParts.join(' | ');
  }
  return result;
}

function formatTimeOnly(value?: string | Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

const MANUAL_BLOCK_REASON_PRESETS = [
  'Maintenance',
  'External booking',
  'Owner use',
  'Delivery hold',
] as const;

const inputBaseStyle: CSSProperties = {
  width: '100%',
  minHeight: 42,
  padding: '9px 12px',
  border: `1px solid ${A.g200}`,
  borderRadius: 8,
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  color: A.black,
  outline: 'none',
  background: A.white,
  boxSizing: 'border-box',
};

function InlineStatus({ message, tone }: { message: string; tone: 'success' | 'error' }) {
  const palette = tone === 'success'
    ? { background: A.greenBg, border: 'rgba(22,163,74,0.18)', color: A.green }
    : { background: A.redBg, border: 'rgba(220,38,38,0.14)', color: A.red };

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        border: `1px solid ${palette.border}`,
        background: palette.background,
        color: palette.color,
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
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
  promocodes: ApiPromoCode[];
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
  promocodes: [],
};

const LANGUAGES = ['en', 'ru', 'zh', 'id', 'de', 'fr'];
const LANG_LABELS: Record<string, string> = { en: 'English', ru: 'Русский', zh: '中文', id: 'Indonesia', de: 'Deutsch', fr: 'Français' };

type ZoneDraft ={ name: string; is_free: boolean; base_price_usd: string; is_active: boolean; translations: { language: string; name: string }[] };

function LocationsView({ isMobile }: { isMobile: boolean }) {
  const [zones, setZones] = useState<ApiAdminDeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [expandedZone, setExpandedZone] = useState<number | null>('new' as unknown as null);
  const [zoneLang, setZoneLang] = useState<Record<number | string, string>>({});
  const [zoneDrafts, setZoneDrafts] = useState<Record<number | string, ZoneDraft>>({});
  const [showNewZone, setShowNewZone] = useState(false);
  const [deletingZoneId, setDeletingZoneId] = useState<number | null>(null);

  const inputStyle: CSSProperties = { width: '100%', padding: '9px 12px', border: `1px solid ${A.g200}`, borderRadius: 8, fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black, outline: 'none', background: A.white, boxSizing: 'border-box' };
  const labelStyle: CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 };

  const load = () => {
    setLoading(true);
    endpoints.adminDeliveryZones()
      .then((z) => setZones(unwrapList(z)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const emptyZoneDraft = (): ZoneDraft => ({
    name: '', is_free: true, base_price_usd: '0', is_active: true,
    translations: LANGUAGES.map((l) => ({ language: l, name: '' })),
  });

  const openZone = (zone: ApiAdminDeliveryZone) => {
    if (expandedZone === zone.id) { setExpandedZone(null); return; }
    setExpandedZone(zone.id);
    if (!zoneLang[zone.id]) setZoneLang((p) => ({ ...p, [zone.id]: 'en' }));
    setZoneDrafts((p) => ({
      ...p,
      [zone.id]: {
        name: zone.name,
        is_free: zone.is_free,
        base_price_usd: '0',
        is_active: zone.is_active,
        translations: LANGUAGES.map((l) => {
          const found = zone.translations.find((t) => t.language === l);
          return { language: l, name: found?.name || '' };
        }),
      },
    }));
  };

  const setZF = (zoneId: number | string, field: keyof Omit<ZoneDraft, 'translations'>, value: string | boolean) =>
    setZoneDrafts((p) => ({ ...p, [zoneId]: { ...p[zoneId], [field]: value } }));

  const setZoneTrans = (zoneId: number | string, lang: string, name: string) =>
    setZoneDrafts((p) => ({
      ...p,
      [zoneId]: { ...p[zoneId], translations: p[zoneId].translations.map((t) => t.language === lang ? { ...t, name } : t) },
    }));

  const saveZone = async (zoneId: number) => {
    const draft = zoneDrafts[zoneId];
    if (!draft) return;
    setSaving((p) => ({ ...p, [`z${zoneId}`]: true }));
    try {
      await endpoints.adminUpdateDeliveryZone(zoneId, {
        name: draft.name, is_free: draft.is_free, is_active: draft.is_active,
        translations: draft.translations.filter((t) => t.name.trim()),
      });
      setExpandedZone(null);
      load();
    } catch { } finally { setSaving((p) => ({ ...p, [`z${zoneId}`]: false })); }
  };

  const deleteZone = async (zoneId: number) => {
    if (!confirm('Delete this zone? This cannot be undone.')) return;
    setDeletingZoneId(zoneId);
    try { await endpoints.adminDeleteDeliveryZone(zoneId); load(); }
    catch { } finally { setDeletingZoneId(null); }
  };

  const createZone = async () => {
    const draft = zoneDrafts['new'];
    if (!draft || !draft.name.trim()) return;
    setSaving((p) => ({ ...p, new: true }));
    try {
      await endpoints.adminCreateDeliveryZone({
        name: draft.name, is_free: draft.is_free,
        is_active: draft.is_active,
        translations: draft.translations.filter((t) => t.name.trim()),
      });
      setShowNewZone(false);
      setZoneDrafts((p) => { const n = { ...p }; delete n['new']; return n; });
      load();
    } catch { } finally { setSaving((p) => ({ ...p, new: false })); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: A.g500, fontFamily: 'Inter, sans-serif' }}>Loading…</div>;

  return (
    <div>
      <SectionHeader title="Locations" subtitle="Manage delivery zones and translations" />

      {/* ── ZONES ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, margin: 0 }}>
              Add, edit, or delete delivery zones. Zone names can be translated per language.
            </p>
            <Button variant="dark" onClick={() => { setShowNewZone(true); if (!zoneDrafts['new']) setZoneDrafts((p) => ({ ...p, new: emptyZoneDraft() })); setZoneLang((p) => ({ ...p, new: 'en' })); }}>
              + Add Zone
            </Button>
          </div>

          {/* New zone form */}
          {showNewZone && zoneDrafts['new'] && (() => {
            const draft = zoneDrafts['new'];
            const activeLang = zoneLang['new'] || 'en';
            return (
              <Panel style={{ border: `2px solid ${A.gold}` }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${A.g200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: A.black }}>New Zone</span>
                  <button onClick={() => { setShowNewZone(false); setZoneDrafts((p) => { const n = { ...p }; delete n['new']; return n; }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: A.g400, lineHeight: 1 }}>×</button>
                </div>
                <div style={{ padding: '16px 20px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div><label style={labelStyle}>Zone name (default)</label><input style={inputStyle} value={draft.name} onChange={(e) => setZF('new', 'name', e.target.value)} placeholder="e.g. Canggu" /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <label style={{ ...labelStyle, marginBottom: 10 }}>Free delivery</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                        <input type="checkbox" checked={draft.is_free} onChange={(e) => setZF('new', 'is_free', e.target.checked)} style={{ width: 16, height: 16 }} />
                        Free delivery
                      </label>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <label style={{ ...labelStyle, marginBottom: 10 }}>Active</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                        <input type="checkbox" checked={draft.is_active} onChange={(e) => setZF('new', 'is_active', e.target.checked)} style={{ width: 16, height: 16 }} />
                        Show on site
                      </label>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Translations (optional)</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    {LANGUAGES.map((l) => {
                      const t = draft.translations.find((x) => x.language === l);
                      return (
                        <button key={l} onClick={() => setZoneLang((p) => ({ ...p, new: l }))} style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${activeLang === l ? A.black : A.g300}`, background: activeLang === l ? A.black : A.white, color: activeLang === l ? A.white : A.g700, fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {l.toUpperCase()} {t?.name.trim() && <span style={{ color: activeLang === l ? A.gold : A.green, fontSize: 10 }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>{`Name in ${LANG_LABELS[activeLang]}`}</label>
                    <input style={{ ...inputStyle, maxWidth: 280 }} value={draft.translations.find((t) => t.language === activeLang)?.name || ''} onChange={(e) => setZoneTrans('new', activeLang, e.target.value)} placeholder={draft.name || 'Zone name'} />
                  </div>
                  <Button variant="dark" onClick={createZone} disabled={saving['new'] || !draft.name.trim()}>{saving['new'] ? 'Creating…' : 'Create Zone'}</Button>
                </div>
              </Panel>
            );
          })()}

          {/* Existing zones */}
          {zones.length === 0 && !showNewZone && (
            <div style={{ padding: 32, textAlign: 'center', color: A.g400, fontFamily: 'Inter, sans-serif', fontSize: 14 }}>No zones yet. Click "+ Add Zone" to create the first one.</div>
          )}
          {zones.map((zone) => {
            const open = expandedZone === zone.id;
            const draft = zoneDrafts[zone.id];
            const activeLang = zoneLang[zone.id] || 'en';
            return (
              <Panel key={zone.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
                  <div onClick={() => openZone(zone)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: A.black }}>{zone.name}</span>
                    {zone.is_free ? <Badge color="green">Free</Badge> : <Badge color="orange">Paid</Badge>}
                    {!zone.is_active && <Badge color="default">Inactive</Badge>}
                    {zone.translations.length > 0 && <Badge color="blue">{`${zone.translations.length} langs`}</Badge>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button variant="ghost" onClick={() => openZone(zone)}>{open ? 'Close' : 'Edit'}</Button>
                    <Button variant="danger" onClick={() => deleteZone(zone.id)} disabled={deletingZoneId === zone.id}>{deletingZoneId === zone.id ? '…' : 'Delete'}</Button>
                  </div>
                </div>
                {open && draft && (
                  <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${A.g200}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12, marginTop: 16, marginBottom: 16 }}>
                      <div><label style={labelStyle}>Zone name</label><input style={inputStyle} value={draft.name} onChange={(e) => setZF(zone.id, 'name', e.target.value)} /></div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <label style={{ ...labelStyle, marginBottom: 10 }}>Free delivery</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                          <input type="checkbox" checked={draft.is_free} onChange={(e) => setZF(zone.id, 'is_free', e.target.checked)} style={{ width: 16, height: 16 }} />
                          Free delivery
                        </label>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <label style={{ ...labelStyle, marginBottom: 10 }}>Active</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                          <input type="checkbox" checked={draft.is_active} onChange={(e) => setZF(zone.id, 'is_active', e.target.checked)} style={{ width: 16, height: 16 }} />
                          Show on site
                        </label>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Name Translations</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      {LANGUAGES.map((l) => {
                        const t = draft.translations.find((x) => x.language === l);
                        return (
                          <button key={l} onClick={() => setZoneLang((p) => ({ ...p, [zone.id]: l }))} style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${activeLang === l ? A.black : A.g300}`, background: activeLang === l ? A.black : A.white, color: activeLang === l ? A.white : A.g700, fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {l.toUpperCase()} {t?.name.trim() && <span style={{ color: activeLang === l ? A.gold : A.green, fontSize: 10 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={labelStyle}>{`Name in ${LANG_LABELS[activeLang]}`}</label>
                      <input style={{ ...inputStyle, maxWidth: 280 }} value={draft.translations.find((t) => t.language === activeLang)?.name || ''} onChange={(e) => setZoneTrans(zone.id, activeLang, e.target.value)} placeholder={zone.name} />
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: A.g400, margin: '6px 0 0' }}>Leave empty to use the default "{zone.name}"</p>
                    </div>
                    <Button variant="dark" onClick={() => saveZone(zone.id)} disabled={saving[`z${zone.id}`]}>{saving[`z${zone.id}`] ? 'Saving…' : 'Save changes'}</Button>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
    </div>
  );
}

type AddonDraft = {
  name: string;
  description: string;
  price_usd: string;
  price_type: string;
  is_active: boolean;
  sort_order: number;
  translations: { language: string; name: string; description: string }[];
};

type CategoryDraft = {
  code: string;
  name: string;
  translations: { language: string; name: string }[];
};

function AddonsView({ isMobile }: { isMobile: boolean }) {
  const formatMoney = useAdminMoneyFormatter();
  const [addons, setAddons] = useState<ApiAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<Record<number, string>>({});
  const [drafts, setDrafts] = useState<Record<number, AddonDraft>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAddon, setNewAddon] = useState<AddonDraft>({
    name: '', description: '', price_usd: '0', price_type: 'per_day',
    is_active: true, sort_order: 0,
    translations: LANGUAGES.map((lang) => ({ language: lang, name: '', description: '' })),
  });

  const load = () => {
    setLoading(true);
    endpoints.adminAddons({ page_size: 100 })
      .then((res) => setAddons(unwrapList(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAddon = (addon: ApiAddon) => {
    if (expandedId === addon.id) { setExpandedId(null); return; }
    setExpandedId(addon.id);
    if (!activeLang[addon.id]) setActiveLang((p) => ({ ...p, [addon.id]: 'en' }));
    if (!drafts[addon.id]) {
      const existingTrans = addon.translations || [];
      setDrafts((p) => ({
        ...p,
        [addon.id]: {
          name: addon.name,
          description: addon.description || '',
          price_usd: usdToIdrInput(addon.price_usd || addon.priceUSD || 0),
          price_type: addon.price_type || addon.priceType || 'per_day',
          is_active: addon.is_active !== false,
          sort_order: addon.sort_order || 0,
          translations: LANGUAGES.map((lang) => {
            const found = existingTrans.find((t) => t.language === lang);
            return { language: lang, name: found?.name || '', description: found?.description || '' };
          }),
        },
      }));
    }
  };

  const setDraftField = (id: number, field: keyof Omit<AddonDraft, 'translations'>, value: string | boolean | number) => {
    setDrafts((p) => ({ ...p, [id]: { ...p[id], [field]: value } }));
  };

  const setTransField = (id: number, lang: string, field: 'name' | 'description', value: string) => {
    setDrafts((p) => ({
      ...p,
      [id]: {
        ...p[id],
        translations: p[id].translations.map((t) => t.language === lang ? { ...t, [field]: value } : t),
      },
    }));
  };

  const handleSave = async (addon: ApiAddon) => {
    const draft = drafts[addon.id];
    if (!draft) return;
    setSaving((p) => ({ ...p, [addon.id]: true }));
    try {
      await endpoints.adminUpdateAddon(addon.id, {
        name: draft.name,
        description: draft.description,
        price_usd: idrToUsdNumber(draft.price_usd),
        price_type: draft.price_type,
        is_active: draft.is_active,
        sort_order: draft.sort_order,
      });
      const transToSave = draft.translations.filter((t) => t.name.trim() || t.description.trim());
      if (transToSave.length > 0) {
        await endpoints.adminSaveAddonTranslations(addon.id, transToSave);
      }
      load();
      setExpandedId(null);
      setDrafts((p) => { const n = { ...p }; delete n[addon.id]; return n; });
    } catch {
    } finally {
      setSaving((p) => ({ ...p, [addon.id]: false }));
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const created = await endpoints.adminCreateAddon({
        name: newAddon.name,
        description: newAddon.description,
        price_usd: idrToUsdNumber(newAddon.price_usd),
        price_type: newAddon.price_type,
        is_active: newAddon.is_active,
        sort_order: newAddon.sort_order,
      });
      const transToSave = newAddon.translations.filter((t) => t.name.trim() || t.description.trim());
      if (transToSave.length > 0) {
        await endpoints.adminSaveAddonTranslations(created.id, transToSave);
      }
      setShowCreateForm(false);
      setNewAddon({
        name: '', description: '', price_usd: '0', price_type: 'per_day',
        is_active: true, sort_order: 0,
        translations: LANGUAGES.map((lang) => ({ language: lang, name: '', description: '' })),
      });
      load();
    } catch {
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (addon: ApiAddon) => {
    const confirmed = typeof window === 'undefined'
      ? false
      : window.confirm(`Delete add-on "${addon.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(addon.id);
    try {
      await endpoints.adminDeleteAddon(addon.id);
      if (expandedId === addon.id) {
        setExpandedId(null);
      }
      setDrafts((p) => {
        const next = { ...p };
        delete next[addon.id];
        return next;
      });
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Unable to delete add-on.');
    } finally {
      setDeletingId(null);
    }
  };

  const inputStyle: CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1px solid ${A.g200}`, borderRadius: 8,
    fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black, outline: 'none', background: A.white,
    boxSizing: 'border-box',
  };
  const labelStyle: CSSProperties = {
    fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500,
    letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6,
  };

  const AddonForm = ({ draft, addonId, onChange, onTransChange }: {
    draft: AddonDraft;
    addonId: number;
    onChange: (field: keyof Omit<AddonDraft, 'translations'>, value: string | boolean | number) => void;
    onTransChange: (lang: string, field: 'name' | 'description', value: string) => void;
  }) => {
    const lang = activeLang[addonId] || 'en';
    const trans = draft.translations.find((t) => t.language === lang) || { language: lang, name: '', description: '' };
    return (
      <div style={{ padding: '16px 20px 20px', borderTop: `1px solid ${A.g200}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Name (EN base)</label>
            <input style={inputStyle} value={draft.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Addon name" />
          </div>
          <div>
            <label style={labelStyle}>Price (IDR)</label>
            <input style={inputStyle} type="number" step="1" value={draft.price_usd} onChange={(e) => onChange('price_usd', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Price Type</label>
            <select style={inputStyle} value={draft.price_type} onChange={(e) => onChange('price_type', e.target.value)}>
              <option value="per_day">Per day</option>
              <option value="fixed">Fixed</option>
              <option value="per_trip">Per trip</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sort order</label>
            <input style={inputStyle} type="number" value={draft.sort_order} onChange={(e) => onChange('sort_order', parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Description (EN base)</label>
          <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={draft.description} onChange={(e) => onChange('description', e.target.value)} placeholder="Base description in English" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <input type="checkbox" id={`active-${addonId}`} checked={draft.is_active} onChange={(e) => onChange('is_active', e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor={`active-${addonId}`} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black, cursor: 'pointer' }}>Active (visible to customers)</label>
        </div>

        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Translations</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {LANGUAGES.map((l) => {
            const t = draft.translations.find((x) => x.language === l);
            const filled = !!(t?.name.trim() || t?.description.trim());
            return (
              <button key={l} onClick={() => setActiveLang((p) => ({ ...p, [addonId]: l }))}
                style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${lang === l ? A.black : A.g300}`,
                  background: lang === l ? A.black : A.white, color: lang === l ? A.white : A.g700,
                  fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {l.toUpperCase()} {filled && <span style={{ color: lang === l ? A.gold : A.green, fontSize: 10 }}>✓</span>}
              </button>
            );
          })}
        </div>
        <div style={{ background: A.g100, borderRadius: 10, padding: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>{`Name (${lang.toUpperCase()})`}</label>
            <input style={inputStyle} value={trans.name} onChange={(e) => onTransChange(lang, 'name', e.target.value)} placeholder={`Addon name in ${lang}`} />
          </div>
          <div>
            <label style={labelStyle}>{`Description (${lang.toUpperCase()})`}</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={trans.description} onChange={(e) => onTransChange(lang, 'description', e.target.value)} placeholder={`Description in ${lang}`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: isMobile ? 16 : 28, height: '100%', overflowY: 'auto' }}>
      <SectionHeader
        title="Add-ons Management"
        subtitle="Manage add-ons with multilingual names and descriptions"
        action={<Button variant="primary" onClick={() => setShowCreateForm(true)}>+ Add add-on</Button>}
      />

      {loading ? (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>Loading…</p>
      ) : addons.length === 0 ? (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>No add-ons yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {addons.map((addon) => {
            const isExpanded = expandedId === addon.id;
            const draft = drafts[addon.id];
            const isSaving = saving[addon.id];
            const isDeleting = deletingId === addon.id;
            return (
              <div key={addon.id} style={{ background: A.white, border: `1px solid ${isExpanded ? A.black : A.g200}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                <div
                  onClick={() => openAddon(addon)}
                  style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>{addon.name}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginTop: 2 }}>
                      {formatMoney(addon.price_usd || addon.priceUSD || 0)} · {addon.price_type || 'per_day'}
                      {addon.is_active === false && <span style={{ marginLeft: 8, color: A.red }}>inactive</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button
                      variant="ghost"
                      disabled={isDeleting || isSaving}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(addon);
                      }}
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </Button>
                    {(addon.translations?.length ?? 0) > 0 && (
                      <Badge color="green">{`${addon.translations!.length} langs`}</Badge>
                    )}
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, color: A.g400, lineHeight: 1 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && draft && (
                  <>
                    <AddonForm
                      draft={draft}
                      addonId={addon.id}
                      onChange={(field, value) => setDraftField(addon.id, field, value)}
                      onTransChange={(lang, field, value) => setTransField(addon.id, lang, field, value)}
                    />
                    <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid ${A.g200}` }}>
                      <Button variant="ghost" disabled={isDeleting || isSaving} onClick={() => handleDelete(addon)}>
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </Button>
                      <Button variant="outline" onClick={() => { setExpandedId(null); setDrafts((p) => { const n = { ...p }; delete n[addon.id]; return n; }); }}>Cancel</Button>
                      <Button variant="primary" disabled={isSaving || isDeleting} onClick={() => handleSave(addon)}>{isSaving ? 'Saving…' : 'Save'}</Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
          <div style={{ background: A.white, borderRadius: 16, padding: 28, width: '100%', maxWidth: 720, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black, margin: 0 }}>New Add-on</h3>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>✕</Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Name (EN base)</label>
                <input style={inputStyle} value={newAddon.name} onChange={(e) => setNewAddon((p) => ({ ...p, name: e.target.value }))} placeholder="Addon name" />
              </div>
              <div>
                <label style={labelStyle}>Price (IDR)</label>
                <input style={inputStyle} type="number" step="1" value={newAddon.price_usd} onChange={(e) => setNewAddon((p) => ({ ...p, price_usd: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Price Type</label>
                <select style={inputStyle} value={newAddon.price_type} onChange={(e) => setNewAddon((p) => ({ ...p, price_type: e.target.value }))}>
                  <option value="per_day">Per day</option>
                  <option value="fixed">Fixed</option>
                  <option value="per_trip">Per trip</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sort order</label>
                <input style={inputStyle} type="number" value={newAddon.sort_order} onChange={(e) => setNewAddon((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Description (EN base)</label>
              <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={newAddon.description} onChange={(e) => setNewAddon((p) => ({ ...p, description: e.target.value }))} placeholder="Base description in English" />
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Translations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {newAddon.translations.map((t) => (
                <div key={t.language} style={{ background: A.g100, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: A.g700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.language}</div>
                  <div style={{ marginBottom: 8 }}>
                    <input style={inputStyle} placeholder={`Name in ${t.language}`} value={t.name}
                      onChange={(e) => setNewAddon((p) => ({ ...p, translations: p.translations.map((x) => x.language === t.language ? { ...x, name: e.target.value } : x) }))} />
                  </div>
                  <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder={`Description in ${t.language}`} value={t.description}
                    onChange={(e) => setNewAddon((p) => ({ ...p, translations: p.translations.map((x) => x.language === t.language ? { ...x, description: e.target.value } : x) }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} disabled={creating || !newAddon.name.trim()}>{creating ? 'Creating…' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesView({ isMobile }: { isMobile: boolean }) {
  const [categories, setCategories] = useState<ApiVehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<Record<number, string>>({});
  const [drafts, setDrafts] = useState<Record<number, CategoryDraft>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCategory, setNewCategory] = useState<CategoryDraft>({
    code: '',
    name: '',
    translations: LANGUAGES.map((lang) => ({ language: lang, name: '' })),
  });

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: `1px solid ${A.g200}`,
    borderRadius: 8,
    fontFamily: 'Inter, sans-serif',
    fontSize: 13,
    color: A.black,
    outline: 'none',
    background: A.white,
    boxSizing: 'border-box',
  };

  const labelStyle: CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    color: A.g500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 6,
  };

  const emptyCategory = (): CategoryDraft => ({
    code: '',
    name: '',
    translations: LANGUAGES.map((lang) => ({ language: lang, name: '' })),
  });

  const load = () => {
    setLoading(true);
    endpoints.scooterTypes()
      .then((res) => setCategories(unwrapList(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCategory = (category: ApiVehicleType) => {
    if (expandedId === category.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(category.id);
    if (!activeLang[category.id]) {
      setActiveLang((prev) => ({ ...prev, [category.id]: 'en' }));
    }
    if (!drafts[category.id]) {
      setDrafts((prev) => ({
        ...prev,
        [category.id]: {
          code: category.code,
          name: category.name,
          translations: LANGUAGES.map((lang) => {
            const translation = category.translations?.find((item) => item.language === lang);
            return { language: lang, name: translation?.name || '' };
          }),
        },
      }));
    }
  };

  const setDraftField = (id: number, field: keyof Omit<CategoryDraft, 'translations'>, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const setTranslationField = (id: number, lang: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        translations: prev[id].translations.map((item) => (
          item.language === lang ? { ...item, name: value } : item
        )),
      },
    }));
  };

  const handleSave = async (category: ApiVehicleType) => {
    const draft = drafts[category.id];
    if (!draft || !draft.name.trim()) return;
    setSaving((prev) => ({ ...prev, [category.id]: true }));
    try {
      await endpoints.adminUpdateScooterType(category.id, {
        code: draft.code.trim(),
        name: draft.name.trim(),
      });
      const translationsToSave = draft.translations.filter((item) => item.name.trim());
      if (translationsToSave.length > 0) {
        await endpoints.adminSaveScooterTypeTranslations(category.id, translationsToSave);
      }
      setExpandedId(null);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[category.id];
        return next;
      });
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Unable to update category.');
    } finally {
      setSaving((prev) => ({ ...prev, [category.id]: false }));
    }
  };

  const handleDelete = async (category: ApiVehicleType) => {
    const confirmed = typeof window === 'undefined'
      ? false
      : window.confirm(`Delete category "${category.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(category.id);
    try {
      await endpoints.adminDeleteScooterType(category.id);
      if (expandedId === category.id) {
        setExpandedId(null);
      }
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[category.id];
        return next;
      });
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Unable to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async () => {
    if (!newCategory.name.trim()) return;
    setCreating(true);
    try {
      const created = await endpoints.adminCreateScooterType({
        code: newCategory.code.trim(),
        name: newCategory.name.trim(),
      });
      const translationsToSave = newCategory.translations.filter((item) => item.name.trim());
      if (translationsToSave.length > 0) {
        await endpoints.adminSaveScooterTypeTranslations(created.id, translationsToSave);
      }
      setShowCreateForm(false);
      setNewCategory(emptyCategory());
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Unable to create category.');
    } finally {
      setCreating(false);
    }
  };

  const CategoryForm = ({
    draft,
    categoryId,
    onChange,
    onTranslationChange,
  }: {
    draft: CategoryDraft;
    categoryId: number;
    onChange: (field: keyof Omit<CategoryDraft, 'translations'>, value: string) => void;
    onTranslationChange: (lang: string, value: string) => void;
  }) => {
    const lang = activeLang[categoryId] || 'en';
    const translation = draft.translations.find((item) => item.language === lang) || { language: lang, name: '' };
    return (
      <div style={{ padding: '16px 20px 20px', borderTop: `1px solid ${A.g200}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Category name (EN base)</label>
            <input style={inputStyle} value={draft.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Scooter" />
          </div>
          <div>
            <label style={labelStyle}>Code</label>
            <input style={inputStyle} value={draft.code} onChange={(e) => onChange('code', e.target.value)} placeholder="Optional, auto-generated" />
          </div>
        </div>

        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
          Translations
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {LANGUAGES.map((langCode) => {
            const current = draft.translations.find((item) => item.language === langCode);
            const filled = !!current?.name.trim();
            return (
              <button
                key={langCode}
                onClick={() => setActiveLang((prev) => ({ ...prev, [categoryId]: langCode }))}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: `1px solid ${lang === langCode ? A.black : A.g300}`,
                  background: lang === langCode ? A.black : A.white,
                  color: lang === langCode ? A.white : A.g700,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {langCode.toUpperCase()} {filled && <span style={{ color: lang === langCode ? A.gold : A.green, fontSize: 10 }}>✓</span>}
              </button>
            );
          })}
        </div>
        <div style={{ background: A.g100, borderRadius: 10, padding: 14 }}>
          <label style={labelStyle}>{`Name (${LANG_LABELS[lang]})`}</label>
          <input
            style={inputStyle}
            value={translation.name}
            onChange={(e) => onTranslationChange(lang, e.target.value)}
            placeholder={draft.name || `Category in ${LANG_LABELS[lang]}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: isMobile ? 16 : 28, height: '100%', overflowY: 'auto' }}>
      <SectionHeader
        title="Categories"
        subtitle="Manage scooter categories and their names in every language"
        action={<Button variant="primary" onClick={() => setShowCreateForm(true)}>+ Add category</Button>}
      />

      {loading ? (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>Loading…</p>
      ) : categories.length === 0 ? (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>No categories yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categories.map((category) => {
            const isExpanded = expandedId === category.id;
            const draft = drafts[category.id];
            const isSaving = saving[category.id];
            const isDeleting = deletingId === category.id;
            return (
              <div
                key={category.id}
                style={{
                  background: A.white,
                  border: `1px solid ${isExpanded ? A.black : A.g200}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'border-color 0.15s',
                }}
              >
                <div
                  onClick={() => openCategory(category)}
                  style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>{category.name}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginTop: 2 }}>
                      {`Code: ${category.code}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button
                      variant="ghost"
                      disabled={isDeleting || isSaving}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(category);
                      }}
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </Button>
                    {(category.translations?.length ?? 0) > 0 && (
                      <Badge color="green">{`${category.translations!.length} langs`}</Badge>
                    )}
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, color: A.g400, lineHeight: 1 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && draft && (
                  <>
                    <CategoryForm
                      draft={draft}
                      categoryId={category.id}
                      onChange={(field, value) => setDraftField(category.id, field, value)}
                      onTranslationChange={(lang, value) => setTranslationField(category.id, lang, value)}
                    />
                    <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid ${A.g200}` }}>
                      <Button variant="ghost" disabled={isDeleting || isSaving} onClick={() => handleDelete(category)}>
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setExpandedId(null);
                        setDrafts((prev) => {
                          const next = { ...prev };
                          delete next[category.id];
                          return next;
                        });
                      }}>
                        Cancel
                      </Button>
                      <Button variant="primary" disabled={isSaving || isDeleting || !draft.name.trim()} onClick={() => handleSave(category)}>
                        {isSaving ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
          <div style={{ background: A.white, borderRadius: 16, padding: 28, width: '100%', maxWidth: 720, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black, margin: 0 }}>New Category</h3>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>✕</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Category name (EN base)</label>
                <input style={inputStyle} value={newCategory.name} onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))} placeholder="Scooter" />
              </div>
              <div>
                <label style={labelStyle}>Code</label>
                <input style={inputStyle} value={newCategory.code} onChange={(e) => setNewCategory((prev) => ({ ...prev, code: e.target.value }))} placeholder="Optional, auto-generated" />
              </div>
            </div>

            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
              Translations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {newCategory.translations.map((translation) => (
                <div key={translation.language} style={{ background: A.g100, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: A.g700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {translation.language}
                  </div>
                  <input
                    style={inputStyle}
                    placeholder={`Name in ${translation.language}`}
                    value={translation.name}
                    onChange={(e) => setNewCategory((prev) => ({
                      ...prev,
                      translations: prev.translations.map((item) => (
                        item.language === translation.language ? { ...item, name: e.target.value } : item
                      )),
                    }))}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} disabled={creating || !newCategory.name.trim()}>
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewsView({ isMobile }: { isMobile: boolean }) {
  const [articles, setArticles] = useState<ApiNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingArticle, setEditingArticle] = useState<ApiNewsArticle | null>(null);
  const [showForm, setShowForm] = useState(false);

  const emptyForm = () => ({
    slug: '',
    published_at: new Date().toISOString().slice(0, 10),
    is_active: true,
    sort_order: 0,
    translations: LANGUAGES.map((lang) => ({ language: lang, title: '', description: '' })),
    imageFile: null as File | null,
  });

  const [form, setForm] = useState(emptyForm());

  const load = () => {
    setLoading(true);
    endpoints.adminNewsList({ page_size: 100 })
      .then((res) => setArticles(unwrapList(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditingArticle(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (article: ApiNewsArticle) => {
    setEditingArticle(article);
    const existingTranslations = article.translations || [];
    setForm({
      slug: article.slug,
      published_at: article.published_at,
      is_active: true,
      sort_order: 0,
      translations: LANGUAGES.map((lang) => {
        const found = existingTranslations.find((t) => t.language === lang);
        return { language: lang, title: found?.title || '', description: found?.description || '' };
      }),
      imageFile: null,
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingArticle(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('slug', form.slug);
      fd.append('published_at', form.published_at);
      fd.append('is_active', String(form.is_active));
      fd.append('sort_order', String(form.sort_order));
      if (form.imageFile) fd.append('image', form.imageFile);

      const translations = form.translations.filter((t) => t.title.trim());
      fd.append('translations', JSON.stringify(translations));

      if (editingArticle) {
        await endpoints.adminUpdateNews(editingArticle.id, fd);
      } else {
        await endpoints.adminCreateNews(fd);
      }
      closeForm();
      load();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this article?')) return;
    setDeletingId(id);
    try {
      await endpoints.adminDeleteNews(id);
      load();
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

  const setTranslation = (lang: string, field: 'title' | 'description', value: string) => {
    setForm((prev) => ({
      ...prev,
      translations: prev.translations.map((t) => t.language === lang ? { ...t, [field]: value } : t),
    }));
  };

  const inputStyle: CSSProperties = {
    width: '100%', padding: '9px 12px', border: `1px solid ${A.g200}`, borderRadius: 8,
    fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black, outline: 'none', background: A.white,
    boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: isMobile ? 16 : 28, height: '100%', overflowY: 'auto' }}>
      <SectionHeader
        title="News Management"
        subtitle="Manage multilingual news articles"
        action={<Button variant="primary" onClick={openNew}>+ Add article</Button>}
      />

      {loading ? (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>Loading…</p>
      ) : articles.length === 0 ? (
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>No articles yet. Add the first one.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {articles.map((article) => {
            const enTranslation = article.translations?.find((t) => t.language === 'en') || article.translations?.[0];
            return (
              <div key={article.id} style={{ background: A.white, border: `1px solid ${A.g200}`, borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {article.image && (
                  <img src={mediaUrl(article.image)} alt="" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: A.black, marginBottom: 4 }}>
                    {enTranslation?.title || article.slug}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                    {article.published_at} · {article.slug}
                  </div>
                  {enTranslation?.description && (
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {enTranslation.description}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Button variant="outline" onClick={() => openEdit(article)}>Edit</Button>
                  <Button variant="danger" disabled={deletingId === article.id} onClick={() => handleDelete(article.id)}>
                    {deletingId === article.id ? '…' : 'Delete'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
          <div style={{ background: A.white, borderRadius: 16, padding: 28, width: '100%', maxWidth: 680, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black, margin: 0 }}>
                {editingArticle ? 'Edit article' : 'New article'}
              </h3>
              <Button variant="ghost" onClick={closeForm}>✕</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Slug</label>
                <input style={inputStyle} value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="my-article-slug" />
              </div>
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Published date</label>
                <input type="date" style={inputStyle} value={form.published_at} onChange={(e) => setForm((p) => ({ ...p, published_at: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Image</label>
                <input type="file" accept="image/*" style={{ ...inputStyle, padding: '7px 12px' }}
                  onChange={(e) => setForm((p) => ({ ...p, imageFile: e.target.files?.[0] ?? null }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                <input type="checkbox" id="isActive" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} style={{ width: 16, height: 16 }} />
                <label htmlFor="isActive" style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black, cursor: 'pointer' }}>Published</label>
              </div>
            </div>

            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Translations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {form.translations.map((t) => (
                <div key={t.language} style={{ background: A.g100, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: A.g700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.language}</div>
                  <div style={{ marginBottom: 8 }}>
                    <input style={inputStyle} placeholder="Title" value={t.title} onChange={(e) => setTranslation(t.language, 'title', e.target.value)} />
                  </div>
                  <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Description" value={t.description} onChange={(e) => setTranslation(t.language, 'description', e.target.value)} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Promo Codes ──────────────────────────────────────────────────────────────

type PromoCodeDraft = {
  id: number | null;
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: string;
  starts_at: string;
  ends_at: string;
  usage_limit: string;
  current_usage: number;
  min_booking_amount: string;
  max_discount_amount: string;
  is_active: boolean;
};

function isoToLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyPromoCodeDraft(): PromoCodeDraft {
  return { id: null, code: '', discount_type: 'PERCENT', discount_value: '', starts_at: '', ends_at: '', usage_limit: '100', current_usage: 0, min_booking_amount: '0', max_discount_amount: '', is_active: true };
}

function draftFromPromoCode(item: ApiPromoCode): PromoCodeDraft {
  return {
    id: item.id,
    code: item.code,
    discount_type: item.discount_type,
    discount_value: String(item.discount_value),
    starts_at: isoToLocal(item.starts_at),
    ends_at: isoToLocal(item.ends_at),
    usage_limit: String(item.usage_limit),
    current_usage: item.current_usage,
    min_booking_amount: String(item.min_booking_amount),
    max_discount_amount: item.max_discount_amount != null ? String(item.max_discount_amount) : '',
    is_active: item.is_active,
  };
}

function PromoCodesView({ isMobile }: { isMobile: boolean }) {
  const inputStyle: CSSProperties = { width: '100%', padding: '9px 12px', border: `1px solid ${A.g200}`, borderRadius: 8, fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black, outline: 'none', background: A.white, boxSizing: 'border-box' };
  const labelStyle: CSSProperties = { fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 };

  const [codes, setCodes] = useState<ApiPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [draft, setDraft] = useState<PromoCodeDraft>(emptyPromoCodeDraft);

  function load() {
    setLoading(true);
    endpoints.adminPromoCodes({ page_size: 200 })
      .then((res) => setCodes(unwrapList(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function upd<K extends keyof PromoCodeDraft>(key: K, value: PromoCodeDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSelect(item: ApiPromoCode) {
    setDraft(draftFromPromoCode(item));
    setFormError('');
  }

  function handleNew() {
    setDraft(emptyPromoCodeDraft());
    setFormError('');
  }

  async function handleSave() {
    setFormError('');
    if (!draft.code.trim()) { setFormError('Code is required'); return; }
    if (!draft.discount_value) { setFormError('Discount value is required'); return; }
    setSaving(true);
    try {
      const payload: PromoCodePayload = {
        code: draft.code.trim().toUpperCase(),
        discount_type: draft.discount_type,
        discount_value: draft.discount_value,
        is_active: draft.is_active,
        usage_limit: Number(draft.usage_limit) || 1,
        min_booking_amount: draft.min_booking_amount || '0',
        max_discount_amount: draft.max_discount_amount ? draft.max_discount_amount : null,
        starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
        ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
      };
      const saved = draft.id
        ? await endpoints.adminUpdatePromoCode(draft.id, payload)
        : await endpoints.adminCreatePromoCode(payload);
      setDraft(draftFromPromoCode(saved));
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!draft.id) return;
    if (!window.confirm(`Delete promo code "${draft.code}"?`)) return;
    setDeleting(draft.id);
    try {
      await endpoints.adminDeletePromoCode(draft.id);
      setDraft(emptyPromoCodeDraft());
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  function formatDate(iso: string | null | undefined) {
    if (!iso) return '∞';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '20px 16px' : '28px 32px' }}>
      <SectionHeader
        title="Promo Codes"
        subtitle={`${codes.length} codes — percentage or fixed discounts for customers`}
        action={<Button variant="dark" onClick={handleNew}>New code</Button>}
      />

      {loading ? (
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500, padding: 24 }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 0.5fr', gap: 16, alignItems: 'start' }}>
          {/* List */}
          <div>
            {codes.length === 0 ? (
              <div style={{ background: A.white, borderRadius: 14, border: `1px solid ${A.g200}`, padding: 24, fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500 }}>
                No promo codes yet. Create the first one.
              </div>
            ) : (
              <div style={{ background: A.white, borderRadius: 14, border: `1px solid ${A.g200}`, overflow: 'hidden' }}>
                {!isMobile && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 0.9fr 0.8fr', gap: 12, padding: '10px 20px', background: A.g100, borderBottom: `1px solid ${A.g200}` }}>
                    {['Code', 'Discount', 'Usage', 'Valid Until', 'Status'].map((h) => (
                      <div key={h} style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: A.g500 }}>{h}</div>
                    ))}
                  </div>
                )}
                {codes.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr auto' : '1.2fr 1fr 0.8fr 0.9fr 0.8fr',
                      gap: 12,
                      padding: '13px 20px',
                      borderBottom: `1px solid ${A.g200}`,
                      cursor: 'pointer',
                      background: draft.id === item.id ? 'rgba(255,215,0,0.06)' : A.white,
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black, letterSpacing: '0.04em' }}>{item.code}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
                      {item.discount_type === 'PERCENT'
                        ? <><strong style={{ color: A.black }}>{item.discount_value}%</strong> <span style={{ color: A.g500, fontSize: 11 }}>off</span></>
                        : <><strong style={{ color: A.black }}>${item.discount_value}</strong> <span style={{ color: A.g500, fontSize: 11 }}>fixed</span></>
                      }
                    </div>
                    {!isMobile && <>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
                        <span style={{ fontWeight: 700 }}>{item.current_usage}</span>
                        <span style={{ color: A.g500 }}> / {item.usage_limit}</span>
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>{formatDate(item.ends_at)}</div>
                    </>}
                    <Badge color={item.is_active ? 'green' : 'default'}>{item.is_active ? 'Active' : 'Off'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div style={{ background: A.white, borderRadius: 14, border: `1px solid ${A.g200}`, padding: 20, position: isMobile ? 'static' : 'sticky', top: 24 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black, marginBottom: 4 }}>
              {draft.id ? `Edit: ${draft.code}` : 'New Promo Code'}
            </div>
            {draft.id ? (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 16 }}>
                {`Used ${draft.current_usage} / ${draft.usage_limit} times`}
              </div>
            ) : (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 16 }}>Fill in the fields below</div>
            )}

            {formError && (
              <div style={{ marginBottom: 14, background: A.redBg, color: A.red, borderRadius: 8, padding: '10px 14px', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={labelStyle}>Promo code</label>
                <input style={inputStyle} value={draft.code} onChange={(e) => upd('code', e.target.value.toUpperCase())} placeholder="SUMMER20" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select style={inputStyle} value={draft.discount_type} onChange={(e) => upd('discount_type', e.target.value as 'PERCENT' | 'FIXED')}>
                    <option value="PERCENT">Percent (%)</option>
                    <option value="FIXED">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>{draft.discount_type === 'PERCENT' ? 'Discount %' : 'Discount $'}</label>
                  <input style={inputStyle} type="number" min="0" step={draft.discount_type === 'PERCENT' ? '1' : '0.01'} max={draft.discount_type === 'PERCENT' ? '100' : undefined} value={draft.discount_value} onChange={(e) => upd('discount_value', e.target.value)} placeholder={draft.discount_type === 'PERCENT' ? '20' : '10.00'} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Start date</label>
                  <input style={inputStyle} type="datetime-local" value={draft.starts_at} onChange={(e) => upd('starts_at', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>End date</label>
                  <input style={inputStyle} type="datetime-local" value={draft.ends_at} onChange={(e) => upd('ends_at', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Usage limit</label>
                  <input style={inputStyle} type="number" min="1" value={draft.usage_limit} onChange={(e) => upd('usage_limit', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Min order, $</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" value={draft.min_booking_amount} onChange={(e) => upd('min_booking_amount', e.target.value)} />
                </div>
              </div>

              {draft.discount_type === 'PERCENT' && (
                <div>
                  <label style={labelStyle}>Max discount, $ (optional)</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" value={draft.max_discount_amount} onChange={(e) => upd('max_discount_amount', e.target.value)} placeholder="No limit" />
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black, cursor: 'pointer' }}>
                <input type="checkbox" checked={draft.is_active} onChange={(e) => upd('is_active', e.target.checked)} style={{ width: 15, height: 15 }} />
                Active (visible to users)
              </label>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4, borderTop: `1px solid ${A.g200}` }}>
                <Button variant="primary" size="md" disabled={saving} onClick={handleSave}>
                  {saving ? 'Saving…' : draft.id ? 'Save changes' : 'Create code'}
                </Button>
                <Button variant="outline" size="md" onClick={handleNew}>Reset</Button>
                {draft.id && (
                  <Button variant="danger" size="md" disabled={deleting === draft.id} onClick={handleDelete}>
                    {deleting === draft.id ? 'Deleting…' : 'Delete'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [savingAdminUser, setSavingAdminUser] = useState(false);
  const [deletingAdminUserId, setDeletingAdminUserId] = useState<number | null>(null);
  const [changingOwnPassword, setChangingOwnPassword] = useState(false);
  const [settingTeamPasswordId, setSettingTeamPasswordId] = useState<number | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [threadMessages, setThreadMessages] = useState<ApiChatMessage[]>([]);
  const [sendingReply, setSendingReply] = useState(false);

  const canOpenAdmin = isAdminLike(user);
  const allowedPermissions = useMemo(
    () => normalizeAdminPermissions(user?.admin_permissions, user?.role, user?.is_superuser),
    [user?.admin_permissions, user?.is_superuser, user?.role],
  );
  const allowedNavItems = useMemo(
    () => NAV.filter((item) => allowedPermissions.includes(permissionForView(item.id))),
    [allowedPermissions],
  );
  const canManageTeam = allowedPermissions.includes('team');
  const canAccessAnyAdminSection = allowedNavItems.length > 0;
  const fallbackView = allowedNavItems[0]?.id || 'overview';

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
        promocodes: [],
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

  async function handleCreateAdminUser(payload: { email: string; full_name?: string; phone?: string; password: string; role: string; admin_permissions: AdminPermission[] }) {
    setSavingAdminUser(true);
    try {
      await endpoints.adminCreateUser({
        ...payload,
        admin_permissions: serializeAdminPermissions(payload.admin_permissions),
      });
      await loadAdminData();
    } finally {
      setSavingAdminUser(false);
    }
  }

  async function handleDeleteAdminUser(userId: number) {
    setDeletingAdminUserId(userId);
    setError(null);
    try {
      await endpoints.adminDeleteUser(userId);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to delete the team member');
      throw err;
    } finally {
      setDeletingAdminUserId(null);
    }
  }

  async function handleChangeOwnPassword(payload: { current_password: string; new_password: string }) {
    setChangingOwnPassword(true);
    try {
      await endpoints.changeMyPassword(payload);
    } finally {
      setChangingOwnPassword(false);
    }
  }

  async function handleSetTeamUserPassword(userId: number, newPassword: string) {
    setSettingTeamPasswordId(userId);
    try {
      await endpoints.adminSetUserPassword(userId, { new_password: newPassword });
    } finally {
      setSettingTeamPasswordId(null);
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
    if (!allowedNavItems.some((item) => item.id === view)) {
      setView(fallbackView);
    }
  }, [allowedNavItems, fallbackView, view]);

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

  async function handleDeleteScooter(scooter: ApiScooterDetail) {
    if (!window.confirm(`Delete scooter "${scooter.title}"? This action cannot be undone.`)) return;

    setSavingScooterId(scooter.id);
    setError(null);
    try {
      await endpoints.adminDeleteScooter(scooter.id);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to delete scooter');
    } finally {
      setSavingScooterId(null);
    }
  }

  async function handleBookingAction(
    bookingId: number,
    action: 'confirm' | 'mark-delivery' | 'mark-active' | 'complete' | 'cancel' | 'delete',
  ) {
    if (typeof window !== 'undefined') {
      if (action === 'cancel' && !window.confirm('Cancel this booking? The scooter dates will become available again.')) return;
      if (action === 'delete' && !window.confirm('Delete this booking permanently? The scooter dates will become available again.')) return;
    }

    setBusyBookingId(bookingId);
    setError(null);
    try {
      if (action === 'confirm') await endpoints.adminConfirmBooking(bookingId);
      if (action === 'mark-delivery') await endpoints.adminMarkBookingDelivery(bookingId);
      if (action === 'mark-active') await endpoints.adminMarkBookingActive(bookingId);
      if (action === 'complete') await endpoints.adminCompleteBooking(bookingId);
      if (action === 'cancel') await endpoints.adminCancelBooking(bookingId);
      if (action === 'delete') await endpoints.adminDeleteBooking(bookingId);
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

  if (!canAccessAnyAdminSection) {
    return (
      <FullScreenMessage
        title="No sections assigned"
        subtitle="Your staff account is active, but no admin sections are assigned yet. Ask an administrator to enable the parts of the panel you should manage."
        action={
          <Button variant="primary" size="md" onClick={() => router.push('/profile')}>
            Open profile
          </Button>
        }
      />
    );
  }

  const viewMap: Record<AdminView, ReactNode> = {
    overview: (
      <OverviewView
        data={data}
        currentUser={user}
        onOpenView={setView}
        onChangeOwnPassword={handleChangeOwnPassword}
        changingOwnPassword={changingOwnPassword}
        canManageTeam={canManageTeam}
        isMobile={isMobile}
      />
    ),
    fleet: (
      <FleetView
        scooters={data.scooters}
        scooterModels={data.scooterModels}
        savingScooterId={savingScooterId}
        savingFleetForm={savingFleetForm}
        onPatchScooter={handlePatchScooter}
        onCreateScooter={handleSaveScooter}
        onDeleteScooter={handleDeleteScooter}
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
        currentUser={user}
        onSelectThread={setActiveThreadId}
        onSendReply={handleSendReply}
        onUpdateThreadStatus={handleThreadStatus}
        sendingReply={sendingReply}
        isMobile={isMobile}
      />
    ),
    news: <NewsView isMobile={isMobile} />,
    addons: <AddonsView isMobile={isMobile} />,
    categories: <CategoriesView isMobile={isMobile} />,
    locations: <LocationsView isMobile={isMobile} />,
    site: <SiteContentView isMobile={isMobile} />,
    appContent: <SiteContentView isMobile={isMobile} initialPage="app" lockedPage="app" />,
    currencies: <CurrencySettingsView isMobile={isMobile} />,
    socials: <SocialSettingsView isMobile={isMobile} />,
    addresses: <AddressSettingsView isMobile={isMobile} />,
    users: (
      <UsersView
        users={data.users}
        currentUser={user}
        onCreateAdminUser={handleCreateAdminUser}
        onDeleteAdminUser={handleDeleteAdminUser}
        onSetTeamUserPassword={handleSetTeamUserPassword}
        savingAdminUser={savingAdminUser}
        deletingAdminUserId={deletingAdminUserId}
        settingTeamPasswordId={settingTeamPasswordId}
        isMobile={isMobile}
      />
    ),
    promocodes: <PromoCodesView isMobile={isMobile} />,
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
        {allowedNavItems.map((item) => (
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
      <div style={{ padding: '10px 10px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', padding: '8px 14px 4px' }}>
          Content
        </div>
        <Link href="/admin/faq" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '11px 14px', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', marginBottom: 3,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>💬</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>
              FAQ
            </span>
          </div>
        </Link>
      </div>
      <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ marginBottom: 16 }}>
          <AdminSidebarLanguageSwitcher />
        </div>
        <div style={{ marginBottom: 16 }}>
          <AdminSidebarCurrencySwitcher />
        </div>
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
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black }}>{ADMIN_PERMISSION_LABELS[view]}</div>
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

function SiteContentView({
  isMobile,
  initialPage,
  lockedPage,
}: {
  isMobile: boolean;
  initialPage?: string;
  lockedPage?: string;
}) {
  const [entries, setEntries] = useState<ApiAdminSiteContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<string>(initialPage || SITE_CONTENT_PAGES[0]?.key || 'home');
  const [activeLanguage, setActiveLanguage] = useState<string>('en');
  const [activePreviewVariant, setActivePreviewVariant] = useState<string>('');
  const [activeAppOnboardingStep, setActiveAppOnboardingStep] = useState<1 | 2 | 3>(1);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [mediaDrafts, setMediaDrafts] = useState<Record<string, File | null>>({});
  const [error, setError] = useState<string | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);

  const entryMap = useMemo(() => {
    const map = new Map<string, ApiAdminSiteContentEntry>();
    for (const entry of entries) {
      map.set(`${entry.language}:${entry.key}`, entry);
    }
    return map;
  }, [entries]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    endpoints.adminSiteContent()
      .then((response) => setEntries(unwrapList(response)))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Unable to load site content'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialPage) {
      setActivePage(initialPage);
    }
  }, [initialPage]);

  const activePageMeta = useMemo(
    () => SITE_CONTENT_PAGES.find((page) => page.key === activePage) || SITE_CONTENT_PAGES[0],
    [activePage],
  );

  const matchesActivePage = useCallback(
    (field: SiteContentFieldMeta) => Boolean(activePageMeta && pageMatchesField(activePageMeta, field)),
    [activePageMeta],
  );

  const pageFields = useMemo(
    () => {
      const fields = SITE_CONTENT_FIELDS.filter((field) => matchesActivePage(field));
      if (lockedPage === 'app') {
        return fields.filter((field) => field.key.startsWith('app.onboarding'));
      }
      return fields;
    },
    [lockedPage, matchesActivePage],
  );

  const pageFieldMap = useMemo(
    () => new Map(pageFields.map((field) => [field.key, field])),
    [pageFields],
  );

  const previewFields = useMemo(
    () => pageFields,
    [pageFields],
  );

  const previewSelectableFields = useMemo(
    () => previewFields.filter((field) => field.valueType === 'text' || field.valueType === 'textarea' || field.valueType === 'json'),
    [previewFields],
  );

  const previewVariants = useMemo(() => {
    const variants = SITE_PREVIEW_VARIANTS[activePage];
    if (variants?.length) return variants;
    const fallbackRoute = SITE_PREVIEW_ROUTES[activePage] || activePageMeta?.route || '/';
    return [{ key: `${activePage}-default`, label: activePageMeta?.label || 'Preview', route: fallbackRoute }];
  }, [activePage, activePageMeta]);

  const pageCounts = useMemo(() => {
    const counts = new Map<string, { total: number; customized: number; clickable: number }>();
    for (const page of SITE_CONTENT_PAGES) {
      counts.set(page.key, { total: 0, customized: 0, clickable: 0 });
    }
    for (const page of SITE_CONTENT_PAGES) {
      const current = counts.get(page.key);
      if (!current) continue;
      for (const field of SITE_CONTENT_FIELDS) {
        if (!pageMatchesField(page, field)) continue;
        current.total += 1;
        if (field.valueType === 'text' || field.valueType === 'textarea' || field.valueType === 'json') {
          current.clickable += 1;
        }
        const entry = entryMap.get(`${field.shared ? 'all' : activeLanguage}:${field.key}`);
        if (entry) current.customized += 1;
      }
    }
    return counts;
  }, [entryMap, activeLanguage]);

  function storageLanguage(field: SiteContentFieldMeta, languageCode: string) {
    return field.shared ? 'all' : languageCode;
  }

  function fieldStateKey(field: SiteContentFieldMeta, languageCode: string) {
    return `${storageLanguage(field, languageCode)}:${field.key}`;
  }

  function fieldEntry(field: SiteContentFieldMeta, languageCode: string) {
    return entryMap.get(fieldStateKey(field, languageCode)) || null;
  }

  function defaultTextValue(field: SiteContentFieldMeta, languageCode: string) {
    const lang = field.shared ? 'en' : (languageCode as 'en' | 'ru' | 'zh' | 'id' | 'de' | 'fr');
    const defaultValue = getDefaultSiteContentValue(field.key, lang);
    if (field.valueType === 'json') return JSON.stringify(defaultValue ?? null, null, 2);
    if (typeof defaultValue === 'string') return defaultValue;
    return defaultValue == null ? '' : String(defaultValue);
  }

  function resolveDraftValue(field: SiteContentFieldMeta, languageCode: string) {
    const stateKey = fieldStateKey(field, languageCode);
    if (drafts[stateKey] !== undefined) return drafts[stateKey];

    const entry = fieldEntry(field, languageCode);
    if (!entry) return defaultTextValue(field, languageCode);
    if (field.valueType === 'json') return JSON.stringify(entry.json_value ?? null, null, 2);
    if (field.valueType === 'image' || field.valueType === 'video' || field.valueType === 'file') {
      return entry.value || entry.media_url || defaultTextValue(field, languageCode);
    }
    return entry.value ?? '';
  }

  function setMediaDraft(field: SiteContentFieldMeta, languageCode: string, file: File | null) {
    const stateKey = fieldStateKey(field, languageCode);
    setMediaDrafts((current) => ({ ...current, [stateKey]: file }));
  }

  function setDraftValue(field: SiteContentFieldMeta, languageCode: string, value: string) {
    const stateKey = fieldStateKey(field, languageCode);
    setDrafts((current) => ({ ...current, [stateKey]: value }));
  }

  useEffect(() => {
    if (selectedFieldKey && !previewFields.some((field) => field.key === selectedFieldKey)) {
      setSelectedFieldKey(null);
    }
  }, [previewFields, selectedFieldKey]);

  useEffect(() => {
    if (!selectedFieldKey?.startsWith('app.onboarding')) return;

    const imageMatch = selectedFieldKey.match(/^app\.onboarding([123])Image$/);
    const contentMatch = selectedFieldKey.match(/^app\.onboarding([123])(Title|Sub|Cta)$/);
    const stepMatch = imageMatch || contentMatch;
    if (stepMatch?.[1]) {
      setActiveAppOnboardingStep(Number(stepMatch[1]) as 1 | 2 | 3);
    }
  }, [selectedFieldKey]);

  useEffect(() => {
    if (!previewVariants.some((variant) => variant.key === activePreviewVariant)) {
      setActivePreviewVariant(previewVariants[0]?.key || '');
    }
  }, [activePreviewVariant, previewVariants]);

  const selectedField = useMemo(
    () => previewFields.find((field) => field.key === selectedFieldKey) || null,
    [previewFields, selectedFieldKey],
  );

  const previewUrl = useMemo(() => {
    const route = previewVariants.find((variant) => variant.key === activePreviewVariant)?.route
      || SITE_PREVIEW_ROUTES[activePage]
      || activePageMeta?.route
      || '/';
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(route, base);
    url.searchParams.set('sitePreview', '1');
    url.searchParams.set('previewLocale', activeLanguage);
    url.searchParams.set('previewRev', String(previewReloadKey));
    return `${url.pathname}${url.search}`;
  }, [activeLanguage, activePage, activePageMeta, activePreviewVariant, previewReloadKey, previewVariants]);

  const previewOverrides = useMemo(() => {
    const overrides: Record<string, unknown> = {};

    for (const field of previewFields) {
      const rawValue = resolveDraftValue(field, activeLanguage);
      let nextValue: unknown = rawValue;

      if (field.valueType === 'json') {
        const parsed = parsePreviewJson(rawValue);
        nextValue = rawValue.trim() ? parsed : null;
      }

      setPreviewValue(overrides, field.key, nextValue);
    }

    return overrides;
  }, [previewFields, drafts, entries, activeLanguage]);

  const comparableValuesForField = useCallback((field: SiteContentFieldMeta) => {
    if (field.valueType === 'json') {
      const values = [resolveDraftValue(field, activeLanguage), defaultTextValue(field, activeLanguage)];
      const strings: string[] = [];
      for (const rawValue of values) {
        const parsed = parsePreviewJson(rawValue);
        collectPreviewStrings(parsed, strings);
      }
      return Array.from(new Set(strings.map((value) => normalizePreviewText(value)).filter(Boolean)));
    }
    if (!['text', 'textarea'].includes(field.valueType)) return [] as string[];
    const values = [resolveDraftValue(field, activeLanguage), defaultTextValue(field, activeLanguage)];
    return Array.from(new Set(values.map((value) => normalizePreviewText(value)).filter(Boolean)));
  }, [drafts, entries, activeLanguage]);

  const pushPreviewOverrides = useCallback(() => {
    const frame = previewFrameRef.current;
    const target = frame?.contentWindow;
    if (!target || typeof window === 'undefined') return;
    target.postMessage({ type: 'br-preview-overrides', payload: previewOverrides }, window.location.origin);
  }, [previewOverrides]);

  const resolveFieldFromElement = useCallback((element: HTMLElement | null) => {
    if (!element) return null;

    const candidates = getPreviewTextCandidates(element);
    if (!candidates.length) return null;

    let bestMatch: { fieldKey: string; score: number } | null = null;

    for (const field of previewSelectableFields) {
      const variants = comparableValuesForField(field);
      if (!variants.length) continue;

      for (const candidate of candidates) {
        for (const variant of variants) {
          const score = scorePreviewTextMatch(candidate, variant);

          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { fieldKey: field.key, score };
          }
        }
      }
    }

    return bestMatch && bestMatch.score > 0 ? bestMatch.fieldKey : null;
  }, [comparableValuesForField, previewSelectableFields]);

  const clearPreviewHighlights = useCallback(() => {
    const doc = previewFrameRef.current?.contentDocument;
    if (!doc) return;

    doc.querySelectorAll('[data-admin-preview-field-key], [data-site-content-key]').forEach((node) => {
      const element = node as HTMLElement;
      element.style.outline = '';
      element.style.outlineOffset = '';
      element.style.boxShadow = '';
      element.style.borderRadius = '';
      element.style.backgroundColor = '';
    });
  }, []);

  const highlightPreviewSelection = useCallback(() => {
    const doc = previewFrameRef.current?.contentDocument;
    if (!doc) return;

    clearPreviewHighlights();

    if (!selectedField) return;

    doc.querySelectorAll(`[data-admin-preview-field-key="${selectedField.key}"], [data-site-content-key="${selectedField.key}"]`).forEach((node) => {
      const element = node as HTMLElement;
      element.style.outline = `2px solid ${A.gold}`;
      element.style.outlineOffset = '4px';
      element.style.boxShadow = '0 0 0 6px rgba(255,215,0,0.18)';
      element.style.borderRadius = '10px';
      element.style.backgroundColor = 'rgba(255,215,0,0.08)';
    });
  }, [clearPreviewHighlights, selectedField]);

  const indexPreviewClickableText = useCallback(() => {
    const doc = previewFrameRef.current?.contentDocument as (Document & {
      __brAdminPreviewClickHandler?: (event: MouseEvent) => void;
    }) | null;
    if (!doc?.body) return;

    doc.querySelectorAll('[data-admin-preview-field-key]').forEach((node) => {
      const element = node as HTMLElement;
      element.removeAttribute('data-admin-preview-field-key');
      element.style.cursor = '';
    });

    doc.querySelectorAll('[data-site-content-key]').forEach((node) => {
      const element = node as HTMLElement;
      const key = element.getAttribute('data-site-content-key');
      if (!key) return;
      element.setAttribute('data-admin-preview-field-key', key);
      element.style.cursor = 'pointer';
    });

    const nodes = Array.from(doc.body.querySelectorAll('*'))
      .filter((node): node is HTMLElement => node instanceof HTMLElement && isPreviewCandidateElement(node));

    for (const node of nodes) {
      if (node.closest('[data-site-content-key]')) continue;
      const fieldKey = resolveFieldFromElement(node);
      if (fieldKey) {
        node.setAttribute('data-admin-preview-field-key', fieldKey);
        node.style.cursor = 'pointer';
      }
    }

    highlightPreviewSelection();
  }, [highlightPreviewSelection, resolveFieldFromElement]);

  const bindPreviewInteractions = useCallback(() => {
    const doc = previewFrameRef.current?.contentDocument as (Document & {
      __brAdminPreviewClickHandler?: (event: MouseEvent) => void;
      __brAdminPreviewObserver?: MutationObserver;
      __brAdminPreviewReindexTimer?: number;
    }) | null;
    if (!doc) return;

    let styleTag = doc.getElementById('br-admin-preview-style') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = doc.createElement('style');
      styleTag.id = 'br-admin-preview-style';
      styleTag.textContent = `
        html, body { cursor: crosshair !important; }
        [data-admin-preview-field-key] {
          position: relative;
          transition: outline-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
        }
        [data-admin-preview-field-key]:hover {
          outline: 2px solid rgba(255,215,0,0.7);
          outline-offset: 4px;
          box-shadow: 0 0 0 4px rgba(255,215,0,0.12);
          border-radius: 10px;
          background-color: rgba(255,215,0,0.06);
        }
        a, button, input, textarea, h1, h2, h3, h4, h5, h6, p, span, li, label {
          transition: outline-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
        }
      `;
      doc.head.appendChild(styleTag);
    }

    if (doc.__brAdminPreviewClickHandler) {
      doc.removeEventListener('click', doc.__brAdminPreviewClickHandler, true);
    }
    if (doc.__brAdminPreviewObserver) {
      doc.__brAdminPreviewObserver.disconnect();
    }
    if (doc.__brAdminPreviewReindexTimer) {
      window.clearTimeout(doc.__brAdminPreviewReindexTimer);
    }

    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const element = target.closest('[data-admin-preview-field-key]') as HTMLElement | null;
      const blockNavigation = target.closest('a, button, input, textarea');
      if (blockNavigation) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (element) {
        event.preventDefault();
        event.stopPropagation();
        setSelectedFieldKey(element.getAttribute('data-admin-preview-field-key'));
        return;
      }

      const fallbackTarget = target.closest('*') as HTMLElement | null;
      const fallbackFieldKey = resolveFieldFromElement(fallbackTarget);
      if (fallbackFieldKey) {
        event.preventDefault();
        event.stopPropagation();
        setSelectedFieldKey(fallbackFieldKey);
      }
    };

    doc.__brAdminPreviewClickHandler = handler;
    doc.addEventListener('click', handler, true);

    doc.__brAdminPreviewObserver = new MutationObserver(() => {
      if (doc.__brAdminPreviewReindexTimer) {
        window.clearTimeout(doc.__brAdminPreviewReindexTimer);
      }
      doc.__brAdminPreviewReindexTimer = window.setTimeout(() => {
        indexPreviewClickableText();
      }, 120);
    });
    doc.__brAdminPreviewObserver.observe(doc.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    indexPreviewClickableText();
  }, [indexPreviewClickableText, resolveFieldFromElement]);

  useEffect(() => {
    pushPreviewOverrides();
    if (typeof window === 'undefined') return undefined;
    const timeout = window.setTimeout(() => {
      indexPreviewClickableText();
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [pushPreviewOverrides, indexPreviewClickableText]);

  useEffect(() => {
    bindPreviewInteractions();
  }, [bindPreviewInteractions, previewUrl]);

  useEffect(() => {
    highlightPreviewSelection();
  }, [highlightPreviewSelection, selectedField, previewOverrides]);

  async function persistField(field: SiteContentFieldMeta, languageCode: string) {
    const language = storageLanguage(field, languageCode);
    const existing = fieldEntry(field, languageCode);
    const draftValue = resolveDraftValue(field, languageCode);
    const stateKey = fieldStateKey(field, languageCode);
    const mediaDraft = mediaDrafts[stateKey];
    let body: FormData | {
      key: string;
      language: string;
      value_type: typeof field.valueType;
      value: string;
      json_value?: unknown;
      is_active: boolean;
    };

    if (mediaDraft && (field.valueType === 'image' || field.valueType === 'video' || field.valueType === 'file')) {
      const formData = new FormData();
      formData.append('key', field.key);
      formData.append('language', language);
      formData.append('value_type', field.valueType);
      formData.append('value', '');
      formData.append('is_active', 'true');
      formData.append('media', mediaDraft);
      body = formData;
    } else if (field.valueType === 'json') {
      body = {
        key: field.key,
        language,
        value_type: field.valueType,
        value: '',
        json_value: draftValue.trim() ? JSON.parse(draftValue) : null,
        is_active: true,
      };
    } else {
      body = {
        key: field.key,
        language,
        value_type: field.valueType,
        value: draftValue,
        is_active: true,
      };
    }

    const saved = existing
      ? await endpoints.adminUpdateSiteContent(existing.id, body)
      : await endpoints.adminCreateSiteContent(body);
    setEntries((current) => {
      const next = current.filter((item) => item.id !== saved.id);
      next.push(saved);
      return next.sort((a, b) => `${a.key}:${a.language}`.localeCompare(`${b.key}:${b.language}`));
    });
    setMediaDrafts((current) => {
      if (!current[stateKey]) return current;
      const next = { ...current };
      delete next[stateKey];
      return next;
    });
  }

  async function saveFieldLanguage(field: SiteContentFieldMeta, languageCode: string) {
    const stateKey = fieldStateKey(field, languageCode);
    setSavingKey(stateKey);
    setError(null);
    try {
      await persistField(field, languageCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save content');
    } finally {
      setSavingKey(null);
    }
  }

  async function saveSelectedFieldAll() {
    if (!selectedField) return;
    const languages = selectedField.shared ? ['all'] : SITE_CONTENT_LANGUAGES.map((lang) => lang.code);
    setSavingKey(`bulk:${selectedField.key}`);
    setError(null);
    try {
      for (const languageCode of languages) {
        await persistField(selectedField, languageCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save content');
    } finally {
      setSavingKey(null);
    }
  }

  async function resetFieldLanguage(field: SiteContentFieldMeta, languageCode: string) {
    const stateKey = fieldStateKey(field, languageCode);
    const existing = fieldEntry(field, languageCode);
    if (!existing) {
      setDrafts((current) => {
        const next = { ...current };
        delete next[stateKey];
        return next;
      });
      setMediaDrafts((current) => {
        const next = { ...current };
        delete next[stateKey];
        return next;
      });
      return;
    }

    setSavingKey(stateKey);
    setError(null);
    try {
      await endpoints.adminDeleteSiteContent(existing.id);
      setEntries((current) => current.filter((item) => item.id !== existing.id));
      setDrafts((current) => {
        const next = { ...current };
        delete next[stateKey];
        return next;
      });
      setMediaDrafts((current) => {
        const next = { ...current };
        delete next[stateKey];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset content');
    } finally {
      setSavingKey(null);
    }
  }

  async function resetSelectedFieldAll() {
    if (!selectedField) return;
    const languages = selectedField.shared ? ['all'] : SITE_CONTENT_LANGUAGES.map((lang) => lang.code);
    setSavingKey(`reset:${selectedField.key}`);
    setError(null);
    try {
      for (const languageCode of languages) {
        const existing = fieldEntry(selectedField, languageCode);
        const stateKey = fieldStateKey(selectedField, languageCode);
        if (existing) {
          await endpoints.adminDeleteSiteContent(existing.id);
          setEntries((current) => current.filter((item) => item.id !== existing.id));
        }
        setDrafts((current) => {
          const next = { ...current };
          delete next[stateKey];
          return next;
        });
        setMediaDrafts((current) => {
          const next = { ...current };
          delete next[stateKey];
          return next;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset content');
    } finally {
      setSavingKey(null);
    }
  }

  const editorLanguages = selectedField?.shared
    ? [{ code: 'all', name: 'Shared content', flag: 'ALL' }]
    : SITE_CONTENT_LANGUAGES.map((lang) => ({ code: lang.code, name: lang.name, flag: lang.flag }));

  const selectionBusy = selectedField
    ? Boolean(savingKey && (savingKey.includes(selectedField.key) || savingKey === `bulk:${selectedField.key}` || savingKey === `reset:${selectedField.key}`))
    : false;

  function resolveAppPreviewValue(fieldKey: string) {
    const field = pageFieldMap.get(fieldKey);
    if (!field) return fieldKey.replace(/^app\./, '');
    return resolveDraftValue(field, activeLanguage);
  }

  function resolveAppPreviewMediaValue(fieldKey: string) {
    const field = pageFieldMap.get(fieldKey);
    if (!field) return '';
    return resolveDraftValue(field, activeLanguage);
  }

  const onboardingFieldGroups = useMemo(() => {
    const order = ['Image', 'Title', 'Sub', 'Cta'];
    const groups = [
      { key: 'shared', title: 'Shared', subtitle: 'Badge shown above every onboarding slide', fields: [] as SiteContentFieldMeta[] },
      { key: 'slide-1', title: 'Slide 1', subtitle: 'First screen users see after language selection', fields: [] as SiteContentFieldMeta[] },
      { key: 'slide-2', title: 'Slide 2', subtitle: 'Dates, delivery, and add-ons message', fields: [] as SiteContentFieldMeta[] },
      { key: 'slide-3', title: 'Slide 3', subtitle: 'Bookings, updates, and support message', fields: [] as SiteContentFieldMeta[] },
    ];
    const byKey = new Map(groups.map((group) => [group.key, group]));

    for (const field of pageFields) {
      const match = field.key.match(/^app\.onboarding([123])/);
      const group = match ? byKey.get(`slide-${match[1]}`) : byKey.get('shared');
      group?.fields.push(field);
    }

    return groups
      .map((group) => ({
        ...group,
        fields: group.fields.sort((left, right) => {
          const leftTail = getSiteFieldTail(left.key).replace(/^onboarding[123]/, '');
          const rightTail = getSiteFieldTail(right.key).replace(/^onboarding[123]/, '');
          const leftIndex = order.indexOf(leftTail);
          const rightIndex = order.indexOf(rightTail);
          return (leftIndex >= 0 ? leftIndex : 99) - (rightIndex >= 0 ? rightIndex : 99);
        }),
      }))
      .filter((group) => group.fields.length > 0);
  }, [pageFields]);

  if (lockedPage === 'app') {
    return (
      <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? 16 : '28px 32px' }}>
        <SectionHeader
          title="App Onboarding"
          subtitle="Edit only the mobile app onboarding with the same 3-slide flow, images, and languages as the real app."
          action={<Button variant="outline" size="md" onClick={load}>Reload</Button>}
        />

        <ErrorBanner error={error} onClose={() => setError(null)} />

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(340px, 0.95fr) minmax(260px, 0.7fr) minmax(0, 1.2fr)', gap: 16, alignItems: 'start' }}>
          <Panel style={{ padding: isMobile ? 16 : 20, position: isMobile ? 'static' : 'sticky', top: 20 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Onboarding preview
                </div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, color: A.black, marginBottom: 8 }}>
                  Same layout as the app
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                  The phone preview follows the onboarding screen from the mobile app and updates instantly with your draft text and image changes.
                </div>
              </div>
              <AppContentPhonePreview
                activeOnboardingStep={activeAppOnboardingStep}
                activeLanguage={activeLanguage}
                selectedFieldKey={selectedFieldKey}
                getValue={resolveAppPreviewValue}
                getMediaValue={resolveAppPreviewMediaValue}
                onSelectField={setSelectedFieldKey}
                onSelectOnboardingStep={setActiveAppOnboardingStep}
              />
            </div>
          </Panel>

          <Panel style={{ padding: isMobile ? 16 : 20, position: isMobile ? 'static' : 'sticky', top: 20 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Onboarding fields
                </div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, color: A.black, marginBottom: 8 }}>
                  {`${pageFields.length} editable fields`}
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                  Only onboarding content is shown here. These values are saved as <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>app.onboarding*</span> entries and are loaded by the app from the public bootstrap API.
                </div>
              </div>

              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Preview language
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SITE_CONTENT_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setActiveLanguage(lang.code)}
                      style={{
                        borderRadius: 999,
                        border: `1px solid ${activeLanguage === lang.code ? A.black : A.g200}`,
                        background: activeLanguage === lang.code ? A.black : A.white,
                        color: activeLanguage === lang.code ? A.white : A.black,
                        cursor: 'pointer',
                        padding: '8px 12px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 13,
                        fontWeight: activeLanguage === lang.code ? 700 : 500,
                      }}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <EmptyState label="Loading site content…" />
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {onboardingFieldGroups.map((group) => (
                    <div key={group.key} style={{ display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-end' }}>
                        <div>
                          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 800, color: A.black }}>
                            {group.title}
                          </div>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: A.g500, lineHeight: 1.45 }}>
                            {group.subtitle}
                          </div>
                        </div>
                        <Badge color={group.key === `slide-${activeAppOnboardingStep}` ? 'gold' : 'default'}>
                          {group.fields.length}
                        </Badge>
                      </div>
                      <div style={{ display: 'grid', gap: 7 }}>
                        {group.fields.map((field) => {
                          const selected = selectedFieldKey === field.key;
                          const customizedCount = field.shared
                            ? (fieldEntry(field, activeLanguage) ? 1 : 0)
                            : SITE_CONTENT_LANGUAGES.reduce((count, lang) => count + (fieldEntry(field, lang.code) ? 1 : 0), 0);
                          const tail = getSiteFieldTail(field.key).replace(/^onboarding[123]/, '');
                          const label = tail === 'Sub' ? 'Description' : tail === 'Cta' ? 'Button' : tail || field.label;
                          return (
                            <button
                              key={field.key}
                              type="button"
                              onClick={() => setSelectedFieldKey(field.key)}
                              style={{
                                textAlign: 'left',
                                borderRadius: 8,
                                border: `1px solid ${selected ? A.gold : A.g200}`,
                                background: selected ? 'rgba(255,215,0,0.12)' : A.white,
                                padding: '10px 12px',
                                cursor: 'pointer',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 800, color: A.black }}>
                                  {label}
                                </div>
                                <Badge color={customizedCount ? 'green' : 'default'}>
                                  {field.shared ? 'shared' : `${customizedCount}/6`}
                                </Badge>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          {!selectedField ? (
            <Panel style={{ padding: isMobile ? 16 : 20 }}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Click To Edit
                </div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 24, color: A.black }}>
                  Choose an onboarding field
                </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500, lineHeight: 1.65 }}>
                  Select an onboarding field on the left, then edit it here for every language with the live phone preview beside it.
                </div>
              </div>
            </Panel>
          ) : (
            <Panel style={{ padding: isMobile ? 16 : 20 }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                      Selected app field
                    </div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 24, color: A.black, marginBottom: 6 }}>
                      {selectedField.label}
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                      App Onboarding / {getSiteFieldElementLabel(selectedField)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button variant="outline" onClick={resetSelectedFieldAll} disabled={selectionBusy}>
                      Reset field
                    </Button>
                    <Button variant="dark" onClick={saveSelectedFieldAll} disabled={selectionBusy}>
                      {selectionBusy ? 'Saving…' : 'Save all languages'}
                    </Button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Badge color="blue">{selectedField.shared ? 'shared media' : 'localized content'}</Badge>
                  <Badge color="default">{selectedField.key}</Badge>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Previewed right now
                  </div>
                  <div style={{ border: `1px solid ${A.g200}`, borderRadius: 16, background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(247,247,248,1) 100%)', padding: 16 }}>
                    <SiteContentValuePreview
                      field={selectedField}
                      value={resolveDraftValue(selectedField, activeLanguage)}
                      mediaPreviewUrl={resolveDraftValue(selectedField, activeLanguage)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  {editorLanguages.map((lang) => {
                    const draftValue = resolveDraftValue(selectedField, lang.code);
                    const defaultValue = defaultTextValue(selectedField, lang.code === 'all' ? activeLanguage : lang.code);
                    const currentEntry = fieldEntry(selectedField, lang.code);
                    const busy = savingKey === fieldStateKey(selectedField, lang.code) || savingKey === `bulk:${selectedField.key}` || savingKey === `reset:${selectedField.key}`;

                    return (
                      <div key={lang.code} style={{ border: `1px solid ${A.g200}`, borderRadius: 16, padding: 14, background: A.white }}>
                        <div style={{ display: 'grid', gap: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, color: A.black }}>
                                  {lang.name}
                                </div>
                                <Badge color={currentEntry ? 'green' : 'default'}>
                                  {currentEntry ? 'custom' : 'default'}
                                </Badge>
                              </div>
                              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                                {lang.code === activeLanguage ? 'This language is shown in the preview above.' : 'Edit here even if another language is open in preview.'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <Button variant="ghost" onClick={() => setActiveLanguage(lang.code)} disabled={busy}>
                                Preview this language
                              </Button>
                              <Button variant="outline" onClick={() => resetFieldLanguage(selectedField, lang.code)} disabled={busy}>
                                Reset
                              </Button>
                              <Button variant="dark" onClick={() => saveFieldLanguage(selectedField, lang.code)} disabled={busy}>
                                {busy ? 'Saving…' : 'Save'}
                              </Button>
                            </div>
                          </div>

                          <Field label={selectedField.valueType === 'image' ? 'Image' : selectedField.valueType === 'video' ? 'Video' : selectedField.valueType === 'file' ? 'File' : 'Text'}>
                            {selectedField.valueType === 'image' || selectedField.valueType === 'video' || selectedField.valueType === 'file' ? (
                              <div style={{ display: 'grid', gap: 12 }}>
                                <SiteContentValuePreview
                                  field={selectedField}
                                  value={draftValue}
                                  mediaPreviewUrl={draftValue}
                                  compact
                                />
                                <input
                                  type="file"
                                  accept={selectedField.valueType === 'image' ? 'image/*' : selectedField.valueType === 'video' ? 'video/*' : '*'}
                                  style={{ ...inputStyle, padding: '8px 12px' }}
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    setMediaDraft(selectedField, lang.code, file);
                                    setDraftValue(selectedField, lang.code, file ? URL.createObjectURL(file) : (currentEntry?.media_url || currentEntry?.value || defaultValue || ''));
                                  }}
                                />
                                <input
                                  value={draftValue}
                                  onChange={(event) => {
                                    setMediaDraft(selectedField, lang.code, null);
                                    setDraftValue(selectedField, lang.code, event.target.value);
                                  }}
                                  style={inputStyle}
                                  placeholder="Or paste an external media URL"
                                />
                              </div>
                            ) : selectedField.valueType === 'textarea' ? (
                              <textarea
                                value={draftValue}
                                onChange={(event) => setDraftValue(selectedField, lang.code, event.target.value)}
                                style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                              />
                            ) : (
                              <input
                                value={draftValue}
                                onChange={(event) => setDraftValue(selectedField, lang.code, event.target.value)}
                                style={inputStyle}
                              />
                            )}
                          </Field>

                          <div style={{ display: 'grid', gap: 6 }}>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              Default value
                            </div>
                            <div style={{
                              background: A.g100,
                              border: `1px solid ${A.g200}`,
                              borderRadius: 10,
                              padding: '10px 12px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 12,
                              color: A.g700,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}>
                              {defaultValue || '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? 16 : '28px 32px' }}>
      <SectionHeader
        title="Site Content"
        subtitle="Choose a page, click text on the site preview, and edit that copy across languages."
        action={<Button variant="outline" size="md" onClick={load}>Reload</Button>}
      />

      <ErrorBanner error={error} onClose={() => setError(null)} />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.45fr) minmax(320px, 0.9fr)', gap: 16, marginBottom: 16 }}>
        <Panel style={{ padding: isMobile ? 16 : 20 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Pages
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {SITE_CONTENT_PAGES.filter((page) => !lockedPage || page.key === lockedPage).map((page) => {
                  const stats = pageCounts.get(page.key) || { total: 0, customized: 0, clickable: 0 };
                  const selected = activePage === page.key;
                  return (
                    <button
                      key={page.key}
                      type="button"
                      onClick={() => {
                        setActivePage(page.key);
                        setSelectedFieldKey(null);
                      }}
                      style={{
                        textAlign: 'left',
                        borderRadius: 16,
                        border: `1px solid ${selected ? A.gold : A.g200}`,
                        background: selected ? 'linear-gradient(180deg, rgba(255,215,0,0.14) 0%, rgba(255,215,0,0.06) 100%)' : A.white,
                        padding: '16px 16px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 16, color: A.black }}>
                          {page.label}
                        </div>
                        <Badge color={selected ? 'gold' : 'default'}>{stats.clickable} clickable</Badge>
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, lineHeight: 1.55, minHeight: 56 }}>
                        {page.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Preview language
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SITE_CONTENT_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setActiveLanguage(lang.code)}
                    style={{
                      borderRadius: 999,
                      border: `1px solid ${activeLanguage === lang.code ? A.black : A.g200}`,
                      background: activeLanguage === lang.code ? A.black : A.white,
                      color: activeLanguage === lang.code ? A.white : A.black,
                      cursor: 'pointer',
                      padding: '8px 12px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      fontWeight: activeLanguage === lang.code ? 700 : 500,
                    }}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {previewVariants.length > 1 ? (
              <div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Preview screen
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {previewVariants.map((variant) => (
                    <button
                      key={variant.key}
                      type="button"
                      onClick={() => setActivePreviewVariant(variant.key)}
                      style={{
                        borderRadius: 999,
                        border: `1px solid ${activePreviewVariant === variant.key ? A.black : A.g200}`,
                        background: activePreviewVariant === variant.key ? A.black : A.white,
                        color: activePreviewVariant === variant.key ? A.white : A.black,
                        cursor: 'pointer',
                        padding: '8px 12px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 13,
                        fontWeight: activePreviewVariant === variant.key ? 700 : 500,
                      }}
                    >
                      {variant.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel style={{ padding: isMobile ? 16 : 20 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Selected Page
              </div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 20, color: A.black, marginBottom: 8 }}>
                {activePageMeta?.label}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                {activePageMeta?.description}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge color="blue">{`${previewSelectableFields.length} clickable content fields`}</Badge>
              <Badge color="green">{`${pageFields.length} total content entries`}</Badge>
              <Badge color="orange">Preview: {activeLanguage.toUpperCase()}</Badge>
            </div>

            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
              Click highlighted text on the live page preview to open its editor. The editor shows every language at once, so content managers do not need to hunt through long field lists.
            </div>

            <div style={{ borderTop: `1px solid ${A.g200}`, paddingTop: 14 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Quick Shortcuts
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <Link href="/admin?view=fleet" style={{ textDecoration: 'none' }}>
                  <div style={{ border: `1px solid ${A.g200}`, borderRadius: 12, padding: '10px 12px', color: A.black }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13 }}>Scooter pages</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>Titles, specs, gallery, translations and photos of each bike.</div>
                  </div>
                </Link>
                <Link href="/admin?view=locations" style={{ textDecoration: 'none' }}>
                  <div style={{ border: `1px solid ${A.g200}`, borderRadius: 12, padding: '10px 12px', color: A.black }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13 }}>Locations page</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>Delivery zones, translated zone names and location section copy.</div>
                  </div>
                </Link>
                <Link href="/admin/faq" style={{ textDecoration: 'none' }}>
                  <div style={{ border: `1px solid ${A.g200}`, borderRadius: 12, padding: '10px 12px', color: A.black }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13 }}>FAQ section</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>Questions and answers on all languages.</div>
                  </div>
                </Link>
                <Link href="/admin?view=news" style={{ textDecoration: 'none' }}>
                  <div style={{ border: `1px solid ${A.g200}`, borderRadius: 12, padding: '10px 12px', color: A.black }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13 }}>News articles</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>Actual articles and images for the news page.</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {loading ? (
        <EmptyState label="Loading site content…" />
      ) : previewSelectableFields.length === 0 ? (
        <EmptyState label="No clickable content fields found for this page." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.4fr) minmax(340px, 0.8fr)', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 16, position: isMobile ? 'static' : 'sticky', top: 20 }}>
            <Panel style={{ padding: isMobile ? 16 : 20 }}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                        Live site preview
                    </div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 22, color: A.black, marginBottom: 6 }}>
                      Real page inside admin
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                      The page below uses the selected language and receives your draft content live. Click visible text on the preview to jump to the matching field.
                    </div>
                  </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button variant="outline" onClick={() => setPreviewReloadKey((current) => current + 1)}>
                        <RefreshIcon size={14} />
                        Reload preview
                    </Button>
                    <a href={previewUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <Button variant="dark">
                        Open page
                      </Button>
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Badge color="blue">{activePageMeta?.label}</Badge>
                  <Badge color="orange">{activeLanguage.toUpperCase()}</Badge>
                  <Badge color="green">{`${previewSelectableFields.length} clickable texts`}</Badge>
                </div>

                <div style={{ border: `1px solid ${A.g200}`, borderRadius: 18, overflow: 'hidden', background: A.white }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${A.g200}`, background: A.g100 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: '#ff5f57', display: 'inline-block' }} />
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: '#febc2e', display: 'inline-block' }} />
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: '#28c840', display: 'inline-block' }} />
                    </div>
                    <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11, color: A.g500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {previewUrl}
                    </div>
                  </div>
                  <iframe
                    key={previewUrl}
                    ref={previewFrameRef}
                    src={previewUrl}
                    title="Site preview"
                    onLoad={() => {
                      pushPreviewOverrides();
                      bindPreviewInteractions();
                    }}
                    style={{
                      width: '100%',
                      height: isMobile ? 520 : 620,
                      border: 'none',
                      display: 'block',
                        background: A.white,
                      }}
                  />
                </div>
              </div>
            </Panel>
          </div>

          <div style={{ display: 'grid', gap: 16, position: isMobile ? 'static' : 'sticky', top: 20 }}>
            {!selectedField ? (
              <Panel style={{ padding: isMobile ? 16 : 20 }}>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Click To Edit
                  </div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 24, color: A.black }}>
                    Choose text directly on the site
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: A.g500, lineHeight: 1.65 }}>
                    Pick a page on top, look at the real site preview, then click any highlighted text. The editor for that specific copy will open here with all languages.
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Badge color="blue">{activePageMeta?.label}</Badge>
                    <Badge color="green">{`${previewSelectableFields.length} text elements ready`}</Badge>
                    <Badge color="orange">{`Preview in ${activeLanguage.toUpperCase()}`}</Badge>
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel style={{ padding: isMobile ? 16 : 20 }}>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                        Selected text
                      </div>
                      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 24, color: A.black, marginBottom: 6 }}>
                        {selectedField.label}
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
                        {selectedField.pageLabel} / {selectedField.sectionLabel} / {getSiteFieldElementLabel(selectedField)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button variant="outline" onClick={() => setSelectedFieldKey(null)} disabled={selectionBusy}>
                        Close
                      </Button>
                      <Button variant="outline" onClick={resetSelectedFieldAll} disabled={selectionBusy}>
                        Reset field
                      </Button>
                      <Button variant="dark" onClick={saveSelectedFieldAll} disabled={selectionBusy}>
                        {selectionBusy ? 'Saving…' : 'Save all languages'}
                      </Button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Badge color={selectedField.shared ? 'orange' : 'blue'}>
                      {selectedField.shared ? 'shared across all languages' : 'localized text'}
                    </Badge>
                    <Badge color="default">{selectedField.key}</Badge>
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Previewed right now
                    </div>
                    <div style={{ border: `1px solid ${A.g200}`, borderRadius: 16, background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(247,247,248,1) 100%)', padding: 16 }}>
                      <SiteContentValuePreview
                        field={selectedField}
                        value={resolveDraftValue(selectedField, activeLanguage)}
                      />
                    </div>
                  </div>

                  {selectedField.valueType === 'json' ? (
                    <div style={{ border: `1px solid ${A.g200}`, borderRadius: 12, padding: '12px 14px', background: A.g100, fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700, lineHeight: 1.6 }}>
                      This content block is stored as structured JSON. Clicking a small text from lists, cards, benefits, steps, or FAQ often opens this kind of field.
                    </div>
                  ) : null}

                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Where this appears
                    </div>
                    <div style={{
                      border: `1px solid ${A.g200}`,
                      borderRadius: 12,
                      padding: '12px 14px',
                      background: A.g100,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      color: A.black,
                      lineHeight: 1.6,
                    }}>
                      {getSiteFieldHint(selectedField)}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 12 }}>
                    {editorLanguages.map((lang) => {
                      const draftValue = resolveDraftValue(selectedField, lang.code);
                      const defaultValue = defaultTextValue(selectedField, lang.code === 'all' ? activeLanguage : lang.code);
                      const currentEntry = fieldEntry(selectedField, lang.code);
                      const busy = savingKey === fieldStateKey(selectedField, lang.code) || savingKey === `bulk:${selectedField.key}` || savingKey === `reset:${selectedField.key}`;

                      return (
                        <div key={lang.code} style={{ border: `1px solid ${A.g200}`, borderRadius: 16, padding: 14, background: A.white }}>
                          <div style={{ display: 'grid', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                  <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17, color: A.black }}>
                                    {lang.name}
                                  </div>
                                  <Badge color={currentEntry ? 'green' : 'default'}>
                                    {currentEntry ? 'custom' : 'default'}
                                  </Badge>
                                </div>
                                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                                  {lang.code === activeLanguage ? 'This language is shown in the live preview.' : 'Edit here even if another language is open in preview.'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {!selectedField.shared ? (
                                  <Button variant="ghost" onClick={() => setActiveLanguage(lang.code)} disabled={busy}>
                                    Preview this language
                                  </Button>
                                ) : null}
                                <Button variant="outline" onClick={() => resetFieldLanguage(selectedField, lang.code)} disabled={busy}>
                                  Reset
                                </Button>
                                <Button variant="dark" onClick={() => saveFieldLanguage(selectedField, lang.code)} disabled={busy}>
                                  {busy ? 'Saving…' : 'Save'}
                                </Button>
                              </div>
                            </div>

                            <Field label="Text">
                              {selectedField.valueType === 'json' ? (
                                <textarea
                                  value={draftValue}
                                  onChange={(event) => setDraftValue(selectedField, lang.code, event.target.value)}
                                  style={{ ...inputStyle, minHeight: 220, resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                                />
                              ) : selectedField.valueType === 'textarea' ? (
                                <textarea
                                  value={draftValue}
                                  onChange={(event) => setDraftValue(selectedField, lang.code, event.target.value)}
                                  style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                                />
                              ) : (
                                <input
                                  value={draftValue}
                                  onChange={(event) => setDraftValue(selectedField, lang.code, event.target.value)}
                                  style={inputStyle}
                                />
                              )}
                            </Field>

                            <div style={{ display: 'grid', gap: 6 }}>
                              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                Default value
                              </div>
                              <div style={{
                                background: A.g100,
                                border: `1px solid ${A.g200}`,
                                borderRadius: 10,
                                padding: '10px 12px',
                                fontFamily: selectedField.valueType === 'json' ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'Inter, sans-serif',
                                fontSize: 12,
                                color: A.g700,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}>
                                {defaultValue || '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPasswordPanel({
  currentUser,
  onSubmit,
  submitting,
}: {
  currentUser: ApiUser | null;
  onSubmit: (payload: { current_password: string; new_password: string }) => Promise<void>;
  submitting: boolean;
}) {
  const [draft, setDraft] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  return (
    <Panel style={{ padding: 20 }}>
      <SectionHeader
        title="Account Security"
        subtitle="Change your own admin password here. Your current password is required for confirmation."
        action={currentUser?.email ? <Badge color="default">{currentUser.email}</Badge> : null}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        <input
          type="password"
          value={draft.current_password}
          onChange={(event) => setDraft((current) => ({ ...current, current_password: event.target.value }))}
          placeholder="Current password"
          style={inputBaseStyle}
        />
        <input
          type="password"
          value={draft.new_password}
          onChange={(event) => setDraft((current) => ({ ...current, new_password: event.target.value }))}
          placeholder="New password"
          style={inputBaseStyle}
        />
        <input
          type="password"
          value={draft.confirm_password}
          onChange={(event) => setDraft((current) => ({ ...current, confirm_password: event.target.value }))}
          placeholder="Confirm new password"
          style={inputBaseStyle}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 14 }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
          Use at least one strong password with letters, numbers, and symbols.
        </div>
        <Button
          variant="dark"
          disabled={submitting}
          onClick={async () => {
            const currentPassword = draft.current_password.trim();
            const newPassword = draft.new_password.trim();
            const confirmPassword = draft.confirm_password.trim();

            if (!currentPassword || !newPassword || !confirmPassword) {
              setStatus({ tone: 'error', message: 'Fill in the current password, new password, and confirmation.' });
              return;
            }
            if (newPassword !== confirmPassword) {
              setStatus({ tone: 'error', message: 'The new password and confirmation do not match.' });
              return;
            }

            try {
              await onSubmit({ current_password: currentPassword, new_password: newPassword });
              setDraft({ current_password: '', new_password: '', confirm_password: '' });
              setStatus({ tone: 'success', message: 'Your password was updated successfully.' });
            } catch (err) {
              setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Unable to change your password.' });
            }
          }}
        >
          {submitting ? 'Saving…' : 'Change password'}
        </Button>
      </div>
      {status ? <div style={{ marginTop: 14 }}><InlineStatus message={status.message} tone={status.tone} /></div> : null}
    </Panel>
  );
}

function TeamAccessPanel({
  users,
  currentUser,
  onCreateAdminUser,
  onDeleteAdminUser,
  onSetTeamUserPassword,
  savingAdminUser,
  deletingAdminUserId,
  settingTeamPasswordId,
  canManageTeam = true,
  isMobile,
}: {
  users: ApiAdminUser[];
  currentUser: ApiUser | null;
  onCreateAdminUser: (payload: { email: string; full_name?: string; phone?: string; password: string; role: string; admin_permissions: AdminPermission[] }) => Promise<void>;
  onDeleteAdminUser: (userId: number) => Promise<void>;
  onSetTeamUserPassword: (userId: number, newPassword: string) => Promise<void>;
  savingAdminUser: boolean;
  deletingAdminUserId: number | null;
  settingTeamPasswordId: number | null;
  canManageTeam?: boolean;
  isMobile: boolean;
}) {
  const [adminDraft, setAdminDraft] = useState<{ email: string; full_name: string; phone: string; password: string; role: string; admin_permissions: AdminPermission[] }>({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    role: 'staff',
    admin_permissions: defaultAdminPermissionsForRole('staff'),
  });
  const [teamPasswordDrafts, setTeamPasswordDrafts] = useState<Record<number, string>>({});
  const [teamPasswordStatus, setTeamPasswordStatus] = useState<Record<number, { tone: 'success' | 'error'; message: string }>>({});

  const teamUsers = users.filter((item) => ['admin', 'manager', 'staff'].includes((item.role || '').toLowerCase()));

  return (
    <Panel style={{ padding: 20 }}>
      <SectionHeader
        title="Users & Team"
        subtitle="Add admins and staff, then assign exactly which parts of the admin panel they can access."
        action={<Badge color="blue">{teamUsers.length} team members</Badge>}
      />
      {canManageTeam ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr 1fr 1fr 0.8fr auto', gap: 10, alignItems: 'end', marginBottom: 14 }}>
            <input value={adminDraft.email} onChange={(e) => setAdminDraft((current) => ({ ...current, email: e.target.value }))} placeholder="Email" style={inputBaseStyle} />
            <input value={adminDraft.full_name} onChange={(e) => setAdminDraft((current) => ({ ...current, full_name: e.target.value }))} placeholder="Full name" style={inputBaseStyle} />
            <input value={adminDraft.phone} onChange={(e) => setAdminDraft((current) => ({ ...current, phone: e.target.value }))} placeholder="Phone" style={inputBaseStyle} />
            <input type="password" value={adminDraft.password} onChange={(e) => setAdminDraft((current) => ({ ...current, password: e.target.value }))} placeholder="Temporary password" style={inputBaseStyle} />
            <select
              value={adminDraft.role}
              onChange={(e) =>
                setAdminDraft((current) => ({
                  ...current,
                  role: e.target.value,
                  admin_permissions: defaultAdminPermissionsForRole(e.target.value),
                }))
              }
              style={{ ...inputBaseStyle, minHeight: 42 }}
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              variant="dark"
              onClick={async () => {
                if (!adminDraft.email.trim() || !adminDraft.password.trim()) {
                  window.alert('Enter at least email and password.');
                  return;
                }
                try {
                  await onCreateAdminUser(adminDraft);
                  setAdminDraft({ email: '', full_name: '', phone: '', password: '', role: 'staff', admin_permissions: defaultAdminPermissionsForRole('staff') });
                } catch (err) {
                  window.alert(err instanceof Error ? err.message : 'Unable to create the team member.');
                }
              }}
              disabled={savingAdminUser}
            >
              {savingAdminUser ? 'Saving…' : 'Add member'}
            </Button>
          </div>
          <div style={{ marginBottom: 18, borderRadius: 12, border: `1px solid ${A.g200}`, background: A.white, padding: 14 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
              Section permissions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
              {ADMIN_PERMISSION_OPTIONS.map((permission) => {
                const checked = adminDraft.admin_permissions.includes(permission);
                return (
                  <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: checked ? A.g100 : A.white, border: `1px solid ${checked ? A.gold : A.g200}`, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.black }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setAdminDraft((current) => ({
                          ...current,
                          admin_permissions: e.target.checked
                            ? [...current.admin_permissions, permission].filter((value, index, source) => source.indexOf(value) === index)
                            : current.admin_permissions.filter((value) => value !== permission),
                        }))
                      }
                      style={{ width: 15, height: 15 }}
                    />
                    <span>{ADMIN_PERMISSION_LABELS[permission]}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div style={{ marginBottom: 18, borderRadius: 12, border: `1px solid ${A.g200}`, background: A.g100, padding: '14px 16px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
          Your account can view the team list, but only admins with the <strong>Team Access</strong> permission can create or edit team members.
        </div>
      )}
      <div style={{ display: 'grid', gap: 10 }}>
        {teamUsers.map((item) => (
          <div key={item.id} style={{ display: 'grid', gap: 12, padding: '12px 14px', borderRadius: 12, background: A.g100, alignItems: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr 1fr', gap: 10, alignItems: 'start' }}>
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>
                {item.full_name || item.email}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                {item.email}
              </div>
            </div>
            <Badge color={(item.role || '').toLowerCase() === 'admin' ? 'red' : (item.role || '').toLowerCase() === 'manager' ? 'blue' : 'orange'}>
              {item.role || 'staff'}
            </Badge>
            <div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginBottom: 8 }}>
                {normalizeAdminPermissions(item.admin_permissions, item.role, item.is_superuser).length
                  ? 'Assigned sections'
                  : 'No sections assigned'}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {normalizeAdminPermissions(item.admin_permissions, item.role, item.is_superuser).map((permission) => (
                  <Badge key={`${item.id}-${permission}`} color="default">
                    {ADMIN_PERMISSION_LABELS[permission]}
                  </Badge>
                ))}
              </div>
            </div>
            </div>
            {canManageTeam ? (
              currentUser?.id === item.id ? (
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
                  Use the Account Security card on the Overview screen to change your own password.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="danger"
                      disabled={deletingAdminUserId === item.id}
                      onClick={async () => {
                        const confirmed = typeof window === 'undefined'
                          ? false
                          : window.confirm(`Delete team member "${item.full_name || item.email}"? This action cannot be undone.`);
                        if (!confirmed) return;
                        try {
                          await onDeleteAdminUser(item.id);
                        } catch (err) {
                          setTeamPasswordStatus((current) => ({
                            ...current,
                            [item.id]: { tone: 'error', message: err instanceof Error ? err.message : 'Unable to delete the team member.' },
                          }));
                        }
                      }}
                    >
                      {deletingAdminUserId === item.id ? 'Deleting…' : 'Delete member'}
                    </Button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 280px) auto', gap: 10, alignItems: 'center' }}>
                    <input
                      type="password"
                      value={teamPasswordDrafts[item.id] || ''}
                      onChange={(event) =>
                        setTeamPasswordDrafts((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Set a new password"
                      style={inputBaseStyle}
                    />
                    <Button
                      variant="dark"
                      disabled={settingTeamPasswordId === item.id}
                      onClick={async () => {
                        const nextPassword = (teamPasswordDrafts[item.id] || '').trim();
                        if (!nextPassword) {
                          setTeamPasswordStatus((current) => ({
                            ...current,
                            [item.id]: { tone: 'error', message: 'Enter a new password first.' },
                          }));
                          return;
                        }
                        try {
                          await onSetTeamUserPassword(item.id, nextPassword);
                          setTeamPasswordDrafts((current) => ({ ...current, [item.id]: '' }));
                          setTeamPasswordStatus((current) => ({
                            ...current,
                            [item.id]: { tone: 'success', message: 'Password updated successfully.' },
                          }));
                        } catch (err) {
                          setTeamPasswordStatus((current) => ({
                            ...current,
                            [item.id]: { tone: 'error', message: err instanceof Error ? err.message : 'Unable to update the password.' },
                          }));
                        }
                      }}
                    >
                      {settingTeamPasswordId === item.id ? 'Saving…' : 'Update password'}
                    </Button>
                  </div>
                  {teamPasswordStatus[item.id] ? <InlineStatus message={teamPasswordStatus[item.id].message} tone={teamPasswordStatus[item.id].tone} /> : null}
                </div>
              )
            ) : null}
          </div>
        ))}
        {teamUsers.length === 0 ? (
          <div style={{ padding: '18px 16px', borderRadius: 12, background: A.g100, fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>
            No admin or staff users yet.
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function UsersView({
  users,
  currentUser,
  onCreateAdminUser,
  onDeleteAdminUser,
  onSetTeamUserPassword,
  savingAdminUser,
  deletingAdminUserId,
  settingTeamPasswordId,
  isMobile,
}: {
  users: ApiAdminUser[];
  currentUser: ApiUser | null;
  onCreateAdminUser: (payload: { email: string; full_name?: string; phone?: string; password: string; role: string; admin_permissions: AdminPermission[] }) => Promise<void>;
  onDeleteAdminUser: (userId: number) => Promise<void>;
  onSetTeamUserPassword: (userId: number, newPassword: string) => Promise<void>;
  savingAdminUser: boolean;
  deletingAdminUserId: number | null;
  settingTeamPasswordId: number | null;
  isMobile: boolean;
}) {
  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: isMobile ? '16px' : '28px 32px' }}>
      <TeamAccessPanel
        users={users}
        currentUser={currentUser}
        onCreateAdminUser={onCreateAdminUser}
        onDeleteAdminUser={onDeleteAdminUser}
        onSetTeamUserPassword={onSetTeamUserPassword}
        savingAdminUser={savingAdminUser}
        deletingAdminUserId={deletingAdminUserId}
        settingTeamPasswordId={settingTeamPasswordId}
        isMobile={isMobile}
      />
    </div>
  );
}

function OverviewView({
  data,
  currentUser,
  onOpenView,
  onChangeOwnPassword,
  changingOwnPassword,
  canManageTeam,
  isMobile,
}: {
  data: AdminData;
  currentUser: ApiUser | null;
  onOpenView: (view: AdminView) => void;
  onChangeOwnPassword: (payload: { current_password: string; new_password: string }) => Promise<void>;
  changingOwnPassword: boolean;
  canManageTeam: boolean;
  isMobile: boolean;
}) {
  const { bookings, scooters, users, revenue, payments } = data;
  const formatMoney = useAdminMoneyFormatter();

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: isMobile ? 12 : 16 }}>
        <AdminPasswordPanel currentUser={currentUser} onSubmit={onChangeOwnPassword} submitting={changingOwnPassword} />
        <Panel style={{ padding: 20 }}>
          <SectionHeader
            title="Users & Team"
            subtitle="Add admins and staff from a dedicated screen instead of the overview."
            action={<Button variant="dark" onClick={() => onOpenView('users')}>Open Users</Button>}
          />
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.7, color: A.g700 }}>
            {canManageTeam
              ? 'The users screen lets you create team members and assign the exact admin sections they can access.'
              : 'You can see the users screen from the sidebar when your account has Team Access permission.'}
          </div>
        </Panel>
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
  onDeleteScooter,
  isMobile,
}: {
  scooters: ApiScooterDetail[];
  scooterModels: ApiVehicleModel[];
  savingScooterId: number | null;
  savingFleetForm: boolean;
  onPatchScooter: (id: number, payload: Record<string, unknown>) => void;
  onCreateScooter: (payload: AdminScooterPayload) => Promise<void>;
  onDeleteScooter: (scooter: ApiScooterDetail) => Promise<void>;
  isMobile: boolean;
}) {
  const formatMoney = useAdminMoneyFormatter();
  const emptyDraft = useMemo(
    () => ({
      model: '',
      title: '',
      slug: '',
      sku: '',
      color: '',
      base_price_idr: '',
      status: 'available',
      quantity: '1',
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
    if (!draft.model || !draft.title.trim() || !draft.slug.trim() || !draft.sku.trim() || !draft.base_price_idr) {
      window.alert('Fill in required fields: model, title, slug, SKU and price.');
      return;
    }

    await onCreateScooter({
      model: Number(draft.model),
      title: draft.title.trim(),
      slug: draft.slug.trim(),
      sku: draft.sku.trim(),
      color: draft.color.trim(),
      base_price_idr: Number(draft.base_price_idr),
      status: draft.status,
      quantity: Math.max(1, Number(draft.quantity || 1)),
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
                          ? A.white
                          : 'linear-gradient(145deg,#111 0%,#2a2a2a 100%)',
                        overflow: 'hidden',
                      }}
                    >
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image}
                          alt={item.title}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      ) : null}
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
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) auto', gap: 10 }}>
                          <Link href={`/admin/scooters/${item.id}/edit`} style={{ textDecoration: 'none', display: 'block' }}>
                            <Button variant="outline" style={{ width: '100%' }}>
                              Edit scooter
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            disabled={busy}
                            onClick={() => void onDeleteScooter(item)}
                            style={{ width: isMobile ? '100%' : 'auto' }}
                          >
                            {busy ? 'Deleting…' : 'Delete'}
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
                    {item.brand} {item.name} · {item.type_name || 'Category'}
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
            <Field label="Price per day (IDR)">
              <input
                type="number"
                min="0"
                step="1"
                value={draft.base_price_idr}
                onChange={(event) => updateDraft('base_price_idr', event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field
              label="Quantity available for booking"
              hint="How many identical scooters this card represents. The card stays bookable until all units are taken for the selected dates — no need to create duplicate cards."
            >
              <input
                type="number"
                min="1"
                step="1"
                value={draft.quantity}
                onChange={(event) => updateDraft('quantity', event.target.value)}
                style={inputStyle}
                placeholder="1"
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
    action: 'confirm' | 'mark-delivery' | 'mark-active' | 'complete' | 'cancel' | 'delete',
  ) => void;
  isMobile: boolean;
}) {
  const [filter, setFilter] = useState('all');
  const formatMoney = useAdminMoneyFormatter();
  const filtered = filter === 'all' ? bookings : bookings.filter((item) => item.status === filter);
  const contactBadges = (item: ApiBooking) =>
    [
      item.contact_has_telegram ? 'Telegram' : null,
      item.contact_has_wechat ? 'WeChat' : null,
      item.contact_has_whatsapp ? 'WhatsApp' : null,
    ].filter(Boolean) as string[];

  function actionButtons(item: ApiBooking) {
    const busy = busyBookingId === item.id;
    const buttons: Array<{
      action: 'confirm' | 'mark-delivery' | 'mark-active' | 'complete' | 'cancel' | 'delete';
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
    buttons.push({ action: 'delete', label: 'Delete', variant: 'danger' });
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
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
                    {item.contact_name || item.user || 'Guest'}
                  </div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>
                    {item.contact_phone || 'Phone not provided'}
                  </div>
                  {contactBadges(item).length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {contactBadges(item).map((label) => (
                        <span
                          key={label}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            background: A.g100,
                            color: A.g700,
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
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
  const formatMoney = useAdminMoneyFormatter();
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
  const formatMoney = useAdminMoneyFormatter();
  type CalendarBlock = { id: number; vehicle: number; start_at: string; end_at: string; type: string; comment?: string };
  type CalendarBooking = ApiBooking & { startDate: Date; endDate: Date };
  type CalendarSelection = {
    scooter: ApiScooterDetail;
    day: Date;
    bookings: CalendarBooking[];
    manualBlocks: CalendarBlock[];
  };
  type PendingRangeSelection = {
    scooter: ApiScooterDetail;
    day: Date;
  };

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [savingBlock, setSavingBlock] = useState(false);
  const [deletingBlockId, setDeletingBlockId] = useState<number | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<CalendarSelection | null>(null);
  const [pendingRangeStart, setPendingRangeStart] = useState<PendingRangeSelection | null>(null);
  const [draft, setDraft] = useState(() => {
    const start = startOfWeek(new Date());
    const end = new Date(start);
    end.setHours(18, 0, 0, 0);
    start.setHours(9, 0, 0, 0);
    return {
      vehicle: '',
      start_at: toDateTimeLocalValue(start),
      end_at: toDateTimeLocalValue(end),
      guest_name: '',
      guest_phone: '',
      comment: '',
    };
  });
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const draftStartDate = useMemo(() => fromDateTimeLocalValue(draft.start_at), [draft.start_at]);
  const draftEndDate = useMemo(() => fromDateTimeLocalValue(draft.end_at), [draft.end_at]);
  const selectedScooter = useMemo(
    () => scooters.find((item) => String(item.id) === draft.vehicle) || null,
    [draft.vehicle, scooters],
  );

  const activeBookings: CalendarBooking[] = bookings
    .filter((item) => item.status !== 'cancelled')
    .map((item) => ({
      ...item,
      startDate: new Date(item.start_datetime),
      endDate: new Date(item.end_datetime),
    }));

  const rangeStartIso = useMemo(() => weekStart.toISOString(), [weekStart]);
  const rangeEndIso = useMemo(() => {
    const end = addDays(weekStart, 7);
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
  }, [weekStart]);

  const loadBlocks = useCallback(async () => {
    setLoadingBlocks(true);
    try {
      const response = await endpoints.adminAvailabilityBlocks({
        start_at: rangeStartIso,
        end_at: rangeEndIso,
      });
      setBlocks(unwrapList(response));
    } catch {
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  }, [rangeEndIso, rangeStartIso]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const draftValidationError = useMemo(() => {
    if (!draft.vehicle) return 'Choose a scooter first.';
    if (!draftStartDate || !draftEndDate) return 'Set both start and end time.';
    if (draftEndDate <= draftStartDate) return 'End time must be later than start time.';
    if (!draft.guest_name.trim()) return 'Enter guest name.';
    if (!draft.guest_phone.trim()) return 'Enter guest phone.';
    return null;
  }, [draft.guest_name, draft.guest_phone, draft.vehicle, draftEndDate, draftStartDate]);

  const draftDurationHours = useMemo(() => {
    if (!draftStartDate || !draftEndDate || draftEndDate <= draftStartDate) return 0;
    return Math.round(((draftEndDate.getTime() - draftStartDate.getTime()) / (1000 * 60 * 60)) * 10) / 10;
  }, [draftEndDate, draftStartDate]);

  const overlappingBookings = useMemo(() => {
    if (!selectedScooter || !draftStartDate || !draftEndDate || draftEndDate <= draftStartDate) return [];
    return activeBookings.filter(
      (item) =>
        item.scooter?.id === selectedScooter.id &&
        item.startDate <= draftEndDate &&
        item.endDate >= draftStartDate,
    );
  }, [activeBookings, draftEndDate, draftStartDate, selectedScooter]);

  const overlappingManualBlocks = useMemo(() => {
    if (!selectedScooter || !draftStartDate || !draftEndDate || draftEndDate <= draftStartDate) return [];
    return blocks.filter((item) => {
      if (item.vehicle !== selectedScooter.id || item.type !== 'manual_block') return false;
      const startAt = new Date(item.start_at);
      const endAt = new Date(item.end_at);
      return startAt <= draftEndDate && endAt >= draftStartDate;
    });
  }, [blocks, draftEndDate, draftStartDate, selectedScooter]);

  const selectedScooterBlocks = useMemo(() => {
    if (!selectedScooter) return [];
    return blocks
      .filter((item) => item.vehicle === selectedScooter.id && item.type === 'manual_block')
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [blocks, selectedScooter]);

  function setManualBlockRangeForDay(vehicleId: number, day: Date) {
    const { start, end } = buildManualBlockDayRange(day);
    setEditingBlockId(null);
    setDraft((current) => ({
      ...current,
      vehicle: String(vehicleId),
      start_at: toDateTimeLocalValue(start),
      end_at: toDateTimeLocalValue(end),
    }));
  }

  function setManualBlockRangeForDates(vehicleId: number, startDay: Date, endDay: Date) {
    const { start, end } = buildManualBlockDateRange(startDay, endDay);
    setEditingBlockId(null);
    setDraft((current) => ({
      ...current,
      vehicle: String(vehicleId),
      start_at: toDateTimeLocalValue(start),
      end_at: toDateTimeLocalValue(end),
    }));
  }

  function clearManualBlockEditor() {
    setEditingBlockId(null);
    setPendingRangeStart(null);
    setDraft((current) => ({ ...current, guest_name: '', guest_phone: '', comment: '' }));
  }

  function editManualBlock(block: CalendarBlock) {
    setEditingBlockId(block.id);
    setPendingRangeStart(null);
    const parsedComment = parseManualBlockComment(block.comment);
    setDraft({
      vehicle: String(block.vehicle),
      start_at: toDateTimeLocalValue(new Date(block.start_at)),
      end_at: toDateTimeLocalValue(new Date(block.end_at)),
      guest_name: parsedComment.guest_name,
      guest_phone: parsedComment.guest_phone,
      comment: parsedComment.note,
    });
  }

  function setRangePreset(mode: 'today' | 'day' | '24h' | '3d') {
    const anchor = draftStartDate || new Date();

    if (mode === 'today') {
      const { start, end } = buildManualBlockDayRange(new Date());
      setDraft((current) => ({
        ...current,
        start_at: toDateTimeLocalValue(start),
        end_at: toDateTimeLocalValue(end),
      }));
      return;
    }

    if (mode === 'day') {
      const { start, end } = buildManualBlockDayRange(anchor);
      setDraft((current) => ({
        ...current,
        start_at: toDateTimeLocalValue(start),
        end_at: toDateTimeLocalValue(end),
      }));
      return;
    }

    const nextEnd = new Date(anchor);
    if (mode === '24h') {
      nextEnd.setHours(nextEnd.getHours() + 24);
    } else {
      nextEnd.setDate(nextEnd.getDate() + 3);
    }
    setDraft((current) => ({
      ...current,
      start_at: toDateTimeLocalValue(anchor),
      end_at: toDateTimeLocalValue(nextEnd),
    }));
  }

  async function saveManualBlock() {
    if (draftValidationError) {
      window.alert(draftValidationError);
      return;
    }

    setSavingBlock(true);
    try {
      const payload = {
        vehicle: Number(draft.vehicle),
        start_at: draftStartDate!.toISOString(),
        end_at: draftEndDate!.toISOString(),
        type: 'manual_block' as const,
        comment: buildManualBlockComment(draft.guest_name, draft.guest_phone, draft.comment),
      };
      if (editingBlockId) {
        await endpoints.adminUpdateAvailabilityBlock(editingBlockId, payload);
      } else {
        await endpoints.adminCreateAvailabilityBlock(payload);
      }
      clearManualBlockEditor();
      setSelectedCell(null);
      await loadBlocks();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : editingBlockId ? 'Unable to update the calendar block.' : 'Unable to save the calendar block.');
    } finally {
      setSavingBlock(false);
    }
  }

  async function deleteManualBlock(blockId: number) {
    if (!confirm('Delete this manual block?')) return;
    setDeletingBlockId(blockId);
    try {
      await endpoints.adminDeleteAvailabilityBlock(blockId);
      if (editingBlockId === blockId) {
        clearManualBlockEditor();
      }
      setSelectedCell((current) => {
        if (!current) return current;
        const nextManualBlocks = current.manualBlocks.filter((item) => item.id !== blockId);
        if (current.bookings.length === 0 && nextManualBlocks.length === 0) {
          return null;
        }
        return { ...current, manualBlocks: nextManualBlocks };
      });
      await loadBlocks();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Unable to delete the calendar block.');
    } finally {
      setDeletingBlockId(null);
    }
  }

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
      <Panel style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black }}>
              Add manual occupancy fast
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, lineHeight: 1.6 }}>
              Click one empty day to start a range and another day to finish it. After that, enter guest name and phone above, then the admin can save the block manually.
            </div>
          </div>

          {pendingRangeStart ? (
            <div style={{ borderRadius: 12, padding: '12px 14px', background: A.blueBg, border: `1px solid ${A.blue}` }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.blue, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Range selection
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700, lineHeight: 1.6 }}>
                {pendingRangeStart.scooter.title}: start selected on {formatShortDate(pendingRangeStart.day)}. Click the end date on the same row, then fill guest details and save the block.
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={() => setRangePreset('today')}>Today 09:00–18:00</Button>
            <Button variant="outline" onClick={() => setRangePreset('day')}>Whole selected day</Button>
            <Button variant="outline" onClick={() => setRangePreset('24h')}>+24 hours</Button>
            <Button variant="outline" onClick={() => setRangePreset('3d')}>+3 days</Button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MANUAL_BLOCK_REASON_PRESETS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, comment: item }))}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${draft.comment === item ? A.black : A.g200}`,
                  background: draft.comment === item ? A.black : A.white,
                  color: draft.comment === item ? A.white : A.black,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Guest name
              </label>
              <input value={draft.guest_name} onChange={(e) => setDraft((current) => ({ ...current, guest_name: e.target.value }))} placeholder="Guest full name" style={inputBaseStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Guest phone
              </label>
              <input value={draft.guest_phone} onChange={(e) => setDraft((current) => ({ ...current, guest_phone: e.target.value }))} placeholder="+62 812..." style={inputBaseStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr 1fr 1.2fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Scooter
              </label>
              <select value={draft.vehicle} onChange={(e) => setDraft((current) => ({ ...current, vehicle: e.target.value }))} style={{ ...inputBaseStyle, minHeight: 42 }}>
                <option value="">Choose scooter</option>
                {scooters.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Start
              </label>
              <input type="datetime-local" value={draft.start_at} onChange={(e) => setDraft((current) => ({ ...current, start_at: e.target.value }))} style={inputBaseStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                End
              </label>
              <input type="datetime-local" value={draft.end_at} onChange={(e) => setDraft((current) => ({ ...current, end_at: e.target.value }))} style={inputBaseStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Note
              </label>
              <input value={draft.comment} onChange={(e) => setDraft((current) => ({ ...current, comment: e.target.value }))} placeholder="Maintenance, external booking, delivery hold..." style={inputBaseStyle} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {editingBlockId ? (
                <Button variant="ghost" onClick={clearManualBlockEditor} disabled={savingBlock}>
                  Cancel edit
                </Button>
              ) : null}
              <Button variant="dark" onClick={saveManualBlock} disabled={savingBlock || Boolean(draftValidationError)}>
                {savingBlock ? 'Saving…' : editingBlockId ? 'Save changes' : 'Add block'}
              </Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.1fr) minmax(280px, 0.9fr)', gap: 12 }}>
            <div style={{ border: `1px solid ${draftValidationError ? A.red : A.g200}`, borderRadius: 12, padding: '12px 14px', background: draftValidationError ? A.redBg : A.g100 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Current block
              </div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: A.black, marginBottom: 4 }}>
                {selectedScooter?.title || 'No scooter selected'}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: draftValidationError ? A.red : A.g700, lineHeight: 1.6 }}>
                {draftValidationError
                  ? draftValidationError
                  : `${formatShortDate(draftStartDate)} · ${formatTimeOnly(draftStartDate)} → ${formatShortDate(draftEndDate)} · ${formatTimeOnly(draftEndDate)} · ${draftDurationHours}h`}
              </div>
              {draft.guest_name || draft.guest_phone ? (
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginTop: 6 }}>
                  {draft.guest_name || 'Guest'}{draft.guest_phone ? ` · ${draft.guest_phone}` : ''}
                </div>
              ) : null}
              {draft.comment ? (
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginTop: 6 }}>
                  {editingBlockId ? 'Editing note' : 'Note'}: {draft.comment}
                </div>
              ) : null}
            </div>

            <div style={{ border: `1px solid ${overlappingBookings.length || overlappingManualBlocks.length ? A.orange : A.g200}`, borderRadius: 12, padding: '12px 14px', background: overlappingBookings.length || overlappingManualBlocks.length ? A.orangeBg : A.g100 }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Conflict check
              </div>
              {overlappingBookings.length === 0 && overlappingManualBlocks.length === 0 ? (
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700, lineHeight: 1.6 }}>
                  No overlapping bookings or manual blocks for this range.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  {overlappingBookings.map((item) => (
                    <div key={`booking-${item.id}`} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
                      {`Booking #${item.order_number} · ${item.contact_name || item.user || 'Guest'}`}
                    </div>
                  ))}
                  {overlappingManualBlocks.map((item) => (
                    <div key={`manual-${item.id}`} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
                      {`Manual block · ${item.comment || 'Blocked from admin panel'}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedScooter ? (
            <div style={{ borderTop: `1px solid ${A.g200}`, paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: A.g500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Manual blocks for {selectedScooter.title}
                </div>
                <Badge color="default">{selectedScooterBlocks.length} total</Badge>
              </div>
              {selectedScooterBlocks.length === 0 ? (
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>
                  No manual occupancy blocks for this scooter yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {selectedScooterBlocks.slice(0, 4).map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', background: A.white, border: `1px solid ${A.g200}`, borderRadius: 10, padding: '10px 12px' }}>
                      <div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: A.black }}>
                          {formatShortDate(item.start_at)} {formatTimeOnly(item.start_at)} → {formatShortDate(item.end_at)} {formatTimeOnly(item.end_at)}
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginTop: 2 }}>
                          {item.comment || 'Blocked from admin panel'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="ghost" onClick={() => editManualBlock(item)} disabled={deletingBlockId === item.id}>
                          Edit
                        </Button>
                        <Button variant="ghost" onClick={() => deleteManualBlock(item.id)} disabled={deletingBlockId === item.id}>
                          {deletingBlockId === item.id ? 'Deleting…' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Panel>
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
              <div
                onClick={() => setDraft((current) => ({ ...current, vehicle: String(scooter.id) }))}
                style={{ padding: '14px 16px', cursor: 'pointer', background: draft.vehicle === String(scooter.id) ? 'rgba(255,215,0,0.08)' : 'transparent' }}
              >
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
                const blockMatches = blocks.filter((item) => {
                  if (item.vehicle !== scooter.id || item.type !== 'manual_block') return false;
                  const startAt = new Date(item.start_at);
                  const endAt = new Date(item.end_at);
                  return startAt <= dayEnd && endAt >= dayStart;
                });
                const isPendingRangeCell =
                  pendingRangeStart?.scooter.id === scooter.id &&
                  draft.vehicle === String(scooter.id) &&
                  Boolean(draftStartDate && draftEndDate && draftStartDate <= dayEnd && draftEndDate >= dayStart);
                const isRangeAnchor =
                  pendingRangeStart?.scooter.id === scooter.id &&
                  isSameCalendarDay(pendingRangeStart.day, day);
                const isDraftTarget =
                  draft.vehicle === String(scooter.id) &&
                  Boolean(draftStartDate && draftEndDate && draftStartDate <= dayEnd && draftEndDate >= dayStart);
                return (
                  <div
                    key={`${scooter.id}-${day.toISOString()}`}
                    onClick={async () => {
                      if (matches.length === 0 && blockMatches.length === 0) {
                        setSelectedCell(null);
                        if (pendingRangeStart && pendingRangeStart.scooter.id === scooter.id) {
                          setManualBlockRangeForDates(scooter.id, pendingRangeStart.day, day);
                          setPendingRangeStart(null);
                          return;
                        }
                        setPendingRangeStart({ scooter, day });
                        const { start, end } = buildManualBlockFullDayRange(day);
                        setEditingBlockId(null);
                        setDraft((current) => ({
                          ...current,
                          vehicle: String(scooter.id),
                          start_at: toDateTimeLocalValue(start),
                          end_at: toDateTimeLocalValue(end),
                        }));
                        return;
                      }
                      setPendingRangeStart(null);
                      setSelectedCell({
                        scooter,
                        day,
                        bookings: matches,
                        manualBlocks: blockMatches,
                      });
                    }}
                    style={{
                      borderLeft: `1px solid ${A.g200}`,
                      padding: 6,
                      cursor: 'pointer',
                      background: isPendingRangeCell ? 'rgba(37,99,235,0.10)' : isDraftTarget ? 'rgba(255,215,0,0.08)' : 'transparent',
                    }}
                  >
                    {matches.length === 0 && blockMatches.length === 0 ? (
                      <div style={{ height: '100%', minHeight: 60, borderRadius: 10, background: isPendingRangeCell ? 'rgba(37,99,235,0.18)' : isDraftTarget ? 'rgba(255,215,0,0.18)' : A.g100, display: 'grid', placeItems: 'center', border: isRangeAnchor ? `2px solid ${A.blue}` : 'none' }}>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: isPendingRangeCell || isDraftTarget ? A.black : A.g500, textAlign: 'center' }}>
                          {isPendingRangeCell
                            ? isRangeAnchor
                              ? 'Start selected'
                              : 'Finish range'
                            : isDraftTarget
                              ? 'Fill guest info'
                              : 'Click to block day'}
                        </div>
                      </div>
                    ) : (
                      <>
                        {matches.map((item) => (
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
                              {item.contact_name || item.user || 'Guest'}
                            </div>
                          </div>
                        ))}
                        {blockMatches.map((item) => (
                          <div
                            key={`block-${item.id}`}
                            style={{
                              background: A.redBg,
                              borderLeft: `3px solid ${A.red}`,
                              borderRadius: '0 8px 8px 0',
                              padding: '8px 10px',
                              marginBottom: 4,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 11, color: A.black }}>
                                Manual block
                              </div>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  editManualBlock(item);
                                }}
                                style={{ border: 'none', background: 'transparent', color: A.black, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 11, padding: 0 }}
                              >
                                Edit
                              </button>
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
                              {item.comment || 'Blocked from admin panel'}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </Panel>
        </div>
      )}
      {selectedCell ? (
        <div
          onClick={() => setSelectedCell(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13,13,13,0.45)',
            display: 'grid',
            placeItems: 'center',
            padding: isMobile ? 16 : 28,
            zIndex: 60,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 860,
              maxHeight: 'min(80vh, 760px)',
              overflowY: 'auto',
              background: A.white,
              borderRadius: 18,
              padding: isMobile ? 18 : 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, color: A.black }}>
                  Occupancy details
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500 }}>
                  {selectedCell.scooter.title} · {formatShortDate(selectedCell.day)}
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedCell(null)}>Close</Button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {selectedCell.bookings.map((item) => (
                <div key={`selected-booking-${item.id}`} style={{ border: `1px solid ${A.g200}`, borderRadius: 12, padding: '14px 16px', background: A.white }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: A.black }}>
                        #{item.order_number} · {item.contact_name || item.user || 'Guest'}
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g500, marginTop: 4 }}>
                        {formatDateTime(item.start_datetime)} → {formatDateTime(item.end_datetime)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Badge color={item.status === 'active' ? 'green' : item.status === 'completed' ? 'blue' : 'default'}>{item.status}</Badge>
                      <Badge color={item.payment_status === 'paid' ? 'green' : 'default'}>{item.payment_status}</Badge>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 12 }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
                      <strong style={{ color: A.black }}>Phone:</strong> {item.contact_phone || '—'}
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
                      <strong style={{ color: A.black }}>Total:</strong> {formatMoney(item.total_price)}
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700 }}>
                      <strong style={{ color: A.black }}>Delivery:</strong> {item.delivery_address || '—'}
                    </div>
                  </div>
                </div>
              ))}
              {selectedCell.manualBlocks.map((item) => (
                <div key={`selected-block-${item.id}`} style={{ border: `1px solid ${A.g200}`, borderRadius: 12, padding: '14px 16px', background: A.redBg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: A.black }}>
                        Manual block
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700, marginTop: 4 }}>
                        {formatDateTime(item.start_at)} → {formatDateTime(item.end_at)}
                      </div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: A.g700, marginTop: 6 }}>
                        {item.comment || 'Blocked from admin panel'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="ghost" onClick={() => editManualBlock(item)}>Edit</Button>
                      <Button variant="ghost" onClick={() => deleteManualBlock(item.id)} disabled={deletingBlockId === item.id}>
                        {deletingBlockId === item.id ? 'Deleting…' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {loadingBlocks ? (
        <div style={{ marginTop: 12, fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500 }}>
          Loading manual blocks…
        </div>
      ) : null}
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
  const formatMoney = useAdminMoneyFormatter();
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
                  {`Dropoff: ${item.dropoff_percent}%`}
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
  currentUser,
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
  currentUser: ApiUser | null;
  onSelectThread: (id: number) => void;
  onSendReply: (threadId: number, text: string) => void;
  onUpdateThreadStatus: (threadId: number, status: 'open' | 'closed') => void;
  sendingReply: boolean;
  isMobile: boolean;
}) {
  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0] || null;
  const [draft, setDraft] = useState('');
  const [showChat, setShowChat] = useState(false);
  const supportParticipantIds = useMemo(
    () =>
      new Set(
        (activeThread?.participants || [])
          .filter((participant) => participant.role !== 'client')
          .map((participant) => participant.user?.id)
          .filter((id): id is number => typeof id === 'number'),
      ),
    [activeThread],
  );
  const supportParticipantEmails = useMemo(
    () =>
      new Set(
        (activeThread?.participants || [])
          .filter((participant) => participant.role !== 'client')
          .map((participant) => String(participant.user?.email || '').toLowerCase())
          .filter(Boolean),
      ),
    [activeThread],
  );

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
            {`${threads.length} live conversations`}
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
                const role = String(sender?.role || '').toLowerCase();
                const senderEmail = String(sender?.email || '').toLowerCase();
                const isCurrentAdmin =
                  (currentUser?.id != null && sender?.id != null && String(currentUser.id) === String(sender.id)) ||
                  Boolean(currentUser?.email && sender?.email && String(currentUser.email).toLowerCase() === senderEmail);
                const isAdmin =
                  Boolean(message.is_from_support) ||
                  ['admin', 'manager', 'staff'].includes(role) ||
                  (sender?.id != null && supportParticipantIds.has(sender.id)) ||
                  (senderEmail ? supportParticipantEmails.has(senderEmail) : false) ||
                  isCurrentAdmin;
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
                        background: A.gold,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Sora, sans-serif',
                        fontWeight: 800,
                        fontSize: 12,
                        color: A.black,
                        flexShrink: 0,
                      }}
                    >
                      {initials(sender?.full_name || sender?.email)}
                    </div>
                    <div style={{ maxWidth: isMobile ? '85%' : '74%' }}>
                      <div
                        style={{
                          background: A.white,
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
                            color: A.black,
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
