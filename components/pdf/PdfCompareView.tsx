'use client';

import React from 'react';
import { GitCompare, PlusCircle, MinusCircle, FileText } from 'lucide-react';
import { PdfComparisonResult } from '@/lib/pdf/security/compare';

interface PdfCompareViewProps {
  filenameA: string;
  filenameB: string;
  comparison: PdfComparisonResult;
  onReset: () => void;
}

export function PdfCompareView({ filenameA, filenameB, comparison, onReset }: PdfCompareViewProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-0.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doc A Pages</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{comparison.pageCountA}</p>
          <p className="text-[10px] text-slate-400 truncate">{filenameA}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-0.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doc B Pages</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{comparison.pageCountB}</p>
          <p className="text-[10px] text-slate-400 truncate">{filenameB}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-center space-y-0.5">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Added Text</p>
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">+{comparison.addedLinesCount}</p>
          <p className="text-[10px] text-emerald-600/80">lines added in Doc B</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center space-y-0.5">
          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Removed Text</p>
          <p className="text-xl font-black text-rose-700 dark:text-rose-300">-{comparison.removedLinesCount}</p>
          <p className="text-[10px] text-rose-600/80">lines removed from Doc A</p>
        </div>
      </div>

      {/* Side-by-side / Diff stream */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Textual Difference Highlights</h3>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700"
          >
            Compare Other Files
          </button>
        </div>

        <div className="space-y-1.5 max-h-[450px] overflow-y-auto font-mono text-xs pr-2">
          {comparison.diffLines.map((line, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl flex items-start gap-2 ${
                line.type === 'added'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900'
                  : line.type === 'removed'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-900'
                  : 'text-slate-500 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              {line.type === 'added' && <PlusCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
              {line.type === 'removed' && <MinusCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />}
              {line.type === 'unchanged' && <span className="w-3.5 shrink-0" />}
              <span className="break-all">{line.text}</span>
            </div>
          ))}

          {comparison.diffLines.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-xs">
              Both documents appear identical in extractable text!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
