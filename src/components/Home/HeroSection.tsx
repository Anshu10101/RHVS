import Image from 'next/image';
import { Noto_Serif_Devanagari } from 'next/font/google';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-orange-50 to-white">
      {/* subtle ornamental aura */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(600px_300px_at_50%_-10%,rgba(253,186,116,0.22),transparent)]" />
      <div className="container mx-auto px-4 text-center relative">
        <h2 className="text-lg md:text-xl mb-2 text-orange-700">॥ जय श्री राम ॥</h2>
        
        <h1 className={`${devanagari.className} text-3xl md:text-6xl font-extrabold mb-4 text-orange-900 tracking-tight`}>
          राष्ट्रीय हिंदू वाहिनी संगठन
        </h1>

        {/* lotus divider */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-10 bg-orange-200" />
          <span className="text-2xl">🪷</span>
          <span className="h-px w-10 bg-orange-200" />
        </div>
        
        <p className="text-base md:text-lg text-orange-700/90 mb-10 max-w-3xl mx-auto">
          Dedicated to preserving, protecting and promoting Hindu dharma and culture
        </p>
        
        {/* Hero Image */}
        <div className="mx-auto my-10 flex justify-center">
          <span className="relative block h-[24rem] w-[24rem] md:h-[32rem] md:w-[32rem] rounded-full overflow-hidden ring-4 ring-orange-200 shadow-lg">
            <Image
              src="/hero-img.jpg"
              alt="Hero"
              fill
              sizes="(max-width: 768px) 24rem, 32rem"
              className="object-cover"
              priority
            />
          </span>
        </div>
        

        {/* mantra marquee */}
        <div className="relative overflow-hidden max-w-6xl mx-auto mt-4">
          <div className="whitespace-nowrap will-change-transform" style={{ animation: 'rhvs-marquee 18s linear infinite' }}>
            <span className="mx-6 inline-block text-orange-800">ॐ सर्वे भवन्तु सुखिनः</span>
            <span className="mx-6 inline-block text-orange-800">ॐ नमः शिवाय</span>
            <span className="mx-6 inline-block text-orange-800">ॐ जय जगदीश हरे</span>
            <span className="mx-6 inline-block text-orange-800">श्री राम जय राम जय जय राम</span>
            <span className="mx-6 inline-block text-orange-800">हरे कृष्ण हरे राम</span>
            <span className="mx-6 inline-block text-orange-800">ॐ गं गणपतये नमः</span>
            <span className="mx-6 inline-block text-orange-800">ॐ ऐं ह्रीं क्लीं चामुण्डायै नमः</span>
            {/* duplicate for seamless loop */}
            <span className="mx-6 inline-block text-orange-800">ॐ सर्वे भवन्तु सुखिनः</span>
            <span className="mx-6 inline-block text-orange-800">ॐ नमः शिवाय</span>
            <span className="mx-6 inline-block text-orange-800">ॐ जय जगदीश हरे</span>
            <span className="mx-6 inline-block text-orange-800">श्री राम जय राम जय जय राम</span>
            <span className="mx-6 inline-block text-orange-800">हरे कृष्ण हरे राम</span>
            <span className="mx-6 inline-block text-orange-800">ॐ गं गणपतये नमः</span>
            <span className="mx-6 inline-block text-orange-800">ॐ ऐं ह्रीं क्लीं चामुण्डायै नमः</span>
          </div>
        </div>
      </div>
    </section>
  );
}