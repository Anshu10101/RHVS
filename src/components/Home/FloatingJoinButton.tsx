'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export default function FloatingJoinButton() {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-4 right-3 z-50 md:hidden">
      <Link href="/members/register">
        <Button 
          size="sm"
          className="group relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white px-3 py-2 rounded-full font-semibold text-xs shadow-[0_4px_14px_0_rgba(234,88,12,0.39)] hover:shadow-[0_6px_20px_0_rgba(234,88,12,0.5)] transition-all duration-300 hover:translate-y-[-2px] active:translate-y-[0px] active:shadow-[0_2px_10px_0_rgba(234,88,12,0.39)] border-0 flex items-center justify-center before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
        >
          <span className="relative z-10 leading-none">{t('nav.join')}</span>
        </Button>
      </Link>
    </div>
  );
}

