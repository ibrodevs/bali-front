'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { endpoints, ApiNewsArticle, unwrapList } from '@/lib/endpoints';
import { mediaUrl } from '@/lib/api';

function formatDate(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function NewsCard({ article, locale, readMoreLabel }: { article: ApiNewsArticle; locale: string; readMoreLabel: string }) {
  const [hovered, setHovered] = useState(false);
  const imgSrc = article.image ? mediaUrl(article.image) : null;

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #EBEBEB',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 220ms, transform 220ms',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', width: '100%', paddingTop: '58%', background: '#F5F5F5', overflow: 'hidden' }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={article.title}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover',
              transition: 'transform 400ms',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
          }}>
            <span style={{ fontSize: 48, opacity: 0.3 }}>📰</span>
          </div>
        )}
      </div>

      <div style={{ padding: '22px 24px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <time style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: '#AAAAAA', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
          {formatDate(article.published_at, locale)}
        </time>

        <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 18, lineHeight: 1.3, letterSpacing: '-0.02em', color: '#000', marginBottom: 10, flex: 0 }}>
          {article.title}
        </h3>

        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#888888', lineHeight: 1.6, flex: 1, marginBottom: 18, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {article.description}
        </p>

        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#000', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {readMoreLabel}
        </span>
      </div>
    </article>
  );
}

export default function NewsPage() {
  const { t, locale } = useLocale();
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
      <main style={{ minHeight: '100vh', background: '#fff' }}>
        {/* Hero */}
        <section style={{ padding: '80px 40px 60px', maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#AAAAAA', textTransform: 'uppercase', marginBottom: 16 }}>
            {d.eyebrow}
          </p>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.05, letterSpacing: '-0.04em', color: '#000', marginBottom: 20 }}>
            {d.title}
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: '#888888', maxWidth: 560, lineHeight: 1.6 }}>
            {d.desc}
          </p>
        </section>

        {/* Cards Grid */}
        <section style={{ padding: '0 40px 100px', maxWidth: 1200, margin: '0 auto' }}>
          {loading ? (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#888888', textAlign: 'center', padding: '80px 0' }}>{d.loading}</p>
          ) : error ? (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#dc2626', textAlign: 'center', padding: '80px 0' }}>{d.error}</p>
          ) : articles.length === 0 ? (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#888888', textAlign: 'center', padding: '80px 0' }}>{d.empty}</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 28,
            }}>
              {articles.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`} style={{ textDecoration: 'none' }}>
                  <NewsCard article={article} locale={locale} readMoreLabel={d.readMore} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
