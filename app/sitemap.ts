import { MetadataRoute } from 'next';
import { getAllToolSlugs } from '@/lib/tools-registry';
import { getAllPdfToolSlugs } from '@/lib/pdf-tools-registry';

const BASE_URL = 'https://studentai-five.vercel.app';

// High-value PDF tool slugs that deserve priority boost
const HIGH_PRIORITY_PDF_SLUGS = new Set([
  'jpg-to-pdf',
  'png-to-pdf',
  'merge-pdf',
  'compress-pdf',
  'split-pdf',
  'pdf-to-word',
  'pdf-to-jpg',
  'word-to-pdf',
  'ocr-pdf',
  'rotate-pdf',
  'watermark-pdf',
  'protect-pdf',
  'unlock-pdf',
  'pdf-to-excel',
  'excel-to-pdf',
  'powerpoint-to-pdf',
  'html-to-pdf',
  'scan-to-pdf',
]);

const LAST_MODIFIED_DATE = new Date('2026-09-19T00:00:00.000Z');

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pdf-tools`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/ai`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = getAllToolSlugs().map((slug) => ({
    url: `${BASE_URL}/tools/${slug}`,
    lastModified: LAST_MODIFIED_DATE,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const pdfRoutes: MetadataRoute.Sitemap = getAllPdfToolSlugs().map((slug) => ({
    url: `${BASE_URL}/pdf-tools/${slug}`,
    lastModified: LAST_MODIFIED_DATE,
    changeFrequency: 'monthly',
    priority: HIGH_PRIORITY_PDF_SLUGS.has(slug) ? 0.9 : 0.75,
  }));

  return [...staticRoutes, ...toolRoutes, ...pdfRoutes];
}

