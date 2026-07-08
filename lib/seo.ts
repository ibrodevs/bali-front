import { cache } from 'react';
import type { Metadata } from 'next';

import { API_BASE, MEDIA_BASE } from './api';
import type {
  ApiBootstrap,
  ApiNewsArticle,
  ApiScooter,
  ApiScooterDetail,
  Paginated,
} from './endpoints';
import { PAGE_SETTINGS_DEFINITION_MAP, buildPageSettings, joinPagePath, normalizePagePath, type ManagedPageKey } from './pageSettings';
import { resolveScooterImage, resolveScooterRouteId } from './displayScooter';

const DEFAULT_SITE_URL = 'https://bali.bike';
const SITE_NAME = 'BALI-RENT';
const DEFAULT_OG_IMAGE = '/logo.svg';
const SEO_REVALIDATE_SECONDS = 60 * 10;

const INDEXED_PAGE_KEYS = ['home', 'catalog', 'prices', 'how', 'locations', 'news'] as const;
const NOINDEX_PAGE_KEYS = ['booking', 'payment', 'login', 'register', 'profile'] as const;

const PAGE_DESCRIPTION_MAP: Record<ManagedPageKey, string> = {
  home: 'Premium scooter rental in Bali with island-wide delivery, transparent pricing, and 24/7 support.',
  catalog: 'Browse our Bali scooter fleet, compare models, and choose the right bike for your trip.',
  prices: 'See scooter rental prices in Bali, compare rates, and find the best option for your stay.',
  how: 'Learn how BALI-RENT delivery, booking, payments, and support work before your ride starts.',
  locations: 'Explore delivery areas across Bali and see where your scooter can be brought to you.',
  news: 'Travel updates, rental tips, and the latest BALI-RENT news from Bali.',
  booking: 'Complete your scooter booking details and confirm your Bali rental.',
  payment: 'Review and complete payment for your Bali scooter rental booking.',
  login: 'Sign in to manage your scooter rental bookings and account details.',
  register: 'Create your BALI-RENT account to book and manage scooter rentals in Bali.',
  profile: 'Manage your BALI-RENT profile, bookings, and support conversations.',
};

