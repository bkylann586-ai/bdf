import { useState, useEffect } from 'react';

// Custom event name for History API state pushes
const NAVIGATE_EVENT = 'pdfquick:navigate';

export function normalizePath(path: string): string {
  if (!path) return '/';
  const clean = path.split('?')[0].split('#')[0].trim();
  const normalized = clean.replace(/\/+$/, '') || '/';
  return normalized;
}

export function getCurrentPath(): string {
  if (typeof window === 'undefined') return '/';

  // Support backwards-compatible hash redirection (e.g. /#/merge-pdf -> /merge-pdf)
  if (window.location.hash.startsWith('#/')) {
    const hashPath = window.location.hash.slice(1);
    const normalized = normalizePath(hashPath);
    window.history.replaceState(null, '', normalized);
    return normalized;
  }

  return normalizePath(window.location.pathname);
}

export function navigate(to: string): void {
  if (typeof window === 'undefined') return;

  const target = normalizePath(to);
  const current = normalizePath(window.location.pathname);

  if (target !== current) {
    window.history.pushState(null, '', target);
    window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: target }));
  }

  window.scrollTo(0, 0);
}

/**
 * React hook to observe the current route path and trigger re-renders on route changes
 */
export function usePathname(): string {
  const [pathname, setPathname] = useState<string>(() => getCurrentPath());

  useEffect(() => {
    const handlePopState = () => {
      setPathname(getCurrentPath());
      window.scrollTo(0, 0);
    };

    const handleCustomNavigate = () => {
      setPathname(getCurrentPath());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener(NAVIGATE_EVENT, handleCustomNavigate);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener(NAVIGATE_EVENT, handleCustomNavigate);
    };
  }, []);

  return pathname;
}

/**
 * Helper to handle link clicks seamlessly with the History API while preserving
 * native browser shortcuts (Cmd/Ctrl click, right-click, middle-click)
 */
export function handleLinkClick(
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string
): void {
  // If user opened in new tab or window, let native behavior happen
  if (
    e.defaultPrevented ||
    e.button !== 0 ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey
  ) {
    return;
  }

  // Only intercept internal application routes
  if (href.startsWith('/') && !href.startsWith('//')) {
    e.preventDefault();
    navigate(href);
  }
}
