"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Users, Building2, MapPin, Activity, Calendar, Image as ImageIcon, ShoppingBag, Phone } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? 'hidden' : prev || '';
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [open]);
  return (
    <header className="w-full py-1 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-md rounded-full px-6 py-1 shadow-lg border border-orange-100 w-full">
          <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3 md:gap-4 group">
            <span className="relative block h-12 w-12 md:h-14 md:w-14 rounded-full overflow-hidden ring-2 ring-orange-200">
              <Image
                src="/rhvs_logo.png"
                alt="RHVS Logo"
                fill
                sizes="(max-width: 768px) 3rem, 3.5rem"
                className="object-cover"
                priority
              />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base md:text-lg font-bold text-orange-800">
                राष्ट्रीय हिंदू वाहिनी संगठन
              </span>
              <span className="text-xs md:text-sm text-orange-700/80">
                Rashtriya Hindu Vahini Sangathan
              </span>
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden xl:flex items-center space-x-3">
            <Link href="/about" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <Users size={16} />
              <span>About</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/karya-samiti" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <Building2 size={16} />
              <span>Committee</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/offices" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <MapPin size={16} />
              <span>Offices</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/activities" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <Activity size={16} />
              <span>Activities</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/events" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <Calendar size={16} />
              <span>Events</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/gallery" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <ImageIcon size={16} />
              <span>Gallery</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/products" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <ShoppingBag size={16} />
              <span>Products</span>
            </Link>
            <div className="h-4 w-px bg-orange-200"></div>
            <Link href="/contact" className="flex items-center gap-2 hover:text-orange-600 transition-colors">
              <Phone size={16} />
              <span>Contact</span>
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link href="/members/register">
              <Button variant="default" className="hidden xl:inline-flex bg-orange-600 hover:bg-orange-700">
                JOIN NOW
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <button className="xl:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <span className="sr-only">Open menu</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-orange-700" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[9999] xl:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          {/* Full-screen sheet for maximum clarity */}
          <div className="absolute inset-0 bg-white flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100">
              <span className="text-base font-semibold text-orange-800">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 rounded-md hover:bg-orange-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <nav className="grow overflow-y-auto px-6 py-6 text-orange-900 text-[18px]">
              <ul className="space-y-2 divide-y divide-orange-100">
                <li className="py-2"><Link href="/" onClick={() => setOpen(false)} className="block">Home</Link></li>
                <li className="py-2"><Link href="/about" onClick={() => setOpen(false)} className="block">About</Link></li>
                <li className="py-2"><Link href="/karya-samiti" onClick={() => setOpen(false)} className="block">Committee</Link></li>
                <li className="py-2"><Link href="/offices" onClick={() => setOpen(false)} className="block">Offices</Link></li>
                <li className="py-2"><Link href="/activities" onClick={() => setOpen(false)} className="block">Our Activities</Link></li>
                <li className="py-2"><Link href="/events" onClick={() => setOpen(false)} className="block">Events</Link></li>
                <li className="py-2"><Link href="/gallery" onClick={() => setOpen(false)} className="block">Gallery</Link></li>
                <li className="py-2"><Link href="/products" onClick={() => setOpen(false)} className="block">Products</Link></li>
                <li className="py-2"><Link href="/contact" onClick={() => setOpen(false)} className="block">Contact</Link></li>
              </ul>
            </nav>
            <div className="px-6 pb-6">
              <Link href="/members/register" onClick={() => setOpen(false)}>
                <Button className="w-full bg-orange-600 hover:bg-orange-700">JOIN NOW</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}