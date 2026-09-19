'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ToolDefinition, CATEGORY_INFO } from '@/lib/tools-registry';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import {
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Share2,
  Check,
  Printer,
  Sparkles,
  Info,
} from 'lucide-react';

interface ToolLayoutProps {
  tool: ToolDefinition;
  children: React.ReactNode;
  onReset?: () => void;
  allowPrint?: boolean;
  educationalContent?: {
    howItWorks?: string[];
    formula?: string;
    tips?: string[];
    faqs?: { q: string; a: string }[];
  };
}

export function ToolLayout({
  tool,
  children,
  onReset,
  allowPrint = false,
  educationalContent,
}: ToolLayoutProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const categoryMeta = CATEGORY_INFO[tool.category];

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <Link href="/tools" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Tools
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <Link
          href={`/tools?category=${tool.category}`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {categoryMeta.label}
        </Link>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="text-slate-900 dark:text-slate-200 font-medium truncate">
          {tool.name}
        </span>
      </nav>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
            <DynamicIcon name={tool.icon} className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {tool.name}
              </h1>
              {tool.badge && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                  {tool.badge}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {tool.description}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Reset tool inputs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}

          {allowPrint && (
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Print page"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Copy tool link"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Verified Privacy Notice Banner */}
      <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{tool.privacyNote}</span>
        </div>
        <span className="shrink-0 text-slate-500 dark:text-slate-400 hidden sm:inline">
          Client-Side Processing &bull; Private & Secure
        </span>
      </div>

      {/* Main Tool Content */}
      <main className="py-2">{children}</main>

      {/* Educational, Formula & FAQ Section (Rich SEO & Student Utility) */}
      {educationalContent && (
        <section className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
            <Info className="w-5 h-5" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Understanding {tool.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {educationalContent.howItWorks && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/50">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  How It Works
                </h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc list-inside">
                  {educationalContent.howItWorks.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {educationalContent.formula && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/50">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Calculation Formula
                </h3>
                <pre className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-xs sm:text-sm text-slate-800 dark:text-indigo-300 overflow-x-auto whitespace-pre-wrap">
                  {educationalContent.formula}
                </pre>
              </div>
            )}
          </div>

          {educationalContent.faqs && educationalContent.faqs.length > 0 && (
            <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                Frequently Asked Questions
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {educationalContent.faqs.map((faq, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
                      {faq.q}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
