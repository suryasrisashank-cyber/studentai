'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TOOLS_REGISTRY, ToolDefinition } from '@/lib/tools-registry';
import { DynamicIcon } from '../ui/DynamicIcon';
import Tooltip from '@mui/material/Tooltip';
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  FileText,
  Wrench,
  Briefcase,
  Bot,
  Sparkles,
  Search,
} from 'lucide-react';

const STORAGE_COLLAPSE_KEY = 'studentai:sidebar_collapsed';

interface NavGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  slugs: string[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'academic',
    title: 'Academic',
    icon: GraduationCap,
    slugs: ['cgpa-calculator', 'percentage-calculator', 'attendance-calculator'],
  },
  {
    id: 'study',
    title: 'Study',
    icon: BookOpen,
    slugs: ['study-planner', 'pomodoro', 'quick-notes', 'todo-list'],
  },
  {
    id: 'text',
    title: 'Text & Productivity',
    icon: FileText,
    slugs: [
      'word-counter',
      'text-case-converter',
      'text-cleaner',
      'unit-converter',
      'age-calculator',
      'date-calculator',
    ],
  },
  {
    id: 'utility',
    title: 'Utility',
    icon: Wrench,
    slugs: ['password-generator', 'qr-generator', 'image-compressor', 'image-resizer'],
  },
  {
    id: 'career',
    title: 'Career',
    icon: Briefcase,
    slugs: ['resume-keyword-checker', 'job-description-analyzer', 'interview-questions'],
  },
];

export function ToolsSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Hydrate collapsed state from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COLLAPSE_KEY);
      if (saved === 'true') setIsCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_COLLAPSE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // Map slugs to registry definitions
  const toolMap = new Map<string, ToolDefinition>();
  TOOLS_REGISTRY.forEach((t) => toolMap.set(t.slug, t));

  return (
    <aside
      aria-label="StudentAI Tools Sidebar"
      className={`hidden xl:flex flex-col shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md transition-all duration-300 select-none z-30 sticky top-16 h-[calc(100vh-4rem)] ${
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Sidebar Header with Toggle */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800/80 h-14">
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tool Directory
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              20
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={toggleCollapse}
          className={`p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Search when Expanded */}
      {!isCollapsed && (
        <div className="px-3 pt-2.5 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter tools..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-transparent focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      )}

      {/* Navigation Groups List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {/* Dedicated AI Assistant Link */}
        <div className="pb-1 border-b border-slate-100 dark:border-slate-800/60">
          <Tooltip title={isCollapsed ? 'StudentAI Assistant' : ''} placement="right" arrow>
            <Link
              href="/ai"
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === '/ai'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Bot className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>AI Assistant</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200">
                    Active
                  </span>
                </div>
              )}
            </Link>
          </Tooltip>
        </div>

        {NAV_GROUPS.map((grp) => {
          const groupTools = grp.slugs
            .map((s) => toolMap.get(s))
            .filter((t): t is ToolDefinition => {
              if (!t) return false;
              if (!searchFilter.trim()) return true;
              return (
                t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                t.tags.some((tag) => tag.toLowerCase().includes(searchFilter.toLowerCase()))
              );
            });

          if (groupTools.length === 0) return null;

          return (
            <div key={grp.id} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-2 pt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <grp.icon className="w-3 h-3 text-slate-400" />
                  <span>{grp.title}</span>
                </div>
              ) : (
                <div className="w-full flex justify-center py-1 border-t border-slate-100 dark:border-slate-800/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
              )}

              <div className="space-y-0.5">
                {groupTools.map((tool) => {
                  const href = `/tools/${tool.slug}`;
                  const isActive = pathname === href;

                  const linkContent = (
                    <Link
                      key={tool.slug}
                      href={href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <div
                        className={`w-5 h-5 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <DynamicIcon name={tool.icon} className="w-4 h-4" />
                      </div>

                      {!isCollapsed && (
                        <span className="truncate flex-1">{tool.name}</span>
                      )}

                      {!isCollapsed && tool.isPopular && (
                        <span className="text-[9px] font-extrabold px-1 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                          ★
                        </span>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={tool.slug} title={tool.name} placement="right" arrow>
                        {linkContent}
                      </Tooltip>
                    );
                  }

                  return linkContent;
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 text-center">
          <span>StudentAI &bull; ₹0 Free</span>
        </div>
      )}
    </aside>
  );
}
