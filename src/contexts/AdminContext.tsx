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

  // Mock data for development
  useEffect(() => {
    const mockUser: User = {
      id: '1',
      name: 'Admin User',
      email: 'admin@rhvs.com',
      role: 'superadmin',
      permissions: [
        'all',
        'edit_about',
        'edit_gallery',
        'edit_store',
        'edit_news_events',
        'edit_departments',
        'edit_offices',
        'edit_karya_samiti',
        'edit_contact',
        'edit_navigation',
        'edit_seo',
        'manage_members',
        'view_analytics',
        'view_logs',
        'manage_permissions',
        'manage_settings'
      ],
      createdAt: new Date(),
    };

    const mockMembers: Member[] = [
      {
        id: '1',
        registrationNumber: 'RHVS001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        district: 'Delhi',
        department: 'IT',
        addedBy: '1',
        addedByName: 'Admin User',
        createdAt: new Date(),
        status: 'verified',
      },
      {
        id: '2',
        registrationNumber: 'RHVS002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        district: 'Mumbai',
        department: 'Finance',
        addedBy: '1',
        addedByName: 'Admin User',
        createdAt: new Date(),
        status: 'pending',
      },
    ];

    const mockLogs: ActivityLog[] = [
      {
        id: '1',
        userId: '1',
        userName: 'Admin User',
        action: 'member_added',
        details: 'Added new member John Doe (RHVS001)',
        timestamp: new Date(),
      },
      {
        id: '2',
        userId: '1',
        userName: 'Admin User',
        action: 'permission_granted',
        details: 'Granted temporary gallery edit permission to Admin Z for 7 days',
        timestamp: new Date(),
      },
    ];

    setState(prev => ({
      ...prev,
      currentUser: mockUser,
      members: mockMembers,
      activityLogs: mockLogs,
    }));
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Mock login - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        name: 'Admin User',
        email: email,
        role: 'superadmin',
        permissions: ['all'],
        createdAt: new Date(),
      };
      
      setState(prev => ({
        ...prev,
        currentUser: mockUser,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Login failed',
        loading: false,
      }));
    }
  };

  const logout = () => {
    setState(prev => ({
      ...prev,
      currentUser: null,
    }));
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
