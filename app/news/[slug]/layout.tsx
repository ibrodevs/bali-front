import type { Metadata } from 'next';

import { buildNewsArticleMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return buildNewsArticleMetadata(params.slug);
}

export default function NewsArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
