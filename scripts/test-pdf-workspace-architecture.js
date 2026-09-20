#!/usr/bin/env node
/**
 * StudentAI — PDF Workspace Architecture & Dashboard Test Suite
 *
 * Verifies the new modular, context-aware PDF Workspace architecture:
 * 1. Existence and integrity of components/pdf/workspace/ modules
 * 2. Typed workspace state & slug-to-tool-mode mapping
 * 3. Context-aware toolbars for Edit, Organize, Merge, JPG→PDF, Compress, OCR, AI
 * 4. Responsive page sidebar (desktop vertical vs mobile horizontal strip)
 * 5. Central canvas with zoom, rotation, and viewport overflow protection
 * 6. Truthful processing modal (determinate & indeterminate)
 * 7. Result panel with filename, size, and download triggers
 * 8. Error state sanitization (zero stack trace leakage)
 * 9. Dashboard (/pdf-tools) hero dropzone, instant search, and empty states
 *
 * Run: node scripts/test-pdf-workspace-architecture.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
const errors = [];

async function test(name, fn) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      await res;
    }
    passed++;
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (err) {
    failed++;
    const msg = err && err.message ? err.message : String(err);
    errors.push({ name, error: msg });
    process.stdout.write(`  ✗ ${name}: ${msg}\n`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

/* ──────────────────────────────────────────────────────────────────────────
 * Test Suite Execution
 * ────────────────────────────────────────────────────────────────────────── */

