"use client";

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminPageTitle } from '@/components/Admin/Layout/AdminPageTitle';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, RefreshCw, FileText, Trash2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface NewsEditor {
  id: number;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  appointmentDate: string;
  expiryDate: string | null;
  lastLogin: string | null;
}

export default function NewsEditorsManagementPage() {
  const { t } = useLanguage();
  const { currentUser } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [newsEditors, setNewsEditors] = useState<NewsEditor[]>([]);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEditor, setSelectedEditor] = useState<NewsEditor | null>(null);
  
  // Form states
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [tempPassword, setTempPassword] = useState<string>("");
  const [role, setRole] = useState<string>("news_editor");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe date parsing/formatting
  const parseDate = (value?: string | null) => {
    if (!value) return null;
    const iso = value.includes('T') ? value : value.replace(' ', 'T');
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (value?: string | null, pattern: string = 'dd MMM yyyy') => {
    const d = parseDate(value);
    return d ? format(d, pattern) : 'N/A';
  };

  // Generate random password
  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setTempPassword(password);
  };

  // Fetch news editors
  const fetchNewsEditors = useCallback(async () => {
    try {
      setLoading(true);
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();
      const timestamp = Date.now();
      
      const response = await fetch(`/api/admin/news-editors?_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch news editors');
      }
      
      const data = await response.json();
      if (data.success) {
        setNewsEditors(data.editors || []);
      }
    } catch (error) {
      console.error('Error fetching news editors:', error);
      toast.error(t('admin.newsEditors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (currentUser?.type === 'superadmin') {
      fetchNewsEditors();
    }
  }, [currentUser, fetchNewsEditors]);

  // Reload data when page becomes visible (user navigates back or refreshes)
  useEffect(() => {
    if (currentUser?.type !== 'superadmin') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNewsEditors();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, fetchNewsEditors]);

  // Create news editor
  const handleCreate = async () => {
    if (!email || !tempPassword) {
      toast.error(t('admin.newsEditors.emailPasswordRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();
      
      const response = await fetch('/api/admin/news-editors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({
          email,
          name: name || null,
          password: tempPassword,
          role: role || 'news_editor',
          expiryDate: expiryDate || null,
        }),
        cache: 'no-store',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(t('admin.newsEditors.createdSuccess'));
        setAddDialogOpen(false);
        setEmail('');
        setName('');
        setTempPassword('');
        setRole('news_editor');
        setExpiryDate('');
        // Immediately refetch to show updated data
        await fetchNewsEditors();
      } else {
        toast.error(data.message || t('admin.newsEditors.failedToCreate'));
      }
    } catch (error) {
      console.error('Error creating news editor:', error);
      toast.error(t('admin.newsEditors.failedToCreate'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete news editor
  const handleDelete = async () => {
    if (!selectedEditor) return;

    try {
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();
      
      const response = await fetch(`/api/admin/news-editors/${selectedEditor.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(t('admin.newsEditors.deletedSuccess'));
        setDeleteDialogOpen(false);
        setSelectedEditor(null);
        // Immediately refetch to show updated data
        await fetchNewsEditors();
      } else {
        toast.error(data.message || t('admin.newsEditors.failedToDelete'));
      }
    } catch (error) {
      console.error('Error deleting news editor:', error);
      toast.error(t('admin.newsEditors.failedToDelete'));
    }
  };

  // Toggle active status
  const handleToggleActive = async (editor: NewsEditor) => {
    try {
      const { getToken } = await import('@/lib/secure-storage');
      const token = getToken();
      
      const response = await fetch(`/api/admin/news-editors/${editor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({
          is_active: !editor.isActive,
        }),
        cache: 'no-store',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(!editor.isActive ? t('admin.newsEditors.activatedSuccess') : t('admin.newsEditors.deactivatedSuccess'));
        // Immediately refetch to show updated data
        await fetchNewsEditors();
      } else {
        toast.error(data.message || t('admin.newsEditors.failedToUpdate'));
      }
    } catch (error) {
      console.error('Error updating news editor:', error);
      toast.error(t('admin.newsEditors.failedToUpdate'));
    }
  };

  if (!currentUser || currentUser.type !== 'superadmin') {
    return (
      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm sm:text-base text-red-800">{t('admin.newsEditors.accessDenied')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6">
      <AdminPageTitle title={t('admin.newsEditors.title')} />
      
      <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-0">
        <p className="text-sm sm:text-base text-gray-600">{t('admin.newsEditors.description')}</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button 
            variant="outline"
            onClick={() => {
              setLoading(true);
              fetchNewsEditors();
            }}
            disabled={loading}
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setAddDialogOpen(true)} 
            className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {t('admin.newsEditors.createEditor')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-orange-600" />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block mt-6 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">{t('admin.newsEditors.name')}</TableHead>
                    <TableHead className="text-xs sm:text-sm">{t('admin.newsEditors.email')}</TableHead>
                    <TableHead className="text-xs sm:text-sm">{t('admin.newsEditors.role')}</TableHead>
                    <TableHead className="text-xs sm:text-sm">{t('admin.newsEditors.status')}</TableHead>
                    <TableHead className="text-xs sm:text-sm">{t('admin.newsEditors.appointed')}</TableHead>
                    <TableHead className="text-xs sm:text-sm">{t('admin.newsEditors.lastLogin')}</TableHead>
                    <TableHead className="text-xs sm:text-sm">{t('admin.newsEditors.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsEditors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8 text-sm">
                        {t('admin.newsEditors.noEditorsFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    newsEditors.map((editor) => (
                      <TableRow key={editor.id}>
                        <TableCell className="text-sm">{editor.name || 'N/A'}</TableCell>
                        <TableCell className="text-sm">{editor.email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {editor.role === 'news_reporter' ? t('admin.newsEditors.newsReporter') : t('admin.newsEditors.newsEditor')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              editor.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {editor.isActive ? t('admin.newsEditors.active') : t('admin.newsEditors.inactive')}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(editor.appointmentDate)}</TableCell>
                        <TableCell className="text-sm">{formatDate(editor.lastLogin) || t('admin.newsEditors.never')}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(editor)}
                              className="text-xs"
                            >
                              {editor.isActive ? t('admin.newsEditors.deactivate') : t('admin.newsEditors.activate')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEditor(editor);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden mt-4 sm:mt-6 space-y-3">
            {newsEditors.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <p className="text-sm text-gray-500">{t('admin.newsEditors.noEditorsFound')}</p>
              </div>
            ) : (
              newsEditors.map((editor) => (
                <div key={editor.id} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{editor.name || 'N/A'}</h3>
                        <p className="text-sm text-gray-600 truncate">{editor.email}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ml-2 ${
                          editor.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {editor.isActive ? t('admin.newsEditors.active') : t('admin.newsEditors.inactive')}
                      </span>
                    </div>

                    {/* Role */}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">{t('admin.newsEditors.role')}</p>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        {editor.role === 'news_reporter' ? t('admin.newsEditors.newsReporter') : t('admin.newsEditors.newsEditor')}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('admin.newsEditors.appointed')}</p>
                        <p className="text-sm text-gray-900">{formatDate(editor.appointmentDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('admin.newsEditors.lastLogin')}</p>
                        <p className="text-sm text-gray-900">{formatDate(editor.lastLogin) || t('admin.newsEditors.never')}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(editor)}
                        className="flex-1 text-xs"
                      >
                        {editor.isActive ? t('admin.newsEditors.deactivate') : t('admin.newsEditors.activate')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEditor(editor);
                          setDeleteDialogOpen(true);
                        }}
                        className="flex-1 text-red-600 hover:text-red-800 hover:bg-red-50 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        {t('admin.newsEditors.delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{t('admin.newsEditors.createDialogTitle')}</DialogTitle>
            <DialogDescription className="text-sm">
              {t('admin.newsEditors.createDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6 py-4">
            <div>
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium">{t('admin.newsEditors.emailRequired')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('admin.newsEditors.emailPlaceholder')}
                className="mt-1 h-9 sm:h-10 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="name" className="text-xs sm:text-sm font-medium">{t('admin.newsEditors.nameOptional')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('admin.newsEditors.namePlaceholder')}
                className="mt-1 h-9 sm:h-10 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="role" className="text-xs sm:text-sm font-medium">{t('admin.newsEditors.roleLabel')}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news_editor">{t('admin.newsEditors.newsEditor')}</SelectItem>
                  <SelectItem value="news_reporter">{t('admin.newsEditors.newsReporter')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium">{t('admin.newsEditors.passwordLabel')}</Label>
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <Input
                  id="password"
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder={t('admin.newsEditors.passwordPlaceholder')}
                  className="h-9 sm:h-10 text-sm flex-1"
                />
                <Button type="button" variant="outline" onClick={generatePassword} className="h-9 sm:h-10 text-xs sm:text-sm whitespace-nowrap">
                  {t('admin.newsEditors.generate')}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('admin.newsEditors.passwordNote')}
              </p>
            </div>
            
            <div>
              <Label htmlFor="expiryDate" className="text-xs sm:text-sm font-medium">{t('admin.newsEditors.expiryDate')}</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1 h-9 sm:h-10 text-sm"
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="w-full sm:w-auto" size="sm">
              {t('admin.newsEditors.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !email || !tempPassword}
              className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
              size="sm"
            >
              {isSubmitting ? t('admin.newsEditors.creating') : t('admin.newsEditors.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{t('admin.newsEditors.deleteDialogTitle')}</DialogTitle>
            <DialogDescription className="text-sm">
              {t('admin.newsEditors.deleteDialogDescription').replace('{email}', selectedEditor?.email || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="w-full sm:w-auto" size="sm">
              {t('admin.newsEditors.cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              size="sm"
            >
              {t('admin.newsEditors.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

