import Image from 'next/image';
import { Minus, Plus, Trash2, Phone, Mail, MessageCircle, User } from 'lucide-react';
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
}

export default function CartItem({ 
  item, 
  onUpdateQuantity, 
  onRemove
}: CartItemProps) {
  const { product, quantity } = item;
  const totalPrice = product.price * quantity;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex gap-3 sm:gap-4">
        {/* Product Image */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 80px, 96px"
            className="object-cover rounded-lg"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2 gap-2">
            <div className="min-w-0 flex-1">
              <h3 className={`${devanagari.className} text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2`}>
                {product.nameHindi}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2 line-clamp-1">{product.name}</p>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs bg-orange-100 text-orange-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  {product.category}
                </span>
                {product.inStock ? (
                  <span className="text-[10px] sm:text-xs text-green-600">In Stock</span>
                ) : (
                  <span className="text-[10px] sm:text-xs text-red-600">Out of Stock</span>
                )}
                {product.seller_name && (
                  <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1">
                    <User size={10} className="flex-shrink-0" />
                    <span className="truncate max-w-[80px] sm:max-w-none">{product.seller_name}</span>
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => onRemove(product.id)}
                className="p-1.5 sm:p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                aria-label="Remove item"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Seller Information */}
          {(product.seller_name || product.seller_phone || product.seller_whatsapp || product.seller_email || product.seller_delivery_info) && (
            <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <User size={12} className="sm:w-3.5 sm:h-3.5 text-gray-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{product.seller_name ? `Seller: ${product.seller_name}` : 'Seller Information'}</span>
                {product.seller_business_name && product.seller_name && (
                  <span className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:inline">({product.seller_business_name})</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-600">
                {product.seller_phone && (
                  <button
                    onClick={() => window.open(`tel:${product.seller_phone}`, '_self')}
                    className="flex items-center gap-1 hover:text-green-600 transition-colors cursor-pointer"
                    title="Call seller"
                  >
                    <Phone size={12} className="flex-shrink-0" />
                    <span className="truncate">{product.seller_phone}</span>
                  </button>
                )}
                {product.seller_whatsapp && (
                  <button
                    onClick={() => {
                      const message = `Hello! I'm interested in the product: ${product.name}. Price: ₹${product.price}`;
                      const whatsappUrl = `https://wa.me/${product.seller_whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="flex items-center gap-1 hover:text-green-600 transition-colors cursor-pointer"
                    title="WhatsApp seller"
                  >
                    <MessageCircle size={12} className="flex-shrink-0" />
                    <span className="truncate">{product.seller_whatsapp}</span>
                  </button>
                )}
                {product.seller_email && (
                  <button
                    onClick={() => {
                      const subject = `Inquiry about: ${product.name}`;
                      const body = `Hello,\n\nI'm interested in the product: ${product.name}\nPrice: ₹${product.price}\n\nPlease provide more details.\n\nThank you!`;
                      const mailtoUrl = `mailto:${product.seller_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      window.open(mailtoUrl, '_self');
                    }}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Email seller"
                  >
                    <Mail size={12} className="flex-shrink-0" />
                    <span className="truncate break-all">{product.seller_email}</span>
                  </button>
                )}
              </div>
              {product.seller_delivery_info && (
                <div className="mt-2 text-[10px] sm:text-xs text-gray-600">
                  <strong>Delivery:</strong> {product.seller_delivery_info}
                </div>
              )}
            </div>
          )}

          {/* Price and Quantity */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mt-3 sm:mt-0">
            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                disabled={quantity <= 1}
                className="w-7 h-7 sm:w-8 sm:h-8 p-0"
              >
                <Minus size={12} className="sm:w-3.5 sm:h-3.5" />
              </Button>
              <span className="w-7 sm:w-8 text-center font-medium text-sm sm:text-base">{quantity}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 p-0"
              >
                <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
              </Button>
            </div>

            {/* Price */}
            <div className="text-left sm:text-right">
              <div className="text-base sm:text-lg font-bold text-orange-600">
                ₹{totalPrice.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                ₹{product.price.toLocaleString()} each
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
