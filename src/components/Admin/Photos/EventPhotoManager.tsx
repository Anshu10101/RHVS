'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Camera, Upload, Plus, Search, Filter, Grid, List, Settings, Eye, EyeOff, Trash2, Edit3, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SortAsc, SortDesc, Maximize2, Minimize2 } from 'lucide-react';
import { PhotoEvent, PhotoGallery, Photo } from '@/lib/content';
import { notifications } from '@/lib/notifications';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EventPhotoManagerProps {
  hasPermission: (permission: string) => boolean;
}

export function EventPhotoManager({ hasPermission }: EventPhotoManagerProps) {
  const { t } = useLanguage();
  const [events, setEvents] = useState<PhotoEvent[]>([]);
  const [galleries, setGalleries] = useState<PhotoGallery[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('all');
  const [filterState, setFilterState] = useState<string>('');
  const [filterDistrict, setFilterDistrict] = useState<string>('');
  const [availableStates, setAvailableStates] = useState<{id: number, name: string, code: string}[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<{id: number, name: string, code: string, state_code: string}[]>([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<PhotoEvent | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  // Pagination states
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPerPage] = useState(10);
  const [eventsSortBy, setEventsSortBy] = useState<'name' | 'date' | 'photos'>('date');
  const [eventsSortOrder, setEventsSortOrder] = useState<'asc' | 'desc'>('desc');
  const [compactMode, setCompactMode] = useState(false);

  // Photo list management (search, sort, pagination)
  const [photoSearch, setPhotoSearch] = useState('');
  const [photosSortBy, setPhotosSortBy] = useState<'name' | 'date' | 'type'>('date');
  const [photosSortOrder, setPhotosSortOrder] = useState<'asc' | 'desc'>('desc');
  const [photosPage, setPhotosPage] = useState(1);
  const [photosPerPage, setPhotosPerPage] = useState(24);

  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    variant: 'default' | 'destructive';
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
    onConfirm: null
  });

  const showConfirmation = (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
  }, onConfirm: () => void) => {
    setConfirmationState({
      isOpen: true,
      title: options.title,
      description: options.description,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'default',
      onConfirm
    });
  };

  const handleConfirm = () => {
    console.log('Confirmation dialog confirmed, onConfirm function:', confirmationState.onConfirm);
    if (confirmationState.onConfirm) {
      confirmationState.onConfirm();
    }
    setConfirmationState(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const handleCancel = () => {
    setConfirmationState(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const handleBatchDeletePhotos = async (photoIds: string[]) => {
    console.log('=== BATCH DELETE STARTED ===');
    console.log('Photo IDs to delete:', photoIds);
    console.log('Number of photos:', photoIds.length);
    
    showConfirmation({
      title: t('admin.photos.deletePhotos'),
      description: t('admin.photos.deletePhotosConfirm'),
      confirmText: t('admin.photos.delete'),
      cancelText: t('admin.photos.cancel'),
      variant: 'destructive'
    }, async () => {
      console.log('=== BATCH DELETE CONFIRMED ===');
      
      try {
        // Delete photos one by one
        for (const photoId of photoIds) {
          console.log('Deleting photo:', photoId);
          
          const token = localStorage.getItem('admin_token');
          const response = await fetch(`/api/photos/${photoId}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          
          const responseData = await response.json();
          console.log(`Photo ${photoId} delete response:`, responseData);
          
          if (!response.ok) {
            console.error(`Failed to delete photo ${photoId}:`, responseData);
          }
        }
        
        console.log('=== ALL PHOTOS DELETED ===');
        
        // Clear selection
        setSelectedPhotos([]);
        
        // Reload photos and events
        if (selectedGallery) {
          loadPhotos({ galleryId: selectedGallery });
        } else if (selectedEvent) {
          loadPhotos({ eventId: selectedEvent });
        }
        
        loadEvents();
        
        notifications.photoDeleted(photoIds.length);
        
      } catch (error) {
        console.error('=== BATCH DELETE ERROR ===', error);
        notifications.error('Failed to Delete Photos', 'Please try again.');
      }
    });
  };

  // Define loadEvents before it's used
  const loadEvents = useCallback(async () => {
    try {
      // Construct URL with filters for superadmins
      let url = '/api/photos/events';
      const params = new URLSearchParams();
      
      // Convert state/district IDs to names for API call
      if (filterState) {
        const selectedState = availableStates.find(s => s.id.toString() === filterState);
        if (selectedState) {
          params.append('state', selectedState.name);
          console.log('Filtering by state:', selectedState.name);
        }
      }
      
      if (filterDistrict) {
        const selectedDistrict = availableDistricts.find(d => d.id.toString() === filterDistrict);
        if (selectedDistrict) {
          params.append('district', selectedDistrict.name);
          console.log('Filtering by district:', selectedDistrict.name);
        }
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // Add cache-busting timestamp
      url += (url.includes('?') ? '&' : '?') + `_t=${Date.now()}`;
      
      console.log('Loading events with URL:', url);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(url, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        console.log('Loaded events:', data.events);
        console.log('Events count:', data.events.length);
        setEvents(data.events);
      } else {
        console.error('Failed to load events:', data.error);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, [filterState, filterDistrict, availableStates, availableDistricts]);

  // Define loadFilters before it's used
  const loadFilters = async () => {
    try {
      console.log('Loading states...');
      // Fetch states using the standard API
      const token = localStorage.getItem('admin_token');
      const statesResponse = await fetch(`/api/states?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const statesData = await statesResponse.json();
      console.log('States response:', statesData);
      if (statesData.success) {
        setAvailableStates(statesData.data || []);
        console.log('States loaded:', statesData.data);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  // Load events and filters on component mount
  useEffect(() => {
    loadEvents();
    loadFilters();
  }, [loadEvents]);

  // Define loadDistricts before it's used
  const loadDistricts = useCallback(async (stateId: string) => {
    if (!stateId) {
      setAvailableDistricts([]);
      return;
    }

    try {
      console.log('Loading districts for state:', stateId);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/districts?stateId=${stateId}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      console.log('Districts response:', data);
      if (data.success) {
        setAvailableDistricts(data.data || []);
        console.log('Districts loaded:', data.data);
      } else {
        setAvailableDistricts([]);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
      setAvailableDistricts([]);
    }
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (filterState) {
      loadDistricts(filterState);
    } else {
      setAvailableDistricts([]);
    }
  }, [filterState, loadDistricts]);

  // Reload events when filters change
  useEffect(() => {
    if (availableStates.length > 0 || availableDistricts.length > 0) {
      loadEvents();
    }
  }, [filterState, filterDistrict, availableStates, availableDistricts, loadEvents]);

  // Reset pagination when filters or search change
  useEffect(() => {
    setEventsPage(1);
  }, [searchQuery, filterStatus, filterState, filterDistrict]);

  const loadGalleries = useCallback(async (eventId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/photos/galleries?eventId=${eventId}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setGalleries(data.galleries);
      }
    } catch (error) {
      console.error('Error loading galleries:', error);
    }
  }, []);

  // Load galleries when event is selected
  useEffect(() => {
    if (selectedEvent) {
      loadGalleries(selectedEvent);
    }
  }, [selectedEvent, loadGalleries]);

  const loadPhotos = useCallback(async (filters: { eventId?: string; galleryId?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters.eventId) params.append('eventId', filters.eventId);
      if (filters.galleryId) params.append('galleryId', filters.galleryId);
      if (searchQuery) params.append('search', searchQuery);

      console.log('Loading photos with filters:', filters);
      console.log('Request URL:', `/api/photos?${params}`);

      // Add cache-busting timestamp
      params.append('_t', Date.now().toString());
      
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/photos?${params}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        console.log('Photos loaded:', data.photos.length, 'photos');
        console.log('Sample photo:', data.photos[0]);
        setPhotos(data.photos);
      } else {
        console.error('Failed to load photos:', data.error);
        // If unauthorized, try to redirect to login
        if (data.error === 'Unauthorized') {
          window.location.href = '/admin/login';
        }
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  }, [searchQuery]);
  
  // Load photos when gallery is selected
  useEffect(() => {
    if (selectedGallery) {
      loadPhotos({ galleryId: selectedGallery });
    } else if (selectedEvent) {
      loadPhotos({ eventId: selectedEvent });
    }
  }, [selectedEvent, selectedGallery, loadPhotos]);

  const createEvent = async (eventData: Record<string, unknown>) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/photos/events?_t=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(eventData)
      });
      const data = await response.json();
      if (data.success) {
        loadEvents();
        setShowCreateEvent(false);
        setSelectedEvent(data.eventId);
        notifications.eventCreated();
      } else {
        notifications.error('Failed to Create Event', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      notifications.error('Error Creating Event', 'Please try again.');
    }
  };
  
  const updateEvent = async (eventData: Record<string, unknown>) => {
    try {
      const id = (eventData as any).id; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!id) {
        notifications.error('Error', 'Event ID is missing');
        return;
      }
      
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/photos/events/${id}?_t=${Date.now()}`, {
        method: 'PUT',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(eventData)
      });
      const data = await response.json();
      if (data.success) {
        loadEvents();
        setShowEditEvent(false);
        setEventToEdit(null);
        notifications.eventUpdated();
      } else {
        notifications.error('Failed to Update Event', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      notifications.error('Error Updating Event', 'Please try again.');
    }
  };


  const deleteEvent = async (eventId: string) => {
    console.log('Delete event called with ID:', eventId);
    
    showConfirmation({
      title: t('admin.photos.deleteEvent'),
      description: t('admin.photos.deleteEventConfirm'),
      confirmText: t('admin.photos.delete'),
      cancelText: t('admin.photos.cancel'),
      variant: 'destructive'
    }, () => {
      performDeleteEvent(eventId);
    });
  };

  const performDeleteEvent = async (eventId: string) => {

    try {
      // Remove any trailing slashes that might be in the eventId
      const cleanEventId = eventId.replace(/\/$/, '');
      console.log('Sending DELETE request to:', `/api/photos/events/${cleanEventId}`);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/photos/events/${cleanEventId}?_t=${Date.now()}`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        await loadEvents();
        setSelectedEvent(null);
        setSelectedGallery(null);
        setPhotos([]);
        notifications.eventDeleted();
      } else {
        console.error('Failed to delete event:', responseData);
        notifications.error('Failed to Delete Event', responseData.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      notifications.error('Error Deleting Event', 'Please try again.');
    }
  };

  const deletePhoto = async (photoId: string) => {
    console.log('Delete photo called with ID:', photoId);
    
    showConfirmation({
      title: t('admin.photos.deletePhoto'),
      description: t('admin.photos.deletePhotoConfirm'),
      confirmText: t('admin.photos.delete'),
      cancelText: t('admin.photos.cancel'),
      variant: 'destructive'
    }, () => {
      performDeletePhoto(photoId);
    });
  };

  const performDeletePhoto = async (photoId: string) => {

    try {
      console.log('Sending DELETE request to:', `/api/photos/${photoId}`);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok && responseData.success) {
        console.log('Photo deleted successfully');
        
        // Reload photos
        if (selectedGallery) {
          await loadPhotos({ galleryId: selectedGallery });
        } else if (selectedEvent) {
          await loadPhotos({ eventId: selectedEvent });
        }
        
        // Also reload events to update photo counts
        await loadEvents();
        
        notifications.photoDeleted(1);
      } else {
        console.error('Failed to delete photo:', responseData);
        notifications.error('Failed to Delete Photo', responseData.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      notifications.error('Error Deleting Photo', 'Please try again.');
    }
  };

  const publishToGallery = async () => {
    try {
      setPublishStatus('publishing');
      
      // Get count of photos that will be published
      const visiblePhotos = photos.filter(p => p.isVisible && p.isApproved);
      
      if (visiblePhotos.length === 0) {
        notifications.warning(t('admin.photos.noPhotosToPublish'), t('admin.photos.noPhotosToPublishDesc'));
        setPublishStatus('error');
        return;
      }
      
      // In a real implementation, we might want to trigger a cache refresh
      // or update a "published" flag. For now, all approved visible photos
      // are automatically available through the public API
      
      setTimeout(() => {
        setPublishStatus('success');
        setTimeout(() => setPublishStatus('idle'), 3000);
      }, 1000);
      
    } catch (error) {
      console.error('Error publishing to gallery:', error);
      setPublishStatus('error');
      setTimeout(() => setPublishStatus('idle'), 3000);
    }
  };

  // Function to automatically determine event status based on date
  const getEventStatus = useCallback((event: PhotoEvent): 'upcoming' | 'ongoing' | 'completed' | 'cancelled' => {
    // If manually set to cancelled, keep it cancelled
    if (event.status === 'cancelled') {
      return 'cancelled';
    }
    
    const now = new Date();
    const eventDate = new Date(event.eventDate);
    
    // Set time to start of day for accurate comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    if (eventDay > today) {
      return 'upcoming';
    } else if (eventDay.getTime() === today.getTime()) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  }, []);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events.filter(event => {
      const matchesSearch = searchQuery === '' || 
        event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const computedStatus = getEventStatus(event);
      const matchesStatus = filterStatus === 'all' || computedStatus === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

    // Sort events
    filtered.sort((a, b) => {
      let comparison = 0;
      if (eventsSortBy === 'name') {
        comparison = a.eventName.localeCompare(b.eventName);
      } else if (eventsSortBy === 'date') {
        comparison = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      } else if (eventsSortBy === 'photos') {
        comparison = (a.photoCount || 0) - (b.photoCount || 0);
      }
      return eventsSortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [events, searchQuery, filterStatus, eventsSortBy, eventsSortOrder, getEventStatus]);

  // Paginated events
  const paginatedEvents = useMemo(() => {
    const startIndex = (eventsPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    return filteredAndSortedEvents.slice(startIndex, endIndex);
  }, [filteredAndSortedEvents, eventsPage, eventsPerPage]);

  const totalEventsPages = Math.ceil(filteredAndSortedEvents.length / eventsPerPage);

  // Filter and sort photos
  const filteredAndSortedPhotos = useMemo(() => {
    let filtered = photos;
    
    // Text search
    if (photoSearch.trim() !== '') {
      const q = photoSearch.toLowerCase();
      filtered = filtered.filter(photo => {
        const inCaption = photo.caption?.toLowerCase().includes(q) || false;
        const inDescription = photo.description?.toLowerCase().includes(q) || false;
        const inFilename = photo.filename?.toLowerCase().includes(q) || false;
        const inOriginalName = photo.originalName?.toLowerCase().includes(q) || false;
        const inPhotographer = photo.photographer?.toLowerCase().includes(q) || false;
        const inTags = (photo.tags || []).some(tag => String(tag).toLowerCase().includes(q));
        return inCaption || inDescription || inFilename || inOriginalName || inPhotographer || inTags;
      });
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (photosSortBy === 'name') {
        const aName = a.caption || a.filename || a.description || '';
        const bName = b.caption || b.filename || b.description || '';
        comparison = aName.localeCompare(bName);
      } else if (photosSortBy === 'date') {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = aTime - bTime;
      } else if (photosSortBy === 'type') {
        // Sort by type: videos first, then photos
        const aIsVideo = a.isVideo ? 1 : 0;
        const bIsVideo = b.isVideo ? 1 : 0;
        comparison = aIsVideo - bIsVideo;
      }
      return photosSortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [photos, photoSearch, photosSortBy, photosSortOrder]);

  const totalPhotosPages = Math.ceil(
    filteredAndSortedPhotos.length === 0 ? 1 : filteredAndSortedPhotos.length / photosPerPage
  );

  const paginatedPhotos = useMemo(() => {
    const startIndex = (photosPage - 1) * photosPerPage;
    const endIndex = startIndex + photosPerPage;
    return filteredAndSortedPhotos.slice(startIndex, endIndex);
  }, [filteredAndSortedPhotos, photosPage, photosPerPage]);

  // Reset photos page when filters/sort/search change
  useEffect(() => {
    setPhotosPage(1);
  }, [photoSearch, photosSortBy, photosSortOrder, selectedEvent, selectedGallery]);

  const formatDate = (date: Date) => {
    if (compactMode) {
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(new Date(date));
    }
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getEventTypeIcon = (type: string) => {
    const icons = {
      meeting: '🏛️',
      festival: '🎉',
      conference: '🎓',
      sports: '⚽',
      cultural: '🎭',
      workshop: '🔧',
      celebration: '🎊',
      other: '📅'
    };
    return icons[type as keyof typeof icons] || icons.other;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.upcoming;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('admin.photos.photoManagement') || 'Photo Management'}</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {events.length} {t('admin.photos.events').toLowerCase()} • {photos.length} {t('admin.photos.photos').toLowerCase()} {selectedEvent || selectedGallery ? 'selected' : ''}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowCreateEvent(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('admin.photos.createEvent')}
          </Button>
          
          
          {(selectedEvent || selectedGallery) && (
            <>
              <Button
                onClick={() => setShowUpload(true)}
                variant="default"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Upload className="w-4 h-4" />
                {t('admin.photos.uploadPhotos')}
              </Button>
              
              <Button
                onClick={publishToGallery}
                disabled={publishStatus === 'publishing'}
                variant={publishStatus === 'success' ? 'default' : publishStatus === 'error' ? 'destructive' : 'default'}
                className={`flex items-center gap-2 ${
                  publishStatus === 'success' ? 'bg-green-600 hover:bg-green-700' :
                  publishStatus === 'error' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {publishStatus === 'publishing' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {publishStatus === 'success' && (
                  <span className="text-white">✓</span>
                )}
                {publishStatus === 'error' && (
                  <span className="text-white">✗</span>
                )}
                {publishStatus === 'idle' && <Upload className="w-4 h-4" />}
                {publishStatus === 'publishing' ? t('admin.photos.publishing') : 
                 publishStatus === 'success' ? t('admin.photos.published') :
                 publishStatus === 'error' ? t('admin.photos.error') :
                 t('admin.photos.publishToGallery')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('admin.photos.searchPlaceholder') || 'Search events...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setEventsPage(1); // Reset to first page on search
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder={t('admin.photos.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.photos.allStatus')}</SelectItem>
              <SelectItem value="upcoming">{t('admin.photos.upcoming')}</SelectItem>
              <SelectItem value="ongoing">{t('admin.photos.ongoing')}</SelectItem>
              <SelectItem value="completed">{t('admin.photos.completed')}</SelectItem>
              <SelectItem value="cancelled">{t('admin.photos.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
          
          {/* State filter - only for superadmins */}
          {hasPermission('manage_all_content') && (
            <Select
              value={filterState || undefined}
              onValueChange={(value) => {
                if (value === 'clear') {
                  setFilterState('');
                  setFilterDistrict('');
                  setAvailableDistricts([]);
                } else {
                  setFilterState(value);
                  setFilterDistrict('');
                  setAvailableDistricts([]);
                }
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t('admin.photos.allStates')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">{t('admin.photos.allStates')}</SelectItem>
                {availableStates.map(state => (
                  <SelectItem key={state.id} value={state.id.toString()}>{state.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* District filter - only for superadmins */}
          {hasPermission('manage_all_content') && (
            <Select
              value={filterDistrict || undefined}
              onValueChange={(value) => {
                if (value === 'clear') {
                  setFilterDistrict('');
                } else {
                  setFilterDistrict(value);
                }
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={t('admin.photos.allDistricts')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">{t('admin.photos.allDistricts')}</SelectItem>
                {availableDistricts.map(district => (
                  <SelectItem key={district.id} value={district.id.toString()}>{district.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Clear filters button - only for superadmins */}
          {hasPermission('manage_all_content') && (filterState || filterDistrict) && (
            <Button
              onClick={() => {
                setFilterState('');
                setFilterDistrict('');
              }}
              variant="outline"
              size="sm"
              title={t('admin.photos.clearFilters')}
            >
              {t('admin.photos.clearFilters')}
            </Button>
          )}
          
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <Button
              onClick={() => setViewMode('grid')}
              variant="ghost"
              size="sm"
              className={`rounded-none border-0 ${
                viewMode === 'grid' 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setViewMode('list')}
              variant="ghost"
              size="sm"
              className={`rounded-none border-0 ${
                viewMode === 'list' 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      </div>

      {/* Success/Error Messages */}
      {publishStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-green-900 mb-1">{t('admin.photos.photosPublished')}</h3>
              <p className="text-green-800 text-sm">
                {t('admin.photos.photosPublishedDesc')}{' '}
                <a href="/gallery" target="_blank" className="underline font-medium">
                  /gallery
                </a>
                . {t('admin.photos.visitorsCanView')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Events Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {t('admin.photos.events')} ({filteredAndSortedEvents.length})
                </h3>
                <button
                  onClick={() => setCompactMode(!compactMode)}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                  title={compactMode ? 'Normal View' : 'Compact View'}
                >
                  {compactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Sort Controls */}
              <div className="flex gap-1 flex-wrap">
                <Select 
                  value={eventsSortBy} 
                  onValueChange={(value) => {
                    setEventsSortBy(value as 'name' | 'date' | 'photos');
                    setEventsPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs flex-1 min-w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="photos">Photos</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => {
                    setEventsSortOrder(eventsSortOrder === 'asc' ? 'desc' : 'asc');
                    setEventsPage(1);
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors flex items-center gap-1"
                  title={`Sort ${eventsSortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  {eventsSortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className={`overflow-y-auto ${compactMode ? 'max-h-[600px]' : 'max-h-[500px]'}`}>
              {paginatedEvents.length === 0 ? (
                <div className="p-6 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm font-medium mb-1">
                    {filteredAndSortedEvents.length === 0 
                      ? 'No events found' 
                      : 'No events on this page'}
                  </p>
                  {filteredAndSortedEvents.length === 0 && searchQuery && (
                    <p className="text-gray-400 text-xs">Try adjusting your search or filters</p>
                  )}
                </div>
              ) : (
                paginatedEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event.id);
                      setSelectedGallery(null);
                    }}
                    className={`${compactMode ? 'p-2' : 'p-3'} border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedEvent === event.id ? 'bg-orange-50 border-l-4 border-l-orange-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`${compactMode ? 'text-lg' : 'text-xl'} flex-shrink-0`}>
                        {getEventTypeIcon(event.eventType)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 
                          className={`${compactMode ? 'text-sm' : 'text-base'} font-medium text-gray-900 truncate`}
                          title={event.eventName}
                        >
                          {event.eventName}
                        </h4>
                        <p className={`${compactMode ? 'text-xs' : 'text-sm'} text-gray-600 mt-0.5`}>
                          {formatDate(event.eventDate)}
                        </p>
                        {!compactMode && event.location && (
                          <p className="text-xs text-gray-500 truncate mt-0.5" title={event.location}>
                            {event.location}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(getEventStatus(event))}`}>
                            {getEventStatus(event)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {event.photoCount || 0} {t('admin.photos.photos')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventToEdit(event);
                            setShowEditEvent(true);
                          }}
                          className={`${compactMode ? 'p-1' : 'p-1.5'} text-blue-600 hover:bg-blue-50 rounded transition-colors`}
                          title={t('admin.photos.editEvent')}
                        >
                          <Edit3 className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEvent(event.id);
                          }}
                          className={`${compactMode ? 'p-1' : 'p-1.5'} text-red-600 hover:bg-red-50 rounded transition-colors`}
                          title={t('admin.photos.deleteEvent')}
                        >
                          <Trash2 className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Pagination - Outside scrollable area */}
            {paginatedEvents.length > 0 && totalEventsPages > 1 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-gray-600">
                    Page {eventsPage} of {totalEventsPages}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEventsPage(1)}
                      disabled={eventsPage === 1}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                      title="First page"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEventsPage(prev => Math.max(1, prev - 1))}
                      disabled={eventsPage === 1}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEventsPage(prev => Math.min(totalEventsPages, prev + 1))}
                      disabled={eventsPage === totalEventsPages}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEventsPage(totalEventsPages)}
                      disabled={eventsPage === totalEventsPages}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                      title="Last page"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Galleries for Selected Event */}
          {selectedEvent && galleries.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {t('admin.photos.galleries')} ({galleries.length})
                </h3>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {galleries.map((gallery) => (
                  <div
                    key={gallery.id}
                    onClick={() => setSelectedGallery(gallery.id)}
                    className={`${compactMode ? 'p-2' : 'p-3'} border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedGallery === gallery.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <h4 className={`${compactMode ? 'text-xs' : 'text-sm'} font-medium text-gray-900 truncate`}>
                      {gallery.galleryName}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {gallery.photoCount || 0} {t('admin.photos.photos')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Photos Display */}
        <div className="lg:col-span-3">
          {selectedEvent || selectedGallery ? (
            <PhotoGrid 
              photos={paginatedPhotos}
              allPhotos={photos}
              filteredPhotos={filteredAndSortedPhotos}
              selectedPhotos={selectedPhotos}
              onSelectPhoto={(photoId) => {
                setSelectedPhotos(prev => 
                  prev.includes(photoId) 
                    ? prev.filter(id => id !== photoId)
                    : [...prev, photoId]
                );
              }}
              onSelectAll={() => {
                setSelectedPhotos(selectedPhotos.length === filteredAndSortedPhotos.length ? [] : filteredAndSortedPhotos.map(p => p.id));
              }}
              onPhotoClick={setSelectedPhoto}
              onDeletePhoto={deletePhoto}
              onClearSelection={() => setSelectedPhotos([])}
              onBatchDelete={handleBatchDeletePhotos}
              viewMode={viewMode}
              photoSearch={photoSearch}
              onPhotoSearchChange={setPhotoSearch}
              photosSortBy={photosSortBy}
              onPhotosSortByChange={setPhotosSortBy}
              photosSortOrder={photosSortOrder}
              onPhotosSortOrderChange={setPhotosSortOrder}
              photosPage={photosPage}
              onPhotosPageChange={setPhotosPage}
              photosPerPage={photosPerPage}
              onPhotosPerPageChange={setPhotosPerPage}
              totalPhotosPages={totalPhotosPages}
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.photos.selectEvent')}</h3>
              <p className="text-gray-600">{t('admin.photos.selectEventDesc')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateEvent && (
        <CreateEventModal 
          onClose={() => setShowCreateEvent(false)}
          onSubmit={createEvent}
        />
      )}
      
      {showEditEvent && eventToEdit && (
        <EditEventModal 
          event={eventToEdit}
          onClose={() => {
            setShowEditEvent(false);
            setEventToEdit(null);
          }}
          onSubmit={updateEvent}
        />
      )}
      
      {showUpload && (selectedEvent || selectedGallery) && (
        <PhotoUploadModal 
          onClose={() => setShowUpload(false)}
          eventId={selectedEvent}
          galleryId={selectedGallery}
          onUploadComplete={async () => {
            // Refresh photos for the current view
            if (selectedGallery) {
              await loadPhotos({ galleryId: selectedGallery });
            } else if (selectedEvent) {
              await loadPhotos({ eventId: selectedEvent });
            }
            // Always refresh events list to update photo counts
            await loadEvents();
          }}
        />
      )}

      {/* Full Resolution Photo Viewer */}
      {selectedPhoto && (
        <PhotoViewerModal 
          photo={selectedPhoto}
          photos={photos}
          onClose={() => setSelectedPhoto(null)}
          onNavigate={(direction) => {
            if (!selectedPhoto) return;
            const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
            if (currentIndex === -1) return;
            
            let newIndex: number;
            if (direction === 'prev') {
              newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
            } else {
              newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
            }
            
            setSelectedPhoto(photos[newIndex]);
          }}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmationState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">{confirmationState.title}</h3>
            {confirmationState.description && (
              <p className="text-gray-600 mb-4">{confirmationState.description}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
                style={{ cursor: 'pointer' }}
              >
                {confirmationState.cancelText || t('admin.photos.cancel')}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg text-white cursor-pointer ${
                  confirmationState.variant === 'destructive' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
                style={{ cursor: 'pointer' }}
              >
                {confirmationState.confirmText || t('admin.photos.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Photo Grid Component
interface PhotoGridProps {
  photos: Photo[];
  allPhotos: Photo[];
  filteredPhotos: Photo[];
  selectedPhotos: string[];
  onSelectPhoto: (photoId: string) => void;
  onSelectAll: () => void;
  onPhotoClick: (photo: Photo) => void;
  onDeletePhoto: (photoId: string) => void;
  onClearSelection: () => void;
  onBatchDelete: (photoIds: string[]) => void;
  viewMode: 'grid' | 'list';
  photoSearch: string;
  onPhotoSearchChange: (value: string) => void;
  photosSortBy: 'name' | 'date' | 'type';
  onPhotosSortByChange: (value: 'name' | 'date' | 'type') => void;
  photosSortOrder: 'asc' | 'desc';
  onPhotosSortOrderChange: (value: 'asc' | 'desc') => void;
  photosPage: number;
  onPhotosPageChange: (page: number) => void;
  photosPerPage: number;
  onPhotosPerPageChange: (value: number) => void;
  totalPhotosPages: number;
}

function PhotoGrid({ 
  photos, 
  allPhotos,
  filteredPhotos,
  selectedPhotos, 
  onSelectPhoto, 
  onSelectAll, 
  onPhotoClick, 
  onDeletePhoto, 
  onClearSelection, 
  onBatchDelete, 
  viewMode,
  photoSearch,
  onPhotoSearchChange,
  photosSortBy,
  onPhotosSortByChange,
  photosSortOrder,
  onPhotosSortOrderChange,
  photosPage,
  onPhotosPageChange,
  photosPerPage,
  onPhotosPerPageChange,
  totalPhotosPages
}: PhotoGridProps) {
  const { t } = useLanguage();
  if (allPhotos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.photos.noPhotosYet')}</h3>
        <p className="text-gray-600">{t('admin.photos.noPhotosYetDesc')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedPhotos.length === filteredPhotos.length && filteredPhotos.length > 0}
                onChange={onSelectAll}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                style={{ cursor: 'pointer' }}
              />
              <span className="ml-2 text-sm text-gray-700">
                {selectedPhotos.length === 0 ? t('admin.photos.selectAll') : `${selectedPhotos.length} ${t('admin.photos.selected')}`}
              </span>
            </label>
            <span className="text-sm text-gray-500">
              Showing {photos.length} of {filteredPhotos.length} photos ({allPhotos.length} total)
            </span>
          </div>
          
          {selectedPhotos.length > 0 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Batch delete button clicked for photos:', selectedPhotos);
                  console.log('onBatchDelete function:', onBatchDelete);
                  if (onBatchDelete && typeof onBatchDelete === 'function') {
                    onBatchDelete(selectedPhotos);
                  } else {
                    console.error('onBatchDelete is not a function:', onBatchDelete);
                  }
                }}
                onMouseEnter={(e) => {
                  console.log('Mouse entered batch delete button');
                  e.currentTarget.style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.cursor = 'pointer';
                }}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
                title={t('admin.photos.deletePhotos')}
                style={{ 
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search, Sort, and Pagination Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search photos..."
              value={photoSearch}
              onChange={(e) => onPhotoSearchChange(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>

          <Select
            value={photosSortBy}
            onValueChange={(value) => onPhotosSortByChange(value as typeof photosSortBy)}
          >
            <SelectTrigger className="h-9 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="type">Sort by Type</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2"
            onClick={() => onPhotosSortOrderChange(photosSortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${photosSortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            {photosSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>

          <Select
            value={photosPerPage.toString()}
            onValueChange={(value) => {
              onPhotosPerPageChange(parseInt(value));
              onPhotosPageChange(1);
            }}
          >
            <SelectTrigger className="h-9 text-xs w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12/page</SelectItem>
              <SelectItem value="24">24/page</SelectItem>
              <SelectItem value="48">48/page</SelectItem>
              <SelectItem value="96">96/page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Photos */}
      {photos.length === 0 ? (
        <div className="p-12 text-center">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {photoSearch ? 'No photos found matching your search' : 'No photos in this event/gallery'}
          </p>
        </div>
      ) : (
        <>
          <div className={`p-4 ${
            viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
              : 'space-y-4'
          }`}>
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isSelected={selectedPhotos.includes(photo.id)}
                onSelect={() => onSelectPhoto(photo.id)}
                onClick={() => onPhotoClick(photo)}
                onDelete={() => onDeletePhoto(photo.id)}
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPhotosPages > 1 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-gray-600">
                  Page {photosPage} of {totalPhotosPages}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPhotosPageChange(1)}
                    disabled={photosPage === 1}
                    className="h-7 w-7 p-0"
                    title="First page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPhotosPageChange(Math.max(1, photosPage - 1))}
                    disabled={photosPage === 1}
                    className="h-7 w-7 p-0"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPhotosPageChange(Math.min(totalPhotosPages, photosPage + 1))}
                    disabled={photosPage === totalPhotosPages}
                    className="h-7 w-7 p-0"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPhotosPageChange(totalPhotosPages)}
                    disabled={photosPage === totalPhotosPages}
                    className="h-7 w-7 p-0"
                    title="Last page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Individual Photo Card
interface PhotoCardProps {
  photo: Photo;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onDelete: () => void;
  viewMode: 'grid' | 'list';
}

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string | undefined): string | null => {
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
};

function PhotoCard({ photo, isSelected, onSelect, onClick, onDelete, viewMode }: PhotoCardProps) {
  const { t } = useLanguage();
  
  const isVideo = photo.isVideo && photo.youtubeVideoUrl;
  const videoId = isVideo ? getYouTubeVideoId(photo.youtubeVideoUrl) : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  
  if (viewMode === 'list') {
    return (
      <div className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
        isSelected ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
      }`} onClick={onClick}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
        style={{ cursor: 'pointer' }}
      />
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
          {isVideo && thumbnailUrl ? (
            <>
              <img
                src={thumbnailUrl}
                alt={photo.caption || photo.filename || 'Video thumbnail'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/90 backdrop-blur-sm bg-white/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <img
              src={photo.filePath}
              alt={photo.caption || photo.filename}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', photo.filePath);
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-red-100">Failed</div>';
              }}
              style={{ backgroundColor: '#f3f4f6' }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 truncate">
              {photo.caption || photo.filename}
            </h4>
            {isVideo && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                Video
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {photo.photographer}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {photo.viewCount || 0} {t('admin.photos.views')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!photo.isVisible && <EyeOff className="w-4 h-4 text-red-400" />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Delete button clicked for photo (list view):', photo.id);
              onDelete();
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title={t('admin.photos.deletePhoto')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative group rounded-lg overflow-hidden border transition-colors cursor-pointer ${
        isSelected ? 'border-orange-300' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={(e) => {
        // Only trigger onClick if the click target is not a button or input
        if (!(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('input')) {
          onClick();
        }
      }}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="absolute top-2 left-2 z-10 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
        style={{ cursor: 'pointer' }}
      />
      
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden relative">
        {isVideo && thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={photo.caption || photo.filename || 'Video thumbnail'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              style={{ backgroundColor: '#f3f4f6', zIndex: 1 }}
            />
            {/* Minimal Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/90 backdrop-blur-sm bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            {/* Video Badge */}
            <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-red-600 text-white text-xs rounded font-medium">
              Video
            </div>
          </>
        ) : (
          <img
            src={photo.filePath}
            alt={photo.caption || photo.filename}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image failed to load:', photo.filePath);
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-red-100">Failed</div>';
            }}
            style={{ backgroundColor: '#f3f4f6', zIndex: 1 }}
          />
        )}
      </div>
      
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white transform translate-y-full group-hover:translate-y-0 transition-transform pointer-events-none">
          <p className="text-sm font-medium truncate">{photo.caption || photo.filename}</p>
          <p className="text-xs opacity-90">{photo.photographer}</p>
        </div>
        
        <div className="absolute top-2 right-2 flex gap-1 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-auto z-20">
          {!photo.isVisible && <EyeOff className="w-4 h-4 text-red-400" />}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Delete button clicked for photo:', photo.id);
              console.log('onDelete function:', onDelete);
              if (onDelete && typeof onDelete === 'function') {
                onDelete();
              } else {
                console.error('onDelete is not a function:', onDelete);
              }
            }}
            onMouseEnter={(e) => {
              console.log('Mouse entered delete button for photo:', photo.id);
              e.currentTarget.style.cursor = 'pointer';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.cursor = 'pointer';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-all cursor-pointer z-30 shadow-lg"
            title={t('admin.photos.deletePhoto')}
            style={{ 
              cursor: 'pointer',
              zIndex: 30,
              pointerEvents: 'auto',
              minWidth: '24px',
              minHeight: '24px'
            }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Components
function CreateEventModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: Record<string, unknown>) => void }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    eventType: 'meeting',
    location: '',
    description: '',
    status: 'upcoming',
    isPublic: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.photos.createEventModal')}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.eventName')}</label>
            <input
              type="text"
              required
              value={formData.eventName}
              onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.eventDate')}</label>
            <input
              type="date"
              required
              value={formData.eventDate}
              onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.eventType')}</label>
            <Select
              value={formData.eventType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value as any }))} // eslint-disable-line @typescript-eslint/no-explicit-any
            >
              <SelectTrigger>
                <SelectValue placeholder={t('admin.photos.selectEventType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">{t('admin.photos.meeting')}</SelectItem>
                <SelectItem value="festival">{t('admin.photos.festival')}</SelectItem>
                <SelectItem value="conference">{t('admin.photos.conference')}</SelectItem>
                <SelectItem value="sports">{t('admin.photos.sports')}</SelectItem>
                <SelectItem value="cultural">{t('admin.photos.cultural')}</SelectItem>
                <SelectItem value="workshop">{t('admin.photos.workshop')}</SelectItem>
                <SelectItem value="celebration">{t('admin.photos.celebration')}</SelectItem>
                <SelectItem value="other">{t('admin.photos.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.location')}</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 mr-2"
            />
            <label className="text-sm text-gray-700">{t('admin.photos.makeEventPublic')}</label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              {t('admin.photos.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              {t('admin.photos.createEvent')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEventModal({ event, onClose, onSubmit }: { event: PhotoEvent; onClose: () => void; onSubmit: (data: Record<string, unknown>) => void }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    id: event.id,
    eventName: event.eventName,
    eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
    eventType: event.eventType,
    location: event.location || '',
    description: event.description || '',
    status: event.status,
    isPublic: event.isPublic
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.photos.editEventModal')}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.eventName')}</label>
            <input
              type="text"
              required
              value={formData.eventName}
              onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.eventDate')}</label>
            <input
              type="date"
              required
              value={formData.eventDate}
              onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.eventType')}</label>
            <Select
              value={formData.eventType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value as any }))} // eslint-disable-line @typescript-eslint/no-explicit-any
            >
              <SelectTrigger>
                <SelectValue placeholder={t('admin.photos.selectEventType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">{t('admin.photos.meeting')}</SelectItem>
                <SelectItem value="festival">{t('admin.photos.festival')}</SelectItem>
                <SelectItem value="conference">{t('admin.photos.conference')}</SelectItem>
                <SelectItem value="sports">{t('admin.photos.sports')}</SelectItem>
                <SelectItem value="cultural">{t('admin.photos.cultural')}</SelectItem>
                <SelectItem value="workshop">{t('admin.photos.workshop')}</SelectItem>
                <SelectItem value="celebration">{t('admin.photos.celebration')}</SelectItem>
                <SelectItem value="other">{t('admin.photos.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.status')}</label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))} // eslint-disable-line @typescript-eslint/no-explicit-any
            >
              <SelectTrigger>
                <SelectValue placeholder={t('admin.photos.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">{t('admin.photos.upcoming')}</SelectItem>
                <SelectItem value="ongoing">{t('admin.photos.ongoing')}</SelectItem>
                <SelectItem value="completed">{t('admin.photos.completed')}</SelectItem>
                <SelectItem value="cancelled">{t('admin.photos.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {t('admin.photos.statusAutoDetect')}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.location')}</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 mr-2"
            />
            <label className="text-sm text-gray-700">{t('admin.photos.makeEventPublic')}</label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              {t('admin.photos.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              {t('admin.photos.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


function PhotoUploadModal({ 
  onClose, 
  eventId, 
  galleryId, 
  onUploadComplete 
}: { 
  onClose: () => void; 
  eventId: string | null; 
  galleryId: string | null;
  onUploadComplete: () => void; 
}) {
  const { t } = useLanguage();
  const [files, setFiles] = useState<File[]>([]);
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([]);
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [photoDetails, setPhotoDetails] = useState<{ [key: string]: { title: string; description: string; photographer: string; tags: string } }>({});
  const [globalPhotographer, setGlobalPhotographer] = useState('');
  const [globalTags, setGlobalTags] = useState('');
  const [globalTitle, setGlobalTitle] = useState('');
  const [globalDescription, setGlobalDescription] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
      
      // Initialize photo details for new files
      const newDetails = { ...photoDetails };
      newFiles.forEach(file => {
        if (!newDetails[file.name]) {
          newDetails[file.name] = {
            title: globalTitle || file.name.replace(/\.[^/.]+$/, ""), // Use global title or default to filename
            description: globalDescription || '',
            photographer: globalPhotographer,
            tags: globalTags
          };
        }
      });
      setPhotoDetails(newDetails);
    }
  };

  const updatePhotoDetail = (fileName: string, field: string, value: string) => {
    setPhotoDetails(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [field]: value
      }
    }));
  };

  const applyToAll = (field: string, value: string) => {
    const newDetails = { ...photoDetails };
    // Apply to all files
    files.forEach(file => {
      if (newDetails[file.name]) {
        newDetails[file.name] = {
          ...newDetails[file.name],
          [field]: value
        };
      }
    });
    // Apply to all YouTube videos
    youtubeUrls.forEach((_, index) => {
      const urlId = `youtube-${index}`;
      if (newDetails[urlId]) {
        newDetails[urlId] = {
          ...newDetails[urlId],
          [field]: value
        };
      }
    });
    setPhotoDetails(newDetails);
  };

  const uploadFiles = async () => {
    if (files.length === 0 && youtubeUrls.length === 0) return;

    setUploading(true);
    
    // Upload image files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const details = photoDetails[file.name] || {};
      
      const formData = new FormData();
      formData.append('file', file);
      if (eventId) formData.append('eventId', eventId);
      if (galleryId) formData.append('galleryId', galleryId);
      
      // Add photo details
      if (details.title) formData.append('caption', details.title);
      if (details.description) formData.append('description', details.description);
      if (details.photographer) formData.append('photographer', details.photographer);
      
      // Process tags - combine global tags with individual tags
      const allTags = [];
      if (globalTags) allTags.push(...globalTags.split(',').map(t => t.trim()).filter(t => t));
      if (details.tags) allTags.push(...details.tags.split(',').map(t => t.trim()).filter(t => t));
      
      // Add district tag automatically (will be handled by backend based on admin's district)
      if (allTags.length > 0) {
        formData.append('tags', JSON.stringify(allTags));
      }

      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/photos/upload?_t=${Date.now()}`, {
          method: 'POST',
          cache: 'no-store',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } else {
          console.error('Upload failed for', file.name, data.error);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    // Upload YouTube videos
    for (let i = 0; i < youtubeUrls.length; i++) {
      const url = youtubeUrls[i];
      const urlId = `youtube-${i}`;
      const details = photoDetails[urlId] || { 
        title: globalTitle || 'YouTube Video', 
        description: globalDescription || '', 
        photographer: globalPhotographer, 
        tags: globalTags 
      };
      
      const formData = new FormData();
      formData.append('youtubeVideoUrl', url);
      if (eventId) formData.append('eventId', eventId);
      if (galleryId) formData.append('galleryId', galleryId);
      
      // Add video details
      if (details.title) formData.append('caption', details.title);
      if (details.description) formData.append('description', details.description);
      if (details.photographer) formData.append('photographer', details.photographer);
      
      // Process tags
      const allTags = [];
      if (globalTags) allTags.push(...globalTags.split(',').map(t => t.trim()).filter(t => t));
      if (details.tags) allTags.push(...details.tags.split(',').map(t => t.trim()).filter(t => t));
      
      if (allTags.length > 0) {
        formData.append('tags', JSON.stringify(allTags));
      }

      try {
        const token = localStorage.getItem('admin_token');
        console.log('[Upload] Sending YouTube video:', { url, eventId, galleryId, details });
        
        const response = await fetch(`/api/photos/upload?_t=${Date.now()}`, {
          method: 'POST',
          cache: 'no-store',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: formData
        });

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('[Upload] Failed to parse response as JSON:', jsonError);
          const text = await response.text();
          console.error('[Upload] Response text:', text);
          notifications.error('Upload Failed', `Server returned invalid response (${response.status}): ${response.statusText}`);
          return;
        }
        
        console.log('[Upload] YouTube video response:', data);
        
        if (!response.ok) {
          console.error('[Upload] HTTP error:', response.status, response.statusText);
          console.error('[Upload] Error response body:', data);
        }
        
        if (data.success) {
          setUploadProgress(prev => ({ ...prev, [url]: 100 }));
          console.log('[Upload] YouTube video uploaded successfully:', data.photoId, data.youtubeVideoUrl);
        } else {
          console.error('[Upload] Failed for YouTube video:', url, data.error, data.details);
          // Show detailed error message
          let errorMsg = data.error || 'Unknown error';
          if (data.details) {
            // If details contain error info, show it (truncate if too long)
            const detailsStr = typeof data.details === 'string' ? data.details : JSON.stringify(data.details);
            if (detailsStr.length > 200) {
              errorMsg += `\n\n${detailsStr.substring(0, 200)}...`;
            } else {
              errorMsg += `\n\n${detailsStr}`;
            }
          }
          notifications.error('Upload Failed', `Failed to upload video: ${errorMsg}`);
        }
      } catch (error) {
        console.error('[Upload] Error uploading YouTube video:', error);
        notifications.error('Upload Error', 'Failed to upload YouTube video. Please try again.');
      }
    }

    setUploading(false);
    onUploadComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.photos.uploadPhotosModal')}</h3>
        
        <div className="space-y-6">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.photos.selectPhotos')}</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* YouTube Video URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add YouTube Video</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newYoutubeUrl}
                onChange={(e) => setNewYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newYoutubeUrl.trim()) {
                    const newUrls = [...youtubeUrls, newYoutubeUrl.trim()];
                    setYoutubeUrls(newUrls);
                    // Use index-based ID for consistency
                    const urlId = `youtube-${newUrls.length - 1}`;
                    const newDetails = { ...photoDetails };
                    newDetails[urlId] = {
                      title: globalTitle || 'YouTube Video',
                      description: globalDescription || '',
                      photographer: globalPhotographer,
                      tags: globalTags
                    };
                    setPhotoDetails(newDetails);
                    setNewYoutubeUrl('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newYoutubeUrl.trim()) {
                    const newUrls = [...youtubeUrls, newYoutubeUrl.trim()];
                    setYoutubeUrls(newUrls);
                    // Use index-based ID for consistency
                    const urlId = `youtube-${newUrls.length - 1}`;
                    const newDetails = { ...photoDetails };
                    newDetails[urlId] = {
                      title: globalTitle || 'YouTube Video',
                      description: globalDescription || '',
                      photographer: globalPhotographer,
                      tags: globalTags
                    };
                    setPhotoDetails(newDetails);
                    setNewYoutubeUrl('');
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Add
              </button>
            </div>
            {youtubeUrls.length > 0 && (
              <div className="mt-2 space-y-1">
                {youtubeUrls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                    <span className="truncate flex-1">{url}</span>
                    <button
                      type="button"
                      onClick={() => {
                        // Remove URL and reindex remaining URLs
                        const newUrls = youtubeUrls.filter((_, i) => i !== index);
                        setYoutubeUrls(newUrls);
                        // Update photoDetails with new indices
                        const newDetails: { [key: string]: { title: string; description: string; photographer: string; tags: string } } = {};
                        // Keep file details
                        Object.keys(photoDetails).forEach(key => {
                          if (!key.startsWith('youtube-')) {
                            newDetails[key] = photoDetails[key];
                          }
                        });
                        // Reindex YouTube video details
                        youtubeUrls.forEach((_, oldIndex) => {
                          if (oldIndex !== index) {
                            const oldId = `youtube-${oldIndex}`;
                            const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
                            const newId = `youtube-${newIndex}`;
                            if (photoDetails[oldId]) {
                              newDetails[newId] = photoDetails[oldId];
                            }
                          }
                        });
                        setPhotoDetails(newDetails);
                      }}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Global Settings */}
          {(files.length > 0 || youtubeUrls.length > 0) && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-900">{t('admin.photos.globalSettings')}</h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.photoTitle')}</label>
                    <input
                      type="text"
                      value={globalTitle || ''}
                      onChange={(e) => {
                        setGlobalTitle(e.target.value);
                        applyToAll('title', e.target.value);
                      }}
                      placeholder={t('admin.photos.photoTitlePlaceholder') || 'Enter title for all photos'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.photographer')}</label>
                    <input
                      type="text"
                      value={globalPhotographer || ''}
                      onChange={(e) => {
                        setGlobalPhotographer(e.target.value);
                        applyToAll('photographer', e.target.value);
                      }}
                      placeholder={t('admin.photos.photographerPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.description')}</label>
                  <textarea
                    value={globalDescription || ''}
                    onChange={(e) => {
                      setGlobalDescription(e.target.value);
                      applyToAll('description', e.target.value);
                    }}
                    placeholder={t('admin.photos.descriptionPlaceholder') || 'Enter description for all photos'}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.photos.tags')}</label>
                  <input
                    type="text"
                    value={globalTags || ''}
                    onChange={(e) => {
                      setGlobalTags(e.target.value);
                      applyToAll('tags', e.target.value);
                    }}
                    placeholder={t('admin.photos.tagsPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Individual Photo Details */}
          {(files.length > 0 || youtubeUrls.length > 0) && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">{t('admin.photos.photoDetails')}</h4>
              <div className="max-h-96 overflow-y-auto space-y-4">
                {/* Photo files */}
                {files.map((file, index) => {
                  const details = photoDetails[file.name] || { title: '', description: '', photographer: '', tags: '' };
                  return (
                    <div key={`file-${index}`} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">({Math.round(file.size / 1024)}KB)</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.photos.photoTitle')}</label>
                          <input
                            type="text"
                            value={details.title || ''}
                            onChange={(e) => updatePhotoDetail(file.name, 'title', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.photos.photographer')}</label>
                          <input
                            type="text"
                            value={details.photographer || ''}
                            onChange={(e) => updatePhotoDetail(file.name, 'photographer', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.photos.description')}</label>
                        <textarea
                          value={details.description || ''}
                          onChange={(e) => updatePhotoDetail(file.name, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.photos.additionalTags')}</label>
                        <input
                          type="text"
                          value={details.tags || ''}
                          onChange={(e) => updatePhotoDetail(file.name, 'tags', e.target.value)}
                          placeholder={t('admin.photos.additionalTagsPlaceholder')}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  );
                })}
                
                {/* YouTube Video URLs */}
                {youtubeUrls.map((url, index) => {
                  const urlId = `youtube-${index}`;
                  const details = photoDetails[urlId] || { title: 'YouTube Video', description: '', photographer: globalPhotographer, tags: globalTags };
                  const videoId = getYouTubeVideoId(url);
                  return (
                    <div key={`video-${index}`} className="border border-red-200 rounded-lg p-4 space-y-3 bg-red-50/30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-xs text-red-600">
                          {files.length + index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-700 truncate block">{url}</span>
                          {videoId && (
                            <span className="text-xs text-gray-500">Video ID: {videoId}</span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-medium">
                          Video
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Video Title</label>
                          <input
                            type="text"
                            value={details.title || ''}
                            onChange={(e) => updatePhotoDetail(urlId, 'title', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.photos.photographer')}</label>
                          <input
                            type="text"
                            value={details.photographer || ''}
                            onChange={(e) => updatePhotoDetail(urlId, 'photographer', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.photos.description')}</label>
                        <textarea
                          value={details.description || ''}
                          onChange={(e) => updatePhotoDetail(urlId, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.photos.additionalTags')}</label>
                        <input
                          type="text"
                          value={details.tags || ''}
                          onChange={(e) => updatePhotoDetail(urlId, 'tags', e.target.value)}
                          placeholder={t('admin.photos.additionalTagsPlaceholder')}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('admin.photos.cancel')}
            </button>
            <button
              onClick={uploadFiles}
              disabled={(files.length === 0 && youtubeUrls.length === 0) || uploading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? t('admin.photos.uploading') : `${t('admin.photos.uploadPhotos')} ${files.length + youtubeUrls.length} ${files.length + youtubeUrls.length === 1 ? 'item' : 'items'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Full Resolution Photo Viewer Modal
function PhotoViewerModal({ photo, photos, onClose, onNavigate }: { photo: Photo; photos: Photo[]; onClose: () => void; onNavigate?: (direction: 'prev' | 'next') => void }) {
  const { t } = useLanguage();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const isVideo = photo.isVideo && photo.youtubeVideoUrl;
  const videoId = isVideo ? getYouTubeVideoId(photo.youtubeVideoUrl) : null;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && photos.length > 1 && onNavigate) {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && photos.length > 1 && onNavigate) {
        onNavigate('next');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, onNavigate, onClose]);

  // Reset description expansion when photo changes
  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [photo?.id]);

  // Find current photo index
  const currentIndex = photos.findIndex(p => p.id === photo.id);
  const hasPrev = photos.length > 1;
  const hasNext = photos.length > 1;

  // Check if description is long enough to need truncation
  const descriptionLines = photo?.description ? photo.description.split('\n').length : 0;
  const descriptionLength = photo?.description?.length || 0;
  const needsTruncation = descriptionLines > 2 || descriptionLength > 150;

  const handlePrev = () => {
    if (photos.length > 1 && onNavigate) {
      onNavigate('prev');
    }
  };

  const handleNext = () => {
    if (photos.length > 1 && onNavigate) {
      onNavigate('next');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative w-full h-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 text-white hover:text-orange-400 transition-colors bg-black/50 rounded-full p-1.5 sm:p-2 hover:bg-black/70"
          aria-label="Close"
        >
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Navigation buttons */}
        {hasPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-white hover:text-orange-400 transition-colors z-20 bg-black/50 rounded-full hover:bg-black/70 backdrop-blur-sm"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}

        {hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-white hover:text-orange-400 transition-colors z-20 bg-black/50 rounded-full hover:bg-black/70 backdrop-blur-sm"
            aria-label="Next image"
          >
            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Image counter */}
        {photos.length > 1 && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 bg-black/50 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
        
        {/* Image/Video container - full screen */}
        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-auto" onClick={(e) => e.stopPropagation()}>
          <div className="relative inline-block max-w-full">
            {isVideo && videoId ? (
              <div className="relative w-full" style={{ width: '95vw', maxWidth: '1600px', aspectRatio: '16/9' }}>
                <iframe
                  key={photo.id}
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1&autoplay=1`}
                  title={photo.caption || photo.filename || 'Video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full rounded-lg"
                  style={{ border: 'none' }}
                />
              </div>
            ) : (
              <img
                key={photo.id}
                src={photo.filePath}
                alt={photo.caption || photo.filename}
                className="block transition-opacity duration-300"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 120px)',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  console.error('Full resolution image failed to load:', photo.filePath);
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-96 h-96 flex items-center justify-center text-white text-lg">Failed to load full resolution image</div>';
                }}
              />
            )}
          </div>
        </div>
        
        {/* Photo Info overlay - positioned over image */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <h3 className="text-base sm:text-xl md:text-2xl font-bold line-clamp-2">{photo.caption || photo.filename}</h3>
                {isVideo && (
                  <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full font-medium">
                    Video
                  </span>
                )}
              </div>
              {photo.description && (
                <div className="mb-2 sm:mb-3">
                  <p className={`text-gray-200 text-xs sm:text-sm md:text-base leading-relaxed ${
                    needsTruncation && !isDescriptionExpanded ? 'line-clamp-2 sm:line-clamp-3' : ''
                  }`}>
                    {photo.description}
                  </p>
                  {needsTruncation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDescriptionExpanded(!isDescriptionExpanded);
                      }}
                      className="mt-1 text-orange-400 hover:text-orange-300 text-xs sm:text-sm font-medium transition-colors"
                    >
                      {isDescriptionExpanded ? t('admin.photos.seeLess') : t('admin.photos.seeMore')}
                    </button>
                  )}
                </div>
              )}
              {photo.tags && photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {photo.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-0.5 sm:px-3 sm:py-1 bg-orange-600/90 text-white text-[10px] sm:text-xs md:text-sm font-medium rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
