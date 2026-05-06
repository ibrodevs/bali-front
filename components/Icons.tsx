import { CSSProperties } from 'react';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
};

function SvgIcon({
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
  style,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  );
}

export function DeliveryIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3 7h11v8H3z" />
      <path d="M14 10h3l3 3v2h-6z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </SvgIcon>
  );
}

export function PriceTagIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 7.5 11.5 4 20 8.5v7L12.5 20 4 15.5Z" />
      <path d="M9 10.5c0-1 1-1.8 2.3-1.8 1.2 0 2.2.6 2.2 1.6 0 2.2-4.5 1.4-4.5 3.7 0 1.1 1.1 1.8 2.5 1.8 1.3 0 2.4-.7 2.5-1.8" />
    </SvgIcon>
  );
}

export function LightningIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z" />
    </SvgIcon>
  );
}

export function SupportIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 4a7 7 0 0 0-7 7v2a2 2 0 0 0 2 2h1v-5H5.1" />
      <path d="M12 4a7 7 0 0 1 7 7v2a2 2 0 0 1-2 2h-1v-5h2.9" />
      <path d="M8 18c.8 1.2 2.2 2 4 2s3.2-.8 4-2" />
    </SvgIcon>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m12 3 2.7 5.5 6 0.9-4.4 4.2 1 5.9L12 16.8 6.7 19.5l1-5.9L3.3 9.4l6-.9Z" />
    </SvgIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m5 12 4 4 10-10" />
    </SvgIcon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3 5.5 5.5v5.6c0 4 2.5 7.6 6.5 9 4-1.4 6.5-5 6.5-9V5.5Z" />
      <path d="m9.5 12 1.8 1.8 3.2-3.6" />
    </SvgIcon>
  );
}

export function WifiIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4.5 9.5a11 11 0 0 1 15 0" />
      <path d="M7.5 12.5a6.8 6.8 0 0 1 9 0" />
      <path d="M10.6 15.6a2.5 2.5 0 0 1 2.8 0" />
      <circle cx="12" cy="18.5" r="0.8" fill={props.color || 'currentColor'} stroke="none" />
    </SvgIcon>
  );
}

export function HelmetIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 14a7 7 0 0 1 14 0" />
      <path d="M5 14h9.5c.8 0 1.5.7 1.5 1.5V17H9.5A4.5 4.5 0 0 1 5 12.5Z" />
      <path d="M16 17h2" />
    </SvgIcon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M10 6h4" />
      <circle cx="12" cy="17.5" r="0.8" fill={props.color || 'currentColor'} stroke="none" />
    </SvgIcon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8.5a4 4 0 1 1 8 0V11" />
    </SvgIcon>
  );
}

export function RainIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M6 11a6 6 0 1 1 12 0H6Z" />
      <path d="M9 13.5 8 16" />
      <path d="M12 13.5 11 17" />
      <path d="M15 13.5 14 16" />
    </SvgIcon>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5Z" />
      <path d="M12 4v16" />
      <path d="m4 8.5 8 4.5 8-4.5" />
    </SvgIcon>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z" />
      <path d="m18 15 0.9 2.1L21 18l-2.1 0.9L18 21l-0.9-2.1L15 18l2.1-0.9Z" />
    </SvgIcon>
  );
}

export function GaugeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 16a7 7 0 1 1 14 0" />
      <path d="m12 12 4-3" />
      <circle cx="12" cy="16" r="1" fill={props.color || 'currentColor'} stroke="none" />
    </SvgIcon>
  );
}

export function WeightIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7 8h10l2 11H5Z" />
      <path d="M10 8a2 2 0 1 1 4 0" />
    </SvgIcon>
  );
}

export function EngineIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 10h10l2 2v4H5Z" />
      <path d="M7 10V7h4" />
      <path d="M17 12h2v3" />
      <path d="M8 16v2" />
      <path d="M14 16v2" />
    </SvgIcon>
  );
}

export function FuelIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7 5h7v14H7Z" />
      <path d="M14 8h2l2 2v7a2 2 0 0 1-2 2" />
      <path d="M9.5 8.5h2" />
    </SvgIcon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M8 3v6M16 3v6M4 10h16" />
    </SvgIcon>
  );
}

export function StorageIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 7h14v10H5Z" />
      <path d="M5 10h14" />
    </SvgIcon>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 4a8 8 0 1 0 0 16h1a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h1a4 4 0 0 0 0-8Z" />
      <circle cx="8" cy="10" r="0.8" fill={props.color || 'currentColor'} stroke="none" />
      <circle cx="10" cy="7.5" r="0.8" fill={props.color || 'currentColor'} stroke="none" />
      <circle cx="13.5" cy="7.5" r="0.8" fill={props.color || 'currentColor'} stroke="none" />
    </SvgIcon>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m12 4 8 4-8 4-8-4Z" />
      <path d="m4 12 8 4 8-4" />
      <path d="m4 16 8 4 8-4" />
    </SvgIcon>
  );
}

export function CreditCardIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 14h3" />
    </SvgIcon>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v14H6.5A2.5 2.5 0 0 1 4 16.5Z" />
      <path d="M18 9h2v6h-2" />
      <circle cx="16" cy="12" r="0.8" fill={props.color || 'currentColor'} stroke="none" />
    </SvgIcon>
  );
}

export function CryptoIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3 19 7v10l-7 4-7-4V7Z" />
      <path d="M12 7v10M9 9.5h4a2 2 0 1 1 0 4H9h4.5a2 2 0 1 1 0 4H9" />
    </SvgIcon>
  );
}

export function GlobeBadge({
  label,
  size = 18,
  color = 'currentColor',
  style,
}: IconProps & { label: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        border: `1px solid ${color}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(8, size * 0.42),
        lineHeight: 1,
        fontWeight: 700,
        color,
        flexShrink: 0,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

export function stripLeadingSymbol(value: string) {
  return value.replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

export function addonIconKey(name?: string, icon?: string) {
  const token = `${name || ''} ${icon || ''}`.toLowerCase();
  if (token.includes('wifi') || token.includes('wi-fi')) return 'wifi';
  if (token.includes('helmet')) return 'helmet';
  if (token.includes('phone')) return 'phone';
  if (token.includes('lock')) return 'lock';
  if (token.includes('rain')) return 'rain';
  if (token.includes('box')) return 'box';
  if (token.includes('insur') || token.includes('cover')) return 'shield';
  return 'spark';
}

export function renderAddonIcon(name?: string, icon?: string, props?: IconProps) {
  switch (addonIconKey(name, icon)) {
    case 'wifi':
      return <WifiIcon {...props} />;
    case 'helmet':
      return <HelmetIcon {...props} />;
    case 'phone':
      return <PhoneIcon {...props} />;
    case 'lock':
      return <LockIcon {...props} />;
    case 'rain':
      return <RainIcon {...props} />;
    case 'box':
      return <BoxIcon {...props} />;
    case 'shield':
      return <ShieldIcon {...props} />;
    default:
      return <SparkIcon {...props} />;
  }
}
