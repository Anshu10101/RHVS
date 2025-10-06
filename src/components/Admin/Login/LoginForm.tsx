"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';

interface LoginFormProps {
  loginType: 'superadmin' | 'district_admin';
  onLogin: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function LoginForm({ loginType, onLogin, loading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    await onLogin(email, password);
  };

  const isSuperAdmin = loginType === 'superadmin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
            {isSuperAdmin ? (
              <Shield className="h-6 w-6 text-orange-600" />
            ) : (
              <Users className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isSuperAdmin ? 'Superadmin Login' : 'District Admin Login'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSuperAdmin 
              ? 'Access the full administrative panel'
              : 'Access your district management panel'
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isSuperAdmin ? 'Superadmin Access' : 'District Admin Access'}
            </CardTitle>
            <CardDescription className="text-center">
              {isSuperAdmin 
                ? 'Enter your superadmin credentials to access all features'
                : 'Enter your district admin credentials to manage your district'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full cursor-pointer disabled:cursor-not-allowed"
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
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isSuperAdmin ? (
                  <>
                    Need district admin access?{' '}
                    <button
                      onClick={() => router.push('/admin/login')}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      District Admin Login
                    </button>
                  </>
                ) : (
                  <>
                    Need superadmin access?{' '}
                    <button
                      onClick={() => router.push('/admin/superadmin/login')}
                      className="font-medium text-orange-600 hover:text-orange-500"
                    >
                      Superadmin Login
                    </button>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
