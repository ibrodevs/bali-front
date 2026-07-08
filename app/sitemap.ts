import type { MetadataRoute } from 'next';

import { getNewsBasePath, getSitemapNewsArticles, getSitemapScooters, getSitemapStaticEntries, toAbsoluteUrl } from '@/lib/seo';
import { resolveScooterRouteId } from '@/lib/displayScooter';
import { joinPagePath } from '@/lib/pageSettings';

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [staticEntries, newsBasePath, articles, scooters] = await Promise.all([
    getSitemapStaticEntries(),
    getNewsBasePath(),
    getSitemapNewsArticles().catch(() => []),
    getSitemapScooters().catch(() => []),
  ]);

  const dynamicNewsEntries = articles.map((article) => ({
    url: toAbsoluteUrl(joinPagePath(newsBasePath, article.slug)),
    lastModified: article.published_at ? new Date(article.published_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const dynamicScooterEntries = scooters.map((scooter) => {
    const routeId = resolveScooterRouteId(scooter.slug || scooter.id, scooter.title) || String(scooter.slug || scooter.id);
    return {
      url: toAbsoluteUrl(`/scooter/${routeId}`),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    };
  });

  const deduped = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const entry of [...staticEntries, ...dynamicNewsEntries, ...dynamicScooterEntries]) {
    deduped.set(entry.url, entry);
  }

  return [...deduped.values()];
}

