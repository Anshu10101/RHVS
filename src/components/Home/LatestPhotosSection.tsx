"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Noto_Serif_Devanagari } from 'next/font/google';
import { useLanguage } from '@/contexts/LanguageContext';
import ImageModal from '@/components/Home/gallery/ImageModal';
import type { GalleryImage } from '@/components/Home/gallery/types';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

export default function LatestPhotosSection() {
  const { t } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Helper function to shuffle array randomly
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadPhotos = useCallback(async () => {
    let isMounted = true;
    try {
      // Fetch all photos and videos for randomization
      const res = await fetch(`/api/public/photos?random=true&_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      const data = await res.json();
      
      if (isMounted && data?.success) {
        const allImages = data.images || [];
        
        // Separate photos and videos
        const allPhotos = allImages.filter((img: GalleryImage) => !img.isVideo);
        const allVideos = allImages.filter((img: GalleryImage) => img.isVideo);
        
        // Shuffle both arrays randomly
        const shuffledPhotos = shuffleArray<GalleryImage>(allPhotos);
        const shuffledVideos = shuffleArray<GalleryImage>(allVideos);
        
        // Randomly select 8 photos and 5 videos
        const selectedPhotos = shuffledPhotos.slice(0, 8);
        const selectedVideos = shuffledVideos.slice(0, 5);
        
        // Combine and shuffle to mix photos and videos randomly
        const combined: GalleryImage[] = [...selectedPhotos, ...selectedVideos];
        const finalShuffled = shuffleArray<GalleryImage>(combined);
        
        setImages(finalShuffled);
      }
    } catch (e) {
      console.error("Failed to load latest photos", e);
    } finally {
      if (isMounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();

    // Reload when page becomes visible (user returns from admin panel or switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPhotos();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadPhotos]);

  // Load favorites from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gallery-favorites');
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          console.error('Error loading favorites:', e);
        }
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gallery-favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  const openModal = (image: GalleryImage) => {
    setSelectedImage(image);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedImage || images.length === 0) return;
    
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'prev') {
      // Wrap around: if at first image, go to last
      newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    } else {
      // Wrap around: if at last image, go to first
      newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    }

    setSelectedImage(images[newIndex]);
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id]
    );
  };

  if (!loading && images.length === 0) return null;

  return (
    <section className="py-16 bg-orange-50">
      <div className="container mx-auto px-4">
        <div className="mb-8 md:mb-12">
          <div className="relative mb-6">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-300" />
                <span className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-orange-600/80">
                  {t('photos.title')}
                </span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-300" />
              </div>
              <h2 className={`${devanagari.className} text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-gray-900 leading-tight`}>
                {t('photos.header')}
              </h2>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4 md:mb-0">
                {t('photos.description')}
              </p>
            </div>
            <Link
              href="/gallery"
              aria-label={t('photos.viewAll')}
              className="absolute top-0 right-0 hidden md:block text-sm font-semibold text-orange-700 hover:text-orange-800 hover:underline whitespace-nowrap"
            >
              {t('photos.viewAll')} →
            </Link>
            <div className="flex justify-center md:hidden mt-4">
              <Link
                href="/gallery"
                aria-label={t('photos.viewAll')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                {t('photos.viewAll')}
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4 md:gap-6">
          {(loading ? Array.from<Record<string, unknown> | undefined>({ length: 13 }).map(() => undefined) : images).map((img, i) => (
            <div 
              key={img?.id || i} 
              className="group relative break-inside-avoid mb-3 sm:mb-4 md:mb-6 overflow-hidden rounded-xl sm:rounded-2xl cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
              onClick={() => img && openModal(img)}
            >
              {loading ? (
                <div className="w-full h-48 sm:h-56 md:h-64 animate-pulse bg-orange-100 rounded-xl sm:rounded-2xl" />
              ) : img ? (
                <>
                  <div className="relative w-full">
                    <Image
                      src={img.src}
                      alt={img.alt || t('photos.photo')}
                      width={400}
                      height={400}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                      priority={i < 4}
                    />
                    {/* Minimal Play Button Overlay for Videos */}
                    {img.isVideo && img.youtubeVideoId && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-xl sm:rounded-2xl">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/90 backdrop-blur-sm bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl sm:rounded-2xl" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="text-white text-xs sm:text-sm font-semibold line-clamp-1">{img.title}</p>
                    <p className="text-white/80 text-[10px] sm:text-xs line-clamp-1">{img.category}</p>
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        image={selectedImage}
        images={images}
        isOpen={!!selectedImage}
        onClose={closeModal}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onNavigate={handleNavigate}
      />
    </section>
  );
}


