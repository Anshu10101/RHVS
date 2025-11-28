"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Noto_Sans_Devanagari } from "next/font/google";
import { useLanguage } from "@/contexts/LanguageContext";

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
});

interface AboutSection {
  id: string;
  type: 'hero' | 'card' | 'quote' | 'paragraph' | 'heading';
  title?: string;
  content: string;
  order: number;
  isVisible: boolean;
  styling?: {
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: string;
    fontWeight?: string;
    color?: 'gray' | 'orange' | 'red' | 'blue' | 'green';
  };
}

export default function AboutPage() {
  const { t } = useLanguage();
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSections = useCallback(async () => {
    try {
      const response = await fetch(`/api/content/about?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        // Sort sections by order
        const sortedSections = [...result.data].sort((a, b) => (a.order || 0) - (b.order || 0));
        setSections(sortedSections);
      } else {
        // Load default sections if no data exists
        const defaultSections: AboutSection[] = [
          {
            id: '1',
            type: 'hero',
            title: 'सनातन धर्म',
            content: 'सनातन धर्म शाश्वत है — जिसका न आदि है न अंत। यही सनातन परम्परा हिंदू धर्म का मूल स्वरूप है और भारतीय संस्कृति की आत्मा है।',
            order: 1,
            isVisible: true,
            styling: {
              textAlign: 'center',
              fontSize: '5xl',
              fontWeight: 'extrabold',
              color: 'orange'
            }
          },
          {
            id: '2',
            type: 'card',
            title: 'परिचय',
            content: 'सनातन धर्म हिंदू धर्म का ही वैकल्पिक नाम है जिसका उपयोग संस्कृत और अन्य भारतीय भाषाओं में भी किया जाता है। वैदिक काल में भारतीय उपमहाद्वीप के धर्म के लिए \'सनातन धर्म\' नाम मिलता है। \'सनातन\' का अर्थ है - शाश्वत या \'सदा बना रहने वाला\', अर्थात् जिसका न आदि है न अन्त।',
            order: 2,
            isVisible: true,
            styling: {
              textAlign: 'left',
              fontSize: 'base',
              fontWeight: 'normal',
              color: 'gray'
            },
          },
        ];
        setSections(defaultSections);
      }
    } catch (error) {
      console.error('Error loading about sections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();

    // Reload when page becomes visible (user returns from admin panel or switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadSections();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadSections]);

  const getTextAlignClass = (align?: string) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const getFontSizeClass = (size?: string) => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      case '3xl': return 'text-3xl';
      case '4xl': return 'text-4xl';
      case '5xl': return 'text-5xl';
      default: return 'text-base';
    }
  };

  const getFontWeightClass = (weight?: string) => {
    switch (weight) {
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      case 'extrabold': return 'font-extrabold';
      default: return 'font-normal';
    }
  };

  const getTextColorClass = (color?: string) => {
    switch (color) {
      case 'orange': return 'text-orange-800';
      case 'red': return 'text-red-800';
      case 'blue': return 'text-blue-800';
      case 'green': return 'text-green-800';
      default: return 'text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-b from-orange-50 to-white py-14 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-orange-200 bg-white/70 text-orange-700 mb-4">
              <span className="text-xl md:text-2xl">ॐ</span>
              <span className="ml-2 text-sm md:text-base font-medium">{t('about.sanatanDharma')}</span>
            </div>
            <p className="text-orange-700">{t('about.loading')}</p>
          </div>
        </section>
      </div>
    );
  }

  // If no sections found, show default content
  if (!sections || sections.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-b from-orange-50 to-white py-14 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-orange-200 bg-white/70 text-orange-700 mb-4">
              <span className="text-xl md:text-2xl">ॐ</span>
              <span className="ml-2 text-sm md:text-base font-medium">{t('about.sanatanDharma')}</span>
            </div>
            <h1 className={`${devanagari.className} text-3xl md:text-5xl font-extrabold tracking-tight text-orange-800`}>{t('about.sanatanDharma')}</h1>
            <p className="mt-4 text-orange-700 max-w-3xl mx-auto">
              {t('about.sanatanDharma')} {t('about.loading')}
            </p>
          </div>
        </section>
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-600">{t('about.contentLoading')}</p>
          </div>
        </section>
      </div>
    );
  }

  // Render dynamic content from database
  return (
    <div className="min-h-screen bg-white">
      {sections
        .filter(section => section.isVisible)
        .sort((a, b) => a.order - b.order)
        .map((section) => {
          if (section.type === 'hero') {
            return (
              <section key={section.id} className="bg-gradient-to-b from-orange-50 to-white py-14 md:py-20">
                <div className="container mx-auto px-4">
                  <div className={`${getTextAlignClass(section.styling?.textAlign)}`}>
                    <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-orange-200 bg-white/70 text-orange-700 mb-4">
                      <span className="text-xl md:text-2xl">ॐ</span>
                      <span className="ml-2 text-sm md:text-base font-medium">{t('about.sanatanDharma')}</span>
                    </div>
                    <h1 className={`${devanagari.className} ${getFontSizeClass(section.styling?.fontSize)} ${getFontWeightClass(section.styling?.fontWeight)} tracking-tight ${getTextColorClass(section.styling?.color)}`}>
                      {section.title}
                    </h1>
                    <p className={`mt-4 ${getTextColorClass(section.styling?.color)} max-w-3xl mx-auto`}>
                      {section.content}
                    </p>
                  </div>
                </div>
              </section>
            );
          }

          if (section.type === 'quote') {
            return (
              <section key={section.id} className="py-8">
                <div className="container mx-auto px-4">
                  <figure className={`border-l-4 border-orange-300 pl-4 italic ${getTextColorClass(section.styling?.color)} bg-orange-50/50 py-3 rounded-r-md`}>
                    <blockquote className={`${getFontSizeClass(section.styling?.fontSize)} ${getFontWeightClass(section.styling?.fontWeight)}`}>
                      &quot;{section.content}&quot;
                    </blockquote>
                    {section.title && (
                      <figcaption className="mt-2 text-sm text-orange-700">
                        — {section.title}
                      </figcaption>
                    )}
                  </figure>
                </div>
              </section>
            );
          }

          if (section.type === 'card') {
            return (
              <section key={section.id} className="py-6">
                <div className="container mx-auto px-4">
                  <Card className="border-orange-100">
                    {section.title && (
                      <CardHeader>
                        <CardTitle className="text-orange-800">{section.title}</CardTitle>
                      </CardHeader>
                    )}
                    <CardContent className={`space-y-4 ${getTextColorClass(section.styling?.color)} leading-8`}>
                      <div className={`${getFontSizeClass(section.styling?.fontSize)} ${getFontWeightClass(section.styling?.fontWeight)} whitespace-pre-wrap`}>
                        {section.content}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>
            );
          }

          if (section.type === 'heading') {
            return (
              <section key={section.id} className="py-6">
                <div className="container mx-auto px-4">
                  <h2 className={`${getFontSizeClass(section.styling?.fontSize)} ${getFontWeightClass(section.styling?.fontWeight)} ${getTextColorClass(section.styling?.color)} ${getTextAlignClass(section.styling?.textAlign)}`}>
                    {section.title || section.content}
                  </h2>
                </div>
              </section>
            );
          }

          // Default paragraph
          return (
            <section key={section.id} className="py-4">
              <div className="container mx-auto px-4">
                <div className={`${getFontSizeClass(section.styling?.fontSize)} ${getFontWeightClass(section.styling?.fontWeight)} ${getTextColorClass(section.styling?.color)} ${getTextAlignClass(section.styling?.textAlign)} leading-8 whitespace-pre-wrap`}>
                  {section.content}
                </div>
              </div>
            </section>
          );
        })}
    </div>
  );
}
