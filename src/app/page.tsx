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

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rashtriyahinduvahinisangathan.in';
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Rashtriya Hindu Vahini Sangathan",
    "alternateName": "RHVS",
    "url": baseUrl,
    "logo": `${baseUrl}/rhvs_logo.png`,
    "description": "Official website of Rashtriya Hindu Vahini Sangathan (RHVS) dedicated to serving and uniting the Hindu community. Join us in preserving Sanatan Dharma and Hindu culture.",
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
    "name": "Rashtriya Hindu Vahini Sangathan",
    "url": baseUrl,
    "description": "Official website of Rashtriya Hindu Vahini Sangathan (RHVS)",
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
        </main>
        <Footer />
      </div>
    </>
  );
}