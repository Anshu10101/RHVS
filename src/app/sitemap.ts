import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // Ensure non-www URL is used (www redirects to non-www)
  const baseUrlRaw = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
  const baseUrl = baseUrlRaw.replace(/^https?:\/\/(www\.)?/, 'https://'); // Remove www if present
  const currentDate = new Date();

  const routes: MetadataRoute.Sitemap = [
    '',
    '/about',
    '/contact',
    '/gallery',
    '/products',
    '/events',
    '/news',
    '/activities',
    '/members',
    '/offices',
    '/karya-samiti',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: (route === '' ? 'daily' : 'weekly') as 'daily' | 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}

