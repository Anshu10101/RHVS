"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import FeaturedProductsMarquee from "@/components/Home/Product/FeaturedProductsMarquee";
import type { Product as FullProduct } from "@/components/Home/Product/types";
import { Noto_Serif_Devanagari } from 'next/font/google';
import { useLanguage } from '@/contexts/LanguageContext';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

type Product = {
  id: number;
  name: string;
  nameHindi?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category?: string;
  image?: string;
  imageUrl?: string;
  isFeatured?: boolean;
};

export default function FeaturedProductsSection() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<FullProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadProducts = useCallback(async () => {
    let mounted = true;
    try {
      const res = await fetch(`/api/content/store?_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      const data = await res.json();
      if (!mounted) return;
      if (data?.success && Array.isArray(data.products)) {
        // Normalize to FullProduct type and filter featured
        const normalized: FullProduct[] = (data.products as Array<Record<string, unknown>>).map((p, i) => ({
          id: Number(String(p.id).replace(/\D/g, '')) || i + 1,
          detailId: String(p.id),
          name: (typeof p.name === 'string' && p.name) ? p.name : 'Product',
          nameHindi: (typeof p.nameHindi === 'string' && p.nameHindi) ? p.nameHindi : ((typeof p.name === 'string' && p.name) ? p.name : 'उत्पाद'),
          description: (typeof p.description === 'string' && p.description) ? p.description : '',
          price: Number(p.price ?? 0),
          originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
          category: (typeof p.category === 'string' && p.category) ? p.category : ((p.category as any)?.name ?? 'General'), // eslint-disable-line @typescript-eslint/no-explicit-any
          image: (typeof p.image_url === 'string' && p.image_url) || (typeof p.imageUrl === 'string' && p.imageUrl) || (typeof p.image_path === 'string' && p.image_path) || '/product/p1.jpg',
          images: p.images && Array.isArray(p.images) ? p.images : [(typeof p.image_url === 'string' && p.image_url) || (typeof p.imageUrl === 'string' && p.imageUrl) || (typeof p.image_path === 'string' && p.image_path) || '/product/p1.jpg'],
          features: Array.isArray(p.features) ? p.features : [],
          tags: Array.isArray(p.tags) ? p.tags : [],
          inStock: typeof p.stock === 'number' ? p.stock > 0 : true,
          rating: typeof p.rating === 'number' ? p.rating : undefined,
          reviews: typeof p.reviews === 'number' ? p.reviews : undefined,
          discount: typeof p.discount === 'number' ? p.discount : undefined,
          isNew: !!p.isNew,
          isFeatured: !!p.is_featured || !!p.isFeatured,
        }));
        setProducts(normalized.filter(p => p.isFeatured));
      }
    } catch (_) {
      // swallow
    } finally {
      if (mounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();

    // Reload when page becomes visible (user returns from admin panel or switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProducts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadProducts]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="bg-orange-50 pt-10 pb-0">
      <div className="container mx-auto px-4 mb-6">
        <div className="relative mb-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-300" />
              <span className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-orange-600/80">
                {t('products.title')}
              </span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-300" />
            </div>
            <h2 className={`${devanagari.className} text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-gray-900 leading-tight`}>
              {t('products.home.featured')}
            </h2>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              {t('products.description')}
            </p>
          </div>
          <Link
            href="/products?featured=1"
            className="absolute top-0 right-0 text-xs sm:text-sm font-semibold text-orange-700 hover:text-orange-800 hover:underline whitespace-nowrap"
            aria-label={t('products.viewAll')}
          >
            {t('products.viewAll')} →
          </Link>
        </div>
      </div>

      {!loading && (
        <FeaturedProductsMarquee
          products={products}
          onProductClick={(p) => router.push(`/products/${encodeURIComponent(String((p as FullProduct & { detailId?: string }).detailId || p.id))}`)}
        />
      )}
    </section>
  );
}


