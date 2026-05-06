import { api, ApiUser, tokens, userStore } from './api';

export type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };
export type BookingPaymentMethod = 'online_card' | 'cash_on_delivery' | 'card_on_delivery';
export type AvailabilityDayStatus = 'available' | 'booked' | 'partially_booked' | 'maintenance';

export type ApiScooter = {
  id: number;
  title: string;
  slug: string;
  type?: string;
  engine_capacity?: number;
  price_per_day: string | number;
  main_image?: string | null;
  status?: string;
  rating_avg?: number;
  reviews_count?: number;
  short_description?: string;
  is_available?: boolean;
  is_featured?: boolean;
};

export type ApiScooterDetail = ApiScooter & {
  full_description?: string;
  characteristics?: {
    engine_cc?: number;
    transmission?: string;
    fuel_consumption?: string;
    year?: number;
    trunk?: string;
    helmets_count?: number;
    color?: string;
  };
  gallery?: { id: number; image: string; alt_text?: string; sort_order?: number; is_main?: boolean }[];
  available_addons?: ApiAddon[];
  rental_terms?: string;
  model_info?: { brand?: string; type_code?: string; type_name?: string };
};

export type ApiAddon = {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  price_usd?: string | number;
  priceUSD?: string | number;
  price?: string | number;
  priceType?: string;
  image?: string;
};

export type ApiBooking = {
  id: number;
  order_number: string;
  user?: string;
  scooter: { id: number; title: string; sku?: string };
  start_datetime: string;
  end_datetime: string;
  delivery_time?: string | null;
  rental_days: number;
  delivery_address?: string | null;
  delivery_coordinates?: { latitude: number; longitude: number } | null;
  add_ons?: Array<{ id: number; name: string; price: string; quantity: number }>;
  base_price: string;
  add_ons_price: string;
  delivery_price: string;
  discount_amount?: string;
  markup_amount?: string;
  total_price: string;
  currency: string;
  payment_method: string;
  payment_status: string;
  status: string;
  payments?: ApiPayment[];
  latest_payment?: ApiPayment | null;
  created_at?: string;
};

export type ApiPayment = {
  id: number;
  booking?: number;
  provider: string;
  method: string;
  status: string;
  amount_usd: string;
  currency: string;
  payment_url?: string;
  created_at: string;
};

export type ApiDeliveryZone = { id: number; name: string; price: string | number; is_active: boolean; bounds?: unknown };
export type ApiBookingQuote = {
  scooter_id: number;
  start_datetime: string;
  end_datetime: string;
  rental_days: number;
  base_price: string | number;
  add_ons_price: string | number;
  delivery_price: string | number;
  discount_amount: string | number;
  markup_amount: string | number;
  total_price: string | number;
  promo_code?: string | null;
  currency: string;
  payment_method: string;
};

export type ApiAvailabilityCalendar = {
  scooter_id: number;
  year: number;
  month: number;
  days: Array<{
    date: string;
    status: AvailabilityDayStatus;
    slots: Array<{ start: string; end: string; type: string }>;
  }>;
};

export type ApiBootstrap = {
  lang?: string;
  languages?: { code: string; name: string }[];
  content?: Record<string, unknown>;
  fleet?: {
    featured?: Array<{
      id: number;
      name: string;
      slug: string;
      type?: string;
      typeLabel?: string;
      engine?: string;
      priceUSD?: number;
      priceIDR?: number;
      rating?: number;
      reviews?: number;
      available?: boolean;
      featured?: boolean;
      accent?: string;
      features?: string[];
      specs?: Record<string, string>;
      description?: string;
      rentalTerms?: string;
      mainImage?: string | null;
      gallery?: { id: number; image: string; alt_text?: string; is_main?: boolean }[];
    }>;
    items?: unknown[];
  };
  addons?: Array<{ id: number; name: string; description?: string; icon?: string; priceUSD?: number; priceIDR?: number }>;
  deliveryZones?: Array<{ id: number; name: string; deliveryFeeUSD?: number; deliveryFeeIDR?: number; freeDelivery?: boolean; timeMinutes?: number; latitude?: number; longitude?: number }>;
};

