"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Department {
  id: number | string;
  name_en: string;
  name_hi: string;
  post_name_en: string;
  post_name_hi: string;
  president: {
    id: number;
    name: string;
    photo_path: string | null;
    reg_number: string;
    email: string;
  } | null;
}

export default function DepartmentsSection() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const firstSequenceWidthRef = useRef<number>(0);
  const firstTrackRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null as unknown as number);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch('/api/public/departments', { cache: 'no-store' });
        const data = await response.json();
        if (data?.success) {
          setDepartments(data.departments || []);
        } else {
          console.error('API returned error:', data?.error);
          // Set some fallback departments if API fails
          setDepartments([
            {
              id: 'fallback-1',
              name_en: 'Cultural Affairs',
              name_hi: 'सांस्कृतिक मामले',
              post_name_en: 'President',
              post_name_hi: 'अध्यक्ष',
              president: null
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load departments:', error);
        // Set fallback departments on error
        setDepartments([
          {
            id: 'error-1',
            name_en: 'Cultural Affairs',
            name_hi: 'सांस्कृतिक मामले',
            post_name_en: 'President',
            post_name_hi: 'अध्यक्ष',
            president: null
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  // Keep first track width measured precisely
  useEffect(() => {
    const el = firstTrackRef.current;
    if (!el) return;
    const update = () => {
      firstSequenceWidthRef.current = el.scrollWidth || el.offsetWidth || 0;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [departments.length]);

  // RAF marquee loop for seamless wrap
  useEffect(() => {
    if (showAll) return;
    const node = scrollerRef.current;
    if (!node) return;
    const speedPxPerSec = 60; // tune speed
    let lastTs = performance.now();

    const step = (ts: number) => {
      if (!node) return;
      const dt = Math.max(0, ts - lastTs) / 1000;
      lastTs = ts;
      if (!isHovering) {
        const firstWidth = firstSequenceWidthRef.current || 0;
        if (firstWidth > 0) {
          node.scrollLeft += speedPxPerSec * dt;
          while (node.scrollLeft >= firstWidth) {
            node.scrollLeft -= firstWidth;
          }
        }
      }
      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [showAll, isHovering]);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-slate-200 rounded animate-pulse mb-4 max-w-md mx-auto"></div>
            <div className="h-6 bg-slate-200 rounded animate-pulse mb-2 max-w-lg mx-auto"></div>
            <div className="h-4 bg-slate-200 rounded animate-pulse max-w-2xl mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="h-3 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Always show the section, even if no departments

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-8 bg-orange-300"></div>
            <span className="text-orange-600 font-semibold text-sm uppercase tracking-wider">
              Organizational Structure
            </span>
            <div className="h-px w-8 bg-orange-300"></div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            National Departments
          </h2>
          <h3 className="text-xl md:text-2xl font-semibold text-orange-700 mb-4">
            राष्ट्रीय विभाग
          </h3>
          
          <p className="max-w-3xl mx-auto text-slate-600 leading-relaxed">
            Meet our dedicated department heads who lead various initiatives across the organization, 
            ensuring smooth operations and effective implementation of our mission.
          </p>
        </div>

        {/* Header actions */}
        <div className="flex items-center justify-end mb-4">
          <Button size="sm" className="rounded-full bg-orange-600 hover:bg-orange-700" onClick={() => setShowAll(v => !v)}>
            {showAll ? 'Show Marquee' : 'View All'}
          </Button>
        </div>

        {/* Departments: marquee or grid */}
        {!showAll ? (
          <div className="relative overflow-hidden">
            {/* Left control */}
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => {
                setIsHovering(true);
                scrollerRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
                if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
                resumeTimerRef.current = window.setTimeout(() => setIsHovering(false), 600);
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 shadow p-2 hover:bg-white border border-slate-200"
            >
              <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            <div
              ref={scrollerRef}
              className="overflow-x-scroll py-2 flex gap-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
              style={{ msOverflowStyle: 'none' as unknown as undefined }}
              onScroll={(e) => {
                const node = e.currentTarget;
                const firstWidth = firstSequenceWidthRef.current || 0;
                if (firstWidth > 0 && node.scrollLeft >= firstWidth) {
                  node.scrollLeft = node.scrollLeft - firstWidth;
                }
              }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Track A */}
              <div ref={firstTrackRef} className="flex gap-4">
                {departments.map((department, index) => (
                  <div key={`${String(department.id)}-a-${index}`} className="shrink-0 snap-start">
                    <Card
                      className="group relative cursor-pointer border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-200/70 rounded-3xl p-4 flex flex-col items-center w-60"
                      onClick={() => router.push(`/departments/${department.id}`)}
                    >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background:"radial-gradient(700px 150px at 50% 0%, rgba(251,146,60,0.10), transparent)"}} />

                  {/* Media (Photo or Fallback) - Circular professional card */}
                  <div className="relative flex items-center justify-center">
                    <div className="relative h-36 w-36 md:h-40 md:w-40 lg:h-44 lg:w-44 rounded-full overflow-hidden ring-1 ring-orange-200/60 shadow-sm transition-all duration-300 group-hover:shadow-md">
                      {department.president?.photo_path ? (
                        <div className="absolute inset-0 overflow-hidden bg-white">
                          <Image
                            src={department.president.photo_path.startsWith('/') ? department.president.photo_path : `/${department.president.photo_path}`}
                            alt={department.president.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                            priority={false}
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 text-orange-800">
                          <div className="text-4xl font-bold tracking-tight">
                            {(department.name_en || 'RHVS').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                          </div>
                        </div>
                      )}

                      {/* Circular overlay with department names */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
                        <div className="relative w-full">
                          <div className="absolute inset-0 rounded-b-full bg-gradient-to-t from-black/30 via-black/10 to-transparent backdrop-blur-[1.5px]" />
                          <div className="relative px-4 pb-2 pt-4">
                            <h3 className="text-white text-[16px] font-extrabold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] line-clamp-1 text-center">
                              {department.name_hi}
                            </h3>
                            <p className="text-white/90 text-[11px] leading-tight font-medium line-clamp-1 text-center">
                              {department.name_en}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="px-0 pt-3 pb-0 w-full">
                    <div className="text-center">
                      <p className="text-[15px] font-bold text-slate-900 leading-tight line-clamp-1">
                        {department.president ? department.president.name : 'Position Vacant'}
                      </p>
                      <p className="text-[12px] font-semibold text-orange-700 leading-snug line-clamp-1">
                        {department.post_name_hi}
                      </p>
                      <p className="text-[11px] text-slate-700 leading-snug line-clamp-1">
                        {department.post_name_en}
                      </p>
                    </div>
                  </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Track B (duplicate, aria-hidden) */}
              <div aria-hidden className="flex gap-4">
                {departments.map((department, index) => (
                  <div key={`${String(department.id)}-b-${index}`} className="shrink-0 snap-start">
                    <Card
                      className="group relative cursor-pointer border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-200/70 rounded-3xl p-4 flex flex-col items-center w-60"
                      onClick={() => router.push(`/departments/${department.id}`)}
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background:"radial-gradient(700px 150px at 50% 0%, rgba(251,146,60,0.10), transparent)"}} />

                      {/* Media (Photo or Fallback) - Circular professional card */}
                      <div className="relative flex items-center justify-center">
                        <div className="relative h-36 w-36 md:h-40 md:w-40 lg:h-44 lg:w-44 rounded-full overflow-hidden ring-1 ring-orange-200/60 shadow-sm transition-all duration-300 group-hover:shadow-md">
                          {department.president?.photo_path ? (
                            <div className="absolute inset-0 overflow-hidden bg-white">
                              <Image
                                src={department.president.photo_path.startsWith('/') ? department.president.photo_path : `/${department.president.photo_path}`}
                                alt={department.president.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                                priority={false}
                              />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 text-orange-800">
                              <div className="text-4xl font-bold tracking-tight">
                                {(department.name_en || 'RHVS').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                              </div>
                            </div>
                          )}

                          {/* Circular overlay with department names */}
                          <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
                            <div className="relative w-full">
                              <div className="absolute inset-0 rounded-b-full bg-gradient-to-t from-black/30 via-black/10 to-transparent backdrop-blur-[1.5px]" />
                              <div className="relative px-4 pb-2 pt-4">
                                <h3 className="text-white text-[16px] font-extrabold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] line-clamp-1 text-center">
                                  {department.name_hi}
                                </h3>
                                <p className="text-white/90 text-[11px] leading-tight font-medium line-clamp-1 text-center">
                                  {department.name_en}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <CardContent className="px-0 pt-3 pb-0 w-full">
                        <div className="text-center">
                          <p className="text-[15px] font-bold text-slate-900 leading-tight line-clamp-1">
                            {department.president ? department.president.name : 'Position Vacant'}
                          </p>
                          <p className="text-[12px] font-semibold text-orange-700 leading-snug line-clamp-1">
                            {department.post_name_hi}
                          </p>
                          <p className="text-[11px] text-slate-700 leading-snug line-clamp-1">
                            {department.post_name_en}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Right control */}
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => {
                setIsHovering(true);
                scrollerRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
                if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
                resumeTimerRef.current = window.setTimeout(() => setIsHovering(false), 600);
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 shadow p-2 hover:bg-white border border-slate-200"
            >
              <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {departments.map((department) => (
            <Card
              key={department.id}
              className="group relative cursor-pointer border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-200/70 rounded-3xl p-4 flex flex-col items-center"
              onClick={() => router.push(`/departments/${department.id}`)}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background:"radial-gradient(700px 150px at 50% 0%, rgba(251,146,60,0.10), transparent)"}} />

              {/* Media (Photo or Fallback) - Circular professional card */}
              <div className="relative flex items-center justify-center">
                <div className="relative h-40 w-40 md:h-44 md:w-44 lg:h-48 lg:w-48 rounded-full overflow-hidden ring-1 ring-orange-200/60 shadow-sm transition-all duration-300 group-hover:shadow-md">
                {department.president?.photo_path ? (
                  <div className="absolute inset-0 overflow-hidden bg-white">
                    <Image
                      src={department.president.photo_path.startsWith('/') ? department.president.photo_path : `/${department.president.photo_path}`}
                      alt={department.president.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      priority={false}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 text-orange-800">
                    <div className="text-5xl font-bold tracking-tight">
                      {(department.name_en || 'RHVS').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                  </div>
                )}

                  {/* Circular overlay with department names */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
                    <div className="relative w-full">
                      <div className="absolute inset-0 rounded-b-full bg-gradient-to-t from-black/30 via-black/10 to-transparent backdrop-blur-[1.5px]" />
                      <div className="relative px-4 pb-3 pt-4">
                        <h3 className="text-white text-[18px] font-extrabold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] line-clamp-1 text-center">
                          {department.name_hi}
                        </h3>
                        <p className="text-white/90 text-[12px] leading-tight font-medium line-clamp-1 text-center">
                          {department.name_en}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <CardContent className="px-0 pt-4 pb-0 w-full">
                <div className="text-center">
                    <p className="text-[16px] font-bold text-slate-900 leading-tight line-clamp-1">
                      {department.president ? department.president.name : 'Position Vacant'}
                    </p>
                    <p className="text-[13px] font-semibold text-orange-700 leading-snug line-clamp-1">
                      {department.post_name_hi}
                    </p>
                    <p className="text-[12px] text-slate-700 leading-snug line-clamp-1">
                      {department.post_name_en}
                    </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* Bottom Decoration */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 text-slate-400">
            <div className="h-px w-12 bg-slate-200"></div>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <div className="h-px w-12 bg-slate-200"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
