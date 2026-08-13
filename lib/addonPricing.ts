import type { ApiAddon } from './endpoints';

export function isPerDayAddon(addon: Pick<ApiAddon, 'price_type' | 'priceType'>) {
  return (addon.price_type || addon.priceType || '').toLowerCase() === 'per_day';
}

export function formatAddonPriceType(
  addon: Pick<ApiAddon, 'price_type' | 'priceType'>,
  locale?: string | null,
) {
  const perDay = isPerDayAddon(addon);
  switch (String(locale || 'en').split('-')[0]) {
    case 'ru': return perDay ? 'за день' : 'фиксированная цена';
    case 'zh': return perDay ? '每天' : '固定价格';
    case 'id': return perDay ? 'per hari' : 'harga tetap';
    case 'de': return perDay ? 'pro Tag' : 'Festpreis';
    case 'fr': return perDay ? 'par jour' : 'prix fixe';
    default: return perDay ? 'per day' : 'fixed price';
  }
}
