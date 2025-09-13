"use client";

import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';

export function ActivityLogs() {
  const { activityLogs, hasPermission } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  if (!hasPermission('view_logs')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view activity logs.</p>
        </div>
      </div>
    );
  }

  const actions = Array.from(new Set(activityLogs.map(log => log.action)));
  const users = Array.from(new Set(activityLogs.map(log => log.userName)));

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    const matchesUser = selectedUser === 'all' || log.userName === selectedUser;
    
    return matchesSearch && matchesAction && matchesUser;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'member_added':
        return <User className="h-4 w-4 text-green-600" />;
      case 'member_updated':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'member_deleted':
        return <User className="h-4 w-4 text-red-600" />;
      case 'permission_granted':
        return <Activity className="h-4 w-4 text-purple-600" />;
      case 'permission_revoked':
        return <Activity className="h-4 w-4 text-orange-600" />;
      case 'content_updated':
        return <RefreshCw className="h-4 w-4 text-indigo-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'member_added':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'member_updated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member_deleted':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'permission_granted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'permission_revoked':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'content_updated':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">Track all administrative activities and changes</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="action">Action Type</Label>
            <Select
              value={selectedAction}
              onValueChange={setSelectedAction}
            >
              <option value="all">All Actions</option>
              {actions.map(action => (
                <option key={action} value={action}>{formatAction(action)}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <Label htmlFor="user">User</Label>
            <Select
              value={selectedUser}
              onValueChange={setSelectedUser}
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <Label htmlFor="dateRange">Date Range</Label>
            <Select
              value={dateRange}
              onValueChange={setDateRange}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Activity Logs */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Activity Logs ({filteredLogs.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                        <span className="text-sm text-gray-600">by {log.userName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{log.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-900">{log.details}</p>
                    {log.ipAddress && (
                      <p className="mt-1 text-xs text-gray-500">IP: {log.ipAddress}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {filteredLogs.length} of {activityLogs.length} activities
          </p>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
