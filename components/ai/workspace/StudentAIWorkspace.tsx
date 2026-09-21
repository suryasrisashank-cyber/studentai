'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChatMessage as ChatMessageType, StudentAIMode, SourceCitation } from '@/lib/ai/types';
import { Conversation, ExtendedStoredMessage } from './types';
import { StudentAITopBar } from './StudentAITopBar';
import { StudentAISidebar } from './StudentAISidebar';
import { StudentAIMobileDrawer } from './StudentAIMobileDrawer';
import { StudentAIHero } from './StudentAIHero';
import { StudentAIActionCards } from './StudentAIActionCards';
import { StudentAIPromptChips } from './StudentAIPromptChips';
import { StudentAIChatMessage } from './StudentAIChatMessage';
import { StudentAIComposer } from './StudentAIComposer';
import { StudentAIVideoModal } from './StudentAIVideoModal';
import { StudentAIDocumentModal } from './StudentAIDocumentModal';
import { useAuth } from '@/components/auth/AuthProvider';
import { AlertCircle, ChevronDown, Sparkles } from 'lucide-react';

const CONVERSATIONS_STORAGE_KEY = 'studentai:conversations_v2';
const LEGACY_STORAGE_KEY = 'studentai:v2:ai_chat_history';

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

interface StudentAIWorkspaceProps {
  greeting?: string;
  subtitle?: string;
}

