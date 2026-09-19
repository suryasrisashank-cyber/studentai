# StudentAI

> **Study Smarter. Prepare Better. Get Things Done.**

A modern, fast, and privacy-first suite of **20 browser-based student utilities**, a professional **40-tool PDF Toolkit**, a built-in **AI Student Assistant**, and a comprehensive **Admin Control Center**. Running all core calculations and document transformations client-side with zero tracking and zero friction.

**Live Deployment:** [https://studentai-five.vercel.app/](https://studentai-five.vercel.app/)  
**GitHub Repository:** [https://github.com/suryasrisashank-cyber/studentai](https://github.com/suryasrisashank-cyber/studentai)

---

## 🌟 Key Features

- **20 Client-Side Student Tools:** Calculators, study timers, markdown notes, text tools, converters, image compressors, and interview prep.
- **Figma-Inspired Desktop & MUI Mobile:** Persistent collapsible Tools Sidebar (260px expanded, 72px collapsed) on desktop and touch-friendly Material UI Drawer on mobile.
- **Floating AI Student Assistant:** Contextual study companion with quick-action chips and multi-tier provider redundancy (`Google Gemini 2.5 Flash → Groq → OpenRouter`).
- **Secure Admin Control Center (`/admin/*`):** Rate-limited login (`logindetails-admin@gmail.com`), HMAC-SHA256 signed session cookies, tool toggles, announcements, and AI telemetry.
- **Neon PostgreSQL + Prisma ORM:** Production database models with resilient in-memory development fallback.
- **Zero Fake Data Policy:** Real database-backed metrics and audit logs with graceful degradation when unconfigured.
- **100% Local-First Tool Privacy:** Student marks, resumes, and study notes remain strictly in the browser memory and `LocalStorage`.

---

## 🛠️ Complete Tool Suite (20 Tools)

### 1. Student Calculators
1. **CGPA Calculator (`/tools/cgpa-calculator`):** Calculate semester GPA and cumulative CGPA across 10-point, 4-point, or letter grade scales with credit breakdowns.
2. **Percentage Calculator (`/tools/percentage-calculator`):** Compute single or multi-subject marks percentages with academic division classifications.
3. **Attendance Calculator (`/tools/attendance-calculator`):** Calculate current attendance rate and required classes to reach target attendance percentage.

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
   ├── Local Client Tools (HTML5 Canvas, Web Cryptography, Web Audio)
   ├── Material UI (MUI) & Tailwind CSS Theming
   ├── Persistent Collapsible Tools Sidebar
   └── Floating AI Assistant Companion
          ↓
Next.js 14 App Router (Vercel Serverless Edge Runtime)
   ├── Edge Middleware Guard (/admin/*, /api/admin/*)
   ├── Multi-Tier AI Gateway (Google Gemini 2.5 Flash → Groq → OpenRouter)
   ├── Telemetry & Heartbeat Ingestion (/api/telemetry/event)
   └── Prisma ORM Client v5.21.1
          ↓
Neon Serverless PostgreSQL (Optional Cloud DB / In-Memory Dev Fallback)
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm 9+

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/suryasrisashank-cyber/studentai.git
cd studentai

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional for basic tools)
cp .env.example .env.local

# 4. Run automated test suite
npm test

# 5. Run linter
npm run lint

# 6. Start development server
npm run dev

# 7. Open http://localhost:3000 in your browser
```

---

## 🔒 Admin Control Center Setup

1. Admin authentication email is bound to `logindetails-admin@gmail.com`.
2. Configure these variables in `.env.local` or on your **Vercel Dashboard**:
   ```env
   ADMIN_EMAIL=logindetails-admin@gmail.com
   ADMIN_PASSWORD=your_secure_admin_password
   AUTH_SECRET=your_32_character_hex_secret
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   ```
3. Navigate to `/admin/login` and authenticate to access the Control Center.

---

## 📄 Documentation

- [Admin Dashboard Guide](docs/ADMIN-DASHBOARD.md)
- [Security & Authentication Architecture](docs/SECURITY.md)
- [Telemetry & Analytics Architecture](docs/ANALYTICS.md)
- [Infrastructure & Cost Audit Breakdown](docs/COST-AUDIT.md)

---

## 📄 License

MIT License — free for students, educators, and open-source contributors.
