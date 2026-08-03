'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import {
  ArrowRightIcon,
  CheckIcon,
  MapPinIcon,
  PhoneIcon,
  ScooterIcon,
  SupportIcon,
  TelegramIcon,
  WeChatIcon,
  WhatsAppIcon,
} from '@/components/Icons';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { useSiteSettings } from '@/lib/siteSettings';
import { PageTitleSync, usePagePath } from '@/lib/usePageSettings';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const CONTACT_COPY = {
  en: {
    eyebrow: 'CONTACTS',
    title: 'Contact Us',
    subtitle: 'Message the Bali team, open support chat, or find the office details before your ride.',
    address: 'Address',
    channels: 'Contact channels',
    supportTitle: 'Support chat',
    supportDesc: 'Already have a booking or need help choosing a scooter? Open the support thread.',
    officeTitle: 'Bali office',
    officeDesc: 'Use the address details below for paperwork, pickup coordination, and local reference.',
    book: 'Book a scooter',
    reliable: 'On-island support',
  },
  ru: {
    eyebrow: 'КОНТАКТЫ',
    title: 'Контакты',
    subtitle: 'Напишите команде на Бали, откройте чат поддержки или посмотрите данные офиса перед поездкой.',
    address: 'Адрес',
    channels: 'Каналы связи',
    supportTitle: 'Чат поддержки',
    supportDesc: 'Уже есть бронь или нужна помощь с выбором скутера? Откройте чат поддержки.',
    officeTitle: 'Офис на Бали',
    officeDesc: 'Адрес пригодится для документов, координации выдачи и локального ориентира.',
    book: 'Забронировать скутер',
    reliable: 'Поддержка на острове',
  },
  zh: {
    eyebrow: '联系方式',
    title: '联系我们',
    subtitle: '联系巴厘岛团队、打开支持聊天，或在骑行前查看办公室信息。',
    address: '地址',
    channels: '联系渠道',
    supportTitle: '支持聊天',
    supportDesc: '已有订单或需要选车帮助？打开支持聊天即可。',
    officeTitle: '巴厘岛办公室',
    officeDesc: '以下地址可用于文件、取车协调和本地参考。',
    book: '预订摩托车',
    reliable: '岛上支持',
  },
  id: {
    eyebrow: 'KONTAK',
    title: 'Kontak',
    subtitle: 'Hubungi tim Bali, buka chat support, atau lihat detail kantor sebelum perjalanan.',
    address: 'Alamat',
    channels: 'Kanal kontak',
    supportTitle: 'Chat support',
    supportDesc: 'Sudah punya booking atau butuh bantuan memilih skuter? Buka thread support.',
    officeTitle: 'Kantor Bali',
    officeDesc: 'Gunakan detail alamat untuk dokumen, koordinasi pickup, dan referensi lokal.',
    book: 'Booking skuter',
    reliable: 'Support di pulau',
  },
  de: {
    eyebrow: 'KONTAKT',
    title: 'Kontakt',
    subtitle: 'Schreibe dem Bali-Team, oeffne den Support-Chat oder finde die Bueroangaben vor deiner Fahrt.',
    address: 'Adresse',
    channels: 'Kontaktkanaele',
    supportTitle: 'Support-Chat',
    supportDesc: 'Du hast schon eine Buchung oder brauchst Hilfe bei der Rollerauswahl? Oeffne den Support-Chat.',
    officeTitle: 'Buero auf Bali',
    officeDesc: 'Nutze die Adresse fuer Unterlagen, Abholkoordination und lokale Orientierung.',
    book: 'Roller buchen',
    reliable: 'Support auf der Insel',
  },
  fr: {
    eyebrow: 'CONTACTS',
    title: 'Contacts',
    subtitle: "Contactez l'equipe a Bali, ouvrez le chat support ou consultez les informations du bureau.",
    address: 'Adresse',
    channels: 'Canaux de contact',
    supportTitle: 'Chat support',
    supportDesc: "Vous avez deja une reservation ou besoin d'aide pour choisir un scooter ? Ouvrez le chat support.",
    officeTitle: 'Bureau a Bali',
    officeDesc: "Utilisez l'adresse pour les documents, la coordination du retrait et le repere local.",
    book: 'Reserver un scooter',
    reliable: 'Support sur place',
  },
} as const;

