'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import type { Product as UiProduct } from '@/components/Home/Product/types';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Share2, 
  Plus, 
  Minus,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Phone,
  Mail,
  MessageCircle,
  User,
  Store
} from 'lucide-react';
import {
  CheckCircle2,
  Cpu,
  HardDrive,
  Monitor,
  Camera,
  Battery,
  Zap,
  Gauge,
  Ruler,
  Scale,
  Palette,
  Layers,
  Tag,
  ShieldCheck,
  Package,
  Info
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  seller_id?: string;
  imageUrl: string;
  images?: string[];
  isVisible: boolean;
  isFeatured: boolean;
  stock: number;
  tags: string[];
  features?: string[];
  specifications?: { [key: string]: string };
  createdAt: Date;
  updatedAt: Date;
  rating?: number;
  reviews?: number;
  // Seller information
  seller_name?: string;
  seller_phone?: string;
  seller_whatsapp?: string;
  seller_email?: string;
  seller_business_name?: string;
  seller_delivery_info?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const imgContainerRef = useRef<HTMLDivElement | null>(null);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imgLoading, setImgLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [similarProducts, setSimilarProducts] = useState<Array<{ id: string; name: string; imageUrl: string; price: number; originalPrice?: number; description?: string }>>([]);
  const similarRef = useRef<HTMLDivElement | null>(null);
  const scrollSimilar = (dir: 'left' | 'right') => {
    const el = similarRef.current;
    if (!el) return;
    // Calculate scroll amount based on viewport width for better responsiveness
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    const amount = isMobile 
      ? Math.round(el.clientWidth * 0.6) // Show more on mobile
      : isTablet 
        ? Math.round(el.clientWidth * 0.4) 
        : Math.round(el.clientWidth * 0.3);
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use timestamp for cache-busting
      const timestamp = Date.now();
      
      // load categories for mapping id -> name
      try {
        const catRes = await fetch(`/api/content/store/categories?_t=${timestamp}`, { cache: 'no-store' });
        const catData = await catRes.json();
        if (catData?.success && Array.isArray(catData.categories)) {
          const map: Record<string, string> = {};
          for (const c of catData.categories) {
            map[String(c.id)] = c.name;
          }
          setCategoryMap(map);
        }
      } catch {}
      
      // Load product with cache-busting
      const response = await fetch(`/api/products/${params.id}?_t=${timestamp}`, { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success && data.product) {
        setProduct(data.product);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Failed to load product');
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      loadProduct();
    }
  }, [params.id, loadProduct]);

  // Reload product when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && params.id) {
        // Reload product when page becomes visible
        loadProduct();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [params.id, loadProduct]);

  // Load similar products from the same category, excluding current item
  useEffect(() => {
    if (!product || !product.category) return;
    (async () => {
      try {
        const res = await fetch(`/api/content/store?_t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        const all = Array.isArray(data?.products) ? data.products : [];
        
        // Deduplicate by product ID first (in case API returns duplicates)
        const uniqueProducts = new Map<string, Record<string, unknown>>();
        for (const p of all) {
          const id = String(p.id);
          if (!uniqueProducts.has(id)) {
            uniqueProducts.set(id, p);
          }
        }
        
        const sameCategory = Array.from(uniqueProducts.values())
          .filter((p: Record<string, unknown>) => 
            String(p.category) === String(product.category) && 
            String(p.id) !== String(product.id)
          );
        
        const mapped = sameCategory.slice(0, 12).map((p: Record<string, unknown>) => ({
          id: String(p.id),
          name: String(p.name || 'Product'),
          imageUrl: String(p.imageUrl || p.image_url || p.image_path || '/product/p1.jpg'),
          price: Number(p.price ?? 0),
          originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
          description: String(p.description || '')
        }));
        setSimilarProducts(mapped);
      } catch (err) {
        // ignore
      }
    })();
  }, [product]);

  // Lightbox keyboard controls
  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') setSelectedImage((i) => Math.min(i + 1, (product?.images?.length || 1) - 1));
      if (e.key === 'ArrowLeft') setSelectedImage((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLightboxOpen, product?.images?.length]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      const numericId = Number(String(product.id).replace(/\D/g, '')) || Date.now();
      const uiProduct: UiProduct = {
        id: numericId,
        name: product.name,
        nameHindi: product.name,
        description: product.description ?? '',
        price: Number(product.price ?? 0),
        originalPrice: product.originalPrice != null ? Number(product.originalPrice) : undefined,
        category: categoryLabel || (product.category as unknown as string) || 'General',
        image: product.imageUrl,
        images: Array.isArray(product.images) ? product.images : (product.imageUrl ? [product.imageUrl] : []),
        features: Array.isArray(product.features) ? product.features : [],
        tags: Array.isArray(product.tags) ? product.tags : [],
        inStock: product.stock > 0,
        rating: product.rating,
        reviews: product.reviews,
        // Seller information
        seller_name: product.seller_name,
        seller_phone: product.seller_phone,
        seller_whatsapp: product.seller_whatsapp,
        seller_email: product.seller_email,
        seller_business_name: product.seller_business_name,
        seller_delivery_info: product.seller_delivery_info,
      };
      for (let i = 0; i < Math.max(1, quantity); i += 1) {
        addToCart(uiProduct);
      }
      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const cleanDigits = (value: string | undefined | null) => {
    return String(value || '').replace(/\D/g, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Product Not Found</h1>
          <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/products')} className="flex items-center gap-2 text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
  const categoryLabel = (product && product.category && categoryMap[String(product.category)]) || product?.category || '';
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  const getSpecIcon = (label: string) => {
    const key = label.toLowerCase();
    if (key.includes('cpu') || key.includes('processor') || key.includes('chip')) return Cpu;
    if (key.includes('storage') || key.includes('ssd') || key.includes('hdd')) return HardDrive;
    if (key.includes('display') || key.includes('screen') || key.includes('monitor')) return Monitor;
    if (key.includes('camera')) return Camera;
    if (key.includes('battery')) return Battery;
    if (key.includes('power') || key.includes('watt') || key.includes('voltage')) return Zap;
    if (key.includes('speed') || key.includes('performance')) return Gauge;
    if (key.includes('size') || key.includes('dimension') || key.includes('length') || key.includes('width') || key.includes('height')) return Ruler;
    if (key.includes('weight')) return Scale;
    if (key.includes('color') || key.includes('colour')) return Palette;
    if (key.includes('material')) return Layers;
    if (key.includes('model') || key.includes('sku')) return Tag;
    if (key.includes('brand') || key.includes('manufacturer')) return Badge;
    if (key.includes('warranty') || key.includes('guarantee')) return ShieldCheck;
    if (key.includes('capacity') || key.includes('package') || key.includes('box')) return Package;
    return Info;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/products')}
              className="flex items-center gap-1.5 sm:gap-2 hover:bg-gray-100 text-sm sm:text-base px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Products</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="hover:bg-gray-100 h-9 w-9 sm:h-10 sm:w-10 p-0">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleShare} className="hover:bg-gray-100 h-9 w-9 sm:h-10 sm:w-10 p-0">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Product Images - sticky column */}
          <div className="space-y-3 sm:space-y-4 lg:sticky lg:top-24 self-start">
            {/* Main Image with hover zoom */}
            <div
              ref={imgContainerRef}
              className="relative bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
              style={{
                aspectRatio: '1 / 1',
              }}
              onMouseMove={(e) => {
                if (!imgContainerRef.current) return;
                if (window.matchMedia('(pointer: coarse)').matches) return;
                const rect = imgContainerRef.current.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setZoomPos({ x, y });
              }}
              onMouseLeave={() => setZoomPos(null)}
              onClick={() => setIsLightboxOpen(true)}
            >
              {imgLoading && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
              )}
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain bg-white"
                style={{
                  cursor: 'zoom-in',
                }}
                onLoad={() => setImgLoading(false)}
              />
              {zoomPos && (
                <div
                  className="hidden md:block absolute pointer-events-none border-2 border-white rounded-lg shadow-2xl"
                  style={{
                    width: 180,
                    height: 180,
                    left: `calc(${zoomPos.x}% - 90px)`,
                    top: `calc(${zoomPos.y}% - 90px)`,
                    backgroundImage: `url(${images[selectedImage]})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '200%',
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                  }}
                />
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 overflow-x-auto md:overflow-visible no-scrollbar pb-2 sm:pb-0">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border transition-all duration-150 ${
                      selectedImage === index 
                        ? 'border-blue-500 ring-1 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4 sm:space-y-6">
            {/* Category & Tags */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Badge variant="secondary" className="px-2 py-0.5 text-[10px] sm:text-xs font-medium">{categoryLabel}</Badge>
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">{tag}</Badge>
              ))}
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{product.description}</p>
            </div>

            {/* Rating removed per request */}
            <div className="h-2" />

            {/* Price */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-orange-600 tracking-tight">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <>
                  <span className="text-base sm:text-lg text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                  <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                    {discount}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">In Stock ({product.stock} available)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700">
                  <Minus className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="font-medium text-sm sm:text-base">Quantity:</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-gray-100 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-3 sm:px-4 py-2 min-w-[2.5rem] sm:min-w-[3rem] text-center font-medium text-sm sm:text-base">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-gray-100 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 items-center">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || addingToCart}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-sm sm:text-base font-semibold shadow hover:shadow-md transition-all duration-200"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                  <span className="sm:hidden">{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                </Button>
              </div>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-gray-900">Key Features</h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 sm:gap-3">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm sm:text-base leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-gray-900">Specifications</h3>
                  <ul className="divide-y divide-gray-200">
                    {Object.entries(product.specifications).map(([key, value]) => {
                      const Icon = getSpecIcon(key);
                      return (
                        <li key={key} className="flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3">
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 flex-shrink-0" />
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 min-w-0">
                            <span className="font-medium text-gray-700 text-sm sm:text-base truncate">{key}</span>
                            <span className="text-gray-900 text-sm sm:text-base break-words sm:break-normal">{value}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Seller Information */}
            {product.seller_name && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    Seller Information
                  </h3>
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <User className="h-4 w-4 text-gray-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">{product.seller_name}</p>
                        {product.seller_business_name && (
                          <p className="text-gray-600 text-xs sm:text-sm flex items-center gap-1">
                            <Store className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{product.seller_business_name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {product.seller_phone && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Phone className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base">
                            Contact: <a className="text-blue-600 hover:underline break-all" href={`tel:${cleanDigits(product.seller_phone)}`}>{product.seller_phone}</a>
                          </p>
                          <p className="text-gray-600 text-xs sm:text-sm">Call for inquiries and orders</p>
                        </div>
                      </div>
                    )}
                    
                    {product.seller_whatsapp && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MessageCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base">
                            WhatsApp: <a className="text-green-700 hover:underline break-all" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${cleanDigits(product.seller_whatsapp)}`}>{product.seller_whatsapp}</a>
                          </p>
                          <p className="text-gray-600 text-xs sm:text-sm">Quick messaging available</p>
                        </div>
                      </div>
                    )}
                    
                    {product.seller_email && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Mail className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base">
                            Email: <a className="text-blue-600 hover:underline break-all" href={`mailto:${product.seller_email}`}>{product.seller_email}</a>
                          </p>
                          <p className="text-gray-600 text-xs sm:text-sm">Email for detailed inquiries</p>
                        </div>
                      </div>
                    )}
                    
                    {product.seller_delivery_info && (
                      <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-700">
                          <strong>Delivery Info:</strong> {product.seller_delivery_info}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Info */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-gray-900">Delivery & Returns</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Free Delivery</p>
                      <p className="text-gray-600 text-xs sm:text-sm">On orders above ₹500</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Secure Payment</p>
                      <p className="text-gray-600 text-xs sm:text-sm">100% secure payment processing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Easy Returns</p>
                      <p className="text-gray-600 text-xs sm:text-sm">30-day return policy</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fullscreen lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setIsLightboxOpen(false)}>
          <button
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-2xl sm:text-3xl z-10 bg-black/30 rounded-full p-2 sm:p-0 sm:bg-transparent"
            onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => Math.max(i - 1, 0)); }}
            aria-label="Previous image"
          >
            ‹
          </button>
          <img src={images[selectedImage]} alt={product.name} className="max-w-[90vw] sm:max-w-[95vw] max-h-[90vh] sm:max-h-[95vh] object-contain" />
          <button
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-2xl sm:text-3xl z-10 bg-black/30 rounded-full p-2 sm:p-0 sm:bg-transparent"
            onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => Math.min(i + 1, images.length - 1)); }}
            aria-label="Next image"
          >
            ›
          </button>
          <button
            className="absolute top-2 sm:top-6 right-2 sm:right-6 text-white/80 hover:text-white text-2xl sm:text-3xl z-10 bg-black/30 rounded-full p-2 sm:p-0 sm:bg-transparent"
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
            aria-label="Close"
          >
            ×
          </button>
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs sm:text-sm bg-black/30 px-3 py-1.5 rounded-full">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      )}

      {/* Similar products */}
      {similarProducts.length > 0 && (
        <div className="container mx-auto px-3 sm:px-4 pb-8 sm:pb-12">
          <div className="mt-6 sm:mt-10 relative">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Similar Products</h2>
            {/* Arrows (show on overflow) */}
            <button
              aria-label="Scroll left"
              onClick={() => scrollSimilar('left')}
              className="hidden md:flex items-center justify-center absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white border shadow hover:bg-gray-50"
            >
              ‹
            </button>
            <button
              aria-label="Scroll right"
              onClick={() => scrollSimilar('right')}
              className="hidden md:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white border shadow hover:bg-gray-50"
            >
              ›
            </button>
            <div ref={similarRef} className="no-scrollbar overflow-x-auto overflow-y-hidden -mx-3 sm:mx-0 px-3 sm:px-0 snap-x snap-mandatory">
              <div className="grid grid-flow-col auto-cols-[60%] xs:auto-cols-[50%] sm:auto-cols-[40%] md:auto-cols-[30%] lg:auto-cols-[22%] xl:auto-cols-[18%] gap-3 sm:gap-4 md:gap-6 pr-3">
                {similarProducts.map((sp) => {
                  const discount = sp.originalPrice && sp.originalPrice > sp.price
                    ? Math.round(((sp.originalPrice - sp.price) / sp.originalPrice) * 100)
                    : 0;
                  return (
                    <Link 
                      key={sp.id} 
                      href={`/products/${encodeURIComponent(sp.id)}`} 
                      className="group block bg-white border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow snap-start flex flex-col h-full"
                    >
                      <div className="relative aspect-square bg-white overflow-hidden flex-shrink-0">
                        {!!discount && (
                          <span className="absolute left-1.5 sm:left-2 top-1.5 sm:top-2 bg-red-600 text-white text-[9px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded z-10">{discount}% OFF</span>
                        )}
                        <img src={sp.imageUrl} alt={sp.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="p-2 sm:p-2.5 md:p-3 space-y-1 sm:space-y-1.5 flex flex-col h-full">
                        <div className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-gray-700 flex-shrink-0">{sp.name}</div>
                        {sp.description && (
                          <div className="text-[9px] sm:text-[10px] md:text-[11px] text-gray-600 line-clamp-2 flex-shrink-0">{sp.description}</div>
                        )}
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 pt-0.5 sm:pt-1 mt-auto">
                          <div className="text-orange-600 font-semibold text-[11px] sm:text-xs md:text-sm">₹{sp.price.toLocaleString()}</div>
                          {sp.originalPrice && sp.originalPrice > sp.price && (
                            <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 line-through">₹{sp.originalPrice.toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
