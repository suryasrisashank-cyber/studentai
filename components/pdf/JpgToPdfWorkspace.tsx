'use client';

/**
 * JpgToPdfWorkspace — Fully Responsive (320px → 1440px)
 *
 * One component, three layouts (mobile / tablet / desktop).
 * Functionality is identical on all screen sizes.
 *
 * Mobile: stacked, scrollable thumbnail strip, expandable settings sections,
 *         up/down reorder buttons, full-width CTA, touch-friendly (≥44px targets).
 * Desktop: spacious grid thumbnails, always-visible settings panel, drag-to-reorder.
 *
 * Performance: pdf-lib is lazy-imported on first conversion (not on page load).
 * Memory: object URLs revoked after use; explicit clearAll; large-file guard.
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
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
  Settings,
  Image as ImageIcon,
  FileOutput,
} from 'lucide-react';

const ExpandIcon = ChevronDown;
import { downloadUint8Array } from '@/lib/pdf/utils';
import type { PageSize, Orientation, MarginPreset, ImageFit } from '@/lib/pdf/conversion/images-to-pdf';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Constants                                                              */
/* ═══════════════════════════════════════════════════════════════════════ */

/** Warn when total input exceeds this threshold (~80 MB uncompressed). */
const LARGE_FILE_WARN_BYTES = 80 * 1024 * 1024;

/** Accepted MIME types for image input. */
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/bmp';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Types                                                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

interface ImageEntry {
  id: string;
  file: File;
  preview: string; // object URL — revoked on remove/clear/unmount
  width: number;
  height: number;
}

type Status = 'idle' | 'processing' | 'ready' | 'error';

