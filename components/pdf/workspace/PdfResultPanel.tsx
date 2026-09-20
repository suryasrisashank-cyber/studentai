'use client';

import React from 'react';
import { CheckCircle2, Download, RefreshCw, ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import { PdfProcessingResult } from './types';

interface PdfResultPanelProps {
  result: PdfProcessingResult;
  originalSize?: number;
  onDownload: () => void;
  onReset: () => void;
  additionalActions?: React.ReactNode;
}

function fmtBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PdfResultPanel({
  result,
  originalSize,
  onDownload,
  onReset,
  additionalActions,
}: PdfResultPanelProps) {
  const sizeDiff = originalSize && originalSize > result.size ? originalSize - result.size : 0;
  const pctSavings = originalSize && sizeDiff > 0 ? Math.round((sizeDiff / originalSize) * 100) : 0;

  return (
    <div className="w-full max-w-xl mx-auto p-6 sm:p-8 rounded-3xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-center space-y-6 shadow-sm animate-in fade-in duration-200">
      {/* Success Badge */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
      </div>

      {/* Result Information */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          PDF Ready!
        </h2>
        <p className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-md mx-auto">
          {result.filename}
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {fmtBytes(result.size)}
          </span>

          {result.pageCount !== undefined && result.pageCount > 0 && (
            <>
              <span>·</span>
              <span className="font-medium">
                {result.pageCount} page{result.pageCount !== 1 ? 's' : ''}
              </span>
            </>
          )}

          {pctSavings > 0 && (
            <>
              <span>·</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                {pctSavings}% smaller
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onDownload}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 sm:py-3.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md transition-all touch-manipulation select-none"
        >
          <Download className="w-4 h-4" />
          <span>{result.isZip ? 'Download ZIP Archive' : 'Download Document'}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors touch-manipulation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Process Another</span>
        </button>
      </div>

      {additionalActions}

      {/* Privacy Guarantee Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2 border-t border-emerald-200/50 dark:border-emerald-900/40">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Generated 100% locally in your browser. No files are retained.</span>
      </div>
    </div>
  );
}
