"use client";

import { useState } from 'react';
import { ShoppingCart, ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import CartItem from '@/components/Cart/CartItem';
import CartSummary from '@/components/Cart/CartSummary';
import Link from 'next/link';
import { Noto_Serif_Devanagari } from 'next/font/google';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getTotalItems, getTotalPrice } = useCart();
  const [favorites, setFavorites] = useState<number[]>([]);

  const handleToggleFavorite = (productId: number) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        {/* Header */}
        <div className="bg-white/30 backdrop-blur-sm border-b border-orange-100/50 py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <Link href="/products">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft size={16} />
                  Back to Products
                </Button>
              </Link>
              <h1 className={`${devanagari.className} text-2xl font-bold text-orange-800`}>
                Shopping Cart
              </h1>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
              <ShoppingCart size={48} className="text-orange-400" />
            </div>
            <h2 className={`${devanagari.className} text-3xl font-bold text-gray-900 mb-4`}>
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Looks like you haven't added any products to your cart yet. 
              Explore our collection of spiritual products and add some items to get started.
            </p>
            <Link href="/products">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white/30 backdrop-blur-sm border-b border-orange-100/50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/products">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft size={16} />
                  Back to Products
                </Button>
              </Link>
              <h1 className={`${devanagari.className} text-2xl font-bold text-orange-800`}>
                Shopping Cart
              </h1>
            </div>
            <div className="flex items-center gap-2 text-orange-600">
              <ShoppingCart size={20} />
              <span className="font-medium">{getTotalItems()} items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div
                  key={item.product.id}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards',
                    opacity: 0,
                    transform: 'translateY(30px)'
                  }}
                >
                  <CartItem
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favorites.includes(item.product.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              totalItems={getTotalItems()}
              totalPrice={getTotalPrice()}
              onClearCart={clearCart}
            />
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
