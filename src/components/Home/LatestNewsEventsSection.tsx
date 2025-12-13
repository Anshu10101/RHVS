"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NewsItem = {
  id: number;
  title: string;
  title_hindi?: string;
  summary?: string;
  content?: string;
  news_type?: string;
  is_featured?: 0 | 1 | boolean;
  is_published?: 0 | 1 | boolean;
  published_at?: string;
  image_path?: string;
  district?: string;
  state?: string;
};

type EventItem = {
  id: number;
  title: string;
  title_hindi?: string;
  description?: string;
  event_type?: string;
  event_date?: string;
  isVisible?: boolean;
  image_path?: string;
  location?: string;
  district?: string;
  state?: string;
};

export default function LatestNewsEventsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [newsRes, eventsRes] = await Promise.all([
          fetch(`/api/content/news?limit=3`, { cache: "no-store" }),
          fetch(`/api/content/events?limit=3&upcoming=false`, { cache: "no-store" })
        ]);
        const newsData = await newsRes.json();
        const eventsData = await eventsRes.json();
        if (!mounted) return;
        if (newsData?.success) setNews(newsData.data || []);
        if (eventsData?.success) setEvents(eventsData.data || []);
      } catch (e) {
        console.error("Failed to load news/events", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!loading && news.length === 0 && events.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h3 className="uppercase font-bold mb-2 text-orange-700">News & Events</h3>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-orange-800">समाचार और आयोजन</h2>
          <p className="max-w-2xl mx-auto text-gray-700">
            संगठन की महत्वपूर्ण खबरें और हालिया आयोजनों की मुख्य बातें।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* News column */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-orange-800">नवीनतम समाचार</h3>
              <Link href="/news" className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 hover:text-orange-800 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer">
                View all
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {(loading ? Array.from<Record<string, unknown> | undefined>({ length: 3 }).map(() => undefined) : news.slice(0, 3)).map((item, i) => (
                <article key={item?.id || i} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-orange-100/50">
                  {item && item.image_path ? (
                    <Link href={`/news/${item.id}`} className="aspect-video overflow-hidden block bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_path} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </Link>
                  ) : null}
                  <div className="p-4">
                    {loading ? (
                      <div className="h-16 animate-pulse bg-orange-50 rounded" />
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                              item?.news_type === 'announcement' ? 'bg-red-100 text-red-800 border-red-200' :
                              item?.news_type === 'update' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              item?.news_type === 'achievement' ? 'bg-green-100 text-green-800 border-green-200' :
                              item?.news_type === 'notice' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              <span className="ml-0.5">
                                {item?.news_type === 'announcement' ? 'घोषणा' :
                                 item?.news_type === 'update' ? 'अपडेट' :
                                 item?.news_type === 'achievement' ? 'उपलब्धि' :
                                 item?.news_type === 'notice' ? 'सूचना' : 'सामान्य'}
                              </span>
                            </span>
                            {(item?.district || item?.state) && (
                              <div className="flex items-center gap-1">
                                {item?.district && item.district !== 'All Districts' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">{item.district}</span>
                                )}
                                {item?.state && item.state !== 'All States' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">{item.state}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Link href={`/news/${item?.id ?? ''}`}>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-orange-600 transition-colors">
                            {item?.title_hindi || item?.title}
                          </h4>
                        </Link>
                        {(item?.summary || item?.content) && (
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item?.summary || item?.content}</p>
                        )}
                        <div className="text-sm text-gray-500">
                          {item?.published_at ? new Date(item.published_at).toLocaleDateString() : ''}
                        </div>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Events column */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-orange-800">नवीनतम आयोजन</h3>
              <Link href="/events" className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 hover:text-orange-800 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer">
                View all
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {(loading ? Array.from<Record<string, unknown> | undefined>({ length: 3 }).map(() => undefined) : events.slice(0, 3)).map((item, i) => (
                <article key={item?.id || i} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-orange-100/50">
                  {item && item.image_path ? (
                    <Link href={`/events/${item.id}`} className="block bg-gray-50">
                      <div className="w-full h-56 flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_path} alt={item.title} className="max-h-full max-w-full object-contain" />
                      </div>
                    </Link>
                  ) : null}
                  <div className="p-3">
                    {loading ? (
                      <div className="h-16 animate-pulse bg-orange-50 rounded" />
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            item?.event_type === 'festival' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            item?.event_type === 'meeting' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            item?.event_type === 'workshop' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            item?.event_type === 'conference' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                            item?.event_type === 'celebration' ? 'bg-pink-100 text-pink-800 border-pink-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {item?.event_type === 'festival' ? 'त्योहार' :
                             item?.event_type === 'meeting' ? 'बैठक' :
                             item?.event_type === 'workshop' ? 'कार्यशाला' :
                             item?.event_type === 'conference' ? 'सम्मेलन' :
                             item?.event_type === 'celebration' ? 'उत्सव' : 'अन्य'}
                          </span>
                        </div>
                        <Link href={`/events/${item?.id ?? ''}`}>
                          <h4 className="text-base md:text-lg font-bold text-gray-900 mb-1 hover:text-orange-700">
                            {item?.title_hindi || item?.title}
                          </h4>
                        </Link>
                        {item?.description && (
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                        )}
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>{item?.event_date ? new Date(item.event_date).toLocaleDateString() : ''}</div>
                          {item?.location && <div>{item.location}</div>}
                        </div>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


