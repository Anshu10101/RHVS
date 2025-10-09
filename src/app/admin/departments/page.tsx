"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Settings, UserPlus } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

export default function DepartmentsPage() {
  const router = useRouter();
  const { currentUser } = useAdmin();
  
  // Check if user is superadmin
  useEffect(() => {
    if (currentUser && currentUser.type !== 'superadmin') {
      router.push('/admin');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.type !== 'superadmin') {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Department Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create Department Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Create Department
              </CardTitle>
              <CardDescription>
                Create new departments at national, state, or district level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Add a new department with custom name in Hindi and English. You can create as many departments as needed.
              </p>
              <Button 
                className="w-full" 
                onClick={() => router.push('/admin/departments/create')}
              >
                Create Department
              </Button>
            </CardContent>
          </Card>

          {/* Manage Departments Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Manage Departments
              </CardTitle>
              <CardDescription>
                Edit, delete, and manage department posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Manage existing departments, create posts, re-order posts, and update department details.
              </p>
              <Button 
                className="w-full" 
                onClick={() => router.push('/admin/departments/manage')}
              >
                Manage Departments
              </Button>
            </CardContent>
          </Card>

          {/* Assign Members Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center">
                <UserPlus className="mr-2 h-5 w-5" />
                Assign Members
              </CardTitle>
              <CardDescription>
                Assign members to department posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Assign registered members to posts in departments at national, state, or district level.
              </p>
              <Button 
                className="w-full" 
                onClick={() => router.push('/admin/departments/assign')}
              >
                Assign Members
              </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
