'use client';

import React, { useState, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout';
import { getToolBySlug } from '@/lib/tools-registry';
import {
  SearchCode,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  Tag,
  Info,
  Sparkles,
} from 'lucide-react';

const DEFAULT_DICTIONARY: Record<string, string[]> = {
  Programming: [
    'Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Golang',
    'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'R', 'Bash', 'C', 'Scala'
  ],
  Databases: [
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Cassandra',
    'Oracle', 'Snowflake', 'DynamoDB', 'Elasticsearch', 'Firebase', 'BigQuery'
  ],
  'Cloud & DevOps': [
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform',
    'CI/CD', 'Linux', 'Ansible', 'Jenkins', 'GitHub Actions', 'Serverless', 'Prometheus'
  ],
  Cybersecurity: [
    'SIEM', 'SOC', 'Splunk', 'QRadar', 'MITRE ATT&CK', 'IDS', 'IPS', 'EDR',
    'Wireshark', 'Firewall', 'NIST', 'OWASP', 'Penetration Testing', 'Incident Response',
    'Vulnerability Assessment', 'ISO 27001', 'Cryptography'
  ],
  'AI & Data Science': [
    'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Scikit-Learn',
    'NLP', 'Computer Vision', 'Pandas', 'NumPy', 'LLM', 'Generative AI', 'Data Analysis'
  ],
  'Web & APIs': [
    'React', 'Next.js', 'Node.js', 'Express', 'HTML', 'CSS', 'Tailwind',
    'REST API', 'GraphQL', 'WebSockets', 'Django', 'FastAPI', 'Spring Boot'
  ],
  'Tools & Methods': [
    'Git', 'GitHub', 'GitLab', 'Jira', 'Agile', 'Scrum', 'DevOps', 'Postman',
    'Unit Testing', 'Microservices', 'Clean Architecture'
  ],
};

export function JobDescriptionAnalyzer() {
  const tool = getToolBySlug('job-description-analyzer')!;

  const [jobText, setJobText] = useState<string>(
    `We are hiring a Junior Cybersecurity Analyst / SOC Engineer. The candidate must have experience with SIEM tools (Splunk or QRadar), network packet analysis using Wireshark, and knowledge of the MITRE ATT&CK framework. Basic scripting in Python and familiarity with Linux command-line and AWS cloud security are highly valued.`
  );

  const [copied, setCopied] = useState(false);

  // Deterministic dictionary scanning
  const analysis = useMemo(() => {
    const textLower = ` ${jobText.toLowerCase()} `;
    const categorizedResults: Record<string, { term: string; count: number }[]> = {};
    let totalDetected = 0;

    Object.entries(DEFAULT_DICTIONARY).forEach(([category, terms]) => {
      const foundInCat: { term: string; count: number }[] = [];

      terms.forEach((term) => {
        // Word boundary matching
        const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match word boundaries
        const regex = new RegExp(`(?:^|[^a-zA-Z0-9+#.-])${escaped}(?:[^a-zA-Z0-9+#.-]|$)`, 'gi');
        const matches = textLower.match(regex);

        if (matches && matches.length > 0) {
          foundInCat.push({ term, count: matches.length });
          totalDetected += matches.length;
        }
      });

      if (foundInCat.length > 0) {
        categorizedResults[category] = foundInCat;
      }
    });

    return {
      categorizedResults,
      totalDetected,
      categoryCount: Object.keys(categorizedResults).length,
    };
  }, [jobText]);

  const handleCopySummary = async () => {
    const lines = ['StudentAI Job Tech Stack Analysis:'];
    Object.entries(analysis.categorizedResults).forEach(([cat, terms]) => {
      lines.push(`${cat}: ${terms.map((t) => `${t.term} (x${t.count})`).join(', ')}`);
    });

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setJobText('');
  };

  return (
    <ToolLayout
      tool={tool}
      onReset={handleReset}
      educationalContent={{
        howItWorks: [
          'Paste any job requirement or internship listing into the text area.',
          'The client-side scanner compares the text against a structured dictionary of programming languages, databases, cloud providers, and security frameworks.',
          'Identified technical competencies are grouped into clear technology domain clusters.',
        ],
        faqs: [
          {
            q: 'Does this use an AI model?',
            a: 'No. This is a fast, deterministic dictionary scanner running locally in your browser with zero network calls.',
          },
        ],
      }}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Notice Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <span>
            <strong>Local keyword and technology analysis:</strong> Extracts technical keywords using a curated, client-side dictionary. Does not claim a comprehensive human understanding of job postings.
          </span>
        </div>

        {/* Input Text Area */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <SearchCode className="w-4 h-4 text-indigo-600" />
              <span>Job Description / Requirements Text</span>
            </label>
            <span className="text-xs text-slate-500">
              {jobText.trim() ? `${jobText.trim().split(/\s+/).length} words` : 'Empty'}
            </span>
          </div>

          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            rows={8}
            placeholder="Paste complete job description or requirements section here..."
            className="w-full p-4 text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed font-sans"
          />
        </div>

        {/* Analysis Results */}
        {analysis.categoryCount > 0 ? (
          <div className="p-6 sm:p-8 rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900/50 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>Detected Tech Stack Breakdown</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Found {analysis.totalDetected} technology mentions across {analysis.categoryCount} categories
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Summary'}</span>
              </button>
            </div>

            {/* Category Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysis.categorizedResults).map(([cat, terms]) => (
                <div
                  key={cat}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>{cat}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                      {terms.length} skills
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {terms.map((t) => (
                      <span
                        key={t.term}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs"
                      >
                        <span>{t.term}</span>
                        {t.count > 1 && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                            &times;{t.count}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
            No technical keywords recognized from the current text. Try pasting a job posting with technical requirements.
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
