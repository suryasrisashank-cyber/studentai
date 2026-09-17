'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Settings2,
  Flame,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export function PomodoroTimer() {
  const tool = getToolBySlug('pomodoro')!;

  // Settings in minutes
  const [focusTime, setFocusTime] = useState<number>(25);
  const [shortBreakTime, setShortBreakTime] = useState<number>(5);
  const [longBreakTime, setLongBreakTime] = useState<number>(15);

  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load saved session stats
  useEffect(() => {
    const stats = getStorageItem<{ completedSessions: number }>(
      STORAGE_KEYS.POMODORO_STATS,
      { completedSessions: 0 }
    );
    if (stats && typeof stats.completedSessions === 'number') {
      setCompletedSessions(stats.completedSessions);
    }
  }, []);

  // Web Audio API synthesizer chime (0 external asset requests)
  const playSynthesizedChime = React.useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Harmonic chime: start at 587.33 Hz (D5) slide to 880 Hz (A5)
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch {
      // Audio not permitted or supported
    }
  }, [soundEnabled]);

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      playSynthesizedChime();

      if (mode === 'focus') {
        const nextSessions = completedSessions + 1;
        setCompletedSessions(nextSessions);
        setStorageItem(STORAGE_KEYS.POMODORO_STATS, { completedSessions: nextSessions });

        // Switch to long break every 4 sessions
        if (nextSessions % 4 === 0) {
          setMode('longBreak');
          setTimeLeft(longBreakTime * 60);
        } else {
          setMode('shortBreak');
          setTimeLeft(shortBreakTime * 60);
        }
      } else {
        setMode('focus');
        setTimeLeft(focusTime * 60);
      }
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, focusTime, shortBreakTime, longBreakTime, completedSessions, playSynthesizedChime]);

  // Update browser document tab title
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const modeLabel = mode === 'focus' ? 'Focus' : 'Break';
    if (typeof document !== 'undefined') {
      document.title = isRunning ? `(${formatted}) ${modeLabel} | StudentAI` : 'Pomodoro Timer | StudentAI';
    }
  }, [timeLeft, isRunning, mode]);

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'focus') setTimeLeft(focusTime * 60);
    else if (newMode === 'shortBreak') setTimeLeft(shortBreakTime * 60);
    else setTimeLeft(longBreakTime * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'focus') setTimeLeft(focusTime * 60);
    else if (mode === 'shortBreak') setTimeLeft(shortBreakTime * 60);
    else setTimeLeft(longBreakTime * 60);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      setMode('shortBreak');
      setTimeLeft(shortBreakTime * 60);
    } else {
      setMode('focus');
      setTimeLeft(focusTime * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTotalSeconds =
    mode === 'focus'
      ? focusTime * 60
      : mode === 'shortBreak'
      ? shortBreakTime * 60
      : longBreakTime * 60;
  const progressPercent = Math.max(0, Math.min(100, ((currentTotalSeconds - timeLeft) / currentTotalSeconds) * 100));

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Choose your focus interval (default 25 minutes) and start working on a single dedicated task.',
          'When the chime sounds, take a restorative 5-minute break away from your screen.',
          'After every 4 completed focus sessions, take an extended 15-minute break.',
          'The Pomodoro Technique prevents mental fatigue while building deep concentration.',
        ],
        faqs: [
          {
            q: 'Does the timer play sounds if my browser tab is in the background?',
            a: 'Yes, web audio synthesizer chimes play reliably even when you switch tabs.',
          },
          {
            q: 'Can I change the duration of focus and break cycles?',
            a: 'Yes, click the Settings button to customize focus, short break, and long break durations to match your preferences.',
          },
        ],
      }}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Mode Selector Tabs */}
        <div className="flex rounded-2xl p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => switchMode('focus')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              mode === 'focus'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Focus ({focusTime}m)
          </button>
          <button
            type="button"
            onClick={() => switchMode('shortBreak')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              mode === 'shortBreak'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Short Break ({shortBreakTime}m)
          </button>
          <button
            type="button"
            onClick={() => switchMode('longBreak')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              mode === 'longBreak'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Long Break ({longBreakTime}m)
          </button>
        </div>

        {/* Timer Main Card */}
        <div className="p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg text-center relative overflow-hidden">
          {/* Subtle Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                mode === 'focus'
                  ? 'bg-indigo-600'
                  : mode === 'shortBreak'
                  ? 'bg-emerald-500'
                  : 'bg-sky-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="text-xs uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">
            {mode === 'focus' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Recovery' : 'Extended Break'}
          </span>

          <div className="text-7xl sm:text-8xl font-mono font-black text-slate-900 dark:text-white my-6 tracking-tight">
            {formatTime(timeLeft)}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className={`px-8 py-4 rounded-2xl font-bold text-base shadow-lg transition-all flex items-center gap-2.5 ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 hover:scale-105'
              }`}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Skip to next phase"
              aria-label="Skip to next phase"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-4 rounded-2xl border transition-colors ${
                soundEnabled
                  ? 'border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
              title={soundEnabled ? 'Chime sound enabled' : 'Sound muted'}
              aria-label="Toggle chime sound"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-4 rounded-2xl border transition-colors ${
                showSettings
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
              title="Customize Durations"
              aria-label="Customize Durations"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>

          {/* Streak and Sessions info */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>
                Completed Sessions:{' '}
                <strong className="text-slate-900 dark:text-white font-bold text-sm">
                  {completedSessions}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                Cycle: {(completedSessions % 4) + 1} of 4
              </span>
            </div>
          </div>
        </div>

        {/* Custom Settings Panel */}
        {showSettings && (
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Customize Durations (Minutes)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Focus Time</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={focusTime}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 25;
                    setFocusTime(val);
                    if (mode === 'focus' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Short Break</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={shortBreakTime}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 5;
                    setShortBreakTime(val);
                    if (mode === 'shortBreak' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Long Break</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={longBreakTime}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 15;
                    setLongBreakTime(val);
                    if (mode === 'longBreak' && !isRunning) setTimeLeft(val * 60);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
