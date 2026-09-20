'use client';

/**
 * PdfWorkspace — Master Responsive Workspace Orchestrator
 *
 * Integrates:
 * - PdfWorkspaceHeader
 * - PdfWorkspaceToolbar
 * - PdfPageSidebar (Desktop left / Mobile horizontal)
 * - PdfCanvas (Document rendering surface)
 * - PdfProcessingModal
 * - PdfResultPanel
 * - PdfErrorState
 */

import React from 'react';
import { PdfToolDefinition } from '@/lib/pdf/types';
import { PdfToolMode, PdfWorkspaceState, mapSlugToToolMode } from './types';
import { PdfWorkspaceHeader } from './PdfWorkspaceHeader';
import { PdfWorkspaceToolbar } from './PdfWorkspaceToolbar';
import { PdfPageSidebar } from './PdfPageSidebar';
import { PdfCanvas } from './PdfCanvas';
import { PdfProcessingModal } from './PdfProcessingModal';
import { PdfResultPanel } from './PdfResultPanel';
import { PdfErrorState } from './PdfErrorState';

interface PdfWorkspaceProps {
  tool: PdfToolDefinition;
  state: PdfWorkspaceState;
  onAction: (actionId: string) => void;
  onSelectPage: (id: string) => void;
  onToggleSelectPage?: (id: string) => void;
  onRotatePage?: (id: string) => void;
  onDeletePage?: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onRotateDoc?: () => void;
  onReset?: () => void;
  onDownload?: () => void;
  onDismissError?: () => void;
  primaryActionLabel?: string;
  settingsContent?: React.ReactNode;
  children?: React.ReactNode;
}

export function PdfWorkspace({
  tool,
  state,
  onAction,
  onSelectPage,
  onToggleSelectPage,
  onRotatePage,
  onDeletePage,
  onSelectAll,
  onClearSelection,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRotateDoc,
  onReset,
  onDownload,
  onDismissError,
  primaryActionLabel,
  settingsContent,
  children,
}: PdfWorkspaceProps) {
  const toolMode = mapSlugToToolMode(tool.slug);
  const activePage = state.pages.find((p) => p.id === state.activePageId) || state.pages[0] || null;

  return (
    <div className="w-full flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[600px]">
      {/* 1. Header */}
      <PdfWorkspaceHeader
        title={tool.name}
        toolSlug={tool.slug}
        categoryLabel={tool.category}
        statusBadge={tool.status}
        pageCount={state.pages.length}
        zoom={state.zoom}
        rotation={state.rotation}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
        onRotateDoc={onRotateDoc}
        onReset={onReset}
        showZoomControls={state.pages.length > 0}
      />

      {/* 2. Context-Aware Toolbar */}
      <PdfWorkspaceToolbar
        toolMode={toolMode}
        onAction={onAction}
        primaryActionLabel={primaryActionLabel}
        isProcessing={state.isProcessing}
        disabledActions={state.pages.length === 0 && state.uploadedFiles.length === 0 ? ['primary-execute'] : []}
      />

      {/* 3. Error Alert (if any) */}
      {state.error && (
        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900">
          <PdfErrorState
            error={state.error}
            onDismiss={onDismissError}
            onRetry={() => onAction('primary-execute')}
          />
        </div>
      )}

      {/* 4. Processing Modal */}
      <PdfProcessingModal
        isOpen={state.isProcessing}
        progress={state.progress}
        message={state.progressMessage || 'Processing PDF…'}
      />

      {/* 5. Main Workspace Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[500px] w-full overflow-hidden">
        {/* If result is ready, present the result panel */}
        {state.result ? (
          <div className="flex-1 p-6 sm:p-12 flex items-center justify-center">
            <PdfResultPanel
              result={state.result}
              originalSize={state.uploadedFiles[0]?.size}
              onDownload={onDownload || (() => {})}
              onReset={onReset || (() => {})}
            />
          </div>
        ) : children ? (
          /* Custom Children (e.g. dropzone, camera scanner, specialized editor) */
          <div className="flex-1 p-4 sm:p-6 overflow-auto">{children}</div>
        ) : (
          /* Standard Multi-Column / Responsive Workspace */
          <>
            {/* Left Page Sidebar (only when pages exist) */}
            {state.pages.length > 0 && (
              <PdfPageSidebar
                pages={state.pages}
                activePageId={state.activePageId}
                selectedPageIds={state.selectedPageIds}
                onSelectPage={onSelectPage}
                onToggleSelectPage={onToggleSelectPage}
                onRotatePage={onRotatePage}
                onDeletePage={onDeletePage}
                onSelectAll={onSelectAll}
                onClearSelection={onClearSelection}
              />
            )}

            {/* Central Canvas */}
            <PdfCanvas
              activePage={activePage}
              zoom={state.zoom}
              rotation={state.rotation}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onResetZoom={onResetZoom}
            />

            {/* Right Settings Panel (if provided) */}
            {settingsContent && (
              <div className="p-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                {settingsContent}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
