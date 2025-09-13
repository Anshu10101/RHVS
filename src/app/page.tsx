import Navbar from '@/components/Home/Navbar';
import HeroSection from '@/components/Home/HeroSection';
import CoreValuesSection from '@/components/Home/CoreValuesSection';
import ActivitiesSection from '@/components/Home/ActivitiesSection';
import Footer from '@/components/Home/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <CoreValuesSection />
        <ActivitiesSection />
      </main>
      <Footer />
    </div>
  );
}