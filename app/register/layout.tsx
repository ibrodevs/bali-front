import type { Metadata } from 'next';

import { buildManagedPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata('register', {
    index: false,
  });
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
