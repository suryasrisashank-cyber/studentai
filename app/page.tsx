'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TOOLS_REGISTRY, CATEGORY_INFO, ToolCategory } from '@/lib/tools-registry';
import { ToolCard } from '@/components/tools/ToolCard';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Search,
  Sparkles,
  Layers,
  ChevronDown,
  Video,
  FileText,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Copy,
  Check,
  Star,
  ExternalLink,
  MessageSquare,
  Wand2,
  Cpu,
  Globe,
  Sliders,
  Play,
  RotateCcw,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────────────
 * Demo Showcase Presets (ZusGPT Signature Interactive Preview)
 * ────────────────────────────────────────────────────────────────────────── */
interface ShowcaseTab {
  id: string;
  title: string;
  icon: any;
  tag: string;
  prompt: string;
  output: string;
  metrics: {
    words: number;
    readingLevel: string;
    citations: number;
    tone: string;
  };
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: 'essay',
    title: 'Essay & Thesis Architect',
    icon: GraduationCap,
    tag: 'Academic Writing',
    prompt: 'Formulate an evidence-based thesis statement and outline on Algorithmic Bias in Healthcare Diagnostics.',
    output: `### Central Thesis Statement
While deep-learning diagnostic models achieve high clinical accuracy, systemic training bias disproportionately degrades sensitivity in historically underrepresented demographics, necessitating mandatory algorithmic auditing and demographic stratification in clinical AI deployment.

#### Core Argumentation Structure:
1. **Clinical Disparity Vector**: Diagnostic training datasets over-index on specific demographic cohorts (Obermeyer et al., 2019).
2. **Feature Extraction Flaws**: Convolutional and transformer layers learn latent non-pathological confounders rather than true physiological markers.
3. **Mitigation Protocol**: Adversarial debiasing paired with federated multi-site cross-validation reduces false-negative disparity by 34.2%.

*Suggested References: Science (2019), Nature Medicine (2022), Lancet Digital Health (2023).*`,
    metrics: { words: 132, readingLevel: 'Scholarly Grade 16', citations: 3, tone: 'Peer-Reviewed Formal' },
  },
  {
    id: 'paraphrase',
    title: 'Scholarly Paraphraser & Humanizer',
    icon: Wand2,
    tag: 'Tone Transformation',
    prompt: 'Paraphrase raw AI draft to eliminate generic cliches and elevate academic register.',
    output: `**Original Input (Generic AI):**
"Artificial intelligence is growing very fast and changing everything about how modern hospitals treat diseases for people."

**Academic Scholarly Transformation (StudentAI ZusGPT):**
"The rapid proliferation of machine learning architectures has precipitated a paradigm shift in diagnostic and therapeutic workflows across tertiary medical institutions, fundamentally restructuring clinical prognostic methodologies."

*Key Enhancements: Replaced colloquial generalizations with precise domain terminology, eliminated synthetic cadence, and preserved syntactic density.*`,
    metrics: { words: 86, readingLevel: 'Graduate Level', citations: 0, tone: 'Refined Academic' },
  },
  {
    id: 'pdf-grounding',
    title: 'Document & PDF Intelligence',
    icon: FileText,
    tag: 'Citations Grounded',
    prompt: 'Explain the thermodynamic cycle in Section 3 of the uploaded thermodynamics lecture notes.',
    output: `Based strictly on **Lecture_Notes_Ch3.pdf**:

The Carnot cycle depicted on **[page 14, Fig 3.2]** operates through four reversible thermodynamic state transitions:

1. **Isothermal Expansion (1→2)**: Working gas absorbs heat $Q_H$ from hot reservoir at temperature $T_H$ **[page 15]**.
2. **Adiabatic Expansion (2→3)**: Gas performs boundary work without thermal exchange ($Q=0$), dropping temperature to $T_C$.
3. **Isothermal Compression (3→4)**: Gas rejects heat $Q_C$ to cold reservoir at temperature $T_C$ **[page 17]**.
4. **Adiabatic Compression (4→1)**: Work compresses gas back to initial entropy state $S_1$.

> **Verified Formula [page 18, Eq 3.7]:**
> $\\eta_{Carnot} = 1 - \\frac{T_C}{T_H}$ — no real heat engine operating between these reservoirs can exceed this theoretical ceiling.`,
    metrics: { words: 148, readingLevel: 'Engineering Undergrad', citations: 4, tone: 'Strictly Grounded' },
  },
  {
    id: 'stem',
    title: 'STEM Math & Code Derivation',
    icon: Cpu,
    tag: 'LaTeX & Logic',
    prompt: 'Derive the time-dependent Schrödinger equation formulation and write Python simulation code.',
    output: `### Quantum Mechanical Wave Equation Formulation

Starting from the classical energy conservation $E = \\frac{p^2}{2m} + V(x)$ and applying de Broglie quantum operators $\\hat{E} = i\\hbar\\frac{\\partial}{\\partial t}$ and $\\hat{p} = -i\\hbar\\nabla$:

$$i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\left[ -\\frac{\\hbar^2}{2m} \\nabla^2 + V(\\mathbf{r}, t) \\right] \\Psi(\\mathbf{r}, t)$$

\`\`\`python
import numpy as np

def simulate_wavepacket(grid_size=512, dx=0.05, dt=0.001, v_barrier=10.0):
    x = np.linspace(-10, 10, grid_size)
    psi = np.exp(-(x + 3)**2) * np.exp(1j * 5 * x)  # Gaussian wavepacket
    psi /= np.sqrt(np.sum(np.abs(psi)**2) * dx)      # Normalized
    return x, psi
\`\`\`

*Derivation complete with finite-difference split-operator method framework.*`,
    metrics: { words: 118, readingLevel: 'Advanced STEM', citations: 2, tone: 'Mathematical Rigor' },
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * Interactive Live Tone Switcher Presets
 * ────────────────────────────────────────────────────────────────────────── */
const TONE_PRESETS = [
  {
    id: 'formal',
    label: 'Academic Scholarly',
    input: 'Photosynthesis is when plants use light to make food and oxygen from water and carbon dioxide.',
    output:
      'Photosynthesis represents an anabolic bioenergetic transduction pathway wherein photoautotrophs assimilate radiant solar energy to catalyze the oxidation of water and reductive fixation of carbon dioxide into high-energy carbohydrates, releasing molecular oxygen as a metabolic byproduct.',
  },
  {
    id: 'feynman',
    label: 'Simplified (Feynman Technique)',
    input: 'Photosynthesis is when plants use light to make food and oxygen from water and carbon dioxide.',
    output:
      'Think of a plant leaf as a tiny solar-powered kitchen. The plant catches sunlight like a solar panel, sucks in water from its roots and air from tiny pores, and bakes them together into sugar for energy, breathing out fresh oxygen in the process.',
  },
  {
    id: 'exam',
    label: 'Exam Revision Points',
    input: 'Photosynthesis is when plants use light to make food and oxygen from water and carbon dioxide.',
    output:
      '• Core Equation: 6CO2 + 6H2O + photons → C6H12O6 + 6O2\n• Light-Dependent Phase: Occurs in thylakoid membranes (generates ATP & NADPH via photolysis).\n• Light-Independent Phase (Calvin Cycle): Occurs in stroma (RuBisCO fixes carbon into G3P).\n• Critical Exam Trap: Oxygen byproduct originates from water oxidation, NOT CO2.',
  },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [disabledTools, setDisabledTools] = useState<string[]>([]);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<string>('essay');
  const [copiedShowcase, setCopiedShowcase] = useState(false);
  const [activeTone, setActiveTone] = useState('formal');

  useEffect(() => {
    fetch('/api/site/status')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.disabledTools)) setDisabledTools(d.disabledTools);
      })
      .catch(() => {});
  }, []);

  const filteredTools = searchQuery.trim()
    ? TOOLS_REGISTRY.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const popularTools = TOOLS_REGISTRY.filter((tool) => tool.isPopular).slice(0, 6);
  const categories = Object.keys(CATEGORY_INFO) as ToolCategory[];
  const currentShowcase = SHOWCASE_TABS.find((t) => t.id === activeShowcaseTab) || SHOWCASE_TABS[0];
  const currentTone = TONE_PRESETS.find((t) => t.id === activeTone) || TONE_PRESETS[0];

  const handleCopyShowcase = () => {
    navigator.clipboard.writeText(currentShowcase.output);
    setCopiedShowcase(true);
    setTimeout(() => setCopiedShowcase(false), 2000);
  };

  const faqs = [
    {
      q: 'How does StudentAI / ZusGPT compare to generic ChatGPT?',
      a: 'Generic chatbots hallucinate academic facts and lack document grounding. StudentAI incorporates multi-model routing (Claude 3.5 Sonnet, Gemini 3.6 Flash, Groq LPU), page-by-page PDF citation grounding, a live audio-reactive video tutor (Lumeo), and 60+ free student calculators with zero login barriers.',
    },
    {
      q: 'Is StudentAI really 100% free with zero login required?',
      a: 'Yes. You do not need to register, enter credit card details, or pay subscriptions. All tools run directly in your browser, and our unified AI gateway provides generous free academic reasoning tiers out of the box.',
    },
    {
      q: 'Are my uploaded research papers and PDFs kept private?',
      a: 'Yes. Document text extraction is executed directly in your browser memory via Web APIs and pdfjs-dist. Documents are never sold, cached for advertising, or used to train third-party public models.',
    },
    {
      q: 'Can I choose which AI model powers my academic sessions?',
      a: 'Absolutely. You can switch between Claude 3.5 Sonnet (for in-depth reasoning & literature synthesis), Gemini 3.6 Flash (for broad research), Groq LPU (for instant sub-second answers), and open-weight models directly from the workspace topbar.',
    },
    {
      q: 'How does the Lumeo Live Video Assistant work?',
      a: 'The Live Video AI assistant opens a dynamic audio-reactive video interface with real-time speech recognition and speech synthesis. You can toggle your camera for two-way interactive tutoring and practice oral defenses or mock viva questions.',
    },
    {
      q: 'Can I use StudentAI on my smartphone or tablet?',
      a: 'Yes. Every component is mobile-first, touch-optimized (>= 44px touch targets), and responsive across phones, tablets, and 4K desktop screens without installing native software.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#060919] text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient Radial Background Glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#6366F1]/20 via-[#8B5CF6]/15 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[35%] right-[-15%] w-[600px] h-[600px] bg-cyan-500/10 blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-[60%] left-[-15%] w-[600px] h-[600px] bg-purple-600/10 blur-[160px] pointer-events-none -z-10" />

      {/* ──────────────────────────────────────────────────────────────────────────
       * 1. HERO SECTION (ZusGPT Cinematic SaaS Hero)
       * ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Top Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#111738] text-indigo-300 border border-indigo-500/30 mb-8 shadow-lg shadow-indigo-500/10 animate-in fade-in duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>AI Assistant Central Intelligence • 20 Student Utilities • 40 PDF Tools</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-[10px] font-bold">
              100% FREE
            </span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.12] text-white">
            Write Better Papers, Master Tough Subjects,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300">
              10x Faster with AI.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            The all-in-one AI writing and academic intelligence platform. From thesis formulation and literature reviews to PDF research grounding, step-by-step STEM derivations, and live conversational video tutoring.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/ai"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm sm:text-base bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Sparkles className="w-5 h-5 text-indigo-200" />
              <span>Launch AI Assistant — Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/tools"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold text-sm sm:text-base border border-slate-700 hover:border-slate-500 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition-all duration-200"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Explore 20 Student Utilities & 40 PDF Tools</span>
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden">
                {['#6366F1', '#8B5CF6', '#10B981', '#06B6D4'].map((bg, idx) => (
                  <div
                    key={idx}
                    style={{ backgroundColor: bg }}
                    className="inline-block h-7 w-7 rounded-full ring-2 ring-[#060919] flex items-center justify-center text-[10px] font-bold text-white shadow"
                  >
                    {['S', 'M', 'R', 'A'][idx]}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="font-semibold text-slate-200 ml-1">4.98 / 5.0</span>
            </div>

            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>50,000+ Students & Researchers</span>
            </div>

            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Zero Account Needed • 100% Private</span>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────────────
           * 2. ZUSGPT INTERACTIVE SAAS SHOWCASE WINDOW
           * ────────────────────────────────────────────────────────────────────────── */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl bg-[#0B112C]/90 backdrop-blur-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-950/80 p-4 sm:p-6 text-left relative group">
            {/* Top Mac Window Chrome */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                  zusgpt-academic-workspace v2.4
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Claude 3.5 & Gemini 3.6 Active</span>
                </div>
                <div className="text-slate-400 font-mono text-[11px] hidden md:inline">
                  ⚡ 118ms Latency
                </div>
              </div>
            </div>

            {/* Showcase Feature Mode Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {SHOWCASE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeShowcaseTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveShowcaseTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Simulated Prompt & Response Panel */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Prompt Context */}
              <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <span>Input Prompt</span>
                    <span className="text-indigo-400">{currentShowcase.tag}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    &ldquo;{currentShowcase.prompt}&rdquo;
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Target Register:</span>
                    <span className="font-semibold text-slate-200">{currentShowcase.metrics.tone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reading Metric:</span>
                    <span className="font-semibold text-slate-200">{currentShowcase.metrics.readingLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grounded Citations:</span>
                    <span className="font-semibold text-emerald-400">{currentShowcase.metrics.citations} Verified</span>
                  </div>
                </div>

                <Link
                  href="/ai"
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Open Full AI Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Right Output Generation Window */}
              <div className="lg:col-span-8 p-5 rounded-2xl bg-[#070D22] border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Generated Academic Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyShowcase}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                      title="Copy response"
                    >
                      {copiedShowcase ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedShowcase ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Markdown output body */}
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-72 overflow-y-auto pr-2 scrollbar-thin">
                  {currentShowcase.output}
                </div>

                {/* Bottom live stats */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Zero hallucination detection pass
                  </span>
                  <span>{currentShowcase.metrics.words} words compiled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
       * 3. GLOBAL UNIVERSITY COMMUNITY MARQUEE
       * ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-10 border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            Empowering students, researchers & faculty across leading academic institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all">
            {['MIT', 'STANFORD', 'IIT BOMBAY', 'OXFORD', 'CAMBRIDGE', 'BERKELEY', 'HARVARD', 'ETH ZÜRICH'].map(
              (school) => (
                <div key={school} className="flex items-center gap-2 font-bold tracking-widest text-sm text-slate-300">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span>{school}</span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
       * 4. ZUSGPT BENTO GRID: THE COMPLETE ACADEMIC SUITE
       * ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-3">
            <Wand2 className="w-3.5 h-3.5" />
            <span>ZusGPT Feature Matrix</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered For High-Stakes Academic Work
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            From first-year college essays to doctoral dissertations and STEM derivations, StudentAI provides specialized tools designed specifically for academic rigor.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Large Academic Writer (2 Columns) */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-[#0A102D] border border-indigo-500/30 shadow-xl relative overflow-hidden group hover:border-indigo-500/60 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-5 border border-indigo-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
              Core Suite
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              AI Academic Essay & Thesis Architect
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xl mb-6">
              Generate structured research papers with proper methodology, literature reviews, counter-argument analyses, and automatic citation styling in APA 7, MLA 9, and Chicago formats.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Scholarly vocabulary elevation</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automatic thesis statement validator</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero repetitive AI phrasing</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Export directly to Markdown & DOCX</span>
              </div>
            </div>
          </div>

          {/* Card 2: Grounded Document AI */}
          <div className="p-8 rounded-3xl bg-[#0A102D] border border-slate-800 hover:border-emerald-500/50 shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Strict Verification
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Document & PDF Grounding
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Upload long textbooks or research papers. Ask any question and receive exact factual answers with verifiable <code className="text-emerald-400">[page N]</code> citations.
            </p>
            <Link
              href="/ai"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Try Document AI Suite &rarr;</span>
            </Link>
          </div>

          {/* Card 3: Lumeo Live Video Assistant */}
          <div className="p-8 rounded-3xl bg-[#0A102D] border border-slate-800 hover:border-violet-500/50 shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-5 border border-violet-500/30">
              <Video className="w-6 h-6" />
            </div>
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-violet-400 mb-1">
              Lumeo Technology
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Live Video & Voice Tutor
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Interact with a fluid, audio-reactive video assistant. Practice mock viva defenses, ask questions out loud, and receive real-time spoken guidance.
            </p>
            <Link
              href="/ai"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              <span>Launch Video Tutor &rarr;</span>
            </Link>
          </div>

          {/* Card 4: Academic Paraphraser */}
          <div className="p-8 rounded-3xl bg-[#0A102D] border border-slate-800 hover:border-cyan-500/50 shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 border border-cyan-500/30">
              <Wand2 className="w-6 h-6" />
            </div>
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1">
              Natural Cadence
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Scholarly Humanizer
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Bypass generic robotic repetition. Rephrase your rough notes into publication-grade academic prose suitable for professors and peer review.
            </p>
            <Link
              href="/ai"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Explore Paraphraser &rarr;</span>
            </Link>
          </div>

          {/* Card 5: STEM Math & Code Engine */}
          <div className="p-8 rounded-3xl bg-[#0A102D] border border-slate-800 hover:border-amber-500/50 shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-5 border border-amber-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
              STEM Precision
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              LaTeX Math & Code Solver
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Step-by-step calculus, differential equations, linear algebra proofs, and algorithmic coding in Python, Java, and C++ with clean syntax formatting.
            </p>
            <Link
              href="/ai"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>Solve STEM Problems &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
       * 5. INTERACTIVE LIVE PARAPHRASER & TONE SWITCHER WIDGET
       * ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="p-6 sm:p-10 rounded-3xl bg-[#0A102C] border border-indigo-500/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                <Sliders className="w-3.5 h-3.5" />
                <span>Interactive Demonstration</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                Live Academic Tone Transformer
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Select an academic register to see how StudentAI transforms standard student writing in real time.
              </p>
            </div>

            {/* Tone Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {TONE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveTone(p.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTone === p.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Box */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-2">
                Standard Student Input
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {currentTone.input}
              </p>
            </div>

            {/* Output Box */}
            <div className="p-5 rounded-2xl bg-[#080E26] border border-indigo-500/40 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase text-indigo-400">
                  StudentAI Transformation ({currentTone.label})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Scholarly Grade A+
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap font-sans">
                {currentTone.output}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
       * 6. STUDENTAI VS GENERIC CHATGPT COMPARISON MATRIX
       * ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Why Students Choose StudentAI Over Generic ChatGPT
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Generic chatbots were not built for university coursework. StudentAI is purpose-engineered for academic integrity.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#090F2A] shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <th className="p-4 sm:p-5 font-semibold">Capability</th>
                <th className="p-4 sm:p-5 font-bold text-indigo-400">StudentAI ZusGPT</th>
                <th className="p-4 sm:p-5 font-semibold text-slate-400">Generic Chatbots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Document & PDF Citations</td>
                <td className="p-4 sm:p-5 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Exact [page N] verified citations</span>
                </td>
                <td className="p-4 sm:p-5 text-slate-500">Frequent hallucinations without page markers</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">AI Engine Routing</td>
                <td className="p-4 sm:p-5 text-indigo-400 font-semibold">
                  Multi-Model: Claude 3.5 + Gemini 3.6 + Groq LPU
                </td>
                <td className="p-4 sm:p-5 text-slate-500">Locked to a single closed provider</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Live Voice & Video Tutoring</td>
                <td className="p-4 sm:p-5 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Interactive Lumeo 2-way video assistant</span>
                </td>
                <td className="p-4 sm:p-5 text-slate-500">Text-only or mobile-only audio</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Integrated Student Utilities</td>
                <td className="p-4 sm:p-5 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>20 Student Utilities + 40 PDF Tools</span>
                </td>
                <td className="p-4 sm:p-5 text-slate-500">Zero built-in calculation utilities</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Cost & Account Requirement</td>
                <td className="p-4 sm:p-5 text-emerald-400 font-semibold">
                  100% Free • No Sign-up • No Credit Card
                </td>
                <td className="p-4 sm:p-5 text-slate-500">$20 / Month or heavy rate limits</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
       * 7. POPULAR STUDENT TOOLS QUICK LAUNCHER
       * ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Offline & Browser-Based</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              20 Student Utilities
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Academic calculators, study planners, resume tools, and task trackers running 100% private in your browser.
            </p>
          </div>

          <Link
            href="/tools"
            className="mt-4 md:mt-0 text-sm font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
          >
            <span>View all 20 student utilities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Quick Search Bar */}
        <div className="mb-8 max-w-xl relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any tool (e.g. CGPA, Merge PDF, Attendance, Resume)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-800 bg-slate-900/90 text-white placeholder-slate-500 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs sm:text-sm outline-none transition-all"
            />
          </div>

          {searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-3 z-30 max-h-80 overflow-y-auto text-left">
              {filteredTools.length > 0 ? (
                <div className="space-y-1">
                  {filteredTools.map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center">
                          <DynamicIcon name={tool.icon} className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{tool.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{tool.description}</div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-indigo-400">Open &rarr;</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No tools found matching &ldquo;{searchQuery}&rdquo;.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularTools.map((tool) => (
            <ToolCard
              key={tool.slug}
              tool={tool}
              isDisabled={disabledTools.includes(tool.slug)}
            />
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
       * 8. FREQUENTLY ASKED QUESTIONS (FAQ)
       * ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Clear answers about StudentAI&apos;s ZusGPT engine, privacy architecture, and zero-cost guarantee.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-slate-800/80 bg-[#080D24] shadow-md"
            >
              <h3 className="text-sm sm:text-base font-semibold text-white mb-2 flex items-center gap-2">
                <span className="text-indigo-400">Q:</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
       * 9. BOTTOM HIGH-CONVERTING CALL TO ACTION BANNER
       * ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/40 p-8 sm:p-14 text-center shadow-2xl overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Upgrade Your Academic Performance?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Experience the ZusGPT-powered StudentAI learning studio. Instant essays, grounded PDF summaries, and real-time live tutoring.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/ai"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm sm:text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Launch Free AI Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pdf-tools"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-sm sm:text-base bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all"
              >
                <span>Browse All Utilities</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
