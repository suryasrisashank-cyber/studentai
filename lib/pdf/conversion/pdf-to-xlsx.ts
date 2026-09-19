import JSZip from 'jszip';
import { extractAllPdfText } from '../core/rendering';
import { ProgressCallback } from '../types';

/**
 * Extracts tabular data and text from PDF into a genuine, structurally valid Microsoft Excel (.xlsx) file.
 */
export async function convertPdfToXlsx(
  pdfBytes: Uint8Array,
  filename = 'workbook',
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Extracting lines and tables from PDF...');
  const { text } = await extractAllPdfText(pdfBytes, 40);

  onProgress?.(50, 'Building Excel OpenXML workbook structure...');
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  // 3. xl/_rels/workbook.xml.rels
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
  );

  // 4. xl/workbook.xml
  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Extracted Data" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  // 5. xl/worksheets/sheet1.xml
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  let sheetRowsXml = '';

  const getColLetter = (colIdx: number) => {
    return String.fromCharCode(65 + (colIdx % 26));
  };

  for (let r = 0; r < lines.length; r++) {
    const rowNum = r + 1;
    // Split line into tab or comma or multiple whitespace separated columns
    const cols = lines[r].split(/\t|,|\s{2,}/).map((c) => c.trim()).filter(Boolean);
    const cellsToRender = cols.length > 0 ? cols : [lines[r].trim()];

    let rowCellsXml = '';
    for (let c = 0; c < cellsToRender.length; c++) {
      const colLetter = getColLetter(c);
      const cellRef = `${colLetter}${rowNum}`;
      const val = cellsToRender[c]
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      rowCellsXml += `<c r="${cellRef}" t="inlineStr"><is><t>${val}</t></is></c>`;
    }

    sheetRowsXml += `<row r="${rowNum}">${rowCellsXml}</row>`;
  }

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetRowsXml}
  </sheetData>
</worksheet>`;

  zip.file('xl/worksheets/sheet1.xml', sheetXml);

  onProgress?.(85, 'Packaging .xlsx workbook...');
  const xlsxBytes = await zip.generateAsync({ type: 'uint8array' });
  onProgress?.(100, 'Excel (.xlsx) workbook created successfully!');
  return xlsxBytes;
}
