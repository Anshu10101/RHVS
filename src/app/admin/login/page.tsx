"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Login failed');
      router.replace(next);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl" />
      </div>

      {/* Back to home link */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-orange-700 hover:text-orange-800 transition-colors z-10"
      >
        <ArrowLeft size={16} />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg ring-4 ring-orange-200 mb-4">
            <Image
              src="/rhvs_logo.png"
              alt="RHVS Logo"
              width={48}
              height={48}
              className="object-cover rounded-full"
            />
          </div>
          <h1 className="text-2xl font-bold text-orange-900 mb-2">Admin Portal</h1>
          <p className="text-orange-700/80 text-sm">राष्ट्रीय हिंदू वाहिनी संगठन</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-orange-200 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-center text-orange-900 flex items-center justify-center gap-2">
              <Shield size={20} className="text-orange-600" />
              Secure Login
            </CardTitle>
            <CardDescription className="text-center text-orange-700/70">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-orange-900">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@rhvs.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-orange-900">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 pr-10"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff size={16} className="text-orange-600" />
                    ) : (
                      <Eye size={16} className="text-orange-600" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="link"
                className="text-orange-600 hover:text-orange-700 p-0 h-auto font-medium"
                onClick={() => router.push('/admin/reset')}
                disabled={loading}
              >
                Forgot your password?
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-orange-700/60 text-sm">
          <p>© 2024 राष्ट्रीय हिंदू वाहिनी संगठन. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}


