"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/Admin/Login/LoginForm';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminProvider } from '@/contexts/AdminContext';

function SuperadminLoginContent() {
  const { login } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await login(email, password);
      
      // Wait a bit for token to be stored
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify login and user type
      const { getToken, clearToken } = await import('@/lib/secure-storage');
      const token = getToken();
      if (!token) {
        setError('Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/admin/me', { 
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          if (data.user.type !== 'superadmin') {
            setError('Access denied. This is for superadmin only.');
            clearToken();
            setLoading(false);
            return;
          }
          // Success - redirect to dashboard using full page navigation
          window.location.href = '/admin/dashboard';
        } else {
          setError('Login failed. Please check your credentials.');
          setLoading(false);
        }
      } else {
        setError('Login failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError((err as Error).message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LoginForm
      loginType="superadmin"
      onLogin={handleLogin}
      loading={loading}
      error={error}
    />
  );
}

export default function SuperadminLoginPage() {
  return (
    <AdminProvider>
      <SuperadminLoginContent />
    </AdminProvider>
  );
}
