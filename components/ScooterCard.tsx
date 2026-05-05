'use client';
import Link from 'next/link';
import { BRPhoto, BRChip, BRPrice } from './BR';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { DisplayScooter } from '@/lib/displayScooter';

export default function ScooterCard({ s, dark = false, large = false }: { s: DisplayScooter; dark?: boolean; large?: boolean }) {
  const { t } = useLocale();
  const fg = dark ? '#fff' : '#000';
  const sub = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const isAvail = s.status === 'available';
  return (
    <Link href={`/scooter/${s.apiId ?? s.id}`} className={`br-card br-scooter-card ${dark ? 'dark' : ''}`} style={{ display: 'block', textDecoration: 'none', color: fg, background: dark ? '#141414' : '#fff' }}>
      <div className="br-scooter-card-media" style={{ position: 'relative', height: large ? 280 : 220 }}>
        {s.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.imageUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <BRPhoto tone={s.photo} label={`${(s.id || '').toString().toUpperCase()} · ${s.cc}CC`} style={{ height: '100%' }} />
        )}
        <div style={{ position: 'absolute', top: 14, right: 14 }}>
          <BRChip status={s.status} />
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, background: '#FFD700', color: '#000', fontFamily: 'var(--br-mono)', fontSize: 10, padding: '4px 8px', letterSpacing: '0.12em' }}>
          {s.tag}
        </div>
      </div>
      <div className="br-scooter-card-body" style={{ padding: 22, color: fg }}>
        <div className="br-scooter-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
          <div>
            <div className="br-mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: sub }}>{s.type.toUpperCase()}{s.cc ? ` · ${s.cc}CC` : ''}</div>
            <div className="br-display" style={{ fontSize: 22, marginTop: 4, letterSpacing: '-0.02em' }}>{s.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="br-mono" style={{ fontSize: 10, color: sub }}>{t.catalog.from}</div>
            <BRPrice amount={s.price} size={20} />
          </div>
        </div>
        {(s.range > 0 || s.top > 0 || s.weight > 0) && (
          <div className="br-scooter-card-specs" style={{ display: 'flex', gap: 16, marginTop: 18, fontSize: 12, color: sub, fontFamily: 'var(--br-mono)' }}>
            {s.range > 0 && <span>↻ {s.range}km</span>}
            {s.top > 0 && <span>↗ {s.top}km/h</span>}
            {s.weight > 0 && <span>⚖ {s.weight}kg</span>}
          </div>
        )}
        {isAvail && (
          <div className="br-btn br-btn-primary br-scooter-card-cta" style={{ width: '100%', marginTop: 18, padding: '12px', display: 'block', textAlign: 'center' }}>
            {t.catalog.reserve}
          </div>
        )}
      </div>
    </Link>
  );
}
