import React from 'react';
import { Metadata } from 'next';
import { FileText, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — Transparent Usage Terms',
  description:
    'Read the terms of service governing the use of StudentAI free browser utilities.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
          <FileText className="w-3.5 h-3.5" />
          <span>Terms of Use</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500">
          Last updated: September 2026 &bull; Clear, plain-language terms
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-6 text-sm sm:text-base leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            1. Informational Purpose Only
          </h2>
          <p>
            StudentAI provides free, client-side digital utilities designed to assist students, self-directed learners, and job applicants with study planning, calculation, and document formatting.
          </p>
          <p>
            All tools, formulas, keyword analyses, and study schedules are provided for educational and informational purposes only.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            2. No Guarantee of Academic or Employment Outcomes
          </h2>
          <p>
            While every effort has been made to ensure calculation precision according to standard conventions:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong>Grading & Attendance:</strong> Individual colleges, boards, and universities may employ proprietary grading scales, custom rounding policies, or specific attendance exemption rules. You should always verify calculations with your institution&apos;s official student handbook.
            </li>
            <li>
              <strong>Career & Resume Tools:</strong> The Resume Keyword Checker and Job Description Analyzer perform deterministic text matching. They do not predict recruiter evaluation, ATS software decisions, interview invitations, or employment outcomes.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            3. User Responsibility & Local Backups
          </h2>
          <p>
            Because StudentAI does not store your notes, tasks, or study plans on a remote database, your data is stored exclusively in your browser&apos;s local storage. You are responsible for exporting regular backups of important notes and tasks if you plan to clear your browser data or switch devices.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            4. Acceptable Use
          </h2>
          <p>
            You agree to use StudentAI in compliance with applicable local laws and regulations. You agree not to attempt to inject malicious code, disrupt service availability, or misrepresent the platform as an official university evaluation board.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            5. Disclaimer of Warranties
          </h2>
          <p>
            StudentAI is provided &quot;as is&quot; and &quot;as available&quot; without warranty of any kind, express or implied. Under no circumstances shall the creators or contributors be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this platform.
          </p>
        </section>
      </div>
    </div>
  );
}
