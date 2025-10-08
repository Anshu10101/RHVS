"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Shield, Users } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don&apos;t have permission to access this resource
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              Unauthorized Access
            </CardTitle>
            <CardDescription className="text-center">
              Your account doesn&apos;t have the required permissions to view this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                If you believe this is an error, please contact your administrator.
              </p>
              
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
                
                <div className="flex space-x-2">
                  <Link href="/admin" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Button>
                  </Link>
                  
                  <Button
                    onClick={() => {
                      fetch('/api/admin/logout', { method: 'POST' });
                      router.push('/admin/login');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Switch Account
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
