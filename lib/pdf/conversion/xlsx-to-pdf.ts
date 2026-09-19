import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { savePdf } from '../core/save';
import { ProgressCallback } from '../types';

/**
 * Converts Excel (.xlsx) or CSV data into formatted tabular PDF pages.
 */
export async function convertXlsxToPdf(
  buffer: ArrayBuffer | Uint8Array,
  isCsv = false,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Reading spreadsheet data...');
  const rows: string[][] = [];

  if (isCsv) {
    const text = new TextDecoder().decode(buffer);
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        rows.push(line.split(',').map((c) => c.trim()));
      }
    }
  } else {
    // OpenXML XLSX package
    const zip = await JSZip.loadAsync(buffer);
    const sheetFile = zip.file('xl/worksheets/sheet1.xml');
    if (!sheetFile) {
      throw new Error('Invalid Excel file: sheet1.xml not found.');
    }
    const sheetXml = await sheetFile.async('text');

    // Extract inline string <t> or values inside cells
    const rowMatches = sheetXml.match(/<row[^>]*>([\s\S]*?)<\/row>/g) || [];
    for (const rMatch of rowMatches) {
      const cellMatches = rMatch.match(/<c[^>]*>([\s\S]*?)<\/c>/g) || [];
      const rowVals: string[] = [];
      for (const cMatch of cellMatches) {
        const valMatch = cMatch.match(/<t[^>]*>([\s\S]*?)<\/t>/) || cMatch.match(/<v>([\s\S]*?)<\/v>/);
        rowVals.push(valMatch ? valMatch[1].trim() : '');
      }
      if (rowVals.some(Boolean)) {
        rows.push(rowVals);
      }
    }
  }

  if (rows.length === 0) {
    throw new Error('Spreadsheet contains no extractable rows or cells.');
  }

  onProgress?.(60, 'Rendering tabular grid onto PDF pages...');
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // Landscape A4 for spreadsheets: 841.89 x 595.28
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const rowHeight = 22;

  const maxCols = Math.min(Math.max(...rows.map((r) => r.length), 1), 8);
  const colWidth = contentWidth / maxCols;

  let currentPage = doc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;

  for (let r = 0; r < rows.length; r++) {
    if (cursorY < margin + rowHeight) {
      currentPage = doc.addPage([pageWidth, pageHeight]);
      cursorY = pageHeight - margin;
    }

    const rowData = rows[r];
    const isHeader = r === 0;

    // Draw row background for header or alternate rows
    if (isHeader) {
      currentPage.drawRectangle({
        x: margin,
        y: cursorY - rowHeight + 4,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.9, 0.93, 0.98),
      });
    } else if (r % 2 === 0) {
      currentPage.drawRectangle({
        x: margin,
        y: cursorY - rowHeight + 4,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    // Draw cells
    for (let c = 0; c < maxCols; c++) {
      const cellText = (rowData[c] || '').slice(0, 30);
      currentPage.drawText(cellText, {
        x: margin + c * colWidth + 6,
        y: cursorY - 12,
        size: isHeader ? 9.5 : 8.5,
        font: isHeader ? boldFont : font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    cursorY -= rowHeight;
  }

  onProgress?.(90, 'Saving spreadsheet PDF...');
  const result = await savePdf(doc);
  onProgress?.(100, 'Excel spreadsheet converted to PDF successfully!');
  return result;
}
