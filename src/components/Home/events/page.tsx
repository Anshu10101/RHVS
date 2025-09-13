"use client";
import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Star, Heart, Sparkles, Search, ChevronLeft, ChevronRight, Filter, Newspaper, CalendarDays, Users, ExternalLink, ArrowRight, Bell, Megaphone, Award, FileText, Eye, Share2 } from 'lucide-react';
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
  const [openNews, setOpenNews] = useState<News | null>(null);
  const [openEvent, setOpenEvent] = useState<Event | null>(null);

  // Close modals with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openNews) setOpenNews(null);
        if (openEvent) setOpenEvent(null);
      }
    };
    if (openNews || openEvent) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [openNews, openEvent]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
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

  // Filter functions
  const filteredNews = news.filter(item => {
    const typeMatch = selectedNewsType === 'all' || item.news_type === selectedNewsType;
    const searchMatch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title_hindi && item.title_hindi.includes(searchQuery)) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && searchMatch;
  });

  const filteredEvents = events.filter(item => {
    const typeMatch = selectedEventType === 'all' || item.event_type === selectedEventType;
    const searchMatch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title_hindi && item.title_hindi.includes(searchQuery)) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const upcomingMatch = !showUpcomingOnly || new Date(item.event_date) >= new Date();
    return typeMatch && searchMatch && upcomingMatch;
  });

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className={`${devanagari.className} text-4xl md:text-6xl font-bold mb-4`}>
            समाचार एवं कार्यक्रम
          </h1>
          <p className="text-lg md:text-xl mb-6 max-w-3xl mx-auto opacity-90">
            राष्ट्रीय हिंदू वाहिनी संगठन की नवीनतम समाचार और आगामी कार्यक्रमों की जानकारी
          </p>
          
          {/* Lotus divider */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="h-px w-10 bg-white/30" />
            <span className="text-2xl">🪷</span>
            <span className="h-px w-10 bg-white/30" />
          </div>
        </div>
      </section>

      {/* News Detail Modal */}
      {openNews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setOpenNews(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenNews(null)}
              className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full px-3 py-1 text-sm border"
            >
              बंद करें
            </button>
            {openNews.image_path && (
              <div className="aspect-video overflow-hidden">
                <img src={openNews.image_path} alt={openNews.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getNewsTypeColor(openNews.news_type)}`}>
                  {getNewsTypeIcon(openNews.news_type)}
                  <span className="ml-1">
                    {openNews.news_type === 'announcement' ? 'घोषणा' :
                     openNews.news_type === 'update' ? 'अपडेट' :
                     openNews.news_type === 'achievement' ? 'उपलब्धि' :
                     openNews.news_type === 'notice' ? 'सूचना' : 'सामान्य'}
                  </span>
                </span>
                <span className="text-sm text-gray-500">{formatDate(openNews.published_at)}</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">{openNews.title_hindi || openNews.title}</h3>
              {openNews.excerpt && (
                <p className="text-gray-700 mb-4">{openNews.excerpt}</p>
              )}
              <div className="prose max-w-none">
                <p className="whitespace-pre-line leading-relaxed text-gray-800">{openNews.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
      <section className="py-8 bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('news')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'news'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                <span>समाचार</span>
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'events'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>कार्यक्रम</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="खोजें..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full md:w-64"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {activeTab === 'news' ? (
                  <select
                    value={selectedNewsType}
                    onChange={(e) => setSelectedNewsType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">सभी समाचार</option>
                    <option value="announcement">घोषणाएं</option>
                    <option value="update">अपडेट</option>
                    <option value="achievement">उपलब्धियां</option>
                    <option value="notice">सूचनाएं</option>
                    <option value="general">सामान्य</option>
                  </select>
                ) : (
                  <select
                    value={selectedEventType}
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="all">सभी कार्यक्रम</option>
                    <option value="festival">त्योहार</option>
                    <option value="meeting">बैठक</option>
                    <option value="workshop">कार्यशाला</option>
                    <option value="conference">सम्मेलन</option>
                    <option value="celebration">उत्सव</option>
                    <option value="other">अन्य</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
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
                  {/* Featured News */}
                  {filteredNews.filter(item => item.is_featured).length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <Star className="w-6 h-6 mr-2 text-yellow-500" />
                        मुख्य समाचार
                      </h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredNews.filter(item => item.is_featured).slice(0, 2).map((item) => (
                          <article key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            {item.image_path && (
                              <div className="aspect-video overflow-hidden">
                                <img
                                  src={item.image_path}
                                  alt={item.title}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className="p-6">
                              <div className="flex items-center justify-between mb-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getNewsTypeColor(item.news_type)}`}>
                                  {getNewsTypeIcon(item.news_type)}
                                  <span className="ml-1">
                                    {item.news_type === 'announcement' ? 'घोषणा' :
                                     item.news_type === 'update' ? 'अपडेट' :
                                     item.news_type === 'achievement' ? 'उपलब्धि' :
                                     item.news_type === 'notice' ? 'सूचना' : 'सामान्य'}
                                  </span>
                                </span>
                                <span className={`text-sm font-medium ${getPriorityColor(item.priority)}`}>
                                  {item.priority === 'high' ? 'उच्च' : item.priority === 'medium' ? 'मध्यम' : 'निम्न'} प्राथमिकता
                                </span>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                {item.title_hindi || item.title}
                              </h3>
                              {item.excerpt && (
                                <p className="text-gray-600 mb-4 line-clamp-3">
                                  {item.excerpt}
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                  {formatDate(item.published_at)}
                                </span>
                                <button onClick={() => setOpenNews(item)} className="flex items-center text-orange-600 hover:text-orange-700 font-medium">
                                  पूरा पढ़ें
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All News */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      सभी समाचार
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredNews.map((item) => (
                        <article key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                          {item.image_path && (
                            <div onClick={() => setOpenNews(item)} className="aspect-video overflow-hidden cursor-pointer">
                              <img
                                src={item.image_path}
                                alt={item.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getNewsTypeColor(item.news_type)}`}>
                                {getNewsTypeIcon(item.news_type)}
                                <span className="ml-1">
                                  {item.news_type === 'announcement' ? 'घोषणा' :
                                   item.news_type === 'update' ? 'अपडेट' :
                                   item.news_type === 'achievement' ? 'उपलब्धि' :
                                   item.news_type === 'notice' ? 'सूचना' : 'सामान्य'}
                                </span>
                              </span>
                              {item.is_featured && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <h3 onClick={() => setOpenNews(item)} className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-orange-700">
                              {item.title_hindi || item.title}
                            </h3>
                            {item.excerpt && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {item.excerpt}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{formatDate(item.published_at)}</span>
                              <button onClick={() => setOpenNews(item)} className="text-orange-600 hover:text-orange-700 font-medium">
                                पढ़ें
                              </button>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Calendar className="w-6 h-6 mr-2 text-orange-500" />
                      आगामी कार्यक्रम
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredEvents.map((event) => (
                        <article key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                          {event.image_path && (
                            <div onClick={() => setOpenEvent(event)} className="aspect-video overflow-hidden cursor-pointer">
                              <img
                                src={event.image_path}
                                alt={event.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColor(event.event_type)}`}>
                                {event.event_type === 'festival' ? 'त्योहार' :
                                 event.event_type === 'meeting' ? 'बैठक' :
                                 event.event_type === 'workshop' ? 'कार्यशाला' :
                                 event.event_type === 'conference' ? 'सम्मेलन' :
                                 event.event_type === 'celebration' ? 'उत्सव' : 'अन्य'}
                              </span>
                              {event.registration_required && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                  पंजीकरण आवश्यक
                                </span>
                              )}
                            </div>
                            <h3 onClick={() => setOpenEvent(event)} className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-orange-700">
                              {event.title_hindi || event.title}
                            </h3>
                            {event.description && (
                              <p className="text-gray-600 mb-4 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-gray-600">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span className="text-sm">{formatDate(event.event_date)}</span>
                              </div>
                              {event.event_time && (
                                <div className="flex items-center text-gray-600">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span className="text-sm">{formatTime(event.event_time)}</span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center text-gray-600">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span className="text-sm">{event.location}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              {event.registration_required && event.registration_url ? (
                                <a
                                  href={event.registration_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                                >
                                  पंजीकरण करें
                                  <ExternalLink className="w-4 h-4 ml-1" />
                                </a>
                              ) : (
                                <button onClick={() => setOpenEvent(event)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
                                  विवरण देखें
                                </button>
                              )}
                              {event.max_participants && (
                                <span className="text-sm text-gray-500 flex items-center">
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