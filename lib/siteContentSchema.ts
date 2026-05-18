import { dictionaries, LOCALES } from './i18n/dictionaries';
import { SITE_CONTENT_EXTRAS } from './siteContentExtras';

import type { Locale } from './i18n/dictionaries';
import type { SiteContentValueType } from './endpoints';

export type SiteContentPage = {
  key: string;
  label: string;
  description: string;
  route: string;
  routeLabel: string;
  includeSectionKeys?: string[];
  includeFieldKeys?: string[];
  includeFieldPrefixes?: string[];
  includeShared?: boolean;
};

export type SiteContentField = {
  key: string;
  label: string;
  pageKey: string;
  pageLabel: string;
  pageDescription: string;
  pageRoute: string;
  pageRouteLabel: string;
  sectionKey: string;
  sectionLabel: string;
  valueType: SiteContentValueType;
  shared?: boolean;
};

type RootConfig = {
  pageKey: string;
  sectionLabel: string;
};

const PAGES: SiteContentPage[] = [
  {
    key: 'home',
    label: 'Home Page',
    description: 'Главная страница: hero, преимущества, процесс, отзывы, CTA и медиа.',
    route: '/',
    routeLabel: 'Open Home',
  },
  {
    key: 'catalog',
    label: 'Catalog Page',
    description: 'Страница каталога со списком скутеров, фильтрами и текстами каталога.',
    route: '/catalog',
    routeLabel: 'Open Catalog',
  },
  {
    key: 'how',
    label: 'How It Works',
    description: 'Экран "Как это работает": шаги, цены, доставка, trust-блок и CTA.',
    route: '/how-it-works',
    routeLabel: 'Open How It Works',
    includeSectionKeys: ['process', 'pricing', 'delivery', 'why', 'cta'],
    includeShared: true,
  },
  {
    key: 'detail',
    label: 'Scooter Page',
    description: 'Карточка конкретного скутера: спецификации, описание, условия аренды.',
    route: '/scooter/[id]',
    routeLabel: 'Scooter Detail',
  },
  {
    key: 'booking',
    label: 'Booking Page',
    description: 'Шаги бронирования, адрес доставки, summary и кнопки оформления.',
    route: '/booking',
    routeLabel: 'Open Booking',
  },
  {
    key: 'payment',
    label: 'Payment Page',
    description: 'Оплата, breakdown, secure checkout и подтверждение.',
    route: '/payment',
    routeLabel: 'Open Payment',
  },
  {
    key: 'auth',
    label: 'Login & Register',
    description: 'Тексты входа, регистрации, onboarding-блоки и подписи форм.',
    route: '/login',
    routeLabel: 'Open Login',
    includeShared: true,
  },
  {
    key: 'register',
    label: 'Register Page',
    description: 'Экран регистрации: hero, benefits, цитата и подписи полей формы.',
    route: '/register',
    routeLabel: 'Open Register',
    includeFieldKeys: [
      'auth.haveAccount',
      'auth.login',
      'auth.name',
      'auth.phone',
      'auth.email',
      'auth.password',
      'auth.termsNote',
      'common.loading',
    ],
    includeFieldPrefixes: [
      'auth.register',
    ],
    includeShared: true,
  },
  {
    key: 'news',
    label: 'News Page',
    description: 'Системные тексты страницы новостей и блока новостей.',
    route: '/news',
    routeLabel: 'Open News',
  },
  {
    key: 'shared',
    label: 'Shared Layout',
    description: 'Общие тексты шапки, футера и повторяющихся UI-элементов.',
    route: '/',
    routeLabel: 'Open Site',
    includeSectionKeys: ['nav', 'footer', 'common'],
  },
  {
    key: 'navbar',
    label: 'Navbar',
    description: 'Отдельный экран для редактирования текстов верхней навигации сайта.',
    route: '/',
    routeLabel: 'Open Navbar',
    includeSectionKeys: ['nav'],
  },
];

const PAGE_MAP = new Map(PAGES.map((page) => [page.key, page]));

const ROOT_CONFIG: Record<string, RootConfig> = {
  nav: { pageKey: 'shared', sectionLabel: 'Header Navigation' },
  footer: { pageKey: 'shared', sectionLabel: 'Footer' },
  common: { pageKey: 'shared', sectionLabel: 'Shared UI' },
  hero: { pageKey: 'home', sectionLabel: 'Hero Block' },
  stats: { pageKey: 'home', sectionLabel: 'Stats Strip' },
  fleet: { pageKey: 'home', sectionLabel: 'Featured Fleet' },
  why: { pageKey: 'home', sectionLabel: 'Why Us' },
  process: { pageKey: 'home', sectionLabel: 'How It Works' },
  pricing: { pageKey: 'home', sectionLabel: 'Pricing Block' },
  addons: { pageKey: 'home', sectionLabel: 'Add-ons Block' },
  delivery: { pageKey: 'home', sectionLabel: 'Delivery Block' },
  reviews: { pageKey: 'home', sectionLabel: 'Reviews Block' },
  cta: { pageKey: 'home', sectionLabel: 'Final CTA' },
  home: { pageKey: 'home', sectionLabel: 'Home Extras' },
  media: { pageKey: 'home', sectionLabel: 'Media Assets' },
  catalog: { pageKey: 'catalog', sectionLabel: 'Catalog Content' },
  detail: { pageKey: 'detail', sectionLabel: 'Scooter Detail Content' },
  booking: { pageKey: 'booking', sectionLabel: 'Booking Content' },
  payment: { pageKey: 'payment', sectionLabel: 'Payment Content' },
  auth: { pageKey: 'auth', sectionLabel: 'Auth Content' },
  news: { pageKey: 'news', sectionLabel: 'News Content' },
};

