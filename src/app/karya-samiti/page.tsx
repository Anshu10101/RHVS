"use client";

import type { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Noto_Serif_Devanagari } from "next/font/google";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

// Metadata removed - using client component for translations

const devanagari = Noto_Serif_Devanagari({ subsets: ["devanagari"], weight: ["400", "600", "700"] });

function MemberCard({ src, name, role }: { src: string; name: string; role: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          width: 280,
          height: 320,
          background: 'transparent',
          padding: 0,
          borderStyle: 'solid',
          borderWidth: 15,
          // frame bevel effect inspired by provided CSS
          borderTopColor: 'rgba(0,0,0,0.2)',
          borderRightColor: 'rgba(0,0,0,0.6)',
          borderBottomColor: 'rgba(0,0,0,0.2)',
          borderLeftColor: 'rgba(0,0,0,0.6)',
          boxShadow: '2px 2px 4px rgba(0,0,0,.6)'
        }}
      >
        <Image src={src} alt={name} fill className="object-cover" sizes="280px" priority />
      </div>

      <div className="text-center mt-6">
        <h3 className={`${devanagari.className} text-2xl font-bold text-orange-900 mb-2`}>{name}</h3>
        <p className={`${devanagari.className} text-lg text-orange-700`}>{role}</p>
      </div>
    </div>
  );
}

export default function KaryaSamitiPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className={`${devanagari.className} text-4xl md:text-6xl font-bold mb-3 text-orange-900`}>
            {t('committee.title')}
          </h1>
          <p className="text-lg md:text-xl text-orange-700/80 mb-4 max-w-3xl mx-auto">
            {t('committee.subtitle')}
          </p>
          
          {/* Lotus divider */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-10 bg-orange-200" />
            <span className="text-2xl">🪷</span>
            <span className="h-px w-10 bg-orange-200" />
          </div>
        </div>
      </section>

      {/* Members Section */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className={`${devanagari.className} text-3xl font-bold mb-3 text-orange-900`}>
              {t('committee.nationalIncharge')}
            </h2>
            <p className="text-lg text-orange-700/80">
              {t('committee.leadership')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <MemberCard src="/images/P1.png" name="श्री लक्ष्मी नारायण शिवहरे" role="राष्ट्रीय प्रभारी" />
            <MemberCard src="/images/P2.png" name="ऐ. कृष्णा कुमार रेड्डी" role="राष्ट्रीय प्रभारी" />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-8 bg-gradient-to-r from-orange-100/50 to-orange-50/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className={`${devanagari.className} text-3xl md:text-4xl font-bold mb-6 text-orange-900`}>
            {t('committee.joinOrganization')}
          </h2>
          <p className="text-lg text-orange-700/80 mb-8 max-w-2xl mx-auto">
            {t('committee.joinDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/members/register">
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full font-semibold transition-colors">
                {t('committee.becomeMember')}
            </button>
            </Link>
            <Link href="/contact">
            <button className="bg-white hover:bg-orange-50 text-orange-600 border-2 border-orange-600 px-8 py-3 rounded-full font-semibold transition-colors">
                {t('committee.contactUs')}
            </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
