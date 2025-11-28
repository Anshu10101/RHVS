"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar, CalendarDays, Clock, ExternalLink, MapPin, Search, Users, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Noto_Serif_Devanagari } from "next/font/google";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import EventCard from "@/components/Home/EventCard";
import { useLanguage } from "@/contexts/LanguageContext";

const devanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
});

interface EventItem {
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
  event_type: "festival" | "meeting" | "workshop" | "conference" | "celebration" | "other";
  district?: string;
  state?: string;
  created_at?: string;
  creator_name?: string;
  creator_photo?: string;
  creator_email?: string;
}

type StateOption = { id: string; name: string };
type DistrictOption = { id: string; name: string };

export default function EventsPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);

  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([{ id: "All", name: "All Districts" }]);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedStateName, setSelectedStateName] = useState("All");
  const [selectedDistrictName, setSelectedDistrictName] = useState("All");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const [statesRes, eventsRes] = await Promise.all([
        fetch(`/api/states?_t=${timestamp}`, { 
          cache: "no-store",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        }),
        fetch(`/api/content/events?page=${currentPage}&limit=12&_t=${timestamp}`, { 
          cache: "no-store",
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        }),
      ]);
      const statesData = await statesRes.json();
      if (statesData?.success && Array.isArray(statesData.data)) {
        const opts = statesData.data.map((s: { id: string | number; name: string }) => ({
          id: String(s.id),
          name: String(s.name),
        }));
        setStateOptions(opts);
      }
      const eventsData = await eventsRes.json();
      if (eventsData?.success && Array.isArray(eventsData.data)) {
        setEvents(eventsData.data);
        setTotalPages(eventsData.totalPages || 1);
        setTotalEvents(eventsData.total || 0);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Reload events when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reload events when page becomes visible
        loadEvents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadEvents]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEventType, selectedStateName, selectedDistrictName, searchQuery, showUpcomingOnly]);


  const filteredEvents = useMemo(() => {
    let result = [...events];
    
    if (selectedEventType !== "all") {
      result = result.filter((event) => event.event_type === selectedEventType);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(q) ||
          (event.title_hindi && event.title_hindi.toLowerCase().includes(q)) ||
          (event.description && event.description.toLowerCase().includes(q))
      );
    }
    
    if (selectedStateName !== "All") {
      result = result.filter((event) => (event.state || "").toLowerCase() === selectedStateName.toLowerCase());
    }

    if (selectedDistrictName !== "All") {
      result = result.filter((event) => (event.district || "").toLowerCase() === selectedDistrictName.toLowerCase());
    }
    
    if (showUpcomingOnly) {
      const now = new Date();
      result = result.filter((event) => new Date(event.event_date) >= now);
    }
    
    return result;
  }, [events, selectedEventType, searchQuery, selectedStateName, selectedDistrictName, showUpcomingOnly]);

  const getEventTypeColor = (type: EventItem["event_type"]) => {
    switch (type) {
      case "festival":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "meeting":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "workshop":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "conference":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "celebration":
        return "bg-pink-100 text-pink-800 border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <section className="relative py-10 md:py-14 overflow-hidden bg-gradient-to-b from-orange-50/80 to-transparent">
        <div className="absolute inset-0 [background:radial-gradient(400px_200px_at_50%_-5%,rgba(253,186,116,0.08),transparent)]" />
        <div className="container mx-auto px-4 text-center relative">
          <p className="text-sm md:text-base mb-2 text-orange-600/80">{t('events.title')}</p>
          <h1 className={`${devanagari.className} text-3xl md:text-4xl font-bold text-orange-900 mb-3`}>{t('events.ourEvents')}</h1>
          <p className="text-sm md:text-base text-orange-700/80 max-w-2xl mx-auto">
            {t('events.subtitle')}
          </p>
        </div>
      </section>

      <section className="py-4 bg-white/80 backdrop-blur border-y border-orange-100/80 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Mobile: search + hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
              <Input
                placeholder={t('events.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border-orange-200 focus:border-orange-400"
              />
            </div>
            <Sheet>
              <SheetTrigger className="shrink-0 rounded-lg border border-orange-200 p-2 text-orange-700">
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-11/12 sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>{t('events.filter')}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
                    <Input
                      placeholder="कार्यक्रम खोजें..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger className="w-full border-orange-200">
                      <SelectValue placeholder={t('events.allEvents')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('events.allEvents')}</SelectItem>
                      <SelectItem value="festival">{t('events.festival')}</SelectItem>
                      <SelectItem value="meeting">{t('events.meeting')}</SelectItem>
                      <SelectItem value="workshop">{t('events.workshop')}</SelectItem>
                      <SelectItem value="conference">{t('events.conference')}</SelectItem>
                      <SelectItem value="celebration">{t('events.celebration')}</SelectItem>
                      <SelectItem value="other">{t('events.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedStateId || "all"}
                    onValueChange={async (id) => {
                      const actualId = id === "all" ? "" : id;
                      setSelectedStateId(actualId);
                      const state = stateOptions.find((s) => s.id === actualId);
                      const stateName = state?.name || "All";
                      setSelectedStateName(stateName);
                      if (actualId) {
                        try {
                          const res = await fetch(`/api/districts?stateId=${encodeURIComponent(actualId)}&_t=${Date.now()}`, { 
                            cache: "no-store",
                            headers: {
                              'Cache-Control': 'no-cache, no-store, must-revalidate',
                              'Pragma': 'no-cache',
                            }
                          });
                          const data = await res.json();
                          if (data?.success && Array.isArray(data.data)) {
                            const dOpts = data.data.map((d: { id: string | number; name: string }) => ({
                              id: String(d.id),
                              name: String(d.name),
                            }));
                            setDistrictOptions([{ id: "All", name: "All Districts" }, ...dOpts]);
                            setSelectedDistrictName("All");
                          }
                        } catch (error) {
                          console.error("Failed to load districts:", error);
                          setDistrictOptions([{ id: "All", name: "All Districts" }]);
                          setSelectedDistrictName("All");
                        }
                      } else {
                        setDistrictOptions([{ id: "All", name: "All Districts" }]);
                        setSelectedDistrictName("All");
                      }
                    }}
                  >
                    <SelectTrigger className="w-full border-orange-200">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {stateOptions.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedDistrictName} onValueChange={setSelectedDistrictName}>
                    <SelectTrigger className="w-full border-orange-200">
                      <SelectValue placeholder="All Districts" />
                    </SelectTrigger>
                    <SelectContent>
                      {districtOptions.map((district) => (
                        <SelectItem key={district.id} value={district.name}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between pt-2">
                    <label className="text-sm text-orange-700 font-medium">{t('events.upcomingOnly')}</label>
                    <button
                      onClick={() => setShowUpcomingOnly((prev) => !prev)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        showUpcomingOnly ? "bg-orange-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          showUpcomingOnly ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          {/* Desktop/tablet filters */}
          <div className="hidden md:flex flex-col md:flex-row gap-3 w-full lg:w-auto">
            <Select value={selectedEventType} onValueChange={setSelectedEventType}>
              <SelectTrigger className="w-full md:w-48 border-orange-200 focus:border-orange-400">
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

            <Select
              value={selectedStateId || "all"}
              onValueChange={async (id) => {
                const actualId = id === "all" ? "" : id;
                setSelectedStateId(actualId);
                const state = stateOptions.find((s) => s.id === actualId);
                const stateName = state?.name || "All";
                setSelectedStateName(stateName);
                if (actualId) {
                  try {
                    const res = await fetch(`/api/districts?stateId=${encodeURIComponent(actualId)}&_t=${Date.now()}`, { 
                      cache: "no-store",
                      headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                      }
                    });
                    const data = await res.json();
                    if (data?.success && Array.isArray(data.data)) {
                      const dOpts = data.data.map((d: { id: string | number; name: string }) => ({
                        id: String(d.id),
                        name: String(d.name),
                      }));
                      setDistrictOptions([{ id: "All", name: "All Districts" }, ...dOpts]);
                      setSelectedDistrictName("All");
                    }
                  } catch (error) {
                    console.error("Failed to load districts:", error);
                    setDistrictOptions([{ id: "All", name: "All Districts" }]);
                    setSelectedDistrictName("All");
                  }
                } else {
                  setDistrictOptions([{ id: "All", name: "All Districts" }]);
                  setSelectedDistrictName("All");
                }
              }}
            >
              <SelectTrigger className="w-full md:w-44 border-orange-200 focus:border-orange-400">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {stateOptions.map((state) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDistrictName} onValueChange={setSelectedDistrictName}>
              <SelectTrigger className="w-full md:w-44 border-orange-200 focus:border-orange-400">
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent>
                {districtOptions.map((district) => (
                  <SelectItem key={district.id} value={district.name}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <label className="text-sm text-orange-700 font-medium">केवल आगामी</label>
            <button
              onClick={() => setShowUpcomingOnly((prev) => !prev)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                showUpcomingOnly ? "bg-orange-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  showUpcomingOnly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>


      <section className="py-10">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto" />
              <p className="mt-6 text-orange-700">{t('events.loadingEvents')}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div>
                  <h2 className="text-2xl font-bold text-orange-900 flex items-center gap-2">
                    <CalendarDays className="text-orange-500" />
                    {t('events.upcomingEvents')}
                    </h2>
                  <p className="text-sm text-orange-700/80">{t('events.eventsSubtitle')}</p>
                                  </div>
                <Link href="/news" className="text-sm font-semibold text-orange-700 hover:text-orange-800">
                  {t('events.viewNews')}
                                </Link>
                              </div>

              {filteredEvents.length === 0 ? (
                <div className="text-center py-16 bg-white/70 rounded-2xl border border-dashed border-orange-200">
                  <Calendar className="w-10 h-10 mx-auto text-orange-500 mb-3" />
                  <p className="text-orange-700 font-medium">{t('events.noEventsAvailable')}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        {t('events.showing')} <span className="font-semibold">{(currentPage - 1) * 12 + 1}</span> {t('events.to')}{' '}
                        <span className="font-semibold">{Math.min(currentPage * 12, totalEvents)}</span> {t('events.of')}{' '}
                        <span className="font-semibold">{totalEvents}</span> {t('events.events')}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                          <ChevronLeft size={16} />
                          {t('events.previous')}
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 min-w-[40px] text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-orange-600 text-white'
                                    : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                          {t('events.next')}
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      
    </div>
  );
}


