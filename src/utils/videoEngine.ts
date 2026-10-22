import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  MkvOutputFormat,
  MovOutputFormat,
  Mp4OutputFormat,
  Output,
  Quality,
  WebMOutputFormat,
  getEncodableVideoCodecs,
} from 'mediabunny';
import type { AudioCodec, OutputFormat, VideoCodec } from 'mediabunny';
import { VIDEO_EXTENSIONS } from './videoExtensions';

export { VIDEO_EXTENSIONS };

export type VideoFormatId = 'mp4' | 'webm' | 'mov' | 'mkv';

export const VIDEO_FORMATS: { id: VideoFormatId; label: string; note: string }[] = [
  { id: 'mp4', label: 'MP4', note: 'Plays everywhere' },
  { id: 'webm', label: 'WebM', note: 'Open web format' },
  { id: 'mov', label: 'MOV', note: 'Apple & editors' },
  { id: 'mkv', label: 'MKV', note: 'Flexible container' },
];

export const VIDEO_CODEC_LABELS: Record<VideoCodec, string> = {
  avc: 'H.264',
  hevc: 'H.265 / HEVC',
  vp9: 'VP9',
  av1: 'AV1',
  vp8: 'VP8',
  prores: 'ProRes',
};

// Codecs offered per container, best compatibility first.
const CODEC_PREFERENCE: Record<VideoFormatId, VideoCodec[]> = {
  mp4: ['avc', 'hevc', 'av1', 'vp9'],
  mov: ['avc', 'hevc', 'av1'],
  webm: ['vp9', 'av1', 'vp8'],
  mkv: ['avc', 'hevc', 'vp9', 'av1'],
};

export type VideoQuality = 'very-high' | 'high' | 'medium';

export interface VideoProbe {
  width: number;
  height: number;
  duration: number;
  frameRate: number | null;
  videoCodec: VideoCodec | null;
  audioCodec: AudioCodec | null;
  container: string;
}

export interface CropRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface VideoJob {
  format: VideoFormatId;
  /** 'auto' keeps the source codec when possible, otherwise picks the best encodable one. */
  codec: VideoCodec | 'auto';
  quality: VideoQuality;
  crop?: CropRect;
  /** Output size; omit to keep the (cropped) size. */
  size?: { width: number; height: number };
}

export interface VideoResult {
  blob: Blob;
  extension: string;
  warnings: string[];
}

export const isVideoFile = (name: string) =>
  VIDEO_EXTENSIONS.includes(`.${name.split('.').pop()?.toLowerCase() ?? ''}`);

export const supportsVideoEngine = () =>
  typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoDecoder' in window;

const makeFormat = (id: VideoFormatId): OutputFormat => {
  switch (id) {
    case 'webm': return new WebMOutputFormat();
    case 'mov': return new MovOutputFormat();
    case 'mkv': return new MkvOutputFormat();
    default: return new Mp4OutputFormat({ fastStart: 'in-memory' });
  }
};

const openInput = (file: File) => new Input({ source: new BlobSource(file), formats: ALL_FORMATS });

export async function probeVideo(file: File): Promise<VideoProbe> {
  const input = openInput(file);
  try {
    const video = await input.getPrimaryVideoTrack();
    if (!video) throw new Error('No video track was found in this file.');
    const audio = await input.getPrimaryAudioTrack();
    const [duration, format, stats] = await Promise.all([
      input.computeDuration(),
      input.getFormat(),
      video.computePacketStats(120).catch(() => null),
    ]);
    return {
      width: video.displayWidth,
      height: video.displayHeight,
      duration,
      frameRate: stats ? Math.round(stats.averagePacketRate * 100) / 100 : null,
      videoCodec: video.codec,
      audioCodec: audio?.codec ?? null,
      container: format.name,
    };
  } finally {
    input.dispose();
  }
}

/** Video codecs this browser can encode into the given container at the given size. */
export async function getEncodableCodecs(format: VideoFormatId, width: number, height: number) {
  const supported = makeFormat(format).getSupportedVideoCodecs();
  const candidates = CODEC_PREFERENCE[format].filter((c) => supported.includes(c));
  return getEncodableVideoCodecs(candidates, { width, height });
}

// People pick MOV for Apple apps and editors, so only copy codecs those can actually open.
const MOV_COPYABLE_VIDEO: VideoCodec[] = ['avc', 'hevc', 'prores'];
const MOV_COPYABLE_AUDIO: AudioCodec[] = ['aac', 'mp3', 'ac3', 'eac3', 'pcm-s16', 'pcm-s16be', 'pcm-s24', 'pcm-s24be', 'pcm-f32'];

