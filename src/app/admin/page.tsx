"use client";

import { useAdmin } from '@/contexts/AdminContext';
import { Card } from '@/components/ui/card';
import {
  Users,
  UserPlus,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Activity,
  Building2,
  Image,
  FileText,
  Globe,
  Store,
  Camera,
  Calendar as CalendarIcon,
  BarChart3,
} from 'lucide-react';

export default function AdminDashboard() {
  const { currentUser, members, activityLogs, hasPermission } = useAdmin();

  const stats = [
    {
      name: 'Total Members',
      value: members.length,
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Pending Verification',
      value: members.filter(m => m.status === 'pending').length,
      change: '+3',
      changeType: 'neutral',
      icon: UserPlus,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: 'Active Districts',
      value: new Set(members.map(m => m.district)).size,
      change: '+1',
      changeType: 'positive',
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Recent Activities',
      value: activityLogs.length,
      change: '+8',
      changeType: 'positive',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const quickActions = [
    {
      name: 'Add New Member',
      description: 'Register a new member with OTP verification',
      href: '/admin/members/add',
      icon: UserPlus,
      color: 'bg-blue-500 hover:bg-blue-600',
      permission: 'add_member',
    },
    {
      name: 'Manage Gallery',
      description: 'Upload and organize gallery images',
      href: '/admin/content/gallery',
      icon: Camera,
      color: 'bg-green-500 hover:bg-green-600',
      permission: 'edit_gallery',
    },
    {
      name: 'Create Event',
      description: 'Add new events and announcements',
      href: '/admin/content/events',
      icon: CalendarIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      permission: 'edit_events',
    },
    {
      name: 'View Analytics',
      description: 'Check detailed analytics and reports',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'bg-orange-500 hover:bg-orange-600',
      permission: 'view_analytics',
    },
  ];

  const recentActivities = activityLogs.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-4 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {currentUser?.name}!
        </h1>
        <p className="text-orange-100">
          Here's what's happening with your RHVS community today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions
                .filter(action => !action.permission || hasPermission(action.permission))
                .map((action) => (
                  <a
                    key={action.name}
                    href={action.href}
                    className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{action.name}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </a>
                ))}
            </div>
          </Card>
        </div>

        {/* Recent Activities */}
        <div>
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a
                href="/admin/logs"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                View all activities →
              </a>
            </div>
          </Card>
        </div>
      </div>

      {/* Content Management Overview */}
      {hasPermission('edit_content') && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <a
              href="/admin/content/about"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <Globe className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">About Page</h3>
                <p className="text-sm text-gray-600">Edit organization info</p>
              </div>
            </a>
            <a
              href="/admin/content/gallery"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <Camera className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">Gallery</h3>
                <p className="text-sm text-gray-600">Manage images</p>
              </div>
            </a>
            <a
              href="/admin/content/store"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <Store className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900">Product Store</h3>
                <p className="text-sm text-gray-600">Manage products</p>
              </div>
            </a>
            <a
              href="/admin/content/events"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <CalendarIcon className="h-8 w-8 text-orange-600" />
              <div>
                <h3 className="font-medium text-gray-900">Events</h3>
                <p className="text-sm text-gray-600">Manage events</p>
              </div>
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
