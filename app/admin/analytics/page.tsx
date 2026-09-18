'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, RefreshCw, Layers, Bot, LogIn } from 'lucide-react';

interface AnalyticsData {
  available: boolean;
  totalToolUses: number;
  totalAIRequests: number;
  totalLogins: number;
  toolBreakdown: Record<string, number>;
  range: string;
  message?: string;
}

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'all', label: 'All Time' },
];

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async (r: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const toolEntries = Object.entries(data?.toolBreakdown || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Header with Date Range Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Platform Usage Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verified aggregate metrics derived strictly from telemetry event logs.
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                range === r.id
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tool Uses</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {isLoading ? '...' : (data?.totalToolUses ?? 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Actions performed across 20 tools</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Queries</span>
            <Bot className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {isLoading ? '...' : (data?.totalAIRequests ?? 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Study assistant conversations</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Logins</span>
            <LogIn className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {isLoading ? '...' : (data?.totalLogins ?? 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Authenticated control sessions</p>
        </div>
      </div>

      {/* Tool Usage Breakdown Table / Bars */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Tool Popularity Breakdown</h3>
            <p className="text-[11px] text-slate-400">Real usage frequency by specific student utility</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Computing tool telemetry metrics...</div>
        ) : toolEntries.length === 0 ? (
          <div className="py-12 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No tool telemetry recorded yet</p>
            <p className="text-[11px] text-slate-400">
              When students open calculators or utilities, usage frequency will be displayed here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {toolEntries.map(([slug, count]) => {
              const maxCount = toolEntries[0][1] || 1;
              const percentage = Math.round((count / maxCount) * 100);

              return (
                <div key={slug} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">
                      {slug.replace(/-/g, ' ')}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">{count} uses</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
