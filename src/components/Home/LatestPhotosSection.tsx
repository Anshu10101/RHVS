"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/public/photos?limit=8`, { cache: "no-store" });
        const data = await res.json();
        if (isMounted && data?.success) setImages(data.images || []);
      } catch (e) {
        console.error("Failed to load latest photos", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && images.length === 0) return null;

  return (
    <section className="py-16 bg-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h3 className="uppercase font-bold mb-2 text-orange-700">Latest from the Gallery</h3>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-orange-800">गैलरी की ताज़ा झलकियाँ</h2>
          <p className="max-w-2xl mx-auto text-gray-700">
            हाल की गतिविधियों और आयोजनों से चुनी हुई तस्वीरें।
          </p>
          <div className="mt-5">
            <Link
              href="/gallery"
              aria-label="View all photos"
              className="inline-flex items-center rounded-full bg-orange-600 text-white px-5 py-2 text-sm font-medium hover:bg-orange-700 transition-colors shadow"
            >
              View all
            </Link>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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


