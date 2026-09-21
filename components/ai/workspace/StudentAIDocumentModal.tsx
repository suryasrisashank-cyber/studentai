'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  BookOpen,
  Languages,
  MessageSquare,
  Upload,
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Send,
  AlertCircle,
  FileCheck,
  Settings,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { extractTextFromFile, ExtractedDocument } from '@/lib/pdf/extract-text';

export interface StudentAIDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToWorkspaceChat?: (prompt: string) => void;
}

type ToolTab = 'summary' | 'study' | 'translate' | 'chat' | 'settings';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

const LANGUAGES = [
  'English',
  'Hindi',
  'Spanish',
  'French',
  'German',
  'Telugu',
  'Tamil',
  'Bengali',
  'Marathi',
  'Japanese',
  'Chinese',
  'Arabic',
  'Russian',
];

export function StudentAIDocumentModal({
  isOpen,
  onClose,
  onSendToWorkspaceChat,
}: StudentAIDocumentModalProps) {
  const [activeTab, setActiveTab] = useState<ToolTab>('summary');
  const [file, setFile] = useState<File | null>(null);
  const [docData, setDocData] = useState<ExtractedDocument | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Summary Tool state
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [summaryLang, setSummaryLang] = useState('English');
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Study Guide Tool state
  const [studyLevel, setStudyLevel] = useState<'school' | 'undergrad' | 'exam'>('undergrad');
  const [studyQuestions, setStudyQuestions] = useState(8);
  const [studyLang, setStudyLang] = useState('English');
  const [studyResult, setStudyResult] = useState<string | null>(null);
  const [studyLoading, setStudyLoading] = useState(false);

  // Translate Tool state
  const [translateLang, setTranslateLang] = useState('Hindi');
  const [translateStyle, setTranslateStyle] = useState<'faithful' | 'simple'>('faithful');
  const [translateResult, setTranslateResult] = useState<string | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);

  // Chat with PDF state
  const [chatMessages, setChatMessages] = useState<ChatTurn[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Local BYOK settings
  const [localGeminiKey, setLocalGeminiKey] = useState('');
  const [useLocalKey, setUseLocalKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load local settings on mount
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('studentai_gemini_key');
      if (savedKey) {
        setLocalGeminiKey(savedKey);
        setUseLocalKey(true);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setExtracting(true);
    setSummaryResult(null);
    setStudyResult(null);
    setTranslateResult(null);
    setChatMessages([]);

    try {
      const doc = await extractTextFromFile(selectedFile, (msg) => setExtractProgress(msg));
      setDocData(doc);
    } catch (err: any) {
      setError(err?.message || 'Failed to extract text from file.');
      setDocData(null);
    } finally {
      setExtracting(false);
      setExtractProgress('');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generic request dispatcher: supports Server AI Gateway or direct client-side Gemini BYOK
  const executeDocumentAi = async (payload: {
    action: string;
    [key: string]: any;
  }): Promise<string> => {
    if (!docData) throw new Error('No document loaded.');

    if (useLocalKey && localGeminiKey.trim()) {
      // Direct client call to Gemini using user-supplied key
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
      let promptText = '';
      if (payload.action === 'summarize') {
        promptText = `You are helping a student understand this document. Summarize with depth: ${payload.length}. Answer in ${payload.targetLanguage}.\n\nDOCUMENT:\n${docData.text.slice(0, 30000)}`;
      } else if (payload.action === 'study-guide') {
        promptText = `Create a study revision guide for a ${payload.level} student in ${payload.targetLanguage}. Include Core ideas, Key terms, Things students get wrong, and ${payload.questions} Practice questions with answers.\n\nDOCUMENT:\n${docData.text.slice(0, 30000)}`;
      } else if (payload.action === 'translate') {
        promptText = `Translate the document into ${payload.targetLanguage} with style ${payload.style}. Keep [page N] markers.\n\nDOCUMENT:\n${docData.text.slice(0, 30000)}`;
      } else if (payload.action === 'chat') {
        promptText = `You answer questions strictly using this document. Cite [page N] markers. If not found, say so.\nDOCUMENT:\n${docData.text.slice(0, 30000)}\n\nQUESTION: ${payload.question}`;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': localGeminiKey.trim() },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Gemini API returned status ${res.status}`);
      }
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) throw new Error('Empty response from model.');
      return reply;
    }

    // Standard Server AI Gateway (/api/ai/pdf)
    const res = await fetch('/api/ai/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        text: docData.text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'AI request failed');
    }
    return data.text;
  };

  // Run Summary
  const handleRunSummary = async () => {
    if (!docData) return;
    setSummaryLoading(true);
    setError(null);
    try {
      const result = await executeDocumentAi({
        action: 'summarize',
        length: summaryLength,
        targetLanguage: summaryLang,
      });
      setSummaryResult(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Run Study Guide
  const handleRunStudyGuide = async () => {
    if (!docData) return;
    setStudyLoading(true);
    setError(null);
    try {
      const result = await executeDocumentAi({
        action: 'study-guide',
        level: studyLevel,
        questions: studyQuestions,
        targetLanguage: studyLang,
      });
      setStudyResult(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate study guide.');
    } finally {
      setStudyLoading(false);
    }
  };

  // Run Translation
  const handleRunTranslate = async () => {
    if (!docData) return;
    setTranslateLoading(true);
    setError(null);
    try {
      const result = await executeDocumentAi({
        action: 'translate',
        targetLanguage: translateLang,
        style: translateStyle,
      });
      setTranslateResult(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to translate document.');
    } finally {
      setTranslateLoading(false);
    }
  };

  // Send Chat Question
  const handleSendChat = async () => {
    if (!docData || !chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatInput('');
    setError(null);

    const updatedMessages: ChatTurn[] = [...chatMessages, { role: 'user', content: question }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const reply = await executeDocumentAi({
        action: 'chat',
        question,
        messages: updatedMessages,
      });
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      setError(err?.message || 'Failed to get answer from document.');
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${err?.message || 'Failed to process document context.'}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-100">StudentAI Document AI Suite</h2>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Grounded AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Summarize, create revision guides, translate, or chat directly with PDF & lecture notes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-lg text-xs transition-colors ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="AI Settings & BYOK"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Document Upload & Metadata */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/30 p-5 flex flex-col gap-4 overflow-y-auto">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Source Document
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.text"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />

            {!docData && !extracting ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-h-[160px] border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-slate-800/20 group"
              >
                <div className="p-3 rounded-full bg-slate-800/60 group-hover:bg-emerald-500/10 text-slate-400 group-hover:text-emerald-400 mb-3 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-200 mb-1">Click to Upload Document</p>
                <p className="text-xs text-slate-500">PDF, TXT, or Markdown (up to 30MB)</p>
              </div>
            ) : extracting ? (
              <div className="flex-1 min-h-[160px] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-900/40">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                <p className="text-sm font-medium text-slate-200">{extractProgress || 'Reading document…'}</p>
                <p className="text-xs text-slate-500 mt-1">Extracting text & page markers client-side</p>
              </div>
            ) : (
              <div className="border border-slate-700/60 rounded-xl p-4 bg-slate-850 bg-slate-900/60 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-200 truncate">{docData?.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {docData ? `${docData.totalPages} pages • ${(docData.size / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-center"
                  >
                    Change File
                  </button>
                  <button
                    onClick={() => {
                      setFile(null);
                      setDocData(null);
                      setChatMessages([]);
                      setSummaryResult(null);
                      setStudyResult(null);
                      setTranslateResult(null);
                    }}
                    className="py-1.5 px-3 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Badge */}
            <div className="mt-auto p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Document Grounded:</strong> Answers cite specific page references and never share your data with unauthorized third parties.
              </span>
            </div>
          </div>

          {/* Right Column: AI Tool Workbench */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50">
            {/* Tool Navigation Tabs */}
            <div className="flex items-center gap-1 px-5 pt-3 pb-0 border-b border-slate-800 overflow-x-auto">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 ${
                  activeTab === 'summary'
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AI Summary
              </button>

              <button
                onClick={() => setActiveTab('study')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 ${
                  activeTab === 'study'
                    ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                AI Study Guide
              </button>

              <button
                onClick={() => setActiveTab('translate')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 ${
                  activeTab === 'translate'
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Languages className="w-4 h-4" />
                Translate PDF
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 ${
                  activeTab === 'chat'
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Document
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Tool Content Panels */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* TAB 1: SUMMARY */}
              {activeTab === 'summary' && (
                <div className="flex flex-col gap-5 max-w-3xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        Summary Depth
                      </label>
                      <select
                        value={summaryLength}
                        onChange={(e) => setSummaryLength(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="short">Short — One Tight Paragraph</option>
                        <option value="medium">Medium — Summary + Key Takeaways</option>
                        <option value="long">Detailed — Section by Section Analysis</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        Answer Language
                      </label>
                      <select
                        value={summaryLang}
                        onChange={(e) => setSummaryLang(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={handleRunSummary}
                      disabled={!docData || summaryLoading}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {summaryLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Summarizing Document…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Academic Summary
                        </>
                      )}
                    </button>
                  </div>

                  {summaryResult && (
                    <div className="mt-3 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">Generated Summary</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(summaryResult, 'summary')}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                          >
                            {copiedKey === 'summary' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedKey === 'summary' ? 'Copied' : 'Copy'}
                          </button>
                          <button
                            onClick={() =>
                              handleDownload(
                                summaryResult,
                                `${docData?.name?.replace(/\.[^/.]+$/, '') || 'document'}_summary.md`,
                                'text/markdown'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download .MD
                          </button>
                        </div>
                      </div>

                      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {summaryResult}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: STUDY GUIDE */}
              {activeTab === 'study' && (
                <div className="flex flex-col gap-5 max-w-3xl">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        Target Education Level
                      </label>
                      <select
                        value={studyLevel}
                        onChange={(e) => setStudyLevel(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                      >
                        <option value="school">School / Foundation</option>
                        <option value="undergrad">Undergraduate / College</option>
                        <option value="exam">Competitive / Final Exam</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        Practice Questions
                      </label>
                      <input
                        type="number"
                        min={3}
                        max={20}
                        value={studyQuestions}
                        onChange={(e) => setStudyQuestions(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">Language</label>
                      <select
                        value={studyLang}
                        onChange={(e) => setStudyLang(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={handleRunStudyGuide}
                      disabled={!docData || studyLoading}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                    >
                      {studyLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Building Study Guide…
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4" />
                          Generate Revision Guide & Questions
                        </>
                      )}
                    </button>
                  </div>

                  {studyResult && (
                    <div className="mt-3 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">Exam Study Guide</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(studyResult, 'study')}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                          >
                            {copiedKey === 'study' ? (
                              <Check className="w-3.5 h-3.5 text-teal-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedKey === 'study' ? 'Copied' : 'Copy'}
                          </button>
                          <button
                            onClick={() =>
                              handleDownload(
                                studyResult,
                                `${docData?.name?.replace(/\.[^/.]+$/, '') || 'document'}_study_guide.md`,
                                'text/markdown'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download .MD
                          </button>
                        </div>
                      </div>

                      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {studyResult}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TRANSLATE */}
              {activeTab === 'translate' && (
                <div className="flex flex-col gap-5 max-w-3xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        Target Language
                      </label>
                      <select
                        value={translateLang}
                        onChange={(e) => setTranslateLang(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1.5">
                        Translation Style
                      </label>
                      <select
                        value={translateStyle}
                        onChange={(e) => setTranslateStyle(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="faithful">Faithful — Exact Academic Wording</option>
                        <option value="simple">Simplified — Easy for Learners</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={handleRunTranslate}
                      disabled={!docData || translateLoading}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                    >
                      {translateLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Translating Pages…
                        </>
                      ) : (
                        <>
                          <Languages className="w-4 h-4" />
                          Translate Document Content
                        </>
                      )}
                    </button>
                  </div>

                  {translateResult && (
                    <div className="mt-3 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">
                          Translated Text ({translateLang})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(translateResult, 'translate')}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                          >
                            {copiedKey === 'translate' ? (
                              <Check className="w-3.5 h-3.5 text-cyan-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedKey === 'translate' ? 'Copied' : 'Copy'}
                          </button>
                          <button
                            onClick={() =>
                              handleDownload(
                                translateResult,
                                `${docData?.name?.replace(/\.[^/.]+$/, '') || 'document'}_${translateLang.toLowerCase()}.txt`,
                                'text/plain'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download .TXT
                          </button>
                        </div>
                      </div>

                      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {translateResult}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CHAT WITH PDF */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full max-w-4xl">
                  {/* Chat Message Thread */}
                  <div
                    ref={chatScrollRef}
                    className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 min-h-[300px] max-h-[460px]"
                  >
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-200">
                          Ask anything about {docData?.name || 'your document'}
                        </p>
                        <p className="text-xs text-slate-400 max-w-md mt-1">
                          Questions are answered with factual precision grounded directly in the document text, complete with page citations.
                        </p>
                        {docData && (
                          <div className="flex flex-wrap gap-2 mt-4 justify-center">
                            {[
                              'What is the central theorem or concept?',
                              'Summarize key formulas and definitions',
                              'What are common misconceptions mentioned?',
                            ].map((prompt) => (
                              <button
                                key={prompt}
                                onClick={() => {
                                  setChatInput(prompt);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs text-slate-300 transition-colors"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-sm'
                                : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    )}

                    {chatLoading && (
                      <div className="flex items-center gap-2 p-3 text-xs text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>Searching document text & formulating answer…</span>
                      </div>
                    )}
                  </div>

                  {/* Chat Input Bar */}
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                      placeholder={
                        docData
                          ? `Ask a question about ${docData.name}…`
                          : 'Please upload a document first…'
                      }
                      disabled={!docData || chatLoading}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!docData || !chatInput.trim() || chatLoading}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: SETTINGS & BYOK */}
              {activeTab === 'settings' && (
                <div className="flex flex-col gap-5 max-w-2xl">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-1">AI Processing Configuration</h3>
                    <p className="text-xs text-slate-400">
                      By default, StudentAI routes your document requests through our unified high-speed server gateway.
                      You can optionally provide your own personal Gemini API key stored strictly in your browser.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-slate-200">Processing Mode</span>
                        <p className="text-[11px] text-slate-400">
                          {useLocalKey ? 'Client Direct (BYOK Key)' : 'StudentAI Cloud Gateway (Production)'}
                        </p>
                      </div>
                      <button
                        onClick={() => setUseLocalKey(!useLocalKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          useLocalKey
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {useLocalKey ? 'BYOK Enabled' : 'Use Cloud Gateway'}
                      </button>
                    </div>

                    {useLocalKey && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                        <label className="text-xs font-medium text-slate-300">
                          Your Personal Gemini API Key
                        </label>
                        <input
                          type="password"
                          value={localGeminiKey}
                          onChange={(e) => setLocalGeminiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              try {
                                localStorage.setItem('studentai_gemini_key', localGeminiKey.trim());
                                alert('Key saved locally in your browser.');
                              } catch {}
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-medium text-xs"
                          >
                            Save in Browser
                          </button>
                          <button
                            onClick={() => {
                              try {
                                localStorage.removeItem('studentai_gemini_key');
                                setLocalGeminiKey('');
                                setUseLocalKey(false);
                              } catch {}
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                          >
                            Clear Key
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
