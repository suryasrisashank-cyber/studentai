import { StandardFonts, rgb, degrees } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { WatermarkOptions, ProgressCallback } from '../types';

/**
 * Applies text or image watermarks across all or selected pages in a PDF document.
 */
export async function applyWatermark(
  buffer: ArrayBuffer | Uint8Array,
  options: WatermarkOptions,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Loading PDF document...');
  const doc = await loadPdf(buffer);
  const pages = doc.getPages();

  const opacity = Math.min(Math.max(options.opacity ?? 0.25, 0.05), 1.0);
  const rotation = options.rotationDegrees ?? 45;
  const targetPages = options.pages === 'all' || !options.pages
    ? new Set(pages.map((_, i) => i))
    : new Set(options.pages);

  if (options.type === 'image' && options.imageDataUrl) {
    onProgress?.(35, 'Embedding watermark image...');
    const isPng = options.imageDataUrl.includes('image/png');
    const base64Data = options.imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const embeddedImage = isPng
      ? await doc.embedPng(bytes)
      : await doc.embedJpg(bytes);

    onProgress?.(60, 'Applying watermark to pages...');
    pages.forEach((page, index) => {
      if (targetPages.has(index)) {
        const { width, height } = page.getSize();
        const imgDims = embeddedImage.scale(0.5);
        const x = (width - imgDims.width) / 2;
        const y = (height - imgDims.height) / 2;

        page.drawImage(embeddedImage, {
          x,
          y,
          width: imgDims.width,
          height: imgDims.height,
          opacity,
          rotate: degrees(rotation),
        });
      }
    });
  } else {
    // Text watermark
    onProgress?.(35, 'Embedding font...');
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const text = options.text || 'CONFIDENTIAL';
    const fontSize = options.fontSize || 48;
    const color = options.color
      ? rgb(options.color.r, options.color.g, options.color.b)
      : rgb(0.7, 0.7, 0.7);

    onProgress?.(60, 'Applying text watermark to pages...');
    pages.forEach((page, index) => {
      if (targetPages.has(index)) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        // Center calculation
        const x = (width - textWidth) / 2;
        const y = (height - textHeight) / 2;

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color,
          opacity,
          rotate: degrees(rotation),
        });
      }
    });
  }

  onProgress?.(88, 'Saving watermarked document...');
  const result = await savePdf(doc);
  onProgress?.(100, 'Watermark applied successfully!');
  return result;
}
