import { useSyncExternalStore } from 'react';
import { routeForTool } from './utils/toolCatalog';

// Path-based routing: every tool lives at its own URL, e.g. /raw-to-jpg/.
const BASE = import.meta.env.BASE_URL; // always ends with "/"

/** Current route slug ("" for the home page). */
export function getSlug(): string {
  let path = decodeURIComponent(window.location.pathname);
  path = path.startsWith(BASE) ? path.slice(BASE.length) : path.replace(/^\/+/, '');
  return path.replace(/index\.html$/, '').replace(/\/+$/, '');
}

export function hrefFor(slug: string, hash?: string): string {
  return `${BASE}${slug ? `${slug}/` : ''}${hash ? `#${hash}` : ''}`;
}

const subscribe = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
};

export function useSlug() {
  return useSyncExternalStore(subscribe, getSlug);
}

export function navigate(slug: string, { replace = false } = {}) {
  const url = hrefFor(slug);
  if (replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

export const navigateToTool = (toolId: string) => navigate(routeForTool(toolId)?.slug ?? '');

/** Rewrites old hash links (#convert/raw-jpg, #video) to their new pages. */
export function redirectLegacyHash() {
  const { hash } = window.location;
  if (hash.startsWith('#convert/')) {
    const route = routeForTool(hash.slice('#convert/'.length));
    if (route) navigate(route.slug, { replace: true });
  } else if (hash === '#video') {
    navigate('video-studio', { replace: true });
  }
}
