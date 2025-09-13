import Image from 'next/image';
import { Minus, Plus, Trash2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Noto_Serif_Devanagari } from 'next/font/google';
import type { CartItem as CartItemType } from '@/contexts/CartContext';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  onToggleFavorite: (productId: number) => void;
  isFavorite: boolean;
}

export default function CartItem({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  onToggleFavorite, 
  isFavorite 
}: CartItemProps) {
  const { product, quantity } = item;
  const totalPrice = product.price * quantity;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="96px"
            className="object-cover rounded-lg"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className={`${devanagari.className} text-lg font-semibold text-gray-900 mb-1`}>
                {product.nameHindi}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{product.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  {product.category}
                </span>
                {product.inStock ? (
                  <span className="text-xs text-green-600">In Stock</span>
                ) : (
                  <span className="text-xs text-red-600">Out of Stock</span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(product.id)}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
              </button>
              <button
                onClick={() => onRemove(product.id)}
                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Price and Quantity */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-8 h-8 p-0"
                >
                  <Minus size={14} />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                  className="w-8 h-8 p-0"
                >
                  <Plus size={14} />
                </Button>
              </div>

              {/* Price */}
              <div className="text-right">
                <div className="text-lg font-bold text-orange-600">
                  ₹{totalPrice.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  ₹{product.price.toLocaleString()} each
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