export default function ContactsPage() {
  const { locale } = useLocale();
  const { socialLinks, addresses } = useSiteSettings();
  const catalogPath = usePagePath('catalog');
  const profilePath = usePagePath('profile');
  const copy = CONTACT_COPY[locale as keyof typeof CONTACT_COPY] || CONTACT_COPY.en;
  const supportChatPath = `${profilePath}?tab=support`;
  const addressLine = [
    addresses.businessName,
    addresses.street,
    addresses.district,
    addresses.postalCode,
    addresses.country,
  ].filter(Boolean).join(' · ');

  const channels = [
    { key: 'whatsapp', label: 'WhatsApp', href: socialLinks.whatsapp, icon: <WhatsAppIcon size={23} color="#25D366" /> },
    { key: 'telegram', label: 'Telegram', href: socialLinks.telegram, icon: <TelegramIcon size={23} color="#2AABEE" /> },
    { key: 'wechat', label: 'WeChat', href: socialLinks.wechat, icon: <WeChatIcon size={23} color="#7BB32E" /> },
    { key: 'instagram', label: 'Instagram', href: socialLinks.instagram, icon: <PhoneIcon size={23} color="#FFD700" /> },
    { key: 'tiktok', label: 'TikTok', href: socialLinks.tiktok, icon: <PhoneIcon size={23} color="#FFD700" /> },
    { key: 'facebook', label: 'Facebook', href: socialLinks.facebook, icon: <PhoneIcon size={23} color="#FFD700" /> },
    { key: 'youtube', label: 'YouTube', href: socialLinks.youtube, icon: <PhoneIcon size={23} color="#FFD700" /> },
  ].filter((item) => item.href);

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAF5', color: '#0A0A0F', fontFamily: 'var(--br-body)' }}>
      <PageTitleSync pageKey="contacts" />
      <SiteHeader />

      <section style={{ background: '#0A0A0F', color: '#fff', padding: '120px clamp(16px, 5vw, 56px) 80px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: -34, right: -18, fontFamily: 'var(--br-display)', fontSize: 'clamp(220px, 28vw, 420px)', lineHeight: 0.8, fontWeight: 800, letterSpacing: '-0.06em', color: 'rgba(255,255,255,0.04)', pointerEvents: 'none', userSelect: 'none' }}>
          09
        </div>
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className="br-mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: '#FFD700', marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 28, height: 1, background: '#FFD700' }} />
            {copy.eyebrow}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 38 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }} className="br-display" style={{ margin: '0 0 22px', fontSize: 'clamp(56px, 9vw, 120px)', lineHeight: 0.92, letterSpacing: '-0.045em', fontWeight: 800 }}>
            {copy.title}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} style={{ fontSize: 'clamp(15px, 1.6vw, 19px)', color: 'rgba(255,255,255,0.62)', maxWidth: 600, lineHeight: 1.65, margin: '0 0 34px' }}>
            {copy.subtitle}
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Link href={catalogPath} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#FFD700', color: '#0A0A0F', fontFamily: 'var(--br-display)', fontSize: 16, fontWeight: 800, padding: '0 24px', height: 56, borderRadius: 999, textDecoration: 'none' }}>
              <ScooterIcon size={18} color="#0A0A0F" />
              {copy.book}
            </Link>
            <Link href={supportChatPath} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.16)', color: '#fff', fontSize: 15, fontWeight: 700, padding: '0 22px', height: 56, borderRadius: 999, textDecoration: 'none' }}>
              <SupportIcon size={18} color="#FFD700" />
              {copy.supportTitle}
            </Link>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: 'clamp(52px, 7vw, 96px) clamp(16px, 5vw, 56px)', background: '#fff' }}>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-70px' }} className="br-contacts-grid" style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)', gap: 24, alignItems: 'start' }}>
          <motion.div variants={fadeUp} style={{ display: 'grid', gap: 14 }}>
            <div className="br-mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'rgba(0,0,0,0.46)', textTransform: 'uppercase' }}>
              {copy.channels}
            </div>
            {channels.map((item) => (
              <a key={item.key} href={item.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, minHeight: 78, padding: '18px 20px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, background: '#FAFAF5', color: '#0A0A0F', textDecoration: 'none' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                  <span style={{ width: 46, height: 46, borderRadius: 14, background: '#0A0A0F', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ fontFamily: 'var(--br-display)', fontSize: 'clamp(18px, 2vw, 24px)', lineHeight: 1, fontWeight: 800 }}>
                    {item.label}
                  </span>
                </span>
                <ArrowRightIcon size={17} color="#0A0A0F" strokeWidth={2.5} />
              </a>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} style={{ display: 'grid', gap: 16 }}>
            <div style={{ padding: '28px', background: '#0A0A0F', color: '#fff', borderRadius: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,215,0,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
                <SupportIcon size={22} color="#FFD700" />
              </div>
              <h2 className="br-display" style={{ fontSize: 28, lineHeight: 1, letterSpacing: '-0.025em', margin: '0 0 12px' }}>
                {copy.supportTitle}
              </h2>
              <p style={{ margin: '0 0 22px', fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.62)' }}>
                {copy.supportDesc}
              </p>
              <Link href={supportChatPath} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', minHeight: 54, borderRadius: 14, background: '#FFD700', color: '#0A0A0F', textDecoration: 'none', fontFamily: 'var(--br-display)', fontSize: 16, fontWeight: 800 }}>
                <SupportIcon size={17} color="#0A0A0F" />
                {copy.supportTitle}
              </Link>
            </div>

            <div style={{ padding: '28px', background: '#FAFAF5', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <MapPinIcon size={20} color="#0A0A0F" />
                <span className="br-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.46)', textTransform: 'uppercase' }}>{copy.address}</span>
              </div>
              <h2 className="br-display" style={{ fontSize: 26, lineHeight: 1.05, letterSpacing: '-0.025em', margin: '0 0 12px' }}>
                {copy.officeTitle}
              </h2>
              <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.65, color: 'rgba(0,0,0,0.56)' }}>
                {copy.officeDesc}
              </p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: '#0A0A0F', fontWeight: 700 }}>
                {addressLine}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderRadius: 16, background: 'rgba(34,197,94,0.09)', color: '#16A34A', border: '1px solid rgba(34,197,94,0.16)' }}>
              <CheckIcon size={16} color="#16A34A" strokeWidth={2.5} />
              <span className="br-mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {copy.reliable}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
}