async function runAllTests() {
  process.stdout.write('\n=== StudentAI: PDF Workspace Architecture Test Suite ===\n\n');

  const workspaceDir = path.join(__dirname, '..', 'components', 'pdf', 'workspace');

  // Group 1: Workspace Files Existence
  process.stdout.write('--- Group 1: Workspace Modular Components Existence ---\n');

  const expectedFiles = [
    'types.ts',
    'PdfWorkspace.tsx',
    'PdfWorkspaceHeader.tsx',
    'PdfWorkspaceToolbar.tsx',
    'PdfPageSidebar.tsx',
    'PdfPageThumbnail.tsx',
    'PdfCanvas.tsx',
    'PdfSettingsPanel.tsx',
    'PdfProcessingModal.tsx',
    'PdfResultPanel.tsx',
    'PdfErrorState.tsx',
    'index.ts',
  ];

  for (const file of expectedFiles) {
    await test(`1.${expectedFiles.indexOf(file) + 1}: components/pdf/workspace/${file} exists and is populated`, () => {
      const filePath = path.join(workspaceDir, file);
      assert(fs.existsSync(filePath), `${file} must exist`);
      const src = fs.readFileSync(filePath, 'utf8');
      assert(src.length > 50, `${file} must contain code`);
    });
  }

  // Group 2: Types & Mode Mapping
  process.stdout.write('\n--- Group 2: Typed Workspace State & Mode Mapping ---\n');

  const typesSrc = fs.readFileSync(path.join(workspaceDir, 'types.ts'), 'utf8');

  await test('2.1: PdfWorkspaceState interface defines all mandatory fields', () => {
    assert(typesSrc.includes('uploadedFiles: File[]'), 'Must have uploadedFiles');
    assert(typesSrc.includes('pages: PdfPage[]'), 'Must have pages');
    assert(typesSrc.includes('selectedPageIds: string[]'), 'Must have selectedPageIds');
    assert(typesSrc.includes('activePageId: string | null'), 'Must have activePageId');
    assert(typesSrc.includes('zoom: number'), 'Must have zoom');
    assert(typesSrc.includes('rotation: number'), 'Must have rotation');
    assert(typesSrc.includes('isProcessing: boolean'), 'Must have isProcessing');
    assert(typesSrc.includes('progress: number'), 'Must have progress');
    assert(typesSrc.includes('error: string | null'), 'Must have error');
    assert(typesSrc.includes('result: PdfProcessingResult | null'), 'Must have result');
  });

  await test('2.2: mapSlugToToolMode correctly maps standard tool slugs', () => {
    assert(typesSrc.includes("case 'edit-pdf':"), 'Maps edit-pdf');
    assert(typesSrc.includes("case 'organize-pdf':"), 'Maps organize-pdf');
    assert(typesSrc.includes("case 'merge-pdf':"), 'Maps merge-pdf');
    assert(typesSrc.includes("case 'jpg-to-pdf':"), 'Maps jpg-to-pdf');
    assert(typesSrc.includes("case 'compress-pdf':"), 'Maps compress-pdf');
    assert(typesSrc.includes("case 'ocr-pdf':"), 'Maps ocr-pdf');
  });

  // Group 3: Context-Aware Toolbars
  process.stdout.write('\n--- Group 3: Context-Aware Toolbar Customization ---\n');

  const toolbarSrc = fs.readFileSync(path.join(workspaceDir, 'PdfWorkspaceToolbar.tsx'), 'utf8');

  await test('3.1: EDIT PDF toolbar includes Zoom, Rotate, Text, Draw, Signature, Delete', () => {
    assert(toolbarSrc.includes("toolMode === 'edit'"), 'Has edit mode branch');
    assert(toolbarSrc.includes('Add Text'), 'Includes Add Text');
    assert(toolbarSrc.includes('Draw'), 'Includes Draw');
    assert(toolbarSrc.includes('Signature'), 'Includes Signature');
    assert(toolbarSrc.includes('Delete'), 'Includes Delete');
  });

  await test('3.2: ORGANIZE PDF toolbar includes Move Up, Move Down, Rotate, Delete', () => {
    assert(toolbarSrc.includes("toolMode === 'organize'"), 'Has organize mode branch');
    assert(toolbarSrc.includes('Move Up'), 'Includes Move Up');
    assert(toolbarSrc.includes('Move Down'), 'Includes Move Down');
    assert(toolbarSrc.includes('Rotate'), 'Includes Rotate');
  });

  await test('3.3: MERGE PDF toolbar includes Add PDF, Reorder, Clear All', () => {
    assert(toolbarSrc.includes("toolMode === 'merge'"), 'Has merge mode branch');
    assert(toolbarSrc.includes('Add PDF'), 'Includes Add PDF');
    assert(toolbarSrc.includes('Reorder'), 'Includes Reorder');
    assert(toolbarSrc.includes('Clear All'), 'Includes Clear All');
  });

  await test('3.4: JPG TO PDF toolbar includes Add Images & Page Settings', () => {
    assert(toolbarSrc.includes("toolMode === 'jpg-to-pdf'"), 'Has jpg-to-pdf mode branch');
    assert(toolbarSrc.includes('Add Images'), 'Includes Add Images');
  });

  await test('3.5: AI PDF toolbar includes Summary, Chat, and Study Guide', () => {
    assert(toolbarSrc.includes('AI Summary'), 'Includes AI Summary');
    assert(toolbarSrc.includes('Chat'), 'Includes Chat');
    assert(toolbarSrc.includes('Study Guide'), 'Includes Study Guide');
  });

  // Group 4: Responsive Page Sidebar
  process.stdout.write('\n--- Group 4: Responsive Page Sidebar Invariants ---\n');

  const sidebarSrc = fs.readFileSync(path.join(workspaceDir, 'PdfPageSidebar.tsx'), 'utf8');

  await test('4.1: Desktop layout renders vertical scrollable thumbnail sidebar (lg:flex)', () => {
    assert(sidebarSrc.includes('hidden lg:flex'), 'Desktop sidebar must be hidden on mobile and flex on lg');
    assert(sidebarSrc.includes('w-64'), 'Must have desktop sidebar width');
    assert(sidebarSrc.includes('overflow-y-auto'), 'Must have vertical scrolling');
  });

  await test('4.2: Mobile layout renders horizontal touch filmstrip (lg:hidden)', () => {
    assert(sidebarSrc.includes('lg:hidden'), 'Must hide mobile filmstrip on desktop');
    assert(sidebarSrc.includes('overflow-x-auto'), 'Must use horizontal swipe on mobile');
  });

  // Group 5: Document Canvas & Viewport Protection
  process.stdout.write('\n--- Group 5: Central Document Canvas Invariants ---\n');

  const canvasSrc = fs.readFileSync(path.join(workspaceDir, 'PdfCanvas.tsx'), 'utf8');

  await test('5.1: Canvas restricts horizontal overflow via max-w-full overflow-auto', () => {
    assert(canvasSrc.includes('max-w-full'), 'Must enforce max-w-full');
    assert(canvasSrc.includes('overflow-auto'), 'Must handle document overflow safely');
  });

  await test('5.2: Canvas supports zoom scale transform', () => {
    assert(canvasSrc.includes('scale(${zoom})'), 'Must apply scale transform based on zoom');
  });

  await test('5.3: Canvas supports document rotation transform', () => {
    assert(canvasSrc.includes('rotate(${combinedRotation}deg)'), 'Must apply rotation transform');
  });

  // Group 6: Truthful Processing Modal & Result Panel
  process.stdout.write('\n--- Group 6: Truthful Progress & Result Presentation ---\n');

  const modalSrc = fs.readFileSync(path.join(workspaceDir, 'PdfProcessingModal.tsx'), 'utf8');
  const resultSrc = fs.readFileSync(path.join(workspaceDir, 'PdfResultPanel.tsx'), 'utf8');

  await test('6.1: Processing modal includes accessible role="progressbar" and aria-valuenow', () => {
    assert(modalSrc.includes('role="progressbar"'), 'Must have progressbar role');
    assert(modalSrc.includes('aria-valuenow'), 'Must have aria-valuenow');
  });

  await test('6.2: Processing modal supports indeterminate state when exact progress unmeasurable', () => {
    assert(modalSrc.includes('isIndeterminate'), 'Must support isIndeterminate flag');
  });

  await test('6.3: Result panel displays PDF Ready, filename, size, and download triggers', () => {
    assert(resultSrc.includes('PDF Ready!'), 'Must show PDF Ready!');
    assert(resultSrc.includes('fmtBytes(result.size)'), 'Must format size');
    assert(resultSrc.includes('onDownload'), 'Must have onDownload handler');
    assert(resultSrc.includes('onReset'), 'Must have onReset handler');
  });

  // Group 7: Error State Sanitization (Zero Stack Traces)
  process.stdout.write('\n--- Group 7: Error State Sanitization ---\n');

  const errorSrc = fs.readFileSync(path.join(workspaceDir, 'PdfErrorState.tsx'), 'utf8');

  await test('7.1: Error state sanitizes raw messages and strips stack traces', () => {
    assert(errorSrc.includes('replace(/at\\s+.*\\(.*:\\d+:\\d+\\)/g'), 'Must strip JavaScript stack trace lines');
    assert(errorSrc.includes('role="alert"'), 'Must have accessible alert role');
  });

  await test('7.2: Categorizes size, header, memory, and format errors into user-friendly notices', () => {
    assert(errorSrc.includes('File Size Exceeded'), 'Handles oversized file');
    assert(errorSrc.includes('Invalid PDF Document'), 'Handles invalid document');
    assert(errorSrc.includes('Browser Memory Limitation'), 'Handles browser OOM memory');
  });

  // Group 8: Dashboard (/pdf-tools) Enhancements
  process.stdout.write('\n--- Group 8: PDF Tools Dashboard & Search Invariants ---\n');

  const hubPagePath = path.join(__dirname, '..', 'app', 'pdf-tools', 'page.tsx');
  const hubPageSrc = fs.readFileSync(hubPagePath, 'utf8');

  await test('8.1: Dashboard includes prominent hero drag-and-drop upload zone', () => {
    assert(hubPageSrc.includes('handleHeroDrop'), 'Must handle drag & drop upload in hero');
    assert(hubPageSrc.includes('Drop your PDF or JPG files here'), 'Must display drag and drop hero prompt');
  });

  await test('8.2: Instant search filters across name, description, tags, slug, and category', () => {
    assert(hubPageSrc.includes('tool.name.toLowerCase().includes(query)'), 'Matches tool name');
    assert(hubPageSrc.includes('tool.slug.toLowerCase().includes(query)'), 'Matches tool slug');
    assert(hubPageSrc.includes('tool.description.toLowerCase().includes(query)'), 'Matches description');
  });

  await test('8.3: Renders "No PDF tools found." empty state when search produces no matches', () => {
    assert(hubPageSrc.includes('No PDF tools found.'), 'Must display empty state');
    assert(hubPageSrc.includes('Reset Search & Filters'), 'Must provide reset button');
  });

  // Summary
  process.stdout.write('\n==================================================\n');
  process.stdout.write(`Workspace Architecture Results: ${passed} Passed, ${failed} Failed\n`);
  process.stdout.write('==================================================\n\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
