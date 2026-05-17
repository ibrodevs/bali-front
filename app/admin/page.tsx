'use client';

import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ApiWebhookLog,
  endpoints,
  unwrapList,
} from '@/lib/endpoints';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { SITE_CONTENT_FIELDS, SITE_CONTENT_LANGUAGES, SITE_CONTENT_PAGES, getDefaultSiteContentValue } from '@/lib/siteContentSchema';
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

type AdminView = 'overview' | 'bookings' | 'fleet' | 'calendar' | 'crm' | 'analytics' | 'support' | 'news' | 'addons' | 'locations' | 'site' | 'promocodes';

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
  { id: 'locations', icon: <EyeIcon size={18} />, label: 'Locations' },
  { id: 'site', icon: <EyeIcon size={18} />, label: 'Site Content' },
  { id: 'promocodes', icon: <DollarIcon size={18} />, label: 'Promo Codes' },
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

type SiteContentFieldMeta = (typeof SITE_CONTENT_FIELDS)[number];

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
            +{data.length - 3} more items in this block
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
  detail: '/scooter/pcx160',
  booking: '/booking?scooter_id=1&route_id=pcx160&slug=pcx160&name=Honda%20PCX%20160&price=18',
  payment: '/payment',
  auth: '/login',
  news: '/news',
  shared: '/',
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
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
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
                    <label style={labelStyle}>Name in {LANG_LABELS[activeLang]}</label>
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
                    {zone.translations.length > 0 && <Badge color="blue">{zone.translations.length} langs</Badge>}
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
                      <label style={labelStyle}>Name in {LANG_LABELS[activeLang]}</label>
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

