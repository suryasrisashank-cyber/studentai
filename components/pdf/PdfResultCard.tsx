'use client';

import React from 'react';
import { CheckCircle2, Download, RotateCcw, FileText, Archive, ArrowDownRight } from 'lucide-react';
import { formatBytes } from '@/lib/pdf/utils';

interface PdfResultCardProps {
  filename: string;
  outputBytes: Uint8Array;
  originalSize?: number;
  isZip?: boolean;
  onDownload: () => void;
  onReset: () => void;
  extraInfo?: string;
}

export function PdfResultCard({
  filename,
  outputBytes,
  originalSize,
  isZip,
  onDownload,
  onReset,
  extraInfo,
}: PdfResultCardProps) {
  const outputSize = outputBytes.length;
  const hasSizeComparison = originalSize !== undefined && originalSize > 0;
  const savedBytes = hasSizeComparison ? originalSize - outputSize : 0;
  const savedPercent = hasSizeComparison ? Math.round((savedBytes / originalSize) * 1000) / 10 : 0;

  return (
    <div className="w-full max-w-xl mx-auto py-8 px-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Document Ready!</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {extraInfo || 'Your document has been processed and is ready for immediate download.'}
        </p>
      </div>

      {/* File summary pill */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-left flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs shrink-0">
            {isZip ? <Archive className="w-5 h-5 text-amber-500" /> : <FileText className="w-5 h-5 text-indigo-500" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{filename}</p>
            <p className="text-[11px] text-slate-400 font-medium">{formatBytes(outputSize)}</p>
          </div>
        </div>

        {hasSizeComparison && savedBytes > 0 && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>-{savedPercent}%</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onDownload}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download {isZip ? 'ZIP Archive' : 'Document'}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Process Another</span>
        </button>
      </div>

      <p className="text-[10px] text-slate-400 italic">
        Downloaded directly from your browser memory. No files were uploaded or retained.
      </p>
    </div>
  );
}
