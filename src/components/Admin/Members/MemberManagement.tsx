"use client";

import { useState, useEffect, useCallback } from 'react';
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
        sortOrder: 'DESC'
      });

      console.log('MemberManagement: Fetching members with params:', params.toString());
      const response = await fetch(`/api/admin/members?${params}`);
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
      const response = await fetch('/api/admin/members/stats');
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
      const response = await fetch('/api/admin/members/departments');
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
      const response = await fetch(`/api/admin/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'DELETE',
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
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };


  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading members...</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orange-900">Member Management</h1>
          <p className="text-orange-700/80">Manage and track all RHVS members</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={fetchMembers}
            disabled={loading}
            className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/members/add" className="cursor-pointer">
            <Button
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-6 py-2.5 font-medium cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.status.verified || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.status.pending || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.monthly}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-orange-900 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Members
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search by Name, Email, Phone, or Aadhar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Enter name, email, phone, or Aadhar number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="regNumber" className="text-sm font-medium text-gray-700">Search by Registration Number</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="regNumber"
                  placeholder="Enter registration number (e.g., RHVS000001)..."
                  value={regNumberSearch}
                  onChange={(e) => setRegNumberSearch(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-orange-900 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Members
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map(state => (
                    <SelectItem key={state.id} value={state.id.toString()}>{state.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="district" className="text-sm font-medium text-gray-700">District</Label>
              <Select 
                value={selectedDistrict} 
                onValueChange={setSelectedDistrict}
                disabled={!selectedState || selectedState === 'all' || loadingDistricts}
              >
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder={
                    !selectedState || selectedState === 'all' 
                      ? "Select state first" 
                      : loadingDistricts 
                        ? "Loading districts..." 
                        : "All Districts"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="department" className="text-sm font-medium text-gray-700">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="px-6 h-10 bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchMembers}
              className="px-6 h-10 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 cursor-pointer"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members List</CardTitle>
          <CardDescription>
            Showing {members.length} members (Page {currentPage} of {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                          {isValidImageUrl(member.profile_photo_path) ? (
                            <Image
                              src={getValidImageUrl(member.profile_photo_path)!}
                              alt={member.name}
                              width={40}
                              height={40}
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
                            className="text-orange-600 font-semibold text-sm"
                            style={{ display: !isValidImageUrl(member.profile_photo_path) ? 'block' : 'none' }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.member_reg_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                      <div className="text-sm text-gray-500">{member.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.state || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{member.district || 'N/A'}</div>
                      <div className="text-sm text-blue-600 font-medium">{member.departments || 'No assignments'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(member.registration_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.verified_by_name ? `Verified by ${member.verified_by_name}` : 'Admin verified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedMember(member)}
                          className="cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMember(member);
                            setShowEditModal(true);
                          }}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {member.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(member.id, 'verified')}
                              className="text-green-600 hover:text-green-700 cursor-pointer"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(member.id, 'rejected')}
                              className="text-red-600 hover:text-red-700 cursor-pointer"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Edit Member Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member information
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Full Name *</Label>
                  <Input
                    id="edit_name"
                    name="name"
                    required
                    defaultValue={editingMember.name}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_email">Email *</Label>
                  <Input
                    id="edit_email"
                    name="email"
                    type="email"
                    required
                    defaultValue={editingMember.email}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_phone">Phone *</Label>
                  <Input
                    id="edit_phone"
                    name="phone"
                    required
                    defaultValue={editingMember.phone}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_status">Status</Label>
                  <Select name="status" defaultValue={editingMember.status}>
                    <SelectTrigger>
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
                  <Label htmlFor="edit_father_husband_name">Father/Husband Name *</Label>
                  <Input
                    id="edit_father_husband_name"
                    name="father_husband_name"
                    required
                    defaultValue={editingMember.father_husband_name}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_mother_wife_name">Mother/Wife Name *</Label>
                  <Input
                    id="edit_mother_wife_name"
                    name="mother_wife_name"
                    required
                    defaultValue={editingMember.mother_wife_name}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_district">District</Label>
                  <Input
                    id="edit_district"
                    name="district"
                    defaultValue={editingMember.district || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_department">Department</Label>
                  <Input
                    id="edit_department"
                    name="department"
                    defaultValue={editingMember.departments || ''}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_address">Address *</Label>
                <Input
                  id="edit_address"
                  name="address"
                  required
                  defaultValue={editingMember.address}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                  }}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 cursor-pointer">
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
