import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const logoUrl = `${siteUrl}/rhvs_logo.png`;

export const metadata: Metadata = {
  title: "संपर्क करें - Contact Us",
  description: "पूछताछ, सहायता और हमारे समुदाय में शामिल होने के लिए राष्ट्रीय हिंदू वाहिनी संगठन (RHVS) से संपर्क करें | Get in touch with Rashtriya Hindu Vahini Sangathan (RHVS) for inquiries, support, and to join our community. Find our office locations and contact information.",
  keywords: [
    "contact RHVS",
    "Rashtriya Hindu Vahini Sangathan contact",
    "Hindu organization contact",
    "join Hindu community",
    "RHVS office locations",
    "community support",
    "Hindu community contact",
    "RHVS contact information",
    "join RHVS",
    "Hindu organization India contact"
  ],
  openGraph: {
    title: "संपर्क करें - Contact Us | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "राष्ट्रीय हिंदू वाहिनी संगठन (RHVS) से संपर्क करें | Get in touch with Rashtriya Hindu Vahini Sangathan (RHVS) for inquiries, support, and to join our community.",
    url: "/contact",
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
    title: "संपर्क करें - Contact Us | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "राष्ट्रीय हिंदू वाहिनी संगठन (RHVS) से संपर्क करें | Get in touch with Rashtriya Hindu Vahini Sangathan (RHVS) for inquiries and support.",
    images: [logoUrl],
  },
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