interface ConversionOptions {
  pageSize: PageSize;
  orientation: Orientation;
  margin: MarginPreset;
  imageFit: ImageFit;
  quality: 'standard' | 'high';
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                */
/* ═══════════════════════════════════════════════════════════════════════ */

function fmtBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function revokeEntry(e: ImageEntry) {
  try { URL.revokeObjectURL(e.preview); } catch { /* no-op */ }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Shared sub-components                                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Pill button group — segmented control used for all settings on both
 * mobile and desktop. Buttons are at least 44px tall via py-3.
 */
function SegmentGroup<T extends string>({
  value,
  onChange,
  options,
  fullWidth = false,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  fullWidth?: boolean;
}) {
  return (
    <div className={`flex ${fullWidth ? 'w-full' : 'flex-wrap'} gap-2`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            flex-1 min-w-0 px-3 py-3 sm:py-2 rounded-xl text-xs font-bold
            transition-all border touch-manipulation select-none
            ${value === opt.value
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 active:bg-indigo-50'
            }
          `}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Collapsible settings section — expanded by default on desktop,
 * collapsed by default on mobile (user taps to open).
 */
function SettingsSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 sm:py-3 touch-manipulation select-none"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {icon}
          {title}
        </span>
        <ExpandIcon
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

/** Single setting row label + control. */
function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</label>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Thumbnail Card                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

interface ThumbProps {
  entry: ImageEntry;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
}

function ThumbnailCard({
  entry,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: ThumbProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`
        group relative flex flex-col sm:flex-row items-center gap-3 p-3
        rounded-2xl border bg-white dark:bg-slate-900 shadow-xs
        transition-all cursor-grab active:cursor-grabbing touch-manipulation
        ${isDragOver && !isDragging ? 'border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 scale-[1.01]' : 'border-slate-200/80 dark:border-slate-800'}
        ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}
      `}
    >
      {/* Drag handle — hidden on mobile (use arrow buttons instead) */}
      <GripVertical className="hidden sm:block w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 self-center" />

      {/* Thumbnail image */}
      <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 self-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.preview}
          alt={entry.file.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[160px] sm:max-w-none mx-auto sm:mx-0">
          {entry.file.name}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {fmtBytes(entry.file.size)}
          {entry.width > 0 && ` · ${entry.width}×${entry.height}px`}
        </p>
        <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold mt-0.5">
          Page {index + 1} of {total}
        </p>
      </div>

      {/* Controls — always visible, large enough for touch */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Up/Down — always shown (primary reorder on mobile, fallback on desktop) */}
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label="Move image up"
          className="p-2.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label="Move image down"
          className="p-2.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${entry.file.name}`}
          className="p-2.5 sm:p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-300 hover:text-rose-500 transition-colors touch-manipulation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Drop Zone                                                              */
/* ═══════════════════════════════════════════════════════════════════════ */

function DropZone({
  onFiles,
  compact = false,
  fileInputRef,
}: {
  onFiles: (f: File[]) => void;
  compact?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  const [active, setActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setActive(false);
    onFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setActive(true); }}
      onDragLeave={() => setActive(false)}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      aria-label="Upload images — click or drag and drop"
      className={`
        w-full border-2 border-dashed rounded-2xl text-center cursor-pointer
        transition-all touch-manipulation select-none
        ${active ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
          : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}
        ${compact ? 'py-4 px-3' : 'py-10 sm:py-14 px-4'}
      `}
    >
      <div className="flex flex-col items-center gap-2.5">
        <div className={`rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shadow-inner
          ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
          <ImagePlus className={compact ? 'w-5 h-5' : 'w-7 h-7'} />
        </div>
        <div>
          <p className={`font-bold text-slate-800 dark:text-slate-100 ${compact ? 'text-xs' : 'text-sm'}`}>
            {compact ? 'Drop more images or tap to add' : (
              <>Drop images here or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span></>
            )}
          </p>
          {!compact && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              JPEG · PNG · WebP · BMP · Multiple files supported
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Settings Panel                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */

function SettingsPanel({
  options,
  onChange,
  imageCount,
  totalInputSize,
  outputSize,
}: {
  options: ConversionOptions;
  onChange: <K extends keyof ConversionOptions>(k: K, v: ConversionOptions[K]) => void;
  imageCount: number;
  totalInputSize: number;
  outputSize: number;
}) {
  const pageSizeOpts = [
    { value: 'A4' as PageSize, label: 'A4' },
    { value: 'Letter' as PageSize, label: 'Letter' },
    { value: 'Original' as PageSize, label: 'Image size' },
  ];
  const orientOpts = [
    { value: 'auto' as Orientation, label: 'Auto' },
    { value: 'portrait' as Orientation, label: 'Portrait' },
    { value: 'landscape' as Orientation, label: 'Landscape' },
  ];
  const marginOpts = [
    { value: 'none' as MarginPreset, label: 'None' },
    { value: 'small' as MarginPreset, label: 'Small' },
    { value: 'medium' as MarginPreset, label: 'Medium' },
  ];
  const fitOpts = [
    { value: 'fit' as ImageFit, label: 'Fit' },
    { value: 'fill' as ImageFit, label: 'Fill' },
    { value: 'original' as ImageFit, label: 'Original' },
  ];
  const qualityOpts = [
    { value: 'standard' as const, label: 'Standard' },
    { value: 'high' as const, label: 'High' },
  ];

  return (
    <div className="space-y-3">
      {/* PDF Settings */}
      <SettingsSection title="PDF Settings" icon={<Settings className="w-3.5 h-3.5" />} defaultOpen>
        <SettingRow label="Page Size">
          <SegmentGroup value={options.pageSize} onChange={(v) => onChange('pageSize', v)} options={pageSizeOpts} fullWidth />
        </SettingRow>
        {options.pageSize !== 'Original' && (
          <SettingRow label="Orientation">
            <SegmentGroup value={options.orientation} onChange={(v) => onChange('orientation', v)} options={orientOpts} fullWidth />
          </SettingRow>
        )}
        <SettingRow label="Margin">
          <SegmentGroup value={options.margin} onChange={(v) => onChange('margin', v)} options={marginOpts} fullWidth />
        </SettingRow>
      </SettingsSection>

      {/* Image Settings */}
      <SettingsSection title="Image Settings" icon={<ImageIcon className="w-3.5 h-3.5" />} defaultOpen>
        <SettingRow label="Image Fit">
          <SegmentGroup value={options.imageFit} onChange={(v) => onChange('imageFit', v)} options={fitOpts} fullWidth />
        </SettingRow>
        <SettingRow label="Quality">
          <SegmentGroup value={options.quality} onChange={(v) => onChange('quality', v)} options={qualityOpts} fullWidth />
        </SettingRow>
      </SettingsSection>

      {/* Output Info */}
      {imageCount > 0 && (
        <SettingsSection title="Output Info" icon={<FileOutput className="w-3.5 h-3.5" />} defaultOpen>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Images</span>
              <span className="font-bold">{imageCount}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Input size</span>
              <span className="font-bold">{fmtBytes(totalInputSize)}</span>
            </div>
            {outputSize > 0 ? (
              <>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Pages</span>
                  <span className="font-bold">{imageCount}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Output size</span>
                  <span>{fmtBytes(outputSize)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Estimated output size</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  ~{fmtBytes(options.quality === 'high' ? Math.round(totalInputSize * 0.95) : Math.round(totalInputSize * 0.82))}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Target filename</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">
                {imageCount === 1 ? 'document.pdf' : 'images_assembled.pdf'}
              </span>
            </div>
          </div>
        </SettingsSection>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Main Workspace                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */

export function JpgToPdfWorkspace() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);
  const [outputSize, setOutputSize] = useState(0);

  // Conversion options
  const [options, setOptions] = useState<ConversionOptions>({
    pageSize: 'A4',
    orientation: 'auto',
    margin: 'small',
    imageFit: 'fit',
    quality: 'standard',
  });

  // Drag-reorder state (desktop)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalInputSize = images.reduce((a, img) => a + img.file.size, 0);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => { images.forEach(revokeEntry); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Option setter ─────────────────────────────────────────────── */
  const setOption = useCallback(
    <K extends keyof ConversionOptions>(k: K, v: ConversionOptions[K]) => {
      setOptions((prev) => ({ ...prev, [k]: v }));
    },
    []
  );

  /* ─── File ingestion ─────────────────────────────────────────────── */
  const addFiles = useCallback(async (rawFiles: File[]) => {
    const imageFiles = rawFiles.filter((f) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'].includes(f.type.toLowerCase())
    );
    if (imageFiles.length === 0) {
      setErrorMsg('Please select JPEG, PNG, WebP, or BMP image files.');
      return;
    }
    setErrorMsg(null);

    const entries = await Promise.all(
      imageFiles.map(
        (f) =>
          new Promise<ImageEntry>((resolve) => {
            const url = URL.createObjectURL(f);
            const img = new window.Image();
            img.onload = () =>
              resolve({ id: `${f.name}-${Date.now()}-${Math.random()}`, file: f, preview: url, width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () =>
              resolve({ id: `${f.name}-${Date.now()}-${Math.random()}`, file: f, preview: url, width: 0, height: 0 });
            img.src = url;
          })
      )
    );
    setImages((prev) => [...prev, ...entries]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => { e.preventDefault(); addFiles(Array.from(e.dataTransfer.files)); },
    [addFiles]
  );

  /* ─── Reorder ───────────────────────────────────────────────────── */
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

  const handleDragStart = (idx: number) => setDraggingIdx(idx);
  const handleDragEnter = (idx: number) => setDragOverIdx(idx);
  const handleDragEnd = () => {
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

  /* ─── Remove / Clear ────────────────────────────────────────────── */
  const removeImage = (idx: number) => {
    setImages((prev) => {
      revokeEntry(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const clearAll = useCallback(() => {
    setImages((prev) => { prev.forEach(revokeEntry); return []; });
    setStatus('idle');
    setOutputBytes(null);
    setOutputSize(0);
    setErrorMsg(null);
    setProgress(0);
    setProgressMsg('');
    setDraggingIdx(null);
    setDragOverIdx(null);
  }, []);

  /* ─── Convert (lazy-loads pdf-lib) ─────────────────────────────── */
  const convert = async () => {
    if (images.length === 0) {
      setErrorMsg('Please add at least one image.');
      return;
    }

    // Large-file guard — protect low-memory mobile devices
    if (totalInputSize > LARGE_FILE_WARN_BYTES) {
      setErrorMsg(
        `These files are too large for this device's available browser memory ` +
        `(${fmtBytes(totalInputSize)} total). Try fewer images or smaller files.`
      );
      return;
    }

    setStatus('processing');
    setProgress(0);
    setProgressMsg('Loading PDF engine...');
    setErrorMsg(null);
    setOutputBytes(null);

    try {
      // Lazy-import so pdf-lib is not bundled on page load (performance)
      const { convertImagesToPdf } = await import('@/lib/pdf/conversion/images-to-pdf');

      setProgressMsg('Reading images...');
      setProgress(5);

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
        {
          pageSize: options.pageSize,
          orientation: options.orientation,
          margin: options.margin,
          imageFit: options.imageFit,
          quality: options.quality,
        },
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
      const msg = err instanceof Error ? err.message : 'Conversion failed. Please try again.';
      // Detect out-of-memory / allocation failures
      const isOom =
        msg.toLowerCase().includes('memory') ||
        msg.toLowerCase().includes('allocation') ||
        msg.toLowerCase().includes('out of') ||
        msg.toLowerCase().includes('arraybuffer');
      setErrorMsg(
        isOom
          ? "Your device ran out of available browser memory. Try fewer images or smaller files."
          : msg
      );
    }
  };

  /* ─── Download ──────────────────────────────────────────────────── */
  const download = () => {
    if (!outputBytes) return;
    const baseName =
      images.length === 1
        ? images[0].file.name.replace(/\.[^/.]+$/, '')
        : 'images_assembled';
    downloadUint8Array(outputBytes, `${baseName}.pdf`, 'application/pdf');
  };

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Render: Processing                                                 */
  /* ═══════════════════════════════════════════════════════════════════ */
  if (status === 'processing') {
    return (
      <div className="space-y-6 text-center py-10 px-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto shadow-inner">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {progressMsg || 'Processing…'}
          </p>
          <p className="text-xs text-slate-500 mt-1">{progress}% complete</p>
        </div>
        <div className="w-full max-w-xs mx-auto h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-slate-400 hover:text-rose-500 underline underline-offset-2 touch-manipulation"
        >
          Cancel
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Render: Success                                                    */
  /* ═══════════════════════════════════════════════════════════════════ */
  if (status === 'ready' && outputBytes) {
    return (
      <div className="space-y-5 px-1">
        {/* Success card — fits mobile viewport */}
        <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Document Ready!</h3>
            <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
              {images.length === 1 ? `${images[0].file.name.replace(/\.[^/.]+$/, '')}.pdf` : 'images_assembled.pdf'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pages: <span className="font-bold text-slate-700 dark:text-slate-200">{images.length}</span> &nbsp;·&nbsp;
              Output size: <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmtBytes(outputSize)}</span>
            </p>
          </div>

          {/* Full-width on mobile, auto-width on desktop */}
          <button
            type="button"
            onClick={download}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 sm:py-3.5 rounded-2xl text-base sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md transition-all touch-manipulation"
          >
            <Download className="w-5 h-5 sm:w-4 sm:h-4" />
            Download PDF
          </button>

          {/* Process Another */}
          <div>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors touch-manipulation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Process Another
            </button>
          </div>
        </div>

        {/* Output info */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Images', value: String(images.length) },
            { label: 'Input', value: fmtBytes(totalInputSize) },
            { label: 'Output', value: fmtBytes(outputSize) },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-black text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Browser disclosure */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Processed entirely in your browser — nothing was uploaded.</span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Render: Error                                                      */
  /* ═══════════════════════════════════════════════════════════════════ */
  if (status === 'error') {
    return (
      <div className="space-y-5 text-center py-8 px-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold text-rose-600 dark:text-rose-400 max-w-sm mx-auto leading-relaxed">
          {errorMsg}
        </p>
        <button
          type="button"
          onClick={clearAll}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-2xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 touch-manipulation"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Render: Initial upload (no images yet)                             */
  /* ═══════════════════════════════════════════════════════════════════ */
  if (images.length === 0) {
    return (
      <div className="space-y-5">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          capture={undefined}
          className="sr-only"
          onChange={handleFileInput}
          aria-label="Select image files"
        />

        <DropZone onFiles={addFiles} fileInputRef={fileInputRef} />

        {/* Error inline */}
        {errorMsg && (
          <div role="alert" className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Browser disclosure */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>All processing happens locally in your browser — no files are uploaded to any server.</span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Render: Main editing workspace (images loaded)                     */
  /* ═══════════════════════════════════════════════════════════════════ */
  const isLarge = totalInputSize > LARGE_FILE_WARN_BYTES;

  return (
    <div className="space-y-5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        capture={undefined}
        className="sr-only"
        onChange={handleFileInput}
        aria-label="Select image files"
      />

      {/* ── Stats bar ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {images.length} image{images.length !== 1 ? 's' : ''}
          <span className="font-normal text-slate-400 text-xs ml-1.5">({fmtBytes(totalInputSize)} total)</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Add more images"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 transition-colors touch-manipulation"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            Add More
          </button>
          <button
            type="button"
            onClick={clearAll}
            aria-label="Remove all images"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-500 hover:border-rose-400 transition-colors touch-manipulation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        </div>
      </div>

      {/* ── Large-file warning ──────────────────────────────────────── */}
      {isLarge && (
        <div role="alert" className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Total size ({fmtBytes(totalInputSize)}) is large. Conversion may be slow or fail on devices with limited memory.
            Consider fewer or smaller images.
          </span>
        </div>
      )}

      {/* ── Responsive Two-Column (Desktop) / Stacked (Mobile) Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN (Desktop): Image upload & preview cards */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          {/* Reorder hint */}
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            <span className="sm:hidden">Use ↑↓ buttons to reorder pages</span>
            <span className="hidden sm:inline">Drag rows or use ↑↓ buttons to reorder pages</span>
          </p>

          {/* Image list */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
            {images.map((entry, idx) => (
              <ThumbnailCard
                key={entry.id}
                entry={entry}
                index={idx}
                total={images.length}
                onMoveUp={() => moveUp(idx)}
                onMoveDown={() => moveDown(idx)}
                onRemove={() => removeImage(idx)}
                isDragging={draggingIdx === idx}
                isDragOver={dragOverIdx === idx && draggingIdx !== idx}
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>

          {/* Add-more compact drop zone */}
          <DropZone onFiles={addFiles} compact fileInputRef={fileInputRef} />
        </div>

        {/* RIGHT COLUMN (Desktop): PDF Settings, Image Settings, Output Info & Action */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-24">
          <SettingsPanel
            options={options}
            onChange={setOption}
            imageCount={images.length}
            totalInputSize={totalInputSize}
            outputSize={outputSize}
          />

          {/* Error */}
          {errorMsg && (
            <div role="alert" className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Conversion CTA */}
          <button
            type="button"
            onClick={convert}
            disabled={images.length === 0}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 sm:py-3.5 rounded-2xl text-base sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md transition-all touch-manipulation select-none"
          >
            Convert {images.length} Image{images.length !== 1 ? 's' : ''} to PDF
          </button>

          {/* Browser privacy disclosure */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Browser-only processing — no server upload</span>
          </div>
        </div>
      </div>
    </div>
  );
}
