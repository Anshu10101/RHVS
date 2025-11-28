"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Noto_Sans_Devanagari } from "next/font/google";
import { useLanguage } from "@/contexts/LanguageContext";

const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400","600","700"] });

export default function OfficesPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-orange-50 to-white py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-orange-200 bg-white/70 text-orange-700 mb-4">
            <span className="text-xl md:text-2xl">🛕</span>
            <span className={`${devanagari.className} ml-2 text-sm md:text-base font-medium`}>{t('offices.title')}</span>
          </div>
          <h1 className={`${devanagari.className} text-3xl md:text-5xl font-extrabold tracking-tight text-orange-800`}>{t('offices.subtitle')}</h1>
          <p className="mt-4 text-orange-700 max-w-3xl mx-auto">
            {t('offices.description')}
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 grid gap-8 md:gap-10">
          {/* Hindi description */}
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle className={`${devanagari.className} text-orange-800`}>{t('offices.importantPoints')}</CardTitle>
            </CardHeader>
            <CardContent className={`${devanagari.className} space-y-4 text-gray-800 leading-8`}>
              <p>कार्यालय, किसी संगठन की नीतियों, कामकाज, आय-व्यय, अधिकारों व कर्तव्यों तथा अन्य अभिलेखों के रख-रखाव का स्थान होता है।</p>
              <p>कार्यालय में संगठन का संचालन एक निश्चित योजना के आधार पर होता है और विभिन्न पदों की संरचना इस प्रकार की जाती है कि लक्ष्य स्पष्ट रूप से प्राप्त हों।</p>
              <p>किसी भी संगठन में कार्यालय का विशिष्ट स्थान है; संगठन से जुड़े समस्त कार्यों, कागज़ात और महत्वपूर्ण सूचनाओं का रिकॉर्ड यहीं सुरक्षित रहता है।</p>
              <div>
                <h4 className="font-semibold text-orange-800 mb-2">{t('offices.basicWork')}</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>सूचना इकट्ठा करना, रिकॉर्ड करना और व्यवस्थित करना</li>
                  <li>सूचना का विश्लेषण व प्रसंस्करण करना</li>
                  <li>सूचना को सुरक्षित रखना और समय पर उपलब्ध कराना</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-orange-800 mb-2">{t('offices.districtExample')}</h4>
                <p>यदि किसी जिले में कार्यालय खोला जाए तो निर्णय की जिम्मेदारी जिले के पदाधिकारियों की होगी और जिला अध्यक्ष निम्न प्रावधान सुनिश्चित करेगा:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>स्थान किराए पर हो तो लीज़ एग्रीमेंट अनिवार्य</li>
                  <li>होर्डिंग लगाने हेतु अनुमति</li>
                  <li>कार्यालय दायित्व हेतु दो-तीन अधिकारियों की नाम सूची</li>
                  <li>बिजली, पानी और साफ-सफाई का नियमित प्रबंधन</li>
                  <li>किराया एवं अन्य देयकों का समय पर भुगतान</li>
                  <li>संचालन केवल जिला अध्यक्ष या सर्वसम्मति से नियुक्त संचालक द्वारा</li>
                  <li>प्रत्येक माह नियत तिथि को बैठक का आयोजन</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* English summary */}
          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle className="text-orange-800">{t('offices.englishSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-800 leading-8">
              <p>Formation of an office is crucial for orderly operations, record-keeping, and role clarity.</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Maintain policies, accounts, records, rights and duties of staff</li>
                <li>Operate and manage under a clear plan with a defined post structure</li>
                <li>Keep records of issues, papers and important information</li>
                <li>Core functions: collect, record, organize, analyze, process, secure and provide information</li>
                <li>District offices: lease agreements if on rent, permissions for hoardings, officer list for accountability, utilities upkeep, timely payments, monthly meetings led by the District President</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
