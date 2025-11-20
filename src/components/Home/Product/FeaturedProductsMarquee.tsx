"use client";

import { useRef } from 'react';
import Image from 'next/image';
import { Star, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from './types';

interface FeaturedProductsMarqueeProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function FeaturedProductsMarquee({ products, onProductClick }: FeaturedProductsMarqueeProps) {
  const featuredProducts = products.filter(p => p.isFeatured);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  if (featuredProducts.length === 0) return null;

  // Quadruple products for ultra-smooth seamless infinite loop
  const duplicatedProducts = [
    ...featuredProducts, 
    ...featuredProducts, 
    ...featuredProducts,
    ...featuredProducts
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 350; // Card width + gap
      
      if (direction === 'right') {
        container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      } else {
        container.scrollBy({
          left: -scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <div className="bg-orange-50 border-t border-orange-200 py-6 pb-8 overflow-visible relative">
      {/* Navigation Buttons */}
      <button
        onClick={() => scroll('left')}
        className="hidden sm:inline-flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/60 hover:bg-white/90 text-gray-600 hover:text-orange-600 rounded-full p-2 sm:p-2.5 shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm cursor-pointer"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5 sm:h-5 sm:w-5" />
      </button>

      <button
        onClick={() => scroll('right')}
        className="hidden sm:inline-flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/60 hover:bg-white/90 text-gray-600 hover:text-orange-600 rounded-full p-2 sm:p-2.5 shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm cursor-pointer"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5 sm:h-5 sm:w-5" />
      </button>

      {/* Marquee Container */}
      <div className="marquee-wrapper" ref={scrollContainerRef}>
        <div className="marquee-content">
          {duplicatedProducts.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              onClick={() => onProductClick(product)}
              className="marquee-card group"
            >
              {/* Featured Badge */}
              <div className="absolute top-2 left-2 z-10 bg-orange-600/90 backdrop-blur-[1px] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <Star className="h-2.5 w-2.5 fill-white" />
                Featured
              </div>

              {/* Discount Badge */}
              {product.discount && (
                <div className="absolute top-2 right-2 z-10 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <Tag className="h-2.5 w-2.5" />
                  {product.discount}% OFF
                </div>
              )}

              {/* Product Image */}
              <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden rounded-t-xl bg-white">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500 p-2 sm:p-3 bg-white"
                  sizes="(max-width: 640px) 180px, (max-width: 768px) 240px, 320px"
                />
              </div>

              {/* Product Info */}
              <div className="p-2 sm:p-3 pb-2.5 sm:pb-3 bg-white rounded-b-xl">
                <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-0.5 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-gray-500 mb-1.5 sm:mb-2 line-clamp-1">{product.nameHindi}</p>
                
                {/* Price Section */}
                <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                  <span className="text-base sm:text-lg md:text-xl font-bold text-orange-600">₹{product.price}</span>
                  {product.originalPrice && (
                    <>
                      <span className="text-[10px] sm:text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                      {product.discount && (
                        <span className="text-[9px] sm:text-[10px] bg-green-100 text-green-700 px-1 sm:px-1.5 py-0.5 rounded font-semibold">
                          {product.discount}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center">
                  <span className={`text-[9px] sm:text-[10px] font-medium px-1 sm:px-1.5 py-0.5 rounded ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee-wrapper {
          width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          padding: 0 3.5rem;
          padding-bottom: 0.5rem;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .marquee-wrapper::-webkit-scrollbar {
          display: none;
        }

        .marquee-content {
          display: flex;
          gap: 1.5rem;
          animation: marqueeScroll 16s linear infinite;
          will-change: transform;
        }

        @media (max-width: 640px) {
          .marquee-content {
            animation: marqueeScroll 8s linear infinite;
          }
        }

        .marquee-wrapper:hover .marquee-content {
          animation-play-state: paused;
        }

        .marquee-card {
          flex-shrink: 0;
          width: 320px;
          cursor: pointer;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          border: 2px solid transparent;
        }

        .marquee-card * {
          cursor: pointer;
        }

        .marquee-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: rgba(249, 115, 22, 0.3);
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes marqueeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-25%);
          }
        }

        @media (max-width: 1024px) {
          .marquee-wrapper {
            padding: 0 3rem;
          }

          .marquee-content {
            gap: 1.25rem;
            animation: marqueeScroll 16s linear infinite;
          }

          .marquee-card {
            width: 300px;
          }
        }

        @media (max-width: 768px) {
          .marquee-wrapper {
            padding: 0 2.5rem;
          }

          .marquee-content {
            animation: marqueeScroll 10s linear infinite;
            gap: 1rem;
          }

          .marquee-card {
            width: 260px;
          }
        }

        @media (max-width: 640px) {
          .marquee-wrapper {
            padding: 0 1.5rem;
          }

          .marquee-content {
            animation: marqueeScroll 8s linear infinite;
            gap: 0.75rem;
          }

          .marquee-card {
            width: 200px;
          }
        }

        @media (max-width: 480px) {
          .marquee-wrapper {
            padding: 0 1rem;
          }

          .marquee-card {
            width: 180px;
          }

          .marquee-content {
            gap: 0.65rem;
            animation: marqueeScroll 7s linear infinite;
          }
        }
      `}</style>
    </div>
  );
}

