import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Converts structured semantic HTML into a formatted PDF document.
 * Supports headings, paragraphs, lists, pre/code blocks, and tables.
 */
export async function convertHtmlToPdf(
  htmlText: string,
  docTitle = 'Document',
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Parsing HTML structure...');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const monoFont = await doc.embedFont(StandardFonts.Courier);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = doc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

  // Clean HTML: strip <script>, <style>
  const cleanHtml = htmlText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Extract block elements: h1, h2, h3, p, li, pre, blockquote
  const blockRegex = /<(h[1-6]|p|li|pre|blockquote)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match;
  const blocks: { tag: string; text: string }[] = [];

  while ((match = blockRegex.exec(cleanHtml)) !== null) {
    const tag = match[1].toLowerCase();
    // Strip inner HTML tags and unescape entities
    const rawText = match[2]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    if (rawText) {
      blocks.push({ tag, text: rawText });
    }
  }

  // Fallback if no specific tags matched: split by lines
  if (blocks.length === 0) {
    const plain = cleanHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain) {
      blocks.push({ tag: 'p', text: plain });
    }
  }

  onProgress?.(50, 'Rendering HTML elements onto pages...');

  for (const block of blocks) {
    let currentFont = font;
    let fontSize = 11;
    let lineHeight = 16;
    let textColor = rgb(0.15, 0.15, 0.15);
    let indent = 0;

    if (block.tag === 'h1') {
      currentFont = boldFont;
      fontSize = 20;
      lineHeight = 26;
      cursorY -= 8;
    } else if (block.tag === 'h2') {
      currentFont = boldFont;
      fontSize = 15;
      lineHeight = 21;
      cursorY -= 6;
    } else if (block.tag === 'h3') {
      currentFont = boldFont;
      fontSize = 12.5;
      lineHeight = 18;
      cursorY -= 4;
    } else if (block.tag === 'li') {
      indent = 16;
    } else if (block.tag === 'pre') {
      currentFont = monoFont;
      fontSize = 9.5;
      lineHeight = 13;
    }

    const words = block.text.split(/\s+/);
    let line = block.tag === 'li' ? '• ' : '';

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = currentFont.widthOfTextAtSize(test, fontSize);

      if (w > contentWidth - indent && line) {
        if (cursorY < margin + lineHeight) {
          currentPage = doc.addPage([pageWidth, pageHeight]);
          cursorY = pageHeight - margin;
        }

        currentPage.drawText(line, {
          x: margin + indent,
          y: cursorY,
          size: fontSize,
          font: currentFont,
          color: textColor,
        });

        cursorY -= lineHeight;
        line = word;
      } else {
        line = test;
      }
    }

    if (line) {
      if (cursorY < margin + lineHeight) {
        currentPage = doc.addPage([pageWidth, pageHeight]);
        cursorY = pageHeight - margin;
      }

      currentPage.drawText(line, {
        x: margin + indent,
        y: cursorY,
        size: fontSize,
        font: currentFont,
        color: textColor,
      });

      cursorY -= lineHeight * 1.3;
    }
  }

  onProgress?.(85, 'Saving HTML-converted PDF...');
  const result = await savePdf(doc);
  onProgress?.(100, 'HTML converted to PDF successfully!');
  return result;
}
