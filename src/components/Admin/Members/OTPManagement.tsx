"use client";

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export function OTPManagement() {
  const { t } = useLanguage();
  const { currentUser } = useAdmin();
  const { toast } = useToast();
  const isSuperAdmin = currentUser?.type === 'superadmin' || currentUser?.role === 'superadmin';
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch OTP settings
  const fetchOtpSettings = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/members/otp-settings', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success && data.settings) {
        setOtpEnabled(data.settings.otp_verification_enabled !== false);
      }
    } catch (err) {
      console.error('Failed to fetch OTP settings:', err);
      toast({
        title: t('admin.members.otp.error'),
        description: t('admin.members.otp.failedToLoad'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, toast]);

  // Update OTP settings
  const updateOtpSettings = async (enabled: boolean) => {
    if (!isSuperAdmin) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/members/otp-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ otp_verification_enabled: enabled })
      });
      const data = await response.json();
      if (data.success) {
        setOtpEnabled(enabled);
        toast({
          title: t('admin.members.otp.success'),
          description: enabled ? t('admin.members.otp.enabledSuccess') : t('admin.members.otp.disabledSuccess'),
        });
      } else {
        toast({
          title: t('admin.members.otp.error'),
          description: data.message || t('admin.members.otp.failedToUpdate'),
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Failed to update OTP settings:', err);
      toast({
        title: t('admin.members.otp.error'),
        description: t('admin.members.otp.failedToUpdate'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchOtpSettings();
  }, [fetchOtpSettings]);

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64 px-3 sm:px-0">
        <Alert className="border-red-200 bg-red-50 max-w-md w-full">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <AlertDescription className="text-xs sm:text-sm text-red-700 leading-relaxed">
              {t('admin.members.otp.accessDenied')}
            </AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 px-3 sm:px-0">
        <div className="text-center w-full">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4 text-orange-600" />
          <p className="text-xs sm:text-sm text-gray-600">{t('admin.members.otp.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-900">{t('admin.members.otp.title')}</h1>
        <p className="text-xs sm:text-sm md:text-base text-orange-700/80 mt-1 sm:mt-2">
          {t('admin.members.otp.subtitle')}
        </p>
      </div>

      {/* OTP Settings Card */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-white">
        <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-3">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <KeyRound className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg font-semibold text-orange-900 leading-tight">{t('admin.members.otp.statusTitle')}</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-orange-700/80 mt-1 leading-relaxed">
                  {t('admin.members.otp.statusDescription')}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-3 flex-shrink-0">
              <Label htmlFor="otp-toggle" className="text-xs sm:text-sm font-medium text-orange-900 cursor-pointer whitespace-nowrap">
                {otpEnabled ? t('admin.members.otp.enabled') : t('admin.members.otp.disabled')}
              </Label>
              <Switch
                id="otp-toggle"
                checked={otpEnabled}
                onCheckedChange={updateOtpSettings}
                disabled={saving}
                className="data-[state=checked]:bg-orange-600 flex-shrink-0"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3 sm:space-y-4 p-4 sm:p-6">
          <Alert className="bg-orange-50 border-orange-200">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <AlertDescription 
                className="text-xs sm:text-sm text-orange-800 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: otpEnabled 
                    ? t('admin.members.otp.enabledMessage')
                    : t('admin.members.otp.disabledMessage')
                }}
              />
            </div>
          </Alert>

          <div className="bg-white border border-orange-200 rounded-lg p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-orange-900 text-sm sm:text-base">{t('admin.members.otp.howItWorks')}</h3>
            <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-orange-800">
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">
                  <strong className="font-semibold">{t('admin.members.otp.whenEnabled')}</strong> {t('admin.members.otp.whenEnabledDesc')}
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">
                  <strong className="font-semibold">{t('admin.members.otp.whenDisabled')}</strong> {t('admin.members.otp.whenDisabledDesc')}
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">
                  <strong className="font-semibold">{t('admin.members.otp.defaultInitiator')}</strong> {t('admin.members.otp.defaultInitiatorDesc')}
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

