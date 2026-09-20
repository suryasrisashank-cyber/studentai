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
    <div className="w-full max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb Navigation — Image 1 Style */}
      <nav aria-label="Breadcrumb" className="flex items-center justify-between">
        <ol className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          <li>
            <Link
              href="/"
              className="hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Home
            </Link>
          </li>
          <li className="text-slate-400 font-light">&gt;</li>
          <li className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
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

      {/* Tool Header — Image 1 Centered Style */}
      <div className="text-center max-w-2xl mx-auto space-y-2 pt-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {tool.slug === 'jpg-to-pdf'
            ? 'JPG to PDF Converter'
            : tool.slug === 'pdf-to-jpg'
            ? 'PDF to JPG Converter'
            : tool.name.toLowerCase().includes('converter')
            ? tool.name
            : ['png-to-pdf', 'word-to-pdf', 'excel-to-pdf', 'powerpoint-to-pdf', 'html-to-pdf'].includes(tool.slug)
            ? `${tool.name} Converter`
            : tool.name}
        </h1>

        {tool.slug === 'jpg-to-pdf' ? (
          <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400 space-y-1">
            <p>Convert your JPG images to PDF format in seconds</p>
            <p>You can upload multiple images - they will be combined into one PDF</p>
          </div>
        ) : tool.slug === 'pdf-to-jpg' ? (
          <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400 space-y-1">
            <p>Convert your PDF pages to high quality JPG images in seconds</p>
            <p>You can extract all pages or select custom page ranges</p>
          </div>
        ) : tool.slug === 'merge-pdf' ? (
          <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400 space-y-1">
            <p>Combine multiple PDF files into one clean document in seconds</p>
            <p>You can upload multiple files - they will be combined into one PDF</p>
          </div>
        ) : (
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
            {tool.description}
          </p>
        )}
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

      {/* Educational & SEO Sections: How to Use + FAQ */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-8">
        {/* Step-by-Step How to Use */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              ?
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              How to Use {tool.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(tool.howToUse && tool.howToUse.length > 0
              ? tool.howToUse
              : [
                  `Select your ${tool.supportedInputTypes[0] || 'input'} file(s) from your device or drag them into the upload box.`,
                  'Adjust your preferred tool parameters and conversion settings.',
                  'Click the action button to process your document instantly in your browser.',
                  'Download your converted document with complete privacy and security.',
                ]
            ).map((step, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        {tool.faqs && tool.faqs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {tool.faqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-xs"
                >
                  <summary className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer list-none flex items-center justify-between gap-2 select-none">
                    <span>{faq.question}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm transition-transform group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  <p className="mt-2.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>

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
