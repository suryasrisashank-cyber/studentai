# StudentAI PDF Toolkit — Architecture Specification

## 1. System Overview
The StudentAI PDF Toolkit is built on a **Browser-First Architecture**. Heavy document rendering, image rasterization, page reorganization, compression analysis, redaction, and OCR occur inside the user's browser memory via Web Workers, WebAssembly, and HTML5 Canvas.

Server-side execution is strictly reserved for:
1. **AI Processing** (`/api/ai/pdf`): Receives extracted, cleaned, and chunked text. Routes requests to Google Gemini, Groq, or OpenRouter based on administrator configuration.
2. **Administrative Kill Switches**: Enforced on `/api/admin/tools`, `/api/site/status`, and server components in `/pdf-tools/[slug]`.

## 2. Directory Structure

```
lib/pdf/
  config.ts            # Central limits (max file size, max pages, scale, timeout)
  types.ts             # Strong TypeScript definitions for all PDF operations
  utils.ts             # Byte formatting, download triggers, color conversions
  validation.ts        # MIME checking, magic byte inspection, page limit guards
  core/
    load.ts            # Tolerant PDF document loading via pdf-lib
    save.ts            # Clean serialization and Uint8Array export
    pages.ts           # Page count, dimensions, and index helpers
    rendering.ts       # Browser canvas page rendering via pdfjs-dist
  organization/        # Merge, split, organize, remove, extract, rotate, numbers
  editing/             # Watermark, signature, crop, redact, forms, edit
  optimization/        # Compress, repair
  conversion/          # Images<->PDF, Office OpenXML export/import, HTML->PDF, PDF/A
  security/            # Protect, unlock, compare
  ocr/                 # Render pages to canvas -> Tesseract worker
  ai/                  # Client-side text extraction, chunking, and gateway dispatch
```

## 3. Data Flow Diagrams

### Client-Side Processing Workflow (30 of 33 tools)
```
User File Selection (Dropzone / Mobile Picker)
  ↓
Validation (MIME + Magic Bytes "%PDF" + Size <= 50MB)
  ↓
Browser In-Memory Processing (pdf-lib / pdfjs-dist / canvas)
  ↓
Real-Time Progress & Cancellation Hook
  ↓
Result Verification (Valid PDF Header / Size Comparison)
  ↓
Instant Local Download (Blob URL + Revocation)
```

### OCR Processing Architecture
```
Scanned / Image PDF
  ↓
PDF.js (Sequentially renders selected pages to offscreen HTML5 Canvas)
  ↓
Image Data URL
  ↓
Tesseract.js Web Worker (WASM)
  ↓
Extracted Text Stream + Page Confidence
  ↓
Text Output / Searchable PDF Layer Assembly
```

### AI PDF Assistant Architecture
```
Uploaded PDF
  ↓
Client-Side Text Extraction (PDF.js / pdf-lib)
  ↓
Sanitization & Token Chunking (lib/pdf/ai/chunk.ts)
  ↓
POST /api/ai/pdf (Text payload only, max 50KB per request)
  ↓
Zero Trust Server Check: Maintenance Mode & Global AI Kill Switch
  ↓
Existing StudentAI aiRouter (Google Gemini → Groq → OpenRouter)
  ↓
Structured Response Stream / Markdown Rendered Client-Side
```
