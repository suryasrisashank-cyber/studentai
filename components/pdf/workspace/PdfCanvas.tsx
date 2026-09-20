'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, FileText } from 'lucide-react';
import { PdfPage } from './types';

interface PdfCanvasProps {
  activePage?: PdfPage | null;
  zoom: number; // 0.5 to 2.5
  rotation: number; // 0, 90, 180, 270
  children?: React.ReactNode;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  isLoading?: boolean;
}

export function PdfCanvas({
  activePage,
  zoom = 1,
  rotation = 0,
  children,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isLoading = false,
}: PdfCanvasProps) {
  const combinedRotation = ((activePage?.rotation || 0) + rotation) % 360;

  return (
    <div className="relative flex-1 min-w-0 w-full h-full flex flex-col bg-slate-100/70 dark:bg-slate-950/80 overflow-auto max-w-full p-4 sm:p-6 lg:p-8 select-none">
      {/* Centered Document Viewport */}
      <div className="flex-1 flex items-center justify-center min-h-[350px] sm:min-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Rendering page canvas...</p>
          </div>
        ) : children ? (
          /* Custom Canvas Content (e.g. Annotation/Drawing/Custom Workspace) */
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
            className="transition-transform duration-150 ease-out max-w-full"
          >
            {children}
          </div>
        ) : activePage?.thumbnailUrl ? (
          /* Rendered Page Image on Canvas */
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
            className="transition-transform duration-150 ease-out max-w-full flex items-center justify-center p-2"
          >
            <div
              style={{
                transform: `rotate(${combinedRotation}deg)`,
              }}
              className="relative max-w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-transform duration-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePage.thumbnailUrl}
                alt={`Document Page ${activePage.pageNumber}`}
                className="max-h-[70vh] sm:max-h-[75vh] w-auto object-contain block"
              />
            </div>
          </div>
        ) : (
          /* Fallback Empty Canvas State */
          <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center max-w-md bg-white/50 dark:bg-slate-900/40">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {activePage ? `Page ${activePage.pageNumber}` : 'Document Canvas'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Select a page from the sidebar to inspect or modify.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Canvas Zoom Controls (Bottom Right / Center on Mobile) */}
      {(onZoomIn || onZoomOut || onResetZoom) && (
        <div className="sticky bottom-2 sm:bottom-4 self-center sm:self-end flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          {onZoomOut && (
            <button
              type="button"
              onClick={onZoomOut}
              disabled={zoom <= 0.5}
              aria-label="Zoom out"
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors touch-manipulation"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          )}

          {onResetZoom && (
            <button
              type="button"
              onClick={onResetZoom}
              aria-label="Reset zoom to 100%"
              className="px-2 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {Math.round(zoom * 100)}%
            </button>
          )}

          {onZoomIn && (
            <button
              type="button"
              onClick={onZoomIn}
              disabled={zoom >= 2.5}
              aria-label="Zoom in"
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors touch-manipulation"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
