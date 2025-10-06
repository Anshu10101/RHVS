// Product types and interfaces
export interface Product {
  id: number;
  // Backend product id for deep link/details
  detailId?: string;
  name: string;
  nameHindi: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  images: string[];
  features: string[];
  tags: string[];
  state?: string;
  district?: string;
  inStock: boolean;
  rating?: number; // removed from UI, keep optional for compatibility
  reviews?: number; // removed from UI, keep optional for compatibility
  discount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  // Seller information
  seller_name?: string;
  seller_phone?: string;
  seller_whatsapp?: string;
  seller_email?: string;
  seller_business_name?: string;
  seller_delivery_info?: string;
}

export interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onToggleFavorite: (productId: number) => void;
  isFavorite: boolean;
}

export interface ProductGridProps {
  products: Product[];
  favorites: number[];
  onProductClick: (product: Product) => void;
  onToggleFavorite: (productId: number) => void;
}

export interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productId: number) => void;
  onToggleFavorite: (productId: number) => void;
  isFavorite: boolean;
}

export interface ProductHeaderProps {
  title: string;
  titleHindi: string;
  description: string;
  totalProducts: number;
}
