import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
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
    // Primary identifiers - English
    "Rashtriya Hindu Vahini Sangathan",
    "RHVS",
    "RHVS India",
    "Rashtriya Hindu Vahini Sangathan official",
    "Rashtriya Hindu Vahini Sangathan website",
    // Primary identifiers - Hindi
    "राष्ट्रीय हिंदू वाहिनी संगठन",
    "राष्ट्रीय हिंदू वाहिनी संगठन आधिकारिक",
    "राष्ट्रीय हिंदू वाहिनी संगठन वेबसाइट",
    "आरएचवीएस",
    "आर एच वी एस",
    // Organization type
    "Hindu organization",
    "Hindu community organization",
    "Hindu religious organization",
    "religious organization",
    "Hindu Sangathan",
    "Hindu Vahini",
    "Hindu community",
    "Hindu community India",
    "Hindu organization India",
    // Religious & Cultural
    "Sanatan Dharma",
    "सनातन धर्म",
    "Hindu culture",
    "Hindu religion",
    "Hinduism",
    "हिंदू धर्म",
    "हिंदू संस्कृति",
    // Activities & Services
    "spiritual products",
    "Hindu events",
    "community service",
    "community activities",
    "spiritual gatherings",
    "Hindu festivals",
    "religious events",
    "Hindu community service",
    // Location-based
    "Hindu organization Delhi",
    "Hindu organization India",
    "Hindu community Delhi",
    "Hindu community India"
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
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/favicon.ico"
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
    "alternateName": [
      "Rashtriya Hindu Vahini Sangathan",
      "RHVS",
      "राष्ट्रीय हिंदू वाहिनी संगठन",
      "आरएचवीएस"
    ],
    "url": siteUrl,
    "logo": {
      "@type": "ImageObject",
      "url": logoUrl,
      "width": 1200,
      "height": 630
    },
    "image": logoUrl,
    "description": "राष्ट्रीय हिंदू वाहिनी संगठन (RHVS) की आधिकारिक वेबसाइट। हिंदू समुदाय की सेवा और एकता के लिए समर्पित। सनातन धर्म और हिंदू संस्कृति के संरक्षण में हमारे साथ जुड़ें।",
    "foundingDate": "2020",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN",
      "addressLocality": "New Delhi",
      "addressRegion": "Delhi"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "General Inquiry",
      "availableLanguage": ["en", "hi", "Hindi", "English"]
    },
    "sameAs": [
      siteUrl
    ],
    "knowsAbout": [
      "Hinduism",
      "Sanatan Dharma",
      "सनातन धर्म",
      "Hindu Community",
      "Religious Organization",
      "Community Service"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "राष्ट्रीय हिंदू वाहिनी संगठन",
    "alternateName": ["Rashtriya Hindu Vahini Sangathan", "RHVS"],
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["hi", "en", "hi-IN", "en-IN"]
  };

  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Additional meta tags for better SEO - Next.js metadata handles canonical and hreflang, but explicit tags help */}
        <link rel="canonical" href={siteUrl} />
        <link rel="alternate" hrefLang="hi" href={siteUrl} />
        <link rel="alternate" hrefLang="en" href={siteUrl} />
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ServiceWorkerProvider />
        <LanguageProvider>
        <CartProvider>
          {children}
        </CartProvider>
        </LanguageProvider>
        <ConditionalFooter />
        <Toaster />
      </body>
    </html>
  );
}