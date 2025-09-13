"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductHeader, ProductGrid, ProductModal } from '@/components/Product';
import { useCart } from '@/contexts/CartContext';
import type { Product } from '@/components/Product/types';

// Sample product data (fallback)
const defaultProducts: Product[] = [
  {
    id: 1,
    name: 'Sacred Rudraksha Mala',
    nameHindi: 'पवित्र रुद्राक्ष माला',
    description: 'Authentic Rudraksha mala with 108 beads, blessed by our spiritual gurus. Perfect for meditation and spiritual practices.',
    price: 2500,
    originalPrice: 3000,
    category: 'Spiritual',
    image: '/product/p1.jpg',
    images: ['/product/p1.jpg', '/product/p2.jpg'],
    features: [
      '108 authentic Rudraksha beads',
      'Blessed by spiritual gurus',
      'Handcrafted with care',
      'Comes with sacred thread',
      'Perfect for meditation'
    ],
    tags: ['rudraksha', 'mala', 'meditation', 'spiritual'],
    inStock: true,
    rating: 4.8,
    reviews: 124,
    discount: 17,
    isNew: true,
    isFeatured: true
  },
  {
    id: 2,
    name: 'Tulsi Mala for Devotion',
    nameHindi: 'भक्ति के लिए तुलसी माला',
    description: 'Sacred Tulsi mala made from holy basil beads. Known for its purifying properties and connection to Lord Vishnu.',
    price: 1800,
    category: 'Spiritual',
    image: '/product/p2.jpg',
    images: ['/product/p2.jpg', '/product/p3.jpg'],
    features: [
      'Pure Tulsi beads',
      'Sacred and purifying',
      'Lightweight and comfortable',
      'Traditional craftsmanship',
      'Blessed for devotion'
    ],
    tags: ['tulsi', 'mala', 'devotion', 'vishnu'],
    inStock: true,
    rating: 4.6,
    reviews: 89,
    isFeatured: true
  },
  {
    id: 3,
    name: 'Sandalwood Incense Sticks',
    nameHindi: 'चंदन की अगरबत्ती',
    description: 'Premium sandalwood incense sticks for daily puja and meditation. Creates a peaceful and divine atmosphere.',
    price: 450,
    originalPrice: 600,
    category: 'Puja Items',
    image: '/product/p3.jpg',
    images: ['/product/p3.jpg', '/product/p4.jpg'],
    features: [
      'Pure sandalwood fragrance',
      'Long burning time',
      'Non-toxic and safe',
      'Pack of 100 sticks',
      'Perfect for daily puja'
    ],
    tags: ['incense', 'sandalwood', 'puja', 'fragrance'],
    inStock: true,
    rating: 4.7,
    reviews: 156,
    discount: 25
  },
  {
    id: 4,
    name: 'Copper Puja Thali',
    nameHindi: 'तांबे की पूजा थाली',
    description: 'Traditional copper puja thali with intricate designs. Essential for Hindu rituals and ceremonies.',
    price: 1200,
    category: 'Puja Items',
    image: '/product/p4.jpg',
    images: ['/product/p4.jpg', '/product/p5.jpg'],
    features: [
      'Pure copper construction',
      'Intricate traditional designs',
      'Antimicrobial properties',
      'Durable and long-lasting',
      'Perfect for daily rituals'
    ],
    tags: ['copper', 'thali', 'puja', 'ritual'],
    inStock: true,
    rating: 4.5,
    reviews: 78,
    isNew: true
  },
  {
    id: 5,
    name: 'Sacred Ganga Jal',
    nameHindi: 'पवित्र गंगा जल',
    description: 'Blessed water from the holy Ganges river, collected during auspicious occasions and purified through traditional methods.',
    price: 300,
    category: 'Sacred Items',
    image: '/product/p5.jpg',
    images: ['/product/p5.jpg', '/product/p6.jpg'],
    features: [
      'Directly from Ganges',
      'Blessed by priests',
      'Purified traditionally',
      'Sacred and holy',
      'Used in rituals'
    ],
    tags: ['ganga', 'jal', 'holy', 'water'],
    inStock: true,
    rating: 4.9,
    reviews: 203,
    isFeatured: true
  },
  {
    id: 6,
    name: 'Saffron (Kesar) Powder',
    nameHindi: 'केसर पाउडर',
    description: 'Premium quality saffron powder from Kashmir, perfect for religious ceremonies and traditional cooking.',
    price: 2500,
    originalPrice: 3200,
    category: 'Sacred Items',
    image: '/product/p6.jpg',
    images: ['/product/p6.jpg', '/product/p7.jpg'],
    features: [
      'Kashmiri saffron',
      'Premium quality',
      'Pure and authentic',
      'Rich aroma and color',
      'Used in rituals and cooking'
    ],
    tags: ['saffron', 'kesar', 'kashmir', 'premium'],
    inStock: true,
    rating: 4.8,
    reviews: 67,
    discount: 22
  },
  {
    id: 7,
    name: 'Brass Diya Set',
    nameHindi: 'पीतल की दीया सेट',
    description: 'Traditional brass diya set with 5 pieces, perfect for daily prayers and festive celebrations.',
    price: 800,
    category: 'Puja Items',
    image: '/product/p7.jpg',
    images: ['/product/p7.jpg', '/product/p8.jpg'],
    features: [
      'Pure brass construction',
      'Set of 5 diyas',
      'Traditional design',
      'Easy to clean',
      'Perfect for festivals'
    ],
    tags: ['brass', 'diya', 'festival', 'light'],
    inStock: true,
    rating: 4.4,
    reviews: 92
  },
  {
    id: 8,
    name: 'Sacred Tulsi Plant',
    nameHindi: 'पवित्र तुलसी का पौधा',
    description: 'Live Tulsi plant in a traditional clay pot, considered sacred in Hindu culture and perfect for home worship.',
    price: 350,
    category: 'Sacred Plants',
    image: '/product/p8.jpg',
    images: ['/product/p8.jpg', '/product/p9.jpg'],
    features: [
      'Live healthy plant',
      'Traditional clay pot',
      'Sacred and blessed',
      'Air purifying',
      'Easy to maintain'
    ],
    tags: ['tulsi', 'plant', 'sacred', 'home'],
    inStock: true,
    rating: 4.6,
    reviews: 45,
    isNew: true
  },
  {
    id: 9,
    name: 'Silver Om Pendant',
    nameHindi: 'चांदी का ॐ पेंडेंट',
    description: 'Elegant silver Om pendant with traditional design, perfect for daily wear and spiritual connection.',
    price: 1800,
    originalPrice: 2200,
    category: 'Jewelry',
    image: '/product/p9.jpg',
    images: ['/product/p9.jpg', '/product/p10.jpg'],
    features: [
      'Pure silver construction',
      'Traditional Om design',
      'Comes with chain',
      'Blessed by priests',
      'Perfect for daily wear'
    ],
    tags: ['silver', 'om', 'pendant', 'jewelry'],
    inStock: true,
    rating: 4.7,
    reviews: 134,
    discount: 18
  },
  {
    id: 10,
    name: 'Sacred Chakra Stones',
    nameHindi: 'पवित्र चक्र पत्थर',
    description: 'Set of 7 chakra stones for meditation and healing. Each stone represents a different energy center.',
    price: 1500,
    category: 'Meditation',
    image: '/product/p10.jpg',
    images: ['/product/p10.jpg', '/product/p1.jpg'],
    features: [
      'Set of 7 chakra stones',
      'Natural healing crystals',
      'Energy balancing',
      'Meditation aid',
      'Comes with guidebook'
    ],
    tags: ['chakra', 'stones', 'meditation', 'healing'],
    inStock: false,
    rating: 4.5,
    reviews: 56
  }
];

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const { addToCart, getTotalItems } = useCart();

  // Transform DB product to UI Product type
  const transformDbProduct = (p: any, index: number): Product => {
    const numericId = Number(String(p.id).replace(/\D/g, "")) || index + 1;
    return {
      id: numericId,
      name: p.name ?? 'Product',
      nameHindi: p.nameHindi ?? p.name ?? 'उत्पाद',
      description: p.description ?? '',
      price: Number(p.price ?? 0),
      originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
      category: p.category ?? 'General',
      image: p.imageUrl ?? '/product/p1.jpg',
      images: p.images ? (Array.isArray(p.images) ? p.images : []) : (p.imageUrl ? [p.imageUrl] : []),
      features: p.features ? (Array.isArray(p.features) ? p.features : []) : [],
      tags: p.tags ? (Array.isArray(p.tags) ? p.tags : []) : [],
      inStock: typeof p.stock === 'number' ? p.stock > 0 : true,
      rating: typeof p.rating === 'number' ? p.rating : 0,
      reviews: typeof p.reviews === 'number' ? p.reviews : 0,
      discount: typeof p.discount === 'number' ? p.discount : undefined,
      isNew: !!p.isNew,
      isFeatured: !!p.isFeatured,
    };
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/content/store', { cache: 'no-store' });
        const data = await res.json();
        if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
          const mapped = data.products.map((p: any, i: number) => transformDbProduct(p, i));
          setProducts(mapped);
        } else {
          // keep defaults
        }
      } catch (_) {
        // keep defaults on error
      }
    };
    load();
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    document.body.style.overflow = 'unset';
  };

  const handleAddToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart(product);
    }
  };

  const handleToggleFavorite = (productId: number) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <ProductHeader 
        title="Sacred Products"
        titleHindi="पवित्र उत्पाद"
        description="Discover our collection of authentic spiritual products, blessed by our gurus and crafted with devotion"
        totalProducts={products.length}
      />
      {/* Sticky Cart Button */}
      <div className="fixed top-6 right-6 z-50">
        <Link href="/cart">
          <Button 
            size="sm"
            className="h-10 px-4 gap-2 bg-white/95 backdrop-blur-md border border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 shadow-xl rounded-full transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5"/>
              <circle cx="9" cy="20" r="1"/>
              <circle cx="20" cy="20" r="1"/>
            </svg>
            <span className="font-medium">Cart</span>
            {getTotalItems() > 0 && (
              <span className="bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                {getTotalItems()}
              </span>
            )}
          </Button>
        </Link>
      </div>
      
      <ProductGrid 
        products={products}
        favorites={favorites}
        onProductClick={handleProductClick}
        onToggleFavorite={handleToggleFavorite}
      />
      
      <ProductModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={handleCloseModal}
        onAddToCart={handleAddToCart}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedProduct ? favorites.includes(selectedProduct.id) : false}
      />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
