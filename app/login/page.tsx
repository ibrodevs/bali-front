'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BRLogo } from '@/components/BR';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useAuth } from '@/lib/i18n/AuthProvider';
import { ApiError } from '@/lib/api';
import { CheckIcon, ScooterIcon, StarIcon } from '@/components/Icons';
import { useSiteContentPreview } from '@/lib/siteContentPreview';
import { endpoints } from '@/lib/endpoints';
import { PageTitleSync, usePagePath } from '@/lib/usePageSettings';

const RESET_COPY = {
  en: {
    forgot: 'Forgot password?',
    title: 'Set a new password',
    hint: 'We found your account. Enter a new password to continue.',
    request: 'Prepare reset →',
    submit: 'Save new password →',
  },
  ru: {
    forgot: 'Забыли пароль?',
    title: 'Введите новый пароль',
    hint: 'Мы нашли ваш аккаунт. Введите новый пароль, чтобы продолжить.',
    request: 'Подготовить сброс →',
    submit: 'Сохранить новый пароль →',
  },
  zh: {
    forgot: '忘记密码？',
    title: '设置新密码',
    hint: '我们已找到您的账户。请输入新密码继续。',
    request: '准备重置 →',
    submit: '保存新密码 →',
  },
  id: {
    forgot: 'Lupa kata sandi?',
    title: 'Masukkan kata sandi baru',
    hint: 'Akun Anda ditemukan. Masukkan kata sandi baru untuk melanjutkan.',
    request: 'Siapkan reset →',
    submit: 'Simpan kata sandi baru →',
  },
  de: {
    forgot: 'Passwort vergessen?',
    title: 'Neues Passwort festlegen',
    hint: 'Dein Konto wurde gefunden. Gib ein neues Passwort ein, um fortzufahren.',
    request: 'Reset vorbereiten →',
    submit: 'Neues Passwort speichern →',
  },
  fr: {
    forgot: 'Mot de passe oublié ?',
    title: 'Définir un nouveau mot de passe',
    hint: 'Nous avons trouvé votre compte. Saisissez un nouveau mot de passe pour continuer.',
    request: 'Préparer la réinitialisation →',
    submit: 'Enregistrer le nouveau mot de passe →',
  },
} as const;

