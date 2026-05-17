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

export type ApiVehicleType = {
  id: number;
  code: string;
  name: string;
};

export type ApiVehicleModel = {
  id: number;
  name: string;
  brand: string;
  type?: number;
  type_name?: string;
  type_code?: string;
  engine_cc: number;
  transmission: string;
  fuel_consumption: number | string;
  year: number;
  trunk: string;
  helmets_count: number;
  description: string;
  rental_terms: string;
};

export type AdminScooterModelPayload = {
  name: string;
  brand: string;
  type: number;
  engine_cc: number;
  transmission: string;
  fuel_consumption: number | string;
  year: number;
  trunk: string;
  helmets_count: number;
  description: string;
  rental_terms: string;
};

export type ApiScooterDetail = ApiScooter & {
  model?: number;
  sku?: string;
  color?: string;
  base_price_usd?: string | number;
  mileage?: number;
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
  model_info?: Partial<ApiVehicleModel>;
  translations?: ApiVehicleTranslation[];
};

export type ApiAddon = {
  id: number;
  code?: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  price_usd?: string | number;
  priceUSD?: string | number;
  price?: string | number;
  price_type?: string;
  priceType?: string;
  is_active?: boolean;
  sort_order?: number;
  image?: string;
  translations?: ApiAddonTranslation[];
};

export type AdminAddonPayload = {
  code: string;
  name: string;
  description: string;
  price_usd: string | number;
  price_type: string;
  is_active: boolean;
  sort_order: number;
};

