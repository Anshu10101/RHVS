// Product types and interfaces
export interface Product {
  id: number;
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
  inStock: boolean;
  rating: number;
  reviews: number;
  discount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
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
