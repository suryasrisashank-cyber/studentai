import { renderPageToImage } from '../core/rendering';
import { ProgressCallback } from '../types';
import JSZip from 'jszip';

export interface PdfToImagesResult {
  isZip: boolean;
  images: { pageNumber: number; dataUrl: string }[];
  zipBytes?: Uint8Array;
  filename: string;
}

/**
 * Converts PDF pages into JPG or PNG images and bundles into a ZIP if multi-page.
 */
export async function convertPdfToImages(
  pdfBytes: Uint8Array,
  totalPages: number,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  scale = 1.5,
  baseFilename = 'document',
  onProgress?: ProgressCallback
): Promise<PdfToImagesResult> {
  const ext = format === 'image/png' ? 'png' : 'jpg';
  const images: { pageNumber: number; dataUrl: string }[] = [];
  const maxPagesToRender = Math.min(totalPages, 30);

  onProgress?.(10, 'Initializing page rendering...');

  if (maxPagesToRender === 1) {
    onProgress?.(50, 'Rendering page 1...');
    const dataUrl = await renderPageToImage(pdfBytes, 1, format, scale);
    images.push({ pageNumber: 1, dataUrl });
    onProgress?.(100, 'Render complete!');

    return {
      isZip: false,
      images,
      filename: `${baseFilename}_page_1.${ext}`,
    };
  }

  const zip = new JSZip();

  for (let p = 1; p <= maxPagesToRender; p++) {
    const percent = Math.round(15 + (p / maxPagesToRender) * 70);
    onProgress?.(percent, `Rendering page ${p} of ${maxPagesToRender}...`);

    const dataUrl = await renderPageToImage(pdfBytes, p, format, scale);
    images.push({ pageNumber: p, dataUrl });

    // Convert base64 dataUrl to Uint8Array for zip
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    zip.file(`${baseFilename}_page_${p}.${ext}`, bytes);
  }

  onProgress?.(90, 'Packaging images into ZIP...');
  const zipBytes = await zip.generateAsync({ type: 'uint8array' });
  onProgress?.(100, 'Images generated successfully!');

  return {
    isZip: true,
    images,
    zipBytes,
    filename: `${baseFilename}_images.zip`,
  };
}
