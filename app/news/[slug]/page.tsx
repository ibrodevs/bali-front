'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { ApiNewsArticle, endpoints } from '@/lib/endpoints';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { mediaUrl } from '@/lib/api';
import { ArrowRightIcon } from '@/components/Icons';

function formatDate(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function SkeletonArticle() {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="br-skeleton" style={{ height: 12, width: '30%', marginBottom: 32, borderRadius: 4 }} />
      <div className="br-skeleton" style={{ height: 11, width: '22%', marginBottom: 16, borderRadius: 4 }} />
      <div className="br-skeleton" style={{ height: 56, width: '88%', marginBottom: 10, borderRadius: 6 }} />
      <div className="br-skeleton" style={{ height: 56, width: '60%', marginBottom: 32, borderRadius: 6 }} />
      <div className="br-skeleton" style={{ width: '100%', paddingTop: '52%', borderRadius: 24, marginBottom: 36 }} />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="br-skeleton" style={{ height: 16, width: i % 3 === 2 ? '70%' : '100%', marginBottom: 12, borderRadius: 4 }} />
      ))}
    </div>
  );
}

export default function NewsArticlePage() {
  const { locale, t } = useLocale();
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [article, setArticle] = useState<ApiNewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    endpoints.newsArticle(slug, locale)
      .then((data) => setArticle(data))
      .catch(() => { setArticle(null); setError(true); })
      .finally(() => setLoading(false));
  }, [locale, slug]);

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: '#FAFAF5', WebkitFontSmoothing: 'antialiased' }}>

        {/* ── TOP BAR ─────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px, 5vw, 56px)' }}>
            <Link
              href="/news"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                height: 56, color: 'rgba(0,0,0,0.52)',
                textDecoration: 'none', fontFamily: 'var(--br-body)',
                fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                transition: 'color 180ms',
              }}
              className="br-news-back"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.news.backToNews}
            </Link>
          </div>
        </div>

        <section style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) clamp(16px, 5vw, 56px) clamp(80px, 10vw, 120px)' }}>

          {loading ? (
            <SkeletonArticle />
          ) : error || !article ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ maxWidth: 560, textAlign: 'center', margin: '0 auto', padding: '80px 0' }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.16)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px', fontSize: 28,
              }}>
                ✕
              </div>
              <h1 style={{
                fontFamily: 'var(--br-display)', fontSize: 'clamp(28px, 4vw, 40px)',
                lineHeight: 1.05, letterSpacing: '-0.03em', color: '#0A0A0F',
                margin: '0 0 12px',
              }}>
                {t.news.error}
              </h1>
              <p style={{ fontFamily: 'var(--br-body)', fontSize: 15, color: 'rgba(0,0,0,0.48)', lineHeight: 1.65, margin: '0 0 28px' }}>
                Article not found or unavailable right now.
              </p>
              <Link href="/news" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#0A0A0F', color: '#fff',
                fontFamily: 'var(--br-body)', fontSize: 14, fontWeight: 600,
                padding: '12px 24px', borderRadius: 999, textDecoration: 'none',
              }}>
                {t.news.backToNews}
              </Link>
            </motion.div>
          ) : (
            <motion.article
              initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Hero image — full width, above everything */}
              {article.image && (
                <div style={{
                  borderRadius: 28, overflow: 'hidden',
                  background: '#F0EDE6', marginBottom: 48,
                  boxShadow: '0 24px 64px -28px rgba(0,0,0,0.22)',
                  maxHeight: 540, position: 'relative',
                }}>
                  <img
                    src={mediaUrl(article.image)}
                    alt={article.title}
                    style={{
                      display: 'block', width: '100%',
                      height: 540, objectFit: 'cover',
                    }}
                  />
                </div>
              )}

              {/* Centred text column */}
              <div style={{ maxWidth: 780, margin: '0 auto' }}>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--br-mono)', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.14em', color: '#0A0A0F', textTransform: 'uppercase',
                    background: '#FFD700', padding: '4px 12px', borderRadius: 999,
                  }}>
                    News
                  </span>
                  <time style={{
                    fontFamily: 'var(--br-mono)', fontSize: 11,
                    color: 'rgba(0,0,0,0.38)', letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}>
                    {formatDate(article.published_at, locale)}
                  </time>
                </div>

                {/* Title */}
                <h1 style={{
                  fontFamily: 'var(--br-display)', fontWeight: 800,
                  fontSize: 'clamp(34px, 5.5vw, 64px)', lineHeight: 0.97,
                  letterSpacing: '-0.04em', color: '#0A0A0F',
                  margin: '0 0 36px',
                }}>
                  {article.title}
                </h1>

                {/* Body */}
                <div style={{
                  fontFamily: 'var(--br-body)', fontSize: 'clamp(15px, 1.5vw, 18px)',
                  lineHeight: 1.8, color: '#1a1a1a',
                  whiteSpace: 'pre-wrap',
                }}>
                  {article.description}
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.09)', margin: '48px 0 40px' }} />

                {/* Bottom nav */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <Link href="/news" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    fontFamily: 'var(--br-body)', fontSize: 13, fontWeight: 600,
                    color: 'rgba(0,0,0,0.52)', textDecoration: 'none',
                    padding: '10px 18px', border: '1.5px solid rgba(0,0,0,0.12)',
                    borderRadius: 999, transition: 'border-color 180ms, color 180ms',
                  }}
                    className="br-news-back"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t.news.backToNews}
                  </Link>

                  <Link href="/catalog" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 9,
                    background: '#FFD700', color: '#0A0A0F',
                    fontFamily: 'var(--br-display)', fontSize: 14, fontWeight: 800,
                    padding: '10px 22px', borderRadius: 999,
                    textDecoration: 'none', letterSpacing: '-0.01em',
                    boxShadow: '0 8px 24px -8px rgba(255,215,0,0.5)',
                    transition: 'transform 200ms, box-shadow 200ms',
                  }}
                    className="br-news-catalog-btn"
                  >
                    Rent a Scooter
                    <ArrowRightIcon size={13} color="#0A0A0F" strokeWidth={2.5} />
                  </Link>
                </div>

              </div>
            </motion.article>
          )}
        </section>
      </main>

      <style>{`
        .br-news-back:hover {
          color: #0A0A0F !important;
          border-color: rgba(0,0,0,0.28) !important;
        }
        .br-news-catalog-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px -10px rgba(255,215,0,0.65) !important;
        }
        @media (max-width: 960px) {
          /* collapse 3-col grid to 1 col */
        }
      `}</style>

      <SiteFooter />
    </>
  );
}
