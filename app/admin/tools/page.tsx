'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wrench, CheckCircle2, XCircle, Star, ExternalLink, RefreshCw } from 'lucide-react';

interface ToolItem {
  slug: string;
  name: string;
  category: string;
  route: string;
  isEnabled: boolean;
  isFeatured: boolean;
  usageCount: number;
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);

  const fetchTools = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/tools');
      if (res.ok) {
        const json = await res.json();
        setTools(json.tools || []);
      }
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const handleToggleEnable = async (tool: ToolItem) => {
    setUpdatingSlug(tool.slug);
    const newStatus = !tool.isEnabled;
    try {
      const res = await fetch('/api/admin/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: tool.slug, isEnabled: newStatus }),
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.slug === tool.slug ? { ...t, isEnabled: newStatus } : t))
        );
      }
    } catch {}
    finally {
      setUpdatingSlug(null);
    }
  };

  const handleToggleFeatured = async (tool: ToolItem) => {
    setUpdatingSlug(tool.slug);
    const newFeatured = !tool.isFeatured;
    try {
      const res = await fetch('/api/admin/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: tool.slug, isFeatured: newFeatured }),
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.slug === tool.slug ? { ...t, isFeatured: newFeatured } : t))
        );
      }
    } catch {}
    finally {
      setUpdatingSlug(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tool Management & Availability</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enable, disable, or feature individual student tools without altering source code.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTools}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tools Registered:</span>
            <span className="text-xs font-black text-slate-900 dark:text-white">{tools.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading tools registry...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Tool Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4">Usage Count</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {tools.map((t) => (
                  <tr key={t.slug} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{t.name}</span>
                        <p className="text-[10px] font-mono text-slate-400">{t.route}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-500">{t.category}</td>
                    <td className="py-3 px-4">
                      {t.isEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Enabled</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {t.isFeatured ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>Featured</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">{t.usageCount}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleEnable(t)}
                          disabled={updatingSlug === t.slug}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            t.isEnabled
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900 dark:text-rose-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 dark:text-emerald-300'
                          }`}
                        >
                          {t.isEnabled ? 'Disable' : 'Enable'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(t)}
                          disabled={updatingSlug === t.slug}
                          className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                            t.isFeatured
                              ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={t.isFeatured ? 'Unmark featured' : 'Mark as featured'}
                        >
                          <Star className={`w-3.5 h-3.5 ${t.isFeatured ? 'fill-amber-500' : ''}`} />
                        </button>

                        <Link
                          href={t.route}
                          target="_blank"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Tool Publicly"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
