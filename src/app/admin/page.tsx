"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, ArrowRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminProvider } from '@/contexts/AdminContext';

function AdminLandingContent() {
  const { currentUser, logout } = useAdmin();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getToken } = await import('@/lib/secure-storage');
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        
        const response = await fetch('/api/admin/me', { 
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            // User is already logged in, redirect to dashboard
            router.push('/admin/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {currentUser.name}</h1>
            <p className="mt-2 text-gray-600">
              {currentUser.type === 'superadmin' ? 'Superadmin Dashboard' : 'District Admin Dashboard'}
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button onClick={() => router.push('/admin/dashboard')} className="bg-orange-600 hover:bg-orange-700">
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Portal</h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose your login type to access the administrative panel
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Superadmin Login */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">Superadmin</CardTitle>
              <CardDescription className="text-lg">
                Full administrative access to all features and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Manage all districts and members</li>
                <li>• Appoint district admins</li>
                <li>• Access all system settings</li>
                <li>• View activity logs and analytics</li>
                <li>• Full content management control</li>
              </ul>
              <Link href="/admin/superadmin/login" className="block">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  <Shield className="mr-2 h-4 w-4" />
                  Superadmin Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* District Admin Login */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-blue-600">District Admin</CardTitle>
              <CardDescription className="text-lg">
                Manage your assigned district with limited permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• View and manage district members</li>
                <li>• Edit district-specific content</li>
                <li>• Manage gallery and news</li>
                <li>• View district analytics</li>
                <li>• Permission-based access control</li>
              </ul>
              <Link href="/admin/login" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Users className="mr-2 h-4 w-4" />
                  District Admin Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link 
            href="/" 
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLandingPage() {
  return (
    <AdminProvider>
      <AdminLandingContent />
    </AdminProvider>
  );
}