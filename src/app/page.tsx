import Navbar from '@/components/Home/Navbar';
import HeroSection from '@/components/Home/HeroSection';
import NationalExecutiveSection from '@/components/Home/NationalExecutiveSection';
import DepartmentsSection from '@/components/Home/DepartmentsSection';
import LatestPhotosSection from '@/components/Home/LatestPhotosSection';
import LatestNewsEventsSection from '@/components/Home/LatestNewsEventsSection';
import FeaturedProductsSection from '@/components/Home/FeaturedProductsSection';
import CoreValuesSection from '@/components/Home/CoreValuesSection';
import ActivitiesSection from '@/components/Home/ActivitiesSection';
import Footer from '@/components/Home/Footer';
import LatestNewsSection from '@/components/Home/LatestNewsSection';
import LatestEventsSection from '@/components/Home/LatestEventsSection';
import { ContactFormSection } from '@/components/Home/ContactFormSection';
import FloatingJoinButton from '@/components/Home/FloatingJoinButton';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
  // Square logo for Google search results (must be 1:1 aspect ratio)
  const squareLogoUrl = `${baseUrl}/icons/icon-512x512.png`;
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Rashtriya Hindu Vahini Sangathan",
    "alternateName": [
      "RHVS",
      "rhvs",
      "Rashtriya Hindu Vahini Sangathan",
      "RHVS India",
      "RHVS Organization",
      "राष्ट्रीय हिंदू वाहिनी संगठन",
      "आरएचवीएस"
    ],
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": squareLogoUrl,
      "width": 512,
      "height": 512
    },
    "description": "RHVS (Rashtriya Hindu Vahini Sangathan) - Official website dedicated to serving and uniting the Hindu community. Join us in preserving Sanatan Dharma and Hindu culture.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN",
      "addressLocality": "Datia",
      "addressRegion": "Madhya Pradesh"
    },
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": ["Hindi", "English"]
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "RHVS - Rashtriya Hindu Vahini Sangathan",
    "alternateName": [
      "RHVS",
      "rhvs",
      "Rashtriya Hindu Vahini Sangathan",
      "RHVS Official Website"
    ],
    "url": baseUrl,
    "description": "RHVS (Rashtriya Hindu Vahini Sangathan) - Official website dedicated to serving and uniting the Hindu community.",
    "publisher": {
      "@type": "Organization",
      "name": "Rashtriya Hindu Vahini Sangathan"
    },
    "inLanguage": ["hi", "en"]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <HeroSection />
          <NationalExecutiveSection />
          <DepartmentsSection />
          <LatestPhotosSection />
          {/* Dedicated sections */}
          <LatestNewsSection />
          <LatestEventsSection />
          {/* Keep the older combined section for now (optional). Comment out if not needed */}
          {/* <LatestNewsEventsSection /> */}
          <FeaturedProductsSection />
          <CoreValuesSection />
          <ActivitiesSection />
          <ContactFormSection />
        </main>
        <Footer />
        <FloatingJoinButton />
      </div>
    </>
  );
}