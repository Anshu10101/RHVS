"use client";

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Code2, ExternalLink, ArrowRight, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';

export default function Footer() {
  const { t, language, setLanguage } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);

  return (
    <footer className="bg-gradient-to-b from-orange-50/30 to-orange-100/20 text-orange-900/80 py-16 border-t border-orange-200/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Organization Info */}
          <div className="col-span-1">
            <h3 className="text-xl font-semibold mb-4 text-orange-800/90">Rashtriya Hindu Vahini Sangathan</h3>
            <p className="text-orange-700/70 mb-6 leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-orange-600/60 hover:text-orange-600 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-orange-600/60 hover:text-orange-600 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-orange-600/60 hover:text-orange-600 transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          {/* Useful Links */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold mb-4 text-orange-800/90">{t('footer.usefulLinks')}</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  {t('nav.gallery')}
                </Link>
              </li>
              <li>
                <Link href="/proposal" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  {t('footer.proposal')}
                </Link>
              </li>
              <li>
                <Link href="/karya-samiti" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  {t('nav.committee')}
                </Link>
              </li>
              <li>
                <Link href="/offices" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  {t('nav.offices')}
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  {t('footer.adminPanel')}
                </Link>
              </li>
              <li>
                <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                  <PopoverTrigger asChild>
                    <button className="text-orange-700/70 hover:text-orange-600 transition-colors flex items-center gap-1.5 w-full">
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
                        <span>🇮🇳</span>
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
                        <span>🇬🇧</span>
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
            <h4 className="text-lg font-semibold mb-4 text-orange-800/90">{t('footer.rhvs')}</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/duty" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  {t('footer.duty')}
                </Link>
              </li>
              <li>
                <Link href="/roles" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  {t('footer.roles')}
                </Link>
              </li>
              <li>
                <Link href="/activities" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  {t('footer.activities')}
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  {t('footer.products')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold mb-4 text-orange-800/90">{t('footer.contactUs')}</h4>
            <div className="space-y-4">
              <p className="text-orange-700/70 text-sm leading-relaxed mb-4">
                {t('footer.contactDescription') || 'For contact information, please visit our contact page.'}
              </p>
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors group"
              >
                <span>{t('footer.viewContactPage') || 'View Contact Page'}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-orange-200/50 mt-12 pt-8 text-center">
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
