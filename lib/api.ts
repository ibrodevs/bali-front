export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://bali21.pythonanywhere.com/api/v1';
export const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL || 'https://bali21.pythonanywhere.com';

const ACCESS_KEY = 'br_access';
const REFRESH_KEY = 'br_refresh';
const USER_KEY = 'br_user';

export type Tokens = { access: string; refresh: string };
export type ApiUser = {
  id: number;
  email: string;
  full_name?: string;
  phone?: string;
  role?: string;
  country?: string;
  language?: string;
  currency?: string;
  avatar?: string | null;
  created_at?: string;
};

export const tokens = {
  get: (): Tokens | null => {
    if (typeof window === 'undefined') return null;
    const access = localStorage.getItem(ACCESS_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    return access && refresh ? { access, refresh } : null;
  },
  set: (t: Tokens) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_KEY, t.access);
    localStorage.setItem(REFRESH_KEY, t.refresh);
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStore = {
  get: (): ApiUser | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set: (u: ApiUser | null) => {
    if (typeof window === 'undefined') return;
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  },
};

type ReqOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
  lang?: string;
  signal?: AbortSignal;
};

async function refreshAccess(): Promise<string | null> {
  const t = tokens.get();
  if (!t?.refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: t.refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access) return null;
    tokens.set({ access: data.access, refresh: t.refresh });
    return data.access;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown, message: string) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function extractErrorMessage(data: unknown, fallbackStatus: number) {
  if (!data) return `Request failed: ${fallbackStatus}`;
  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return `Request failed: ${fallbackStatus}`;

  const record = data as Record<string, unknown>;
  const direct = record.detail ?? record.error ?? record.message;
  if (typeof direct === 'string' && direct.trim()) return direct;

  const firstEntry = Object.entries(record).find(([, value]) => {
    if (typeof value === 'string' && value.trim()) return true;
    if (Array.isArray(value) && value.length > 0) return true;
    return false;
  });

  if (!firstEntry) return `Request failed: ${fallbackStatus}`;

  const [field, value] = firstEntry;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === 'string') {
      return field === 'non_field_errors' ? first : `${field}: ${first}`;
    }
  }

  return `Request failed: ${fallbackStatus}`;
}

function buildUrl(path: string, query?: ReqOptions['query']) {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function api<T = unknown>(path: string, opts: ReqOptions = {}): Promise<T> {
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (opts.lang) headers['Accept-Language'] = opts.lang;

  let access = tokens.get()?.access || null;
  if (opts.auth && access) headers.Authorization = `Bearer ${access}`;

  const fetchOpts: RequestInit = {
    method: opts.method || 'GET',
    headers,
    signal: opts.signal,
  };
  if (opts.body !== undefined) {
    fetchOpts.body = opts.body instanceof FormData ? opts.body : JSON.stringify(opts.body);
  }

  let res = await fetch(url, fetchOpts);

  if (res.status === 401 && opts.auth) {
    const newAccess = await refreshAccess();
    if (newAccess) {
      headers.Authorization = `Bearer ${newAccess}`;
      res = await fetch(url, { ...fetchOpts, headers });
    } else {
      tokens.clear();
    }
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = extractErrorMessage(data, res.status);
    throw new ApiError(res.status, data, msg);
  }
  return data as T;
}

export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
