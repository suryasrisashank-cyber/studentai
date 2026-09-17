import { MetadataRoute } from 'next';
import { getAllToolSlugs } from '@/lib/tools-registry';

const BASE_URL = 'https://studentai-five.vercel.app';

// Fixed deployment date to avoid constantly changing lastModified on every build
const LAST_MODIFIED_DATE = new Date('2026-09-17T00:00:00.000Z');

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: LAST_MODIFIED_DATE,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = getAllToolSlugs().map((slug) => ({
    url: `${BASE_URL}/tools/${slug}`,
    lastModified: LAST_MODIFIED_DATE,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...toolRoutes];
}
