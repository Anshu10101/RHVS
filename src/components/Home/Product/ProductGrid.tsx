import ProductCard from './ProductCard';
import type { ProductGridProps } from './types';

export default function ProductGrid({ 
  products, 
  favorites, 
  onProductClick, 
  onToggleFavorite 
}: ProductGridProps) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4 sm:pb-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards',
                opacity: 0,
                transform: 'translateY(30px)'
              }}
            >
              <ProductCard
                product={product}
                onProductClick={onProductClick}
                onToggleFavorite={onToggleFavorite}
                isFavorite={favorites.includes(product.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
