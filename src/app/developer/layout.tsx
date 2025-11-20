import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const logoUrl = `${siteUrl}/rhvs_logo.png`;

export const metadata: Metadata = {
  title: "Developer - Anshul Yadav",
  description: "Meet Anshul Yadav, the developer behind Rashtriya Hindu Vahini Sangathan's digital platform. Full-stack developer specializing in Next.js, React, Node.js, and scalable web applications.",
  keywords: [
    "Anshul Yadav",
    "Full-stack developer",
    "Web developer",
    "Next.js developer",
    "React developer",
    "Node.js developer",
    "Software engineer",
    "RHVS developer"
  ],
  openGraph: {
    title: "Developer - Anshul Yadav | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "Meet the developer behind RHVS digital platform. Full-stack developer specializing in modern web technologies.",
    url: "/developer",
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
    title: "Developer - Anshul Yadav | राष्ट्रीय हिंदू वाहिनी संगठन",
    description: "Meet the developer behind RHVS digital platform.",
    images: [logoUrl],
  },
  alternates: {
    canonical: "/developer",
  },
};

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

