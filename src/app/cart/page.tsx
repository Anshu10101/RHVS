"use client";

import { useState } from 'react';
import { ShoppingCart, ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import CartItem from '@/components/Home/cart/CartItem';
import CartSummary from '@/components/Home/cart/CartSummary';
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
        <div className="bg-white shadow-sm border-b border-orange-100">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/products">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>
                <div className="h-6 w-px bg-orange-200"></div>
                <h1 className={`${devanagari.className} text-2xl font-bold text-orange-900`}>
                  Shopping Cart
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-orange-600" />
            </div>
            <h2 className={`${devanagari.className} text-3xl font-bold text-gray-900 mb-4`}>
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any sacred products to your cart yet. 
              Explore our collection of spiritual items and find something meaningful.
            </p>
            <Link href="/products">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full font-semibold">
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
      <div className="bg-white shadow-sm border-b border-orange-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/products">
                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              <div className="h-6 w-px bg-orange-200"></div>
              <h1 className={`${devanagari.className} text-2xl font-bold text-orange-900`}>
                Shopping Cart ({getTotalItems()})
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-600">Wishlist</span>
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
