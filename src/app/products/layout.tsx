import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const logoUrl = `${siteUrl}/rhvs_logo.png`;

export const metadata: Metadata = {
  title: "उत्पाद स्टोर - Products Store",
  description: "हमारे गुरुओं द्वारा आशीर्वादित और भक्ति से निर्मित प्रामाणिक आध्यात्मिक उत्पादों की हमारी संग्रह ब्राउज़ करें | Browse our collection of authentic spiritual products, blessed by our gurus and crafted with devotion. Shop for Rudraksha malas, Tulsi malas, puja items, and more sacred products from Rashtriya Hindu Vahini Sangathan.",
  keywords: [
    "spiritual products",
    "RHVS products",
    "Rashtriya Hindu Vahini Sangathan products",
    "religious items",
    "puja items",
    "Rudraksha mala",
    "Tulsi mala",
    "sacred products",
    "Hindu religious items",
    "spiritual store",
    "Hindu spiritual products",
    "religious products India",
    "puja samagri",
    "spiritual items online"
  ],
  openGraph: {
    title: "उत्पाद स्टोर - Products Store | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "हमारे गुरुओं द्वारा आशीर्वादित प्रामाणिक आध्यात्मिक उत्पादों की संग्रह ब्राउज़ करें | Browse our collection of authentic spiritual products, blessed by our gurus.",
    url: "/products",
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
    title: "उत्पाद स्टोर - Products Store | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "प्रामाणिक आध्यात्मिक उत्पादों की संग्रह ब्राउज़ करें | Browse our collection of authentic spiritual products.",
    images: [logoUrl],
  },
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

