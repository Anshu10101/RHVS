"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
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
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="bg-orange-50 pt-10 pb-0">
      <div className="container mx-auto px-4 mb-6">
        <div className="relative flex items-center justify-between md:justify-center mb-8">
          <div className="md:text-center">
            <div className="flex items-center justify-start md:justify-center gap-2 mb-3">
              <ShoppingBag className="h-6 w-6 text-orange-500" />
              <p className="text-sm uppercase tracking-widest text-orange-600 font-semibold">Products Store</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-orange-900 mb-2">
              प्रमुख उत्पाद
            </h2>
            <p className="text-gray-600 text-sm md:text-base">Premium quality products handpicked for you</p>
          </div>
          <Link
            href="/products?featured=1"
            className="absolute right-0 text-sm font-semibold text-orange-700 hover:text-orange-800 hover:underline whitespace-nowrap"
            aria-label="View all featured products"
          >
            View All / सभी देखें →
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


