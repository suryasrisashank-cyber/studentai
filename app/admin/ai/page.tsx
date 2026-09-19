'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Globe,
  Sliders,
  Play,
  Save,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { AISiteSettings } from '@/lib/ai/types';
import { ModelMetadata } from '@/lib/ai/models/catalog';

interface ProviderInfo {
  isConfigured: boolean;
  isAvailable: boolean;
  model: string;
  catalog: ModelMetadata[];
}

interface AIAdminData {
  telemetry: {
    available: boolean;
    providers: Record<
      string,
      {
        requests: number;
        successes: number;
        failures: number;
        fallbacks: number;
        avgLatencyMs: number;
      }
    >;
  };
  providers: Record<'google' | 'groq' | 'openrouter', ProviderInfo>;
  fallbackChain: string[];
  aiSettings: AISiteSettings;
}

interface TestConsoleResult {
  success: boolean;
  provider?: string;
  model?: string;
  latencyMs: number;
  textSnippet?: string;
  retrievalUsed?: boolean;
  sourcesCount?: number;
  sources?: { title: string; domain: string; url: string }[];
  error?: string;
}

export default function AdminAIPage() {
  const [data, setData] = useState<AIAdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Form State
  const [enabled, setEnabled] = useState(true);
  const [primaryProvider, setPrimaryProvider] = useState<'google' | 'groq' | 'openrouter'>('google');
  const [secondaryProvider, setSecondaryProvider] = useState<'google' | 'groq' | 'openrouter'>('groq');
  const [tertiaryProvider, setTertiaryProvider] = useState<'google' | 'groq' | 'openrouter'>('openrouter');
  const [googleModel, setGoogleModel] = useState('');
  const [groqModel, setGroqModel] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState('');
  const [retrievalEnabled, setRetrievalEnabled] = useState(true);
  const [maxOutputTokens, setMaxOutputTokens] = useState(1500);

  // Test Console State
  const [testPrompt, setTestPrompt] = useState('What are the key concepts of dynamic programming in computer science?');
  const [testWithRetrieval, setTestWithRetrieval] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConsoleResult | null>(null);

  const fetchAIData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/ai');
      if (res.ok) {
        const json: AIAdminData = await res.json();
        setData(json);

        if (json.aiSettings) {
          setEnabled(json.aiSettings.enabled);
          setPrimaryProvider(json.aiSettings.primaryProvider || 'google');
          setSecondaryProvider(json.aiSettings.secondaryProvider || 'groq');
          setTertiaryProvider(json.aiSettings.tertiaryProvider || 'openrouter');
          setGoogleModel(json.aiSettings.googleModel || json.providers.google.model);
          setGroqModel(json.aiSettings.groqModel || json.providers.groq.model);
          setOpenrouterModel(json.aiSettings.openrouterModel || json.providers.openrouter.model);
          setRetrievalEnabled(json.aiSettings.retrievalEnabled ?? true);
          setMaxOutputTokens(json.aiSettings.maxOutputTokens || 1500);
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          primaryProvider,
          secondaryProvider,
          tertiaryProvider,
          googleModel,
          groqModel,
          openrouterModel,
          retrievalEnabled,
          maxOutputTokens,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setData((prev) => (prev ? { ...prev, aiSettings: json.aiSettings } : prev));
        setSaveFeedback('AI settings saved successfully and loaded into active runtime.');
        setTimeout(() => setSaveFeedback(null), 4000);
      } else {
        const err = await res.json();
        setSaveFeedback(`Error: ${err.error || 'Failed to save settings'}`);
      }
    } catch {
      setSaveFeedback('Network error while updating settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunDiagnosticTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          testRetrieval: testWithRetrieval,
        }),
      });
      const json: TestConsoleResult = await res.json();
      setTestResult(json);
    } catch {
      setTestResult({
        success: false,
        latencyMs: 0,
        error: 'Failed to connect to diagnostic test endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const providers = data?.providers;
  const stats = data?.telemetry?.providers || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Control Center & Diagnostics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational telemetry, tri-state provider health, live model selection, and test console.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAIData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {saveFeedback && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          saveFeedback.startsWith('Error')
            ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
            : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
        }`}>
          {saveFeedback.startsWith('Error') ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Master Kill-Switch Card */}
      <div
        className={`p-5 rounded-3xl border shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          enabled
            ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
            : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
              enabled
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
            }`}
          >
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Assistant Platform Status</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  enabled
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                }`}
              >
                {enabled ? 'ONLINE & ACTIVE' : 'PAUSED (KILL SWITCH ENGAGED)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {enabled
                ? 'AI services are active on /ai, PDF AI tools process requests, and floating chat companion is enabled.'
                : 'Global kill switch is ON. All AI endpoints immediately reject requests with 503 before contacting upstream providers.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
            enabled
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {enabled ? 'Engage Global Kill Switch' : 'Re-Enable AI Services'}
        </button>
      </div>

      {/* Tri-State Provider Health & Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['google', 'groq', 'openrouter'] as const).map((pName) => {
          const p = providers?.[pName];
          const stat = stats[pName] || { requests: 0, successes: 0, failures: 0, fallbacks: 0, avgLatencyMs: 0 };
          const isConfigured = Boolean(p?.isConfigured);
          const isAvailable = Boolean(p?.isAvailable);
          const isOperational = isConfigured && isAvailable && stat.failures === 0;

          return (
            <div
              key={pName}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm capitalize text-slate-900 dark:text-white">{pName}</span>
                  {primaryProvider === pName && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Primary
                    </span>
                  )}
                </div>

                {/* Tri-State Badges */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isConfigured ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {isConfigured ? 'CONFIGURED' : 'UNCONFIGURED'}
                  </span>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isAvailable ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {isAvailable ? 'AVAILABLE' : 'CATALOG_MISMATCH'}
                  </span>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isOperational ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {isOperational ? 'OPERATIONAL' : 'DEGRADED/STANDBY'}
                  </span>
                </div>

                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Active Model:</span>
                    <span className="font-mono text-slate-900 dark:text-white font-semibold truncate max-w-[140px]">
                      {pName === 'google' ? googleModel : pName === 'groq' ? groqModel : openrouterModel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Latency:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{stat.avgLatencyMs || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {stat.requests > 0 ? Math.round((stat.successes / stat.requests) * 100) : 100}% ({stat.requests} reqs)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Runtime Configuration Form */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Runtime Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary Provider */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Primary Provider</label>
            <select
              value={primaryProvider}
              onChange={(e) => setPrimaryProvider(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="google">Google Gemini (Default)</option>
              <option value="groq">Groq LPU</option>
              <option value="openrouter">OpenRouter Free Auto</option>
            </select>
          </div>

          {/* Secondary Provider */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Secondary (1st Fallback)</label>
            <select
              value={secondaryProvider}
              onChange={(e) => setSecondaryProvider(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="groq">Groq LPU (Default)</option>
              <option value="google">Google Gemini</option>
              <option value="openrouter">OpenRouter Free Auto</option>
            </select>
          </div>

          {/* Tertiary Provider */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tertiary (2nd Fallback)</label>
            <select
              value={tertiaryProvider}
              onChange={(e) => setTertiaryProvider(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="openrouter">OpenRouter Free Auto (Default)</option>
              <option value="google">Google Gemini</option>
              <option value="groq">Groq LPU</option>
            </select>
          </div>
        </div>

        {/* Model Selections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Google Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Google Gemini Model</label>
            <input
              type="text"
              value={googleModel}
              onChange={(e) => setGoogleModel(e.target.value)}
              placeholder="e.g. gemini-2.5-flash"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
            />
            <p className="text-[10px] text-slate-400">Recommended: gemini-2.5-flash, gemini-3.1-flash</p>
          </div>

          {/* Groq Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Groq Model</label>
            <input
              type="text"
              value={groqModel}
              onChange={(e) => setGroqModel(e.target.value)}
              placeholder="e.g. openai/gpt-oss-120b"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
            />
            <p className="text-[10px] text-slate-400">Recommended: openai/gpt-oss-120b, qwen/qwen3.6-27b</p>
          </div>

          {/* OpenRouter Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">OpenRouter Model</label>
            <input
              type="text"
              value={openrouterModel}
              onChange={(e) => setOpenrouterModel(e.target.value)}
              placeholder="e.g. openrouter/free"
              className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
            />
            <p className="text-[10px] text-slate-400">Recommended: openrouter/free, nvidia/nemotron-3-ultra:free</p>
          </div>
        </div>

        {/* Retrieval and Tokens Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                Current-Data Web Retrieval
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Ground answers for temporal/recent queries via Wikipedia & DuckDuckGo APIs.
              </p>
            </div>
            <input
              type="checkbox"
              checked={retrievalEnabled}
              onChange={(e) => setRetrievalEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Max Output Tokens Limit
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Maximum token limit per response (100 - 8000).
              </p>
            </div>
            <input
              type="number"
              value={maxOutputTokens}
              onChange={(e) => setMaxOutputTokens(parseInt(e.target.value) || 1500)}
              min={100}
              max={8000}
              className="w-24 px-2 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving Changes...' : 'Save AI Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Admin AI Test Console */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-emerald-500" />
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin AI Test Console</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Execute live diagnostic requests to verify model latency, fallback triggers, and retrieval without leaking secrets.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            rows={2}
            placeholder="Enter test prompt..."
            className="w-full p-3 rounded-2xl text-xs border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-sans"
          />

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={testWithRetrieval}
                onChange={(e) => setTestWithRetrieval(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600"
              />
              <span>Test with real-time web retrieval</span>
            </label>

            <button
              type="button"
              onClick={handleRunDiagnosticTest}
              disabled={isTesting || !testPrompt.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
              <span>{isTesting ? 'Executing Test...' : 'Run Diagnostic Test'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Display */}
        {testResult && (
          <div className={`p-4 rounded-2xl border text-xs space-y-3 ${
            testResult.success
              ? 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  testResult.success ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {testResult.success ? 'TEST PASSED' : 'TEST FAILED'}
                </span>
                {testResult.provider && (
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    Provider: {testResult.provider} &bull; Model: {testResult.model}
                  </span>
                )}
              </div>
              <span className="font-mono text-slate-500">Latency: {testResult.latencyMs}ms</span>
            </div>

            {testResult.success ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {testResult.textSnippet}
                </div>
                {testResult.retrievalUsed && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    <span>Web retrieval used: {testResult.sourcesCount} verified sources found.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-rose-700 dark:text-rose-300 font-mono text-[11px]">
                Diagnostic Error: {testResult.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
