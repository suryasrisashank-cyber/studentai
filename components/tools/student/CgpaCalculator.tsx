'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import { Plus, Trash2, Copy, Check, Calculator, BookOpen, AlertCircle } from 'lucide-react';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

interface CourseEntry {
  id: string;
  name: string;
  credits: number;
  gradePoint: number;
}

const GRADING_SYSTEMS = {
  scale10: {
    name: '10-Point Scale (CBSE / Indian Universities)',
    options: [
      { label: 'O (Outstanding) — 10', value: 10 },
      { label: 'A+ (Excellent) — 9', value: 9 },
      { label: 'A (Very Good) — 8', value: 8 },
      { label: 'B+ (Good) — 7', value: 7 },
      { label: 'B (Above Average) — 6', value: 6 },
      { label: 'C (Average) — 5', value: 5 },
      { label: 'P (Pass) — 4', value: 4 },
      { label: 'F (Fail) — 0', value: 0 },
    ],
  },
  scale4: {
    name: '4.0 Scale (US / International)',
    options: [
      { label: 'A (4.0)', value: 4.0 },
      { label: 'A- (3.7)', value: 3.7 },
      { label: 'B+ (3.3)', value: 3.3 },
      { label: 'B (3.0)', value: 3.0 },
      { label: 'B- (2.7)', value: 2.7 },
      { label: 'C+ (2.3)', value: 2.3 },
      { label: 'C (2.0)', value: 2.0 },
      { label: 'C- (1.7)', value: 1.7 },
      { label: 'D (1.0)', value: 1.0 },
      { label: 'F (0.0)', value: 0.0 },
    ],
  },
};

