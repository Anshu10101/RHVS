"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRound, ChevronDown, ChevronUp } from "lucide-react";

interface Member {
  id: number;
  name: string;
  photo_path: string | null;
  reg_number: string;
  email: string;
}

interface Post {
  id: number;
  name_en: string;
  name_hi: string;
  position_order: number;
}

interface MemberWithPost {
  post: Post;
  member: Member | null;
}

interface Department {
  id: number;
  name_en: string;
  name_hi: string;
}

export default function NationalExecutiveSection() {
  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<MemberWithPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadNationalExecutive = async () => {
      try {
        const response = await fetch('/api/public/departments/national-executive', { cache: 'no-store' });
        const data = await response.json();
        
        if (data?.success) {
          if (data.department) {
            setDepartment(data.department);
            setMembers(data.members || []);
          }
        }
      } catch (error) {
        console.error('Failed to load National Executive Department:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNationalExecutive();
  }, []);

  // Don't render if no department is set
  if (loading || !department || members.length === 0) {
    return null;
  }

  // Separate top 2 tiers and rest
  const topTwoTiers = members.filter(m => m.post.position_order <= 2);
  const remainingTiers = members.filter(m => m.post.position_order > 2);
  const displayMembers = showAll ? members : topTwoTiers;

  const groupedDisplay = Array.from(
    displayMembers.reduce((acc, item) => {
      if (!acc.has(item.post.id)) {
        acc.set(item.post.id, { post: item.post, entries: [] as MemberWithPost[] });
      }
      acc.get(item.post.id)!.entries.push(item);
      return acc;
    }, new Map<number, { post: Post; entries: MemberWithPost[] }>())
      .values()
  ).sort((a, b) => a.post.position_order - b.post.position_order);

  return (
    <section className="py-6 md:py-8 bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-4 md:mb-6">
          <div className="relative inline-block mb-3 px-10">
            <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-black text-orange-900 tracking-tight font-['Tiro_Devanagari_Hindi',serif]">
              {department.name_hi}
            </h2>
            <Image
              src="/flag_logo.png"
              alt="National Flag"
              width={40}
              height={40}
              className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-2 h-7 w-7 md:h-9 md:w-9 object-contain"
              priority
            />
          </div>
          <div className="flex justify-center mb-2">
            <div className="h-1 w-28 md:w-36 bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full shadow-[0_2px_6px_rgba(249,115,22,0.35)]"></div>
          </div>
          <p className="text-sm md:text-base text-orange-700 font-semibold">
            {department.name_en}
          </p>
        </div>

        {/* Hierarchy Tree */}
        <div className="max-w-5xl mx-auto">
          <div className="space-y-6">
            {groupedDisplay.map((group, groupIndex) => {
              const isTopTier = group.post.position_order <= 2;
              const isFirst = group.post.position_order === 1;
              const heroEntry = isTopTier ? group.entries[0] : null;
              const regularEntries = isTopTier ? group.entries.slice(1) : group.entries;

              return (
                <div key={group.post.id} className="space-y-4">
                  {/* Post Heading */}
                  <div className="text-center overflow-visible">
                    <div className="overflow-visible">
                      <h3
                        className={`relative inline-block text-lg md:text-xl font-extrabold text-orange-900 leading-[1.4] py-0.5 ${
                          isFirst ? 'text-xl md:text-2xl px-8' : ''
                        }`}
                      >
                        <span className="block text-center">{group.post.name_hi}</span>
                        {isFirst && (
                          <Image
                            src="/flag_logo.png"
                            alt="National Flag"
                            width={24}
                            height={24}
                            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1 h-5 w-5 md:h-6 md:w-6 object-contain"
                          />
                        )}
                      </h3>
                    </div>
                    <p className="text-xs md:text-sm text-orange-700/80 mt-1">{group.post.name_en}</p>
                  </div>

                  {/* Highlighted hero card for top tiers */}
                  {heroEntry && (
                    <div className="flex justify-center mt-6">
                      <Card className={`group relative border border-orange-100 ${
                        isFirst 
                          ? 'bg-gradient-to-br from-[#fff4e8] via-white to-[#fffdf9]' 
                          : 'bg-gradient-to-br from-[#fff8f0] via-white to-[#fffdfb]'
                      } transition-all duration-300 hover:-translate-y-1 overflow-visible ${
                        isFirst
                          ? 'w-fit min-w-[230px] md:min-w-[260px]'
                          : 'w-fit min-w-[200px] md:min-w-[220px]'
                      } shadow-[12px_12px_28px_rgba(221,135,72,0.18),-12px_-12px_28px_rgba(255,255,255,0.9)] hover:shadow-[16px_16px_38px_rgba(221,135,72,0.22),-14px_-14px_32px_rgba(255,255,255,0.95)]`}>
                        <CardContent className={`relative z-10 ${isFirst ? 'px-3 py-2 md:px-4 md:py-3' : 'px-2.5 py-1.5 md:px-3 md:py-2.5'}`}>
                          <div className="flex flex-col items-center text-center">
                            {/* Photo with 3D effect */}
                            <div className="relative mb-3 -mt-2 md:-mt-4">
                              <div className={`relative rounded-full ring-4 ${
                                isFirst
                                  ? 'w-32 h-32 md:w-40 md:h-40 ring-orange-500' 
                                  : 'w-24 h-24 md:w-28 md:h-28 ring-orange-300'
                              } transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 bg-white scale-105 translate-y-[-2px] ${
                                isFirst
                                  ? 'shadow-[0_10px_30px_rgba(249,115,22,0.4),0_0_0_4px_rgba(249,115,22,0.1),inset_0_2px_10px_rgba(255,255,255,0.8)]'
                                  : 'shadow-[0_8px_25px_rgba(249,115,22,0.3),0_0_0_4px_rgba(249,115,22,0.08),inset_0_2px_8px_rgba(255,255,255,0.8)]'
                              } group-hover:shadow-[0_15px_40px_rgba(249,115,22,0.5),0_0_0_6px_rgba(249,115,22,0.15),inset_0_2px_12px_rgba(255,255,255,0.9)]`}>
                                {/* Photo extending beyond frame */}
                                {heroEntry.member?.photo_path ? (
                                  <div className="absolute inset-[-8px] md:inset-[-10px] rounded-full overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                    <Image
                                      src={heroEntry.member.photo_path.startsWith('/') 
                                        ? heroEntry.member.photo_path 
                                        : `/${heroEntry.member.photo_path}`}
                                      alt={heroEntry.member.name || 'Member'}
                                      fill
                                      className="object-cover"
                                      sizes={isFirst ? "(max-width: 768px) 144px, 180px" : "(max-width: 768px) 112px, 136px"}
                                      quality={95}
                                    />
                                    {/* Inner glow effect on photo */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none z-10"></div>
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 rounded-full overflow-hidden">
                                    <UserRound className={`text-orange-400 ${isFirst ? 'h-16 w-16 md:h-20 md:w-20' : 'h-12 w-12 md:h-14 md:w-14'}`} />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Member Info */}
                            {heroEntry.member ? (
                              <h3 className={`font-black text-gray-900 mt-1 ${
                                isFirst ? 'text-base md:text-lg' : 'text-sm md:text-base'
                              }`}>
                                {heroEntry.member.name}
                              </h3>
                            ) : (
                              <div className="text-center">
                                <p className={`font-semibold text-gray-500 mb-0.5 ${
                                  isFirst ? 'text-sm md:text-base' : 'text-xs md:text-sm'
                                }`}>Position Vacant</p>
                                <p className={`text-gray-400 ${isFirst ? 'text-xs' : 'text-[10px]'}`}>Awaiting appointment</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Grid of members (limited to 6 per row) */}
                  {regularEntries.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap justify-center gap-3 md:gap-4 mx-auto max-w-5xl">
                        {regularEntries.map((item, idx) => (
                          <div
                            key={`${group.post.id}-${idx}-${item.member?.id ?? 'vacant'}`}
                            className="basis-[48%] sm:basis-[45%] md:basis-[30%] lg:basis-[22%] xl:basis-[18%] 2xl:basis-[16%] max-w-[190px] flex"
                          >
                            <Card
                              className="group relative flex-1 border border-orange-100 bg-gradient-to-br from-white to-[#fff9f5] shadow-[8px_8px_20px_rgba(221,135,72,0.12),-8px_-8px_20px_rgba(255,255,255,0.95)] hover:-translate-y-1 hover:shadow-[10px_10px_26px_rgba(221,135,72,0.18),-10px_-10px_26px_rgba(255,255,255,0.95)] transition-all duration-300"
                            >
                              <CardContent className="p-3 flex flex-col items-center text-center space-y-3">
                                <div className="relative mb-2">
                                  <div className="relative w-20 h-20 rounded-full ring-4 ring-orange-200 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.08)] overflow-hidden scale-105 translate-y-[-2px] transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 group-hover:shadow-[0_12px_25px_rgba(249,115,22,0.35),0_0_0_4px_rgba(249,115,22,0.1)]">
                                    {item.member?.photo_path ? (
                                      <div className="absolute inset-[-6px] rounded-full overflow-hidden group-hover:scale-[1.08] transition-transform duration-300">
                                        <Image
                                          src={item.member.photo_path.startsWith('/') ? item.member.photo_path : `/${item.member.photo_path}`}
                                          alt={item.member.name || 'Member'}
                                          fill
                                          className="object-cover"
                                          sizes="80px"
                                          quality={90}
                                        />
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none z-10"></div>
                                      </div>
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                                        <UserRound className="h-10 w-10 text-orange-400" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {item.member ? (
                                  <p className="font-semibold text-gray-900 text-sm">{item.member.name}</p>
                                ) : (
                                  <div>
                                    <p className="font-semibold text-gray-500 text-sm">Position Vacant</p>
                                    <p className="text-[11px] text-gray-400">Awaiting appointment</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider between posts (except last) */}
                  {groupIndex < groupedDisplay.length - 1 && (
                    <div className="flex items-center justify-center gap-2 text-orange-300 pt-2">
                      <div className="h-px w-12 bg-orange-200" />
                      <span className="text-xs">●</span>
                      <div className="h-px w-12 bg-orange-200" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Expand/Collapse Button */}
          {remainingTiers.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setShowAll(!showAll)}
                variant="outline"
                className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 font-semibold px-6 py-2"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    View All
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

