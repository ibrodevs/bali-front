import type { Metadata } from 'next';

import { buildManagedPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata('locations');
}

export default function LocationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