export function CgpaCalculator() {
  const tool = getToolBySlug('cgpa-calculator')!;

  const [scale, setScale] = useState<'scale10' | 'scale4'>('scale10');
  const [courses, setCourses] = useState<CourseEntry[]>([
    { id: '1', name: 'Mathematics I', credits: 4, gradePoint: 9 },
    { id: '2', name: 'Data Structures', credits: 4, gradePoint: 10 },
    { id: '3', name: 'Digital Logic', credits: 3, gradePoint: 8 },
    { id: '4', name: 'Physics Laboratory', credits: 2, gradePoint: 9 },
  ]);

  // Previous cumulative record (optional for calculating cumulative CGPA across semesters)
  const [hasPreviousCgpa, setHasPreviousCgpa] = useState(false);
  const [prevCgpa, setPrevCgpa] = useState<number>(8.5);
  const [prevCredits, setPrevCredits] = useState<number>(40);

  const [copied, setCopied] = useState(false);

  // Load saved state from LocalStorage on mount
  useEffect(() => {
    const saved = getStorageItem<CourseEntry[] | null>(STORAGE_KEYS.CGPA_RECORDS, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      setCourses(saved);
    }
  }, []);

  // Save to LocalStorage
  const persistCourses = (updated: CourseEntry[]) => {
    setCourses(updated);
    setStorageItem(STORAGE_KEYS.CGPA_RECORDS, updated);
  };

  const addCourse = () => {
    const newCourse: CourseEntry = {
      id: Date.now().toString(),
      name: `Subject ${courses.length + 1}`,
      credits: 3,
      gradePoint: scale === 'scale10' ? 8 : 3.0,
    };
    persistCourses([...courses, newCourse]);
  };

  const removeCourse = (id: string) => {
    if (courses.length <= 1) return;
    persistCourses(courses.filter((c) => c.id !== id));
  };

  const updateCourse = (id: string, field: keyof CourseEntry, value: string | number) => {
    const updated = courses.map((course) => {
      if (course.id === id) {
        return { ...course, [field]: value };
      }
      return course;
    });
    persistCourses(updated);
  };

  const handleReset = () => {
    const defaults: CourseEntry[] = [
      { id: '1', name: 'Subject 1', credits: 4, gradePoint: scale === 'scale10' ? 9 : 3.5 },
      { id: '2', name: 'Subject 2', credits: 3, gradePoint: scale === 'scale10' ? 8 : 3.0 },
      { id: '3', name: 'Subject 3', credits: 3, gradePoint: scale === 'scale10' ? 8 : 3.0 },
    ];
    persistCourses(defaults);
    setHasPreviousCgpa(false);
  };

  // Calculations
  const stats = useMemo(() => {
    let totalCredits = 0;
    let totalCreditPoints = 0;

    courses.forEach((c) => {
      const cr = Math.max(0, Number(c.credits) || 0);
      const gp = Math.max(0, Number(c.gradePoint) || 0);
      totalCredits += cr;
      totalCreditPoints += cr * gp;
    });

    const semesterGpa = totalCredits > 0 ? totalCreditPoints / totalCredits : 0;

    let cumulativeCgpa = semesterGpa;
    let totalAllCredits = totalCredits;

    if (hasPreviousCgpa && prevCredits > 0) {
      const priorPoints = (Number(prevCgpa) || 0) * Number(prevCredits);
      totalAllCredits = totalCredits + Number(prevCredits);
      cumulativeCgpa = totalAllCredits > 0 ? (priorPoints + totalCreditPoints) / totalAllCredits : 0;
    }

    const percentageEstimate =
      scale === 'scale10'
        ? (cumulativeCgpa * 9.5).toFixed(2)
        : ((cumulativeCgpa / 4.0) * 100).toFixed(2);

    return {
      totalCredits,
      totalCreditPoints,
      semesterGpa: semesterGpa.toFixed(2),
      cumulativeCgpa: cumulativeCgpa.toFixed(2),
      totalAllCredits,
      percentageEstimate,
    };
  }, [courses, hasPreviousCgpa, prevCgpa, prevCredits, scale]);

  const handleCopySummary = async () => {
    const text = `StudentAI CGPA Calculation Summary:\nSemester GPA: ${stats.semesterGpa}\nTotal Credits: ${stats.totalCredits}\nCumulative CGPA: ${stats.cumulativeCgpa}\nEstimated Percentage: ${stats.percentageEstimate}%`;
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
          'Enter the name, credits, and grade point received for each registered subject.',
          'Each subject’s Quality Points = Credits × Grade Point.',
          'Semester GPA = (Sum of Quality Points) ÷ (Total Semester Credits).',
          'Optionally include your previous cumulative CGPA and total credits to calculate updated overall CGPA.',
        ],
        formula:
          'GPA = Σ (Credits × Grade Point) / Σ Credits\nCumulative CGPA = (Prior Points + Semester Points) / (Prior Credits + Semester Credits)',
        faqs: [
          {
            q: 'How is percentage calculated from 10-point CGPA?',
            a: 'Many standard university systems (such as CBSE and AICTE) use Percentage = CGPA × 9.5, though individual institutions may specify custom formulas like CGPA × 10.',
          },
          {
            q: 'Does this calculator save my courses?',
            a: 'Yes, your course entries are automatically preserved in your browser LocalStorage so you do not have to retype them upon returning.',
          },
        ],
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scale Selector */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Grading System Scale
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScale('scale10')}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-medium text-left border transition-all ${
                  scale === 'scale10'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                10-Point System (O - F)
              </button>
              <button
                type="button"
                onClick={() => setScale('scale4')}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-medium text-left border transition-all ${
                  scale === 'scale4'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                4.0 System (US / 4.0 scale)
              </button>
            </div>
          </div>

          {/* Courses List */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Semester Subjects & Credits
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {courses.length} {courses.length === 1 ? 'subject' : 'subjects'}
              </span>
            </div>

            <div className="space-y-3">
              {courses.map((course, idx) => (
                <div
                  key={course.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-950/40 grid grid-cols-12 gap-2 sm:gap-3 items-center"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Subject Name #{idx + 1}
                    </label>
                    <input
                      type="text"
                      value={course.name}
                      onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                      placeholder="e.g. Algorithms"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="col-span-5 sm:col-span-3">
                    <label className="block text-[10px] text-slate-400 mb-1">Credits</label>
                    <input
                      type="number"
                      min="0.5"
                      max="20"
                      step="0.5"
                      value={course.credits}
                      onChange={(e) =>
                        updateCourse(course.id, 'credits', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="col-span-5 sm:col-span-3">
                    <label className="block text-[10px] text-slate-400 mb-1">Grade</label>
                    <select
                      value={course.gradePoint}
                      onChange={(e) =>
                        updateCourse(course.id, 'gradePoint', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {GRADING_SYSTEMS[scale].options.map((opt) => (
                        <option key={opt.label} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => removeCourse(course.id)}
                      disabled={courses.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 disabled:opacity-30 transition-colors"
                      title="Remove subject"
                      aria-label={`Remove ${course.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={addCourse}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Subject</span>
              </button>
            </div>
          </div>

          {/* Optional Cumulative CGPA toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Include Prior Semesters
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Calculate cumulative CGPA combining prior completed semesters.
                </p>
              </div>
              <input
                type="checkbox"
                id="cumulative-toggle"
                checked={hasPreviousCgpa}
                onChange={(e) => setHasPreviousCgpa(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
              />
            </div>

            {hasPreviousCgpa && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Previous Cumulative CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={scale === 'scale10' ? 10 : 4}
                    value={prevCgpa}
                    onChange={(e) => setPrevCgpa(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Total Previous Credits Earned
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={prevCredits}
                    onChange={(e) => setPrevCredits(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Result Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Grading Results
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Big Results Display */}
            <div className="py-6 space-y-6">
              <div className="text-center p-6 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                <span className="text-xs uppercase tracking-widest font-semibold text-indigo-100">
                  {hasPreviousCgpa ? 'Cumulative CGPA' : 'Semester GPA'}
                </span>
                <div className="text-5xl font-extrabold tracking-tight mt-1">
                  {hasPreviousCgpa ? stats.cumulativeCgpa : stats.semesterGpa}
                </div>
                <div className="mt-2 text-xs text-indigo-200 font-medium">
                  {scale === 'scale10' ? 'Out of 10.00' : 'Out of 4.00 scale'}
                </div>
              </div>

              {/* Detailed metrics */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Semester GPA</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {stats.semesterGpa}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Semester Credits</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {stats.totalCredits}
                  </span>
                </div>

                {hasPreviousCgpa && (
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">Total All Credits</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {stats.totalAllCredits}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Estimated Percentage</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {stats.percentageEstimate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Calculations are deterministic and client-side. Always confirm specific conversion multipliers with your university regulations.
              </span>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
