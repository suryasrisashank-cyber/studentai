'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Paperclip,
  Image as ImageIcon,
  Code2,
  GraduationCap,
  ChevronDown,
  Mic,
  Send,
  Square,
  Check,
  Sparkles,
} from 'lucide-react';
import { StudentAIMode } from '@/lib/ai/types';
import { MAX_USER_INPUT_LENGTH } from '@/lib/ai/security';

interface StudentAIComposerProps {
  input: string;
  setInput: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onStop: () => void;
  mode: StudentAIMode;
  onSelectMode: (mode: StudentAIMode) => void;
  placeholder?: string;
}

const STUDY_MODES: { id: StudentAIMode; label: string; icon: string }[] = [
  { id: 'general', label: 'Study Mode', icon: '🎓' },
  { id: 'explain', label: 'Concept Explanation', icon: '💡' },
  { id: 'exam', label: 'Exam Preparation', icon: '📝' },
  { id: 'practice', label: 'Problem & Code Solver', icon: '💻' },
  { id: 'summarize', label: 'Notes Summarizer', icon: '📑' },
  { id: 'career', label: 'Interview & Career Prep', icon: '💼' },
];

export function StudentAIComposer({
  input,
  setInput,
  onSubmit,
  isLoading,
  onStop,
  mode,
  onSelectMode,
  placeholder = 'Ask StudentAI anything...',
}: StudentAIComposerProps) {
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [codeModeActive, setCodeModeActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit();
      }
    }
  };

  const handleToggleCodeMode = () => {
    setCodeModeActive(!codeModeActive);
    if (!codeModeActive && !input.startsWith('```')) {
      setInput('```\n' + input + '\n```');
    }
  };

  const currentModeObj =
    STUDY_MODES.find((m) => m.id === mode) || STUDY_MODES[0];

  const charCount = input.length;
  const isOverLimit = charCount > MAX_USER_INPUT_LENGTH;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-2 z-20">
      {/* Floating Composer Card */}
      <div className="relative rounded-3xl bg-[#0C132E]/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-3 sm:p-3.5 transition-all focus-within:border-[#6D5DFB]/70 focus-within:ring-2 focus-within:ring-[#6D5DFB]/20">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.py,.js,.java,.cpp,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const fileNotice = `[Attached File: ${file.name} (${Math.round(file.size / 1024)} KB)]`;
              setInput(input ? `${input}\n${fileNotice}` : fileNotice);
            }
          }}
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="w-full bg-transparent resize-none outline-none text-xs sm:text-sm text-white placeholder-slate-400 min-h-[44px] max-h-40 px-2 py-1 leading-relaxed"
        />

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1 flex-wrap gap-2">
          {/* Left Actions: Attach, Image, Code, Study Mode */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach document"
              title="Attach study document"
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload diagram or image"
              title="Upload diagram or image"
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToggleCodeMode}
              aria-label="Code mode"
              title="Toggle code mode"
              className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
                codeModeActive
                  ? 'bg-[#18234E] text-[#8B5CF6] border border-[#6D5DFB]/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code2 className="w-4 h-4" />
            </button>

            {/* Study Mode Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#131B3E] hover:bg-[#1A2552] text-[#A5B4FC] border border-[#6D5DFB]/30 transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="font-semibold hidden xs:inline">{currentModeObj.label}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {modeDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setModeDropdownOpen(false)}
                  />
                  <div className="absolute bottom-9 left-0 w-56 p-1.5 rounded-2xl bg-[#0B1128] border border-slate-700/80 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-800">
                      Study Focus Mode
                    </div>
                    <div className="py-1 space-y-0.5">
                      {STUDY_MODES.map((sm) => (
                        <button
                          key={sm.id}
                          type="button"
                          onClick={() => {
                            onSelectMode(sm.id);
                            setModeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            mode === sm.id
                              ? 'bg-[#18234E] text-white font-bold'
                              : 'text-slate-300 hover:bg-[#121A3B]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{sm.icon}</span>
                            <span>{sm.label}</span>
                          </span>
                          {mode === sm.id && <Check className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Actions: Mic + Send Button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              aria-label="Voice input"
              title="Voice input"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>

            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30 transition-all"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!input.trim() || isOverLimit}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-[#6D5DFB] via-[#8B5CF6] to-[#3B82F6] hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 text-white flex items-center justify-center shadow-md shadow-[#6D5DFB]/40 active:scale-95 transition-all"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 -translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Micro Disclaimer */}
      <p className="text-[11px] text-slate-500 text-center mt-2 select-none">
        StudentAI can make mistakes. Verify important information.
      </p>
    </div>
  );
}
