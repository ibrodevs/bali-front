import type { Metadata } from 'next';

import { buildManagedPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata('booking', {
    index: false,
  });
}

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
