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

import { Loader2 } from 'lucide-react';

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(16); // 4 rows × 4 columns
  const { addToCart, getTotalItems } = useCart();
  const router = useRouter();

  // Transform DB product to UI Product type
  const transformDbProduct = (p: Record<string, unknown>, index: number): Product & { detailId?: string } => {
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
      setLoading(true);
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
          const opts: StateOption[] = statesData.data.map((s: { id: string | number; name: string }) => ({ id: String(s.id), name: String(s.name) }));
          setStateOptions(opts);
        }

        // then load products
        const res = await fetch('/api/content/store', { cache: 'no-store' });
        const data = await res.json();
        if (data?.success && Array.isArray(data.products) && data.products.length > 0) {
          const mapped = data.products.map((p: Record<string, unknown>, i: number) => {
            const base = transformDbProduct(p, i);
            const categoryName = (catData?.categories ? (catData.categories.reduce((acc: Record<string, string>, c: {id: string | number, name: string}) => { acc[String(c.id)] = c.name; return acc; }, {} as Record<string,string>))[String(p.category)] : undefined) || base.category;
            return { ...base, category: categoryName, detailId: String(p.id) };
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
        } else {
          // No products found
          setProducts([]);
          setFilteredProducts([]);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
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
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchQuery, selectedCategories, priceRange, sortOption, selectedStateName, selectedDistrictName]);

  const handleProductClick = (product: Product) => {
    const rawId = (product as Product & { detailId?: string }).detailId || product.id;
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
    const productWithDetails = product as Product & { seller_name?: string; seller_phone?: string; seller_whatsapp?: string; seller_email?: string; detailId?: string };
    const hasSeller = !!productWithDetails.seller_name || !!productWithDetails.seller_phone || !!productWithDetails.seller_whatsapp || !!productWithDetails.seller_email;
    if (productWithDetails.detailId && !hasSeller) {
      const idForDetail = productWithDetails.detailId;
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
    setCurrentPage(1);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Loading products...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the latest products</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Modern Header with Search */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Products Store</h1>
            
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
                                  const dOpts = data.data.map((d: { id: string | number; name: string }) => ({ id: String(d.id), name: String(d.name) })) as DistrictOption[];
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
                                const dOpts = data.data.map((d: { id: string | number; name: string }) => ({ id: String(d.id), name: String(d.name) })) as DistrictOption[];
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
                Showing <span className="font-medium">{startIndex + 1}-{Math.min(endIndex, filteredProducts.length)}</span> of <span className="font-medium">{filteredProducts.length}</span> products
                {totalPages > 1 && (
                  <span className="ml-2 text-gray-400">(Page {currentPage} of {totalPages})</span>
                )}
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
              {currentProducts.map((product, index) => (
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="cursor-pointer"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`cursor-pointer ${currentPage === pageNum ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="mb-6 text-orange-200">
                  <svg className="mx-auto h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No Products Available</h3>
                <p className="text-gray-600 text-lg mb-2">We're currently updating our product catalog.</p>
                <p className="text-gray-500 mb-6">Please check back soon for new products and items.</p>
                {searchQuery || selectedCategories.length > 0 || selectedStateName !== 'All' || selectedDistrictName !== 'All' ? (
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="mt-4 cursor-pointer"
                  >
                    <FilterX className="h-4 w-4 mr-2" />
                    Clear All Filters
                </Button>
                ) : null}
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
