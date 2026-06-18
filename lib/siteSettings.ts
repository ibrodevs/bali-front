'use client';

import { useLocale } from './i18n/LocaleProvider';

export const DEFAULT_SOCIAL_LINKS = {
  whatsapp: 'https://wa.me/628135915173',
  instagram: '',
  telegram: '',
  wechat: '',
  tiktok: '',
  facebook: '',
  youtube: '',
} as const;

export type SocialLinkKey = keyof typeof DEFAULT_SOCIAL_LINKS;
export type SocialLinks = Record<SocialLinkKey, string>;

export const DEFAULT_ADDRESS_SETTINGS = {
  businessName: 'BALI-RENT',
  street: 'JL. PANTAI BERAWA',
  district: 'CANGGU',
  postalCode: '80361',
  country: 'BALI, INDONESIA',
  license: 'LIC. 04/2019',
  copyright: '© 2026',
} as const;

export type AddressSettingKey = keyof typeof DEFAULT_ADDRESS_SETTINGS;
export type AddressSettings = Record<AddressSettingKey, string>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeSocialLinks(raw: unknown): SocialLinks {
  if (!isPlainObject(raw)) {
    return { ...DEFAULT_SOCIAL_LINKS };
  }

  const next: SocialLinks = { ...DEFAULT_SOCIAL_LINKS };
  for (const key of Object.keys(DEFAULT_SOCIAL_LINKS) as SocialLinkKey[]) {
    const value = raw[key];
    next[key] = typeof value === 'string' ? value.trim() : DEFAULT_SOCIAL_LINKS[key];
  }
  return next;
}

function normalizeAddressSettings(raw: unknown): AddressSettings {
  if (!isPlainObject(raw)) {
    return { ...DEFAULT_ADDRESS_SETTINGS };
  }

  const next: AddressSettings = { ...DEFAULT_ADDRESS_SETTINGS };
  for (const key of Object.keys(DEFAULT_ADDRESS_SETTINGS) as AddressSettingKey[]) {
    const value = raw[key];
    next[key] = typeof value === 'string' ? value.trim() : DEFAULT_ADDRESS_SETTINGS[key];
  }
  return next;
}

export function useSiteSettings() {
  const { t } = useLocale();
  const settings = isPlainObject(t) && isPlainObject((t as Record<string, unknown>).settings)
    ? (t as Record<string, unknown>).settings
    : null;

  return {
    socialLinks: normalizeSocialLinks(settings ? (settings as Record<string, unknown>).socialLinks : null),
    addresses: normalizeAddressSettings(settings ? (settings as Record<string, unknown>).addresses : null),
  };
}
