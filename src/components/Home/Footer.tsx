"use client";

import Link from 'next/link';
import { Code2, ExternalLink, ArrowRight, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState, useEffect } from 'react';

export default function Footer() {
  const { t, language, setLanguage } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for footer updates via BroadcastChannel
  useEffect(() => {
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      broadcastChannel = new BroadcastChannel('footer-update');
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'footer-updated') {
          // Force re-render by updating key
          setRefreshKey(prev => prev + 1);
        }
      };
    } catch (err) {
      console.log('BroadcastChannel not supported');
    }

    // Also refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setRefreshKey(prev => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <footer key={refreshKey} className="bg-gradient-to-b from-orange-50/30 to-orange-100/20 text-orange-900/80 py-16 border-t border-orange-200/50 shadow-inner">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Organization Info */}
          <div className="col-span-1">
            <h3 className="text-xl font-semibold mb-4 text-orange-800/90">
              {language === 'hi' ? 'राष्ट्रीय हिंदू वाहिनी संगठन' : 'Rashtriya Hindu Vahini Sangathan'}
            </h3>
            <p className="text-orange-700/70 mb-6 leading-relaxed text-sm">
              {t('footer.description')}
            </p>
            <div className="flex items-center">
              <a 
                href="https://www.youtube.com/@RHVS-1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg shadow-md"
                aria-label="YouTube"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                  <path d="m10 15 5-3-5-3z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Useful Links */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold mb-5 text-orange-800/90 border-b border-orange-200/50 pb-2">
              {t('footer.usefulLinks')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.gallery')}
                </Link>
              </li>
              <li>
                <Link href="/karya-samiti" className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.committee')}
                </Link>
              </li>
              <li>
                <Link href="/offices" className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.offices')}
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('footer.adminPanel')}
                </Link>
              </li>
              <li className="pt-2">
                <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                  <PopoverTrigger asChild>
                    <button className="text-orange-700/70 hover:text-orange-600 transition-colors flex items-center gap-1.5 w-full hover:translate-x-1 duration-200">
                      <span>{language === 'hi' ? 'हिंदी' : 'English'}</span>
                      <ChevronDown size={14} className="opacity-70" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[140px] p-2">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          setLanguage('hi');
                          setLanguageOpen(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          language === 'hi'
                            ? 'bg-orange-50 text-orange-800 font-semibold'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span>हिंदी</span>
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('en');
                          setLanguageOpen(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          language === 'en'
                            ? 'bg-orange-50 text-orange-800 font-semibold'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span>English</span>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </li>
            </ul>
          </div>
          
          {/* RHVS */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold mb-5 text-orange-800/90 border-b border-orange-200/50 pb-2">
              RHVS
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/activities" className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('footer.activities')}
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('footer.products')}
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.news')}
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.events')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200">
                  {t('nav.contact')}
                </Link>
              </li>
              <li>
                <Link
                  href="/members/register/verification"
                  className="text-orange-700/70 hover:text-orange-600 transition-colors inline-block hover:translate-x-1 duration-200"
                >
                  {language === 'hi'
                    ? 'सदस्य विवरण सत्यापन'
                    : 'Member Self Verification'}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold mb-5 text-orange-800/90 border-b border-orange-200/50 pb-2">
              {t('footer.contactUs')}
            </h4>
            <div className="space-y-4">
              <p className="text-orange-700/70 text-sm leading-relaxed mb-5">
                {t('footer.contactDescription') || 'For contact information, please visit our contact page.'}
              </p>
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm transition-all duration-200 group px-4 py-2 rounded-lg hover:bg-orange-50"
              >
                <span>{t('footer.viewContactPage') || 'View Contact Page'}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Join Now CTA Section - Prominent call to action */}
        <div className="border-t border-orange-200/50 mt-12 pt-8 pb-6 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-orange-800 mb-3 sm:mb-4">
            {language === 'hi' ? 'हमारे साथ जुड़ें' : 'Join Us Today'}
          </h3>
          <p className="text-orange-700/70 mb-6 text-sm sm:text-base max-w-2xl mx-auto">
            {language === 'hi' 
              ? 'राष्ट्रीय हिन्दू वाहिनी संगठन का हिस्सा बनें और सनातन धर्म की सेवा में योगदान दें' 
              : 'Become a part of Rashtriya Hindu Vahini Sangathan and contribute to serving Sanatan Dharma'}
          </p>
          <Link href="/members/register">
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-8 sm:px-10 md:px-12 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              {t('nav.join')}
            </button>
          </Link>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-orange-200/50 pt-8 text-center">
          <p className="text-orange-700/60 text-sm">
            &copy; {new Date().getFullYear()} Rashtriya Hindu Vahini Sangathan. {t('footer.allRightsReserved')}
          </p>
          <p className="text-orange-600 mt-2 text-sm font-medium">
            ॥ धर्मो रक्षति रक्षितः ॥
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/60 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                <Code2 className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm text-orange-900 font-semibold">
                {t('footer.developedBy')}{' '}
                <Link
                  href="/developer"
                  className="group relative inline-flex items-center gap-1 underline decoration-orange-300/70 underline-offset-4 hover:text-orange-800 transition-colors"
                >
                  <span>Anshul Yadav</span>
                  {/* Mobile: Always visible icon */}
                  <ExternalLink className="w-3.5 h-3.5 sm:hidden text-orange-600/70 group-hover:text-orange-600 transition-colors" />
                  {/* Desktop: Tooltip on hover */}
                  <span className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-orange-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {t('footer.viewDeveloper')}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-orange-900"></span>
                  </span>
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
