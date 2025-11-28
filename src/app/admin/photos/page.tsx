'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { EventPhotoManager } from '@/components/Admin/Photos/EventPhotoManager';
import { Camera, AlertCircle } from 'lucide-react';

export default function PhotosPage() {
  const { currentUser, hasPermission } = useAdmin();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check permissions and initialize
    setLoading(false);
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const canManagePhotos =
    hasPermission('manage_gallery') ||
    hasPermission('add_gallery') ||
    hasPermission('all');

  if (!canManagePhotos) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('admin.photos.accessDenied')}</h2>
          <p className="text-gray-600">
            {t('admin.photos.accessDenied')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Camera className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.photos.title')}</h1>
        </div>
        <p className="text-gray-600 max-w-3xl">
          {t('admin.photos.description')}
        </p>
      </div>
      <EventPhotoManager hasPermission={hasPermission} />
    </div>
  );
}
