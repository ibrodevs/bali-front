export type BookingDraft = {
  scooter_id: number;
  route_id?: string;
  name: string;
  image?: string | null;
  currency?: string;
  start_datetime: string;
  end_datetime: string;
  delivery_time?: string;
  delivery_address?: string;
  add_on_ids?: number[];
  promo_code?: string;
};

const DRAFT_KEY = 'br_booking_draft';

export const bookingDraftStore = {
  get(): BookingDraft | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      return raw ? (JSON.parse(raw) as BookingDraft) : null;
    } catch {
      return null;
    }
  },
  set(value: BookingDraft) {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(value));
  },
  clear() {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(DRAFT_KEY);
  },
};
