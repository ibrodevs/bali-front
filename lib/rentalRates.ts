import { ApiAppliedTariff, ApiScooterRentalRate } from './endpoints';
import type { Locale } from './i18n/dictionaries';

export type RentalRateDraft = {
  id?: number;
  min_days: string;
  max_days: string;
  price_usd: string;
  billing_period_days: string;
  isNew?: boolean;
};

export type NormalizedRentalRate = {
  id?: number;
  min_days: number;
  max_days: number | null;
  price_usd: number;
  billing_period_days: number;
};

type RentalRateLocale = Locale | string | null | undefined;

export function createDefaultRentalRateDrafts(basePrice: string | number): RentalRateDraft[] {
  const price = String(basePrice || '');
  return [
    { min_days: '1', max_days: '1', price_usd: price, billing_period_days: '1', isNew: true },
    { min_days: '2', max_days: '6', price_usd: price, billing_period_days: '1', isNew: true },
    { min_days: '7', max_days: '15', price_usd: price, billing_period_days: '1', isNew: true },
    { min_days: '16', max_days: '29', price_usd: price, billing_period_days: '1', isNew: true },
    { min_days: '30', max_days: '', price_usd: price, billing_period_days: '1', isNew: true },
  ];
}

export function draftsFromApiRates(rates: ApiScooterRentalRate[]): RentalRateDraft[] {
  return [...rates]
    .sort((a, b) => a.min_days - b.min_days || (a.max_days ?? Number.MAX_SAFE_INTEGER) - (b.max_days ?? Number.MAX_SAFE_INTEGER))
    .map((rate) => ({
      id: rate.id,
      min_days: String(rate.min_days),
      max_days: rate.max_days == null ? '' : String(rate.max_days),
      price_usd: String(rate.price_usd),
      billing_period_days: String(rate.billing_period_days || 1),
    }));
}

export function normalizeRentalRateDrafts(drafts: RentalRateDraft[]): NormalizedRentalRate[] {
  return drafts.map((draft, index) => {
    const minDays = Number(draft.min_days);
    const rawMaxDays = draft.max_days.trim();
    const maxDays = rawMaxDays ? Number(rawMaxDays) : null;
    const priceUSD = Number(draft.price_usd);
    const billingPeriodDays = Number(draft.billing_period_days || '1');

    if (!Number.isInteger(minDays) || minDays < 1) {
      throw new Error(`Tariff row ${index + 1}: "From" must be a whole number greater than 0.`);
    }
    if (maxDays !== null && (!Number.isInteger(maxDays) || maxDays < minDays)) {
      throw new Error(`Tariff row ${index + 1}: "To" must be empty or greater than or equal to "From".`);
    }
    if (!Number.isFinite(priceUSD) || priceUSD < 0) {
      throw new Error(`Tariff row ${index + 1}: enter a valid price.`);
    }
    if (!Number.isInteger(billingPeriodDays) || billingPeriodDays < 1) {
      throw new Error(`Tariff row ${index + 1}: billing period must be a whole number greater than 0.`);
    }

    return {
      id: draft.id,
      min_days: minDays,
      max_days: maxDays,
      price_usd: priceUSD,
      billing_period_days: billingPeriodDays,
    };
  });
}

export function validateRentalRateDrafts(drafts: RentalRateDraft[]): NormalizedRentalRate[] {
  if (!drafts.length) {
    throw new Error('Add at least one tariff.');
  }

  const normalized = normalizeRentalRateDrafts(drafts).sort(
    (a, b) => a.min_days - b.min_days || (a.max_days ?? Number.MAX_SAFE_INTEGER) - (b.max_days ?? Number.MAX_SAFE_INTEGER),
  );

  for (let index = 0; index < normalized.length - 1; index += 1) {
    const current = normalized[index];
    const next = normalized[index + 1];
    const currentMax = current.max_days ?? Number.MAX_SAFE_INTEGER;
    if (currentMax >= next.min_days) {
      throw new Error(`Tariff ranges overlap between rows ${index + 1} and ${index + 2}.`);
    }
  }

  return normalized;
}

function normalizeLocale(locale?: RentalRateLocale): Locale {
  const base = String(locale || 'en').split('-')[0];
  if (base === 'ru' || base === 'zh' || base === 'id' || base === 'de' || base === 'fr') return base;
  return 'en';
}

function pluralizeRuDays(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

export function formatRateRange(minDays: number, maxDays?: number | null, locale?: RentalRateLocale) {
  switch (normalizeLocale(locale)) {
    case 'ru':
      if (maxDays == null) return `${minDays}+ дней`;
      if (minDays === maxDays) return `${minDays} ${pluralizeRuDays(minDays)}`;
      return `${minDays}-${maxDays} дней`;
    case 'zh':
      if (maxDays == null) return `${minDays}天以上`;
      if (minDays === maxDays) return `${minDays}天`;
      return `${minDays}-${maxDays}天`;
    case 'id':
      if (maxDays == null) return `${minDays}+ hari`;
      if (minDays === maxDays) return `${minDays} hari`;
      return `${minDays}-${maxDays} hari`;
    case 'de':
      if (maxDays == null) return `${minDays}+ Tage`;
      if (minDays === maxDays) return `${minDays} Tag`;
      return `${minDays}-${maxDays} Tage`;
    case 'fr':
      if (maxDays == null) return `${minDays}+ jours`;
      if (minDays === maxDays) return `${minDays} jour`;
      return `${minDays}-${maxDays} jours`;
    default:
      if (maxDays == null) return `${minDays}+ days`;
      if (minDays === maxDays) return `${minDays} day`;
      return `${minDays}-${maxDays} days`;
  }
}

export function formatBillingLabel(billingPeriodDays: number, locale?: RentalRateLocale) {
  switch (normalizeLocale(locale)) {
    case 'ru':
      if (billingPeriodDays === 1) return 'в день';
      return `за ${billingPeriodDays} ${pluralizeRuDays(billingPeriodDays)}`;
    case 'zh':
      if (billingPeriodDays === 1) return '每天';
      return `每${billingPeriodDays}天`;
    case 'id':
      if (billingPeriodDays === 1) return 'per hari';
      return `per ${billingPeriodDays} hari`;
    case 'de':
      if (billingPeriodDays === 1) return 'pro Tag';
      return `pro ${billingPeriodDays} Tage`;
    case 'fr':
      if (billingPeriodDays === 1) return 'par jour';
      return `par ${billingPeriodDays} jours`;
    default:
      if (billingPeriodDays === 1) return 'per day';
      return `per ${billingPeriodDays} days`;
  }
}

export function formatAppliedTariffLabel(tariff?: ApiAppliedTariff | null, locale?: RentalRateLocale) {
  if (!tariff) return null;
  return `${formatRateRange(tariff.min_days, tariff.max_days, locale)} · ${formatBillingLabel(tariff.billing_period_days, locale)}`;
}
