import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — StudentAI Help & Architecture',
  description:
    'Answers to common questions regarding StudentAI free pricing, data privacy, offline use, and future AI capabilities.',
};

export default function FaqPage() {
  const faqs = [
    {
      q: 'Is StudentAI really 100% free with ₹0 cost?',
      a: 'Yes, completely free. StudentAI was engineered to run without any recurring operational costs. There are no paywalls, hidden fees, monthly subscriptions, or credit card requirements.',
    },
    {
      q: 'Do I need to register or create an account?',
      a: 'No. You can use every tool immediately without providing an email, phone number, password, or Google account. We believe utility tools should be immediately accessible.',
    },
    {
      q: 'Are my uploaded files, resumes, or photos sent to a server?',
      a: 'No. For all tools that handle files (such as Image Compressor, Image Resizer, and Resume Keyword Checker), processing takes place entirely in your browser using HTML5 Canvas, File APIs, and client-side JavaScript. Your files are not uploaded by StudentAI.',
    },
    {
      q: 'Does StudentAI store my notes, tasks, or attendance records?',
      a: 'Persistent data (like your tasks, notes, study schedules, and interview progress) is saved locally in your browser’s LocalStorage. You can export this data anytime as a JSON backup or wipe it from your browser.',
    },
    {
      q: 'Can I use StudentAI on a smartphone or tablet?',
      a: 'Yes. Every tool is designed mobile-first with responsive touch-friendly controls. It functions seamlessly in mobile Safari, Chrome, Edge, and Firefox.',
    },
    {
      q: 'Does StudentAI offer an AI Study Assistant?',
      a: 'Yes! StudentAI features a dedicated AI Study Assistant (/ai) designed for students. It helps with step-by-step math and science explanations, essay outlining, study schedules, and coding help. The AI Assistant routes queries securely through a server-side proxy with multi-provider redundancy (Google Gemini, Groq, OpenRouter) so it remains accessible to students at ₹0 cost.',
    },
    {
      q: 'How does privacy differ between the student tools and the AI Assistant?',
      a: 'All 20 core student utilities (calculators, planners, image tools, resume checker) execute locally in your browser using deterministic algorithms and LocalStorage—no calculation or personal document data leaves your device. Only when you explicitly use the AI Assistant (/ai) is your study query sent to our server gateway to generate an answer. We never sell your questions or share them with advertisers.',
    },
    {
      q: 'How can I back up or transfer my data to another computer?',
      a: 'Click the database icon in the top header bar to open the Data Management modal. Click "Export JSON" to download your complete data file, which can then be imported into any other browser.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Knowledge & Help</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Transparent, honest answers about how StudentAI works, our privacy guarantees, and our zero-cost architecture.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 shadow-xs"
          >
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {faq.q}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div className="p-8 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Still have questions or suggestions?
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          StudentAI is open source. You can inspect the code, file an issue, or propose a new tool on our repository.
        </p>
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 text-xs shadow-md shadow-indigo-500/20"
        >
          <span>Start Exploring Tools</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
