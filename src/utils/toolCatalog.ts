// Plain tool data (no React) so it can be shared by the app and the build-time page generator.

export type ToolColor = 'violet' | 'emerald' | 'rose' | 'blue' | 'amber' | 'indigo' | 'teal' | 'orange' | 'cyan' | 'purple';

export interface ImageToolData {
  id: string;
  title: string;
  desc: string;
  from: string;
  to: string;
  targetMime: string;
  targetExt: string;
  acceptedExtensions: string[];
  color: ToolColor;
  isFunctional: boolean;
  guideInfo: {
    about: string;
    useCases: string[];
  };
}

export const IMAGE_TOOLS: ImageToolData[] = [
  {
    id: 'raw-jpg',
    title: 'RAW to JPG',
    desc: 'Develop camera RAW files (DNG, CR2, NEF, ARW) into optimized JPEG format.',
    from: 'RAW',
    to: 'JPG',
    targetMime: 'image/jpeg',
    targetExt: 'jpg',
    acceptedExtensions: ['.cr2', '.cr3', '.nef', '.arw', '.rw2', '.raf', '.orf', '.pef', '.dng', '.raw'],
    color: 'violet',
    isFunctional: true,
    guideInfo: {
      about: 'Convert uncompressed DSLR & mirrorless camera RAW formats into standard JPEG images while maintaining rich color accurate tones.',
      useCases: ['Sharing photos on social media & messaging', 'Reducing massive RAW photo sizes for storage', 'Web publishing & quick email attachments']
    }
  },
  {
    id: 'heic-jpg',
    title: 'HEIC to JPG',
    desc: 'Convert Apple HEIC photos to standard JPEG formats locally.',
    from: 'HEIC',
    to: 'JPG',
    targetMime: 'image/jpeg',
    targetExt: 'jpg',
    acceptedExtensions: ['.heic', '.heif'],
    color: 'emerald',
    isFunctional: true,
    guideInfo: {
      about: 'Transform iPhone HEIC and HEIF photos into universally compatible JPEG files readable by any device or operating system.',
      useCases: ['Opening iPhone photos on Windows PCs', 'Uploading photos to platforms that do not accept HEIC', 'Printing and editing in legacy photo software']
    }
  },
  {
    id: 'png-jpg',
    title: 'PNG to JPG',
    desc: 'Convert transparent or standard PNG images to compressed JPEG files.',
    from: 'PNG',
    to: 'JPG',
    targetMime: 'image/jpeg',
    targetExt: 'jpg',
    acceptedExtensions: ['.png'],
    color: 'rose',
    isFunctional: true,
    guideInfo: {
      about: 'Compress heavy PNG images into lightweight JPEG files with custom quality controls and solid white background handling.',
      useCases: ['Shrinking website asset sizes', 'Converting screenshot graphics for email', 'Reducing storage footprint']
    }
  },
  {
    id: 'jpg-png',
    title: 'JPG to PNG',
    desc: 'Convert JPG images to PNG format with alpha channel support.',
    from: 'JPG',
    to: 'PNG',
    targetMime: 'image/png',
    targetExt: 'png',
    acceptedExtensions: ['.jpg', '.jpeg'],
    color: 'blue',
    isFunctional: true,
    guideInfo: {
      about: 'Export JPEG photos to lossless PNG format, perfect for adding transparency or preparing graphics for graphic design.',
      useCases: ['Lossless image editing & layer work', 'Digital art asset preparation', 'Preventing generational compression degradation']
    }
  },
  {
    id: 'raw-png',
    title: 'RAW to PNG',
    desc: 'Convert camera RAW files directly to high quality PNG format.',
    from: 'RAW',
    to: 'PNG',
    targetMime: 'image/png',
    targetExt: 'png',
    acceptedExtensions: ['.cr2', '.cr3', '.nef', '.arw', '.rw2', '.raf', '.orf', '.pef', '.dng', '.raw'],
    color: 'amber',
    isFunctional: true,
    guideInfo: {
      about: 'Extract high-detail sensor data directly into lossless PNG images without JPEG compression artifacts.',
      useCases: ['High-precision editing pipelines', 'Publishing uncompressed camera samples', 'Graphic design & composite work']
    }
  },
  {
    id: 'png-raw',
    title: 'PNG to RAW',
    desc: 'Pack PNG graphics back into uncompressed DNG camera RAW stubs.',
    from: 'PNG',
    to: 'RAW',
    targetMime: 'image/x-adobe-dng',
    targetExt: 'dng',
    acceptedExtensions: ['.png'],
    color: 'indigo',
    isFunctional: true,
    guideInfo: {
      about: 'Encapsulate pixel graphics into raw Adobe DNG format container stubs for photography software integration.',
      useCases: ['Importing raster graphics into RAW photo tools', 'RAW workflow simulation', 'Archival sensor container encapsulation']
    }
  },
  {
    id: 'webp-jpg',
    title: 'WebP to JPG',
    desc: 'Decompress modern WebP image formats into standard JPEGs.',
    from: 'WebP',
    to: 'JPG',
    targetMime: 'image/jpeg',
    targetExt: 'jpg',
    acceptedExtensions: ['.webp'],
    color: 'teal',
    isFunctional: true,
    guideInfo: {
      about: 'Convert downloaded WebP graphics back to classic JPG images compatible with legacy tools and documents.',
      useCases: ['Using web photos in Word or PowerPoint', 'Editing in older image viewers', 'Printing downloaded web images']
    }
  },
  {
    id: 'jpg-webp',
    title: 'JPG to WebP',
    desc: 'Encode regular JPEGs into modern, highly compressed WebP files.',
    from: 'JPG',
    to: 'WebP',
    targetMime: 'image/webp',
    targetExt: 'webp',
    acceptedExtensions: ['.jpg', '.jpeg'],
    color: 'orange',
    isFunctional: true,
    guideInfo: {
      about: 'Supercharge site performance by converting bulky JPEGs into next-gen WebP format with up to 30-50% file size reduction.',
      useCases: ['Optimizing website loading speed & SEO', 'Saving mobile data and server storage', 'Modern web app asset optimization']
    }
  },
  {
    id: 'webp-png',
    title: 'WebP to PNG',
    desc: 'Convert WebP images to lossless PNG format with transparent alpha.',
    from: 'WebP',
    to: 'PNG',
    targetMime: 'image/png',
    targetExt: 'png',
    acceptedExtensions: ['.webp'],
    color: 'cyan',
    isFunctional: true,
    guideInfo: {
      about: 'Convert WebP graphics and transparent icons into lossless PNG format without losing fine details or transparency.',
      useCases: ['Extracting transparent web stickers & logos', 'Editing web assets in Photoshop', 'Design system icon conversions']
    }
  },
  {
    id: 'png-webp',
    title: 'PNG to WebP',
    desc: 'Compress PNG files into modern WebP with full transparency support.',
    from: 'PNG',
    to: 'WebP',
    targetMime: 'image/webp',
    targetExt: 'webp',
    acceptedExtensions: ['.png'],
    color: 'purple',
    isFunctional: true,
    guideInfo: {
      about: 'Dramatically reduce PNG file sizes while keeping 100% transparent backgrounds intact using modern WebP compression.',
      useCases: ['Web transparent hero graphics', 'UI icon & illustration web optimization', 'Faster page speed scores']
    }
  }
];

