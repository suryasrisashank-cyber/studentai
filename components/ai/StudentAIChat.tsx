'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChatMessage as ChatMessageType, StudentAIMode, SourceCitation } from '@/lib/ai/types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestedPrompts } from './SuggestedPrompts';
import {
  Sparkles,
  Bot,
  Trash2,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  HelpCircle,
  GraduationCap,
  FileText,
  Briefcase,
  Layers,
  Square,
  Globe,
  PlusCircle,
  MessageSquare,
  Edit2,
  Check,
  X,
  Menu,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const CONVERSATIONS_STORAGE_KEY = 'studentai:conversations_v2';
const LEGACY_STORAGE_KEY = 'studentai:v2:ai_chat_history';

export interface ExtendedStoredMessage extends ChatMessageType {
  timestamp: string;
  sources?: SourceCitation[];
  provider?: string;
  model?: string;
  retrievalUsed?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  mode: StudentAIMode;
  messages: ExtendedStoredMessage[];
}

const MODES: { id: StudentAIMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'general', label: 'General', icon: Layers, description: 'All-around student study assistant' },
  { id: 'explain', label: 'Explain', icon: BookOpen, description: 'Deep, intuitive conceptual breakdowns' },
  { id: 'exam', label: 'Exam Prep', icon: GraduationCap, description: 'High-yield revision and memory tips' },
  { id: 'summarize', label: 'Summarize', icon: FileText, description: 'Condense notes and long text' },
  { id: 'practice', label: 'Practice', icon: HelpCircle, description: 'Test yourself with interactive questions' },
  { id: 'career', label: 'Career', icon: Briefcase, description: 'Resume tips & interview preparation' },
];

function createNewConversation(mode: StudentAIMode = 'general'): Conversation {
  const now = new Date().toISOString();
  return {
    id: 'conv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
    title: 'New Study Session',
    createdAt: now,
    updatedAt: now,
    mode,
    messages: [],
  };
}

interface StudentAIChatProps {
  greeting?: string;
  subtitle?: string;
}

