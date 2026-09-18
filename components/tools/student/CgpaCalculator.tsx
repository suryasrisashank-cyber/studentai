'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Calculator,
  BookOpen,
  AlertCircle,
  Target,
  Percent,
  Award,
  Info,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface SemesterEntry {
  id: string;
  semesterNumber: number;
  label: string;
  sgpa: number | '';
  credits: number | '';
  isCompleted: boolean;
}

export interface CourseEntry {
  id: string;
  name: string;
  credits: number;
  gradePoint: number;
}

export type CalculatorTab = 'btech-semesters' | 'subject-sgpa' | 'target-planner' | 'percentage-conversion';

export type PercentageFormulaId = 'aicte' | 'cbse' | 'direct10' | 'vtu' | 'mumbai' | 'custom';

interface PercentageFormulaConfig {
  id: PercentageFormulaId;
  name: string;
  institution: string;
  formulaStr: string;
  calculate: (cgpa: number, customOffset?: number, customMultiplier?: number) => number;
}

const PERCENTAGE_FORMULAS: PercentageFormulaConfig[] = [
  {
    id: 'aicte',
    name: 'AICTE Standard Formula',
    institution: 'All India Council for Technical Education (AICTE)',
    formulaStr: 'Percentage = (CGPA - 0.75) × 10',
    calculate: (cgpa) => Math.max(0, Math.min(100, (cgpa - 0.75) * 10)),
  },
  {
    id: 'cbse',
    name: 'CBSE / 9.5x Scale',
    institution: 'CBSE & Central Universities',
    formulaStr: 'Percentage = CGPA × 9.5',
    calculate: (cgpa) => Math.max(0, Math.min(100, cgpa * 9.5)),
  },
  {
    id: 'vtu',
    name: 'VTU Formula',
    institution: 'Visvesvaraya Technological University',
    formulaStr: 'Percentage = (CGPA - 0.75) × 10',
    calculate: (cgpa) => Math.max(0, Math.min(100, (cgpa - 0.75) * 10)),
  },
  {
    id: 'mumbai',
    name: 'Mumbai University (Engineering)',
    institution: 'University of Mumbai',
    formulaStr: 'Percentage = 7.1 × CGPA + 12 (if CGPA ≥ 7.0)',
    calculate: (cgpa) => {
      if (cgpa >= 7.0) return Math.min(100, 7.1 * cgpa + 12);
      return Math.max(0, 7.25 * cgpa + 11);
    },
  },
  {
    id: 'direct10',
    name: 'Direct 10x Multiplier',
    institution: 'Autonomous Institutions / Standard Decimal',
    formulaStr: 'Percentage = CGPA × 10',
    calculate: (cgpa) => Math.max(0, Math.min(100, cgpa * 10)),
  },
  {
    id: 'custom',
    name: 'Custom Institution Formula',
    institution: 'Your College / Autonomous University',
    formulaStr: 'Percentage = (CGPA - Offset) × Multiplier',
    calculate: (cgpa, offset = 0.75, multiplier = 10) =>
      Math.max(0, Math.min(100, (cgpa - offset) * multiplier)),
  },
];

