'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Square,
  FileText,
  RotateCcw,
  Zap,
  Globe,
} from 'lucide-react';
import { ChatMessage } from '@/lib/ai/types';

interface StudentAIVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage?: (query: string) => Promise<string | void>;
  activeConversationTitle?: string;
  selectedModel?: string;
  systemPrompt?: string;
}

type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function StudentAIVideoModal({
  isOpen,
  onClose,
  onSendMessage,
  activeConversationTitle = 'Live Video Assistant',
  selectedModel = 'studentai-pro',
  systemPrompt,
}: StudentAIVideoModalProps) {
  const [state, setState] = useState<AssistantState>('idle');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [aiSpeechText, setAiSpeechText] = useState('Hello! I am your StudentAI live assistant. What would you like to explore or solve together today?');
  const [manualInput, setManualInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const stateRef = useRef<AssistantState>(state);
  stateRef.current = state;

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      stopSpeech();
      return;
    }

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setState('listening');
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognition.onerror = () => {
          setState('idle');
        };

        recognition.onend = () => {
          if (isMicOn && isOpen && stateRef.current === 'listening') {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognitionRef.current = recognition;
        if (isMicOn) {
          try {
            recognition.start();
          } catch {}
        }
      }
    }

    return () => {
      stopSpeech();
      stopCamera();
    };
  }, [isOpen, isMicOn]);

  // Speech synthesis speaker
  const speakText = (text: string) => {
    if (!isSoundOn || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setState('idle');
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown and code symbols for cleaner spoken text
    const cleanSpoken = text
      .replace(/```[\s\S]*?```/g, 'Here is the code sample.')
      .replace(/[\*\#\_\|]/g, '')
      .slice(0, 450);

    const utterance = new SpeechSynthesisUtterance(cleanSpoken);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setState('speaking');
    };

    utterance.onend = () => {
      setState('idle');
      if (isMicOn && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    };

    utterance.onerror = () => {
      setState('idle');
    };

    synthesisUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsVideoOn(true);
    } catch {
      setIsVideoOn(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVideoOn(false);
  };

  const handleToggleVideo = () => {
    if (isVideoOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleToggleMic = () => {
    if (isMicOn) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsMicOn(false);
      setState('idle');
    } else {
      setIsMicOn(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    }
  };

  const handleToggleSound = () => {
    if (isSoundOn) {
      stopSpeech();
      setIsSoundOn(false);
    } else {
      setIsSoundOn(true);
    }
  };

  const handleSubmitQuestion = async (queryText?: string) => {
    const query = (queryText || transcript || manualInput).trim();
    if (!query) return;

    setState('thinking');
    setTranscript('');
    setManualInput('');
    stopSpeech();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          mode: 'explain',
          stream: false,
        }),
      });

      if (!res.ok) {
        throw new Error('Could not complete audio reasoning.');
      }

      const data = await res.json();
      const answer = data.text || 'I have analyzed your request.';
      setAiSpeechText(answer);
      speakText(answer);
    } catch {
      const fallback = "I'm having trouble processing that right now. Please try asking again.";
      setAiSpeechText(fallback);
      speakText(fallback);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-6 animate-in fade-in duration-300">
      {/* Outer Glow Container */}
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[780px] rounded-3xl bg-gradient-to-b from-[#0B112C] via-[#070D22] to-[#040816] border border-slate-700/70 shadow-[0_0_80px_rgba(109,93,251,0.25)] flex flex-col justify-between overflow-hidden">
        {/* Background Ambient Aura */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#6D5DFB]/15 filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full bg-[#22D3EE]/10 filter blur-[90px] pointer-events-none" />

        {/* Top Controls Header */}
        <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between border-b border-slate-800/80 bg-[#070C24]/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6D5DFB] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-[#6D5DFB]/30">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Lumeo Live Video Assistant
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1A2657] text-[#38BDF8] border border-[#38BDF8]/40 animate-pulse">
                  LIVE INTERACTION
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Model: <span className="text-white font-medium capitalize">{selectedModel}</span> &bull; {activeConversationTitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2.5 rounded-xl border transition-colors ${
                isSoundOn
                  ? 'bg-[#121B42] text-white border-slate-700'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800'
              }`}
              title={isSoundOn ? 'Mute AI Voice' : 'Unmute AI Voice'}
            >
              {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[#121B42] hover:bg-[#1A2657] text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Exit Video Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Arena: Glowing Audio-Reactive Lumeo Orb + Video Feed */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
          {/* User Video Camera PIP Screen */}
          {isVideoOn && (
            <div className="absolute top-4 right-4 z-20 w-36 h-28 sm:w-48 sm:h-36 rounded-2xl overflow-hidden border-2 border-[#6D5DFB]/60 shadow-2xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute bottom-1 left-2 text-[9px] font-bold bg-black/60 px-1.5 py-0.5 rounded text-white">
                YOU
              </div>
            </div>
          )}

          {/* Central Lumeo Interactive Fluid Orb */}
          <div className="relative flex items-center justify-center select-none my-6">
            {/* Outer Concentric Pulse Waves */}
            <div
              className={`absolute rounded-full border border-[#6D5DFB]/40 transition-all duration-700 ${
                state === 'speaking'
                  ? 'w-72 h-72 scale-110 opacity-70 animate-ping'
                  : state === 'listening'
                  ? 'w-64 h-64 scale-105 opacity-50 animate-pulse'
                  : 'w-56 h-56 scale-95 opacity-20'
              }`}
            />
            <div
              className={`absolute rounded-full border border-[#22D3EE]/30 transition-all duration-500 ${
                state === 'speaking'
                  ? 'w-64 h-64 scale-105 opacity-80'
                  : 'w-48 h-48 opacity-30'
              }`}
            />

            {/* Core Fluid Glowing Sphere */}
            <div
              className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(109,93,251,0.6)] transition-all duration-500 ${
                state === 'speaking'
                  ? 'bg-gradient-to-tr from-[#6D5DFB] via-[#8B5CF6] to-[#22D3EE] scale-105 animate-pulse'
                  : state === 'listening'
                  ? 'bg-gradient-to-tr from-[#3B82F6] via-[#22D3EE] to-[#6D5DFB] scale-100'
                  : state === 'thinking'
                  ? 'bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#3B82F6] animate-spin'
                  : 'bg-gradient-to-tr from-[#4F46E5] to-[#1E1B4B] scale-95'
              }`}
            >
              {/* Internal Waveform Frequency Bars */}
              <div className="flex items-center gap-1.5">
                {[12, 28, 42, 58, 42, 28, 14].map((h, idx) => (
                  <span
                    key={idx}
                    style={{
                      height:
                        state === 'speaking'
                          ? `${Math.max(14, (h * Math.random() + 20) % 65)}px`
                          : state === 'listening'
                          ? `${Math.max(10, (h * 0.7) % 40)}px`
                          : '12px',
                    }}
                    className="w-1.5 rounded-full bg-white/90 shadow-sm transition-all duration-150"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Assistant Live Status Indicator */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#10193D] border border-slate-700 text-white mb-3">
            <span
              className={`w-2 h-2 rounded-full ${
                state === 'speaking'
                  ? 'bg-[#22D3EE] animate-ping'
                  : state === 'listening'
                  ? 'bg-[#34D399] animate-pulse'
                  : state === 'thinking'
                  ? 'bg-[#FBBF24] animate-spin'
                  : 'bg-slate-400'
              }`}
            />
            <span>
              {state === 'speaking'
                ? 'AI Speaking...'
                : state === 'listening'
                ? 'Listening to your voice...'
                : state === 'thinking'
                ? 'Synthesizing knowledge...'
                : 'Ready for next question'}
            </span>
          </div>

          {/* Real-time Subtitle / Caption HUD */}
          <div className="w-full max-w-xl min-h-[75px] max-h-28 overflow-y-auto px-4 py-2.5 rounded-2xl bg-[#09102B]/80 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed scrollbar-none shadow-inner">
            {transcript ? (
              <p className="text-white italic">&ldquo;{transcript}&rdquo;</p>
            ) : (
              <p className="text-slate-300">{aiSpeechText}</p>
            )}
          </div>
        </div>

        {/* Bottom Interactive HUD Controls */}
        <div className="relative z-10 p-4 sm:p-6 border-t border-slate-800/80 bg-[#070C24]/80 backdrop-blur-md">
          {/* Quick Speech / Question Prompt Bar */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitQuestion();
              }}
              placeholder="Or type a question for live verbal analysis (e.g. Explain Round Robin CPU scheduling)..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0B1230] border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6D5DFB]"
            />
            <button
              type="button"
              onClick={() => handleSubmitQuestion()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6D5DFB] to-[#3B82F6] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#6D5DFB]/30 hover:brightness-110 transition-all"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Media Toggles & Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={handleToggleMic}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isMicOn
                    ? 'bg-[#182352] text-emerald-400 border border-emerald-500/40 shadow-xs'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-800'
                }`}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span>{isMicOn ? 'Mic Active' : 'Mic Muted'}</span>
              </button>

              {/* Camera Video Toggle */}
              <button
                type="button"
                onClick={handleToggleVideo}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isVideoOn
                    ? 'bg-[#182352] text-[#38BDF8] border border-[#38BDF8]/40 shadow-xs'
                    : 'bg-[#101738] text-slate-300 border border-slate-700 hover:text-white'
                }`}
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span>{isVideoOn ? 'Video ON' : 'Turn Video ON'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => speakText(aiSpeechText)}
                className="px-3 py-2 rounded-xl bg-[#101738] hover:bg-[#16214C] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Replay Audio"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Repeat Voice</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
