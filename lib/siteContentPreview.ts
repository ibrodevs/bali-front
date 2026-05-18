'use client';

import { useMemo } from 'react';

export function useSiteContentPreview() {
  const enabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('sitePreview') === '1';
  }, []);

  function marker(key: string) {
    return enabled ? { 'data-site-content-key': key } : {};
  }

  return { enabled, marker };
}
