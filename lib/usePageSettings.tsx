'use client';

import { useEffect } from 'react';

import { useLocale } from './i18n/LocaleProvider';
import { joinPagePath, type ManagedPageKey } from './pageSettings';

export function usePagePath(pageKey: ManagedPageKey): string {
  const { pageSettings } = useLocale();
  return pageSettings[pageKey].path;
}

export function usePageTitle(pageKey: ManagedPageKey): string {
  const { pageSettings } = useLocale();
  return pageSettings[pageKey].title;
}

export function useChildPagePath(pageKey: ManagedPageKey, child?: string | null): string {
  const path = usePagePath(pageKey);
  return joinPagePath(path, child);
}

export function PageTitleSync({ pageKey }: { pageKey: ManagedPageKey }) {
  const title = usePageTitle(pageKey);

  useEffect(() => {
    if (typeof document !== 'undefined' && title) {
      document.title = title;
    }
  }, [title]);

  return null;
}
