import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const logoUrl = `${siteUrl}/rhvs_logo.png`;

export const metadata: Metadata = {
  title: "समाचार - News",
  description: "राष्ट्रीय हिंदू वाहिनी संगठन की नवीनतम समाचार, घोषणाएं, अपडेट और उपलब्धियों से अपडेट रहें | Stay updated with the latest news, announcements, updates, and achievements from Rashtriya Hindu Vahini Sangathan.",
  keywords: [
    "RHVS news",
    "Rashtriya Hindu Vahini Sangathan news",
    "Hindu organization news",
    "community updates",
    "announcements",
    "achievements",
    "Hindu community news",
    "Hindu organization updates",
    "RHVS announcements",
    "community activities",
    "Hindu community activities"
  ],
  openGraph: {
    title: "समाचार - News | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "राष्ट्रीय हिंदू वाहिनी संगठन की नवीनतम समाचार और घोषणाओं से अपडेट रहें | Stay updated with the latest news and announcements from RHVS.",
    url: "/news",
    images: [
      {
        url: logoUrl,
        width: 1200,
        height: 630,
        alt: "Rashtriya Hindu Vahini Sangathan Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "समाचार - News | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "राष्ट्रीय हिंदू वाहिनी संगठन की नवीनतम समाचार से अपडेट रहें | Stay updated with the latest news from RHVS.",
    images: [logoUrl],
  },
  alternates: {
    canonical: "/news",
  },
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

