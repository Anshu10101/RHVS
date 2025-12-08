"use client";

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Download,
  RefreshCw,
  Users,
  TrendingUp,
  Building2,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  father_husband_name: string;
  mother_wife_name: string;
  registration_date: string;
  existing_member_reg_number: string;
  profile_photo_path?: string;
  member_reg_number: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'verified' | 'rejected';
  state?: string;
  district?: string;
  departments?: string; // This will contain the formatted department assignments
  verified_by_member_id?: number;
  verified_by_name?: string;
  aadhar_card_number?: string;
}

interface MemberStats {
  total: number;
  status: {
    verified: number;
    pending: number;
    rejected: number;
  };
  states: Array<{ state: string; count: number }>;
  districts: Array<{ district: string; count: number }>;
  departments: Array<{ department: string; count: number }>;
  recent: number;
  monthly: number;
  verification: {
    total_verified: number;
    verified_by_members: number;
    verified_by_admin: number;
  };
}

export function MemberManagement() {
  const { t } = useLanguage();
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regNumberSearch, setRegNumberSearch] = useState('');
  // Local states for immediate input updates (prevents focus loss during typing)
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localRegNumberSearch, setLocalRegNumberSearch] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [states, setStates] = useState<Array<{id: number, name: string}>>([]);
  const [districts, setDistricts] = useState<Array<{id: string, name: string}>>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setRegNumberSearch('');
    setLocalSearchTerm('');
    setLocalRegNumberSearch('');
    setSelectedState('all');
    setSelectedDistrict('all');
    setSelectedDepartment('all');
    setSelectedStatus('all');
    setCurrentPage(1);
  };

  // Helper function to validate and normalize image URL
  const getValidImageUrl = (url: string | undefined | null): string | null => {
    if (!url || url.trim() === '') return null;
    
    const trimmedUrl = url.trim();
    
    // If it's already a valid absolute URL, return as is
    if (trimmedUrl.startsWith('http')) {
      return trimmedUrl;
    }
    
    // If it starts with /, it's already a valid path
    if (trimmedUrl.startsWith('/')) {
      return trimmedUrl;
    }
    
    // If it's a relative path with file extension, add leading slash
    if (trimmedUrl.includes('.') && (trimmedUrl.includes('/') || trimmedUrl.includes('\\'))) {
      return `/${trimmedUrl}`;
    }
    
    return null;
  };

  // Helper function to check if image URL is valid
  const isValidImageUrl = (url: string | undefined | null): boolean => {
    return getValidImageUrl(url) !== null;
  };

  // Fetch members data
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        regNumber: regNumberSearch,
        status: selectedStatus === 'all' ? '' : selectedStatus,
        state: selectedState === 'all' ? '' : selectedState,
        district: selectedDistrict === 'all' ? '' : selectedDistrict,
        department: selectedDepartment === 'all' ? '' : selectedDepartment,
        sortBy: 'created_at',
        sortOrder: 'DESC',
        _t: Date.now().toString() // Cache-busting
      });

      console.log('MemberManagement: Fetching members with params:', params.toString());
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/members?${params}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      console.log('MemberManagement: Response status:', response.status, response.ok);
      const data = await response.json();
      console.log('MemberManagement: Response data:', data);

      if (data.success) {
        setMembers(data.data.members);
        setTotalPages(data.data.pagination.totalPages);
        setTotalMembers(data.data.pagination.total || 0);
      } else {
        setError(data.error || 'Failed to fetch members');
      }
    } catch (err) {
      setError('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, regNumberSearch, selectedStatus, selectedState, selectedDistrict, selectedDepartment]);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/members/stats?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch states
  const fetchStates = async () => {
    try {
      const response = await fetch('/api/states');
      const data = await response.json();
      if (data.success) {
        setStates(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch states:', err);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/members/departments?_t=${Date.now()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  // Fetch districts based on selected state
  const fetchDistricts = async (stateId: string) => {
    if (!stateId || stateId === 'all') {
      setDistricts([]);
      return;
    }

    try {
      setLoadingDistricts(true);
      const response = await fetch(`/api/districts?stateId=${stateId}`);
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data.map((district: { id: string | number; name: string }) => ({
          id: district.id,
          name: district.name
        })));
      } else {
        setDistricts([]);
      }
    } catch (err) {
      console.error('Failed to fetch districts:', err);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchStates();
    fetchDepartments();
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    fetchDistricts(selectedState);
    // Reset district selection when state changes
    if (selectedState !== 'all') {
      setSelectedDistrict('all');
    }
  }, [selectedState]);

  // Debounce search terms to prevent excessive API calls and focus loss
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
        setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRegNumberSearch(localRegNumberSearch);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [localRegNumberSearch]);

  // Load data when filters change (excluding search terms which are debounced above)
  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, regNumberSearch, selectedStatus, selectedState, selectedDistrict, selectedDepartment]);


  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 500KB)
      if (file.size > 500 * 1024) {
        alert('Profile photo size must be less than 500KB');
        e.target.value = '';
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        e.target.value = '';
        return;
      }
      
      setProfilePhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;

    const formData = new FormData(e.currentTarget);
    
    // Upload profile photo if provided
    let profilePhotoPath: string | null = null;
    if (profilePhoto) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', profilePhoto);
        
        const uploadResponse = await fetch('/api/upload/profile', {
          method: 'POST',
          body: uploadFormData,
        });
        
        const uploadResult = await uploadResponse.json();
        if (uploadResult.success && uploadResult.url) {
          profilePhotoPath = uploadResult.url;
        } else {
          setError('Failed to upload profile photo: ' + (uploadResult.error || 'Unknown error'));
          return;
        }
      } catch (err) {
        setError('Failed to upload profile photo');
        return;
      }
    }

    const updateData: any = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      father_husband_name: formData.get('father_husband_name') as string,
      mother_wife_name: formData.get('mother_wife_name') as string,
      status: formData.get('status') as string,
      aadhar_card_number: formData.get('aadhar_card_number') as string,
    };

    // Only include profile_photo_path if a new photo was uploaded
    if (profilePhotoPath) {
      updateData.profile_photo_path = profilePhotoPath;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/members/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        // Force refresh members list to show updated image
        await fetchMembers();
        fetchStats();
        // If member details modal is open, refresh that member's data too
        if (selectedMember && selectedMember.id === editingMember.id) {
          try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`/api/admin/members/${editingMember.id}?_t=${Date.now()}`, {
              cache: 'no-store',
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                setSelectedMember(data.data as Member);
              }
            }
          } catch (err) {
            console.error('Failed to refresh member details:', err);
          }
        }
        setShowEditModal(false);
        setEditingMember(null);
        setProfilePhoto(null);
        setProfilePhotoPreview(null);
        setError(null);
      } else {
        setError(data.error || 'Failed to update member');
      }
    } catch (err) {
      setError('Failed to update member');
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      });

      const data = await response.json();
      if (data.success) {
        fetchMembers();
        fetchStats();
        setError(null);
      } else {
        setError(data.error || 'Failed to delete member');
      }
    } catch (err) {
      setError('Failed to delete member');
    }
  };

  const handleStatusChange = async (memberId: number, status: 'pending' | 'verified' | 'rejected') => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        fetchMembers();
        fetchStats();
        setError(null);
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />{t('admin.members.verified')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />{t('admin.members.pending')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />{t('admin.members.rejected')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };


  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">{t('admin.members.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-orange-900">{t('admin.members.title')}</h1>
          <p className="text-sm sm:text-base text-orange-700/80 mt-1">{t('admin.members.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={fetchMembers}
            disabled={loading}
            size="sm"
            className="w-full sm:w-auto border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.members.refresh')}
          </Button>
          <Link href="/admin/members/add" className="w-full sm:w-auto cursor-pointer">
            <Button
              size="sm"
              className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-4 sm:px-6 py-2.5 font-medium cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.members.addMember')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg flex-shrink-0">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">{t('admin.members.totalMembers')}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">{t('admin.members.verified')}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.status.verified || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">{t('admin.members.recent30Days')}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.recent || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-600 truncate">{t('admin.members.thisMonth')}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.monthly}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filters Section - Combined */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm font-semibold text-orange-900 flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t('admin.members.searchMembers')} & {t('admin.members.filterMembers')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-3 space-y-3">
          {/* Search inputs - compact row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('admin.members.searchPlaceholder')}
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  id="regNumber"
                  placeholder={t('admin.members.searchByRegNumberPlaceholder')}
                  value={localRegNumberSearch}
                  onChange={(e) => setLocalRegNumberSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Filters - compact grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={t('admin.members.allStates')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.members.allStates')}</SelectItem>
                  {states.map(state => (
                    <SelectItem key={state.id} value={state.id.toString()}>{state.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={selectedDistrict} 
                onValueChange={setSelectedDistrict}
                disabled={!selectedState || selectedState === 'all' || loadingDistricts}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={
                    !selectedState || selectedState === 'all' 
                      ? t('admin.members.selectStateFirst')
                      : loadingDistricts 
                        ? t('admin.members.loadingDistricts')
                        : t('admin.members.allDistricts')
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.members.allDistricts')}</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={t('admin.members.allDepartments')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.members.allDepartments')}</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={t('admin.members.allStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.members.allStatus')}</SelectItem>
                  <SelectItem value="verified">{t('admin.members.verified')}</SelectItem>
                  <SelectItem value="pending">{t('admin.members.pending')}</SelectItem>
                  <SelectItem value="rejected">{t('admin.members.rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 sm:col-span-1 lg:col-span-2 flex gap-2">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                size="sm"
                className="flex-1 h-8 px-3 text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                {t('admin.members.clearFilters')}
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchMembers}
                size="sm"
                className="flex-1 h-8 px-3 text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                <Filter className="h-3 w-3 mr-1.5" />
                {t('admin.members.applyFilters')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">{t('admin.members.membersList')}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t('admin.members.showing')} {members.length} {t('admin.members.results')} ({t('admin.members.page')} {currentPage} {t('admin.members.pageOf')} {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.members.member')}
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.members.contact')}
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ maxWidth: '350px' }}>
                    {t('admin.members.location')}
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.members.status')}
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.members.registration')}
                  </th>
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.members.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {isValidImageUrl(member.profile_photo_path) ? (
                            <Image
                              src={`${getValidImageUrl(member.profile_photo_path)!}?_t=${member.updated_at || Date.now()}`}
                              alt={member.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                              key={`list-photo-${member.id}-${member.updated_at}`}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span 
                            className="text-orange-600 font-semibold text-sm"
                            style={{ display: !isValidImageUrl(member.profile_photo_path) ? 'block' : 'none' }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3 xl:ml-4 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {member.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">
                            {member.member_reg_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate">{member.email}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{member.phone}</div>
                    </td>
                    <td className="px-4 xl:px-6 py-4" style={{ maxWidth: '350px', wordWrap: 'break-word' }}>
                      <div className="text-sm text-gray-900">{member.state || t('admin.members.na')}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{member.district || t('admin.members.na')}</div>
                      {member.departments ? (
                        <div 
                          className="text-xs sm:text-sm text-blue-600 font-medium break-words leading-relaxed" 
                          style={{ 
                            maxHeight: '4.5em',
                            overflowY: 'auto',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere'
                          }}
                          title={member.departments}
                        >
                          {member.departments}
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-gray-400 italic">{t('admin.members.noAssignments')}</div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(member.registration_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">
                        {member.verified_by_name ? `${t('admin.members.verifiedBy')} ${member.verified_by_name}` : t('admin.members.adminVerified')}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-1 xl:space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            // Fetch fresh member data to ensure we have latest photo
                            try {
                              const token = localStorage.getItem('admin_token');
                              const response = await fetch(`/api/admin/members/${member.id}?_t=${Date.now()}`, {
                                cache: 'no-store',
                                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                              });
                              if (response.ok) {
                                const data = await response.json();
                                if (data.success && data.data) {
                                  setSelectedMember(data.data as Member);
                                  return;
                                }
                              }
                            } catch (err) {
                              console.error('Failed to fetch member details:', err);
                            }
                            // Fallback to using member from list
                            setSelectedMember(member);
                          }}
                          className="cursor-pointer h-8 w-8 p-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            // Reset photo state when opening edit modal
                            setProfilePhoto(null);
                            setProfilePhotoPreview(null);
                            // Fetch full member data to ensure we have aadhar_card_number
                            try {
                              const token = localStorage.getItem('admin_token');
                              const response = await fetch(`/api/admin/members/${member.id}`, {
                                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                              });
                              if (response.ok) {
                                const data = await response.json();
                                if (data.success && data.data) {
                                  setEditingMember(data.data as Member);
                                  setShowEditModal(true);
                                  return;
                                }
                              }
                            } catch (err) {
                              console.error('Failed to fetch member details:', err);
                            }
                            // Fallback to using member from list
                            setEditingMember(member);
                            setShowEditModal(true);
                          }}
                          className="cursor-pointer h-8 w-8 p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        {member.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(member.id, 'verified')}
                              className="text-green-600 hover:text-green-700 cursor-pointer h-8 w-8 p-0"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(member.id, 'rejected')}
                              className="text-red-600 hover:text-red-700 cursor-pointer h-8 w-8 p-0"
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600 hover:text-red-700 cursor-pointer h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-3">
            {members.map((member) => (
              <Card key={member.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Member Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {isValidImageUrl(member.profile_photo_path) ? (
                            <Image
                              src={`${getValidImageUrl(member.profile_photo_path)!}?_t=${member.updated_at || Date.now()}`}
                              alt={member.name}
                              width={48}
                              height={48}
                              className="rounded-full object-cover"
                              key={`card-photo-${member.id}-${member.updated_at}`}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span 
                            className="text-orange-600 font-semibold text-base"
                            style={{ display: !isValidImageUrl(member.profile_photo_path) ? 'block' : 'none' }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{member.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{member.member_reg_number}</p>
                          <div className="mt-1">{getStatusBadge(member.status)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                      <div className="flex items-start space-x-2">
                        <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">{t('admin.members.email')}</p>
                          <p className="text-sm text-gray-900 truncate">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">{t('admin.members.phone')}</p>
                          <p className="text-sm text-gray-900">{member.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start space-x-2 pt-2 border-t border-gray-100">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">{t('admin.members.location')}</p>
                        <p className="text-sm text-gray-900">{member.state || t('admin.members.na')}, {member.district || t('admin.members.na')}</p>
                        {member.departments ? (
                          <p 
                            className="text-xs text-blue-600 font-medium mt-1 break-words leading-relaxed" 
                            style={{ 
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere'
                            }}
                            title={member.departments}
                          >
                            {member.departments}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic mt-1">{t('admin.members.noAssignments')}</p>
                        )}
                      </div>
                    </div>

                    {/* Registration */}
                    <div className="flex items-start space-x-2 pt-2 border-t border-gray-100">
                      <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">{t('admin.members.registration')}</p>
                        <p className="text-sm text-gray-900">
                          {new Date(member.registration_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {member.verified_by_name ? `${t('admin.members.verifiedBy')} ${member.verified_by_name}` : t('admin.members.adminVerified')}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          // Fetch fresh member data to ensure we have latest photo
                          try {
                            const token = localStorage.getItem('admin_token');
                            const response = await fetch(`/api/admin/members/${member.id}?_t=${Date.now()}`, {
                              cache: 'no-store',
                              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                            });
                            if (response.ok) {
                              const data = await response.json();
                              if (data.success && data.data) {
                                setSelectedMember(data.data as Member);
                                return;
                              }
                            }
                          } catch (err) {
                            console.error('Failed to fetch member details:', err);
                          }
                          // Fallback to using member from list
                          setSelectedMember(member);
                        }}
                        className="flex-1 sm:flex-none cursor-pointer text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        {t('admin.members.view')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          // Reset photo state when opening edit modal
                          setProfilePhoto(null);
                          setProfilePhotoPreview(null);
                          // Fetch full member data to ensure we have aadhar_card_number
                          try {
                            const token = localStorage.getItem('admin_token');
                            const response = await fetch(`/api/admin/members/${member.id}`, {
                              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                            });
                            if (response.ok) {
                              const data = await response.json();
                              if (data.success && data.data) {
                                setEditingMember(data.data as Member);
                                setShowEditModal(true);
                                return;
                              }
                            }
                          } catch (err) {
                            console.error('Failed to fetch member details:', err);
                          }
                          // Fallback to using member from list
                          setEditingMember(member);
                          setShowEditModal(true);
                        }}
                        className="flex-1 sm:flex-none cursor-pointer text-xs"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        {t('admin.members.edit')}
                      </Button>
                      {member.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(member.id, 'verified')}
                            className="flex-1 sm:flex-none text-green-600 hover:text-green-700 cursor-pointer text-xs"
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                            {t('admin.members.verify')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(member.id, 'rejected')}
                            className="flex-1 sm:flex-none text-red-600 hover:text-red-700 cursor-pointer text-xs"
                          >
                            <UserX className="h-3.5 w-3.5 mr-1.5" />
                            {t('admin.members.reject')}
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMember(member.id)}
                        className="flex-1 sm:flex-none text-red-600 hover:text-red-700 cursor-pointer text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        {t('admin.members.delete')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-gray-200">
              {/* Page info */}
              <div className="flex items-center justify-center text-sm text-gray-600">
                {t('admin.members.showing')} {totalMembers > 0 ? ((currentPage - 1) * 10) + 1 : 0} - {Math.min(currentPage * 10, totalMembers)} {t('admin.members.of')} {totalMembers} {t('admin.members.results')} ({t('admin.members.page')} {currentPage} {t('admin.members.pageOf')} {totalPages})
              </div>
              
              {/* Pagination controls */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                {/* Previous button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage > 1 && !loading) {
                      setCurrentPage(prev => prev - 1);
                    }
                  }}
                  disabled={currentPage === 1 || loading}
                  className="w-full sm:w-auto min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('admin.members.previous')}
                </Button>

                {/* Page numbers - Desktop view */}
                <div className="hidden sm:flex items-center gap-1">
                  {/* First page */}
                  {currentPage > 3 && totalPages > 5 && (
                    <>
                      <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => !loading && setCurrentPage(1)}
                        disabled={loading}
                        className="min-w-[40px] h-9 disabled:opacity-50"
                      >
                        1
                      </Button>
                      {currentPage > 4 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                    </>
                  )}

                  {/* Page range around current page */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (pageNum !== currentPage && !loading) {
                            setCurrentPage(pageNum);
                          }
                        }}
                        disabled={loading}
                        className="min-w-[40px] h-9 disabled:opacity-50"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  {/* Last page */}
                  {currentPage < totalPages - 2 && totalPages > 5 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => !loading && setCurrentPage(totalPages)}
                        disabled={loading}
                        className="min-w-[40px] h-9 disabled:opacity-50"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                {/* Mobile view - Current page indicator */}
                <div className="sm:hidden flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {t('admin.members.page')} {currentPage} / {totalPages}
                  </span>
                </div>

                {/* Next button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage < totalPages && !loading) {
                      setCurrentPage(prev => prev + 1);
                    }
                  }}
                  disabled={currentPage === totalPages || loading}
                  className="w-full sm:w-auto min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('admin.members.next')}
                </Button>
              </div>

              {/* Quick jump for mobile */}
              <div className="sm:hidden flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500">Go to page:</span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') return; // Allow empty input while typing
                    const page = parseInt(value);
                    if (!isNaN(page) && page >= 1 && page <= totalPages && !loading) {
                      setCurrentPage(page);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    const page = parseInt(value);
                    if (value === '' || isNaN(page) || page < 1) {
                      e.target.value = currentPage.toString();
                    } else if (page > totalPages) {
                      e.target.value = totalPages.toString();
                      setCurrentPage(totalPages);
                    }
                  }}
                  className="w-20 h-8 text-center text-sm"
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Edit Member Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Member</DialogTitle>
            <DialogDescription className="text-sm">
              Update member information
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <form onSubmit={handleUpdateMember} className="space-y-4">
              {/* Profile Photo Upload */}
              <div>
                <Label className="text-xs sm:text-sm">Profile Photo</Label>
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white mt-2">
                  <div className="relative">
                    <div className="relative w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200">
                      {profilePhotoPreview ? (
                        <img
                          src={profilePhotoPreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : editingMember.profile_photo_path && isValidImageUrl(editingMember.profile_photo_path) ? (
                        <Image
                          src={`${getValidImageUrl(editingMember.profile_photo_path)!}?_t=${Date.now()}`}
                          alt={editingMember.name}
                          width={96}
                          height={96}
                          className="rounded-full object-cover"
                          key={`edit-photo-${editingMember.id}-${editingMember.updated_at}`}
                        />
                      ) : (
                        <User className="h-10 w-10 text-slate-300" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      id="edit_profile_photo"
                      className="hidden"
                    />
                    <Label
                      htmlFor="edit_profile_photo"
                      className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-orange-200 text-orange-600 font-semibold bg-white hover:bg-orange-50 transition-colors duration-200 text-sm w-full sm:w-auto"
                    >
                      <Upload className="h-4 w-4" />
                      {profilePhoto ? 'Change Photo' : 'Upload New Photo'}
                    </Label>
                    <p className="text-xs text-slate-500 text-center">
                      Maximum file size: 500KB. Supported formats: JPG, PNG, GIF
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="edit_name" className="text-xs sm:text-sm">Full Name *</Label>
                  <Input
                    id="edit_name"
                    name="name"
                    required
                    defaultValue={editingMember.name}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_email" className="text-xs sm:text-sm">Email *</Label>
                  <Input
                    id="edit_email"
                    name="email"
                    type="email"
                    required
                    defaultValue={editingMember.email}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_phone" className="text-xs sm:text-sm">Phone *</Label>
                  <Input
                    id="edit_phone"
                    name="phone"
                    required
                    defaultValue={editingMember.phone}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_status" className="text-xs sm:text-sm">Status</Label>
                  <Select name="status" defaultValue={editingMember.status}>
                    <SelectTrigger className="h-9 sm:h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_father_husband_name" className="text-xs sm:text-sm">Father/Husband Name *</Label>
                  <Input
                    id="edit_father_husband_name"
                    name="father_husband_name"
                    required
                    defaultValue={editingMember.father_husband_name}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_mother_wife_name" className="text-xs sm:text-sm">Mother/Wife Name *</Label>
                  <Input
                    id="edit_mother_wife_name"
                    name="mother_wife_name"
                    required
                    defaultValue={editingMember.mother_wife_name}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_aadhar_card_number" className="text-xs sm:text-sm">Aadhaar Card Number</Label>
                  <Input
                    id="edit_aadhar_card_number"
                    name="aadhar_card_number"
                    type="text"
                    maxLength={12}
                    pattern="[0-9]{12}"
                    placeholder="Enter 12-digit Aadhaar number"
                    defaultValue={editingMember.aadhar_card_number || ''}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_address" className="text-xs sm:text-sm">Address *</Label>
                <Input
                  id="edit_address"
                  className="h-9 sm:h-10 text-sm"
                  name="address"
                  required
                  defaultValue={editingMember.address}
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                    setProfilePhoto(null);
                    setProfilePhotoPreview(null);
                  }}
                  size="sm"
                  className="w-full sm:w-auto cursor-pointer text-sm"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 cursor-pointer text-sm">
                  Update Member
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Member Details Modal */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.members.details.title') || 'Member Details | सदस्य विवरण'}</DialogTitle>
            <DialogDescription>
              {t('admin.members.details.description') || 'Complete information about the member | सदस्य की पूर्ण जानकारी'}
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                  {isValidImageUrl(selectedMember.profile_photo_path) ? (
                    <Image
                      src={`${getValidImageUrl(selectedMember.profile_photo_path)!}?_t=${selectedMember.updated_at || Date.now()}`}
                      alt={selectedMember.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                      key={`details-photo-${selectedMember.id}-${selectedMember.updated_at}`}
                      onError={(e) => {
                        // Hide image and show fallback on error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <span 
                    className="text-orange-600 font-semibold text-xl"
                    style={{ display: !isValidImageUrl(selectedMember.profile_photo_path) ? 'block' : 'none' }}
                  >
                    {selectedMember.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedMember.name}</h3>
                  <p className="text-gray-600">{selectedMember.member_reg_number}</p>
                  {getStatusBadge(selectedMember.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedMember.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedMember.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedMember.state || t('admin.members.details.notAvailable') || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedMember.district || t('admin.members.details.notAvailable') || 'N/A'}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Building2 className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-600">
                        {t('admin.members.details.departmentAssignments') || 'Department Assignments | विभाग असाइनमेंट:'}
                      </span>
                      <div className="text-sm text-gray-900 mt-1">
                        {selectedMember.departments ? (
                          <div className="space-y-1">
                            {selectedMember.departments.split(' | ').map((assignment, index) => (
                              <div key={index} className="bg-blue-50 px-2 py-1 rounded text-xs">
                                {assignment}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">
                            {t('admin.members.details.noDepartmentAssignments') || 'No department assignments | कोई विभाग असाइनमेंट नहीं'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      {t('register.fatherHusbandName') || 'Father/Husband | पिता/पति:'}
                    </span>
                    <p className="text-sm text-gray-900">{selectedMember.father_husband_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      {t('register.motherWifeName') || 'Mother/Wife | माता/पत्नी:'}
                    </span>
                    <p className="text-sm text-gray-900">{selectedMember.mother_wife_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      {t('register.registrationDate') || 'Registration Date | पंजीकरण तिथि:'}
                    </span>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedMember.registration_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      {t('admin.members.details.verifiedBy') || 'Verified by | सत्यापित किया गया:'}
                    </span>
                    <p className="text-sm text-gray-900">
                      {selectedMember.verified_by_name || t('admin.members.details.admin') || 'Admin | एडमिन'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">
                  {t('register.address') || 'Address | पता:'}
                </span>
                <p className="text-sm text-gray-900 mt-1">{selectedMember.address}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
