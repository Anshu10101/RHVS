"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type UserRole = 'superadmin' | 'admin' | 'verified_member';
export type UserType = 'superadmin' | 'district_admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  type?: UserType;
  district?: string;
  state?: string;
  profilePhoto?: string | null;
  permissions: string[];
  temporaryPermissions?: {
    permission: string;
    expiresAt: Date;
  }[];
  addedBy?: string;
  createdAt: Date;
}

export interface Member {
  id: string;
  registrationNumber: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  department: string;
  addedBy: string;
  addedByName: string;
  createdAt: Date;
  status: 'pending' | 'verified' | 'rejected';
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
}

export interface AdminState {
  currentUser: User | null;
  members: Member[];
  activityLogs: ActivityLog[];
  loading: boolean;
  error: string | null;
}

interface AdminContextType extends AdminState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addMember: (memberData: Omit<Member, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  grantTemporaryPermission: (userId: string, permission: string, days: number) => Promise<void>;
  revokeTemporaryPermission: (userId: string, permission: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canManageDistrict: (district: string) => boolean;
  refreshData: () => Promise<void>;
  checkPermissionExpiry: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>({
    currentUser: null,
    members: [],
    activityLogs: [],
    loading: false,
    error: null,
  });

  // Load current session from server
  useEffect(() => {
    const load = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        const res = await fetch('/api/admin/me', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) {
          // 401 is expected when not logged in - silently handle it
          setState(prev => ({ ...prev, currentUser: null, loading: false }));
          return;
        }
        const data = await res.json();
        if (data?.authenticated && data.user) {
          const u: User = {
            id: String(data.user.id),
            name: data.user.name || data.user.email,
            email: data.user.email,
            role: data.user.role,
            type: data.user.type,
            district: data.user.district,
            state: data.user.state,
            profilePhoto: data.user.profile_photo || data.user.profilePhoto || null,
            permissions: data.user.permissions || [],
            createdAt: new Date(data.user.created_at || Date.now()),
          };
          setState(prev => ({ ...prev, currentUser: u, loading: false }));
        } else {
          setState(prev => ({ ...prev, currentUser: null, loading: false }));
        }
      } catch {
        setState(prev => ({ ...prev, currentUser: null, loading: false }));
      }
    };
    load();
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important: include credentials to receive cookies
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Login failed');
      
      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Login successful, now fetch the user data
      const me = await fetch('/api/admin/me', { 
        cache: 'no-store', 
        credentials: 'include' 
      });
      if (me.ok) {
        const m = await me.json();
        if (m?.authenticated && m.user) {
          // Create user object based on API response
          const u: User = {
            id: String(m.user.id),
            name: m.user.name || m.user.email,
            email: m.user.email,
            role: m.user.role,
            type: m.user.type,
            district: m.user.district,
            permissions: m.user.permissions || [],
            createdAt: new Date(m.user.created_at || Date.now()),
          };
          setState(prev => ({ ...prev, currentUser: u, loading: false }));
          return;
        }
      }
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: unknown) {
      setState(prev => ({ ...prev, error: (error as Error).message || 'Login failed', loading: false }));
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      setState(prev => ({ ...prev, currentUser: null }));
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }
  };

  const addMember = async (memberData: Omit<Member, 'id' | 'createdAt' | 'status'>) => {
    if (!state.currentUser) return;

    const newMember: Member = {
      ...memberData,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: 'pending',
    };

    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      action: 'member_added',
      details: `Added new member ${memberData.name} (${memberData.registrationNumber})`,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      members: [...prev.members, newMember],
      activityLogs: [newLog, ...prev.activityLogs],
    }));
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    setState(prev => ({
      ...prev,
      members: prev.members.map(member =>
        member.id === id ? { ...member, ...updates } : member
      ),
    }));
  };

  const deleteMember = async (id: string) => {
    setState(prev => ({
      ...prev,
      members: prev.members.filter(member => member.id !== id),
    }));
  };

  const grantTemporaryPermission = async (userId: string, permission: string, days: number) => {
    if (!state.currentUser) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      action: 'permission_granted',
      details: `Granted temporary ${permission} permission for ${days} days`,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      activityLogs: [newLog, ...prev.activityLogs],
    }));
  };

  const revokeTemporaryPermission = async (userId: string, permission: string) => {
    if (!state.currentUser) return;

    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      action: 'permission_revoked',
      details: `Revoked temporary ${permission} permission`,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      activityLogs: [newLog, ...prev.activityLogs],
    }));
  };

  const hasPermission = (permission: string): boolean => {
    if (!state.currentUser) return false;
    
    // Superadmins have all permissions
    if (state.currentUser.type === 'superadmin' || state.currentUser.role === 'superadmin') return true;
    
    // Check if user has 'all' permission
    if (state.currentUser.permissions.includes('all')) return true;
    
    // Check if user has specific permission
    if (state.currentUser.permissions.includes(permission)) return true;
    
    // Check temporary permissions
    if (state.currentUser.temporaryPermissions) {
      const tempPermission = state.currentUser.temporaryPermissions.find(
        tp => tp.permission === permission && tp.expiresAt > new Date()
      );
      if (tempPermission) return true;
    }
    
    return false;
  };

  // Check if permissions are expired and refresh if needed
  const checkPermissionExpiry = useCallback(async () => {
    if (!state.currentUser || state.currentUser.type !== 'district_admin') return;
    
    try {
      const response = await fetch('/api/admin/permissions/check-expiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          district_admin_id: state.currentUser.id
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.expired_permissions && data.expired_permissions.length > 0) {
          // Update current user permissions by removing expired ones
          setState(prev => ({
            ...prev,
            currentUser: prev.currentUser ? {
              ...prev.currentUser,
              permissions: prev.currentUser.permissions.filter(
                perm => !data.expired_permissions.includes(perm)
              )
            } : null
          }));
        }
      }
    } catch (error) {
      console.error('Error checking permission expiry:', error);
    }
  }, [state.currentUser]);

  const canManageDistrict = (district: string): boolean => {
    if (!state.currentUser) return false;
    
    // Superadmins can manage all districts
    if (state.currentUser.type === 'superadmin' || state.currentUser.role === 'superadmin') return true;
    
    // District admins can only manage their assigned district
    return state.currentUser.district === district;
  };

  const refreshData = async () => {
    try {
    setState(prev => ({ ...prev, loading: true }));
      const res = await fetch('/api/admin/me', { cache: 'no-store', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data?.authenticated && data.user) {
          const u: User = {
            id: String(data.user.id),
            name: data.user.name || data.user.email,
            email: data.user.email,
            role: data.user.role,
            type: data.user.type,
            district: data.user.district,
            state: data.user.state,
            profilePhoto: data.user.profile_photo || data.user.profilePhoto || null,
            permissions: data.user.permissions || [],
            createdAt: new Date(data.user.created_at || Date.now()),
          };
          setState(prev => ({ ...prev, currentUser: u, loading: false }));
        } else {
          setState(prev => ({ ...prev, currentUser: null, loading: false }));
        }
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Check permission expiry every 5 minutes for district admins
  useEffect(() => {
    if (state.currentUser?.type === 'district_admin') {
      const interval = setInterval(checkPermissionExpiry, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [state.currentUser, checkPermissionExpiry]);

  const value: AdminContextType = {
    ...state,
    login,
    logout,
    addMember,
    updateMember,
    deleteMember,
    grantTemporaryPermission,
    revokeTemporaryPermission,
    hasPermission,
    canManageDistrict,
    refreshData,
    checkPermissionExpiry,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
