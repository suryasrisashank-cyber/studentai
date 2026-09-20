'use client';

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Type,
  PenTool,
  CheckSquare,
  Trash2,
  Download,
  ArrowUp,
  ArrowDown,
  Plus,
  Layers,
  Settings,
  Image as ImageIcon,
  Minimize2,
  ScanText,
  Sparkles,
  MessageSquare,
  BookOpen,
  Languages,
} from 'lucide-react';
import { PdfToolMode } from './types';

interface PdfWorkspaceToolbarProps {
  toolMode: PdfToolMode;
  onAction: (actionId: string) => void;
  disabledActions?: string[];
  activeAction?: string;
  primaryActionLabel?: string;
  isProcessing?: boolean;
}

export function PdfWorkspaceToolbar({
  toolMode,
  onAction,
  disabledActions = [],
  activeAction,
  primaryActionLabel,
  isProcessing = false,
}: PdfWorkspaceToolbarProps) {
  const isActionDisabled = (id: string) => disabledActions.includes(id) || isProcessing;

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-3 py-2 sm:px-6 sm:py-2.5 overflow-x-auto scrollbar-none">
      <div className="flex items-center justify-between gap-3 min-w-max">
        {/* Context-aware toolbar buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1. EDIT PDF */}
          {toolMode === 'edit' && (
            <>
              <button
                type="button"
                onClick={() => onAction('zoom-in')}
                disabled={isActionDisabled('zoom-in')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 disabled:opacity-40 transition-all touch-manipulation"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Zoom In</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('zoom-out')}
                disabled={isActionDisabled('zoom-out')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 disabled:opacity-40 transition-all touch-manipulation"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Zoom Out</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('rotate')}
                disabled={isActionDisabled('rotate')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 disabled:opacity-40 transition-all touch-manipulation"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rotate</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

              <button
                type="button"
                onClick={() => onAction('add-text')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all touch-manipulation ${
                  activeAction === 'add-text'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Add Text</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('draw')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all touch-manipulation ${
                  activeAction === 'draw'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Draw</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('add-signature')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all touch-manipulation"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Signature</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('delete-selected')}
                disabled={isActionDisabled('delete-selected')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 disabled:opacity-40 transition-all touch-manipulation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          {/* 2. ORGANIZE PDF */}
          {toolMode === 'organize' && (
            <>
              <button
                type="button"
                onClick={() => onAction('select-all')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all touch-manipulation"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Select All</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('move-up')}
                disabled={isActionDisabled('move-up')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 disabled:opacity-40 transition-all touch-manipulation"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Move Up</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('move-down')}
                disabled={isActionDisabled('move-down')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 disabled:opacity-40 transition-all touch-manipulation"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Move Down</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('rotate')}
                disabled={isActionDisabled('rotate')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 disabled:opacity-40 transition-all touch-manipulation"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('delete')}
                disabled={isActionDisabled('delete')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 disabled:opacity-40 transition-all touch-manipulation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          {/* 3. MERGE PDF */}
          {toolMode === 'merge' && (
            <>
              <button
                type="button"
                onClick={() => onAction('add-pdf')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100 transition-all touch-manipulation"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('reorder')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all touch-manipulation"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Reorder</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('clear-all')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all touch-manipulation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </>
          )}

          {/* 4. JPG TO PDF */}
          {toolMode === 'jpg-to-pdf' && (
            <>
              <button
                type="button"
                onClick={() => onAction('add-images')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100 transition-all touch-manipulation"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Images</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('settings')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all touch-manipulation"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Page & Margin Settings</span>
              </button>
            </>
          )}

          {/* 5. COMPRESS PDF */}
          {toolMode === 'compress' && (
            <>
              <button
                type="button"
                onClick={() => onAction('compression-level')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all touch-manipulation"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Compression Level</span>
              </button>
            </>
          )}

          {/* 6. OCR */}
          {toolMode === 'ocr' && (
            <>
              <button
                type="button"
                onClick={() => onAction('language')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all touch-manipulation"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Language & Quality</span>
              </button>
            </>
          )}

          {/* 7. AI PDF */}
          {['ai-summary', 'ai-chat', 'study-guide', 'translate'].includes(toolMode) && (
            <>
              <button
                type="button"
                onClick={() => onAction('ai-summary')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all touch-manipulation ${
                  toolMode === 'ai-summary'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Summary</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('ai-chat')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all touch-manipulation ${
                  toolMode === 'ai-chat'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>

              <button
                type="button"
                onClick={() => onAction('study-guide')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all touch-manipulation ${
                  toolMode === 'study-guide'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study Guide</span>
              </button>
            </>
          )}
        </div>

        {/* Primary Action Button (e.g. Apply & Download) */}
        <div className="shrink-0 pl-2">
          <button
            type="button"
            onClick={() => onAction('primary-execute')}
            disabled={isActionDisabled('primary-execute')}
            className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs transition-all touch-manipulation select-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{primaryActionLabel || 'Apply & Download'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
