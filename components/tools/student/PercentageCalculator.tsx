'use client';

import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import { Plus, Trash2, Copy, Check, Calculator, Award } from 'lucide-react';

interface SubjectEntry {
  id: string;
  name: string;
  obtained: number;
  total: number;
}

export function PercentageCalculator() {
  const tool = getToolBySlug('percentage-calculator')!;

  const [mode, setMode] = useState<'multi' | 'single'>('multi');

  // Single mode state
  const [singleObtained, setSingleObtained] = useState<number>(425);
  const [singleTotal, setSingleTotal] = useState<number>(500);

  // Multi mode state
  const [subjects, setSubjects] = useState<SubjectEntry[]>([
    { id: '1', name: 'Mathematics', obtained: 92, total: 100 },
    { id: '2', name: 'Physics', obtained: 85, total: 100 },
    { id: '3', name: 'Chemistry', obtained: 88, total: 100 },
    { id: '4', name: 'Computer Science', obtained: 95, total: 100 },
    { id: '5', name: 'English', obtained: 82, total: 100 },
  ]);

  const [copied, setCopied] = useState(false);

  const addSubject = () => {
    setSubjects([
      ...subjects,
      {
        id: Date.now().toString(),
        name: `Subject ${subjects.length + 1}`,
        obtained: 75,
        total: 100,
      },
    ]);
  };

  const removeSubject = (id: string) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const updateSubject = (id: string, field: keyof SubjectEntry, value: string | number) => {
    setSubjects(
      subjects.map((sub) => {
        if (sub.id === id) {
          return { ...sub, [field]: value };
        }
        return sub;
      })
    );
  };

  const handleReset = () => {
    setSingleObtained(400);
    setSingleTotal(500);
    setSubjects([
      { id: '1', name: 'Subject 1', obtained: 80, total: 100 },
      { id: '2', name: 'Subject 2', obtained: 75, total: 100 },
      { id: '3', name: 'Subject 3', obtained: 85, total: 100 },
    ]);
  };

  const result = useMemo(() => {
    if (mode === 'single') {
      const obt = Math.max(0, Number(singleObtained) || 0);
      const tot = Math.max(0.0001, Number(singleTotal) || 0);
      const pct = (obt / tot) * 100;
      let division = 'Fail';
      if (pct >= 75) division = 'Distinction';
      else if (pct >= 60) division = 'First Division';
      else if (pct >= 50) division = 'Second Division';
      else if (pct >= 35) division = 'Third Division / Pass';

      return {
        obtained: obt,
        total: tot,
        percentage: pct.toFixed(2),
        division,
      };
    } else {
      let totalObt = 0;
      let totalMax = 0;
      subjects.forEach((s) => {
        totalObt += Math.max(0, Number(s.obtained) || 0);
        totalMax += Math.max(0, Number(s.total) || 0);
      });
      const pct = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;
      let division = 'Fail';
      if (pct >= 75) division = 'Distinction';
      else if (pct >= 60) division = 'First Division';
      else if (pct >= 50) division = 'Second Division';
      else if (pct >= 35) division = 'Third Division / Pass';

      return {
        obtained: totalObt,
        total: totalMax,
        percentage: pct.toFixed(2),
        division,
      };
    }
  }, [mode, singleObtained, singleTotal, subjects]);

  const handleCopy = async () => {
    const text = `StudentAI Percentage Report:\nTotal Marks: ${result.obtained} / ${result.total}\nPercentage: ${result.percentage}%\nDivision/Grade: ${result.division}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      allowPrint={true}
      educationalContent={{
        howItWorks: [
          'Choose between Single Total mode or Multi-Subject breakdown.',
          'Percentage is computed as (Total Marks Obtained ÷ Maximum Total Marks) × 100.',
          'Standard academic divisions are classified as Distinction (≥75%), First (≥60%), Second (≥50%), and Third (≥35%).',
        ],
        formula: 'Percentage (%) = (Marks Obtained / Total Maximum Marks) × 100',
        faqs: [
          {
            q: 'Can I enter fractional or decimal marks?',
            a: 'Yes, inputs accept decimal values (e.g. 78.5 out of 80).',
          },
        ],
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mode Switcher */}
          <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/60 max-w-sm">
            <button
              type="button"
              onClick={() => setMode('multi')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'multi'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Multiple Subjects
            </button>
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'single'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Quick Total Only
            </button>
          </div>

          {mode === 'single' ? (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Marks Obtained
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={singleObtained}
                  onChange={(e) => setSingleObtained(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Maximum Total Marks
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={singleTotal}
                  onChange={(e) => setSingleTotal(parseFloat(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Subjects & Marks
                </h3>
                <span className="text-xs text-slate-500">
                  {subjects.length} subjects
                </span>
              </div>

              <div className="space-y-3">
                {subjects.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 grid grid-cols-12 gap-2 sm:gap-3 items-center"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Subject #{idx + 1}
                      </label>
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => updateSubject(sub.id, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="col-span-5 sm:col-span-3">
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Obtained
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={sub.obtained}
                        onChange={(e) =>
                          updateSubject(sub.id, 'obtained', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="col-span-5 sm:col-span-3">
                      <label className="block text-[10px] text-slate-400 mb-0.5">
                        Total Max
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={sub.total}
                        onChange={(e) =>
                          updateSubject(sub.id, 'total', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => removeSubject(sub.id)}
                        disabled={subjects.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addSubject}
                className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Result (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Score Summary
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="py-6 space-y-6">
              <div className="text-center p-6 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                <span className="text-xs uppercase tracking-widest font-semibold text-indigo-100">
                  Overall Percentage
                </span>
                <div className="text-5xl font-extrabold tracking-tight mt-1">
                  {result.percentage}%
                </div>
                <div className="mt-2 text-xs text-indigo-200 font-medium inline-flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>{result.division}</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Marks Obtained</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {result.obtained}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Total Maximum Marks</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {result.total}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Classification</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {result.division}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
