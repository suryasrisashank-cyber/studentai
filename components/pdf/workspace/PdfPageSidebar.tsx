'use client';

import React from 'react';
import { CheckSquare, Square, Layers } from 'lucide-react';
import { PdfPage } from './types';
import { PdfPageThumbnail } from './PdfPageThumbnail';

interface PdfPageSidebarProps {
  pages: PdfPage[];
  activePageId: string | null;
  selectedPageIds: string[];
  onSelectPage: (id: string) => void;
  onToggleSelectPage?: (id: string) => void;
  onRotatePage?: (id: string) => void;
  onDeletePage?: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}

export function PdfPageSidebar({
  pages,
  activePageId,
  selectedPageIds,
  onSelectPage,
  onToggleSelectPage,
  onRotatePage,
  onDeletePage,
  onSelectAll,
  onClearSelection,
}: PdfPageSidebarProps) {
  const allSelected = pages.length > 0 && selectedPageIds.length === pages.length;

  return (
    <>
      {/* ── DESKTOP SIDEBAR (lg: 1024px+) ───────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-slate-50/70 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 h-full shrink-0">
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-white/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Pages ({pages.length})
            </span>
          </div>

          {onToggleSelectPage && (
            <button
              type="button"
              onClick={allSelected ? onClearSelection : onSelectAll}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline touch-manipulation"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {/* Vertical Scrollable Thumbnail List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin">
          {pages.map((page) => {
            const isActive = activePageId === page.id;
            const isSelected = selectedPageIds.includes(page.id);

            return (
              <PdfPageThumbnail
                key={page.id}
                page={page}
                isActive={isActive}
                isSelected={isSelected}
                onClick={() => onSelectPage(page.id)}
                onToggleSelect={
                  onToggleSelectPage ? () => onToggleSelectPage(page.id) : undefined
                }
                onRotate={onRotatePage ? () => onRotatePage(page.id) : undefined}
                onDelete={onDeletePage ? () => onDeletePage(page.id) : undefined}
              />
            );
          })}
        </div>
      </aside>

      {/* ── MOBILE HORIZONTAL STRIP (< 1024px) ───────────────────────────── */}
      <div className="lg:hidden w-full bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 p-2.5">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Document Pages ({pages.length})
          </span>
          {onToggleSelectPage && (
            <button
              type="button"
              onClick={allSelected ? onClearSelection : onSelectAll}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400"
            >
              {allSelected ? 'Deselect' : 'Select All'}
            </button>
          )}
        </div>

        {/* Touch-scrollable horizontal filmstrip */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {pages.map((page) => {
            const isActive = activePageId === page.id;
            const isSelected = selectedPageIds.includes(page.id);

            return (
              <div key={page.id} className="w-20 shrink-0">
                <PdfPageThumbnail
                  page={page}
                  isActive={isActive}
                  isSelected={isSelected}
                  compact
                  onClick={() => onSelectPage(page.id)}
                  onToggleSelect={
                    onToggleSelectPage ? () => onToggleSelectPage(page.id) : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
