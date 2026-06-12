import { ApiScooter, ApiScooterDetail } from './endpoints';
import { mediaUrl } from './api';
import { Scooter, BR_SCOOTERS } from './data';

const TONES = ['sand', 'ocean', 'sunset', 'mist', 'jungle', 'warm'];
const GRAY_SCOOTER = '/scooters/scooter-gray-new.png';
const RED_SPORT_SCOOTER = '/scooters/scooter-red-sport-new.png';
const RED_CLASSIC_SCOOTER = '/scooters/scooter-red-classic-new.png';
const LOCAL_SCOOTER_IMAGES: Record<string, string> = {
  pcx160: GRAY_SCOOTER,
  'honda-pcx-160': GRAY_SCOOTER,
  nmax155: GRAY_SCOOTER,
  'yamaha-nmax-155': GRAY_SCOOTER,
  'honda-vario-160': GRAY_SCOOTER,
  vespa: RED_CLASSIC_SCOOTER,
  'vespa-sprint-150': RED_CLASSIC_SCOOTER,
  'vespa-primavera-125': RED_CLASSIC_SCOOTER,
  xmax: RED_SPORT_SCOOTER,
  'yamaha-xmax-300': RED_SPORT_SCOOTER,
  forza: RED_SPORT_SCOOTER,
  'honda-forza-250': RED_SPORT_SCOOTER,
  scoopy: RED_CLASSIC_SCOOTER,
  'honda-scoopy-110': RED_CLASSIC_SCOOTER,
  beat: RED_CLASSIC_SCOOTER,
  'honda-beat-110': RED_CLASSIC_SCOOTER,
  aerox: RED_SPORT_SCOOTER,
  'yamaha-aerox-155': RED_SPORT_SCOOTER,
  fazzio: RED_CLASSIC_SCOOTER,
  'yamaha-fazzio-125': RED_CLASSIC_SCOOTER,
  'honda-adv-160': RED_SPORT_SCOOTER,
  'royal-enfield-meteor': RED_CLASSIC_SCOOTER,
};
const LOCAL_SCOOTER_KEYWORDS: Array<[string[], string]> = [
  [['pcx'], GRAY_SCOOTER],
  [['nmax'], GRAY_SCOOTER],
  [['vario'], GRAY_SCOOTER],
  [['vespa'], RED_CLASSIC_SCOOTER],
  [['xmax'], RED_SPORT_SCOOTER],
  [['forza'], RED_SPORT_SCOOTER],
  [['scoopy'], RED_CLASSIC_SCOOTER],
  [['beat'], RED_CLASSIC_SCOOTER],
  [['aerox'], RED_SPORT_SCOOTER],
  [['fazzio'], RED_CLASSIC_SCOOTER],
  [['adv'], RED_SPORT_SCOOTER],
  [['meteor'], RED_CLASSIC_SCOOTER],
];
const SCOOTER_ROUTE_ALIASES: Record<string, string> = {
  pcx160: 'honda-pcx-160',
  nmax155: 'yamaha-nmax-155',
  vespa: 'vespa-primavera-125',
  xmax: 'yamaha-xmax-300',
  forza: 'honda-forza-250',
  scoopy: 'honda-scoopy-110',
  beat: 'honda-beat-110',
  aerox: 'yamaha-aerox-155',
  fazzio: 'yamaha-fazzio-125',
};

export type DisplayScooter = Scooter & {
  apiId?: number | string;
  typeCode?: string;
  imageUrl?: string;
  imageObjectPosition?: string;
  reviewsCount?: number;
  rating?: number;
};

export function pickTone(seed: string | number): string {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

function normalizeLookup(value?: string | number | null): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function resolveScooterImage(id?: string | number | null, label?: string | null): string | undefined {
  const variants = [normalizeLookup(id), normalizeLookup(label)].filter(Boolean);
  for (const key of variants) {
    if (LOCAL_SCOOTER_IMAGES[key]) return LOCAL_SCOOTER_IMAGES[key];
  }
  for (const value of variants) {
    for (const [keywords, image] of LOCAL_SCOOTER_KEYWORDS) {
      if (keywords.every((keyword) => value.includes(keyword))) return image;
    }
  }
  return undefined;
}

export function resolveScooterImageObjectPosition(id?: string | number | null, label?: string | null): string {
  const value = `${normalizeLookup(id)} ${normalizeLookup(label)}`;
  if (value.includes('scoopy')) return '52% bottom';
  if (value.includes('beat')) return '50% bottom';
  if (value.includes('vespa')) return '52% bottom';
  if (value.includes('aerox')) return '50% 78%';
  return '50% bottom';
}

export function resolveScooterRouteId(id?: string | number | null, label?: string | null): string | undefined {
  const variants = [normalizeLookup(id), normalizeLookup(label)].filter(Boolean);
  for (const key of variants) {
    const alias = SCOOTER_ROUTE_ALIASES[key.replace(/\s+/g, '')];
    if (alias) return alias;
  }
  for (const value of variants) {
    if (value.includes('pcx')) return 'honda-pcx-160';
    if (value.includes('nmax')) return 'yamaha-nmax-155';
    if (value.includes('vario')) return 'honda-vario-160';
    if (value.includes('vespa')) return 'vespa-primavera-125';
    if (value.includes('xmax')) return 'yamaha-xmax-300';
    if (value.includes('forza')) return 'honda-forza-250';
    if (value.includes('scoopy')) return 'honda-scoopy-110';
    if (value.includes('beat')) return 'honda-beat-110';
    if (value.includes('aerox')) return 'yamaha-aerox-155';
    if (value.includes('fazzio')) return 'yamaha-fazzio-125';
    if (value.includes('adv')) return 'honda-adv-160';
    if (value.includes('meteor')) return 'royal-enfield-meteor';
  }
  return id ? String(id) : undefined;
}

function statusFromApi(s: ApiScooter): Scooter['status'] {
  if (s.status === 'available' || s.status === 'booked' || s.status === 'partial' || s.status === 'service') return s.status;
  if (s.is_available === false) return 'booked';
  return 'available';
}

export function mapApiScooter(s: ApiScooter): DisplayScooter {
  const id = s.slug || String(s.id);
  const localImage = resolveScooterImage(id, s.title);
  return {
    id,
    apiId: s.id,
    name: s.title,
    cc: s.engine_capacity || 0,
    type: (s.type || 'Touring').toString(),
    typeCode: s.type_code || undefined,
    price: Number(s.price_per_day) || 0,
    photo: pickTone(id),
    tag: s.is_featured ? 'FEATURED' : (s.type || 'BIKE').toString().toUpperCase(),
    status: statusFromApi(s),
    range: 0,
    top: 0,
    weight: 0,
    imageUrl: s.main_image ? mediaUrl(s.main_image) : localImage,
    imageObjectPosition: resolveScooterImageObjectPosition(id, s.title),
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
  return BR_SCOOTERS.map((s) => ({
    ...s,
    apiId: undefined,
    typeCode: s.type.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    imageUrl: resolveScooterImage(s.id, s.name),
    imageObjectPosition: resolveScooterImageObjectPosition(s.id, s.name),
  }));
}
