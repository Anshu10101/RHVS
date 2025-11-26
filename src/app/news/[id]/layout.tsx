import type { Metadata } from 'next';
import { headers } from 'next/headers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const logoUrl = `${siteUrl}/rhvs_logo.png`;

async function getNewsArticle(id: string) {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3010';
    const proto = h.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const base = `${proto}://${host}`;
    
    const res = await fetch(`${base}/api/content/news?id=${id}&published=true`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success && json?.data?.length > 0 ? json.data[0] : null;
  } catch (error) {
    console.error('Error fetching news for metadata:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const news = await getNewsArticle(id);

  if (!news) {
    return {
      title: 'समाचार नहीं मिला - News Not Found',
      description: 'The requested news article could not be found.',
    };
  }

  const title = news.title_hindi || news.title || 'समाचार';
  const description = news.excerpt || news.content?.substring(0, 160) || 'राष्ट्रीय हिंदू वाहिनी संगठन की समाचार';
  const imageUrl = news.image_path || logoUrl;
  const url = `/news/${id}`;

  return {
    title: `${title} | राष्ट्रीय हिंदू वाहिनी संगठन`,
    description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    keywords: [
      'RHVS news',
      'Rashtriya Hindu Vahini Sangathan',
      'Hindu organization news',
      news.news_type || 'news',
      news.district || '',
      news.state || '',
    ].filter(Boolean),
    openGraph: {
      title: `${title} | राष्ट्रीय हिंदू वाहिनी संगठन`,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      url,
      type: 'article',
      publishedTime: news.published_at || news.created_at,
      modifiedTime: news.updated_at,
      images: [
        {
          url: imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | राष्ट्रीय हिंदू वाहिनी संगठन`,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      images: [imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default function NewsArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

