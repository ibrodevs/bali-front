import { mediaUrl } from './api';

export function resolveHeroVideoUrl(path?: string | null): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed || trimmed === '__none__' || trimmed === 'none') return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/media/')) {
    return mediaUrl(trimmed);
  }
  return trimmed;
}
