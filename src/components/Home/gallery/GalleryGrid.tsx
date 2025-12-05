import Image from 'next/image';
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
  onResetFilters?: () => void;
}

export default function GalleryGrid({ images, favorites, onImageClick, onToggleFavorite, onResetFilters }: GalleryGridProps) {
  if (images.length === 0) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <div className="mb-6 text-orange-200">
              <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No Photos Available</h3>
            <p className="text-gray-600 text-lg mb-2">We're currently updating our photo gallery.</p>
            <p className="text-gray-500 mb-6">Please check back soon for new photos from our events and activities.</p>
            {onResetFilters && (
              <button
                onClick={onResetFilters}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4 md:gap-6">
          {images.map((image, index) => (
            <div
              key={`${image.id}-${index}-${image.isVideo ? 'video' : 'photo'}`}
              className="group relative break-inside-avoid mb-3 sm:mb-4 md:mb-6 cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
              style={{
                animationName: 'fadeInUp',
                animationDuration: '0.6s',
                animationTimingFunction: 'ease-out',
                animationFillMode: 'forwards',
                animationDelay: `${index * 100}ms`,
                opacity: 0,
                transform: 'translateY(30px)'
              }}
              onClick={() => onImageClick(image)}
            >
              <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl">
                {image.isVideo && image.youtubeVideoId ? (
                  <>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={400}
                      height={400}
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                      priority={index < 6}
                      quality={85}
                      unoptimized
                      onError={(e) => {
                        // Fallback to different thumbnail quality if hqdefault fails
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('hqdefault.jpg')) {
                          target.src = `https://img.youtube.com/vi/${image.youtubeVideoId}/mqdefault.jpg`;
                        } else if (target.src.includes('mqdefault.jpg')) {
                          target.src = `https://img.youtube.com/vi/${image.youtubeVideoId}/sddefault.jpg`;
                        } else if (target.src.includes('sddefault.jpg')) {
                          target.src = `https://img.youtube.com/vi/${image.youtubeVideoId}/default.jpg`;
                        }
                      }}
                    />
                    {/* Minimal Play Button Overlay for Videos */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-xl sm:rounded-2xl">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/90 backdrop-blur-sm bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={400}
                    height={400}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                    priority={index < 6}
                    quality={85}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl sm:rounded-2xl" />
                
                {/* Content - Only show title */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                  <h3 className={`${devanagari.className} text-sm sm:text-lg font-semibold line-clamp-1`}>
                    {image.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
