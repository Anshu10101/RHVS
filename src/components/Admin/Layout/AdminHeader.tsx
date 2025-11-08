"use client";

import { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import {
  Menu,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { ProfileModal } from '@/components/Admin/Profile/ProfileModal';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { currentUser, logout } = useAdmin();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
          {/* User avatar */}
          {currentUser && (
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                  {currentUser.email?.[0]?.toUpperCase() || 'A'}
                </div>
              )}
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">{currentUser.email}</div>
                <div className="text-xs text-gray-500">{currentUser.role?.toUpperCase()}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
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
