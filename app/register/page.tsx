'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BRLogo } from '@/components/BR';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { ApiError } from '@/lib/api';
import { CheckIcon, ScooterIcon, StarIcon } from '@/components/Icons';

export default function RegisterPage() {
  const { t, locale } = useLocale();
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUp({ email, password, full_name: name, phone, language: locale });
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.auth.error);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', fontSize: 15, fontFamily: 'var(--br-body)',
    padding: '14px 16px', borderRadius: 12,
    border: '1.5px solid rgba(0,0,0,0.12)',
    background: '#fff', color: '#0A0A0F', outline: 'none',
    transition: 'border-color 160ms, box-shadow 160ms',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--br-mono)', fontSize: 10,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'rgba(0,0,0,0.45)', marginBottom: 6,
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#FFD700';
    e.target.style.boxShadow = '0 0 0 3px rgba(255,215,0,0.2)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(0,0,0,0.12)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh', fontFamily: 'var(--br-body)' }} className="br-auth-layout">

      {/* ── ЛЕВАЯ ПАНЕЛЬ ─────────────────────────────────────────── */}
      <div className="br-auth-left" style={{
        background: '#0A0A0F',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 'clamp(28px, 4vw, 52px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{ position: 'absolute', bottom: -120, right: -80, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', top: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <BRLogo size={22} dark />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBlock: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScooterIcon size={22} color="#FFD700" strokeWidth={1.8} />
            </div>
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} size={13} color="#FFD700" />)}
              <span style={{ fontFamily: 'var(--br-mono)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 6, letterSpacing: '0.06em' }}>4.97</span>
            </div>
          </div>

          <h2 style={{
            fontFamily: 'var(--br-display)', color: '#FFD700',
            fontSize: 'clamp(30px, 4vw, 50px)', lineHeight: 0.95,
            letterSpacing: '-0.035em', fontWeight: 800, margin: '0 0 16px',
          }}>
            {t.auth.registerHero}
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: 15, lineHeight: 1.65, maxWidth: 320, margin: '0 0 32px' }}>
            {t.auth.registerTagline}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {t.auth.registerBenefits.map((item: string) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckIcon size={10} color="#22C55E" strokeWidth={2.5} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.58)', fontSize: 14 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
            "{t.auth.registerQuote}"
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.1em', marginTop: 8, textTransform: 'uppercase' }}>
            {t.auth.registerQuoteMeta}
          </p>
        </div>
      </div>

      {/* ── ПРАВАЯ ПАНЕЛЬ ────────────────────────────────────────── */}
      <div className="br-auth-right" style={{
        background: '#FAFAF5',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: 'clamp(28px, 5vw, 64px) clamp(24px, 6vw, 80px)',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(0,0,0,0.38)', fontSize: 13, textDecoration: 'none', marginBottom: 40, fontFamily: 'var(--br-mono)', letterSpacing: '0.06em' }}>
            ← Bali-Rent
          </Link>

          <h1 style={{
            fontFamily: 'var(--br-display)', color: '#0A0A0F',
            fontSize: 'clamp(28px, 4vw, 38px)', lineHeight: 1,
            letterSpacing: '-0.03em', fontWeight: 800, margin: '0 0 8px',
          }}>
            {t.auth.register}
          </h1>
          <p style={{ color: 'rgba(0,0,0,0.42)', fontSize: 14, margin: '0 0 32px', lineHeight: 1.5 }}>
            {t.auth.haveAccount}{' '}
            <Link href="/login" style={{ color: '#0A0A0F', fontWeight: 600, textDecoration: 'none', borderBottom: '1.5px solid #FFD700' }}>
              {t.auth.login}
            </Link>
          </p>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>{t.auth.name}</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={labelStyle}>{t.auth.phone}</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>{t.auth.email}</label>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <div>
              <label style={labelStyle}>{t.auth.password}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 56 }}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.35)', fontSize: 11, fontFamily: 'var(--br-mono)', padding: 4, letterSpacing: '0.06em' }}>
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 10, padding: '12px 16px', color: '#B91C1C', fontSize: 13, lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting}
              style={{ width: '100%', height: 54, borderRadius: 14, background: '#FFD700', color: '#0A0A0F', fontFamily: 'var(--br-display)', fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 8px 28px -8px rgba(255,215,0,0.55)', transition: 'opacity 160ms, transform 160ms', marginTop: 4 }}>
              {submitting ? t.common.loading : t.auth.registerCta}
            </button>

            <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.32)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
              {t.auth.termsNote}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
