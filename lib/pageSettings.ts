import type { Locale } from './i18n/dictionaries';

export type ManagedPageKey =
  | 'home'
  | 'catalog'
  | 'prices'
  | 'how'
  | 'locations'
  | 'contacts'
  | 'news'
  | 'booking'
  | 'payment'
  | 'login'
  | 'register'
  | 'profile';

export type PageSettingValue = {
  path: string;
  title: string;
};

export type PageSettingDefinition = {
  key: ManagedPageKey;
  label: string;
  description: string;
  defaultPath: string;
  supportsChildren?: boolean;
  defaultTitles: Record<Locale, string>;
};

export type PageSettingsMap = Record<ManagedPageKey, PageSettingValue>;

export const PAGE_SETTINGS_DEFINITIONS: PageSettingDefinition[] = [
  {
    key: 'home',
    label: 'Home',
    description: 'Main landing page and brand homepage.',
    defaultPath: '/',
    defaultTitles: {
      en: 'BALI-RENT · Premium scooter rental in Bali',
      ru: 'BALI-RENT · Премиальная аренда скутеров на Бали',
      zh: 'BALI-RENT · 巴厘岛高端摩托车租赁',
      id: 'BALI-RENT · Sewa skuter premium di Bali',
      de: 'BALI-RENT · Premium-Rollerverleih auf Bali',
      fr: 'BALI-RENT · Location de scooters premium à Bali',
    },
  },
  {
    key: 'catalog',
    label: 'Catalog',
    description: 'Fleet list with filters and scooter cards.',
    defaultPath: '/catalog',
    defaultTitles: {
      en: 'Catalog · BALI-RENT',
      ru: 'Каталог · BALI-RENT',
      zh: '目录 · BALI-RENT',
      id: 'Katalog · BALI-RENT',
      de: 'Katalog · BALI-RENT',
      fr: 'Catalogue · BALI-RENT',
    },
  },
  {
    key: 'prices',
    label: 'Prices',
    description: 'Pricing overview and rate comparison page.',
    defaultPath: '/prices',
    defaultTitles: {
      en: 'Prices · BALI-RENT',
      ru: 'Цены · BALI-RENT',
      zh: '价格 · BALI-RENT',
      id: 'Harga · BALI-RENT',
      de: 'Preise · BALI-RENT',
      fr: 'Tarifs · BALI-RENT',
    },
  },
  {
    key: 'how',
    label: 'How It Works',
    description: 'Process, trust, delivery, and CTA page.',
    defaultPath: '/how-it-works',
    defaultTitles: {
      en: 'How It Works · BALI-RENT',
      ru: 'Как это работает · BALI-RENT',
      zh: '运作方式 · BALI-RENT',
      id: 'Cara Kerja · BALI-RENT',
      de: 'So funktioniert es · BALI-RENT',
      fr: 'Comment ça marche · BALI-RENT',
    },
  },
  {
    key: 'locations',
    label: 'Locations',
    description: 'Delivery zones and map page.',
    defaultPath: '/locations',
    defaultTitles: {
      en: 'Locations · BALI-RENT',
      ru: 'Локации · BALI-RENT',
      zh: '地点 · BALI-RENT',
      id: 'Lokasi · BALI-RENT',
      de: 'Standorte · BALI-RENT',
      fr: 'Lieux · BALI-RENT',
    },
  },
  {
    key: 'contacts',
    label: 'Contacts',
    description: 'Contact links, support chat, and office address page.',
    defaultPath: '/contacts',
    defaultTitles: {
      en: 'Contacts · BALI-RENT',
      ru: 'Контакты · BALI-RENT',
      zh: '联系方式 · BALI-RENT',
      id: 'Kontak · BALI-RENT',
      de: 'Kontakt · BALI-RENT',
      fr: 'Contacts · BALI-RENT',
    },
  },
  {
    key: 'news',
    label: 'News',
    description: 'News listing page. Article URLs inherit this base path.',
    defaultPath: '/news',
    supportsChildren: true,
    defaultTitles: {
      en: 'News & Updates · BALI-RENT',
      ru: 'Новости и обновления · BALI-RENT',
      zh: '新闻与动态 · BALI-RENT',
      id: 'Berita & Update · BALI-RENT',
      de: 'News & Updates · BALI-RENT',
      fr: 'Actualités · BALI-RENT',
    },
  },
  {
    key: 'booking',
    label: 'Booking',
    description: 'Booking checkout flow entry page.',
    defaultPath: '/booking',
    defaultTitles: {
      en: 'Booking · BALI-RENT',
      ru: 'Бронирование · BALI-RENT',
      zh: '预订 · BALI-RENT',
      id: 'Pemesanan · BALI-RENT',
      de: 'Buchung · BALI-RENT',
      fr: 'Reservation · BALI-RENT',
    },
  },
  {
    key: 'payment',
    label: 'Payment',
    description: 'Payment confirmation and checkout page.',
    defaultPath: '/payment',
    defaultTitles: {
      en: 'Payment · BALI-RENT',
      ru: 'Оплата · BALI-RENT',
      zh: '支付 · BALI-RENT',
      id: 'Pembayaran · BALI-RENT',
      de: 'Zahlung · BALI-RENT',
      fr: 'Paiement · BALI-RENT',
    },
  },
  {
    key: 'login',
    label: 'Login',
    description: 'Customer sign-in page.',
    defaultPath: '/login',
    defaultTitles: {
      en: 'Sign In · BALI-RENT',
      ru: 'Вход · BALI-RENT',
      zh: '登录 · BALI-RENT',
      id: 'Masuk · BALI-RENT',
      de: 'Anmelden · BALI-RENT',
      fr: 'Connexion · BALI-RENT',
    },
  },
  {
    key: 'register',
    label: 'Register',
    description: 'Customer account creation page.',
    defaultPath: '/register',
    defaultTitles: {
      en: 'Create Account · BALI-RENT',
      ru: 'Регистрация · BALI-RENT',
      zh: '注册 · BALI-RENT',
      id: 'Daftar · BALI-RENT',
      de: 'Registrieren · BALI-RENT',
      fr: 'Creer un compte · BALI-RENT',
    },
  },
  {
    key: 'profile',
    label: 'Profile',
    description: 'Customer profile and bookings page.',
    defaultPath: '/profile',
    defaultTitles: {
      en: 'Profile · BALI-RENT',
      ru: 'Профиль · BALI-RENT',
      zh: '个人资料 · BALI-RENT',
      id: 'Profil · BALI-RENT',
      de: 'Profil · BALI-RENT',
      fr: 'Profil · BALI-RENT',
    },
  },
];