export const endpoints = {
  bootstrap: (lang?: string) => api<ApiBootstrap>('/public/bootstrap/', { lang }),

  scooters: (params?: { search?: string; start_date?: string; end_date?: string; page?: number }, lang?: string) =>
    api<Paginated<ApiScooter> | ApiScooter[]>('/scooters/', { query: params, lang }),
  scooter: (idOrSlug: string | number, lang?: string) => api<ApiScooterDetail>(`/scooters/${idOrSlug}/`, { lang }),
  scooterAvailability: (id: number | string, params: { year?: number; month?: number; start_date?: string; end_date?: string }) =>
    api<ApiAvailabilityCalendar | { vehicle_id: number; start_date: string; end_date: string; is_available: boolean }>(`/scooters/${id}/availability/`, { query: params }),

  addons: (lang?: string) => api<Paginated<ApiAddon> | ApiAddon[]>('/add-ons/', { lang }),

  deliveryZones: (lang?: string) => api<Paginated<ApiDeliveryZone> | ApiDeliveryZone[]>('/delivery-zones/', { lang }),
  deliveryCalculate: (body: { latitude: number; longitude: number; address?: string; delivery_time?: string }) =>
    api<{ delivery_price: number; zone_name: string; zone: number; delivery_point: unknown }>('/delivery/calculate/', { method: 'POST', body }),

  bookingCalculate: (body: {
    scooter_id: number;
    start_datetime: string;
    end_datetime: string;
    delivery_time?: string;
    delivery_address?: string;
    delivery_latitude?: number;
    delivery_longitude?: number;
    add_on_ids?: number[];
    promo_code?: string;
    payment_method: BookingPaymentMethod;
    currency?: string;
  }, signal?: AbortSignal) => api<ApiBookingQuote>('/bookings/calculate/', { method: 'POST', body, signal }),

  pricingCalculate: (body: { scooter_id: number; start_date: string; end_date: string; device_type?: string; country_code?: string }) =>
    api<{ base_price: string; total_price: string; currency: string; seasonal_markup?: string; discount?: string }>('/pricing/calculate/', { method: 'POST', body }),

  validatePromo: (body: { code: string; amount: number }) =>
    api<{ valid: boolean; discount: number; discount_amount: number; message?: string; reason?: string }>('/marketing/promocodes/validate/', { method: 'POST', body }),

  bookingsList: (lang?: string) => api<Paginated<ApiBooking> | ApiBooking[]>('/bookings/', { auth: true, lang }),
  booking: (id: number | string, lang?: string) => api<ApiBooking>(`/bookings/${id}/`, { auth: true, lang }),
  cancelBooking: (id: number | string, lang?: string) => api<ApiBooking>(`/bookings/${id}/cancel/`, { method: 'POST', auth: true, lang }),

  createBooking: (body: BookingCreatePayload, lang?: string) =>
    api<ApiBooking>('/bookings/', { method: 'POST', body, auth: true, lang }),

  guestCreateBooking: (body: GuestBookingPayload, lang?: string) =>
    api<{ booking: ApiBooking; auth?: { access: string; refresh: string }; created_account?: boolean }>('/bookings/guest-create/', { method: 'POST', body, lang }),

  createPayment: (body: { booking_id: number; provider: string }) =>
    api<{ payment_id: number; provider: string; status: string; payment_url?: string; amount: string; currency: string }>('/payments/create/', { method: 'POST', body, auth: true }),

  // Auth
  register: (body: { email: string; password: string; full_name: string; phone?: string; language?: string }) =>
    api<ApiUser>('/auth/register/', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    api<{ access: string; refresh: string; user?: ApiUser }>('/auth/login/', { method: 'POST', body }),
  logout: () => {
    const t = tokens.get();
    if (!t) return Promise.resolve();
    return api('/auth/logout/', { method: 'POST', body: { refresh: t.refresh }, auth: true }).catch(() => {});
  },
  profile: () => api<ApiUser>('/profile/', { auth: true }),
  updateProfile: (body: Partial<Pick<ApiUser, 'full_name' | 'phone' | 'country' | 'language' | 'currency'>>) =>
    api<ApiUser>('/profile/', { method: 'PATCH', body, auth: true }),
};

export type BookingCreatePayload = {
  scooter_id: number;
  start_datetime: string;
  end_datetime: string;
  delivery_time?: string;
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  add_on_ids?: number[];
  promo_code?: string;
  payment_method: BookingPaymentMethod;
  currency?: string;
};

export type GuestBookingPayload = BookingCreatePayload & {
  guest_email: string;
  guest_full_name: string;
  guest_phone?: string;
  language?: string;
};

export function unwrapList<T>(res: Paginated<T> | T[]): T[] {
  if (Array.isArray(res)) return res;
  return res.results || [];
}

export async function loginAndStore(email: string, password: string) {
  const data = await endpoints.login({ email, password });
  tokens.set({ access: data.access, refresh: data.refresh });
  if (data.user) userStore.set(data.user);
  else {
    try { userStore.set(await endpoints.profile()); } catch {}
  }
  return data;
}

export function toApiPaymentMethod(method: 'card' | 'cash' | 'crypto'): BookingPaymentMethod {
  if (method === 'cash') return 'cash_on_delivery';
  if (method === 'crypto') return 'online_card';
  return 'online_card';
}
