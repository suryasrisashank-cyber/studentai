# StudentAI PDF Toolkit — Automated Verification & Acceptance Criteria

This document details the automated test strategy for `scripts/test-pdf-toolkit.js` verifying the 20 mandatory acceptance tests specified in the Master Prompt.

## Acceptance Test Suite Breakdown

1. **TEST 1 — Merge PDF**:
   Creates two valid test PDFs, merges them, and verifies output header, valid trailer, and total page count equals the sum.
2. **TEST 2 — Split PDF**:
   Generates a 5-page PDF, splits pages 2-4, and verifies the output contains exactly 3 pages.
3. **TEST 3 — Remove Pages**:
   Removes page 3 from a 5-page PDF and verifies the output contains 4 pages.
4. **TEST 4 — Rotate PDF**:
   Rotates page 1 by 90 degrees and page 2 by 180 degrees, verifying correct rotation dictionaries.
5. **TEST 5 — Image → PDF**:
   Assembles test image buffers into a PDF and verifies page count and dimensions.
6. **TEST 6 — PDF → Image Render**:
   Validates rasterization pipeline and canvas output buffer creation.
7. **TEST 7 — OCR Architecture**:
   Verifies that OCR architecture enforces PDF -> Render Page to Image -> Tesseract.js (never passing raw PDF directly).
8. **TEST 8 — Permanent Redaction**:
   Embeds known sensitive canary string `SECRET-CUSTOMER-ID-12345` into a test PDF, applies redaction bounding box with content erasing, flattens page, extracts text, and strictly asserts the canary string is completely absent.
9. **TEST 9 — Compression Metrics**:
   Calculates before/after byte sizes; asserts that compression percentage calculation is accurate and never claims reduction if bytes increased.
10. **TEST 10 — Password Protection Validation**:
    Verifies that encrypted PDF requires correct credentials and rejects empty/incorrect passwords.
11. **TEST 11 — Unlock PDF**:
    Decrypts protected test PDF when supplied the correct password and exports valid decrypted document.
12. **TEST 12 — PDF/A Preparation**:
    Verifies PDF/A preparation generates valid PDF with PDF/A-1b identification metadata, color intents, and status labeled `LIMITED`.
13. **TEST 13 — Office File Structure Validation**:
    Verifies that `.docx`, `.xlsx`, and `.pptx` outputs are genuine, valid OpenXML ZIP archives with required parts (`[Content_Types].xml`, `_rels/.rels`, `document.xml` / `workbook.xml` / `presentation.xml`).
14. **TEST 14 — HTML → PDF**:
    Verifies structured HTML conversion produces a valid PDF.
15. **TEST 15 — AI PDF Gateway & Chunking**:
    Tests text extraction, chunking with overlap, and dispatch to AI gateway.
16. **TEST 16 — Admin Tool Kill Switch**:
    Simulates toggling a PDF tool in database settings and asserts `/pdf-tools/[slug]` blocks processing.
17. **TEST 17 — Global AI Kill Switch**:
    Disables AI in site settings and asserts `/api/ai/pdf` returns HTTP 503 without contacting external providers.
18. **TEST 18 — Maintenance Mode Enforcement**:
    Asserts maintenance mode serves maintenance screen and protects public routes.
19. **TEST 19 — Privacy & Zero Content Logging**:
    Validates telemetry events; asserts no raw PDF bytes, text, or passwords are recorded in logs.
20. **TEST 20 — Large File & Magic Bytes Safety**:
    Rejects corrupted non-PDF files and files exceeding size thresholds with user-friendly errors.
