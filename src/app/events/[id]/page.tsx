"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Noto_Serif_Devanagari } from 'next/font/google';
import {
  ArrowLeft,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Users,
  ExternalLink,
} from 'lucide-react';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

interface EventItem {
  id: string;
  title: string;
  description: string;
  image_path?: string;
  event_date: string;
  event_time?: string;
  end_date?: string;
  end_time?: string;
  location?: string;
  address?: string;
  registration_required: boolean;
  registration_url?: string;
  max_participants?: number;
  event_type: 'festival' | 'meeting' | 'celebration' | 'workshop' | 'conference' | 'other';
  created_by: string;
  created_at: string;
  district?: string;
  state?: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [eventItem, setEventItem] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/content/events?id=${params.id}`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setEventItem(data.data[0]);
        } else {
          setError('कार्यक्रम नहीं मिला');
        }
      } catch (e) {
        console.error('Error fetching event:', e);
        setError('कार्यक्रम लोड करने में त्रुटि');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchEvent();
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    // Handles both ISO strings or HH:mm
    const date = new Date(`1970-01-01T${timeString.length <= 5 ? timeString : timeString}`);
    return date.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleShare = async () => {
    if (!eventItem) return;
    const shareData = {
      title: eventItem.title,
      text: eventItem.description?.slice(0, 140) || eventItem.title,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData as any);
      } else {
        const text = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(text);
        alert('लिंक कॉपी हो गया!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('लिंक कॉपी हो गया!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        alert('शेयर करने में त्रुटि हुई');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">कार्यक्रम लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  if (error || !eventItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">कार्यक्रम नहीं मिला</h1>
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
                <span className="text-2xl">📅</span>
                <span className="text-sm text-gray-600">कार्यक्रम</span>
              </div>
            </div>
            <Button onClick={handleShare} variant="outline" size="sm" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              शेयर करें
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <article className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Featured Image with transparent tags overlay */}
            {eventItem.image_path && (
              <div className="relative aspect-video overflow-hidden">
                <img src={eventItem.image_path} alt={eventItem.title} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="flex flex-wrap items-center gap-4 text-white">
                    <span className="inline-flex items-center gap-2 text-sm bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(eventItem.event_date)}
                        {eventItem.end_date ? ` - ${formatDate(eventItem.end_date)}` : ''}
                      </span>
                    </span>
                    {eventItem.event_time && (
                      <span className="inline-flex items-center gap-2 text-sm bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(eventItem.event_time)}
                          {eventItem.end_time ? ` - ${formatTime(eventItem.end_time)}` : ''}
                        </span>
                      </span>
                    )}
                    {eventItem.location && (
                      <span className="inline-flex items-center gap-2 text-sm bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        <MapPin className="w-4 h-4" />
                        <span>{eventItem.location}</span>
                      </span>
                    )}
                    {eventItem.max_participants && (
                      <span className="inline-flex items-center gap-2 text-sm bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Users className="w-4 h-4" />
                        <span>{eventItem.max_participants} सीटें</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="p-8">
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-orange-50 text-orange-700 border-orange-200">
                  कार्यक्रम
                </span>

                {eventItem.district || eventItem.state ? (
                  <div className="flex items-center gap-2">
                    {eventItem.district && eventItem.district !== 'All Districts' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <MapPin className="w-3 h-3 mr-1" />
                        {eventItem.district}
                      </span>
                    )}
                    {eventItem.state && eventItem.state !== 'All States' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        {eventItem.state}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Title */}
              <h1 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight ${devanagari.className}`}>
                {eventItem.title}
              </h1>

              {/* Date/Time/Location */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {formatDate(eventItem.event_date)}
                    {eventItem.end_date ? ` - ${formatDate(eventItem.end_date)}` : ''}
                  </span>
                </div>
                {eventItem.event_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatTime(eventItem.event_time)}
                      {eventItem.end_time ? ` - ${formatTime(eventItem.end_time)}` : ''}
                    </span>
                  </div>
                )}
                {eventItem.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{eventItem.location}</span>
                  </div>
                )}
                {eventItem.max_participants ? (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{eventItem.max_participants} सीटें</span>
                  </div>
                ) : null}
              </div>

              {/* Registration */}
              {eventItem.registration_required && eventItem.registration_url && (
                <div className="mb-6">
                  <a
                    href={eventItem.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    पंजीकरण करें
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </div>
              )}

              {/* Address */}
              {eventItem.address && (
                <div className="bg-gray-50 border-l-4 border-orange-500 p-4 mb-6">
                  <p className="text-gray-700 leading-relaxed">{eventItem.address}</p>
                </div>
              )}

              {/* Description */}
              <div className={`prose prose-lg max-w-none ${devanagari.className}`}>
                <div className="text-gray-800 leading-relaxed text-base md:text-lg whitespace-pre-line">
                  {eventItem.description}
                </div>
              </div>
            </div>
          </article>

          {/* Back to list */}
          <div className="mt-10 flex items-center justify-between">
            <Link href="/events" className="text-orange-600 hover:text-orange-700 font-medium">
              ← सभी कार्यक्रम
            </Link>
            <Button onClick={handleShare} variant="outline" size="sm" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              शेयर करें
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


