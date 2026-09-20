'use client';

/**
 * PdfToJpgWorkspace — Fully Responsive (320px → 1440px)
 *
 * Dedicated professional workspace for converting PDF documents into high-resolution JPG images.
 * Desktop: Two-column layout (Left: PDF upload & interactive page selector; Right: settings & output metrics).
 * Mobile: Stacked layout with collapsible settings, touch targets >= 44px, full-width actions.
 *
 * All processing is 100% client-side inside browser memory using pdfjs-dist and HTML5 Canvas.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  Download,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  Image as ImageIcon,
  CheckSquare,
  Square,
  FileOutput,
  Layers,
  Sparkles,
  CloudUpload,
  Folder,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { convertPdfToImages, RenderedImageItem, DpiPreset } from '@/lib/pdf/conversion/pdf-to-images';
import { validatePdfFile } from '@/lib/pdf/validation';
import { downloadUint8Array, downloadBlob } from '@/lib/pdf/utils';

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────────── */

function fmtBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type Status = 'idle' | 'loading_doc' | 'configuring' | 'processing' | 'ready' | 'error';
type PageSelectionMode = 'all' | 'custom';

interface PageItem {
  pageNumber: number;
  selected: boolean;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Segment Group & Settings Section (Reusable Pattern)
 * ────────────────────────────────────────────────────────────────────────── */

function SegmentGroup<T extends string>({
  value,
  onChange,
  options,
  fullWidth = false,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; sub?: string }[];
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
            flex-1 min-w-0 px-3 py-3 sm:py-2.5 rounded-xl text-xs font-bold
            transition-all border touch-manipulation select-none flex flex-col items-center justify-center gap-0.5
            ${
              value === opt.value
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 active:bg-indigo-50'
            }
          `}
          aria-pressed={value === opt.value}
        >
          <span>{opt.label}</span>
          {opt.sub && (
            <span
              className={`text-[10px] font-normal ${
                value === opt.value ? 'text-indigo-200' : 'text-slate-400'
              }`}
            >
              {opt.sub}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

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
        <span
          className={`text-slate-400 text-xs font-bold transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Main Workspace Component
 * ────────────────────────────────────────────────────────────────────────── */

export function PdfToJpgWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageItems, setPageItems] = useState<PageItem[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings
  const [dpi, setDpi] = useState<DpiPreset>('150');
  const [quality, setQuality] = useState<'standard' | 'high'>('standard');
  const [pageMode, setPageMode] = useState<PageSelectionMode>('all');

  // Results
  const [renderedImages, setRenderedImages] = useState<RenderedImageItem[]>([]);
  const [zipBytes, setZipBytes] = useState<Uint8Array | null>(null);
  const [outputFilename, setOutputFilename] = useState<string>('');
  const [isZip, setIsZip] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const selectedPageNumbers = pageItems.filter((p) => p.selected).map((p) => p.pageNumber);
  const effectivePages = pageMode === 'all' ? Array.from({ length: totalPages }, (_, i) => i + 1) : selectedPageNumbers;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Free object memory
      setPdfBytes(null);
      setRenderedImages([]);
      setZipBytes(null);
    };
  }, []);

  /* ── Ingest PDF ───────────────────────────────────────────────────── */
  const handlePdfUpload = useCallback(async (selectedFile: File) => {
    setErrorMsg(null);
    setStatus('loading_doc');
    setProgressMsg('Verifying document...');

    try {
      const validation = validatePdfFile({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid PDF file.');
      }

      const buffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Load document to count pages
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const numPages = pdfDoc.getPageCount();

      if (numPages === 0) {
        throw new Error('This PDF contains zero pages.');
      }

      setFile(selectedFile);
      setPdfBytes(bytes);
      setTotalPages(numPages);

      // Initialize page items (all selected by default)
      setPageItems(
        Array.from({ length: numPages }, (_, i) => ({
          pageNumber: i + 1,
          selected: true,
        }))
      );

      setStatus('configuring');
    } catch (err: unknown) {
      setStatus('idle');
      const msg = err instanceof Error ? err.message : 'Failed to parse PDF document.';
      setErrorMsg(msg);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handlePdfUpload(f);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handlePdfUpload(f);
  };

  /* ── Selection controls ─────────────────────────────────────────── */
  const togglePageSelection = (pageNum: number) => {
    setPageItems((prev) =>
      prev.map((item) =>
        item.pageNumber === pageNum ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const selectAllPages = () => {
    setPageItems((prev) => prev.map((p) => ({ ...p, selected: true })));
  };

  const clearSelection = () => {
    setPageItems((prev) => prev.map((p) => ({ ...p, selected: false })));
  };

  /* ── Reset / Clear ───────────────────────────────────────────────── */
  const handleReset = () => {
    setFile(null);
    setPdfBytes(null);
    setTotalPages(0);
    setPageItems([]);
    setRenderedImages([]);
    setZipBytes(null);
    setOutputFilename('');
    setIsZip(false);
    setStatus('idle');
    setErrorMsg(null);
    setProgressPercent(0);
    setProgressMsg('');
  };

  /* ── Conversion Execution ───────────────────────────────────────── */
  const handleConvert = async () => {
    if (!pdfBytes || !file) {
      setErrorMsg('Please upload a PDF document first.');
      return;
    }

    if (effectivePages.length === 0) {
      setErrorMsg('Please select at least one page to convert to JPG.');
      return;
    }

    setStatus('processing');
    setProgressPercent(0);
    setProgressMsg('Initializing image rendering engine...');
    setErrorMsg(null);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const qualityFactor = quality === 'high' ? 0.95 : 0.85;

    try {
      const result = await convertPdfToImages(pdfBytes, {
        format: 'image/jpeg',
        dpi,
        quality: qualityFactor,
        pages: effectivePages,
        baseFilename: baseName,
        onProgress: (p, m) => {
          setProgressPercent(p);
          setProgressMsg(m);
        },
      });

      setRenderedImages(result.images);
      setIsZip(result.isZip);
      setZipBytes(result.zipBytes || null);
      setOutputFilename(result.filename);
      setStatus('ready');
    } catch (err: unknown) {
      setStatus('configuring');
      const msg = err instanceof Error ? err.message : 'Conversion failed.';
      setErrorMsg(msg);
    }
  };

  /* ── Download Handlers ───────────────────────────────────────────── */
  const downloadAll = () => {
    if (isZip && zipBytes) {
      downloadUint8Array(zipBytes, outputFilename, 'application/zip');
    } else if (renderedImages.length > 0) {
      downloadSingleImage(renderedImages[0]);
    }
  };

  const downloadSingleImage = (item: RenderedImageItem) => {
    const blob = new Blob([item.bytes as unknown as BlobPart], { type: 'image/jpeg' });
    downloadBlob(blob, item.filename);
  };

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Render: Initial Upload Screen                                      */
  /* ═══════════════════════════════════════════════════════════════════ */
  if (status === 'idle' || status === 'loading_doc') {
    return (
      <div className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={handleFileInputChange}
          aria-label="Select PDF file"
        />

        <div className="w-full max-w-2xl mx-auto rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-8">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            aria-label="Upload PDF file"
            className={`
              w-full border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer
              transition-all touch-manipulation select-none flex flex-col items-center justify-center
              ${
                isDraggingOver
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }
            `}
          >
            {/* Vibrant Blue Squircle with Cloud Upload Icon (Exact Image 1) */}
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 mb-4">
              {status === 'loading_doc' ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <CloudUpload className="w-8 h-8 stroke-[2.2]" />
              )}
            </div>

            <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              {status === 'loading_doc' ? progressMsg : 'Drop your PDF here'}
            </p>

            <span className="text-xs text-slate-400 font-medium my-2.5">or</span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-2 cursor-pointer transition-colors touch-manipulation"
            >
              <Folder className="w-4 h-4" />
              <span>Browse files</span>
            </button>

            <p className="text-xs text-slate-400 mt-5">
              .PDF · up to 50 MB
            </p>
          </div>
        </div>

        {errorMsg && (
          <div role="alert" className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Your PDF is rendered 100% locally in your browser memory — nothing is uploaded.</span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Render: Processing State                                           */
  /* ═══════════════════════════════════════════════════════════════════ */
  if (status === 'processing') {
    return (
      <div className="space-y-6 text-center py-12 px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto shadow-inner">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Converting PDF to JPG
          </h3>
          <p className="text-xs text-slate-500 mt-1">{progressMsg || 'Rendering pages…'}</p>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 font-semibold">{progressPercent}% complete</p>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Render: Success Screen                                             */
  /* ═══════════════════════════════════════════════════════════════════ */
  if (status === 'ready') {
    const totalBytes = isZip && zipBytes ? zipBytes.byteLength : renderedImages.reduce((acc, i) => acc + i.size, 0);

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Success Card */}
        <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Document Ready!</h3>
            <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
              {outputFilename}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Extracted: <span className="font-bold text-slate-700 dark:text-slate-200">{renderedImages.length} image{renderedImages.length !== 1 ? 's' : ''}</span> &nbsp;·&nbsp;
              Total size: <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmtBytes(totalBytes)}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={downloadAll}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 sm:py-3.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md transition-all touch-manipulation select-none"
            >
              <Download className="w-4 h-4" />
              <span>{isZip ? 'Download All Images (ZIP)' : 'Download JPG'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors touch-manipulation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Process Another</span>
            </button>
          </div>
        </div>

        {/* Gallery of Extracted Image Pages */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Extracted Pages ({renderedImages.length})
            </h4>
            <span className="text-[11px] text-slate-400">Click any card to download individual JPG</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderedImages.map((img) => (
              <div
                key={img.pageNumber}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl}
                    alt={`Page ${img.pageNumber}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                    Page {img.pageNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {img.filename}
                    </p>
                    <p className="text-[10px] text-slate-400">{fmtBytes(img.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadSingleImage(img)}
                    aria-label={`Download Page ${img.pageNumber} JPG`}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 dark:text-slate-300 transition-colors touch-manipulation shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Extracted and compiled entirely in your browser memory.</span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Render: Main Configuring Workspace                                 */
  /* ═══════════════════════════════════════════════════════════════════ */
  const totalInputSize = file ? file.size : 0;
  const dpiOptions = [
    { value: '150' as DpiPreset, label: '150 DPI', sub: 'Standard' },
    { value: '300' as DpiPreset, label: '300 DPI', sub: 'High Print' },
    { value: '72' as DpiPreset, label: '72 DPI', sub: 'Web / Fast' },
  ];
  const qualityOptions = [
    { value: 'standard' as const, label: 'Standard (85%)' },
    { value: 'high' as const, label: 'High (95%)' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Responsive Two-Column (Desktop) / Stacked (Mobile) Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Document Card & Interactive Page Selector */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Document Header Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {file?.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {fmtBytes(totalInputSize)} · {totalPages} page{totalPages !== 1 ? 's' : ''} detected
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors touch-manipulation shrink-0"
            >
              Change PDF
            </button>
          </div>

          {/* Page Selection Options */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Pages to Extract ({effectivePages.length} of {totalPages})
                </span>
              </div>

              {pageMode === 'custom' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllPages}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline touch-manipulation"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 touch-manipulation"
                  >
                    Deselect All
                  </button>
                </div>
              )}
            </div>

            {/* Page selection mode pills */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPageMode('all')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border touch-manipulation ${
                  pageMode === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300'
                }`}
              >
                All Pages ({totalPages})
              </button>
              <button
                type="button"
                onClick={() => setPageMode('custom')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border touch-manipulation ${
                  pageMode === 'custom'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300'
                }`}
              >
                Select Specific Pages
              </button>
            </div>

            {/* Interactive Page Checklist Grid (if custom mode) */}
            {pageMode === 'custom' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400 mb-2">Tap a page to include or exclude:</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {pageItems.map((item) => (
                    <button
                      key={item.pageNumber}
                      type="button"
                      onClick={() => togglePageSelection(item.pageNumber)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border touch-manipulation flex flex-col items-center justify-center gap-1 ${
                        item.selected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-black'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                      }`}
                    >
                      {item.selected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-300" />
                      )}
                      <span>p.{item.pageNumber}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Settings Panel & Action CTA */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-24">
          {/* Settings Sections */}
          <SettingsSection title="Image Resolution (DPI)" icon={<Settings className="w-3.5 h-3.5" />} defaultOpen>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Resolution & Sharpness
              </label>
              <SegmentGroup value={dpi} onChange={setDpi} options={dpiOptions} fullWidth />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                JPEG Compression Quality
              </label>
              <SegmentGroup value={quality} onChange={setQuality} options={qualityOptions} fullWidth />
            </div>
          </SettingsSection>

          {/* Output Summary */}
          <SettingsSection title="Output Summary" icon={<FileOutput className="w-3.5 h-3.5" />} defaultOpen>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total PDF pages</span>
                <span className="font-bold">{totalPages}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Pages to convert</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {effectivePages.length}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Output format</span>
                <span className="font-bold">
                  {effectivePages.length === 1 ? 'Single JPG (.jpg)' : 'ZIP Archive of JPGs (.zip)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Target filename</span>
                <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[170px]">
                  {effectivePages.length === 1
                    ? `${file?.name.replace(/\.[^/.]+$/, '')}_page_${effectivePages[0]}.jpg`
                    : `${file?.name.replace(/\.[^/.]+$/, '')}_images.zip`}
                </span>
              </div>
            </div>
          </SettingsSection>

          {/* Error Message */}
          {errorMsg && (
            <div role="alert" className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Convert Action Button */}
          <button
            type="button"
            onClick={handleConvert}
            disabled={effectivePages.length === 0}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 sm:py-3.5 rounded-2xl text-base sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md transition-all touch-manipulation select-none"
          >
            <ImageIcon className="w-4 h-4" />
            <span>
              Extract {effectivePages.length} Page{effectivePages.length !== 1 ? 's' : ''} to JPG
            </span>
          </button>

          {/* Browser-only disclosure */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>100% Client-Side · Private on-device extraction</span>
          </div>
        </div>
      </div>
    </div>
  );
}
