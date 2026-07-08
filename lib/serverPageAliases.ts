import { PAGE_SETTINGS_DEFINITION_MAP, normalizePagePath, type ManagedPageKey } from './pageSettings';

type AliasResponse = {
  aliases?: Record<string, string>;
};

type AliasResolution =
  | { pageKey: ManagedPageKey; childSegments?: string[] }
  | null;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizeApiBase(value?: string) {
  const fallback = 'https://api.bali.bike/api/v1';
  const raw = (value || fallback).trim();
  if (!raw) return fallback;
  const cleaned = trimTrailingSlash(raw);
  if (/\/api\/v1$/i.test(cleaned)) return cleaned;
  return `${cleaned}/api/v1`;
}

const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);

async function fetchAliases(): Promise<Record<string, string>> {
  try {
    const response = await fetch(`${API_BASE}/public/page-settings/`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return {};
    const data = (await response.json()) as AliasResponse;
    return data.aliases || {};
  } catch {
    return {};
  }
}

export async function resolveAliasPath(pathname: string): Promise<AliasResolution> {
  const normalizedPath = normalizePagePath(pathname);
  const aliases = await fetchAliases();

  const directMatch = aliases[normalizedPath];
  if (directMatch && directMatch in PAGE_SETTINGS_DEFINITION_MAP) {
    return { pageKey: directMatch as ManagedPageKey };
  }

  for (const [aliasPath, rawPageKey] of Object.entries(aliases)) {
    if (!(rawPageKey in PAGE_SETTINGS_DEFINITION_MAP)) continue;
    const pageKey = rawPageKey as ManagedPageKey;
    if (!PAGE_SETTINGS_DEFINITION_MAP[pageKey].supportsChildren) continue;
    const prefix = aliasPath === '/' ? '/' : `${aliasPath}/`;
    if (!normalizedPath.startsWith(prefix)) continue;
    const remainder = normalizedPath.slice(prefix.length).replace(/^\/+|\/+$/g, '');
    if (!remainder) continue;
    return { pageKey, childSegments: remainder.split('/').filter(Boolean) };
  }

  return null;
}
