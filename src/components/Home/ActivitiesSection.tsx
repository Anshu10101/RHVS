"use client";
import { CalendarDays, HandHeart, GraduationCap, UsersRound, Megaphone, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Noto_Serif_Devanagari } from 'next/font/google';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

export default function ActivitiesSection() {
  const { t } = useLanguage();
const items = [
  {
    icon: <HandHeart className="h-7 w-7" strokeWidth={1.5} />, 
      title: t('activities.seva'),
      desc: t('activities.sevaDesc')
  },
  {
    icon: <GraduationCap className="h-7 w-7" strokeWidth={1.5} />, 
      title: t('activities.education'),
      desc: t('activities.educationDesc')
  },
  {
    icon: <UsersRound className="h-7 w-7" strokeWidth={1.5} />, 
      title: t('activities.unity'),
      desc: t('activities.unityDesc')
  },
  {
    icon: <Megaphone className="h-7 w-7" strokeWidth={1.5} />, 
      title: t('activities.awareness'),
      desc: t('activities.awarenessDesc')
  },
  {
    icon: <BookOpen className="h-7 w-7" strokeWidth={1.5} />, 
      title: t('activities.study'),
      desc: t('activities.studyDesc')
  },
  {
    icon: <CalendarDays className="h-7 w-7" strokeWidth={1.5} />, 
      title: t('activities.events'),
      desc: t('activities.eventsDesc')
  },
];
  return (
    <section className="py-20 sm:py-24 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(0,0,0) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-300" />
            <span className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-orange-600/80">
              {t('activities.title')}
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-300" />
          </div>
          
          <h2 className={`${devanagari.className} text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-gray-900 leading-tight`}>
            {t('activities.header')}
          </h2>
          
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            {t('activities.subtitle')}
          </p>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/0 group-hover:from-orange-50/50 group-hover:to-transparent rounded-2xl transition-all duration-300 pointer-events-none" />
              
              {/* Icon */}
              <div className="relative mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200 transition-all duration-300">
                  <div className="text-orange-600 group-hover:text-orange-700 transition-colors duration-300">
                    {item.icon}
                  </div>
                </div>
              </div>
              
              {/* Title */}
              <h3 className={`${devanagari.className} text-xl font-bold mb-3 text-gray-900 group-hover:text-orange-800 transition-colors duration-300 relative z-10`}>
                {item.title}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 leading-relaxed text-[15px] relative z-10">
                {item.desc}
              </p>
              
              {/* Decorative line */}
              <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-orange-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link href="/activities">
            <Button 
              className="group relative inline-flex items-center gap-2 px-8 py-6 text-base font-semibold bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <span>{t('activities.viewAll')}</span>
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
