'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BREyebrow, BRPrimary } from '@/components/BR';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const { t, locale } = useLocale();
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSubmitting(true);
    try {
      await signUp({ email, password, full_name: name, phone, language: locale });
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.auth.error);
    } finally {
      setSubmitting(false);
    }
  }

  const fg = '#000', bg = '#fff', border = 'rgba(0,0,0,0.08)', sub = 'rgba(0,0,0,0.55)';

  return (
    <div style={{ background: bg, color: fg, minHeight: '100vh' }}>
      <SiteHeader />
      <div className="br-auth-shell" style={{ maxWidth: 460, margin: '64px auto', padding: '0 24px' }}>
        <BREyebrow>BALI-RENT · {t.auth.register.toUpperCase()}</BREyebrow>
        <h1 className="br-display" style={{ fontSize: 'clamp(40px, 10vw, 56px)', lineHeight: 0.98, letterSpacing: '-0.03em', margin: '12px 0 32px' }}>{t.auth.register}</h1>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <div className="br-field"><input required value={name} onChange={(e) => setName(e.target.value)} style={{ background: bg, color: fg, borderColor: border }} /><label>{t.auth.name}</label></div>
          <div className="br-field"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ background: bg, color: fg, borderColor: border }} /><label>{t.auth.email}</label></div>
          <div className="br-field"><input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ background: bg, color: fg, borderColor: border }} /><label>{t.auth.phone}</label></div>
          <div className="br-field"><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ background: bg, color: fg, borderColor: border }} /><label>{t.auth.password}</label></div>
          {error && <div className="br-mono" style={{ color: '#B91C1C', fontSize: 13 }}>{error}</div>}
          <BRPrimary type="submit" disabled={submitting} full style={{ marginTop: 8, padding: '16px' }}>{submitting ? t.common.loading : t.auth.registerCta}</BRPrimary>
        </form>
        <p style={{ fontSize: 14, color: sub, marginTop: 28 }}>
          {t.auth.haveAccount} <Link href="/login" style={{ color: fg, textDecoration: 'underline' }}>{t.auth.login}</Link>
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
