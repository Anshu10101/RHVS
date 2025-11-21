import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider";
import ConditionalFooter from "@/components/ConditionalFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Ensure non-www URL is used (www redirects to non-www)
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
const siteUrl = baseUrl.replace(/^https?:\/\/(www\.)?/, 'https://'); // Remove www if present
const logoUrl = `${siteUrl}/rhvs_logo.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "राष्ट्रीय हिंदू वाहिनी संगठन - Rashtriya Hindu Vahini Sangathan",
    template: "%s | राष्ट्रीय हिंदू वाहिनी संगठन"
  },
  description: "राष्ट्रीय हिंदू वाहिनी संगठन (RHVS) की आधिकारिक वेबसाइट। हिंदू समुदाय की सेवा और एकता के लिए समर्पित। सनातन धर्म और हिंदू संस्कृति के संरक्षण में हमारे साथ जुड़ें।",
  keywords: [
    "Rashtriya Hindu Vahini Sangathan",
    "RHVS",
    "राष्ट्रीय हिंदू वाहिनी संगठन",
    "Hindu organization",
    "Hindu community organization",
    "Sanatan Dharma",
    "सनातन धर्म",
    "Hindu community",
    "Hindu culture",
    "Hindu religious organization",
    "religious organization",
    "spiritual products",
    "Hindu events",
    "community service",
    "Hindu community India",
    "Hindu organization India",
    "Hindu Sangathan",
    "Hindu Vahini",
    "community activities",
    "spiritual gatherings",
    "Hindu festivals",
    "religious events"
  ],
  authors: [{ name: "राष्ट्रीय हिंदू वाहिनी संगठन" }],
  creator: "राष्ट्रीय हिंदू वाहिनी संगठन",
  publisher: "राष्ट्रीय हिंदू वाहिनी संगठन",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/icons/icon-192x192.png"
  },
  openGraph: {
    type: "website",
    locale: "hi_IN", // Primary locale: Hindi (India)
    alternateLocale: ["en_IN", "hi", "en"], // Alternate locales
    url: "/",
    siteName: "राष्ट्रीय हिंदू वाहिनी संगठन",
    title: "राष्ट्रीय हिंदू वाहिनी संगठन - Rashtriya Hindu Vahini Sangathan",
    description: "राष्ट्रीय हिंदू वाहिनी संगठन (RHVS) की आधिकारिक वेबसाइट। हिंदू समुदाय की सेवा और एकता के लिए समर्पित। सनातन धर्म और हिंदू संस्कृति के संरक्षण में हमारे साथ जुड़ें।",
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
    title: "राष्ट्रीय हिंदू वाहिनी संगठन - Rashtriya Hindu Vahini Sangathan",
    description: "राष्ट्रीय हिंदू वाहिनी संगठन (RHVS) की आधिकारिक वेबसाइट। हिंदू समुदाय की सेवा और एकता के लिए समर्पित।",
    images: [logoUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl, // Use full non-www URL for canonical
    languages: {
      "hi": "/", // Primary language: Hindi
      "hi-IN": "/", // Hindi (India)
      "en": "/", // English (secondary)
      "en-IN": "/", // English (India)
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use the same non-www URL as defined above
  const logoUrl = `${siteUrl}/rhvs_logo.png`;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "राष्ट्रीय हिंदू वाहिनी संगठन",
    "alternateName": ["Rashtriya Hindu Vahini Sangathan", "RHVS"],
    "url": siteUrl,
    "logo": logoUrl,
    "description": "राष्ट्रीय हिंदू वाहिनी संगठन (RHVS) की आधिकारिक वेबसाइट। हिंदू समुदाय की सेवा और एकता के लिए समर्पित। सनातन धर्म और हिंदू संस्कृति के संरक्षण में हमारे साथ जुड़ें।",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "General Inquiry",
      "availableLanguage": ["en", "hi"]
    }
  };

  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ServiceWorkerProvider />
        <CartProvider>
          {children}
        </CartProvider>
        <ConditionalFooter />
        <Toaster />
      </body>
    </html>
  );
}