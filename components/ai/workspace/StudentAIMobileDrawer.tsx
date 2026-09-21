'use client';

import React from 'react';
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
} from 'lucide-react';
import { Conversation } from './types';

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
  userInitial = 'SS',
  userName = 'Sashank',
  userRole = 'B.Tech Final Year',
}: StudentAIMobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-80 max-w-[85vw] h-full bg-[#050816] border-r border-slate-800 flex flex-col shadow-2xl p-4 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6D5DFB] to-[#3B82F6] flex items-center justify-center text-white">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">StudentAI</div>
              <div className="text-[10px] text-slate-400">Study Workspace</div>
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
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#6D5DFB] via-[#8B5CF6] to-[#3B82F6] flex items-center justify-center gap-2 shadow-md shadow-[#6D5DFB]/30"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Chat</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Recent Chats */}
          <div>
            <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-400 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Recent Chats</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {conversations.map((c) => {
                const isActive = c.id === activeId;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectConversation(c.id);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs ${
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
              })}
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

          {/* Educator Quick Tools */}
          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <Users className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Educator Tools</span>
            </div>
            <div className="space-y-1">
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
          </div>
        </div>

        {/* Drawer Bottom Profile */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6D5DFB] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold">
              {userInitial}
            </div>
            <div>
              <div className="text-xs font-bold text-white">{userName}</div>
              <div className="text-[10px] text-slate-400">{userRole}</div>
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
      </div>
    </div>
  );
}