export type VideoToolMode = 'studio' | 'crop' | 'resize' | 'convert';
export type VideoFormatTarget = 'mp4' | 'webm' | 'mov' | 'mkv';

export interface VideoToolData {
  id: string;
  title: string;
  desc: string;
  mode: VideoToolMode;
  color: ToolColor;
  /** Preselected output container for converter pages. */
  targetFormat?: VideoFormatTarget;
  /** Extensions suggested in the file picker; any video is still accepted. */
  accept?: string[];
}

export const VIDEO_TOOLS: VideoToolData[] = [
  { id: 'video-studio', title: 'Video Studio', desc: 'Crop, resize and convert a video in one go — all inside your browser.', mode: 'studio', color: 'violet' },
  { id: 'crop-video', title: 'Crop Video', desc: 'Crop videos to 16:9, 9:16, 1:1, 4:5 or any custom frame without uploading them.', mode: 'crop', color: 'rose' },
  { id: 'resize-video', title: 'Resize Video', desc: 'Resize videos to 4K, 1080p, 720p or a custom width while keeping the aspect ratio.', mode: 'resize', color: 'amber' },
  { id: 'video-converter', title: 'Video Converter', desc: 'Convert between MP4, WebM, MOV and MKV — lossless whenever the codec allows.', mode: 'convert', color: 'blue' },
  { id: 'mp4-to-webm', title: 'MP4 to WebM', desc: 'Convert MP4 videos to WebM for the open web, right in your browser.', mode: 'convert', color: 'teal', targetFormat: 'webm', accept: ['.mp4', '.m4v'] },
  { id: 'webm-to-mp4', title: 'WebM to MP4', desc: 'Convert WebM videos to MP4 so they play on every device.', mode: 'convert', color: 'emerald', targetFormat: 'mp4', accept: ['.webm'] },
  { id: 'mov-to-mp4', title: 'MOV to MP4', desc: 'Convert iPhone and camera MOV files to MP4 — often losslessly.', mode: 'convert', color: 'indigo', targetFormat: 'mp4', accept: ['.mov'] },
  { id: 'mkv-to-mp4', title: 'MKV to MP4', desc: 'Convert MKV videos to MP4 for phones, TVs and editors.', mode: 'convert', color: 'orange', targetFormat: 'mp4', accept: ['.mkv'] },
];

