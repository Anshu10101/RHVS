"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Eye, EyeOff, Shield, Users, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

interface LoginFormProps {
  loginType: 'superadmin' | 'district_admin' | 'news_editor' | 'admin';
  onLogin: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function LoginForm({ loginType, onLogin, loading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    await onLogin(email, password);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setResetLoading(true);
    
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forgot',
          data: { 
            email: resetEmail,
            userType: loginType === 'superadmin' ? 'superadmin' : undefined, // undefined lets API auto-detect (checks superadmin, news_editor, then district_admin)
          },
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Failed to send password reset OTP');
      }

      // Store token in sessionStorage so reset page can use it
      if (result.token) {
        sessionStorage.setItem('password_reset_token', result.token);
        sessionStorage.setItem('password_reset_email', resetEmail);
      }

      toast.success('Password reset OTP sent to your email');
      setShowResetModal(false);
      setResetEmail('');
      // Redirect to reset page - it will detect the token and show OTP input
      window.location.href = '/admin/reset';
    } catch (error) {
      console.error('Error requesting password reset:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send password reset OTP';
      toast.error(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const isSuperAdmin = loginType === 'superadmin';

  return (
    <div className="min-h-screen h-dvh bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-start md:items-center justify-center px-4 sm:px-6 lg:px-8 py-6 md:py-0 relative overflow-y-auto md:overflow-hidden">
      {/* Background Pattern removed to avoid 404 */}
      
      {/* Back to Home Link - fixed top left */}
      <div className="fixed z-20 left-3 top-3 md:left-4 md:top-4" style={{ paddingLeft: 'env(safe-area-inset-left)', paddingTop: 'env(safe-area-inset-top)' }}>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 text-xs md:text-sm font-medium transition-colors bg-white/80 px-3 py-2 rounded-lg shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
      
      <div className="max-w-md w-full space-y-6 relative z-10 pb-8 md:pb-0 pt-12 md:pt-0">

        {/* Organization Logo and Header */}
        <div className="text-center">
          {/* Logo + Name on the same line */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden ring-4 ring-orange-200 shadow-lg flex-shrink-0">
              <Image
                src="/rhvs_logo.png"
                alt="Organization Logo"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            </div>
            <div className="text-left leading-tight">
              <h1 className="text-xl sm:text-2xl font-bold text-orange-900 mb-1">
                राष्ट्रीय हिंदू वाहिनी संगठन
              </h1>
              <p className="text-xs sm:text-sm text-orange-700/80">Rashtriya Hindu Vahini Sangathan</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="h-px w-8 bg-orange-200" />
            <span className="text-orange-500 text-2xl">🕉️</span>
            <span className="h-px w-8 bg-orange-200" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isSuperAdmin ? 'Superadmin Portal' : 'District Admin Portal'}
          </h2>
          <p className="text-sm text-gray-600">
            {isSuperAdmin 
              ? 'Complete administrative access to all features'
              : 'Manage your district and community'
            }
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              {isSuperAdmin ? (
                <Shield className="h-6 w-6 text-orange-600" />
              ) : (
                <Users className="h-6 w-6 text-orange-600" />
              )}
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {isSuperAdmin ? 'Superadmin Access' : 'District Admin Access'}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {isSuperAdmin 
                ? 'Enter your credentials to access the administrative panel'
                : 'Enter your credentials to manage your district'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-11 pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-orange-600 transition-colors cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowResetModal(true);
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    {isSuperAdmin ? (
                      <Shield className="mr-2 h-4 w-4" />
                    ) : (
                      <Users className="mr-2 h-4 w-4" />
                    )}
                    {isSuperAdmin ? 'Sign in as Superadmin' : 'Sign in as District Admin'}
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isSuperAdmin ? (
                  <>
                    Need district admin access?{' '}
                    <button
                      onClick={() => router.push('/admin/login')}
                      className="font-medium text-orange-600 hover:text-orange-500 transition-colors cursor-pointer"
                    >
                      District Admin Login
                    </button>
                  </>
                ) : (
                  <>
                    Need superadmin access?{' '}
                    <button
                      onClick={() => router.push('/admin/superadmin/login')}
                      className="font-medium text-orange-600 hover:text-orange-500 transition-colors cursor-pointer"
                    >
                      Superadmin Login
                    </button>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© {currentYear} Rashtriya Hindu Vahini Sangathan. All rights reserved.</p>
        </div>
      </div>

      {/* Password Reset Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you an OTP to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email Address</Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="h-11"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResetModal(false);
                  setResetEmail('');
                }}
                className="flex-1"
                disabled={resetLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={resetLoading || !resetEmail}
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
