import type { Metadata } from 'next';

import AdminRouteShell from '@/components/AdminRouteShell';

export const metadata: Metadata = {
  title: 'Admin · BALI-RENT',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteShell>{children}</AdminRouteShell>;
}
