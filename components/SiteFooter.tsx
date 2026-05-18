'use client';
import Link from 'next/link';
import { BRLogo } from './BR';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { CURRENCY_RATES } from '@/lib/i18n/CurrencyProvider';
import { useSiteContentPreview } from '@/lib/siteContentPreview';

export default function SiteFooter() {
  const { t } = useLocale();
  const { marker } = useSiteContentPreview();
  const footer = t.footer as typeof t.footer & {
    whatsappButton?: string;
    metaLine?: string;
    localesLine?: string;
  };
  const footerRouteMap = new Map<string, string>([
    [t.nav.catalog, '/catalog'],
    [t.nav.how, '/how-it-works'],
    [t.nav.locations, '/locations'],
    [t.nav.news, '/news'],
  ]);
  const cols = Object.entries(t.footer.cols)
    .map(([heading, items]) => ({
      heading,
      items: items
        .map((label: string) => ({ label, href: footerRouteMap.get(label) }))
        .filter((item): item is { label: string; href: string } => Boolean(item.href)),
    }))
    .filter((col) => col.items.length > 0);
  const footerGridTemplate = `minmax(0, 2fr) repeat(${Math.max(cols.length, 1)}, minmax(0, 1fr))`;
  const supportedCurrencies = Object.keys(CURRENCY_RATES).join(' · ');

  return (
    <div className="br-site-footer" style={{ background: '#000', color: '#fff', padding: '60px 48px 24px', marginTop: 'auto', flexShrink: 0 }}>
      <div className="br-site-footer-grid" style={{ display: 'grid', gridTemplateColumns: footerGridTemplate, gap: 40, paddingBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <BRLogo dark size={22} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 18, lineHeight: 1.55, maxWidth: 320 }}>
            <span {...marker('footer.tagline')}>{t.footer.tagline}</span>
          </p>
          <a href="https://wa.me/628135915173" target="_blank" rel="noopener noreferrer" style={{ marginTop: 20, background: '#25D366', color: '#fff', borderRadius: 999, padding: '12px 18px', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ fontSize: 18 }}>◉</span> <span {...marker('footer.whatsappButton')}>{footer.whatsappButton || 'WhatsApp · +62 813-5915-173'}</span>
          </a>
        </div>
        {cols.map((col) => (
          <div key={col.heading}>
            <div {...marker('footer.cols')} className="br-mono" style={{ fontSize: 10, color: '#FFD700', letterSpacing: '0.16em', marginBottom: 14 }}>{col.heading.toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.items.map((item) => (
                <Link {...marker('footer.cols')} key={item.label} href={item.href} style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14 }}>{item.label}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="br-site-footer-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, gap: 16, flexWrap: 'wrap' }}>
        <div {...marker('footer.metaLine')} className="br-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>{footer.metaLine || 'BALI-RENT · JL. PANTAI BERAWA · CANGGU 80361 · LIC. 04/2019 · © 2026'}</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span {...marker('footer.localesLine')} className="br-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{footer.localesLine || 'EN · ID · RU · DE · FR · ZH'}</span>
          <span className="br-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{supportedCurrencies}</span>
        </div>
      </div>
    </div>
  );
}
