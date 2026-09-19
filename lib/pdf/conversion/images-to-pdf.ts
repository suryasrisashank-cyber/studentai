import { PDFDocument } from 'pdf-lib';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

export interface ImageInput {
  bytes: Uint8Array;
  mimeType: string;
  name?: string;
}

export interface ImagesToPdfOptions {
  margin?: number; // points, default: 20
  fitPage?: boolean; // scale to fit A4
}

/**
 * Converts one or multiple JPG/PNG images into a standardized PDF document.
 */
export async function convertImagesToPdf(
  images: ImageInput[],
  options: ImagesToPdfOptions = {},
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  if (!images || images.length === 0) {
    throw new Error('Please provide at least one image file.');
  }

  onProgress?.(10, 'Initializing PDF...');
  const doc = await PDFDocument.create();
  const margin = options.margin !== undefined ? options.margin : 20;

  for (let i = 0; i < images.length; i++) {
    const imgItem = images[i];
    const isPng = imgItem.mimeType.toLowerCase().includes('png');

    onProgress?.(
      Math.round(15 + (i / images.length) * 75),
      `Processing image ${i + 1} of ${images.length}...`
    );

    let embeddedImage;
    if (isPng) {
      embeddedImage = await doc.embedPng(imgItem.bytes);
    } else {
      embeddedImage = await doc.embedJpg(imgItem.bytes);
    }

    const imgDims = embeddedImage.scale(1.0);

    // Standard A4 portrait dimensions: 595.28 x 841.89
    let pageWidth = 595.28;
    let pageHeight = 841.89;

    // If landscape image, rotate page to landscape
    if (imgDims.width > imgDims.height) {
      pageWidth = 841.89;
      pageHeight = 595.28;
    }

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const scaleX = availableWidth / imgDims.width;
    const scaleY = availableHeight / imgDims.height;
    const scale = Math.min(scaleX, scaleY, 1.0); // Don't upscale tiny images beyond 100%

    const drawWidth = imgDims.width * scale;
    const drawHeight = imgDims.height * scale;

    const x = margin + (availableWidth - drawWidth) / 2;
    const y = margin + (availableHeight - drawHeight) / 2;

    const page = doc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  onProgress?.(92, 'Generating PDF...');
  const result = await savePdf(doc);
  onProgress?.(100, 'PDF created from images successfully!');
  return result;
}
