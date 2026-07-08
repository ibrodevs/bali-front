import type { Metadata } from 'next';

import { buildManagedPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata('login', {
    index: false,
  });
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
