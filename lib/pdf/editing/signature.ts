import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { SignatureOptions, ProgressCallback } from '../types';

/**
 * Applies a visual signature overlay onto a specific page of a PDF document.
 */
export async function applySignature(
  buffer: ArrayBuffer | Uint8Array,
  options: SignatureOptions,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  if (!options.dataUrl) {
    throw new Error('Signature image data is required.');
  }

  onProgress?.(15, 'Loading PDF document...');
  const doc = await loadPdf(buffer);
  const pages = doc.getPages();

  if (options.pageIndex < 0 || options.pageIndex >= pages.length) {
    throw new Error(`Invalid page index: ${options.pageIndex + 1}`);
  }

  onProgress?.(40, 'Embedding signature image...');
  const base64Data = options.dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const isPng = options.dataUrl.includes('image/png');
  const signatureImage = isPng
    ? await doc.embedPng(bytes)
    : await doc.embedJpg(bytes);

  onProgress?.(70, 'Placing signature on page...');
  const targetPage = pages[options.pageIndex];
  targetPage.drawImage(signatureImage, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
  });

  onProgress?.(90, 'Saving signed document...');
  const result = await savePdf(doc);
  onProgress?.(100, 'Signature applied successfully!');
  return result;
}
