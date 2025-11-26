"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { AlertCircle, Check, RefreshCw, Shield, Trash2, UserPlus, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

interface Member {
  id: number;
  name: string;
  email: string;
  district: string;
  state: string;
}

interface DistrictAdmin {
  id: number;
  memberId: number;
  name: string;
  email: string;
  district: string;
  state: string;
  isActive: boolean;
  appointmentDate: string;
  expiryDate: string | null;
  lastLogin: string | null;
  permissions: string[];
}


export default function AdminsManagementPage() {
  const { currentUser } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [districtAdmins, setDistrictAdmins] = useState<DistrictAdmin[]>([]);
  const [districts, setDistricts] = useState<Array<{id: string, name: string}>>([]);
  const [states, setStates] = useState<Array<{id: number, name: string}>>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // Form states
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [tempPassword, setTempPassword] = useState<string>("");
  
  // Filter states for dialog
  const [filterState, setFilterState] = useState<string>("all");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  
  // Filter states for admin list
  const [adminFilterState, setAdminFilterState] = useState<string>("all");
  const [adminFilterDistrict, setAdminFilterDistrict] = useState<string>("all");
  const [adminFilterDistricts, setAdminFilterDistricts] = useState<Array<{id: string, name: string}>>([]);
  const [loadingAdminFilterDistricts, setLoadingAdminFilterDistricts] = useState(false);
  const [filteredDistrictAdmins, setFilteredDistrictAdmins] = useState<DistrictAdmin[]>([]);

  // Safe date parsing/formatting for MySQL timestamps like 'YYYY-MM-DD HH:mm:ss'
  const parseDate = (value?: string | null) => {
    if (!value) return null;
    const iso = value.includes('T') ? value : value.replace(' ', 'T');
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (value?: string | null, pattern: string = 'dd MMM yyyy') => {
    const d = parseDate(value);
    return d ? format(d, pattern) : null;
  };

  // Check if user is superadmin
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  // Fetch states from database
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
        setDistricts(data.data.map((district: { id: number; name: string }) => ({
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

  // Load data
  const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('admin_token');
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
        const timestamp = Date.now();
        
        // Fetch members
        const membersRes = await fetch(`/api/admin/members?_t=${timestamp}`, { 
          cache: 'no-store',
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });
        if (membersRes.ok) {
          const data = await membersRes.json();
          const membersList = data.data?.members || data.members || [];
          setMembers(membersList);
          setFilteredMembers(membersList);
        }
        
        // Fetch district admins with cache-busting
        const adminsRes = await fetch(`/api/admin/members/admins?_t=${timestamp}`, { 
          cache: 'no-store',
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        });
        if (adminsRes.ok) {
          const data = await adminsRes.json();
          const adminsList = data.admins || [];
          setDistrictAdmins(adminsList);
          // Initialize filtered list
          setFilteredDistrictAdmins(adminsList);
        } else {
          console.error('Failed to fetch district admins:', adminsRes.status, await adminsRes.text());
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }, []);
  
  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchData();
    fetchStates();
  }, [isSuperAdmin, fetchData]);

  // Reload data when page becomes visible (user navigates back or refreshes)
  useEffect(() => {
    if (!isSuperAdmin) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSuperAdmin, fetchData]);

  // Fetch districts when state filter changes (for dialog)
  useEffect(() => {
    if (filterState && filterState !== 'all') {
      fetchDistricts(filterState);
    } else {
      setDistricts([]);
    }
  }, [filterState]);

  // Fetch districts when admin filter state changes
  useEffect(() => {
    if (adminFilterState && adminFilterState !== 'all') {
      const fetchAdminFilterDistricts = async () => {
        try {
          setLoadingAdminFilterDistricts(true);
          const response = await fetch(`/api/districts?stateId=${adminFilterState}`);
          const data = await response.json();
          if (data.success) {
            setAdminFilterDistricts(data.data.map((district: { id: number; name: string }) => ({
              id: district.id.toString(),
              name: district.name
            })));
          } else {
            setAdminFilterDistricts([]);
          }
        } catch (err) {
          console.error('Failed to fetch districts:', err);
          setAdminFilterDistricts([]);
        } finally {
          setLoadingAdminFilterDistricts(false);
        }
      };
      fetchAdminFilterDistricts();
    } else {
      setAdminFilterDistricts([]);
      setAdminFilterDistrict("all");
    }
  }, [adminFilterState]);

  // Filter district admins based on state and district
  useEffect(() => {
    let filtered = [...districtAdmins];
    
    if (adminFilterState && adminFilterState !== "all") {
      const selectedStateName = states.find(s => s.id.toString() === adminFilterState)?.name;
      if (selectedStateName) {
        filtered = filtered.filter(admin => admin.state === selectedStateName);
      }
    }
    
    if (adminFilterDistrict && adminFilterDistrict !== "all") {
      const selectedDistrictName = adminFilterDistricts.find(d => d.id === adminFilterDistrict)?.name;
      if (selectedDistrictName) {
        filtered = filtered.filter(admin => admin.district === selectedDistrictName);
      }
    }
    
    setFilteredDistrictAdmins(filtered);
  }, [districtAdmins, adminFilterState, adminFilterDistrict, states, adminFilterDistricts]);
  
  const handleAddAdmin = async () => {
    if (!selectedMember || !selectedState || !selectedDistrict || !tempPassword) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/members/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          memberId: selectedMember.id,
          state: selectedState,
          district: selectedDistrict,
          password: tempPassword,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        // Refetch data from server to ensure consistency
        await fetchData();
        toast.success('District admin added successfully');
        setAddDialogOpen(false);
        resetForm();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to add district admin');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Failed to add district admin');
    }
  };
  
  
  const handleDeleteAdmin = async (id: number) => {
    if (!confirm('Are you sure you want to remove this district admin?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/members/admins/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      });
      
      if (res.ok) {
        // Refetch data from server to ensure consistency
        await fetchData();
        toast.success('District admin removed successfully');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to remove district admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Failed to remove district admin');
    }
  };
  
  
  
  
  const resetForm = () => {
    setSelectedMember(null);
    setSelectedState("");
    setSelectedDistrict("");
    setTempPassword("");
    setFilterState("all");
    setFilterDistrict("all");
    setDistricts([]);
  };

  // Filter members based on state and district
  useEffect(() => {
    let filtered = [...members];
    
    if (filterState && filterState !== "all") {
      const selectedStateName = states.find(s => s.id.toString() === filterState)?.name;
      if (selectedStateName) {
        filtered = filtered.filter(member => member.state === selectedStateName);
      }
    }
    
    if (filterDistrict && filterDistrict !== "all") {
      const selectedDistrictName = districts.find(d => d.id === filterDistrict)?.name;
      if (selectedDistrictName) {
        filtered = filtered.filter(member => member.district === selectedDistrictName);
      }
    }
    
    setFilteredMembers(filtered);
  }, [members, filterState, filterDistrict, states, districts]);

  const handleMemberSelect = (memberId: string) => {
    const member = filteredMembers.find(m => m.id.toString() === memberId);
    setSelectedMember(member || null);
    
    if (member) {
      setSelectedState(member.state || "");
      setSelectedDistrict(member.district || "");
    } else {
      setSelectedState("");
      setSelectedDistrict("");
    }
  };
  
  
  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-40 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-yellow-500" />
            <h3 className="mt-2 text-sm font-medium text-yellow-800">Access Restricted</h3>
            <p className="mt-1 text-sm text-yellow-700">
              Only superadmins can access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6">
      <AdminPageTitle 
        title="District Admins Management" 
        description="Appoint and manage district-level admins"
        icon={<Shield className="h-5 w-5 sm:h-6 sm:w-6" />}
      />
      
      <div className="my-4 sm:my-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
        <Button 
          variant="outline" 
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          disabled={loading}
          size="sm"
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
        <Button onClick={() => setAddDialogOpen(true)} size="sm" className="w-full sm:w-auto cursor-pointer">
          <UserPlus className="h-4 w-4 mr-2" />
          Appoint District Admin
        </Button>
      </div>
      
      {/* Filters Section */}
      <div className="mb-4 sm:mb-6 bg-white shadow-md rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filter District Admins
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAdminFilterState("all");
              setAdminFilterDistrict("all");
              setAdminFilterDistricts([]);
            }}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Clear Filters
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="admin-filter-state" className="text-xs sm:text-sm font-medium text-gray-700">State</Label>
            <Select value={adminFilterState} onValueChange={setAdminFilterState}>
              <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
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
            <Label htmlFor="admin-filter-district" className="text-xs sm:text-sm font-medium text-gray-700">District</Label>
            <Select 
              value={adminFilterDistrict} 
              onValueChange={setAdminFilterDistrict}
              disabled={!adminFilterState || adminFilterState === 'all' || loadingAdminFilterDistricts}
            >
              <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
                <SelectValue placeholder={
                  !adminFilterState || adminFilterState === 'all' 
                    ? "Select state first" 
                    : loadingAdminFilterDistricts 
                      ? "Loading districts..." 
                      : "All Districts"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {adminFilterDistricts.map(district => (
                  <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <div className="w-full text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 sm:p-3 rounded-md">
              Showing {filteredDistrictAdmins.length} of {districtAdmins.length} admins
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead className="text-xs sm:text-sm">Name</TableHead>
                <TableHead className="text-xs sm:text-sm">Email</TableHead>
                <TableHead className="text-xs sm:text-sm">State</TableHead>
                <TableHead className="text-xs sm:text-sm">District</TableHead>
                <TableHead className="text-xs sm:text-sm">Status</TableHead>
                <TableHead className="text-xs sm:text-sm">Appointed On</TableHead>
                <TableHead className="text-xs sm:text-sm">Expiry</TableHead>
                <TableHead className="text-xs sm:text-sm">Last Login</TableHead>
                <TableHead className="text-xs sm:text-sm w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-sm">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredDistrictAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-sm">
                  {districtAdmins.length === 0 
                    ? "No district admins found. Appoint one now."
                    : "No district admins match the selected filters."
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredDistrictAdmins.map(admin => (
                <TableRow key={admin.id}>
                    <TableCell className="font-medium text-sm">{admin.name}</TableCell>
                    <TableCell className="text-sm">{admin.email}</TableCell>
                    <TableCell className="text-sm">{admin.state}</TableCell>
                    <TableCell className="text-sm">{admin.district}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      admin.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                    <TableCell className="text-sm">{formatDate(admin.appointmentDate) ?? '—'}</TableCell>
                    <TableCell className="text-sm">
                    {admin.expiryDate 
                      ? (formatDate(admin.expiryDate) ?? 'No expiry')
                      : 'No expiry'}
                  </TableCell>
                    <TableCell className="text-sm">
                    {admin.lastLogin
                      ? (formatDate(admin.lastLogin, 'dd MMM yyyy, HH:mm') ?? 'Never logged in')
                      : 'Never logged in'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                          className="cursor-pointer h-8 w-8 p-0"
                      >
                        <Link href={`/admin/permissions/assign?admin=${admin.id}`}>
                          <Shield className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer h-8 w-8 p-0"
                        onClick={() => handleDeleteAdmin(admin.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
          <div className="lg:hidden space-y-3">
            {loading ? (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600">Loading...</p>
              </div>
            ) : filteredDistrictAdmins.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600">
                  {districtAdmins.length === 0 
                    ? "No district admins found. Appoint one now."
                    : "No district admins match the selected filters."
                  }
                </p>
              </div>
            ) : (
              filteredDistrictAdmins.map(admin => (
            <div key={admin.id} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{admin.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{admin.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ml-2 ${
                    admin.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">State</p>
                    <p className="text-sm text-gray-900">{admin.state}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">District</p>
                    <p className="text-sm text-gray-900">{admin.district}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Appointed On</p>
                    <p className="text-sm text-gray-900">{formatDate(admin.appointmentDate) ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expiry</p>
                    <p className="text-sm text-gray-900">
                      {admin.expiryDate 
                        ? (formatDate(admin.expiryDate) ?? 'No expiry')
                        : 'No expiry'}
                    </p>
                  </div>
                </div>

                {/* Last Login */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Last Login</p>
                  <p className="text-sm text-gray-900">
                    {admin.lastLogin
                      ? (formatDate(admin.lastLogin, 'dd MMM yyyy, HH:mm') ?? 'Never logged in')
                      : 'Never logged in'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                    className="flex-1 cursor-pointer text-xs"
                  >
                    <Link href={`/admin/permissions/assign?admin=${admin.id}`}>
                      <Shield className="h-3.5 w-3.5 mr-1.5" />
                      Permissions
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer text-xs"
                    onClick={() => handleDeleteAdmin(admin.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Add Admin Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Appoint District Admin</DialogTitle>
            <DialogDescription className="text-sm">
              Select a member to appoint as district admin. They will have access to manage their district.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6 py-4">
            {/* Filter Section */}
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                <Label className="text-sm sm:text-base font-medium">Filter Members</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterState("all");
                    setFilterDistrict("all");
                    setDistricts([]);
                  }}
                  className="w-full sm:w-auto h-8 text-xs"
                >
                  Clear Filters
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="filter-state" className="text-xs sm:text-sm font-medium text-gray-700">State</Label>
                  <Select value={filterState} onValueChange={setFilterState}>
                    <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
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
                  <Label htmlFor="filter-district" className="text-xs sm:text-sm font-medium text-gray-700">District</Label>
                  <Select 
                    value={filterDistrict} 
                    onValueChange={setFilterDistrict}
                    disabled={!filterState || filterState === 'all' || loadingDistricts}
                  >
                    <SelectTrigger className="mt-1 h-9 sm:h-10 text-sm">
                      <SelectValue placeholder={loadingDistricts ? "Loading..." : "All Districts"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      {districts.map(district => (
                        <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="text-xs sm:text-sm text-gray-600">
                Showing {filteredMembers.length} of {members.length} members
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="member" className="text-xs sm:text-sm font-medium text-gray-700">Select Member</Label>
              <Select 
                onValueChange={handleMemberSelect}
                value={selectedMember ? selectedMember.id.toString() : ""}
              >
                <SelectTrigger id="member" className="h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="Choose a member from the filtered list" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredMembers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-xs sm:text-sm">
                      No members available. Try adjusting your filters.
                    </div>
                  ) : (
                    filteredMembers.map(member => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name} - {member.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Member Confirmation */}
            {selectedMember && (
              <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-semibold text-green-800">Selected Member</span>
                </div>
                <div className="space-y-1 text-xs sm:text-sm text-green-700">
                  <p><span className="font-medium">Name:</span> {selectedMember.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedMember.email}</p>
                  <p><span className="font-medium">Location:</span> {selectedMember.district}, {selectedMember.state}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="state" className="text-xs sm:text-sm font-medium text-gray-700">State</Label>
              <Input
                id="state"
                value={selectedState}
                readOnly
                className="bg-gray-50 h-9 sm:h-10 text-sm"
                placeholder="Will be auto-populated from member data"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="district" className="text-xs sm:text-sm font-medium text-gray-700">District</Label>
              <Input
                id="district"
                value={selectedDistrict}
                readOnly
                className="bg-gray-50 h-9 sm:h-10 text-sm"
                placeholder="Will be auto-populated from member data"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="temp-password" className="text-xs sm:text-sm font-medium text-gray-700">Temporary Password</Label>
              <Input
                id="temp-password"
                type="password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Set a temporary password"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            
            
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" size="sm" onClick={() => {
              setAddDialogOpen(false);
              resetForm();
            }} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleAddAdmin} size="sm" className="w-full sm:w-auto cursor-pointer">
              <Check className="h-4 w-4 mr-2" />
              Appoint Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      
    </div>
  );
}
