import type { Metadata } from 'next';
import { headers } from 'next/headers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const logoUrl = `${siteUrl}/rhvs_logo.png`;

async function getDepartment(id: string) {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3010';
    const proto = h.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const base = `${proto}://${host}`;
    
    const res = await fetch(`${base}/api/public/departments/${id}/hierarchy`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success && json?.data?.department ? json.data.department : null;
  } catch (error) {
    console.error('Error fetching department for metadata:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const department = await getDepartment(id);

  if (!department) {
    return {
      title: 'विभाग नहीं मिला - Department Not Found',
      description: 'The requested department could not be found.',
    };
  }

  const title = department.name_hi || department.name_en || 'विभाग';
  const titleEn = department.name_en || 'Department';
  const description = `राष्ट्रीय हिंदू वाहिनी संगठन के ${title} विभाग के सदस्यों और पदों की जानकारी | Information about members and positions of ${titleEn} department of Rashtriya Hindu Vahini Sangathan.`;
  const url = `/departments/${id}`;

  return {
    title: `${title} | राष्ट्रीय हिंदू वाहिनी संगठन`,
    description: description.length > 160 ? description.substring(0, 157) + '...' : description,
    keywords: [
      'RHVS departments',
      'Rashtriya Hindu Vahini Sangathan departments',
      'Hindu organization structure',
      titleEn,
      title,
      'department members',
      'organization hierarchy',
    ].filter(Boolean),
    openGraph: {
      title: `${title} | राष्ट्रीय हिंदू वाहिनी संगठन`,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      url,
      type: 'website',
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: 'Rashtriya Hindu Vahini Sangathan Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | राष्ट्रीय हिंदू वाहिनी संगठन`,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      images: [logoUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default function DepartmentHierarchyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

