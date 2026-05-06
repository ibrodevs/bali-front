const SCOOTERS = [
  { id: 1, name: 'Honda PCX 160', slug: 'honda-pcx-160', type: 'scooter', engine: '160cc', priceUSD: 5.5, priceIDR: 85000, deposit: 500000, rating: 4.9, reviews: 124, available: true, accent: '#0d1117', features: ['ABS', 'LED Lights', 'USB Charging', 'Smart Key'], specs: { 'Top Speed': '115 km/h', 'Fuel Cons.': '2.1L/100km', 'Weight': '131 kg', 'Seat Height': '764 mm' }, description: 'The Honda PCX 160 is the definitive premium scooter for Bali. Sophisticated style, outstanding efficiency, and confidence-inspiring ABS braking make it the top choice for discerning riders exploring the island.' },
  { id: 2, name: 'Yamaha NMAX 155', slug: 'yamaha-nmax-155', type: 'maxi', engine: '155cc', priceUSD: 6.2, priceIDR: 95000, deposit: 500000, rating: 4.8, reviews: 98, available: true, accent: '#0a1628', features: ['ABS', 'Smart Key', 'LED', 'Large Storage'], specs: { 'Top Speed': '120 km/h', 'Fuel Cons.': '2.0L/100km', 'Weight': '134 kg', 'Seat Height': '765 mm' }, description: 'Premium maxi-scooter with superior touring comfort. Ample underseat storage, refined suspension, and an upright riding posture make the NMAX ideal for longer Bali journeys.' },
  { id: 3, name: 'Honda ADV 150', slug: 'honda-adv-150', type: 'maxi', engine: '150cc', priceUSD: 7.1, priceIDR: 110000, deposit: 500000, rating: 4.9, reviews: 67, available: true, accent: '#141414', features: ['ABS', 'Off-road Ready', 'USB Charging', 'Adventure Mode'], specs: { 'Top Speed': '110 km/h', 'Fuel Cons.': '2.3L/100km', 'Weight': '131 kg', 'Seat Height': '800 mm' }, description: 'Built for Bali\'s diverse terrain. The ADV 150 tackles temple mountain roads and beach tracks with equal authority. True adventure capability in a premium package.' },
  { id: 4, name: 'Yamaha Aerox 155', slug: 'yamaha-aerox-155', type: 'scooter', engine: '155cc', priceUSD: 5.2, priceIDR: 80000, deposit: 500000, rating: 4.7, reviews: 112, available: true, accent: '#0a0e1a', features: ['Y-Connect', 'LED', 'USB', 'Sporty'], specs: { 'Top Speed': '120 km/h', 'Fuel Cons.': '1.9L/100km', 'Weight': '118 kg', 'Seat Height': '795 mm' }, description: 'Sporty and agile, the Aerox 155 is engineered for those who refuse to compromise on excitement. Sharp handling and a punchy engine make every Bali street an adventure.' },
  { id: 5, name: 'Honda Vario 160', slug: 'honda-vario-160', type: 'scooter', engine: '160cc', priceUSD: 4.5, priceIDR: 70000, deposit: 300000, rating: 4.6, reviews: 89, available: false, accent: '#1a1225', features: ['Keyless', 'LED', 'IDLING STOP'], specs: { 'Top Speed': '110 km/h', 'Fuel Cons.': '2.0L/100km', 'Weight': '116 kg', 'Seat Height': '757 mm' }, description: 'Smart, fuel-efficient, and practical. The Vario 160 offers excellent value for riders who want reliable daily transportation across Bali without compromise.' },
  { id: 6, name: 'Royal Enfield Meteor 350', slug: 'royal-enfield-meteor', type: 'moto', engine: '350cc', priceUSD: 12.7, priceIDR: 195000, deposit: 1000000, rating: 5.0, reviews: 43, available: true, accent: '#1a0c05', features: ['Tripper Nav', 'Bluetooth', 'Classic', 'Long Range'], specs: { 'Top Speed': '130 km/h', 'Fuel Cons.': '3.5L/100km', 'Weight': '191 kg', 'Seat Height': '765 mm' }, description: 'The pinnacle of the Scoot Bali fleet. Classic British heritage meets modern engineering for a truly unforgettable Bali riding experience. Reserved for those who want the extraordinary.' },
];

