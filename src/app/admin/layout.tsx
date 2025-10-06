"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/Admin';
import { AdminHeader } from '@/components/Admin';
import { AdminProvider } from '@/contexts/AdminContext';
import { useAdmin } from '@/contexts/AdminContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Unprotected admin routes (login/reset/etc.) should not use the protected scaffold
  const isPublicAdminRoute = pathname === '/admin/login' || pathname === '/admin/superadmin/login' || pathname === '/admin/unauthorized' || pathname?.startsWith('/admin/reset') || pathname?.startsWith('/admin/verify');

  if (isPublicAdminRoute) {
    return children as any;
  }

  return (
    <AdminProvider>
      <AdminScaffold sidebarOpen={sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} onCloseSidebar={() => setSidebarOpen(false)}>
        {children}
      </AdminScaffold>
    </AdminProvider>
  );
}

function AdminScaffold({ children, sidebarOpen, onOpenSidebar, onCloseSidebar }: { children: React.ReactNode; sidebarOpen: boolean; onOpenSidebar: () => void; onCloseSidebar: () => void; }) {
  const { currentUser, loading } = useAdmin();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Avoid hydration mismatch: render nothing until mounted
  if (!mounted) return null;

  // While checking session, render a stable shell
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    );
  }

  // If not authenticated, middleware will redirect; render nothing
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar isOpen={sidebarOpen} onClose={onCloseSidebar} />
      <div className="flex-1 flex flex-col">
        <AdminHeader onMenuClick={onOpenSidebar} />
        <main className="flex-1 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
