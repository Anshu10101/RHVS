"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Newspaper, Share2, Calendar, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Noto_Serif_Devanagari } from 'next/font/google';
import { useLanguage } from '@/contexts/LanguageContext';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

type NewsItem = {
  id: number | string;
  title: string;
  title_hindi?: string;
  excerpt?: string;
  content?: string;
  image_path?: string;
  news_type?: string;
  published_at?: string;
  district?: string;
  state?: string;
};

export default function LatestNewsSection() {
  const { t } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const firstTrackRef = useRef<HTMLDivElement | null>(null);
  const seqWidthRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const isTouchingRef = useRef<boolean>(false);
  const resumeTimerRef = useRef<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const stepWidthRef = useRef<number>(320);
  const movingRef = useRef<boolean>(false);
  const targetRef = useRef<number>(0);
  const dwellTimerRef = useRef<number | null>(null);
  const initializedRef = useRef<boolean>(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const handleShare = async (item: NewsItem) => {
    const url = `${window.location.origin}/news/${item.id}`;
    const share = {
      title: item.title || "RHVS Sangathan",
      text: item.excerpt || item.content || "",
      url,
    };
    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share(share);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${share.title}\n${url}`);
        alert("लिंक कॉपी हो गया!");
      }
    } catch (e) {
      console.error("Share failed", e);
    }
  };

  const loadNews = useCallback(async () => {
    let mounted = true;
    try {
      const res = await fetch(`/api/content/news?limit=10&_t=${Date.now()}`, { 
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      const data = await res.json();
      if (!mounted) return;
      if (data?.success) setNews(data.data || []);
    } catch (e) {
      console.error("Failed to load news", e);
    } finally {
      if (mounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();

    // Reload when page becomes visible (user returns from admin panel or switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadNews();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadNews]);

  // measure first track width for seamless wrap
  useEffect(() => {
    if (!firstTrackRef.current || loading || news.length === 0) return;
    const measure = () => {
      if (firstTrackRef.current) {
        seqWidthRef.current = firstTrackRef.current.scrollWidth;
        const firstCard = firstTrackRef.current.firstElementChild as HTMLElement | null;
        if (firstCard) {
          // include gap-4 => 1rem => 16px
          stepWidthRef.current = firstCard.getBoundingClientRect().width + 16;
        }
      }
    };
    // Delay measurement slightly to ensure DOM is ready
    const timeoutId = setTimeout(measure, 100);
    const ro = new ResizeObserver(() => measure());
    if (firstTrackRef.current) ro.observe(firstTrackRef.current);
    return () => {
      clearTimeout(timeoutId);
      ro.disconnect();
    };
  }, [loading, news.length]);

  // auto-scroll like marquee with pause on interaction
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || loading || news.length === 0) {
      initializedRef.current = false;
      setIsScrolling(false);
      if (dwellTimerRef.current) {
        window.clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
      return;
    }

    // Recursive function to handle the marquee loop
    const moveToNext = () => {
      const currentEl = scrollerRef.current;
      if (!currentEl) return;
      
      // Check if user is interacting - if so, wait
      if (isHovering || isTouchingRef.current) {
        // Retry after a short delay
        if (dwellTimerRef.current) window.clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = window.setTimeout(() => {
          moveToNext();
        }, 500);
        return;
      }
      
      // Wait before moving (dwell time)
      if (dwellTimerRef.current) window.clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = window.setTimeout(() => {
        const currentEl = scrollerRef.current;
        if (!currentEl || isHovering || isTouchingRef.current) {
          moveToNext(); // Retry
          return;
        }
        
        movingRef.current = true;
        setIsScrolling(true);
        
        // Calculate next target
        let nextTarget = currentEl.scrollLeft + (stepWidthRef.current || 320);
        const max = seqWidthRef.current || 0;
        
        // Handle seamless wrap
        if (max > 0 && nextTarget >= max) {
          nextTarget -= max;
          currentEl.scrollLeft -= max; // Reset instantly for seamless loop
        }
        
        targetRef.current = nextTarget;
        
        // Smooth scroll to next card - scroll-snap will center it
        currentEl.scrollTo({ left: nextTarget, behavior: "smooth" });
        
        // After scroll animation completes, schedule next move
        const scrollDuration = 1000; // Match smooth scroll duration
        if (dwellTimerRef.current) window.clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = window.setTimeout(() => {
          const currentEl = scrollerRef.current;
          if (!currentEl) return;
          setIsScrolling(false);
          movingRef.current = false;
          // Schedule next movement
          moveToNext();
        }, scrollDuration);
      }, 1600); // Dwell time: 1.6 seconds (slowed down a bit)
    };

    // Initialize and start the loop
    if (!initializedRef.current) {
      initializedRef.current = true;
      movingRef.current = false;
      // Start after initial delay
      if (dwellTimerRef.current) window.clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = window.setTimeout(() => {
        moveToNext();
      }, 1500);
    } else if (!isHovering && !isTouchingRef.current && !movingRef.current && !dwellTimerRef.current) {
      // Resume if paused (e.g., after hover ends)
      moveToNext();
    }

    return () => {
      if (dwellTimerRef.current) {
        window.clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
    };
  }, [loading, news.length, isHovering]);

  // Early return after all hooks - but we'll conditionally render instead
  if (!loading && news.length === 0) return null;

  const scrollByAmount = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    isTouchingRef.current = true;
    movingRef.current = false;
    setIsScrolling(true);
    if (dwellTimerRef.current) {
      window.clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    const amount = (stepWidthRef.current || 320) * dir;
    const targetPos = el.scrollLeft + amount;
    el.scrollTo({ left: targetPos, behavior: "smooth" });
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      isTouchingRef.current = false;
      setIsScrolling(false);
      movingRef.current = false;
      // Marquee will resume automatically via useEffect
    }, 1000);
  };

  return (
    <section className="py-14 bg-white">
      <div className="container mx-auto px-4">
        <div className="relative mb-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-300" />
              <span className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-orange-600/80">
                {t('news.title')}
              </span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-300" />
            </div>
            <h2 className={`${devanagari.className} text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-gray-900 leading-tight`}>
              {t('news.header')}
            </h2>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4 md:mb-0">
              {t('news.description')}
            </p>
          </div>
          <Link href="/news" className="group absolute top-0 right-0 hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 hover:text-orange-800 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer whitespace-nowrap">
            {t('news.viewAll')}
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
          <div className="flex justify-center md:hidden mt-4">
            <Link href="/news" className="group inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 hover:text-orange-800 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer">
              {t('news.viewAll')}
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>

        <div className="relative -mx-4 px-4">
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onTouchStart={() => {
              isTouchingRef.current = true;
              setIsHovering(true);
            }}
            onTouchEnd={() => {
              isTouchingRef.current = false;
              setIsHovering(false);
            }}
          >
            <div ref={firstTrackRef} className="flex gap-4">
              {(loading ? Array.from({ length: 6 }) : news).map((item, i) => (
                <article
                  key={`a-${(item as NewsItem)?.id ?? i}`}
                  className="snap-center shrink-0 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-white/90 border border-orange-100/60 rounded-2xl shadow-sm hover:shadow-lg transition overflow-hidden"
                >
                  {/* header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-full overflow-hidden bg-white ring-1 ring-orange-200 flex items-center justify-center">
                        <Image src="/rhvs_logo.png" alt="RHVS" width={24} height={24} />
                      </span>
                      <div className="leading-tight">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{t('news.rhvsSangathan')}</p>
                      </div>
                    </div>
                    <button
                      className="text-orange-600 hover:text-orange-700"
                      onClick={() => handleShare(item as NewsItem)}
                      aria-label={t('news.share')}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* media */}
                  {(item as NewsItem)?.image_path ? (
                    <Link href={`/news/${(item as NewsItem).id}`} className="block bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={(item as NewsItem).image_path}
                        alt={(item as NewsItem).title}
                        className="w-full h-56 object-cover"
                      />
                    </Link>
                  ) : null}

                  {/* content */}
                  <div className="p-4 space-y-2">
                    <Link href={`/news/${(item as NewsItem)?.id ?? ""}`}>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 hover:text-orange-700 line-clamp-2">
                        {(item as NewsItem)?.title_hindi || (item as NewsItem)?.title || "•••"}
                      </h3>
                    </Link>
                    {(item as NewsItem)?.excerpt || (item as NewsItem)?.content ? (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {(item as NewsItem)?.excerpt || (item as NewsItem)?.content}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        {(item as NewsItem)?.published_at
                          ? new Date((item as NewsItem).published_at!).toLocaleDateString()
                          : ""}
                      </span>
                      {(item as NewsItem)?.district && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {(item as NewsItem).district}
                        </span>
                      )}
                      {(item as NewsItem)?.state && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                          {(item as NewsItem).state}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {/* duplicate track for seamless wrap */}
            {!loading && news.length > 0 && (
              <div className="flex gap-4" aria-hidden>
                {news.map((item, i) => (
                  <article
                    key={`b-${(item as NewsItem)?.id ?? i}`}
                    className="snap-center shrink-0 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-white/90 border border-orange-100/60 rounded-2xl shadow-sm hover:shadow-lg transition overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-8 w-8 rounded-full overflow-hidden bg-white ring-1 ring-orange-200 flex items-center justify-center">
                          <Image src="/rhvs_logo.png" alt="RHVS" width={24} height={24} />
                        </span>
                        <div className="leading-tight">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{t('news.rhvsSangathan')}</p>
                        </div>
                      </div>
                      <button className="text-orange-600 hover:text-orange-700" aria-label={t('news.share')}>
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    {(item as NewsItem)?.image_path ? (
                      <Link href={`/news/${(item as NewsItem).id}`} className="block bg-gray-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={(item as NewsItem).image_path}
                          alt={(item as NewsItem).title}
                          className="w-full h-56 object-cover"
                        />
                      </Link>
                    ) : null}
                    <div className="p-4 space-y-2">
                      <Link href={`/news/${(item as NewsItem)?.id ?? ""}`}>
                        <h3 className="text-base md:text-lg font-bold text-gray-900 hover:text-orange-700 line-clamp-2">
                          {(item as NewsItem)?.title_hindi || (item as NewsItem)?.title || "•••"}
                        </h3>
                      </Link>
                      {(item as NewsItem)?.excerpt || (item as NewsItem)?.content ? (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {(item as NewsItem)?.excerpt || (item as NewsItem)?.content}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-orange-500" />
                          {(item as NewsItem)?.published_at
                            ? new Date((item as NewsItem).published_at!).toLocaleDateString()
                            : ""}
                        </span>
                        {(item as NewsItem)?.district && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {(item as NewsItem).district}
                          </span>
                        )}
                        {(item as NewsItem)?.state && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                            {(item as NewsItem).state}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
          {!loading && news.length > 1 && (
            <>
              <button
                aria-label={t('news.previous')}
                onClick={() => scrollByAmount(-1)}
                className="flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-orange-700 border border-orange-200 rounded-full p-2 shadow"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                aria-label={t('news.next')}
                onClick={() => scrollByAmount(1)}
                className="flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-orange-700 border border-orange-200 rounded-full p-2 shadow"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}


