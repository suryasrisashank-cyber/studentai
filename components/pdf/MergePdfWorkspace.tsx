'use client';

/**
 * MergePdfWorkspace — Fully Responsive (320px → 1440px+)
 *
 * Dedicated production workspace for merging multiple PDF documents into a single file.
 * Desktop: Two-column layout (Left: PDF file list with thumbnails & reorder; Right: summary & action).
 * Mobile: Stacked hierarchy, full-width touch-friendly cards (>=44px targets), Move Up/Down controls.
 *
 * Processing: 100% client-side in browser memory via pdf-lib and HTML5 Canvas.
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
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  GripVertical,
  Layers,
  FileOutput,
  Copy,
  CloudUpload,
  Folder,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { mergePdfs } from '@/lib/pdf/organization/merge';
import { validatePdfFile, validatePdfMagicBytes } from '@/lib/pdf/validation';
import { downloadUint8Array } from '@/lib/pdf/utils';
import { renderPageToImage } from '@/lib/pdf/core/rendering';

/* ──────────────────────────────────────────────────────────────────────────
 * Types & Constants
 * ────────────────────────────────────────────────────────────────────────── */

export interface MergePdfFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  thumbnailUrl?: string;
  bytes: Uint8Array;
}

type Status = 'idle' | 'processing' | 'ready' | 'error';

function fmtBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Main Workspace Component
 * ────────────────────────────────────────────────────────────────────────── */

