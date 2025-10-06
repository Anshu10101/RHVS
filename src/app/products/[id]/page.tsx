'use client';

import { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    // load categories for mapping id -> name
    (async () => {
      try {
        const res = await fetch('/api/content/store/categories', { cache: 'no-store' });
        const data = await res.json();
        if (data?.success && Array.isArray(data.categories)) {
          const map: Record<string, string> = {};
          for (const c of data.categories) {
            map[String(c.id)] = c.name;
          }
          setCategoryMap(map);
        }
      } catch {}
    })();
    const loadProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
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
    };

    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

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
        category: (product.category as unknown as string) || 'General',
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/products')} className="flex items-center gap-2">
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
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/products')}
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
            <div className="flex items-center gap-2">
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleShare} className="hover:bg-gray-100">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images - sticky column */}
          <div className="space-y-4 lg:sticky lg:top-24 self-start">
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
              <div className="grid grid-cols-5 gap-3 overflow-x-auto md:overflow-visible no-scrollbar">
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
          <div className="space-y-6">
            {/* Category & Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">{categoryLabel}</Badge>
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="px-2 py-0.5 text-xs">{tag}</Badge>
              ))}
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
              <p className="text-gray-600 text-base leading-relaxed">{product.description}</p>
            </div>

            {/* Rating removed per request */}
            <div className="h-2" />

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-orange-600 tracking-tight">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    {discount}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">In Stock ({product.stock} available)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700">
                  <Minus className="h-4 w-4" />
                  <span className="font-medium">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-10 w-10 hover:bg-gray-100"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[3rem] text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="h-10 w-10 hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || addingToCart}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 h-12 text-base font-semibold shadow hover:shadow-md transition-all duration-200"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
              </div>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-4 text-gray-900">Key Features</h3>
                  <ul className="space-y-3">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-base leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-4 text-gray-900">Specifications</h3>
                  <ul className="divide-y divide-gray-200">
                    {Object.entries(product.specifications).map(([key, value]) => {
                      const Icon = getSpecIcon(key);
                      return (
                        <li key={key} className="flex items-center gap-3 py-3">
                          <Icon className="h-5 w-5 text-slate-600 flex-shrink-0" />
                          <div className="flex-1 flex items-center justify-between">
                            <span className="font-medium text-gray-700">{key}</span>
                            <span className="text-gray-900">{value}</span>
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
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-4 text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Seller Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium">{product.seller_name}</p>
                        {product.seller_business_name && (
                          <p className="text-gray-600 text-sm flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {product.seller_business_name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {product.seller_phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-medium">Contact: {product.seller_phone}</p>
                          <p className="text-gray-600 text-sm">Call for inquiries and orders</p>
                        </div>
                      </div>
                    )}
                    
                    {product.seller_whatsapp && (
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="font-medium">WhatsApp: {product.seller_whatsapp}</p>
                          <p className="text-gray-600 text-sm">Quick messaging available</p>
                        </div>
                      </div>
                    )}
                    
                    {product.seller_email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <div>
                          <p className="font-medium">Email: {product.seller_email}</p>
                          <p className="text-gray-600 text-sm">Email for detailed inquiries</p>
                        </div>
                      </div>
                    )}
                    
                    {product.seller_delivery_info && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
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
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Delivery & Returns</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Free Delivery</p>
                      <p className="text-gray-600 text-sm">On orders above ₹500</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Secure Payment</p>
                      <p className="text-gray-600 text-sm">100% secure payment processing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RotateCcw className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Easy Returns</p>
                      <p className="text-gray-600 text-sm">30-day return policy</p>
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
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setIsLightboxOpen(false)}>
          <button
            className="absolute left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-3xl"
            onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => Math.max(i - 1, 0)); }}
          >
            ‹
          </button>
          <img src={images[selectedImage]} alt={product.name} className="max-w-[95vw] max-h-[95vh] object-contain" />
          <button
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-3xl"
            onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => Math.min(i + 1, images.length - 1)); }}
          >
            ›
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
