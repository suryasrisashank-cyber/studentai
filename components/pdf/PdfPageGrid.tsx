'use client';

import React from 'react';
import { RotateCw, Trash2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { PageInfo } from '@/lib/pdf/types';

interface PdfPageGridProps {
  pages: PageInfo[];
  selectedIndices?: Set<number>;
  onToggleSelect?: (index: number) => void;
  onRotatePage?: (index: number, degrees: number) => void;
  onDeletePage?: (index: number) => void;
  onMovePage?: (fromIndex: number, toIndex: number) => void;
  actionLabel?: string;
}

export function PdfPageGrid({
  pages,
  selectedIndices,
  onToggleSelect,
  onRotatePage,
  onDeletePage,
  onMovePage,
}: PdfPageGridProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {pages.map((page, idx) => {
          const isSelected = selectedIndices?.has(idx);

          return (
            <div
              key={`page-${idx}-${page.rotation}`}
              className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-3 flex flex-col items-center justify-between gap-3 shadow-2xs transition-all ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Top Bar: Select checkbox & page index */}
              <div className="w-full flex items-center justify-between">
                {onToggleSelect ? (
                  <button
                    type="button"
                    onClick={() => onToggleSelect(idx)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                ) : (
                  <span />
                )}

                <span className="text-[10px] font-mono font-bold text-slate-400">
                  #{page.pageNumber}
                </span>
              </div>

              {/* Page Thumbnail / Aspect Box */}
              <div
                onClick={() => onToggleSelect && onToggleSelect(idx)}
                className="w-full aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden p-2 text-center"
              >
                {page.thumbnailUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={page.thumbnailUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="max-h-full object-contain rounded shadow-2xs transition-transform"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  />
                ) : (
                  <div
                    className="flex flex-col items-center justify-center text-slate-400 transition-transform"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  >
                    <span className="text-xs font-bold">Page {page.pageNumber}</span>
                    {page.rotation !== 0 && (
                      <span className="text-[10px] font-mono mt-0.5">{page.rotation}°</span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="w-full flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-400">
                {onMovePage && idx > 0 ? (
                  <button
                    type="button"
                    onClick={() => onMovePage(idx, idx - 1)}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700"
                    title="Move Left"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="w-5" />
                )}

                {onRotatePage && (
                  <button
                    type="button"
                    onClick={() => onRotatePage(idx, 90)}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600"
                    title="Rotate 90° Clockwise"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                )}

                {onDeletePage && (
                  <button
                    type="button"
                    onClick={() => onDeletePage(idx)}
                    className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-500"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}

                {onMovePage && idx < pages.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => onMovePage(idx, idx + 1)}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700"
                    title="Move Right"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="w-5" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
