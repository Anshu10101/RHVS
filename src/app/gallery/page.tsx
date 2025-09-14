"use client";

import { useState, useEffect } from 'react';
import { GalleryHeader, GalleryFilter, GalleryGrid, ImageModal } from '@/components/Home/gallery';
import type { GalleryImage } from '@/components/Home/gallery/types';

// Default gallery data for fallback
const defaultGalleryImages = [
  {
    id: 1,
    src: '/gallery/p1.jpg',
    alt: 'RHVS Community Event',
    title: 'सामुदायिक कार्यक्रम',
    description: 'Community members coming together for a special event',
    category: 'Community',
    aspectRatio: 'wide' as const,
    date: '2024-01-15',
    tags: ['event', 'community', 'gathering']
  },
  {
    id: 2,
    src: '/gallery/p2.jpg',
    alt: 'Spiritual Gathering',
    title: 'आध्यात्मिक सभा',
    description: 'Devotees gathered for spiritual discourse and prayers',
    category: 'Spiritual',
    aspectRatio: 'tall' as const,
    date: '2024-01-20',
    tags: ['spiritual', 'prayer', 'discourse']
  },
  {
    id: 3,
    src: '/gallery/p3.jpg',
    alt: 'Cultural Celebration',
    title: 'सांस्कृतिक उत्सव',
    description: 'Celebrating our rich cultural heritage and traditions',
    category: 'Culture',
    aspectRatio: 'square' as const,
    date: '2024-02-10',
    tags: ['culture', 'celebration', 'festival']
  },
  {
    id: 4,
    src: '/gallery/p4.jpg',
    alt: 'Religious Ceremony',
    title: 'धार्मिक अनुष्ठान',
    description: 'Sacred rituals and religious ceremonies',
    category: 'Spiritual',
    aspectRatio: 'wide' as const,
    date: '2024-02-15',
    tags: ['ceremony', 'ritual', 'sacred']
  },
  {
    id: 5,
    src: '/gallery/p5.jpg',
    alt: 'Community Service',
    title: 'सामुदायिक सेवा',
    description: 'Serving the community with dedication and love',
    category: 'Community',
    aspectRatio: 'tall' as const,
    date: '2024-02-25',
    tags: ['service', 'community', 'volunteer']
  },
  {
    id: 6,
    src: '/gallery/p6.jpg',
    alt: 'Educational Program',
    title: 'शैक्षिक कार्यक्रम',
    description: 'Educational initiatives for community development',
    category: 'Education',
    aspectRatio: 'square' as const,
    date: '2024-03-05',
    tags: ['education', 'learning', 'development']
  },
  {
    id: 7,
    src: '/gallery/p7.jpg',
    alt: 'Festival Celebration',
    title: 'त्योहार उत्सव',
    description: 'Joyous celebration of Hindu festivals and traditions',
    category: 'Culture',
    aspectRatio: 'wide' as const,
    date: '2024-03-15',
    tags: ['festival', 'celebration', 'tradition']
  },
  {
    id: 8,
    src: '/gallery/p8.jpg',
    alt: 'Youth Program',
    title: 'युवा कार्यक्रम',
    description: 'Engaging youth in cultural and spiritual activities',
    category: 'Youth',
    aspectRatio: 'tall' as const,
    date: '2024-03-20',
    tags: ['youth', 'engagement', 'activity']
  },
  {
    id: 9,
    src: '/gallery/p9.jpg',
    alt: 'Religious Discourse',
    title: 'धार्मिक प्रवचन',
    description: 'Spiritual teachings and religious discourse',
    category: 'Spiritual',
    aspectRatio: 'square' as const,
    date: '2024-03-25',
    tags: ['discourse', 'teaching', 'spiritual']
  },
  {
    id: 10,
    src: '/gallery/p10.jpg',
    alt: 'Community Outreach',
    title: 'सामुदायिक पहुंच',
    description: 'Reaching out to serve and connect with the community',
    category: 'Community',
    aspectRatio: 'wide' as const,
    date: '2024-04-01',
    tags: ['outreach', 'community', 'connection']
  },
  {
    id: 11,
    src: '/gallery/p11.jpg',
    alt: 'Cultural Heritage',
    title: 'सांस्कृतिक विरासत',
    description: 'Preserving and promoting our ancient cultural heritage',
    category: 'Heritage',
    aspectRatio: 'tall' as const,
    date: '2024-04-10',
    tags: ['heritage', 'culture', 'preservation']
  },
  {
    id: 12, 
    src: '/gallery/p12.jpg',
    alt: 'Cultural Heritage',
    title: 'सांस्कृतिक विरासत',
    description: 'Preserving and promoting our ancient cultural heritage',
    category: 'Heritage',
    aspectRatio: 'tall' as const,
    date: '2024-04-10',
    tags: ['heritage', 'culture', 'preservation']
  },
  {
    id: 13,
    src: '/gallery/p13.jpg',
    alt: 'Cultural Heritage',
    title: 'सांस्कृतिक विरासत',
    description: 'Preserving and promoting our ancient cultural heritage',
    category: 'Heritage',
    aspectRatio: 'tall' as const,
    date: '2024-04-10',
    tags: ['heritage', 'culture', 'preservation']
  }
];

