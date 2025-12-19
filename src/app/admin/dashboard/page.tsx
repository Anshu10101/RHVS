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
  Phone,
  Award,
  ScrollText,
  KeyRound,
  Inbox,
  BookOpen
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

function AdminDashboardContent() {
  const { t } = useLanguage();
  const { currentUser, logout, hasPermission } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalDistricts: 0,
    activity: 0,
    recentMembers: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
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
        
        const response = await fetch(`/api/admin/me?_t=${Date.now()}`, { 
          method: 'GET',
          cache: 'no-store', 
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          credentials: 'omit' // Don't send cookies - only use Authorization header
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

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;
      
      try {
        const { getToken } = await import('@/lib/secure-storage');
        const token = getToken();
        if (!token) return;

        // Fetch member stats
        const membersResponse = await fetch(`/api/admin/members/stats?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });

        // Fetch analytics (for districts and activity)
        const analyticsResponse = await fetch(`/api/admin/analytics?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });

        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          if (membersData.success && membersData.data) {
            setStats(prev => ({
              ...prev,
              totalMembers: membersData.data.total || 0,
            }));
          }
        }

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          if (analyticsData.success && analyticsData.data) {
            setStats(prev => ({
              ...prev,
              totalDistricts: analyticsData.data.overview?.activeDistricts || 0,
              activity: analyticsData.data.overview?.totalActivities || 0,
              recentMembers: analyticsData.data.overview?.recentMembers || 0,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (currentUser && !loading) {
      fetchStats();
    }
  }, [currentUser, loading]);

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
  const isNewsEditor = currentUser.type === 'news_editor' || currentUser.role === 'news_editor' || currentUser.role === 'news_reporter';

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
      name: t('admin.dashboard.sections.members'),
      icon: Users,
      href: '/admin/members',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      roles: ['superadmin', 'admin', 'verified_member', 'district_admin'],
      children: [
        {
          name: t('admin.dashboard.items.allMembers'),
          href: '/admin/members',
          icon: Users,
          permission: 'view_members',
        },
        {
          name: t('admin.dashboard.items.addMember'),
          href: '/admin/members/add',
          icon: UserPlus,
          permission: 'add_members',
        },
        {
          name: t('admin.dashboard.items.districtAdmins'),
          href: '/admin/members/admins',
          icon: Shield,
          roles: ['superadmin'],
        },
        {
          name: t('admin.dashboard.items.newsEditors'),
          href: '/admin/members/news-editors',
          icon: FileText,
          roles: ['superadmin'],
        },
        {
          name: t('admin.dashboard.items.tokenVerification'),
          href: '/admin/members/tokens',
          icon: Shield,
          permission: 'verify_tokens',
        },
        {
          name: t('admin.dashboard.items.otpManagement'),
          href: '/admin/members/otp-settings',
          icon: KeyRound,
          roles: ['superadmin'],
        },
      ],
    },
    {
      name: t('admin.dashboard.sections.permissionManagement'),
      icon: Shield,
      href: '/admin/permissions',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      roles: ['superadmin'],
      children: [
        {
          name: t('admin.dashboard.items.assignPermissions'),
          href: '/admin/permissions/assign',
          icon: UserCheck,
          roles: ['superadmin'],
        },
        {
          name: t('admin.dashboard.items.permissionHistory'),
          href: '/admin/permissions/history',
          icon: Activity,
          roles: ['superadmin'],
        },
      ],
    },
    {
      name: t('admin.dashboard.sections.contentManagement'),
      icon: FileText,
      href: '/admin/content',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      roles: ['superadmin', 'admin', 'district_admin'],
      children: [
        {
          name: t('admin.dashboard.items.aboutPage'),
          href: '/admin/content/about',
          icon: Globe,
          permission: 'edit_about',
        },
        {
          name: t('admin.dashboard.items.heroImages'),
          href: '/admin/content/hero-images',
          icon: Camera,
          permission: 'manage_hero_images',
        },
        {
          name: t('admin.sidebar.marqueeManagement'),
          href: '/admin/content/marquee',
          icon: ScrollText,
          permission: 'manage_marquee',
        },
        {
          name: t('admin.dashboard.items.photoManagement'),
          href: '/admin/photos',
          icon: Camera,
          permission: 'manage_gallery',
    },
    {
          name: t('admin.dashboard.items.productStore'),
          href: '/admin/content/store',
          icon: Store,
          permission: 'add_products',
        },
        {
          name: t('admin.dashboard.items.newsEvents'),
          href: '/admin/content/news-events',
      icon: Calendar,
          permission: 'edit_news_events',
        },
        {
          name: t('admin.dashboard.items.contactInfo'),
          href: '/admin/content/contact',
          icon: Phone,
          roles: ['superadmin'],
        },
      ],
      },
      {
      name: t('admin.dashboard.sections.departments'),
      icon: Building2,
      href: '/admin/departments',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      roles: ['superadmin'],
      children: [
        {
          name: t('admin.dashboard.items.createDepartment'),
          href: '/admin/departments/create',
          icon: UserPlus,
          roles: ['superadmin'],
        },
        {
          name: t('admin.dashboard.items.manageDepartments'),
          href: '/admin/departments/manage',
          icon: Settings,
          roles: ['superadmin'],
        },
        {
          name: t('admin.dashboard.items.assignMembers'),
          href: '/admin/departments/assign',
          icon: UserCheck,
          roles: ['superadmin'],
        },
      ],
    },
    {
      name: t('admin.dashboard.sections.certificates'),
      icon: Award,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      roles: ['superadmin'],
      children: [
        {
          name: t('admin.dashboard.items.addSign'),
          href: '/admin/certificates/signs',
          icon: FileText,
          roles: ['superadmin'],
        },
      ],
    },
    {
      name: t('admin.dashboard.sections.contactInbox'),
      icon: Inbox,
      href: '/admin/contact/inbox',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      roles: ['superadmin', 'district_admin'],
    },
    {
      name: t('admin.dashboard.sections.analytics'),
        icon: BarChart3,
        href: '/admin/analytics',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      roles: ['superadmin', 'admin', 'district_admin'],
      permission: 'view_analytics',
    },
    {
      name: t('admin.dashboard.sections.activityLogs'),
      icon: Activity,
      href: '/admin/logs',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      roles: ['superadmin'],
      permission: 'view_logs',
    },
    {
      name: t('admin.dashboard.sections.settings'),
      icon: Settings,
      href: '/admin/settings',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600',
      roles: ['superadmin'],
      permission: 'manage_settings',
    },
    {
      name: t('admin.dashboard.sections.helpGuide'),
      icon: BookOpen,
      href: '/admin/help',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      roles: ['superadmin', 'admin', 'district_admin', 'news_editor'],
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
                {isSuperAdmin 
                  ? t('admin.dashboard.superadmin') 
                  : isNewsEditor 
                    ? 'समाचार संपादक डैशबोर्ड'
                    : t('admin.dashboard.districtAdmin')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
                {t('admin.dashboard.welcomeBack')}, {currentUser.name}
                {isDistrictAdmin && ` (${currentUser.district} ${t('admin.dashboard.district')})`}
                {isNewsEditor && ' - संगठन के समाचार संपादक'}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                isSuperAdmin 
                  ? 'bg-red-100 text-red-800' 
                  : isNewsEditor
                    ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isSuperAdmin 
                  ? t('admin.dashboard.superadminLabel') 
                  : isNewsEditor
                    ? 'समाचार संपादक'
                    : t('admin.dashboard.districtAdminLabel')}
              </span>
              <Button onClick={logout} variant="outline" size="sm" className="text-xs sm:text-sm">
                <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('admin.dashboard.logout')}</span>
                <span className="sm:hidden">{t('admin.dashboard.logoutShort')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            {isSuperAdmin 
              ? t('admin.dashboard.systemManagement') 
              : isNewsEditor
                ? 'समाचार और कार्यक्रम प्रबंधन'
                : t('admin.dashboard.districtManagement')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {isSuperAdmin 
              ? t('admin.dashboard.systemManagementDesc')
              : isNewsEditor
                ? 'समाचार और कार्यक्रम बनाएं, संपादित करें और प्रबंधित करें'
              : t('admin.dashboard.districtManagementDesc')
            }
          </p>
        </div>

        {/* All Sidebar Sections */}
        <div className="space-y-6 sm:space-y-8 md:space-y-10">
          {/* Separate single-item and multi-item sections */}
          {(() => {
            const singleItems: Array<{
              href: string;
              name: string;
              icon: typeof Users;
              bgColor: string;
              iconColor: string;
            }> = [];
            const multiItemSections: typeof visibleSections = [];

            visibleSections.forEach((section) => {
              const hasChildren = section.children && section.children.length > 0;
              const visibleChildren = hasChildren 
                ? section.children.filter(child => canAccess(child))
                : [];

              // If section has children but none are visible, skip the section
              if (hasChildren && visibleChildren.length === 0) {
                return;
              }

              // Check if this is a single-item section (1 child or no children with href)
              const isSingleItem = (hasChildren && visibleChildren.length === 1) || (!hasChildren && section.href);
              
              if (isSingleItem) {
                const targetHref = hasChildren && visibleChildren.length === 1 
                  ? visibleChildren[0].href 
                  : section.href;
                const targetName = hasChildren && visibleChildren.length === 1 
                  ? visibleChildren[0].name 
                  : section.name;
                const TargetIcon = hasChildren && visibleChildren.length === 1 
                  ? visibleChildren[0].icon 
                  : section.icon;

                singleItems.push({
                  href: targetHref!,
                  name: targetName,
                  icon: TargetIcon,
                  bgColor: section.bgColor,
                  iconColor: section.iconColor,
                });
              } else {
                multiItemSections.push(section);
              }
            });

            return (
              <>
                {/* Multi-item sections with headers - rendered first */}
                {multiItemSections.map((section, sectionIndex) => {
                  const hasChildren = section.children && section.children.length > 0;
                  const visibleChildren = hasChildren 
                    ? section.children.filter(child => canAccess(child))
                    : [];

                  return (
                    <div key={sectionIndex} className="space-y-3 sm:space-y-4">
                      {/* Section Header */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${section.bgColor}`}>
                          <section.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${section.iconColor}`} />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{section.name}</h3>
                      </div>

                      {/* Section Content - Grid for multiple items */}
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
                    </div>
                  );
                })}

                {/* Single-item sections in a compact grid - rendered at bottom */}
                {singleItems.length > 0 && (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Section Header */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-2 sm:p-2.5 rounded-lg flex-shrink-0 bg-gray-50">
                        <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('admin.dashboard.sections.quickAccess')}</h3>
                    </div>
                    
                    {/* Single-item grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                    {singleItems.map((item, index) => {
                      const ItemIcon = item.icon;
                      return (
                        <Link key={index} href={item.href} className="min-h-[60px] sm:min-h-[64px]">
                          <Card className="group hover:shadow-md active:shadow-sm transition-all duration-300 cursor-pointer border border-gray-200 hover:border-gray-300 hover:-translate-y-0.5 active:translate-y-0 h-full">
                            <CardContent className="p-3 sm:p-3.5">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-2 rounded-lg ${item.bgColor} group-hover:scale-105 transition-transform duration-300 flex-shrink-0`}>
                                  <ItemIcon className={`h-4 w-4 ${item.iconColor}`} />
                                </div>
                                <h4 className="font-medium text-gray-900 text-sm group-hover:text-gray-700 transition-colors leading-tight line-clamp-2 flex-1 min-w-0">
                                  {item.name}
                                </h4>
                                <div className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 text-base">
                                  →
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {visibleSections.length === 0 && (
          <div className="text-center py-8 sm:py-12 md:py-16 bg-white rounded-xl border border-gray-200 px-4 sm:px-6">
            <div className="inline-flex p-3 sm:p-4 rounded-full bg-gray-100 mb-3 sm:mb-4">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('admin.dashboard.noPermissions')}</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
              {t('admin.dashboard.noPermissionsDesc')}
            </p>
            <div className="text-xs sm:text-sm text-gray-500">
              <p>{t('admin.dashboard.currentPermissions')} {permissions.length > 0 ? permissions.join(', ') : t('admin.dashboard.none')}</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 sm:mt-10 md:mt-12">
          <div className="mb-4 sm:mb-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('admin.dashboard.quickOverview')}</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('admin.dashboard.keyMetrics')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            <Card className="border border-gray-200 hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-center">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 flex-shrink-0">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">{t('admin.dashboard.totalMembers')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {statsLoading ? (
                        <span className="text-gray-400">{t('admin.dashboard.loading')}</span>
                      ) : (
                        stats.totalMembers.toLocaleString()
                      )}
                    </p>
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
                      {isSuperAdmin 
                        ? t('admin.dashboard.totalDistricts') 
                        : isNewsEditor
                          ? 'समाचार संपादक'
                          : t('admin.dashboard.yourDistrict')}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {isDistrictAdmin ? (
                        currentUser.district || '-'
                      ) : isNewsEditor ? (
                        '-'
                      ) : statsLoading ? (
                        <span className="text-gray-400">{t('admin.dashboard.loading')}</span>
                      ) : (
                        stats.totalDistricts.toLocaleString()
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Activity / Recent Members - show different metric based on role */}
            {isSuperAdmin ? (
              <Card className="border border-gray-200 hover:shadow-md transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-center">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-purple-50 flex-shrink-0">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                        {t('admin.dashboard.activity')}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {statsLoading ? (
                          <span className="text-gray-400">{t('admin.dashboard.loading')}</span>
                        ) : (
                          stats.activity.toLocaleString()
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : isDistrictAdmin ? (
              <Card className="border border-gray-200 hover:shadow-md transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-center">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-purple-50 flex-shrink-0">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                        {t('admin.dashboard.recentMembers')}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {statsLoading ? (
                          <span className="text-gray-400">{t('admin.dashboard.loading')}</span>
                        ) : (
                          stats.recentMembers.toLocaleString()
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
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
