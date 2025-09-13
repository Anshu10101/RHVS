import { ShoppingBag, Star, Package } from 'lucide-react';
import { Noto_Serif_Devanagari } from 'next/font/google';
import type { ProductHeaderProps } from './types';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

export default function ProductHeader({ title, titleHindi, description, totalProducts }: ProductHeaderProps) {
  return (
    <section className="relative py-12 md:py-16 overflow-hidden bg-gradient-to-b from-orange-50/80 to-transparent backdrop-blur-sm">
      {/* Background decoration */}
      <div className="absolute inset-0 [background:radial-gradient(400px_200px_at_50%_-5%,rgba(253,186,116,0.08),transparent)]" />
      
      <div className="container mx-auto px-4 text-center relative">
        <div className="flex items-center justify-center gap-2 mb-3">
          <ShoppingBag size={20} className="text-orange-600" />
          <h2 className="text-sm md:text-base text-orange-600/80">॥ उत्पाद ॥</h2>
        </div>
        
        <h1 className={`${devanagari.className} text-2xl md:text-4xl font-bold mb-2 text-orange-800/90 tracking-tight`}>
          {titleHindi}
        </h1>
        
        <p className="text-sm md:text-base text-orange-600/70 mb-6 max-w-2xl mx-auto">
          {description}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-orange-700/80">
            <Package size={16} />
            <span>{totalProducts} Products</span>
          </div>
          <div className="flex items-center gap-2 text-orange-700/80">
            <Star size={16} />
            <span>Premium Quality</span>
          </div>
        </div>
      </div>
    </section>
  );
}
