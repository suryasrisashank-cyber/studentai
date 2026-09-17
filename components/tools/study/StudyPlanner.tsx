'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  BarChart3,
  Flame,
} from 'lucide-react';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type PriorityLevel = 'low' | 'medium' | 'high';

export interface StudySubject {
  id: string;
  name: string;
  examDate: string; // YYYY-MM-DD
  difficulty: DifficultyLevel;
  priority: PriorityLevel;
  completedDays?: string[]; // Array of YYYY-MM-DD marked done
}

export function StudyPlanner() {
  const tool = getToolBySlug('study-planner')!;

  const [availableHours, setAvailableHours] = useState<number>(4);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form states for adding a new subject
  const [newSubName, setNewSubName] = useState('');
  const [newSubExamDate, setNewSubExamDate] = useState('');
  const [newSubDiff, setNewSubDiff] = useState<DifficultyLevel>('medium');
  const [newSubPriority, setNewSubPriority] = useState<PriorityLevel>('high');

  // Load from LocalStorage
  useEffect(() => {
    const saved = getStorageItem<StudySubject[]>(STORAGE_KEYS.STUDY_PLANS, []);
    if (saved && saved.length > 0) {
      setSubjects(saved);
    } else {
      // Sensible defaults
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 14);

      const defaultSubjects: StudySubject[] = [
        {
          id: '1',
          name: 'Computer Networks',
          examDate: tomorrow.toISOString().slice(0, 10),
          difficulty: 'hard',
          priority: 'high',
          completedDays: [],
        },
        {
          id: '2',
          name: 'Database Management Systems',
          examDate: nextWeek.toISOString().slice(0, 10),
          difficulty: 'medium',
          priority: 'medium',
          completedDays: [],
        },
      ];
      setSubjects(defaultSubjects);
      setStorageItem(STORAGE_KEYS.STUDY_PLANS, defaultSubjects);
    }
    setIsLoaded(true);
  }, []);

  const persistSubjects = (updated: StudySubject[]) => {
    setSubjects(updated);
    setStorageItem(STORAGE_KEYS.STUDY_PLANS, updated);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubExamDate) return;

    const newSub: StudySubject = {
      id: Date.now().toString(),
      name: newSubName.trim(),
      examDate: newSubExamDate,
      difficulty: newSubDiff,
      priority: newSubPriority,
      completedDays: [],
    };

    persistSubjects([...subjects, newSub]);
    setNewSubName('');
    setNewSubExamDate('');
  };

  const handleDeleteSubject = (id: string) => {
    persistSubjects(subjects.filter((s) => s.id !== id));
  };

  const toggleDayCompletion = (subjectId: string, dayDateStr: string) => {
    const updated = subjects.map((sub) => {
      if (sub.id !== subjectId) return sub;
      const completed = sub.completedDays || [];
      const isDone = completed.includes(dayDateStr);
      const nextCompleted = isDone
        ? completed.filter((d) => d !== dayDateStr)
        : [...completed, dayDateStr];
      return { ...sub, completedDays: nextCompleted };
    });
    persistSubjects(updated);
  };

  const handleReset = () => {
    const empty: StudySubject[] = [];
    persistSubjects(empty);
  };

  // Deterministic schedule generator
  const scheduleData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMultiplier: Record<DifficultyLevel, number> = {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0,
    };

    const prioMultiplier: Record<PriorityLevel, number> = {
      low: 1.0,
      medium: 1.3,
      high: 1.7,
    };

    // Score each subject
    const analyzed = subjects.map((sub) => {
      const exam = new Date(sub.examDate);
      exam.setHours(0, 0, 0, 0);
      const diffMs = exam.getTime() - today.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      // Urgency factor: subjects closer to exam date get higher immediate weight
      const urgencyFactor = daysLeft === 0 ? 3.0 : Math.min(3.0, 15 / Math.max(1, daysLeft));
      const score = diffMultiplier[sub.difficulty] * prioMultiplier[sub.priority] * urgencyFactor;

      return {
        ...sub,
        daysLeft,
        score,
      };
    });

    const totalScore = analyzed.reduce((sum, s) => sum + s.score, 0);

    // Calculate daily allocated hours
    const allocated = analyzed.map((sub) => {
      const share = totalScore > 0 ? sub.score / totalScore : 1 / Math.max(1, analyzed.length);
      const hours = (share * availableHours).toFixed(1);
      return {
        ...sub,
        recommendedHours: Math.max(0.5, parseFloat(hours)),
      };
    });

    return allocated;
  }, [subjects, availableHours]);

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      allowPrint={true}
      educationalContent={{
        howItWorks: [
          'Add all courses or exams with their target dates, difficulty, and priority.',
          'Set your total daily study hours budget.',
          'A deterministic algorithm distributes study blocks based on exam urgency and difficulty weighting.',
          'Check off today’s sessions to build study streaks. Progress is stored locally in your browser.',
        ],
        formula:
          'Subject Weight = Difficulty × Priority × Urgency(1 / Days Left)\nAllocated Hours = (Subject Weight / Total Weight) × Daily Study Budget',
        faqs: [
          {
            q: 'Does this use an AI API to create the timetable?',
            a: 'No. The timetable is computed using client-side JavaScript proportional weight algorithms. No data is sent to external servers.',
          },
          {
            q: 'Can I print this schedule?',
            a: 'Yes, click the Print button in the top bar to format and print your study plan cleanly.',
          },
        ],
      }}
    >
      <div className="space-y-8">
        {/* Top Controls: Daily hours & Stats */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Daily Study Budget</span>
            </h2>
            <p className="text-xs text-slate-500">
              Total hours you can dedicate to studying each day.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="12"
              step="0.5"
              value={availableHours}
              onChange={(e) => setAvailableHours(parseFloat(e.target.value) || 1)}
              className="w-44 accent-indigo-600 cursor-pointer"
            />
            <span className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-sm min-w-[70px] text-center border border-indigo-200 dark:border-indigo-800">
              {availableHours} hrs
            </span>
          </div>
        </div>

        {/* Add Subject Section */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Add Course or Exam Target</span>
          </h3>

          <form onSubmit={handleAddSubject} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exam / Deadline Date
              </label>
              <input
                type="date"
                required
                value={newSubExamDate}
                onChange={(e) => setNewSubExamDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Difficulty
              </label>
              <select
                value={newSubDiff}
                onChange={(e) => setNewSubDiff(e.target.value as DifficultyLevel)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={newSubPriority}
                onChange={(e) => setNewSubPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center"
                title="Add to study plan"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Generated Schedule Cards */}
        {scheduleData.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>Deterministic Daily Schedule ({scheduleData.length} Subjects)</span>
              </h3>
              <span className="text-xs text-slate-500">
                Today is {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduleData.map((sub) => {
                const isCompletedToday = (sub.completedDays || []).includes(todayStr);

                return (
                  <div
                    key={sub.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCompletedToday
                        ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">
                            {sub.name}
                          </h4>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              sub.difficulty === 'hard'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : sub.difficulty === 'medium'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {sub.difficulty}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {sub.priority} priority
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Exam on {sub.examDate} ({sub.daysLeft} days remaining)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(sub.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Delete course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Hours allocated */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span className="text-slate-600 dark:text-slate-300">
                          Recommended today:
                        </span>
                        <strong className="text-indigo-600 dark:text-indigo-400 text-sm">
                          {sub.recommendedHours} hrs
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleDayCompletion(sub.id, todayStr)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          isCompletedToday
                            ? 'bg-emerald-600 text-white'
                            : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isCompletedToday ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done Today</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5" />
                            <span>Mark Done</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-sm">
            No subjects currently in your schedule. Add your first exam or assignment above.
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
