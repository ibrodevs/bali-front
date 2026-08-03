import type { Metadata } from 'next';

import { buildManagedPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildManagedPageMetadata('contacts');
}

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
