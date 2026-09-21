'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Share2,
  Moon,
  Sun,
  Bell,
  Check,
  Menu,
  Cpu,
  Layers,
  Zap,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

interface StudentAITopBarProps {
  onToggleMobileSidebar: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  userInitial?: string;
  userName?: string;
}

const AVAILABLE_MODELS = [
  {
    id: 'studentai-pro',
    name: 'StudentAI Pro',
    tag: 'Fast & Comprehensive',
    provider: 'Google Gemini 3.6 Flash',
    icon: Sparkles,
  },
  {
    id: 'groq-lpu',
    name: 'Groq LPU (Ultra Fast)',
    tag: 'Sub-second Latency',
    provider: 'Groq GPT-OSS',
    icon: Zap,
  },
  {
    id: 'openrouter-free',
    name: 'OpenRouter Free Auto',
    tag: 'Community Cloud',
    provider: 'OpenRouter',
    icon: Layers,
  },
  {
    id: 'bytez-llama',
    name: 'Bytez Meta Llama 3',
    tag: 'Open-Weight Engine',
    provider: 'Bytez API',
    icon: Cpu,
  },
];

export function StudentAITopBar({
  onToggleMobileSidebar,
  selectedModel,
  onSelectModel,
  userInitial = 'SS',
  userName = 'Sashank',
}: StudentAITopBarProps) {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const currentModelObj =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <header className="sticky top-0 z-30 w-full h-14 px-4 sm:px-6 bg-[#050816]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between">
      {/* Left branding */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open sidebar"
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Sparkle Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6D5DFB] to-[#3B82F6] flex items-center justify-center text-white shadow-sm shadow-[#6D5DFB]/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-white">
            Student<span className="text-[#6D5DFB]">AI</span>
          </span>
        </div>

        {/* Study Workspace Badge */}
        <div className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#121936] text-[#A5B4FC] border border-[#6D5DFB]/30">
          Study Workspace
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#0E1530] hover:bg-[#151F46] text-slate-200 border border-slate-700/60 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="font-semibold">{currentModelObj.name}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {modelDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setModelDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 p-1.5 rounded-2xl bg-[#0B1128] border border-slate-700/80 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Select AI Reasoning Engine
                </div>
                <div className="py-1 space-y-1">
                  {AVAILABLE_MODELS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = m.id === currentModelObj.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onSelectModel(m.id);
                          setModelDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-start justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'bg-[#18234E] text-white border border-[#6D5DFB]/40'
                            : 'text-slate-300 hover:bg-[#121A3B]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-[#8B5CF6]' : 'text-slate-400'}`} />
                          <div>
                            <div className="text-xs font-bold leading-tight">{m.name}</div>
                            <div className="text-[10px] text-slate-400">{m.tag}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#8B5CF6] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share workspace"
          title={shareCopied ? 'Link copied!' : 'Share workspace'}
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative"
        >
          {shareCopied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title="Toggle theme"
          className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationOpen(!notificationOpen)}
            aria-label="Notifications"
            title="Notifications"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#6D5DFB]" />
          </button>

          {notificationOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 p-3 rounded-2xl bg-[#0B1128] border border-slate-700/80 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-white">
                  <span>Notifications</span>
                  <span className="text-[10px] text-[#8B5CF6]">All caught up</span>
                </div>
                <div className="py-2.5 space-y-2 text-xs text-slate-300">
                  <div className="p-2 rounded-xl bg-[#121A3B] border border-slate-800">
                    <p className="font-semibold text-white">Welcome to StudentAI Pro!</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Updated Gemini 3.6 Flash & Groq LPU reasoning pipelines active.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Avatar */}
        <div
          title={userName}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6D5DFB] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-[#6D5DFB]/30 select-none cursor-pointer"
        >
          {userInitial}
        </div>
      </div>
    </header>
  );
}
