import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const logoUrl = `${siteUrl}/rhvs_logo.png`;

export const metadata: Metadata = {
  title: "About • सनातन धर्म | Rashtriya Hindu Vahini Sangathan",
  description:
    "सनातन धर्म के इतिहास, स्वरूप और मूल भावों का संक्षिप्त परिचय | About Sanatan Dharma by Rashtriya Hindu Vahini Sangathan",
  keywords: [
    "Sanatan Dharma",
    "सनातन धर्म",
    "RHVS about",
    "Rashtriya Hindu Vahini Sangathan about",
    "Hindu religion",
    "Hindu philosophy",
    "Hindu culture",
    "Hindu organization about",
    "Hindu community about"
  ],
  openGraph: {
    title: "About • सनातन धर्म | Rashtriya Hindu Vahini Sangathan",
    description: "सनातन धर्म के इतिहास, स्वरूप और मूल भावों का संक्षिप्त परिचय | About Sanatan Dharma by Rashtriya Hindu Vahini Sangathan",
    url: "/about",
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
    title: "About • सनातन धर्म | Rashtriya Hindu Vahini Sangathan",
    description: "About Sanatan Dharma by Rashtriya Hindu Vahini Sangathan",
    images: [logoUrl],
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

