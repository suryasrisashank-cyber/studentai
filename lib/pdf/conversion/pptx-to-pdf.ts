import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Converts PowerPoint (.pptx) presentation slides into PDF slides.
 */
export async function convertPptxToPdf(
  buffer: ArrayBuffer | Uint8Array,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Unpacking PowerPoint presentation...');
  const zip = await JSZip.loadAsync(buffer);

  // Find all slide files: ppt/slides/slide1.xml, slide2.xml, etc.
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB;
    });

  if (slideFiles.length === 0) {
    throw new Error('PowerPoint file contains no slide definitions.');
  }

  onProgress?.(50, 'Converting slides to PDF pages...');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // 16:9 standard slide: 960 x 540
  const slideWidth = 841.89;
  const slideHeight = 595.28;

  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.file(slideFiles[i])!.async('text');

    // Extract all <a:t> texts
    const textMatches = xml.match(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g) || [];
    const strings = textMatches.map((m) => m.replace(/<\/?a:t[^>]*>/g, '').trim()).filter(Boolean);

    const title = strings[0] || `Slide ${i + 1}`;
    const bullets = strings.slice(1);

    const page = doc.addPage([slideWidth, slideHeight]);

    // Header bar
    page.drawRectangle({
      x: 0,
      y: slideHeight - 70,
      width: slideWidth,
      height: 70,
      color: rgb(0.12, 0.23, 0.45),
    });

    page.drawText(title.slice(0, 60), {
      x: 40,
      y: slideHeight - 45,
      size: 22,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    let y = slideHeight - 120;
    for (const bullet of bullets) {
      if (y < 60) break;
      page.drawText(`• ${bullet.slice(0, 90)}`, {
        x: 50,
        y,
        size: 14,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      y -= 28;
    }
  }

  onProgress?.(90, 'Saving presentation PDF...');
  const result = await savePdf(doc);
  onProgress?.(100, 'PowerPoint converted to PDF successfully!');
  return result;
}
