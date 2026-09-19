'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ImagePlus,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Download,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GripVertical,
} from 'lucide-react';
import { convertImagesToPdf, PageSize, Orientation, MarginPreset, ImageFit } from '@/lib/pdf/conversion/images-to-pdf';
import { downloadUint8Array } from '@/lib/pdf/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface ImageEntry {
  id: string;
  file: File;
  preview: string;  // object URL
  width: number;
  height: number;
}

type Status = 'idle' | 'processing' | 'ready' | 'error';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function OptionButton<T extends string>({
  value,
  current,
  onChange,
  label,
}: {
  value: T;
  current: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
        current === value
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
      }`}
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */
export function JpgToPdfWorkspace() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);
  const [outputSize, setOutputSize] = useState(0);

  // Controls
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [margin, setMargin] = useState<MarginPreset>('small');
  const [imageFit, setImageFit] = useState<ImageFit>('fit');
  const [quality, setQuality] = useState<'standard' | 'high'>('standard');

  // Drag state
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isDragZoneActive, setIsDragZoneActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalInputSize = images.reduce((acc, img) => acc + img.file.size, 0);

  /* ---------- File ingestion ---------- */
  const addFiles = useCallback(async (rawFiles: File[]) => {
    const imageFiles = rawFiles.filter((f) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'].includes(f.type)
    );
    if (imageFiles.length === 0) {
      setErrorMsg('Please select JPEG, PNG, WebP, or BMP image files.');
      return;
    }

    const entries = await Promise.all(
      imageFiles.map(
        (f) =>
          new Promise<ImageEntry>((resolve) => {
            const url = URL.createObjectURL(f);
            const img = new Image();
            img.onload = () => {
              resolve({
                id: `${f.name}-${Date.now()}-${Math.random()}`,
                file: f,
                preview: url,
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
            };
            img.onerror = () => {
              resolve({
                id: `${f.name}-${Date.now()}-${Math.random()}`,
                file: f,
                preview: url,
                width: 0,
                height: 0,
              });
            };
            img.src = url;
          })
      )
    );

    setImages((prev) => [...prev, ...entries]);
    setErrorMsg(null);
  }, []);

  /* ---------- Drop zone ---------- */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragZoneActive(false);
      const files = Array.from(e.dataTransfer.files);
      addFiles(files);
    },
    [addFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    e.target.value = ''; // allow re-selecting same file
  };

  /* ---------- Reorder ---------- */
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setImages((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setImages((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleDragStart = (idx: number) => {
    setDraggingIdx(idx);
  };

  const handleDragEnterItem = (idx: number) => {
    setDragOverIdx(idx);
  };

  const handleDragEndItem = () => {
    if (draggingIdx !== null && dragOverIdx !== null && draggingIdx !== dragOverIdx) {
      setImages((prev) => {
        const next = [...prev];
        const [removed] = next.splice(draggingIdx, 1);
        next.splice(dragOverIdx, 0, removed);
        return next;
      });
    }
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  /* ---------- Remove ---------- */
  const removeImage = (idx: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setStatus('idle');
    setOutputBytes(null);
    setErrorMsg(null);
    setProgress(0);
    setProgressMsg('');
  };

  /* ---------- Convert ---------- */
  const convert = async () => {
    if (images.length === 0) {
      setErrorMsg('Please add at least one image.');
      return;
    }
    setStatus('processing');
    setProgress(0);
    setProgressMsg('Starting...');
    setErrorMsg(null);
    setOutputBytes(null);

    try {
      const imageInputs = await Promise.all(
        images.map(async (entry) => {
          const buf = await entry.file.arrayBuffer();
          return {
            bytes: new Uint8Array(buf),
            mimeType: entry.file.type || 'image/jpeg',
            name: entry.file.name,
          };
        })
      );

      const result = await convertImagesToPdf(
        imageInputs,
        { pageSize, orientation, margin, imageFit, quality },
        (p, m) => {
          setProgress(p);
          setProgressMsg(m);
        }
      );

      setOutputBytes(result);
      setOutputSize(result.byteLength);
      setStatus('ready');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Conversion failed. Please try again.');
    }
  };

  /* ---------- Download ---------- */
  const download = () => {
    if (outputBytes) {
      const baseName =
        images.length === 1
          ? images[0].file.name.replace(/\.[^/.]+$/, '')
          : 'images_assembled';
      downloadUint8Array(outputBytes, `${baseName}.pdf`, 'application/pdf');
    }
  };

  /* ---------- Render helpers ---------- */
  const renderControls = () => (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">PDF Options</h3>

      {/* Page Size */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Page Size</label>
        <div className="flex flex-wrap gap-1.5">
          <OptionButton<PageSize> value="A4" current={pageSize} onChange={setPageSize} label="A4" />
          <OptionButton<PageSize> value="Letter" current={pageSize} onChange={setPageSize} label="Letter" />
          <OptionButton<PageSize> value="Original" current={pageSize} onChange={setPageSize} label="Original (Image)" />
        </div>
      </div>

      {/* Orientation */}
      {pageSize !== 'Original' && (
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Orientation</label>
          <div className="flex flex-wrap gap-1.5">
            <OptionButton<Orientation> value="auto" current={orientation} onChange={setOrientation} label="Auto" />
            <OptionButton<Orientation> value="portrait" current={orientation} onChange={setOrientation} label="Portrait" />
            <OptionButton<Orientation> value="landscape" current={orientation} onChange={setOrientation} label="Landscape" />
          </div>
        </div>
      )}

      {/* Margin */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Margin</label>
        <div className="flex flex-wrap gap-1.5">
          <OptionButton<MarginPreset> value="none" current={margin} onChange={setMargin} label="None" />
          <OptionButton<MarginPreset> value="small" current={margin} onChange={setMargin} label="Small" />
          <OptionButton<MarginPreset> value="medium" current={margin} onChange={setMargin} label="Medium" />
        </div>
      </div>

      {/* Image Fit */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Image Fit</label>
        <div className="flex flex-wrap gap-1.5">
          <OptionButton<ImageFit> value="fit" current={imageFit} onChange={setImageFit} label="Fit (Letterbox)" />
          <OptionButton<ImageFit> value="fill" current={imageFit} onChange={setImageFit} label="Fill (Cover)" />
          <OptionButton<ImageFit> value="original" current={imageFit} onChange={setImageFit} label="Original Size" />
        </div>
      </div>

      {/* Quality */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quality</label>
        <div className="flex flex-wrap gap-1.5">
          <OptionButton<'standard' | 'high'>
            value="standard"
            current={quality}
            onChange={setQuality}
            label="Standard"
          />
          <OptionButton<'standard' | 'high'>
            value="high"
            current={quality}
            onChange={setQuality}
            label="High"
          />
        </div>
      </div>
    </div>
  );

  /* ---- Drop zone ---- */
  if (images.length === 0 && status === 'idle') {
    return (
      <div className="space-y-4">
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragZoneActive(true); }}
          onDragLeave={() => setIsDragZoneActive(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
            isDragZoneActive
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
            multiple
            className="sr-only"
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <ImagePlus className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Drop images here or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                JPEG, PNG, WebP, BMP — multiple images, all converted client-side in your browser
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Browser disclosure */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>All processing happens locally in your browser — no files are uploaded to any server.</span>
        </div>
      </div>
    );
  }

  /* ---- Processing state ---- */
  if (status === 'processing') {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{progressMsg || 'Processing...'}</p>
          <p className="text-xs text-slate-500 mt-1">{progress}% complete</p>
        </div>
        <div className="w-full max-w-sm mx-auto h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-slate-400 hover:text-rose-500 underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  /* ---- Success state ---- */
  if (status === 'ready' && outputBytes) {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-3xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-center space-y-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <div>
            <p className="text-base font-black text-slate-900 dark:text-white">PDF Ready!</p>
            <p className="text-xs text-slate-500 mt-1">
              {images.length} image{images.length !== 1 ? 's' : ''} assembled •{' '}
              Input: {formatBytes(totalInputSize)} → Output: {formatBytes(outputSize)}
            </p>
          </div>
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <div className="pt-2">
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Process Another Batch
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Processed entirely in your browser — nothing was uploaded.</span>
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (status === 'error') {
    return (
      <div className="space-y-4 text-center py-8">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{errorMsg}</p>
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    );
  }

  /* ---- Main editing state (images loaded) ---- */
  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
          {images.length} image{images.length !== 1 ? 's' : ''}{' '}
          <span className="font-normal text-slate-400">({formatBytes(totalInputSize)} total)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition-colors shadow-xs"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            Add More
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-500 hover:border-rose-400 transition-colors shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/bmp"
        multiple
        className="sr-only"
        onChange={handleFileInput}
      />

      {/* Drag hint */}
      <p className="text-[11px] text-slate-400 text-center">
        <GripVertical className="w-3 h-3 inline-block mr-0.5 -mt-0.5" />
        Drag rows to reorder images — order determines PDF page order
      </p>

      {/* Image list with thumbnails */}
      <div className="space-y-2">
        {images.map((entry, idx) => (
          <div
            key={entry.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnterItem(idx)}
            onDragEnd={handleDragEndItem}
            onDragOver={(e) => e.preventDefault()}
            className={`group flex items-center gap-3 p-3 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs transition-all cursor-grab active:cursor-grabbing ${
              dragOverIdx === idx && draggingIdx !== idx
                ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-slate-200/80 dark:border-slate-800'
            } ${draggingIdx === idx ? 'opacity-40' : ''}`}
          >
            {/* Drag handle */}
            <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />

            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.preview}
                alt={entry.file.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {entry.file.name}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {formatBytes(entry.file.size)}
                {entry.width > 0 && ` • ${entry.width}×${entry.height}px`}
              </p>
            </div>

            {/* Order arrows */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 disabled:opacity-20 transition-colors"
                title="Move up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(idx)}
                disabled={idx === images.length - 1}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 disabled:opacity-20 transition-colors"
                title="Move down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-300 hover:text-rose-500 transition-colors shrink-0"
              title={`Remove ${entry.file.name}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Drop zone for adding more when list is shown */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragZoneActive(true); }}
        onDragLeave={() => setIsDragZoneActive(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all text-xs ${
          isDragZoneActive
            ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/10'
            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-400'
        }`}
      >
        <ImagePlus className="w-4 h-4 mx-auto mb-1 text-slate-400" />
        Drop more images here or click to add
      </div>

      {/* Options panel */}
      {renderControls()}

      {/* Error */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Browser-only — no upload, no server storage</span>
        </div>
        <button
          type="button"
          onClick={convert}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-[0.98]"
        >
          Convert {images.length} Image{images.length !== 1 ? 's' : ''} to PDF
        </button>
      </div>
    </div>
  );
}
