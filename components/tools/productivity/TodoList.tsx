'use client';

import React, { useState, useEffect } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  Tag,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'Homework' | 'Exam' | 'Project' | 'Personal';

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string;
  createdAt: string;
}

export function TodoList() {
  const tool = getToolBySlug('todo-list')!;

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Homework');
  const [newDueDate, setNewDueDate] = useState('');

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = getStorageItem<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    if (saved && saved.length > 0) {
      setTasks(saved);
    } else {
      const defaultTasks: TaskItem[] = [
        {
          id: '1',
          title: 'Review Chapter 4 for Operating Systems',
          completed: false,
          priority: 'high',
          category: 'Exam',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Submit Data Structures Lab Report',
          completed: true,
          priority: 'medium',
          category: 'Homework',
          dueDate: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        },
      ];
      setTasks(defaultTasks);
      setStorageItem(STORAGE_KEYS.TASKS, defaultTasks);
    }
  }, []);

  const persistTasks = (updated: TaskItem[]) => {
    setTasks(updated);
    setStorageItem(STORAGE_KEYS.TASKS, updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      completed: false,
      priority: newPriority,
      category: newCategory,
      dueDate: newDueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    persistTasks([newTask, ...tasks]);
    setNewTitle('');
    setNewDueDate('');
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    persistTasks(updated);
  };

  const deleteTask = (id: string) => {
    persistTasks(tasks.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    persistTasks(tasks.filter((t) => !t.completed));
  };

  const handleReset = () => {
    persistTasks([]);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? !task.completed
        : task.completed;
    const matchesCategory =
      filterCategory === 'all' ? true : task.category === filterCategory;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Add tasks with priority ratings (High, Medium, Low) and target due dates.',
          'Filter by status (All, Active, Completed) or category.',
          'Tasks are stored in browser LocalStorage. Use the Data Manager in the header to export anytime.',
        ],
        faqs: [
          {
            q: 'Will my tasks disappear if I refresh the page?',
            a: 'No. Tasks are saved in your browser’s LocalStorage and will remain until you clear your browser cache or erase them.',
          },
        ],
      }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Add Task Form */}
        <form
          onSubmit={handleAddTask}
          className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4"
        >
          <div className="flex gap-3">
            <input
              type="text"
              required
              placeholder="What do you need to study or complete?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-4 py-3 text-sm sm:text-base rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="Homework">Homework</option>
                <option value="Exam">Exam Prep</option>
                <option value="Project">Project / Lab</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Due Date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </form>

        {/* Filters and Search */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterStatus === 'active'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  task.completed
                    ? 'border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/30 opacity-75'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0"
                    aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium truncate ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-slate-500">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md ${
                          task.priority === 'high'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : task.priority === 'medium'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                        {task.category}
                      </span>
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due {task.dueDate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-400 hover:text-rose-500 p-1 shrink-0"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-sm text-slate-500">
              No tasks found in this view.
            </div>
          )}
        </div>

        {completedCount > 0 && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={clearCompleted}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
            >
              Clear {completedCount} completed task{completedCount === 1 ? '' : 's'}
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
