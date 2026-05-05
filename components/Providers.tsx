'use client';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import { AuthProvider } from '@/lib/i18n/AuthProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  );
}