const categories = ['All', 'Community', 'Spiritual', 'Culture', 'Education', 'Youth', 'Heritage'];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'alphabetical', label: 'A-Z' },
  { value: 'reverse-alphabetical', label: 'Z-A' },
  { value: 'category', label: 'By Category' },
  { value: 'favorites', label: 'Favorites First' },
  { value: 'date', label: 'By Date' }
];

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [galleryImages, setGalleryImages] = useState(defaultGalleryImages);
  const [filteredImages, setFilteredImages] = useState(defaultGalleryImages);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Load gallery data from API
  useEffect(() => {
    const loadGalleryData = async () => {
      try {
        const response = await fetch('/api/content/gallery');
        const data = await response.json();
        
        if (data.success && data.images && data.images.length > 0) {
          // Transform database images to gallery format
          const transformedImages = data.images.map((img: any, index: number) => ({
            id: parseInt(img.id.replace(/\D/g, '')) || index + 1,
            src: img.imageUrl || `/gallery/p${(index % 13) + 1}.jpg`,
            alt: img.title || 'Gallery Image',
            title: img.title || 'Untitled',
            description: img.description || '',
            category: img.tags && img.tags.length > 0 ? img.tags[0].charAt(0).toUpperCase() + img.tags[0].slice(1) : 'Community',
            aspectRatio: ['wide', 'tall', 'square'][index % 3] as 'wide' | 'tall' | 'square',
            date: new Date(img.createdAt).toISOString().split('T')[0],
            tags: img.tags || []
          }));
          
          setGalleryImages(transformedImages);
          setFilteredImages(transformedImages);
        }
      } catch (error) {
        console.error('Error loading gallery data:', error);
        // Use default images on error
        setGalleryImages(defaultGalleryImages);
        setFilteredImages(defaultGalleryImages);
      } finally {
        setLoading(false);
      }
    };

    loadGalleryData();
  }, []);

  // Filter and sort images
  useEffect(() => {
    let filtered = galleryImages;
    
    // Filter by category
    if (activeCategory !== 'All') {
      filtered = filtered.filter(img => img.category === activeCategory);
    }
    
    // Sort images
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.id - a.id; // Higher ID = newer
        case 'oldest':
          return a.id - b.id; // Lower ID = older
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'reverse-alphabetical':
          return b.title.localeCompare(a.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'favorites':
          const aIsFavorite = favorites.includes(a.id);
          const bIsFavorite = favorites.includes(b.id);
          if (aIsFavorite && !bIsFavorite) return -1;
          if (!aIsFavorite && bIsFavorite) return 1;
          return b.id - a.id; // Secondary sort by newest
        default:
          return 0;
      }
    });
    
    setFilteredImages(filtered);
  }, [activeCategory, sortBy, favorites]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(favId => favId !== id)
        : [...prev, id]
    );
  };

  const openModal = (image: GalleryImage) => {
    setSelectedImage(image);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <GalleryHeader />
      
      <GalleryFilter 
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        sortOptions={sortOptions}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      
      <GalleryGrid 
        images={filteredImages}
        favorites={favorites}
        onImageClick={openModal}
        onToggleFavorite={toggleFavorite}
      />
      
      <ImageModal 
        image={selectedImage}
        isOpen={!!selectedImage}
        onClose={closeModal}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
