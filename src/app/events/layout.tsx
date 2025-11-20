import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const logoUrl = `${siteUrl}/rhvs_logo.png`;

export const metadata: Metadata = {
  title: "कार्यक्रम - Events",
  description: "राष्ट्रीय हिंदू वाहिनी संगठन द्वारा आयोजित समुदाय कार्यक्रम, त्योहार, आध्यात्मिक सभाएं, कार्यशालाएं और सम्मेलनों में शामिल हों | Join our community events, festivals, spiritual gatherings, workshops, and conferences organized by Rashtriya Hindu Vahini Sangathan.",
  keywords: [
    "Hindu events",
    "RHVS events",
    "Rashtriya Hindu Vahini Sangathan events",
    "community events",
    "festivals",
    "spiritual gatherings",
    "workshops",
    "conferences",
    "Hindu community activities",
    "Hindu festivals India",
    "religious events",
    "community gatherings",
    "spiritual activities"
  ],
  openGraph: {
    title: "कार्यक्रम - Events | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "हमारे समुदाय कार्यक्रम, त्योहार और आध्यात्मिक सभाओं में शामिल हों | Join our community events, festivals, and spiritual gatherings.",
    url: "/events",
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
    title: "कार्यक्रम - Events | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "हमारे समुदाय कार्यक्रम और त्योहारों में शामिल हों | Join our community events and festivals.",
    images: [logoUrl],
  },
  alternates: {
    canonical: "/events",
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

