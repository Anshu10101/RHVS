"use client";

import { useState } from 'react';
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
      // Check if user is actually a superadmin
      const response = await fetch('/api/admin/me', { 
        cache: 'no-store', 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user?.type === 'superadmin') {
          router.push('/admin/dashboard');
        } else {
          setError('Access denied. This is for superadmin only.');
          // Clear the session
          await fetch('/api/admin/logout', { method: 'POST' });
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
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
