"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-4 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        {/* Animated 404 */}
        <div className="relative mb-4">
          <div className="text-6xl md:text-8xl font-bold text-orange-200 select-none">
            404
          </div>
          <div className="absolute inset-0 text-6xl md:text-8xl font-bold text-orange-300 animate-pulse">
            404
          </div>
        </div>

        {/* Floating Om Symbol */}
        <div className="absolute top-16 left-8 text-4xl text-orange-200 animate-float">
          ॐ
        </div>
        <div className="absolute top-24 right-12 text-3xl text-orange-200 animate-float-delayed">
          ॐ
        </div>
        <div className="absolute bottom-20 left-16 text-3xl text-orange-200 animate-float-slow">
          ॐ
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-orange-800 mb-2 animate-fadeInUp">
            Page Not Found
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-orange-700 mb-2 animate-fadeInUp-delayed">
            पृष्ठ नहीं मिला
          </h2>
          <p className="text-base text-orange-600 mb-6 max-w-md mx-auto animate-fadeInUp-delayed-2">
            The page you're looking for seems to have vanished into the spiritual realm. 
            Let's guide you back to the right path.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6 animate-fadeInUp-delayed-3">
            <Link href="/">
              <Button 
                size="default" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="default"
              onClick={() => window.history.back()}
              className="border-orange-300 text-orange-700 hover:bg-orange-50 px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Search Suggestion */}
          <div className="mb-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-orange-100 animate-fadeInUp-delayed-4">
            <h3 className="text-lg font-semibold text-orange-800 mb-3">
              Looking for something specific?
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/products" className="flex-1">
                <Button variant="outline" size="sm" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
                  <Search className="w-3 h-3 mr-1" />
                  Products
                </Button>
              </Link>
              <Link href="/gallery" className="flex-1">
                <Button variant="outline" size="sm" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
                  <Search className="w-3 h-3 mr-1" />
                  Gallery
                </Button>
              </Link>
              <Link href="/about" className="flex-1">
                <Button variant="outline" size="sm" className="w-full border-orange-200 text-orange-700 hover:bg-orange-50">
                  <Search className="w-3 h-3 mr-1" />
                  About
                </Button>
              </Link>
            </div>
          </div>

          {/* Spiritual Quote */}
          <div className="p-4 bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl shadow-lg border border-orange-200 animate-fadeInUp-delayed-5">
            <blockquote className="text-sm italic text-orange-800 mb-1">
              "सभी मार्ग ईश्वर की ओर ले जाते हैं, भले ही वे अलग-अलग दिखाई दें।"
            </blockquote>
            <cite className="text-xs text-orange-600">
              - भगवद्गीता
            </cite>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-fadeInUp-delayed {
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }
        
        .animate-fadeInUp-delayed-2 {
          animation: fadeInUp 0.8s ease-out 0.4s both;
        }
        
        .animate-fadeInUp-delayed-3 {
          animation: fadeInUp 0.8s ease-out 0.6s both;
        }
        
        .animate-fadeInUp-delayed-4 {
          animation: fadeInUp 0.8s ease-out 0.8s both;
        }
        
        .animate-fadeInUp-delayed-5 {
          animation: fadeInUp 0.8s ease-out 1s both;
        }
      `}</style>
    </div>
  );
}
