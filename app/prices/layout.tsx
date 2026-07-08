import type { Metadata } from 'next';

import { buildManagedPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata('prices');
}

export default function PricesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
