// Gallery types and interfaces
import { Photo } from '@/lib/content';

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

// Helper function to convert Photo to GalleryImage
export function photoToGalleryImage(photo: Photo): GalleryImage | null {
  // Ensure we have a valid src path
  const src = photo.filePath || photo.thumbnailPath || '';
  
  // Skip photos with empty src to prevent the empty string error
  if (!src) {
    return null;
  }

  return {
    id: parseInt(photo.id) || 0,
    src: src,
    alt: photo.caption || photo.filename || 'Gallery Image',
    title: photo.caption || photo.filename || 'Untitled',
    description: photo.caption || '',
    category: 'General', // Default category since Photo doesn't have gallery info
    aspectRatio: 'square', // Default since we don't have dimensions in Photo interface
    date: photo.createdAt ? new Date(photo.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    tags: photo.tags || [],
  };
}

export interface SortOption {
  value: string;
  label: string;
}

export interface StateOption {
  id: string;
  name: string;
}

export interface DistrictOption {
  id: string;
  name: string;
}

export interface GalleryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  sortOptions: SortOption[];
  sortBy: string;
  onSortChange: (sort: string) => void;
  stateOptions?: StateOption[];
  districtOptions?: DistrictOption[];
  selectedStateId?: string;
  selectedStateName?: string;
  selectedDistrictId?: string;
  selectedDistrictName?: string;
  onStateChange?: (stateId: string, stateName: string) => void;
  onDistrictChange?: (districtId: string, districtName: string) => void;
  events?: string[];
  selectedEvent?: string;
  onEventChange?: (event: string) => void;
  variant?: 'desktop' | 'mobile';
  onCloseMobile?: () => void;
  className?: string;
}

export interface GalleryGridProps {
  images: GalleryImage[];
  favorites: number[];
  onImageClick: (image: GalleryImage) => void;
  onToggleFavorite: (id: number) => void;
  onResetFilters?: () => void;
}

export interface ImageModalProps {
  image: GalleryImage | null;
  images: GalleryImage[];
  isOpen: boolean;
  onClose: () => void;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}
