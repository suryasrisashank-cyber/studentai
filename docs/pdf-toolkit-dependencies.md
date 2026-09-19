# StudentAI PDF Toolkit — Dependency Audit & Architecture

This document records all dependencies used in the StudentAI PDF Toolkit, their purpose, licensing, execution environment, and technical evaluation.

## 1. Installed Dependencies

| Package | Version | Purpose | Environment | License | Reason Selected | Limitations |
|---|---|---|---|---|---|---|
| `pdf-lib` | ^1.17.9 | Pure JavaScript PDF creation, page extraction, merging, rotation, annotation, watermark, and form filling | Client / Server | MIT | 100% standalone, no native C++ binaries, runs in browser memory, zero server cost | Does not include native PDF rasterizer (canvas rendering) or full PDF encryption for arbitrary existing PDFs |
| `pdfjs-dist` | 3.11.174 | Standard Mozilla PDF.js engine for rendering PDF pages to canvas, generating previews, and extracting text | Client-only (lazy) | Apache-2.0 | High-fidelity page rasterization to HTML5 Canvas and text stream extraction | Must be dynamically imported in browser environment to avoid SSR worker initialization issues |
| `jszip` | ^3.10.1 | Creation of ZIP archives and Office Open XML (.docx, .xlsx, .pptx) container packaging | Client / Server | MIT / GPLv3 | In-memory ZIP generation for multi-page splits, batch image exports, and native Office OpenXML packaging | Memory usage scales with archive size; safeguarded with file size limits |
| `tesseract.js` | ^7.0.0 | Pure WebAssembly/Web Worker OCR engine for extracting text from rendered PDF canvas pages | Client-only (worker) | Apache-2.0 | Enables 100% ₹0 client-side OCR without uploading documents to external paid APIs | Requires downloading OCR language traineddata (cached by browser); runs sequentially per page to prevent memory pressure |

## 2. No Paid Services & No Native Binaries
- **Zero Paid APIs**: No Adobe PDF Services, no Google Cloud Vision API billing, no AWS Textract, no paid cloud conversion APIs.
- **Vercel Serverless Compatibility**: All operations are client-first. Server routes (`/api/ai/pdf`) receive extracted, sanitized text chunks rather than heavy binary payloads, preventing Vercel function timeout and payload limit (4.5MB) issues.

## 3. Dependency Safety
- Dynamic imports (`import()`) are utilized for `pdfjs-dist` and `tesseract.js` so they are never loaded into the main bundle or on non-PDF routes (keeping StudentAI's core 20 tools lightweight).
