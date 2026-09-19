/**
 * StudentAI Intent Classification & Freshness Detection
 * 
 * Lightweight deterministic analyzer that categorizes incoming student queries
 * and determines whether live current-data web retrieval is required.
 */

export type AIIntent =
  | 'GENERAL_CHAT'
  | 'STUDY'
  | 'CODING'
  | 'CYBERSECURITY'
  | 'CAREER'
  | 'MATHEMATICS'
  | 'CURRENT_INFORMATION'
  | 'DOCUMENT_QA';

export interface QueryAnalysis {
  intent: AIIntent;
  requiresFreshness: boolean;
  searchQuery: string;
}

const TEMPORAL_KEYWORDS = [
  'latest',
  'current',
  'today',
  'yesterday',
  'this week',
  'this month',
  'this year',
  '2025',
  '2026',
  'now',
  'recent',
  'recently',
  'updated',
  'new version',
  'latest release',
  'current price',
  'current version',
  'current rules',
  'current notification',
  'current scheme',
  'latest news',
  'recent changes',
  'who is the current',
  'who is the present',
  'current prime minister',
  'current president',
  'current ceo',
  'exam dates',
  'schedule 2026',
  'notifications',
  'cutoff 2026',
  'syllabus 2026',
];

const CODING_KEYWORDS = [
  'code',
  'coding',
  'javascript',
  'typescript',
  'python',
  'java',
  'c++',
  'react',
  'nextjs',
  'algorithm',
  'algorithms',
  'sql',
  'debug',
  'debugging',
  'syntax',
  'error',
  'api',
  'css',
  'html',
  'git',
  'docker',
  'database',
  'data structure',
  'data structures',
  'array',
  'arrays',
  'linked list',
  'tree',
  'binary search',
  'dynamic programming',
  'knapsack',
  'recursion',
  'complexity',
  'big-o',
  'sorting',
  'stack',
  'queue',
  'graph',
  'write a function',
  'create a function',
  'arrow function',
  'async function',
  'callback',
];


const CYBERSECURITY_KEYWORDS = [
  'security',
  'vulnerability',
  'cve',
  'xss',
  'sql injection',
  'csrf',
  'firewall',
  'encryption',
  'penetration testing',
  'ctf',
  'reverse engineering',
  'cybersecurity',
  'hash',
  'auth',
  'password',
  'passwords',
  'crypto',
  'cryptography',
  'exploit',
  'malware',
  'ransomware',
  'phishing',
  'backdoor',
  'zero-day',
  'payload',
  'keylogger',
];


const MATH_KEYWORDS = [
  'calculate',
  'integral',
  'derivative',
  'matrix',
  'equation',
  'probability',
  'statistics',
  'algebra',
  'solve',
  'geometry',
  'theorem',
  'eigenvalue',
];

const CAREER_KEYWORDS = [
  'resume',
  'interview',
  'cover letter',
  'job description',
  'portfolio',
  'internship',
  'salary',
  'linkedin',
  'hr round',
  'behavioral interview',
];

export function analyzeUserQuery(message: string): QueryAnalysis {
  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. Check for freshness/current information requirement
  const hasTemporalKeyword = TEMPORAL_KEYWORDS.some((kw) => lower.includes(kw));
  
  // Specific pattern for "what is the current X" or "version of X"
  const isVersionQuery = /\b(current|latest|new)\s+(version|release|update)\b/i.test(lower);
  const isDateQuery = /\b(when is|dates for|schedule of)\b.*\b(2025|2026|exam|admit card)\b/i.test(lower);

  const requiresFreshness = hasTemporalKeyword || isVersionQuery || isDateQuery;

  // 2. Classify Intent
  let intent: AIIntent = 'STUDY';

  if (requiresFreshness) {
    intent = 'CURRENT_INFORMATION';
  } else if (CYBERSECURITY_KEYWORDS.some((kw) => lower.includes(kw))) {
    intent = 'CYBERSECURITY';
  } else if (CODING_KEYWORDS.some((kw) => lower.includes(kw))) {
    intent = 'CODING';
  } else if (MATH_KEYWORDS.some((kw) => lower.includes(kw))) {
    intent = 'MATHEMATICS';
  } else if (CAREER_KEYWORDS.some((kw) => lower.includes(kw))) {
    intent = 'CAREER';
  } else if (lower.length < 25 && /^(hi|hello|hey|good morning|who are you|help|thanks)/i.test(lower)) {
    intent = 'GENERAL_CHAT';
  }

  // 3. Formulate Search Query if freshness needed
  let searchQuery = text;
  if (requiresFreshness) {
    // Strip conversational filler for a cleaner search query
    searchQuery = text
      .replace(/^(can you (please\s+)?tell me|please explain|tell me about|do you know|can you explain)\s+/i, '')
      .replace(/^(what is|who is|what are|when is|where is|how is)\s+/i, '')
      .replace(/^(the\s+)/i, '')
      .replace(/[?!.]+$/, '')
      .trim();
  }


  return {
    intent,
    requiresFreshness,
    searchQuery,
  };
}
