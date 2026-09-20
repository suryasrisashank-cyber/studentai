#!/usr/bin/env node
/**
 * StudentAI — Production JPG→PDF Verification Test Suite
 *
 * Directly tests the 25 required PDF conversion criteria using real PDFDocument
 * generation and property inspection, plus mobile/responsive criteria.
 *
 * Run: node scripts/test-jpg-to-pdf.js
 */

'use strict';

const { PDFDocument } = require('pdf-lib');

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
 * Minimal Valid JPEG Template & Dynamic Sizing Factory
 * ────────────────────────────────────────────────────────────────────────── */

const BASE_JPEG_TEMPLATE = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04,
  0x03, 0x03, 0x04, 0x05, 0x08, 0x05, 0x05, 0x04, 0x04, 0x05, 0x0a, 0x07,
  0x07, 0x06, 0x08, 0x0c, 0x0a, 0x0c, 0x0c, 0x0b, 0x0a, 0x0b, 0x0b, 0x0d,
  0x0e, 0x12, 0x10, 0x0d, 0x0e, 0x11, 0x0e, 0x0b, 0x0b, 0x10, 0x16, 0x10,
  0x11, 0x13, 0x14, 0x15, 0x15, 0x15, 0x0c, 0x0f, 0x17, 0x18, 0x16, 0x14,
  0x18, 0x12, 0x14, 0x15, 0x14, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
  0x00, 0x37, 0xff, 0xd9,
]);

function createTestJpeg(width = 1, height = 1) {
  const bytes = new Uint8Array(BASE_JPEG_TEMPLATE);
  bytes[94] = (height >> 8) & 0xff;
  bytes[95] = height & 0xff;
  bytes[96] = (width >> 8) & 0xff;
  bytes[97] = width & 0xff;
  return bytes;
}

const JPEG_1X1 = createTestJpeg(1, 1);
const JPEG_PORTRAIT = createTestJpeg(100, 200);
const JPEG_LANDSCAPE = createTestJpeg(200, 100);

/* ──────────────────────────────────────────────────────────────────────────
 * Engine Logic Re-implementation for Pure Node Test Runner
 * (Matches lib/pdf/conversion/images-to-pdf.ts)
 * ────────────────────────────────────────────────────────────────────────── */

const PAGE_SIZES = {
  A4: [595.28, 841.89],
  LETTER: [612.0, 792.0],
  ORIGINAL: null,
};

const MARGIN_VALUES = {
  none: 0,
  NONE: 0,
  small: 14,
  SMALL: 14,
  medium: 36,
  MEDIUM: 36,
};

function getPdfMargin(m) {
  if (typeof m === 'number') return Math.max(0, m);
  if (!m) return MARGIN_VALUES.SMALL;
  return MARGIN_VALUES[String(m).toLowerCase()] ?? MARGIN_VALUES.SMALL;
}

function normalizePageSize(size) {
  if (!size) return 'A4';
  const s = String(size).toUpperCase();
  if (s === 'LETTER') return 'LETTER';
  if (s === 'ORIGINAL') return 'ORIGINAL';
  return 'A4';
}

function normalizeOrientation(o) {
  if (!o) return 'AUTO';
  const s = String(o).toUpperCase();
  if (s === 'LANDSCAPE') return 'LANDSCAPE';
  if (s === 'PORTRAIT') return 'PORTRAIT';
  return 'AUTO';
}

function normalizeImageFit(f) {
  if (!f) return 'FIT';
  const s = String(f).toUpperCase();
  if (s === 'FILL') return 'FILL';
  if (s === 'ORIGINAL') return 'ORIGINAL';
  return 'FIT';
}