/** URL segment for a tool, e.g. "raw-to-jpg" or "crop-video". */
export const imageToolSlug = (t: Pick<ImageToolData, 'from' | 'to'>) => `${t.from}-to-${t.to}`.toLowerCase();

export interface ToolRoute {
  slug: string;
  kind: 'image' | 'video';
  id: string;
  title: string;
  description: string;
}

export const TOOL_ROUTES: ToolRoute[] = [
  ...IMAGE_TOOLS.map((t) => ({ slug: imageToolSlug(t), kind: 'image' as const, id: t.id, title: `${t.title} Converter`, description: t.desc })),
  ...VIDEO_TOOLS.map((t) => ({ slug: t.id, kind: 'video' as const, id: t.id, title: t.title, description: t.desc })),
];

export const routeForTool = (id: string) => TOOL_ROUTES.find((r) => r.id === id);
export const routeForSlug = (slug: string) => TOOL_ROUTES.find((r) => r.slug === slug);

export interface MenuSection {
  title: string;
  tools: string[];
}

export interface MegaMenu {
  id: 'image' | 'video';
  label: string;
  isNew?: boolean;
  /** Each column holds one or more stacked sections. */
  columns: MenuSection[][];
  /** Featured tool shown as a card on the right of the panel. */
  featured: { tool: string; eyebrow: string; text: string };
}

export const MEGA_MENUS: MegaMenu[] = [
  {
    id: 'image',
    label: 'Image',
    columns: [
      [{ title: 'Camera & RAW', tools: ['raw-jpg', 'raw-png', 'png-raw', 'heic-jpg'] }],
      [{ title: 'Convert to JPG', tools: ['png-jpg', 'webp-jpg'] }],
      [{ title: 'Convert to PNG', tools: ['jpg-png', 'webp-png'] }],
      [{ title: 'Convert to WebP', tools: ['jpg-webp', 'png-webp'] }],
    ],
    featured: { tool: 'raw-jpg', eyebrow: 'Most popular', text: 'Develop CR2, NEF, ARW and DNG files into sharp JPEGs — right in your browser.' },
  },
  {
    id: 'video',
    label: 'Video',
    isNew: true,
    columns: [
      [{ title: 'Edit Video', tools: ['video-studio', 'crop-video', 'resize-video'] }],
      [{ title: 'Convert Video', tools: ['video-converter', 'mp4-to-webm', 'webm-to-mp4'] }],
      [{ title: 'Convert to MP4', tools: ['mov-to-mp4', 'mkv-to-mp4'] }],
    ],
    featured: { tool: 'video-studio', eyebrow: 'New', text: 'Crop, resize and convert in one go — lossless whenever the picture doesn’t change.' },
  },
];
