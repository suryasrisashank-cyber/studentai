import React from 'react';
import { Metadata } from 'next';
import { ShieldCheck, Lock, Database, Info, HardDrive, Bot, BarChart3, Clock } from 'lucide-react';
import { CookiePreferencesButton } from '@/components/privacy/CookiePreferencesButton';

export const metadata: Metadata = {
  title: 'Privacy Policy — Transparent Data & Telemetry Handling',
  description:
    'Learn how StudentAI handles client-side student tools, anonymous operational telemetry, AI gateway routing, and administrator controls.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy & Data Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Last updated: September 2026 &bull; Effective immediately
        </p>
      </div>

      <div className="p-5 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed space-y-3">
        <p className="font-bold text-sm">Our Privacy Commitments at a Glance:</p>
        <p>
          &bull; <strong>Private Tool Content:</strong> Grades, calculations, attendance records, study notes, todo tasks, and uploaded resume text remain strictly on your local device. We never store your academic inputs on our server.
        </p>
        <p>
          &bull; <strong>Minimal Anonymous Telemetry:</strong> We collect aggregate, privacy-conscious usage metrics (such as which tool was opened and heartbeat pings to measure active sessions) to maintain site health and guide platform improvements.
        </p>
        <p>
          &bull; <strong>No Commercial Tracking:</strong> We do not use third-party advertising trackers, sell user profiles, or collect personal identifiers from public students.
        </p>
        <div className="pt-2">
          <CookiePreferencesButton variant="button" />
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-6 text-sm sm:text-base leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            1. In-Browser Local Processing for Utilities
          </h2>
          <p>
            StudentAI is designed so that calculations run directly inside your web browser using client-side JavaScript, Canvas APIs, and Web Cryptography. When you calculate your GPA, compute class attendance deficits, convert text cases, compress images, or check resume keywords against job requirements, the content is analyzed on your machine.
          </p>
          <p>
            Your confidential inputs—such as marks, course credits, text notes, or resume details—are never uploaded or saved to our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            2. LocalStorage and Device Persistence
          </h2>
          <p>
            Certain interactive tools (including the Todo List, Quick Notes, Study Planner, and Interview Question mastery tracker) save your entries locally in your browser&apos;s <code>window.localStorage</code> so you can pick up where you left off.
          </p>
          <p>
            You retain absolute ownership over this data:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Export your entire local dataset at any time as a JSON file (<code>studentai-data.json</code>).</li>
            <li>Restore previously exported backups into any device.</li>
            <li>Wipe your local data at any time via the Backup modal or browser settings.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            3. Operational Telemetry &amp; Anonymous Sessions
          </h2>
          <p>
            To understand platform health and monitor tool reliability, StudentAI collects coarse operational metrics:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Tool Usage Events:</strong> When a tool is opened, an anonymous event records the tool identifier (e.g. <code>cgpa-calculator</code>). No user inputs, grades, or personal documents are attached.</li>
            <li><strong>Active Session Heartbeats:</strong> Your browser periodically sends a lightweight heartbeat ping to help our admin dashboard estimate &ldquo;Active Sessions&rdquo; within a 5-minute window. This uses a random, ephemeral session token stored in session storage.</li>
            <li><strong>Coarse Device Information:</strong> Standard viewport categorization (desktop, tablet, or mobile) to optimize layout rendering.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            4. StudentAI Assistant (AI Chatbot)
          </h2>
          <p>
            When you ask questions in the <strong>StudentAI Assistant</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Your prompt and recent conversation messages are transmitted securely over HTTPS to our server endpoint (<code>/api/ai/chat</code>).</li>
            <li>Our server gateway securely routes the prompt to our upstream AI provider (Google Gemini, Groq, or OpenRouter) to generate the educational answer. API keys remain strictly server-side.</li>
            <li>We do not record full conversational transcripts in database telemetry logs. Only operational metadata (provider name, response latency, and success/fallback status) is retained to track provider health.</li>
            <li>Conversation histories are stored in your device&apos;s LocalStorage and can be cleared immediately via the &ldquo;Clear Chat&rdquo; button.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            5. StudentAI PDF Tools &amp; Document Privacy
          </h2>
          <p>
            The <strong>StudentAI PDF Toolkit</strong> adheres to a strict browser-first privacy architecture:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li><strong>100% Client-Side Processing:</strong> 30 out of 33 PDF utilities (including Merge, Split, Compress, Organize, Rotate, Sign, Watermark, and OCR) execute completely within your device&apos;s local browser memory using WebAssembly and HTML5 Canvas. Your sensitive documents, assignments, and notes are never uploaded to any StudentAI server, database, or third-party cloud storage.</li>
            <li><strong>AI PDF Processing:</strong> For AI-powered utilities (AI Summarizer, PDF Translator, and PDF-to-Markdown), text is extracted locally on your device. Only the extracted text content is transmitted to our secure serverless AI gateway to generate your study results. The original binary PDF file is never uploaded.</li>
            <li><strong>True Permanent Redaction:</strong> When using the Redact PDF tool, underlying text streams and vector objects beneath redaction boxes are permanently erased and flattened, ensuring sensitive details cannot be copied, inspected, or recovered.</li>
            <li><strong>Zero Password Logging:</strong> Passwords entered for Unlock PDF or Protect PDF are held transiently in memory solely to execute the operation and are never logged, transmitted, or stored in analytics.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            6. Server Database &amp; Data Retention
          </h2>
          <p>
            Server-side telemetry and platform settings are stored in a managed PostgreSQL database (Neon). Administrative authentication events (login successes and failures) are audited to protect against credential stuffing and brute-force attacks.
          </p>
          <p>
            Detailed event logs are subject to a standard rolling 30-day retention schedule, after which granular logs are rotated out.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            7. Administrator Controls &amp; Security
          </h2>
          <p>
            StudentAI provides a protected Administrator Control Center accessible only to verified project administrators. All admin routes and API endpoints enforce strict server-side authentication, rate limiting, and cryptographic session cookies. Administrators cannot view personal student files or private tool computations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            8. Open Source Verification
          </h2>
          <p>
            StudentAI is committed to full transparency. Anyone may inspect our public codebase on GitHub to independently verify our data practices, encryption mechanisms, and client-side processing boundaries.
          </p>
        </section>
      </div>
    </div>
  );
}
