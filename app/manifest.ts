import type { MetadataRoute } from 'next';

import { getNewsBasePath, getSeoPageSettings } from '@/lib/seo';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const pageSettings = await getSeoPageSettings();
  const startUrl = pageSettings.home.path;
  const shortcuts = [
    {
      name: 'Catalog',
      short_name: 'Catalog',
      url: pageSettings.catalog.path,
    },
    {
      name: 'Prices',
      short_name: 'Prices',
      url: pageSettings.prices.path,
    },
    {
      name: 'News',
      short_name: 'News',
      url: await getNewsBasePath(),
    },
  ];

  return {
    name: 'BALI-RENT',
    short_name: 'BALI-RENT',
    description: 'Premium scooter rental in Bali with delivery and 24/7 support.',
    start_url: startUrl,
    display: 'standalone',
    background_color: '#FAFAF5',
    theme_color: '#FFD700',
    icons: [
      {
        src: '/logo1.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    shortcuts,
  };
}
