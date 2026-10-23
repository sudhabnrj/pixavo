import { useId, useRef, useState } from 'react';
import type { DragEvent, MouseEvent, ReactNode } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Aperture,
  Check,
  Clapperboard,
  Crop,
  CloudOff,
  Cpu,
  Download,
  Files,
  Film,
  Gem,
  Images,
  LockKeyhole,
  Maximize2,
  Mail,
  MonitorCheck,
  MoveHorizontal,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';

import { FAQ } from './FAQ';
import { hrefFor } from '../router';
import { Link } from './Link';
import { conversionTools } from '../utils/conversionTools';
import type { ConversionTool } from '../utils/conversionTools';
import { VIDEO_EXTENSIONS } from '../utils/videoExtensions';

interface LandingPageProps {
  onSelectTool: (toolId: string) => void;
  onFilesAdded: (files: File[]) => void;
  onOpenVideo: (file?: File) => void;
}

const RAW_EXTENSIONS = ['cr2', 'cr3', 'nef', 'arw', 'rw2', 'raf', 'orf', 'pef', 'dng', 'raw'];

// Default tool for a file dropped on the hero, keyed by extension.
const SMART_TOOL_BY_EXT: Record<string, string> = {
  ...Object.fromEntries(RAW_EXTENSIONS.map((ext) => [ext, 'raw-jpg'])),
  heic: 'heic-jpg',
  heif: 'heic-jpg',
  png: 'png-jpg',
  jpg: 'jpg-webp',
  jpeg: 'jpg-webp',
  webp: 'webp-jpg',
};

const ALL_ACCEPTED = [...new Set(conversionTools.flatMap((t) => t.acceptedExtensions)), ...VIDEO_EXTENSIONS].join(',');

const isVideo = (f: File) => VIDEO_EXTENSIONS.includes(`.${f.name.split('.').pop()?.toLowerCase()}`) || f.type.startsWith('video/');

const formats = ['CR2', 'CR3', 'NEF', 'ARW', 'RW2', 'RAF', 'ORF', 'PEF', 'DNG', 'RAW', 'HEIC', 'PNG', 'JPG', 'WebP', 'MP4', 'MOV', 'WEBM', 'MKV'];

const cameraBrands = [
  { brand: 'Canon', exts: 'CR2 · CR3' },
  { brand: 'Nikon', exts: 'NEF' },
  { brand: 'Sony', exts: 'ARW' },
  { brand: 'Panasonic', exts: 'RW2' },
  { brand: 'Fujifilm', exts: 'RAF' },
  { brand: 'Olympus', exts: 'ORF' },
  { brand: 'Pentax', exts: 'PEF' },
  { brand: 'Adobe / Leica', exts: 'DNG' },
  { brand: 'Apple', exts: 'HEIC' },
  { brand: 'Web', exts: 'PNG · JPG · WebP' },
];

const steps = [
  { title: 'Drop your files', description: 'Drag RAW, HEIC, PNG, JPG or WebP files in. Nothing leaves your device.', icon: Upload },
  { title: 'Tune the output', description: 'Pick quality, resize, and choose whether to keep camera metadata.', icon: SlidersHorizontal },
  { title: 'Download instantly', description: 'Grab files one by one, or the whole batch as a single ZIP.', icon: Download },
];

// true = has the advantage
const comparison = [
  { label: 'Photos never leave your device', cloud: false, pixavo: true },
  { label: 'No upload or download wait', cloud: false, pixavo: true },
  { label: 'Works offline once loaded', cloud: false, pixavo: true },
  { label: 'No account or install', cloud: false, pixavo: true },
  { label: 'Batch convert + ZIP download', cloud: true, pixavo: true },
];

