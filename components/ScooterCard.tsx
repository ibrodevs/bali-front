'use client';
import Link from 'next/link';
import { BRPhoto, BRChip, BRPrice } from './BR';
import { GaugeIcon, LightningIcon, WeightIcon } from './Icons';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { DisplayScooter, resolveScooterRouteId } from '@/lib/displayScooter';
import { useSiteContentPreview } from '@/lib/siteContentPreview';

export default function ScooterCard({ s, dark = false, large = false }: { s: DisplayScooter; dark?: boolean; large?: boolean }) {
  const { t } = useLocale();
  const { marker } = useSiteContentPreview();
  const fg = dark ? '#fff' : '#000';
  const sub = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const isAvail = s.status === 'available';
  const hasImage = Boolean(s.imageUrl);
  const routeId = s.apiId ?? resolveScooterRouteId(s.id, s.name) ?? s.id;
  return (
    <Link
      href={`/scooter/${routeId}`}
      className={`br-card br-scooter-card ${dark ? 'dark' : ''} ${hasImage ? 'has-cutout-image' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: fg,
        background: dark ? '#141414' : 'linear-gradient(180deg, #ffffff 0%, #f7f5ef 100%)',
        height: '100%',
      }}
    >
      <div
        className="br-scooter-card-media"
        style={{
          position: 'relative',
          height: large ? 320 : 260,
          overflow: 'hidden',
          background: dark
            ? 'radial-gradient(circle at 50% 58%, rgba(255,215,0,0.08) 0%, rgba(20,20,20,0) 55%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(20,20,20,0) 100%)'
            : 'radial-gradient(circle at 50% 58%, rgba(255,215,0,0.16) 0%, rgba(255,215,0,0) 56%), linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(247,245,239,0.25) 100%)',
        }}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.imageUrl}
            alt={s.name}
            loading="lazy"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: s.imageObjectPosition || '50% bottom',
              padding: large ? '24px 20px 30px' : '18px 16px 24px',
              transition: 'transform 600ms var(--br-easing)',
              filter: dark
                ? 'drop-shadow(0 26px 18px rgba(0,0,0,0.36))'
                : 'drop-shadow(0 26px 18px rgba(0,0,0,0.16))',
            }}
            className="br-scooter-card-img"
          />
        ) : (
          <BRPhoto tone={s.photo} label={`${(s.id || '').toString().toUpperCase()} · ${s.cc}CC`} style={{ height: '100%' }} />
        )}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            bottom: '6%',
            height: 18,
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'absolute', top: 14, right: 14 }}>
          <BRChip status={s.status} />
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, background: '#FFD700', color: '#000', fontFamily: 'var(--br-mono)', fontSize: 10, padding: '5px 10px', letterSpacing: '0.12em', borderRadius: 4, boxShadow: '0 4px 12px -4px rgba(0,0,0,0.3)' }}>
          {s.tag}
        </div>
      </div>
      <div className="br-scooter-card-body" style={{ padding: 22, color: fg, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="br-scooter-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: sub }}>{s.type.toUpperCase()}{s.cc ? ` · ${s.cc}CC` : ''}</div>
            <div className="br-display" style={{ fontSize: 22, marginTop: 4, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
            <span {...marker('catalog.from')} className="br-mono" style={{ fontSize: 10, color: sub }}>{t.catalog.from}</span>
            <BRPrice amount={s.price} size={20} />
          </div>
        </div>
        {(s.range > 0 || s.top > 0 || s.weight > 0) && (
          <div className="br-scooter-card-specs" style={{ display: 'flex', gap: 14, marginTop: 18, fontSize: 12, color: sub, fontFamily: 'var(--br-mono)' }}>
            {s.range > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><GaugeIcon size={13} color="currentColor" /> {s.range}km</span>}
            {s.top > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><LightningIcon size={13} color="currentColor" /> {s.top}km/h</span>}
            {s.weight > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><WeightIcon size={13} color="currentColor" /> {s.weight}kg</span>}
          </div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: 18 }}>
          {isAvail ? (
            <div className="br-btn br-btn-primary br-scooter-card-cta" style={{ width: '100%', padding: '14px', display: 'flex', justifyContent: 'center', minHeight: 48 }}>
              <span {...marker('catalog.reserve')}>{t.catalog.reserve}</span> <span aria-hidden>→</span>
            </div>
          ) : (
            <div className="br-mono" style={{ width: '100%', padding: '14px', textAlign: 'center', fontSize: 11, letterSpacing: '0.14em', color: sub, border: `1px dashed ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, borderRadius: 999 }}>
              <span {...marker('catalog.reserve')}>{t.catalog.reserve.toUpperCase()}</span> · —
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
