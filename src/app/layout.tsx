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
    default: "RHVS - राष्ट्रीय हिंदू वाहिनी संगठन | Rashtriya Hindu Vahini Sangathan Official Website",
    template: "%s | RHVS - राष्ट्रीय हिंदू वाहिनी संगठन"
  },
  description: "RHVS (राष्ट्रीय हिंदू वाहिनी संगठन) - Rashtriya Hindu Vahini Sangathan की आधिकारिक वेबसाइट। हिंदू समुदाय की सेवा और एकता के लिए समर्पित। सनातन धर्म और हिंदू संस्कृति के संरक्षण में हमारे साथ जुड़ें।",
  keywords: [
    // Primary identifiers - RHVS first for better ranking
    "RHVS",
    "RHVS official",
    "RHVS website",
    "RHVS India",
    "RHVS organization",
    "RHVS official website",
    "rhvs",
    "rhvs india",
    "rhvs official",
    "rhvs website",
    "Rashtriya Hindu Vahini Sangathan",
    "Rashtriya Hindu Vahini Sangathan official",
    "Rashtriya Hindu Vahini Sangathan website",
    "Rashtriya Hindu Vahini Sangathan RHVS",
    // Primary identifiers - Hindi
    "आरएचवीएस",
    "आर एच वी एस",
    "आरएचवीएस आधिकारिक",
    "आरएचवीएस वेबसाइट",
    "राष्ट्रीय हिंदू वाहिनी संगठन",
    "राष्ट्रीय हिंदू वाहिनी संगठन आधिकारिक",
    "राष्ट्रीय हिंदू वाहिनी संगठन वेबसाइट",
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
  authors: [{ name: "RHVS - राष्ट्रीय हिंदू वाहिनी संगठन" }],
  creator: "RHVS - राष्ट्रीय हिंदू वाहिनी संगठन",
  publisher: "RHVS - राष्ट्रीय हिंदू वाहिनी संगठन",
  applicationName: "RHVS",
  category: "Religious Organization",
  classification: "Hindu Organization",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/rhvs_logo.png", sizes: "any", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/rhvs_logo.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/rhvs_logo.png",
    other: [
      {
        rel: "apple-touch-icon",
        url: "/rhvs_logo.png"
      }
    ]
  },
  openGraph: {
    type: "website",
    locale: "hi_IN", // Primary locale: Hindi (India)
    alternateLocale: ["en_IN", "hi", "en"], // Alternate locales
    url: "/",
    siteName: "RHVS - राष्ट्रीय हिंदू वाहिनी संगठन",
    title: "RHVS - राष्ट्रीय हिंदू वाहिनी संगठन | Rashtriya Hindu Vahini Sangathan Official",
    description: "RHVS (राष्ट्रीय हिंदू वाहिनी संगठन) - Rashtriya Hindu Vahini Sangathan की आधिकारिक वेबसाइट। हिंदू समुदाय की सेवा और एकता के लिए समर्पित। सनातन धर्म और हिंदू संस्कृति के संरक्षण में हमारे साथ जुड़ें।",
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
    title: "RHVS - राष्ट्रीय हिंदू वाहिनी संगठन | Rashtriya Hindu Vahini Sangathan",
    description: "RHVS (राष्ट्रीय हिंदू वाहिनी संगठन) की आधिकारिक वेबसाइट। हिंदू समुदाय की सेवा और एकता के लिए समर्पित।",
    images: [logoUrl],
    site: "@rhvs",
    creator: "@rhvs",
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
  // Square logo for Google search results (must be 1:1 aspect ratio, min 112x112px)
  const squareLogoUrl = `${siteUrl}/icons/icon-512x512.png`;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "राष्ट्रीय हिंदू वाहिनी संगठन",
    "alternateName": [
      "RHVS",
      "rhvs",
      "Rashtriya Hindu Vahini Sangathan",
      "राष्ट्रीय हिंदू वाहिनी संगठन",
      "आरएचवीएस",
      "आर एच वी एस",
      "RHVS India",
      "RHVS Organization",
      "Rashtriya Hindu Vahini Sangathan RHVS"
    ],
    "url": siteUrl,
    "logo": {
      "@type": "ImageObject",
      "url": squareLogoUrl,
      "width": 512,
      "height": 512
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
    "alternateName": [
      "RHVS",
      "rhvs",
      "Rashtriya Hindu Vahini Sangathan",
      "RHVS Official Website",
      "RHVS India",
      "आरएचवीएस"
    ],
    "url": siteUrl,
    "description": "RHVS (राष्ट्रीय हिंदू वाहिनी संगठन) - Rashtriya Hindu Vahini Sangathan की आधिकारिक वेबसाइट",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": ["hi", "en", "hi-IN", "en-IN"],
    "publisher": {
      "@type": "Organization",
      "name": "RHVS",
      "alternateName": "राष्ट्रीय हिंदू वाहिनी संगठन"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "RHVS",
        "item": siteUrl
      }
    ]
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
        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        {/* Favicon links - Explicit links for Google Search */}
        <link rel="icon" href="/rhvs_logo.png" type="image/png" sizes="any" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/rhvs_logo.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/rhvs_logo.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/icons/icon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icons/icon-512x512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/rhvs_logo.png" />
        <link rel="shortcut icon" href="/rhvs_logo.png" />
        {/* Logo for Google Search Results - must be square (1:1 aspect ratio) */}
        <link rel="logo" href={squareLogoUrl} />
        <meta itemProp="logo" content={squareLogoUrl} />
        {/* Additional meta tags for better SEO - Next.js metadata handles canonical and hreflang, but explicit tags help */}
        <link rel="canonical" href={siteUrl} />
        <link rel="alternate" hrefLang="hi" href={siteUrl} />
        <link rel="alternate" hrefLang="en" href={siteUrl} />
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />
        {/* Brand and organization meta tags for better brand search ranking */}
        <meta name="brand" content="RHVS" />
        <meta name="organization" content="राष्ट्रीय हिंदू वाहिनी संगठन" />
        <meta name="organization:en" content="Rashtriya Hindu Vahini Sangathan" />
        <meta name="organization:abbreviation" content="RHVS" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <meta name="language" content="hi,en" />
        <meta name="coverage" content="Worldwide" />
        <meta name="distribution" content="Global" />
        <meta name="rating" content="General" />
        <meta name="revisit-after" content="1 days" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
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