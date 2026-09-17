'use client';

import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import { CalendarDays, ArrowRight, Copy, Check, Calendar, Plus, Minus } from 'lucide-react';

export function DateCalculator() {
  const tool = getToolBySlug('date-calculator')!;

  const [activeTab, setActiveTab] = useState<'diff' | 'addSubtract'>('diff');

  // Difference tab
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  // Add/Subtract tab
  const [baseDate, setBaseDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [daysAmount, setDaysAmount] = useState<number>(45);

  const [copied, setCopied] = useState(false);

  // Date Difference calculations
  const diffResult = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);

    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

    const diffMs = Math.abs(e.getTime() - s.getTime());
    const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = (totalDays / 7).toFixed(1);

    // Business days calculation (Mon-Fri)
    let businessDays = 0;
    const cur = new Date(s < e ? s : e);
    const target = new Date(s < e ? e : s);

    while (cur < target) {
      cur.setDate(cur.getDate() + 1);
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }

    return {
      totalDays,
      totalWeeks,
      businessDays,
      weekendDays: totalDays - businessDays,
    };
  }, [startDate, endDate]);

  // Add / Subtract calculations
  const addSubtractResult = useMemo(() => {
    const b = new Date(baseDate);
    if (isNaN(b.getTime())) return null;

    const res = new Date(b);
    const amount = Number(daysAmount) || 0;

    if (operation === 'add') {
      res.setDate(res.getDate() + amount);
    } else {
      res.setDate(res.getDate() - amount);
    }

    const formatted = res.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      dateStr: res.toISOString().slice(0, 10),
      formatted,
    };
  }, [baseDate, operation, daysAmount]);

  const handleCopy = async () => {
    let text = '';
    if (activeTab === 'diff' && diffResult) {
      text = `StudentAI Date Difference:\nFrom: ${startDate} to ${endDate}\nTotal Calendar Days: ${diffResult.totalDays}\nBusiness Days: ${diffResult.businessDays}\nTotal Weeks: ${diffResult.totalWeeks}`;
    } else if (addSubtractResult) {
      text = `StudentAI Date Calculation:\n${baseDate} ${operation === 'add' ? '+' : '-'} ${daysAmount} days = ${addSubtractResult.formatted}`;
    }

    if (navigator.clipboard && text) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setBaseDate(today);
    setDaysAmount(30);
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      allowPrint={true}
      educationalContent={{
        howItWorks: [
          'Calculate total calendar days and working/business days between two academic deadlines.',
          'Add or subtract a set number of days to determine project review or exam milestone dates.',
        ],
        faqs: [
          {
            q: 'How are business days computed?',
            a: 'Business days count Mondays through Fridays, excluding weekend days (Saturdays and Sundays).',
          },
        ],
      }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Tab switch */}
        <div className="flex rounded-2xl p-1 bg-slate-100 dark:bg-slate-800/60 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab('diff')}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'diff'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Days Between Two Dates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('addSubtract')}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'addSubtract'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Add / Subtract Days
          </button>
        </div>

        {/* Tab 1: Date Difference */}
        {activeTab === 'diff' ? (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {diffResult && (
              <div className="p-8 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Duration Breakdown
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="text-center p-6 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                  <span className="text-xs uppercase tracking-widest font-semibold text-indigo-100">
                    Total Calendar Days
                  </span>
                  <div className="text-5xl font-extrabold tracking-tight mt-1">
                    {diffResult.totalDays} Days
                  </div>
                  <div className="mt-2 text-xs text-indigo-200 font-medium">
                    Approximately {diffResult.totalWeeks} Weeks
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 font-medium">Working Days (Mon-Fri)</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {diffResult.businessDays}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500 font-medium">Weekend Days</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {diffResult.weekendDays}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Add or Subtract Days */
          <div className="space-y-6">
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Starting Date
                  </label>
                  <input
                    type="date"
                    value={baseDate}
                    onChange={(e) => setBaseDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Operation
                  </label>
                  <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOperation('add')}
                      className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 ${
                        operation === 'add'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOperation('subtract')}
                      className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 ${
                        operation === 'subtract'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Subtract</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Number of Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={daysAmount}
                    onChange={(e) => setDaysAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {addSubtractResult && (
              <div className="p-8 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Computed Target Date
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="text-center p-6 rounded-2xl bg-indigo-600 text-white shadow-lg">
                  <div className="text-2xl sm:text-3xl font-extrabold">
                    {addSubtractResult.formatted}
                  </div>
                  <div className="mt-2 text-xs text-indigo-200 font-mono">
                    {addSubtractResult.dateStr}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