const benefits = [
  { title: 'No upload required', description: 'Skip slow transfers and keep every original on your device.', icon: LockKeyhole },
  { title: 'Faster than the cloud', description: 'Processing starts immediately — no upload queue, no download wait.', icon: Zap },
  { title: 'Works offline', description: 'Once loaded, conversion happens locally without a server round trip.', icon: WifiOff },
  { title: 'Secure by design', description: 'Browser-native processing keeps sensitive work under your control.', icon: ShieldCheck },
];

// Static class strings so Tailwind can detect them.
const accentMap: Record<ConversionTool['color'], { dot: string; text: string; soft: string; glow: string }> = {
  violet: { dot: 'bg-violet-500', text: 'text-violet-600', soft: 'bg-violet-50', glow: 'rgba(139,92,246,0.18)' },
  emerald: { dot: 'bg-emerald-500', text: 'text-emerald-600', soft: 'bg-emerald-50', glow: 'rgba(16,185,129,0.18)' },
  rose: { dot: 'bg-rose-500', text: 'text-rose-600', soft: 'bg-rose-50', glow: 'rgba(244,63,94,0.16)' },
  blue: { dot: 'bg-blue-500', text: 'text-blue-600', soft: 'bg-blue-50', glow: 'rgba(59,130,246,0.18)' },
  amber: { dot: 'bg-amber-500', text: 'text-amber-600', soft: 'bg-amber-50', glow: 'rgba(245,158,11,0.18)' },
  indigo: { dot: 'bg-indigo-500', text: 'text-indigo-600', soft: 'bg-indigo-50', glow: 'rgba(99,102,241,0.18)' },
  teal: { dot: 'bg-teal-500', text: 'text-teal-600', soft: 'bg-teal-50', glow: 'rgba(20,184,166,0.18)' },
  orange: { dot: 'bg-orange-500', text: 'text-orange-600', soft: 'bg-orange-50', glow: 'rgba(249,115,22,0.18)' },
  cyan: { dot: 'bg-cyan-500', text: 'text-cyan-600', soft: 'bg-cyan-50', glow: 'rgba(6,182,212,0.18)' },
  purple: { dot: 'bg-purple-500', text: 'text-purple-600', soft: 'bg-purple-50', glow: 'rgba(168,85,247,0.18)' },
};

// Bento layout for the 4-column tools grid: featured 2x2, three wide, the rest single cells.
const FEATURED_TOOL = 'raw-jpg';
const WIDE_TOOLS = ['heic-jpg', 'png-jpg', 'jpg-webp'];
const TOOL_ORDER = ['raw-jpg', 'raw-png', 'jpg-png', 'webp-jpg', 'webp-png', 'heic-jpg', 'png-jpg', 'jpg-webp', 'png-webp', 'png-raw'];

const orderedTools = [
  ...TOOL_ORDER.map((id) => conversionTools.find((t) => t.id === id)).filter((t): t is ConversionTool => Boolean(t)),
  ...conversionTools.filter((t) => !TOOL_ORDER.includes(t.id)),
];

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

function trackSpotlight(e: MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
}

function SectionHeading({ eyebrow, title, description, align = 'center', dark = false }: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: 'center' | 'left';
  dark?: boolean;
}) {
  return (
    <motion.div {...reveal} className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      <span className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] ${dark ? 'text-violet-300' : 'text-brand-violet'}`}>
        <span className={`h-px w-6 ${dark ? 'bg-violet-300/60' : 'bg-brand-violet/50'}`} />
        {eyebrow}
      </span>
      <h2 className={`mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.035em] ${dark ? 'text-white' : 'text-slate-950'}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-5 text-base leading-7 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
      )}
    </motion.div>
  );
}

