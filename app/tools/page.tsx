'use client';

import React, { useState, useEffect } from 'react';
import { TOOLS_REGISTRY, CATEGORY_INFO, ToolCategory } from '@/lib/tools-registry';
import { ToolCard } from '@/components/tools/ToolCard';
import { Search, Filter, X } from 'lucide-react';

export default function ToolsDirectoryPage() {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category') as ToolCategory | null;
      if (cat && cat in CATEGORY_INFO) {
        setSelectedCategory(cat);
      }
    }
  }, []);

  const categories = Object.keys(CATEGORY_INFO) as ToolCategory[];

  const filteredTools = TOOLS_REGISTRY.filter((tool) => {
    const matchesCategory =
      selectedCategory === 'all' || tool.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          All Student Utilities
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
          Browse our suite of {TOOLS_REGISTRY.length} free, client-side tools. No account required.
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="mb-10 space-y-4">
        <div className="max-w-xl mx-auto relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools by name, topic, or keyword..."
            className="w-full pl-12 pr-10 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All Tools ({TOOLS_REGISTRY.length})
          </button>

          {categories.map((catKey) => {
            const count = TOOLS_REGISTRY.filter((t) => t.category === catKey).length;
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {CATEGORY_INFO[catKey].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
          <Filter className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            No tools found
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Try adjusting your search query or switching to another category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl hover:bg-indigo-100"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
