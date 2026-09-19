import JSZip from 'jszip';
import { extractAllPdfText } from '../core/rendering';
import { ProgressCallback } from '../types';

/**
 * Converts PDF extracted content into a genuine, structurally valid Microsoft Word (.docx) file.
 * Creates standard OpenXML package parts.
 */
export async function convertPdfToDocx(
  pdfBytes: Uint8Array,
  filename = 'document',
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Extracting text and structure from PDF...');
  const { text } = await extractAllPdfText(pdfBytes, 50);

  onProgress?.(50, 'Building Word OpenXML package structure...');
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/document.xml
  const paragraphs = text
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  let docXmlBody = '';
  for (const para of paragraphs) {
    // Escape XML characters
    const escaped = para
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    if (escaped.startsWith('--- Page')) {
      // Section break / page indicator
      docXmlBody += `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="2B579A"/></w:rPr><w:t>${escaped}</w:t></w:r></w:p>`;
    } else {
      docXmlBody += `<w:p><w:r><w:t>${escaped}</w:t></w:r></w:p>`;
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${docXmlBody}
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);

  onProgress?.(85, 'Packaging .docx file...');
  const docxBytes = await zip.generateAsync({ type: 'uint8array' });
  onProgress?.(100, 'Word (.docx) document created successfully!');
  return docxBytes;
}
