import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Noto_Sans_Devanagari } from "next/font/google";
import { ContentService } from "@/lib/content";

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "About • सनातन धर्म | Rashtriya Hindu Vahini Sangathan",
  description:
    "सनातन धर्म के इतिहास, स्वरूप और मूल भावों का संक्षिप्त परिचय | About Sanatan Dharma by Rashtriya Hindu Vahini Sangathan",
};

export default async function AboutPage() {
  // Load about page sections from database
  const sections = await ContentService.getAboutSections();

  // If no sections found, show default content
  if (!sections || sections.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-b from-orange-50 to-white py-14 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-orange-200 bg-white/70 text-orange-700 mb-4">
              <span className="text-xl md:text-2xl">ॐ</span>
              <span className="ml-2 text-sm md:text-base font-medium">सनातन धर्म</span>
            </div>
            <h1 className={`${devanagari.className} text-3xl md:text-5xl font-extrabold tracking-tight text-orange-800`}>सनातन धर्म</h1>
            <p className="mt-4 text-orange-700 max-w-3xl mx-auto">
              सनातन धर्म शाश्वत है — जिसका न आदि है न अंत। यही सनातन परम्परा हिंदू
              धर्म का मूल स्वरूप है और भारतीय संस्कृति की आत्मा है।
            </p>
          </div>
        </section>
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-600">Content is being loaded...</p>
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

          if (section.type === 'hero') {
            return (
              <section key={section.id} className="bg-gradient-to-b from-orange-50 to-white py-14 md:py-20">
                <div className="container mx-auto px-4">
                  <div className={`${getTextAlignClass(section.styling?.textAlign)}`}>
                    <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-orange-200 bg-white/70 text-orange-700 mb-4">
                      <span className="text-xl md:text-2xl">ॐ</span>
                      <span className="ml-2 text-sm md:text-base font-medium">सनातन धर्म</span>
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
