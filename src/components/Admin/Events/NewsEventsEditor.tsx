"use client";

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Save,
  Edit,
  Eye,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  X,
  Search,
  Filter,
  Grid3X3,
  List,
  Newspaper,
  CalendarDays,
  Star,
  AlertCircle,
  CheckCircle,
  EyeOff,
} from 'lucide-react';

interface News {
  id: string;
  title: string;
  title_hindi?: string;
  content: string;
  excerpt?: string;
  image_path?: string;
  news_type: 'announcement' | 'update' | 'achievement' | 'notice' | 'general';
  priority: 'high' | 'medium' | 'low';
  is_featured: boolean;
  is_published: boolean;
  published_at: string;
  order: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface Event {
  id: string;
  title: string;
  title_hindi?: string;
  description: string;
  event_date: string;
  event_time?: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  address?: string;
  image_path?: string;
  registration_required: boolean;
  registration_url?: string;
  max_participants?: number;
  current_participants: number;
  event_type: 'festival' | 'meeting' | 'celebration' | 'workshop' | 'conference' | 'other';
  order: number;
  isVisible: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export default function NewsEventsEditor() {
  const { currentUser } = useAdmin();
  const [activeTab, setActiveTab] = useState<'news' | 'events'>('news');
  const [news, setNews] = useState<News[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<News | Event | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploadingImage, setUploadingImage] = useState(false);

  // News form state
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    image_path: '',
    news_type: 'general' as News['news_type'],
    priority: 'medium' as News['priority'],
    is_featured: false,
    is_published: true,
    order: 0,
    district: '',
    state: '',
  });

