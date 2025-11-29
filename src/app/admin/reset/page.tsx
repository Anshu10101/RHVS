"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function AdminPasswordResetPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if token exists in sessionStorage (from profile modal)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('password_reset_token');
      const storedEmail = sessionStorage.getItem('password_reset_email');
      
      if (storedToken && storedEmail) {
        // OTP was already sent from profile modal, skip to verify step
        setToken(storedToken);
        setEmail(storedEmail);
        setStep('verify');
        setSuccess(t('admin.reset.otpSentToEmail'));
        // Clear sessionStorage after reading
        sessionStorage.removeItem('password_reset_token');
        sessionStorage.removeItem('password_reset_email');
      }
    }
  }, []);

  const requestOtp = async () => {
    if (!email) {
      setError(t('admin.reset.enterEmail'));
      return;
    }
    setLoading(true); 
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/password?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({ action: 'forgot', data: { email } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || t('admin.reset.failedToSendOtp'));
      }
      setToken(data.token);
      setSuccess(t('admin.reset.otpSentToEmail'));
      setStep('verify');
    } catch (e: unknown) { 
      setError((e as Error).message); 
    } finally { 
      setLoading(false); 
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError(t('admin.reset.enterValidOtp'));
      return;
    }
    setLoading(true); 
    setError(null);
    try {
      const res = await fetch(`/api/admin/password?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({ action: 'verify-otp', data: { token, otp } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || t('admin.reset.invalidOtp'));
      }
      setStep('reset');
      setError(null);
    } catch (e: unknown) { 
      setError((e as Error).message); 
    } finally { 
      setLoading(false); 
    }
  };

  const doReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError(t('admin.reset.mustBeEightCharacters'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('admin.profile.passwordsDoNotMatch'));
      return;
    }
    setLoading(true); 
    setError(null);
    try {
      const res = await fetch(`/api/admin/password?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({ action: 'reset', data: { token, newPassword } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || t('admin.reset.failedToResetPassword'));
      }
      setSuccess(t('admin.reset.passwordResetSuccess'));
      setTimeout(() => {
        router.replace('/admin/login');
      }, 2000);
    } catch (e: unknown) { 
      setError((e as Error).message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-md shadow-xl border-0 sm:border bg-white/95 backdrop-blur-sm">
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-100 mb-2 sm:mb-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{t('admin.reset.title')}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 px-2">{t('admin.reset.followSteps')}</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <div className={`flex items-center ${step === 'request' ? 'text-orange-600' : step === 'verify' || step === 'reset' ? 'text-green-600' : 'text-gray-300'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                step === 'request' ? 'bg-orange-50 border-orange-600' : 
                step === 'verify' || step === 'reset' ? 'bg-green-50 border-green-600' : 
                'bg-gray-50 border-gray-300'
              }`}>
                1
              </div>
            </div>
            <div className={`h-0.5 w-8 sm:w-10 ${step === 'verify' || step === 'reset' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step === 'verify' ? 'text-orange-600' : step === 'reset' ? 'text-green-600' : 'text-gray-300'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                step === 'verify' ? 'bg-orange-50 border-orange-600' : 
                step === 'reset' ? 'bg-green-50 border-green-600' : 
                'bg-gray-50 border-gray-300'
              }`}>
                2
              </div>
            </div>
            <div className={`h-0.5 w-8 sm:w-10 ${step === 'reset' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step === 'reset' ? 'text-orange-600' : 'text-gray-300'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                step === 'reset' ? 'bg-orange-50 border-orange-600' : 'bg-gray-50 border-gray-300'
              }`}>
                3
              </div>
            </div>
          </div>

        {step === 'request' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">{t('admin.reset.emailAddress')}</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('admin.reset.enterEmailPlaceholder')}
                required 
                className="w-full h-10 sm:h-11 text-sm sm:text-base px-3 sm:px-4 border-2 focus:border-orange-500 transition-colors"
                autoComplete="email"
              />
            </div>
            {error && (
              <div className="p-2.5 sm:p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md text-xs sm:text-sm text-red-700 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="flex-1">{error}</span>
              </div>
            )}
            {success && (
              <div className="p-2.5 sm:p-3 bg-green-50 border-l-4 border-green-500 rounded-r-md text-xs sm:text-sm text-green-700 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="flex-1">{success}</span>
              </div>
            )}
            <Button 
              onClick={requestOtp} 
              disabled={loading || !email} 
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('admin.reset.sendingOtp')}
                </span>
              ) : (
                t('admin.reset.sendOtp')
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/login')}
              className="w-full h-10 sm:h-11 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {t('admin.reset.backToLogin')}
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2 sm:space-y-3">
              <label className="text-sm font-semibold text-gray-700 block text-center">{t('admin.reset.enterSixDigitOtp')}</label>
              <div className="flex justify-center">
                <Input 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  maxLength={6}
                  placeholder="000000"
                  className="w-full max-w-xs text-center text-2xl sm:text-3xl md:text-4xl tracking-[0.5em] font-mono h-14 sm:h-16 md:h-20 border-2 focus:border-orange-500 transition-colors"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 text-center px-2">{t('admin.reset.checkEmailForOtp')}</p>
            </div>
            {error && (
              <div className="p-2.5 sm:p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md text-xs sm:text-sm text-red-700 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="flex-1">{error}</span>
              </div>
            )}
            {success && (
              <div className="p-2.5 sm:p-3 bg-green-50 border-l-4 border-green-500 rounded-r-md text-xs sm:text-sm text-green-700 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="flex-1">{success}</span>
              </div>
            )}
            <Button 
              onClick={verifyOtp} 
              disabled={loading || otp.length !== 6} 
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('admin.reset.verifying')}
                </span>
              ) : (
                t('admin.reset.verifyOtp')
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStep('request');
                setOtp('');
                setError(null);
                setSuccess(null);
              }}
              className="w-full h-10 sm:h-11 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {t('admin.reset.back')}
            </Button>
          </div>
        )}

        {step === 'reset' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">{t('admin.reset.newPassword')}</label>
              <div className="relative">
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('admin.reset.enterNewPassword')}
                  className="w-full h-10 sm:h-11 text-sm sm:text-base px-3 sm:px-4 pr-10 sm:pr-12 border-2 focus:border-orange-500 transition-colors"
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${newPassword && newPassword.length < 8 ? 'bg-gray-200' : 'bg-green-200'}`}>
                  <div 
                    className={`h-full transition-all duration-300 ${
                      newPassword && newPassword.length >= 8 ? 'bg-green-500' : 
                      newPassword && newPassword.length >= 6 ? 'bg-yellow-500' : 
                      newPassword ? 'bg-red-500' : ''
                    }`}
                    style={{ width: newPassword ? `${Math.min((newPassword.length / 8) * 100, 100)}%` : '0%' }}
                  ></div>
                </div>
                <p className={`text-xs sm:text-sm font-medium whitespace-nowrap ${newPassword && newPassword.length < 8 ? 'text-red-500' : 'text-green-600'}`}>
                  {newPassword ? `${newPassword.length}/8` : '0/8'}
                </p>
              </div>
              <p className={`text-xs sm:text-sm ${newPassword && newPassword.length < 8 ? 'text-red-500' : 'text-gray-500'}`}>
                {t('admin.reset.mustBeEightCharacters')}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 block">{t('admin.reset.confirmNewPassword')}</label>
              <div className="relative">
                <Input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('admin.reset.confirmNewPasswordPlaceholder')}
                  className="w-full h-10 sm:h-11 text-sm sm:text-base px-3 sm:px-4 pr-10 sm:pr-12 border-2 focus:border-orange-500 transition-colors"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 touch-manipulation"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {t('admin.profile.passwordsDoNotMatch')}
                </p>
              )}
              {newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                <p className="text-xs sm:text-sm text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('admin.reset.passwordsMatch')}
                </p>
              )}
            </div>
            {error && (
              <div className="p-2.5 sm:p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md text-xs sm:text-sm text-red-700 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="flex-1">{error}</span>
              </div>
            )}
            {success && (
              <div className="p-2.5 sm:p-3 bg-green-50 border-l-4 border-green-500 rounded-r-md text-xs sm:text-sm text-green-700 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="flex-1">{success}</span>
              </div>
            )}
            <Button 
              onClick={doReset} 
              disabled={loading || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword} 
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('admin.reset.resettingPassword')}
                </span>
              ) : (
                t('admin.reset.resetPassword')
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStep('verify');
                setNewPassword('');
                setConfirmPassword('');
                setError(null);
                setSuccess(null);
              }}
              className="w-full h-10 sm:h-11 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {t('admin.reset.back')}
            </Button>
          </div>
        )}
        </div>
      </Card>
    </div>
  );
}


