'use client';

import React, { useEffect, useRef } from 'react';
import { AdminLocaleProvider, useAdminLocale } from '@/lib/i18n/AdminLocaleProvider';
import { ADMIN_UI_LOCALES, translateAdminUiText } from '@/lib/i18n/adminUi';

type AttrKey = 'placeholder' | 'title' | 'aria-label' | 'value';

const TRACKED_ATTRIBUTES: AttrKey[] = ['placeholder', 'title', 'aria-label', 'value'];

export function AdminSidebarLanguageSwitcher() {
  const { locale, setLocale } = useAdminLocale();
  const languageLabel = translateAdminUiText('Language', locale);
  const switcherLabel = translateAdminUiText('Admin interface language', locale);

  return (
    <div
      data-admin-i18n-skip="true"
      style={{
        zIndex: 1400,
        display: 'grid',
        gap: 10,
      }}
      aria-label={switcherLabel}
      title={switcherLabel}
    >
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase',
          padding: '0 4px',
        }}
      >
        {languageLabel}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ADMIN_UI_LOCALES.map((item) => {
          const active = item.code === locale;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setLocale(item.code)}
              title={translateAdminUiText(item.label, locale)}
              aria-label={translateAdminUiText(item.label, locale)}
              style={{
                border: `1px solid ${active ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.12)'}`,
                cursor: 'pointer',
                borderRadius: 999,
                padding: '8px 12px',
                minWidth: 52,
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
                background: active ? 'rgba(255,215,0,0.14)' : 'transparent',
                color: active ? '#FFD700' : 'rgba(255,255,255,0.72)',
              }}
            >
              {item.code.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useAdminDomTranslator(rootRef: React.RefObject<HTMLDivElement>) {
  const { locale } = useAdminLocale();
  const textCacheRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const attrCacheRef = useRef<WeakMap<Element, Partial<Record<AttrKey, string>>>>(new WeakMap());

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const textCache = textCacheRef.current;
    const attrCache = attrCacheRef.current;

    const shouldSkip = (node: Node | null) => {
      let current: Node | null = node;
      while (current) {
        if (current instanceof HTMLElement) {
          if (current.dataset.adminI18nSkip === 'true') return true;
          const tag = current.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return true;
        }
        current = current.parentNode;
      }
      return false;
    };

    const translateValue = (source: string) => translateAdminUiText(source, locale);

    const translateTextNode = (node: Text) => {
      if (shouldSkip(node.parentNode)) return;
      if (!textCache.has(node)) {
        textCache.set(node, node.nodeValue || '');
      }
      const original = textCache.get(node) || '';
      const trimmed = original.trim();
      if (!trimmed) return;

      const translated = translateValue(trimmed);
      if (translated === trimmed) {
        if ((node.nodeValue || '') !== original) {
          node.nodeValue = original;
        }
        return;
      }

      const leading = original.match(/^\s*/)?.[0] || '';
      const trailing = original.match(/\s*$/)?.[0] || '';
      const nextValue = `${leading}${translated}${trailing}`;
      if (node.nodeValue !== nextValue) {
        node.nodeValue = nextValue;
      }
    };

    const translateElementAttributes = (element: Element) => {
      if (shouldSkip(element)) return;

      let cache = attrCache.get(element);
      if (!cache) {
        cache = {};
        attrCache.set(element, cache);
      }

      for (const attr of TRACKED_ATTRIBUTES) {
        if (attr === 'value') {
          if (!(element instanceof HTMLInputElement)) continue;
          const inputType = (element.getAttribute('type') || '').toLowerCase();
          if (!['button', 'submit', 'reset'].includes(inputType)) continue;
        }

        const current = element.getAttribute(attr);
        if (current == null) continue;

        if (!cache[attr]) {
          cache[attr] = current;
        }

        const original = cache[attr] || current;
        const translated = translateValue(original);
        if (translated !== current) {
          element.setAttribute(attr, translated);
        }
      }
    };

    const translateTree = (node: Node) => {
      if (node instanceof Text) {
        translateTextNode(node);
        return;
      }

      if (!(node instanceof Element)) return;
      if (shouldSkip(node)) return;

      translateElementAttributes(node);

      const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let current = walker.currentNode;
      while (current) {
        if (current instanceof Text) {
          translateTextNode(current);
        } else if (current instanceof Element) {
          translateElementAttributes(current);
        }
        current = walker.nextNode();
      }
    };

    translateTree(root);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target instanceof Text) {
          translateTextNode(mutation.target);
          continue;
        }

        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          translateElementAttributes(mutation.target);
        }

        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => translateTree(node));
        }
      }
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRACKED_ATTRIBUTES,
    });

    return () => observer.disconnect();
  }, [locale, rootRef]);
}

function AdminRouteShellInner({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useAdminDomTranslator(rootRef);

  return (
    <div ref={rootRef}>{children}</div>
  );
}

export default function AdminRouteShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminLocaleProvider>
      <AdminRouteShellInner>{children}</AdminRouteShellInner>
    </AdminLocaleProvider>
  );
}
