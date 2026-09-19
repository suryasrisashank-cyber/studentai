import { PDFDocument } from 'pdf-lib';
import { PageInfo } from '../types';

/**
 * Returns metadata for all pages in the PDFDocument.
 */
export function getPdfPageInfos(doc: PDFDocument): PageInfo[] {
  const pages = doc.getPages();
  return pages.map((page, index) => {
    const { width, height } = page.getSize();
    const rotation = page.getRotation().angle;
    return {
      pageNumber: index + 1,
      rotation,
      width,
      height,
    };
  });
}
