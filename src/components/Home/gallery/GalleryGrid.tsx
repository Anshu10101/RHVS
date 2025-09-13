import Image from 'next/image';
import { ZoomIn, Heart } from 'lucide-react';
import { Noto_Serif_Devanagari } from 'next/font/google';
import type { GalleryImage } from './types';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

interface GalleryGridProps {
  images: GalleryImage[];
  favorites: number[];
  onImageClick: (image: GalleryImage) => void;
  onToggleFavorite: (id: number) => void;
}

export default function GalleryGrid({ images, favorites, onImageClick, onToggleFavorite }: GalleryGridProps) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`group relative break-inside-avoid mb-6 cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${
                image.aspectRatio === 'tall' ? 'h-80 md:h-96' :
                image.aspectRatio === 'wide' ? 'h-64 md:h-72' :
                'h-72 md:h-80'
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards',
                opacity: 0,
                transform: 'translateY(30px)'
              }}
              onClick={() => onImageClick(image)}
            >
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 shadow-lg">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  priority={index < 6}
                  quality={85}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className={`${devanagari.className} text-lg font-semibold mb-1`}>
                    {image.title}
                  </h3>
                  <p className="text-sm text-orange-100 mb-2 line-clamp-2">
                    {image.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-orange-600/80 px-2 py-1 rounded-full">
                      {image.category}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(image.id);
                        }}
                        className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <Heart 
                          size={16} 
                          className={`transition-colors ${
                            favorites.includes(image.id) ? 'text-red-400 fill-red-400' : 'text-white'
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageClick(image);
                        }}
                        className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <ZoomIn size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