export function MergePdfWorkspace() {
  const [items, setItems] = useState<MergePdfFileItem[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Result state
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);
  const [outputFilename, setOutputFilename] = useState<string>('merged_document.pdf');
  const [mergedPageCount, setMergedPageCount] = useState<number>(0);

  // Drag-and-drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Memory cleanup on unmount
  useEffect(() => {
    return () => {
      setOutputBytes(null);
    };
  }, []);

  /* ── Ingest Files ─────────────────────────────────────────────────── */
  const processFiles = useCallback(async (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setErrorMsg(null);

    const validNewItems: MergePdfFileItem[] = [];
    const errorList: string[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      try {
        const fileCheck = validatePdfFile({
          name: file.name,
          size: file.size,
          type: file.type,
        });

        if (!fileCheck.valid) {
          errorList.push(`${file.name}: ${fileCheck.error || 'Invalid PDF file'}`);
          continue;
        }

        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        const magicCheck = validatePdfMagicBytes(bytes);
        if (!magicCheck.valid) {
          errorList.push(`${file.name}: Missing valid PDF header (%PDF)`);
          continue;
        }

        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pageCount = pdfDoc.getPageCount();

        if (pageCount === 0) {
          errorList.push(`${file.name}: Document contains zero pages`);
          continue;
        }

        // Generate lightweight first-page thumbnail
        let thumbnailUrl: string | undefined;
        try {
          thumbnailUrl = await renderPageToImage(bytes, 1, 'image/jpeg', 0.35, 0.7);
        } catch {
          // Graceful fallback to document icon
        }

        validNewItems.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          pageCount,
          thumbnailUrl,
          bytes,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to read file';
        errorList.push(`${file.name}: ${msg}`);
      }
    }

    if (errorList.length > 0) {
      setErrorMsg(errorList.join(' · '));
    }

    if (validNewItems.length > 0) {
      setItems((prev) => {
        const combined = [...prev, ...validNewItems];
        // Set default output filename based on the first document name
        if (prev.length === 0 && validNewItems.length > 0) {
          const base = validNewItems[0].name.replace(/\.[^/.]+$/, '');
          setOutputFilename(`${base}_merged.pdf`);
        }
        return combined;
      });
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  /* ── Reorder & List Mutation Controls ─────────────────────────────── */
  const moveUp = (index: number) => {
    if (index <= 0) return;
    setItems((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setItems([]);
    setOutputBytes(null);
    setStatus('idle');
    setErrorMsg(null);
    setProgressPercent(0);
    setProgressMsg('');
  };

  /* ── Drag Reordering ──────────────────────────────────────────────── */
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setItems((prev) => {
      const next = [...prev];
      const item = next.splice(draggedIndex, 1)[0];
      next.splice(index, 0, item);
      return next;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  /* ── Merge Execution ──────────────────────────────────────────────── */
  const handleMerge = async () => {
    if (items.length < 2) {
      setErrorMsg('Please add at least 2 PDF documents to merge.');
      return;
    }

    setStatus('processing');
    setProgressPercent(10);
    setProgressMsg('Initializing merged document...');
    setErrorMsg(null);

    try {
      const buffers = items.map((it) => it.bytes);
      const merged = await mergePdfs(buffers, (percent, msg) => {
        setProgressPercent(percent);
        setProgressMsg(msg);
      });

      // Verify page count of output
      const resultDoc = await PDFDocument.load(merged, { ignoreEncryption: true });
      const totalPages = resultDoc.getPageCount();

      setOutputBytes(merged);
      setMergedPageCount(totalPages);
      setStatus('ready');
    } catch (err: unknown) {
      setStatus('idle');
      const msg = err instanceof Error ? err.message : 'Failed to merge PDF documents.';
      setErrorMsg(msg);
    }
  };

  /* ── Download Handler ─────────────────────────────────────────────── */
  const handleDownload = () => {
    if (outputBytes) {
      downloadUint8Array(outputBytes, outputFilename, 'application/pdf');
    }
  };

  /* ── Calculated Totals ────────────────────────────────────────────── */
  const totalInputSize = items.reduce((acc, it) => acc + it.size, 0);
  const totalInputPages = items.reduce((acc, it) => acc + it.pageCount, 0);

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
            Merging PDF Documents
          </h3>
          <p className="text-xs text-slate-500 mt-1">{progressMsg || 'Combining pages…'}</p>
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
  /*  Render: Ready / Success State                                      */
  /* ═══════════════════════════════════════════════════════════════════ */
  if (status === 'ready' && outputBytes) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">PDFs Merged Successfully!</h3>
            <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
              {outputFilename}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Combined <span className="font-bold text-slate-700 dark:text-slate-200">{items.length} files</span> into{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">{mergedPageCount} pages</span> &nbsp;·&nbsp;
              Output size: <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmtBytes(outputBytes.byteLength)}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 sm:py-3.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md transition-all touch-manipulation select-none"
            >
              <Download className="w-4 h-4" />
              <span>Download Merged PDF</span>
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors touch-manipulation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Merge More PDFs</span>
            </button>
          </div>
        </div>

        {/* Privacy verification notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Merged entirely inside your device memory with zero server upload.</span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Render: Empty State (Dropzone)                                     */
  /* ═══════════════════════════════════════════════════════════════════ */
  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="sr-only"
          onChange={handleFileInputChange}
          aria-label="Select PDF files to merge"
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
            aria-label="Upload PDF files to merge"
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
              <CloudUpload className="w-8 h-8 stroke-[2.2]" />
            </div>

            <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              Drop your PDF files here
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
              Select 2 or more PDFs to combine · Up to 50 MB per file
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
          <span>Files remain completely confidential. Merging occurs in your browser memory.</span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  Render: Populated Workspace (Desktop 2-Col / Mobile Stacked)       */
  /* ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Hidden file input for adding more files */}
      <input
        ref={addMoreInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="sr-only"
        onChange={handleFileInputChange}
        aria-label="Add more PDF files"
      />

      {/* Grid container: 1-col on mobile, 12-col on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: PDF File List & Ordering Controls */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Top action bar: File count & Add More / Clear All */}
          <div className="flex items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Documents to Merge ({items.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addMoreInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition-colors touch-manipulation"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add PDFs</span>
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors touch-manipulation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            </div>
          </div>

          {/* Instruction hint */}
          <p className="text-[11px] text-slate-400 px-1">
            Drag cards or use the <span className="font-semibold">↑</span> and <span className="font-semibold">↓</span> arrows to adjust the exact page sequence.
          </p>

          {/* Cards List */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  group relative flex items-center gap-3 p-3 sm:p-4 rounded-2xl border bg-white dark:bg-slate-900 transition-all shadow-2xs
                  ${
                    draggedIndex === index
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 scale-[1.01]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }
                `}
              >
                {/* Desktop drag handle */}
                <div
                  className="hidden sm:flex items-center text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Sequence badge */}
                <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-black flex items-center justify-center shrink-0">
                  {index + 1}
                </div>

                {/* Thumbnail preview */}
                <div className="w-12 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                {/* File Details */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                      {item.pageCount} page{item.pageCount !== 1 ? 's' : ''}
                    </span>
                    <span>·</span>
                    <span>{fmtBytes(item.size)}</span>
                  </div>
                </div>

                {/* Reorder Buttons (Move Up / Down) & Delete Button */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    aria-label={`Move ${item.name} up`}
                    className="p-2 sm:p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors touch-manipulation"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === items.length - 1}
                    aria-label={`Move ${item.name} down`}
                    className="p-2 sm:p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors touch-manipulation"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    aria-label={`Remove ${item.name}`}
                    className="p-2 sm:p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add more dropzone strip */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onClick={() => addMoreInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && addMoreInputRef.current?.click()}
            aria-label="Add more PDF files to merge"
            className={`
              p-4 border-2 border-dashed rounded-2xl text-center cursor-pointer
              transition-all touch-manipulation select-none flex items-center justify-center gap-2 text-xs font-bold
              ${
                isDraggingOver
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
              }
            `}
          >
            <Plus className="w-4 h-4" />
            <span>Drop more PDFs or click to add</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Summary & Primary Action CTA */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-24">
          {/* Summary Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <FileOutput className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                Merge Summary
              </h4>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>PDF files</span>
                <span className="font-bold">{items.length}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Combined pages</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {totalInputPages} pages
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total input size</span>
                <span className="font-bold">{fmtBytes(totalInputSize)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Merged file name
                </label>
                <input
                  type="text"
                  value={outputFilename}
                  onChange={(e) => setOutputFilename(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Warning if only 1 file */}
            {items.length === 1 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900">
                Add at least one more PDF to merge them together.
              </p>
            )}

            {/* Merge CTA */}
            <button
              type="button"
              onClick={handleMerge}
              disabled={items.length < 2}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 sm:py-3.5 rounded-2xl text-base sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md transition-all touch-manipulation select-none"
            >
              <Layers className="w-4 h-4" />
              <span>Merge {items.length} PDFs</span>
            </button>

            {/* Privacy note */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 justify-center pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>100% Client-Side · Private on-device merge</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