const GRADING_SYSTEMS = {
  scale10: {
    name: '10-Point Scale (CBSE / Indian Universities / B.Tech)',
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

// Default standard B.Tech 8 semesters schema (typical ~20-22 credits per semester)
const DEFAULT_BTECH_SEMESTERS: SemesterEntry[] = [
  { id: 'sem-1', semesterNumber: 1, label: 'Semester 1', sgpa: 8.5, credits: 20, isCompleted: true },
  { id: 'sem-2', semesterNumber: 2, label: 'Semester 2', sgpa: 8.75, credits: 20, isCompleted: true },
  { id: 'sem-3', semesterNumber: 3, label: 'Semester 3', sgpa: 8.4, credits: 22, isCompleted: true },
  { id: 'sem-4', semesterNumber: 4, label: 'Semester 4', sgpa: 8.8, credits: 22, isCompleted: true },
  { id: 'sem-5', semesterNumber: 5, label: 'Semester 5', sgpa: '', credits: 22, isCompleted: false },
  { id: 'sem-6', semesterNumber: 6, label: 'Semester 6', sgpa: '', credits: 22, isCompleted: false },
  { id: 'sem-7', semesterNumber: 7, label: 'Semester 7', sgpa: '', credits: 20, isCompleted: false },
  { id: 'sem-8', semesterNumber: 8, label: 'Semester 8', sgpa: '', credits: 18, isCompleted: false },
];

export function CgpaCalculator() {
  const tool = getToolBySlug('cgpa-calculator')!;

  const [activeTab, setActiveTab] = useState<CalculatorTab>('btech-semesters');

  // --- 1. B.Tech Semesters State ---
  const [semesters, setSemesters] = useState<SemesterEntry[]>(DEFAULT_BTECH_SEMESTERS);
  const [selectedFormulaId, setSelectedFormulaId] = useState<PercentageFormulaId>('aicte');
  const [customOffset, setCustomOffset] = useState<number>(0.75);
  const [customMultiplier, setCustomMultiplier] = useState<number>(10);

  // --- 2. Subject-wise SGPA State ---
  const [scale, setScale] = useState<'scale10' | 'scale4'>('scale10');
  const [courses, setCourses] = useState<CourseEntry[]>([
    { id: '1', name: 'Engineering Mathematics I', credits: 4, gradePoint: 9 },
    { id: '2', name: 'Data Structures & Algorithms', credits: 4, gradePoint: 10 },
    { id: '3', name: 'Digital Logic Design', credits: 3, gradePoint: 8 },
    { id: '4', name: 'Programming Lab', credits: 2, gradePoint: 9 },
  ]);
  const [hasPreviousCgpa, setHasPreviousCgpa] = useState(false);
  const [prevCgpa, setPrevCgpa] = useState<number>(8.5);
  const [prevCredits, setPrevCredits] = useState<number>(40);

  // --- 3. Target CGPA Planner State ---
  const [targetPlanner, setTargetPlanner] = useState({
    currentCgpa: 8.2,
    completedCredits: 84,
    targetCgpa: 8.75,
    remainingCredits: 76,
  });

  // --- 4. Interactive Percentage Quick Converter State ---
  const [quickCgpaInput, setQuickCgpaInput] = useState<number>(8.5);

  const [copied, setCopied] = useState(false);

  // Load saved state from LocalStorage on mount
  useEffect(() => {
    const savedSemesters = getStorageItem<SemesterEntry[] | null>(STORAGE_KEYS.BTECH_SEMESTERS, null);
    if (savedSemesters && Array.isArray(savedSemesters) && savedSemesters.length > 0) {
      setSemesters(savedSemesters);
    }
    const savedCourses = getStorageItem<CourseEntry[] | null>(STORAGE_KEYS.CGPA_RECORDS, null);
    if (savedCourses && Array.isArray(savedCourses) && savedCourses.length > 0) {
      setCourses(savedCourses);
    }
  }, []);

  // Save Semesters to LocalStorage
  const persistSemesters = (updated: SemesterEntry[]) => {
    setSemesters(updated);
    setStorageItem(STORAGE_KEYS.BTECH_SEMESTERS, updated);
  };

  // Save Courses to LocalStorage
  const persistCourses = (updated: CourseEntry[]) => {
    setCourses(updated);
    setStorageItem(STORAGE_KEYS.CGPA_RECORDS, updated);
  };

  // --- Handlers for Semesters ---
  const updateSemester = (id: string, field: keyof SemesterEntry, value: any) => {
    const updated = semesters.map((sem) => {
      if (sem.id === id) {
        let safeVal = value;
        if (field === 'sgpa') {
          if (value === '') safeVal = '';
          else {
            const num = parseFloat(value);
            safeVal = isNaN(num) ? '' : Math.min(10.0, Math.max(0.0, num));
          }
        } else if (field === 'credits') {
          if (value === '') safeVal = '';
          else {
            const num = parseFloat(value);
            safeVal = isNaN(num) ? '' : Math.max(0, num);
          }
        }
        return { ...sem, [field]: safeVal };
      }
      return sem;
    });
    persistSemesters(updated);
  };

  const addSemester = () => {
    const nextNum = semesters.length + 1;
    const newSem: SemesterEntry = {
      id: `sem-${Date.now()}`,
      semesterNumber: nextNum,
      label: `Semester ${nextNum}`,
      sgpa: '',
      credits: 20,
      isCompleted: false,
    };
    persistSemesters([...semesters, newSem]);
  };

  const removeSemester = (id: string) => {
    if (semesters.length <= 1) return;
    const filtered = semesters.filter((s) => s.id !== id);
    // Re-index remaining semesters
    const reindexed = filtered.map((s, idx) => ({
      ...s,
      semesterNumber: idx + 1,
      label: s.label.startsWith('Semester ') ? `Semester ${idx + 1}` : s.label,
    }));
    persistSemesters(reindexed);
  };

  const resetSemesters = () => {
    persistSemesters(DEFAULT_BTECH_SEMESTERS);
  };

  // --- Handlers for Courses (SGPA tab) ---
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

  const resetCourses = () => {
    const defaults: CourseEntry[] = [
      { id: '1', name: 'Subject 1', credits: 4, gradePoint: scale === 'scale10' ? 9 : 3.5 },
      { id: '2', name: 'Subject 2', credits: 3, gradePoint: scale === 'scale10' ? 8 : 3.0 },
      { id: '3', name: 'Subject 3', credits: 3, gradePoint: scale === 'scale10' ? 8 : 3.0 },
    ];
    persistCourses(defaults);
    setHasPreviousCgpa(false);
  };

  // --- Calculations for B.Tech Semester CGPA ---
  const btechStats = useMemo(() => {
    let totalCompletedCredits = 0;
    let totalQualityPoints = 0;
    let completedSemCount = 0;

    semesters.forEach((sem) => {
      const cr = typeof sem.credits === 'number' ? sem.credits : parseFloat(String(sem.credits)) || 0;
      const sgpa = typeof sem.sgpa === 'number' ? sem.sgpa : parseFloat(String(sem.sgpa)) || 0;

      // Only count semesters marked completed or where user entered a valid positive SGPA and credit
      if (sem.isCompleted && cr > 0 && sem.sgpa !== '' && sgpa >= 0) {
        totalCompletedCredits += cr;
        totalQualityPoints += cr * sgpa;
        completedSemCount++;
      }
    });

    const cgpa = totalCompletedCredits > 0 ? totalQualityPoints / totalCompletedCredits : 0;
    const activeFormula = PERCENTAGE_FORMULAS.find((f) => f.id === selectedFormulaId) || PERCENTAGE_FORMULAS[0];
    const percentage = activeFormula.calculate(cgpa, customOffset, customMultiplier);

    let classification = 'Pass';
    if (cgpa >= 8.5) classification = 'First Class with Distinction';
    else if (cgpa >= 6.5) classification = 'First Class';
    else if (cgpa >= 5.5) classification = 'Higher Second Class';
    else if (cgpa >= 5.0) classification = 'Second Class';
    else if (cgpa > 0) classification = 'Pass Class';
    else classification = '—';

    return {
      totalCompletedCredits,
      totalQualityPoints,
      completedSemCount,
      cgpaFloat: cgpa,
      cgpa2Dec: cgpa.toFixed(2),
      cgpa3Dec: cgpa.toFixed(3),
      percentage: percentage.toFixed(2),
      classification,
      activeFormula,
    };
  }, [semesters, selectedFormulaId, customOffset, customMultiplier]);

  // --- Calculations for Subject-wise SGPA ---
  const courseStats = useMemo(() => {
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

  // --- Calculations for Target CGPA Planner ---
  const targetStats = useMemo(() => {
    const { currentCgpa, completedCredits, targetCgpa, remainingCredits } = targetPlanner;
    const curC = Math.max(0, Number(completedCredits) || 0);
    const curG = Math.max(0, Math.min(10, Number(currentCgpa) || 0));
    const tarG = Math.max(0, Math.min(10, Number(targetCgpa) || 0));
    const remC = Math.max(0, Number(remainingCredits) || 0);

    const totalCredits = curC + remC;
    if (remC <= 0 || totalCredits <= 0) {
      return {
        isPossible: false,
        requiredSgpa: 0,
        maxPossibleCgpa: curG.toFixed(2),
        message: 'Please enter valid completed and remaining credits greater than 0.',
        status: 'invalid',
      };
    }

    const curPoints = curC * curG;
    const targetPoints = tarG * totalCredits;
    const neededPoints = targetPoints - curPoints;
    const requiredSgpa = neededPoints / remC;

    const maxPoints = curPoints + remC * 10.0;
    const maxPossibleCgpa = (maxPoints / totalCredits).toFixed(2);

    if (requiredSgpa > 10.0) {
      return {
        isPossible: false,
        requiredSgpa: requiredSgpa.toFixed(2),
        maxPossibleCgpa,
        message: `Mathematically unreachable (requires SGPA of ${requiredSgpa.toFixed(2)} > 10.0). Maximum possible CGPA is ${maxPossibleCgpa}.`,
        status: 'impossible',
      };
    }

    if (requiredSgpa <= 0) {
      return {
        isPossible: true,
        requiredSgpa: '0.00',
        maxPossibleCgpa,
        message: 'Target already secured! Even with minimum passing grade, your overall CGPA will meet your goal.',
        status: 'achieved',
      };
    }

    let difficulty = 'Moderate';
    if (requiredSgpa >= 9.0) difficulty = 'Extremely Challenging (Near-perfect 9+ SGPA needed)';
    else if (requiredSgpa >= 8.0) difficulty = 'High (Requires consistent A+ grades)';
    else if (requiredSgpa >= 7.0) difficulty = 'Manageable with steady study';

    return {
      isPossible: true,
      requiredSgpa: requiredSgpa.toFixed(2),
      maxPossibleCgpa,
      difficulty,
      message: `You need to score an average of ${requiredSgpa.toFixed(2)} SGPA across your remaining ${remC} credits.`,
      status: 'feasible',
    };
  }, [targetPlanner]);

  // Copy Summary Handler
  const handleCopySummary = async () => {
    let text = '';
    if (activeTab === 'btech-semesters') {
      text = `=== StudentAI B.Tech CGPA Calculation ===\n` +
        `Cumulative CGPA: ${btechStats.cgpa2Dec} / 10.00 (${btechStats.cgpa3Dec} exact)\n` +
        `Completed Semesters: ${btechStats.completedSemCount}\n` +
        `Total Credits Earned: ${btechStats.totalCompletedCredits}\n` +
        `Equivalent Percentage: ${btechStats.percentage}% (${btechStats.activeFormula.name})\n` +
        `Classification: ${btechStats.classification}\n\n` +
        `Semester Breakdown:\n` +
        semesters
          .filter((s) => s.isCompleted)
          .map((s) => `• ${s.label}: SGPA ${s.sgpa} (${s.credits} Credits)`)
          .join('\n');
    } else if (activeTab === 'subject-sgpa') {
      text = `=== StudentAI Subject SGPA Summary ===\n` +
        `Semester GPA: ${courseStats.semesterGpa}\n` +
        `Total Semester Credits: ${courseStats.totalCredits}\n` +
        (hasPreviousCgpa ? `Overall Cumulative CGPA: ${courseStats.cumulativeCgpa}\nTotal Credits: ${courseStats.totalAllCredits}\n` : '') +
        `Estimated Percentage: ${courseStats.percentageEstimate}%`;
    } else if (activeTab === 'target-planner') {
      text = `=== StudentAI Target CGPA Plan ===\n` +
        `Current CGPA: ${targetPlanner.currentCgpa} (${targetPlanner.completedCredits} credits)\n` +
        `Target CGPA: ${targetPlanner.targetCgpa}\n` +
        `Remaining Credits: ${targetPlanner.remainingCredits}\n` +
        `Required SGPA: ${targetStats.requiredSgpa}\n` +
        `Max Possible CGPA: ${targetStats.maxPossibleCgpa}\n` +
        `Feasibility: ${targetStats.message}`;
    } else {
      text = `=== StudentAI CGPA Percentage Conversion ===\n` +
        `CGPA: ${quickCgpaInput}\n` +
        PERCENTAGE_FORMULAS.map(
          (f) => `• ${f.name} (${f.institution}): ${f.calculate(quickCgpaInput, customOffset, customMultiplier).toFixed(2)}%`
        ).join('\n');
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={() => {
        if (activeTab === 'btech-semesters') resetSemesters();
        else if (activeTab === 'subject-sgpa') resetCourses();
      }}
      allowPrint={true}
      educationalContent={{
        howItWorks: [
          'B.Tech CGPA is calculated as a credit-weighted average: CGPA = Σ(SGPA_i × Credits_i) / Σ(Credits_i).',
          'Each semester’s contribution to overall CGPA depends directly on the number of credits allotted to that semester.',
          'Never average SGPAs with a simple arithmetic mean if semester credit totals differ.',
          'Always verify percentage conversion with your university regulations (e.g. AICTE (CGPA - 0.75) × 10 vs CBSE 9.5x).',
        ],
        formula:
          'B.Tech CGPA = Σ(SGPA_i × Credits_i) / Σ(Credits_i)\nRequired SGPA = [Target_CGPA × (Completed_Credits + Remaining_Credits) - Current_CGPA × Completed_Credits] / Remaining_Credits\nAICTE Percentage = (CGPA - 0.75) × 10',
        faqs: [
          {
            q: 'Why should I calculate credit-weighted CGPA instead of simple average?',
            a: 'In engineering (B.Tech / B.E.) programs, different semesters often have different total credits (e.g., 20 credits in Sem 1 vs 24 in Sem 3 or 16 in final Sem 8). A simple arithmetic average skews the final grade point.',
          },
          {
            q: 'How do I convert B.Tech 10-point CGPA to percentage for placements / higher studies?',
            a: 'AICTE officially recommends: Percentage = (CGPA - 0.75) × 10. However, CBSE uses CGPA × 9.5, Mumbai University uses a linear piecewise formula, and some colleges use a direct 10x multiplier. StudentAI allows you to select the exact formula specified by your university.',
          },
          {
            q: 'How does the Target CGPA Planner work?',
            a: 'It determines the exact average SGPA you must score across all your remaining credits to reach your dream CGPA before graduation, and alerts you if the target is mathematically impossible.',
          },
          {
            q: 'Are my entered grades and semester records kept private?',
            a: 'Yes! StudentAI calculations are processed strictly client-side inside your browser. No grades, credits, or personal academic records are sent to any remote server.',
          },
        ],
      }}
    >
      {/* Navigation Tabs Header */}
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap gap-2 sm:gap-4 -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab('btech-semesters')}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'btech-semesters'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>B.Tech Semester CGPA</span>
            <span className="ml-1 text-[10px] py-0.5 px-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
              1–8 Sems
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subject-sgpa')}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'subject-sgpa'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subject-wise SGPA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('target-planner')}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'target-planner'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Target CGPA Planner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('percentage-conversion')}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'percentage-conversion'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Percentage Conversion</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: B.TECH SEMESTER-WISE CGPA (PRIMARY MODE) */}
      {/* ========================================================================= */}
      {activeTab === 'btech-semesters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Semesters Input List (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Semester SGPAs & Allotted Credits</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Toggle completed semesters. Formula: CGPA = Σ(SGPA × Credits) / Σ(Credits)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetSemesters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Semester Rows */}
              <div className="space-y-3">
                {semesters.map((sem) => (
                  <div
                    key={sem.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      sem.isCompleted
                        ? 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10'
                        : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-3 items-center">
                      {/* Checkbox & Semester Label */}
                      <div className="col-span-12 sm:col-span-4 flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`completed-${sem.id}`}
                          checked={sem.isCompleted}
                          onChange={(e) => updateSemester(sem.id, 'isCompleted', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                        />
                        <label
                          htmlFor={`completed-${sem.id}`}
                          className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          {sem.label}
                        </label>
                      </div>

                      {/* SGPA Input */}
                      <div className="col-span-6 sm:col-span-4">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                            SGPA:
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={sem.sgpa}
                            disabled={!sem.isCompleted}
                            onChange={(e) => updateSemester(sem.id, 'sgpa', e.target.value)}
                            placeholder="e.g. 8.5"
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40"
                          />
                        </div>
                      </div>

                      {/* Credits Input */}
                      <div className="col-span-5 sm:col-span-3">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                            Credits:
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="40"
                            value={sem.credits}
                            disabled={!sem.isCompleted}
                            onChange={(e) => updateSemester(sem.id, 'credits', e.target.value)}
                            placeholder="20"
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40"
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeSemester(sem.id)}
                          disabled={semesters.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 disabled:opacity-20 transition-colors"
                          title="Remove Semester"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Semester Button */}
              <button
                type="button"
                onClick={addSemester}
                className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Semester (e.g. Semester {semesters.length + 1})</span>
              </button>

              {/* Percentage Formula Selection Banner */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Percentage Conversion Formula
                </label>
                <select
                  value={selectedFormulaId}
                  onChange={(e) => setSelectedFormulaId(e.target.value as PercentageFormulaId)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20"
                >
                  {PERCENTAGE_FORMULAS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.formulaStr} ({f.institution})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Select your university board formula for accurate percentage conversion on results.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Cumulative CGPA Result Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm space-y-6">
              {/* Header & Copy */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    B.Tech CGPA Scorecard
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Big Score Hero Box */}
              <div className="text-center p-6 rounded-3xl bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 space-y-1">
                <span className="text-[11px] uppercase tracking-widest font-bold text-indigo-200">
                  Cumulative Grade Point Average (CGPA)
                </span>
                <div className="text-5xl sm:text-6xl font-black tracking-tight pt-1">
                  {btechStats.cgpa2Dec}
                </div>
                <div className="text-xs text-indigo-200 font-mono">
                  Exact: {btechStats.cgpa3Dec} / 10.00
                </div>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
                    {btechStats.classification}
                  </span>
                </div>
              </div>

              {/* Metric Breakdown Table */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Completed Semesters</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {btechStats.completedSemCount} of {semesters.length}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Total Credits Earned</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {btechStats.totalCompletedCredits} credits
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Total Quality Points [Σ(SGPA×Cr)]</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {btechStats.totalQualityPoints.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Equivalent Percentage</span>
                    <span className="text-[10px] text-slate-400">{btechStats.activeFormula.name}</span>
                  </div>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {btechStats.percentage}%
                  </span>
                </div>
              </div>

              {/* Official Disclaimer Note */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Official Disclaimer:</strong> CGPA-to-percentage conversion formulas vary by university/institution. Always check your institution&apos;s official regulations or degree certificate reverse side.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUBJECT-WISE SGPA (SECONDARY MODE) */}
      {/* ========================================================================= */}
      {activeTab === 'subject-sgpa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form (7 cols) */}
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
                  4.0 System (US / International)
                </button>
              </div>
            </div>

            {/* Courses List */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Semester Subjects & Grade Points
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
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="col-span-5 sm:col-span-3">
                      <label className="block text-[10px] text-slate-400 mb-1">Grade</label>
                      <select
                        value={course.gradePoint}
                        onChange={(e) =>
                          updateCourse(course.id, 'gradePoint', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                  className="w-full py-2 px-4 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
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
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Include Prior Semesters
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
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
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Previous Cumulative CGPA
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={scale === 'scale10' ? 10 : 4}
                      value={prevCgpa}
                      onChange={(e) => setPrevCgpa(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Total Previous Credits Earned
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={prevCredits}
                      onChange={(e) => setPrevCredits(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
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
                    Semester SGPA
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
                    {hasPreviousCgpa ? 'Cumulative CGPA' : 'Semester GPA (SGPA)'}
                  </span>
                  <div className="text-5xl font-extrabold tracking-tight mt-1">
                    {hasPreviousCgpa ? courseStats.cumulativeCgpa : courseStats.semesterGpa}
                  </div>
                  <div className="mt-2 text-xs text-indigo-200 font-medium">
                    {scale === 'scale10' ? 'Out of 10.00 scale' : 'Out of 4.00 scale'}
                  </div>
                </div>

                {/* Detailed metrics */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">Current Semester GPA</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {courseStats.semesterGpa}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">Semester Credits</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {courseStats.totalCredits}
                    </span>
                  </div>

                  {hasPreviousCgpa && (
                    <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400">Total All Credits</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {courseStats.totalAllCredits}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">Estimated Percentage</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {courseStats.percentageEstimate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TARGET CGPA PLANNER (GOAL CALCULATOR) */}
      {/* ========================================================================= */}
      {activeTab === 'target-planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Inputs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Target CGPA Goal Planner
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Determine the exact SGPA you need to achieve across remaining semesters to reach your target CGPA.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current Cumulative CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={targetPlanner.currentCgpa}
                    onChange={(e) =>
                      setTargetPlanner((prev) => ({
                        ...prev,
                        currentCgpa: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 8.20</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Completed Credits Earned
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={targetPlanner.completedCredits}
                    onChange={(e) =>
                      setTargetPlanner((prev) => ({
                        ...prev,
                        completedCredits: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 84 credits (Sem 1-4)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Desired CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={targetPlanner.targetCgpa}
                    onChange={(e) =>
                      setTargetPlanner((prev) => ({
                        ...prev,
                        targetCgpa: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 8.75 for campus eligibility</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Remaining Credits to Complete
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={targetPlanner.remainingCredits}
                    onChange={(e) =>
                      setTargetPlanner((prev) => ({
                        ...prev,
                        remainingCredits: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 76 credits (Sem 5-8)</span>
                </div>
              </div>

              {/* Formula & Explanation */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-500" />
                  <span>How Target SGPA is Derived</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Formula: <code>Required SGPA = [Target_CGPA × Total_Credits - Current_CGPA × Completed_Credits] / Remaining_Credits</code>
                </p>
              </div>
            </div>
          </div>

          {/* Right Feasibility Result Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Goal Feasibility</h3>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Status Banner */}
              {targetStats.status === 'impossible' ? (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 space-y-2 text-center">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="font-bold text-sm">Mathematically Impossible</p>
                  <p className="text-xs leading-relaxed">{targetStats.message}</p>
                </div>
              ) : targetStats.status === 'achieved' ? (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 space-y-2 text-center">
                  <Award className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-sm">Goal Already Achieved</p>
                  <p className="text-xs leading-relaxed">{targetStats.message}</p>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-indigo-600 text-white text-center space-y-1 shadow-lg shadow-indigo-600/20">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-200">
                    Required Average SGPA
                  </span>
                  <div className="text-5xl font-black">{targetStats.requiredSgpa}</div>
                  <p className="text-xs text-indigo-100 pt-1">across remaining {targetPlanner.remainingCredits} credits</p>
                </div>
              )}

              {/* Metrics */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Maximum Possible CGPA</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {targetStats.maxPossibleCgpa} / 10.00
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Total Degree Credits</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {targetPlanner.completedCredits + targetPlanner.remainingCredits}
                  </span>
                </div>

                {targetStats.difficulty && (
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Difficulty Assessment</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {targetStats.difficulty}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PERCENTAGE CONVERSION (FORMULAS & COMPARISON) */}
      {/* ========================================================================= */}
      {activeTab === 'percentage-conversion' && (
        <div className="space-y-6">
          {/* Official University Disclaimer Banner */}
          <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Official Academic Disclaimer on Percentage Conversions</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              CGPA-to-percentage conversion formulas vary significantly between universities and examination boards.
              AICTE officially mandates <code>Percentage = (CGPA - 0.75) × 10</code>, while CBSE specifies <code>CGPA × 9.5</code>,
              and autonomous universities may have distinct piecewise or linear multiplier guidelines. Always consult the official formula
              printed on the reverse of your official university grade transcript.
            </p>
          </div>

          {/* Quick Interactive Converter */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Instant Multi-University Percentage Comparison
                </h3>
                <p className="text-xs text-slate-400">Enter your 10-point CGPA to compare across all major grading systems</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Your CGPA:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={quickCgpaInput}
                  onChange={(e) => setQuickCgpaInput(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-24 px-3 py-1.5 text-sm font-mono font-bold rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400"
                />
              </div>
            </div>

            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {PERCENTAGE_FORMULAS.map((formula) => {
                const calculatedPct = formula.calculate(quickCgpaInput, customOffset, customMultiplier);
                return (
                  <div
                    key={formula.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{formula.name}</span>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {calculatedPct.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{formula.formulaStr}</p>
                    <p className="text-[10px] text-slate-400">{formula.institution}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference Table */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white">
              University Grade Conversion Reference Guide
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">System / Board</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Conversion Formula</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">8.0 CGPA Example</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-[11px]">9.0 CGPA Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">AICTE Engineering</td>
                    <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">(CGPA - 0.75) × 10</td>
                    <td className="py-3 px-4 font-mono font-bold">72.50%</td>
                    <td className="py-3 px-4 font-mono font-bold">82.50%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">CBSE & Central Universities</td>
                    <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">CGPA × 9.5</td>
                    <td className="py-3 px-4 font-mono font-bold">76.00%</td>
                    <td className="py-3 px-4 font-mono font-bold">85.50%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">VTU (Karnataka)</td>
                    <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">(CGPA - 0.75) × 10</td>
                    <td className="py-3 px-4 font-mono font-bold">72.50%</td>
                    <td className="py-3 px-4 font-mono font-bold">82.50%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Mumbai University (BE)</td>
                    <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">7.1 × CGPA + 12 (if ≥ 7.0)</td>
                    <td className="py-3 px-4 font-mono font-bold">68.80%</td>
                    <td className="py-3 px-4 font-mono font-bold">75.90%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Standard 10x Scale</td>
                    <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">CGPA × 10</td>
                    <td className="py-3 px-4 font-mono font-bold">80.00%</td>
                    <td className="py-3 px-4 font-mono font-bold">90.00%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
