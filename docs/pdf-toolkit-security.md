# StudentAI PDF Toolkit — Security & Privacy Architecture

## 1. Zero Trust & Privacy Safeguards
- **Local-First Processing**: 30 out of 33 PDF utilities execute entirely inside the user's browser memory. User files are NEVER uploaded to any StudentAI server, database, or cloud bucket for these operations.
- **Immediate Memory Cleanup**: Rendered HTML5 canvases, object URLs (`URL.revokeObjectURL`), and worker threads are disposed of immediately after processing or upon cancellation.
- **AI Processing Privacy**:
  - The binary PDF file is NEVER uploaded to the server.
  - Text is extracted locally in the client, sanitized to remove binary null bytes, truncated to `PDF_MAX_AI_TEXT_LENGTH`, and sent as a small JSON payload to `/api/ai/pdf`.
  - No user document contents are stored in Prisma, Neon PostgreSQL, or server telemetry logs.
  - Telemetry logs only record anonymous metric events (`PDF_TOOL_OPENED`, `PDF_PROCESS_COMPLETED`, `PDF_DOWNLOAD`) with file size buckets (e.g. `<5MB`) without filenames or content.

## 2. Server-Side Protection & Kill Switches
- **Zero Trust Admin Authorization**: All endpoints under `/api/admin/*` require verified HMAC-signed session cookies and constant-time password comparisons (`crypto.timingSafeEqual`).
- **Global AI Kill Switch**: Enforced server-side in `/api/ai/pdf` prior to reaching any external provider (Google, Groq, OpenRouter).
- **Maintenance Mode**: Evaluated server-side in Root Layout and dynamic PDF routes (`/pdf-tools/[slug]`), serving a hard HTML `MaintenanceScreen` to non-admin visitors.
- **Individual Tool Kill Switches**: Disabling any tool in Admin Control Center immediately blocks direct navigation to `/pdf-tools/[slug]` via server component evaluation.

## 3. Upload & File Validation Security
- **Magic Bytes Validation**: Files must begin with `%PDF` (or standard image signatures for image tools), not just trust client-supplied MIME types or extensions.
- **DoS Safeguards**: Files exceeding `PDF_MAX_FILE_SIZE_MB` (50MB) or `PDF_MAX_PAGES` (100 pages) are rejected on the client before decoding begins.
- **No SSRF in HTML-to-PDF**: HTML conversion processes text and semantic markup within an isolated sandbox without network `fetch` or arbitrary URI resolution.
