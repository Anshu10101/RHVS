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
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [states, setStates] = useState<Array<{id: number, name: string}>>([]);
  const [districts, setDistricts] = useState<Array<{id: string, name: string}>>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setRegNumberSearch('');
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

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchMembers();
  }, [currentPage, searchTerm, regNumberSearch, selectedStatus, selectedState, selectedDistrict, selectedDepartment, fetchMembers]);

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

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchMembers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, regNumberSearch, currentPage, fetchMembers]);


  const handleUpdateMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;

    const formData = new FormData(e.currentTarget);
    const updateData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      father_husband_name: formData.get('father_husband_name') as string,
      mother_wife_name: formData.get('mother_wife_name') as string,
      district: formData.get('district') as string,
      department: formData.get('department') as string,
      status: formData.get('status') as string,
    };

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
        setShowEditModal(false);
        setEditingMember(null);
        fetchMembers();
        fetchStats();
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-2.5 bg-orange-100 rounded-lg flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('admin.members.totalMembers')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-2.5 bg-green-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('admin.members.verified')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.status.verified || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-2.5 bg-yellow-100 rounded-lg flex-shrink-0">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('admin.members.pending')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.status.pending || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('admin.members.thisMonth')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.monthly}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Section */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-base sm:text-lg font-semibold text-orange-900 flex items-center gap-2">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('admin.members.searchMembers')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="search" className="text-xs sm:text-sm font-medium text-gray-700">{t('admin.members.searchPlaceholder')}</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder={t('admin.members.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="regNumber" className="text-xs sm:text-sm font-medium text-gray-700">{t('admin.members.searchByRegNumber')}</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="regNumber"
                  placeholder={t('admin.members.searchByRegNumberPlaceholder')}
                  value={regNumberSearch}
                  onChange={(e) => setRegNumberSearch(e.target.value)}
                  className="pl-10 h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-base sm:text-lg font-semibold text-orange-900 flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('admin.members.filterMembers')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="state" className="text-xs sm:text-sm font-medium text-gray-700">{t('admin.members.state')}</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
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
              <Label htmlFor="district" className="text-xs sm:text-sm font-medium text-gray-700">{t('admin.members.district')}</Label>
              <Select 
                value={selectedDistrict} 
                onValueChange={setSelectedDistrict}
                disabled={!selectedState || selectedState === 'all' || loadingDistricts}
              >
                <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
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
              <Label htmlFor="department" className="text-xs sm:text-sm font-medium text-gray-700">{t('admin.members.department')}</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
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
              <Label htmlFor="status" className="text-xs sm:text-sm font-medium text-gray-700">{t('admin.members.status')}</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
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
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              size="sm"
              className="w-full sm:w-auto px-4 sm:px-6 h-9 sm:h-10 bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('admin.members.clearFilters')}
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchMembers}
              size="sm"
              className="w-full sm:w-auto px-4 sm:px-6 h-9 sm:h-10 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 cursor-pointer text-sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t('admin.members.applyFilters')}
            </Button>
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
                  <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                              src={getValidImageUrl(member.profile_photo_path)!}
                              alt={member.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
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
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.state || t('admin.members.na')}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{member.district || t('admin.members.na')}</div>
                      <div className="text-xs sm:text-sm text-blue-600 font-medium truncate">{member.departments || t('admin.members.noAssignments')}</div>
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
                          onClick={() => setSelectedMember(member)}
                          className="cursor-pointer h-8 w-8 p-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
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
                              src={getValidImageUrl(member.profile_photo_path)!}
                              alt={member.name}
                              width={48}
                              height={48}
                              className="rounded-full object-cover"
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
                        {member.departments && (
                          <p className="text-xs text-blue-600 font-medium mt-1">{member.departments}</p>
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
                        onClick={() => setSelectedMember(member)}
                        className="flex-1 sm:flex-none cursor-pointer text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        {t('admin.members.view')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-700">
                {t('admin.members.page')} {currentPage} {t('admin.members.pageOf')} {totalPages}
              </div>
              <div className="flex space-x-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="flex-1 sm:flex-none cursor-pointer disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  {t('admin.members.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="flex-1 sm:flex-none cursor-pointer disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  {t('admin.members.next')}
                </Button>
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
                  <Label htmlFor="edit_district" className="text-xs sm:text-sm">District</Label>
                  <Input
                    id="edit_district"
                    name="district"
                    defaultValue={editingMember.district || ''}
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_department" className="text-xs sm:text-sm">Department</Label>
                  <Input
                    id="edit_department"
                    name="department"
                    defaultValue={editingMember.departments || ''}
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
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>
              Complete information about the member
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                  {isValidImageUrl(selectedMember.profile_photo_path) ? (
                    <Image
                      src={getValidImageUrl(selectedMember.profile_photo_path)!}
                      alt={selectedMember.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
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
                    <span className="text-sm text-gray-900">{selectedMember.state || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedMember.district || 'N/A'}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Building2 className="h-4 w-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-600">Department Assignments:</span>
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
                          <span className="text-gray-500 italic">No department assignments</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Father/Husband:</span>
                    <p className="text-sm text-gray-900">{selectedMember.father_husband_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Mother/Wife:</span>
                    <p className="text-sm text-gray-900">{selectedMember.mother_wife_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Registration Date:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedMember.registration_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Verified by:</span>
                    <p className="text-sm text-gray-900">
                      {selectedMember.verified_by_name || 'Admin'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Address:</span>
                <p className="text-sm text-gray-900 mt-1">{selectedMember.address}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
