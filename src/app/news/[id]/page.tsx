"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Star, ArrowLeft, Share2, Eye, User, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Noto_Serif_Devanagari } from 'next/font/google';
import Link from 'next/link';

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
  youtube_video_url?: string;
  news_type: 'announcement' | 'update' | 'achievement' | 'notice' | 'general';
  priority: 'high' | 'medium' | 'low';
  is_featured: boolean;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  district?: string;
  state?: string;
}

export default function NewsArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [news, setNews] = useState<News | null>(null);
  const [relatedNews, setRelatedNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use timestamp for cache-busting
      const timestamp = Date.now();
      
      // Fetch the specific news article with aggressive cache control
      const response = await fetch(`/api/content/news?id=${params.id}&_t=${timestamp}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setNews(data.data[0]);
        
        // Fetch related news (same type, excluding current)
        const relatedResponse = await fetch(`/api/content/news?type=${data.data[0].news_type}&limit=4&_t=${timestamp}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });
        const relatedData = await relatedResponse.json();
        
        if (relatedData.success) {
          const filteredRelated = relatedData.data.filter((item: News) => item.id !== params.id);
          setRelatedNews(filteredRelated.slice(0, 3));
        }
      } else {
        setError('समाचार नहीं मिला');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('समाचार लोड करने में त्रुटि');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchNews();
    }
  }, [params.id, fetchNews]);

  // Reload news when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && params.id) {
        // Reload news when page becomes visible
        fetchNews();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [params.id, fetchNews]);

  const handleShare = async () => {
    if (!news) return;

    const shareData = {
      title: news.title_hindi || news.title,
      text: news.excerpt || news.title,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(shareText);
        alert('लिंक कॉपी हो गया!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('लिंक कॉपी हो गया!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        alert('शेयर करने में त्रुटि हुई');
      }
    }
  };

  const getNewsTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'update': return '🔔';
      case 'achievement': return '🏆';
      case 'notice': return '📄';
      default: return '📰';
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

  const getNewsTypeLabel = (type: string) => {
    switch (type) {
      case 'announcement': return 'घोषणा';
      case 'update': return 'अपडेट';
      case 'achievement': return 'उपलब्धि';
      case 'notice': return 'सूचना';
      default: return 'सामान्य';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('hi-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string | undefined): string | null => {
    if (!url || !url.trim()) return null;
    
    const trimmedUrl = url.trim();
    
    // Handle various YouTube URL formats
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
    
    // If it's already an embed URL or contains the video ID, try to extract
    if (trimmedUrl.includes('embed/')) {
      const embedMatch = trimmedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch && embedMatch[1]) {
        return embedMatch[1];
      }
    }
    
    // Handle YouTube Shorts URLs
    if (trimmedUrl.includes('/shorts/')) {
      const shortsMatch = trimmedUrl.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch && shortsMatch[1]) {
        return shortsMatch[1];
      }
    }
    
    console.warn('Could not extract YouTube video ID from URL:', trimmedUrl);
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">समाचार लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">समाचार नहीं मिला</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            वापस जाएं
          </Button>
        </div>
      </div>
    );
  }

  const youtubeVideoId = getYouTubeVideoId(news.youtube_video_url);
  
  // Debug logging (remove in production if needed)
  if (news.youtube_video_url && !youtubeVideoId) {
    console.warn('YouTube URL provided but could not extract video ID:', news.youtube_video_url);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                वापस
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getNewsTypeIcon(news.news_type)}</span>
                <span className="text-sm text-gray-600">समाचार</span>
              </div>
            </div>
            
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              शेयर करें
            </Button>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Main Content Layout - Centered News with Video at Extreme Right */}
        <div className="container mx-auto px-4 py-8">
          {/* Container for News Article and Video - Video sticks only within this container */}
          <div className={`relative ${youtubeVideoId ? 'lg:flex lg:justify-center' : ''}`}>
            {/* Main News Content - Exactly Centered */}
            <article className={`bg-white rounded-lg shadow-lg overflow-hidden ${youtubeVideoId ? 'max-w-3xl' : 'max-w-4xl mx-auto'}`}>
              {/* Featured Image (only if no video) */}
              {!youtubeVideoId && news.image_path && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={news.image_path}
                    alt={news.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6 md:p-8">
                {/* Article Meta */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getNewsTypeColor(news.news_type)}`}>
                    {getNewsTypeIcon(news.news_type)}
                    <span className="ml-2">{getNewsTypeLabel(news.news_type)}</span>
                  </span>
                  
                  {news.is_featured && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                      <Star className="w-4 h-4 mr-1" />
                      मुख्य समाचार
                    </span>
                  )}

                  {(news.district || news.state) && (
                    <div className="flex items-center gap-2">
                      {news.district && news.district !== 'All Districts' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <MapPin className="w-3 h-3 mr-1" />
                          {news.district}
                        </span>
                      )}
                      {news.state && news.state !== 'All States' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          {news.state}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight ${devanagari.className}`}>
                  {news.title_hindi || news.title}
                </h1>

                {/* Article Meta Info */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(news.published_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(news.published_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{news.created_by}</span>
                  </div>
                </div>

                {/* Excerpt */}
                {news.excerpt && (
                  <div className="bg-gray-50 border-l-4 border-orange-500 p-4 mb-6">
                    <p className="text-gray-700 italic text-lg leading-relaxed">
                      {news.excerpt}
                    </p>
                  </div>
                )}

                {/* Featured Image (shown if video exists) */}
                {youtubeVideoId && news.image_path && (
                  <div className="mb-8">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-md">
                      <img
                        src={news.image_path}
                        alt={news.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className={`prose prose-lg max-w-none ${devanagari.className}`}>
                  <div className="text-gray-800 leading-relaxed text-base md:text-lg whitespace-pre-line">
                    {news.content}
                  </div>
                </div>
              </div>
            </article>

            {/* YouTube Video - Sticky only within article container (Desktop) */}
            {youtubeVideoId && (
              <aside className="hidden lg:block lg:absolute lg:right-0 lg:top-0 w-80 lg:ml-8">
                <div className="sticky" style={{ top: '96px' }}>
                  <div className="relative w-full rounded-lg overflow-hidden bg-black shadow-xl" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1&enablejsapi=1`}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      style={{ border: 'none' }}
                    />
                  </div>
                </div>
              </aside>
            )}
          </div>

          {/* YouTube Video - Mobile View (shown above news on small screens) */}
          {youtubeVideoId && (
            <div className="lg:hidden mt-8 max-w-md mx-auto mb-8">
              <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1&enablejsapi=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  style={{ border: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Related Articles */}
          {relatedNews.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">संबंधित समाचार</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedNews.map((related) => (
                  <Link key={related.id} href={`/news/${related.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        {related.image_path && (
                          <div className="aspect-video overflow-hidden rounded-lg mb-3">
                            <img
                              src={related.image_path}
                              alt={related.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getNewsTypeColor(related.news_type)}`}>
                            {getNewsTypeIcon(related.news_type)}
                            <span className="ml-1">{getNewsTypeLabel(related.news_type)}</span>
                          </span>
                          <h3 className="font-semibold text-gray-900 line-clamp-2">
                            {related.title_hindi || related.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(related.published_at)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
