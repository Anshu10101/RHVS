import React from 'react';
import { Flame, Heart, Users, Book, Landmark, Globe } from 'lucide-react';

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ValueCard({ icon, title, description }: ValueCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md border border-orange-100 hover:shadow-lg transition-shadow">
      <div className="text-orange-600 mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-orange-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default function CoreValuesSection() {
  const values = [
    {
      icon: <Flame size={32} />,
      title: "धर्म (Dharma)",
      description: "Upholding righteousness and moral duty as the foundation of our community activities"
    },
    {
      icon: <Heart size={32} />,
      title: "सेवा (Seva)",
      description: "Selfless service to humanity and dedication to the welfare of all beings"
    },
    {
      icon: <Users size={32} />,
      title: "एकता (Unity)",
      description: "Bringing together Hindus from all walks of life to strengthen our community bonds"
    },
    {
      icon: <Book size={32} />,
      title: "ज्ञान (Knowledge)",
      description: "Promoting understanding of our sacred texts and ancient wisdom"
    },
    {
      icon: <Landmark size={32} />,
      title: "संस्कृति (Culture)",
      description: "Preserving and celebrating our rich cultural heritage and traditions"
    },
    {
      icon: <Globe size={32} />,
      title: "विश्व शांति (Peace)",
      description: "Working towards universal harmony and wellbeing of all humanity"
    }
  ];

  return (
    <section className="py-16 bg-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="uppercase font-bold mb-2 text-orange-700">Our Core Values</h3>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-orange-800">Guided by Hindu principles</h2>
          <p className="max-w-2xl mx-auto text-gray-700">
            At Rashtriya Hindu Vahini Sangathan, we are committed to living and spreading the timeless values of Hindu dharma that promote harmony, peace, and spiritual growth.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <ValueCard key={index} {...value} />
          ))}
        </div>
      </div>
    </section>
  );
}
