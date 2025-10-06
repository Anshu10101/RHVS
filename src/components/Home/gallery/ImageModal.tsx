import Image from 'next/image';
import { X, Download, Share2, Heart } from 'lucide-react';
import { Noto_Serif_Devanagari } from 'next/font/google';
import type { GalleryImage } from './types';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

interface ImageModalProps {
  image: GalleryImage | null;
  isOpen: boolean;
  onClose: () => void;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
}

export default function ImageModal({ image, isOpen, onClose, favorites, onToggleFavorite }: ImageModalProps) {
  if (!isOpen || !image) return null;

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
          className="absolute top-4 right-4 p-2 text-white hover:text-orange-400 transition-colors z-20 bg-black/50 rounded-full"
        >
          <X size={24} />
        </button>

        {/* Image container - full screen */}
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <Image
              src={image.src}
              alt={image.alt}
              width={0}
              height={0}
              sizes="100vw"
              className="w-auto h-auto max-w-full max-h-full object-contain"
              priority
            />
          </div>
        </div>

        {/* Image info overlay - positioned over image */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1 text-white">
                <h3 className={`${devanagari.className} text-2xl font-bold mb-2`}>
                  {image.title}
                </h3>
                {image.description && (
                  <p className="text-gray-200 text-base mb-3 leading-relaxed">{image.description}</p>
                )}
                {image.tags && image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {image.tags.map((tag, index) => (
                      <span key={index} className="inline-block bg-orange-600/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 ml-6">
                <button
                  onClick={() => onToggleFavorite(image.id)}
                  className="p-3 rounded-full hover:bg-white/20 transition-colors bg-black/30"
                >
                  <Heart 
                    size={20} 
                    className={`transition-colors ${
                      favorites.includes(image.id) ? 'text-red-400 fill-red-400' : 'text-white'
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleDownload(image.src, image.title)}
                  className="p-3 rounded-full hover:bg-white/20 transition-colors bg-black/30"
                >
                  <Download size={20} className="text-white" />
                </button>
                <button
                  onClick={() => handleShare(image)}
                  className="p-3 rounded-full hover:bg-white/20 transition-colors bg-black/30"
                >
                  <Share2 size={20} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