export function StudentAIWorkspace({
  greeting = 'Welcome to StudentAI',
  subtitle = 'Your intelligent study and teaching companion.',
}: StudentAIWorkspaceProps) {
  const { user, signOut, openAuthModal } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('studentai-pro');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [streamingSources, setStreamingSources] = useState<SourceCitation[]>([]);
  const [streamingRetrieval, setStreamingRetrieval] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Automatically trigger 3D Auth Modal when user touches the AI tool if unauthenticated
  useEffect(() => {
    try {
      const hasPrompted = sessionStorage.getItem('studentai:auth_touch_prompted');
      if (!user && !hasPrompted) {
        sessionStorage.setItem('studentai:auth_touch_prompted', 'true');
        const timer = setTimeout(() => {
          openAuthModal();
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [user, openAuthModal]);

  // Initialize and migrate conversations from LocalStorage
  useEffect(() => {
    try {
      let loaded: Conversation[] = [];
      const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      if (stored) {
        loaded = JSON.parse(stored);
      }

      if (!loaded || loaded.length === 0) {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          const parsedLegacy = JSON.parse(legacy);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            const initialConv: Conversation = {
              id: 'conv_legacy',
              title: parsedLegacy[0]?.content?.slice(0, 32) || 'Study Session',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              mode: 'general',
              messages: parsedLegacy,
            };
            loaded = [initialConv];
          }
        }
      }

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

  // Save conversations to LocalStorage
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

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const nearBottom = distanceFromBottom < 80;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) {
      setShowScrollBottomBtn(false);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior,
    });
    isNearBottomRef.current = true;
    setShowScrollBottomBtn(false);
  };

  // Scroll to bottom on conversation switch
  useEffect(() => {
    scrollToBottom('auto');
  }, [activeId]);

  // Follow streaming chunks
  useEffect(() => {
    if (isStreaming) {
      if (isNearBottomRef.current && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      } else {
        setShowScrollBottomBtn(true);
      }
    }
  }, [streamingMessage, isStreaming]);

  const handleCreateNewChat = () => {
    const newConv = createNewConversation(currentMode);
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setErrorMessage(null);
    setStreamingMessage('');
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length <= 1) {
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

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c))
    );
  };

  const handleSetMode = (mode: StudentAIMode) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, mode, updatedAt: new Date().toISOString() } : c))
    );
  };

  const handleExportAll = () => {
    if (!activeConversation) return;
    const exportText = `# StudentAI Conversation: ${activeConversation.title}\n` +
      `Date: ${new Date(activeConversation.createdAt).toLocaleString()}\n` +
      `Mode: ${activeConversation.mode}\n\n---\n\n` +
      activeConversation.messages
        .map((m) => `**${m.role.toUpperCase()}** (${m.timestamp}):\n${m.content}\n`)
        .join('\n---\n\n');

    const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studentai-${activeConversation.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
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
    const newTitle = isFirstUserMessage
      ? query.slice(0, 36) + (query.length > 36 ? '...' : '')
      : activeConversation?.title;

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
    setTimeout(() => scrollToBottom('smooth'), 50);
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

  const handleExplainSimpler = (context: string) => {
    handleSendMessage(`Explain this previous topic in simpler terms with beginner analogies and zero jargon:\n\n${context.slice(0, 300)}`);
  };

  const handleQuizMe = (context: string) => {
    handleSendMessage(`Generate 3 interactive practice quiz questions with solutions based on this topic:\n\n${context.slice(0, 300)}`);
  };

  return (
    <div className="flex h-screen w-full bg-[#050816] text-[#F8FAFC] overflow-hidden select-text">
      {/* 1. Desktop Left Sidebar */}
      <div className="hidden lg:flex shrink-0 h-full">
        <StudentAISidebar
          conversations={conversations}
          activeId={activeId}
          onSelectConversation={(id) => {
            setActiveId(id);
            setErrorMessage(null);
          }}
          onCreateNewChat={handleCreateNewChat}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onSelectSubjectPrompt={(p) => handleSendMessage(p)}
          onSelectEducatorTool={(tool, p) => handleSendMessage(p)}
          onExportAll={handleExportAll}
          onClearAll={handleClearAll}
        />
      </div>

      {/* 2. Mobile Drawer Navigation */}
      <StudentAIMobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          setErrorMessage(null);
        }}
        onCreateNewChat={handleCreateNewChat}
        onDeleteConversation={handleDeleteConversation}
        onSelectSubjectPrompt={(p) => handleSendMessage(p)}
        onSelectEducatorTool={(tool, p) => handleSendMessage(p)}
        onExportAll={handleExportAll}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#080D22] overflow-hidden relative">
        {/* Top Navigation Bar */}
        <StudentAITopBar
          onToggleMobileSidebar={() => setMobileDrawerOpen(true)}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          isLoggedIn={Boolean(user)}
          userEmail={user?.email || null}
          userInitial={user?.email ? user.email.slice(0, 2).toUpperCase() : 'AI'}
          userName={user?.email?.split('@')[0] || 'Student'}
          onSignOut={signOut}
          onOpenAuthModal={openAuthModal}
          onOpenVideoModal={() => setVideoModalOpen(true)}
          onOpenDocModal={() => setDocModalOpen(true)}
        />

        {/* Scrollable Center Content Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 scrollbar-thin"
        >
          <div className="max-w-4xl mx-auto w-full">
            {messages.length === 0 ? (
              /* Empty State: Hero Banner + 4 Action Cards + Popular Prompts */
              <div className="animate-in fade-in duration-300">
                <StudentAIHero greeting={greeting} subtitle={subtitle} />
                <StudentAIActionCards onSelectCard={(p) => handleSendMessage(p)} />

                {/* Wireframe Divider: AI CONVERSATION */}
                <div className="relative my-6 text-center select-none">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800/80"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#050816] px-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6D5DFB]"></span>
                      AI CONVERSATION
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>
                    </span>
                  </div>
                </div>

                <StudentAIPromptChips onSelectPrompt={(p) => handleSendMessage(p)} />
              </div>
            ) : (
              /* Active Chat State: Render message stream */
              <div className="space-y-4 pb-6">
                {/* Topic Subheader Banner */}
                <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate max-w-sm">
                      {activeConversation?.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#162046] text-[#A5B4FC] text-[10px] uppercase font-bold">
                      {currentMode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateNewChat}
                    className="hover:text-white transition-colors text-[11px]"
                  >
                    + New Session
                  </button>
                </div>

                {/* Wireframe Divider: AI CONVERSATION */}
                <div className="relative my-4 text-center select-none">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800/80"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#050816] px-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6D5DFB]"></span>
                      AI CONVERSATION
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>
                    </span>
                  </div>
                </div>

                {/* Messages List */}
                {messages.map((msg, index) => (
                  <StudentAIChatMessage
                    key={index}
                    message={msg}
                    timestamp={msg.timestamp}
                    isLatest={index === messages.length - 1}
                    onRetry={msg.role === 'assistant' ? handleRetryLast : undefined}
                    onExplainSimpler={handleExplainSimpler}
                    onQuizMe={handleQuizMe}
                  />
                ))}

                {/* Live Streaming Assistant Message */}
                {isStreaming && (
                  <div className="w-full my-4 rounded-2xl bg-[#0C132E]/90 border border-indigo-500/40 shadow-xl p-4 sm:p-5 text-left animate-in fade-in">
                    <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6D5DFB] to-[#3B82F6] flex items-center justify-center text-white shadow-xs">
                        <Sparkles className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white">
                          StudentAI Assistant
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#18234E] text-[#A5B4FC] border border-[#6D5DFB]/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-ping" />
                          Thinking...
                        </span>
                      </div>
                    </div>

                    <div className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {streamingMessage || (
                        <div className="text-slate-400 text-xs flex items-center gap-2 py-2">
                          <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-ping" />
                          <span>Consulting verified knowledge sources and synthesizing explanation...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetryLast}
                      className="font-bold underline hover:no-underline text-xs"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Floating Scroll Bottom Button */}
        {showScrollBottomBtn && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <button
              type="button"
              onClick={() => scrollToBottom('smooth')}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#6D5DFB] hover:bg-[#5B4AE3] text-white text-xs font-bold shadow-xl shadow-[#6D5DFB]/40 active:scale-95 transition-all"
            >
              <ChevronDown className="w-4 h-4 animate-bounce" />
              <span>↓ New messages</span>
            </button>
          </div>
        )}

        {/* Floating Glass Composer */}
        <StudentAIComposer
          input={input}
          setInput={setInput}
          onSubmit={() => handleSendMessage()}
          isLoading={isLoading}
          onStop={handleStopGeneration}
          mode={currentMode}
          onSelectMode={handleSetMode}
          placeholder="Ask StudentAI anything..."
          onOpenVideoModal={() => setVideoModalOpen(true)}
          onOpenDocModal={() => setDocModalOpen(true)}
        />
      </div>

      {/* 4. Live Video AI Assistant Modal (Lumeo Experience) */}
      <StudentAIVideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        systemPrompt="You are StudentAI, an empathetic and highly intelligent video AI learning tutor. Speak clearly, concisely, and help students master challenging concepts."
      />

      {/* 5. Document AI Suite Modal (Summary, Study Guide, Translate, Chat) */}
      <StudentAIDocumentModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        onSendToWorkspaceChat={(prompt) => {
          setDocModalOpen(false);
          setInput(prompt);
        }}
      />
    </div>
  );
}
