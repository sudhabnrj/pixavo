import { useEffect, useRef, useState } from 'react';
import type { DragEvent, KeyboardEvent, PointerEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clapperboard,
  Crop,
  Download,
  Film,
  Loader2,
  Maximize2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type { VideoCodec } from 'mediabunny';

import {
  VIDEO_CODEC_LABELS,
  VIDEO_EXTENSIONS,
  VIDEO_FORMATS,
  canCopyAudio,
  canCopyVideo,
  getEncodableCodecs,
  isVideoFile,
  probeVideo,
  runVideoJob,
  supportsVideoEngine,
} from '../utils/videoEngine';
import type { CropRect, RunningVideoJob, VideoFormatId, VideoJob, VideoProbe, VideoQuality } from '../utils/videoEngine';

interface VideoStudioProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onNavigateHome: () => void;
}

/* ───────────── helpers ───────────── */

type Rect = { x: number; y: number; w: number; h: number }; // normalised 0..1
const FULL: Rect = { x: 0, y: 0, w: 1, h: 1 };
const MIN_SIZE = 0.06;

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
const evenFloor = (n: number) => Math.max(0, Math.floor(n / 2) * 2);
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

const formatTime = (s: number) => {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
};

const ASPECTS = [
  { id: 'free', label: 'Free', ratio: null },
  { id: 'original', label: 'Original', ratio: 0 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
] as const;
type AspectId = (typeof ASPECTS)[number]['id'];

const RESIZES = [
  { id: 'original', label: 'Original', short: 0 },
  { id: '2160', label: '4K', short: 2160 },
  { id: '1440', label: '1440p', short: 1440 },
  { id: '1080', label: '1080p', short: 1080 },
  { id: '720', label: '720p', short: 720 },
  { id: '480', label: '480p', short: 480 },
  { id: 'custom', label: 'Custom', short: 0 },
] as const;
type ResizeId = (typeof RESIZES)[number]['id'];

const QUALITIES: { id: VideoQuality; label: string; hint: string }[] = [
  { id: 'very-high', label: 'Maximum', hint: 'Visually lossless' },
  { id: 'high', label: 'High', hint: 'Smaller file' },
  { id: 'medium', label: 'Balanced', hint: 'Smallest file' },
];

/** Pixel aspect ratio → normalised rect ratio, largest centred box. */
function rectForRatio(ratio: number, W: number, H: number): Rect {
  const sourceRatio = W / H;
  if (ratio >= sourceRatio) {
    const h = sourceRatio / ratio;
    return { x: 0, y: (1 - h) / 2, w: 1, h };
  }
  const w = ratio / sourceRatio;
  return { x: (1 - w) / 2, y: 0, w, h: 1 };
}

function rectToPixels(r: Rect, W: number, H: number): CropRect | undefined {
  const left = evenFloor(r.x * W);
  const top = evenFloor(r.y * H);
  const width = Math.min(even(r.w * W), evenFloor(W - left));
  const height = Math.min(even(r.h * H), evenFloor(H - top));
  const isFull = left === 0 && top === 0 && width >= W - 1 && height >= H - 1;
  return isFull ? undefined : { left, top, width, height };
}

function computeSize(resize: ResizeId, customWidth: number, bw: number, bh: number) {
  if (resize === 'original') return undefined;
  if (resize === 'custom') {
    if (!customWidth || customWidth >= bw) return undefined;
    const width = even(customWidth);
    return { width, height: even((width * bh) / bw) };
  }
  const target = RESIZES.find((r) => r.id === resize)!.short;
  const short = Math.min(bw, bh);
  if (target >= short) return undefined;
  const scale = target / short;
  return { width: even(bw * scale), height: even(bh * scale) };
}

function useObjectUrl(blob: Blob | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const next = URL.createObjectURL(blob);
    // Syncing with an external resource that needs cleanup; creating it during render would leak under StrictMode.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return blob ? url : null;
}

/* ───────────── crop overlay ───────────── */

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

function CropOverlay({ rect, onChange, ratio, W, H }: {
  rect: Rect;
  onChange: (r: Rect) => void;
  ratio: number | null;
  W: number;
  H: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: DragMode; px: number; py: number; start: Rect } | null>(null);

  const pointer = (e: PointerEvent) => {
    const b = boxRef.current!.getBoundingClientRect();
    return { x: clamp((e.clientX - b.left) / b.width, 0, 1), y: clamp((e.clientY - b.top) / b.height, 0, 1) };
  };

  const begin = (e: PointerEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    const p = pointer(e);
    drag.current = { mode, px: p.x, py: p.y, start: rect };
    boxRef.current!.setPointerCapture(e.pointerId);
  };

  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = pointer(e);
    const s = d.start;

    if (d.mode === 'move') {
      onChange({ ...s, x: clamp(s.x + p.x - d.px, 0, 1 - s.w), y: clamp(s.y + p.y - d.py, 0, 1 - s.h) });
      return;
    }

    const east = d.mode.includes('e');
    const south = d.mode.includes('s');
    const ax = east ? s.x : s.x + s.w; // anchor = opposite corner
    const ay = south ? s.y : s.y + s.h;
    const maxW = east ? 1 - ax : ax;
    const maxH = south ? 1 - ay : ay;
    let w = clamp(Math.abs(p.x - ax), MIN_SIZE, maxW);
    let h = clamp(Math.abs(p.y - ay), MIN_SIZE, maxH);

    if (ratio) {
      h = (w * W) / (ratio * H);
      if (h > maxH) {
        h = maxH;
        w = (h * ratio * H) / W;
      }
    }
    onChange({ x: east ? ax : ax - w, y: south ? ay : ay - h, w, h });
  };

  const end = () => { drag.current = null; };

  const nudge = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!delta) return;
    e.preventDefault();
    onChange({ ...rect, x: clamp(rect.x + delta[0], 0, 1 - rect.w), y: clamp(rect.y + delta[1], 0, 1 - rect.h) });
  };

  const handles: { mode: DragMode; cls: string }[] = [
    // Corner brackets sit inside the frame so they never get clipped at the video edge.
    { mode: 'nw', cls: 'left-0 top-0 border-l-4 border-t-4 rounded-tl-md cursor-nwse-resize' },
    { mode: 'ne', cls: 'right-0 top-0 border-r-4 border-t-4 rounded-tr-md cursor-nesw-resize' },
    { mode: 'sw', cls: 'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-md cursor-nesw-resize' },
    { mode: 'se', cls: 'right-0 bottom-0 border-r-4 border-b-4 rounded-br-md cursor-nwse-resize' },
  ];

  return (
    <div
      ref={boxRef}
      className="absolute inset-0 touch-none overflow-hidden"
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        role="slider"
        tabIndex={0}
        aria-label="Crop area. Drag to move, use arrow keys to nudge."
        aria-valuenow={Math.round(rect.x * 100)}
        onKeyDown={nudge}
        onPointerDown={(e) => begin(e, 'move')}
        className="absolute cursor-move outline-none ring-2 ring-white focus-visible:ring-violet-300 shadow-[0_0_0_9999px_rgba(2,6,23,0.62)]"
        style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }}
      >
        {/* rule-of-thirds guides */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/20" />
          ))}
        </div>
        {handles.map(({ mode, cls }) => (
          <span
            key={mode}
            onPointerDown={(e) => begin(e, mode)}
            className={`absolute h-6 w-6 border-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] ${cls}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────── studio (one loaded file) ───────────── */

function Studio({ file, onReplace, onClose }: { file: File; onReplace: (f: File) => void; onClose: () => void }) {
  const previewUrl = useObjectUrl(file);
  const videoRef = useRef<HTMLVideoElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);

  const [probe, setProbe] = useState<VideoProbe | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  const [cropOn, setCropOn] = useState(false);
  const [rect, setRect] = useState<Rect>(FULL);
  const [aspect, setAspect] = useState<AspectId>('free');
  const [resize, setResize] = useState<ResizeId>('original');
  const [customWidth, setCustomWidth] = useState(0);
  const [format, setFormat] = useState<VideoFormatId>('mp4');
  const [codec, setCodec] = useState<VideoCodec | 'auto'>('auto');
  const [quality, setQuality] = useState<VideoQuality>('very-high');
  const [encodable, setEncodable] = useState<VideoCodec[] | null>(null);

  const [running, setRunning] = useState<RunningVideoJob | null>(null);
  const [progress, setProgress] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; name: string; warnings: string[]; lossless: boolean } | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const resultUrl = useObjectUrl(result?.blob ?? null);

  useEffect(() => {
    let alive = true;
    probeVideo(file)
      .then((p) => { if (alive) setProbe(p); })
      .catch((e: unknown) => { if (alive) setProbeError(e instanceof Error ? e.message : 'This video could not be read.'); });
    return () => { alive = false; };
  }, [file]);

  const W = probe?.width ?? 16;
  const H = probe?.height ?? 9;
  const crop = cropOn && probe ? rectToPixels(rect, W, H) : undefined;
  const baseW = crop?.width ?? W;
  const baseH = crop?.height ?? H;
  const size = computeSize(resize, customWidth, baseW, baseH);
  const outW = size?.width ?? baseW;
  const outH = size?.height ?? baseH;
  const job: VideoJob = { format, codec, quality, crop, size };
  const lossless = probe ? canCopyVideo(probe, job) : false;
  const audioCopied = probe ? canCopyAudio(probe, format) : true;
  const activeRatio = ASPECTS.find((a) => a.id === aspect)!.ratio;
  const lockRatio = activeRatio === 0 ? W / H : activeRatio;

  useEffect(() => {
    if (!probe) return;
    let alive = true;
    getEncodableCodecs(format, outW, outH)
      .then((list) => { if (alive) setEncodable(list); })
      .catch(() => { if (alive) setEncodable([]); });
    return () => { alive = false; };
  }, [probe, format, outW, outH]);

  // Tick the elapsed-time clock while a job runs.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  const chooseAspect = (id: AspectId) => {
    setAspect(id);
    const a = ASPECTS.find((x) => x.id === id)!;
    if (a.ratio !== null) setRect(rectForRatio(a.ratio === 0 ? W / H : a.ratio, W, H));
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play(); else v.pause();
  };

  const start = () => {
    if (!probe) return;
    setJobError(null);
    setResult(null);
    setProgress(0);
    setStartedAt(Date.now());
    setNow(Date.now());
    videoRef.current?.pause();

    const handle = runVideoJob(file, probe, job, setProgress);
    setRunning(handle);
    const base = file.name.replace(/\.[^.]+$/, '');
    const wasLossless = lossless;
    handle.promise
      .then((r) => setResult({ blob: r.blob, name: `${base}-pixavo${r.extension}`, warnings: r.warnings, lossless: wasLossless }))
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (e instanceof Error && /cancel/i.test(e.message)) return;
        setJobError(e instanceof Error ? e.message : 'Conversion failed.');
      })
      .finally(() => setRunning(null));
  };

  const elapsed = running ? (now - startedAt) / 1000 : 0;
  const eta = progress > 0.02 ? (elapsed * (1 - progress)) / progress : null;

  if (probeError) {
    return (
      <div className="rounded-[2rem] border border-rose-100 bg-rose-50/60 p-10 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
        <h2 className="mt-4 text-xl font-extrabold text-slate-900">We couldn’t open this video</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{probeError}</p>
        <button type="button" onClick={onClose} className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white cursor-pointer">
          Choose another video
        </button>
      </div>
    );
  }

  const busy = Boolean(running);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
      {/* ── Preview column ── */}
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-3 shadow-[0_40px_100px_-40px_rgba(76,29,149,0.55)] sm:p-5">
          <div className="flex min-h-[16rem] items-center justify-center">
            <div
              className="relative overflow-hidden rounded-xl bg-slate-900"
              style={{ aspectRatio: `${W} / ${H}`, width: `min(100%, calc(60vh * ${W / H}))` }}
            >
              {previewUrl && !previewFailed && (
                <video
                  ref={videoRef}
                  src={previewUrl}
                  className="absolute inset-0 h-full w-full"
                  playsInline
                  muted
                  loop
                  preload="metadata"
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                  onError={() => setPreviewFailed(true)}
                />
              )}
              {previewFailed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-center">
                  <Film className="h-8 w-8 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-300">Preview not available in this browser</p>
                  <p className="text-xs text-slate-500">You can still crop, resize and convert it.</p>
                </div>
              )}
              {!probe && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
                  <Loader2 className="h-7 w-7 animate-spin text-white" />
                </div>
              )}
              {cropOn && probe && <CropOverlay rect={rect} onChange={setRect} ratio={lockRatio} W={W} H={H} />}
            </div>
          </div>

          {/* transport */}
          {!previewFailed && (
            <div className="mt-4 flex items-center gap-3 px-1">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? 'Pause' : 'Play'}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 transition-transform hover:scale-105 cursor-pointer"
              >
                {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-px fill-current" />}
              </button>
              <input
                type="range"
                min={0}
                max={probe?.duration || 0}
                step={0.01}
                value={time}
                onChange={(e) => { const t = Number(e.target.value); setTime(t); if (videoRef.current) videoRef.current.currentTime = t; }}
                aria-label="Seek"
                className="h-1.5 w-full cursor-pointer accent-violet-400"
              />
              <span className="shrink-0 font-mono text-xs text-slate-400">
                {formatTime(time)} / {formatTime(probe?.duration ?? 0)}
              </span>
            </div>
          )}
        </div>

        {/* file info */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200/80 bg-white px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-brand-violet">
              <Clapperboard className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{file.name}</p>
              <p className="font-mono text-[11px] text-slate-500">
                {probe
                  ? [
                      `${probe.width}×${probe.height}`,
                      probe.frameRate ? `${probe.frameRate} fps` : null,
                      probe.videoCodec ? VIDEO_CODEC_LABELS[probe.videoCodec] : 'unknown codec',
                      probe.audioCodec ? probe.audioCodec.toUpperCase() : 'no audio',
                      formatBytes(file.size),
                    ].filter(Boolean).join(' · ')
                  : 'Reading video…'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => replaceInput.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Replace
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              aria-label="Remove video"
              className="inline-flex items-center rounded-xl border border-slate-200 px-2.5 py-2 text-slate-500 hover:bg-slate-50 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <input
              ref={replaceInput}
              type="file"
              accept={`video/*,${VIDEO_EXTENSIONS.join(',')}`}
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onReplace(f); e.target.value = ''; }}
            />
          </div>
        </div>

        {/* result */}
        {result && resultUrl && (
          <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Your video is ready</p>
                  <p className="font-mono text-[11px] text-slate-600">
                    {formatBytes(file.size)} → {formatBytes(result.blob.size)} · {result.lossless ? 'lossless stream copy' : 're-encoded'}
                  </p>
                </div>
              </div>
              <a
                href={resultUrl}
                download={result.name}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4" /> Download {result.name.split('.').pop()?.toUpperCase()}
              </a>
            </div>
            {result.warnings.map((w) => (
              <p key={w} className="mt-3 flex items-start gap-2 text-xs font-semibold text-amber-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {w}
              </p>
            ))}
            <video src={resultUrl} controls playsInline className="mt-4 max-h-80 w-full rounded-xl bg-slate-950" />
          </div>
        )}
      </div>

      {/* ── Controls column ── */}
      <div className="space-y-4 lg:sticky lg:top-28">
      <fieldset disabled={busy || !probe} className="space-y-4">
        {/* Crop */}
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Crop className="h-4 w-4 text-brand-violet" /> Crop
            </h2>
            <button
              type="button"
              role="switch"
              aria-checked={cropOn}
              onClick={() => setCropOn((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${cropOn ? 'bg-brand-violet' : 'bg-slate-200'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${cropOn ? 'translate-x-5' : 'translate-x-0'}`} />
              <span className="sr-only">Enable crop</span>
            </button>
          </div>
          {cropOn && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {ASPECTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => chooseAspect(a.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      aspect === a.id ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="font-mono text-[11px] text-slate-600">
                  {crop ? `${crop.width}×${crop.height} at ${crop.left},${crop.top}` : `Full frame ${W}×${H}`}
                </span>
                <button
                  type="button"
                  onClick={() => { setRect(FULL); setAspect('free'); }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Drag the frame or its corners on the preview.</p>
            </div>
          )}
        </section>

        {/* Resize */}
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Maximize2 className="h-4 w-4 text-brand-violet" /> Resize
          </h2>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {RESIZES.map((r) => {
              const tooBig = r.short > 0 && r.short >= Math.min(baseW, baseH);
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={tooBig}
                  title={tooBig ? 'Upscaling adds no detail, so it’s disabled' : undefined}
                  onClick={() => { setResize(r.id); if (r.id === 'custom' && !customWidth) setCustomWidth(even(baseW / 2)); }}
                  className={`rounded-lg px-2 py-2 text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
                    resize === r.id && !tooBig ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          {resize === 'custom' && (
            <label className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              Width
              <input
                type="number"
                min={16}
                max={baseW}
                step={2}
                value={customWidth || ''}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-slate-900"
              />
              px <span className="text-slate-400">(height keeps aspect ratio)</span>
            </label>
          )}
          <p className="mt-3 font-mono text-[11px] text-slate-500">
            Output: <span className="font-bold text-slate-900">{outW}×{outH}</span>
          </p>
        </section>

        {/* Format */}
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Film className="h-4 w-4 text-brand-violet" /> Format
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {VIDEO_FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => { setFormat(f.id); setCodec('auto'); }}
                className={`rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                  format === f.id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="block text-sm font-extrabold">{f.label}</span>
                <span className={`block text-[11px] ${format === f.id ? 'text-slate-400' : 'text-slate-500'}`}>{f.note}</span>
              </button>
            ))}
          </div>

          <label className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Video codec</label>
          <select
            value={codec}
            onChange={(e) => setCodec(e.target.value as VideoCodec | 'auto')}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800"
          >
            <option value="auto">Auto — keep original when possible</option>
            {(encodable ?? []).map((c) => (
              <option key={c} value={c}>{VIDEO_CODEC_LABELS[c]}</option>
            ))}
          </select>

          {!lossless && (
            <>
              <label className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Encoding quality</label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {QUALITIES.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQuality(q.id)}
                    className={`rounded-xl px-2 py-2 text-center transition-colors cursor-pointer ${
                      quality === q.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="block text-xs font-extrabold">{q.label}</span>
                    <span className={`block text-[10px] ${quality === q.id ? 'text-violet-200' : 'text-slate-400'}`}>{q.hint}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </fieldset>

        {/* Export */}
        <section className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
          {probe && (
            <div className={`flex items-start gap-3 rounded-xl p-3 ${lossless ? 'bg-emerald-500/15' : 'bg-violet-500/15'}`}>
              {lossless ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />}
              <p className="text-xs leading-5 text-slate-300">
                {lossless ? (
                  <><span className="font-bold text-white">Lossless.</span> The original video stream is copied bit-for-bit — zero quality loss, near-instant.</>
                ) : (
                  <><span className="font-bold text-white">Re-encode required</span> to {crop ? 'crop' : size ? 'resize' : 'change codec'}. Maximum quality keeps it visually identical.</>
                )}
                {!audioCopied && ' Audio will be re-encoded at transparent quality, since this format can’t hold the original audio codec.'}
              </p>
            </div>
          )}

          {running ? (
            <div className="mt-4 space-y-3">
              <div className="flex justify-between font-mono text-xs">
                <span className="font-bold text-violet-300">Processing locally…</span>
                <span className="font-bold">{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{formatTime(elapsed)} elapsed{eta !== null ? ` · ~${formatTime(eta)} left` : ''}</span>
                <button type="button" onClick={() => void running.cancel()} className="font-bold text-slate-300 hover:text-white cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={!probe}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-extrabold text-slate-950 transition-all hover:-translate-y-0.5 disabled:opacity-40 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              Export {VIDEO_FORMATS.find((f) => f.id === format)!.label} · {outW}×{outH}
            </button>
          )}
          {jobError && (
            <p className="mt-3 flex items-start gap-2 text-xs font-semibold text-rose-300" role="alert">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {jobError}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

/* ───────────── page ───────────── */

export default function VideoStudio({ file, onFileChange, onNavigateHome }: VideoStudioProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supported = supportsVideoEngine();

  const accept = (list: FileList | null) => {
    const f = Array.from(list ?? []).find((x) => isVideoFile(x.name) || x.type.startsWith('video/'));
    if (!f) { setError('Please choose a video file — MP4, MOV, WebM, MKV or TS.'); return; }
    setError(null);
    onFileChange(f);
  };

  const dragProps = {
    onDragOver: (e: DragEvent) => { e.preventDefault(); setDragging(true); },
    onDragLeave: (e: DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); },
    onDrop: (e: DragEvent) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files); },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 sm:pt-28 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button type="button" onClick={onNavigateHome} className="hover:text-brand-violet cursor-pointer">Home</button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="font-bold text-slate-800">Video Studio</span>
        </div>
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All tools
        </button>
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-violet">
            <Sparkles className="h-3 w-3" /> New · 100% in-browser
          </span>
          <h1 className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1] tracking-[-0.04em] text-slate-950">
            Video <span className="font-display font-normal italic text-gradient">Studio</span>
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-500">
            Crop, resize and convert videos without uploading them. When nothing visual changes, Pixavo copies the
            original streams for a truly lossless result.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
          {['MP4', 'MOV', 'WebM', 'MKV'].map((f) => (
            <span key={f} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono">{f}</span>
          ))}
        </div>
      </div>

      {!supported && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          This browser doesn’t support the WebCodecs video engine. Please use a recent Chrome, Edge, Safari or Firefox.
        </div>
      )}

      {file ? (
        <Studio key={`${file.name}-${file.size}-${file.lastModified}`} file={file} onReplace={onFileChange} onClose={() => onFileChange(null)} />
      ) : (
        <div
          {...dragProps}
          className={`relative overflow-hidden rounded-[2.5rem] border-2 border-dashed p-10 text-center transition-all sm:p-20 ${
            dragging ? 'border-brand-violet bg-violet-50' : 'border-slate-200 bg-white/70'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" aria-hidden="true" />
          <div className="relative">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-slate-950 text-white shadow-xl">
              <Upload className="h-7 w-7" />
            </span>
            <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-950">Drop a video to get started</h2>
            <p className="mt-2 text-sm text-slate-500">MP4, MOV, WebM, MKV or TS · processed on your device, never uploaded</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Upload className="h-4 w-4" /> Choose video
            </button>
            {error && <p className="mt-4 text-sm font-semibold text-rose-600" role="alert">{error}</p>}
            <input
              ref={inputRef}
              type="file"
              accept={`video/*,${VIDEO_EXTENSIONS.join(',')}`}
              className="hidden"
              onChange={(e) => { accept(e.target.files); e.target.value = ''; }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
