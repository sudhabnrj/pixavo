import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import exifr from 'exifr';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ConverterWorkspace } from './components/ConverterWorkspace';
import { LandingPage } from './components/LandingPage';

// The video engine is heavy, so it only loads when the studio is opened.
const VideoStudio = lazy(() => import('./components/VideoStudio'));

import {
  disposeImageCollection,
  disposeImageResources,
  revokeObjectUrl,
} from './utils/memory';
import type { ImageFile, ConversionSettings, CameraMetadata } from './types';
import { conversionTools, getToolById } from './utils/conversionTools';
import { convertSingleImage } from './utils/converter';

function App() {
  const [page, setPage] = useState<'home' | 'converter' | 'video'>('home');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [activeToolId, setActiveToolId] = useState<string>('raw-jpg');
  const [files, setFiles] = useState<ImageFile[]>([]);
  const filesRef = useRef<ImageFile[]>([]);
  const isMountedRef = useRef(true);

  const [settings, setSettings] = useState<ConversionSettings>({
    quality: 0.9,
    resizeMode: 'original',
    keepMetadata: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);

  // Sync hash routing
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#convert/')) {
        const toolId = hash.replace('#convert/', '');
        if (conversionTools.some(t => t.id === toolId)) {
          setActiveToolId(toolId);
          setPage('converter');
          return;
        }
      }
      if (hash === '#video') {
        setPage('video');
        return;
      }
      setPage('home');
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      disposeImageCollection(filesRef.current);
    };
  }, []);

  const handleSelectTool = (toolId: string) => {
    setActiveToolId(toolId);
    setPage('converter');
    window.location.hash = `convert/${toolId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenVideo = (file?: File) => {
    if (file) setVideoFile(file);
    setPage('video');
    window.location.hash = 'video';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setPage('home');
    window.location.hash = 'home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Extract EXIF camera metadata
  const getMetadata = async (file: File): Promise<CameraMetadata | undefined> => {
    try {
      const tags = await exifr.parse(file, {
        pick: ['Make', 'Model', 'LensModel', 'ExposureTime', 'FNumber', 'ISO', 'DateTimeOriginal', 'Software']
      });
      if (!tags) return undefined;
      return {
        make: tags.Make,
        model: tags.Model,
        lens: tags.LensModel || tags.Lens,
        exposureTime: tags.ExposureTime ? String(tags.ExposureTime) : undefined,
        fNumber: tags.FNumber,
        iso: tags.ISO,
        dateTime: tags.DateTimeOriginal ? new Date(tags.DateTimeOriginal).toISOString() : undefined,
        software: tags.Software
      };
    } catch (e) {
      console.warn('Metadata extraction failed for:', file.name, e);
      return undefined;
    }
  };

  // Generate preview URL
  const getPreviewUrl = async (file: File, ext: string): Promise<string> => {
    const isRaw = ['cr2', 'nef', 'arw', 'dng', 'pef', 'orf', 'rw2', 'raw'].includes(ext);
    const isHeic = ['heic', 'heif'].includes(ext);

    if (isRaw) {
      try {
        const url = await exifr.thumbnailUrl(file);
        return url || '';
      } catch (e) {
        console.warn('Failed to extract RAW thumbnail preview:', e);
        return '';
      }
    } else if (isHeic) {
      try {
        const heic2any = (await import('heic2any')).default;
        const converted = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.2
        });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        return URL.createObjectURL(blob);
      } catch (e) {
        console.warn('Failed to extract HEIC preview:', e);
        return '';
      }
    } else {
      return URL.createObjectURL(file);
    }
  };

  const handleFilesAdded = async (newFiles: File[]) => {
    const newQueueItems: ImageFile[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const id = `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (files.some(f => f.name === file.name)) {
        continue;
      }

      const metadata = await getMetadata(file);
      const previewUrl = await getPreviewUrl(file, ext);

      newQueueItems.push({
        id,
        file,
        name: file.name,
        originalSize: file.size,
        originalType: file.type || `image/${ext}`,
        status: 'pending',
        progress: 0,
        previewUrl,
        metadata
      });
    }

    if (!isMountedRef.current) {
      disposeImageCollection(newQueueItems);
      return;
    }

    setFiles(prev => [...prev, ...newQueueItems]);
  };

  const handleRemoveFile = (id: string) => {
    const target = files.find(f => f.id === id);
    if (target) disposeImageResources(target);
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearAll = () => {
    disposeImageCollection(files);
    setFiles([]);
  };

  const handleStartConversion = async () => {
    const pendingItems = files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingItems.length === 0) return;

    const currentTool = getToolById(activeToolId);
    setIsProcessing(true);
    setGlobalProgress(0);

    let completedCount = 0;
    const totalCount = pendingItems.length;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];

      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing', progress: 5 } : f));

      try {
        const { blob, width, height } = await convertSingleImage(
          item,
          settings,
          currentTool,
          (prog) => {
            setFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: prog } : f));
          }
        );

        if (!isMountedRef.current) return;
        const resultUrl = URL.createObjectURL(blob);

        setFiles(prev => prev.map(f => {
          if (f.id !== item.id) return f;
          revokeObjectUrl(f.resultUrl);
          return {
            ...f,
            status: 'success',
            progress: 100,
            convertedSize: blob.size,
            resultBlob: blob,
            resultUrl,
            width,
            height
          };
        }));
      } catch (err: unknown) {
        console.error('Error during image conversion:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error occurred during processing.';
        setFiles(prev => prev.map(f =>
          f.id === item.id
            ? { ...f, status: 'error', errorMsg: errorMessage, progress: 0 }
            : f
        ));
      }

      completedCount++;
      setGlobalProgress(Math.round((completedCount / totalCount) * 100));
    }

    setIsProcessing(false);
  };

  const handleDownloadFile = (item: ImageFile) => {
    if (!item.resultUrl || !item.resultBlob) return;
    const currentTool = getToolById(activeToolId);
    const originalName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const downloadName = `${originalName}.${currentTool.targetExt}`;

    const a = document.createElement('a');
    a.href = item.resultUrl;
    a.download = downloadName;
    document.body.appendChild(a);
    try {
      a.click();
    } finally {
      a.remove();
    }
  };

  const handleDownloadAll = async () => {
    const successFiles = files.filter(f => f.status === 'success' && f.resultBlob && f.resultUrl);
    if (successFiles.length === 0) return;

    const currentTool = getToolById(activeToolId);

    if (successFiles.length === 1) {
      handleDownloadFile(successFiles[0]);
      return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    successFiles.forEach((file) => {
      if (file.resultBlob) {
        const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        zip.file(`${originalName}.${currentTool.targetExt}`, file.resultBlob);
      }
    });

    try {
      const zipContent = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipContent);
      const a = document.createElement('a');
      try {
        a.href = zipUrl;
        a.download = `${currentTool.id}_converted_images_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
      } finally {
        a.remove();
        revokeObjectUrl(zipUrl);
      }
    } catch (e) {
      console.error('ZIP packaging failed:', e);
      alert('Failed to generate ZIP file.');
    }
  };

  const activeTool = getToolById(activeToolId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 text-slate-800">
      <Header
        currentPage={page}
        activeToolId={activeToolId}
        onNavigateHome={handleNavigateHome}
        onNavigateTool={handleSelectTool}
      />

      <main>
        {page === 'converter' ? (
          <ConverterWorkspace
            tool={activeTool}
            onSelectTool={handleSelectTool}
            onNavigateHome={handleNavigateHome}
            files={files}
            settings={settings}
            onSettingsChange={setSettings}
            onFilesAdded={handleFilesAdded}
            onRemoveFile={handleRemoveFile}
            onClearAll={handleClearAll}
            onStartConversion={handleStartConversion}
            onDownloadFile={handleDownloadFile}
            onDownloadAll={handleDownloadAll}
            isProcessing={isProcessing}
            globalProgress={globalProgress}
          />
        ) : page === 'video' ? (
          <Suspense fallback={<div className="min-h-screen" />}>
            <VideoStudio file={videoFile} onFileChange={setVideoFile} onNavigateHome={handleNavigateHome} />
          </Suspense>
        ) : (
          <LandingPage onSelectTool={handleSelectTool} onFilesAdded={handleFilesAdded} onOpenVideo={handleOpenVideo} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
