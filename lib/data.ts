export type Scooter = {
  id: string;
  name: string;
  cc: number;
  type: string;
  price: number;
  photo: string;
  tag: string;
  status: 'available' | 'booked' | 'partial' | 'service';
  range: number;
  top: number;
  weight: number;
};

export const BR_SCOOTERS: Scooter[] = [
  { id: 'pcx160',  name: 'Honda PCX 160',     cc: 160, type: 'Touring',  price: 18, photo: 'sand',   tag: 'BESTSELLER',  status: 'available', range: 230, top: 110, weight: 132 },
  { id: 'nmax155', name: 'Yamaha NMAX 155',   cc: 155, type: 'Touring',  price: 16, photo: 'ocean',  tag: 'CLASSIC',     status: 'available', range: 210, top: 105, weight: 127 },
  { id: 'vespa',   name: 'Vespa Sprint 150',  cc: 150, type: 'Heritage', price: 28, photo: 'sunset', tag: 'EDITORIAL',   status: 'partial',   range: 180, top: 95,  weight: 117 },
  { id: 'xmax',    name: 'Yamaha XMAX 300',   cc: 300, type: 'Maxi',     price: 38, photo: 'mist',   tag: 'POWER',       status: 'available', range: 280, top: 130, weight: 179 },
  { id: 'forza',   name: 'Honda Forza 250',   cc: 250, type: 'Maxi',     price: 32, photo: 'jungle', tag: 'NEW',         status: 'available', range: 260, top: 125, weight: 184 },
  { id: 'scoopy',  name: 'Honda Scoopy 110',  cc: 110, type: 'City',     price: 9,  photo: 'warm',   tag: 'EVERYDAY',    status: 'available', range: 160, top: 85,  weight: 96  },
  { id: 'beat',    name: 'Honda BeAT 110',    cc: 110, type: 'City',     price: 8,  photo: 'sand',   tag: 'STARTER',     status: 'booked',    range: 150, top: 85,  weight: 89  },
  { id: 'aerox',   name: 'Yamaha Aerox 155',  cc: 155, type: 'Sport',    price: 17, photo: 'jungle', tag: 'SPORT',       status: 'available', range: 200, top: 115, weight: 122 },
  { id: 'fazzio',  name: 'Yamaha Fazzio 125', cc: 125, type: 'Heritage', price: 14, photo: 'mist',   tag: 'CRUISER',     status: 'partial',   range: 170, top: 90,  weight: 102 },
];

export type Addon = { id: string; name: string; price: number; icon: string };

export const BR_ADDONS: Addon[] = [
  { id: 'helmet2', name: 'Second helmet',   price: 3,  icon: '◐' },
  { id: 'phone',   name: 'Phone mount',     price: 2,  icon: '▢' },
  { id: 'lock',    name: 'U-lock',          price: 4,  icon: '⌽' },
  { id: 'rain',    name: 'Rain gear set',   price: 5,  icon: '☂' },
  { id: 'box',     name: 'Top box (35L)',   price: 4,  icon: '▭' },
  { id: 'insure',  name: 'Premium cover',   price: 8,  icon: '✦' },
];

export const BR_LOCATIONS = ['Canggu', 'Seminyak', 'Ubud', 'Uluwatu', 'Sanur', 'Denpasar Airport'];
