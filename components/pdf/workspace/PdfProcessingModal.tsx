'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface PdfProcessingModalProps {
  isOpen: boolean;
  progress: number; // 0 to 100
  message: string;
  isIndeterminate?: boolean;
  onCancel?: () => void;
}

export function PdfProcessingModal({
  isOpen,
  progress,
  message,
  isIndeterminate = false,
  onCancel,
}: PdfProcessingModalProps) {
  if (!isOpen) return null;

  const boundedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center">
        {/* Animated Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>

        {/* Status Message */}
        <div className="space-y-1.5">
          <h3
            id="processing-modal-title"
            className="text-base sm:text-lg font-black text-slate-900 dark:text-white"
          >
            Processing Document
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {message || 'Rendering and optimizing pages…'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            {isIndeterminate ? (
              <div className="h-full bg-indigo-600 rounded-full w-1/2 animate-pulse" />
            ) : (
              <div
                role="progressbar"
                aria-valuenow={boundedProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ width: `${boundedProgress}%` }}
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              />
            )}
          </div>

          {!isIndeterminate && (
            <p className="text-xs font-mono font-bold text-slate-400">
              {boundedProgress}% complete
            </p>
          )}
        </div>

        {/* Privacy Note */}
        <p className="text-[11px] text-slate-400">
          All document processing executes directly in your browser memory.
        </p>

        {/* Cancel button if provided */}
        {onCancel && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation"
            >
              Cancel Operation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
