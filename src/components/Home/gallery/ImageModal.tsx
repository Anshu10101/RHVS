import Image from 'next/image';
import { X, Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Noto_Serif_Devanagari } from 'next/font/google';
import { useEffect, useState } from 'react';
import type { GalleryImage } from './types';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

interface ImageModalProps {
  image: GalleryImage | null;
  images: GalleryImage[];
  isOpen: boolean;
  onClose: () => void;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export default function ImageModal({ image, images, isOpen, onClose, favorites, onToggleFavorite, onNavigate }: ImageModalProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Keyboard navigation - hooks must be called before any conditional returns
  useEffect(() => {
    if (!isOpen || !image) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && images.length > 1 && onNavigate) {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && images.length > 1 && onNavigate) {
        onNavigate('next');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, image, images.length, onNavigate, onClose]);

  // Reset description expansion when image changes
  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [image?.id]);

  // Find current image index
  const currentIndex = image ? images.findIndex(img => img.id === image.id) : -1;
  // Always show navigation buttons if there are multiple images (wraps around)
  const hasPrev = images.length > 1;
  const hasNext = images.length > 1;

  // Check if description is long enough to need truncation
  const descriptionLines = image?.description ? image.description.split('\n').length : 0;
  const descriptionLength = image?.description?.length || 0;
  const needsTruncation = descriptionLines > 2 || descriptionLength > 150;

  if (!isOpen || !image) {
    return null;
  }

  const handlePrev = () => {
    if (images.length > 1 && onNavigate) {
      onNavigate('prev');
    }
  };

  const handleNext = () => {
    if (images.length > 1 && onNavigate) {
      onNavigate('next');
    }
  };

  const handleDownload = (imageSrc: string, imageTitle: string) => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `${imageTitle}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (image: GalleryImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title,
          text: image.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${image.title} - ${window.location.href}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="relative w-full h-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-white hover:text-orange-400 transition-colors z-20 bg-black/50 rounded-full hover:bg-black/70"
          aria-label="Close"
        >
          <X size={18} className="sm:w-6 sm:h-6" />
        </button>

        {/* Navigation buttons */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-white hover:text-orange-400 transition-colors z-20 bg-black/50 rounded-full hover:bg-black/70 backdrop-blur-sm"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}

        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-white hover:text-orange-400 transition-colors z-20 bg-black/50 rounded-full hover:bg-black/70 backdrop-blur-sm"
            aria-label="Next image"
          >
            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 bg-black/50 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Image container - full screen */}
        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-auto">
          <div className="relative inline-block max-w-full">
            {image.src.startsWith('/api/') ? (
              <img
                key={image.id}
                src={image.src}
                alt={image.alt}
                className="block transition-opacity duration-300"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 120px)',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <Image
                key={image.id}
                src={image.src}
                alt={image.alt}
                width={1920}
                height={1080}
                sizes="100vw"
                className="block transition-opacity duration-300"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 120px)',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain'
                }}
                priority
              />
            )}
          </div>
        </div>

         {/* Image info overlay - positioned over image */}
         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 sm:p-6 pb-6 sm:pb-7">
           <div className="max-w-4xl mx-auto">
             <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
               <div className="flex-1 text-white min-w-0">
                 <h3 className={`${devanagari.className} text-base sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 line-clamp-2`} style={{ paddingTop: '0.375rem', lineHeight: '1.5', overflow: 'visible' }}>
                   {image.title}
                 </h3>
                 {image.description && (
                   <div className="mb-2 sm:mb-3">
                     <p className={`text-gray-200 text-xs sm:text-sm md:text-base leading-relaxed ${
                       needsTruncation && !isDescriptionExpanded ? 'line-clamp-2 sm:line-clamp-3' : ''
                     }`}>
                       {image.description}
                     </p>
                     {needsTruncation && (
                       <button
                         onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                         className="mt-1 text-orange-400 hover:text-orange-300 text-xs sm:text-sm font-medium transition-colors"
                       >
                         {isDescriptionExpanded ? 'See less' : 'See more...'}
                       </button>
                     )}
                   </div>
                 )}
                 {image.tags && image.tags.length > 0 && (
                   <div className="mt-2 sm:mt-3 pb-1" style={{ maxHeight: '3rem', overflow: 'hidden' }}>
                     <div className="flex flex-wrap gap-1 sm:gap-1.5">
                       {image.tags.map((tag, index) => (
                         <span key={index} className="inline-block bg-orange-600/90 text-white px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium whitespace-nowrap">
                           {tag}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
              
              <div className="flex gap-1.5 sm:gap-2 ml-0 sm:ml-6 shrink-0">
                <button
                  onClick={() => handleDownload(image.src, image.title)}
                  className="p-2 sm:p-3 rounded-full hover:bg-white/20 transition-colors bg-black/30"
                  aria-label="Download"
                >
                  <Download size={16} className="sm:w-5 sm:h-5 text-white" />
                </button>
                <button
                  onClick={() => handleShare(image)}
                  className="p-2 sm:p-3 rounded-full hover:bg-white/20 transition-colors bg-black/30"
                  aria-label="Share"
                >
                  <Share2 size={16} className="sm:w-5 sm:h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
