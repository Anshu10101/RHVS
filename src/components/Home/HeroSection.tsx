'use client';

import Image from 'next/image';
import { Noto_Serif_Devanagari } from 'next/font/google';
import { useEffect, useState } from 'react';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

interface HeroImage {
  id: number;
  image_path: string;
  alt_text: string;
  title?: string;
  description?: string;
  display_order: number;
}

interface HeroSettings {
  marquee_speed: number;
  image_display_duration: number;
  auto_play: boolean;
  show_indicators: boolean;
  transition_effect: string;
}

export default function HeroSection() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [heroSettings, setHeroSettings] = useState<HeroSettings>({
    marquee_speed: 30,
    image_display_duration: 8,
    auto_play: true,
    show_indicators: true,
    transition_effect: 'slide'
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageAspectRatios, setImageAspectRatios] = useState<{[key: number]: string}>({});

  useEffect(() => {
    fetchHeroImages();
    fetchHeroSettings();
  }, []);

  useEffect(() => {
    // Detect aspect ratios for all loaded images
    heroImages.forEach(image => {
      if (!imageAspectRatios[image.id]) {
        detectImageAspectRatio(image.image_path, image.id);
      }
    });
  }, [heroImages, imageAspectRatios]);

  useEffect(() => {
    if (heroImages.length > 1 && heroSettings.auto_play) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
      }, heroSettings.image_display_duration * 1000);
      return () => clearInterval(interval);
    }
  }, [heroImages.length, heroSettings.auto_play, heroSettings.image_display_duration]);

  const fetchHeroImages = async () => {
    try {
      const response = await fetch('/api/hero-images');
      if (response.ok) {
        const data = await response.json();
        setHeroImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching hero images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHeroSettings = async () => {
    try {
      const response = await fetch('/api/hero-images/settings');
      if (response.ok) {
        const data = await response.json();
        const fetched = data.settings || {};
        setHeroSettings(prev => ({
          ...prev,
          ...fetched,
          // Enforce a slower minimum duration on the client for now
          image_display_duration: Math.max(
            typeof fetched.image_display_duration === 'number' ? fetched.image_display_duration : prev.image_display_duration,
            8
          )
        }));
      }
    } catch (error) {
      console.error('Error fetching hero settings:', error);
    }
  };

  const detectImageAspectRatio = (imagePath: string, imageId: number) => {
    if (typeof window === 'undefined') return;
    
    const img = new window.Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let aspectClass = 'aspect-square';
      
      if (aspectRatio > 1.5) {
        aspectClass = 'wide-aspect aspect-video';
      } else if (aspectRatio < 0.7) {
        aspectClass = 'tall-aspect aspect-3-4';
      } else if (aspectRatio > 1.2) {
        aspectClass = 'aspect-video';
      } else if (aspectRatio > 0.8) {
        aspectClass = 'aspect-square';
      }
      
      setImageAspectRatios(prev => ({
        ...prev,
        [imageId]: aspectClass
      }));
    };
    img.src = imagePath;
  };

  const currentImage = heroImages[currentImageIndex] || {
    id: 0,
    image_path: '/hero-img.jpg',
    alt_text: 'Hero',
    title: 'राष्ट्रीय हिंदू वाहिनी संगठन',
    description: 'Dedicated to preserving, protecting and promoting Hindu dharma and culture'
  };

  return (
    <section className="relative overflow-hidden pt-8 md:pt-10 pb-16 md:pb-20 bg-gradient-to-b from-orange-50 to-white">
      {/* subtle ornamental aura */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(600px_300px_at_50%_-10%,rgba(253,186,116,0.22),transparent)]" />
      <div className="container mx-auto px-4 text-center relative">
        <h2 className="text-lg md:text-xl mb-3 md:mb-4 text-orange-700">॥ जय श्री राम ॥</h2>
        
        <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-3">
          <span aria-hidden="true" />
          <h1 className={`${devanagari.className} col-start-2 text-3xl md:text-6xl font-extrabold text-orange-900 tracking-tight text-center`}>
            राष्ट्रीय हिंदू वाहिनी संगठन
          </h1>
          <div className="flex items-center justify-start">
            <Image
              src="/ram.png"
              alt="Jai Shri Ram"
              width={160}
              height={160}
              className="w-16 h-16 md:w-28 md:h-28 lg:w-36 lg:h-36 object-contain"
              priority
            />
          </div>
        </div>

        {/* lotus divider */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-10 bg-orange-200" />
          <span className="text-2xl">🪷</span>
          <span className="h-px w-10 bg-orange-200" />
        </div>
        
        <p className="text-base md:text-lg text-orange-700/90 mb-10 max-w-3xl mx-auto">
          Dedicated to preserving, protecting and promoting Hindu dharma and culture
        </p>
        
         {/* Hero Image Display - full view, preserves aspect (no stretch) */}
         <div className="mx-auto my-10 flex justify-center relative">
            {/* side decorative gradients to enrich leftover space */}
            <div className="hero-side-gradient hero-side-left">
              <span className="hero-motif text-orange-600" aria-hidden="true">ॐ</span>
            </div>
            <div className="hero-side-gradient hero-side-right">
              <span className="hero-motif text-orange-600" aria-hidden="true">ॐ</span>
            </div>
            <div className={`relative w-full max-w-7xl h-[66vh] md:h-[77vh] lg:h-[83vh] overflow-hidden smart-image-container hero-image-frame ${imageAspectRatios[currentImage.id] || ''}`}>
              <div className="hero-border-strip hero-border-top" />
              <div className="hero-border-strip hero-border-bottom" />
              <div className="hero-image-content">
                {isLoading ? (
                  <div className="w-full h-full bg-orange-100 animate-pulse flex items-center justify-center">
                    <span className="text-orange-600">Loading...</span>
                  </div>
                ) : (
                  <Image
                    src={currentImage.image_path}
                    alt={currentImage.alt_text}
                    fill
                    sizes="100vw"
                    className="object-contain transition-all duration-500"
                    quality={95}
                    priority
                    style={{
                      objectPosition: 'center center'
                    }}
                  />
                )}
              </div>
            
            {/* Image indicators */}
            {heroImages.length > 1 && heroSettings.show_indicators && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'bg-white shadow-lg' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>


        {/* mantra marquee */}
        <div className="relative overflow-hidden full-bleed mt-6 py-2">
          <div className="whitespace-nowrap will-change-transform marquee-run">
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">ॐ सर्वे भवन्तु सुखिनः</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">ॐ नमः शिवाय</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">ॐ जय जगदीश हरे</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">जय श्री राम</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">हरे कृष्ण हरे राम</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">ॐ गं गणपतये नमः</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">ॐ ऐं ह्रीं क्लीं चामुण्डायै नमः</span>
            {/* duplicate for seamless loop */}
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">ॐ सर्वे भवन्तु सुखिनः</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">ॐ नमः शिवाय</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">ॐ जय जगदीश हरे</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">जय श्री राम</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">हरे कृष्ण हरे राम</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">ॐ गं गणपतये नमः</span>
            <span className="mx-4 md:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-sm md:text-base">ॐ ऐं ह्रीं क्लीं चामुण्डायै नमः</span>
          </div>
        </div>
      </div>

    </section>
  );
}