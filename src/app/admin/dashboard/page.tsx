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
  Store
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminProvider } from '@/contexts/AdminContext';
import Link from 'next/link';

function AdminDashboardContent() {
  const { currentUser, logout } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/me', { 
          cache: 'no-store', 
          credentials: 'include' 
        });
        
        if (!response.ok) {
          router.push('/admin/login');
          return;
        }
        
        const data = await response.json();
        if (!data.authenticated || !data.user) {
          router.push('/admin/login');
          return;
        }

        // If district admin, fetch their permissions
        if (data.user.type === 'district_admin') {
          const permissionsResponse = await fetch('/api/admin/permissions/my', {
            cache: 'no-store',
            credentials: 'include'
          });
          
          if (permissionsResponse.ok) {
            const permissionsData = await permissionsResponse.json();
            setPermissions(permissionsData.permissions || []);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
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

  const superAdminFeatures = [
    {
      title: 'Members Management',
      description: 'Manage all members across all districts',
      icon: Users,
      href: '/admin/members',
      color: 'bg-blue-500'
    },
    {
      title: 'District Admins',
      description: 'Appoint and manage district-level admins',
      icon: Shield,
      href: '/admin/members/admins',
      color: 'bg-red-500'
    },
    {
      title: 'Content Management',
      description: 'Manage all website content and settings',
      icon: FileText,
      href: '/admin/content',
      color: 'bg-green-500'
    },
    {
      title: 'Analytics',
      description: 'View comprehensive system analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-purple-500'
    },
    {
      title: 'Activity Logs',
      description: 'Monitor all system activities',
      icon: Calendar,
      href: '/admin/logs',
      color: 'bg-orange-500'
    },
    {
      title: 'Settings',
      description: 'Configure system settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500'
    }
  ];

  const getDistrictAdminFeatures = () => {
    const allFeatures = [
      {
        title: 'District Members',
        description: `Manage members in ${currentUser.district} district`,
        icon: Users,
        href: '/admin/members',
        color: 'bg-blue-500',
        requiredPermissions: ['view_members', 'add_members', 'edit_members']
      },
      {
        title: 'Content Management',
        description: 'Manage district-specific content',
        icon: FileText,
        href: '/admin/content',
        color: 'bg-green-500',
        requiredPermissions: ['edit_about', 'edit_news_events']
      },
      {
        title: 'Photo Management',
        description: 'Manage photo events, galleries, and uploads',
        icon: Camera,
        href: '/admin/photos',
        color: 'bg-purple-500',
        requiredPermissions: ['manage_gallery', 'add_gallery']
      },
      {
        title: 'News & Events',
        description: 'Manage district news and events',
        icon: Calendar,
        href: '/admin/content/news-events',
        color: 'bg-orange-500',
        requiredPermissions: ['edit_news_events', 'add_news', 'add_events']
      },
      {
        title: 'Store',
        description: 'Manage district store products',
        icon: Store,
        href: '/admin/content/store',
        color: 'bg-yellow-500',
        requiredPermissions: ['edit_store', 'add_products', 'edit_products']
      },
      {
        title: 'Analytics',
        description: 'View district analytics',
        icon: BarChart3,
        href: '/admin/analytics',
        color: 'bg-indigo-500',
        requiredPermissions: ['view_analytics']
      }
    ];

    // Filter features based on permissions
    return allFeatures.filter(feature => 
      feature.requiredPermissions.some(permission => permissions.includes(permission))
    );
  };

  const features = isSuperAdmin ? superAdminFeatures : getDistrictAdminFeatures();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isSuperAdmin ? 'Superadmin Dashboard' : 'District Admin Dashboard'}
              </h1>
              <p className="text-gray-600">
                Welcome back, {currentUser.name}
                {isDistrictAdmin && ` (${currentUser.district} District)`}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isSuperAdmin 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isSuperAdmin ? 'Superadmin' : 'District Admin'}
              </span>
              <Button onClick={logout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isSuperAdmin ? 'System Management' : 'District Management'}
          </h2>
          <p className="text-gray-600">
            {isSuperAdmin 
              ? 'Access all administrative features and system controls'
              : `Manage your district with the permissions granted to you`
            }
          </p>
        </div>

        {features.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Link key={index} href={feature.href}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${feature.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Permissions Assigned</h3>
            <p className="text-gray-600 mb-4">
              You don&apos;t have any active permissions assigned. Please contact your superadmin to get access to district management features.
            </p>
            <div className="text-sm text-gray-500">
              <p>Current permissions: {permissions.length > 0 ? permissions.join(', ') : 'None'}</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {isSuperAdmin ? 'Total Districts' : 'Your District'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isDistrictAdmin ? currentUser.district : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Activity</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
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