const ADDONS = [
  { id: 'helmet_full', name: 'Full-Face Helmet', price: 15000, priceUSD: 1.0, icon: '⛑️', desc: 'DOT certified, ventilated', category: 'safety' },
  { id: 'insurance', name: 'Full Insurance', price: 25000, priceUSD: 1.6, icon: '🛡️', desc: 'Comprehensive accident + theft', category: 'safety' },
  { id: 'gps', name: 'GPS Navigator', price: 20000, priceUSD: 1.3, icon: '📍', desc: 'Offline Bali maps loaded', category: 'tech' },
  { id: 'raincoat', name: 'Rain Poncho', price: 10000, priceUSD: 0.6, icon: '🧥', desc: 'Lightweight waterproof', category: 'comfort' },
  { id: 'phone_mount', name: 'Phone Mount', price: 10000, priceUSD: 0.6, icon: '📱', desc: 'Universal secure mount', category: 'tech' },
  { id: 'wifi', name: 'Pocket WiFi 4G', price: 35000, priceUSD: 2.3, icon: '📶', desc: 'Unlimited data, Bali coverage', category: 'tech' },
  { id: 'helmet_open', name: 'Open-Face Helmet', price: 10000, priceUSD: 0.6, icon: '🪖', desc: 'Half helmet, great airflow', category: 'safety' },
  { id: 'bag', name: 'Rear Bag', price: 15000, priceUSD: 1.0, icon: '🎒', desc: '20L waterproof luggage', category: 'comfort' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', country: 'Australia', flag: '🇦🇺', rating: 5, text: 'Absolutely flawless from booking to delivery. The PCX was in perfect condition. Delivery to our villa was right on time. Already booked for my next trip.', avatar: 'SM' },
  { name: 'Alex K.', country: 'Russia', flag: '🇷🇺', rating: 5, text: 'Лучший прокат скутеров на Бали. Безупречное качество, быстрое оформление, доставка прямо в виллу. Рекомендую всем!', avatar: 'AK' },
  { name: 'James L.', country: 'United Kingdom', flag: '🇬🇧', rating: 5, text: 'Premium service from start to finish. Booked in 3 minutes, scooter arrived clean and fueled. This is how rentals should work everywhere.', avatar: 'JL' },
  { name: 'Mei W.', country: 'China', flag: '🇨🇳', rating: 5, text: '服务非常专业，摩托车状态完美。预订流程简单快捷，直接送到酒店，强烈推荐！', avatar: 'MW' },
];

const ZONES = [
  { name: 'Seminyak', deliveryFee: 0, time: '30 min' },
  { name: 'Canggu', deliveryFee: 0, time: '30 min' },
  { name: 'Kuta', deliveryFee: 0, time: '25 min' },
  { name: 'Legian', deliveryFee: 0, time: '30 min' },
  { name: 'Denpasar', deliveryFee: 0, time: '35 min' },
  { name: 'Jimbaran', deliveryFee: 25000, time: '45 min' },
  { name: 'Sanur', deliveryFee: 25000, time: '45 min' },
  { name: 'Ubud', deliveryFee: 50000, time: '60 min' },
  { name: 'Nusa Dua', deliveryFee: 50000, time: '60 min' },
  { name: 'Uluwatu', deliveryFee: 75000, time: '90 min' },
];

const LANGS = [
  { code: 'EN', label: 'English', flag: '🇬🇧' },
  { code: 'RU', label: 'Русский', flag: '🇷🇺' },
  { code: 'ZH', label: '中文', flag: '🇨🇳' },
  { code: 'ID', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'FR', label: 'Français', flag: '🇫🇷' },
];
