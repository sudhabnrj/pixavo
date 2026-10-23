// SEO metadata for every page. Pure data + string building (no DOM) so the build can write
// each page's <head> statically and the app can keep it in sync while navigating.
import { routeForSlug } from './toolCatalog';
import type { ToolRoute } from './toolCatalog';
import { FAQ_ITEMS } from './faqData';

export const SITE_NAME = 'Pixavo';
export const OG_IMAGE_PATH = 'og-image.png';

interface PageCopy {
  title: string; // ≤ 60 chars so it isn't truncated in results
  description: string; // ≤ 160 chars
  keywords: string;
}

const HOME: PageCopy = {
  title: 'Pixavo — Free Image & Video Converter, No Uploads',
  description:
    'Convert RAW, HEIC, PNG, JPG and WebP images, and crop, resize or convert MP4, MOV, WebM and MKV videos — free, private and 100% in your browser.',
  keywords:
    'image converter, video converter, raw to jpg, heic to jpg, png to jpg, webp converter, crop video, resize video, mp4 converter, online converter no upload',
};

const NOT_FOUND: PageCopy = {
  title: 'Page Not Found | Pixavo',
  description: 'This page doesn’t exist. Browse Pixavo’s free, private image and video tools that run entirely in your browser.',
  keywords: '',
};

const TOOL_COPY: Record<string, PageCopy> = {
  'raw-jpg': {
    title: 'RAW to JPG Converter — Free, No Upload | Pixavo',
    description: 'Convert RAW photos (CR2, CR3, NEF, ARW, DNG, RAF) to high-quality JPG for free. Runs in your browser — your photos are never uploaded.',
    keywords: 'raw to jpg, cr2 to jpg, cr3 to jpg, nef to jpg, arw to jpg, dng to jpg, raf to jpg, convert raw photos online',
  },
  'raw-png': {
    title: 'RAW to PNG Converter — Lossless & Private | Pixavo',
    description: 'Convert camera RAW files (CR2, NEF, ARW, DNG) to lossless PNG images for free. Private in-browser conversion with no uploads or sign-up.',
    keywords: 'raw to png, cr2 to png, nef to png, arw to png, dng to png, lossless raw converter',
  },
  'png-raw': {
    title: 'PNG to DNG (RAW) Converter — Free Online | Pixavo',
    description: 'Convert PNG images into DNG camera RAW files for RAW-based editing workflows. Free and private — conversion runs entirely in your browser.',
    keywords: 'png to raw, png to dng, convert png to dng, dng converter, raw file creator',
  },
  'heic-jpg': {
    title: 'HEIC to JPG Converter — iPhone Photos, Free | Pixavo',
    description: 'Convert iPhone HEIC and HEIF photos to JPG in seconds. Free batch conversion right in your browser — your photos never leave your device.',
    keywords: 'heic to jpg, heif to jpg, iphone photo converter, convert heic, heic converter free',
  },
  'png-jpg': {
    title: 'PNG to JPG Converter — Free & Private | Pixavo',
    description: 'Convert PNG images to compressed JPG files for free. Adjust quality, resize and batch convert in your browser with no uploads.',
    keywords: 'png to jpg, png to jpeg, convert png to jpg, compress png, png converter',
  },
  'webp-jpg': {
    title: 'WebP to JPG Converter — Free Online | Pixavo',
    description: 'Convert WebP images to universally compatible JPG files. Free, fast batch conversion that runs entirely in your browser — nothing is uploaded.',
    keywords: 'webp to jpg, webp to jpeg, convert webp, webp converter, open webp files',
  },
  'jpg-png': {
    title: 'JPG to PNG Converter — Free, No Upload | Pixavo',
    description: 'Convert JPG and JPEG photos to lossless PNG images for free. Batch convert privately in your browser with no sign-up or uploads.',
    keywords: 'jpg to png, jpeg to png, convert jpg to png, lossless png converter',
  },
  'webp-png': {
    title: 'WebP to PNG Converter — Keeps Transparency | Pixavo',
    description: 'Convert WebP images to PNG while keeping transparency intact. Free, private batch conversion that runs entirely in your browser.',
    keywords: 'webp to png, convert webp to png, transparent webp to png, webp converter',
  },
  'jpg-webp': {
    title: 'JPG to WebP Converter — Smaller Images | Pixavo',
    description: 'Convert JPG photos to WebP for faster websites and smaller files. Free batch conversion in your browser with quality control and no uploads.',
    keywords: 'jpg to webp, jpeg to webp, convert to webp, image optimizer, webp converter',
  },
  'png-webp': {
    title: 'PNG to WebP Converter — Free & Private | Pixavo',
    description: 'Convert PNG images to WebP and cut file sizes while keeping transparency. Free in-browser batch conversion — your files are never uploaded.',
    keywords: 'png to webp, convert png to webp, transparent webp, compress png, webp converter',
  },
  'video-studio': {
    title: 'Free Online Video Editor — Crop, Resize, Convert | Pixavo',
    description: 'Crop, resize and convert videos for free, right in your browser. Supports MP4, MOV, WebM and MKV with lossless export when possible.',
    keywords: 'online video editor, crop video, resize video, convert video, video editor no upload, free video editor',
  },
  'crop-video': {
    title: 'Crop Video Online — Free, No Upload | Pixavo',
    description: 'Crop videos to 16:9, 9:16, 1:1, 4:5 or any size for free. Fast, private in-browser video cropping — no uploads and no watermark.',
    keywords: 'crop video, crop video online, crop mp4, video cropper, crop video for instagram, 9:16 video',
  },
  'resize-video': {
    title: 'Resize Video Online — 4K, 1080p, 720p | Pixavo',
    description: 'Resize videos to 4K, 1080p, 720p or a custom size while keeping the aspect ratio. Free, private and in-browser — no uploads or watermark.',
    keywords: 'resize video, video resizer, change video resolution, 1080p to 720p, downscale video',
  },
  'video-converter': {
    title: 'Video Converter — MP4, MOV, WebM, MKV | Pixavo',
    description: 'Convert videos between MP4, MOV, WebM and MKV for free. Lossless whenever possible, fully in your browser — your video is never uploaded.',
    keywords: 'video converter, convert video, mp4 converter, mov converter, webm converter, mkv converter',
  },
  'mp4-to-webm': {
    title: 'MP4 to WebM Converter — Free Online | Pixavo',
    description: 'Convert MP4 videos to WebM for the web, free and right in your browser. High-quality VP9 or AV1 output with no uploads and no watermark.',
    keywords: 'mp4 to webm, convert mp4 to webm, webm converter, vp9 converter',
  },
  'webm-to-mp4': {
    title: 'WebM to MP4 Converter — Free, No Upload | Pixavo',
    description: 'Convert WebM videos to MP4 that plays on every phone, TV and editor. Free, fast and private — conversion happens entirely in your browser.',
    keywords: 'webm to mp4, convert webm to mp4, webm converter, mp4 converter',
  },
  'mov-to-mp4': {
    title: 'MOV to MP4 Converter — iPhone Videos, Free | Pixavo',
    description: 'Convert iPhone and camera MOV videos to MP4 for free — often losslessly. Runs in your browser, so your videos are never uploaded.',
    keywords: 'mov to mp4, convert mov to mp4, iphone video converter, quicktime to mp4',
  },
  'mkv-to-mp4': {
    title: 'MKV to MP4 Converter — Free & Lossless | Pixavo',
    description: 'Convert MKV videos to MP4 for phones, TVs and editors. Free and private in-browser conversion, lossless whenever the codecs allow.',
    keywords: 'mkv to mp4, convert mkv to mp4, mkv converter, matroska to mp4',
  },
};

