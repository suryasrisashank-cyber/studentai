export type ToolCategory =
  | 'student'
  | 'study'
  | 'career'
  | 'media'
  | 'productivity'
  | 'everyday';

export interface ToolDefinition {
  slug: string;
  name: string;
  category: ToolCategory;
  description: string;
  icon: string;
  badge?: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  privacyNote: string;
  isPopular?: boolean;
}

export const CATEGORY_INFO: Record<
  ToolCategory,
  { label: string; description: string; icon: string }
> = {
  student: {
    label: 'Student Tools',
    description: 'Academic calculators for grades, percentages, and attendance tracking.',
    icon: 'GraduationCap',
  },
  study: {
    label: 'Study Tools',
    description: 'Structured planners, timers, and note-taking utilities for focused learning.',
    icon: 'BookOpen',
  },
  career: {
    label: 'Career Tools',
    description: 'Deterministic resume keyword matching, job analysis, and interview prep.',
    icon: 'Briefcase',
  },
  productivity: {
    label: 'Productivity Tools',
    description: 'Task management and secure password generation running locally in your browser.',
    icon: 'CheckSquare',
  },
  media: {
    label: 'Documents & Media',
    description: 'Client-side image compression, resizing, and QR generation without server uploads.',
    icon: 'FileImage',
  },
  everyday: {
    label: 'Everyday Tools',
    description: 'Fast text cleanup, case converters, unit conversions, age and date utilities.',
    icon: 'Wrench',
  },
};

