"use client";

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  Users,
  Calendar,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

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

interface PermissionStats {
  total_assignments: number;
  active_assignments: number;
  expiring_soon: number;
  expired_assignments: number;
  total_admins: number;
  total_permissions: number;
}

export default function PermissionManagementPage() {
  const { currentUser } = useAdmin();
  const [assignments, setAssignments] = useState<PermissionAssignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<PermissionAssignment[]>([]);
  const [stats, setStats] = useState<PermissionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.type === 'superadmin') {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const [assignmentsRes, allAssignmentsRes, statsRes] = await Promise.all([
        fetch('/api/admin/permissions/assignments', { headers }), // Active assignments only
        fetch('/api/admin/permissions/assignments?all=true', { headers }), // All assignments for history
        fetch('/api/admin/permissions/stats', { headers })
      ]);

      let activeAssignments: PermissionAssignment[] = [];
      let allAssignmentsList: PermissionAssignment[] = [];

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        activeAssignments = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData.assignments || []);
        setAssignments(activeAssignments);
      }

      if (allAssignmentsRes.ok) {
        const allAssignmentsData = await allAssignmentsRes.json();
        allAssignmentsList = Array.isArray(allAssignmentsData) ? allAssignmentsData : (allAssignmentsData.assignments || []);
        setAllAssignments(allAssignmentsList);
      } else {
        // Fallback: use active assignments if all endpoint doesn't exist
        setAllAssignments(activeAssignments);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const stats = statsData.stats || statsData;
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching permission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExpirationStatus = (expiresAt: string | null) => {
    if (!expiresAt) return { status: 'permanent', color: 'bg-green-100 text-green-800' };
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'bg-red-100 text-red-800' };
    if (daysUntilExpiry <= 7) return { status: 'expiring_soon', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'active', color: 'bg-green-100 text-green-800' };
  };

  if (currentUser?.type !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <Shield className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-red-500 mb-3 sm:mb-4" />
            <CardTitle className="text-lg sm:text-xl">Access Denied</CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2">
              Only superadmins can access permission management.
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
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base">Loading permission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Permission Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage district admin permissions and access control</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/admin/permissions/assign" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto">
              <UserCheck className="h-4 w-4 mr-2" />
              Assign Permissions
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Assignments</CardTitle>
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{stats.total_assignments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.active_assignments} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">District Admins</CardTitle>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold">{stats.total_admins}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active district admins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.expiring_soon}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Next 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Expired</CardTitle>
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.expired_assignments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="assignments" className="text-xs sm:text-sm">Current Assignments</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">Permission History</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Current Permission Assignments</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                View and manage active permission assignments for district admins
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-3 sm:space-y-4">
                {assignments.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500">
                    No permission assignments found.
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {assignments.map((assignment) => {
                      const expiration = getExpirationStatus(assignment.expires_at);
                      return (
                        <div
                          key={assignment.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-medium text-sm sm:text-base truncate">{assignment.admin_name}</h3>
                              <Badge variant="outline" className="text-xs">{assignment.admin_district}</Badge>
                              <Badge className={`${expiration.color} text-xs`}>
                                {assignment.permission_name}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{assignment.admin_email}</p>
                            {assignment.notes && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{assignment.notes}</p>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
                            <Badge className={`${expiration.color} text-xs`}>
                              {expiration.status === 'permanent' ? 'Permanent' : 
                               expiration.status === 'expired' ? 'Expired' :
                               expiration.status === 'expiring_soon' ? 'Expiring Soon' : 'Active'}
                            </Badge>
                            {assignment.expires_at && (
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {new Date(assignment.expires_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Permission History</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Complete overview of all permission assignments to district admins
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              {allAssignments.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No permission assignments found.</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* Group assignments by admin */}
                  {Object.entries(
                    allAssignments.reduce((acc, assignment) => {
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
                  ).map(([key, adminData]) => (
                    <div key={key} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                      {/* Admin Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 sm:py-5 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                                  {adminData.admin_name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span className="truncate">{adminData.admin_email}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <Badge variant="outline" className="text-xs">
                                      {adminData.admin_district}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge variant="secondary" className="text-xs sm:text-sm px-3 py-1">
                              {adminData.permissions.length} {adminData.permissions.length === 1 ? 'Permission' : 'Permissions'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Permissions List */}
                      <div className="divide-y">
                        {adminData.permissions.map((permission) => {
                          const expiration = getExpirationStatus(permission.expires_at);
                          return (
                            <div key={permission.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                {/* Left: Permission Details */}
                                <div className="flex-1 min-w-0 space-y-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={`${expiration.color} text-xs sm:text-sm font-medium px-2.5 py-1`}>
                                      {permission.permission_name}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {permission.permission_key}
                                    </Badge>
                                    {!permission.is_active && (
                                      <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        Revoked
                                      </Badge>
                                    )}
                                    {permission.is_active && (
                                      <Badge className={`${expiration.color} text-xs flex items-center gap-1`}>
                                        {expiration.status === 'permanent' ? (
                                          <>
                                            <CheckCircle className="h-3 w-3" />
                                            Permanent
                                          </>
                                        ) : expiration.status === 'expired' ? (
                                          <>
                                            <XCircle className="h-3 w-3" />
                                            Expired
                                          </>
                                        ) : expiration.status === 'expiring_soon' ? (
                                          <>
                                            <Clock className="h-3 w-3" />
                                            Expiring Soon
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="h-3 w-3" />
                                            Active
                                          </>
                                        )}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Notes */}
                                  {permission.notes && (
                                    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                      <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                      <p className="text-xs sm:text-sm text-gray-700 flex-1">
                                        {permission.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Right: Dates and Status */}
                                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4 lg:gap-3 flex-shrink-0 lg:items-end lg:text-right">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 sm:justify-end">
                                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-gray-500">Granted</p>
                                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                                          {new Date(permission.granted_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {new Date(permission.granted_at).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                    </div>

                                    {permission.expires_at ? (
                                      <div className="flex items-center gap-2 sm:justify-end">
                                        <Clock className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 ${
                                          expiration.status === 'expired' ? 'text-red-500' :
                                          expiration.status === 'expiring_soon' ? 'text-yellow-500' :
                                          'text-green-500'
                                        }`} />
                                        <div>
                                          <p className="text-xs text-gray-500">Expires</p>
                                          <p className={`text-xs sm:text-sm font-medium ${
                                            expiration.status === 'expired' ? 'text-red-600' :
                                            expiration.status === 'expiring_soon' ? 'text-yellow-600' :
                                            'text-green-600'
                                          }`}>
                                            {new Date(permission.expires_at).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </p>
                        <p className="text-xs text-gray-500">
                                            {new Date(permission.expires_at).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                        </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 sm:justify-end">
                                        <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                                        <div>
                                          <p className="text-xs text-gray-500">Status</p>
                                          <p className="text-xs sm:text-sm font-medium text-green-600">
                                            No Expiration
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
