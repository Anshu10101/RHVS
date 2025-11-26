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
        // Use secure storage utility
        const { getToken, shouldRefreshToken } = await import('@/lib/secure-storage');
        let token = getToken();
        
        if (!token) {
          setState(prev => ({ ...prev, currentUser: null, loading: false }));
          return;
        }
        
        // Check if token needs refresh
        if (shouldRefreshToken()) {
          // Token is close to expiry, try to refresh
          try {
            const refreshRes = await fetch('/api/admin/refresh', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              if (refreshData.token) {
                const { storeToken } = await import('@/lib/secure-storage');
                storeToken(refreshData.token, refreshData.expiresIn || 8 * 60 * 60);
                token = refreshData.token;
              }
            }
          } catch (refreshError) {
            console.warn('Token refresh failed, using existing token:', refreshError);
          }
        }
        
        const res = await fetch(`/api/admin/me?_t=${Date.now()}`, { 
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          credentials: 'omit' // Don't send cookies - only use Authorization header
        });
        if (!res.ok) {
          // Token invalid, clear it
          const { clearToken } = await import('@/lib/secure-storage');
          clearToken();
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
          const { clearToken } = await import('@/lib/secure-storage');
          clearToken();
          setState(prev => ({ ...prev, currentUser: null, loading: false }));
        }
      } catch {
        const { clearToken } = await import('@/lib/secure-storage');
        clearToken();
        setState(prev => ({ ...prev, currentUser: null, loading: false }));
      }
    };
    load();
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // CRITICAL: Clear old token and user data BEFORE attempting new login
      const { clearToken } = await import('@/lib/secure-storage');
      clearToken();
      setState(prev => ({ ...prev, currentUser: null }));
      
      // Clear any old cookies on client side before login (though httpOnly cookies can't be cleared from JS)
      // This is just for cleanup of any non-httpOnly cookies
      document.cookie = 'admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
      document.cookie = 'admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Don't send any Authorization header - we want a fresh login
        },
        body: JSON.stringify({ email, password }),
        cache: 'no-store', // Ensure no caching
      });
      const data = await res.json();
      console.log('🔍 Login response:', { success: data.success, hasToken: !!data.token, tokenLength: data.token?.length });
      
      if (!res.ok || !data.success) throw new Error(data.message || 'Login failed');
      
      if (!data.token) {
        console.error('❌ No token in login response!');
        throw new Error('Login failed: No token received');
      }
      
      // Store token securely with expiry tracking
      const { storeToken } = await import('@/lib/secure-storage');
      storeToken(data.token, data.expiresIn || 8 * 60 * 60);
      console.log('✅ Token stored securely');
      
      // CRITICAL: Wait a brief moment to ensure token is stored before fetching user data
      // This prevents race conditions where the old token might still be used
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Login successful, now fetch the user data with the NEW token
      // Use cache-busting timestamp to ensure fresh data
      // CRITICAL: Use credentials: 'omit' to prevent sending old cookies
      const me = await fetch(`/api/admin/me?_t=${Date.now()}`, { 
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        credentials: 'omit' // Don't send cookies - only use Authorization header
      });
      
      console.log('🔍 /api/admin/me response:', { ok: me.ok, status: me.status });
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
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();
      if (token) {
        await fetch('/api/admin/logout', { 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } finally {
      const { clearToken } = await import('@/lib/secure-storage');
      clearToken();
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
      // Get token from secure storage
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();
      
      if (!token) {
        return; // No token, skip check
      }
      
      const response = await fetch('/api/admin/permissions/check-expiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'omit', // Don't send cookies - only use Authorization header
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
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
      
      const res = await fetch(`/api/admin/me?_t=${Date.now()}`, { 
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        credentials: 'omit' // Don't send cookies - only use Authorization header
      });
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