function AddonsView({ isMobile }: { isMobile: boolean }) {
  const [addons, setAddons] = useState<ApiAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<Record<number, string>>({});
  const [drafts, setDrafts] = useState<Record<number, AddonDraft>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
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
          price_usd: String(addon.price_usd || addon.priceUSD || 0),
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
        price_usd: parseFloat(draft.price_usd) || 0,
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
        price_usd: parseFloat(newAddon.price_usd) || 0,
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
            <label style={labelStyle}>Price (USD)</label>
            <input style={inputStyle} type="number" step="0.01" value={draft.price_usd} onChange={(e) => onChange('price_usd', e.target.value)} />
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
            <label style={labelStyle}>Name ({lang.toUpperCase()})</label>
            <input style={inputStyle} value={trans.name} onChange={(e) => onTransChange(lang, 'name', e.target.value)} placeholder={`Addon name in ${lang}`} />
          </div>
          <div>
            <label style={labelStyle}>Description ({lang.toUpperCase()})</label>
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
            return (
              <div key={addon.id} style={{ background: A.white, border: `1px solid ${isExpanded ? A.black : A.g200}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                <div
                  onClick={() => openAddon(addon)}
                  style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: A.black }}>{addon.name}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: A.g500, marginTop: 2 }}>
                      ${Number(addon.price_usd || addon.priceUSD || 0).toFixed(2)} · {addon.price_type || 'per_day'}
                      {addon.is_active === false && <span style={{ marginLeft: 8, color: A.red }}>inactive</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(addon.translations?.length ?? 0) > 0 && (
                      <Badge color="green">{addon.translations!.length} langs</Badge>
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
                      <Button variant="outline" onClick={() => { setExpandedId(null); setDrafts((p) => { const n = { ...p }; delete n[addon.id]; return n; }); }}>Cancel</Button>
                      <Button variant="primary" disabled={isSaving} onClick={() => handleSave(addon)}>{isSaving ? 'Saving…' : 'Save'}</Button>
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
                <label style={labelStyle}>Price (USD)</label>
                <input style={inputStyle} type="number" step="0.01" value={newAddon.price_usd} onChange={(e) => setNewAddon((p) => ({ ...p, price_usd: e.target.value }))} />
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
                Used {draft.current_usage} / {draft.usage_limit} times
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
    news: <NewsView isMobile={isMobile} />,
    addons: <AddonsView isMobile={isMobile} />,
    locations: <LocationsView isMobile={isMobile} />,
    site: <SiteContentView isMobile={isMobile} />,
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

function SiteContentView({ isMobile }: { isMobile: boolean }) {
  const [entries, setEntries] = useState<ApiAdminSiteContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<string>(SITE_CONTENT_PAGES[0]?.key || 'home');
  const [activeLanguage, setActiveLanguage] = useState<string>('en');
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
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

  const activePageMeta = useMemo(
    () => SITE_CONTENT_PAGES.find((page) => page.key === activePage) || SITE_CONTENT_PAGES[0],
    [activePage],
  );

  const pageFields = useMemo(
    () => SITE_CONTENT_FIELDS.filter((field) => field.pageKey === activePage),
    [activePage],
  );

  const previewFields = useMemo(
    () => SITE_CONTENT_FIELDS.filter((field) => field.pageKey === activePage || field.pageKey === 'shared'),
    [activePage],
  );

  const previewTextFields = useMemo(
    () => previewFields.filter((field) => field.valueType === 'text' || field.valueType === 'textarea'),
    [previewFields],
  );

  const pageCounts = useMemo(() => {
    const counts = new Map<string, { total: number; customized: number; clickable: number }>();
    for (const page of SITE_CONTENT_PAGES) {
      counts.set(page.key, { total: 0, customized: 0, clickable: 0 });
    }
    for (const field of SITE_CONTENT_FIELDS) {
      const current = counts.get(field.pageKey);
      if (current) current.total += 1;
      if (current && (field.valueType === 'text' || field.valueType === 'textarea')) current.clickable += 1;
      const entry = entryMap.get(`${field.shared ? 'all' : activeLanguage}:${field.key}`);
      if (entry && current) current.customized += 1;
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

  function setDraftValue(field: SiteContentFieldMeta, languageCode: string, value: string) {
    const stateKey = fieldStateKey(field, languageCode);
    setDrafts((current) => ({ ...current, [stateKey]: value }));
  }

  useEffect(() => {
    if (selectedFieldKey && !previewFields.some((field) => field.key === selectedFieldKey)) {
      setSelectedFieldKey(null);
    }
  }, [previewFields, selectedFieldKey]);

  const selectedField = useMemo(
    () => previewFields.find((field) => field.key === selectedFieldKey) || null,
    [previewFields, selectedFieldKey],
  );

  const previewUrl = useMemo(() => {
    const route = SITE_PREVIEW_ROUTES[activePage] || activePageMeta?.route || '/';
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(route, base);
    url.searchParams.set('sitePreview', '1');
    url.searchParams.set('previewLocale', activeLanguage);
    url.searchParams.set('previewRev', String(previewReloadKey));
    return `${url.pathname}${url.search}`;
  }, [activeLanguage, activePage, activePageMeta, previewReloadKey]);

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
    if (!['text', 'textarea'].includes(field.valueType)) return [] as string[];
    const values = [resolveDraftValue(field, activeLanguage), defaultTextValue(field, activeLanguage)];
    return Array.from(new Set(values.map((value) => normalizePreviewText(value)).filter((value) => value.length >= 2)));
  }, [drafts, entries, activeLanguage]);

  const pushPreviewOverrides = useCallback(() => {
    const frame = previewFrameRef.current;
    const target = frame?.contentWindow;
    if (!target || typeof window === 'undefined') return;
    target.postMessage({ type: 'br-preview-overrides', payload: previewOverrides }, window.location.origin);
  }, [previewOverrides]);

  const resolveFieldFromElement = useCallback((element: HTMLElement | null) => {
    if (!element) return null;

    const rawCandidates = [
      element.textContent || '',
      element.getAttribute('aria-label') || '',
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.placeholder || '' : '',
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value || '' : '',
    ];
    const candidates = Array.from(new Set(rawCandidates.map((value) => normalizePreviewText(value)).filter(Boolean)));
    if (!candidates.length) return null;

    let bestMatch: { fieldKey: string; score: number } | null = null;

    for (const field of previewTextFields) {
      const variants = comparableValuesForField(field);
      if (!variants.length) continue;

      for (const candidate of candidates) {
        for (const variant of variants) {
          let score = 0;
          if (candidate === variant) score = 1000 + variant.length;
          else if (candidate.includes(variant) && variant.length > 5) score = 700 + variant.length;
          else if (variant.includes(candidate) && candidate.length > 5) score = 500 + candidate.length;

          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { fieldKey: field.key, score };
          }
        }
      }
    }

    return bestMatch && bestMatch.score > 0 ? bestMatch.fieldKey : null;
  }, [comparableValuesForField, previewTextFields]);

  const clearPreviewHighlights = useCallback(() => {
    const doc = previewFrameRef.current?.contentDocument;
    if (!doc) return;

    doc.querySelectorAll('[data-admin-preview-field-key]').forEach((node) => {
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

    doc.querySelectorAll(`[data-admin-preview-field-key="${selectedField.key}"]`).forEach((node) => {
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

    const nodes = Array.from(
      doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,button,li,label,small,strong,em,input,textarea'),
    ) as HTMLElement[];

    for (const node of nodes) {
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

      const fallbackTarget = target.closest('button, a, input, textarea, h1, h2, h3, h4, h5, h6, p, span, li, label, small, strong, em') as HTMLElement | null;
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
    const body = {
      key: field.key,
      language,
      value_type: field.valueType,
      value: draftValue,
      is_active: true,
    };
    const saved = existing
      ? await endpoints.adminUpdateSiteContent(existing.id, body)
      : await endpoints.adminCreateSiteContent(body);
    setEntries((current) => {
      const next = current.filter((item) => item.id !== saved.id);
      next.push(saved);
      return next.sort((a, b) => `${a.key}:${a.language}`.localeCompare(`${b.key}:${b.language}`));
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
                {SITE_CONTENT_PAGES.map((page) => {
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
              <Badge color="blue">{previewTextFields.length} clickable text fields</Badge>
              <Badge color="green">{pageFields.length} total content entries</Badge>
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
      ) : previewTextFields.length === 0 ? (
        <EmptyState label="No clickable text fields found for this page." />
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
                  <Badge color="green">{previewTextFields.length} clickable texts</Badge>
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
                    <Badge color="green">{previewTextFields.length} text elements ready</Badge>
                    <Badge color="orange">Preview in {activeLanguage.toUpperCase()}</Badge>
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
                              {selectedField.valueType === 'textarea' ? (
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
      )}
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
                        <Link href={`/admin/scooters/${item.id}/edit`} style={{ textDecoration: 'none' }}>
                          <Button variant="outline" style={{ width: '100%' }}>
                            Edit scooter
                          </Button>
                        </Link>
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
  const contactBadges = (item: ApiBooking) =>
    [
      item.contact_has_telegram ? 'Telegram' : null,
      item.contact_has_wechat ? 'WeChat' : null,
      item.contact_has_whatsapp ? 'WhatsApp' : null,
    ].filter(Boolean) as string[];

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
