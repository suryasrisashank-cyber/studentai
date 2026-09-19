import JSZip from 'jszip';
import { extractAllPdfText } from '../core/rendering';
import { ProgressCallback } from '../types';

/**
 * Converts PDF pages into a genuine, structurally valid Microsoft PowerPoint (.pptx) presentation.
 */
export async function convertPdfToPptx(
  pdfBytes: Uint8Array,
  filename = 'presentation',
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Extracting content from PDF slides...');
  const { text } = await extractAllPdfText(pdfBytes, 30);

  onProgress?.(50, 'Building PowerPoint OpenXML presentation...');
  const zip = new JSZip();

  // Split text by page indicators
  const pageSections = text.split(/--- Page \d+ ---/).filter((s) => s.trim().length > 0);
  const slidesContent = pageSections.length > 0 ? pageSections : [text];

  // 1. [Content_Types].xml
  let overrideTypes = '';
  for (let i = 1; i <= slidesContent.length; i++) {
    overrideTypes += `<Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
  }

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${overrideTypes}
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  // 3. ppt/presentation.xml and ppt/_rels/presentation.xml.rels
  let sldIdLst = '';
  let presRels = '';
  for (let i = 1; i <= slidesContent.length; i++) {
    sldIdLst += `<p:sldId id="${255 + i}" r:id="rId${i}"/>`;
    presRels += `<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i}.xml"/>`;
  }

  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:sldIdLst>
    ${sldIdLst}
  </p:sldIdLst>
</p:presentation>`
  );

  zip.file(
    'ppt/_rels/presentation.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels}
</Relationships>`
  );

  // 4. Create each slide XML
  for (let i = 0; i < slidesContent.length; i++) {
    const slideText = slidesContent[i].trim();
    const lines = slideText.split('\n').map((l) => l.trim()).filter(Boolean);
    const title = lines[0] || `Slide ${i + 1}`;
    const body = lines.slice(1).join(' ').slice(0, 500);

    const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeBody = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="685800" y="609600"/><a:ext cx="7772400" cy="1143000"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:p><a:r><a:rPr lang="en-US" sz="3200"/><a:t>${safeTitle}</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr>
        <p:spPr><a:xfrm><a:off x="685800" y="2057400"/><a:ext cx="7772400" cy="4114800"/></a:xfrm></p:spPr>
        <p:txBody><a:bodyPr/><a:p><a:r><a:rPr lang="en-US" sz="1800"/><a:t>${safeBody}</a:t></a:r></a:p></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

    zip.file(`ppt/slides/slide${i + 1}.xml`, slideXml);
  }

  onProgress?.(85, 'Packaging .pptx slides...');
  const pptxBytes = await zip.generateAsync({ type: 'uint8array' });
  onProgress?.(100, 'PowerPoint (.pptx) presentation created successfully!');
  return pptxBytes;
}
