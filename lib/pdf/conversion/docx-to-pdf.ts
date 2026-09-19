import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Converts a Microsoft Word (.docx) document into a PDF by extracting document XML paragraphs.
 */
export async function convertDocxToPdf(
  docxBuffer: ArrayBuffer | Uint8Array,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Unpacking Word (.docx) OpenXML container...');
  const zip = await JSZip.loadAsync(docxBuffer);
  const docXmlFile = zip.file('word/document.xml');

  if (!docXmlFile) {
    throw new Error('Invalid Word document: word/document.xml not found in package.');
  }

  const xmlText = await docXmlFile.async('text');

  onProgress?.(45, 'Extracting document text and paragraphs...');
  // Match all <w:p> paragraphs and extract inner <w:t> text
  const paragraphs: string[] = [];
  const pRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
  let pMatch;

  while ((pMatch = pRegex.exec(xmlText)) !== null) {
    const pContent = pMatch[1];
    const tRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
    let tMatch;
    let line = '';
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      line += tMatch[1];
    }
    if (line.trim()) {
      paragraphs.push(line.trim());
    }
  }

  if (paragraphs.length === 0) {
    throw new Error('Word document contains no extractable text paragraphs.');
  }

  onProgress?.(70, 'Rendering text into PDF pages...');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const fontSize = 11;
  const lineHeight = 16;

  let currentPage = doc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

  for (const para of paragraphs) {
    // Simple line wrapper
    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);

      if (width > contentWidth && currentLine) {
        if (cursorY < margin + lineHeight) {
          currentPage = doc.addPage([pageWidth, pageHeight]);
          cursorY = pageHeight - margin;
        }

        currentPage.drawText(currentLine, {
          x: margin,
          y: cursorY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });

        cursorY -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (cursorY < margin + lineHeight) {
        currentPage = doc.addPage([pageWidth, pageHeight]);
        cursorY = pageHeight - margin;
      }

      currentPage.drawText(currentLine, {
        x: margin,
        y: cursorY,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });

      cursorY -= lineHeight * 1.4; // Paragraph spacing
    }
  }

  onProgress?.(90, 'Saving PDF...');
  const result = await savePdf(doc);
  onProgress?.(100, 'Word document converted to PDF successfully!');
  return result;
}
