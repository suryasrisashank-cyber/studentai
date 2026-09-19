'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  Laptop,
  AlertTriangle,
  ArrowRight,
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
} from 'lucide-react';
import { PDF_TOOLS_REGISTRY, PDF_CATEGORIES } from '@/lib/pdf-tools-registry';
import { PdfToolCategory } from '@/lib/pdf/types';

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
      tool.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const categoryEntries = [
    { id: 'all', label: 'All (33)' },
    { id: 'organization', label: 'Organize (7)' },
    { id: 'conversion', label: 'Convert (10)' },
    { id: 'editing', label: 'Edit (6)' },
    { id: 'optimization', label: 'Optimize (2)' },
    { id: 'security', label: 'Security (3)' },
    { id: 'scanning', label: 'Scan & OCR (2)' },
    { id: 'ai', label: 'AI PDF (3)' },
  ];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-200">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>100% Free Client-Side Student Document Utilities</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          StudentAI PDF Tools
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Free, student-friendly tools to organize, edit, convert and understand your PDFs. Processed directly in your browser with zero server uploads.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto pt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PDF tools (e.g. merge, compress, word, ocr)..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-2 text-xs">
        {categoryEntries.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTools.map((tool) => {
          const IconComponent = ICON_MAP[tool.icon] || FileText;
          const isDisabled = disabledSlugs.includes(tool.slug);
          const isFeatured = featuredSlugs.includes(tool.slug) || tool.isPopular;

          return (
            <div
              key={tool.slug}
              className={`group relative bg-white dark:bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 shadow-2xs hover:shadow-md ${
                isDisabled
                  ? 'opacity-60 border-slate-200/60 dark:border-slate-800'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isDisabled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                        Paused
                      </span>
                    )}

                    {!isDisabled && isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        Popular
                      </span>
                    )}

                    {!isDisabled && tool.status === 'LIMITED' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Limited
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 capitalize">
                  {tool.category.replace('-', ' ')}
                </span>

                {isDisabled ? (
                  <span className="text-xs font-bold text-slate-400">Unavailable</span>
                ) : (
                  <Link
                    href={`/pdf-tools/${tool.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="py-16 text-center space-y-2">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No PDF tools found matching &quot;{search}&quot;</p>
          <button
            type="button"
            onClick={() => { setSearch(''); setSelectedCategory('all'); }}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
