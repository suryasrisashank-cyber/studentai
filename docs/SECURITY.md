# StudentAI — Security & Protection Architecture

This document details the security posture, authentication protocols, secret management policies, and defensive controls implemented across **StudentAI**.

---

## 1. Secret Management & Zero Leakage Policy

StudentAI enforces strict server-side secret isolation:

1. **No `NEXT_PUBLIC_` Exposure:**
   - Provider API keys (`GOOGLE_AI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`), `DATABASE_URL`, `AUTH_SECRET`, and `ADMIN_PASSWORD` are strictly server-side variables.
   - They are never prefixed with `NEXT_PUBLIC_`, never bundled into client JS, never stored in `LocalStorage`, and never emitted in API responses or browser logs.
2. **Git Hygiene:**
   - `.env.local` is explicitly listed in `.gitignore`.
   - Automated tests verify that no plain-text passwords or secret keys exist in the repository source code.
3. **Safe Error Masking:**
   - Backend API errors catch all upstream exceptions and return generic, categorized messages (e.g., `"Provider temporarily unavailable"`, `"Invalid request"`).
   - Raw stack traces, authorization headers, or provider endpoint URLs are never returned to the client.

---

## 2. Admin Authentication & Route Protection

The StudentAI Admin Control Center (`/admin/*`) is secured using layered defenses:

### Credentials & Validation
- **Admin Email:** Bound to `logindetails-admin@gmail.com`.
- **Admin Password:** Read dynamically from `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` in the server environment.
- **Timing Attack Mitigation:** All credential and signature comparisons use `crypto.timingSafeEqual` in constant time to prevent side-channel timing analysis.

### Brute-Force Rate Limiting
- Login attempts are tracked per client IP address.
- **Policy:** A maximum of 5 failed attempts within a 15-minute window results in an immediate 15-minute lockout.
- **User Enumeration Prevention:** Error responses are intentionally generic (`"Invalid credentials."`) regardless of whether the email or password was mismatched.

### HMAC-SHA256 Session Cookies
- Authenticated sessions issue an encrypted HMAC-SHA256 signed cookie (`studentai_admin_session`):
  ```
  Payload format: base64url(email : timestamp : nonce : hmac_signature)
  ```
- **Cookie Attributes:**
  - `HttpOnly: true` (prevents XSS access)
  - `Secure: true` in production (HTTPS-only)
  - `SameSite: Lax` (mitigates CSRF)
  - `Path: /`
  - `Max-Age: 28800` (strictly expires after 8 hours)
- Both Node.js server routes and Next.js Edge Middleware independently verify token signatures and timestamps.

### Route Interception (Edge Middleware)
- Next.js Edge Middleware (`middleware.ts`) intercepts all traffic targeting `/admin/*` (except `/admin/login`) and `/api/admin/*`.
- Requests lacking a valid, unexpired HMAC signature are immediately blocked:
  - Page routes redirect to `/admin/login?returnUrl=...`.
  - API routes return `401 Unauthorized` with `Cache-Control: no-store`.

---

## 3. AI Gateway Defenses

The AI Assistant API (`/api/ai/chat`) includes defense-in-depth security layers:

1. **System Prompt Protection:** The assistant system prompt is declared only on the server and cannot be overridden by client requests.
2. **Role Sanitization:** Only `'user'` and `'assistant'` roles are accepted from the client. Any attempts to inject `'system'`, `'developer'`, or `'admin'` roles are rejected with `400 Bad Request`.
3. **Payload Sanitization:** Input character limits (3,000 characters per message) and conversational history limits prevent prompt-flooding or denial-of-wallet attacks.
4. **Rate Limiting:** Public client IP addresses are rate-limited to 10 requests per 60 seconds with sliding window tracking.
5. **Provider Redundancy:** Automatic cascading fallback (`Google Gemini 2.5 Flash → Groq GPT-OSS-120B → OpenRouter Free`) ensures high availability without service interruption.

---

## 4. Client-Side Tool Sandboxing

All 20 StudentAI utilities operate under a local-first security model:

1. **In-Browser Computation:** Marks calculations, file conversions, and QR generation execute in local browser memory via standard Web APIs (HTML5 Canvas, `window.crypto`, FileReader).
2. **Zero Ingestion:** User files and text entries are never transmitted over the network or saved in external databases.
3. **XSS Defense:** React JSX ensures automated text escaping. Dangerous functions such as `eval()` or `dangerouslySetInnerHTML` with user input are strictly banned.
