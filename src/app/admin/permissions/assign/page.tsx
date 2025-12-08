"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  UserCheck, 
  Save,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SortAsc,
  SortDesc,
  Maximize2,
  Minimize2,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface DistrictAdmin {
  id: number;
  memberId: number;
  email: string;
  district: string;
  state: string;
  isActive: boolean;
  name: string;
  permissions: string[];
}

interface AvailablePermission {
  id: number;
  key: string;
  name: string;
  description: string;
  category: string;
  type: 'permanent' | 'temporary';
}

interface PermissionTemplate {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

export default function AssignPermissionsPage() {
  const { t } = useLanguage();
  const { currentUser } = useAdmin();
  const [districtAdmins, setDistrictAdmins] = useState<DistrictAdmin[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<AvailablePermission[]>([]);
  // Removed quick-select templates per requirement
  // const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expirationDays, setExpirationDays] = useState<number>(30);
  const [expirationDaysInput, setExpirationDaysInput] = useState<string>('30');
  const [submitting, setSubmitting] = useState(false);

  // Gallery-style filtering state
  const [availableStates, setAvailableStates] = useState<{id: number, name: string, code: string}[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<{id: number, name: string, code: string, state_code: string}[]>([]);
  
  // UI state for managing large lists
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<string>('');
  const [filterDistrict, setFilterDistrict] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'permissions' | 'state' | 'district'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [compactMode, setCompactMode] = useState(false);
  const [expandedAdmins, setExpandedAdmins] = useState<Set<number>>(new Set());

  // Load filters on component mount
  useEffect(() => {
    loadFilters();
  }, []);

  // Load districts when state changes (for form)
  useEffect(() => {
    if (selectedState) {
      loadDistricts(selectedState);
    } else {
      setAvailableDistricts([]);
    }
  }, [selectedState]);

  // Load districts when filter state changes
  useEffect(() => {
    if (filterState) {
      loadDistricts(filterState);
    }
  }, [filterState]);

  // Reset admin selection when district changes
  useEffect(() => {
    if (selectedDistrict) {
      setSelectedAdmin('');
    }
  }, [selectedDistrict]);

  const loadFilters = async () => {
    try {
      console.log('Loading states...');
      // Fetch states using the standard API
      const token = localStorage.getItem('admin_token');
      const statesResponse = await fetch('/api/states', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const statesData = await statesResponse.json();
      console.log('States response:', statesData);
      if (statesData.success) {
        setAvailableStates(statesData.data || []);
        console.log('States loaded:', statesData.data);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const loadDistricts = async (stateId: string) => {
    if (!stateId) {
      setAvailableDistricts([]);
      return;
    }

    try {
      console.log('Loading districts for state:', stateId);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/districts?stateId=${stateId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      console.log('Districts response:', data);
      if (data.success) {
        setAvailableDistricts(data.data || []);
        console.log('Districts loaded:', data.data);
      } else {
        setAvailableDistricts([]);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
      setAvailableDistricts([]);
    }
  };

  const revokePermission = async (adminId: number | string, permission: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/permissions/assign?district_admin_id=${adminId}&permission=${permission}`, { 
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast.success(`${t('admin.permissions.assign.revoked')} ${permission}`);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || t('admin.permissions.assign.failedToRevoke'));
      }
    } catch (_e) {
      toast.error(t('admin.permissions.assign.failedToRevoke'));
    }
  };

  const revokeAll = async (adminId: number | string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/permissions/assign?district_admin_id=${adminId}`, { 
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast.success(t('admin.permissions.assign.allPermissionsRevoked'));
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || t('admin.permissions.assign.failedToRevoke'));
      }
    } catch (_e) {
      toast.error(t('admin.permissions.assign.failedToRevoke'));
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const timestamp = Date.now();
      const [adminsRes, permissionsRes] = await Promise.all([
        fetch(`/api/admin/members/admins?_t=${timestamp}`, { 
          cache: 'no-store',
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        }),
        fetch(`/api/admin/permissions?_t=${timestamp}`, { 
          cache: 'no-store',
          headers: {
            ...headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          }
        })
      ]);

       if (adminsRes.ok) {
         const adminsData = await adminsRes.json();
         const admins = adminsData.admins || [];
         console.log('Fetched district admins:', admins);
         setDistrictAdmins(admins);
       } else {
         console.error('Failed to fetch district admins:', adminsRes.status);
         setDistrictAdmins([]);
       }

      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json();
        const permissions = permissionsData.permissions || permissionsData;
        setAvailablePermissions(Array.isArray(permissions) ? permissions : []);
      } else {
        console.error('Failed to fetch permissions:', permissionsRes.status);
        setAvailablePermissions([]);
      }

      // setTemplates([]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('admin.permissions.assign.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.type === 'superadmin') {
      fetchData();
    }
  }, [currentUser, fetchData]);

  // Reload data when page becomes visible (user navigates back or refreshes)
  useEffect(() => {
    if (currentUser?.type !== 'superadmin') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, fetchData]);

  // Templates removed
  // const handleTemplateSelect = (_: string) => {};

  const handlePermissionToggle = (permissionKey: string, checked: boolean) => {
    setSelectedPermissions(prev => 
      checked
        ? [...prev, permissionKey]
        : prev.filter(p => p !== permissionKey)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
     if (!selectedState || !selectedDistrict || !selectedAdmin || selectedPermissions.length === 0) {
       toast.error(t('admin.permissions.assign.selectAllRequired'));
       return;
     }

    try {
      setSubmitting(true);

      // Check if any selected permission is time-based
      const hasTimeBasedPermission = selectedPermissions.some(p => {
        const permission = availablePermissions.find(ap => ap.key === p);
        return permission?.type === 'temporary';
      });

      // Calculate expires_at only for time-based permissions
      const expiresAt = hasTimeBasedPermission
        ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/permissions/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          district_admin_id: parseInt(selectedAdmin),
          permissions: selectedPermissions,
          expires_at: expiresAt,
          notes: null
        }),
      });

       if (response.ok) {
         toast.success(t('admin.permissions.assign.assignedSuccessfully'));
         // Reset form
         setSelectedState('');
         setSelectedDistrict('');
         setSelectedAdmin('');
         setSelectedPermissions([]);
         setExpirationDays(30);
         setExpirationDaysInput('30');
         // Refresh data
         fetchData();
       } else {
        const error = await response.json();
        toast.error(error.message || t('admin.permissions.assign.failedToAssign'));
      }
    } catch (error) {
      console.error('Error assigning permissions:', error);
      toast.error(t('admin.permissions.assign.failedToAssign'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedAdmin || selectedPermissions.length === 0) {
      toast.error(t('admin.permissions.assign.selectAllRequired'));
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('admin_token');

      // Revoke each selected permission
      const revokePromises = selectedPermissions.map(permission =>
        fetch(`/api/admin/permissions/assign?district_admin_id=${selectedAdmin}&permission=${permission}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
      );

      const results = await Promise.all(revokePromises);
      const allSucceeded = results.every(res => res.ok);

      if (allSucceeded) {
        toast.success(t('admin.permissions.assign.permissionRevoked'));
        setSelectedPermissions([]);
        fetchData();
      } else {
        toast.error(t('admin.permissions.assign.failedToRevoke'));
      }
    } catch (error) {
      console.error('Error revoking permissions:', error);
      toast.error(t('admin.permissions.assign.failedToRevoke'));
    } finally {
      setSubmitting(false);
    }
  };

  const getPermissionCategory = (category: string) => {
    const categories: { [key: string]: string } = {
      'content': t('admin.permissions.assign.contentManagement'),
      'members': t('admin.permissions.assign.memberManagement'),
      'analytics': t('admin.permissions.assign.analyticsReports'),
      'system': t('admin.permissions.assign.systemAdministration')
    };
    return categories[category] || category;
  };

  // Get admins for selected district (using API-based filtering)
  const getAdminsForDistrict = (districtId: string) => {
    if (!districtId || !selectedState) return [];
    
    // Find the district name from availableDistricts
    const selectedDistrict = availableDistricts.find(d => d.id.toString() === districtId);
    if (!selectedDistrict) return [];
    
    // Find the state name from availableStates
    const selectedStateObj = availableStates.find(s => s.id.toString() === selectedState);
    const stateName = selectedStateObj?.name;
    
    return districtAdmins.filter(admin => {
      if (!admin.isActive) return false;
      
      // Check if district matches, handling both formats (with or without comma)
      const parts = admin.district?.split(',');
      const adminDistrict = parts && parts.length >= 2 ? parts[0].trim() : admin.district;
      
      return adminDistrict === selectedDistrict.name && admin.state === stateName;
    });
  };

  // Reset selections when state changes
  const handleStateChange = (state: string) => {
    if (state === 'clear') {
      setSelectedState('');
      setSelectedDistrict('');
      setSelectedAdmin('');
      setAvailableDistricts([]);
    } else {
      setSelectedState(state);
      setSelectedDistrict('');
      setSelectedAdmin('');
    }
  };

  // Reset admin selection when district changes
  const handleDistrictChange = (district: string) => {
    if (district === 'clear') {
      setSelectedDistrict('');
      setSelectedAdmin('');
    } else {
      setSelectedDistrict(district);
      setSelectedAdmin('');
    }
  };

  const groupedPermissions = (availablePermissions || []).reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as { [key: string]: AvailablePermission[] });

  // Flatten district admins for filtering and sorting
  const flattenedAdmins = useMemo(() => {
    const admins: Array<{
      admin: DistrictAdmin;
      state: string;
      district: string;
    }> = [];
    
    districtAdmins
      .filter(admin => admin.isActive)
      .forEach(admin => {
        const parts = admin.district?.split(',');
        const adminDistrict = parts && parts.length >= 2 ? parts[0].trim() : admin.district;
        admins.push({
          admin,
          state: admin.state || '',
          district: adminDistrict || ''
        });
      });
    
    return admins;
  }, [districtAdmins]);

  // Filter and sort admins
  const filteredAndSortedAdmins = useMemo(() => {
    let filtered = flattenedAdmins.filter(({ admin, state, district }) => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        district.toLowerCase().includes(searchQuery.toLowerCase());
      
      // State filter
      const matchesState = filterState === '' ||
        (availableStates.find(s => s.id.toString() === filterState)?.name === state);
      
      // District filter
      const matchesDistrict = filterDistrict === '' ||
        (availableDistricts.find(d => d.id.toString() === filterDistrict)?.name === district);
      
      return matchesSearch && matchesState && matchesDistrict;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.admin.name.localeCompare(b.admin.name);
      } else if (sortBy === 'permissions') {
        comparison = (a.admin.permissions?.length || 0) - (b.admin.permissions?.length || 0);
      } else if (sortBy === 'state') {
        comparison = a.state.localeCompare(b.state);
      } else if (sortBy === 'district') {
        comparison = a.district.localeCompare(b.district);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [flattenedAdmins, searchQuery, filterState, filterDistrict, sortBy, sortOrder, availableStates, availableDistricts]);

  // Paginated admins
  const paginatedAdmins = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedAdmins.slice(startIndex, endIndex);
  }, [filteredAndSortedAdmins, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedAdmins.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterState, filterDistrict, sortBy, sortOrder]);

  // Toggle admin expansion
  const toggleAdminExpansion = useCallback((adminId: number) => {
    setExpandedAdmins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(adminId)) {
        newSet.delete(adminId);
      } else {
        newSet.add(adminId);
      }
      return newSet;
    });
  }, []);

  if (currentUser?.type !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <Shield className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-red-500 mb-3 sm:mb-4" />
            <CardTitle className="text-lg sm:text-xl">{t('admin.permissions.assign.accessDenied')}</CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2">
              {t('admin.permissions.assign.onlySuperadmins')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base">{t('admin.permissions.assign.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{t('admin.permissions.assign.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('admin.permissions.assign.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Assignment Form */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              {t('admin.permissions.assign.assignNewPermissions')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('admin.permissions.assign.selectDistrictAdminDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
             <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
               {/* Gallery-style Filter Section */}
               <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                   <Label className="text-xs sm:text-sm md:text-base font-medium">{t('admin.permissions.assign.filterDistrictAdmins')}</Label>
                   {(selectedState || selectedDistrict) && (
                     <Button
                       type="button"
                       onClick={() => {
                         setSelectedState('');
                         setSelectedDistrict('');
                         setSelectedAdmin('');
                         setAvailableDistricts([]);
                       }}
                       variant="outline"
                       size="sm"
                       title="Clear all filters"
                       className="w-full sm:w-auto text-xs sm:text-sm"
                     >
                       {t('admin.permissions.assign.clearFilters')}
                     </Button>
                   )}
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
                   {/* State Selection */}
                   <div className="space-y-1.5 sm:space-y-2">
                     <Label htmlFor="state" className="text-xs sm:text-sm font-medium">{t('admin.permissions.assign.selectState')}</Label>
                     <Select 
                       value={selectedState || ''} 
                       onValueChange={handleStateChange}
                     >
                       <SelectTrigger className="h-9 sm:h-9 md:h-10 text-xs sm:text-sm w-full">
                         <SelectValue placeholder={t('admin.members.allStates')} />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="clear">{t('admin.members.allStates')}</SelectItem>
                         {availableStates.map(state => (
                           <SelectItem key={state.id} value={state.id.toString()}>
                             {state.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>

                   {/* District Selection */}
                   <div className="space-y-1.5 sm:space-y-2">
                     <Label htmlFor="district" className="text-xs sm:text-sm font-medium">{t('admin.permissions.assign.selectDistrict')}</Label>
                     <Select 
                       value={selectedDistrict || ''} 
                       onValueChange={handleDistrictChange}
                       disabled={!selectedState}
                     >
                       <SelectTrigger className="h-9 sm:h-9 md:h-10 text-xs sm:text-sm w-full">
                         <SelectValue placeholder={selectedState ? t('admin.members.allDistricts') : t('admin.permissions.assign.selectDistrictFirst')} />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="clear">{t('admin.members.allDistricts')}</SelectItem>
                         {availableDistricts.map(district => (
                           <SelectItem key={district.id} value={district.id.toString()}>
                             {district.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                 {/* District Admin Selection */}
                 <div className="space-y-1.5 sm:space-y-2">
                   <Label htmlFor="admin" className="text-xs sm:text-sm font-medium">{t('admin.permissions.assign.selectDistrictAdmin')}</Label>
                   <Select 
                     value={selectedAdmin || ''} 
                     onValueChange={setSelectedAdmin}
                     disabled={!selectedDistrict}
                   >
                     <SelectTrigger className="h-9 sm:h-9 md:h-10 text-xs sm:text-sm w-full">
                       <SelectValue placeholder={selectedDistrict ? t('admin.permissions.assign.chooseDistrictAdmin') : t('admin.permissions.assign.selectDistrictFirst')} />
                     </SelectTrigger>
                     <SelectContent className="max-h-[300px]">
                       {getAdminsForDistrict(selectedDistrict).length === 0 ? (
                         <div className="px-2 py-1.5 text-xs text-gray-500 text-center">
                           {t('admin.permissions.assign.noDistrictAdmins')}
                         </div>
                       ) : (
                         getAdminsForDistrict(selectedDistrict).map((admin) => (
                           <SelectItem key={admin.id} value={admin.id.toString()} className="py-2.5">
                             <div className="flex flex-col gap-1 w-full min-w-0">
                               <span className="truncate font-medium text-sm">{admin.name}</span>
                               <span className="truncate text-xs text-gray-500">{admin.email}</span>
                             </div>
                           </SelectItem>
                         ))
                       )}
                     </SelectContent>
                   </Select>
                   {selectedAdmin && (() => {
                     const selectedAdminData = getAdminsForDistrict(selectedDistrict).find(a => a.id.toString() === selectedAdmin);
                     return selectedAdminData ? (
                       <div className="mt-1.5 sm:mt-2 p-2 sm:p-2.5 rounded-md sm:rounded-lg bg-gray-50 border border-gray-200">
                         <div className="flex flex-col gap-0.5 sm:gap-1">
                           <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{selectedAdminData.name}</span>
                           <span className="text-xs text-gray-500 break-all">{selectedAdminData.email}</span>
                         </div>
                       </div>
                     ) : null;
                   })()}
                 </div>
               </div>

              {/* Quick Select Template removed per requirement */}

              {/* Permissions Selection */}
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <Label className="text-xs sm:text-sm font-medium">{t('admin.permissions.assign.selectPermissions')}</Label>
                <div className="space-y-2 sm:space-y-3 md:space-y-4 max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto border rounded-lg p-2.5 sm:p-3 md:p-4">
                  {loading ? (
                    <div className="text-center py-4 text-xs sm:text-sm text-gray-500">
                      {t('admin.permissions.assign.loadingPermissions')}
                    </div>
                  ) : Object.keys(groupedPermissions).length === 0 ? (
                    <div className="text-center py-4 text-xs sm:text-sm text-gray-500">
                      {t('admin.permissions.assign.noPermissionsAvailable')}
                    </div>
                  ) : (
                    Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-xs sm:text-sm text-gray-700">
                        {getPermissionCategory(category)}
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {permissions.map((permission) => (
                          <div key={`${category}-${permission.key}`} className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-2.5 md:p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-start space-x-2.5 sm:space-x-3 flex-1 min-w-0">
                            <Checkbox
                              id={permission.key}
                              checked={selectedPermissions.includes(permission.key)}
                              onCheckedChange={(checked) => handlePermissionToggle(permission.key, checked === true)}
                              className="mt-0.5 flex-shrink-0"
                            />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                <Label 
                                  htmlFor={permission.key}
                                    className="text-xs sm:text-sm font-medium cursor-pointer break-words"
                                >
                                  {permission.name}
                                </Label>
                                <Badge variant={permission.type === 'permanent' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs px-1.5 py-0 flex-shrink-0">
                                    {permission.type === 'permanent' ? t('admin.permissions.assign.permanent') : t('admin.permissions.assign.timeBased')}
                                </Badge>
                              </div>
                                <p className="text-xs text-gray-500 line-clamp-2 sm:line-clamp-none break-words">
                                {permission.description}
                              </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* Expiration Days Input (only for time-based permissions) */}
              {selectedPermissions.some(p => {
                const permission = availablePermissions.find(ap => ap.key === p);
                return permission?.type === 'temporary';
              }) && (
                <div className="space-y-2">
                  <Label htmlFor="expirationDays" className="text-xs sm:text-sm font-medium">
                    {t('admin.permissions.assign.expirationDays')} ({t('admin.permissions.assign.timeBasedPermissions')})
                  </Label>
                  <Input
                    id="expirationDays"
                    type="text"
                    inputMode="numeric"
                    value={expirationDaysInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string, numbers only, and prevent leading zeros except single digit
                      if (value === '' || /^\d+$/.test(value)) {
                        setExpirationDaysInput(value);
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 1 && numValue <= 365) {
                          setExpirationDays(numValue);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value === '') {
                        setExpirationDaysInput('30');
                        setExpirationDays(30);
                      } else {
                        const numValue = parseInt(value);
                        if (isNaN(numValue) || numValue < 1) {
                          setExpirationDaysInput('30');
                          setExpirationDays(30);
                        } else if (numValue > 365) {
                          setExpirationDaysInput('365');
                          setExpirationDays(365);
                        } else {
                          setExpirationDaysInput(String(numValue));
                          setExpirationDays(numValue);
                        }
                      }
                    }}
                    className="w-full sm:w-40 h-9 sm:h-10 text-sm"
                    placeholder="30"
                  />
                  <p className="text-xs text-gray-500">
                    {t('admin.permissions.assign.willExpireOn')} {(() => {
                      const expiryDate = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);
                      const day = String(expiryDate.getDate()).padStart(2, '0');
                      const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
                      const year = expiryDate.getFullYear();
                      return `${day}/${month}/${year}`;
                    })()}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full">
                <Button 
                  type="submit" 
                  className="w-full sm:flex-1 h-9 sm:h-8 md:h-9 px-4 sm:px-3 md:px-4 text-xs sm:text-xs md:text-sm font-medium"
                  disabled={submitting || !selectedState || !selectedDistrict || !selectedAdmin || selectedPermissions.length === 0}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 border-b-2 border-white mr-1.5 sm:mr-1 md:mr-1.5"></div>
                      <span className="text-xs">{t('admin.permissions.assign.assigningPermissions')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 mr-1.5 sm:mr-1 md:mr-1.5 flex-shrink-0" />
                      <span className="text-xs whitespace-nowrap">{t('admin.permissions.assign.assign')}</span>
                    </>
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="destructive"
                  className="w-full sm:flex-1 h-9 sm:h-8 md:h-9 px-4 sm:px-3 md:px-4 text-xs sm:text-xs md:text-sm font-medium"
                  disabled={submitting || !selectedAdmin || selectedPermissions.length === 0}
                  onClick={handleRevoke}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 border-b-2 border-white mr-1.5 sm:mr-1 md:mr-1.5"></div>
                      <span className="text-xs">{t('admin.permissions.assign.revoking')}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-3.5 w-3.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 mr-1.5 sm:mr-1 md:mr-1.5 flex-shrink-0" />
                      <span className="text-xs whitespace-nowrap">{t('admin.permissions.assign.revoke')}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Current Assignments Preview */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  {t('admin.permissions.assign.currentAssignments')} ({filteredAndSortedAdmins.length})
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t('admin.permissions.assign.viewExisting')}
                </CardDescription>
              </div>
              <button
                onClick={() => setCompactMode(!compactMode)}
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                title={compactMode ? t('admin.permissions.assign.normalView') : t('admin.permissions.assign.compactView')}
              >
                {compactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Search and Filters */}
            <div className="space-y-3 mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder={t('admin.permissions.assign.searchAdmins')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 text-sm"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={filterState || ''} onValueChange={(value) => {
                  if (value === 'clear') {
                    setFilterState('');
                  } else {
                    setFilterState(value);
                  }
                }}>
                  <SelectTrigger className="h-8 text-xs flex-1 min-w-[100px]">
                    <SelectValue placeholder={t('admin.permissions.assign.allStates')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">{t('admin.permissions.assign.allStates')}</SelectItem>
                    {availableStates.map(state => (
                      <SelectItem key={state.id} value={state.id.toString()}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterDistrict || ''} onValueChange={(value) => {
                  if (value === 'clear') {
                    setFilterDistrict('');
                  } else {
                    setFilterDistrict(value);
                  }
                }} disabled={!filterState}>
                  <SelectTrigger className="h-8 text-xs flex-1 min-w-[100px]">
                    <SelectValue placeholder={filterState ? t('admin.permissions.assign.allDistricts') : t('admin.permissions.assign.selectStateFirst')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clear">{t('admin.permissions.assign.allDistricts')}</SelectItem>
                    {filterState && availableDistricts
                      .filter(d => {
                        const selectedStateObj = availableStates.find(s => s.id.toString() === filterState);
                        return selectedStateObj && d.state_code === selectedStateObj.code;
                      })
                      .map(district => (
                        <SelectItem key={district.id} value={district.id.toString()}>
                          {district.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                  <SelectTrigger className="h-8 text-xs min-w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">{t('admin.permissions.assign.sortByName')}</SelectItem>
                    <SelectItem value="permissions">{t('admin.permissions.assign.sortByPermissions')}</SelectItem>
                    <SelectItem value="state">{t('admin.permissions.assign.sortByState')}</SelectItem>
                    <SelectItem value="district">{t('admin.permissions.assign.sortByDistrict')}</SelectItem>
                  </SelectContent>
                </Select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors flex items-center gap-1 h-8"
                  title={sortOrder === 'asc' ? t('admin.permissions.assign.sortAscending') : t('admin.permissions.assign.sortDescending')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
             <div className={`${compactMode ? 'space-y-2' : 'space-y-3'} max-h-[600px] sm:max-h-[800px] overflow-y-auto`}>
               {filteredAndSortedAdmins.length === 0 ? (
                 <div className="text-center py-8 text-sm text-gray-500">
                  {districtAdmins.length === 0 
                    ? t('admin.permissions.assign.noDistrictAdmins')
                    : t('admin.permissions.assign.noAdminsFound')}
                 </div>
               ) : (
                 <>
                   {paginatedAdmins.map(({ admin, state, district }) => {
                     const isExpanded = expandedAdmins.has(admin.id);
                     const permissionCount = admin.permissions?.length || 0;
                     
                     return (
                       <div key={admin.id} className={`border rounded-lg ${compactMode ? 'p-2' : 'p-3 sm:p-4'} transition-colors hover:bg-gray-50`}>
                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                           <div className="min-w-0 flex-1">
                             <div className="flex items-center gap-2 flex-wrap">
                               <h6 className={`font-medium ${compactMode ? 'text-sm' : 'text-base'} truncate`}>
                                 {admin.name}
                               </h6>
                               <Badge variant="outline" className={`${compactMode ? 'text-xs px-1.5 py-0' : 'text-xs'}`}>
                                 {permissionCount} {t('admin.permissions.assign.permissions')}
                               </Badge>
                             </div>
                             <p className={`${compactMode ? 'text-xs' : 'text-sm'} text-gray-600 truncate`}>
                               {admin.email}
                             </p>
                             {!compactMode && (
                               <div className="flex items-center gap-2 mt-1 flex-wrap">
                                 <span className="text-xs text-gray-500">{state}</span>
                                 {district && <span className="text-xs text-gray-500">• {district}</span>}
                               </div>
                             )}
                           </div>
                           
                           <div className="flex items-center gap-2 flex-shrink-0">
                             {permissionCount > 0 && (
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => toggleAdminExpansion(admin.id)}
                                 className={`text-xs h-7 px-2`}
                               >
                                 {isExpanded ? t('admin.permissions.assign.hidePermissions') : t('admin.permissions.assign.showPermissions')}
                               </Button>
                             )}
                             <Button
                               size="sm"
                               variant="destructive"
                               onClick={() => revokeAll(admin.id)}
                               className={`text-xs h-7 px-2`}
                             >
                               {t('admin.permissions.assign.revokeAll')}
                             </Button>
                           </div>
                         </div>
                         
                         {isExpanded && admin.permissions && admin.permissions.length > 0 && (
                           <div className={`mt-3 pt-3 border-t flex flex-wrap gap-2`}>
                             {[...new Set(admin.permissions)].map((permission, index) => (
                               <div key={`${admin.id}-${permission}-${index}`} className="flex items-center gap-1">
                                 <Badge variant="secondary" className="text-xs">{permission}</Badge>
                                 <Button
                                   size="icon"
                                   variant="ghost"
                                   className="h-6 w-6 text-xs hover:bg-red-100 hover:text-red-600"
                                   onClick={() => revokePermission(admin.id, permission)}
                                 >
                                   ×
                                 </Button>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                     );
                   })}
                   
                   {/* Pagination */}
                   {totalPages > 1 && (
                     <div className={`${compactMode ? 'p-2' : 'p-3'} border-t border-gray-200 bg-gray-50 sticky bottom-0 mt-4`}>
                       <div className="flex items-center justify-between gap-2">
                         <div className="text-xs text-gray-600">
                           {t('admin.permissions.assign.page')} {currentPage} {t('admin.permissions.assign.of')} {totalPages} ({filteredAndSortedAdmins.length} {t('admin.permissions.assign.admins')})
                         </div>
                         <div className="flex gap-1">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => setCurrentPage(1)}
                             disabled={currentPage === 1}
                             className="h-7 w-7 p-0"
                             title={t('admin.permissions.assign.firstPage')}
                           >
                             <ChevronsLeft className="w-4 h-4" />
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                             disabled={currentPage === 1}
                             className="h-7 w-7 p-0"
                             title={t('admin.permissions.assign.previousPage')}
                           >
                             <ChevronLeft className="w-4 h-4" />
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                             disabled={currentPage === totalPages}
                             className="h-7 w-7 p-0"
                             title={t('admin.permissions.assign.nextPage')}
                           >
                             <ChevronRight className="w-4 h-4" />
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => setCurrentPage(totalPages)}
                             disabled={currentPage === totalPages}
                             className="h-7 w-7 p-0"
                             title={t('admin.permissions.assign.lastPage')}
                           >
                             <ChevronsRight className="w-4 h-4" />
                           </Button>
                         </div>
                       </div>
                     </div>
                   )}
                 </>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
