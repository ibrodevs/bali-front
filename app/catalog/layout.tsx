import type { Metadata } from 'next';

import { buildManagedPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata('catalog');
}

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
