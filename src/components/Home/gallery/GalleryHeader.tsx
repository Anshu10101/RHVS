import { Noto_Serif_Devanagari } from 'next/font/google';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

export default function GalleryHeader() {
  return (
    <section className="relative py-8 md:py-12 overflow-hidden bg-gradient-to-b from-orange-50/80 to-transparent backdrop-blur-sm">
      {/* Background decoration - more subtle */}
      <div className="absolute inset-0 [background:radial-gradient(400px_200px_at_50%_-5%,rgba(253,186,116,0.08),transparent)]" />
      
      <div className="container mx-auto px-4 text-center relative">
        <h2 className="text-sm md:text-base mb-1 text-orange-600/80">॥ गैलरी ॥</h2>
        
        <h1 className={`${devanagari.className} text-2xl md:text-4xl font-bold mb-2 text-orange-800/90 tracking-tight`}>
          हमारी यादें
        </h1>

        {/* Lotus divider - smaller */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="h-px w-6 bg-orange-200/60" />
          <span className="text-lg">🪷</span>
          <span className="h-px w-6 bg-orange-200/60" />
        </div>
        
        <p className="text-sm md:text-base text-orange-600/70 mb-6 max-w-2xl mx-auto">
          Moments of devotion, community, and cultural celebration
        </p>
      </div>
    </section>
  );
}