/** Stylised landscape used for the RAW vs developed comparison. */
function Landscape({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b1b6b" />
          <stop offset="45%" stopColor="#c2417a" />
          <stop offset="75%" stopColor="#f59e5b" />
          <stop offset="100%" stopColor="#fde2a7" />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="60%" stopColor="#ffd27a" />
          <stop offset="100%" stopColor="#ffb35c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-lake`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3a06a" />
          <stop offset="100%" stopColor="#3a1f5c" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill={`url(#${id}-sky)`} />
      <circle cx="520" cy="300" r="150" fill={`url(#${id}-sun)`} />
      <circle cx="520" cy="300" r="56" fill="#fff4cf" />
      <path d="M0 360 L120 250 L210 310 L330 190 L450 300 L560 230 L680 320 L800 260 L800 420 L0 420 Z" fill="#7a2e6e" opacity="0.75" />
      <path d="M0 400 L90 330 L200 380 L300 300 L420 390 L530 330 L650 395 L760 340 L800 360 L800 440 L0 440 Z" fill="#4a1d5e" />
      <path d="M0 430 L800 430 L800 600 L0 600 Z" fill={`url(#${id}-lake)`} />
      <ellipse cx="520" cy="470" rx="70" ry="10" fill="#fff1c2" opacity="0.7" />
      <ellipse cx="520" cy="500" rx="44" ry="6" fill="#fff1c2" opacity="0.45" />
      <ellipse cx="520" cy="525" rx="24" ry="4" fill="#fff1c2" opacity="0.3" />
      <path d="M0 520 C120 500 220 560 360 540 C500 520 620 580 800 550 L800 600 L0 600 Z" fill="#1e1035" opacity="0.85" />
    </svg>
  );
}

