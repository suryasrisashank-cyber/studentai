import { PDFDocument } from 'pdf-lib';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Decrypts a password-protected PDF when the legitimate password is provided.
 */
export async function unlockPdf(
  buffer: ArrayBuffer | Uint8Array,
  password: string,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  if (!password) {
    throw new Error('Please enter the password to unlock this document.');
  }

  onProgress?.(20, 'Verifying document password...');
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  let doc: PDFDocument;
  try {
    // Attempt load with password
    doc = await PDFDocument.load(bytes, {
      // @ts-expect-error - pdf-lib password option
      password,
      ignoreEncryption: false,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
      throw new Error('Incorrect password. Please check and try again.');
    }
    throw new Error(`Failed to decrypt PDF document: ${msg}`);
  }

  onProgress?.(60, 'Removing encryption restrictions...');
  const pageCount = doc.getPageCount();
  if (pageCount === 0) {
    throw new Error('Decrypted document contains no pages.');
  }

  // Create clean unencrypted copy
  const unlockedDoc = await PDFDocument.create();
  const copiedPages = await unlockedDoc.copyPages(doc, doc.getPageIndices());
  for (const page of copiedPages) {
    unlockedDoc.addPage(page);
  }

  onProgress?.(85, 'Saving unlocked document...');
  const unlockedBytes = await savePdf(unlockedDoc);
  onProgress?.(100, 'Document unlocked successfully!');

  return unlockedBytes;
}
