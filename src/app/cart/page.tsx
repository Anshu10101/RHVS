"use client";

// import { useState } from 'react';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import CartItem from '@/components/Home/cart/CartItem';
import Link from 'next/link';
import { Noto_Serif_Devanagari } from 'next/font/google';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, getTotalItems } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-orange-100 sticky top-0 z-30">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <Link href="/products">
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 cursor-pointer px-2 sm:px-3 text-xs sm:text-sm">
                    <ArrowLeft className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Continue Shopping</span>
                  </Button>
                </Link>
                <div className="h-6 w-px bg-orange-200 hidden sm:block"></div>
                <h1 className={`${devanagari.className} text-lg sm:text-2xl font-bold text-orange-900 truncate`}>
                  Shopping Cart
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="container mx-auto px-3 sm:px-4 py-12 sm:py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-orange-100 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
            </div>
            <h2 className={`${devanagari.className} text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4`}>
              Your cart is empty
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 px-4">
              Looks like you haven&apos;t added any sacred products to your cart yet. 
              Explore our collection of spiritual items and find something meaningful.
            </p>
            <Link href="/products">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold cursor-pointer text-sm sm:text-base">
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
      <div className="bg-white shadow-sm border-b border-orange-100 sticky top-0 z-30">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link href="/products">
                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 cursor-pointer px-2 sm:px-3 text-xs sm:text-sm">
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Continue Shopping</span>
                </Button>
              </Link>
              <div className="h-6 w-px bg-orange-200 hidden sm:block"></div>
              <h1 className={`${devanagari.className} text-lg sm:text-2xl font-bold text-orange-900 truncate`}>
                <span className="hidden sm:inline">Shopping Cart ({getTotalItems()})</span>
                <span className="sm:hidden">Cart ({getTotalItems()})</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

{/* Cart Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-3 sm:space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={item.product.id}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationName: 'fadeInUp',
                  animationDuration: '0.6s',
                  animationTimingFunction: 'ease-out',
                  animationFillMode: 'forwards',
                  opacity: 0,
                  transform: 'translateY(30px)'
                }}
              >
                <CartItem
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              </div>
            ))}
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