export type ApiScooterImage = {
  id: number;
  image: string;
  alt_text?: string;
  sort_order?: number;
  is_main?: boolean;
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

export type ApiAdminUser = {
  id: number;
  email: string;
  full_name?: string;
  phone?: string;
  role?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  created_at?: string;
};

export type ApiAnalyticsRevenue = {
  bookings_count: number;
  revenue: string | number;
  currency: string;
  period?: string;
};

export type ApiAnalyticsFunnelStep = {
  step: string;
  label: string;
  count: number;
  dropoff_percent: string | number;
};

export type ApiAnalyticsFunnel = {
  funnel: ApiAnalyticsFunnelStep[];
  visitors: number;
  checkout_started: number;
  bookings_created: number;
  conversion_rate: string | number;
  checkout_conversion_rate: string | number;
  period?: string;
};

export type ApiCustomerSegment = {
  id: number;
  code: string;
  name: string;
  discount_percent?: string | number;
};

export type ApiCustomerProfile = {
  id: number;
  user?: {
    id: number;
    email: string;
    full_name?: string;
    phone?: string;
    role?: string;
  };
  segment?: ApiCustomerSegment | null;
  created_at?: string;
  updated_at?: string;
  notes?: Array<{
    id: number;
    text: string;
    created_at?: string;
    updated_at?: string;
  }>;
  interactions?: Array<{
    id: number;
    interaction_type: string;
    description: string;
    occurred_at?: string;
    created_at?: string;
  }>;
};

export type ApiStaffTask = {
  id: number;
  title: string;
  description?: string;
  status: string;
  due_at?: string | null;
  created_at?: string;
  updated_at?: string;
  assigned_to?: {
    id: number;
    email: string;
    full_name?: string;
  } | null;
  checklist_items?: Array<{
    id: number;
    title: string;
    is_completed: boolean;
  }>;
  comments?: Array<{
    id: number;
    text: string;
    created_at?: string;
  }>;
};

export type ApiSupportTicket = {
  id: number;
  subject: string;
  status: string;
  channel: string;
  created_at?: string;
  closed_at?: string | null;
  user?: {
    id: number;
    email: string;
    full_name?: string;
    phone?: string;
  };
  messages?: Array<{
    id: number;
    message: string;
    created_at?: string;
    sender?: {
      id: number;
      email: string;
      full_name?: string;
    };
  }>;
};

export type ApiChatThread = {
  id: number;
  title: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
  participants?: Array<{
    id: number;
    role: string;
    user?: {
      id: number;
      email: string;
      full_name?: string;
    };
  }>;
  last_message?: {
    text: string;
    created_at?: string;
    sender_name?: string | null;
  } | null;
  messages?: Array<{
    id: number;
    text: string;
    created_at?: string;
    sender?: {
      id: number;
      email: string;
      full_name?: string;
    };
  }>;
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
  dictionaryOverrides?: Record<string, unknown>;
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

export type ApiChatMessage = {
  id: number;
  thread?: number;
  text: string;
  created_at?: string;
  sender?: {
    id: number;
    email: string;
    full_name?: string;
    role?: string;
  } | null;
};

export type ApiQuickReply = {
  id: number;
  title: string;
  text: string;
  is_active?: boolean;
};

export type ApiAuditLog = {
  id: number;
  action: string;
  user_email?: string | null;
  created_at?: string;
  content_type?: { app_label?: string; model?: string } | null;
  changes?: unknown;
  object_repr?: string;
};

export type ApiLoginLog = {
  id: number;
  user_email?: string | null;
  is_success: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
};

export type ApiWebhookLog = {
  id: number;
  provider: string;
  status: string;
  payload?: unknown;
  created_at?: string;
};

export type ApiAdminFaqTranslation = {
  id?: number;
  language: string;
  question: string;
  answer: string;
};

export type ApiAdminFaqItem = {
  id: number;
  code: string;
  is_active: boolean;
  sort_order: number;
  translations: ApiAdminFaqTranslation[];
  created_at?: string;
  updated_at?: string;
};

export type AdminFaqPayload = {
  code: string;
  is_active: boolean;
  sort_order: number;
  translations?: ApiAdminFaqTranslation[];
};

export type ApiNewsArticle = {
  id: number;
  slug: string;
  image: string | null;
  published_at: string;
  title: string;
  description: string;
  translations?: Array<{ id: number; language: string; title: string; description: string }>;
};

export type AdminNewsArticlePayload = {
  slug: string;
  published_at: string;
  is_active: boolean;
  sort_order: number;
  translations: Array<{ language: string; title: string; description: string }>;
};

export type AdminScooterPayload = {
  model: number;
  title: string;
  slug: string;
  sku?: string;
  color: string;
  base_price_usd: string | number;
  status: string;
  mileage: number;
  is_featured: boolean;
};

export type ApiVehicleTranslation = {
  language: string;
  title: string;
  description: string;
  rental_terms: string;
  transmission?: string;
  trunk?: string;
};

export type ApiAddonTranslation = {
  language: string;
  name: string;
  description: string;
};

export type ApiLocationSection = {
  id: number;
  language: string;
  title1: string;
  title2: string;
  description: string;
  map_eyebrow: string;
  map_region: string;
  zones_label: string;
  zones_title: string;
  zones_desc: string;
  is_active: boolean;
  updated_at?: string;
};

export type ApiAdminDeliveryZoneTranslation = {
  id?: number;
  language: string;
  name: string;
};

export type ApiAdminDeliveryZone = {
  id: number;
  name: string;
  is_free: boolean;
  is_active: boolean;
  translations: ApiAdminDeliveryZoneTranslation[];
};

export type ApiPromoCode = {
  id: number;
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: string | number;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number;
  current_usage: number;
  min_booking_amount: string | number;
  max_discount_amount: string | number | null;
  is_active: boolean;
  campaign?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type SiteContentValueType = 'text' | 'textarea' | 'json' | 'image' | 'video' | 'file';

export type ApiAdminSiteContentEntry = {
  id: number;
  key: string;
  language: string;
  value_type: SiteContentValueType;
  value: string;
  json_value?: unknown;
  media?: string | null;
  media_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PromoCodePayload = {
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: string | number;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number;
  min_booking_amount?: string | number;
  max_discount_amount?: string | number | null;
  is_active?: boolean;
};

export const endpoints = {
  bootstrap: (lang?: string) => api<ApiBootstrap>('/public/bootstrap/', { lang }),

  scooters: (params?: { search?: string; start_date?: string; end_date?: string; page?: number }, lang?: string) =>
    api<Paginated<ApiScooter> | ApiScooter[]>('/scooters/', { query: params, lang }),
  scooter: (idOrSlug: string | number, lang?: string) => api<ApiScooterDetail>(`/scooters/${idOrSlug}/`, { lang }),
  scooterTypes: () => api<Paginated<ApiVehicleType> | ApiVehicleType[]>('/scooter-types/'),
  scooterModels: () => api<Paginated<ApiVehicleModel> | ApiVehicleModel[]>('/scooter-models/'),
  adminCreateScooterModel: (body: AdminScooterModelPayload) =>
    api<ApiVehicleModel>('/scooter-models/', { method: 'POST', body, auth: true }),
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
  chatThreads: (params?: { page?: number; status?: string; page_size?: number }) =>
    api<Paginated<ApiChatThread> | ApiChatThread[]>('/chat/threads/', { auth: true, query: params }),
  ensureSupportChatThread: (body?: { title?: string }) =>
    api<ApiChatThread>('/chat/threads/ensure-support/', { method: 'POST', body, auth: true }),
  chatMessages: (threadId: number | string, params?: { page_size?: number }) =>
    api<Paginated<ApiChatMessage> | ApiChatMessage[]>('/chat/messages/', {
      auth: true,
      query: { thread: threadId, ordering: 'created_at', ...(params || {}) },
    }),
  sendChatMessage: (body: { thread_id: number; text: string }) =>
    api<ApiChatMessage>('/chat/messages/', { method: 'POST', body, auth: true }),

  adminScooters: (params?: { page?: number; search?: string; status?: string }) =>
    api<Paginated<ApiScooterDetail> | ApiScooterDetail[]>('/admin/scooters/', { auth: true, query: params }),
  adminCreateScooter: (body: AdminScooterPayload) =>
    api<ApiScooterDetail>('/admin/scooters/', { method: 'POST', body, auth: true }),
  adminUpdateScooter: (id: number | string, body: Partial<AdminScooterPayload>) =>
    api<ApiScooterDetail>(`/admin/scooters/${id}/`, { method: 'PATCH', body, auth: true }),
  adminDeleteScooter: (id: number | string) =>
    api<void>(`/admin/scooters/${id}/`, { method: 'DELETE', auth: true }),

  adminBookings: (params?: { page?: number; status?: string }) =>
    api<Paginated<ApiBooking> | ApiBooking[]>('/admin/bookings/', { auth: true, query: params }),
  adminConfirmBooking: (id: number | string) =>
    api<{ status: string }>(`/admin/bookings/${id}/confirm/`, { method: 'POST', auth: true }),
  adminMarkBookingDelivery: (id: number | string) =>
    api<{ status: string }>(`/admin/bookings/${id}/mark-delivery/`, { method: 'POST', auth: true }),
  adminCancelBooking: (id: number | string) =>
    api<{ status: string }>(`/admin/bookings/${id}/cancel/`, { method: 'POST', auth: true }),
  adminMarkBookingActive: (id: number | string) =>
    api<{ status: string }>(`/admin/bookings/${id}/mark-active/`, { method: 'POST', auth: true }),
  adminCompleteBooking: (id: number | string) =>
    api<{ status: string }>(`/admin/bookings/${id}/complete/`, { method: 'POST', auth: true }),
  adminUsers: (params?: { page?: number; search?: string }) =>
    api<Paginated<ApiAdminUser> | ApiAdminUser[]>('/admin/users/', { auth: true, query: params }),
  adminAnalyticsRevenue: (params?: { start_date?: string; end_date?: string }) =>
    api<ApiAnalyticsRevenue>('/admin/analytics/revenue/', { auth: true, query: params }),
  adminAnalyticsFunnel: (params?: { start_date?: string; end_date?: string }) =>
    api<ApiAnalyticsFunnel>('/admin/analytics/funnel/', { auth: true, query: params }),
  adminCustomerProfiles: (params?: { page?: number; search?: string; segment?: number | string; page_size?: number }) =>
    api<Paginated<ApiCustomerProfile> | ApiCustomerProfile[]>('/admin/crm/customer-profiles/', { auth: true, query: params }),
  adminStaffTasks: (params?: { page?: number; status?: string; page_size?: number }) =>
    api<Paginated<ApiStaffTask> | ApiStaffTask[]>('/admin/tasks/staff-tasks/', { auth: true, query: params }),
  adminSupportTickets: (params?: { page?: number; status?: string; page_size?: number }) =>
    api<Paginated<ApiSupportTicket> | ApiSupportTicket[]>('/admin/support/tickets/', { auth: true, query: params }),
  adminChatThreads: (params?: { page?: number; status?: string; search?: string; page_size?: number }) =>
    api<Paginated<ApiChatThread> | ApiChatThread[]>('/admin/chat/threads/', { auth: true, query: params }),
  adminAddons: (params?: { page?: number; page_size?: number }) =>
    api<Paginated<ApiAddon> | ApiAddon[]>('/add-ons/', { auth: true, query: params }),
  adminCreateAddon: (body: Partial<AdminAddonPayload>) =>
    api<ApiAddon>('/add-ons/', { method: 'POST', body, auth: true }),
  adminUpdateAddon: (id: number | string, body: Partial<AdminAddonPayload>) =>
    api<ApiAddon>(`/add-ons/${id}/`, { method: 'PATCH', body, auth: true }),
  adminDeleteAddon: (id: number | string) =>
    api<void>(`/add-ons/${id}/`, { method: 'DELETE', auth: true }),
  adminUploadScooterImage: (
    scooterId: number | string,
    file: File,
    options?: { alt_text?: string; sort_order?: number; is_main?: boolean },
  ) => {
    const form = new FormData();
    form.append('image', file);
    if (options?.alt_text) form.append('alt_text', options.alt_text);
    if (typeof options?.sort_order === 'number') form.append('sort_order', String(options.sort_order));
    if (typeof options?.is_main === 'boolean') form.append('is_main', String(options.is_main));
    return api<ApiScooterImage>(`/admin/scooters/${scooterId}/images/`, {
      method: 'POST',
      body: form,
      auth: true,
    });
  },
  adminDeleteScooterImage: (imageId: number | string) =>
    api<void>(`/admin/scooter-images/${imageId}/`, { method: 'DELETE', auth: true }),

  adminScooterTranslations: (id: number | string) =>
    api<ApiVehicleTranslation[]>(`/admin/scooters/${id}/translations/`, { auth: true }),
  adminSaveScooterTranslations: (id: number | string, translations: ApiVehicleTranslation[]) =>
    api<{ status: string }>(`/admin/scooters/${id}/translations/`, { method: 'POST', body: translations, auth: true }),
  adminUpdateScooterModel: (modelId: number | string, body: Partial<AdminScooterModelPayload>) =>
    api<ApiVehicleModel>(`/scooter-models/${modelId}/`, { method: 'PATCH', body, auth: true }),

  adminAddonTranslations: (id: number | string) =>
    api<ApiAddonTranslation[]>(`/add-ons/${id}/translations/`, { auth: true }),
  adminSaveAddonTranslations: (id: number | string, translations: ApiAddonTranslation[]) =>
    api<{ status: string }>(`/add-ons/${id}/translations/`, { method: 'POST', body: translations, auth: true }),

  adminChatMessages: (threadId: number | string, params?: { page_size?: number }) =>
    api<Paginated<ApiChatMessage> | ApiChatMessage[]>('/admin/chat/messages/', {
      auth: true,
      query: { thread: threadId, ordering: 'created_at', ...(params || {}) },
    }),
  adminSendChatMessage: (body: { thread_id: number; text: string }) =>
    api<ApiChatMessage>('/admin/chat/messages/', { method: 'POST', body, auth: true }),
  adminAddChatParticipant: (body: { thread_id: number; user_id: number; role?: string }) =>
    api<unknown>('/admin/chat/participants/', { method: 'POST', body, auth: true }),
  adminUpdateChatThread: (id: number | string, body: { status?: string; title?: string }) =>
    api<ApiChatThread>(`/admin/chat/threads/${id}/`, { method: 'PATCH', body, auth: true }),
  adminQuickReplies: (params?: { is_active?: boolean | string; page_size?: number }) =>
    api<Paginated<ApiQuickReply> | ApiQuickReply[]>('/admin/chat/quick-replies/', {
      auth: true,
      query: {
        page_size: params?.page_size,
        is_active: params?.is_active === undefined ? undefined : String(params.is_active),
      },
    }),

  adminAuditLogs: (params?: { page_size?: number; ordering?: string }) =>
    api<Paginated<ApiAuditLog> | ApiAuditLog[]>('/admin/audit/', { auth: true, query: params }),
  adminLoginLogs: (params?: { page_size?: number; ordering?: string }) =>
    api<Paginated<ApiLoginLog> | ApiLoginLog[]>('/admin/security/logins/', { auth: true, query: params }),
  adminWebhookLogs: (params?: { page_size?: number; ordering?: string }) =>
    api<Paginated<ApiWebhookLog> | ApiWebhookLog[]>('/admin/security/webhooks/', { auth: true, query: params }),
  adminPayments: (params?: { page_size?: number; ordering?: string }) =>
    api<Paginated<ApiPayment> | ApiPayment[]>('/payments/', { auth: true, query: params }),

  // FAQ (admin)
  adminFaqs: (params?: { page?: number; page_size?: number }) =>
    api<Paginated<ApiAdminFaqItem> | ApiAdminFaqItem[]>('/admin/content/faq/', { auth: true, query: params }),
  adminCreateFaq: (body: AdminFaqPayload) =>
    api<ApiAdminFaqItem>('/admin/content/faq/', { method: 'POST', body, auth: true }),
  adminUpdateFaq: (id: number | string, body: Partial<AdminFaqPayload>) =>
    api<ApiAdminFaqItem>(`/admin/content/faq/${id}/`, { method: 'PATCH', body, auth: true }),
  adminDeleteFaq: (id: number | string) =>
    api<void>(`/admin/content/faq/${id}/`, { method: 'DELETE', auth: true }),

  // News (public)
  newsList: (params?: { page?: number; page_size?: number }, lang?: string) =>
    api<Paginated<ApiNewsArticle> | ApiNewsArticle[]>('/news/', {
      query: { ...params, lang },
      lang,
    }),
  newsArticle: (slug: string, lang?: string) =>
    api<ApiNewsArticle>(`/news/${slug}/`, {
      query: lang ? { lang } : undefined,
      lang,
    }),

  // News (admin)
  adminNewsList: (params?: { page?: number; page_size?: number }) =>
    api<Paginated<ApiNewsArticle> | ApiNewsArticle[]>('/admin/content/news/', { auth: true, query: params }),
  adminCreateNews: (body: FormData | Partial<AdminNewsArticlePayload>) =>
    api<ApiNewsArticle>('/admin/content/news/', { method: 'POST', body, auth: true }),
  adminUpdateNews: (id: number | string, body: FormData | Partial<AdminNewsArticlePayload>) =>
    api<ApiNewsArticle>(`/admin/content/news/${id}/`, { method: 'PATCH', body, auth: true }),
  adminDeleteNews: (id: number | string) =>
    api<void>(`/admin/content/news/${id}/`, { method: 'DELETE', auth: true }),

  // Location Section (admin)
  adminLocationSections: () =>
    api<Paginated<ApiLocationSection> | ApiLocationSection[]>('/admin/content/location-sections/', { auth: true, query: { page_size: 100 } }),
  adminCreateLocationSection: (body: Partial<ApiLocationSection>) =>
    api<ApiLocationSection>('/admin/content/location-sections/', { method: 'POST', body, auth: true }),
  adminUpdateLocationSection: (id: number | string, body: Partial<ApiLocationSection>) =>
    api<ApiLocationSection>(`/admin/content/location-sections/${id}/`, { method: 'PATCH', body, auth: true }),
  adminDeleteLocationSection: (id: number | string) =>
    api<void>(`/admin/content/location-sections/${id}/`, { method: 'DELETE', auth: true }),

  // Delivery Zones with translations (admin)
  adminDeliveryZones: () =>
    api<Paginated<ApiAdminDeliveryZone> | ApiAdminDeliveryZone[]>('/admin/content/delivery-zones/', { auth: true, query: { page_size: 200 } }),
  adminCreateDeliveryZone: (body: Partial<ApiAdminDeliveryZone>) =>
    api<ApiAdminDeliveryZone>('/admin/content/delivery-zones/', { method: 'POST', body, auth: true }),
  adminUpdateDeliveryZone: (id: number | string, body: Partial<ApiAdminDeliveryZone>) =>
    api<ApiAdminDeliveryZone>(`/admin/content/delivery-zones/${id}/`, { method: 'PATCH', body, auth: true }),
  adminDeleteDeliveryZone: (id: number | string) =>
    api<void>(`/admin/content/delivery-zones/${id}/`, { method: 'DELETE', auth: true }),

  // Site content (admin)
  adminSiteContent: () =>
    api<Paginated<ApiAdminSiteContentEntry> | ApiAdminSiteContentEntry[]>('/admin/content/site-content/', { auth: true, query: { page_size: 500 } }),
  adminCreateSiteContent: (body: FormData | Partial<ApiAdminSiteContentEntry>) =>
    api<ApiAdminSiteContentEntry>('/admin/content/site-content/', { method: 'POST', body, auth: true }),
  adminUpdateSiteContent: (id: number | string, body: FormData | Partial<ApiAdminSiteContentEntry>) =>
    api<ApiAdminSiteContentEntry>(`/admin/content/site-content/${id}/`, { method: 'PATCH', body, auth: true }),
  adminDeleteSiteContent: (id: number | string) =>
    api<void>(`/admin/content/site-content/${id}/`, { method: 'DELETE', auth: true }),

  // Promo codes (admin)
  adminPromoCodes: (params?: { page_size?: number }) =>
    api<Paginated<ApiPromoCode> | ApiPromoCode[]>('/admin/marketing/promocodes/', { auth: true, query: params }),
  adminCreatePromoCode: (body: PromoCodePayload) =>
    api<ApiPromoCode>('/admin/marketing/promocodes/', { method: 'POST', body, auth: true }),
  adminUpdatePromoCode: (id: number | string, body: Partial<PromoCodePayload>) =>
    api<ApiPromoCode>(`/admin/marketing/promocodes/${id}/`, { method: 'PATCH', body, auth: true }),
  adminDeletePromoCode: (id: number | string) =>
    api<void>(`/admin/marketing/promocodes/${id}/`, { method: 'DELETE', auth: true }),
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
