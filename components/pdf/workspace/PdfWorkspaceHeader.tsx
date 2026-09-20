'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface PdfWorkspaceHeaderProps {
  title: string;
  toolSlug: string;
  categoryLabel?: string;
  statusBadge?: string;
  pageCount?: number;
  zoom?: number;
  rotation?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onRotateDoc?: () => void;
  onReset?: () => void;
  showZoomControls?: boolean;
}

export function PdfWorkspaceHeader({
  title,
  toolSlug,
  categoryLabel,
  statusBadge = 'PRODUCTION',
  pageCount,
  zoom = 1,
  rotation = 0,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRotateDoc,
  onReset,
  showZoomControls = false,
}: PdfWorkspaceHeaderProps) {
  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Navigation back & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/pdf-tools"
            aria-label="Back to all PDF tools"
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-manipulation shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                {title}
              </h1>

              {categoryLabel && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {categoryLabel}
                </span>
              )}

              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                  statusBadge === 'PRODUCTION'
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                }`}
              >
                {statusBadge}
              </span>
            </div>

            {pageCount !== undefined && pageCount > 0 && (
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {pageCount} page{pageCount !== 1 ? 's' : ''} detected
              </p>
            )}
          </div>
        </div>

        {/* Right: Controls (Zoom, Rotate, Reset) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {showZoomControls && (
            <div className="hidden sm:flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onZoomOut}
                aria-label="Zoom out"
                disabled={zoom <= 0.5}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-all touch-manipulation"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onResetZoom}
                aria-label="Reset zoom"
                className="px-2 py-1 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                type="button"
                onClick={onZoomIn}
                aria-label="Zoom in"
                disabled={zoom >= 2.5}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-all touch-manipulation"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {onRotateDoc && (
            <button
              type="button"
              onClick={onRotateDoc}
              aria-label="Rotate document 90 degrees clockwise"
              className="p-2 sm:p-1.5 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all touch-manipulation"
            >
              <RotateCw className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              aria-label="Start over with a new file"
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-rose-600 hover:border-rose-300 transition-all touch-manipulation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Start Over</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
