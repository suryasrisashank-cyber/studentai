'use client';

import React from 'react';
import { FileText, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { formatBytes } from '@/lib/pdf/utils';

interface PdfFileListProps {
  files: File[];
  onRemove: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onAddMore?: () => void;
  allowReorder?: boolean;
}

export function PdfFileList({
  files,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddMore,
  allowReorder = true,
}: PdfFileListProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Selected Files ({files.length})
        </span>
        {onAddMore && (
          <button
            type="button"
            onClick={onAddMore}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add more</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {files.map((file, idx) => (
          <div
            key={`${file.name}-${idx}`}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {allowReorder && onMoveUp && idx > 0 && (
                <button
                  type="button"
                  onClick={() => onMoveUp(idx)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              )}

              {allowReorder && onMoveDown && idx < files.length - 1 && (
                <button
                  type="button"
                  onClick={() => onMoveDown(idx)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-500 transition-colors"
                title="Remove file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
