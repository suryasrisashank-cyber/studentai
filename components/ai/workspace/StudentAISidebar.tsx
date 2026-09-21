'use client';

import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Clock,
  ChevronRight,
  Code2,
  Brain,
  Database,
  Calculator,
  Shield,
  Users,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  BookOpen,
  FileQuestion,
  ListOrdered,
  ClipboardList,
  Sparkles,
  Download,
} from 'lucide-react';
import { Conversation } from './types';

interface StudentAISidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onCreateNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onSelectSubjectPrompt: (prompt: string) => void;
  onSelectEducatorTool: (toolName: string, prompt: string) => void;
  onExportAll: () => void;
  onClearAll: () => void;
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

const EDUCATOR_TOOLS = [
  {
    id: 'lesson-plans',
    name: 'Lesson Plans',
    icon: BookOpen,
    prompt: 'Generate a structured 60-minute interactive lesson plan with learning objectives, blackboard breakdown, student activities, and assessment questions.',
  },
  {
    id: 'question-gen',
    name: 'Question Generator',
    icon: FileQuestion,
    prompt: 'Generate a comprehensive question bank containing 5 conceptual 2-mark questions, 3 detailed 10-mark questions, and 10 multiple-choice questions (MCQs) with solutions.',
  },
  {
    id: 'quiz-builder',
    name: 'Quiz Builder',
    icon: ListOrdered,
    prompt: 'Create a timed 10-question multiple-choice quiz on this topic with 4 answer options, correct answer keys, and clear explanatory rationales.',
  },
  {
    id: 'assignments',
    name: 'Assignments',
    icon: ClipboardList,
    prompt: 'Create a practical homework assignment with problem statements, rubric criteria, evaluation guidelines, and sample solution keys.',
  },
];

export function StudentAISidebar({
  conversations,
  activeId,
  onSelectConversation,
  onCreateNewChat,
  onDeleteConversation,
  onRenameConversation,
  onSelectSubjectPrompt,
  onSelectEducatorTool,
  onExportAll,
  onClearAll,
  userInitial = 'SS',
  userName = 'Sashank',
  userRole = 'B.Tech Final Year',
}: StudentAISidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [educatorExpanded, setEducatorExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingText(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (editingText.trim()) {
      onRenameConversation(id, editingText.trim());
    }
    setEditingId(null);
  };

  return (
    <aside
      aria-label="StudentAI Sidebar Navigation"
      className="w-64 sm:w-72 lg:w-[270px] shrink-0 h-full bg-[#050816] border-r border-slate-800/80 flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Top Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-none p-3.5 space-y-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 pt-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6D5DFB] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-[#6D5DFB]/30 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-base text-white tracking-tight leading-tight truncate">
              Student<span className="text-[#8B5CF6]">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              Learn. Build. Master.
            </p>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          type="button"
          onClick={onCreateNewChat}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#6D5DFB] via-[#8B5CF6] to-[#3B82F6] hover:brightness-110 shadow-md shadow-[#6D5DFB]/30 hover:shadow-lg hover:shadow-[#6D5DFB]/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Chat</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#0C122B] border border-slate-800/90 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#6D5DFB]/60 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Recent Chats Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Recent Chats</span>
            </div>
            {conversations.length > 5 && (
              <span className="text-[10px] text-[#8B5CF6] hover:underline cursor-pointer">
                View all &rarr;
              </span>
            )}
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-none pr-0.5">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-4 text-[11px] text-slate-500">
                {searchQuery ? 'No chats match search.' : 'No previous conversations.'}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeId;
                const isEditing = editingId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-all ${
                      isActive
                        ? 'bg-[#141C42] border border-[#6D5DFB]/50 text-white shadow-xs font-medium'
                        : 'text-slate-300 hover:bg-[#0E1533] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                      <MessageSquare
                        className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#8B5CF6]' : 'text-slate-500 group-hover:text-slate-400'}`}
                      />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(conv.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="w-full px-1.5 py-0.5 rounded bg-[#090E24] border border-[#6D5DFB] text-xs text-white outline-none"
                        />
                      ) : (
                        <span className="truncate">{conv.title}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveRename(conv.id);
                            }}
                            className="p-1 hover:text-emerald-400 text-slate-400"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(null);
                            }}
                            className="p-1 hover:text-slate-200 text-slate-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(conv.id, conv.title, e)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => onDeleteConversation(conv.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Subjects Section */}
        <div className="space-y-1 pt-1 border-t border-slate-800/80">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Subjects
          </div>
          <div className="space-y-0.5">
            {SUBJECTS.map((sub) => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectSubjectPrompt(sub.prompt)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-[#0E1533] transition-colors group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#8B5CF6] transition-colors shrink-0" />
                    <span className="truncate">{sub.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Educator Workspace Section */}
        <div className="pt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setEducatorExpanded(!educatorExpanded)}
            className="w-full p-2.5 rounded-xl bg-[#0D1533]/80 hover:bg-[#121C42] border border-slate-800/80 transition-all flex items-start justify-between text-left group"
          >
            <div className="flex items-start gap-2 min-w-0">
              <Users className="w-4 h-4 text-[#8B5CF6] mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white leading-tight">
                  Educator Workspace
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  Create lessons, track progress, manage classes
                </div>
              </div>
            </div>
            {educatorExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            )}
          </button>

          {educatorExpanded && (
            <div className="mt-1.5 space-y-1 pl-2 animate-in fade-in slide-in-from-top-1 duration-150">
              {EDUCATOR_TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onSelectEducatorTool(tool.name, tool.prompt)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-slate-300 hover:text-white hover:bg-[#121C42] transition-colors"
                  >
                    <Icon className="w-3 h-3 text-[#8B5CF6]" />
                    <span className="truncate">{tool.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Profile Area */}
      <div className="p-3 border-t border-slate-800/80 bg-[#060A1C] relative">
        <button
          type="button"
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#0E1533] transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6D5DFB] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
              {userInitial}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{userName}</div>
              <div className="text-[10px] text-slate-400 truncate">{userRole}</div>
            </div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Profile Options Popup */}
        {profileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setProfileMenuOpen(false)}
            />
            <div className="absolute bottom-16 left-3 right-3 p-2 rounded-2xl bg-[#0B1128] border border-slate-700/80 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                Workspace Controls
              </div>
              <div className="py-1 space-y-0.5 text-xs text-slate-300">
                <button
                  type="button"
                  onClick={() => {
                    onExportAll();
                    setProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#121A3B] flex items-center gap-2 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export Chat History</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Conversations</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
