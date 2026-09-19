import { StandardFonts, rgb } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { PageNumberOptions, ProgressCallback } from '../types';

/**
 * Inserts page numbers into a PDF document with custom positioning and styling.
 */
export async function addPageNumbers(
  buffer: ArrayBuffer | Uint8Array,
  options: PageNumberOptions,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Loading PDF document...');
  const doc = await loadPdf(buffer);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const totalPages = pages.length;

  const fontSize = options.fontSize || 10;
  const startNum = options.startNumber !== undefined ? options.startNumber : 1;
  const margin = options.margin !== undefined ? options.margin : 36;
  const position = options.position || 'bottom-center';
  const format = options.format || 'page_of_total';

  onProgress?.(40, 'Adding page numbers...');
  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const currentNum = startNum + index;
    const text = format === 'page_of_total'
      ? `Page ${currentNum} of ${startNum + totalPages - 1}`
      : `${currentNum}`;

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    let x = margin;
    let y = margin;

    // Horizontal alignment
    if (position.includes('center')) {
      x = (width - textWidth) / 2;
    } else if (position.includes('right')) {
      x = width - margin - textWidth;
    }

    // Vertical alignment
    if (position.includes('top')) {
      y = height - margin - textHeight;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  onProgress?.(85, 'Saving document with page numbers...');
  const result = await savePdf(doc);
  onProgress?.(100, 'Page numbers applied successfully!');
  return result;
}
