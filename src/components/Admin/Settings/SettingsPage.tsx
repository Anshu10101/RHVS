"use client";

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Lock,
  Globe,
  Bell,
  Shield,
  Database,
  Info,
  Save,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Activity,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SettingsPage() {
  const { currentUser, hasPermission } = useAdmin();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile settings
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  
  // System info
  const [systemInfo, setSystemInfo] = useState<{
    totalMembers: number;
    totalAdmins: number;
    totalDepartments: number;
    databaseSize: string;
    lastBackup: string | null;
  } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileEmail(currentUser.email || '');
      // Load additional profile data if available
      fetchSystemInfo();
    }
  }, [currentUser]);

  const fetchSystemInfo = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings/system-info', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (data.success) {
        setSystemInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching system info:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileName || !profileEmail) {
      toast({
        title: t('admin.settings.error') || 'Error',
        description: t('admin.settings.fillRequiredFields') || 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: t('admin.settings.success') || 'Success',
          description: t('admin.settings.profileUpdated') || 'Profile updated successfully',
        });
        // Refresh user data
        window.location.reload();
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast({
        title: t('admin.settings.error') || 'Error',
        description: error instanceof Error ? error.message : t('admin.settings.failedToUpdate') || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: t('admin.settings.error') || 'Error',
        description: t('admin.settings.fillAllPasswordFields') || 'Please fill all password fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('admin.settings.error') || 'Error',
        description: t('admin.settings.passwordsDoNotMatch') || 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: t('admin.settings.error') || 'Error',
        description: t('admin.settings.passwordMinLength') || 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'change-password',
          data: {
            currentPassword,
            newPassword,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: t('admin.settings.success') || 'Success',
          description: t('admin.settings.passwordChanged') || 'Password changed successfully',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error) {
      toast({
        title: t('admin.settings.error') || 'Error',
        description: error instanceof Error ? error.message : t('admin.settings.failedToChangePassword') || 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      // Save preferences to localStorage or API
      localStorage.setItem('emailNotifications', String(emailNotifications));
      localStorage.setItem('systemNotifications', String(systemNotifications));
      
      toast({
        title: t('admin.settings.success') || 'Success',
        description: t('admin.settings.preferencesSaved') || 'Preferences saved successfully',
      });
    } catch (error) {
      toast({
        title: t('admin.settings.error') || 'Error',
        description: t('admin.settings.failedToSavePreferences') || 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('admin.settings.title') || 'Settings'}</h1>
          <p className="text-sm md:text-base text-gray-600">{t('admin.settings.subtitle') || 'Manage your account settings and preferences'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-orange-600" />
                {t('admin.settings.profileSettings') || 'Profile Settings'}
              </CardTitle>
              <CardDescription>
                {t('admin.settings.profileSettingsDesc') || 'Update your personal information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm">{t('admin.settings.fullName') || 'Full Name'} *</Label>
                  <Input
                    id="name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder={t('admin.settings.fullNamePlaceholder') || 'Enter your full name'}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm">{t('admin.settings.email') || 'Email Address'} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder={t('admin.settings.emailPlaceholder') || 'Enter your email'}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm">{t('admin.settings.phone') || 'Phone Number'}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder={t('admin.settings.phonePlaceholder') || 'Enter your phone number'}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleUpdateProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('admin.settings.saving') || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('admin.settings.saveProfile') || 'Save Profile'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-600" />
                {t('admin.settings.changePassword') || 'Change Password'}
              </CardTitle>
              <CardDescription>
                {t('admin.settings.changePasswordDesc') || 'Update your password to keep your account secure'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-sm">{t('admin.settings.currentPassword') || 'Current Password'} *</Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('admin.settings.currentPasswordPlaceholder') || 'Enter current password'}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-sm">{t('admin.settings.newPassword') || 'New Password'} *</Label>
                <Input
                  id="newPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('admin.settings.newPasswordPlaceholder') || 'Enter new password (min 8 characters)'}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-sm">{t('admin.settings.confirmPassword') || 'Confirm New Password'} *</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('admin.settings.confirmPasswordPlaceholder') || 'Confirm new password'}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleChangePassword} disabled={saving} variant="outline">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('admin.settings.changing') || 'Changing...'}
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      {t('admin.settings.changePassword') || 'Change Password'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                {t('admin.settings.preferences') || 'Preferences'}
              </CardTitle>
              <CardDescription>
                {t('admin.settings.preferencesDesc') || 'Customize your experience'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="language" className="text-sm">{t('admin.settings.language') || 'Language'}</Label>
                  <p className="text-xs text-gray-500">{t('admin.settings.languageDesc') || 'Choose your preferred language'}</p>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिंदी</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications" className="text-sm">{t('admin.settings.emailNotifications') || 'Email Notifications'}</Label>
                  <p className="text-xs text-gray-500">{t('admin.settings.emailNotificationsDesc') || 'Receive email notifications for important updates'}</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="systemNotifications" className="text-sm">{t('admin.settings.systemNotifications') || 'System Notifications'}</Label>
                  <p className="text-xs text-gray-500">{t('admin.settings.systemNotificationsDesc') || 'Show in-app notifications'}</p>
                </div>
                <Switch
                  id="systemNotifications"
                  checked={systemNotifications}
                  onCheckedChange={setSystemNotifications}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSavePreferences} disabled={saving} size="sm">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('admin.settings.saving') || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('admin.settings.save') || 'Save'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 md:space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-orange-600" />
                {t('admin.settings.accountInfo') || 'Account Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="h-3.5 w-3.5" />
                  {t('admin.settings.role') || 'Role'}
                </div>
                <p className="text-sm font-medium text-gray-900 capitalize">{currentUser.type}</p>
              </div>
              {currentUser.district && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {t('admin.settings.district') || 'District'}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{currentUser.district}</p>
                </div>
              )}
              {currentUser.state && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {t('admin.settings.state') || 'State'}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{currentUser.state}</p>
                </div>
              )}
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail className="h-3.5 w-3.5" />
                  {t('admin.settings.email') || 'Email'}
                </div>
                <p className="text-sm font-medium text-gray-900 break-all">{currentUser.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          {hasPermission('view_analytics') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-orange-600" />
                  {t('admin.settings.systemInfo') || 'System Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemInfo ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{t('admin.settings.totalMembers') || 'Total Members'}</span>
                      <span className="text-sm font-semibold">{systemInfo.totalMembers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{t('admin.settings.totalAdmins') || 'Total Admins'}</span>
                      <span className="text-sm font-semibold">{systemInfo.totalAdmins}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{t('admin.settings.totalDepartments') || 'Departments'}</span>
                      <span className="text-sm font-semibold">{systemInfo.totalDepartments}</span>
                    </div>
                    <Separator />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchSystemInfo}
                      className="w-full"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-2" />
                      {t('admin.settings.refresh') || 'Refresh'}
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                {t('admin.settings.quickActions') || 'Quick Actions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hasPermission('view_logs') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/logs')}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {t('admin.settings.viewActivityLogs') || 'View Activity Logs'}
                </Button>
              )}
              {currentUser.type === 'superadmin' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/permissions')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {t('admin.settings.managePermissions') || 'Manage Permissions'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push('/admin/help')}
              >
                <Info className="h-4 w-4 mr-2" />
                {t('admin.settings.helpGuide') || 'Help Guide'}
              </Button>
            </CardContent>
          </Card>

          {/* Security Tips */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2 text-orange-900">
                <Shield className="h-5 w-5" />
                {t('admin.settings.securityTips') || 'Security Tips'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-orange-800">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{t('admin.settings.tip1') || 'Use a strong, unique password'}</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{t('admin.settings.tip2') || 'Change your password regularly'}</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{t('admin.settings.tip3') || 'Never share your login credentials'}</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>{t('admin.settings.tip4') || 'Log out when using shared devices'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

