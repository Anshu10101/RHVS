"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
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
  BarChart,
  FileText as FileTextIcon,
  Shield as ShieldIcon,
  LogOut as LogOutIcon,
  Phone,
  BookOpen,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { currentUser, hasPermission, logout } = useAdmin();
  const { t } = useLanguage();

  const navigationItems = [
    {
      name: t('admin.sidebar.dashboard'),
      nameKey: 'dashboard',
      href: '/admin/dashboard',
      icon: BarChart3,
      roles: ['superadmin', 'admin', 'verified_member'],
    },
    {
      name: t('admin.sidebar.members'),
      nameKey: 'members',
      href: '/admin/members',
      icon: Users,
      roles: ['superadmin', 'admin', 'verified_member', 'district_admin'],
      children: [
        {
          name: t('admin.sidebar.allMembers'),
          href: '/admin/members',
          icon: Users,
          permission: 'view_members',
        },
        {
          name: t('admin.sidebar.addMember'),
          href: '/admin/members/add',
          icon: UserPlus,
          permission: 'add_members',
        },
        {
          name: t('admin.sidebar.districtAdmins'),
          href: '/admin/members/admins',
          icon: Shield,
          roles: ['superadmin'],
        },
        {
          name: t('admin.sidebar.tokenVerification'),
          href: '/admin/members/tokens',
          icon: Shield,
          permission: 'verify_tokens', // District admins can verify tokens for their district
        },
      ],
    },
    {
      name: t('admin.sidebar.permissionManagement'),
      nameKey: 'permissionManagement',
      href: '/admin/permissions',
      icon: Shield,
      roles: ['superadmin'],
      children: [
        {
          name: t('admin.sidebar.assignPermissions'),
          href: '/admin/permissions/assign',
          icon: UserCheck,
          roles: ['superadmin'],
        },
        {
          name: t('admin.sidebar.permissionHistory'),
          href: '/admin/permissions/history',
          icon: Activity,
          roles: ['superadmin'],
        },
      ],
    },
    {
      name: t('admin.sidebar.contentManagement'),
      nameKey: 'contentManagement',
      href: '/admin/content',
      icon: FileText,
      roles: ['superadmin', 'admin', 'district_admin'],
      children: [
        {
          name: t('admin.sidebar.aboutPage'),
          href: '/admin/content/about',
          icon: Globe,
          permission: 'edit_about',
        },
        {
          name: t('admin.sidebar.heroImages'),
          href: '/admin/content/hero-images',
          icon: Camera,
          permission: 'manage_hero_images',
        },
        {
          name: t('admin.sidebar.photoManagement'),
          href: '/admin/photos',
          icon: Camera,
          permission: 'manage_gallery', // This matches the database permission name
        },
        {
          name: t('admin.sidebar.productStore'),
          href: '/admin/content/store',
          icon: Store,
          permission: 'add_products',
        },
        {
          name: t('admin.sidebar.newsEvents'),
          href: '/admin/content/news-events',
          icon: CalendarIcon,
          permission: 'edit_news_events',
        },
        {
          name: t('admin.sidebar.contactInfo'),
          href: '/admin/content/contact',
          icon: Phone,
          roles: ['superadmin'],
        },
      ],
    },
    {
      name: t('admin.sidebar.departments'),
      nameKey: 'departments',
      href: '/admin/departments',
      icon: Building2,
      roles: ['superadmin', 'district_admin'],
      children: [
        {
          name: t('admin.sidebar.createDepartment'),
          href: '/admin/departments/create',
          icon: UserPlus,
          roles: ['superadmin'],
        },
        {
          name: t('admin.sidebar.manageDepartments'),
          href: '/admin/departments/manage',
          icon: Settings,
          roles: ['superadmin'],
        },
        {
          name: t('admin.sidebar.assignMembers'),
          href: '/admin/departments/assign',
          icon: UserCheck,
          permission: 'assign_members_to_departments', // District admins need this permission, superadmins have it by default
        },
      ],
    },
    {
      name: t('admin.sidebar.certificates'),
      nameKey: 'certificates',
      href: '/admin/certificates',
      icon: FileText,
      roles: ['superadmin'],
      children: [
        {
          name: t('admin.sidebar.addSign'),
          href: '/admin/certificates/signs',
          icon: FileText,
          roles: ['superadmin'],
        },
      ],
    },
    {
      name: t('admin.sidebar.analytics'),
      nameKey: 'analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      roles: ['superadmin', 'admin', 'district_admin'],
      permission: 'view_analytics',
    },
    {
      name: t('admin.sidebar.activityLogs'),
      nameKey: 'activityLogs',
      href: '/admin/logs',
      icon: Activity,
      roles: ['superadmin'],
      permission: 'view_logs',
    },
    {
      name: t('admin.sidebar.settings'),
      nameKey: 'settings',
      href: '/admin/settings',
      icon: Settings,
      roles: ['superadmin'],
      permission: 'manage_settings',
    },
  ];
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  // Auto-expand Members and Departments sections for district admins (only once on mount)
  useEffect(() => {
    if (currentUser?.type === 'district_admin' && !hasAutoExpanded) {
      setExpandedItems(prev => {
        const newItems = [...prev];
        if (!newItems.includes('members')) {
          newItems.push('members');
        }
        if (!newItems.includes('departments')) {
          newItems.push('departments');
        }
        return newItems;
      });
      setHasAutoExpanded(true);
    }
  }, [currentUser, hasAutoExpanded]);

  if (!currentUser) {
    return null;
  }

  // const isSuperAdmin = currentUser?.role === 'superadmin';

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems(prev =>
      prev.includes(itemKey)
        ? prev.filter(item => item !== itemKey)
        : [...prev, itemKey]
    );
  };

  const getRoleBadgeColor = (user: { type?: string; role?: string }) => {
    if (user.type === 'superadmin') {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (user.type === 'district_admin') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (user.role === 'verified_member') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const filteredItems = navigationItems.filter(item => {
    if (!currentUser) return false;
    
    // Superadmins can see everything
    if (currentUser.type === 'superadmin') {
      return true;
    }
    
    // For district admins, check permissions and show member management
    if (currentUser.type === 'district_admin') {
      // Always show Members section for district admins
      if (item.nameKey === 'members') {
        return true;
      }
      
      // Always show Departments section for district admins (they can assign members)
      if (item.nameKey === 'departments') {
        return true;
      }
      
      // Check if user has any of the required permissions for this item
      const hasRequiredPermission = () => {
        if (item.permission) {
          return hasPermission(item.permission);
        }
        
        // For parent items, check if user has permission for any child
        if (item.children) {
          return item.children.some(child => {
            // For other sections, exclude superadmin-only children
            if (child.roles && child.roles.includes('superadmin')) return false;
            if (child.permission) {
              return hasPermission(child.permission);
            }
            return false;
          });
        }
        
        return false;
      };
      
      return hasRequiredPermission();
    }
    
    // For other user types, use role-based filtering
    return item.roles.includes(currentUser.role);
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
              <Image 
                src="/rhvs_logo.png" 
                alt="RHVS" 
                width={48} 
                height={48} 
                className="object-contain flex-shrink-0" 
                priority 
              />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{t('admin.sidebar.adminPanel')}</h1>
                <p className="text-xs text-gray-500">{t('admin.sidebar.dashboard')}</p>
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
                {currentUser.profilePhoto ? (
                  <img
                    src={currentUser.profilePhoto}
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold text-sm">
                      {(currentUser.name?.[0] || currentUser.email?.[0] || 'A').toUpperCase()}
                  </span>
                </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser.email}
                  </p>
                  {currentUser.district && (
                    <p className="text-xs text-blue-600 truncate">
                      {t('admin.sidebar.district')} {currentUser.district}
                    </p>
                  )}
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                      getRoleBadgeColor(currentUser)
                    )}
                  >
                    {currentUser.type === 'district_admin' ? 'DISTRICT ADMIN' : currentUser.role.replace('_', ' ').toUpperCase()}
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
              const itemKey = item.nameKey || item.name;
              const isExpanded = expandedItems.includes(itemKey);

              return (
                <div key={itemKey}>
                  {hasChildren ? (
                  <div
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors',
                      isActive
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                    onClick={() => {
                        toggleExpanded(itemKey);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                      <Menu className="h-4 w-4" />
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors',
                        isActive
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      )}
                      onClick={onClose}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                  </div>
                    </Link>
                  )}

                  {/* Children */}
                  {hasChildren && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children!.map((child) => {
                        const isChildActive = pathname === child.href;
                        let canAccess = false;

                        // For superadmin, check roles
                        if (currentUser?.type === 'superadmin') {
                          canAccess = !child.roles || child.roles.includes('superadmin');
                        }
                        // For district admin, check permissions and show relevant items
                        else if (currentUser?.type === 'district_admin') {
                          // Items with permissions - check permission first (this overrides roles)
                          if (child.permission) {
                            canAccess = hasPermission(child.permission);
                          }
                          // Superadmin-only items (only if no permission is specified)
                          else if (child.roles && child.roles.includes('superadmin')) {
                            canAccess = false;
                          }
                          // Token Verification is always available for district admins (they can verify their district's tokens)
                          else if (child.href === '/admin/members/tokens') {
                            canAccess = true;
                          }
                          // For Members section children, show them for district admins
                          else if (item.nameKey === 'members') {
                            canAccess = true; // Always show member management options for district admins
                          }
                          // Default permission check
                          else {
                            canAccess = true;
                          }
                        }
                        // For other user types
                        else {
                          canAccess = !child.permission || hasPermission(child.permission);
                        }

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
          <div className="px-4 py-4 border-t border-gray-200 space-y-2 mt-auto flex-shrink-0">
            {/* Help Guide Link */}
            <Link
              href="/admin/help"
              className="flex w-full items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              onClick={onClose}
            >
              <BookOpen className="h-5 w-5" />
              <span>{t('admin.sidebar.helpGuide')}</span>
            </Link>
            
            {/* Language Toggle */}
            <LanguageSwitcher variant="sidebar" />
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex w-full items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>{t('admin.sidebar.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