function CompareSlider() {
  const [pos, setPos] = useState(52);
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] select-none">
      {/* Unprocessed "RAW" look */}
      <Landscape className="absolute inset-0 h-full w-full [filter:grayscale(0.7)_contrast(0.72)_brightness(1.12)]" />
      {/* Developed JPG look */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <Landscape className="absolute inset-0 h-full w-full [filter:saturate(1.2)_contrast(1.06)]" />
      </div>

      <span className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 font-mono text-[11px] font-bold tracking-wider text-white backdrop-blur-md">
        RAW · CR3
      </span>
      <span className="absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1 font-mono text-[11px] font-bold tracking-wider text-slate-900 backdrop-blur-md">
        JPG · q90
      </span>

      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -translate-x-1/2 w-0.5 bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.6)]" />
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl ring-4 ring-white/30">
          <MoveHorizontal className="h-5 w-5" />
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare RAW and converted JPG"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-violet-500/25 via-fuchsia-400/15 to-amber-300/25 blur-3xl" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="relative rounded-[2.25rem] border border-white/70 bg-white/60 p-2.5 shadow-[0_40px_120px_-30px_rgba(76,29,149,0.45)] backdrop-blur-xl"
      >
        <CompareSlider />
        <div className="flex items-center justify-between gap-3 px-3 pb-1.5 pt-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <Aperture className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">DSC_0428.CR3</p>
              <p className="font-mono text-[11px] text-slate-500">f/2.8 · 1/250s · ISO 100</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Converted locally
          </span>
        </div>
      </motion.div>

      {/* Floating chips */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        className="absolute -left-4 bottom-24 hidden sm:block lg:-left-10"
      >
        <div className="animate-float rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">File size</p>
          <p className="mt-1 font-mono text-sm font-bold text-slate-900">
            48.2 MB <span className="text-slate-300">→</span> <span className="text-brand-violet">6.1 MB</span>
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.7 }}
        className="absolute -right-3 top-16 hidden sm:block lg:-right-8"
      >
        <div className="animate-float-delayed flex items-center gap-2.5 rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-2xl shadow-slate-950/30">
          <CloudOff className="h-4 w-4 text-violet-300" />
          <div>
            <p className="font-mono text-sm font-bold">0 bytes</p>
            <p className="text-[10px] font-semibold text-slate-400">uploaded to any server</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function LandingPage({ onSelectTool, onFilesAdded, onOpenVideo }: LandingPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  // Route dropped files to the best-matching tool and queue them.
  const handleSmartFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (picked.length === 0) return;

    const video = picked.find(isVideo);
    if (video) {
      setDropError(null);
      onOpenVideo(video);
      return;
    }

    const firstSupported = picked.find((f) => SMART_TOOL_BY_EXT[f.name.split('.').pop()?.toLowerCase() ?? '']);
    if (!firstSupported) {
      setDropError('That file type isn’t supported yet. Try RAW, HEIC, PNG, JPG, WebP or a video.');
      return;
    }

    const toolId = SMART_TOOL_BY_EXT[firstSupported.name.split('.').pop()!.toLowerCase()];
    const tool = conversionTools.find((t) => t.id === toolId)!;
    const matching = picked.filter((f) => tool.acceptedExtensions.includes(`.${f.name.split('.').pop()?.toLowerCase()}`));

    setDropError(null);
    onSelectTool(toolId);
    onFilesAdded(matching);
  };

  const dragProps = {
    onDragOver: (e: DragEvent) => { e.preventDefault(); setIsDragging(true); },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
    },
    onDrop: (e: DragEvent) => { e.preventDefault(); setIsDragging(false); handleSmartFiles(e.dataTransfer.files); },
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* ───────────── HERO ───────────── */}
      <section id="home" className="relative overflow-hidden pt-28 pb-20 sm:pt-36 lg:pb-28" {...dragProps}>
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-300/30 via-fuchsia-200/30 to-amber-200/30 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-8">
          <div>
            <motion.a
              href={hrefFor('video-studio')}
              onClick={(e) => { e.preventDefault(); onOpenVideo(); }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 py-1 pl-1 pr-3 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-md hover:border-slate-300"
            >
              <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">New</span>
              Video Studio — crop, resize & convert video
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </motion.a>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 text-[clamp(2.75rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.045em] text-slate-950"
            >
              Convert every
              <br />
              pixel.{' '}
              <span className="font-display font-normal italic tracking-[-0.02em] text-gradient">Upload</span>
              <br />
              <span className="font-display font-normal italic tracking-[-0.02em] text-gradient">none.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="mt-7 max-w-lg text-lg leading-8 text-slate-500"
            >
              Pixavo turns RAW, HEIC, PNG and WebP files into beautiful, optimised images — and now crops,
              resizes and converts video too. All inside your browser, so your files never leave your device.
            </motion.p>

            {/* Smart dropzone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="mt-9 max-w-lg"
            >
              <div
                className={`relative flex flex-col gap-3 rounded-[1.5rem] border-2 border-dashed p-2.5 transition-all duration-300 sm:flex-row sm:items-center ${
                  isDragging
                    ? 'scale-[1.02] border-brand-violet bg-violet-50/80 shadow-xl shadow-violet-500/20'
                    : 'border-slate-200 bg-white/70 backdrop-blur-md hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Choose images
                </button>
                <p className="px-2 text-sm text-slate-500 sm:px-1">
                  {isDragging ? (
                    <span className="font-bold text-brand-violet">Release to convert →</span>
                  ) : (
                    <>or drop photos or videos — we’ll pick the right tool.</>
                  )}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ALL_ACCEPTED}
                  className="hidden"
                  onChange={(e) => { handleSmartFiles(e.target.files); e.target.value = ''; }}
                />
              </div>
              {dropError && <p className="mt-3 text-sm font-semibold text-rose-600" role="alert">{dropError}</p>}

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-500">
                {['No sign-up', 'No watermark', 'Batch + ZIP'].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-brand-emerald" /> {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* ───────────── FORMAT MARQUEE ───────────── */}
      <div className="relative border-y border-slate-200/70 bg-white/60 py-5 backdrop-blur-sm" aria-hidden="true">
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
            {[...formats, ...formats].map((f, i) => (
              <span key={i} className="flex items-center gap-10 font-mono text-sm font-bold tracking-[0.2em] text-slate-400">
                .{f}
                <Sparkles className="h-3.5 w-3.5 text-slate-300" />
              </span>
            ))}
          </div>
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
            {[...formats, ...formats].map((f, i) => (
              <span key={i} className="flex items-center gap-10 font-mono text-sm font-bold tracking-[0.2em] text-slate-400">
                .{f}
                <Sparkles className="h-3.5 w-3.5 text-slate-300" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ───────────── TOOLS BENTO ───────────── */}
      <section id="select-tools" className="scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              align="left"
              eyebrow="Conversion studio"
              title={<>Ten tools. <span className="font-display font-normal italic text-gradient">One</span> private workspace.</>}
            />
            <motion.p {...reveal} className="max-w-sm text-base leading-7 text-slate-500">
              Pick a conversion to open its dedicated workspace — with quality controls, resizing and metadata options.
            </motion.p>
          </div>

          <div className="mt-14 grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[minmax(200px,auto)]">
            {orderedTools.map((tool, i) => {
              const Icon = tool.icon;
              const accent = accentMap[tool.color];

              if (tool.id === FEATURED_TOOL) {
                return (
                  <motion.button
                    key={tool.id}
                    {...reveal}
                    type="button"
                    onClick={() => onSelectTool(tool.id)}
                    onMouseMove={trackSpotlight}
                    className="spotlight-dark group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-left text-white sm:col-span-2 lg:row-span-2 lg:p-10 cursor-pointer"
                  >
                    <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-600/40 blur-3xl transition-transform duration-700 group-hover:scale-125" />
                    <div className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />

                    <div className="relative flex items-start justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-200 ring-1 ring-white/15">
                        <Sparkles className="h-3.5 w-3.5" /> Most popular
                      </span>
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 transition-transform duration-500 group-hover:rotate-12">
                        <Icon className="h-6 w-6" />
                      </span>
                    </div>

                    <div className="relative mt-16">
                      <p className="font-mono text-sm font-bold tracking-[0.2em] text-violet-300">{tool.from} → {tool.to}</p>
                      <h3 className="mt-3 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">{tool.title}</h3>
                      <p className="mt-4 max-w-md text-base leading-7 text-slate-400">{tool.desc}</p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {RAW_EXTENSIONS.map((ext) => (
                          <span key={ext} className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold uppercase text-slate-300 ring-1 ring-white/10">
                            .{ext}
                          </span>
                        ))}
                      </div>
                      <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-all group-hover:gap-3">
                        Open workspace <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </motion.button>
                );
              }

              const isWide = WIDE_TOOLS.includes(tool.id);
              return (
                <motion.button
                  key={tool.id}
                  {...reveal}
                  transition={{ ...reveal.transition, delay: (i % 4) * 0.06 }}
                  type="button"
                  onClick={() => onSelectTool(tool.id)}
                  onMouseMove={trackSpotlight}
                  style={{ ['--glow' as string]: accent.glow }}
                  className={`spotlight group relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_60px_-24px_rgba(15,23,42,0.25)] cursor-pointer ${isWide ? 'sm:col-span-2' : ''}`}
                >
                  <div className="relative flex items-start justify-between">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent.soft} ${accent.text} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-900" />
                  </div>
                  <div className={`relative mt-8 ${isWide ? 'sm:flex sm:items-end sm:justify-between sm:gap-6' : ''}`}>
                    <div>
                      <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                        {tool.from} → {tool.to}
                      </p>
                      <h3 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-slate-950">{tool.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{tool.desc}</p>
                    </div>
                    {isWide && (
                      <span className={`mt-4 hidden shrink-0 font-display text-5xl italic sm:block ${accent.text} opacity-80`}>.{tool.to.toLowerCase()}</span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── VIDEO STUDIO ───────────── */}
      <section id="video-studio" className="scroll-mt-20 px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/40 p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:p-14">
          <div>
            <SectionHeading
              align="left"
              eyebrow="New · Video Studio"
              title={<>Now your <span className="font-display font-normal italic text-gradient">videos</span> too.</>}
              description="Crop, resize and convert videos right in your browser. When the picture doesn’t change, Pixavo copies the original streams — a truly lossless result in seconds."
            />
            <div className="mt-10 space-y-5">
              {[
                { icon: Crop, to: 'crop-video', title: 'Crop', text: 'Free-form or 16:9, 9:16, 1:1, 4:5 — drag the frame right on the preview.' },
                { icon: Maximize2, to: 'resize-video', title: 'Resize', text: '4K, 1440p, 1080p, 720p or a custom width, always keeping the aspect ratio.' },
                { icon: Film, to: 'video-converter', title: 'Convert', text: 'MP4, MOV, WebM and MKV with H.264, HEVC, VP9 or AV1 at maximum quality.' },
              ].map(({ icon: Icon, to, title, text }, i) => (
                <motion.div key={title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}>
                  <Link to={to} className="group -m-3 flex gap-4 rounded-2xl p-3 transition-colors hover:bg-white/80">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white transition-transform group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="flex items-center gap-1.5 font-extrabold text-slate-950">
                        {title} <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-900" />
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <motion.button
              {...reveal}
              type="button"
              onClick={() => onOpenVideo()}
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Clapperboard className="h-4 w-4" /> Open Video Studio
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </motion.button>
          </div>

          {/* Editor mock */}
          <motion.div {...reveal} className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-violet-500/20 to-amber-300/20 blur-3xl" aria-hidden="true" />
            <div className="relative rounded-[2rem] bg-slate-950 p-4 shadow-[0_40px_100px_-30px_rgba(76,29,149,0.55)]" aria-hidden="true">
              <div className="relative aspect-video overflow-hidden rounded-xl">
                <Landscape className="absolute inset-0 h-full w-full" />
                <div className="absolute left-[30%] top-[6%] h-[88%] w-[28%] ring-2 ring-white shadow-[0_0_0_9999px_rgba(2,6,23,0.6)]">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white/20" />)}
                  </div>
                  {['left-0 top-0 border-l-4 border-t-4 rounded-tl-md', 'right-0 top-0 border-r-4 border-t-4 rounded-tr-md', 'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-md', 'right-0 bottom-0 border-r-4 border-b-4 rounded-br-md'].map((c) => (
                    <span key={c} className={`absolute h-5 w-5 border-white ${c}`} />
                  ))}
                </div>
                <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 font-mono text-[10px] font-bold text-white backdrop-blur">9:16 · 1080×1920</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-950">
                  <Clapperboard className="h-3.5 w-3.5" />
                </span>
                <div className="relative h-8 flex-1 overflow-hidden rounded-lg">
                  <div className="flex h-full gap-0.5">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-b from-fuchsia-500/60 to-violet-800/70" style={{ opacity: 0.55 + (i % 4) * 0.12 }} />
                    ))}
                  </div>
                  <div className="absolute inset-y-0 left-[38%] w-0.5 bg-white" />
                </div>
                <span className="font-mono text-[11px] text-slate-400">0:12</span>
              </div>
            </div>
            <div className="absolute -bottom-5 right-6 hidden items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-slate-900/10 sm:flex">
              <ShieldCheck className="h-4 w-4 text-brand-emerald" />
              <span className="text-xs font-bold text-slate-800">Lossless stream copy when possible</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="How it works" title={<>From shutter to share in <span className="font-display font-normal italic text-gradient">seconds.</span></>} />
          <div className="relative mt-16 grid gap-6 md:grid-cols-3">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent md:block" aria-hidden="true" />
            {steps.map(({ title, description, icon: Icon }, i) => (
              <motion.div key={title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.12 }} className="relative text-center">
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_20px_50px_-20px_rgba(76,29,149,0.35)]">
                  <Icon className="h-7 w-7 text-slate-900" />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-violet font-mono text-xs font-bold text-white ring-4 ring-[#fafbfc]">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-extrabold text-slate-950">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FEATURES (dark bento) ───────────── */}
      <section id="features" className="scroll-mt-20 px-3 sm:px-4">
        <div className="relative mx-auto max-w-[88rem] overflow-hidden rounded-[2.5rem] bg-slate-950 px-5 py-24 sm:px-10 lg:px-16 lg:py-32">
          <div className="pointer-events-none absolute inset-0 bg-grid-dark [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" aria-hidden="true" />
          <div className="pointer-events-none absolute -top-40 right-0 h-[30rem] w-[30rem] rounded-full bg-violet-600/30 blur-[120px]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-0 h-[30rem] w-[30rem] rounded-full bg-emerald-500/15 blur-[120px]" aria-hidden="true" />

          <div className="relative mx-auto max-w-6xl">
            <SectionHeading
              dark
              eyebrow="Built for a better workflow"
              title={<>Everything you need. <span className="font-display font-normal italic text-violet-300">Nothing</span> you don’t.</>}
              description="Powerful image conversion without uploads, accounts, or software installs."
            />

            <div className="mt-16 grid gap-4 md:grid-cols-6">
              <motion.article {...reveal} className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-violet-600 to-fuchsia-600 p-8 md:col-span-4">
                <MonitorCheck className="h-6 w-6 text-white/80" />
                <p className="mt-10 font-display text-6xl italic leading-none text-white sm:text-7xl">100%</p>
                <h3 className="mt-3 text-xl font-extrabold text-white">Browser based</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-violet-100">
                  Everything runs directly in your browser using WebAssembly — no remote processing, ever.
                </p>
                <Cpu className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 text-white/10" />
              </motion.article>

              <motion.article {...reveal} transition={{ ...reveal.transition, delay: 0.08 }} className="rounded-[1.75rem] bg-white/[0.04] p-8 ring-1 ring-white/10 md:col-span-2">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                <h3 className="mt-10 text-xl font-extrabold text-white">Privacy first</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">Your private photos stay on your device from start to finish.</p>
              </motion.article>

              {[
                { title: 'Batch conversion', description: 'Queue dozens of images and convert them in one go.', icon: Images },
                { title: 'High quality output', description: 'Fine-tune quality, dimensions, and metadata.', icon: Gem },
                { title: 'RAW, HEIC & web', description: 'Popular camera RAWs, Apple HEIC, PNG, JPG and WebP.', icon: Files },
              ].map(({ title, description, icon: Icon }, i) => (
                <motion.article
                  key={title}
                  {...reveal}
                  transition={{ ...reveal.transition, delay: 0.1 + i * 0.08 }}
                  className="rounded-[1.75rem] bg-white/[0.04] p-8 ring-1 ring-white/10 transition-colors hover:bg-white/[0.07] md:col-span-2"
                >
                  <Icon className="h-6 w-6 text-violet-300" />
                  <h3 className="mt-10 text-xl font-extrabold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── WHY PIXAVO / COMPARISON ───────────── */}
      <section id="why-pixavo" className="scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Local by design"
              title={<>Why photographers <span className="font-display font-normal italic text-gradient">choose</span> Pixavo.</>}
              description="Your browser is the processing engine — giving you a faster and far more private image converter."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {benefits.map(({ title, description, icon: Icon }, i) => (
                <motion.div key={title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-brand-emerald">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-extrabold text-slate-950">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div {...reveal} className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_40px_100px_-40px_rgba(15,23,42,0.3)]">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-slate-100 px-6 py-5 sm:gap-x-8 sm:px-8">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Compare</span>
              <span className="w-16 text-center text-xs font-bold text-slate-400 sm:w-20">Cloud tools</span>
              <span className="w-16 rounded-full bg-slate-950 py-1.5 text-center text-xs font-bold text-white sm:w-20">Pixavo</span>
            </div>
            {comparison.map((row) => {
              const cell = (has: boolean) =>
                has ? (
                  <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-4 w-4" /></span>
                ) : (
                  <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-500"><X className="h-4 w-4" /></span>
                );
              return (
                <div key={row.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-slate-100 px-6 py-4 last:border-0 sm:gap-x-8 sm:px-8">
                  <span className="text-sm font-semibold text-slate-700">{row.label}</span>
                  <span className="w-16 sm:w-20">{cell(row.cloud)}</span>
                  <span className="w-16 sm:w-20">{cell(row.pixavo)}</span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ───────────── SUPPORTED FORMATS ───────────── */}
      <section id="supported-formats" className="scroll-mt-20 px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Broad camera compatibility"
            title={<>Speaks your camera’s <span className="font-display font-normal italic text-gradient">language.</span></>}
            description="Convert files from Canon, Nikon, Sony, Panasonic, Fujifilm, Apple, and every major web format."
          />
          <ul className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-200/80 sm:grid-cols-3 lg:grid-cols-5" aria-label="Supported image formats">
            {cameraBrands.map(({ brand, exts }, i) => (
              <motion.li key={brand} {...reveal} transition={{ ...reveal.transition, delay: (i % 5) * 0.05 }} className="bg-white">
                <button
                  type="button"
                  onClick={() => onSelectTool(brand === 'Apple' ? 'heic-jpg' : brand === 'Web' ? 'png-jpg' : 'raw-jpg')}
                  className="group flex h-full w-full flex-col items-start gap-6 p-6 text-left transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900">{brand}</span>
                  <span className="font-mono text-lg font-bold tracking-wider text-slate-950 transition-colors group-hover:text-brand-violet">{exts}</span>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section id="faq" className="scroll-mt-20 border-t border-slate-200/70 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading
              align="left"
              eyebrow="Questions, answered"
              title={<>Good <span className="font-display font-normal italic text-gradient">questions.</span></>}
              description="The essentials about local processing, supported files, quality, and privacy."
            />
            <motion.a {...reveal} href="#contact" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-brand-violet">
              Still curious? Talk to us <ArrowRight className="h-4 w-4" />
            </motion.a>
          </div>
          <motion.div {...reveal}>
            <FAQ />
          </motion.div>
        </div>
      </section>

      {/* ───────────── BLOG ───────────── */}
      <section id="blog" className="scroll-mt-20 px-4 pb-6 sm:px-6 lg:px-8">
        <motion.a
          {...reveal}
          href="#features"
          className="group mx-auto flex max-w-7xl flex-col gap-6 rounded-[2rem] border border-slate-200/80 bg-white p-8 transition-all hover:shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] sm:p-10 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-violet">From the Pixavo blog</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-slate-950 sm:text-3xl">Better files, smarter workflows.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Practical guides to RAW formats, JPEG quality, image metadata, and privacy-first creative tools.</p>
          </div>
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition-transform duration-300 group-hover:rotate-45">
            <ArrowUpRight className="h-6 w-6" />
          </span>
        </motion.a>
      </section>

      {/* ───────────── CONTACT / FINAL CTA ───────────── */}
      <section id="contact" className="scroll-mt-20 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <motion.div
          {...reveal}
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-20 text-center sm:px-12 lg:py-28"
        >
          <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
            <div className="absolute left-1/2 top-0 h-[28rem] w-[56rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400 blur-[110px]" />
          </div>
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-[clamp(2.25rem,5.5vw,4.5rem)] font-extrabold leading-[1] tracking-[-0.04em] text-white">
              Your photos. Your device. <span className="font-display font-normal italic text-violet-200">Your rules.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-400">
              Start converting in seconds — or reach out with a format question or feedback about your workflow.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onSelectTool('raw-jpg')}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-slate-950 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-white/20 cursor-pointer"
              >
                Start converting free <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="mailto:hello@pixavo.app"
                className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-bold text-white ring-1 ring-white/20 transition-all hover:bg-white/10"
              >
                <Mail className="h-4 w-4" /> Contact Pixavo
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </MotionConfig>
  );
}
