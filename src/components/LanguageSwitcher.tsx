"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';

// Language Switch Icon SVG Component
function LanguageSwitchIcon({ className }: { className?: string }) {
  return (
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
      className={className}
    >
      <path d="m5 8 6 6"/>
      <path d="m4 14 6-6 2-3"/>
      <path d="M2 5h12"/>
      <path d="M7 2h1"/>
      <path d="m22 22-5-10-5 10"/>
      <path d="M14 18h6"/>
    </svg>
  );
}

export default function LanguageSwitcher({ variant = 'button', onLanguageChange }: { variant?: 'button' | 'link'; onLanguageChange?: () => void }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (lang: 'hi' | 'en') => {
    setLanguage(lang);
    setOpen(false);
    onLanguageChange?.();
  };

  if (variant === 'link') {
    return (
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-3 w-full text-left py-2.5 px-3 text-orange-900 hover:bg-orange-50 rounded-md transition-colors text-base"
          >
            <LanguageSwitchIcon className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <span>{language === 'hi' ? 'हिंदी' : 'English'}</span>
            <ChevronDown size={16} className="opacity-70 ml-auto" />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          align="start" 
          sideOffset={8}
          side="bottom"
          className="w-[160px] p-2 !z-[10000]"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex flex-col gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLanguageChange('hi');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                language === 'hi'
                  ? 'bg-orange-50 text-orange-800 font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>🇮🇳</span>
              <span>हिंदी</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLanguageChange('en');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
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
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-orange-700 hover:text-orange-800 hover:bg-orange-50"
        >
          <LanguageSwitchIcon className="h-5 w-5" />
          <span className="hidden sm:inline">
            {language === 'hi' ? 'हिंदी' : 'English'}
          </span>
          <span className="sm:hidden">
            {language === 'hi' ? 'HI' : 'EN'}
          </span>
          <ChevronDown size={14} className="opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[140px] p-2">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => handleLanguageChange('hi')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              language === 'hi'
                ? 'bg-orange-50 text-orange-800 font-semibold'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span>🇮🇳</span>
            <span>हिंदी</span>
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
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
  );
}

