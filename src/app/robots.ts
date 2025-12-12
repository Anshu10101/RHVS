import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrlRaw = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
  const baseUrl = baseUrlRaw.replace(/^https?:\/\/(www\.)?/, 'https://');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
