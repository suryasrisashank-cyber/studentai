import React from 'react';
import Link from 'next/link';
import { ToolDefinition, CATEGORY_INFO } from '@/lib/tools-registry';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface ToolCardProps {
  tool: ToolDefinition;
}

export function ToolCard({ tool }: ToolCardProps) {
  const categoryMeta = CATEGORY_INFO[tool.category];

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-6 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-all duration-200"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
            <DynamicIcon name={tool.icon} className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {tool.badge && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                {tool.badge}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {categoryMeta.label.replace(' Tools', '')}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {tool.name}
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {tool.description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Local browser
        </span>
        <span className="font-medium text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Open Tool
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}
