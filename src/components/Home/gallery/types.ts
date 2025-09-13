// Gallery types and interfaces
export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  title: string;
  description: string;
  category: string;
  aspectRatio: 'tall' | 'wide' | 'square';
  date: string;
  tags: string[];
}

export interface SortOption {
  value: string;
  label: string;
}

export interface GalleryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  sortOptions: SortOption[];
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export interface GalleryGridProps {
  images: GalleryImage[];
  favorites: number[];
  onImageClick: (image: GalleryImage) => void;
  onToggleFavorite: (id: number) => void;
}

export interface ImageModalProps {
  image: GalleryImage | null;
  isOpen: boolean;
  onClose: () => void;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
}
