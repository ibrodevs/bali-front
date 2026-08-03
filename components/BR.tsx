'use client';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { formatGroupedAmount, useCurrency } from '@/lib/i18n/CurrencyProvider';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useSiteContentPreview } from '@/lib/siteContentPreview';
import { usePagePath } from '@/lib/usePageSettings';

export function BRLogo({
  size = 22,
  dark = false,
  withBackdrop = false,
}: {
  size?: number;
  dark?: boolean;
  withBackdrop?: boolean;
}) {
  const logoHeight = size * 1.7;
  const homePath = usePagePath('home');

  return (
    <Link
      href={homePath}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
        padding: withBackdrop ? '8px 12px' : 0,
        borderRadius: withBackdrop ? 999 : 0,
        background: withBackdrop ? 'rgba(255,255,255,0.14)' : 'transparent',
        border: withBackdrop ? '1px solid rgba(255,255,255,0.2)' : 'none',
        backdropFilter: withBackdrop ? 'blur(14px) saturate(160%)' : 'none',
        WebkitBackdropFilter: withBackdrop ? 'blur(14px) saturate(160%)' : 'none',
        boxShadow: withBackdrop ? '0 8px 24px rgba(0,0,0,0.16)' : 'none',
      }}
    >
      <img
        src="/logo1.svg"
        alt="Bali Rent"
        style={{
          height: logoHeight,
          width: 'auto',
          display: 'block',
          filter: dark ? 'drop-shadow(0 2px 10px rgba(0,0,0,0.35))' : 'none',
        }}
      />
    </Link>
  );
}

type ToneProps = { tone?: string; label?: string; style?: React.CSSProperties; children?: React.ReactNode; className?: string };
export function BRPhoto({ tone = 'mist', label, style, children, className = '' }: ToneProps) {
  return (
    <div className={`br-photo ${tone} ${className}`} style={style}>
      {label && <div className="br-photo-label">{label}</div>}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </div>
  );
}

const STATUS_MAP: Record<string, { color: string; bg: string; text: string }> = {
  available: { color: '#16A34A', bg: 'rgba(22,163,74,0.12)', text: 'AVAILABLE' },
  booked:    { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', text: 'BOOKED' },
  partial:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.14)', text: 'PARTIAL' },
  service:   { color: '#9CA3AF', bg: 'rgba(156,163,175,0.16)', text: 'SERVICE' },
  confirmed: { color: '#FFD700', bg: 'rgba(255,215,0,0.18)', text: 'CONFIRMED' },
  active:    { color: '#16A34A', bg: 'rgba(22,163,74,0.12)', text: 'ACTIVE' },
  completed: { color: '#9CA3AF', bg: 'rgba(156,163,175,0.16)', text: 'COMPLETED' },
  cancelled: { color: '#6B7280', bg: 'rgba(107,114,128,0.16)', text: 'CANCELLED' },
  created:   { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', text: 'CREATED' },
};

export function BRChip({ status }: { status: string }) {
  const { t } = useLocale();
  const { marker } = useSiteContentPreview();
  const s = STATUS_MAP[status] || STATUS_MAP.available;
  const label =
    (t.common.statusLabels as Record<string, string> | undefined)?.[status] ||
    (t.common.statusLabels as Record<string, string> | undefined)?.available ||
    s.text;
  return (
    <span className="br-chip br-mono" style={{ color: s.color, background: s.bg, fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.08em' }}>
      <span className="br-chip-dot" style={{ background: s.color }} />
      <span {...marker(`common.statusLabels.${status in STATUS_MAP ? status : 'available'}`)}>{label}</span>
    </span>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { full?: boolean; dark?: boolean; href?: string };

function buttonOrLink(className: string, props: BtnProps, children: React.ReactNode) {
  const { full, dark, href, style, ...rest } = props;
  const finalStyle: React.CSSProperties = { width: full ? '100%' : undefined, ...(style || {}) };
  if (href) {
    return (
      <Link href={href} className={className} style={{ ...finalStyle, textDecoration: 'none' }}>
        {children}
      </Link>
    );
  }
  return (
    <button className={className} style={finalStyle} {...rest}>
      {children}
    </button>
  );
}

export function BRPrimary({ children, ...props }: BtnProps & { children?: React.ReactNode }) {
  return buttonOrLink('br-btn br-btn-primary', props, children);
}
export function BRSecondary({ children, dark, ...props }: BtnProps & { children?: React.ReactNode }) {
  return buttonOrLink(`br-btn ${dark ? 'br-btn-outline dark' : 'br-btn-secondary'}`, { dark, ...props }, children);
}
export function BROutline({ children, dark, ...props }: BtnProps & { children?: React.ReactNode }) {
  return buttonOrLink(`br-btn br-btn-outline ${dark ? 'dark' : ''}`, { dark, ...props }, children);
}

export function BREyebrow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="br-eyebrow" style={style}>{children}</div>;
}

export function BRPrice({ amount, amountIdr, per = 'day', size = 22 }: { amount: number; amountIdr?: number; currency?: string; per?: string; size?: number }) {
  const { t } = useLocale();
  const { marker } = useSiteContentPreview();
  const { convertPrice } = useCurrency();
  // The headline price is always shown in IDR — it's the real price the admin set.
  // Only the small "≈ <currency>" hint elsewhere on the page changes with the currency switcher.
  // Prefer the exact admin-entered IDR figure over re-deriving it from the USD amount through
  // the currency switcher's exchange rate, which can disagree with what was actually typed.
  const convertedAmount = amountIdr != null ? Math.round(amountIdr) : Math.round(convertPrice(amount, 'IDR'));
  const displayAmount = formatGroupedAmount(convertedAmount, 0);
  const period = per === 'day' ? t.common.day : per;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span className="br-mono" style={{ fontSize: size * 0.6, opacity: 0.6 }}>Rp</span>
      <span className="br-mono" style={{ fontSize: size, fontWeight: 600, letterSpacing: '-0.02em' }}>{displayAmount}</span>
      <span {...(per === 'day' ? marker('common.day') : {})} className="br-mono" style={{ fontSize: size * 0.5, opacity: 0.55 }}>/{period}</span>
    </span>
  );
}

type SectionProps = { eyebrow?: string; title: string; action?: React.ReactNode; dark?: boolean; children: React.ReactNode; style?: React.CSSProperties };
export function BRSection({ eyebrow, title, action, dark, children, style }: SectionProps) {
  return (
    <section className="br-section" style={{ padding: '64px 48px', background: dark ? '#0A0A0A' : '#fff', color: dark ? '#fff' : '#000', ...style }}>
      <div className="br-section-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, gap: 24, flexWrap: 'wrap' }}>
        <div>
          {eyebrow && <BREyebrow style={{ marginBottom: 12, color: dark ? '#FFD700' : undefined }}>{eyebrow}</BREyebrow>}
          <h2 className="br-display" style={{ margin: 0, fontSize: 48, lineHeight: 1, letterSpacing: '-0.03em' }}>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
