import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const logoUrl = `${siteUrl}/rhvs_logo.png`;

export const metadata: Metadata = {
  title: "गैलरी - Gallery",
  description: "राष्ट्रीय हिंदू वाहिनी संगठन द्वारा आयोजित समुदाय कार्यक्रम, त्योहार, आध्यात्मिक गतिविधियों और सांस्कृतिक उत्सवों की हमारी फोटो गैलरी देखें | View our photo gallery featuring community events, festivals, spiritual activities, and cultural celebrations organized by Rashtriya Hindu Vahini Sangathan.",
  keywords: [
    "RHVS gallery",
    "Rashtriya Hindu Vahini Sangathan gallery",
    "Hindu community photos",
    "community events photos",
    "festival photos",
    "spiritual activities",
    "cultural celebrations",
    "RHVS events",
    "Hindu community gallery",
    "religious events photos",
    "community activities photos"
  ],
  openGraph: {
    title: "गैलरी - Gallery | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "समुदाय कार्यक्रम, त्योहार और आध्यात्मिक गतिविधियों की हमारी फोटो गैलरी देखें | View our photo gallery featuring community events, festivals, and spiritual activities.",
    url: "/gallery",
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
    title: "गैलरी - Gallery | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "समुदाय कार्यक्रम और त्योहारों की फोटो गैलरी देखें | View our photo gallery featuring community events and festivals.",
    images: [logoUrl],
  },
  alternates: {
    canonical: "/gallery",
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

