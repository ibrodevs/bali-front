'use client';

import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import { BRSecondary, BROutline, BREyebrow } from '@/components/BR';
import {
  CheckIcon,
  DeliveryIcon,
  HelmetIcon,
  LightningIcon,
  PhoneIcon,
  PriceTagIcon,
  ShieldIcon,
  SupportIcon,
} from '@/components/Icons';
import { useLocale } from '@/lib/i18n/LocaleProvider';

export default function HowItWorksPage() {
  const { t } = useLocale();
  const bg = '#fff';
  const fg = '#000';
  const sub = 'rgba(0,0,0,0.6)';
  const border = 'rgba(0,0,0,0.1)';

  const steps = (t.process.steps as [string, string][]).map(([title, desc], i) => ({
    title,
    desc,
    icon: [LightningIcon, DeliveryIcon, ShieldIcon][i] || ShieldIcon,
  }));

  const includedItems = [
    { label: t.pricing.inc[0], icon: HelmetIcon },
    { label: t.pricing.inc[1], icon: CheckIcon },
    { label: t.pricing.inc[2], icon: DeliveryIcon },
    { label: t.pricing.inc[3], icon: ShieldIcon },
  ];

  const trustItems = (t.why.items as [string, string][]).map(([title, desc], index) => ({
    title,
    desc,
    icon: [DeliveryIcon, PriceTagIcon, LightningIcon, SupportIcon][index] || SupportIcon,
  }));

  const deliveryItems = [
    { icon: DeliveryIcon, text: t.delivery.free },
    { icon: PhoneIcon, text: t.stats.support },
    { icon: SupportIcon, text: (t.why.items as [string, string][])[3]?.[0] || '' },
  ];

  return (
    <div style={{ width: '100%', background: bg, color: fg, fontFamily: 'var(--br-body)' }}>
      <SiteHeader />

      {/* HERO */}
      <section
        className="br-section"
        style={{
          padding: '120px 48px 72px',
          background: bg,
          color: fg,
          position: 'relative',
          overflow: 'hidden',
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div
          aria-hidden
          className="br-fleet-bgnum"
          style={{
            position: 'absolute',
            top: -40,
            right: -20,
            fontFamily: 'var(--br-display)',
            fontSize: 'clamp(220px, 28vw, 420px)',
            lineHeight: 0.8,
            fontWeight: 800,
            letterSpacing: '-0.06em',
            color: 'rgba(0,0,0,0.04)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          00
        </div>
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
          <div
            className="br-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              color: sub,
              marginBottom: 18,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ width: 28, height: 1, background: '#000' }} />
            <span>00 / 04</span>
            <span>·</span>
            <span style={{ color: '#000', fontWeight: 600 }}>{t.process.eyebrow}</span>
          </div>
          <h1
            className="br-display"
            style={{
              margin: 0,
              fontSize: 'clamp(56px, 9vw, 120px)',
              lineHeight: 0.92,
              letterSpacing: '-0.045em',
              fontWeight: 700,
            }}
          >
            {t.nav.how}
          </h1>
          <p
            style={{
              maxWidth: 720,
              fontSize: 18,
              lineHeight: 1.65,
              color: sub,
              margin: '28px 0 0',
            }}
          >
            {t.process.title} {t.pricing.desc}
          </p>
        </div>
      </section>

      {/* 01 — STEPS */}
      <section
        className="br-section br-process-section"
        style={{ padding: '96px 48px', background: bg, color: fg, position: 'relative', overflow: 'hidden' }}
      >
        <div
          aria-hidden
          className="br-fleet-bgnum"
          style={{
            position: 'absolute',
            top: -40,
            left: -20,
            fontFamily: 'var(--br-display)',
            fontSize: 'clamp(220px, 28vw, 420px)',
            lineHeight: 0.8,
            fontWeight: 800,
            letterSpacing: '-0.06em',
            color: 'rgba(0,0,0,0.04)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          01
        </div>
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
          <div style={{ maxWidth: 760, marginBottom: 56 }}>
            <div
              className="br-mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                color: sub,
                marginBottom: 18,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ width: 28, height: 1, background: '#000' }} />
              <span>01 / 04</span>
              <span>·</span>
              <span style={{ color: '#000', fontWeight: 600 }}>{t.process.eyebrow}</span>
            </div>
            <h2
              className="br-display"
              style={{
                margin: 0,
                fontSize: 'clamp(44px, 6vw, 76px)',
                lineHeight: 0.96,
                letterSpacing: '-0.035em',
              }}
            >
              {t.process.title}
            </h2>
          </div>
          <div
            className="br-home-process-grid br-process-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
          >
            {steps.map((step, i) => (
              <div
                key={i}
                className="br-process-step"
                style={{
                  position: 'relative',
                  padding: '36px 28px 32px',
                  background: '#fff',
                  border: `1px solid ${border}`,
                  borderRadius: 18,
                  overflow: 'hidden',
                  animation: `br-rise 600ms ${i * 110}ms var(--br-easing) both`,
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      i === 0
                        ? 'linear-gradient(180deg, rgba(255,215,0,0.06), transparent 40%)'
                        : 'none',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <div
                    className="br-display br-process-num"
                    style={{
                      fontSize: 88,
                      lineHeight: 0.85,
                      letterSpacing: '-0.05em',
                      color: '#FFD700',
                      WebkitTextStroke: '1px rgba(0,0,0,0.06)',
                    }}
                  >
                    0{i + 1}
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: '#0A0A0A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <step.icon size={22} color="#FFD700" />
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 24,
                    height: 1,
                    background: 'linear-gradient(90deg, #000 0%, transparent 60%)',
                    position: 'relative',
                  }}
                />
                <div
                  className="br-display"
                  style={{
                    fontSize: 26,
                    lineHeight: 1.1,
                    margin: '20px 0 12px',
                    letterSpacing: '-0.02em',
                    position: 'relative',
                  }}
                >
                  {step.title}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: sub, margin: 0, position: 'relative' }}>
                  {step.desc}
                </p>
                {i < steps.length - 1 && (
                  <div
                    aria-hidden
                    className="br-process-arrow"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: -18,
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      background: '#000',
                      color: '#FFD700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      transform: 'translateY(-50%)',
                      boxShadow: '0 8px 18px -8px rgba(0,0,0,0.4)',
                      zIndex: 2,
                    }}
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 02 — PRICING / INCLUDED */}
      <section
        className="br-home-pricing br-pricing-section"
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #0A0A0A 0%, #111 100%)',
          color: '#fff',
          padding: '96px 48px',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)',
          }}
        />
        <div
          aria-hidden
          className="br-fleet-bgnum"
          style={{
            position: 'absolute',
            bottom: -80,
            right: -40,
            fontFamily: 'var(--br-display)',
            fontSize: 'clamp(220px, 28vw, 420px)',
            lineHeight: 0.8,
            fontWeight: 800,
            letterSpacing: '-0.06em',
            color: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          02
        </div>
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
          <div style={{ maxWidth: 880, marginBottom: 48 }}>
            <div
              className="br-mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                color: '#FFD700',
                marginBottom: 18,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ width: 28, height: 1, background: '#FFD700' }} />
              <span>02 / 04</span>
              <span>·</span>
              <span style={{ fontWeight: 600 }}>{t.pricing.eyebrow}</span>
            </div>
            <h2
              className="br-display"
              style={{
                fontSize: 'clamp(44px, 6vw, 76px)',
                lineHeight: 0.96,
                letterSpacing: '-0.035em',
                margin: '0 0 12px',
              }}
            >
              {t.pricing.title} <span style={{ color: '#FFD700' }}>$25</span> {t.pricing.titleSuffix}
            </h2>
            <p
              style={{
                fontSize: 17,
                color: 'rgba(255,255,255,0.65)',
                margin: 0,
                maxWidth: 620,
                lineHeight: 1.55,
              }}
            >
              {t.pricing.desc}
            </p>
          </div>
          <div
            className="br-home-pricing-grid br-pricing-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
          >
            {includedItems.map((item, i) => (
              <div
                key={item.label}
                style={{
                  position: 'relative',
                  padding: '28px 24px 26px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 16,
                  animation: `br-rise 600ms ${i * 90}ms var(--br-easing) both`,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'rgba(255,215,0,0.12)',
                    border: '1px solid rgba(255,215,0,0.28)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 22,
                  }}
                >
                  <item.icon size={26} color="#FFD700" />
                </div>
                <div
                  className="br-display"
                  style={{ fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.15 }}
                >
                  {item.label}
                </div>
                <div
                  aria-hidden
                  style={{ marginTop: 22, height: 2, width: 32, background: '#FFD700' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — DELIVERY */}
      <section
        className="br-section"
        style={{ padding: '96px 48px', background: bg, color: fg, position: 'relative', overflow: 'hidden' }}
      >
        <div
          aria-hidden
          className="br-fleet-bgnum"
          style={{
            position: 'absolute',
            top: -40,
            right: -20,
            fontFamily: 'var(--br-display)',
            fontSize: 'clamp(220px, 28vw, 420px)',
            lineHeight: 0.8,
            fontWeight: 800,
            letterSpacing: '-0.06em',
            color: 'rgba(0,0,0,0.04)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          03
        </div>
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
          <div style={{ maxWidth: 760, marginBottom: 48 }}>
            <div
              className="br-mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                color: sub,
                marginBottom: 18,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ width: 28, height: 1, background: '#000' }} />
              <span>03 / 04</span>
              <span>·</span>
              <span style={{ color: '#000', fontWeight: 600 }}>{t.delivery.eyebrow}</span>
            </div>
            <h2
              className="br-display"
              style={{
                margin: 0,
                fontSize: 'clamp(44px, 6vw, 76px)',
                lineHeight: 0.96,
                letterSpacing: '-0.035em',
              }}
            >
              {t.delivery.title1} <span style={{ color: '#FFD700' }}>{t.delivery.title2}</span>
            </h2>
            <p style={{ margin: '20px 0 0', fontSize: 17, lineHeight: 1.6, color: sub, maxWidth: 620 }}>
              {t.delivery.desc}
            </p>
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
            className="br-home-process-grid"
          >
            {deliveryItems.map((item, i) => (
              <div
                key={item.text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '22px 24px',
                  background: '#fff',
                  border: `1px solid ${border}`,
                  borderRadius: 16,
                  animation: `br-rise 600ms ${i * 90}ms var(--br-easing) both`,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: '#FFD700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <item.icon size={20} color="#000" />
                </div>
                <span style={{ fontSize: 15, color: fg, lineHeight: 1.4 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04 — WHY (TRUST) */}
      <section
        className="br-section br-why-section"
        style={{
          padding: '96px 48px',
          background: '#0A0A0A',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 80% 0%, rgba(255,215,0,0.10), transparent 55%), radial-gradient(circle at 0% 100%, rgba(255,215,0,0.06), transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          className="br-fleet-bgnum"
          style={{
            position: 'absolute',
            bottom: -60,
            left: -20,
            fontFamily: 'var(--br-display)',
            fontSize: 'clamp(220px, 28vw, 420px)',
            lineHeight: 0.8,
            fontWeight: 800,
            letterSpacing: '-0.06em',
            color: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          04
        </div>
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
          <div style={{ maxWidth: 880, marginBottom: 56 }}>
            <div
              className="br-mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.18em',
                color: '#FFD700',
                marginBottom: 18,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ width: 28, height: 1, background: '#FFD700' }} />
              <span>04 / 04</span>
              <span>·</span>
              <span style={{ fontWeight: 600 }}>{t.why.eyebrow}</span>
            </div>
            <h2
              className="br-display"
              style={{
                margin: 0,
                fontSize: 'clamp(44px, 6vw, 76px)',
                lineHeight: 0.96,
                letterSpacing: '-0.035em',
              }}
            >
              {t.why.title}
            </h2>
          </div>
          <div
            className="br-home-why-grid br-why-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
          >
            {trustItems.map((item, k) => (
              <div
                key={item.title}
                className="br-why-card"
                style={{
                  position: 'relative',
                  padding: '32px 24px 28px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  animation: `br-rise 600ms ${k * 90}ms var(--br-easing) both`,
                }}
              >
                <div
                  className="br-why-num br-mono"
                  style={{
                    position: 'absolute',
                    top: 18,
                    right: 20,
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  0{k + 1}
                </div>
                <div
                  className="br-why-icon"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,215,0,0.12)',
                    border: '1px solid rgba(255,215,0,0.28)',
                    marginBottom: 22,
                  }}
                >
                  <item.icon size={28} color="#FFD700" />
                </div>
                <div
                  className="br-display"
                  style={{ fontSize: 24, letterSpacing: '-0.02em', lineHeight: 1.1 }}
                >
                  {item.title}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.6)',
                    marginTop: 12,
                    marginBottom: 0,
                  }}
                >
                  {item.desc}
                </p>
                <div
                  aria-hidden
                  className="br-why-underline"
                  style={{
                    marginTop: 22,
                    height: 2,
                    width: 32,
                    background: '#FFD700',
                    transition: 'width 360ms var(--br-easing)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div
        className="br-home-cta"
        style={{
          background: '#FFD700',
          color: '#000',
          padding: '100px 48px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <BREyebrow style={{ color: 'rgba(0,0,0,0.6)' }}>{t.cta.eyebrow}</BREyebrow>
        <div
          className="br-display"
          style={{
            fontSize: 'clamp(56px, 10vw, 112px)',
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            margin: '12px 0 28px',
          }}
        >
          {t.cta.title}
        </div>
        <p style={{ fontSize: 19, maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.5 }}>
          {t.cta.desc}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <BRSecondary href="/booking" style={{ height: 72, padding: '0 44px', fontSize: 18 }}>
            {t.cta.primary}
          </BRSecondary>
          <BROutline
            href="/catalog"
            style={{ height: 72, padding: '0 32px', fontSize: 16, borderColor: '#000' }}
          >
            {t.cta.secondary}
          </BROutline>
        </div>
        <div
          className="br-mono"
          style={{ fontSize: 11, marginTop: 32, letterSpacing: '0.14em', opacity: 0.7 }}
        >
          {t.cta.terms}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
