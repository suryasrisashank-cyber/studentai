'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  GraduationCap,
  Plus,
  Clock,
  Code2,
  Brain,
  Database,
  Calculator,
  Shield,
  Users,
  MessageSquare,
  Trash2,
  Download,
  Wrench,
  FileText,
  Layers,
  Sparkles,
  CalendarCheck,
  Briefcase,
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { Conversation } from './types';
import { useAuth } from '@/components/auth/AuthProvider';

interface StudentAIMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onCreateNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onSelectSubjectPrompt: (prompt: string) => void;
  onSelectEducatorTool: (toolName: string, prompt: string) => void;
  onExportAll: () => void;
  userInitial?: string;
  userName?: string;
  userRole?: string;
}

const SUBJECTS = [
  {
    id: 'cs',
    name: 'Computer Science',
    icon: Code2,
    prompt: 'Explain the core principles of Computer Science, specifically focusing on data structures and algorithms with code examples.',
  },
  {
    id: 'ai-ml',
    name: 'AI & ML',
    icon: Brain,
    prompt: 'Provide an intuitive explanation of key Machine Learning concepts, comparing supervised, unsupervised, and reinforcement learning.',
  },
  {
    id: 'dbms',
    name: 'DBMS',
    icon: Database,
    prompt: 'Explain Database Management Systems (DBMS), normalization forms (1NF to BCNF), and ACID properties with clear examples.',
  },
  {
    id: 'math',
    name: 'Mathematics',
    icon: Calculator,
    prompt: 'Break down Engineering Mathematics concepts step-by-step: Linear algebra, calculus, and discrete mathematics.',
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    icon: Shield,
    prompt: 'Explain fundamental cybersecurity concepts: network security, symmetric vs asymmetric encryption, and common vulnerabilities.',
  },
];

const FEATURED_STUDENT_TOOLS = [
  { name: 'B.Tech CGPA Calculator', href: '/tools/cgpa-calculator', icon: GraduationCap },
  { name: 'Attendance Calculator', href: '/tools/attendance-calculator', icon: CalendarCheck },
  { name: 'Study Planner', href: '/tools/study-planner', icon: Briefcase },
  { name: 'Pomodoro Timer', href: '/tools/pomodoro-timer', icon: Clock },
];

const FEATURED_PDF_TOOLS = [
  { name: 'Merge PDF Files', href: '/pdf-tools/merge-pdf', icon: Layers },
  { name: 'Split & Extract Pages', href: '/pdf-tools/split-pdf', icon: FileText },
  { name: 'Compress PDF Size', href: '/pdf-tools/compress-pdf', icon: Sparkles },
  { name: 'OCR & PDF Scanner', href: '/pdf-tools/ocr-pdf', icon: Shield },
];

export function StudentAIMobileDrawer({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelectConversation,
  onCreateNewChat,
  onDeleteConversation,
  onSelectSubjectPrompt,
  onSelectEducatorTool,
  onExportAll,
  userInitial: propInitial = 'SS',
  userName: propName = 'Sashank',
  userRole: propRole = 'B.Tech Final Year',
}: StudentAIMobileDrawerProps) {
  const { user, signOut, openAuthModal } = useAuth();
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [pdfToolsExpanded, setPdfToolsExpanded] = useState(false);
  const [educatorExpanded, setEducatorExpanded] = useState(false);

  if (!isOpen) return null;

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || propName;
  const userInitial = (user?.email?.[0] || displayName?.[0] || propInitial).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-80 max-w-[88vw] h-full bg-[#050816] border-r border-slate-800 flex flex-col shadow-2xl p-4 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6D5DFB] to-[#3B82F6] flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">
                Student<span className="text-[#8B5CF6]">AI</span>
              </div>
              <div className="text-[10px] text-slate-400">Learn. Build. Master.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => {
              onCreateNewChat();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#6D5DFB] via-[#8B5CF6] to-[#3B82F6] flex items-center justify-center gap-2 shadow-md shadow-[#6D5DFB]/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Chat</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 scrollbar-none">
          {/* Recent Chats */}
          <div>
            <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Recent Chats</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{conversations.length}</span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">No chats yet.</div>
              ) : (
                conversations.map((c) => {
                  const isActive = c.id === activeId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        onSelectConversation(c.id);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                        isActive
                          ? 'bg-[#141C42] border border-[#6D5DFB]/50 text-white font-medium'
                          : 'text-slate-300 hover:bg-[#0E1533]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-1 truncate">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#8B5CF6]" />
                        <span className="truncate">{c.title}</span>
                      </div>
                      <button
                        type="button"
                        aria-label="Delete chat"
                        onClick={(e) => onDeleteConversation(c.id, e)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Subjects */}
          <div className="border-t border-slate-800 pt-3">
            <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Subjects
            </div>
            <div className="space-y-0.5">
              {SUBJECTS.map((sub) => {
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      onSelectSubjectPrompt(sub.prompt);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-[#0E1533] transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span className="truncate">{sub.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tools (20 Student Utilities) */}
          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setToolsExpanded(!toolsExpanded)}
              className="w-full flex items-center justify-between px-2 text-xs font-bold text-white mb-1.5"
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tools</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                  20 Utilities
                </span>
              </div>
              {toolsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {toolsExpanded && (
              <div className="space-y-0.5 pl-2 mt-1">
                {FEATURED_STUDENT_TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={onClose}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-300 hover:text-white hover:bg-[#121C42] transition-colors"
                    >
                      <Icon className="w-3 h-3 text-indigo-400" />
                      <span className="truncate">{tool.name}</span>
                    </Link>
                  );
                })}
                <Link
                  href="/tools"
                  onClick={onClose}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-indigo-400 hover:underline"
                >
                  <span>All 20 Student Utilities</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* PDF Tools (40 PDF Tools) */}
          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setPdfToolsExpanded(!pdfToolsExpanded)}
              className="w-full flex items-center justify-between px-2 text-xs font-bold text-white mb-1.5"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF Tools</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                  40 Tools
                </span>
              </div>
              {pdfToolsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {pdfToolsExpanded && (
              <div className="space-y-0.5 pl-2 mt-1">
                {FEATURED_PDF_TOOLS.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={onClose}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-300 hover:text-white hover:bg-[#121C42] transition-colors"
                    >
                      <Icon className="w-3 h-3 text-emerald-400" />
                      <span className="truncate">{tool.name}</span>
                    </Link>
                  );
                })}
                <Link
                  href="/pdf-tools"
                  onClick={onClose}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-emerald-400 hover:underline"
                >
                  <span>All 40 PDF Tools</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Educator Quick Tools */}
          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setEducatorExpanded(!educatorExpanded)}
              className="w-full flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5"
            >
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Educator Tools</span>
              </div>
              {educatorExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {educatorExpanded && (
              <div className="space-y-1 pl-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectEducatorTool('Lesson Plan', 'Generate a structured lesson plan with objectives, board work, and questions.');
                    onClose();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-[#0E1533]"
                >
                  Create Lesson Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectEducatorTool('Quiz Builder', 'Create a 10-question multiple-choice quiz on this topic with answer keys.');
                    onClose();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-[#0E1533]"
                >
                  Generate Quiz / MCQs
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Bottom Profile & Supabase Auth */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6D5DFB] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{displayName}</div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user ? <span className="text-emerald-400">Supabase Connected</span> : 'Guest User'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onExportAll}
              aria-label="Export conversations"
              title="Export chats"
              className="p-2 rounded-lg text-slate-400 hover:text-white"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {!user ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuthModal();
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Supabase</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-rose-950/40 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-rose-800/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
