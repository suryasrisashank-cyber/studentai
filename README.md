# StudentAI

> **Study Smarter. Prepare Better. Get Things Done.**

A fast, responsive, and privacy-first suite of **20 free browser-based utilities** designed for college students, school students, and job seekers. Built under a strict **₹0 upfront and operating cost rule**, running 100% client-side with zero paid APIs, zero tracking, and zero account friction.

---

## 🌟 Why StudentAI?

- **₹0 Operating Cost:** No paid AI APIs, cloud databases, serverless compute, or monthly subscription fees.
- **Zero Registration:** Open any tool and immediately calculate or format. No email, password, or phone number required.
- **Processed in Your Browser:** Your grades, resumes, images, and notes are processed locally in your browser memory and are never uploaded by StudentAI.
- **Full Data Ownership:** Tasks and study notes persist in `LocalStorage`. Export everything as `studentai-data.json` at any time.
- **PWA & Mobile-First:** Responsive layouts tested for smartphones, tablets, and desktop displays.

---

## 🛠️ Complete Tool Suite (20 Tools)

### 1. Student Calculators
1. **CGPA Calculator (`/tools/cgpa-calculator`):** Calculate semester GPA and cumulative CGPA across 10-point, 4-point, or letter grade scales with credit point breakdowns.
2. **Percentage Calculator (`/tools/percentage-calculator`):** Compute single or multi-subject marks percentages with academic division classifications.
3. **Attendance Calculator (`/tools/attendance-calculator`):** Calculate your current attendance rate and find out exactly how many consecutive classes you must attend or can safely miss.

### 2. Study & Focus Tools
4. **Study Planner (`/tools/study-planner`):** Generate balanced daily revision timetables using deterministic difficulty, priority, and deadline weighting.
5. **Pomodoro Timer (`/tools/pomodoro`):** Focus intervals (25m / 5m / 15m) with Web Audio synthesizer chimes and streak counters.
6. **Quick Notes (`/tools/notes`):** In-browser markdown-friendly study scratchpad with pinning, search, and real-time word counts.
7. **Word Counter (`/tools/word-counter`):** Real-time statistics for words, characters, sentences, paragraphs, reading time, and speaking time.

### 3. Productivity Utilities
8. **Todo & Task Manager (`/tools/todo-list`):** Organize homework and lab deadlines with priority tags, category filters, and search.
9. **Password Generator (`/tools/password-generator`):** Cryptographically secure passwords generated via `window.crypto.getRandomValues()` with entropy scoring.

### 4. Everyday Utilities
10. **Text Case Converter (`/tools/text-case-converter`):** Transform text between UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case, and PascalCase.
11. **Text Cleaner (`/tools/text-cleaner`):** Strip extra spaces, deduplicate blank lines, sort lines alphabetically, and trim whitespace.
12. **Unit Converter (`/tools/unit-converter`):** High-precision bidirectional conversions across Length, Weight, Temperature, Area, Volume, Speed, Time, and Data storage.
13. **Age Calculator (`/tools/age-calculator`):** Exact chronological age (Years, Months, Days), total days lived, and next birthday countdown.
14. **Date Calculator (`/tools/date-calculator`):** Days between dates, working business days (Mon-Fri), and date addition/subtraction.

### 5. Documents & Media
15. **QR Code Generator (`/tools/qr-generator`):** Create high-resolution QR codes in-browser for links, plain text, Wi-Fi setups, and vCards with instant PNG downloads.
16. **Image Compressor (`/tools/image-compressor`):** Compress JPEG, PNG, and WebP images locally via HTML5 Canvas with before/after size comparisons.
17. **Image Resizer (`/tools/image-resizer`):** Resize pixel dimensions with aspect-ratio locking and format conversion without uploading photos.

### 6. Career & Interview Preparation
18. **Resume Keyword Checker (`/tools/resume-keyword-checker`):** Compare keyword occurrences between your resume and a target job description using client-side tokenization.
19. **Job Description Analyzer (`/tools/job-description-analyzer`):** Extract and categorize technical skills (Languages, Databases, Cloud, Cybersecurity, AI/ML, Web).
20. **Interview Question Bank (`/tools/interview-questions`):** 54 curated technical and HR behavioral interview questions with revealable model answers and progress tracking.

---

## 🏗️ Technology Architecture

```
User Browser
   ↓
Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
   ↓
Client-Side Processing (HTML5 Canvas, Web Cryptography, Web Audio, Regex Tokenizers)
   ↓
Browser LocalStorage (studentai:v1:*)
   ↓
Instant Result Display & Safe JSON Export
```

- **Framework:** Next.js 14 (Static Export)
- **Styling:** Tailwind CSS with dark and light mode persistence
- **Icons:** Lucide React
- **QR Code Engine:** `qrcode` (browser canvas rendering)
- **Zero Secrets / Zero API Keys:** Operates without any `.env` requirements.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### Steps

```bash
# 1. Clone or navigate to the repository
cd studentai

# 2. Install dependencies
npm install

# 3. Run automated tests
npm test

# 4. Start local development server
npm run dev

# 5. Open http://localhost:3000 in your browser
```

### Static Production Build

```bash
npm run build
```

This compiles all pages and 20 tool routes into static HTML/CSS/JS inside the `out/` directory.

---

## 🔒 Privacy & Security Commitments

1. **No External Data Transmission:** Calculations and image processing occur strictly inside your device's browser memory.
2. **No Tracking Cookies:** No Google Analytics, session recorders, or advertising trackers.
3. **No eval() or Code Injection:** Safe JSON parsing and HTML escaping are enforced across all inputs.
4. **Data Portability:** Your local notes, tasks, and schedules can be exported to `studentai-data.json` at any time.

---

## 🚀 Free Static Deployment Guide

Because the application compiles to static assets (`out/`), it can be hosted permanently for **₹0** on any free static provider:

### Option 1: GitHub Pages (Recommended for Open Source)
1. Push the repository to GitHub.
2. Go to **Repository Settings** &rarr; **Pages**.
3. Under **Build and deployment**, set Source to **GitHub Actions**.
4. Use the official Next.js GitHub Pages workflow to build and deploy static files to `https://<username>.github.io/<repo>/`.

### Option 2: Cloudflare Pages
1. Connect your GitHub repository to Cloudflare Pages.
2. Set Build command: `npm run build`
3. Set Output directory: `out`
4. Deploy on the free tier with global Anycast CDN.

### Option 3: Vercel / Netlify
1. Import repository.
2. Framework preset: **Next.js**.
3. Deploy directly on the free hobby tier.

---

## 📄 License & Cost Audit

- **License:** [MIT License](LICENSE)
- **Cost Audit Document:** [docs/COST-AUDIT.md](docs/COST-AUDIT.md) (Verifying ₹0 upfront and ongoing costs)
- **Future AI Architecture:** [docs/FUTURE-AI.md](docs/FUTURE-AI.md)
- **Monetization Roadmap:** [docs/MONETIZATION.md](docs/MONETIZATION.md)
