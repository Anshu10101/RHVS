"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Megaphone,
  Bell,
  Award,
  FileText,
  Newspaper,
  Search,
  Share2,
  Users,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { Noto_Serif_Devanagari } from "next/font/google";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const devanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
});

interface NewsItem {
  id: string;
  title: string;
  title_hindi?: string;
  content: string;
  excerpt?: string;
  image_path?: string;
  news_type: "announcement" | "update" | "achievement" | "notice" | "general";
  priority: "high" | "medium" | "low";
  is_featured: boolean;
  published_at: string;
  created_at: string;
  district?: string;
  state?: string;
}

type StateOption = { id: string; name: string };
type DistrictOption = { id: string; name: string };

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNewsType, setSelectedNewsType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([{ id: "All", name: "All Districts" }]);
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedStateName, setSelectedStateName] = useState<string>("All");
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("All");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNews, setTotalNews] = useState(0);

  // Marquee refs and state for Top Stories
  const featuredScrollerRef = useRef<HTMLDivElement | null>(null);
  const featuredFirstTrackRef = useRef<HTMLDivElement | null>(null);
  const featuredSeqWidthRef = useRef<number>(0);
  const featuredStepWidthRef = useRef<number>(400);
  const featuredRafIdRef = useRef<number | null>(null);
  const featuredIsTouchingRef = useRef<boolean>(false);
  const featuredResumeTimerRef = useRef<number | null>(null);
  const [featuredIsHovering, setFeaturedIsHovering] = useState(false);
  const featuredMovingRef = useRef<boolean>(false);
  const featuredTargetRef = useRef<number>(0);
  const featuredDwellTimerRef = useRef<number | null>(null);
  const featuredInitializedRef = useRef<boolean>(false);
  const [featuredIsScrolling, setFeaturedIsScrolling] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statesRes, newsRes] = await Promise.all([
          fetch("/api/states", { cache: "no-store" }),
          fetch(`/api/content/news?page=${currentPage}&limit=12`),
        ]);
        const statesData = await statesRes.json();
        if (statesData?.success && Array.isArray(statesData.data)) {
          const opts = statesData.data.map((s: { id: string | number; name: string }) => ({
            id: String(s.id),
            name: String(s.name),
          }));
          setStateOptions(opts);
        }

        const newsData = await newsRes.json();
        if (newsData?.success && Array.isArray(newsData.data)) {
          setNews(newsData.data);
          setTotalPages(newsData.totalPages || 1);
          setTotalNews(newsData.total || 0);
        }
      } catch (error) {
        console.error("Failed to load news:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedNewsType, selectedStateName, selectedDistrictName, searchQuery]);

  const filteredNews = useMemo(() => {
    let result = [...news];

    if (selectedNewsType !== "all") {
      result = result.filter((item) => item.news_type === selectedNewsType);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.title_hindi && item.title_hindi.toLowerCase().includes(q)) ||
          item.content.toLowerCase().includes(q)
      );
    }

    if (selectedStateName !== "All") {
      result = result.filter((item) => (item.state || "").toLowerCase() === selectedStateName.toLowerCase());
    }

    if (selectedDistrictName !== "All") {
      result = result.filter((item) => (item.district || "").toLowerCase() === selectedDistrictName.toLowerCase());
    }

    return result;
  }, [news, selectedNewsType, searchQuery, selectedStateName, selectedDistrictName]);

  const featuredNews = filteredNews.filter((item) => item.is_featured);

  // Measure featured marquee width for seamless wrap
  useEffect(() => {
    if (!featuredFirstTrackRef.current || loading || featuredNews.length === 0) return;
    const measure = () => {
      if (featuredFirstTrackRef.current) {
        featuredSeqWidthRef.current = featuredFirstTrackRef.current.scrollWidth;
        const firstCard = featuredFirstTrackRef.current.firstElementChild as HTMLElement | null;
        if (firstCard) {
          // include gap-4 => 1rem => 16px
          featuredStepWidthRef.current = firstCard.getBoundingClientRect().width + 16;
        }
      }
    };
    const timeoutId = setTimeout(measure, 100);
    const ro = new ResizeObserver(() => measure());
    if (featuredFirstTrackRef.current) ro.observe(featuredFirstTrackRef.current);
    return () => {
      clearTimeout(timeoutId);
      ro.disconnect();
    };
  }, [loading, featuredNews.length]);

  // Auto-scroll marquee for featured news
  useEffect(() => {
    const el = featuredScrollerRef.current;
    if (!el || loading || featuredNews.length === 0) {
      featuredInitializedRef.current = false;
      setFeaturedIsScrolling(false);
      if (featuredDwellTimerRef.current) {
        window.clearTimeout(featuredDwellTimerRef.current);
        featuredDwellTimerRef.current = null;
      }
      return;
    }

    const moveToNext = () => {
      const currentEl = featuredScrollerRef.current;
      if (!currentEl) return;
      
      if (featuredIsHovering || featuredIsTouchingRef.current) {
        if (featuredDwellTimerRef.current) window.clearTimeout(featuredDwellTimerRef.current);
        featuredDwellTimerRef.current = window.setTimeout(() => {
          moveToNext();
        }, 500);
        return;
      }
      
      if (featuredDwellTimerRef.current) window.clearTimeout(featuredDwellTimerRef.current);
      featuredDwellTimerRef.current = window.setTimeout(() => {
        const currentEl = featuredScrollerRef.current;
        if (!currentEl || featuredIsHovering || featuredIsTouchingRef.current) {
          moveToNext();
          return;
        }
        
        featuredMovingRef.current = true;
        setFeaturedIsScrolling(true);
        
        let nextTarget = currentEl.scrollLeft + (featuredStepWidthRef.current || 400);
        const max = featuredSeqWidthRef.current || 0;
        
        if (max > 0 && nextTarget >= max) {
          nextTarget -= max;
          currentEl.scrollLeft -= max;
        }
        
        featuredTargetRef.current = nextTarget;
        currentEl.scrollTo({ left: nextTarget, behavior: "smooth" });
        
        const scrollDuration = 1000;
        if (featuredDwellTimerRef.current) window.clearTimeout(featuredDwellTimerRef.current);
        featuredDwellTimerRef.current = window.setTimeout(() => {
          const currentEl = featuredScrollerRef.current;
          if (!currentEl) return;
          setFeaturedIsScrolling(false);
          featuredMovingRef.current = false;
          moveToNext();
        }, scrollDuration);
      }, 4000); // Dwell time: 4 seconds
    };

    if (!featuredInitializedRef.current) {
      featuredInitializedRef.current = true;
      featuredMovingRef.current = false;
      if (featuredDwellTimerRef.current) window.clearTimeout(featuredDwellTimerRef.current);
      featuredDwellTimerRef.current = window.setTimeout(() => {
        moveToNext();
      }, 1500);
    } else if (!featuredIsHovering && !featuredIsTouchingRef.current && !featuredMovingRef.current && !featuredDwellTimerRef.current) {
      moveToNext();
    }

    return () => {
      if (featuredDwellTimerRef.current) {
        window.clearTimeout(featuredDwellTimerRef.current);
        featuredDwellTimerRef.current = null;
      }
    };
  }, [loading, featuredNews.length, featuredIsHovering]);

  const scrollFeaturedByAmount = (dir: number) => {
    const el = featuredScrollerRef.current;
    if (!el) return;
    featuredIsTouchingRef.current = true;
    featuredMovingRef.current = false;
    setFeaturedIsScrolling(true);
    if (featuredDwellTimerRef.current) {
      window.clearTimeout(featuredDwellTimerRef.current);
      featuredDwellTimerRef.current = null;
    }
    const amount = (featuredStepWidthRef.current || 400) * dir;
    const targetPos = el.scrollLeft + amount;
    el.scrollTo({ left: targetPos, behavior: "smooth" });
    if (featuredResumeTimerRef.current) window.clearTimeout(featuredResumeTimerRef.current);
    featuredResumeTimerRef.current = window.setTimeout(() => {
      featuredIsTouchingRef.current = false;
      setFeaturedIsScrolling(false);
      featuredMovingRef.current = false;
    }, 1000);
  };

  const getNewsTypeIcon = (type: NewsItem["news_type"]) => {
    switch (type) {
      case "announcement":
        return <Megaphone className="w-4 h-4" />;
      case "update":
        return <Bell className="w-4 h-4" />;
      case "achievement":
        return <Award className="w-4 h-4" />;
      case "notice":
        return <FileText className="w-4 h-4" />;
      default:
        return <Newspaper className="w-4 h-4" />;
    }
  };

  const getNewsTypeColor = (type: NewsItem["news_type"]) => {
    switch (type) {
      case "announcement":
        return "bg-red-100 text-red-800 border-red-200";
      case "update":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "achievement":
        return "bg-green-100 text-green-800 border-green-200";
      case "notice":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleShare = async (newsItem: NewsItem) => {
    const shareData = {
      title: newsItem.title_hindi || newsItem.title,
      text: newsItem.excerpt || newsItem.title,
      url: `${window.location.origin}/news/${newsItem.id}`,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
        alert("लिंक कॉपी हो गया!");
      }
    } catch (error) {
      console.error("Share failed:", error);
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert("लिंक कॉपी हो गया!");
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError);
        alert("शेयर करने में त्रुटि हुई");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <section className="relative py-10 md:py-14 overflow-hidden bg-gradient-to-b from-orange-50/80 to-transparent">
        <div className="absolute inset-0 [background:radial-gradient(400px_200px_at_50%_-5%,rgba(253,186,116,0.08),transparent)]" />
        <div className="container mx-auto px-4 text-center relative">
          <p className="text-sm md:text-base mb-1 text-orange-600/80">॥ नवीनतम समाचार ॥</p>
          <h1 className={`${devanagari.className} text-3xl md:text-4xl font-bold text-orange-900 mb-3`}>
            संगठन की खबरें
          </h1>
          <p className="text-sm md:text-base text-orange-700/80 max-w-2xl mx-auto">
            राष्ट्रीय हिंदू वाहिनी संगठन के नवीनतम अपडेट, घोषणाएँ और उपलब्धियाँ
          </p>
        </div>
      </section>

      <section className="py-4 bg-white/80 backdrop-blur-md border-y border-orange-100/60 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Mobile: search + hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
              <Input
                placeholder="समाचार खोजें..."
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
                  <SheetTitle>फ़िल्टर</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={20} />
                    <Input
                      placeholder="समाचार खोजें..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <Select value={selectedNewsType} onValueChange={setSelectedNewsType}>
                    <SelectTrigger className="w-full border-orange-200">
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
                          const res = await fetch(`/api/districts?stateId=${encodeURIComponent(actualId)}`, { cache: "no-store" });
                          const data = await res.json();
                          if (data?.success && Array.isArray(data.data)) {
                            const districts = data.data.map((d: { id: string | number; name: string }) => ({
                              id: String(d.id),
                              name: String(d.name),
                            }));
                            setDistrictOptions([{ id: "All", name: "All Districts" }, ...districts]);
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
          {/* Desktop/tablet filters */}
          <div className="hidden md:flex flex-col md:flex-row gap-3 w-full lg:w-auto">
            <Select value={selectedNewsType} onValueChange={setSelectedNewsType}>
              <SelectTrigger className="w-full md:w-48 border-orange-200 focus:border-orange-400">
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
                    const res = await fetch(`/api/districts?stateId=${encodeURIComponent(actualId)}`, { cache: "no-store" });
                    const data = await res.json();
                    if (data?.success && Array.isArray(data.data)) {
                      const districts = data.data.map((d: { id: string | number; name: string }) => ({
                        id: String(d.id),
                        name: String(d.name),
                      }));
                      setDistrictOptions([{ id: "All", name: "All Districts" }, ...districts]);
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
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto" />
              <p className="mt-6 text-orange-700">समाचार लोड हो रहे हैं...</p>
            </div>
          ) : (
            <>
              {featuredNews.length > 0 && (
                <div className="mb-8 sm:mb-10 md:mb-12 bg-white/85 backdrop-blur rounded-2xl md:rounded-[32px] border border-orange-100/70 shadow-xl p-4 sm:p-5 md:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-orange-500 font-semibold">Top Stories</p>
                      <h2 className="text-xl md:text-3xl font-black text-orange-900 flex items-center gap-2 mt-1">
                        <Newspaper className="w-4 h-4 md:w-6 md:h-6 text-orange-500" />
                        <span className="truncate">मुख्य समाचार</span>
                      </h2>
                      <p className="text-xs md:text-sm text-orange-700/80 mt-1">संगठन द्वारा चयनित प्रमुख समाचार</p>
                    </div>
                  </div>

                  <div className="relative -mx-4 px-4">
                    <div
                      ref={featuredScrollerRef}
                      className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      onMouseEnter={() => setFeaturedIsHovering(true)}
                      onMouseLeave={() => setFeaturedIsHovering(false)}
                      onTouchStart={() => {
                        featuredIsTouchingRef.current = true;
                        setFeaturedIsHovering(true);
                      }}
                      onTouchEnd={() => {
                        featuredIsTouchingRef.current = false;
                        setFeaturedIsHovering(false);
                      }}
                    >
                      <div ref={featuredFirstTrackRef} className="flex gap-4">
                        {featuredNews.map((item, i) => (
                          <article
                            key={`featured-a-${item.id ?? i}`}
                            className="snap-center shrink-0 w-[calc(100vw-4rem)] sm:w-[500px] md:w-[600px] lg:w-[700px] min-h-[300px] sm:min-h-[350px] md:min-h-[460px] rounded-2xl md:rounded-[32px] overflow-hidden ring-1 ring-white/40 shadow-2xl transition duration-500 relative"
                          >
                            {item.image_path && (
                              <img
                                src={item.image_path}
                                alt={item.title}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1b0f05]/92 via-[#2d1504]/75 to-transparent" />
                            <div className="absolute top-4 left-4 md:top-8 md:left-8">
                              <span className="inline-flex items-center px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-[11px] uppercase tracking-widest font-semibold bg-white/15 backdrop-blur text-white/90 border border-white/20">
                                मुख्य समाचार
                              </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10 text-white text-left">
                              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                                <div>
                                  <Link href={`/news/${item.id}`}>
                                    <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight drop-shadow-md line-clamp-2 hover:text-orange-100 transition mb-2 sm:mb-3">
                                      {item.title_hindi || item.title}
                                    </h3>
                                  </Link>
                                  {item.excerpt && (
                                    <p className="text-white/90 text-sm sm:text-base md:text-lg line-clamp-2 mb-3 sm:mb-4">{item.excerpt}</p>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-orange-100/90">
                                  <span className="flex items-center gap-1.5 sm:gap-2">
                                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                                    {formatDate(item.published_at)}
                                  </span>
                                  <Link
                                    href={`/news/${item.id}`}
                                    className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2 rounded-full text-xs sm:text-sm font-semibold"
                                  >
                                    पढ़ें
                                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                      {/* Duplicate track for seamless wrap */}
                      {featuredNews.length > 0 && (
                        <div className="flex gap-4" aria-hidden>
                          {featuredNews.map((item, i) => (
                            <article
                              key={`featured-b-${item.id ?? i}`}
                              className="snap-center shrink-0 w-[calc(100vw-4rem)] sm:w-[500px] md:w-[600px] lg:w-[700px] min-h-[300px] sm:min-h-[350px] md:min-h-[460px] rounded-2xl md:rounded-[32px] overflow-hidden ring-1 ring-white/40 shadow-2xl transition duration-500 relative"
                            >
                              {item.image_path && (
                                <img
                                  src={item.image_path}
                                  alt={item.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#1b0f05]/92 via-[#2d1504]/75 to-transparent" />
                              <div className="absolute top-4 left-4 md:top-8 md:left-8">
                                <span className="inline-flex items-center px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-[11px] uppercase tracking-widest font-semibold bg-white/15 backdrop-blur text-white/90 border border-white/20">
                                  मुख्य समाचार
                                </span>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-10 text-white text-left">
                                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                                  <div>
                                    <Link href={`/news/${item.id}`}>
                                      <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight drop-shadow-md line-clamp-2 hover:text-orange-100 transition mb-2 sm:mb-3">
                                        {item.title_hindi || item.title}
                                      </h3>
                                    </Link>
                                    {item.excerpt && (
                                      <p className="text-white/90 text-sm sm:text-base md:text-lg line-clamp-2 mb-3 sm:mb-4">{item.excerpt}</p>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-orange-100/90">
                                    <span className="flex items-center gap-1.5 sm:gap-2">
                                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                                      {formatDate(item.published_at)}
                                    </span>
                                    <Link
                                      href={`/news/${item.id}`}
                                      className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2 rounded-full text-xs sm:text-sm font-semibold"
                                    >
                                      पढ़ें
                                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                    {featuredNews.length > 1 && (
                      <>
                        <button
                          aria-label="Previous"
                          onClick={() => scrollFeaturedByAmount(-1)}
                          className="flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-orange-700 border border-orange-200 rounded-full p-1.5 sm:p-2 shadow"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                          aria-label="Next"
                          onClick={() => scrollFeaturedByAmount(1)}
                          className="flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-orange-700 border border-orange-200 rounded-full p-1.5 sm:p-2 shadow"
                        >
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-orange-900">सभी समाचार</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNews
                    .filter((item) => !item.is_featured)
                    .map((item) => (
                      <article
                        key={item.id}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl border border-orange-100/70 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
                      >
                        {item.image_path && (
                          <Link href={`/news/${item.id}`} className="block aspect-video overflow-hidden">
                            <img
                              src={item.image_path}
                              alt={item.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </Link>
                        )}
                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border ${getNewsTypeColor(
                                item.news_type
                              )}`}
                            >
                              {getNewsTypeIcon(item.news_type)}
                              {item.news_type === "announcement"
                                ? "घोषणा"
                                : item.news_type === "update"
                                ? "अपडेट"
                                : item.news_type === "achievement"
                                ? "उपलब्धि"
                                : item.news_type === "notice"
                                ? "सूचना"
                                : "सामान्य"}
                            </span>
                            {(item.district || item.state) && (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                <MapPin className="w-3 h-3" />
                                {[item.district, item.state].filter(Boolean).join(", ")}
                              </span>
                            )}
                          </div>
                          <Link href={`/news/${item.id}`}>
                            <h3 className="text-lg font-semibold text-gray-900 leading-snug hover:text-orange-700 line-clamp-2">
                              {item.title_hindi || item.title}
                            </h3>
                          </Link>
                          {item.excerpt && (
                            <p className="text-sm text-gray-600 line-clamp-2">{item.excerpt}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatDate(item.published_at)}</span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(item);
                                }}
                                className="hover:text-orange-600"
                                title="शेयर करें"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <Link href={`/news/${item.id}`} className="text-orange-600 font-semibold">
                                पढ़ें
                              </Link>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
                {filteredNews.filter((item) => !item.is_featured).length === 0 && (
                  <div className="text-center py-16 bg-white/60 rounded-2xl border border-dashed border-orange-200">
                    <Newspaper className="w-10 h-10 mx-auto text-orange-400 mb-3" />
                    <p className="text-orange-700 font-medium">समाचार उपलब्ध नहीं है</p>
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{(currentPage - 1) * 12 + 1}</span> to{' '}
                    <span className="font-semibold">{Math.min(currentPage * 12, totalNews)}</span> of{' '}
                    <span className="font-semibold">{totalNews}</span> news
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft size={16} />
                      Previous
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
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      
    </div>
  );
}


