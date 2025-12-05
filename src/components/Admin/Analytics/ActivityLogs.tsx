"use client";

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Loader2,
} from 'lucide-react';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

export function ActivityLogs() {
  const { hasPermission } = useAdmin();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch logs from API
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });

      if (selectedAction !== 'all') {
        params.append('action', selectedAction);
      }
      if (selectedUser !== 'all') {
        params.append('userId', selectedUser);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Calculate date range
      if (dateRange !== 'all') {
        const now = new Date();
        let dateFrom = '';
        if (dateRange === 'today') {
          dateFrom = now.toISOString().split('T')[0];
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFrom = weekAgo.toISOString().split('T')[0];
        } else if (dateRange === 'month') {
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          dateFrom = monthAgo.toISOString().split('T')[0];
        }
        if (dateFrom) {
          params.append('dateFrom', dateFrom);
        }
      }

      const response = await fetch(`/api/admin/logs?${params.toString()}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      const data = await response.json();
      if (data.success && data.logs) {
        setLogs(data.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        })));
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('view_logs')) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedAction, selectedUser, dateRange]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasPermission('view_logs')) {
        setCurrentPage(1);
        fetchLogs();
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  if (!hasPermission('view_logs')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don&apos;t have permission to view activity logs.</p>
        </div>
      </div>
    );
  }

  const actions = Array.from(new Set(logs.map(log => log.action)));
  const users = Array.from(new Set(logs.map(log => log.userName)));

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

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatDetails = (details: string): string => {
    if (!details) return '';
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(details);
      
      // Format member_added_direct
      if (parsed.action === 'member_added_direct' || details.includes('member_added_direct')) {
        const parts: string[] = [];
        if (parsed.memberName) parts.push(`Member: ${parsed.memberName}`);
        if (parsed.memberEmail) parts.push(`Email: ${parsed.memberEmail}`);
        if (parsed.memberRegNumber) parts.push(`Reg: ${parsed.memberRegNumber}`);
        if (parsed.verifiedBy) parts.push(`Verified by: ${parsed.verifiedBy}`);
        return parts.join(' • ');
      }
      
      // Format other actions
      if (parsed.memberName) return `Member: ${parsed.memberName}${parsed.memberEmail ? ` (${parsed.memberEmail})` : ''}`;
      if (parsed.email) return `Email: ${parsed.email}`;
      if (parsed.name) return `Name: ${parsed.name}`;
      
      // Return formatted JSON if it's an object
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Not JSON, return as is but truncate if too long
      if (details.length > 200) {
        return details.substring(0, 200) + '...';
      }
      return details;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-sm md:text-base text-gray-600">Track all administrative activities and changes</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 md:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div>
            <Label htmlFor="search" className="text-sm">Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="action" className="text-sm">Action Type</Label>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="h-9 text-sm mt-1">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map(action => (
                  <SelectItem key={action} value={action}>{formatAction(action)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="user" className="text-sm">User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="h-9 text-sm mt-1">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="dateRange" className="text-sm">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-9 text-sm mt-1">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Activity Logs */}
      <Card>
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            Activity Logs <span className="text-sm font-normal text-gray-500">({total})</span>
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 md:p-8 text-center">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-gray-400 mx-auto mb-3 md:mb-4" />
              <p className="text-sm md:text-base text-gray-600">Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-6 md:p-8 text-center">
              <Activity className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-sm md:text-base text-gray-600">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                        <span className="text-xs md:text-sm text-gray-600">by {log.userName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500">
                        <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{formatDate(log.timestamp)}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs md:text-sm text-gray-900 break-words">{formatDetails(log.details)}</p>
                      {log.ipAddress && (
                        <p className="mt-1.5 text-xs text-gray-500">IP: {log.ipAddress}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          <p className="text-xs md:text-sm text-gray-700 text-center sm:text-left">
            Showing <span className="font-medium">{logs.length}</span> of <span className="font-medium">{total}</span> activities
            <span className="hidden md:inline"> (Page {currentPage} of {totalPages})</span>
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="text-xs md:text-sm"
            >
              Previous
            </Button>
            <span className="text-xs md:text-sm text-gray-500 px-2 md:hidden">{currentPage}/{totalPages}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              className="text-xs md:text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
