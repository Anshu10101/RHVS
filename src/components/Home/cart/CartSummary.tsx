import { Phone, MapPin, Clock, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Noto_Serif_Devanagari } from 'next/font/google';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

interface CartSummaryProps {
  totalItems: number;
  totalPrice: number;
  onClearCart: () => void;
}

export default function CartSummary({ totalItems, totalPrice, onClearCart }: CartSummaryProps) {
  // Dummy seller information
  const sellerInfo = {
    name: 'Pandit Ram Sharan Sharma',
    phone: '+91 98765 43210',
    location: 'Varanasi, Uttar Pradesh',
    experience: '15+ years in spiritual products'
  };

  // Calculate delivery date (3-5 days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);

  const handleCallSeller = () => {
    window.open(`tel:${sellerInfo.phone}`, '_self');
  };

  const handleWhatsApp = () => {
    const message = `Hello! I'm interested in the products in my cart. Total: ₹${totalPrice.toLocaleString()}`;
    const whatsappUrl = `https://wa.me/${sellerInfo.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 sticky top-4">
      <h2 className={`${devanagari.className} text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6`}>
        Order Summary
      </h2>

      {/* Order Details */}
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm sm:text-base text-gray-600">Items ({totalItems})</span>
          <span className="font-medium text-sm sm:text-base">₹{totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm sm:text-base text-gray-600">Delivery Charges</span>
          <span className="font-medium text-green-600 text-sm sm:text-base">FREE</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-base sm:text-lg font-semibold text-gray-900">Total Amount</span>
          <span className="text-xl sm:text-2xl font-bold text-orange-600">
            ₹{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Seller Information */}
      <div className="bg-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <h3 className={`${devanagari.className} text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3`}>
          Contact Seller
        </h3>
        
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <User size={14} className="sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-sm sm:text-base text-gray-900 truncate">{sellerInfo.name}</div>
              <div className="text-xs sm:text-sm text-gray-600">{sellerInfo.experience}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Phone size={14} className="sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-700 break-all">{sellerInfo.phone}</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <MapPin size={14} className="sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-700">{sellerInfo.location}</span>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
          <Truck size={14} className="sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
          Delivery Information
        </h3>
        
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2">
            <Clock size={12} className="sm:w-3.5 sm:h-3.5 text-blue-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-700">
              Expected Delivery: {deliveryDate.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-600">
            Delivery time: 3-5 business days
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 sm:space-y-3">
        <Button
          onClick={handleCallSeller}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base h-10 sm:h-11"
        >
          <Phone size={14} className="sm:w-4 sm:h-4 mr-2" />
          Call Seller
        </Button>
        
        <Button
          onClick={handleWhatsApp}
          variant="outline"
          className="w-full border-green-600 text-green-600 hover:bg-green-50 text-sm sm:text-base h-10 sm:h-11"
        >
          WhatsApp Seller
        </Button>
        
        <Button
          onClick={onClearCart}
          variant="outline"
          className="w-full border-red-300 text-red-600 hover:bg-red-50 text-sm sm:text-base h-10 sm:h-11"
        >
          Clear Cart
        </Button>
      </div>

      {/* Note */}
      <div className="mt-4 sm:mt-6 p-2.5 sm:p-3 bg-yellow-50 rounded-lg">
        <p className="text-[10px] sm:text-xs text-yellow-800">
          <strong>Note:</strong> All transactions will be completed directly with the seller. 
          Please verify product details and pricing before making payment.
        </p>
      </div>
    </div>
  );
}
