import AdminRouteShell from '@/components/AdminRouteShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteShell>{children}</AdminRouteShell>;
}
