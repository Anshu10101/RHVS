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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative max-w-4xl max-h-[90vh] mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:text-orange-400 transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Image container */}
        <div className="relative rounded-2xl overflow-hidden bg-white shadow-2xl">
          <div className="relative h-[70vh] w-full">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 1024px) 90vw, 80vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Image info */}
          <div className="p-6 bg-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`${devanagari.className} text-2xl font-bold text-orange-900 mb-2`}>
                  {image.title}
                </h3>
                <p className="text-gray-600 mb-2">{image.description}</p>
                <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                  {image.category}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleFavorite(image.id)}
                  className="p-2 rounded-full hover:bg-orange-100 transition-colors"
                >
                  <Heart 
                    size={20} 
                    className={`transition-colors ${
                      favorites.includes(image.id) ? 'text-red-500 fill-red-500' : 'text-gray-600'
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleDownload(image.src, image.title)}
                  className="p-2 rounded-full hover:bg-orange-100 transition-colors"
                >
                  <Download size={20} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleShare(image)}
                  className="p-2 rounded-full hover:bg-orange-100 transition-colors"
                >
                  <Share2 size={20} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
