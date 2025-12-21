'use client';

import Image from 'next/image';
import { useEffect, useState, useRef, useCallback, forwardRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface CustomMarquee {
  id: number;
  text: string;
  text_color: string;
  background_color: string;
  speed: number;
  is_active: boolean;
}

function WelcomeMarqueeContent({ ariaHidden }: { ariaHidden?: boolean }) {
  const { t } = useLanguage();
  return (
    <>
      <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-bold tracking-wide text-sm sm:text-base md:text-lg">✨ {t('hero.welcome1')} ✨</span>
      <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-bold tracking-wide text-sm sm:text-base md:text-lg">🙏 {t('hero.welcome2')} 🙏</span>
    </>
  );
}

export default function HeroSection() {
  const { t } = useLanguage();
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [heroSettings, setHeroSettings] = useState<HeroSettings>({
    marquee_speed: 30,
    image_display_duration: 8,
    auto_play: true,
    show_indicators: true,
    transition_effect: 'slide'
  });
  const [customMarquee, setCustomMarquee] = useState<CustomMarquee | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageAspectRatios, setImageAspectRatios] = useState<{[key: number]: string}>({});
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  // Refs for marquee seamless scrolling
  const welcomeMarqueeRef = useRef<HTMLDivElement | null>(null);
  const welcomeTrackRef = useRef<HTMLDivElement | null>(null);
  const welcomeWidthRef = useRef<number>(0);
  const welcomeRafRef = useRef<number | null>(null);
  
  const shlokasMarqueeRef = useRef<HTMLDivElement | null>(null);
  const shlokasTrackRef = useRef<HTMLDivElement | null>(null);
  const shlokasWidthRef = useRef<number>(0);
  const shlokasRafRef = useRef<number | null>(null);


  // Measure welcome marquee width
  useEffect(() => {
    const el = welcomeTrackRef.current;
    if (!el) return;
    const update = () => {
      welcomeWidthRef.current = el.scrollWidth || el.offsetWidth || 0;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [customMarquee]); // Remeasure when marquee changes

  // Measure shlokas marquee width
  useEffect(() => {
    const el = shlokasTrackRef.current;
    if (!el) return;
    const update = () => {
      shlokasWidthRef.current = el.scrollWidth || el.offsetWidth || 0;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Welcome marquee RAF loop
  useEffect(() => {
    const node = welcomeMarqueeRef.current;
    if (!node) return;
    
    // Cancel any existing animation
    if (welcomeRafRef.current) {
      cancelAnimationFrame(welcomeRafRef.current);
      welcomeRafRef.current = null;
    }
    
    // Reset scroll position when marquee changes
    node.scrollLeft = 0;
    
    // Wait a bit for DOM to update and width to be measured
    const timeoutId = setTimeout(() => {
      const node = welcomeMarqueeRef.current;
      if (!node) return;
      
      // Remeasure width after DOM update
      // Measure one track width including gap for seamless loop
      const track = welcomeTrackRef.current;
      const container = welcomeMarqueeRef.current;
      if (track && container) {
        // Measure the offset of the second track to get exact wrap point
        const tracks = container.children;
        if (tracks.length >= 2) {
          const secondTrack = tracks[1] as HTMLElement;
          welcomeWidthRef.current = secondTrack.offsetLeft || (track.scrollWidth || track.offsetWidth || 0);
        } else {
          // Fallback: measure first track + estimated gap
          const trackWidth = track.scrollWidth || track.offsetWidth || 0;
          const gapStyle = window.getComputedStyle(container).gap;
          const gap = gapStyle ? parseFloat(gapStyle) || 12 : 12;
          welcomeWidthRef.current = trackWidth + gap;
        }
      }
      
      let lastTs = performance.now();

      const step = (ts: number) => {
        const currentNode = welcomeMarqueeRef.current;
        if (!currentNode) {
          // Ensure RAF continues even if node is temporarily unavailable
          welcomeRafRef.current = requestAnimationFrame(step);
          return;
        }
        
        try {
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          // Use custom marquee speed if available, otherwise use default
          const speedPxPerSec = customMarquee 
            ? customMarquee.speed 
            : (isMobile ? 50 : 40);
          
          const dt = Math.max(0, ts - lastTs) / 1000;
          lastTs = ts;
          
          const firstWidth = welcomeWidthRef.current || 0;
          if (firstWidth > 0) {
            currentNode.scrollLeft += speedPxPerSec * dt;
            // Wrap when we've scrolled past one track width
            // Use while loop to ensure proper wrapping even if scrollLeft is much larger
            // This creates seamless infinite loop
            while (currentNode.scrollLeft >= firstWidth) {
              currentNode.scrollLeft -= firstWidth;
            }
          } else {
            // If width not calculated yet, remeasure
            const track = welcomeTrackRef.current;
            const container = welcomeMarqueeRef.current;
            if (track && container) {
              const tracks = container.children;
              if (tracks.length >= 2) {
                const secondTrack = tracks[1] as HTMLElement;
                welcomeWidthRef.current = secondTrack.offsetLeft || (track.scrollWidth || track.offsetWidth || 0);
              } else {
                const trackWidth = track.scrollWidth || track.offsetWidth || 0;
                const gapStyle = window.getComputedStyle(container).gap;
                const gap = gapStyle ? parseFloat(gapStyle) || 12 : 12;
                welcomeWidthRef.current = trackWidth + gap;
              }
            }
          }
        } catch (error) {
          // Log error but continue animation
          console.error('Marquee animation error:', error);
        }
        
        // Always continue the animation loop - ensure RAF is always requested
        welcomeRafRef.current = requestAnimationFrame(step);
      };

      welcomeRafRef.current = requestAnimationFrame(step);
    }, 150);
    
    return () => {
      if (welcomeRafRef.current) {
        cancelAnimationFrame(welcomeRafRef.current);
        welcomeRafRef.current = null;
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [customMarquee]);

  // Shlokas marquee RAF loop
  useEffect(() => {
    const node = shlokasMarqueeRef.current;
    if (!node) return;
    
    let lastTs = performance.now();

    const step = (ts: number) => {
      if (!node) return;
      
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const speedPxPerSec = isMobile ? 50 : 40; // Slower on desktop
      
      const dt = Math.max(0, ts - lastTs) / 1000;
      lastTs = ts;
      
      const firstWidth = shlokasWidthRef.current || 0;
      if (firstWidth > 0) {
        node.scrollLeft += speedPxPerSec * dt;
        while (node.scrollLeft >= firstWidth) {
          node.scrollLeft -= firstWidth;
        }
      }
      shlokasRafRef.current = requestAnimationFrame(step);
    };

    shlokasRafRef.current = requestAnimationFrame(step);
    
    return () => {
      if (shlokasRafRef.current) cancelAnimationFrame(shlokasRafRef.current);
      shlokasRafRef.current = null;
    };
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

  const fetchHeroImages = useCallback(async () => {
    try {
      const response = await fetch(`/api/hero-images?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out images with invalid paths (legacy /uploads/ paths that don't exist)
        const validImages = (data.images || []).filter((img: HeroImage) => {
          if (!img.image_path) return false;
          // Exclude legacy /uploads/ paths that may not exist
          if (img.image_path.startsWith('/uploads/')) return false;
          // Keep images that use API routes or external URLs
          // Only allow HTTPS or relative paths (no HTTP to prevent mixed content)
          return img.image_path.startsWith('/api/') || 
                 img.image_path.startsWith('https://');
        });
        setHeroImages(validImages);
      }
    } catch (error) {
      console.error('Error fetching hero images:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHeroSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/hero-images/settings?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
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
  }, []);

  const fetchCustomMarquee = useCallback(async () => {
    try {
      // Get district/state from URL or localStorage if available
      if (typeof window === 'undefined') return;
      
      const urlParams = new URLSearchParams(window.location.search);
      let district = urlParams.get('district') || localStorage.getItem('selectedDistrict');
      let state = urlParams.get('state') || localStorage.getItem('selectedState');
      
      // Always try to get names from localStorage first (these are the actual names)
      const districtName = localStorage.getItem('district_name');
      const stateName = localStorage.getItem('state_name');
      
      // If we have names in localStorage, use those (they're the actual district/state names)
      if (districtName && stateName) {
        district = districtName;
        state = stateName;
        console.log('📍 Using district/state from localStorage (names):', { district, state });
      } else if (district && state && !isNaN(Number(district)) && !isNaN(Number(state))) {
        // These are IDs, need to convert to names
        console.log('🔄 Converting IDs to names:', { district, state });
        try {
          const [stateRes, districtRes] = await Promise.all([
            fetch('/api/states'),
            fetch(`/api/districts?stateId=${state}`)
          ]);
          
          if (stateRes.ok && districtRes.ok) {
            const stateData = await stateRes.json();
            const districtData = await districtRes.json();
            
            const stateObj = stateData.data?.find((s: { id: number }) => String(s.id) === state);
            const districtObj = districtData.data?.find((d: { id: string | number }) => String(d.id) === district);
            
            if (stateObj && districtObj) {
              state = stateObj.name;
              district = districtObj.name;
              // Store the names for future use
              if (district) localStorage.setItem('district_name', district);
              if (state) localStorage.setItem('state_name', state);
              console.log('✅ Converted IDs to names:', { district, state });
            } else {
              console.warn('⚠️ Could not convert IDs to names, using IDs as-is');
            }
          }
        } catch (e) {
          console.error('❌ Error converting IDs to names:', e);
        }
      }
      
      const url = district && state 
        ? `/api/marquee?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`
        : '/api/marquee';
      
      console.log('🌐 Fetching marquee with:', { district, state, url });
      
      const response = await fetch(`${url}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Marquee fetch response:', { 
          success: data.success, 
          hasData: !!data.data,
          is_global: data.data?.is_global,
          district: data.data?.district,
          state: data.data?.state
        });
        if (data.success && data.data) {
          setCustomMarquee(data.data);
        } else {
          setCustomMarquee(null);
        }
      } else {
        console.error('❌ Marquee fetch failed:', response.status, response.statusText);
        setCustomMarquee(null);
      }
    } catch (error) {
      console.error('Error fetching custom marquee:', error);
      setCustomMarquee(null);
    }
  }, []);

  // Load hero images and settings on mount and when page becomes visible
  useEffect(() => {
    fetchHeroImages();
    fetchHeroSettings();
    fetchCustomMarquee();

    // Reload when page becomes visible (user returns from admin panel or switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchHeroImages();
        fetchHeroSettings();
        fetchCustomMarquee();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchHeroImages, fetchHeroSettings, fetchCustomMarquee]);

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
    <section className="relative overflow-hidden pt-0 pb-16 md:pb-20 bg-gradient-to-b from-orange-50 to-white">
      {/* subtle ornamental aura */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(600px_300px_at_50%_-10%,rgba(253,186,116,0.22),transparent)]" />
      <div className="container mx-auto px-4 text-center relative">
         {/* Hero Image Display - full view, preserves aspect (no stretch) - moved to top */}
         <div className="mx-auto my-0 flex justify-center relative">
            {/* side decorative gradients to enrich leftover space */}
            <div className="hero-side-gradient hero-side-left">
              <span className="hero-motif text-orange-600" aria-hidden="true">ॐ</span>
            </div>
            <div className="hero-side-gradient hero-side-right">
              <span className="hero-motif text-orange-600" aria-hidden="true">ॐ</span>
            </div>
            <div className={`relative w-full max-w-6xl sm:max-w-7xl h-[52vh] sm:h-[58vh] md:h-[72vh] lg:h-[82vh] min-h-[280px] sm:min-h-[340px] overflow-hidden rounded-3xl smart-image-container hero-image-frame ${imageAspectRatios[currentImage.id] || ''}`}>
              <div className="hero-border-strip hero-border-top" />
              <div className="hero-border-strip hero-border-bottom" />
              <div className="hero-image-content">
                {isLoading ? (
                  <div className="w-full h-full bg-orange-100 animate-pulse flex items-center justify-center">
                    <span className="text-orange-600">Loading...</span>
                  </div>
                ) : imageErrors.has(currentImage.id) ? (
                  <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600">Image unavailable</span>
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
                    onError={() => {
                      setImageErrors(prev => new Set(prev).add(currentImage.id));
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


        {/* Custom Marquee or Default Welcome marquee */}
        {customMarquee ? (
          <div 
            className="relative overflow-hidden full-bleed mt-2 py-2 sm:py-3"
            style={{ backgroundColor: customMarquee.background_color }}
          >
            <div
              ref={welcomeMarqueeRef}
              className="overflow-x-scroll flex gap-3 sm:gap-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
              style={{ msOverflowStyle: 'none' as unknown as undefined }}
            >
              {/* Multiple tracks for seamless infinite loop */}
              <div ref={welcomeTrackRef} className="flex gap-3 sm:gap-4 whitespace-nowrap">
                <span 
                  className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block font-bold tracking-wide text-sm sm:text-base md:text-lg"
                  style={{ color: customMarquee.text_color }}
                >
                  {customMarquee.text}
                </span>
              </div>
              <div aria-hidden className="flex gap-3 sm:gap-4 whitespace-nowrap">
                <span 
                  className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block font-bold tracking-wide text-sm sm:text-base md:text-lg"
                  style={{ color: customMarquee.text_color }}
                >
                  {customMarquee.text}
                </span>
              </div>
              <div aria-hidden className="flex gap-3 sm:gap-4 whitespace-nowrap">
                <span 
                  className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block font-bold tracking-wide text-sm sm:text-base md:text-lg"
                  style={{ color: customMarquee.text_color }}
                >
                  {customMarquee.text}
                </span>
              </div>
            </div>
          </div>
        ) : (
        <div className="relative overflow-hidden full-bleed mt-2 py-2 sm:py-3 bg-gradient-to-r from-orange-100 to-orange-50">
          <div
            ref={welcomeMarqueeRef}
            className="overflow-x-scroll flex gap-3 sm:gap-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            style={{ msOverflowStyle: 'none' as unknown as undefined }}
            onScroll={(e) => {
              const node = e.currentTarget;
              const firstWidth = welcomeWidthRef.current || 0;
              if (firstWidth > 0 && node.scrollLeft >= firstWidth) {
                node.scrollLeft = node.scrollLeft - firstWidth;
              }
            }}
          >
            {/* Track A */}
            <div ref={welcomeTrackRef} className="flex gap-3 sm:gap-4 whitespace-nowrap">
              <WelcomeMarqueeContent />
            </div>
            {/* Track B (duplicate for seamless loop) */}
            <div aria-hidden className="flex gap-3 sm:gap-4 whitespace-nowrap">
              <WelcomeMarqueeContent ariaHidden />
            </div>
          </div>
        </div>
        )}

        {/* mantra marquee */}
        <div className="relative overflow-hidden full-bleed mt-1 sm:mt-2 py-1.5 sm:py-2">
          <div
            ref={shlokasMarqueeRef}
            className="overflow-x-scroll flex gap-3 sm:gap-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            style={{ msOverflowStyle: 'none' as unknown as undefined }}
            onScroll={(e) => {
              const node = e.currentTarget;
              const firstWidth = shlokasWidthRef.current || 0;
              if (firstWidth > 0 && node.scrollLeft >= firstWidth) {
                node.scrollLeft = node.scrollLeft - firstWidth;
              }
            }}
          >
            {/* Track A */}
            <div ref={shlokasTrackRef} className="flex gap-3 sm:gap-4 whitespace-nowrap">
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">ॐ सर्वे भवन्तु सुखिनः</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">ॐ नमः शिवाय</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">ॐ जय जगदीश हरे</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">जय श्री राम</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">हरे कृष्ण हरे राम</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">ॐ गं गणपतये नमः</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">ॐ ऐं ह्रीं क्लीं चामुण्डायै नमः</span>
            </div>
            {/* Track B (duplicate for seamless loop) */}
            <div aria-hidden className="flex gap-3 sm:gap-4 whitespace-nowrap">
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">ॐ सर्वे भवन्तु सुखिनः</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">ॐ नमः शिवाय</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">ॐ जय जगदीश हरे</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">जय श्री राम</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">हरे कृष्ण हरे राम</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">ॐ गं गणपतये नमः</span>
              <span className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 inline-block text-orange-900 font-semibold tracking-wide text-xs sm:text-sm md:text-base">ॐ ऐं ह्रीं क्लीं चामुण्डायै नमः</span>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}