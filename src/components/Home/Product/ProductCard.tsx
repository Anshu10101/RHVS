import Image from 'next/image';
import { ShoppingCart, Tag } from 'lucide-react';
import { Noto_Serif_Devanagari } from 'next/font/google';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProductCardProps, Product } from './types';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

export default function ProductCard({ 
  product, 
  onProductClick, 
  onToggleFavorite, 
  isFavorite 
}: ProductCardProps) {
  const { addToCart } = useCart();
  const discountPercentage = product.discount ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;

  return (
    <div
      className="group relative bg-white border border-gray-100 hover:border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col"
      onClick={() => onProductClick(product)}
    >
      {/* Product Image - Responsive height */}
      <div className="relative h-48 sm:h-64 md:h-72 overflow-hidden bg-gray-50">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-contain transition-transform duration-500 group-hover:scale-105"
          priority={product.isFeatured}
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {product.isNew && (
            <Badge className="bg-green-500 hover:bg-green-600 text-xs">
              NEW
            </Badge>
          )}
          {product.discount && (
            <Badge className="bg-red-500 hover:bg-red-600 text-xs">
              {discountPercentage}% OFF
            </Badge>
          )}
        </div>

        {/* Wishlist button removed on /products page */}
      </div>

      {/* Product Info - Minimal and clean */}
      <div className="p-3 sm:p-4 pb-3 sm:pb-4 md:pb-5 flex flex-col flex-1">
        {/* Brand/Category */}
        <div className="mb-1.5 sm:mb-2">
          <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-50 text-orange-700 rounded-full text-[10px] sm:text-xs font-medium">
            <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="uppercase tracking-wide truncate max-w-[100px] sm:max-w-none">{product.category}</span>
          </div>
        </div>

        {/* Product Name + Short Description (from admin) */}
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-600 mb-2 line-clamp-2 min-h-[2.5rem] sm:min-h-0">
          {product.description || product.nameHindi}
        </p>

        {/* Price */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <span className="text-sm sm:text-base font-semibold text-gray-900">
            ₹{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-[10px] sm:text-xs text-gray-500 line-through">
              ₹{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <div className="mt-auto">
          <Button
            onClick={async (e) => {
              e.stopPropagation();
              const productWithDetails = product as Product & { seller_name?: string; seller_phone?: string; seller_whatsapp?: string; seller_email?: string; detailId?: string };
              const hasSeller = !!productWithDetails.seller_name || !!productWithDetails.seller_phone || !!productWithDetails.seller_whatsapp || !!productWithDetails.seller_email;
              const detailId = productWithDetails.detailId;
              if (detailId && !hasSeller) {
                try {
                  const res = await fetch(`/api/products/${encodeURIComponent(detailId)}`, { cache: 'no-store' });
                  if (res.ok) {
                    const data = await res.json();
                    const dp = data?.product || {};
                    const enriched = {
                      ...product,
                      seller_name: dp.seller_name,
                      seller_phone: dp.seller_phone,
                      seller_whatsapp: dp.seller_whatsapp,
                      seller_email: dp.seller_email,
                      seller_business_name: dp.seller_business_name,
                      seller_delivery_info: dp.seller_delivery_info,
                    } as typeof product;
                    addToCart(enriched);
                    return;
                  }
                } catch (_) {
                  // fall through to default
                }
              }
              addToCart(product);
            }}
            disabled={!product.inStock}
            className={`w-full h-8 sm:h-9 text-[10px] sm:text-xs font-medium transition-all duration-200 ${
              product.inStock
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            size="sm"
          >
            <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            <span className="hidden sm:inline">{product.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}</span>
            <span className="sm:hidden">{product.inStock ? 'ADD' : 'OUT'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
