# StudentAI — Admin Dashboard & Control Center Guide

The **StudentAI Admin Dashboard** provides verified platform administrators with real-time operational oversight, tool availability controls, site content configuration, and multi-tier AI gateway telemetry.

---

## 1. Authentication Architecture

- **Admin Email:** Configured strictly to `logindetails-admin@gmail.com`.
- **Admin Password:** Read strictly from `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` environment variables. It is never stored in source code, committed to Git, or exposed to clients.
- **Session Mechanism:** Uses a cryptographically signed HMAC SHA-256 session token stored in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie (`studentai_admin_session`) expiring after 8 hours.
- **Brute-Force Rate Limiting:** Enforces a maximum of 5 failed login attempts per 15 minutes per client IP. Generic error messages prevent username enumeration.
- **Route Guard:** Next.js Edge Middleware (`middleware.ts`) intercepts `/admin/*` routes and redirects unauthorized requests to `/admin/login`.

---

## 2. Dashboard Sections & Routes

| Route | Functionality |
| :--- | :--- |
| `/admin` | **Overview Dashboard:** High-level metrics (users, logins, active sessions in 5m, tool uses, AI requests, system status cards). |
| `/admin/users` | **Users & Sessions:** Anonymous session logs, device category breakdown, first seen, and active status. |
| `/admin/analytics` | **Platform Analytics:** Real aggregate tool popularity breakdown and activity filters (Today, 7d, 30d, 90d, All Time). |
| `/admin/tools` | **Tool Management:** Real-time toggling of tool enabled/disabled state and featured badges for all 20 tools. |
| `/admin/ai` | **AI Gateway Monitoring:** Google Gemini, Groq, and OpenRouter request volumes, success rates, fallback counts, and latency metrics. |
| `/admin/activity` | **Activity Audit Trail:** Paginated append-only log of platform events (`LOGIN_SUCCESS`, `TOOL_USED`, `AI_REQUEST`, etc.). |
| `/admin/content` | **Website Content:** Homepage announcement banner, AI assistant welcome greeting, and maintenance messaging. |
| `/admin/settings` | **Platform Settings:** Maintenance mode toggle with confirmation, active session window configuration, and telemetry retention rules. |

---

## 3. Maintenance Mode

Administrators can toggle Maintenance Mode on and off via `/admin/settings`.
- **Public Behavior:** When enabled, public visitors to `/` or any `/tools/*` route see a clean maintenance page.
- **Admin Behavior:** All `/admin/*` and `/api/admin/*` routes remain accessible to authenticated administrators, ensuring admins can never lock themselves out.

---

## 4. Setting Up Admin Credentials on Vercel

1. Open your project on the **Vercel Dashboard** &rarr; **Settings** &rarr; **Environment Variables**.
2. Add:
   - `ADMIN_EMAIL`: `logindetails-admin@gmail.com`
   - `ADMIN_PASSWORD`: `<your-secure-password>`
   - `AUTH_SECRET`: `<generated-32-byte-hex-string>`
   - `DATABASE_URL`: `<neon-postgresql-connection-string>`
3. Redeploy the application.
