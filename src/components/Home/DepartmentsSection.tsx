"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface StateOption {
  id: string | number;
  name: string;
}

interface DistrictOption {
  id: string | number;
  name: string;
}

export default function DepartmentsSection() {
  const router = useRouter();
  const [nationalDepartments, setNationalDepartments] = useState<Department[]>([]);
  const [stateDepartments, setStateDepartments] = useState<Department[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedStateName, setSelectedStateName] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("");
  const [stateScope, setStateScope] = useState<"state" | "district">("state");
  const [loadingNational, setLoadingNational] = useState(true);
  const [loadingStateLevel, setLoadingStateLevel] = useState(false);
  const [showAllNational, setShowAllNational] = useState(false);
  const [showAllState, setShowAllState] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isStateHoveringTop, setIsStateHoveringTop] = useState(false);
  const [isStateHoveringBottom, setIsStateHoveringBottom] = useState(false);
  const isTouchingRef = useRef<boolean>(false);
  const stateTouchingTopRef = useRef<boolean>(false);
  const stateTouchingBottomRef = useRef<boolean>(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const stateTopScrollerRef = useRef<HTMLDivElement | null>(null);
  const stateBottomScrollerRef = useRef<HTMLDivElement | null>(null);
  const firstSequenceWidthRef = useRef<number>(0);
  const stateTopSequenceWidthRef = useRef<number>(0);
  const stateBottomSequenceWidthRef = useRef<number>(0);
  const firstTrackRef = useRef<HTMLDivElement | null>(null);
  const stateTopFirstTrackRef = useRef<HTMLDivElement | null>(null);
  const stateBottomFirstTrackRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const stateTopRafRef = useRef<number | null>(null);
  const stateBottomRafRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null as unknown as number);
  const stateResumeTimerRef = useRef<number | null>(null as unknown as number);

  const fetchDepartmentsByLevel = useCallback(
    async (level: 'national' | 'state' | 'district', options?: { stateName?: string; districtName?: string }) => {
      try {
        const params = new URLSearchParams({ level });
        if (options?.stateName) params.append('state', options.stateName);
        if (options?.districtName) params.append('district', options.districtName);

        const response = await fetch(`/api/public/departments?${params.toString()}`, { cache: 'no-store' });
        const data = await response.json();

        if (data?.success) {
          return (data.departments || []) as Department[];
        }
      } catch (error) {
        console.error(`Failed to load ${level} departments:`, error);
      }
      return [] as Department[];
    },
    []
  );

  const loadNationalDepartments = useCallback(async () => {
    setLoadingNational(true);
    const result = await fetchDepartmentsByLevel('national');
    setNationalDepartments(result);
    setLoadingNational(false);
  }, [fetchDepartmentsByLevel]);

  const loadStates = useCallback(async () => {
    try {
      const response = await fetch('/api/states', { cache: 'no-store' });
      const data = await response.json();
      if (data?.success) {
        const formatted = (data.data || []).map((state: { id: string | number; name: string }) => ({
          id: state.id,
          name: state.name,
        }));
        setStates(formatted);
      }
    } catch (error) {
      console.error('Failed to load states:', error);
    }
  }, []);

  const loadDistrictsForState = useCallback(async (stateId: string) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }

    try {
      const response = await fetch(`/api/districts?stateId=${stateId}`, { cache: 'no-store' });
      const data = await response.json();
      if (data?.success) {
        const formatted = (data.data || []).map((district: { id: string | number; name: string }) => ({
          id: district.id,
          name: district.name,
        }));
        setDistricts(formatted);
      } else {
        setDistricts([]);
      }
    } catch (error) {
      console.error('Failed to load districts:', error);
      setDistricts([]);
    }
  }, []);

  const handleStateChange = useCallback(
    async (stateId: string) => {
      setSelectedStateId(stateId);
      setSelectedDistrictId("");
      setSelectedDistrictName("");
      setStateScope("state");

      if (!stateId) {
        setSelectedStateName("");
        setStateDepartments([]);
        setDistricts([]);
        return;
      }

      const selectedState = states.find((state) => String(state.id) === stateId);
      const stateName = selectedState?.name || "";
      setSelectedStateName(stateName);
      setLoadingStateLevel(true);
      const result = await fetchDepartmentsByLevel('state', { stateName });
      setStateDepartments(result);
      setLoadingStateLevel(false);
      loadDistrictsForState(stateId);
    },
    [states, fetchDepartmentsByLevel, loadDistrictsForState]
  );

  const handleDistrictChange = useCallback(
    async (districtId: string) => {
      setSelectedDistrictId(districtId);

      if (!selectedStateName) {
        setSelectedDistrictName("");
        setStateScope('state');
        return;
      }

      if (!districtId || districtId === 'all') {
        setSelectedDistrictName("");
        setStateScope('state');
        setLoadingStateLevel(true);
        const result = await fetchDepartmentsByLevel('state', { stateName: selectedStateName });
        setStateDepartments(result);
        setLoadingStateLevel(false);
        return;
      }

      const district = districts.find((item) => String(item.id) === districtId);
      if (!district) return;

      setSelectedDistrictName(district.name);
      setStateScope('district');
      setLoadingStateLevel(true);
      const result = await fetchDepartmentsByLevel('district', {
        stateName: selectedStateName,
        districtName: district.name,
      });
      setStateDepartments(result);
      setLoadingStateLevel(false);
    },
    [districts, fetchDepartmentsByLevel, selectedStateName]
  );

  const handleStateMarqueeScroll = useCallback(
    (direction: 'left' | 'right') => {
      const delta = typeof window !== 'undefined' && window.innerWidth < 768 ? 240 : 300;
      const amount = direction === 'left' ? -delta : delta;

      setIsStateHoveringTop(true);
      setIsStateHoveringBottom(true);

      if (stateTopScrollerRef.current) {
        stateTopScrollerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      }
      if (stateBottomScrollerRef.current) {
        stateBottomScrollerRef.current.scrollBy({ left: -amount, behavior: 'smooth' });
      }

      if (stateResumeTimerRef.current) window.clearTimeout(stateResumeTimerRef.current);
      stateResumeTimerRef.current = window.setTimeout(() => {
        setIsStateHoveringTop(false);
        setIsStateHoveringBottom(false);
      }, 700);
    },
    []
  );

  const stateLevelContext: LevelContext | undefined = selectedStateName
    ? {
        level: stateScope === 'district' && selectedDistrictName ? 'district' : 'state',
        state: selectedStateName,
        district: stateScope === 'district' && selectedDistrictName ? selectedDistrictName : undefined,
      }
    : undefined;

  useEffect(() => {
    loadNationalDepartments();
    loadStates();
  }, [loadNationalDepartments, loadStates]);

  useEffect(() => {
    if (selectedStateId || states.length === 0) return;
    const defaultState = states.find(
      (state) => state.name?.toLowerCase().includes('uttar pradesh') || state.name?.toLowerCase().includes('उत्तर प्रदेश')
    );
    if (defaultState) {
      handleStateChange(String(defaultState.id));
    }
  }, [states, selectedStateId, handleStateChange]);

  interface LevelContext {
    level: 'state' | 'district';
    state: string;
    district?: string;
  }

  const buildHierarchyLink = (departmentId: number | string, context?: LevelContext) => {
    if (!context || !context.state) return `/departments/${departmentId}`;
    const params = new URLSearchParams();
    params.set('level', context.level);
    params.set('state', context.state);
    if (context.level === 'district' && context.district) {
      params.set('district', context.district);
    }
    return `/departments/${departmentId}?${params.toString()}`;
  };

  const StateDepartmentCard = ({
    department,
    className = "",
    context,
    fullWidth = false,
  }: {
    department: Department;
    className?: string;
    context?: LevelContext;
    fullWidth?: boolean;
  }) => (
    <Card
      className={`group relative cursor-pointer border border-slate-200/70 bg-white/95 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-200/70 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col items-center overflow-hidden ${
        fullWidth ? 'w-full' : 'w-52 sm:w-56 md:w-60'
      } ${className}`}
      onClick={() => router.push(buildHierarchyLink(department.id, context))}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl sm:rounded-3xl"
        style={{
          background: 'radial-gradient(700px 150px at 50% 0%, rgba(251,146,60,0.10), transparent)',
        }}
      />

      <div className="relative flex flex-col items-center w-full">
        <div className="w-full mb-2 px-2 pt-1 min-h-[4.5rem] max-h-[5rem] flex flex-col justify-start">
          <h3 className="text-slate-900 text-base md:text-lg font-black tracking-tight line-clamp-1 text-center leading-[1.4] mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
            {department.name_hi}
          </h3>
          <p className="text-slate-700 text-xs md:text-sm leading-tight font-medium line-clamp-1 text-center overflow-hidden text-ellipsis whitespace-nowrap">
            {department.name_en}
          </p>
        </div>

        <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden ring-1 ring-orange-200/60 shadow-sm transition-all duration-300 group-hover:shadow-md">
          {department.president?.photo_path ? (
            <div className="absolute inset-0 overflow-hidden bg-white">
              <Image
                src={
                  department.president.photo_path.startsWith('/')
                    ? department.president.photo_path
                    : `/${department.president.photo_path}`
                }
                alt={department.president.name}
                fill
                sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, (max-width: 1024px) 144px, 160px"
                className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                quality={95}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 sm:w-14 sm:h-14 text-orange-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <CardContent className="px-0 pt-2 sm:pt-3 md:pt-4 pb-0 w-full">
        <div className="text-center">
          <p className="text-sm md:text-[15px] font-bold text-slate-900 leading-tight line-clamp-1">
            {department.president ? department.president.name : 'Position Vacant'}
          </p>
          <p className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-orange-700 leading-snug line-clamp-1">
            {department.post_name_hi}
          </p>
          <p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-700 leading-snug line-clamp-1">
            {department.post_name_en}
          </p>
        </div>
      </CardContent>
    </Card>
  );

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
  }, [nationalDepartments.length]);

  useEffect(() => {
    const el = stateTopFirstTrackRef.current;
    if (!el) return;
    const update = () => {
      stateTopSequenceWidthRef.current = el.scrollWidth || el.offsetWidth || 0;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stateDepartments.length]);

  useEffect(() => {
    const el = stateBottomFirstTrackRef.current;
    if (!el) return;
    const update = () => {
      stateBottomSequenceWidthRef.current = el.scrollWidth || el.offsetWidth || 0;
      const node = stateBottomScrollerRef.current;
      if (node && stateBottomSequenceWidthRef.current > 0) {
        node.scrollLeft = stateBottomSequenceWidthRef.current;
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stateDepartments.length]);

  useEffect(() => {
    if (showAllState) return;
    const node = stateBottomScrollerRef.current;
    const firstWidth = stateBottomSequenceWidthRef.current || 0;
    if (node && firstWidth > 0) {
      node.scrollLeft = firstWidth;
    }
  }, [showAllState, stateDepartments.length]);

  // RAF marquee loop for seamless wrap - auto-scroll on mobile and desktop
  useEffect(() => {
    if (showAllNational) return;
    const node = scrollerRef.current;
    if (!node) return;
    
    let lastTs = performance.now();

    const step = (ts: number) => {
      if (!node) return;
      
      // Check if mobile dynamically
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const speedPxPerSec = isMobile ? 50 : 60; // Slower on mobile for better readability
      
      const dt = Math.max(0, ts - lastTs) / 1000;
      lastTs = ts;
      
      // On mobile, always scroll unless actively touching. On desktop, pause on hover
      const shouldScroll = isMobile ? !isTouchingRef.current : !isHovering;
      
      if (shouldScroll) {
        const firstWidth = firstSequenceWidthRef.current || 0;
        // Only scroll if we have a valid width, otherwise wait for it
        if (firstWidth > 0) {
          node.scrollLeft += speedPxPerSec * dt;
          while (node.scrollLeft >= firstWidth) {
            node.scrollLeft -= firstWidth;
          }
        }
      }
      rafIdRef.current = requestAnimationFrame(step);
    };

    // Start animation immediately - it will wait for width to be calculated
    rafIdRef.current = requestAnimationFrame(step);
    
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [showAllNational, isHovering, nationalDepartments.length]);

  useEffect(() => {
    if (showAllState || stateDepartments.length === 0) return;
    const node = stateTopScrollerRef.current;
    if (!node) return;

    let lastTs = performance.now();

    const step = (ts: number) => {
      if (!node) return;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const speedPxPerSec = isMobile ? 45 : 55;
      const dt = Math.max(0, ts - lastTs) / 1000;
      lastTs = ts;
      const shouldScroll = isMobile ? !stateTouchingTopRef.current : !isStateHoveringTop;

      if (shouldScroll) {
        const firstWidth = stateTopSequenceWidthRef.current || 0;
        if (firstWidth > 0) {
          node.scrollLeft += speedPxPerSec * dt;
          while (node.scrollLeft >= firstWidth) {
            node.scrollLeft -= firstWidth;
          }
        }
      }
      stateTopRafRef.current = requestAnimationFrame(step);
    };

    stateTopRafRef.current = requestAnimationFrame(step);

    return () => {
      if (stateTopRafRef.current) cancelAnimationFrame(stateTopRafRef.current);
      stateTopRafRef.current = null;
    };
  }, [showAllState, isStateHoveringTop, stateDepartments.length]);

  useEffect(() => {
    if (showAllState || stateDepartments.length === 0) return;
    const node = stateBottomScrollerRef.current;
    if (!node) return;

    let lastTs = performance.now();

    const step = (ts: number) => {
      if (!node) return;
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const speedPxPerSec = isMobile ? 40 : 50;
      const dt = Math.max(0, ts - lastTs) / 1000;
      lastTs = ts;
      const shouldScroll = isMobile ? !stateTouchingBottomRef.current : !isStateHoveringBottom;

      if (shouldScroll) {
        const firstWidth = stateBottomSequenceWidthRef.current || 0;
        if (firstWidth > 0) {
          node.scrollLeft -= speedPxPerSec * dt;
          while (node.scrollLeft < 0) {
            node.scrollLeft += firstWidth;
          }
        }
      }
      stateBottomRafRef.current = requestAnimationFrame(step);
    };

    stateBottomRafRef.current = requestAnimationFrame(step);

    return () => {
      if (stateBottomRafRef.current) cancelAnimationFrame(stateBottomRafRef.current);
      stateBottomRafRef.current = null;
    };
  }, [showAllState, isStateHoveringBottom, stateDepartments.length]);

  if (loadingNational) {
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
          
          <h3 className="text-4xl md:text-5xl font-black text-orange-900 mb-2 leading-tight">
            राष्ट्रीय विभाग
          </h3>
          <p className="text-xl md:text-2xl font-semibold text-slate-800 mb-4 tracking-tight">
            Departments
          </p>
          
          <p className="max-w-3xl mx-auto text-slate-600 leading-relaxed">
            Meet our dedicated department heads who lead various initiatives across the organization, 
            ensuring smooth operations and effective implementation of our mission.
          </p>
        </div>

        {/* Header actions */}
        <div className="flex items-center justify-end mb-4">
          <Button
            size="sm"
            className="rounded-full bg-orange-600 hover:bg-orange-700"
            onClick={() => setShowAllNational((v) => !v)}
          >
            {showAllNational ? 'Close' : 'View All'}
          </Button>
        </div>

        {/* Departments: marquee or grid */}
        {!showAllNational ? (
          <div className="relative overflow-hidden">
            {/* Left control */}
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => {
                setIsHovering(true);
                const scrollAmount = typeof window !== 'undefined' && window.innerWidth < 768 ? -260 : -320;
                scrollerRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
                resumeTimerRef.current = window.setTimeout(() => setIsHovering(false), 600);
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 shadow-md p-1.5 sm:p-2 hover:bg-white border border-slate-200 active:scale-95 transition-transform"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

            <div
              ref={scrollerRef}
              className="overflow-x-scroll py-2 flex gap-3 sm:gap-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
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
              onTouchStart={() => {
                isTouchingRef.current = true;
                setIsHovering(true);
              }}
              onTouchEnd={() => {
                // Resume after a short delay on mobile
                setTimeout(() => {
                  isTouchingRef.current = false;
                  setIsHovering(false);
                }, 800);
              }}
              onTouchCancel={() => {
                isTouchingRef.current = false;
                setIsHovering(false);
              }}
            >
              {/* Track A */}
              <div ref={firstTrackRef} className="flex gap-3 sm:gap-4">
                {nationalDepartments.map((department, index) => (
                  <div key={`${String(department.id)}-a-${index}`} className="shrink-0 snap-start">
                    <Card
                      className="group relative cursor-pointer border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-200/70 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col items-center w-52 sm:w-56 md:w-60 overflow-hidden"
                      onClick={() => router.push(`/departments/${department.id}`)}
                    >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl sm:rounded-3xl" style={{background:"radial-gradient(700px 150px at 50% 0%, rgba(251,146,60,0.10), transparent)"}} />

                  {/* Media (Photo or Fallback) - Circular professional card */}
                  <div className="relative flex flex-col items-center w-full min-w-0">
                    {/* Department names above the circle */}
                    <div className="w-full mb-2 px-2 pt-1 min-h-[4rem] max-h-[4.5rem] flex flex-col justify-start min-w-0 overflow-hidden">
                      <div className="w-full flex justify-center mb-0.5 min-w-0 overflow-hidden">
                        <h3 className="text-slate-900 text-sm sm:text-base md:text-lg font-black tracking-tight leading-[1.4] overflow-hidden text-ellipsis whitespace-nowrap min-w-0" style={{ maxWidth: '100%' }}>
                          {department.name_hi}
                        </h3>
                      </div>
                      <div className="w-full flex justify-center min-w-0 overflow-hidden">
                        <p className="text-slate-700 text-[10px] sm:text-xs md:text-sm leading-tight font-medium overflow-hidden text-ellipsis whitespace-nowrap min-w-0" style={{ maxWidth: '100%' }}>
                          {department.name_en}
                        </p>
                      </div>
                    </div>
                    
                    <div className="relative h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 lg:h-40 lg:w-40 rounded-full overflow-hidden ring-1 ring-orange-200/60 shadow-sm transition-all duration-300 group-hover:shadow-md">
                      {department.president?.photo_path ? (
                        <div className="absolute inset-0 overflow-hidden bg-white">
                          <Image
                            src={department.president.photo_path.startsWith('/') ? department.president.photo_path : `/${department.president.photo_path}`}
                            alt={department.president.name}
                            fill
                            sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, (max-width: 1024px) 144px, 160px"
                            className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                            quality={95}
                            priority={false}
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="5"/>
                            <path d="M20 21a8 8 0 0 0-16 0"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  <CardContent className="px-0 pt-2 sm:pt-3 pb-0 w-full">
                    <div className="text-center">
                      <p className="text-xs sm:text-sm md:text-[15px] font-bold text-slate-900 leading-tight line-clamp-1">
                        {department.president ? department.president.name : 'Position Vacant'}
                      </p>
                      <p className="text-[11px] sm:text-[12px] md:text-[13px] font-semibold text-orange-700 leading-snug line-clamp-1">
                        {department.post_name_hi}
                      </p>
                      <p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-700 leading-snug line-clamp-1">
                        {department.post_name_en}
                      </p>
                    </div>
                  </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Track B (duplicate, aria-hidden) */}
              <div aria-hidden className="flex gap-3 sm:gap-4">
                {nationalDepartments.map((department, index) => (
                  <div key={`${String(department.id)}-b-${index}`} className="shrink-0 snap-start">
                    <Card
                      className="group relative cursor-pointer border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-200/70 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col items-center w-52 sm:w-56 md:w-60 overflow-hidden"
                      onClick={() => router.push(`/departments/${department.id}`)}
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl sm:rounded-3xl" style={{background:"radial-gradient(700px 150px at 50% 0%, rgba(251,146,60,0.10), transparent)"}} />

                      {/* Media (Photo or Fallback) - Circular professional card */}
                      <div className="relative flex flex-col items-center w-full min-w-0">
                        {/* Department names above the circle */}
                        <div className="w-full mb-2 px-2 pt-1 min-h-[4rem] max-h-[4.5rem] flex flex-col justify-start min-w-0 overflow-hidden">
                          <div className="w-full flex justify-center mb-0.5 min-w-0 overflow-hidden">
                            <h3 className="text-slate-900 text-sm sm:text-base md:text-lg font-black tracking-tight leading-[1.4] overflow-hidden text-ellipsis whitespace-nowrap min-w-0" style={{ maxWidth: '100%' }}>
                              {department.name_hi}
                            </h3>
                          </div>
                          <div className="w-full flex justify-center min-w-0 overflow-hidden">
                            <p className="text-slate-700 text-[10px] sm:text-xs md:text-sm leading-tight font-medium overflow-hidden text-ellipsis whitespace-nowrap min-w-0" style={{ maxWidth: '100%' }}>
                              {department.name_en}
                            </p>
                          </div>
                        </div>
                        
                        <div className="relative h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 lg:h-40 lg:w-40 rounded-full overflow-hidden ring-1 ring-orange-200/60 shadow-sm transition-all duration-300 group-hover:shadow-md">
                          {department.president?.photo_path ? (
                            <div className="absolute inset-0 overflow-hidden bg-white">
                              <Image
                                src={department.president.photo_path.startsWith('/') ? department.president.photo_path : `/${department.president.photo_path}`}
                                alt={department.president.name}
                                fill
                                sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, (max-width: 1024px) 144px, 160px"
                                className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                                quality={95}
                                priority={false}
                              />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="5"/>
                                <path d="M20 21a8 8 0 0 0-16 0"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>

                      <CardContent className="px-0 pt-2 sm:pt-3 pb-0 w-full">
                        <div className="text-center">
                          <p className="text-xs sm:text-sm md:text-[15px] font-bold text-slate-900 leading-tight line-clamp-1">
                            {department.president ? department.president.name : 'Position Vacant'}
                          </p>
                          <p className="text-[10px] sm:text-[11px] md:text-[12px] font-semibold text-orange-700 leading-snug line-clamp-1">
                            {department.post_name_hi}
                          </p>
                          <p className="text-[9px] sm:text-[10px] md:text-[11px] text-slate-700 leading-snug line-clamp-1">
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
                const scrollAmount = typeof window !== 'undefined' && window.innerWidth < 768 ? 260 : 320;
                scrollerRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
                resumeTimerRef.current = window.setTimeout(() => setIsHovering(false), 600);
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 shadow-md p-1.5 sm:p-2 hover:bg-white border border-slate-200 active:scale-95 transition-transform"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {nationalDepartments.map((department) => (
            <Card
              key={department.id}
              className="group relative cursor-pointer border border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-200/70 rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col items-center overflow-hidden"
              onClick={() => router.push(`/departments/${department.id}`)}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl sm:rounded-3xl" style={{background:"radial-gradient(700px 150px at 50% 0%, rgba(251,146,60,0.10), transparent)"}} />

              {/* Media (Photo or Fallback) - Circular professional card */}
              <div className="relative flex flex-col items-center w-full">
                {/* Department names above the circle */}
                <div className="w-full mb-2 px-2 pt-1 min-h-[4.5rem] max-h-[5rem] flex flex-col justify-start">
                  <h3 className="text-slate-900 text-sm sm:text-base md:text-lg lg:text-xl font-black tracking-tight line-clamp-1 text-center leading-[1.4] mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                    {department.name_hi}
                  </h3>
                  <p className="text-slate-700 text-[10px] sm:text-xs md:text-sm lg:text-base leading-tight font-medium line-clamp-1 text-center overflow-hidden text-ellipsis whitespace-nowrap">
                    {department.name_en}
                  </p>
                </div>
                
                <div className="relative h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 lg:h-40 lg:w-40 xl:h-44 xl:w-44 rounded-full overflow-hidden ring-1 ring-orange-200/60 shadow-sm transition-all duration-300 group-hover:shadow-md">
                {department.president?.photo_path ? (
                  <div className="absolute inset-0 overflow-hidden bg-white">
                    <Image
                      src={department.president.photo_path.startsWith('/') ? department.president.photo_path : `/${department.president.photo_path}`}
                      alt={department.president.name}
                      fill
                        sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, (max-width: 1024px) 144px, (max-width: 1280px) 160px, 176px"
                      className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                        quality={95}
                      priority={false}
                    />
                  </div>
                ) : (
                   <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <circle cx="12" cy="8" r="5"/>
                       <path d="M20 21a8 8 0 0 0-16 0"/>
                     </svg>
                  </div>
                )}
                </div>
              </div>

              {/* Content */}
              <CardContent className="px-0 pt-2 sm:pt-3 md:pt-4 pb-0 w-full">
                <div className="text-center">
                    <p className="text-xs sm:text-sm md:text-[15px] lg:text-[16px] font-bold text-slate-900 leading-tight line-clamp-1">
                      {department.president ? department.president.name : 'Position Vacant'}
                    </p>
                    <p className="text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-semibold text-orange-700 leading-snug line-clamp-1">
                      {department.post_name_hi}
                    </p>
                    <p className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] text-slate-700 leading-snug line-clamp-1">
                      {department.post_name_en}
                    </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* State & District Section */}
        <div className="mt-16">
          <div className="text-center mb-6">
            <p className="text-sm text-orange-600 font-semibold mb-2">
              प्रादेशिक नेतृत्व
            </p>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900">राज्य एवं जिला विभाग</h3>
            <p className="text-slate-600 mt-2 max-w-3xl mx-auto">
              राज्य स्तर पर नियुक्त सभी सदस्य यहाँ दिखते हैं। ज़रूरत पड़ने पर संबंधित जिले का चयन करके और भी विस्तृत
              नेतृत्व देखें।
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center mb-8">
            <div className="w-full md:w-64">
              <Select value={selectedStateId} onValueChange={handleStateChange}>
                <SelectTrigger className="w-full rounded-xl bg-white border-slate-300 text-left">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {states.length === 0 ? (
                    <SelectItem value="__loading" disabled>
                      Loading states...
                    </SelectItem>
                  ) : (
                    states.map((state) => (
                      <SelectItem key={state.id} value={String(state.id)}>
                        {state.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-64">
              <Select
                value={selectedDistrictId}
                onValueChange={handleDistrictChange}
                disabled={!selectedStateId || districts.length === 0}
              >
                <SelectTrigger className="w-full rounded-xl bg-white border-slate-300 text-left disabled:opacity-60">
                  <SelectValue placeholder={selectedStateId ? "Filter by district (optional)" : "Select state first"} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">All districts in {selectedStateName || "state"}</SelectItem>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={String(district.id)}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!selectedStateId ? (
            <div className="text-center text-slate-500 text-sm">
              Select a state to load its leadership structure.
            </div>
          ) : loadingStateLevel ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse h-60">
                  <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-slate-100 rounded mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-2/3 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : stateDepartments.length > 0 ? (
            <>
              <div className="text-center text-sm text-slate-600 mb-4">
                {stateScope === "district" && selectedDistrictName ? (
                  <>
                    Showing district-level appointments for{" "}
                    <span className="font-semibold text-orange-600">{selectedDistrictName}</span>,{" "}
                    <span className="font-semibold text-slate-900">{selectedStateName}</span>
                  </>
                ) : (
                  <>
                    Showing state-level appointments for{" "}
                    <span className="font-semibold text-slate-900">{selectedStateName}</span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50"
                  onClick={() => setShowAllState((v) => !v)}
                >
                  {showAllState ? 'Close' : 'View All'}
                </Button>
              </div>

              {!showAllState ? (
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Scroll left"
                    onClick={() => handleStateMarqueeScroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 shadow-md p-1.5 sm:p-2 hover:bg-white border border-slate-200 active:scale-95 transition-transform"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>

                  <div className="space-y-6 py-2">
                    <div
                      ref={stateTopScrollerRef}
                      className="overflow-x-scroll py-2 flex gap-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
                      style={{ msOverflowStyle: 'none' as unknown as undefined }}
                      onScroll={(e) => {
                        const node = e.currentTarget;
                        const firstWidth = stateTopSequenceWidthRef.current || 0;
                        if (firstWidth > 0 && node.scrollLeft >= firstWidth) {
                          node.scrollLeft = node.scrollLeft - firstWidth;
                        }
                      }}
                      onMouseEnter={() => setIsStateHoveringTop(true)}
                      onMouseLeave={() => setIsStateHoveringTop(false)}
                      onTouchStart={() => {
                        stateTouchingTopRef.current = true;
                        setIsStateHoveringTop(true);
                      }}
                      onTouchEnd={() => {
                        setTimeout(() => {
                          stateTouchingTopRef.current = false;
                          setIsStateHoveringTop(false);
                        }, 600);
                      }}
                      onTouchCancel={() => {
                        stateTouchingTopRef.current = false;
                        setIsStateHoveringTop(false);
                      }}
                    >
                      <div ref={stateTopFirstTrackRef} className="flex gap-4">
                        {stateDepartments.map((department, index) => (
                          <div key={`${department.id}-top-${index}`} className="shrink-0 snap-start">
                            <StateDepartmentCard department={department} context={stateLevelContext} />
                          </div>
                        ))}
                      </div>
                      <div aria-hidden className="flex gap-4">
                        {stateDepartments.map((department, index) => (
                          <div key={`${department.id}-top-dup-${index}`} className="shrink-0 snap-start">
                            <StateDepartmentCard department={department} context={stateLevelContext} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      ref={stateBottomScrollerRef}
                      className="overflow-x-scroll py-2 flex gap-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
                      style={{ msOverflowStyle: 'none' as unknown as undefined }}
                      onScroll={(e) => {
                        const node = e.currentTarget;
                        const firstWidth = stateBottomSequenceWidthRef.current || 0;
                        if (firstWidth <= 0) return;
                        if (node.scrollLeft <= 0) {
                          node.scrollLeft = node.scrollLeft + firstWidth;
                        } else if (node.scrollLeft >= firstWidth) {
                          node.scrollLeft = node.scrollLeft - firstWidth;
                        }
                      }}
                      onMouseEnter={() => setIsStateHoveringBottom(true)}
                      onMouseLeave={() => setIsStateHoveringBottom(false)}
                      onTouchStart={() => {
                        stateTouchingBottomRef.current = true;
                        setIsStateHoveringBottom(true);
                      }}
                      onTouchEnd={() => {
                        setTimeout(() => {
                          stateTouchingBottomRef.current = false;
                          setIsStateHoveringBottom(false);
                        }, 600);
                      }}
                      onTouchCancel={() => {
                        stateTouchingBottomRef.current = false;
                        setIsStateHoveringBottom(false);
                      }}
                    >
                      <div ref={stateBottomFirstTrackRef} className="flex gap-4">
                        {stateDepartments.map((department, index) => (
                          <div key={`${department.id}-bottom-${index}`} className="shrink-0 snap-start">
                            <StateDepartmentCard department={department} context={stateLevelContext} />
                          </div>
                        ))}
                      </div>
                      <div aria-hidden className="flex gap-4">
                        {stateDepartments.map((department, index) => (
                          <div key={`${department.id}-bottom-dup-${index}`} className="shrink-0 snap-start">
                            <StateDepartmentCard department={department} context={stateLevelContext} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Scroll right"
                    onClick={() => handleStateMarqueeScroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 shadow-md p-1.5 sm:p-2 hover:bg-white border border-slate-200 active:scale-95 transition-transform"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {stateDepartments.map((department) => (
                    <StateDepartmentCard
                      key={`${department.id}-${stateScope}`}
                      department={department}
                      fullWidth
                      context={stateLevelContext}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-slate-500 text-sm">
              {stateScope === "district" ? (
                <>
                  No appointments found for {selectedDistrictName || 'selected district'}. Try another district or clear
                  the filter.
                </>
              ) : (
                <>No state-level appointments recorded yet for {selectedStateName}.</>
              )}
            </div>
          )}
        </div>

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
