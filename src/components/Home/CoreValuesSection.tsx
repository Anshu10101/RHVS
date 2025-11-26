import React from 'react';
import { Flame, Heart, Users, Book, Landmark, Globe } from 'lucide-react';
import { Noto_Serif_Devanagari } from 'next/font/google';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

function ValueCard({ icon, title, description, index }: ValueCardProps) {
  return (
    <div 
      className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/0 group-hover:from-orange-50/50 group-hover:to-transparent rounded-2xl transition-all duration-300 pointer-events-none" />
      
      {/* Icon with elegant background */}
      <div className="relative mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200 transition-all duration-300">
          <div className="text-orange-600 group-hover:text-orange-700 transition-colors duration-300">
            {icon}
          </div>
        </div>
      </div>
      
      {/* Title */}
      <h3 className={`${devanagari.className} text-xl font-bold mb-3 text-gray-900 group-hover:text-orange-800 transition-colors duration-300`}>
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 leading-relaxed text-[15px] relative z-10">
        {description}
      </p>
      
      {/* Decorative line */}
      <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-orange-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

export default function CoreValuesSection() {
  const values = [
    {
      icon: <Flame size={28} strokeWidth={1.5} />,
      title: "धर्म (Dharma)",
      description: "Upholding righteousness and moral duty as the foundation of our community activities"
    },
    {
      icon: <Heart size={28} strokeWidth={1.5} />,
      title: "सेवा (Seva)",
      description: "Selfless service to humanity and dedication to the welfare of all beings"
    },
    {
      icon: <Users size={28} strokeWidth={1.5} />,
      title: "एकता (Unity)",
      description: "Bringing together Hindus from all walks of life to strengthen our community bonds"
    },
    {
      icon: <Book size={28} strokeWidth={1.5} />,
      title: "ज्ञान (Knowledge)",
      description: "Promoting understanding of our sacred texts and ancient wisdom"
    },
    {
      icon: <Landmark size={28} strokeWidth={1.5} />,
      title: "संस्कृति (Culture)",
      description: "Preserving and celebrating our rich cultural heritage and traditions"
    },
    {
      icon: <Globe size={28} strokeWidth={1.5} />,
      title: "विश्व शांति (Peace)",
      description: "Working towards universal harmony and wellbeing of all humanity"
    }
  ];

  return (
    <section className="py-20 sm:py-24 bg-gradient-to-b from-white via-orange-50/30 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-300" />
            <span className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-orange-600/80">
              Our Core Values
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-300" />
          </div>
          
          <h2 className={`${devanagari.className} text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-gray-900 leading-tight`}>
            Guided by Hindu principles
          </h2>
          
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            At Rashtriya Hindu Vahini Sangathan, we are committed to living and spreading the timeless values of Hindu dharma that promote harmony, peace, and spiritual growth.
          </p>
        </div>
        
        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {values.map((value, index) => (
            <ValueCard key={index} {...value} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
