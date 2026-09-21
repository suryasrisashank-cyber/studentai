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
  Workflow,
  LayoutGrid,
  Star,
  Moon,
  Globe,
  Settings,
  CloudUpload,
  Folder,
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

// Stirling PDF vibrant squircle color mappings (Image 2)
function getToolBadgeColor(slug: string): string {
  switch (slug) {
    // Red / Coral (Pipeline, Multi Tool, Redact)
    case 'redact-pdf':
    case 'html-to-pdf':
      return 'bg-[#ef4444]';

    // Emerald Green (View PDF, Page Numbers, Edit, Text, Protect)
    case 'page-numbers':
      return 'bg-[#22c55e]';
    case 'edit-pdf':
    case 'scan-to-pdf':
    case 'protect-pdf':
    case 'pdf-text':
      return 'bg-[#10b981]';

    // Royal Blue (Merge, Rotate, Sign, Office converters)
    case 'merge-pdf':
    case 'rotate-pdf':
    case 'sign-pdf':
    case 'word-to-pdf':
    case 'excel-to-pdf':
    case 'powerpoint-to-pdf':
    case 'inspect-forms':
    case 'fill-pdf':
      return 'bg-[#3b82f6]';

    // Indigo / Violet (Split, Crop, Organize, Remove)
    case 'split-pdf':
    case 'crop-pdf':
    case 'organize-pdf':
    case 'remove-pages':
    case 'extract-pages':
    case 'pdf-to-pdfa':
      return 'bg-[#6366f1]';

    // Amber / Gold (Image to PDF, PDF to Image, Unlock)
    case 'jpg-to-pdf':
    case 'png-to-pdf':
    case 'pdf-to-jpg':
    case 'pdf-to-png':
    case 'unlock-pdf':
    case 'annotate-pdf':
      return 'bg-[#f59e0b]';

    // Pink / Rose (Watermark, Repair)
    case 'watermark-pdf':
    case 'repair-pdf':
      return 'bg-[#ec4899]';

    // Cyan / Sky (OCR, Compress, PDF Info)
    case 'ocr-pdf':
    case 'compress-pdf':
    case 'pdf-info':
      return 'bg-[#06b6d4]';

    // Purple / Violet (AI & Comparison Tools)
    case 'compare-pdf':
    case 'ai-pdf-summary':
    case 'ai-pdf-chat':
    case 'ai-study-guide':
    case 'ai-pdf-translate':
      return 'bg-[#8b5cf6]';

    default:
      return 'bg-[#3b82f6]';
  }
}

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

  return (
    <div className="min-h-screen bg-[#0d121c] text-slate-100 py-6 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      {/* ── Top Navigation Bar (Strict Stirling PDF Style — Image 2) ── */}
      <header className="max-w-7xl mx-auto flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-6">
          {/* Logo + Title */}
          <Link href="/pdf-tools" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-sm shadow-sm group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="text-white font-bold text-base tracking-tight">
              StudentAI PDF
            </span>
          </Link>

          {/* Quick Nav Items */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-300">
            <Link
              href="/pdf-tools"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tools</span>
            </Link>
            <Link
              href="/pdf-tools/organize-pdf"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Multi Tools</span>
            </Link>
            <Link
              href="/pdf-tools/merge-pdf"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </Link>
            <Link
              href="/pdf-tools/compress-pdf"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Compress</span>
            </Link>
            <Link
              href="/pdf-tools/split-pdf"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Split</span>
            </Link>
          </nav>
        </div>

        {/* Right Utility Icons */}
        <div className="flex items-center gap-3 text-slate-400">
          <button
            type="button"
            aria-label="Favorites"
            className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Star className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Theme toggle"
            className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Moon className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Language"
            className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Search"
            className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Hero Section (Image 2) ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto space-y-5 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-2">
            <span>40 PDF Tools</span>
            <span>•</span>
            <span>Connected to StudentAI Central Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            StudentAI PDF
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
            40 high-performance, client-side PDF utilities. Organize, convert, optimize, edit, secure, and chat with documents with 100% browser-based privacy.
          </p>
        </div>

        {/* ── Search Bar (Exact Stirling PDF Pill Style — Image 2) ──── */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for features..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#18202d] border border-slate-800 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* ── Hero Drag & Drop Upload Zone (Image 1 Style Inside) ────── */}
        <div className="pt-1">
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
              w-full p-6 sm:p-8 rounded-2xl border-2 border-dashed
              cursor-pointer transition-all touch-manipulation select-none
              ${
                isDraggingOver
                  ? 'border-blue-500 bg-blue-950/30 scale-[1.01]'
                  : 'border-slate-800 bg-[#141a24] hover:border-slate-700 hover:bg-[#18202d]'
              }
            `}
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <CloudUpload className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Drop your PDF or JPG files here or <span className="text-blue-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Images route to JPG to PDF &bull; Multiple PDFs route to Merge PDF &bull; 100% on-device
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Category Filter Tabs ──────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all touch-manipulation ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#18202d] text-slate-400 hover:text-white hover:bg-[#1f2838] border border-slate-800/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tool Cards Grid (Strict Stirling PDF Style — Image 2) ───── */}
      <main className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => {
            const Icon = ICON_MAP[tool.icon] || FileText;
            const isDisabled = disabledSlugs.includes(tool.slug);
            const badgeBg = getToolBadgeColor(tool.slug);

            return (
              <Link
                key={tool.id}
                href={isDisabled ? '#' : `/pdf-tools/${tool.slug}`}
                className={`
                  bg-[#18202d] hover:bg-[#1f2838] border border-slate-800/90 hover:border-slate-700
                  rounded-2xl p-4 transition-all duration-150 flex items-start gap-3.5 group cursor-pointer shadow-sm
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Colorful Squircle Icon (Exact Image 2) */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${badgeBg}`}
                >
                  {tool.slug === 'page-numbers' ? (
                    <span className="font-extrabold text-sm tracking-tight text-white select-none">
                      123
                    </span>
                  ) : (
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  )}
                </div>

                {/* Title & Description */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-bold text-sm tracking-tight leading-tight group-hover:text-blue-400 transition-colors">
                    {tool.name}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1 leading-snug line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Empty Search Results State ───────────────────────────── */}
        {filteredTools.length === 0 && (
          <div className="text-center py-20 space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#18202d] border border-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                No PDF tools found.
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                No tools matched &ldquo;{search}&rdquo;. Try another search keyword or browse all categories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors touch-manipulation"
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </main>

      {/* ── Smart Action Modal for Uploaded Files ───────────────────── */}
      {showActionModal && droppedFiles.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#18202d] border border-slate-800 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold">
                Select a Tool for Your Document
              </h3>
              <button
                type="button"
                onClick={() => setShowActionModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Uploaded: <span className="font-bold text-white">{droppedFiles[0]?.name}</span>
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/pdf-tools/compress-pdf"
                className="p-3 rounded-xl border border-slate-800 bg-[#141a24] hover:border-blue-500 hover:bg-[#1f2838] text-left transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-blue-400 mb-1" />
                <p className="text-xs font-bold text-white">Compress PDF</p>
                <p className="text-[10px] text-slate-400">Reduce file size</p>
              </Link>

              <Link
                href="/pdf-tools/pdf-to-jpg"
                className="p-3 rounded-xl border border-slate-800 bg-[#141a24] hover:border-blue-500 hover:bg-[#1f2838] text-left transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-amber-400 mb-1" />
                <p className="text-xs font-bold text-white">PDF to JPG</p>
                <p className="text-[10px] text-slate-400">Extract pages</p>
              </Link>

              <Link
                href="/pdf-tools/merge-pdf"
                className="p-3 rounded-xl border border-slate-800 bg-[#141a24] hover:border-blue-500 hover:bg-[#1f2838] text-left transition-colors"
              >
                <Layers className="w-4 h-4 text-blue-400 mb-1" />
                <p className="text-xs font-bold text-white">Merge PDF</p>
                <p className="text-[10px] text-slate-400">Combine files</p>
              </Link>

              <Link
                href="/pdf-tools/edit-pdf"
                className="p-3 rounded-xl border border-slate-800 bg-[#141a24] hover:border-blue-500 hover:bg-[#1f2838] text-left transition-colors"
              >
                <Pencil className="w-4 h-4 text-emerald-400 mb-1" />
                <p className="text-xs font-bold text-white">Edit PDF</p>
                <p className="text-[10px] text-slate-400">Annotate & sign</p>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Trust & Transparency Footer Note ────────────────────────── */}
      <footer className="max-w-7xl mx-auto p-4 sm:p-5 rounded-2xl border border-slate-800/80 bg-[#141a24] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Client-First Privacy: All processing happens entirely inside your browser memory with zero server uploads.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Honest Boundaries: File operations are calibrated to local device hardware limits.
          </span>
        </div>
      </footer>
    </div>
  );
}
