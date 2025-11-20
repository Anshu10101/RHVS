"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/Admin/Login/LoginForm';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminProvider } from '@/contexts/AdminContext';

function DistrictAdminLoginContent() {
  const { login, currentUser } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if already logged in as district admin
  useEffect(() => {
    if (currentUser && currentUser.type === 'district_admin') {
      router.push('/admin/dashboard');
    }
  }, [currentUser, router]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await login(email, password);
      
      // Wait for AdminContext to update and useEffect to handle redirect
      // The useEffect above will redirect if user is district admin
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if user was set (useEffect handles redirect, but verify type here)
      // Use a fresh check via API to avoid stale closure
      const response = await fetch('/api/admin/me', { 
        cache: 'no-store', 
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          if (data.user.type !== 'district_admin') {
            setError('Access denied. This is for district admins only.');
            await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
          }
          // If district admin, useEffect will handle redirect
        } else {
          setError('Login failed. Please check your credentials.');
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError((err as Error).message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm
      loginType="district_admin"
      onLogin={handleLogin}
      loading={loading}
      error={error}
    />
  );
}

export default function DistrictAdminLoginPage() {
  return (
    <AdminProvider>
      <DistrictAdminLoginContent />
    </AdminProvider>
  );
}