export function StudentAIChat({ greeting, subtitle }: StudentAIChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [streamingSources, setStreamingSources] = useState<SourceCitation[]>([]);
  const [streamingRetrieval, setStreamingRetrieval] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and migrate conversations from LocalStorage
  useEffect(() => {
    try {
      let loaded: Conversation[] = [];
      const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (stored) {
        loaded = JSON.parse(stored);
      }

      // If empty, check legacy single chat history
      if (!loaded || loaded.length === 0) {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          const parsedLegacy = JSON.parse(legacy);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            const initialConv: Conversation = {
              id: 'conv_legacy',
              title: parsedLegacy[0]?.content?.slice(0, 30) || 'Study Session',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              mode: 'general',
              messages: parsedLegacy,
            };
            loaded = [initialConv];
          }
        }
      }

      // If still empty, create default first conversation
      if (loaded.length === 0) {
        const defaultConv = createNewConversation();
        loaded = [defaultConv];
      }

      setConversations(loaded);
      setActiveId(loaded[0].id);
    } catch {
      const fallback = createNewConversation();
      setConversations([fallback]);
      setActiveId(fallback.id);
    }
  }, []);

  // Save conversations to LocalStorage whenever they change
  useEffect(() => {
    try {
      if (conversations.length > 0) {
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
      }
    } catch {}
  }, [conversations]);

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeId) || conversations[0];
  }, [conversations, activeId]);

  const messages = useMemo(() => {
    return activeConversation?.messages || [];
  }, [activeConversation]);

  const currentMode = activeConversation?.mode || 'general';

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, streamingMessage]);

  const handleCreateNewChat = () => {
    const newConv = createNewConversation(currentMode);
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setErrorMessage(null);
    setStreamingMessage('');
    setMobileSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length <= 1) {
      // If deleting the only conversation, reset it to empty
      const fresh = createNewConversation();
      setConversations([fresh]);
      setActiveId(fresh.id);
      return;
    }

    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    if (activeId === id) {
      setActiveId(filtered[0]?.id || '');
    }
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitleId(id);
    setEditingTitleText(currentTitle);
  };

  const handleSaveRename = (id: string) => {
    if (!editingTitleText.trim()) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: editingTitleText.trim(), updatedAt: new Date().toISOString() } : c))
    );
    setEditingTitleId(null);
  };

  const handleSetMode = (mode: StudentAIMode) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, mode, updatedAt: new Date().toISOString() } : c))
    );
  };

  const handleExportActiveConversation = () => {
    if (!activeConversation) return;
    const exportText = `# StudentAI Conversation: ${activeConversation.title}\n` +
      `Date: ${new Date(activeConversation.createdAt).toLocaleString()}\n` +
      `Mode: ${activeConversation.mode}\n\n---\n\n` +
      activeConversation.messages.map((m) => `**${m.role.toUpperCase()}** (${m.timestamp}):\n${m.content}\n`).join('\n---\n\n');

    const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studentai-${activeConversation.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);

    if (streamingMessage) {
      const partialMessage: ExtendedStoredMessage = {
        role: 'assistant',
        content: streamingMessage + ' [Stopped]',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: streamingSources,
        retrievalUsed: streamingRetrieval,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              messages: [...c.messages, partialMessage],
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
      setStreamingMessage('');
      setStreamingSources([]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setErrorMessage(null);

    const userMessage: ExtendedStoredMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Auto-update title if it's currently the default
    const isFirstUserMessage = messages.length === 0;
    const newTitle = isFirstUserMessage ? (query.slice(0, 36) + (query.length > 36 ? '...' : '')) : activeConversation?.title;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            title: newTitle || c.title,
            messages: [...c.messages, userMessage],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    setInput('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');
    setStreamingSources([]);
    setStreamingRetrieval(false);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const historyPayload: ChatMessageType[] = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          mode: currentMode,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || errJson?.error || 'StudentAI Assistant encountered an issue.');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Unable to establish stream reader.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      let activeSources: SourceCitation[] = [];
      let activeRetrieval = false;
      let finalProvider = '';
      let finalModel = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);

          try {
            const parsed = JSON.parse(jsonStr);

            if (parsed.type === 'metadata') {
              if (parsed.sources) {
                activeSources = parsed.sources;
                setStreamingSources(parsed.sources);
              }
              if (parsed.retrievalUsed) {
                activeRetrieval = true;
                setStreamingRetrieval(true);
              }
            } else if (parsed.type === 'chunk') {
              accumulatedText += parsed.text;
              setStreamingMessage(accumulatedText);
            } else if (parsed.type === 'done') {
              finalProvider = parsed.provider;
              finalModel = parsed.model;
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error);
            }
          } catch (e: any) {
            if (e?.message && e.message !== 'Unexpected end of JSON input') {
              throw e;
            }
          }
        }
      }

      const assistantMessage: ExtendedStoredMessage = {
        role: 'assistant',
        content: accumulatedText || 'No response received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: activeSources,
        retrievalUsed: activeRetrieval,
        provider: finalProvider,
        model: finalModel,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              messages: [...c.messages, assistantMessage],
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
      setStreamingMessage('');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Failed to connect. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetryLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleEditMessage = (text: string) => {
    setInput(text);
  };

  const handleClearActiveChat = () => {
    if (confirm('Clear messages in this conversation?')) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, messages: [], updatedAt: new Date().toISOString() } : c))
      );
      setStreamingMessage('');
      setErrorMessage(null);
    }
  };

  const handleClearAllConversations = () => {
    if (confirm('Clear all conversation history? This cannot be undone.')) {
      const fresh = createNewConversation();
      setConversations([fresh]);
      setActiveId(fresh.id);
      setStreamingMessage('');
      setErrorMessage(null);
      localStorage.removeItem(CONVERSATIONS_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[550px] w-full rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Desktop Sidebar */}
      <aside
        aria-label="Conversation history"
        className={`${
          sidebarOpen ? 'w-64 sm:w-72' : 'w-0'
        } shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex flex-col transition-all duration-300 overflow-hidden hidden md:flex`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCreateNewChat}
            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Collapse sidebar"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const isEditing = editingTitleId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveId(conv.id);
                  setErrorMessage(null);
                }}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all min-h-[44px] ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs border border-indigo-200 dark:border-indigo-900/60'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingTitleText}
                      onChange={(e) => setEditingTitleText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(conv.id);
                        if (e.key === 'Escape') setEditingTitleId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full px-1.5 py-0.5 rounded border border-indigo-400 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 font-normal"
                    />
                  ) : (
                    <span className="truncate">{conv.title}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        aria-label="Save title"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveRename(conv.id);
                        }}
                        className="p-1 hover:text-emerald-500 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancel rename"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(null);
                        }}
                        className="p-1 hover:text-slate-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        aria-label="Rename conversation"
                        onClick={(e) => handleStartRename(conv.id, conv.title, e)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete conversation"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-2.5 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-[11px] text-slate-500">
          <button
            type="button"
            onClick={handleClearAllConversations}
            className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors py-1 px-1.5"
          >
            Clear all history
          </button>
          <span>{conversations.length} sessions</span>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/50 backdrop-blur-xs">
          <div className="w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Conversations</h3>
              <button
                type="button"
                aria-label="Close conversations drawer"
                onClick={() => setMobileSidebarOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleCreateNewChat}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Chat</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveId(conv.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl min-h-[44px] text-xs ${
                    conv.id === activeId
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="truncate">{conv.title}</span>
                  <button
                    type="button"
                    aria-label="Delete chat"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-slate-900/30 overflow-hidden">
        {/* Workspace Header */}
        <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 bg-white/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Sidebar toggle buttons */}
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Expand sidebar"
                className="hidden md:flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open conversations drawer"
              className="flex md:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Bot className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activeConversation?.title || greeting || 'StudentAI Study Assistant'}
                </h2>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                  2.0
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate hidden xs:block">
                {subtitle || 'Grounded multi-provider reasoning with live web citations'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportActiveConversation}
              className="min-h-[44px] px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
              title="Export Conversation as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearActiveChat}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Clear current conversation"
                aria-label="Clear current conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Operating Mode Bar */}
        <div className="px-4 sm:px-6 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">Mode:</span>
          {MODES.map((m) => {
            const Icon = m.icon;
            const isActive = currentMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSetMode(m.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all min-h-[36px] ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8 space-y-6 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  How can I help you study today?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                  Ask any academic question, request step-by-step problem breakdowns, debug code, or inquire about current 2026 syllabus updates.
                </p>
              </div>

              <div className="w-full pt-2">
                <SuggestedPrompts mode={currentMode} onSelectPrompt={(p) => handleSendMessage(p)} />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-4">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Private &amp; Client-Secured &bull; Transparent Real-Time Citations</span>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  message={msg}
                  timestamp={msg.timestamp}
                  isLatest={index === messages.length - 1}
                  onRetry={msg.role === 'assistant' ? handleRetryLast : undefined}
                  onEdit={msg.role === 'user' ? () => handleEditMessage(msg.content) : undefined}
                />
              ))}

              {/* Live Streaming Message Display */}
              {isStreaming && (
                <div className="flex gap-3 sm:gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/70 mr-4 sm:mr-12 border border-indigo-200 dark:border-indigo-900/80 shadow-sm animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        StudentAI Assistant
                      </span>
                      {streamingRetrieval && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 animate-pulse">
                          <Globe className="w-3 h-3" />
                          Grounded Search Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {streamingMessage || (
                        <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                          Analyzing query &amp; consulting verified sources...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleRetryLast}
                className="text-xs font-bold underline hover:no-underline shrink-0 min-h-[44px] flex items-center"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shrink-0">
          <div className="relative">
            <ChatInput
              input={input}
              setInput={setInput}
              onSubmit={() => handleSendMessage()}
              isLoading={isLoading}
              onStop={handleStopGeneration}
              placeholder={`Ask a ${currentMode} study question or inquiry...`}
            />

            {isStreaming && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-200 transition-colors min-h-[36px]"
                  title="Stop generation"
                >
                  <Square className="w-3 h-3 fill-rose-600 text-rose-600" />
                  <span>Stop</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
