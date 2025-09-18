"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'superadmin' | 'admin' | 'verified_member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district?: string;
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
          setState(prev => ({ ...prev, currentUser: null, loading: false }));
          return;
        }
        const data = await res.json();
        if (data?.authenticated && data.user) {
          const u: User = {
            id: String(data.user.id),
            name: data.user.email,
            email: data.user.email,
            role: (data.user.role === 'superadmin' ? 'superadmin' : 'superadmin'),
            permissions: ['all'],
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
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Login failed');
      // Optimistically set current user, then confirm via /me
      setState(prev => ({
        ...prev,
        currentUser: {
          id: 'self',
          name: email,
          email,
          role: 'superadmin',
          permissions: ['all'],
          createdAt: new Date(),
        },
      }));
      // Refresh session
      const me = await fetch('/api/admin/me', { cache: 'no-store', credentials: 'include' });
      if (me.ok) {
        const m = await me.json();
        if (m?.authenticated && m.user) {
          const u: User = {
            id: String(m.user.id),
            name: m.user.email,
            email: m.user.email,
            role: 'superadmin',
            permissions: ['all'],
            createdAt: new Date(m.user.created_at || Date.now()),
          };
          setState(prev => ({ ...prev, currentUser: u, loading: false }));
          return;
        }
      }
      setState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message || 'Login failed', loading: false }));
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
    
    if (state.currentUser.role === 'superadmin') return true;
    if (state.currentUser.permissions.includes('all')) return true;
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

  const canManageDistrict = (district: string): boolean => {
    if (!state.currentUser) return false;
    if (state.currentUser.role === 'superadmin') return true;
    return state.currentUser.district === district;
  };

  const refreshData = async () => {
    setState(prev => ({ ...prev, loading: true }));
    // Mock refresh - replace with actual API calls
    await new Promise(resolve => setTimeout(resolve, 500));
    setState(prev => ({ ...prev, loading: false }));
  };

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
