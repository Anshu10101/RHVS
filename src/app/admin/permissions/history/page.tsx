"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Clock, 
  Users,
  Calendar,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Activity,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  Ban
} from 'lucide-react';

interface PermissionAssignment {
  id: number;
  district_admin_id: number;
  admin_name: string;
  admin_email: string;
  admin_district: string;
  permission_key: string;
  permission_name: string;
  granted_by: number;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
}

export default function PermissionHistoryPage() {
  const { currentUser } = useAdmin();
  const { t } = useLanguage();
  const [allAssignments, setAllAssignments] = useState<PermissionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'revoked' | 'permanent'>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (currentUser && currentUser.type === 'superadmin') {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const allAssignmentsRes = await fetch('/api/admin/permissions/assignments?all=true', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (allAssignmentsRes.ok) {
        const allAssignmentsData = await allAssignmentsRes.json();
        let allAssignmentsList: PermissionAssignment[] = [];
        if (Array.isArray(allAssignmentsData)) {
          allAssignmentsList = allAssignmentsData;
        } else if (allAssignmentsData.assignments && Array.isArray(allAssignmentsData.assignments)) {
          allAssignmentsList = allAssignmentsData.assignments;
        } else if (allAssignmentsData.data && Array.isArray(allAssignmentsData.data)) {
          allAssignmentsList = allAssignmentsData.data;
        }
        setAllAssignments(allAssignmentsList);
      }
    } catch (error) {
      console.error('Error fetching permission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExpirationStatus = (expiresAt: string | null, isActive: boolean) => {
    if (!isActive) return { status: 'revoked', color: 'bg-red-100 text-red-800' };
    if (!expiresAt) return { status: 'permanent', color: 'bg-green-100 text-green-800' };
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'bg-red-100 text-red-800' };
    if (daysUntilExpiry <= 7) return { status: 'expiring_soon', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'active', color: 'bg-green-100 text-green-800' };
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = allAssignments.length;
    const active = allAssignments.filter(a => {
      const status = getExpirationStatus(a.expires_at, a.is_active);
      return status.status === 'active' || status.status === 'permanent';
    }).length;
    const expired = allAssignments.filter(a => {
      const status = getExpirationStatus(a.expires_at, a.is_active);
      return status.status === 'expired';
    }).length;
    const permanent = allAssignments.filter(a => !a.expires_at && a.is_active).length;
    const revoked = allAssignments.filter(a => !a.is_active).length;
    
    return { total, active, expired, permanent, revoked };
  }, [allAssignments]);

  // Get unique districts
  const districts = useMemo(() => {
    return Array.from(new Set(allAssignments.map(a => a.admin_district).filter(Boolean))).sort();
  }, [allAssignments]);

  // Filter and search
  const filteredAssignments = useMemo(() => {
    return allAssignments.filter(assignment => {
      const matchesSearch = 
        assignment.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.permission_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (assignment.admin_district && assignment.admin_district.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDistrict = filterDistrict === 'all' || assignment.admin_district === filterDistrict;
      
      const status = getExpirationStatus(assignment.expires_at, assignment.is_active);
      const matchesStatus = filterStatus === 'all' || status.status === filterStatus;
      
      return matchesSearch && matchesDistrict && matchesStatus;
    });
  }, [allAssignments, searchTerm, filterDistrict, filterStatus]);

  // Group by admin
  const groupedAssignments = useMemo(() => {
    return Object.entries(
      filteredAssignments.reduce((acc, assignment) => {
        const key = `${assignment.district_admin_id}-${assignment.admin_email}`;
        if (!acc[key]) {
          acc[key] = {
            admin_id: assignment.district_admin_id,
            admin_name: assignment.admin_name,
            admin_email: assignment.admin_email,
            admin_district: assignment.admin_district,
            permissions: []
          };
        }
        acc[key].permissions.push(assignment);
        return acc;
      }, {} as Record<string, {
        admin_id: number;
        admin_name: string;
        admin_email: string;
        admin_district: string;
        permissions: PermissionAssignment[];
      }>)
    );
  }, [filteredAssignments]);

  // Pagination
  const totalPages = Math.ceil(groupedAssignments.length / itemsPerPage);
  const paginatedAssignments = groupedAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterDistrict('all');
    setCurrentPage(1);
  };

  if (currentUser?.type !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center px-4 pt-4 pb-3">
            <Shield className="h-10 w-10 mx-auto text-red-500 mb-3" />
            <CardTitle className="text-lg">{t('admin.permissions.history.accessDenied') || 'Access Denied'}</CardTitle>
            <CardDescription className="text-sm mt-2">
              {t('admin.permissions.history.onlySuperadmins') || 'Only superadmins can access permission history.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-sm">{t('admin.permissions.history.loading') || 'Loading permission history...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-orange-900">{t('admin.permissions.history.title') || 'Permission History'}</h1>
          <p className="text-sm text-orange-700/80 mt-1">{t('admin.permissions.history.subtitle') || 'Complete overview of all permission assignments'}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.permissions.history.refresh') || 'Refresh'}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">{t('admin.permissions.history.total') || 'Total'}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">{t('admin.permissions.history.active') || 'Active'}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">{t('admin.permissions.history.permanent') || 'Permanent'}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.permanent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg flex-shrink-0">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">{t('admin.permissions.history.expired') || 'Expired'}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg flex-shrink-0">
                  <Ban className="h-4 w-4 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">{t('admin.permissions.history.revoked') || 'Revoked'}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.revoked}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filters */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm font-semibold text-orange-900 flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t('admin.permissions.history.searchAndFilter') || 'Search & Filter'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder={t('admin.permissions.history.searchPlaceholder') || 'Search by admin name, email, permission...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={filterStatus} onValueChange={(v) => {
              setFilterStatus(v as any);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t('admin.permissions.history.allStatus') || 'All Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.permissions.history.allStatus') || 'All Status'}</SelectItem>
                <SelectItem value="active">{t('admin.permissions.history.active') || 'Active'}</SelectItem>
                <SelectItem value="permanent">{t('admin.permissions.history.permanent') || 'Permanent'}</SelectItem>
                <SelectItem value="expired">{t('admin.permissions.history.expired') || 'Expired'}</SelectItem>
                <SelectItem value="revoked">{t('admin.permissions.history.revoked') || 'Revoked'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDistrict} onValueChange={(v) => {
              setFilterDistrict(v);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t('admin.permissions.history.allDistricts') || 'All Districts'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.permissions.history.allDistricts') || 'All Districts'}</SelectItem>
                {districts.map(district => (
                  <SelectItem key={district} value={district}>{district}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="col-span-2 sm:col-span-2 flex gap-2">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                size="sm"
                className="flex-1 h-8 px-3 text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                {t('admin.permissions.history.clearFilters') || 'Clear'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 h-8 px-3 text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                disabled
              >
                <Filter className="h-3 w-3 mr-1.5" />
                {filteredAssignments.length} {t('admin.permissions.history.results') || 'Results'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card>
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base">{t('admin.permissions.history.allAssignments') || 'All Permission Assignments'}</CardTitle>
          <CardDescription className="text-xs">
            {t('admin.permissions.history.showing') || 'Showing'} {paginatedAssignments.length} {t('admin.permissions.history.of') || 'of'} {groupedAssignments.length} {t('admin.permissions.history.admins') || 'admins'} ({t('admin.permissions.history.page') || 'Page'} {currentPage} {t('admin.permissions.history.of') || 'of'} {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {paginatedAssignments.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>{t('admin.permissions.history.noAssignments') || 'No permission assignments found.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedAssignments.map(([key, adminData]) => (
                <div key={key} className="border rounded-lg overflow-hidden bg-white">
                  {/* Admin Header - Compact */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2.5 border-b">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-gray-900 truncate">
                              {adminData.admin_name}
                            </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{adminData.admin_email}</span>
                              </div>
                            {adminData.admin_district && (
                                <Badge variant="outline" className="text-xs">
                                  {adminData.admin_district}
                                </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                        {adminData.permissions.length}
                        </Badge>
                    </div>
                  </div>

                  {/* Permissions List - Compact */}
                  <div className="divide-y">
                    {adminData.permissions.map((permission) => {
                      const expiration = getExpirationStatus(permission.expires_at, permission.is_active);
                      return (
                        <div key={permission.id} className="p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge className={`${expiration.color} text-xs font-medium px-2 py-0.5`}>
                                  {permission.permission_name}
                                </Badge>
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  {permission.permission_key}
                                </Badge>
                                <Badge className={`${expiration.color} text-xs flex items-center gap-1 px-2 py-0.5`}>
                                  {expiration.status === 'permanent' && <Shield className="h-3 w-3" />}
                                  {expiration.status === 'expired' && <XCircle className="h-3 w-3" />}
                                  {expiration.status === 'expiring_soon' && <Clock className="h-3 w-3" />}
                                  {expiration.status === 'active' && <CheckCircle className="h-3 w-3" />}
                                  {expiration.status === 'revoked' && <Ban className="h-3 w-3" />}
                                  {expiration.status === 'permanent' && (t('admin.permissions.history.permanent') || 'Permanent')}
                                  {expiration.status === 'expired' && (t('admin.permissions.history.expired') || 'Expired')}
                                  {expiration.status === 'expiring_soon' && (t('admin.permissions.history.expiringSoon') || 'Expiring Soon')}
                                  {expiration.status === 'active' && (t('admin.permissions.history.active') || 'Active')}
                                  {expiration.status === 'revoked' && (t('admin.permissions.history.revoked') || 'Revoked')}
                                  </Badge>
                              </div>

                              {permission.notes && (
                                <div className="flex items-start gap-1.5 p-2 bg-gray-50 rounded border border-gray-200">
                                  <FileText className="h-3.5 w-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-gray-700 flex-1 break-words">
                                    {permission.notes}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-1.5 flex-shrink-0 sm:text-right">
                              <div className="flex items-center gap-1.5 sm:justify-end">
                                <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                  <div>
                                  <p className="text-xs text-gray-500">{t('admin.permissions.history.granted') || 'Granted'}</p>
                                  <p className="text-xs font-medium text-gray-900">
                                      {new Date(permission.granted_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                </div>

                                {permission.expires_at ? (
                                <div className="flex items-center gap-1.5 sm:justify-end">
                                  <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${
                                      expiration.status === 'expired' ? 'text-red-500' :
                                      expiration.status === 'expiring_soon' ? 'text-yellow-500' :
                                      'text-green-500'
                                    }`} />
                                    <div>
                                    <p className="text-xs text-gray-500">{t('admin.permissions.history.expires') || 'Expires'}</p>
                                    <p className={`text-xs font-medium ${
                                        expiration.status === 'expired' ? 'text-red-600' :
                                        expiration.status === 'expiring_soon' ? 'text-yellow-600' :
                                        'text-green-600'
                                      }`}>
                                        {new Date(permission.expires_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                <div className="flex items-center gap-1.5 sm:justify-end">
                                  <Shield className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                    <div>
                                    <p className="text-xs text-gray-500">{t('admin.permissions.history.status') || 'Status'}</p>
                                    <p className="text-xs font-medium text-green-600">
                                      {t('admin.permissions.history.noExpiration') || 'No Expiration'}
                                      </p>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-gray-600">
                {t('admin.permissions.history.page') || 'Page'} {currentPage} {t('admin.permissions.history.of') || 'of'} {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 text-xs"
                >
                  {t('admin.permissions.history.previous') || 'Previous'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 text-xs"
                >
                  {t('admin.permissions.history.next') || 'Next'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
