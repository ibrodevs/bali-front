'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { endpoints, ApiNewsArticle, unwrapList } from '@/lib/endpoints';
import { mediaUrl } from '@/lib/api';
import { ArrowRightIcon } from '@/components/Icons';
import { useSiteContentPreview } from '@/lib/siteContentPreview';

function formatDate(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function NewsCard({ article, locale, readMoreLabel }: { article: ApiNewsArticle; locale: string; readMoreLabel: string }) {
  const imgSrc = article.image ? mediaUrl(article.image) : null;

  return (
    <Link href={`/news/${article.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <article
        className="br-news-card"
        style={{
          background: '#fff',
          borderRadius: 24,
          border: '1.5px solid rgba(0,0,0,0.07)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          cursor: 'pointer',
          transition: 'transform 360ms cubic-bezier(.2,.6,.2,1), box-shadow 360ms cubic-bezier(.2,.6,.2,1), border-color 260ms',
          boxShadow: '0 4px 16px -4px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', paddingTop: '62%', background: '#F5F3EF', overflow: 'hidden', flexShrink: 0 }}>
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={article.title}
              className="br-news-card-img"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover',
                transition: 'transform 500ms cubic-bezier(.2,.6,.2,1)',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 70% 30%, rgba(255,215,0,0.12), transparent 55%), linear-gradient(135deg, #f5f3ef 0%, #e8e4da 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(0,0,0,0.28)', textTransform: 'uppercase' }}>No image</span>
            </div>
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.06) 100%)',
            pointerEvents: 'none',
          }} />
        </div>

        <div style={{ padding: 'clamp(18px, 2.5vw, 26px)', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <time style={{
            fontFamily: 'var(--br-mono)', fontSize: 10, fontWeight: 600,
            color: 'rgba(0,0,0,0.36)', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 10, display: 'block',
          }}>
            {formatDate(article.published_at, locale)}
          </time>

          <h3 style={{
            fontFamily: 'var(--br-display)', fontWeight: 700,
            fontSize: 'clamp(16px, 1.8vw, 20px)', lineHeight: 1.15,
            letterSpacing: '-0.025em', color: '#0A0A0F',
            margin: '0 0 10px', flex: 0,
          }}>
            {article.title}
          </h3>

          <p style={{
            fontFamily: 'var(--br-body)', fontSize: 14,
            color: 'rgba(0,0,0,0.52)', lineHeight: 1.65,
            flex: 1, margin: '0 0 20px',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {article.description}
          </p>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
            <span style={{
              fontFamily: 'var(--br-body)', fontSize: 12, fontWeight: 700,
              color: '#0A0A0F', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              {readMoreLabel}
            </span>
            <ArrowRightIcon size={13} color="#0A0A0F" strokeWidth={2.5} />
          </div>
        </div>
      </article>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div className="br-skeleton" style={{ width: '100%', paddingTop: '62%' }} />
      <div style={{ padding: 24 }}>
        <div className="br-skeleton" style={{ height: 10, width: '40%', marginBottom: 12, borderRadius: 4 }} />
        <div className="br-skeleton" style={{ height: 20, width: '85%', marginBottom: 8, borderRadius: 4 }} />
        <div className="br-skeleton" style={{ height: 20, width: '60%', marginBottom: 16, borderRadius: 4 }} />
        <div className="br-skeleton" style={{ height: 14, width: '100%', marginBottom: 6, borderRadius: 4 }} />
        <div className="br-skeleton" style={{ height: 14, width: '80%', borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function NewsPage() {
  const { t, locale } = useLocale();
  const { marker } = useSiteContentPreview();
  const d = t.news;

  const [articles, setArticles] = useState<ApiNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    endpoints.newsList({ page_size: 50 }, locale)
      .then((res) => { setArticles(unwrapList(res)); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [locale]);

  return (
    <>
      <SiteHeader />
      <main style={{ minHeight: '100vh', background: '#FAFAF5', WebkitFontSmoothing: 'antialiased' }}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section style={{
          padding: 'clamp(80px, 10vw, 120px) clamp(16px, 5vw, 56px) clamp(48px, 6vw, 72px)',
          maxWidth: 1280, margin: '0 auto',
          background: 'radial-gradient(circle at 80% 0%, rgba(255,215,0,0.07), transparent 42%)',
        }}>
          <motion.div
            variants={stagger} initial="hidden" animate="visible"
          >
            <motion.p variants={fadeUp} style={{
              fontFamily: 'var(--br-mono)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.16em', color: 'rgba(0,0,0,0.36)',
              textTransform: 'uppercase', marginBottom: 18,
            }}>
              <span {...marker('news.eyebrow')}>{d.eyebrow}</span>
            </motion.p>

            <motion.h1 variants={fadeUp} style={{
              fontFamily: 'var(--br-display)', fontWeight: 800,
              fontSize: 'clamp(48px, 8vw, 96px)', lineHeight: 0.95,
              letterSpacing: '-0.04em', color: '#0A0A0F',
              margin: '0 0 22px',
            }}>
              <span {...marker('news.title')}>{d.title}</span>
            </motion.h1>

            <motion.p variants={fadeUp} style={{
              fontFamily: 'var(--br-body)', fontSize: 'clamp(14px, 1.5vw, 17px)',
              color: 'rgba(0,0,0,0.48)', maxWidth: 500, lineHeight: 1.6, margin: 0,
            }}>
              <span {...marker('news.desc')}>{d.desc}</span>
            </motion.p>
          </motion.div>
        </section>

        {/* ── DIVIDER ──────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', maxWidth: 1280, margin: '0 auto 0', padding: '0 clamp(16px, 5vw, 56px)' }} />

        {/* ── CONTENT ──────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(48px, 6vw, 72px) clamp(16px, 5vw, 56px) clamp(80px, 10vw, 120px)', maxWidth: 1280, margin: '0 auto' }}>

          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 'clamp(60px, 8vw, 100px) 0' }}>
              <p style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.14em', color: '#dc2626', textTransform: 'uppercase', marginBottom: 12 }}>Error</p>
              <p style={{ fontFamily: 'var(--br-display)', fontSize: 'clamp(22px, 3vw, 32px)', color: '#0A0A0F', letterSpacing: '-0.02em' }}><span {...marker('news.error')}>{d.error}</span></p>
            </div>
          ) : articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'clamp(60px, 8vw, 100px) 0' }}>
              <p style={{ fontFamily: 'var(--br-mono)', fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.36)', textTransform: 'uppercase', marginBottom: 12 }}>Nothing here</p>
              <p style={{ fontFamily: 'var(--br-display)', fontSize: 'clamp(22px, 3vw, 32px)', color: '#0A0A0F', letterSpacing: '-0.02em' }}><span {...marker('news.empty')}>{d.empty}</span></p>
            </div>
          ) : (
            <motion.div
              variants={stagger} initial="hidden" animate="visible"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 24,
                alignItems: 'stretch',
              }}
            >
              {articles.map((article) => (
                <motion.div key={article.id} variants={fadeUp} style={{ display: 'flex', flexDirection: 'column' }}>
                  <NewsCard article={article} locale={locale} readMoreLabel={d.readMore} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* ── BOTTOM CTA ───────────────────────────────────────── */}
        {!loading && !error && articles.length > 0 && (
          <section style={{
            background: '#FFD700',
            padding: 'clamp(48px, 7vw, 80px) clamp(16px, 5vw, 56px)',
            textAlign: 'center',
          }}>
            <motion.div
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 style={{
                fontFamily: 'var(--br-display)', fontWeight: 800,
                fontSize: 'clamp(28px, 5vw, 56px)', lineHeight: 0.97,
                letterSpacing: '-0.035em', color: '#0A0A0F',
                margin: '0 0 14px',
              }}>
                Ready to explore Bali?
              </h2>
              <p style={{
                fontFamily: 'var(--br-body)', fontSize: 'clamp(13px, 1.4vw, 16px)',
                color: 'rgba(0,0,0,0.56)', margin: '0 auto 32px', maxWidth: 400, lineHeight: 1.55,
              }}>
                Rent a scooter and discover the island on your own terms.
              </p>
              <a href="/catalog" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: '#0A0A0F', color: '#FFD700',
                fontFamily: 'var(--br-display)', fontSize: 'clamp(14px, 1.4vw, 17px)', fontWeight: 800,
                padding: '0 clamp(28px, 4vw, 44px)', height: 'clamp(52px, 5.5vw, 62px)', borderRadius: 999,
                textDecoration: 'none', letterSpacing: '-0.02em',
                boxShadow: '0 14px 36px -12px rgba(0,0,0,0.42)',
              }}>
                Browse Scooters
                <ArrowRightIcon size={15} color="#FFD700" strokeWidth={2.5} />
              </a>
            </motion.div>
          </section>
        )}
      </main>

      <style>{`
        .br-news-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 56px -20px rgba(0,0,0,0.16) !important;
          border-color: rgba(255,215,0,0.55) !important;
        }
        .br-news-card:hover .br-news-card-img {
          transform: scale(1.05);
        }
      `}</style>

      <SiteFooter />
    </>
  );
}
