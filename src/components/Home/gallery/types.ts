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
  isVideo?: boolean;
  youtubeVideoId?: string;
  youtubeVideoUrl?: string;
}

// Helper function to extract YouTube video ID from URL
function getYouTubeVideoId(url: string | undefined): string | null {
  if (!url || !url.trim()) return null;
  
  const trimmedUrl = url.trim();
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/|m\.youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/, // YouTube Shorts
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  if (trimmedUrl.includes('embed/')) {
    const embedMatch = trimmedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch && embedMatch[1]) {
      return embedMatch[1];
    }
  }
  
  if (trimmedUrl.includes('/shorts/')) {
    const shortsMatch = trimmedUrl.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch && shortsMatch[1]) {
      return shortsMatch[1];
    }
  }
  
  return null;
}

// Helper function to convert Photo to GalleryImage
export function photoToGalleryImage(photo: Photo): GalleryImage | null {
  // Generate a unique numeric ID from the photo.id string
  // Use a simple hash function to convert string ID to number
  const generateNumericId = (str: string): number => {
    if (!str) return Date.now();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Ensure positive number and add timestamp component for uniqueness
    const positiveHash = Math.abs(hash);
    return positiveHash > 0 ? positiveHash : Date.now() + Math.random() * 1000;
  };

  const numericId = generateNumericId(photo.id);

  // Check if it's a video - be more lenient with the check
  const isVideo = photo.isVideo === true || (photo.youtubeVideoUrl && !photo.filePath);
  if (isVideo && photo.youtubeVideoUrl) {
    const videoId = getYouTubeVideoId(photo.youtubeVideoUrl);
    if (!videoId) {
      console.warn('[photoToGalleryImage] Failed to extract YouTube video ID from URL:', photo.youtubeVideoUrl, 'Photo ID:', photo.id);
      return null;
    }
    
    return {
      id: numericId,
      src: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, // YouTube thumbnail
      alt: photo.caption || photo.filename || 'Gallery Video',
      title: photo.caption || photo.filename || 'Untitled Video',
      description: photo.description || photo.caption || '',
      category: 'General',
      aspectRatio: 'wide',
      date: photo.createdAt ? new Date(photo.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      tags: photo.tags || [],
      isVideo: true,
      youtubeVideoId: videoId,
      youtubeVideoUrl: photo.youtubeVideoUrl,
    };
  } else if (photo.youtubeVideoUrl && !photo.filePath) {
    // Fallback: if there's a YouTube URL but no file path, treat as video even if isVideo flag is not set
    const videoId = getYouTubeVideoId(photo.youtubeVideoUrl);
    if (videoId) {
      return {
        id: numericId,
        src: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        alt: photo.caption || photo.filename || 'Gallery Video',
        title: photo.caption || photo.filename || 'Untitled Video',
        description: photo.description || photo.caption || '',
        category: 'General',
        aspectRatio: 'wide',
        date: photo.createdAt ? new Date(photo.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        tags: photo.tags || [],
        isVideo: true,
        youtubeVideoId: videoId,
        youtubeVideoUrl: photo.youtubeVideoUrl,
      };
    }
  }
  
  // Ensure we have a valid src path for images
  const src = photo.filePath || photo.thumbnailPath || '';
  
  // Skip photos with empty src to prevent the empty string error
  if (!src) {
    return null;
  }

  return {
    id: numericId,
    src: src,
    alt: photo.caption || photo.filename || 'Gallery Image',
    title: photo.caption || photo.filename || 'Untitled',
    description: photo.description || photo.caption || '',
    category: 'General', // Default category since Photo doesn't have gallery info
    aspectRatio: 'square', // Default since we don't have dimensions in Photo interface
    date: photo.createdAt ? new Date(photo.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    tags: photo.tags || [],
    isVideo: false,
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
