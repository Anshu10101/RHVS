import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';

export const metadata: Metadata = {
  title: 'RHVS Registration | Rashtriya Hindu Vahini Sangathan Member Registration | राष्ट्रीय हिन्दू वाहिनी संगठन पंजीकरण',
  description: 'Register as a member of Rashtriya Hindu Vahini Sangathan (RHVS). Join thousands of members dedicated to preserving and promoting Sanatan Dharma and Hindu culture. Online registration available in Hindi and English. राष्ट्रीय हिन्दू वाहिनी संगठन में सदस्य के रूप में पंजीकरण करें।',
  keywords: [
    'RHVS registration',
    'RHVS member registration',
    'Rashtriya Hindu Vahini Sangathan registration',
    'Rashtriya Hindu Vahini Sangathan member registration',
    'RHVS join',
    'RHVS membership',
    'Hindu organization registration',
    'Sanatan Dharma registration',
    'राष्ट्रीय हिन्दू वाहिनी संगठन पंजीकरण',
    'RHVS पंजीकरण',
    'राष्ट्रीय हिन्दू वाहिनी संगठन सदस्यता',
    'RHVS सदस्य पंजीकरण',
    'हिन्दू संगठन पंजीकरण',
    'सनातन धर्म पंजीकरण',
    'RHVS online registration',
    'RHVS member signup',
    'RHVS join now',
    'राष्ट्रीय हिन्दू वाहिनी संगठन ऑनलाइन पंजीकरण'
  ],
  openGraph: {
    title: 'RHVS Registration | Rashtriya Hindu Vahini Sangathan Member Registration',
    description: 'Register as a member of Rashtriya Hindu Vahini Sangathan (RHVS). Join thousands of members dedicated to preserving and promoting Sanatan Dharma.',
    url: `${baseUrl}/members/register`,
    siteName: 'Rashtriya Hindu Vahini Sangathan',
    images: [
      {
        url: `${baseUrl}/rhvs_logo.png`,
        width: 1200,
        height: 630,
        alt: 'RHVS Logo',
      },
    ],
    locale: 'hi_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RHVS Registration | Rashtriya Hindu Vahini Sangathan',
    description: 'Register as a member of RHVS. Join thousands of members dedicated to preserving Sanatan Dharma.',
    images: [`${baseUrl}/rhvs_logo.png`],
  },
  alternates: {
    canonical: `${baseUrl}/members/register`,
    languages: {
      'hi': `${baseUrl}/members/register`,
      'en': `${baseUrl}/members/register`,
      'x-default': `${baseUrl}/members/register`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const registrationSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "RHVS Member Registration | Rashtriya Hindu Vahini Sangathan Registration",
    "alternateName": "राष्ट्रीय हिन्दू वाहिनी संगठन पंजीकरण",
    "description": "Register as a member of Rashtriya Hindu Vahini Sangathan (RHVS). Join thousands of members dedicated to preserving and promoting Sanatan Dharma and Hindu culture. Online registration available in Hindi and English.",
    "url": `${baseUrl}/members/register`,
    "inLanguage": ["hi", "en", "hi-IN", "en-IN"],
    "isPartOf": {
      "@type": "WebSite",
      "name": "Rashtriya Hindu Vahini Sangathan",
      "url": baseUrl
    },
    "about": {
      "@type": "Organization",
      "name": "Rashtriya Hindu Vahini Sangathan",
      "alternateName": "RHVS",
      "description": "Organization dedicated to preserving, protecting and promoting Sanatan Dharma and Hindu culture"
    },
    "mainEntity": {
      "@type": "Service",
      "serviceType": "Membership Registration",
      "provider": {
        "@type": "Organization",
        "name": "Rashtriya Hindu Vahini Sangathan",
        "alternateName": "RHVS"
      },
      "areaServed": {
        "@type": "Country",
        "name": "India"
      },
      "availableLanguage": ["Hindi", "English"]
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Member Registration",
        "item": `${baseUrl}/members/register`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(registrationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}

