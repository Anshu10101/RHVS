"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Users, Building2, MapPin, Calendar, Image as ImageIcon, ShoppingBag, Phone, Newspaper, Home } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Navbar() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? 'hidden' : prev || '';
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [open]);
  return (
    <header className="w-full py-1 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-md rounded-full px-6 py-1 shadow-lg border border-orange-100 w-full">
          <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3 md:gap-4 group">
            <span className="relative block h-12 w-12 md:h-14 md:w-14 rounded-full overflow-hidden ring-2 ring-orange-200">
              <Image
                src="/rhvs_logo.png"
                alt="RHVS Logo"
                fill
                sizes="(max-width: 768px) 3rem, 3.5rem"
                className="object-cover"
                priority
              />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base md:text-lg font-bold text-orange-800">
                राष्ट्रीय हिंदू वाहिनी संगठन
              </span>
              <span className="text-xs md:text-sm text-orange-700/80">
                Rashtriya Hindu Vahini Sangathan
              </span>
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden xl:flex items-center space-x-3">
            <Link href="/about" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <Users size={16} />
              <span>{t('nav.about')}</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/karya-samiti" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <Building2 size={16} />
              <span>{t('nav.committee')}</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/offices" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <MapPin size={16} />
              <span>{t('nav.offices')}</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/news" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <Newspaper size={16} />
              <span>{t('nav.news')}</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/events" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <Calendar size={16} />
              <span>{t('nav.events')}</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/gallery" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <ImageIcon size={16} />
              <span>{t('nav.gallery')}</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/products" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <ShoppingBag size={16} />
              <span>{t('nav.products')}</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/contact" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <Phone size={16} />
              <span>{t('nav.contact')}</span>
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <div className="hidden xl:block">
              <LanguageSwitcher />
            </div>
            <Link href="/members/register">
              <Button variant="default" className="hidden xl:inline-flex bg-orange-600 hover:bg-orange-700">
                {t('nav.join')}
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <button className="xl:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <span className="sr-only">Open menu</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-orange-700" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[9999] xl:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          {/* Full-screen sheet for maximum clarity */}
          <div className="absolute inset-0 bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100">
              <span className="text-sm font-semibold text-orange-800">{t('nav.menu')}</span>
              <button onClick={() => setOpen(false)} aria-label={t('nav.close')} className="p-2 rounded-md hover:bg-orange-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <nav className="grow overflow-y-auto px-4 py-4">
              <ul className="space-y-1">
                <li>
                  <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-orange-900 hover:bg-orange-50 rounded-md transition-colors text-base">
                    <Home size={20} className="text-orange-600 flex-shrink-0" />
                    <span>{t('nav.home')}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/about" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-orange-900 hover:bg-orange-50 rounded-md transition-colors text-base">
                    <Users size={20} className="text-orange-600 flex-shrink-0" />
                    <span>{t('nav.about')}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/karya-samiti" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-orange-900 hover:bg-orange-50 rounded-md transition-colors text-base">
                    <Building2 size={20} className="text-orange-600 flex-shrink-0" />
                    <span>{t('nav.committee')}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/offices" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-orange-900 hover:bg-orange-50 rounded-md transition-colors text-base">
                    <MapPin size={20} className="text-orange-600 flex-shrink-0" />
                    <span>{t('nav.offices')}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/news" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-orange-900 hover:bg-orange-50 rounded-md transition-colors text-base">
                    <Newspaper size={20} className="text-orange-600 flex-shrink-0" />
                    <span>{t('nav.news')}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/events" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-orange-900 hover:bg-orange-50 rounded-md transition-colors text-base">
                    <Calendar size={20} className="text-orange-600 flex-shrink-0" />
                    <span>{t('nav.events')}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/gallery" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-orange-900 hover:bg-orange-50 rounded-md transition-colors text-base">
                    <ImageIcon size={20} className="text-orange-600 flex-shrink-0" />
                    <span>{t('nav.gallery')}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/products" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-orange-900 hover:bg-orange-50 rounded-md transition-colors text-base">
                    <ShoppingBag size={20} className="text-orange-600 flex-shrink-0" />
                    <span>{t('nav.products')}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/contact" onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-orange-900 hover:bg-orange-50 rounded-md transition-colors text-base">
                    <Phone size={20} className="text-orange-600 flex-shrink-0" />
                    <span>{t('nav.contact')}</span>
                  </Link>
                </li>
                <li>
                  <div className="py-2.5 px-3">
                    <LanguageSwitcher variant="link" onLanguageChange={() => setOpen(false)} />
                  </div>
                </li>
              </ul>
            </nav>
            <div className="px-4 pb-4 space-y-2 border-t border-orange-100 pt-3">
              <MobileInstallCTA onInstalled={() => setOpen(false)} />
              <Link href="/members/register" onClick={() => setOpen(false)}>
                <Button className="w-full bg-orange-600 hover:bg-orange-700">{t('nav.join')}</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileInstallCTA({ onInstalled }: { onInstalled?: () => void }) {
  const { t } = useLanguage();
  const { promptEvent, isInstalled, consumePrompt } = useInstallPrompt();
  const [error, setError] = useState<string | null>(null);

  if (isInstalled) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50/80 px-4 py-3 text-sm text-green-800 shadow-sm">
        {t('install.installed')}
      </div>
    );
  }

  const handleInstall = async () => {
    if (!promptEvent) return;
    setError(null);

    await promptEvent.prompt();
    const choiceResult = await promptEvent.userChoice;
    consumePrompt(choiceResult.outcome);

    if (choiceResult.outcome === 'accepted') {
      onInstalled?.();
    } else {
      setError(t('common.error'));
    }
  };

  return (
    <div>
      <Button
        className={`w-full ${promptEvent ? 'bg-orange-500 hover:bg-orange-600' : 'bg-orange-200 text-orange-600 cursor-not-allowed'}`}
        onClick={handleInstall}
        disabled={!promptEvent}
      >
        {t('install.app')}
      </Button>
      {!promptEvent && (
        <p className="mt-2 text-xs text-orange-700">
          {t('install.hint')}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}