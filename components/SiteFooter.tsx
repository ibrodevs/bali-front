'use client';
import Link from 'next/link';
import { BRLogo } from './BR';
import { useLocale } from '@/lib/i18n/LocaleProvider';

export default function SiteFooter() {
  const { t } = useLocale();
  const cols = Object.entries(t.footer.cols);
  return (
    <div className="br-site-footer" style={{ background: '#000', color: '#fff', padding: '60px 48px 24px' }}>
      <div className="br-site-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40, paddingBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <BRLogo dark size={22} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 18, lineHeight: 1.55, maxWidth: 320 }}>
            {t.footer.tagline}
          </p>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" style={{ marginTop: 20, background: '#25D366', color: '#fff', borderRadius: 999, padding: '12px 18px', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ fontSize: 18 }}>◉</span> WhatsApp · +62 812 3456 7890
          </a>
        </div>
        {cols.map(([h, items]) => (
          <div key={h}>
            <div className="br-mono" style={{ fontSize: 10, color: '#FFD700', letterSpacing: '0.16em', marginBottom: 14 }}>{h.toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((it: string) => (
                <Link key={it} href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14 }}>{it}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="br-site-footer-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, gap: 16, flexWrap: 'wrap' }}>
        <div className="br-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>BALI-RENT · JL. PANTAI BERAWA · CANGGU 80361 · LIC. 04/2019 · © 2026</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="br-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>EN · ID · RU · DE · FR · ZH</span>
          <span className="br-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>USD · IDR · EUR</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {['IG', 'TT', 'YT'].map((s) => (
              <div key={s} style={{ width: 32, height: 32, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'var(--br-mono)' }}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
