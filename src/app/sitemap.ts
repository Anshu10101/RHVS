import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // Ensure non-www URL is used (www redirects to non-www)
  const baseUrlRaw = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
  const baseUrl = baseUrlRaw.replace(/^https?:\/\/(www\.)?/, 'https://'); // Remove www if present
  const currentDate = new Date();

  const routes: MetadataRoute.Sitemap = [
    { route: '', priority: 1.0, changeFrequency: 'daily' },
    { route: '/about', priority: 0.9, changeFrequency: 'monthly' },
    { route: '/contact', priority: 0.9, changeFrequency: 'monthly' },
    { route: '/gallery', priority: 0.8, changeFrequency: 'weekly' },
    { route: '/products', priority: 0.9, changeFrequency: 'weekly' },
    { route: '/events', priority: 0.8, changeFrequency: 'weekly' },
    { route: '/news', priority: 0.8, changeFrequency: 'daily' },
    { route: '/activities', priority: 0.7, changeFrequency: 'weekly' },
    { route: '/members/register', priority: 0.8, changeFrequency: 'monthly' },
    { route: '/offices', priority: 0.7, changeFrequency: 'monthly' },
    { route: '/karya-samiti', priority: 0.8, changeFrequency: 'monthly' },
  ].map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: changeFrequency as 'daily' | 'weekly' | 'monthly',
    priority: priority,
  }));

  return routes;
}