/** True when the job can copy the original video stream untouched (no re-encode, zero quality loss). */
export function canCopyVideo(probe: VideoProbe, job: VideoJob) {
  if (!probe.videoCodec || job.crop || job.size) return false;
  if (job.codec !== 'auto' && job.codec !== probe.videoCodec) return false;
  if (job.format === 'mov' && !MOV_COPYABLE_VIDEO.includes(probe.videoCodec)) return false;
  return makeFormat(job.format).getSupportedVideoCodecs().includes(probe.videoCodec);
}

export function canCopyAudio(probe: VideoProbe, format: VideoFormatId) {
  if (!probe.audioCodec) return true;
  if (format === 'mov' && !MOV_COPYABLE_AUDIO.includes(probe.audioCodec)) return false;
  return makeFormat(format).getSupportedAudioCodecs().includes(probe.audioCodec);
}

const describeDiscard = (reason: string) => {
  switch (reason) {
    case 'unknown_source_codec':
    case 'undecodable_source_codec':
      return 'its codec can’t be decoded by this browser';
    case 'no_encodable_target_codec':
      return 'this browser can’t encode it into the chosen format';
    default:
      return 'it isn’t supported by the chosen format';
  }
};

export interface RunningVideoJob {
  promise: Promise<VideoResult>;
  cancel: () => Promise<void>;
}

export function runVideoJob(
  file: File,
  probe: VideoProbe,
  job: VideoJob,
  onProgress: (progress: number) => void,
): RunningVideoJob {
  let conversion: Conversion | null = null;
  let cancelled = false;

  const promise = (async () => {
    const input = openInput(file);
    const format = makeFormat(job.format);
    const output = new Output({ format, target: new BufferTarget() });
    const copyVideo = canCopyVideo(probe, job);

    try {
      let codec: VideoCodec | undefined;
      if (!copyVideo) {
        const width = job.size?.width ?? job.crop?.width ?? probe.width;
        const height = job.size?.height ?? job.crop?.height ?? probe.height;
        const encodable = await getEncodableCodecs(job.format, width, height);
        codec = job.codec !== 'auto' && encodable.includes(job.codec) ? job.codec : encodable[0];
        if (!codec) throw new Error('This browser can’t encode video into the chosen format. Try MP4 or WebM.');
      }

      conversion = await Conversion.init({
        input,
        output,
        showWarnings: false,
        // Quality/codec are only set when re-encoding: setting them forces a transcode,
        // and leaving them out lets untouched streams be copied bit-for-bit.
        video: copyVideo
          ? {}
          : {
              codec,
              quality: new Quality(job.quality),
              crop: job.crop,
              width: job.size?.width,
              height: job.size?.height,
              fit: job.size ? 'fill' : undefined,
            },
        // 'high' is already transparent (~260 kbps AAC / ~130 kbps Opus); 'very-high' can exceed encoder limits.
        audio: canCopyAudio(probe, job.format)
          ? {}
          : { quality: new Quality('high'), codec: job.format === 'mov' ? 'aac' : undefined },
      });

      if (cancelled) throw new DOMException('Cancelled', 'AbortError');

      const warnings: string[] = [];
      for (const discarded of conversion.discardedTracks) {
        const kind = discarded.track.type === 'video' ? 'Video' : 'Audio';
        if (!['discarded_by_user', 'max_track_count_reached', 'max_track_count_of_type_reached'].includes(discarded.reason)) {
          warnings.push(`${kind} track was skipped because ${describeDiscard(discarded.reason)}.`);
        }
      }
      if (!conversion.isValid || !conversion.utilizedTracks.some((t) => t.type === 'video')) {
        throw new Error(warnings[0] ?? 'This video can’t be converted with the selected options.');
      }

      conversion.onProgress = (p) => onProgress(Math.min(1, Math.max(0, p)));
      await conversion.execute();

      const buffer = (output.target as BufferTarget).buffer;
      if (!buffer) throw new Error('The converted video could not be written.');
      return { blob: new Blob([buffer], { type: format.mimeType }), extension: format.fileExtension, warnings };
    } finally {
      input.dispose();
    }
  })();

  return {
    promise,
    cancel: async () => {
      cancelled = true;
      await conversion?.cancel();
    },
  };
}
