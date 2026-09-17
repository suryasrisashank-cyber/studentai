'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Calculator,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

interface SavedSubjectAttendance {
  id: string;
  name: string;
  attended: number;
  total: number;
  target: number;
}

export function AttendanceCalculator() {
  const tool = getToolBySlug('attendance-calculator')!;

  const [attended, setAttended] = useState<number>(38);
  const [total, setTotal] = useState<number>(50);
  const [target, setTarget] = useState<number>(75);

  const [copied, setCopied] = useState(false);

  // Optional multi-subject attendance tracker
  const [savedRecords, setSavedRecords] = useState<SavedSubjectAttendance[]>([]);
  const [subjectName, setSubjectName] = useState('');

  useEffect(() => {
    const saved = getStorageItem<SavedSubjectAttendance[]>(
      STORAGE_KEYS.ATTENDANCE_RECORDS,
      []
    );
    setSavedRecords(saved);
  }, []);

  const handleReset = () => {
    setAttended(30);
    setTotal(40);
    setTarget(75);
  };

  const calculation = useMemo(() => {
    const att = Math.max(0, Number(attended) || 0);
    const tot = Math.max(att, Number(total) || 0);
    const tgt = Math.min(100, Math.max(1, Number(target) || 75));

    const currentPercent = tot > 0 ? (att / tot) * 100 : 0;
    const targetDecimal = tgt / 100;

    let classesNeeded = 0;
    let classesCanMiss = 0;
    let isAboveTarget = false;

    if (currentPercent >= tgt) {
      isAboveTarget = true;
      // y <= (att - targetDecimal * tot) / targetDecimal
      if (targetDecimal > 0) {
        classesCanMiss = Math.floor((att - targetDecimal * tot) / targetDecimal);
      }
    } else {
      isAboveTarget = false;
      // x >= (targetDecimal * tot - att) / (1 - targetDecimal)
      if (targetDecimal < 1) {
        classesNeeded = Math.ceil((targetDecimal * tot - att) / (1 - targetDecimal));
      } else {
        classesNeeded = 999; // impossible to reach 100% if already missed classes
      }
    }

    return {
      attended: att,
      total: tot,
      target: tgt,
      currentPercent: currentPercent.toFixed(1),
      isAboveTarget,
      classesNeeded: Math.max(0, classesNeeded),
      classesCanMiss: Math.max(0, classesCanMiss),
    };
  }, [attended, total, target]);

  const handleSaveCurrent = () => {
    if (!subjectName.trim()) return;
    const newEntry: SavedSubjectAttendance = {
      id: Date.now().toString(),
      name: subjectName.trim(),
      attended: calculation.attended,
      total: calculation.total,
      target: calculation.target,
    };
    const updated = [...savedRecords, newEntry];
    setSavedRecords(updated);
    setStorageItem(STORAGE_KEYS.ATTENDANCE_RECORDS, updated);
    setSubjectName('');
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedRecords.filter((r) => r.id !== id);
    setSavedRecords(updated);
    setStorageItem(STORAGE_KEYS.ATTENDANCE_RECORDS, updated);
  };

  const handleCopy = async () => {
    const statusText = calculation.isAboveTarget
      ? `You can safely miss up to ${calculation.classesCanMiss} class(es) while staying above your ${calculation.target}% target.`
      : `You must attend the next ${calculation.classesNeeded} consecutive class(es) to reach your ${calculation.target}% target.`;

    const summary = `StudentAI Attendance Forecast:\nCurrent Attendance: ${calculation.currentPercent}% (${calculation.attended}/${calculation.total})\nTarget: ${calculation.target}%\n${statusText}`;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(summary);
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
          'Enter classes attended and total classes conducted so far.',
          'Specify your university or college minimum target attendance threshold (e.g. 75% or 80%).',
          'If your attendance is below target, we calculate the minimum consecutive classes you must attend.',
          'If your attendance is above target, we calculate the buffer of classes you can afford to miss.',
        ],
        formula:
          'Current % = (Attended / Total Held) × 100\nClasses to Attend = ⌈(Target% × Total - Attended) / (1 - Target%)⌉\nClasses You Can Miss = ⌊(Attended - Target% × Total) / Target%⌋',
        faqs: [
          {
            q: 'What if target attendance is 100%?',
            a: 'If you have missed even one class, mathematically you cannot reach 100% attendance again.',
          },
          {
            q: 'Can I save multiple subjects?',
            a: 'Yes, use the "Save to My Attendance Tracker" below to track attendance for individual courses locally in your browser.',
          },
        ],
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Classes Attended
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={attended}
                onChange={(e) => setAttended(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Total Classes Conducted
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={total}
                onChange={(e) => setTotal(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Target Attendance Percentage ({target}%)
                </label>
                <div className="flex gap-1.5">
                  {[75, 80, 85].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTarget(preset)}
                      className={`text-xs px-2.5 py-0.5 rounded-md font-semibold ${
                        target === preset
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="1"
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value) || 75)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Save Subject Option */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="text"
              placeholder="Save current subject (e.g. Operating Systems)..."
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              className="flex-1 w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleSaveCurrent}
              disabled={!subjectName.trim()}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0"
            >
              Save Subject
            </button>
          </div>

          {/* Saved Subject Tracker List */}
          {savedRecords.length > 0 && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-indigo-500" />
                <span>Saved Subject Trackers ({savedRecords.length})</span>
              </h4>
              <div className="space-y-2">
                {savedRecords.map((item) => {
                  const pct = ((item.attended / item.total) * 100).toFixed(1);
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        <div className="text-slate-500">
                          {item.attended}/{item.total} classes &bull; Target: {item.target}%
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-bold ${
                            Number(pct) >= item.target
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {pct}%
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(item.id)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Result Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Attendance Forecast
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
              {/* Main Badge */}
              <div
                className={`text-center p-6 rounded-2xl text-white shadow-lg ${
                  calculation.isAboveTarget
                    ? 'bg-emerald-600 shadow-emerald-500/25'
                    : 'bg-amber-600 shadow-amber-500/25'
                }`}
              >
                <span className="text-xs uppercase tracking-widest font-semibold opacity-90">
                  Current Attendance
                </span>
                <div className="text-5xl font-extrabold tracking-tight mt-1">
                  {calculation.currentPercent}%
                </div>
                <div className="mt-2 text-xs font-medium opacity-90">
                  Target: {calculation.target}%
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                  calculation.isAboveTarget
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {calculation.isAboveTarget ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    {calculation.isAboveTarget ? (
                      <p>
                        <strong>Safe Zone!</strong> You can safely miss up to{' '}
                        <strong className="underline decoration-emerald-500 decoration-2">
                          {calculation.classesCanMiss} consecutive class{calculation.classesCanMiss === 1 ? '' : 'es'}
                        </strong>{' '}
                        and still stay at or above your {calculation.target}% target.
                      </p>
                    ) : (
                      <p>
                        <strong>Action Required:</strong> You need to attend approximately{' '}
                        <strong className="underline decoration-amber-500 decoration-2">
                          {calculation.classesNeeded} consecutive class{calculation.classesNeeded === 1 ? '' : 'es'}
                        </strong>{' '}
                        to reach your {calculation.target}% target attendance.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendance metrics */}
              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>Classes Attended</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {calculation.attended} of {calculation.total}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>Classes Missed</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {calculation.total - calculation.attended}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>Buffer / Requirement</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {calculation.isAboveTarget
                      ? `+${calculation.classesCanMiss} safe skips`
                      : `-${calculation.classesNeeded} needed`}
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
