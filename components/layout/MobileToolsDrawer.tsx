'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOOLS_REGISTRY, ToolDefinition } from '@/lib/tools-registry';
import { DynamicIcon } from '../ui/DynamicIcon';
import Drawer from '@mui/material/Drawer';
import {
  X,
  Search,
  Bot,
  GraduationCap,
  BookOpen,
  FileText,
  Wrench,
  Briefcase,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface MobileToolsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'student', label: 'Academic', icon: GraduationCap },
  { id: 'study', label: 'Study', icon: BookOpen },
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'utility', label: 'Utility', icon: Wrench },
  { id: 'career', label: 'Career', icon: Briefcase },
];

export function MobileToolsDrawer({ open, onClose }: MobileToolsDrawerProps) {
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const filteredTools = TOOLS_REGISTRY.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase()) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCat === 'all') return true;
    if (selectedCat === 'text') {
      return (
        tool.category === 'everyday' ||
        ['word-counter', 'text-case-converter', 'text-cleaner', 'unit-converter', 'age-calculator', 'date-calculator'].includes(tool.slug)
      );
    }
    if (selectedCat === 'utility') {
      return (
        tool.category === 'media' ||
        ['password-generator', 'qr-generator', 'image-compressor', 'image-resizer'].includes(tool.slug)
      );
    }
    return tool.category === selectedCat;
  });

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: '85vw',
            maxWidth: '360px',
            bgcolor: '#ffffff',
            color: '#0f172a',
          },
        },
      }}
    >
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Student<span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
              <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Suite
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close tools menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Assistant Quick Banner */}
        <div className="p-3 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border-b border-indigo-100/60 dark:border-indigo-900/40">
          <Link
            href="/ai"
            onClick={onClose}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 active:scale-[0.98] transition-transform min-h-[48px]"
          >
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5" />
              <div className="text-left">
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>StudentAI Assistant</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-white/20">AI</span>
                </div>
                <div className="text-[10px] text-indigo-100 font-medium">Conceptual learning, formulas, study advice</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-80" />
          </Link>
        </div>

        {/* PDF Tools Quick Banner */}
        <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border-b border-purple-100/60 dark:border-purple-900/40">
          <Link
            href="/pdf-tools"
            onClick={onClose}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-purple-600 text-white shadow-sm active:scale-[0.98] transition-transform min-h-[48px]"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5" />
              <div className="text-left">
                <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>StudentAI PDF Tools</span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white/20">33 Tools</span>
                </div>
                <div className="text-[10px] text-purple-100 font-medium">Merge, compress, edit, convert & OCR</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-80" />
          </Link>
        </div>

        {/* Search Input */}
        <div className="p-3 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search all 20 tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-400 min-h-[44px]"
            />
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {CATEGORY_TABS.map((cat) => {
            const isSelected = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tool List with Touch-Friendly Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 pb-1 flex justify-between">
            <span>Tools Available</span>
            <span>{filteredTools.length} of 20</span>
          </div>

          {filteredTools.map((tool) => {
            const href = `/tools/${tool.slug}`;
            const isActive = pathname === href;

            return (
              <Link
                key={tool.slug}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 p-2.5 rounded-2xl text-xs font-medium transition-colors min-h-[48px] active:bg-slate-100 dark:active:bg-slate-800 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <DynamicIcon name={tool.icon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate leading-tight">{tool.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                    {tool.description}
                  </p>
                </div>
                {tool.isPopular && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    ★
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Navigation Links */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-1 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          <Link href="/tools" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
            All Tools
          </Link>
          <Link href="/about" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
            About
          </Link>
          <Link href="/privacy" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
            Privacy
          </Link>
        </div>
      </div>
    </Drawer>
  );
}
