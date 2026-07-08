import type { Metadata } from 'next';

import { buildManagedPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata('profile', {
    index: false,
  });
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
