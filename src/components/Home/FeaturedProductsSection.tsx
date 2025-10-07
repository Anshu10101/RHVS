"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FeaturedProductsMarquee from "@/components/Home/Product/FeaturedProductsMarquee";
import type { Product as FullProduct } from "@/components/Home/Product/types";

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
  const [products, setProducts] = useState<FullProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/content/store', { cache: 'no-store' });
        const data = await res.json();
        if (!mounted) return;
        if (data?.success && Array.isArray(data.products)) {
          // Normalize to FullProduct type and filter featured
          const normalized: FullProduct[] = (data.products as any[]).map((p, i) => ({
            id: Number(String(p.id).replace(/\D/g, '')) || i + 1,
            detailId: String(p.id),
            name: p.name ?? 'Product',
            nameHindi: p.nameHindi ?? p.name ?? 'उत्पाद',
            description: p.description ?? '',
            price: Number(p.price ?? 0),
            originalPrice: p.original_price != null ? Number(p.original_price) : undefined,
            category: typeof p.category === 'string' ? p.category : (p.category?.name ?? 'General'),
            image: p.image_url || p.imageUrl || p.image_path || '/product/p1.jpg',
            images: p.images && Array.isArray(p.images) ? p.images : [p.image_url || p.imageUrl || p.image_path || '/product/p1.jpg'],
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
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-10">
      <div className="container mx-auto px-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 rounded bg-orange-600" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-sm text-gray-600 leading-tight">विशेष उत्पाद • बेहतरीन ऑफ़र्स</p>
          </div>
        </div>
        <Link
          href="/products?featured=1"
          className="text-sm font-medium text-orange-700 hover:text-orange-800 hover:underline"
          aria-label="View all featured products"
        >
          View All / सभी देखें
        </Link>
      </div>

      {!loading && (
        <FeaturedProductsMarquee
          products={products}
          onProductClick={(p) => router.push(`/products/${encodeURIComponent(String((p as any).detailId || p.id))}`)}
        />
      )}
    </section>
  );
}


