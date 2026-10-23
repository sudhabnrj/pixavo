import React from 'react';
import {
  Aperture,
  Camera,
  Clapperboard,
  Crop,
  FileCog,
  Film,
  Globe,
  Image,
  ImagePlus,
  Layers,
  Maximize2,
  Minimize2,
  Repeat,
  Smartphone,
  Zap,
} from 'lucide-react';
import { IMAGE_TOOLS, VIDEO_TOOLS, imageToolSlug } from './toolCatalog';
import type { ImageToolData, VideoToolData } from './toolCatalog';

type Icon = React.ComponentType<{ className?: string }>;

export interface ConversionTool extends ImageToolData {
  slug: string;
  icon: Icon;
}

export interface VideoTool extends VideoToolData {
  slug: string;
  icon: Icon;
}

const IMAGE_ICONS: Record<string, Icon> = {
  'raw-jpg': Aperture,
  'raw-png': Camera,
  'png-raw': FileCog,
  'heic-jpg': Smartphone,
  'png-jpg': Image,
  'webp-jpg': Globe,
  'jpg-png': ImagePlus,
  'webp-png': Layers,
  'jpg-webp': Zap,
  'png-webp': Minimize2,
};

const VIDEO_ICONS: Record<string, Icon> = {
  'video-studio': Clapperboard,
  'crop-video': Crop,
  'resize-video': Maximize2,
  'video-converter': Repeat,
};

export const conversionTools: ConversionTool[] = IMAGE_TOOLS.map((t) => ({
  ...t,
  slug: imageToolSlug(t),
  icon: IMAGE_ICONS[t.id] ?? Image,
}));

export const videoTools: VideoTool[] = VIDEO_TOOLS.map((t) => ({
  ...t,
  slug: t.id,
  icon: VIDEO_ICONS[t.id] ?? Film,
}));

export const getToolById = (id: string): ConversionTool => {
  return conversionTools.find(t => t.id === id) || conversionTools[0];
};

export const getVideoToolById = (id: string): VideoTool | undefined => videoTools.find((t) => t.id === id);