export const TOOLS_REGISTRY: ToolDefinition[] = [
  // Student Tools (3)
  {
    slug: 'cgpa-calculator',
    name: 'CGPA Calculator',
    category: 'student',
    description: 'Calculate semester GPA and cumulative CGPA across 10-point, 4-point, or letter grade scales.',
    icon: 'GraduationCap',
    badge: 'Popular',
    isPopular: true,
    tags: ['cgpa', 'gpa', 'grades', 'semester', 'calculator'],
    seoTitle: 'CGPA & GPA Calculator — Fast, Free Academic Grading Tool',
    seoDescription: 'Calculate your semester GPA and cumulative CGPA across 10-point, 4-point, or letter grade scales. 100% processed locally in your browser.',
    privacyNote: 'Your grade data is processed locally in your browser and is never uploaded.',
  },
  {
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    category: 'student',
    description: 'Calculate single and multi-subject marks percentages with total obtained breakdown.',
    icon: 'Percent',
    tags: ['percentage', 'marks', 'exam', 'score', 'calculator'],
    seoTitle: 'Marks Percentage Calculator — Multi-Subject Grade Breakdown',
    seoDescription: 'Accurately calculate single-subject and multi-subject marks percentages, totals, and grades right in your browser.',
    privacyNote: 'Your marks and calculations are processed locally in your browser.',
  },
  {
    slug: 'attendance-calculator',
    name: 'Attendance Calculator',
    category: 'student',
    description: 'Calculate your current attendance percentage and determine how many classes you must attend or can safely miss.',
    icon: 'CalendarCheck',
    badge: 'Popular',
    isPopular: true,
    tags: ['attendance', 'bunk', 'target', 'percentage', 'classes'],
    seoTitle: 'Attendance & Bunk Calculator — Calculate Target Attendance',
    seoDescription: 'Find out your current attendance rate and exactly how many consecutive classes to attend or skip to maintain your target.',
    privacyNote: 'Your attendance records are processed locally in your browser.',
  },

  // Study Tools (4)
  {
    slug: 'study-planner',
    name: 'Study Planner',
    category: 'study',
    description: 'Generate structured exam preparation schedules using deterministic scheduling logic and local persistence.',
    icon: 'Calendar',
    badge: 'Essential',
    isPopular: true,
    tags: ['study planner', 'schedule', 'exam prep', 'calendar', 'routine'],
    seoTitle: 'Free Study Schedule Planner — Exam Prep Organizer',
    seoDescription: 'Create custom, deterministic study schedules based on exam dates, difficulty, and available daily hours. Stored locally.',
    privacyNote: 'Your study plans are saved locally in your browser via LocalStorage.',
  },
  {
    slug: 'pomodoro',
    name: 'Pomodoro Timer',
    category: 'study',
    description: 'Focus timer with customizable 25m work and 5m/15m break cycles with Web Audio chimes.',
    icon: 'Timer',
    badge: 'Popular',
    isPopular: true,
    tags: ['pomodoro', 'focus', 'timer', 'study timer', 'productivity'],
    seoTitle: 'Clean Pomodoro Study Timer — 25/5 Focus Intervals',
    seoDescription: 'Boost focus and avoid burnout with an accessible Pomodoro timer featuring customizable intervals and session tracking.',
    privacyNote: 'Timer state and completed focus sessions are tracked in your browser.',
  },
  {
    slug: 'notes',
    name: 'Quick Notes',
    category: 'study',
    description: 'Lightweight local scratchpad for study notes with pinning, search, and character counter.',
    icon: 'FileText',
    tags: ['notes', 'scratchpad', 'study', 'markdown', 'memo'],
    seoTitle: 'Quick Local Notes — Fast In-Browser Study Scratchpad',
    seoDescription: 'Jot down study thoughts, formulas, and references. Stored safely in your browser LocalStorage with zero cloud dependencies.',
    privacyNote: 'Your notes are stored locally in this browser. No server sync is performed.',
  },
  {
    slug: 'word-counter',
    name: 'Word Counter',
    category: 'study',
    description: 'Count words, characters with/without spaces, sentences, paragraphs, and estimated reading time.',
    icon: 'Type',
    tags: ['word count', 'character count', 'reading time', 'essay', 'text analysis'],
    seoTitle: 'Word & Character Counter — Real-Time Text Analysis',
    seoDescription: 'Instant statistics on word count, character count, sentences, paragraphs, and estimated reading time for essays and assignments.',
    privacyNote: 'Your text is analyzed entirely in memory inside your browser.',
  },

  // Productivity Tools (2)
  {
    slug: 'todo-list',
    name: 'Todo & Task Manager',
    category: 'productivity',
    description: 'Track assignments, deadlines, and project milestones with priorities and status filters.',
    icon: 'CheckSquare',
    tags: ['todo', 'tasks', 'checklist', 'productivity', 'deadlines'],
    seoTitle: 'Local Student Todo List — Organize Tasks & Deadlines',
    seoDescription: 'Organize study tasks, homework, and deadlines with priority tags and category filters. Persists in your browser.',
    privacyNote: 'Your task list is stored securely in your browser LocalStorage.',
  },
  {
    slug: 'password-generator',
    name: 'Password Generator',
    category: 'productivity',
    description: 'Generate strong, cryptographically secure passwords using the browser Crypto API.',
    icon: 'KeyRound',
    tags: ['password', 'security', 'crypto', 'generator', 'credentials'],
    seoTitle: 'Secure Password Generator — Client-Side Crypto API',
    seoDescription: 'Generate secure, random passwords with custom lengths and symbols using browser crypto. Never sent to any server.',
    privacyNote: 'Passwords are generated using window.crypto.getRandomValues() and never transmitted anywhere.',
  },

  // Everyday Tools (5)
  {
    slug: 'text-case-converter',
    name: 'Text Case Converter',
    category: 'everyday',
    description: 'Convert text between UPPERCASE, lowercase, Title Case, camelCase, snake_case, and kebab-case.',
    icon: 'CaseSensitive',
    tags: ['case converter', 'uppercase', 'camelcase', 'snake_case', 'text formatting'],
    seoTitle: 'Text Case Converter — UPPERCASE, lowercase, camelCase & More',
    seoDescription: 'Quickly transform text between title case, camel case, snake case, lowercase, uppercase, and kebab case with one click.',
    privacyNote: 'Text transformations run entirely client-side in your browser.',
  },
  {
    slug: 'text-cleaner',
    name: 'Text Cleaner',
    category: 'everyday',
    description: 'Remove extra spaces, duplicate blank lines, sort lines alphabetically, and eliminate duplicate entries.',
    icon: 'Sparkles',
    tags: ['text cleaner', 'remove spaces', 'sort lines', 'deduplicate', 'formatting'],
    seoTitle: 'Text Cleaner & Formatter — Strip Spaces & Deduplicate',
    seoDescription: 'Clean messy copied text by removing excess whitespace, blank lines, and duplicates, or sorting lines alphabetically.',
    privacyNote: 'Your text is formatted locally in browser memory.',
  },
  {
    slug: 'unit-converter',
    name: 'Unit Converter',
    category: 'everyday',
    description: 'Convert measurements across length, weight, temperature, area, volume, speed, time, and data storage.',
    icon: 'ArrowLeftRight',
    tags: ['unit converter', 'metric', 'imperial', 'temperature', 'measurement'],
    seoTitle: 'Multi-Unit Converter — Length, Weight, Temperature & Data',
    seoDescription: 'Instant conversion between metric, imperial, temperature, and digital data storage units with high precision.',
    privacyNote: 'All unit calculations happen instantaneously in your browser.',
  },
  {
    slug: 'age-calculator',
    name: 'Age Calculator',
    category: 'everyday',
    description: 'Calculate your exact chronological age in years, months, days, total days lived, and next birthday countdown.',
    icon: 'Clock',
    tags: ['age calculator', 'birthday', 'chronological age', 'days lived', 'date'],
    seoTitle: 'Accurate Age Calculator — Years, Months, Days & Next Birthday',
    seoDescription: 'Calculate precise chronological age down to days, see total days lived, and count down to your next birthday.',
    privacyNote: 'Your birth date is processed in browser memory and not stored.',
  },
  {
    slug: 'date-calculator',
    name: 'Date Calculator',
    category: 'everyday',
    description: 'Compute exact days between two dates, add or subtract calendar days, and find weekdays.',
    icon: 'CalendarDays',
    tags: ['date calculator', 'days between dates', 'add days', 'deadline', 'calendar'],
    seoTitle: 'Date Difference & Duration Calculator — Days Between Dates',
    seoDescription: 'Calculate exact working and calendar days between two dates or add/subtract days to find future milestone dates.',
    privacyNote: 'Date calculations run client-side in your browser.',
  },

  // Documents & Media Tools (3)
  {
    slug: 'qr-generator',
    name: 'QR Code Generator',
    category: 'media',
    description: 'Generate high-resolution QR codes for URLs, plain text, Wi-Fi credentials, and contact info with PNG download.',
    icon: 'QrCode',
    badge: 'Popular',
    isPopular: true,
    tags: ['qr code', 'barcode', 'qr generator', 'share link', 'wifi qr'],
    seoTitle: 'Free Client-Side QR Code Generator — Instant PNG Download',
    seoDescription: 'Create custom QR codes in your browser for websites, text, and Wi-Fi networks without external API dependencies.',
    privacyNote: 'QR codes are rendered locally using client-side canvas algorithms.',
  },
  {
    slug: 'image-compressor',
    name: 'Image Compressor',
    category: 'media',
    description: 'Compress PNG, JPEG, and WebP images client-side via HTML Canvas with instant before/after size comparisons.',
    icon: 'Minimize2',
    badge: 'Local-First',
    tags: ['image compressor', 'reduce file size', 'client side', 'jpeg', 'png', 'webp'],
    seoTitle: 'Browser Image Compressor — Reduce Size Without Server Upload',
    seoDescription: 'Compress images securely inside your browser using HTML5 Canvas. Inspect original vs compressed file sizes with zero server uploads.',
    privacyNote: 'Your file is processed in your browser and is not uploaded by StudentAI.',
  },
  {
    slug: 'image-resizer',
    name: 'Image Resizer',
    category: 'media',
    description: 'Resize image dimensions with aspect-ratio locking, custom width/height inputs, and format conversion.',
    icon: 'Maximize2',
    tags: ['image resizer', 'resize photo', 'aspect ratio', 'canvas', 'dimensions'],
    seoTitle: 'Free Image Resizer — Resize Dimensions Locally in Browser',
    seoDescription: 'Change image dimensions, lock aspect ratio, and export in PNG, JPEG, or WebP formats completely client-side.',
    privacyNote: 'Your file is processed in your browser and is not uploaded by StudentAI.',
  },

  // Career Tools (3)
  {
    slug: 'resume-keyword-checker',
    name: 'Resume Keyword Checker',
    category: 'career',
    description: 'Extract and compare keyword occurrences between your resume and a target job description.',
    icon: 'FileCheck2',
    badge: 'Career',
    isPopular: true,
    tags: ['resume keywords', 'ats scanner', 'job match', 'resume check', 'career'],
    seoTitle: 'Resume Keyword Matcher — Compare Resume vs Job Description',
    seoDescription: 'Analyze keyword alignment between your resume and target job descriptions using deterministic local tokenization.',
    privacyNote: 'Your resume and job description text are processed locally in your browser and never uploaded.',
  },
  {
    slug: 'job-description-analyzer',
    name: 'Job Description Analyzer',
    category: 'career',
    description: 'Identify and categorize technical skills, programming languages, databases, cloud, and security frameworks.',
    icon: 'SearchCode',
    tags: ['job analyzer', 'tech stack extractor', 'skills', 'job requirements'],
    seoTitle: 'Job Description Tech Stack Analyzer — Local Skill Extractor',
    seoDescription: 'Extract categorized technical terms (Programming, Cloud, Databases, Security, AI) from job postings locally.',
    privacyNote: 'Job descriptions are analyzed in memory using local dictionary matching.',
  },
  {
    slug: 'interview-questions',
    name: 'Interview Question Bank',
    category: 'career',
    description: 'Practice 50+ curated technical and HR interview questions with model answers, key points, and local progress tracking.',
    icon: 'HelpCircle',
    badge: '50+ Questions',
    isPopular: true,
    tags: ['interview prep', 'questions', 'python', 'sql', 'cybersecurity', 'hr questions'],
    seoTitle: 'Curated Interview Question Bank — Practice 50+ Technical & HR Questions',
    seoDescription: 'Practice essential technical and behavioral interview questions across Python, SQL, Cybersecurity, Web, and HR with model answers.',
    privacyNote: 'Your practice progress is saved locally in your browser.',
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS_REGISTRY.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOLS_REGISTRY.filter((t) => t.category === category);
}

export function getAllToolSlugs(): string[] {
  return TOOLS_REGISTRY.map((t) => t.slug);
}
