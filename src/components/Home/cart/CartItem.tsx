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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  {product.category}
                </span>
                {product.inStock ? (
                  <span className="text-xs text-green-600">In Stock</span>
                ) : (
                  <span className="text-xs text-red-600">Out of Stock</span>
                )}
                {product.seller_name && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full flex items-center gap-1">
                    <User size={10} />
                    {product.seller_name}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRemove(product.id)}
                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Seller Information */}
          {(product.seller_name || product.seller_phone || product.seller_whatsapp || product.seller_email || product.seller_delivery_info) && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{product.seller_name ? `Seller: ${product.seller_name}` : 'Seller Information'}</span>
                {product.seller_business_name && product.seller_name && (
                  <span className="text-xs text-gray-500">({product.seller_business_name})</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                {product.seller_phone && (
                  <button
                    onClick={() => window.open(`tel:${product.seller_phone}`, '_self')}
                    className="flex items-center gap-1 hover:text-green-600 transition-colors cursor-pointer"
                    title="Call seller"
                  >
                    <Phone size={12} />
                    <span>{product.seller_phone}</span>
                  </button>
                )}
                {product.seller_whatsapp && (
                  <button
                    onClick={() => {
                      const message = `Hello! I'm interested in the product: ${product.name}. Price: ₹${product.price}`;
                      const whatsappUrl = `https://wa.me/${product.seller_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="flex items-center gap-1 hover:text-green-600 transition-colors cursor-pointer"
                    title="WhatsApp seller"
                  >
                    <MessageCircle size={12} />
                    <span>{product.seller_whatsapp}</span>
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
                    <Mail size={12} />
                    <span>{product.seller_email}</span>
                  </button>
                )}
              </div>
              {product.seller_delivery_info && (
                <div className="mt-2 text-xs text-gray-600">
                  <strong>Delivery:</strong> {product.seller_delivery_info}
                </div>
              )}
            </div>
          )}

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
