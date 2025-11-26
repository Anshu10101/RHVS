import type { Metadata } from 'next';
import { headers } from 'next/headers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const logoUrl = `${siteUrl}/rhvs_logo.png`;

async function getProduct(id: string) {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3010';
    const proto = h.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const base = `${proto}://${host}`;
    
    const res = await fetch(`${base}/api/products/${id}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success && json?.product ? json.product : null;
  } catch (error) {
    console.error('Error fetching product for metadata:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'उत्पाद नहीं मिला - Product Not Found',
      description: 'The requested product could not be found.',
    };
  }

  const title = product.name || 'उत्पाद';
  const description = product.description?.substring(0, 160) || `राष्ट्रीय हिंदू वाहिनी संगठन से ${title} - आध्यात्मिक उत्पाद`;
  const imageUrl = product.imageUrl || product.images?.[0] || logoUrl;
  const url = `/products/${id}`;
  const price = product.price ? `₹${product.price}` : '';
  const originalPrice = product.originalPrice ? `₹${product.originalPrice}` : '';

  return {
    title: `${title} | राष्ट्रीय हिंदू वाहिनी संगठन`,
    description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    keywords: [
      'RHVS products',
      'Rashtriya Hindu Vahini Sangathan products',
      'spiritual products',
      'Hindu religious items',
      product.category || '',
      ...(product.tags || []),
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
      'product:price:amount': product.price?.toString() || '',
      'product:price:currency': 'INR',
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
    },
  };
}

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

