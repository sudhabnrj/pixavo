import { getPageSeo, renderSeoTags } from './utils/seo';

// Canonical/OG URLs point at wherever the app is served from (the production site on GitHub Pages).
const siteUrl = () => new URL(import.meta.env.BASE_URL, window.location.origin).href;

function findMarkers() {
  let start: Comment | null = null;
  let end: Comment | null = null;
  document.head.childNodes.forEach((node) => {
    if (node.nodeType !== Node.COMMENT_NODE) return;
    if ((node as Comment).data === 'seo:start') start = node as Comment;
    if ((node as Comment).data === 'seo:end') end = node as Comment;
  });
  return { start, end } as { start: Comment | null; end: Comment | null };
}

/** Replaces the page's SEO tags (between the seo:start/seo:end markers) for the given route. */
export function applyPageSeo(slug: string) {
  const { start, end } = findMarkers();
  if (!start || !end) return;

  while (start.nextSibling && start.nextSibling !== end) start.nextSibling.remove();

  const template = document.createElement('template');
  template.innerHTML = renderSeoTags(getPageSeo(slug, siteUrl()));
  end.before(template.content);
}
