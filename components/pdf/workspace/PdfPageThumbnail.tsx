'use client';

import React from 'react';
import { RotateCw, Trash2, Check, FileText } from 'lucide-react';
import { PdfPage } from './types';

interface PdfPageThumbnailProps {
  page: PdfPage;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  onToggleSelect?: (e: React.MouseEvent) => void;
  onRotate?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  compact?: boolean;
}

export function PdfPageThumbnail({
  page,
  isActive,
  isSelected,
  onClick,
  onToggleSelect,
  onRotate,
  onDelete,
  compact = false,
}: PdfPageThumbnailProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Page ${page.pageNumber}${isSelected ? ', selected' : ''}${isActive ? ', active' : ''}`}
      className={`
        group relative rounded-2xl border transition-all touch-manipulation select-none cursor-pointer
        ${
          isActive
            ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
            : isSelected
            ? 'border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
        }
        ${compact ? 'p-1.5' : 'p-2.5'}
      `}
    >
      {/* Thumbnail surface */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center">
        {page.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.thumbnailUrl}
            alt={`Page ${page.pageNumber}`}
            style={{ transform: `rotate(${page.rotation}deg)` }}
            className="w-full h-full object-contain transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div
            style={{ transform: `rotate(${page.rotation}deg)` }}
            className="flex flex-col items-center justify-center gap-1 text-slate-400 transition-transform duration-200"
          >
            <FileText className="w-8 h-8 stroke-1" />
            <span className="text-[10px] font-mono font-bold">p.{page.pageNumber}</span>
          </div>
        )}

        {/* Selection Checkbox Overlay */}
        {onToggleSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(e);
            }}
            aria-label={`Select page ${page.pageNumber}`}
            className={`
              absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center transition-all touch-manipulation
              ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-black/40 hover:bg-black/60 text-white/80'
              }
            `}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>
        )}

        {/* Page Number Pill */}
        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-mono font-bold shadow-xs">
          {page.pageNumber}
        </span>
      </div>

      {/* Quick Action controls (Rotate, Delete) */}
      {(onRotate || onDelete) && !compact && (
        <div className="flex items-center justify-end gap-1 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {onRotate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRotate(e);
              }}
              aria-label={`Rotate page ${page.pageNumber}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors touch-manipulation"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(e);
              }}
              aria-label={`Delete page ${page.pageNumber}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors touch-manipulation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
