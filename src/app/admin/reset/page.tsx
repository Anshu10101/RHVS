"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminPasswordResetPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestOtp = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot', data: { email } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
      setToken(data.token);
      setStep('verify');
    } catch (e: unknown) { setError((e as Error).message); } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', data: { token, otp } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Invalid OTP');
      setStep('reset');
    } catch (e: unknown) { setError((e as Error).message); } finally { setLoading(false); }
  };

  const doReset = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', data: { token, newPassword } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
      router.replace('/admin/login');
    } catch (e: unknown) { setError((e as Error).message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold">Reset Admin Password</h1>
        {step === 'request' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={requestOtp} disabled={loading} className="w-full">{loading ? 'Sending…' : 'Send OTP'}</Button>
          </div>
        )}
        {step === 'verify' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter OTP</label>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={verifyOtp} disabled={loading} className="w-full">{loading ? 'Verifying…' : 'Verify'}</Button>
          </div>
        )}
        {step === 'reset' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={doReset} disabled={loading} className="w-full">{loading ? 'Saving…' : 'Save Password'}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}