export default function LoginPage() {
  const { t, locale } = useLocale();
  const { marker } = useSiteContentPreview();
  const { signIn } = useAuth();
  const router = useRouter();
  const homePath = usePagePath('home');
  const registerPath = usePagePath('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSession, setResetSession] = useState<{ uid: string; token: string } | null>(null);
  const resetCopy = RESET_COPY[locale as keyof typeof RESET_COPY] || RESET_COPY.en;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (resetSession) {
        await endpoints.confirmPasswordReset({
          uid: resetSession.uid,
          token: resetSession.token,
          new_password: password,
        });
      }

      await signIn(email, password);
      router.push(homePath);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.auth.error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setSubmitting(true);
    try {
      const response = await endpoints.requestPasswordReset({ email });
      setResetSession({ uid: response.uid, token: response.token });
      setPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.auth.error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh', fontFamily: 'var(--br-body)' }} className="br-auth-layout">
      <PageTitleSync pageKey="login" />

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
            fontFamily: 'var(--br-display)', color: '#fff',
            fontSize: 'clamp(30px, 4vw, 50px)', lineHeight: 0.95,
            letterSpacing: '-0.035em', fontWeight: 800, margin: '0 0 16px',
          }}>
            <span {...marker('auth.loginHero')} style={{ color: '#FFD700' }}>{t.auth.loginHero}</span>
          </h2>

          <p {...marker('auth.loginTagline')} style={{ color: 'rgba(255,255,255,0.48)', fontSize: 15, lineHeight: 1.65, maxWidth: 320, margin: '0 0 32px' }}>
            {t.auth.loginTagline}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {t.auth.loginBenefits.map((item: string) => (
              <div {...marker('auth.loginBenefits')} key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            <span {...marker('auth.loginQuote')}>"{t.auth.loginQuote}"</span>
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.1em', marginTop: 8, textTransform: 'uppercase' }}>
            <span {...marker('auth.loginQuoteMeta')}>{t.auth.loginQuoteMeta}</span>
          </p>
        </div>
      </div>

      {/* ── ПРАВАЯ ПАНЕЛЬ ────────────────────────────────────────── */}
      <div className="br-auth-right" style={{
        background: '#FAFAF5',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: 'clamp(28px, 5vw, 64px) clamp(24px, 6vw, 80px)',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <Link href={homePath} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(0,0,0,0.38)', fontSize: 13, textDecoration: 'none', marginBottom: 40, fontFamily: 'var(--br-mono)', letterSpacing: '0.06em' }}>
            ← Bali-Rent
          </Link>

          <h1 style={{
            fontFamily: 'var(--br-display)', color: '#0A0A0F',
            fontSize: 'clamp(28px, 4vw, 38px)', lineHeight: 1,
            letterSpacing: '-0.03em', fontWeight: 800, margin: '0 0 8px',
          }}>
            <span {...marker(resetSession ? 'auth.password' : 'auth.login')}>{resetSession ? resetCopy.title : t.auth.login}</span>
          </h1>
          <p style={{ color: 'rgba(0,0,0,0.42)', fontSize: 14, margin: '0 0 36px', lineHeight: 1.5 }}>
            {resetSession ? (
              <span>{resetCopy.hint}</span>
            ) : (
              <>
                <span {...marker('auth.noAccount')}>{t.auth.noAccount}</span>{' '}
                <Link href={registerPath} style={{ color: '#0A0A0F', fontWeight: 600, textDecoration: 'none', borderBottom: '1.5px solid #FFD700' }}>
                  <span {...marker('auth.register')}>{t.auth.register}</span>
                </Link>
              </>
            )}
          </p>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', marginBottom: 6 }}>
                <span {...marker('auth.email')}>{t.auth.email}</span>
              </label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                readOnly={Boolean(resetSession)}
                style={{ width: '100%', fontSize: 15, fontFamily: 'var(--br-body)', padding: '14px 16px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff', color: '#0A0A0F', outline: 'none', transition: 'border-color 160ms, box-shadow 160ms' }}
                onFocus={(e) => { e.target.style.borderColor = '#FFD700'; e.target.style.boxShadow = '0 0 0 3px rgba(255,215,0,0.2)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--br-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', marginBottom: 6 }}>
                <span {...marker('auth.password')}>{t.auth.password}</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', fontSize: 15, fontFamily: 'var(--br-body)', padding: '14px 56px 14px 16px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff', color: '#0A0A0F', outline: 'none', transition: 'border-color 160ms, box-shadow 160ms' }}
                  onFocus={(e) => { e.target.style.borderColor = '#FFD700'; e.target.style.boxShadow = '0 0 0 3px rgba(255,215,0,0.2)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(0,0,0,0.12)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.35)', fontSize: 11, fontFamily: 'var(--br-mono)', padding: 4, letterSpacing: '0.06em' }}>
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {!resetSession ? (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={submitting}
                style={{ alignSelf: 'flex-end', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#0A0A0F', fontSize: 13, fontFamily: 'var(--br-body)' }}
              >
                {resetCopy.forgot}
              </button>
            ) : null}

            {error && (
              <div style={{ background: 'rgba(185,28,28,0.07)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 10, padding: '12px 16px', color: '#B91C1C', fontSize: 13, lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting}
              style={{ width: '100%', height: 54, borderRadius: 14, background: '#FFD700', color: '#0A0A0F', fontFamily: 'var(--br-display)', fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 8px 28px -8px rgba(255,215,0,0.55)', transition: 'opacity 160ms, transform 160ms', marginTop: 4 }}>
              <span {...marker(submitting ? 'common.loading' : resetSession ? 'common.save' : 'auth.loginCta')}>
                {submitting ? t.common.loading : resetSession ? resetCopy.submit : t.auth.loginCta}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
