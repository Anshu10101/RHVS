"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Shield, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut,
  Building2,
  Calendar,
  Camera,
  Store,
  UserPlus,
  UserCheck,
  Activity,
  Globe,
  Building,
  Phone,
  Menu,
  Search,
  Award
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminProvider } from '@/contexts/AdminContext';
import Link from 'next/link';

function AdminDashboardContent() {
  const { currentUser, logout, hasPermission } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getToken, clearToken } = await import('@/lib/secure-storage');
        const token = getToken();
        if (!token) {
          router.push('/admin/login');
          setLoading(false);
          return;
        }
        
        const response = await fetch('/api/admin/me', { 
          cache: 'no-store', 
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          clearToken();
          router.push('/admin/login');
          return;
        }
        
        const data = await response.json();
        if (!data.authenticated || !data.user) {
          clearToken();
          router.push('/admin/login');
          return;
        }

        // If district admin, fetch their permissions
        if (data.user.type === 'district_admin') {
          const { getToken: getToken2 } = await import('@/lib/secure-storage');
          const token2 = getToken2();
          const permissionsResponse = await fetch('/api/admin/permissions/my', {
            cache: 'no-store',
            headers: token2 ? {
              'Authorization': `Bearer ${token2}`
            } : {}
          });
          
          if (permissionsResponse.ok) {
            const permissionsData = await permissionsResponse.json();
            setPermissions(permissionsData.permissions || []);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        const { clearToken } = await import('@/lib/secure-storage');
        clearToken();
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const isSuperAdmin = currentUser.type === 'superadmin';
  const isDistrictAdmin = currentUser.type === 'district_admin';

  // Helper function to check if user can access an item
  const canAccess = (item: { roles?: string[]; permission?: string }) => {
    if (isSuperAdmin) {
      return !item.roles || item.roles.includes('superadmin');
    }
    if (item.roles && item.roles.includes('superadmin')) {
      return false;
    }
    if (item.permission) {
      return hasPermission(item.permission);
    }
    return true;
  };

  // All sidebar sections with their items
  const sidebarSections = [
    {
      name: 'Members',
      icon: Users,
      href: '/admin/members',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      roles: ['superadmin', 'admin', 'verified_member', 'district_admin'],
      children: [
        {
          name: 'All Members',
          href: '/admin/members',
          icon: Users,
          permission: 'view_members',
        },
        {
          name: 'Add Member',
          href: '/admin/members/add',
          icon: UserPlus,
          permission: 'add_members',
        },
        {
          name: 'District Admins',
          href: '/admin/members/admins',
          icon: Shield,
          roles: ['superadmin'],
        },
        {
          name: 'Token Verification',
          href: '/admin/members/tokens',
          icon: Shield,
          permission: 'verify_tokens',
        },
      ],
    },
    {
      name: 'Permission Management',
      icon: Shield,
      href: '/admin/permissions',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      roles: ['superadmin'],
      children: [
        {
          name: 'Assign Permissions',
          href: '/admin/permissions/assign',
          icon: UserCheck,
          roles: ['superadmin'],
        },
        {
          name: 'Permission History',
          href: '/admin/permissions/history',
          icon: Activity,
          roles: ['superadmin'],
        },
      ],
    },
    {
      name: 'Content Management',
      icon: FileText,
      href: '/admin/content',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      roles: ['superadmin', 'admin', 'district_admin'],
      children: [
        {
          name: 'About Page',
          href: '/admin/content/about',
          icon: Globe,
          permission: 'edit_about',
        },
        {
          name: 'Hero Images',
          href: '/admin/content/hero-images',
          icon: Camera,
          permission: 'manage_hero_images',
        },
        {
          name: 'Photo Management',
          href: '/admin/photos',
          icon: Camera,
          permission: 'manage_gallery',
    },
    {
          name: 'Product Store',
          href: '/admin/content/store',
          icon: Store,
          permission: 'add_products',
        },
        {
          name: 'News & Events',
          href: '/admin/content/news-events',
      icon: Calendar,
          permission: 'edit_news_events',
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
          roles: ['superadmin'],
        },
        {
          name: 'Contact Info',
          href: '/admin/content/contact',
          icon: Phone,
          roles: ['superadmin'],
      },
      {
          name: 'Navigation',
          href: '/admin/content/navigation',
          icon: Menu,
          roles: ['superadmin'],
        },
        {
          name: 'SEO & Meta',
          href: '/admin/content/seo',
          icon: Search,
          roles: ['superadmin'],
        },
      ],
      },
      {
      name: 'Departments',
      icon: Building2,
      href: '/admin/departments',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      roles: ['superadmin'],
      children: [
        {
          name: 'Create Department',
          href: '/admin/departments/create',
          icon: UserPlus,
          roles: ['superadmin'],
        },
        {
          name: 'Manage Departments',
          href: '/admin/departments/manage',
          icon: Settings,
          roles: ['superadmin'],
        },
        {
          name: 'Assign Members',
          href: '/admin/departments/assign',
          icon: UserCheck,
          roles: ['superadmin'],
        },
      ],
    },
    {
      name: 'Certificates',
      icon: Award,
      href: '/admin/certificates',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      roles: ['superadmin'],
      },
      {
      name: 'Analytics',
        icon: BarChart3,
        href: '/admin/analytics',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      roles: ['superadmin', 'admin', 'district_admin'],
      permission: 'view_analytics',
    },
    {
      name: 'Activity Logs',
      icon: Activity,
      href: '/admin/logs',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      roles: ['superadmin'],
      permission: 'view_logs',
    },
    {
      name: 'Settings',
      icon: Settings,
      href: '/admin/settings',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600',
      roles: ['superadmin'],
      permission: 'manage_settings',
    },
  ];

  // Filter sections based on user role and permissions
  const visibleSections = sidebarSections.filter(section => {
    if (section.roles && !section.roles.some(role => {
      if (role === 'superadmin') return isSuperAdmin;
      if (role === 'district_admin') return isDistrictAdmin;
      return currentUser.role === role;
    })) {
      return false;
    }
    if (section.permission && !hasPermission(section.permission)) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 py-4 sm:py-5 md:py-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {isSuperAdmin ? 'Superadmin Dashboard' : 'District Admin Dashboard'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
                Welcome back, {currentUser.name}
                {isDistrictAdmin && ` (${currentUser.district} District)`}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                isSuperAdmin 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isSuperAdmin ? 'Superadmin' : 'District Admin'}
              </span>
              <Button onClick={logout} variant="outline" size="sm" className="text-xs sm:text-sm">
                <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            {isSuperAdmin ? 'System Management' : 'District Management'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {isSuperAdmin 
              ? 'Access all administrative features and system controls'
              : `Manage your district with the permissions granted to you`
            }
          </p>
        </div>

        {/* All Sidebar Sections */}
        <div className="space-y-6 sm:space-y-8 md:space-y-10">
          {visibleSections.map((section, sectionIndex) => {
            const hasChildren = section.children && section.children.length > 0;
            const visibleChildren = hasChildren 
              ? section.children.filter(child => canAccess(child))
              : [];

            // If section has children but none are visible, skip the section
            if (hasChildren && visibleChildren.length === 0) {
              return null;
            }

            return (
              <div key={sectionIndex} className="space-y-3 sm:space-y-4">
                {/* Section Header */}
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${section.bgColor}`}>
                      <section.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${section.iconColor}`} />
                      </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{section.name}</h3>
                      </div>
                    </div>
                  {!hasChildren && (
                    <Link href={section.href} className="flex-shrink-0">
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 text-xs sm:text-sm">
                        <span className="hidden sm:inline">Open →</span>
                        <span className="sm:hidden">→</span>
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Section Content */}
                {hasChildren ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                    {visibleChildren.map((child, childIndex) => (
                      <Link key={childIndex} href={child.href} className="min-h-[60px] sm:min-h-[64px]">
                        <Card className="group hover:shadow-md active:shadow-sm transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-0.5 active:translate-y-0 h-full">
                          <CardContent className="p-3 sm:p-3.5">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <div className={`p-2 rounded-lg ${section.bgColor} group-hover:scale-105 transition-transform duration-300 flex-shrink-0`}>
                                <child.icon className={`h-4 w-4 ${section.iconColor}`} />
                              </div>
                              <h4 className="font-medium text-gray-900 text-sm group-hover:text-gray-700 transition-colors leading-tight line-clamp-2">
                                {child.name}
                              </h4>
                            </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
                  <Link href={section.href} className="block">
                    <Card className="group hover:shadow-lg active:shadow-md transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-1 active:translate-y-0">
                      <CardContent className="p-4 sm:p-5 md:p-6">
                        <div className="flex items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                            <div className={`p-2.5 sm:p-3 rounded-xl ${section.bgColor} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                              <section.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${section.iconColor}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1 truncate">
                                {section.name}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">
                                Click to access {section.name.toLowerCase()}
                              </p>
                            </div>
                          </div>
                          <div className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 text-lg sm:text-xl">
                            →
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {visibleSections.length === 0 && (
          <div className="text-center py-8 sm:py-12 md:py-16 bg-white rounded-xl border border-gray-200 px-4 sm:px-6">
            <div className="inline-flex p-3 sm:p-4 rounded-full bg-gray-100 mb-3 sm:mb-4">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Permissions Assigned</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
              You don&apos;t have any active permissions assigned. Please contact your superadmin to get access to district management features.
            </p>
            <div className="text-xs sm:text-sm text-gray-500">
              <p>Current permissions: {permissions.length > 0 ? permissions.join(', ') : 'None'}</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 sm:mt-10 md:mt-12">
          <div className="mb-4 sm:mb-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Quick Overview</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Key metrics at a glance</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            <Card className="border border-gray-200 hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total Members</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-green-50 flex-shrink-0">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate">
                      {isSuperAdmin ? 'Total Districts' : 'Your District'}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {isDistrictAdmin ? currentUser.district : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:shadow-md transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-purple-50 flex-shrink-0">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Activity</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminProvider>
      <AdminDashboardContent />
    </AdminProvider>
  );
}
