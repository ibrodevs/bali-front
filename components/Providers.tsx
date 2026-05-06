'use client';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import { AuthProvider } from '@/lib/i18n/AuthProvider';
import { CurrencyProvider } from '@/lib/i18n/CurrencyProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
