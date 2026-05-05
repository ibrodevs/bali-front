import { ApiScooter, ApiScooterDetail } from './endpoints';
import { mediaUrl } from './api';
import { Scooter, BR_SCOOTERS } from './data';

const TONES = ['sand', 'ocean', 'sunset', 'mist', 'jungle', 'warm'];

export type DisplayScooter = Scooter & {
  apiId?: number | string;
  imageUrl?: string;
  reviewsCount?: number;
  rating?: number;
};

export function pickTone(seed: string | number): string {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

function statusFromApi(s: ApiScooter): Scooter['status'] {
  if (s.status === 'available' || s.status === 'booked' || s.status === 'partial' || s.status === 'service') return s.status;
  if (s.is_available === false) return 'booked';
  return 'available';
}

export function mapApiScooter(s: ApiScooter): DisplayScooter {
  const id = s.slug || String(s.id);
  return {
    id,
    apiId: s.id,
    name: s.title,
    cc: s.engine_capacity || 0,
    type: (s.type || 'Touring').toString(),
    price: Number(s.price_per_day) || 0,
    photo: pickTone(id),
    tag: s.is_featured ? 'FEATURED' : (s.type || 'BIKE').toString().toUpperCase(),
    status: statusFromApi(s),
    range: 0,
    top: 0,
    weight: 0,
    imageUrl: s.main_image ? mediaUrl(s.main_image) : undefined,
    reviewsCount: s.reviews_count,
    rating: s.rating_avg,
  };
}

export function mapApiScooterDetail(s: ApiScooterDetail): DisplayScooter {
  const base = mapApiScooter(s);
  const c = s.characteristics || {};
  return {
    ...base,
    cc: c.engine_cc || base.cc,
    range: 0,
    top: 0,
    weight: 0,
  };
}

export function fallbackScooters(): DisplayScooter[] {
  return BR_SCOOTERS.map((s) => ({ ...s, apiId: undefined }));
}
