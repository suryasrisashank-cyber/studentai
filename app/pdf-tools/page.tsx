'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  Layers,
  Scissors,
  Trash2,
  FileDown,
  RotateCw,
  Hash,
  FileText,
  Presentation,
  Table,
  FileCode,
  Image,
  FileImage,
  Code,
  Archive,
  Pencil,
  Stamp,
  PenTool,
  Crop,
  EyeOff,
  CheckSquare,
  Minimize2,
  Wrench,
  Lock,
  Unlock,
  GitCompare,
  Camera,
  ScanText,
  Bot,
  Languages,
  FileCode2,
  FileUp,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { PDF_TOOLS_REGISTRY, PDF_CATEGORIES } from '@/lib/pdf-tools-registry';

// Map icon strings to Lucide icon components
const ICON_MAP: Record<string, any> = {
  Merge: Layers,
  Scissors: Scissors,
  Layers: Layers,
  Trash2: Trash2,
  FileDown: FileDown,
  RotateCw: RotateCw,
  Hash: Hash,
  FileText: FileText,
  Presentation: Presentation,
  Table: Table,
  FileCode: FileCode,
  Image: Image,
  FileImage: FileImage,
  Code: Code,
  Archive: Archive,
  Pencil: Pencil,
  Stamp: Stamp,
  PenTool: PenTool,
  Crop: Crop,
  EyeOff: EyeOff,
  CheckSquare: CheckSquare,
  Minimize2: Minimize2,
  Wrench: Wrench,
  Lock: Lock,
  Unlock: Unlock,
  GitCompare: GitCompare,
  Camera: Camera,
  ScanText: ScanText,
  Bot: Bot,
  Languages: Languages,
  FileCode2: FileCode2,
  FileUp: FileUp,
  Search: Search,
  Sparkles: Sparkles,
};

export default function PdfToolsHubPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [disabledSlugs, setDisabledSlugs] = useState<string[]>([]);
  const [featuredSlugs, setFeaturedSlugs] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/site/status')
      .then((r) => r.json())
      .then((data) => {
        if (data?.disabledTools) setDisabledSlugs(data.disabledTools);
        if (data?.featuredTools) setFeaturedSlugs(data.featuredTools);
      })
      .catch(() => {});
  }, []);

  const filteredTools = PDF_TOOLS_REGISTRY.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase()) ||
      tool.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      (PDF_CATEGORIES[tool.category]?.label || '').toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'All Tools (40)' },
    { id: 'organization', label: 'Organize PDF (7)' },
    { id: 'optimize', label: 'Optimize PDF (4)' },
    { id: 'convert_to', label: 'Convert to PDF (6)' },
    { id: 'convert_from', label: 'Convert from PDF (7)' },
    { id: 'editing', label: 'Edit PDF (4)' },
    { id: 'security', label: 'PDF Security (3)' },
    { id: 'forms', label: 'PDF Forms (2)' },
    { id: 'analysis', label: 'PDF Analysis (3)' },
    { id: 'ai', label: 'AI PDF (4)' },
  ];

  // Group filtered tools by canonical category order
  const categoryOrder = [
    'organization',
    'optimize',
    'convert_to',
    'convert_from',
    'editing',
    'security',
    'forms',
    'analysis',
    'ai',
  ];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-200">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>StudentAI Document Platform &bull; 40 Production Utilities</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          StudentAI PDF Tools
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Comprehensive suite of 40 utilities to organize, convert, edit, optimize, secure, and understand PDF documents with client-side privacy.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto pt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PDF tools by name, action, or format (e.g. merge, compress, word, ocr)..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-start lg:justify-center gap-1.5 overflow-x-auto pb-2 text-xs scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Line-by-Line Tool Directory */}
      <div className="space-y-10">
        {categoryOrder.map((catId) => {
          const catInfo = PDF_CATEGORIES[catId];
          const sectionTools = filteredTools.filter((t) => t.category === catId);
          if (sectionTools.length === 0) return null;

          return (
            <div key={catId} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    {catInfo?.label || catId.toUpperCase()}
                  </h2>
                  <span className="text-xs text-slate-400 font-semibold">({sectionTools.length})</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  {catInfo?.description}
                </p>
              </div>

              {/* Line-by-Line Tool Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                {sectionTools.map((tool) => {
                  const Icon = ICON_MAP[tool.icon] || FileText;
                  const isDisabled = disabledSlugs.includes(tool.slug);
                  const isFeatured = featuredSlugs.includes(tool.slug) || tool.isPopular;

                  return (
                    <div
                      key={tool.id}
                      className={`p-4 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isDisabled ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/30' : ''
                      }`}
                    >
                      {/* Left: Icon + Title + Description */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={isDisabled ? '#' : `/pdf-tools/${tool.slug}`}
                              className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                              {tool.name}
                            </Link>

                            {/* Status Badge */}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                                tool.status === 'PRODUCTION'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                  : tool.status === 'LIMITED'
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                              }`}
                            >
                              {tool.status}
                            </span>

                            {isFeatured && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                Featured
                              </span>
                            )}

                            {tool.requiresAI && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                                AI
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Category + Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hidden md:inline">
                          {catInfo?.label}
                        </span>

                        {isDisabled ? (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed">
                            Disabled
                          </span>
                        ) : (
                          <Link
                            href={`/pdf-tools/${tool.slug}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all hover:gap-2"
                          >
                            <span>Use Tool</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredTools.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No PDF utilities found matching &ldquo;{search}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </div>

      {/* Trust & Transparency Footer Note */}
      <div className="p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Client-First Processing: Standard PDF utilities process files entirely inside your device&apos;s memory.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            Honest Limitations: Tools labeled &ldquo;LIMITED&rdquo; disclose technical boundaries and never fake compliance.
          </span>
        </div>
      </div>
    </div>
  );
}
