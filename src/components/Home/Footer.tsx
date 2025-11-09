"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Code2, Sparkles, ExternalLink, FileText } from 'lucide-react';

export default function Footer() {
  const [showDeveloperMenu, setShowDeveloperMenu] = useState(false);
  const developerMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showDeveloperMenu) {
      return;
    }
    const handler = (event: MouseEvent | TouchEvent) => {
      if (developerMenuRef.current && !developerMenuRef.current.contains(event.target as Node)) {
        setShowDeveloperMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showDeveloperMenu]);

  return (
    <footer className="bg-gradient-to-b from-orange-50/30 to-orange-100/20 text-orange-900/80 py-16 border-t border-orange-200/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Organization Info */}
          <div className="col-span-1">
            <h3 className="text-xl font-semibold mb-4 text-orange-800/90">Rashtriya Hindu Vahini Sangathan</h3>
            <p className="text-orange-700/70 mb-6 leading-relaxed">
              Dedicated to preserving, protecting and promoting Hindu dharma and culture
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-orange-600/60 hover:text-orange-600 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-orange-600/60 hover:text-orange-600 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-orange-600/60 hover:text-orange-600 transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          {/* Useful Links */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold mb-4 text-orange-800/90">Useful Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  होम
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  गैलरी
                </Link>
              </li>
              <li>
                <Link href="/proposal" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  प्रस्तावना
                </Link>
              </li>
              <li>
                <Link href="/karya-samiti" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  कार्यसमिति
                </Link>
              </li>
              <li>
                <Link href="/offices" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  कार्यालय का गठन
                </Link>
              </li>
            </ul>
          </div>
          
          {/* RHVS */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold mb-4 text-orange-800/90">RHVS</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/duty" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  कर्तव्य
                </Link>
              </li>
              <li>
                <Link href="/roles" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  पद एवं कार्य
                </Link>
              </li>
              <li>
                <Link href="/activities" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  गतिविधि एवं सुचना
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  संगठन के उत्पाद
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-orange-700/70 hover:text-orange-600 transition-colors">
                  सम्पर्क
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-1">
            <h4 className="text-lg font-semibold mb-4 text-orange-800/90">Contact Us</h4>
            <div className="space-y-4">
              <p className="text-orange-700/70 text-sm leading-relaxed">
                केंद्रीय कार्यालय – D–305, &quot;कान्हा कुंज&quot;, इंदिरा पार्क, नजफगढ़, नई दिल्ली – 110043
              </p>
              <div className="flex items-start space-x-3">
                <Phone size={16} className="text-orange-600/60 mt-0.5 flex-shrink-0" />
                <span className="text-orange-700/70 text-sm">8081964556 &nbsp;&nbsp; 9415073269</span>
              </div>
              <div className="flex items-start space-x-3">
                <Mail size={16} className="text-orange-600/60 mt-0.5 flex-shrink-0" />
                <span className="text-orange-700/70 text-sm">help@rashtriyahinduvahinisangathan.org</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin size={16} className="text-orange-600/60 mt-1 flex-shrink-0" />
                <span className="text-orange-700/70 text-sm leading-relaxed">
                  मुख्य कार्यालय – 883, श्री वैदेही वल्लभ कुंज, बावन मंदिर, अयोध्या (उत्तर प्रदेश) - 224001<br/>
                  प्रधान कार्यालय – श्री रामेश्वरम धाम, गंगा सूरजपुर कॉलोनी, हरपुरकला, हरिद्वार (उत्तराखंड) - 249205
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-orange-200/50 mt-12 pt-8 text-center">
          <p className="text-orange-700/60 text-sm">
            &copy; {new Date().getFullYear()} Rashtriya Hindu Vahini Sangathan. All Rights Reserved.
          </p>
          <p className="text-orange-600 mt-2 text-sm font-medium">
            ॥ धर्मो रक्षति रक्षितः ॥
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/60 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                <Code2 className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm text-orange-900 font-semibold">
                Designed & Engineered by{' '}
                <span
                  ref={developerMenuRef}
                  className="relative inline-flex"
                  onMouseEnter={() => setShowDeveloperMenu(true)}
                  onMouseLeave={() => setShowDeveloperMenu(false)}
                >
                  <button
                    type="button"
                    className="underline decoration-orange-300/70 underline-offset-4 cursor-pointer focus:outline-none"
                    onClick={() => setShowDeveloperMenu((current) => !current)}
                    aria-haspopup="true"
                    aria-expanded={showDeveloperMenu}
                  >
                    Anshul Yadav
                  </button>
                  <div
                    className={`absolute left-1/2 top-full z-20 -translate-x-1/2 pt-2 ${
                      showDeveloperMenu ? 'block' : 'hidden'
                    }`}
                  >
                    <div className="rounded-xl border border-orange-200/60 bg-white/90 backdrop-blur-sm shadow-md p-2 w-48">
                      <a
                        href="https://anshulydv-portfolio.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-orange-900 hover:bg-orange-50"
                        onClick={() => setShowDeveloperMenu(false)}
                      >
                        <ExternalLink className="h-4 w-4 text-orange-600" />
                        <span>View Portfolio</span>
                      </a>
                      <a
                        href="https://drive.google.com/file/d/1k63R0OBhgFRWNO_OQndMvtEFx2BJLEth/view?usp=drive_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-orange-900 hover:bg-orange-50"
                        onClick={() => setShowDeveloperMenu(false)}
                      >
                        <FileText className="h-4 w-4 text-orange-600" />
                        <span>View Certificate</span>
                      </a>
                    </div>
                  </div>
                </span>
              </span>
              <span className="mx-1 text-orange-300">•</span>
              <span className="text-xs text-orange-700/80">Developer</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
