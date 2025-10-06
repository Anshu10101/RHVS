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
  CheckCircle,
  Users,
  Calendar,
  Settings
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

interface PermissionTemplate {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
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
  const { currentUser, hasPermission } = useAdmin();
  const [assignments, setAssignments] = useState<PermissionAssignment[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
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
      const [assignmentsRes, templatesRes, statsRes] = await Promise.all([
        fetch('/api/admin/permissions/assignments'),
        fetch('/api/admin/permissions/templates'),
        fetch('/api/admin/permissions/stats')
      ]);

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        const assignments = assignmentsData.assignments || assignmentsData;
        setAssignments(Array.isArray(assignments) ? assignments : []);
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        const templates = templatesData.templates || templatesData;
        setTemplates(Array.isArray(templates) ? templates : []);
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
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only superadmins can access permission management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading permission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permission Management</h1>
          <p className="text-gray-600">Manage district admin permissions and access control</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/permissions/assign">
            <Button>
              <UserCheck className="h-4 w-4 mr-2" />
              Assign Permissions
            </Button>
          </Link>
          <Link href="/admin/permissions/templates">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Manage Templates
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_assignments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_assignments} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">District Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_admins}</div>
              <p className="text-xs text-muted-foreground">
                Active district admins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.expiring_soon}</div>
              <p className="text-xs text-muted-foreground">
                Next 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.expired_assignments}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Current Assignments</TabsTrigger>
          <TabsTrigger value="templates">Permission Templates</TabsTrigger>
          <TabsTrigger value="history">Assignment History</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Permission Assignments</CardTitle>
              <CardDescription>
                View and manage active permission assignments for district admins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No permission assignments found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((assignment) => {
                      const expiration = getExpirationStatus(assignment.expires_at);
                      return (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{assignment.admin_name}</h3>
                              <Badge variant="outline">{assignment.admin_district}</Badge>
                              <Badge className={expiration.color}>
                                {assignment.permission_name}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{assignment.admin_email}</p>
                            {assignment.notes && (
                              <p className="text-xs text-gray-500 mt-1">{assignment.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={expiration.color}>
                              {expiration.status === 'permanent' ? 'Permanent' : 
                               expiration.status === 'expired' ? 'Expired' :
                               expiration.status === 'expiring_soon' ? 'Expiring Soon' : 'Active'}
                            </Badge>
                            {assignment.expires_at && (
                              <span className="text-xs text-gray-500">
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

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Templates</CardTitle>
              <CardDescription>
                Predefined permission sets for quick assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.permissions.map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(template.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
              <CardDescription>
                Track all permission assignment changes and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Assignment history will be displayed here.
                <br />
                <Link href="/admin/permissions/history">
                  <Button variant="outline" className="mt-2">
                    View Full History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
