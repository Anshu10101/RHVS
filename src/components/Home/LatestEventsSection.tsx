"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import EventCard from "./EventCard";

type EventItem = {
  id: number | string;
  title: string;
  title_hindi?: string;
  description?: string;
  image_path?: string;
  event_type?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
  created_at?: string;
  creator_name?: string;
  creator_photo?: string;
  creator_email?: string;
};

export default function LatestEventsSection() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/content/events?limit=10", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        if (data?.success) setEvents(data.data || []);
      } catch (e) {
        console.error("Failed to load events", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    
    const cardWidth = el.querySelector('article')?.getBoundingClientRect().width || 0;
    const gap = 16; // gap-4 = 1rem = 16px
    const scrollAmount = cardWidth + gap;
    
    el.scrollTo({
      left: el.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount),
      behavior: 'smooth'
    });
  };

  if (!loading && events.length === 0) return null;

  return (
    <section className="py-14 bg-gradient-to-b from-orange-50/40 to-white">
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-between md:justify-center mb-8">
          <div className="md:text-center">
            <div className="flex items-center justify-start md:justify-center gap-2 mb-3">
              <Calendar className="h-6 w-6 text-orange-500" />
              <p className="text-sm uppercase tracking-widest text-orange-600 font-semibold">Upcoming Events</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-orange-900 mb-2">
              आगामी कार्यक्रम
            </h2>
            <p className="text-gray-600 text-sm md:text-base">Join us for our upcoming events and celebrations</p>
          </div>
          <Link href="/events" className="absolute right-0 text-sm font-semibold text-orange-700 hover:text-orange-800 hover:underline whitespace-nowrap">
            सभी देखें →
          </Link>
        </div>

        <div className="relative -mx-4 px-4">
          <div
            ref={scrollerRef}
            className="grid grid-flow-col auto-cols-[70%] sm:auto-cols-[55%] md:auto-cols-[45%] lg:auto-cols-[32%] xl:auto-cols-[30%] gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="snap-center shrink-0 bg-white rounded-xl sm:rounded-2xl border border-orange-100/60 overflow-hidden shadow-sm animate-pulse"
                  >
                    <div className="w-full h-40 sm:h-56 md:h-64 bg-gray-200" />
                    <div className="p-3 sm:p-4 md:p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-20" />
                      <div className="h-6 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="flex items-center gap-3 pt-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-24" />
                          <div className="h-2 bg-gray-200 rounded w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              : events.map((event) => (
                  <div key={event.id} className="snap-center shrink-0">
                    <EventCard event={event} />
                  </div>
                ))}
          </div>
          {!loading && events.length > 1 && (
            <>
              <button
                aria-label="Previous events"
                onClick={() => scrollByAmount('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-orange-700 border border-orange-200 rounded-full p-2 shadow-lg transition-all hover:scale-110"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                aria-label="Next events"
                onClick={() => scrollByAmount('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-orange-700 border border-orange-200 rounded-full p-2 shadow-lg transition-all hover:scale-110"
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


