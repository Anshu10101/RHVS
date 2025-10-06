"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProductHeader, ProductModal } from '@/components/Home/Product';
import ProductCard from '@/components/Home/Product/ProductCard';
import FeaturedProductsMarquee from '@/components/Home/Product/FeaturedProductsMarquee';
import { useCart } from '@/contexts/CartContext';
import type { Product } from '@/components/Home/Product/types';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, SlidersHorizontal, X, FilterX, ChevronDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter
} from '@/components/ui/sheet';

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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(defaultProducts);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<string[]>([]);
  type StateOption = { id: string; name: string };
  type DistrictOption = { id: string; name: string };
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedStateName, setSelectedStateName] = useState<string>('All');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('All');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState('featured'); // 'featured', 'price-asc', 'price-desc', 'new'
  const { addToCart, getTotalItems } = useCart();
  const router = useRouter();

  // Transform DB product to UI Product type
  const transformDbProduct = (p: any, index: number): Product & { detailId?: string } => {
    const numericId = Number(String(p.id).replace(/\D/g, "")) || index + 1;
    return {
      id: numericId,
      name: p.name ?? 'Product',
      nameHindi: p.nameHindi ?? p.name ?? 'उत्पाद',
      description: p.description ?? '',
      price: Number(p.price ?? 0),
      originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
      category: (p.category && categoryMap[String(p.category)]) || p.category || 'General',
      image: p.imageUrl ?? '/product/p1.jpg',
      images: p.images ? (Array.isArray(p.images) ? p.images : []) : (p.imageUrl ? [p.imageUrl] : []),
      features: p.features ? (Array.isArray(p.features) ? p.features : []) : [],
      tags: p.tags ? (Array.isArray(p.tags) ? p.tags : []) : [],
      state: (p.state as string) || (p.state_id as string) || undefined,
      district: (p.district as string) || (p.district_id as string) || undefined,
      inStock: typeof p.stock === 'number' ? p.stock > 0 : true,
      rating: typeof p.rating === 'number' ? p.rating : 0,
      reviews: typeof p.reviews === 'number' ? p.reviews : 0,
      discount: typeof p.discount === 'number' ? p.discount : undefined,
      isNew: !!p.isNew,
      isFeatured: !!p.isFeatured,
    } as Product & { detailId?: string };
  };

  useEffect(() => {
    const load = async () => {
      try {
        // load categories first
        const catRes = await fetch('/api/content/store/categories', { cache: 'no-store' });
        const catData = await catRes.json();
        if (catData?.success && Array.isArray(catData.categories)) {
          const map: Record<string, string> = {};
          for (const c of catData.categories as Array<{id: string | number, name: string}>) {
            map[String(c.id)] = c.name;
          }
          setCategoryMap(map);
        }

        // load states for filters
        const statesRes = await fetch('/api/states', { cache: 'no-store' });
        const statesData = await statesRes.json();
        if (statesData?.success && Array.isArray(statesData.data)) {
          const opts: StateOption[] = statesData.data.map((s: any) => ({ id: String(s.id), name: String(s.name) }));
          setStateOptions(opts);
        }

        // then load products
        const res = await fetch('/api/content/store', { cache: 'no-store' });
        const data = await res.json();
        if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
          const mapped = data.products.map((p: any, i: number) => {
            const base = transformDbProduct(p as any, i);
            const categoryName = (catData?.categories ? (catData.categories.reduce((acc: Record<string, string>, c: {id: string | number, name: string}) => { acc[String(c.id)] = c.name; return acc; }, {} as Record<string,string>))[String((p as any).category)] : undefined) || base.category;
            return { ...base, category: categoryName, detailId: String((p as any).id) };
          });
          // Remove duplicates based on product ID
          const uniqueProducts = mapped.filter((product: Product, index: number, self: Product[]) => 
            index === self.findIndex((p: Product) => p.id === product.id)
          );
          setProducts(uniqueProducts);
          setFilteredProducts(uniqueProducts);
          
          // Extract unique categories
          const uniqueCategories = Array.from(new Set(uniqueProducts.map((p: Product) => p.category))) as string[];
          setCategories(uniqueCategories);
          // Note: districts are populated dynamically via API when a state is picked
          
          // Set price range based on products
          const prices = uniqueProducts.map((p: Product) => p.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange([minPrice, maxPrice]);
        }
      } catch (_) {
        // keep defaults on error
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Apply filters when filter criteria change
  useEffect(() => {
    let result = [...products];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p: Product) => 
        p.name.toLowerCase().includes(query) || 
        p.nameHindi.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      result = result.filter((p: Product) => selectedCategories.includes(p.category));
    }
    
    // Filter by state/district
    if (selectedStateName !== 'All') {
      result = result.filter((p: Product) => (p.state || '').toLowerCase() === selectedStateName.toLowerCase());
    }
    if (selectedDistrictName !== 'All') {
      result = result.filter((p: Product) => (p.district || '').toLowerCase() === selectedDistrictName.toLowerCase());
    }

    // Filter by price range
    result = result.filter((p: Product) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    
    // Apply sorting (base sort by selected option)
    switch(sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'new':
        result.sort((a, b) => (a.isNew === b.isNew) ? 0 : a.isNew ? -1 : 1);
        break;
      case 'featured':
      default:
        result.sort((a, b) => (a.isFeatured === b.isFeatured) ? 0 : a.isFeatured ? -1 : 1);
        break;
    }
    
    // If location filters are set, prioritize by location (district > state)
    if (selectedStateName !== 'All' || selectedDistrictName !== 'All') {
      const score = (p: Product) => {
        let s = 0;
        if (selectedStateName !== 'All' && (p.state || '').toLowerCase() === selectedStateName.toLowerCase()) s += 1;
        if (selectedDistrictName !== 'All' && (p.district || '').toLowerCase() === selectedDistrictName.toLowerCase()) s += 2;
        return s;
      };
      result.sort((a, b) => score(b) - score(a));
    }
    
    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategories, priceRange, sortOption, selectedStateName, selectedDistrictName]);

  const handleProductClick = (product: Product) => {
    const rawId = (product as any).detailId || product.id;
    router.push(`/products/${rawId}`);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    document.body.style.overflow = 'unset';
  };

  const handleAddToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    // Ensure seller fields are attached by fetching detail when missing
    const hasSeller = !!(product as any).seller_name || !!(product as any).seller_phone || !!(product as any).seller_whatsapp || !!(product as any).seller_email;
    if ((product as any).detailId && !hasSeller) {
      const idForDetail = (product as any).detailId as string;
      // Fire and forget enrich; add after enrichment for consistency
      (async () => {
        try {
          const res = await fetch(`/api/products/${encodeURIComponent(idForDetail)}`, { cache: 'no-store' });
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
        } catch (_) {}
        // Fallback
        addToCart(product);
      })();
    } else {
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

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setPriceRange([0, Math.max(...products.map((p: Product) => p.price))]);
    setSortOption('featured');
    setSelectedStateId('');
    setSelectedStateName('All');
    setSelectedDistrictName('All');
    setDistrictOptions([]);
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Modern Header with Search */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Sacred Products</h1>
            
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative hidden md:block w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="text" 
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-200 rounded-full focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden cursor-pointer">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                  <SheetHeader>
                    <SheetTitle>Filter Products</SheetTitle>
                    <SheetDescription>
                      Refine your product search with these filters
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <div className="space-y-6">
                      {/* Mobile Search */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Search</h3>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            type="text" 
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full"
                          />
                        </div>
                      </div>
                      
                      {/* Mobile Categories */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Categories</h3>
                        <div className="space-y-2">
                          {categories.map((category) => (
                            <div key={category} className="flex items-center">
                              <Checkbox 
                                id={`mobile-category-${category}`}
                                checked={selectedCategories.includes(category)}
                                onCheckedChange={() => toggleCategory(category)}
                              />
                              <label 
                                htmlFor={`mobile-category-${category}`}
                                className="ml-2 text-sm text-gray-700 cursor-pointer"
                              >
                                {category}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                    {/* Mobile State/District */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Location</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">State</label>
                          <Select
                            value={selectedStateId || 'all'}
                            onValueChange={async (id) => {
                              const actualId = id === 'all' ? '' : id;
                              setSelectedStateId(actualId);
                              const opt = stateOptions.find(s => s.id === actualId);
                              const name = opt?.name || 'All';
                              setSelectedStateName(name);
                              if (actualId) {
                                const res = await fetch(`/api/districts?stateId=${encodeURIComponent(actualId)}`, { cache: 'no-store' });
                                const data = await res.json();
                                if (data?.success && Array.isArray(data.data)) {
                                  const dOpts = data.data.map((d: any) => ({ id: String(d.id), name: String(d.name) })) as DistrictOption[];
                                  setDistrictOptions([{ id: 'all', name: 'All' }, ...dOpts]);
                                  setSelectedDistrictName('All');
                                } else {
                                  setDistrictOptions([{ id: 'all', name: 'All' }]);
                                  setSelectedDistrictName('All');
                                }
                              } else {
                                setDistrictOptions([{ id: 'all', name: 'All' }]);
                                setSelectedDistrictName('All');
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All States" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All States</SelectItem>
                              {stateOptions.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">District</label>
                          <Select
                            value={selectedDistrictName || 'All'}
                            onValueChange={(value) => setSelectedDistrictName(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Districts" />
                            </SelectTrigger>
                            <SelectContent>
                              {districtOptions.length === 0 ? (
                                <SelectItem value="All">All Districts</SelectItem>
                              ) : (
                                districtOptions.map((d) => (
                                  <SelectItem key={d.id || d.name} value={d.name}>{d.name}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Price Range */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-700">Price Range</h3>
                        </div>
                        <div className="bg-orange-50/50 rounded-lg p-4 mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Min</span>
                            <span className="text-xs text-gray-500">Max</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-orange-600">₹{priceRange[0].toLocaleString()}</span>
                            <span className="text-gray-400">—</span>
                            <span className="text-lg font-bold text-orange-600">₹{priceRange[1].toLocaleString()}</span>
                          </div>
                        </div>
                        <Slider
                          defaultValue={[priceRange[0], priceRange[1]]}
                          max={Math.max(...products.map((p: Product) => p.price))}
                          step={100}
                          value={[priceRange[0], priceRange[1]]}
                          onValueChange={handlePriceChange}
                          className="py-4"
                        />
                      </div>
                    </div>
                  </div>
                  <SheetFooter>
                    <Button variant="outline" onClick={resetFilters} className="w-full">
                      <FilterX className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              
              {/* Desktop Sort Dropdown */}
              <div className="relative inline-block">
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 hidden group-focus:block">
                  <div className="py-1">
                    <button 
                      onClick={() => setSortOption('featured')} 
                      className={`block px-4 py-2 text-sm w-full text-left cursor-pointer ${sortOption === 'featured' ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Featured
                    </button>
                    <button 
                      onClick={() => setSortOption('price-asc')} 
                      className={`block px-4 py-2 text-sm w-full text-left cursor-pointer ${sortOption === 'price-asc' ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Price: Low to High
                    </button>
                    <button 
                      onClick={() => setSortOption('price-desc')} 
                      className={`block px-4 py-2 text-sm w-full text-left cursor-pointer ${sortOption === 'price-desc' ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Price: High to Low
                    </button>
                    <button 
                      onClick={() => setSortOption('new')} 
                      className={`block px-4 py-2 text-sm w-full text-left cursor-pointer ${sortOption === 'new' ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Newest First
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Cart Button */}
        <Link href="/cart">
          <Button 
            size="sm"
                  className="h-10 px-4 gap-2 bg-orange-600 text-white hover:bg-orange-700 rounded-full transition-all duration-200 cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="font-medium hidden sm:inline">Cart</span>
            {getTotalItems() > 0 && (
                    <span className="bg-white text-orange-600 text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                {getTotalItems()}
              </span>
            )}
          </Button>
        </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Featured Products Marquee */}
      <FeaturedProductsMarquee products={products} onProductClick={handleProductClick} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Filters</h2>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs cursor-pointer">
                    Reset All
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {/* Categories */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Categories</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center">
                          <Checkbox 
                            id={`category-${category}`}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => toggleCategory(category)}
                          />
                          <label 
                            htmlFor={`category-${category}`}
                            className="ml-2 text-sm text-gray-700 cursor-pointer"
                          >
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* State/District */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Location</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">State</label>
                        <Select
                          value={selectedStateId || 'all'}
                          onValueChange={async (id) => {
                            const actualId = id === 'all' ? '' : id;
                            setSelectedStateId(actualId);
                            const opt = stateOptions.find(s => s.id === actualId);
                            const name = opt?.name || 'All';
                            setSelectedStateName(name);
                            if (actualId) {
                              const res = await fetch(`/api/districts?stateId=${encodeURIComponent(actualId)}`, { cache: 'no-store' });
                              const data = await res.json();
                              if (data?.success && Array.isArray(data.data)) {
                                const dOpts = data.data.map((d: any) => ({ id: String(d.id), name: String(d.name) })) as DistrictOption[];
                                setDistrictOptions([{ id: 'all', name: 'All' }, ...dOpts]);
                                setSelectedDistrictName('All');
                              } else {
                                setDistrictOptions([{ id: 'all', name: 'All' }]);
                                setSelectedDistrictName('All');
                              }
                            } else {
                              setDistrictOptions([{ id: 'all', name: 'All' }]);
                              setSelectedDistrictName('All');
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All States" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All States</SelectItem>
                            {stateOptions.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">District</label>
                        <Select
                          value={selectedDistrictName || 'All'}
                          onValueChange={(value) => setSelectedDistrictName(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Districts" />
                          </SelectTrigger>
                          <SelectContent>
                            {districtOptions.length === 0 ? (
                              <SelectItem value="All">All Districts</SelectItem>
                            ) : (
                              districtOptions.map((d) => (
                                <SelectItem key={d.id || d.name} value={d.name}>{d.name}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Price Range */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Price Range</h3>
                    </div>
                    <div className="bg-orange-50/50 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Min</span>
                        <span className="text-xs text-gray-500">Max</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-orange-600">₹{priceRange[0].toLocaleString()}</span>
                        <span className="text-gray-400">—</span>
                        <span className="text-lg font-bold text-orange-600">₹{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                    <Slider
                      defaultValue={[priceRange[0], priceRange[1]]}
                      max={Math.max(...products.map((p: Product) => p.price))}
                      step={100}
                      value={[priceRange[0], priceRange[1]]}
                      onValueChange={handlePriceChange}
                      className="py-4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Product Grid */}
          <div className="flex-1">
            {/* Active Filters */}
            {(selectedCategories.length > 0 || searchQuery) && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-gray-500">Active Filters:</span>
                  {selectedCategories.map(category => (
                    <Badge 
                      key={category} 
                      variant="secondary"
                      className="px-3 py-1 flex items-center gap-1"
                    >
                      {category}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => toggleCategory(category)}
                      />
                    </Badge>
                  ))}
                  {searchQuery && (
                    <Badge 
                      variant="secondary"
                      className="px-3 py-1 flex items-center gap-1"
                    >
                      Search: {searchQuery}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => setSearchQuery('')}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{filteredProducts.length}</span> of <span className="font-medium">{products.length}</span> products
              </p>
              <div className="md:hidden">
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="cursor-pointer">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
            
            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationName: 'fadeInUp',
                    animationDuration: '0.5s',
                    animationTimingFunction: 'ease-out',
                    animationFillMode: 'forwards',
                    opacity: 0,
                    transform: 'translateY(20px)'
                  }}
                >
                  <ProductCard
                    product={product}
        onProductClick={handleProductClick}
        onToggleFavorite={handleToggleFavorite}
                    isFavorite={favorites.includes(product.id)}
                  />
                </div>
              ))}
            </div>
            
            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <div className="mb-4 text-gray-400">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or search query</p>
                <Button onClick={resetFilters} variant="outline" className="cursor-pointer">
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
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
