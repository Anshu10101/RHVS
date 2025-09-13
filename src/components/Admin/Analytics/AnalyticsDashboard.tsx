"use client";

import { useAdmin } from '@/contexts/AdminContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  Calendar,
  ShoppingBag,
  MapPin,
  Activity,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react';

export function AnalyticsDashboard() {
  const { members, activityLogs, hasPermission } = useAdmin();

  // Mock analytics data
  const memberStats = {
    total: members.length,
    verified: members.filter(m => m.status === 'verified').length,
    pending: members.filter(m => m.status === 'pending').length,
    rejected: members.filter(m => m.status === 'rejected').length,
  };

  const districtStats = members.reduce((acc, member) => {
    acc[member.district] = (acc[member.district] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentStats = members.reduce((acc, member) => {
    acc[member.department] = (acc[member.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyGrowth = [
    { month: 'Jan', members: 45, events: 3, products: 12 },
    { month: 'Feb', members: 52, events: 5, products: 15 },
    { month: 'Mar', members: 48, events: 4, products: 18 },
    { month: 'Apr', members: 61, events: 6, products: 22 },
    { month: 'May', members: 58, events: 7, products: 25 },
    { month: 'Jun', members: 67, events: 8, products: 28 },
  ];

  const topDistricts = Object.entries(districtStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const topDepartments = Object.entries(departmentStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (!hasPermission('view_analytics')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your RHVS community</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{memberStats.total}</p>
              <p className="text-sm text-green-600">+12% from last month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified Members</p>
              <p className="text-2xl font-bold text-gray-900">{memberStats.verified}</p>
              <p className="text-sm text-green-600">+8% from last month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Districts</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(districtStats).length}</p>
              <p className="text-sm text-blue-600">+2 new districts</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Activities</p>
              <p className="text-2xl font-bold text-gray-900">{activityLogs.length}</p>
              <p className="text-sm text-orange-600">+15 this week</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Status Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(memberStats.verified / memberStats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{memberStats.verified}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(memberStats.pending / memberStats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{memberStats.pending}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Rejected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(memberStats.rejected / memberStats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{memberStats.rejected}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Districts */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Districts by Members</h3>
          <div className="space-y-3">
            {topDistricts.map(([district, count], index) => (
              <div key={district} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{district}</span>
                </div>
                <span className="text-sm text-gray-600">{count} members</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly Growth Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Growth</h3>
        <div className="h-64 flex items-end space-x-2">
          {monthlyGrowth.map((data, index) => (
            <div key={data.month} className="flex-1 flex flex-col items-center space-y-2">
              <div className="w-full flex flex-col space-y-1">
                <div 
                  className="bg-blue-500 rounded-t"
                  style={{ height: `${(data.members / 70) * 200}px` }}
                ></div>
                <div 
                  className="bg-green-500"
                  style={{ height: `${(data.events / 10) * 200}px` }}
                ></div>
                <div 
                  className="bg-orange-500 rounded-b"
                  style={{ height: `${(data.products / 30) * 200}px` }}
                ></div>
              </div>
              <span className="text-xs text-gray-600">{data.month}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Members</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Events</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-600">Products</span>
          </div>
        </div>
      </Card>

      {/* Department Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topDepartments.map(([department, count]) => (
            <div key={department} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-sm font-medium text-gray-900">{department}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{ width: `${(count / Math.max(...Object.values(departmentStats))) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activity Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity Summary</h3>
        <div className="space-y-3">
          {activityLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{log.details}</p>
                <p className="text-xs text-gray-500">{log.timestamp.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
