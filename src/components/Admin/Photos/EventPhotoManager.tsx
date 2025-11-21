'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Camera, Upload, Plus, Search, Filter, Grid, List, Settings, Eye, EyeOff, Trash2, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import { PhotoEvent, PhotoGallery, Photo } from '@/lib/content';
import { notifications } from '@/lib/notifications';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface EventPhotoManagerProps {
  hasPermission: (permission: string) => boolean;
}

export function EventPhotoManager({ hasPermission }: EventPhotoManagerProps) {
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
      title: 'Delete Photos',
      description: `Are you sure you want to delete ${photoIds.length} photo${photoIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
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
      title: 'Delete Event',
      description: 'Are you sure you want to delete this event? This will also delete all associated photos.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
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
      title: 'Delete Photo',
      description: 'Are you sure you want to delete this photo? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
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
        notifications.warning('No Photos to Publish', 'Please make sure photos are approved and visible first.');
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
  const getEventStatus = (event: PhotoEvent): 'upcoming' | 'ongoing' | 'completed' | 'cancelled' => {
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
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const computedStatus = getEventStatus(event);
    const matchesStatus = filterStatus === 'all' || computedStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowCreateEvent(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
          
          
          {(selectedEvent || selectedGallery) && (
            <>
              <Button
                onClick={() => setShowUpload(true)}
                variant="default"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Upload className="w-4 h-4" />
                Upload Photos
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
                {publishStatus === 'publishing' ? 'Publishing...' : 
                 publishStatus === 'success' ? 'Published!' :
                 publishStatus === 'error' ? 'Error' :
                 'Publish to Gallery'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search events, locations, or photos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled')}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">All States</SelectItem>
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
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">All Districts</SelectItem>
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
              title="Clear all filters"
            >
              Clear Filters
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

      {/* Success/Error Messages */}
      {publishStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Photos Published Successfully!</h3>
              <p className="text-green-800 text-sm">
                Your photos are now live on the public gallery at{' '}
                <a href="/gallery" target="_blank" className="underline font-medium">
                  /gallery
                </a>
                . Visitors can view them immediately.
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
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Events</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event.id);
                    setSelectedGallery(null);
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedEvent === event.id ? 'bg-orange-50 border-l-4 border-l-orange-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getEventTypeIcon(event.eventType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="relative w-full overflow-hidden">
                        <h4 
                          className={`font-medium text-gray-900 ${event.eventName.length > 20 ? 'whitespace-nowrap animate-marquee' : 'truncate'}`}
                          title={event.eventName} // Show full name on hover
                        >
                          {event.eventName}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600">{formatDate(event.eventDate)}</p>
                      {event.location && (
                        <p className="text-xs text-gray-500 truncate" title={event.location}>{event.location}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(getEventStatus(event))}`}>
                          {getEventStatus(event)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {event.photoCount || 0} photos
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEventToEdit(event);
                          setShowEditEvent(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit event"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Delete button clicked for event:', event.id, 'Event object:', event);
                        deleteEvent(event.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Galleries for Selected Event */}
          {selectedEvent && galleries.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Galleries</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {galleries.map((gallery) => (
                  <div
                    key={gallery.id}
                    onClick={() => setSelectedGallery(gallery.id)}
                    className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedGallery === gallery.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900 text-sm">{gallery.galleryName}</h4>
                    <p className="text-xs text-gray-500">{gallery.photoCount || 0} photos</p>
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
              photos={photos}
              selectedPhotos={selectedPhotos}
              onSelectPhoto={(photoId) => {
                setSelectedPhotos(prev => 
                  prev.includes(photoId) 
                    ? prev.filter(id => id !== photoId)
                    : [...prev, photoId]
                );
              }}
              onSelectAll={() => {
                setSelectedPhotos(selectedPhotos.length === photos.length ? [] : photos.map(p => p.id));
              }}
              onPhotoClick={setSelectedPhoto}
              onDeletePhoto={deletePhoto}
              onClearSelection={() => setSelectedPhotos([])}
              onBatchDelete={handleBatchDeletePhotos}
              viewMode={viewMode}
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Event</h3>
              <p className="text-gray-600">Choose an event from the sidebar to view and manage photos</p>
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
                {confirmationState.cancelText}
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
                {confirmationState.confirmText}
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
  selectedPhotos: string[];
  onSelectPhoto: (photoId: string) => void;
  onSelectAll: () => void;
  onPhotoClick: (photo: Photo) => void;
  onDeletePhoto: (photoId: string) => void;
  onClearSelection: () => void;
  onBatchDelete: (photoIds: string[]) => void;
  viewMode: 'grid' | 'list';
}

function PhotoGrid({ photos, selectedPhotos, onSelectPhoto, onSelectAll, onPhotoClick, onDeletePhoto, onClearSelection, onBatchDelete, viewMode }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Yet</h3>
        <p className="text-gray-600">Upload some photos to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedPhotos.length === photos.length}
              onChange={onSelectAll}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
              style={{ cursor: 'pointer' }}
            />
            <span className="ml-2 text-sm text-gray-700">
              {selectedPhotos.length === 0 ? 'Select All' : `${selectedPhotos.length} selected`}
            </span>
          </label>
          <span className="text-sm text-gray-500">{photos.length} photos total</span>
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
              title={`Delete ${selectedPhotos.length} selected photo${selectedPhotos.length > 1 ? 's' : ''}`}
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

      {/* Photos */}
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

function PhotoCard({ photo, isSelected, onSelect, onClick, onDelete, viewMode }: PhotoCardProps) {
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
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          <img
            src={photo.filePath}
            alt={photo.caption || photo.filename}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image failed to load:', photo.filePath);
              console.error('Photo object:', photo);
              console.error('Error details:', e);
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-red-100">Failed: ' + photo.filePath + '</div>';
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', photo.filePath);
            }}
            style={{ backgroundColor: '#f3f4f6' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {photo.caption || photo.filename}
          </h4>
          <p className="text-sm text-gray-600">
            {photo.photographer}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              {photo.viewCount || 0} views
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
            title="Delete photo"
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
        <img
          src={photo.filePath}
          alt={photo.caption || photo.filename}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Image failed to load:', photo.filePath);
            console.error('Photo object:', photo);
            console.error('Error details:', e);
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-red-100">Failed: ' + photo.filePath + '</div>';
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', photo.filePath);
          }}
          style={{ backgroundColor: '#f3f4f6', zIndex: 1 }}
        />
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
            title="Delete photo"
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Event</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
            <input
              type="text"
              required
              value={formData.eventName}
              onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
            <input
              type="date"
              required
              value={formData.eventDate}
              onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <Select
              value={formData.eventType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value as any }))} // eslint-disable-line @typescript-eslint/no-explicit-any
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="festival">Festival</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="celebration">Celebration</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
            <label className="text-sm text-gray-700">Make event public</label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Create Event
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEventModal({ event, onClose, onSubmit }: { event: PhotoEvent; onClose: () => void; onSubmit: (data: Record<string, unknown>) => void }) {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Event</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
            <input
              type="text"
              required
              value={formData.eventName}
              onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
            <input
              type="date"
              required
              value={formData.eventDate}
              onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <Select
              value={formData.eventType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value as any }))} // eslint-disable-line @typescript-eslint/no-explicit-any
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="festival">Festival</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="celebration">Celebration</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))} // eslint-disable-line @typescript-eslint/no-explicit-any
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Status is automatically determined by event date. Only &quot;Cancelled&quot; status overrides automatic detection.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
            <label className="text-sm text-gray-700">Make event public</label>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Save Changes
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
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [photoDetails, setPhotoDetails] = useState<{ [key: string]: { title: string; description: string; photographer: string; tags: string } }>({});
  const [globalPhotographer, setGlobalPhotographer] = useState('');
  const [globalTags, setGlobalTags] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
      
      // Initialize photo details for new files
      const newDetails = { ...photoDetails };
      newFiles.forEach(file => {
        if (!newDetails[file.name]) {
          newDetails[file.name] = {
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for default title
            description: '',
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
    files.forEach(file => {
      if (newDetails[file.name]) {
        newDetails[file.name] = {
          ...newDetails[file.name],
          [field]: value
        };
      }
    });
    setPhotoDetails(newDetails);
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    
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

    setUploading(false);
    onUploadComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Photos</h3>
        
        <div className="space-y-6">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Photos</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Global Settings */}
          {files.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-900">Global Settings (Apply to All Photos)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photographer</label>
                  <input
                    type="text"
                    value={globalPhotographer}
                    onChange={(e) => {
                      setGlobalPhotographer(e.target.value);
                      applyToAll('photographer', e.target.value);
                    }}
                    placeholder="Enter photographer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={globalTags}
                    onChange={(e) => {
                      setGlobalTags(e.target.value);
                      applyToAll('tags', e.target.value);
                    }}
                    placeholder="e.g., event, celebration, group"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Individual Photo Details */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Photo Details</h4>
              <div className="max-h-96 overflow-y-auto space-y-4">
                {files.map((file, index) => {
                  const details = photoDetails[file.name] || { title: '', description: '', photographer: '', tags: '' };
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">({Math.round(file.size / 1024)}KB)</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                          <input
                            type="text"
                            value={details.title}
                            onChange={(e) => updatePhotoDetail(file.name, 'title', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Photographer</label>
                          <input
                            type="text"
                            value={details.photographer}
                            onChange={(e) => updatePhotoDetail(file.name, 'photographer', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                        <textarea
                          value={details.description}
                          onChange={(e) => updatePhotoDetail(file.name, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Additional Tags</label>
                        <input
                          type="text"
                          value={details.tags}
                          onChange={(e) => updatePhotoDetail(file.name, 'tags', e.target.value)}
                          placeholder="Additional tags for this photo"
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
              Cancel
            </button>
            <button
              onClick={uploadFiles}
              disabled={files.length === 0 || uploading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Full Resolution Photo Viewer Modal
function PhotoViewerModal({ photo, photos, onClose, onNavigate }: { photo: Photo; photos: Photo[]; onClose: () => void; onNavigate?: (direction: 'prev' | 'next') => void }) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
        
        {/* Image container - full screen */}
        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-auto" onClick={(e) => e.stopPropagation()}>
          <div className="relative inline-block max-w-full">
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
          </div>
        </div>
        
        {/* Photo Info overlay - positioned over image */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-white">
              <h3 className="text-base sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 line-clamp-2">{photo.caption || photo.filename}</h3>
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
                      {isDescriptionExpanded ? 'See less' : 'See more...'}
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
