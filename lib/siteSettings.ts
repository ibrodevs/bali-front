'use client';

import { useEffect, useMemo, useState } from 'react';
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
export const SITE_SOCIAL_LINKS_STORAGE_KEY = 'br_site_social_links';

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
export const SITE_ADDRESS_SETTINGS_STORAGE_KEY = 'br_site_address_settings';
export const SITE_SETTINGS_SYNC_EVENT = 'br_site_settings_sync';

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
  const [storedSocialLinks, setStoredSocialLinks] = useState<SocialLinks | null>(null);
  const [storedAddresses, setStoredAddresses] = useState<AddressSettings | null>(null);
  const settings = isPlainObject(t) && isPlainObject((t as Record<string, unknown>).settings)
    ? (t as Record<string, unknown>).settings
    : null;
  const bootstrapSocialLinks = useMemo(
    () => normalizeSocialLinks(settings ? (settings as Record<string, unknown>).socialLinks : null),
    [settings],
  );
  const bootstrapAddresses = useMemo(
    () => normalizeAddressSettings(settings ? (settings as Record<string, unknown>).addresses : null),
    [settings],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const readStoredSettings = () => {
      try {
        const rawSocialLinks = window.localStorage.getItem(SITE_SOCIAL_LINKS_STORAGE_KEY);
        setStoredSocialLinks(rawSocialLinks ? normalizeSocialLinks(JSON.parse(rawSocialLinks)) : null);
      } catch {
        setStoredSocialLinks(null);
      }

      try {
        const rawAddresses = window.localStorage.getItem(SITE_ADDRESS_SETTINGS_STORAGE_KEY);
        setStoredAddresses(rawAddresses ? normalizeAddressSettings(JSON.parse(rawAddresses)) : null);
      } catch {
        setStoredAddresses(null);
      }
    };

    readStoredSettings();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SITE_SOCIAL_LINKS_STORAGE_KEY || event.key === SITE_ADDRESS_SETTINGS_STORAGE_KEY) {
        readStoredSettings();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener(SITE_SETTINGS_SYNC_EVENT, readStoredSettings);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SITE_SETTINGS_SYNC_EVENT, readStoredSettings);
    };
  }, []);

  return {
    socialLinks: storedSocialLinks || bootstrapSocialLinks,
    addresses: storedAddresses || bootstrapAddresses,
  };
}
