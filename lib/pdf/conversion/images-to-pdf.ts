import { PDFDocument } from 'pdf-lib';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

export interface ImageInput {
  bytes: Uint8Array;
  mimeType: string;
  name?: string;
}

/** Standard page sizes in points [width, height] portrait */
export const PAGE_SIZES = {
  A4: [595.28, 841.89] as [number, number],
  Letter: [612.0, 792.0] as [number, number],
  Original: null as null, // Use image native dimensions
} as const;

export type PageSize = keyof typeof PAGE_SIZES;
export type Orientation = 'auto' | 'portrait' | 'landscape';
export type MarginPreset = 'none' | 'small' | 'medium';
export type ImageFit = 'fit' | 'fill' | 'original';
export type QualityPreset = 'standard' | 'high';

export const MARGIN_VALUES: Record<MarginPreset, number> = {
  none: 0,
  small: 14,   // ~5mm
  medium: 36,  // ~12.7mm
};

export interface ImagesToPdfOptions {
  pageSize?: PageSize;
  orientation?: Orientation;
  margin?: MarginPreset | number;  // preset string or raw points (legacy)
  imageFit?: ImageFit;
  quality?: QualityPreset;
  /** @deprecated use margin preset. Kept for backwards compat. */
  fitPage?: boolean;
}

/**
 * Professional JPG/PNG -> PDF engine.
 * Supports: A4, Letter, Original page sizes; Auto/Portrait/Landscape orientation;
 * None/Small/Medium margins; Fit/Fill/Original image positioning.
 */
export async function convertImagesToPdf(
  images: ImageInput[],
  options: ImagesToPdfOptions = {},
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  if (!images || images.length === 0) {
    throw new Error('Please provide at least one image file.');
  }

  const {
    pageSize = 'A4',
    orientation = 'auto',
    margin: marginOption = 'small',
    imageFit = 'fit',
  } = options;

  // Resolve margin in points
  const marginPts: number =
    typeof marginOption === 'number'
      ? marginOption
      : MARGIN_VALUES[marginOption as MarginPreset] ?? MARGIN_VALUES.small;

  onProgress?.(5, 'Initializing PDF engine...');
  const doc = await PDFDocument.create();

  for (let i = 0; i < images.length; i++) {
    const imgItem = images[i];
    const progressBase = 10 + Math.round((i / images.length) * 80);
    onProgress?.(progressBase, `Embedding image ${i + 1} of ${images.length}...`);

    const isPng = imgItem.mimeType.toLowerCase().includes('png');
    let embeddedImage;
    try {
      embeddedImage = isPng
        ? await doc.embedPng(imgItem.bytes)
        : await doc.embedJpg(imgItem.bytes);
    } catch {
      throw new Error(
        `Image ${i + 1} (${imgItem.name || 'unknown'}) could not be embedded. ` +
          'It may be corrupt, unsupported, or not a valid JPEG/PNG file.'
      );
    }

    const nativeDims = embeddedImage.scale(1.0);

    // Determine final page dimensions
    let pageW: number;
    let pageH: number;

    if (pageSize === 'Original') {
      pageW = nativeDims.width;
      pageH = nativeDims.height;
    } else {
      const baseDims = PAGE_SIZES[pageSize]!;
      const [baseW, baseH] = baseDims;

      let finalOrientation: 'portrait' | 'landscape';
      if (orientation === 'auto') {
        finalOrientation = nativeDims.width > nativeDims.height ? 'landscape' : 'portrait';
      } else {
        finalOrientation = orientation;
      }

      if (finalOrientation === 'landscape') {
        pageW = baseH;
        pageH = baseW;
      } else {
        pageW = baseW;
        pageH = baseH;
      }
    }

    // Determine draw position and size
    const availW = pageW - marginPts * 2;
    const availH = pageH - marginPts * 2;

    let drawW: number;
    let drawH: number;
    let drawX: number;
    let drawY: number;

    if (imageFit === 'fill') {
      const scaleX = availW / nativeDims.width;
      const scaleY = availH / nativeDims.height;
      const scale = Math.max(scaleX, scaleY);
      drawW = nativeDims.width * scale;
      drawH = nativeDims.height * scale;
      drawX = marginPts - (drawW - availW) / 2;
      drawY = marginPts - (drawH - availH) / 2;
    } else if (imageFit === 'original') {
      drawW = nativeDims.width;
      drawH = nativeDims.height;
      drawX = marginPts + (availW - drawW) / 2;
      drawY = marginPts + (availH - drawH) / 2;
    } else {
      // fit (default): letterbox
      const scaleX = availW / nativeDims.width;
      const scaleY = availH / nativeDims.height;
      const scale = Math.min(scaleX, scaleY, 1.0);
      drawW = nativeDims.width * scale;
      drawH = nativeDims.height * scale;
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

  onProgress?.(92, 'Generating PDF...');
  const result = await savePdf(doc);
  onProgress?.(
    100,
    `PDF created from ${images.length} image${images.length !== 1 ? 's' : ''} successfully!`
  );
  return result;
}
