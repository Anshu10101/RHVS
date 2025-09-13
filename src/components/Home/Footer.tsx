import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
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
                केंद्रीय कार्यालय – D–305, "कान्हा कुंज", इंदिरा पार्क, नजफगढ़, नई दिल्ली – 110043
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
        </div>
      </div>
    </footer>
  );
}
