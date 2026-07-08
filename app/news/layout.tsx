import type { Metadata } from 'next';

import { buildManagedPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata('news');
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
