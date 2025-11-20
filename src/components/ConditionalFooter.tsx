"use client";

import { usePathname } from "next/navigation";

export default function ConditionalFooter() {
  const pathname = usePathname();
  // Hide on admin routes and on the home (landing) page which uses the full footer
  if (pathname === "/" || pathname?.startsWith("/admin")) {
    return null;
  }
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gradient-to-b from-orange-50/30 to-orange-100/20 text-center py-4 md:py-5 border-t border-orange-200/50">
      <p className="text-orange-700/70 text-xs md:text-sm leading-tight">
        &copy; {year} Rashtriya Hindu Vahini Sangathan. All Rights Reserved.
      </p>
      <p className="text-orange-600 mt-1 md:mt-1.5 text-xs md:text-sm font-semibold">॥ धर्मो रक्षति रक्षितः ॥</p>
    </footer>
  );
}