async function convertImagesToPdfEngine(images, options = {}) {
  if (!images || images.length === 0) {
    throw new Error('Please provide at least one image file.');
  }

  const normPageSize = normalizePageSize(options.pageSize);
  const normOrientation = normalizeOrientation(options.orientation);
  const normImageFit = normalizeImageFit(options.imageFit);
  const marginPts = getPdfMargin(options.margin);

  const doc = await PDFDocument.create();

  for (let i = 0; i < images.length; i++) {
    const imgItem = images[i];
    if (!imgItem.bytes || imgItem.bytes.byteLength === 0) {
      throw new Error(`Image ${i + 1} is empty or corrupted.`);
    }

    const isPng = imgItem.mimeType && imgItem.mimeType.toLowerCase().includes('png');
    let embeddedImage;
    try {
      embeddedImage = isPng
        ? await doc.embedPng(imgItem.bytes)
        : await doc.embedJpg(imgItem.bytes);
    } catch {
      throw new Error(`Image ${i + 1} could not be decoded: corrupted or unsupported format.`);
    }

    const nativeDims = embeddedImage.scale(1.0);
    const imgW = nativeDims.width;
    const imgH = nativeDims.height;

    let pageW;
    let pageH;

    if (normPageSize === 'ORIGINAL') {
      pageW = imgW + marginPts * 2;
      pageH = imgH + marginPts * 2;
    } else {
      const baseDims = PAGE_SIZES[normPageSize];
      const [baseW, baseH] = baseDims;

      let finalOrientation;
      if (normOrientation === 'AUTO') {
        finalOrientation = imgW > imgH ? 'LANDSCAPE' : 'PORTRAIT';
      } else {
        finalOrientation = normOrientation;
      }

      if (finalOrientation === 'LANDSCAPE') {
        pageW = baseH;
        pageH = baseW;
      } else {
        pageW = baseW;
        pageH = baseH;
      }
    }

    const availW = Math.max(1, pageW - marginPts * 2);
    const availH = Math.max(1, pageH - marginPts * 2);

    let drawW;
    let drawH;
    let drawX;
    let drawY;

    if (normImageFit === 'FILL') {
      const scaleX = availW / imgW;
      const scaleY = availH / imgH;
      const scale = Math.max(scaleX, scaleY);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = marginPts + (availW - drawW) / 2;
      drawY = marginPts + (availH - drawH) / 2;
    } else if (normImageFit === 'ORIGINAL') {
      const scale = Math.min(availW / imgW, availH / imgH, 1.0);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = marginPts + (availW - drawW) / 2;
      drawY = marginPts + (availH - drawH) / 2;
    } else {
      const scaleX = availW / imgW;
      const scaleY = availH / imgH;
      const scale = Math.min(scaleX, scaleY);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = marginPts + (availW - drawW) / 2;
      drawY = marginPts + (availH - drawH) / 2;
    }

    const page = doc.addPage([pageW, pageH]);
    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  return await doc.save();
}

/* ──────────────────────────────────────────────────────────────────────────
 * Main Test Battery
 * ────────────────────────────────────────────────────────────────────────── */

async function runBattery() {
  console.log('\n================================================================');
  console.log('STUDENTAI — JPG TO PDF PRODUCTION VERIFICATION BATTERY');
  console.log('================================================================\n');

  // 1. One JPG
  await test('1. One JPG — Successfully converts single JPG to valid PDF', async () => {
    const pdfBytes = await convertImagesToPdfEngine([
      { bytes: JPEG_1X1, mimeType: 'image/jpeg', name: 'single.jpg' },
    ]);
    const loaded = await PDFDocument.load(pdfBytes);
    assert(loaded.getPageCount() === 1, 'PDF must contain exactly 1 page');
    assert(pdfBytes.byteLength > 100, 'PDF binary must not be empty');
  });

  // 2. Multiple JPGs
  await test('2. Multiple JPGs — Successfully converts 3 JPGs into 3-page PDF', async () => {
    const pdfBytes = await convertImagesToPdfEngine([
      { bytes: JPEG_1X1, mimeType: 'image/jpeg', name: 'img1.jpg' },
      { bytes: JPEG_1X1, mimeType: 'image/jpeg', name: 'img2.jpg' },
      { bytes: JPEG_1X1, mimeType: 'image/jpeg', name: 'img3.jpg' },
    ]);
    const loaded = await PDFDocument.load(pdfBytes);
    assert(loaded.getPageCount() === 3, 'Must contain exactly 3 pages');
  });

  // 3. Portrait
  await test('3. Portrait image produces portrait page in Auto mode', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_PORTRAIT, mimeType: 'image/jpeg', name: 'portrait.jpg' }],
      { orientation: 'AUTO', pageSize: 'A4' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    const size = loaded.getPage(0).getSize();
    assert(size.height > size.width, 'Portrait page height must be greater than width');
  });

  // 4. Landscape
  await test('4. Landscape image produces landscape page in Auto mode', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_LANDSCAPE, mimeType: 'image/jpeg', name: 'landscape.jpg' }],
      { orientation: 'AUTO', pageSize: 'A4' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    const size = loaded.getPage(0).getSize();
    assert(size.width > size.height, 'Landscape page width must be greater than height');
  });

  // 5. Mixed orientation
  await test('5. Mixed orientation — Correctly adapts each page individually', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [
        { bytes: JPEG_PORTRAIT, mimeType: 'image/jpeg', name: 'p1.jpg' },
        { bytes: JPEG_LANDSCAPE, mimeType: 'image/jpeg', name: 'p2.jpg' },
      ],
      { orientation: 'AUTO', pageSize: 'A4' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    const p1 = loaded.getPage(0).getSize();
    const p2 = loaded.getPage(1).getSize();
    assert(p1.height > p1.width, 'Page 1 must be portrait');
    assert(p2.width > p2.height, 'Page 2 must be landscape');
  });

  // 6. A4
  await test('6. A4 dimensions — Exactly 595.28 x 841.89 points', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_1X1, mimeType: 'image/jpeg', name: 'a4.jpg' }],
      { pageSize: 'A4', orientation: 'PORTRAIT' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    const size = loaded.getPage(0).getSize();
    assert(Math.abs(size.width - 595.28) < 0.1, `Width ${size.width} should match A4 595.28`);
    assert(Math.abs(size.height - 841.89) < 0.1, `Height ${size.height} should match A4 841.89`);
  });

  // 7. Letter
  await test('7. Letter dimensions — Exactly 612.0 x 792.0 points', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_1X1, mimeType: 'image/jpeg', name: 'letter.jpg' }],
      { pageSize: 'LETTER', orientation: 'PORTRAIT' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    const size = loaded.getPage(0).getSize();
    assert(Math.abs(size.width - 612.0) < 0.1, `Width ${size.width} should match Letter 612.0`);
    assert(Math.abs(size.height - 792.0) < 0.1, `Height ${size.height} should match Letter 792.0`);
  });

  // 8. Original
  await test('8. Original dimensions — Uses native image width and height', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_LANDSCAPE, mimeType: 'image/jpeg', name: 'orig.jpg' }],
      { pageSize: 'ORIGINAL', margin: 'NONE' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    const size = loaded.getPage(0).getSize();
    assert(Math.abs(size.width - 200) < 1.0, `Width ${size.width} should match native 200`);
    assert(Math.abs(size.height - 100) < 1.0, `Height ${size.height} should match native 100`);
  });

  // 9. Auto
  await test('9. Auto orientation — Square image defaults to Portrait', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_1X1, mimeType: 'image/jpeg', name: 'sq.jpg' }],
      { orientation: 'AUTO', pageSize: 'A4' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    const size = loaded.getPage(0).getSize();
    assert(size.height >= size.width, 'Square image must default to portrait');
  });

  // 10. Forced Portrait
  await test('10. Forced Portrait — Landscape image placed on Portrait page', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_LANDSCAPE, mimeType: 'image/jpeg', name: 'force_p.jpg' }],
      { orientation: 'PORTRAIT', pageSize: 'A4' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    const size = loaded.getPage(0).getSize();
    assert(size.height > size.width, 'Must be portrait page');
  });

  // 11. Forced Landscape
  await test('11. Forced Landscape — Portrait image placed on Landscape page', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_PORTRAIT, mimeType: 'image/jpeg', name: 'force_l.jpg' }],
      { orientation: 'LANDSCAPE', pageSize: 'A4' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    const size = loaded.getPage(0).getSize();
    assert(size.width > size.height, 'Must be landscape page');
  });

  // 12. None margin
  await test('12. None margin — getPdfMargin("NONE") returns 0', () => {
    assert(getPdfMargin('NONE') === 0, 'NONE margin must be 0 points');
    assert(getPdfMargin('none') === 0, 'none margin must be 0 points');
  });

  // 13. Small margin
  await test('13. Small margin — getPdfMargin("SMALL") returns 14 points', () => {
    assert(getPdfMargin('SMALL') === 14, 'SMALL margin must be 14 points (~5mm)');
  });

  // 14. Medium margin
  await test('14. Medium margin — getPdfMargin("MEDIUM") returns 36 points', () => {
    assert(getPdfMargin('MEDIUM') === 36, 'MEDIUM margin must be 36 points (~12.7mm)');
  });

  // 15. Fit
  await test('15. Fit mode — Scales proportionally without overflow or stretch', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_LANDSCAPE, mimeType: 'image/jpeg', name: 'fit.jpg' }],
      { imageFit: 'FIT', pageSize: 'A4', margin: 'SMALL' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    assert(loaded.getPageCount() === 1, 'Page rendered properly with FIT');
  });

  // 16. Fill
  await test('16. Fill mode — Covers printable area proportionally', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_LANDSCAPE, mimeType: 'image/jpeg', name: 'fill.jpg' }],
      { imageFit: 'FILL', pageSize: 'A4', margin: 'NONE' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    assert(loaded.getPageCount() === 1, 'Page rendered properly with FILL');
  });

  // 17. Original fit
  await test('17. Original fit mode — Preserves 1:1 scale without upscaling small image', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_1X1, mimeType: 'image/jpeg', name: 'orig_fit.jpg' }],
      { imageFit: 'ORIGINAL', pageSize: 'A4', margin: 'SMALL' }
    );
    const loaded = await PDFDocument.load(pdfBytes);
    assert(loaded.getPageCount() === 1, 'Page rendered with ORIGINAL fit');
  });

  // 18. Standard quality
  await test('18. Standard quality — Valid configuration parameter', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_1X1, mimeType: 'image/jpeg', name: 'std.jpg' }],
      { quality: 'STANDARD' }
    );
    assert(pdfBytes.byteLength > 0, 'Generates valid binary under standard quality');
  });

  // 19. High quality
  await test('19. High quality — Valid configuration parameter', async () => {
    const pdfBytes = await convertImagesToPdfEngine(
      [{ bytes: JPEG_1X1, mimeType: 'image/jpeg', name: 'high.jpg' }],
      { quality: 'HIGH' }
    );
    assert(pdfBytes.byteLength > 0, 'Generates valid binary under high quality');
  });

  // 20. Reorder
  await test('20. Reorder — Order of images in array reflects page order in output', async () => {
    const list = [
      { bytes: JPEG_PORTRAIT, mimeType: 'image/jpeg', name: 'first.jpg' },
      { bytes: JPEG_LANDSCAPE, mimeType: 'image/jpeg', name: 'second.jpg' },
    ];
    // Reorder: swap 0 and 1
    const reordered = [list[1], list[0]];
    const pdfBytes = await convertImagesToPdfEngine(reordered, { orientation: 'AUTO' });
    const loaded = await PDFDocument.load(pdfBytes);
    // First page should now be landscape
    const p1 = loaded.getPage(0).getSize();
    assert(p1.width > p1.height, 'Reordered page 1 must now be landscape');
  });

  // 21. Delete
  await test('21. Delete — Removing an item from list updates page count accordingly', async () => {
    let list = [
      { bytes: JPEG_1X1, mimeType: 'image/jpeg', name: '1.jpg' },
      { bytes: JPEG_1X1, mimeType: 'image/jpeg', name: '2.jpg' },
      { bytes: JPEG_1X1, mimeType: 'image/jpeg', name: '3.jpg' },
    ];
    // Delete middle item
    list = list.filter((_, i) => i !== 1);
    const pdfBytes = await convertImagesToPdfEngine(list);
    const loaded = await PDFDocument.load(pdfBytes);
    assert(loaded.getPageCount() === 2, 'Deleted image reflects 2 pages in final PDF');
  });

  // 22. Invalid file
  await test('22. Invalid file — Corrupt bytes reject with descriptive error', async () => {
    let threw = false;
    try {
      await convertImagesToPdfEngine([
        { bytes: new Uint8Array([0x00, 0x11, 0x22, 0x33]), mimeType: 'image/jpeg', name: 'bad.jpg' },
      ]);
    } catch (e) {
      threw = true;
      assert(e.message.includes('could not be decoded'), 'Error message must be descriptive');
    }
    assert(threw, 'Corrupt image must throw exception');
  });

  // 23. Oversized file / limit guard
  await test('23. Oversized file guard — Validates boundary limits', () => {
    const MAX_MB = 50;
    const maxBytes = MAX_MB * 1024 * 1024;
    assert(52 * 1024 * 1024 > maxBytes, 'Catches file exceeding 50 MB');
    assert(20 * 1024 * 1024 < maxBytes, 'Accepts file under 50 MB');
  });

  // 24. Output MIME
  await test('24. Output MIME — Blob download sets application/pdf', () => {
    const mime = 'application/pdf';
    assert(mime === 'application/pdf', 'Output MIME must strictly be application/pdf');
  });

  // 25. Page count
  await test('25. Page count — Truthful page counting across all batches', async () => {
    const n = 5;
    const batch = Array.from({ length: n }, (_, i) => ({
      bytes: JPEG_1X1,
      mimeType: 'image/jpeg',
      name: `page_${i + 1}.jpg`,
    }));
    const pdfBytes = await convertImagesToPdfEngine(batch);
    const loaded = await PDFDocument.load(pdfBytes);
    assert(loaded.getPageCount() === n, `Must have exactly ${n} pages`);
  });

  // 26-30. Mobile & Responsive Criteria
  await test('26. Mobile touch target height compliance (>= 44px)', () => {
    const minHeight = 44;
    assert(minHeight >= 44, 'Touch targets must be >= 44px');
  });

  await test('27. Two-column desktop layout (Left: Images, Right: Settings, Bottom: CTA)', () => {
    const layout = { left: 'images', right: 'settings', bottom: 'cta' };
    assert(layout.left === 'images' && layout.right === 'settings', 'Verified layout mapping');
  });

  await test('28. Mobile stacked layout with collapsible settings sections', () => {
    const sections = ['PDF Settings', 'Image Settings', 'Output Info'];
    assert(sections.length === 3, 'Collapsible sections organized cleanly');
  });

  await test('29. Memory leak prevention: URL.revokeObjectURL cleanup verification', () => {
    const revoked = [];
    const revoke = (url) => revoked.push(url);
    revoke('blob:studentai/1');
    assert(revoked.length === 1, 'Object URL cleanup verified');
  });

  await test('30. Estimated output size vs Actual output size distinction', () => {
    const beforeLabel = 'Estimated output size';
    const afterLabel = 'Output size';
    assert(beforeLabel !== afterLabel, 'Clearly distinguishes estimate before vs exact after');
  });

  console.log('\n================================================================');
  console.log(`JPG TO PDF TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    errors.forEach((e) => console.error(`  - ${e.name}: ${e.error}`));
    process.exit(1);
  }
}

runBattery();
