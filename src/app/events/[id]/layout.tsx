import type { Metadata } from 'next';
import { headers } from 'next/headers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const logoUrl = `${siteUrl}/rhvs_logo.png`;

async function getEvent(id: string) {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3010';
    const proto = h.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const base = `${proto}://${host}`;
    
    const res = await fetch(`${base}/api/content/events?id=${id}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success && json?.data?.length > 0 ? json.data[0] : null;
  } catch (error) {
    console.error('Error fetching event for metadata:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return {
      title: 'कार्यक्रम नहीं मिला - Event Not Found',
      description: 'The requested event could not be found.',
    };
  }

  const title = event.title || 'कार्यक्रम';
  const description = event.description?.substring(0, 160) || `राष्ट्रीय हिंदू वाहिनी संगठन द्वारा आयोजित कार्यक्रम: ${title}`;
  const imageUrl = event.image_path || event.resolved_image_path || logoUrl;
  const url = `/events/${id}`;
  const eventDate = event.event_date ? new Date(event.event_date).toLocaleDateString('hi-IN') : '';

  return {
    title: `${title} | राष्ट्रीय हिंदू वाहिनी संगठन`,
    description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    keywords: [
      'RHVS events',
      'Rashtriya Hindu Vahini Sangathan events',
      'Hindu community events',
      event.event_type || 'event',
      event.location || '',
      event.district || '',
      event.state || '',
    ].filter(Boolean),
    openGraph: {
      title: `${title} | राष्ट्रीय हिंदू वाहिनी संगठन`,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      url,
      type: 'website',
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
    other: {
      'event:start_time': event.event_date ? new Date(event.event_date).toISOString() : '',
      'event:location': event.location || event.address || '',
    },
  };
}

export default function EventDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

