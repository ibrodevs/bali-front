import type { Metadata } from 'next';

import { buildManagedPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata('payment', {
    index: false,
  });
}

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
