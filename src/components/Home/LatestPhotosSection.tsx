"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { Noto_Serif_Devanagari } from 'next/font/google';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

type GalleryImage = {
  id: number;
  src: string;
  alt: string;
  title: string;
  description: string;
  category: string;
  aspectRatio: "tall" | "wide" | "square";
  date: string;
  tags: string[];
};

export default function LatestPhotosSection() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPhotos = useCallback(async () => {
    let isMounted = true;
    try {
      // Add cache-busting timestamp and no-store cache
      const res = await fetch(`/api/public/photos?limit=8&_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      const data = await res.json();
      if (isMounted && data?.success) setImages(data.images || []);
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
                  Latest from the Gallery
                </span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-300" />
              </div>
              <h2 className={`${devanagari.className} text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-gray-900 leading-tight`}>
                गैलरी की ताज़ा झलकियाँ
              </h2>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                हाल की गतिविधियों और आयोजनों से चुनी हुई तस्वीरें।
              </p>
            </div>
            <Link
              href="/gallery"
              aria-label="View all photos"
              className="absolute top-0 right-0 text-xs sm:text-sm font-semibold text-orange-700 hover:text-orange-800 hover:underline whitespace-nowrap"
            >
              <span className="hidden sm:inline">View All / सभी देखें →</span>
              <span className="sm:hidden">View All →</span>
            </Link>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {(loading ? Array.from<Record<string, unknown> | undefined>({ length: 8 }).map(() => undefined) : images).map((img, i) => (
            <div key={img?.id || i} className="group relative overflow-hidden rounded-2xl bg-orange-100/60 shadow-sm ring-1 ring-orange-100">
              {loading ? (
                <div className="aspect-[4/3] animate-pulse bg-orange-100" />
              ) : img ? (
                <>
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={img.src}
                      alt={img.alt || "Photo"}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority={i < 4}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-semibold line-clamp-1">{img.title}</p>
                    <p className="text-white/80 text-xs line-clamp-1">{img.category}</p>
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


