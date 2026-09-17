'use client';

import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import { Clock, Calendar, Gift, Copy, Check, Sparkles } from 'lucide-react';

export function AgeCalculator() {
  const tool = getToolBySlug('age-calculator')!;

  const [dob, setDob] = useState<string>('2003-05-15');
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [copied, setCopied] = useState(false);

  const ageData = useMemo(() => {
    if (!dob) return null;

    const birth = new Date(dob);
    const target = new Date(targetDate || new Date().toISOString().slice(0, 10));

    if (isNaN(birth.getTime()) || isNaN(target.getTime()) || birth > target) {
      return null;
    }

    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      // Days in previous month
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Total difference in milliseconds
    const diffMs = target.getTime() - birth.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor(diffMs / (1000 * 60));

    // Next Birthday calculation
    let nextBdayYear = target.getFullYear();
    let nextBday = new Date(nextBdayYear, birth.getMonth(), birth.getDate());
    if (nextBday < target) {
      nextBdayYear += 1;
      nextBday = new Date(nextBdayYear, birth.getMonth(), birth.getDate());
    }

    const msUntilNextBday = nextBday.getTime() - target.getTime();
    const daysUntilNextBday = Math.ceil(msUntilNextBday / (1000 * 60 * 60 * 24));
    const nextBdayWeekday = nextBday.toLocaleDateString(undefined, { weekday: 'long' });

    return {
      years,
      months,
      days,
      totalDays,
      totalHours,
      totalMinutes,
      daysUntilNextBday,
      nextBdayWeekday,
    };
  }, [dob, targetDate]);

  const handleCopy = async () => {
    if (!ageData) return;
    const summary = `StudentAI Age Calculation:\nAge: ${ageData.years} Years, ${ageData.months} Months, ${ageData.days} Days\nTotal Days Lived: ${ageData.totalDays.toLocaleString()}\nNext Birthday: In ${ageData.daysUntilNextBday} days (${ageData.nextBdayWeekday})`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setDob('2003-01-01');
    setTargetDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      allowPrint={true}
      educationalContent={{
        howItWorks: [
          'Select your date of birth from the calendar picker.',
          'Optionally modify the calculation target date (defaults to today).',
          'Calculates exact chronological age accounting for leap years and differing month lengths.',
          'Computes total days lived and the exact day-of-week for your upcoming birthday.',
        ],
        faqs: [
          {
            q: 'How does it handle February and leap years?',
            a: 'The algorithm computes the exact number of days in the preceding calendar month to accurately handle leap years and variable month lengths.',
          },
        ],
      }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Input Card */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Calculate Age As Of
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Results */}
        {ageData ? (
          <div className="p-8 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Chronological Age
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

            {/* Big Age Counter Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-md">
                <div className="text-3xl sm:text-5xl font-extrabold">{ageData.years}</div>
                <span className="text-xs uppercase font-semibold tracking-wider text-indigo-100">
                  Years
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-md">
                <div className="text-3xl sm:text-5xl font-extrabold">{ageData.months}</div>
                <span className="text-xs uppercase font-semibold tracking-wider text-indigo-100">
                  Months
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-md">
                <div className="text-3xl sm:text-5xl font-extrabold">{ageData.days}</div>
                <span className="text-xs uppercase font-semibold tracking-wider text-indigo-100">
                  Days
                </span>
              </div>
            </div>

            {/* Next Birthday Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2.5">
                <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Next Birthday is on a <strong>{ageData.nextBdayWeekday}</strong> (in{' '}
                  <strong>{ageData.daysUntilNextBday} days</strong>)
                </span>
              </div>
            </div>

            {/* Lifetime Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 font-medium">Total Days Lived</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {ageData.totalDays.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 font-medium">Total Hours Lived</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {ageData.totalHours.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 font-medium">Total Minutes Lived</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {ageData.totalMinutes.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            Please enter a valid birth date that occurs before the target date.
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
