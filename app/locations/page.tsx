'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { ArrowRightIcon, CheckIcon, DeliveryIcon, ScooterIcon, WhatsAppIcon } from '@/components/Icons';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useCurrency } from '@/lib/i18n/CurrencyProvider';
import { endpoints } from '@/lib/endpoints';
import { BR_LOCATIONS } from '@/lib/data';
import { useSiteContentPreview } from '@/lib/siteContentPreview';

const WA_LINK = 'https://wa.me/628135915173?text=Hi%2C%20I%E2%80%99d%20like%20to%20rent%20a%20scooter%20in%20Bali!';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

type Zone = {
  id: number;
  name: string;
  freeDelivery?: boolean;
  deliveryFeeUSD?: number;
  timeMinutes?: number;
};

type LocationOverrides = {
  title1?: string; title2?: string; desc?: string;
  mapEyebrow?: string; mapRegion?: string;
  zonesLabel?: string; zonesTitle?: string; zonesDesc?: string;
};

export default function LocationsPage() {
  const { t, locale } = useLocale();
  const { marker } = useSiteContentPreview();
  const { convertPrice, symbol } = useCurrency();
  const [zones, setZones] = useState<Zone[]>([]);
  const [locOver, setLocOver] = useState<LocationOverrides>({});

  useEffect(() => {
    let cancelled = false;
    endpoints.bootstrap(locale)
      .then((bootstrap) => {
        if (cancelled) return;
        if (bootstrap.deliveryZones?.length) {
          setZones(
            bootstrap.deliveryZones.map((z) => ({
              id: z.id, name: z.name,
              freeDelivery: z.freeDelivery,
              deliveryFeeUSD: z.deliveryFeeUSD,
              timeMinutes: z.timeMinutes,
            })),
          );
        }
        const ls = (bootstrap as Record<string, unknown>).locationSection;
        if (ls && typeof ls === 'object') setLocOver(ls as LocationOverrides);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [locale]);

  const activeZones = useMemo<Zone[]>(() => {
    return zones.length
      ? zones
      : BR_LOCATIONS.map((name, i) => ({ id: i, name, freeDelivery: true }));
  }, [zones]);
  const deliveryCopy = t.delivery;

  return (
    <div style={{
      width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: '#FAFAF5', color: '#0A0A0F',
      fontFamily: 'var(--br-body)', WebkitFontSmoothing: 'antialiased',
    }}>
      <SiteHeader />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section style={{
        background: '#0A0A0F', color: '#fff',
        padding: '120px clamp(16px, 5vw, 56px) 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: -40, right: -20,
          fontFamily: 'var(--br-display)',
          fontSize: 'clamp(220px, 28vw, 420px)',
          lineHeight: 0.8, fontWeight: 800, letterSpacing: '-0.06em',
          color: 'rgba(255,255,255,0.04)', pointerEvents: 'none', userSelect: 'none',
        }}>06</div>

        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="br-mono" style={{
              fontSize: 11, letterSpacing: '0.18em', color: '#FFD700',
              marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 28, height: 1, background: '#FFD700' }} />
              <span {...marker('delivery.eyebrow')}>{t.delivery.eyebrow}</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="br-display"
            style={{
              margin: '0 0 20px',
              fontSize: 'clamp(52px, 9vw, 116px)',
              lineHeight: 0.92, letterSpacing: '-0.04em', fontWeight: 800,
            }}
          >
            <span {...marker('delivery.title1')}>{locOver.title1 || t.delivery.title1}</span><br />
            <span {...marker('delivery.title2')} style={{ color: '#FFD700' }}>{locOver.title2 || t.delivery.title2}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(14px, 1.6vw, 18px)',
              color: 'rgba(255,255,255,0.62)',
              maxWidth: 540, lineHeight: 1.6, margin: '0 0 36px',
            }}
          >
            <span {...marker('delivery.desc')}>{locOver.desc || t.delivery.desc}</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)',
              padding: '8px 16px', borderRadius: 999,
            }}>
              <DeliveryIcon size={14} color="#FFD700" />
              <span className="br-mono" style={{ fontSize: 11, color: '#FFD700', letterSpacing: '0.12em' }}>
                <span {...marker('delivery.zonesCount')}>{deliveryCopy.zonesCount.replace('{n}', String(activeZones.length))}</span>
              </span>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
              padding: '8px 16px', borderRadius: 999,
            }}>
              <CheckIcon size={12} color="#22C55E" strokeWidth={2.5} />
              <span className="br-mono" style={{ fontSize: 11, color: '#22C55E', letterSpacing: '0.12em' }}>
                <span {...marker('delivery.freeInMostZones')}>{deliveryCopy.freeInMostZones}</span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── ZONES GRID ──────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(52px, 7vw, 96px) clamp(16px, 5vw, 56px)', background: '#fff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            style={{ marginBottom: 48 }}
          >
            <motion.div variants={fadeUp} className="br-mono" style={{
              fontSize: 11, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.45)',
              marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 28, height: 1, background: '#000' }} />
              <span {...marker('delivery.zonesLabel')}>{locOver.zonesLabel || deliveryCopy.zonesLabel}</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="br-display" style={{
              margin: '0 0 12px',
              fontSize: 'clamp(32px, 5.5vw, 64px)',
              lineHeight: 0.97, letterSpacing: '-0.035em', color: '#0A0A0F',
            }}>
              <span {...marker('delivery.zonesTitle')}>{locOver.zonesTitle || deliveryCopy.zonesTitle}</span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{
              fontSize: 'clamp(14px, 1.4vw, 16px)', color: 'rgba(0,0,0,0.52)',
              maxWidth: 480, lineHeight: 1.6, margin: 0,
            }}>
              <span {...marker('delivery.zonesDesc')}>{locOver.zonesDesc || deliveryCopy.zonesDesc}</span>
            </motion.p>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {activeZones.map((zone, i) => (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.55, delay: (i % 5) * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <div style={{
                  padding: '24px 20px',
                  background: '#FAFAF5',
                  border: '1.5px solid rgba(0,0,0,0.07)',
                  borderRadius: 18,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div aria-hidden className="br-mono" style={{
                    position: 'absolute', top: 14, right: 14,
                    fontSize: 11, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.16)',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>

                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: '#FFD700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <DeliveryIcon size={20} color="#0A0A0F" />
                  </div>

                  <div className="br-display" style={{
                    fontSize: 'clamp(16px, 1.8vw, 20px)',
                    letterSpacing: '-0.02em', lineHeight: 1.1,
                    marginBottom: 10, color: '#0A0A0F',
                  }}>
                    {zone.name}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {zone.freeDelivery !== false ? (
                      <>
                        <CheckIcon size={12} color="#22C55E" strokeWidth={2.5} />
                        <span className="br-mono" style={{ fontSize: 11, color: '#22C55E', letterSpacing: '0.1em' }}>
                          {`${t.home.deliveryFree} ${deliveryCopy.deliverySuffix}`}
                        </span>
                      </>
                    ) : (
                      <>
                        <DeliveryIcon size={12} color="rgba(0,0,0,0.45)" />
                        <span className="br-mono" style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.1em' }}>
                          {zone.deliveryFeeUSD
                            ? deliveryCopy.paidFrom.replace('{price}', `${symbol}${Math.round(convertPrice(zone.deliveryFeeUSD))}`)
                            : deliveryCopy.smallFee
                          }
                        </span>
                      </>
                    )}
                  </div>

                  {zone.timeMinutes ? (
                    <div className="br-mono" style={{
                      marginTop: 8, fontSize: 10, color: 'rgba(0,0,0,0.35)',
                      letterSpacing: '0.1em',
                    }}>
                      {deliveryCopy.minDelivery.replace('{n}', String(zone.timeMinutes))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW DELIVERY WORKS ──────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(52px, 7vw, 96px) clamp(16px, 5vw, 56px)',
        background: '#0A0A0F', color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 80% 0%, rgba(255,215,0,0.08), transparent 55%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            style={{ marginBottom: 48 }}
          >
            <motion.div variants={fadeUp} className="br-mono" style={{
              fontSize: 11, letterSpacing: '0.18em', color: '#FFD700',
              marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 28, height: 1, background: '#FFD700' }} />
              <span>{deliveryCopy.howLabel}</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="br-display" style={{
              margin: '0 0 12px',
              fontSize: 'clamp(32px, 5.5vw, 64px)',
              lineHeight: 0.97, letterSpacing: '-0.035em',
            }}>
              {deliveryCopy.howTitle}
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="br-home-process-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}
          >
            {deliveryCopy.steps.map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} style={{
                padding: '32px 28px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 18, position: 'relative',
              }}>
                <div className="br-display" style={{
                  fontSize: 80, lineHeight: 0.85, letterSpacing: '-0.05em',
                  color: '#FFD700', marginBottom: 16,
                }}>
                  {step.num}
                </div>
                <div className="br-display" style={{
                  fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 10,
                }}>
                  <span {...marker('delivery.steps')}>{step.title}</span>
                </div>
                <p {...marker('delivery.steps')} style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  {step.desc}
                </p>
                {i < 2 && (
                  <div aria-hidden className="br-process-arrow" style={{
                    position: 'absolute', top: '50%', right: -18,
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#FFD700', color: '#0A0A0F',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: 'translateY(-50%)',
                    zIndex: 2, boxShadow: '0 4px 14px -4px rgba(255,215,0,0.55)',
                  }}>
                    <ArrowRightIcon size={16} color="#0A0A0F" strokeWidth={2.5} />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── MAP ─────────────────────────────────────────────────────── */}
      <section style={{ background: '#0C0C12', position: 'relative' }}>
        <div style={{ position: 'relative', height: 'clamp(300px, 45vw, 560px)' }}>
          <iframe
            title={t.home.mapTitle}
            src="https://www.openstreetmap.org/export/embed.html?bbox=114.43%2C-8.95%2C115.72%2C-8.03&layer=mapnik"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(12,12,18,0.18) 0%, transparent 20%, transparent 80%, rgba(12,12,18,0.55) 100%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: 18, left: 18,
            background: 'rgba(12,12,18,0.82)', backdropFilter: 'blur(12px)',
            color: '#fff', padding: '12px 16px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div className="br-mono" style={{
              fontSize: 10, letterSpacing: '0.16em', color: '#FFD700',
              marginBottom: 4, textTransform: 'uppercase',
            }}>
              <span {...marker('home.mapEyebrow')}>{t.home.mapEyebrow}</span>
            </div>
            <div {...marker('home.mapRegion')} className="br-display" style={{ fontSize: 16 }}>{t.home.mapRegion}</div>
          </div>
          <div style={{
            position: 'absolute', bottom: 18, right: 18,
            background: 'rgba(12,12,18,0.7)', backdropFilter: 'blur(8px)',
            color: 'rgba(255,255,255,0.6)', padding: '8px 12px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span className="br-mono" style={{ fontSize: 10, letterSpacing: '0.12em' }}>
              <span {...marker('home.mapDrag')}>{t.home.mapDrag}</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{
        background: '#FFD700', color: '#0A0A0F',
        padding: 'clamp(60px, 9vw, 120px) clamp(16px, 5vw, 56px)',
        textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="br-mono" style={{
            fontSize: 11, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.5)',
            marginBottom: 14, textTransform: 'uppercase',
          }}>
            <span {...marker('cta.eyebrow')}>{t.cta.eyebrow}</span>
          </p>
          <h2 className="br-display" style={{
            fontSize: 'clamp(42px, 9vw, 108px)', lineHeight: 0.92,
            letterSpacing: '-0.04em', margin: '0 0 16px',
          }}>
            <span {...marker('cta.title')}>{t.cta.title}</span>
          </h2>
          <p style={{
            fontSize: 'clamp(14px, 1.7vw, 18px)', maxWidth: 440,
            margin: '0 auto 44px', lineHeight: 1.55, color: 'rgba(0,0,0,0.58)',
          }}>
            <span {...marker('cta.desc')}>{t.cta.desc}</span>
          </p>
          <div className="br-cta-btns" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a href="/catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: '#0A0A0F', color: '#FFD700',
              fontFamily: 'var(--br-display)', fontSize: 'clamp(15px, 1.5vw, 18px)', fontWeight: 800,
              padding: '0 clamp(26px, 4vw, 44px)', height: 'clamp(58px, 6.5vw, 70px)', borderRadius: 999,
              textDecoration: 'none', letterSpacing: '-0.02em',
              boxShadow: '0 16px 48px -16px rgba(0,0,0,0.42)',
            }}>
              <ScooterIcon size={18} color="#FFD700" strokeWidth={2} />
              <span {...marker('cta.primary')}>{t.cta.primary}</span>
              <ArrowRightIcon size={15} color="#FFD700" strokeWidth={2.5} />
            </a>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#25D366', color: '#fff',
              fontFamily: 'var(--br-body)', fontSize: 'clamp(14px, 1.4vw, 16px)', fontWeight: 700,
              padding: '0 clamp(20px, 3vw, 32px)', height: 'clamp(58px, 6.5vw, 70px)', borderRadius: 999,
              textDecoration: 'none',
            }}>
              <WhatsAppIcon size={17} color="#fff" />
              <span {...marker('home.whatsappUs')}>{t.home.whatsappUs}</span>
            </a>
          </div>
          <p className="br-mono" style={{
            fontSize: 10, marginTop: 28, letterSpacing: '0.14em',
            color: 'rgba(0,0,0,0.40)', textTransform: 'uppercase',
          }}>
            <span {...marker('cta.terms')}>{t.cta.terms}</span>
          </p>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
}