export interface PageSeo {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  image: string;
  robots: string;
  jsonLd: object[];
}

const pageUrl = (siteUrl: string, slug: string) => `${siteUrl}${slug ? `${slug}/` : ''}`;

function toolJsonLd(route: ToolRoute, copy: PageCopy, siteUrl: string): object[] {
  const url = pageUrl(siteUrl, route.slug);
  const section = route.kind === 'image' ? 'Image tools' : 'Video tools';
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: route.title,
      url,
      description: copy.description,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any (runs in a modern web browser)',
      browserRequirements: 'Requires JavaScript and a modern browser',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: siteUrl },
        { '@type': 'ListItem', position: 2, name: section, item: `${siteUrl}#select-tools` },
        { '@type': 'ListItem', position: 3, name: route.title, item: url },
      ],
    },
  ];
}

function homeJsonLd(siteUrl: string): object[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: siteUrl,
      description: HOME.description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_NAME,
      url: siteUrl,
      description: HOME.description,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any (runs in a modern web browser)',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ];
}

/** SEO for a route slug ("" = home). `siteUrl` must be absolute and end with "/". */
export function getPageSeo(slug: string, siteUrl: string): PageSeo {
  const image = `${siteUrl}${OG_IMAGE_PATH}`;
  if (!slug) {
    return { ...HOME, canonical: siteUrl, image, robots: 'index, follow, max-image-preview:large', jsonLd: homeJsonLd(siteUrl) };
  }
  const route = routeForSlug(slug);
  if (!route) {
    return { ...NOT_FOUND, canonical: siteUrl, image, robots: 'noindex, follow', jsonLd: [] };
  }
  const copy = TOOL_COPY[route.id] ?? { title: `${route.title} | ${SITE_NAME}`, description: route.description, keywords: '' };
  return {
    ...copy,
    canonical: pageUrl(siteUrl, route.slug),
    image,
    robots: 'index, follow, max-image-preview:large',
    jsonLd: toolJsonLd(route, copy, siteUrl),
  };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The full set of <head> tags for a page, as HTML (used at build time). */
export function renderSeoTags(seo: PageSeo): string {
  const tags = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}" />`,
    seo.keywords && `<meta name="keywords" content="${esc(seo.keywords)}" />`,
    `<meta name="robots" content="${seo.robots}" />`,
    `<link rel="canonical" href="${esc(seo.canonical)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:url" content="${esc(seo.canonical)}" />`,
    `<meta property="og:title" content="${esc(seo.title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    `<meta property="og:image" content="${esc(seo.image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Pixavo — private, in-browser image and video converter" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(seo.title)}" />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
    `<meta name="twitter:image" content="${esc(seo.image)}" />`,
    ...seo.jsonLd.map(
      (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`,
    ),
  ];
  return tags.filter(Boolean).join('\n    ');
}
