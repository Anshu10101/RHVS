"use client";
import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Star, Heart, Sparkles, Search, ChevronLeft, ChevronRight, Filter, Newspaper, CalendarDays, Users, ExternalLink, ArrowRight, Bell, Megaphone, Award, FileText, Eye, Share2, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Noto_Serif_Devanagari } from 'next/font/google';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

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
  published_at: string;
  created_at: string;
  district?: string;
  state?: string;
}

interface Event {
  id: string;
  title: string;
  title_hindi?: string;
  description?: string;
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
  event_type: 'festival' | 'meeting' | 'workshop' | 'conference' | 'celebration' | 'other';
  district?: string;
  state?: string;
}

export default function NewsAndEventsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'news' | 'events'>('news');
  const [selectedNewsType, setSelectedNewsType] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);
  const [openEvent, setOpenEvent] = useState<Event | null>(null);

  // Featured news pagination
  const [featuredPage, setFeaturedPage] = useState<number>(0);
  const [featuredItemsPerPage] = useState<number>(3); // 1 main + 2 secondary

  // Location filter states
  type StateOption = { id: string; name: string };
  type DistrictOption = { id: string; name: string };
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedStateName, setSelectedStateName] = useState<string>('All');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('All');

  // Close modals with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openEvent) setOpenEvent(null);
      }
    };
    if (openEvent) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [openEvent]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load states for filters
        const statesRes = await fetch('/api/states', { cache: 'no-store' });
        const statesData = await statesRes.json();
        if (statesData?.success && Array.isArray(statesData.data)) {
          const opts: StateOption[] = statesData.data.map((s: any) => ({ id: String(s.id), name: String(s.name) }));
          setStateOptions(opts);
        }

        // Fetch news
        const newsResponse = await fetch('/api/content/news?limit=20');
        const newsData = await newsResponse.json();
        if (newsData.success) {
          setNews(newsData.data);
        }

        // Fetch events
        const eventsResponse = await fetch('/api/content/events?upcoming=true&limit=20');
        const eventsData = await eventsResponse.json();
        if (eventsData.success) {
          setEvents(eventsData.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters when filter criteria change
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Filter news
    let newsResult = [...news];
    
    if (selectedNewsType !== 'all') {
      newsResult = newsResult.filter(item => item.news_type === selectedNewsType);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      newsResult = newsResult.filter(item => 
        item.title.toLowerCase().includes(query) ||
        (item.title_hindi && item.title_hindi.toLowerCase().includes(query)) ||
        item.content.toLowerCase().includes(query)
      );
    }
    
    // Location filtering
    if (selectedStateName !== 'All') {
      newsResult = newsResult.filter(item => (item.state || '').toLowerCase() === selectedStateName.toLowerCase());
    }
    if (selectedDistrictName !== 'All') {
      newsResult = newsResult.filter(item => (item.district || '').toLowerCase() === selectedDistrictName.toLowerCase());
    }
    
    setFilteredNews(newsResult);

    // Filter events
    let eventsResult = [...events];
    
    if (selectedEventType !== 'all') {
      eventsResult = eventsResult.filter(item => item.event_type === selectedEventType);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      eventsResult = eventsResult.filter(item => 
        item.title.toLowerCase().includes(query) ||
        (item.title_hindi && item.title_hindi.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }
    
    // Location filtering
    if (selectedStateName !== 'All') {
      eventsResult = eventsResult.filter(item => (item.state || '').toLowerCase() === selectedStateName.toLowerCase());
    }
    if (selectedDistrictName !== 'All') {
      eventsResult = eventsResult.filter(item => (item.district || '').toLowerCase() === selectedDistrictName.toLowerCase());
    }
    
    if (showUpcomingOnly) {
      eventsResult = eventsResult.filter(item => new Date(item.event_date) >= new Date());
    }
    
    setFilteredEvents(eventsResult);
  }, [news, events, selectedNewsType, selectedEventType, searchQuery, selectedStateName, selectedDistrictName, showUpcomingOnly]);

  // Helper functions
  const getNewsTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="w-4 h-4" />;
      case 'update': return <Bell className="w-4 h-4" />;
      case 'achievement': return <Award className="w-4 h-4" />;
      case 'notice': return <FileText className="w-4 h-4" />;
      default: return <Newspaper className="w-4 h-4" />;
    }
  };

  const handleShare = async (newsItem: News) => {
    const shareData = {
      title: newsItem.title_hindi || newsItem.title,
      text: newsItem.excerpt || newsItem.title,
      url: `${window.location.origin}/news/${newsItem.id}`,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        alert('लिंक कॉपी हो गया!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Final fallback: Copy URL to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('लिंक कॉपी हो गया!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        alert('शेयर करने में त्रुटि हुई');
      }
    }
  };

  const getNewsTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'bg-red-100 text-red-800 border-red-200';
      case 'update': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'achievement': return 'bg-green-100 text-green-800 border-green-200';
      case 'notice': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'festival': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'workshop': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'conference': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'celebration': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="relative py-8 md:py-12 overflow-hidden bg-gradient-to-b from-orange-50/80 to-transparent backdrop-blur-sm">
        {/* Background decoration - more subtle */}
        <div className="absolute inset-0 [background:radial-gradient(400px_200px_at_50%_-5%,rgba(253,186,116,0.08),transparent)]" />
        
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-sm md:text-base mb-1 text-orange-600/80">॥ समाचार एवं कार्यक्रम ॥</h2>
          
          <h1 className={`${devanagari.className} text-2xl md:text-4xl font-bold mb-2 text-orange-800/90 tracking-tight`}>
            हमारी जानकारी
          </h1>

          {/* Lotus divider - smaller */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="h-px w-6 bg-orange-200/60" />
            <span className="text-lg">🪷</span>
            <span className="h-px w-6 bg-orange-200/60" />
          </div>
          
          <p className="text-sm md:text-base text-orange-600/70 mb-6 max-w-2xl mx-auto">
            Moments of devotion, community, and cultural celebration
          </p>
        </div>
      </section>


      {/* Event Detail Modal */}
      {openEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setOpenEvent(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenEvent(null)}
              className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full px-3 py-1 text-sm border"
            >
              बंद करें
            </button>
            {openEvent.image_path && (
              <div className="aspect-video overflow-hidden">
                <img src={openEvent.image_path} alt={openEvent.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 space-y-4">
              <h3 className="text-2xl font-bold">{openEvent.title_hindi || openEvent.title}</h3>
              {openEvent.description && (
                <p className="text-gray-700 whitespace-pre-line">{openEvent.description}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {formatDate(openEvent.event_date)}</div>
                {openEvent.event_time && (
                  <div className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {formatTime(openEvent.event_time)}</div>
                )}
                {openEvent.end_date && (
                  <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> समाप्ति: {formatDate(openEvent.end_date)}</div>
                )}
                {openEvent.end_time && (
                  <div className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {formatTime(openEvent.end_time)}</div>
                )}
                {openEvent.location && (
                  <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> {openEvent.location}</div>
                )}
                {openEvent.max_participants && (
                  <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> क्षमता: {openEvent.max_participants}</div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                {openEvent.registration_required && openEvent.registration_url ? (
                  <a
                    href={openEvent.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    पंजीकरण करें
                  </a>
                ) : (
                  <span className="text-sm text-gray-500">पंजीकरण आवश्यक नहीं</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Navigation Tabs */}
      <section className="py-2 bg-white/30 backdrop-blur-md sticky top-0 z-40 border-b border-orange-100/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Tabs */}
            <div className="flex space-x-1 bg-orange-100/60 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('news')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'news'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-orange-700/80 hover:bg-orange-100/60'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                <span>समाचार</span>
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'events'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-orange-700/80 hover:bg-orange-100/60'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>कार्यक्रम</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400" size={20} />
                <Input
                  type="text"
                  placeholder="खोजें..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-1.5 w-full md:w-64 border-orange-300/60 focus:border-orange-400"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {activeTab === 'news' ? (
                  <Select
                    value={selectedNewsType}
                    onValueChange={(value) => setSelectedNewsType(value)}
                  >
                    <SelectTrigger className="w-48 py-1.5 border-orange-300/60 focus:border-orange-400">
                      <SelectValue placeholder="सभी समाचार" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">सभी समाचार</SelectItem>
                      <SelectItem value="announcement">घोषणाएं</SelectItem>
                      <SelectItem value="update">अपडेट</SelectItem>
                      <SelectItem value="achievement">उपलब्धियां</SelectItem>
                      <SelectItem value="notice">सूचनाएं</SelectItem>
                      <SelectItem value="general">सामान्य</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={selectedEventType}
                    onValueChange={(value) => setSelectedEventType(value)}
                  >
                    <SelectTrigger className="w-48 py-1.5 border-orange-300/60 focus:border-orange-400">
                      <SelectValue placeholder="सभी कार्यक्रम" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">सभी कार्यक्रम</SelectItem>
                      <SelectItem value="festival">त्योहार</SelectItem>
                      <SelectItem value="meeting">बैठक</SelectItem>
                      <SelectItem value="workshop">कार्यशाला</SelectItem>
                      <SelectItem value="conference">सम्मेलन</SelectItem>
                      <SelectItem value="celebration">उत्सव</SelectItem>
                      <SelectItem value="other">अन्य</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                
                {/* Location Filters */}
                <Select
                  value={selectedStateId || 'all'}
                  onValueChange={async (id) => {
                    const actualId = id === 'all' ? '' : id;
                    setSelectedStateId(actualId);
                    const opt = stateOptions.find(s => s.id === actualId);
                    const name = opt?.name || 'All';
                    setSelectedStateName(name);
                    if (actualId) {
                      const res = await fetch(`/api/districts?stateId=${encodeURIComponent(actualId)}`, { cache: 'no-store' });
                      const data = await res.json();
                      if (data?.success && Array.isArray(data.data)) {
                        const dOpts = data.data.map((d: any) => ({ id: String(d.id), name: String(d.name) })) as DistrictOption[];
                        setDistrictOptions([{ id: 'all', name: 'All' }, ...dOpts]);
                        setSelectedDistrictName('All');
                      } else {
                        setDistrictOptions([{ id: 'all', name: 'All' }]);
                        setSelectedDistrictName('All');
                      }
                    } else {
                      setDistrictOptions([{ id: 'all', name: 'All' }]);
                      setSelectedDistrictName('All');
                    }
                  }}
                >
                  <SelectTrigger className="w-40 py-1.5 border-orange-300/60 focus:border-orange-400">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {stateOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedDistrictName || 'All'}
                  onValueChange={(value) => setSelectedDistrictName(value)}
                >
                  <SelectTrigger className="w-40 py-1.5 border-orange-300/60 focus:border-orange-400">
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Districts</SelectItem>
                    {districtOptions.filter(d => d.id !== 'all').map((district) => (
                      <SelectItem key={district.id} value={district.name}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">डेटा लोड हो रहा है...</p>
            </div>
          ) : (
            <>
              {activeTab === 'news' && (
                <div className="space-y-8">
                  {/* Featured News Hero Banner */}
                  {filteredNews.filter(item => item.is_featured).length > 0 && (
                    <section className="relative mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-orange-800/90 flex items-center">
                          <Star className="w-6 h-6 mr-2 text-orange-500" />
                        मुख्य समाचार
                          <span className="ml-3 text-sm font-normal text-orange-600/80">
                            ({filteredNews.filter(item => item.is_featured).length} समाचार)
                          </span>
                      </h2>
                        {Math.ceil(filteredNews.filter(item => item.is_featured).length / featuredItemsPerPage) > 1 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setFeaturedPage(Math.max(0, featuredPage - 1))}
                              disabled={featuredPage === 0}
                              className="p-2 rounded-lg bg-orange-100/60 hover:bg-orange-200/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4 text-orange-600" />
                            </button>
                            <span className="text-sm text-orange-600/80 px-2">
                              {featuredPage + 1} / {Math.ceil(filteredNews.filter(item => item.is_featured).length / featuredItemsPerPage)}
                            </span>
                            <button
                              onClick={() => setFeaturedPage(Math.min(
                                Math.ceil(filteredNews.filter(item => item.is_featured).length / featuredItemsPerPage) - 1,
                                featuredPage + 1
                              ))}
                              disabled={featuredPage >= Math.ceil(filteredNews.filter(item => item.is_featured).length / featuredItemsPerPage) - 1}
                              className="p-2 rounded-lg bg-orange-100/60 hover:bg-orange-200/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronRight className="w-4 h-4 text-orange-600" />
                            </button>
                              </div>
                            )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Get current page featured items */}
                        {(() => {
                          const featuredItems = filteredNews.filter(item => item.is_featured);
                          const startIndex = featuredPage * featuredItemsPerPage;
                          const currentPageItems = featuredItems.slice(startIndex, startIndex + featuredItemsPerPage);
                          const mainItem = currentPageItems[0];
                          const secondaryItems = currentPageItems.slice(1, 3);

                          return (
                            <>
                              {/* Main Featured Article */}
                              {mainItem && (
                                <div className="lg:col-span-2">
                                  <article className="relative h-96 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl overflow-hidden group cursor-pointer">
                                    <img 
                                      src={mainItem.image_path} 
                                      alt={mainItem.title}
                                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                      <span className="inline-block bg-red-500 px-3 py-1 rounded-full text-xs font-medium mb-3">
                                        मुख्य समाचार
                                  </span>
                                      <Link href={`/news/${mainItem.id}`}>
                                        <h2 className="text-2xl font-bold mb-2 line-clamp-2 hover:text-orange-200 transition-colors cursor-pointer">
                                          {mainItem.title_hindi || mainItem.title}
                                        </h2>
                                      </Link>
                                      <p className="text-white/90 text-sm line-clamp-2 mb-4">
                                        {mainItem.excerpt}
                                      </p>
                              <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/80">{formatDate(mainItem.published_at)}</span>
                                        <Link href={`/news/${mainItem.id}`} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                          पढ़ें
                                        </Link>
                              </div>
                            </div>
                          </article>
                                </div>
                              )}

                              {/* Secondary Featured Articles */}
                              <div className="space-y-4">
                                {secondaryItems.map((item) => (
                                  <article key={item.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-orange-100/50 hover:shadow-lg transition-all group">
                                    <Link href={`/news/${item.id}`} className="flex gap-3">
                                      {item.image_path && (
                                        <img src={item.image_path} alt={item.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-orange-600 transition-colors">
                                          {item.title_hindi || item.title}
                                        </h3>
                                        <p className="text-gray-600 text-xs line-clamp-2 mb-2">{item.excerpt}</p>
                                        <span className="text-xs text-gray-500">{formatDate(item.published_at)}</span>
                                      </div>
                                    </Link>
                          </article>
                        ))}
                      </div>
                            </>
                          );
                        })()}
                    </div>
                    </section>
                  )}

                  {/* All News */}
                  <div>
                    <h2 className="text-xl font-bold text-orange-800/90 mb-6">
                      सभी समाचार
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredNews.filter(item => !item.is_featured).map((item) => (
                        <article key={item.id} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-orange-100/50">
                          {item.image_path && (
                              <Link href={`/news/${item.id}`} className="aspect-video overflow-hidden cursor-pointer block">
                              <img
                                src={item.image_path}
                                alt={item.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                              </Link>
                          )}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getNewsTypeColor(item.news_type)}`}>
                                {getNewsTypeIcon(item.news_type)}
                                <span className="ml-1">
                                  {item.news_type === 'announcement' ? 'घोषणा' :
                                   item.news_type === 'update' ? 'अपडेट' :
                                   item.news_type === 'achievement' ? 'उपलब्धि' :
                                   item.news_type === 'notice' ? 'सूचना' : 'सामान्य'}
                                </span>
                              </span>
                                {(item.district || item.state) && (
                                  <div className="flex items-center gap-1">
                                    {item.district && item.district !== 'All Districts' && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {item.district}
                                      </span>
                                    )}
                                    {item.state && item.state !== 'All States' && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                        {item.state}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {item.is_featured && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <Link href={`/news/${item.id}`}>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-orange-600 transition-colors">
                              {item.title_hindi || item.title}
                            </h3>
                            </Link>
                            {item.excerpt && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {item.excerpt}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{formatDate(item.published_at)}</span>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare(item);
                                  }}
                                  className="text-gray-500 hover:text-orange-600 transition-colors"
                                  title="शेयर करें"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                                <Link href={`/news/${item.id}`} className="text-orange-600 hover:text-orange-700 font-medium">
                                पढ़ें
                                </Link>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-8">
                  {/* Upcoming Events */}
                  <div>
                    <h2 className="text-xl font-bold text-orange-800/90 mb-6 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                      आगामी कार्यक्रम
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredEvents.map((event) => (
                        <article key={event.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-orange-100/50">
                          {event.image_path && (
                            <Link href={`/events/${event.id}`} className="block bg-gray-50">
                              <div className="w-full h-72 md:h-80 lg:h-72 flex items-center justify-center overflow-hidden">
                                <img
                                  src={event.image_path}
                                  alt={event.title}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            </Link>
                          )}
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEventTypeColor(event.event_type)}`}>
                                {event.event_type === 'festival' ? 'त्योहार' :
                                 event.event_type === 'meeting' ? 'बैठक' :
                                 event.event_type === 'workshop' ? 'कार्यशाला' :
                                 event.event_type === 'conference' ? 'सम्मेलन' :
                                 event.event_type === 'celebration' ? 'उत्सव' : 'अन्य'}
                              </span>
                              {event.registration_required && (
                                <span className="text-[11px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                  पंजीकरण आवश्यक
                                </span>
                              )}
                            </div>
                            {(event.district || event.state) && (
                              <div className="flex items-center gap-1 mb-1">
                                {event.district && event.district !== 'All Districts' && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {event.district}
                                  </span>
                                )}
                                {event.state && event.state !== 'All States' && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
                                    {event.state}
                                  </span>
                                )}
                              </div>
                            )}
                            <Link href={`/events/${event.id}`}>
                              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 cursor-pointer hover:text-orange-700">
                                {event.title_hindi || event.title}
                              </h3>
                            </Link>
                            {event.description && (
                              <p className="text-gray-600 text-xs mb-2 line-clamp-1">
                                {event.description}
                              </p>
                            )}
                            <div className="space-y-1 mb-2">
                              <div className="flex items-center text-gray-600 text-xs">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>{formatDate(event.event_date)}</span>
                              </div>
                              {event.event_time && (
                                <div className="flex items-center text-gray-600 text-xs">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>{formatTime(event.event_time)}</span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center text-gray-600 text-xs">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              {event.registration_required && event.registration_url ? (
                                <a
                                  href={event.registration_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center text-xs"
                                >
                                  पंजीकरण करें
                                  <ExternalLink className="w-4 h-4 ml-1" />
                                </a>
                              ) : (
                                <Link href={`/events/${event.id}`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-md font-medium transition-colors text-xs">
                                  विवरण देखें
                                </Link>
                              )}
                              {event.max_participants && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {event.max_participants} सीटें
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-orange-100 to-red-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className={`${devanagari.className} text-3xl md:text-4xl font-bold mb-6 text-gray-900`}>
            सदस्य बनें
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            राष्ट्रीय हिंदू वाहिनी संगठन के साथ जुड़कर समाज सेवा में भाग लें
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full font-semibold transition-colors flex items-center justify-center">
              <Users className="w-5 h-5 mr-2" />
              सदस्यता लें
            </button>
            <button className="bg-white hover:bg-gray-50 text-orange-600 border-2 border-orange-600 px-8 py-3 rounded-full font-semibold transition-colors">
              संपर्क करें
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
