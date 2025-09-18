"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { cn } from '@/lib/utils';
import {
  Users,
  Settings,
  Image as ImageIcon,
  ShoppingBag,
  Calendar,
  Building2,
  BarChart3,
  FileText,
  Shield,
  LogOut,
  X,
  Menu,
  Bell,
  UserCheck,
  UserPlus,
  Activity,
  Database,
  Globe,
  Store,
  Camera,
  Calendar as CalendarIcon,
  Building,
  BarChart,
  FileText as FileTextIcon,
  Shield as ShieldIcon,
  LogOut as LogOutIcon,
  Phone,
  Search,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
    roles: ['superadmin', 'admin', 'verified_member'],
  },
  {
    name: 'Members',
    href: '/admin/members',
    icon: Users,
    roles: ['superadmin', 'admin', 'verified_member'],
    children: [
      {
        name: 'All Members',
        href: '/admin/members',
        icon: Users,
      },
      {
        name: 'Add Member',
        href: '/admin/members/add',
        icon: UserPlus,
      },
      {
        name: 'Token Verification',
        href: '/admin/members/tokens',
        icon: Shield,
      },
      {
        name: 'Pending Verification',
        href: '/admin/members/pending',
        icon: UserCheck,
      },
    ],
  },
  {
    name: 'Content Management',
    href: '/admin/content',
    icon: FileText,
    roles: ['superadmin', 'admin'],
    children: [
      {
        name: 'About Page',
        href: '/admin/content/about',
        icon: Globe,
        permission: 'edit_about',
      },
      {
        name: 'Gallery',
        href: '/admin/content/gallery',
        icon: Camera,
        permission: 'edit_gallery',
      },
      {
        name: 'Product Store',
        href: '/admin/content/store',
        icon: Store,
        permission: 'edit_store',
      },
      {
        name: 'News & Events',
        href: '/admin/content/news-events',
        icon: CalendarIcon,
        permission: 'edit_news_events',
      },
      {
        name: 'Departments',
        href: '/admin/content/departments',
        icon: Building2,
        permission: 'edit_departments',
      },
      {
        name: 'Offices',
        href: '/admin/content/offices',
        icon: Building,
        permission: 'edit_offices',
      },
      {
        name: 'Karya Samiti',
        href: '/admin/content/karya-samiti',
        icon: Users,
        permission: 'edit_karya_samiti',
      },
      {
        name: 'Contact Info',
        href: '/admin/content/contact',
        icon: Phone,
        permission: 'edit_contact',
      },
      {
        name: 'Navigation',
        href: '/admin/content/navigation',
        icon: Menu,
        permission: 'edit_navigation',
      },
      {
        name: 'SEO & Meta',
        href: '/admin/content/seo',
        icon: Search,
        permission: 'edit_seo',
      },
    ],
  },
  {
    name: 'Departments',
    href: '/admin/departments',
    icon: Building2,
    roles: ['superadmin', 'admin'],
    permission: 'manage_departments',
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    roles: ['superadmin', 'admin'],
    permission: 'view_analytics',
  },
  {
    name: 'Activity Logs',
    href: '/admin/logs',
    icon: Activity,
    roles: ['superadmin', 'admin'],
    permission: 'view_logs',
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['superadmin'],
    permission: 'manage_settings',
  },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { currentUser, hasPermission, logout } = useAdmin();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  if (!currentUser) {
    return null;
  }

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'verified_member':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredItems = navigationItems.filter(item => {
    if (!currentUser) return false;
    if (!item.roles.includes(currentUser.role)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    
    // Hide superadmin-only items for regular admins
    if (item.roles.includes('superadmin') && !isSuperAdmin) return false;
    
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex-shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Image src="/favicon.ico" alt="RHVS" width={32} height={32} className="rounded-lg" priority />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          {currentUser && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold text-sm">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser.email}
                  </p>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                      getRoleBadgeColor(currentUser.role)
                    )}
                  >
                    {currentUser.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItems.includes(item.name);

              return (
                <div key={item.name}>
                  <div
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors',
                      isActive
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                    onClick={() => {
                      if (hasChildren) {
                        toggleExpanded(item.name);
                      } else {
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                    {hasChildren && (
                      <Menu className="h-4 w-4" />
                    )}
                  </div>

                  {/* Children */}
                  {hasChildren && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children!.map((child) => {
                        const isChildActive = pathname === child.href;
                        const canAccess = !child.permission || hasPermission(child.permission);

                        if (!canAccess) return null;

                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={cn(
                              'flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors',
                              isChildActive
                                ? 'bg-orange-50 text-orange-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                            onClick={onClose}
                          >
                            <child.icon className="h-4 w-4" />
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="flex w-full items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
