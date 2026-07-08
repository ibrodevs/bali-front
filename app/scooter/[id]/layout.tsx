import type { Metadata } from 'next';

import { buildScooterMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return buildScooterMetadata(params.id);
}

export default function ScooterDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