const EDITABLE_ROOTS = [
  'nav',
  'hero',
  'stats',
  'fleet',
  'why',
  'process',
  'pricing',
  'addons',
  'delivery',
  'reviews',
  'cta',
  'footer',
  'catalog',
  'detail',
  'booking',
  'payment',
  'auth',
  'home',
  'common',
  'news',
] as const;

function titleCaseFromKey(input: string) {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override as T) ?? base;
  }

  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    result[key] = isPlainObject(current) && isPlainObject(value)
      ? deepMerge(current, value)
      : value;
  }
  return result as T;
}

function getFieldLabel(path: string, rootKey: string) {
  const relative = path.replace(`${rootKey}.`, '');
  return titleCaseFromKey(relative);
}

function collectFields(
  value: unknown,
  path: string,
  rootKey: string,
  output: SiteContentField[],
) {
  const config = ROOT_CONFIG[rootKey];
  const page = PAGE_MAP.get(config.pageKey);
  if (!config || !page) return;

  if (typeof value === 'string') {
    output.push({
      key: path,
      label: getFieldLabel(path, rootKey),
      pageKey: page.key,
      pageLabel: page.label,
      pageDescription: page.description,
      pageRoute: page.route,
      pageRouteLabel: page.routeLabel,
      sectionKey: rootKey,
      sectionLabel: config.sectionLabel,
      valueType: value.length > 80 ? 'textarea' : 'text',
    });
    return;
  }

  if (Array.isArray(value)) {
    output.push({
      key: path,
      label: getFieldLabel(path, rootKey),
      pageKey: page.key,
      pageLabel: page.label,
      pageDescription: page.description,
      pageRoute: page.route,
      pageRouteLabel: page.routeLabel,
      sectionKey: rootKey,
      sectionLabel: config.sectionLabel,
      valueType: 'json',
    });
    return;
  }

  if (!isPlainObject(value)) return;

  for (const [childKey, childValue] of Object.entries(value)) {
    collectFields(childValue, `${path}.${childKey}`, rootKey, output);
  }
}

function getByPath(source: unknown, path: string) {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (typeof acc !== 'object' || acc === null) return undefined;
    return (acc as Record<string, unknown>)[part];
  }, source);
}

const generatedFields: SiteContentField[] = [];
const defaultDictionary = deepMerge(dictionaries.en, SITE_CONTENT_EXTRAS.en);

for (const rootKey of EDITABLE_ROOTS) {
  const source = (defaultDictionary as Record<string, unknown>)[rootKey];
  if (!source) continue;
  collectFields(source, rootKey, rootKey, generatedFields);
}

const homePage = PAGE_MAP.get('home');
if (homePage) {
  generatedFields.push({
    key: 'media.home.heroVideo',
    label: 'Hero Video',
    pageKey: homePage.key,
    pageLabel: homePage.label,
    pageDescription: homePage.description,
    pageRoute: homePage.route,
    pageRouteLabel: homePage.routeLabel,
    sectionKey: 'media',
    sectionLabel: ROOT_CONFIG.media.sectionLabel,
    valueType: 'video',
    shared: true,
  });
}

export const SITE_CONTENT_FIELDS = generatedFields.sort((a, b) => {
  if (a.pageLabel !== b.pageLabel) return a.pageLabel.localeCompare(b.pageLabel);
  if (a.sectionLabel !== b.sectionLabel) return a.sectionLabel.localeCompare(b.sectionLabel);
  return a.key.localeCompare(b.key);
});

export const SITE_CONTENT_PAGES = PAGES;
export const SITE_CONTENT_LANGUAGES = LOCALES;

export function pageMatchesField(page: SiteContentPage, field: SiteContentField) {
  if (field.pageKey === page.key) return true;
  if (page.includeShared && field.pageKey === 'shared') return true;
  if (page.includeSectionKeys?.includes(field.sectionKey)) return true;
  if (page.includeFieldKeys?.includes(field.key)) return true;
  if (page.includeFieldPrefixes?.some((prefix) => field.key.startsWith(prefix))) return true;
  return false;
}

export function getDefaultSiteContentValue(key: string, locale: Locale) {
  if (key === 'media.home.heroVideo') return '/hero.mp4';
  return getByPath(deepMerge(dictionaries[locale], SITE_CONTENT_EXTRAS[locale]), key);
}
