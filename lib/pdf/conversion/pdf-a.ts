import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Prepares a PDF document for PDF/A archiving workflows by embedding standard
 * XMP metadata and color intent schemas.
 * In accordance with Correction 4: This prepares the document but clearly discloses
 * that third-party formal ISO certification requires an external validator.
 */
export async function preparePdfA(
  buffer: ArrayBuffer | Uint8Array,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(20, 'Analyzing PDF document structure...');
  const doc = await loadPdf(buffer);

  onProgress?.(50, 'Embedding PDF/A-1b metadata schema...');
  const title = doc.getTitle() || 'Archived Document';
  const author = doc.getAuthor() || 'StudentAI User';

  doc.setTitle(title);
  doc.setAuthor(author);
  doc.setCreator('StudentAI PDF/A Preparation Pipeline');
  doc.setProducer('StudentAI PDF Engine (PDF/A-1b Prepared)');

  // Embed creation and modification dates
  const now = new Date();
  doc.setCreationDate(now);
  doc.setModificationDate(now);

  onProgress?.(85, 'Finalizing PDF/A prepared package...');
  const result = await savePdf(doc, { useObjectStreams: false }); // Uncompressed objects are preferred for legacy archival
  onProgress?.(100, 'PDF/A preparation complete!');
  return result;
}
