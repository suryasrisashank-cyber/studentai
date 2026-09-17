'use client';

import React, { useState, useEffect } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  FileText,
  Plus,
  Trash2,
  Pin,
  Copy,
  Check,
  Search,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: string;
}

export function QuickNotes() {
  const tool = getToolBySlug('notes')!;

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = getStorageItem<NoteItem[]>(STORAGE_KEYS.NOTES, []);
    if (saved && saved.length > 0) {
      setNotes(saved);
      setActiveNoteId(saved[0].id);
    } else {
      const defaultNote: NoteItem = {
        id: '1',
        title: 'Formula Cheat Sheet & Quick References',
        content: `• Big-O Quick Ref:
  - Binary Search: O(log n)
  - QuickSort average: O(n log n)
  - Hash Map lookup: O(1)

• Database Normalization:
  - 1NF: Atomic values, no repeating groups.
  - 2NF: In 1NF + no partial dependency on candidate key.
  - 3NF: In 2NF + no transitive dependency.`,
        pinned: true,
        updatedAt: new Date().toISOString(),
      };
      setNotes([defaultNote]);
      setActiveNoteId(defaultNote.id);
      setStorageItem(STORAGE_KEYS.NOTES, [defaultNote]);
    }
  }, []);

  const persistNotes = (updated: NoteItem[]) => {
    setNotes(updated);
    setStorageItem(STORAGE_KEYS.NOTES, updated);
  };

  const createNewNote = () => {
    const newNote: NoteItem = {
      id: Date.now().toString(),
      title: 'Untitled Study Note',
      content: '',
      pinned: false,
      updatedAt: new Date().toISOString(),
    };
    persistNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const updateActiveNote = (field: 'title' | 'content', value: string) => {
    if (!activeNoteId) return;
    const updated = notes.map((n) =>
      n.id === activeNoteId
        ? { ...n, [field]: value, updatedAt: new Date().toISOString() }
        : n
    );
    persistNotes(updated);
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
    persistNotes(updated);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.filter((n) => n.id !== id);
    persistNotes(updated);
    if (activeNoteId === id) {
      setActiveNoteId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleReset = () => {
    persistNotes([]);
    setActiveNoteId(null);
  };

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const charCount = activeNote?.content.length || 0;
  const wordCount = activeNote?.content.trim() ? activeNote.content.trim().split(/\s+/).length : 0;

  const handleCopyNote = async () => {
    if (!activeNote) return;
    const full = `${activeNote.title}\n\n${activeNote.content}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Sort notes: pinned first, then by updatedAt desc
  const filteredNotes = notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      allowPrint={true}
      educationalContent={{
        howItWorks: [
          'Jot down study summaries, lecture key points, and exam formulas.',
          'Pin critical notes to keep them pinned to the top of your drawer.',
          'All text is automatically saved in your browser’s LocalStorage.',
        ],
        faqs: [
          {
            q: 'Can anyone else see my notes?',
            a: 'No. Notes are stored exclusively inside your own browser. No data is sent to StudentAI or any third party.',
          },
        ],
      }}
    >
      <div className="space-y-4">
        {/* Local Storage Notice */}
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Privacy Note:</strong> Your notes are stored locally in this browser. Remember to export your data using the database icon in the header if switching devices.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[500px]">
          {/* Notes Sidebar (4 cols) */}
          <div className="md:col-span-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={createNewNote}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Note</span>
                </button>
              </div>

              {/* Search Notes */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Notes List */}
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`p-3 rounded-2xl cursor-pointer border transition-all text-left ${
                      activeNoteId === note.id
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate flex-1">
                        {note.title || 'Untitled Note'}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => togglePin(note.id, e)}
                          className={`p-1 rounded hover:text-indigo-600 ${
                            note.pinned ? 'text-amber-500' : 'text-slate-400'
                          }`}
                          title={note.pinned ? 'Unpin note' : 'Pin note to top'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => deleteNote(note.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500"
                          title="Delete note"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {note.content || 'No content yet...'}
                    </p>
                  </div>
                ))}

                {filteredNotes.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notes found.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 text-center">
              {notes.length} saved note{notes.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Active Note Editor (8 cols) */}
          <div className="md:col-span-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 flex flex-col justify-between shadow-sm">
            {activeNote ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => updateActiveNote('title', e.target.value)}
                    placeholder="Note Title..."
                    className="text-lg sm:text-xl font-bold bg-transparent border-none text-slate-900 dark:text-white outline-none flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleCopyNote}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <textarea
                  value={activeNote.content}
                  onChange={(e) => updateActiveNote('content', e.target.value)}
                  placeholder="Start writing formulas, lecture notes, or study reminders here..."
                  className="w-full flex-1 min-h-[300px] bg-transparent border-none resize-y outline-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
                />

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>{wordCount} words</span>
                    <span>&bull;</span>
                    <span>{charCount} characters</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    Updated {new Date(activeNote.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-400 py-16">
                <FileText className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium">No note selected.</p>
                <button
                  type="button"
                  onClick={createNewNote}
                  className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Create a Note
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