  // State/district dropdowns (for superadmins)
  const [states, setStates] = useState<Array<{ id: number; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    end_date: '',
    end_time: '',
    location: '',
    address: '',
    image_path: '',
    registration_required: false,
    registration_url: '',
    max_participants: 0,
    event_type: 'other' as Event['event_type'],
    order: 0,
    isVisible: true,
    district: '',
    state: '',
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch states when currentUser is available (for superadmins)
  useEffect(() => {
    if (currentUser && (currentUser.type === 'superadmin' || currentUser.role === 'superadmin') && states.length === 0 && !loadingStates) {
      fetchStates();
    }
  }, [currentUser]);

  // Fetch districts when state changes (for news)
  useEffect(() => {
    if (currentUser && (currentUser.type === 'superadmin' || currentUser.role === 'superadmin') && newsForm.state) {
      fetchDistricts(newsForm.state);
    } else if (!newsForm.state) {
      setDistricts([]);
    }
  }, [newsForm.state, currentUser]);

  // Fetch districts when state changes (for events)
  useEffect(() => {
    if (currentUser && (currentUser.type === 'superadmin' || currentUser.role === 'superadmin') && eventForm.state) {
      fetchDistricts(eventForm.state);
    } else if (!eventForm.state) {
      setDistricts([]);
    }
  }, [eventForm.state, currentUser]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const response = await fetch('/api/states');
      const data = await response.json();
      if (data.success && data.data) {
        setStates(data.data || []);
      } else {
        console.error('Failed to fetch states:', data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchDistricts = async (stateId: string) => {
    setLoadingDistricts(true);
    try {
      const response = await fetch(`/api/districts?stateId=${stateId}`);
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const timestamp = Date.now();
      const [newsRes, eventsRes] = await Promise.all([
        fetch(`/api/content/news?admin=true&_t=${timestamp}`, { cache: 'no-store', headers }),
        fetch(`/api/content/events?admin=true&_t=${timestamp}`, { cache: 'no-store', headers })
      ]);

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        setNews(newsData.data || []);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    // Validate state/district for superadmins
    if (activeTab === 'news' && (currentUser.type === 'superadmin' || currentUser.role === 'superadmin')) {
      if (!newsForm.state || !newsForm.district) {
        alert('Please select both state and district for this news item');
        return;
      }
    }
    if (activeTab === 'events' && (currentUser.type === 'superadmin' || currentUser.role === 'superadmin')) {
      if (!eventForm.state || !eventForm.district) {
        alert('Please select both state and district for this event');
        return;
      }
    }

    // Validate content limits for news
    if (activeTab === 'news') {
      if (newsForm.title.length > 255) {
        alert('Title cannot exceed 255 characters');
        return;
      }
      if (newsForm.excerpt.length > 500) {
        alert('Excerpt cannot exceed 500 characters');
        return;
      }
      if (newsForm.content.length > 5000) {
        alert('Content cannot exceed 5000 characters');
        return;
      }
      if (!newsForm.title.trim() || !newsForm.content.trim()) {
        alert('Title and content are required');
        return;
      }
    }
    // Validate content limits for events
    if (activeTab === 'events') {
      if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.event_date.trim()) {
        alert('Title, description and event date are required');
        return;
      }
      if (eventForm.description.length > 5000) {
        alert('Description cannot exceed 5000 characters');
        return;
      }
    }

    try {
      const url = activeTab === 'news' ? '/api/content/news' : '/api/content/events';
      let data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      if (activeTab === 'news') {
        data = { 
          ...newsForm, 
          created_by: currentUser.name,
          // Include district/state for superadmins
          ...((currentUser.type === 'superadmin' || currentUser.role === 'superadmin') && {
            district: newsForm.district,
            state: newsForm.state,
          }),
        };
      } else {
        // For events, ensure dates are properly formatted and empty strings become null
        data = {
          ...eventForm,
          created_by: (currentUser.type === 'superadmin' || currentUser.role === 'superadmin') 
            ? currentUser.id 
            : currentUser.name,
          event_date: eventForm.event_date?.trim() || null,
          event_time: eventForm.event_time?.trim() || null,
          end_date: eventForm.end_date?.trim() || null,
          end_time: eventForm.end_time?.trim() || null,
          // Include district/state for superadmins
          ...((currentUser.type === 'superadmin' || currentUser.role === 'superadmin') && {
            district: eventForm.district,
            state: eventForm.state,
          }),
        };
      }

      const method = editingItem ? 'PUT' : 'POST';
      if (editingItem) {
        data.id = editingItem.id;
      }

      const token = localStorage.getItem('admin_token');
      // Add cache-busting timestamp to URL
      const urlWithCache = `${url}?_t=${Date.now()}`;
      const response = await fetch(urlWithCache, {
        method,
        cache: 'no-store',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchData();
        resetForm();
      } else {
        console.error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const url = activeTab === 'news' ? '/api/content/news' : '/api/content/events';
      const token = localStorage.getItem('admin_token');
      // Add cache-busting timestamp
      const response = await fetch(`${url}?id=${id}&_t=${Date.now()}`, { 
        method: 'DELETE',
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', activeTab);

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/upload/content?_t=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        if (activeTab === 'news') {
          setNewsForm({ ...newsForm, image_path: result.url });
        } else {
          setEventForm({ ...eventForm, image_path: result.url });
        }
      } else {
        alert('Failed to upload image: ' + result.error);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setIsCreating(false);
    setNewsForm({
      title: '',
      content: '',
      excerpt: '',
      image_path: '',
      news_type: 'general',
      priority: 'medium',
      is_featured: false,
      is_published: true,
      order: 0,
      district: '',
      state: '',
    });
    setDistricts([]);
    setEventForm({
      title: '',
      description: '',
      event_date: '',
      event_time: '',
      end_date: '',
      end_time: '',
      location: '',
      address: '',
      image_path: '',
      registration_required: false,
      registration_url: '',
      max_participants: 0,
      event_type: 'other',
      order: 0,
      isVisible: true,
      district: '',
      state: '',
    });
  };

  const startEdit = async (item: News | Event) => {
    // Fetch fresh data for the item being edited to avoid stale data
    let itemToUse = item;
    
    try {
      const token = localStorage.getItem('admin_token');
      const url = activeTab === 'news' ? '/api/content/news' : '/api/content/events';
      const response = await fetch(`${url}?id=${item.id}&admin=true&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        // Use fresh data if available, otherwise fall back to item from list
        const freshItem = (activeTab === 'news' 
          ? data.data?.find((n: News) => n.id === item.id)
          : data.data?.find((e: Event) => e.id === item.id));
        
        if (freshItem) {
          itemToUse = freshItem;
        }
      }
    } catch (error) {
      // If fetch fails, use item from list
      console.error('Failed to fetch fresh item data:', error);
    }
    
    setEditingItem(itemToUse);
    setIsCreating(false);
    
    if (activeTab === 'news') {
      const newsItem = itemToUse as News;
      const timestamp = Date.now();
      setNewsForm({
        title: newsItem.title,
        content: newsItem.content,
        excerpt: newsItem.excerpt || '',
        // Add cache-busting to image URL if it's a relative path
        image_path: newsItem.image_path ? 
          (newsItem.image_path.startsWith('/') ? `${newsItem.image_path}${newsItem.image_path.includes('?') ? '&' : '?'}_t=${timestamp}` : newsItem.image_path) 
          : '',
        news_type: newsItem.news_type,
        priority: newsItem.priority,
        is_featured: newsItem.is_featured,
        is_published: newsItem.is_published,
        order: newsItem.order,
        district: (newsItem as any).district || '',
        state: (newsItem as any).state || '',
      });
      
      // If superadmin and state is set, fetch districts
      if (currentUser && (currentUser.type === 'superadmin' || currentUser.role === 'superadmin') && (newsItem as any).state) {
        // Find state ID from state name
        const stateObj = states.find(s => s.name === (newsItem as any).state);
        if (stateObj) {
          fetchDistricts(String(stateObj.id));
        }
      }
    } else {
      const eventItem = itemToUse as Event;
      
      // Format dates for HTML date input (YYYY-MM-DD format)
      const formatDateForInput = (dateStr?: string): string => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return '';
          // Get YYYY-MM-DD format
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch {
          // If it's already in YYYY-MM-DD format, return as is
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateStr;
          }
          return '';
        }
      };
      
      // Format time for HTML time input (HH:mm format)
      const formatTimeForInput = (timeStr?: string): string => {
        if (!timeStr) return '';
        // If already in HH:mm format, return as is
        if (timeStr.match(/^\d{2}:\d{2}$/)) {
          return timeStr;
        }
        // If in HH:mm:ss format, extract HH:mm
        if (timeStr.match(/^\d{2}:\d{2}:\d{2}/)) {
          return timeStr.substring(0, 5);
        }
        return timeStr;
      };
      
      const timestamp = Date.now();
      setEventForm({
        title: eventItem.title,
        description: eventItem.description,
        event_date: formatDateForInput(eventItem.event_date),
        event_time: formatTimeForInput(eventItem.event_time),
        end_date: formatDateForInput(eventItem.end_date),
        end_time: formatTimeForInput(eventItem.end_time),
        location: eventItem.location || '',
        address: eventItem.address || '',
        // Add cache-busting to image URL if it's a relative path
        image_path: eventItem.image_path ? 
          (eventItem.image_path.startsWith('/') ? `${eventItem.image_path}${eventItem.image_path.includes('?') ? '&' : '?'}_t=${timestamp}` : eventItem.image_path) 
          : '',
        registration_required: eventItem.registration_required,
        registration_url: eventItem.registration_url || '',
        max_participants: eventItem.max_participants || 0,
        event_type: eventItem.event_type,
        order: eventItem.order,
        isVisible: eventItem.isVisible,
        district: (eventItem as any).district || '',
        state: (eventItem as any).state || '',
      });
      
      // If superadmin and state is set, fetch districts
      if (currentUser && (currentUser.type === 'superadmin' || currentUser.role === 'superadmin') && (eventItem as any).state) {
        // Find state ID from state name
        const stateObj = states.find(s => s.name === (eventItem as any).state);
        if (stateObj) {
          fetchDistricts(String(stateObj.id));
        }
      }
    }
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const filteredItems = activeTab === 'news' 
    ? news.filter(item => {
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterType !== 'all' && item.news_type !== filterType) return false;
        return true;
      })
    : events.filter(item => {
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterType !== 'all' && item.event_type !== filterType) return false;
        return true;
      });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News & Events Management</h1>
          <p className="text-gray-600">Manage news articles and events</p>
        </div>
        <Button onClick={startCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add {activeTab === 'news' ? 'News' : 'Event'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'news'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Newspaper className="h-4 w-4 inline mr-2" />
          News
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'events'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CalendarDays className="h-4 w-4 inline mr-2" />
          Events
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {activeTab === 'news' ? (
              <>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
                <SelectItem value="notice">Notice</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="festival">Festival</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="celebration">Celebration</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      {(isCreating || editingItem) && (
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-orange-800">
                {isCreating ? 'Add New' : 'Edit'} {activeTab === 'news' ? 'News Article' : 'Event'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={activeTab === 'news' ? newsForm.title : eventForm.title}
                    onChange={(e) => {
                      if (activeTab === 'news') {
                        setNewsForm({ ...newsForm, title: e.target.value });
                      } else {
                        setEventForm({ ...eventForm, title: e.target.value });
                      }
                    }}
                    placeholder="Enter title"
                    maxLength={255}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {(activeTab === 'news' ? newsForm.title : eventForm.title).length}/255 characters
                  </div>
                </div>
                {/* Removed Hindi title field to keep a single title input */}
              </div>

              {/* News-specific fields */}
              {activeTab === 'news' && (
                <>
                  {/* State/District selection for superadmins */}
                  {currentUser && (currentUser.type === 'superadmin' || currentUser.role === 'superadmin') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-200 pb-4 mb-4 ">
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Select 
                          value={newsForm.state} 
                          onValueChange={(value) => {
                            setNewsForm({ ...newsForm, state: value, district: '' });
                            setDistricts([]);
                          }}
                          disabled={loadingStates}
                        >
                          <SelectTrigger className={loadingStates ? 'opacity-50' : ''}>
                            <SelectValue placeholder={loadingStates ? "Loading states..." : "Select state"} />
                          </SelectTrigger>
                          <SelectContent>
                            {states.length === 0 && !loadingStates ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">No states available</div>
                            ) : (
                              states.map((state) => (
                                <SelectItem key={state.id} value={String(state.id)}>
                                  {state.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {loadingStates && (
                          <p className="text-xs text-gray-500 mt-1">Loading states...</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="district">District *</Label>
                        <Select 
                          value={newsForm.district} 
                          onValueChange={(value) => setNewsForm({ ...newsForm, district: value })}
                          disabled={!newsForm.state || loadingDistricts}
                        >
                          <SelectTrigger className={(!newsForm.state || loadingDistricts) ? 'opacity-50' : ''}>
                            <SelectValue placeholder={
                              loadingDistricts 
                                ? "Loading districts..." 
                                : !newsForm.state 
                                  ? "Select state first" 
                                  : districts.length === 0
                                    ? "No districts found"
                                    : "Select district"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.length === 0 && newsForm.state && !loadingDistricts ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">No districts available for this state</div>
                            ) : (
                              districts.map((district) => (
                                <SelectItem key={district.id} value={district.id}>
                                  {district.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {loadingDistricts && (
                          <p className="text-xs text-gray-500 mt-1">Loading districts...</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="news_type">Type</Label>
                      <Select value={newsForm.news_type} onValueChange={(value) => setNewsForm({ ...newsForm, news_type: value as News['news_type'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="achievement">Achievement</SelectItem>
                          <SelectItem value="notice">Notice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={newsForm.priority} onValueChange={(value) => setNewsForm({ ...newsForm, priority: value as News['priority'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="order">Order</Label>
                      <Input
                        id="order"
                        type="number"
                        value={newsForm.order}
                        onChange={(e) => setNewsForm({ ...newsForm, order: parseInt(e.target.value) || 0 })}
                        placeholder="Display order"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={newsForm.excerpt}
                      onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                      placeholder="Brief description"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {newsForm.excerpt.length}/500 characters
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={newsForm.content}
                      onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                      placeholder="Full article content"
                      rows={8}
                      maxLength={5000}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {newsForm.content.length}/5000 characters
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_featured"
                        checked={newsForm.is_featured}
                        onCheckedChange={(checked) => setNewsForm({ ...newsForm, is_featured: checked })}
                      />
                      <Label htmlFor="is_featured">Featured</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_published"
                        checked={newsForm.is_published}
                        onCheckedChange={(checked) => setNewsForm({ ...newsForm, is_published: checked })}
                      />
                      <Label htmlFor="is_published">Published</Label>
                    </div>
                  </div>
                </>
              )}

              {/* Event-specific fields */}
              {activeTab === 'events' && (
                <>
                  {/* State/District selection for superadmins */}
                  {currentUser && (currentUser.type === 'superadmin' || currentUser.role === 'superadmin') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-200 pb-4 mb-4">
                      <div>
                        <Label htmlFor="event_state">State *</Label>
                        <Select 
                          value={eventForm.state} 
                          onValueChange={(value) => {
                            setEventForm({ ...eventForm, state: value, district: '' });
                            setDistricts([]);
                          }}
                          disabled={loadingStates}
                        >
                          <SelectTrigger className={loadingStates ? 'opacity-50' : ''}>
                            <SelectValue placeholder={loadingStates ? "Loading states..." : "Select state"} />
                          </SelectTrigger>
                          <SelectContent>
                            {states.length === 0 && !loadingStates ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">No states available</div>
                            ) : (
                              states.map((state) => (
                                <SelectItem key={state.id} value={String(state.id)}>
                                  {state.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {loadingStates && (
                          <p className="text-xs text-gray-500 mt-1">Loading states...</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="event_district">District *</Label>
                        <Select 
                          value={eventForm.district} 
                          onValueChange={(value) => setEventForm({ ...eventForm, district: value })}
                          disabled={!eventForm.state || loadingDistricts}
                        >
                          <SelectTrigger className={(!eventForm.state || loadingDistricts) ? 'opacity-50' : ''}>
                            <SelectValue placeholder={
                              loadingDistricts 
                                ? "Loading districts..." 
                                : !eventForm.state 
                                  ? "Select state first" 
                                  : districts.length === 0
                                    ? "No districts found"
                                    : "Select district"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.length === 0 && eventForm.state && !loadingDistricts ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">No districts available for this state</div>
                            ) : (
                              districts.map((district) => (
                                <SelectItem key={district.id} value={district.id}>
                                  {district.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {loadingDistricts && (
                          <p className="text-xs text-gray-500 mt-1">Loading districts...</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      placeholder="Event description"
                    rows={4}
                    maxLength={5000}
                    />
                  <div className="text-xs text-gray-500 mt-1">
                    {eventForm.description.length}/5000 characters
                  </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event_date">Event Date *</Label>
                      <Input
                        id="event_date"
                        type="date"
                        value={eventForm.event_date}
                        onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="event_time">Event Time</Label>
                      <Input
                        id="event_time"
                        type="time"
                        value={eventForm.event_time}
                        onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={eventForm.end_date}
                        onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={eventForm.end_time}
                        onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={eventForm.location}
                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                        placeholder="Event location"
                      />
                    </div>
                    <div>
                      <Label htmlFor="event_type">Event Type</Label>
                      <Select value={eventForm.event_type} onValueChange={(value) => setEventForm({ ...eventForm, event_type: value as Event['event_type'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="festival">Festival</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="celebration">Celebration</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={eventForm.address}
                      onChange={(e) => setEventForm({ ...eventForm, address: e.target.value })}
                      placeholder="Full address"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="order">Order</Label>
                      <Input
                        id="order"
                        type="number"
                        value={eventForm.order}
                        onChange={(e) => setEventForm({ ...eventForm, order: parseInt(e.target.value) || 0 })}
                        placeholder="Display order"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_participants">Max Participants</Label>
                      <Input
                        id="max_participants"
                        type="number"
                        value={eventForm.max_participants}
                        onChange={(e) => setEventForm({ ...eventForm, max_participants: parseInt(e.target.value) || 0 })}
                        placeholder="Maximum participants"
                      />
                    </div>
                    <div>
                      <Label htmlFor="registration_url">Registration URL</Label>
                      <Input
                        id="registration_url"
                        type="url"
                        value={eventForm.registration_url}
                        onChange={(e) => setEventForm({ ...eventForm, registration_url: e.target.value })}
                        placeholder="Registration link"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="registration_required"
                        checked={eventForm.registration_required}
                        onCheckedChange={(checked) => setEventForm({ ...eventForm, registration_required: checked })}
                      />
                      <Label htmlFor="registration_required">Registration Required</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isVisible"
                        checked={eventForm.isVisible}
                        onCheckedChange={(checked) => setEventForm({ ...eventForm, isVisible: checked })}
                      />
                      <Label htmlFor="isVisible">Visible</Label>
                    </div>
                  </div>
                </>
              )}

              {/* Image Upload */}
              <div className="space-y-3">
                <Label htmlFor="image_path">Image</Label>
                
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    id="image_file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="image_file"
                    className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB
                    </span>
                  </label>
                </div>

                {/* URL Input */}
                <div className="relative">
                  <Input
                    id="image_path"
                    value={activeTab === 'news' ? newsForm.image_path : eventForm.image_path}
                    onChange={(e) => {
                      if (activeTab === 'news') {
                        setNewsForm({ ...newsForm, image_path: e.target.value });
                      } else {
                        setEventForm({ ...eventForm, image_path: e.target.value });
                      }
                    }}
                    placeholder="Or enter image URL"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-xs text-gray-500">URL</span>
                  </div>
                </div>

                {/* Image Preview */}
                {((activeTab === 'news' && newsForm.image_path) || (activeTab === 'events' && eventForm.image_path)) && (
                  <div className="mt-3">
                    <Label className="text-sm text-gray-600">Preview:</Label>
                    <div className="mt-1 w-full max-w-48 h-32 border rounded-lg overflow-hidden">
                      <img
                        src={activeTab === 'news' ? newsForm.image_path : eventForm.image_path}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isCreating ? 'Create' : 'Update'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                  {item.title_hindi && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{item.title_hindi}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {activeTab === 'news' ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (item as News).news_type === 'announcement' ? 'bg-blue-100 text-blue-800' :
                      (item as News).news_type === 'update' ? 'bg-green-100 text-green-800' :
                      (item as News).news_type === 'achievement' ? 'bg-yellow-100 text-yellow-800' :
                      (item as News).news_type === 'notice' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {(item as News).news_type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (item as News).priority === 'high' ? 'bg-red-100 text-red-800' :
                      (item as News).priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {(item as News).priority}
                    </span>
                    {(item as News).is_featured && (
                      <Star className="h-4 w-4 text-yellow-500" />
                    )}
                    {(item as News).is_published ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  {(item as News).excerpt && (
                    <p className="text-sm text-gray-600 line-clamp-2">{(item as News).excerpt}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date((item as Event).event_date).toLocaleDateString()}</span>
                    {(item as Event).event_time && (
                      <>
                        <Clock className="h-4 w-4" />
                        <span>{(item as Event).event_time}</span>
                      </>
                    )}
                  </div>
                  {(item as Event).location && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{(item as Event).location}</span>
                    </div>
                  )}
                  {(item as Event).registration_required && (
                    <div className="flex items-center space-x-2 text-sm text-orange-600">
                      <Users className="h-4 w-4" />
                      <span>Registration Required</span>
                    </div>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (item as Event).event_type === 'festival' ? 'bg-purple-100 text-purple-800' :
                    (item as Event).event_type === 'meeting' ? 'bg-blue-100 text-blue-800' :
                    (item as Event).event_type === 'celebration' ? 'bg-pink-100 text-pink-800' :
                    (item as Event).event_type === 'workshop' ? 'bg-green-100 text-green-800' :
                    (item as Event).event_type === 'conference' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {(item as Event).event_type}
                  </span>
                </div>
              )}

              <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Order: {item.order}</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {activeTab === 'news' ? <Newspaper className="h-12 w-12 mx-auto" /> : <CalendarDays className="h-12 w-12 mx-auto" />}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : `Get started by adding your first ${activeTab === 'news' ? 'news article' : 'event'}.`
            }
          </p>
          {(!searchQuery && filterType === 'all') && (
            <Button onClick={startCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add {activeTab === 'news' ? 'News' : 'Event'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
