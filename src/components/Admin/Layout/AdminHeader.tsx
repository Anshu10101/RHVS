"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import {
  Menu,
  User,
  LogOut,
  ChevronDown,
  BookOpen,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { ProfileModal } from '@/components/Admin/Profile/ProfileModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { currentUser, logout } = useAdmin();
  const { t } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingInbox, setLoadingInbox] = useState(false);

  // Handle hover for dropdown - keep menu open when hovering over trigger or menu
  const handleMouseEnter = () => {
    // Clear any pending close timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowUserMenu(true);
  };

  const handleMouseLeave = () => {
    // Add a small delay before closing to allow mouse to move to dropdown menu
    timeoutRef.current = setTimeout(() => {
      setShowUserMenu(false);
    }, 150);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const loadInboxSummary = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoadingInbox(true);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('admin_token')
          : null;
      const res = await fetch('/api/admin/contact/messages?summary=1', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data?.success && data.data) {
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load inbox summary', err);
    } finally {
      setLoadingInbox(false);
    }
  }, [currentUser]);

  // Initial load + refresh when user changes
  useEffect(() => {
    void loadInboxSummary();
  }, [loadInboxSummary]);

  // Poll in background to approximate real-time updates on dashboard/admin pages
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      void loadInboxSummary();
    }, 15000); // 15s

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadInboxSummary();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser, loadInboxSummary]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Help Guide Link */}
          <Link href="/admin/help">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-gray-900"
              title={t('admin.sidebar.helpGuide')}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden md:inline">{t('admin.sidebar.help')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
              title={t('admin.sidebar.helpGuide')}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </Link>

          {/* Inbox icon */}
          {currentUser && (
            <Link href="/admin/contact/inbox">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-600 hover:text-gray-900"
                title={t('admin.contact.inbox.title')}
              >
                <Mail className={`h-5 w-5 ${loadingInbox ? 'animate-pulse' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {/* User avatar */}
          {currentUser && (
          <div 
            className="relative" 
            ref={menuRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                  {(currentUser.name?.[0] || currentUser.email?.[0] || 'A').toUpperCase()}
                </div>
              )}
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {currentUser.name || currentUser.email || 'Admin'}
                </div>
                <div className="text-xs text-gray-500">
                  {currentUser.type === 'district_admin' ? 'DISTRICT ADMIN' : currentUser.type === 'news_editor' ? 'NEWS EDITOR' : currentUser.role?.toUpperCase() || 'ADMIN'}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>

            {/* User dropdown */}
            {showUserMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={logout}
                    className="flex w-full items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Temporary access banner */}
      {currentUser?.temporaryPermissions && currentUser.temporaryPermissions.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full" />
              <p className="text-sm text-blue-800">
                You have temporary permissions: {currentUser.temporaryPermissions.map(tp => tp.permission).join(', ')}
              </p>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-800">
              View details
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal open={showProfileModal} onOpenChange={setShowProfileModal} />
    </header>
  );
}
