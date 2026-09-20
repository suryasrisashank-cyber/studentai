'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Image as ImageIcon,
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
  Upload,
  Zap,
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
  Image: ImageIcon,
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
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [disabledSlugs, setDisabledSlugs] = useState<string[]>([]);
  const [featuredSlugs, setFeaturedSlugs] = useState<string[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);

  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/site/status')
      .then((r) => r.json())
      .then((data) => {
        if (data?.disabledTools) setDisabledSlugs(data.disabledTools);
        if (data?.featuredTools) setFeaturedSlugs(data.featuredTools);
      })
      .catch(() => {});
  }, []);

  // Handle hero drag & drop routing
  const handleHeroDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    handleHeroFiles(files);
  };

  const handleHeroFiles = (files: File[]) => {
    // If all are images, route to JPG to PDF
    const areAllImages = files.every((f) =>
      f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp)$/i.test(f.name)
    );
    if (areAllImages) {
      router.push('/pdf-tools/jpg-to-pdf');
      return;
    }

    // If multiple PDFs, suggest Merge PDF
    if (files.length > 1 && files.every((f) => f.name.endsWith('.pdf') || f.type === 'application/pdf')) {
      router.push('/pdf-tools/merge-pdf');
      return;
    }

    // Otherwise show smart action selector modal
    setDroppedFiles(files);
    setShowActionModal(true);
  };

  const handleHeroInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleHeroFiles(Array.from(e.target.files));
    }
  };

  // Instant client-side search across name, description, category, tags, slug
  const query = search.trim().toLowerCase();
  const filteredTools = PDF_TOOLS_REGISTRY.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;

    if (!query) return matchesCategory;

    const matchesSearch =
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.slug.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query) ||
      tool.tags.some((t) => t.toLowerCase().includes(query)) ||
      (PDF_CATEGORIES[tool.category]?.label || '').toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'All Tools (40)' },
    { id: 'organization', label: 'Organization (7)' },
    { id: 'optimize', label: 'Optimization (4)' },
    { id: 'convert_to', label: 'Convert to PDF (6)' },
    { id: 'convert_from', label: 'Convert from PDF (7)' },
    { id: 'editing', label: 'Editing (4)' },
    { id: 'security', label: 'Security (3)' },
    { id: 'forms', label: 'Forms (2)' },
    { id: 'analysis', label: 'Analysis (3)' },
    { id: 'ai', label: 'AI PDF (4)' },
  ];

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
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-200">
      {/* ── 1. Hero Section ────────────────────────────────────────────── */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>StudentAI Document Platform &bull; 40 Production Utilities</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          PDF Tools
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Comprehensive suite of 40 utilities to organize, convert, edit, optimize, secure, and understand PDF documents with complete client-side privacy.
        </p>

        {/* ── Large Drag & Drop Upload Hero Area ───────────────────────── */}
        <div className="pt-2">
          <input
            ref={heroInputRef}
            type="file"
            multiple
            accept=".pdf,image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            onChange={handleHeroInputChange}
            aria-label="Upload document to open workspace"
          />

          <div
            onDrop={handleHeroDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onClick={() => heroInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && heroInputRef.current?.click()}
            aria-label="Drag and drop PDF or image documents here"
            className={`
              w-full max-w-2xl mx-auto p-8 sm:p-10 rounded-3xl border-2 border-dashed
              cursor-pointer transition-all touch-manipulation select-none
              ${
                isDraggingOver
                  ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 shadow-xs'
              }
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                  Drop your PDF or JPG files here or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports PDF documents, JPG images, and batch uploads &bull; Fast client-side workflow
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Instant Search Input ─────────────────────────────────────── */}
        <div className="relative max-w-xl mx-auto pt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PDF tools by name, action, or format (e.g. merge, compress, jpg, ocr)..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* ── 2. Category Tabs ───────────────────────────────────────────── */}
      <div className="flex items-center justify-start lg:justify-center gap-1.5 overflow-x-auto pb-2 text-xs scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all touch-manipulation ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── 3. Tool Directory (Categorized Card Grid) ─────────────────── */}
      <div className="space-y-12">
        {categoryOrder.map((catId) => {
          const catInfo = PDF_CATEGORIES[catId];
          const sectionTools = filteredTools.filter((t) => t.category === catId);
          if (sectionTools.length === 0) return null;

          return (
            <div key={catId} className="space-y-4">
              {/* Category Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {catInfo?.label || catId.toUpperCase()}
                  </h2>
                  <span className="text-xs text-slate-400 font-bold">({sectionTools.length})</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  {catInfo?.description}
                </p>
              </div>

              {/* Responsive Cards Grid (1 col on mobile, 2 on tablet, 3 on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionTools.map((tool) => {
                  const Icon = ICON_MAP[tool.icon] || FileText;
                  const isDisabled = disabledSlugs.includes(tool.slug);
                  const isFeatured = featuredSlugs.includes(tool.slug) || tool.isPopular;

                  return (
                    <div
                      key={tool.id}
                      className={`
                        group p-5 rounded-2xl border bg-white dark:bg-slate-900 transition-all shadow-2xs flex flex-col justify-between
                        ${
                          isDisabled
                            ? 'opacity-60 border-slate-200 dark:border-slate-800'
                            : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="space-y-3">
                        {/* Top Row: Icon + Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
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
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer: Category & Use Tool Button */}
                      <div className="flex items-center justify-between gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-400 truncate">
                          {catInfo?.label}
                        </span>

                        {isDisabled ? (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed">
                            Disabled
                          </span>
                        ) : (
                          <Link
                            href={`/pdf-tools/${tool.slug}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-2xs transition-all touch-manipulation"
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

        {/* ── Empty Search Results State ─────────────────────────────── */}
        {filteredTools.length === 0 && (
          <div className="text-center py-20 space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No PDF tools found.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No tools matched &ldquo;{search}&rdquo;. Try another search keyword or browse all categories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition-colors touch-manipulation"
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </div>

      {/* ── Smart Action Modal for Uploaded Files ─────────────────────── */}
      {showActionModal && droppedFiles.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Select a Tool for Your Document
              </h3>
              <button
                type="button"
                onClick={() => setShowActionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Uploaded: <span className="font-bold text-slate-800 dark:text-slate-200">{droppedFiles[0]?.name}</span>
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/pdf-tools/compress-pdf"
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-left transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-indigo-600 mb-1" />
                <p className="text-xs font-bold">Compress PDF</p>
                <p className="text-[10px] text-slate-400">Reduce file size</p>
              </Link>

              <Link
                href="/pdf-tools/pdf-to-jpg"
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-left transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-indigo-600 mb-1" />
                <p className="text-xs font-bold">PDF to JPG</p>
                <p className="text-[10px] text-slate-400">Extract pages</p>
              </Link>

              <Link
                href="/pdf-tools/merge-pdf"
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-left transition-colors"
              >
                <Layers className="w-4 h-4 text-indigo-600 mb-1" />
                <p className="text-xs font-bold">Merge PDF</p>
                <p className="text-[10px] text-slate-400">Combine files</p>
              </Link>

              <Link
                href="/pdf-tools/edit-pdf"
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 text-left transition-colors"
              >
                <Pencil className="w-4 h-4 text-indigo-600 mb-1" />
                <p className="text-xs font-bold">Edit PDF</p>
                <p className="text-[10px] text-slate-400">Annotate & sign</p>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Trust & Transparency Footer Note ──────────────────────── */}
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
