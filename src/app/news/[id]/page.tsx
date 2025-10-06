"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Star, ArrowLeft, Share2, Eye, User, ChevronLeft, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        
        // Fetch the specific news article
        const response = await fetch(`/api/content/news?id=${params.id}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          setNews(data.data[0]);
          
          // Fetch related news (same type, excluding current)
          const relatedResponse = await fetch(`/api/content/news?type=${data.data[0].news_type}&limit=4`);
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
    };

    if (params.id) {
      fetchNews();
    }
  }, [params.id]);

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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <article className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Featured Image */}
            {news.image_path && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={news.image_path}
                  alt={news.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8">
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
              <h1 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight ${devanagari.className}`}>
                {news.title_hindi || news.title}
              </h1>

              {/* Article Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
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

              {/* Content */}
              <div className={`prose prose-lg max-w-none ${devanagari.className}`}>
                <div className="text-gray-800 leading-relaxed text-base md:text-lg whitespace-pre-line">
                  {news.content}
                </div>
              </div>
            </div>
          </article>

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
