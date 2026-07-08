import { notFound } from 'next/navigation';

import HomePage from '@/app/page';
import BookingPage from '@/app/booking/page';
import CatalogPage from '@/app/catalog/page';
import HowItWorksPage from '@/app/how-it-works/page';
import LocationsPage from '@/app/locations/page';
import LoginPage from '@/app/login/page';
import NewsPage from '@/app/news/page';
import { NewsArticlePageContent } from '@/app/news/[slug]/page';
import PaymentPage from '@/app/payment/page';
import PricesPage from '@/app/prices/page';
import ProfilePage from '@/app/profile/page';
import RegisterPage from '@/app/register/page';
import { resolveAliasPath } from '@/lib/serverPageAliases';

export const dynamic = 'force-dynamic';

export default async function AliasPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const pathname = `/${(params.slug || []).join('/')}`;
  const resolution = await resolveAliasPath(pathname);

  if (!resolution) {
    notFound();
  }

  if (resolution.pageKey === 'news' && resolution.childSegments?.length) {
    return <NewsArticlePageContent slugOverride={resolution.childSegments[0]} />;
  }

  switch (resolution.pageKey) {
    case 'home':
      return <HomePage />;
    case 'catalog':
      return <CatalogPage />;
    case 'prices':
      return <PricesPage />;
    case 'how':
      return <HowItWorksPage />;
    case 'locations':
      return <LocationsPage />;
    case 'news':
      return <NewsPage />;
    case 'booking':
      return <BookingPage />;
    case 'payment':
      return <PaymentPage />;
    case 'login':
      return <LoginPage />;
    case 'register':
      return <RegisterPage />;
    case 'profile':
      return <ProfilePage />;
    default:
      notFound();
  }
}
