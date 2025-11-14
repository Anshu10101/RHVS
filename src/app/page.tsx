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

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <NationalExecutiveSection />
        <DepartmentsSection />
        <LatestPhotosSection />
        <LatestNewsEventsSection />
        <FeaturedProductsSection />
        <CoreValuesSection />
        <ActivitiesSection />
      </main>
      <Footer />
    </div>
  );
}