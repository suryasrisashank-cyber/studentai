# StudentAI — Telemetry & Analytics Architecture

This document describes the privacy-first telemetry and analytics design of **StudentAI**.

---

## 1. Zero Third-Party Analytics Commitment

StudentAI strictly rejects invasive third-party tracking scripts:
- **No Google Analytics / Google Tag Manager**
- **No Meta / Facebook Pixel**
- **No Hotjar, FullStory, or session recording replays**
- **No Mixpanel, Segment, or PostHog cloud telemetry**

All student input data (grades, marks, resumes, study notes, uploaded photos) is processed **100% client-side** inside the browser. No student documents or calculations are ever uploaded to any database or analytics collector.

---

## 2. Anonymous First-Party Telemetry Design

To help platform administrators understand system health and identify which tools students find most useful, StudentAI implements a lightweight, first-party telemetry endpoint:

- **Endpoint:** `POST /api/telemetry/event`
- **Rate-limited:** Monitored to prevent spam.
- **Payload Schema:**
  ```json
  {
    "type": "HEARTBEAT" | "TOOL_USED" | "AI_REQUEST",
    "sessionId": "string (UUID v4 or anonymous client hash)",
    "toolSlug": "string (optional, e.g. 'cgpa-calculator')",
    "metadata": {}
  }
  ```

### Key Privacy Protections
1. **No Personal Identifiable Information (PII):** IP addresses are not stored in raw form with events. No names, student IDs, or email addresses are captured.
2. **Device Category Only:** User-Agent is only parsed to determine generic device type (`desktop`, `mobile`, `tablet`) for responsive design planning.
3. **Opt-Out & Do Not Track:** The client telemetry script respects `navigator.doNotTrack`.

---

## 3. Active Session Window Definition

- **Active Session Window:** **5 minutes (300,000 ms)**.
- A user session is categorized as **Active Now** if a `HEARTBEAT` or `TOOL_USED` telemetry ping was recorded within the last 5 minutes (`lastActiveAt >= NOW() - 5 minutes`).
- If no ping occurs for >5 minutes, the session is marked idle / inactive.

---

## 4. Zero Fake Data Policy

The StudentAI Admin Control Center enforces an uncompromised **Zero Fake Data Policy**:
1. **Real Counts Only:** All metrics displayed in `/admin`, `/admin/analytics`, and `/admin/users` are calculated directly from genuine database rows (`UserSession`, `UsageEvent`, `LoginEvent`).
2. **Fresh Deploy State:** On fresh deployments or when no events have occurred yet, metrics accurately display `0` or `"No data available yet"`.
3. **Database Outage Graceful State:** If `DATABASE_URL` is disconnected or unreachable in production, the UI displays `"Analytics temporarily unavailable"` rather than substituting fabricated charts or dummy figures.

---

## 5. Telemetry Retention & Pruning

- Activity events and heartbeat pings are retained for 90 days.
- In-memory dev fallbacks are automatically cleared on server restart.
- PostgreSQL partitions or automated cron jobs may prune `UsageEvent` records older than 90 days to maintain optimal query speeds on Neon's free serverless tier.
