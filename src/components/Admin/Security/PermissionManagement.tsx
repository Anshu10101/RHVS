"use client";

import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  UserPlus,
  Clock,
  Calendar,
  Check,
  X,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
} from 'lucide-react';

interface TemporaryPermission {
  id: string;
  userId: string;
  userName: string;
  permission: string;
  grantedBy: string;
  grantedByName: string;
  grantedAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'revoked';
}

export function PermissionManagement() {
  const { currentUser, hasPermission, grantTemporaryPermission, revokeTemporaryPermission } = useAdmin();
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');
  const [duration, setDuration] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const users = [
    { id: '1', name: 'Admin User 1', email: 'admin1@rhvs.com', role: 'admin', district: 'Delhi' },
    { id: '2', name: 'Admin User 2', email: 'admin2@rhvs.com', role: 'admin', district: 'Mumbai' },
    { id: '3', name: 'Verified Member 1', email: 'member1@rhvs.com', role: 'verified_member', district: 'Bangalore' },
  ];

  const permissions = [
    { id: 'edit_about', name: 'Edit About Page', description: 'Can modify the about page content' },
    { id: 'manage_gallery', name: 'Manage Photos', description: 'Can manage photo events, galleries, and uploads' },
    { id: 'edit_store', name: 'Edit Product Store', description: 'Can manage products and store content' },
    { id: 'edit_events', name: 'Edit Events', description: 'Can create and manage events' },
    { id: 'manage_members', name: 'Manage Members', description: 'Can add, edit, and delete members' },
    { id: 'view_analytics', name: 'View Analytics', description: 'Can access analytics dashboard' },
    { id: 'view_logs', name: 'View Activity Logs', description: 'Can view activity logs' },
  ];

  const temporaryPermissions: TemporaryPermission[] = [
    {
      id: '1',
      userId: '2',
      userName: 'Admin User 2',
      permission: 'manage_gallery',
      grantedBy: '1',
      grantedByName: 'Admin User',
      grantedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      status: 'active',
    },
    {
      id: '2',
      userId: '3',
      userName: 'Verified Member 1',
      permission: 'edit_events',
      grantedBy: '1',
      grantedByName: 'Admin User',
      grantedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      status: 'active',
    },
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedPermission) return;

    await grantTemporaryPermission(selectedUser, selectedPermission, duration);
    setShowGrantModal(false);
    setSelectedUser('');
    setSelectedPermission('');
    setDuration(7);
  };

  const handleRevokePermission = async (permissionId: string) => {
    const permission = temporaryPermissions.find(p => p.id === permissionId);
    if (permission) {
      await revokeTemporaryPermission(permission.userId, permission.permission);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'revoked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'verified_member':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!hasPermission('manage_permissions')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to manage permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
          <p className="text-gray-600">Manage user permissions and temporary access</p>
        </div>
        <Button onClick={() => setShowGrantModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Grant Permission
        </Button>
      </div>

      {/* Users List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{user.district}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(user.id);
                    setShowGrantModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Grant Permission
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Temporary Permissions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Temporary Permissions</h2>
        <div className="space-y-4">
          {temporaryPermissions.map((permission) => (
            <div key={permission.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">
                      {permission.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{permission.userName}</h3>
                    <p className="text-sm text-gray-600">
                      {permissions.find(p => p.id === permission.permission)?.name}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        Granted by {permission.grantedByName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {permission.grantedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(permission.status)}`}>
                    {permission.status.toUpperCase()}
                  </span>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      Expires: {permission.expiresAt.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.ceil((permission.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                    </p>
                  </div>
                  {permission.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevokePermission(permission.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grant Permission Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Grant Temporary Permission</h2>
            <form onSubmit={handleGrantPermission} className="space-y-4">
              <div>
                <Label htmlFor="user">Select User</Label>
                <Select
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                  required
                >
                  <option value="">Choose a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role.replace('_', ' ').toUpperCase()})
                    </option>
                  ))}
                </Select>
              </div>
              
              <div>
                <Label htmlFor="permission">Select Permission</Label>
                <Select
                  value={selectedPermission}
                  onValueChange={setSelectedPermission}
                  required
                >
                  <option value="">Choose a permission</option>
                  {permissions.map(permission => (
                    <option key={permission.id} value={permission.id}>
                      {permission.name}
                    </option>
                  ))}
                </Select>
                {selectedPermission && (
                  <p className="text-xs text-gray-600 mt-1">
                    {permissions.find(p => p.id === selectedPermission)?.description}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="30"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGrantModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Check className="h-4 w-4 mr-2" />
                  Grant Permission
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
