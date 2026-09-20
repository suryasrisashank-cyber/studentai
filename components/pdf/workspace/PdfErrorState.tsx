'use client';

import React from 'react';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';

interface PdfErrorStateProps {
  error: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

function sanitizeErrorMessage(rawError: string): { title: string; detail: string } {
  const lower = rawError.toLowerCase();

  // Strip stack traces or code paths if any leaked through
  const cleanMessage = rawError.split('\n')[0].replace(/at\s+.*\(.*:\d+:\d+\)/g, '').trim();

  if (lower.includes('too large') || lower.includes('size')) {
    return {
      title: 'File Size Exceeded',
      detail: cleanMessage || 'The selected file exceeds the maximum supported size for browser processing (up to 50 MB).',
    };
  }

  if (lower.includes('invalid') || lower.includes('header') || lower.includes('%pdf')) {
    return {
      title: 'Invalid PDF Document',
      detail: cleanMessage || 'The uploaded file is not a valid PDF document or its header is corrupt.',
    };
  }

  if (lower.includes('memory') || lower.includes('allocation') || lower.includes('oom')) {
    return {
      title: 'Browser Memory Limitation',
      detail: 'Your browser memory limit was reached during rendering. Try processing fewer pages or smaller images at a time.',
    };
  }

  if (lower.includes('password') || lower.includes('encrypt')) {
    return {
      title: 'Encrypted Document',
      detail: 'This document is protected with a password. Please unlock it using the Unlock PDF tool first.',
    };
  }

  if (lower.includes('format') || lower.includes('unsupported') || lower.includes('type')) {
    return {
      title: 'Unsupported File Format',
      detail: cleanMessage || 'The provided file format is not supported for this specific operation.',
    };
  }

  return {
    title: 'Processing Error',
    detail: cleanMessage || 'An unexpected issue occurred while processing the document. Please try again.',
  };
}

export function PdfErrorState({
  error,
  onDismiss,
  onRetry,
  className = '',
}: PdfErrorStateProps) {
  if (!error) return null;

  const { title, detail } = sanitizeErrorMessage(error);

  return (
    <div
      role="alert"
      className={`p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 space-y-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="text-xs sm:text-sm font-bold tracking-tight text-rose-900 dark:text-rose-100">
            {title}
          </h4>
          <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
            {detail}
          </p>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="p-1 text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 rounded-lg transition-colors touch-manipulation shrink-0"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {onRetry && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-900 dark:hover:bg-rose-800 text-rose-900 dark:text-rose-100 transition-colors touch-manipulation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
}
