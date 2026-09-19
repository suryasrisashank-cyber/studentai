# StudentAI PDF Toolkit — Honest Capability & Limitation Matrix

In adherence to StudentAI's Zero-Deception policy, this document records the real technical capabilities and limitations of every PDF utility.

## 1. Feature Status Classification

| Category | Tool | Status | Processing Mode | Honest Limitation / Technical Reality |
|---|---|---|---|---|
| **Organization** | Merge PDF | `READY` | Client (Browser) | Merges arbitrary valid PDFs up to 50MB and 100 pages per operation. |
| | Split PDF | `READY` | Client (Browser) | Extracts single pages or custom ranges (e.g. 1-3, 5). Single download or multi-file ZIP archive. |
| | Organize PDF | `READY` | Client (Browser) | Thumbnail preview, drag-and-drop page reordering, page duplication, individual rotation. |
| | Remove Pages | `READY` | Client (Browser) | Select individual or multi-page indices to delete; exports sanitized PDF. |
| | Extract Pages | `READY` | Client (Browser) | Creates new PDF containing only selected pages. |
| | Rotate PDF | `READY` | Client (Browser) | 90°, 180°, 270° clockwise/counter-clockwise across all or selected pages. |
| | Add Page Numbers | `READY` | Client (Browser) | Configurable position (header/footer, left/center/right), starting index, font size, margins. |
| **Conversion** | JPG/PNG → PDF | `READY` | Client (Browser) | Multi-image to PDF assembly with orientation and margin controls. |
| | PDF → JPG/PNG | `READY` | Client (Browser) | Renders pages to canvas at configurable DPI (150-300 DPI) and exports individual images or ZIP. |
| | PDF → Word (.docx) | `READY` | Client (Browser) | Extracts paragraphs, headings, and structure into genuine OpenXML `.docx`. Does not guarantee complex multi-column magazine layouts. |
| | PDF → Excel (.xlsx) | `READY` | Client (Browser) | Extracts table boundaries, rows, and cells into real `.xlsx` and `.csv` worksheets. Scanned tables require OCR. |
| | PDF → PowerPoint (.pptx) | `READY` | Client (Browser) | Converts PDF pages into individual `.pptx` slides with extracted headings and text containers. |
| | Word → PDF | `LIMITED` | Client (Browser) | Reads OpenXML document text, headings, and lists and renders into a clean PDF. Complex macro/ActiveX formatting is unsupported. |
| | Excel → PDF | `LIMITED` | Client (Browser) | Extracts grid sheets and tables and formats into tabular PDF pages. |
| | PowerPoint → PDF | `LIMITED` | Client (Browser) | Renders slide content and outlines into PDF slides. |
| | HTML → PDF | `LIMITED` | Client (Browser) | Renders HTML text with supported styling (headings, lists, bold, italics, tables) into PDF. Full CSS grid/flex layout requires browser print dialog. |
| | PDF/A Preparation | `LIMITED` | Client (Browser) | Prepares PDF by embedding ISO-standard PDF/A-1b metadata and sRGB color profiles. Does not assert full third-party ISO verification. |
| **Editing** | Edit PDF | `READY` | Client (Browser) | Annotation workspace: text overlays, freehand drawing, shapes, highlighters, element move/resize, undo/redo. |
| | Watermark PDF | `READY` | Client (Browser) | Text and image watermarks with custom rotation, opacity, font size, and layer position. |
| | Sign PDF | `READY` | Client (Browser) | Draw signature, type stylized signature, or upload image stamp. Placed on designated page. (Not an X.509 digital certificate). |
| | Crop PDF | `READY` | Client (Browser) | Adjusts visual crop box / bleed box margins per page or across the entire document. |
| | Redact PDF | `READY` | Client (Browser) | Genuinely removes and flattens underlying text/vector streams under opaque black masks. Original sensitive text is rendered non-extractable. |
| | PDF Forms | `READY` | Client (Browser) | Detects AcroForm text fields and checkboxes, allows interactive filling, and flattens/saves completed form. |
| **Optimization**| Compress PDF | `READY` | Client (Browser) | Stream recompression and unneeded object stripping. Measures exact before/after bytes; never falsely reports reduction if file size increased. |
| | Repair PDF | `LIMITED` | Client (Browser) | Rebuilds xref tables and document catalogs for mildly damaged files. Severe byte truncation cannot be magically repaired. |
| **Security** | Protect PDF | `LIMITED` | Client (Browser) | Password encryption. Supported via standard PDF encryption wrappers; prompts user if document uses unsupported features. |
| | Unlock PDF | `READY` | Client (Browser) | Removes encryption if user supplies the correct password. Does not perform illegal password cracking. |
| | Compare PDF | `READY` | Client (Browser) | Upload 2 PDFs; computes page count diff, text additions/deletions, and side-by-side diff highlights. |
| **Scanning/OCR**| Scan to PDF | `READY` | Client (Mobile/Web) | Uses HTML5 camera API (`getUserMedia`) with contrast and B&W document filters, page ordering, and PDF generation. |
| | OCR PDF | `READY` | Client (Browser) | Renders pages to canvas -> runs Tesseract.js WASM -> extracts text sequentially with progress percentage. |
| **AI PDF** | AI PDF Summarizer | `READY` | Client + AI API | Extracts text -> chunks -> routes to Google/Groq/OpenRouter. Respects Global AI Kill Switch. |
| | Translate PDF | `READY` | Client + AI API | Translates extracted text to 12+ languages using AI gateway; exports translated summary or PDF. |
| | PDF → Markdown | `READY` | Client + AI API | Converts structured text, headings, and tables to formatted Markdown with live preview and `.md` download. |
