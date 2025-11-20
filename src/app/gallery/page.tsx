"use client";

import { useState, useEffect } from 'react';
import { GalleryHeader, GalleryFilter, GalleryGrid, ImageModal } from '@/components/Home/gallery';
import type { GalleryImage } from '@/components/Home/gallery/types';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';


const categories: string[] = [];
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
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedStateName, setSelectedStateName] = useState<string>('All');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('All');
  const [stateOptions, setStateOptions] = useState<Array<{id: string; name: string}>>([]);
  const [districtOptions, setDistrictOptions] = useState<Array<{id: string; name: string}>>([]);
  const [selectedEvent, setSelectedEvent] = useState('All');
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [allImages, setAllImages] = useState<GalleryImage[]>([]); // Store all images for modal navigation

  const resetFilters = () => {
    setSelectedStateId('');
    setSelectedStateName('All');
    setSelectedDistrictId('');
    setSelectedDistrictName('All');
    setDistrictOptions([]);
    setSelectedEvent('All');
    setSortBy('newest');
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileFilterOpen]);

  // Load gallery data from API
  useEffect(() => {
    const loadGalleryData = async () => {
      try {
        // Load states for filters
        const statesRes = await fetch('/api/states', { cache: 'no-store' });
        const statesData = await statesRes.json();
        if (statesData?.success && Array.isArray(statesData.data)) {
          const opts = statesData.data.map((s: { id: number; name: string }) => ({ id: String(s.id), name: String(s.name) }));
          setStateOptions(opts);
        }

        // Load filter options
        const filtersResponse = await fetch('/api/public/photos/filters');
        const filtersData = await filtersResponse.json();
        
        if (filtersData.success) {
          setAvailableEvents(['All', ...(filtersData.events || [])]);
        }

        // Load photos with current filters and pagination
        const params = new URLSearchParams();
        if (selectedStateName !== 'All') params.append('state', selectedStateName);
        if (selectedDistrictName !== 'All') params.append('district', selectedDistrictName);
        if (selectedDistrictId && selectedDistrictId !== '') params.append('districtId', selectedDistrictId);
        if (selectedEvent !== 'All') params.append('event', selectedEvent);
        params.append('page', currentPage.toString());
        params.append('limit', '24'); // 24 images per page - optimal for performance
        
        const response = await fetch(`/api/public/photos?${params}`);
        const data = await response.json();
        
        if (data.success && data.images) {
          console.log(`Loaded page ${data.page}: ${data.images.length} images (Total: ${data.total})`);
          
          // Update pagination info
          setTotalPages(data.totalPages || 1);
          setTotalImages(data.total || 0);
          
          // For modal navigation, we need to fetch all images (or at least a larger set)
          // But for display, we only show the current page
          setGalleryImages(data.images);
          setFilteredImages(data.images);
          
          // Store all images for modal navigation (accumulate across pages)
          // Note: For better performance with thousands of images, modal navigation could be limited to current page
          setAllImages(data.images);
        } else {
          console.log('No images from new API, showing empty state');
          setGalleryImages([]);
          setFilteredImages([]);
          setAllImages([]);
          setTotalPages(1);
          setTotalImages(0);
        }
      } catch (error) {
        console.error('Error loading gallery data:', error);
        // Show empty state on error instead of fallback images
        setGalleryImages([]);
        setFilteredImages([]);
      } finally {
        setLoading(false);
      }
    };

    loadGalleryData();
  }, [selectedStateName, selectedDistrictName, selectedDistrictId, selectedEvent, currentPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStateName, selectedDistrictName, selectedDistrictId, selectedEvent]);

  // Note: Sorting is now handled server-side via API, but we keep client-side sorting for favorites
  // If you want server-side sorting, you'd need to add a sort parameter to the API
  useEffect(() => {
    let filtered = [...galleryImages];
    
    // Only apply favorites sorting on client side (server doesn't know favorites)
    if (sortBy === 'favorites') {
      filtered = filtered.sort((a, b) => {
        const aIsFavorite = favorites.includes(a.id);
        const bIsFavorite = favorites.includes(b.id);
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return b.id - a.id; // Secondary sort by newest
      });
    }
    
    setFilteredImages(filtered);
  }, [sortBy, favorites, galleryImages]);

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

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedImage || filteredImages.length === 0) return;
    
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
    if (currentIndex === -1) return;

    let newIndex: number;
    if (direction === 'prev') {
      // Wrap around: if at first image, go to last
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1;
    } else {
      // Wrap around: if at last image, go to first
      newIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0;
    }

    setSelectedImage(filteredImages[newIndex]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading gallery...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the latest photos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <GalleryHeader />
      
      {/* Mobile filter trigger */}
      <div className="md:hidden sticky top-0 z-40 px-4 pt-3">
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Open gallery filters"
            aria-expanded={isMobileFilterOpen}
            onClick={() => setIsMobileFilterOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <Menu size={18} />
            <span className="sr-only">Filters</span>
          </button>
        </div>
      </div>
      
      {/* Desktop filters */}
      <GalleryFilter 
        className="hidden md:block"
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        sortOptions={sortOptions}
        sortBy={sortBy}
        onSortChange={setSortBy}
        stateOptions={stateOptions}
        districtOptions={districtOptions}
        selectedStateId={selectedStateId}
        selectedStateName={selectedStateName}
        selectedDistrictId={selectedDistrictId}
        selectedDistrictName={selectedDistrictName}
        onStateChange={async (stateId, stateName) => {
          setSelectedStateId(stateId);
          setSelectedStateName(stateName);
          if (stateId) {
            const res = await fetch(`/api/districts?stateId=${encodeURIComponent(stateId)}`, { cache: 'no-store' });
            const data = await res.json();
            if (data?.success && Array.isArray(data.data)) {
              const dOpts = data.data.map((d: { id: number; name: string }) => ({ id: String(d.id), name: String(d.name) }));
              setDistrictOptions(dOpts);
              setSelectedDistrictId('');
              setSelectedDistrictName('All');
            } else {
              setDistrictOptions([]);
              setSelectedDistrictId('');
              setSelectedDistrictName('All');
            }
          } else {
            setDistrictOptions([]);
            setSelectedDistrictId('');
            setSelectedDistrictName('All');
          }
        }}
        onDistrictChange={(districtId, districtName) => {
          setSelectedDistrictId(districtId);
          setSelectedDistrictName(districtName);
        }}
        events={availableEvents}
        selectedEvent={selectedEvent}
        onEventChange={setSelectedEvent}
      />

      {/* Mobile filter overlay */}
      {isMobileFilterOpen && (
        <GalleryFilter
          variant="mobile"
          onCloseMobile={() => setIsMobileFilterOpen(false)}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={(category) => {
            setActiveCategory(category);
          }}
          sortOptions={sortOptions}
          sortBy={sortBy}
          onSortChange={setSortBy}
          stateOptions={stateOptions}
          districtOptions={districtOptions}
          selectedStateId={selectedStateId}
          selectedStateName={selectedStateName}
          selectedDistrictId={selectedDistrictId}
          selectedDistrictName={selectedDistrictName}
          onStateChange={async (stateId, stateName) => {
            setSelectedStateId(stateId);
            setSelectedStateName(stateName);
            if (stateId) {
              const res = await fetch(`/api/districts?stateId=${encodeURIComponent(stateId)}`, { cache: 'no-store' });
              const data = await res.json();
              if (data?.success && Array.isArray(data.data)) {
                const dOpts = data.data.map((d: { id: number; name: string }) => ({ id: String(d.id), name: String(d.name) }));
                setDistrictOptions(dOpts);
                setSelectedDistrictId('');
                setSelectedDistrictName('All');
              } else {
                setDistrictOptions([]);
                setSelectedDistrictId('');
                setSelectedDistrictName('All');
              }
            } else {
              setDistrictOptions([]);
              setSelectedDistrictId('');
              setSelectedDistrictName('All');
            }
          }}
          onDistrictChange={(districtId, districtName) => {
            setSelectedDistrictId(districtId);
            setSelectedDistrictName(districtName);
          }}
          events={availableEvents}
          selectedEvent={selectedEvent}
          onEventChange={setSelectedEvent}
        />
      )}
      
      <GalleryGrid 
        images={filteredImages}
        favorites={favorites}
        onImageClick={openModal}
        onToggleFavorite={toggleFavorite}
        onResetFilters={resetFilters}
      />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{(currentPage - 1) * 24 + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(currentPage * 24, totalImages)}</span> of{' '}
              <span className="font-semibold">{totalImages}</span> images
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 min-w-[40px] text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-orange-600 text-white'
                          : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ImageModal 
        image={selectedImage}
        images={filteredImages}
        isOpen={!!selectedImage}
        onClose={closeModal}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onNavigate={handleNavigate}
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
