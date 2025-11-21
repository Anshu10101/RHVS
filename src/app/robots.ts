import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Ensure non-www URL is used (www redirects to non-www)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
  const siteUrl = baseUrl.replace(/^https?:\/\/(www\.)?/, 'https://'); // Remove www if present
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/cart',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/cart',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

