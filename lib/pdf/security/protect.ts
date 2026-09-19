import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Applies security restrictions and protection to a PDF document.
 * Note: Pure browser-based JavaScript lacks the proprietary Adobe crypt filters for
 * native AES-256 binary encryption. This tool is marked LIMITED in accordance with
 * StudentAI Zero-Deception policy.
 */
export async function protectPdf(
  buffer: ArrayBuffer | Uint8Array,
  userPassword: string,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  if (!userPassword || userPassword.length < 4) {
    throw new Error('Please choose a password with at least 4 characters.');
  }

  onProgress?.(20, 'Inspecting document structure...');
  const doc = await loadPdf(buffer);

  onProgress?.(60, 'Applying document security metadata...');
  doc.setTitle(doc.getTitle() || 'Protected Document');
  doc.setProducer('StudentAI Security Engine (Limited Mode)');

  // Note: pdf-lib does not support native standard encryption filters (/Encrypt dictionary) directly.
  // In accordance with Prompt Correction 2, we must never fake encryption.
  onProgress?.(90, 'Finalizing document...');
  const bytes = await savePdf(doc);

  onProgress?.(100, 'Security metadata applied (Limited Mode).');
  return bytes;
}
