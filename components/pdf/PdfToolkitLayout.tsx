'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle, Sparkles, Laptop, ChevronRight } from 'lucide-react';
import { PdfToolDefinition } from '@/lib/pdf/types';
import { PDF_TOOLS_REGISTRY } from '@/lib/pdf-tools-registry';

interface PdfToolkitLayoutProps {
  tool: PdfToolDefinition;
  children: React.ReactNode;
  onReset?: () => void;
  showReset?: boolean;
}

export function PdfToolkitLayout({ tool, children, onReset, showReset }: PdfToolkitLayoutProps) {
  const isClientSide = tool.processingMode === 'client';
  const isLimited = tool.status === 'LIMITED';
  const isAi = tool.requiresAI;

  // Phase 9: Related tools (same category, exclude current, max 4)
  const relatedTools = PDF_TOOLS_REGISTRY
    .filter((t) => t.category === tool.category && t.slug !== tool.slug)
    .slice(0, 4);

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-200">
      {/* Top Breadcrumb Navigation — Phase 9 internal linking */}
      <nav aria-label="Breadcrumb" className="flex items-center justify-between">
        <ol className="flex items-center gap-1.5 text-xs">
          <li>
            <Link
              href="/"
              className="font-semibold text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors"
            >
              Home
            </Link>
          </li>
          <li><ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" /></li>
          <li>
            <Link
              href="/pdf-tools"
              className="font-semibold text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors"
            >
              PDF Tools
            </Link>
          </li>
          <li><ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" /></li>
          <li className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">
            {tool.name}
          </li>
        </ol>

        {showReset && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            Clear / Reset
          </button>
        )}
      </nav>

      {/* Tool Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {tool.badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <Sparkles className="w-3 h-3" />
              <span>{tool.badge}</span>
            </span>
          )}

          {isClientSide ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
              <Laptop className="w-3 h-3" />
              <span>Runs in your browser</span>
            </span>
          ) : isAi ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900">
              <Sparkles className="w-3 h-3" />
              <span>AI-Powered</span>
            </span>
          ) : null}

          {isLimited && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3 h-3" />
              <span>Format-Limited</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {tool.name}
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* Limitation Notice if Limited */}
      {isLimited && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="space-y-0.5">
            <p className="font-bold">Format Scope &amp; Limitation</p>
            <p className="text-[11px] leading-relaxed opacity-90">{tool.limitations}</p>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="w-full">{children}</div>

      {/* Phase 9: Related Tools Internal Links */}
      {relatedTools.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Related PDF Tools
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedTools.map((related) => (
              <Link
                key={related.slug}
                href={`/pdf-tools/${related.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xs"
              >
                {related.name}
                <ChevronRight className="w-3 h-3" />
              </Link>
            ))}
            <Link
              href="/pdf-tools"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all"
            >
              All 40 PDF Tools
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Privacy Guarantee Footer */}
      <div className="max-w-xl mx-auto pt-2 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>{tool.privacyNote}</span>
        </div>
      </div>
    </div>
  );
}
