'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface PdfProgressProps {
  progress: number; // 0 to 100
  message: string;
  onCancel?: () => void;
}

export function PdfProgress({ progress, message, onCancel }: PdfProgressProps) {
  return (
    <div className="w-full max-w-xl mx-auto py-8 px-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Processing Document...</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{message}</p>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
        <span>Processing in browser</span>
        <span>{Math.round(progress)}%</span>
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 text-xs font-semibold text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
        >
          Cancel Operation
        </button>
      )}
    </div>
  );
}
