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
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
      <h2 className={`${devanagari.className} text-2xl font-bold text-gray-900 mb-6`}>
        Order Summary
      </h2>

      {/* Order Details */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Items ({totalItems})</span>
          <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Delivery Charges</span>
          <span className="font-medium text-green-600">FREE</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-lg font-semibold text-gray-900">Total Amount</span>
          <span className="text-2xl font-bold text-orange-600">
            ₹{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Seller Information */}
      <div className="bg-orange-50 rounded-xl p-4 mb-6">
        <h3 className={`${devanagari.className} text-lg font-semibold text-gray-900 mb-3`}>
          Contact Seller
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User size={16} className="text-orange-600" />
            <div>
              <div className="font-medium text-gray-900">{sellerInfo.name}</div>
              <div className="text-sm text-gray-600">{sellerInfo.experience}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Phone size={16} className="text-orange-600" />
            <span className="text-gray-700">{sellerInfo.phone}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-orange-600" />
            <span className="text-gray-700">{sellerInfo.location}</span>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Truck size={16} className="text-blue-600" />
          Delivery Information
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-blue-600" />
            <span className="text-sm text-gray-700">
              Expected Delivery: {deliveryDate.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Delivery time: 3-5 business days
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleCallSeller}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <Phone size={16} className="mr-2" />
          Call Seller
        </Button>
        
        <Button
          onClick={handleWhatsApp}
          variant="outline"
          className="w-full border-green-600 text-green-600 hover:bg-green-50"
        >
          WhatsApp Seller
        </Button>
        
        <Button
          onClick={onClearCart}
          variant="outline"
          className="w-full border-red-300 text-red-600 hover:bg-red-50"
        >
          Clear Cart
        </Button>
      </div>

      {/* Note */}
      <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> All transactions will be completed directly with the seller. 
          Please verify product details and pricing before making payment.
        </p>
      </div>
    </div>
  );
}
