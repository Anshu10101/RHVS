"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/Admin/Login/LoginForm';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminProvider } from '@/contexts/AdminContext';

function SuperadminLoginContent() {
  const { login, currentUser } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if already logged in as superadmin
  useEffect(() => {
    if (currentUser && currentUser.type === 'superadmin') {
      router.push('/admin/dashboard');
    }
  }, [currentUser, router]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await login(email, password);
      
      // Wait a bit for AdminContext to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check currentUser from context instead of calling API again
      // AdminContext.login() already calls /api/admin/me and sets currentUser
      // We just need to verify the user type
      if (currentUser) {
        if (currentUser.type === 'superadmin') {
          router.push('/admin/dashboard');
        } else {
          setError('Access denied. This is for superadmin only.');
          // Clear the session
          await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
        }
      } else {
        // If currentUser is still null, try one more API call
        const response = await fetch('/api/admin/me', { 
          cache: 'no-store', 
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user?.type === 'superadmin') {
            router.push('/admin/dashboard');
          } else {
            setError('Access denied. This is for superadmin only.');
          }
        } else {
          setError('Login failed. Please check your credentials.');
        }
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