export const PAGE_SETTINGS_DEFINITION_MAP = PAGE_SETTINGS_DEFINITIONS.reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {} as Record<ManagedPageKey, PageSettingDefinition>);

export function normalizePagePath(value?: string | null, fallback = '/'): string {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  let next = raw.startsWith('/') ? raw : `/${raw}`;
  next = next.replace(/\/{2,}/g, '/');
  if (next.length > 1) {
    next = next.replace(/\/+$/, '');
  }
  return next || fallback;
}

export function buildPageSettings(locale: Locale, overrides?: Partial<Record<ManagedPageKey, Partial<PageSettingValue>>>): PageSettingsMap {
  return PAGE_SETTINGS_DEFINITIONS.reduce((acc, page) => {
    const override = overrides?.[page.key];
    acc[page.key] = {
      path: normalizePagePath(override?.path, page.defaultPath),
      title: (override?.title || '').trim() || page.defaultTitles[locale],
    };
    return acc;
  }, {} as PageSettingsMap);
}

export function joinPagePath(basePath: string, child?: string | null): string {
  const base = normalizePagePath(basePath);
  const segment = String(child || '').trim().replace(/^\/+|\/+$/g, '');
  if (!segment) return base;
  return base === '/' ? `/${segment}` : `${base}/${segment}`;
}

export function matchesStaticPagePath(pathname: string, pagePath: string): boolean {
  const normalizedPathname = normalizePagePath(pathname);
  const normalizedPagePath = normalizePagePath(pagePath);
  return normalizedPathname === normalizedPagePath;
}
