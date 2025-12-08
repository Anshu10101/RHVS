"use client";

import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Lock, Mail, Calendar, Shield, MapPin, Eye, EyeOff, Camera, Upload } from 'lucide-react';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { currentUser, refreshData } = useAdmin();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  if (!currentUser) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();

      if (!token) {
        throw new Error(t('admin.profile.notAuthenticated'));
      }

      const res = await fetch(`/api/admin/password?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          action: 'change-password',
          data: {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          },
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || t('admin.profile.failedToUpdatePassword'));
      }

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      alert(t('admin.profile.passwordUpdatedSuccess'));
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error instanceof Error ? error.message : t('admin.profile.failedToUpdatePassword');
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) {
      alert(t('admin.profile.emailNotFound'));
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch(`/api/admin/password?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
        body: JSON.stringify({
          action: 'forgot',
          data: { 
            email: currentUser.email,
            userType: currentUser.type,
            state: currentUser.state,
          },
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || t('admin.profile.failedToSendResetOtp'));
      }

      // Store token in sessionStorage so reset page can use it
      if (result.token) {
        sessionStorage.setItem('password_reset_token', result.token);
        sessionStorage.setItem('password_reset_email', currentUser.email);
      }

      alert(t('admin.profile.resetOtpSent'));
      // Redirect to reset page - it will detect the token and show OTP input
      window.location.href = '/admin/reset';
    } catch (error) {
      console.error('Error requesting password reset:', error);
      const errorMessage = error instanceof Error ? error.message : t('admin.profile.failedToSendResetOtp');
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('admin.profile.selectImageFile'));
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      alert(t('admin.profile.fileSizeError').replace('{size}', fileSizeMB));
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload directly to superadmin profile
    setUploadingPhoto(true);
    try {
      // Get auth token
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();

      if (!token) {
        throw new Error(t('admin.profile.notAuthenticated'));
      }

      const formData = new FormData();
      formData.append('file', file);

      const saveResponse = await fetch(`/api/admin/profile/photo?_t=${Date.now()}`, {
        method: 'POST',
        body: formData,
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({ message: 'Unknown error occurred' }));
        const errorMessage = errorData.message || errorData.error || `Server error: ${saveResponse.status} ${saveResponse.statusText}`;
        console.error('Profile photo upload failed:', {
          status: saveResponse.status,
          statusText: saveResponse.statusText,
          error: errorData
        });
        throw new Error(errorMessage);
      }

      const result = await saveResponse.json();
      
      if (!result.success) {
        throw new Error(result.message || t('admin.profile.failedToUploadPhoto'));
      }

      // Refresh user data to get updated photo
      if (refreshData) {
        await refreshData();
        // Force a small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Force reload to ensure image cache is cleared
      window.location.reload();
    } catch (error) {
      console.error('Error uploading photo:', error);
      const errorMessage = error instanceof Error ? error.message : t('admin.profile.failedToUploadPhoto');
      alert(errorMessage);
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin.profile.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.profile.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('admin.profile.profileDetails')}
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('admin.profile.passwordManagement')}
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Profile Photo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
              <div className="relative group flex-shrink-0">
                {photoPreview || currentUser.profilePhoto ? (
                  <img
                    src={photoPreview || currentUser.profilePhoto || ''}
                    alt="Profile"
                    className="h-20 w-20 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-20 w-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold text-2xl">
                    {currentUser.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                {(currentUser.type === 'superadmin' || currentUser.type === 'news_editor' || currentUser.role === 'news_editor' || currentUser.role === 'news_reporter') && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="profile-photo-upload"
                      disabled={uploadingPhoto}
                    />
                    <label
                      htmlFor="profile-photo-upload"
                      className={`absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
                        uploadingPhoto ? 'opacity-100 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploadingPhoto ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </label>
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 break-words">{currentUser.name}</h3>
                <p className="text-sm text-gray-500 break-all">{currentUser.email}</p>
                {(currentUser.type === 'superadmin' || currentUser.type === 'news_editor' || currentUser.role === 'news_editor' || currentUser.role === 'news_reporter') && (
                  <button
                    onClick={() => document.getElementById('profile-photo-upload')?.click()}
                    disabled={uploadingPhoto}
                    className="mt-2 text-xs text-orange-600 hover:text-orange-700 flex items-center space-x-1 disabled:opacity-50"
                  >
                    <Upload className="h-3 w-3 flex-shrink-0" />
                    <span>{uploadingPhoto ? t('admin.profile.uploading') : t('admin.profile.uploadPhoto')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* User Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{t('admin.profile.emailAddress')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-900 break-all">{currentUser.email}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span>{t('admin.profile.role')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-900">
                    {currentUser.type === 'superadmin' ? t('admin.profile.superadmin') : 
                     currentUser.type === 'district_admin' ? t('admin.profile.districtAdmin') : 
                     currentUser.role?.toUpperCase() || 'N/A'}
                  </p>
                </CardContent>
              </Card>

              {currentUser.district && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{t('admin.profile.district')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-900">{currentUser.district}</p>
                  </CardContent>
                </Card>
              )}

              {currentUser.state && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{t('admin.profile.state')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-900">{currentUser.state}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{t('admin.profile.accountCreated')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-900">
                    {formatDate(currentUser.createdAt)}
                  </p>
                </CardContent>
              </Card>

              {currentUser.addedBy && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{t('admin.profile.addedBy')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-900">{currentUser.addedBy}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Permissions */}
            {currentUser.permissions && currentUser.permissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">{t('admin.profile.permissions')}</CardTitle>
                  <CardDescription>{t('admin.profile.yourCurrentPermissions')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.permissions.map((permission, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('admin.profile.changePassword')}</CardTitle>
                <CardDescription>
                  {t('admin.profile.updatePasswordDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">{t('admin.profile.currentPassword')}</Label>
                    <div className="relative mt-1">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">{t('admin.profile.newPassword')}</Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('admin.profile.passwordMinLength')}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">{t('admin.profile.confirmNewPassword')}</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordData.newPassword &&
                      passwordData.confirmPassword &&
                      passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">
                          {t('admin.profile.passwordsDoNotMatch')}
                        </p>
                      )}
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      passwordData.newPassword !== passwordData.confirmPassword ||
                      passwordData.newPassword.length < 8
                    }
                    className="w-full"
                  >
                    {loading ? t('admin.profile.updating') : t('admin.profile.updatePassword')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Reset Password */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-base text-orange-900">{t('admin.profile.resetPassword')}</CardTitle>
                <CardDescription className="text-orange-700">
                  {t('admin.profile.requestResetLink')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handlePasswordReset}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  {loading ? t('admin.profile.sending') : t('admin.profile.sendPasswordResetLink')}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

