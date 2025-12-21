"use client";

import type { Metadata } from "next";
import Image from "next/image";
import { Noto_Serif_Devanagari } from "next/font/google";
import { useLanguage } from "@/contexts/LanguageContext";

// Metadata removed - using client component for translations

const devanagari = Noto_Serif_Devanagari({ subsets: ["devanagari"], weight: ["400", "600", "700"] });

function MemberCard({ src, name, role }: { src: string; name: string; role: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          width: 'clamp(180px, 40vw, 280px)',
          height: 'clamp(200px, 45vw, 320px)',
          background: 'transparent',
          padding: 0,
          borderStyle: 'solid',
          borderWidth: 'clamp(8px, 1.5vw, 15px)',
          // frame bevel effect inspired by provided CSS
          borderTopColor: 'rgba(0,0,0,0.2)',
          borderRightColor: 'rgba(0,0,0,0.6)',
          borderBottomColor: 'rgba(0,0,0,0.2)',
          borderLeftColor: 'rgba(0,0,0,0.6)',
          boxShadow: '2px 2px 4px rgba(0,0,0,.6)'
        }}
      >
        <Image src={src} alt={name} fill className="object-cover" sizes="(max-width: 640px) 180px, (max-width: 768px) 220px, 280px" priority />
      </div>

      <div className="text-center mt-3 sm:mt-4 md:mt-6">
        <h3 className={`${devanagari.className} text-base sm:text-xl md:text-2xl font-bold text-orange-900 mb-1 sm:mb-2`}>{name}</h3>
        <p className={`${devanagari.className} text-sm sm:text-base md:text-lg text-orange-700`}>{role}</p>
      </div>
    </div>
  );
}

export default function KaryaSamitiPage() {
  const { t } = useLanguage();
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-orange-50 to-white flex flex-col">
      {/* Hero Section */}
      <section className="py-2 sm:py-4 md:py-6 flex-shrink-0">
        <div className="container mx-auto px-4 text-center">
          <h1 className={`${devanagari.className} text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 md:mb-3 text-orange-900`}>
            {t('committee.title')}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-orange-700/80 mb-2 sm:mb-3 md:mb-4 max-w-3xl mx-auto">
            {t('committee.subtitle')}
          </p>
          
          {/* Lotus divider */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4 md:mb-6">
            <span className="h-px w-6 sm:w-8 md:w-10 bg-orange-200" />
            <span className="text-lg sm:text-xl md:text-2xl">🪷</span>
            <span className="h-px w-6 sm:w-8 md:w-10 bg-orange-200" />
          </div>
        </div>
      </section>

      {/* Members Section */}
      <section className="flex-1 flex items-center justify-center py-1 sm:py-2 md:py-4 min-h-0">
        <div className="container mx-auto px-4 w-full">
          <div className="text-center mb-2 sm:mb-3 md:mb-4">
            <h2 className={`${devanagari.className} text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 text-orange-900`}>
              {t('committee.nationalIncharge')}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-orange-700/80">
              {t('committee.leadership')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-4xl mx-auto">
            <MemberCard src="/images/P1.png" name="श्री लक्ष्मी नारायण शिवहरे" role="राष्ट्रीय प्रभारी" />
            <MemberCard src="/images/P2.png" name="ऐ. कृष्णा कुमार रेड्डी" role="राष्ट्रीय प्रभारी" />
          </div>
        </div>
      </section>
    </div>
  );
}