type SeoImage = {
  url: string;
  alt?: string;
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizeSiteUrl(value?: string) {
  const raw = (value || DEFAULT_SITE_URL).trim();
  if (!raw) return DEFAULT_SITE_URL;
  return trimTrailingSlash(raw);
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function getSiteUrl() {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export function toAbsoluteUrl(path = '/') {
  const normalizedPath = normalizePagePath(path, '/');
  return new URL(normalizedPath, `${getSiteUrl()}/`).toString();
}

export function toAbsoluteMediaUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const base = trimTrailingSlash(MEDIA_BASE || getSiteUrl());
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function createSeoDescription(value?: string | null, fallback?: string) {
  const normalized = collapseWhitespace(String(value || fallback || ''));
  if (!normalized) return fallback || '';
  if (normalized.length <= 160) return normalized;
  return `${normalized.slice(0, 157).trimEnd()}...`;
}

function buildApiUrl(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function fetchApiJson<T>(path: string, options?: { lang?: string; query?: Record<string, string | number | undefined> }) {
  const response = await fetch(buildApiUrl(path, options?.query), {
    headers: {
      Accept: 'application/json',
      ...(options?.lang ? { 'Accept-Language': options.lang } : {}),
    },
    next: { revalidate: SEO_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`SEO API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const getSeoPageSettings = cache(async () => {
  try {
    const bootstrap = await fetchApiJson<ApiBootstrap>('/public/bootstrap/', { lang: 'en' });
    return buildPageSettings('en', bootstrap.pageSettings);
  } catch {
    return buildPageSettings('en');
  }
});

export const getNewsArticleForSeo = cache(async (slug: string) => {
  return fetchApiJson<ApiNewsArticle>(`/news/${slug}/`, {
    lang: 'en',
    query: { lang: 'en' },
  });
});

export const getScooterForSeo = cache(async (idOrSlug: string) => {
  return fetchApiJson<ApiScooterDetail>(`/scooters/${idOrSlug}/`, {
    lang: 'en',
  });
});

export const getSitemapNewsArticles = cache(async () => {
  const response = await fetchApiJson<Paginated<ApiNewsArticle> | ApiNewsArticle[]>('/news/', {
    lang: 'en',
    query: { page: 1, page_size: 500, lang: 'en' },
  });
  return Array.isArray(response) ? response : response.results || [];
});

export const getSitemapScooters = cache(async () => {
  const response = await fetchApiJson<Paginated<ApiScooter> | ApiScooter[]>('/scooters/', {
    lang: 'en',
    query: { page: 1, page_size: 500 },
  });
  return Array.isArray(response) ? response : response.results || [];
});

function defaultImages(title: string): SeoImage[] {
  return [{ url: toAbsoluteUrl(DEFAULT_OG_IMAGE), alt: title }];
}

function buildRobots(index: boolean): NonNullable<Metadata['robots']> {
  if (!index) {
    return {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        'max-image-preview': 'none',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    };
  }

  return {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  };
}

export function shouldIndexManagedPage(pageKey: ManagedPageKey) {
  return INDEXED_PAGE_KEYS.includes(pageKey as (typeof INDEXED_PAGE_KEYS)[number]);
}

export async function buildManagedPageMetadata(
  pageKey: ManagedPageKey,
  options?: {
    canonicalPath?: string;
    title?: string;
    description?: string;
    images?: SeoImage[];
    index?: boolean;
  }
): Promise<Metadata> {
  const pageSettings = await getSeoPageSettings();
  const definition = PAGE_SETTINGS_DEFINITION_MAP[pageKey];
  const canonicalPath = normalizePagePath(options?.canonicalPath, pageSettings[pageKey].path);
  const title = options?.title || pageSettings[pageKey].title;
  const description = createSeoDescription(options?.description, PAGE_DESCRIPTION_MAP[pageKey] || definition.description);
  const images = options?.images?.length ? options.images : defaultImages(title);
  const index = options?.index ?? shouldIndexManagedPage(pageKey);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: toAbsoluteUrl(canonicalPath),
      siteName: SITE_NAME,
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((image) => (typeof image === 'string' ? image : image.url)),
    },
    robots: buildRobots(index),
  };
}

export async function buildNewsArticleMetadata(slug: string, canonicalPath?: string): Promise<Metadata> {
  const pageSettings = await getSeoPageSettings();

  try {
    const article = await getNewsArticleForSeo(slug);
    const path = normalizePagePath(canonicalPath, joinPagePath(pageSettings.news.path, article.slug || slug));
    const title = `${article.title} · ${SITE_NAME}`;
    const description = createSeoDescription(article.description, PAGE_DESCRIPTION_MAP.news);
    const image = toAbsoluteMediaUrl(article.image);
    const images = image ? [{ url: image, alt: article.title }] : defaultImages(title);

    return {
      title,
      description,
      alternates: {
        canonical: path,
      },
      openGraph: {
        title,
        description,
        url: toAbsoluteUrl(path),
        siteName: SITE_NAME,
        type: 'article',
        publishedTime: article.published_at,
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: images.map((item) => item.url),
      },
      robots: buildRobots(true),
    };
  } catch {
    return buildManagedPageMetadata('news', {
      canonicalPath: canonicalPath || joinPagePath(pageSettings.news.path, slug),
      title: `News Article · ${SITE_NAME}`,
      description: PAGE_DESCRIPTION_MAP.news,
      index: false,
    });
  }
}

export async function buildScooterMetadata(idOrSlug: string): Promise<Metadata> {
  try {
    const scooter = await getScooterForSeo(idOrSlug);
    const routeId = resolveScooterRouteId(scooter.slug || scooter.id, scooter.title) || String(scooter.slug || scooter.id || idOrSlug);
    const path = `/scooter/${routeId}`;
    const title = `${scooter.title} rental in Bali · ${SITE_NAME}`;
    const description = createSeoDescription(
      scooter.full_description || scooter.short_description,
      `Rent the ${scooter.title} in Bali with delivery, transparent pricing, and quick online booking.`
    );
    const image = toAbsoluteMediaUrl(scooter.main_image) || resolveScooterImage(scooter.slug || scooter.id, scooter.title);
    const images = image ? [{ url: /^https?:\/\//i.test(image) ? image : toAbsoluteUrl(image), alt: scooter.title }] : defaultImages(title);

    return {
      title,
      description,
      alternates: {
        canonical: path,
      },
      openGraph: {
        title,
        description,
        url: toAbsoluteUrl(path),
        siteName: SITE_NAME,
        type: 'website',
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: images.map((item) => item.url),
      },
      robots: buildRobots(true),
    };
  } catch {
    return {
      title: `Scooter Rental · ${SITE_NAME}`,
      description: PAGE_DESCRIPTION_MAP.catalog,
      alternates: {
        canonical: `/scooter/${idOrSlug}`,
      },
      robots: buildRobots(false),
    };
  }
}

export async function getSitemapStaticEntries() {
  const pageSettings = await getSeoPageSettings();
  const now = new Date();

  return INDEXED_PAGE_KEYS.map((pageKey) => {
    const definition = PAGE_SETTINGS_DEFINITION_MAP[pageKey];
    return {
      url: toAbsoluteUrl(pageSettings[pageKey].path),
      lastModified: now,
      changeFrequency: pageKey === 'news' ? 'daily' : 'weekly',
      priority: definition.key === 'home' ? 1 : definition.key === 'catalog' ? 0.9 : 0.8,
    } as const;
  });
}

export async function getNewsBasePath() {
  const pageSettings = await getSeoPageSettings();
  return pageSettings.news.path;
}

export { NOINDEX_PAGE_KEYS, SITE_NAME };
