"use client";

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  UserCheck, 
  // Clock, 
  // Calendar,
  // Users,
  Save,
  // X,
  AlertCircle
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
  const [expirationType, setExpirationType] = useState<'permanent' | 'temporary'>('permanent');
  const [expirationDays, setExpirationDays] = useState<number>(30);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Gallery-style filtering state
  const [availableStates, setAvailableStates] = useState<{id: number, name: string, code: string}[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<{id: number, name: string, code: string, state_code: string}[]>([]);

  // Load filters on component mount
  useEffect(() => {
    loadFilters();
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (selectedState) {
      loadDistricts(selectedState);
    } else {
      setAvailableDistricts([]);
    }
  }, [selectedState]);

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
        toast.success('All permissions revoked');
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

  const handlePermissionToggle = (permissionKey: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionKey) 
        ? prev.filter(p => p !== permissionKey)
        : [...prev, permissionKey]
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
      
      const expiresAt = expirationType === 'temporary' 
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
          notes: notes.trim() || null
        }),
      });

       if (response.ok) {
         toast.success(t('admin.permissions.assign.assignedSuccessfully'));
         // Reset form
         setSelectedState('');
         setSelectedDistrict('');
         setSelectedAdmin('');
         setSelectedPermissions([]);
         setNotes('');
         setExpirationType('permanent');
         setExpirationDays(30);
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
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
             <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
               {/* Gallery-style Filter Section */}
               <div className="space-y-3 sm:space-y-4">
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                   <Label className="text-sm sm:text-base font-medium">{t('admin.permissions.assign.filterDistrictAdmins')}</Label>
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

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                   {/* State Selection */}
                   <div className="space-y-2">
                     <Label htmlFor="state" className="text-xs sm:text-sm">{t('admin.permissions.assign.selectState')}</Label>
                     <Select 
                       value={selectedState || undefined} 
                       onValueChange={handleStateChange}
                     >
                       <SelectTrigger className="h-9 sm:h-10 text-sm">
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
                   <div className="space-y-2">
                     <Label htmlFor="district" className="text-xs sm:text-sm">{t('admin.permissions.assign.selectDistrict')}</Label>
                     <Select 
                       value={selectedDistrict || undefined} 
                       onValueChange={handleDistrictChange}
                       disabled={!selectedState}
                     >
                       <SelectTrigger className="h-9 sm:h-10 text-sm">
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
                 <div className="space-y-2">
                   <Label htmlFor="admin" className="text-xs sm:text-sm">{t('admin.permissions.assign.selectDistrictAdmin')}</Label>
                   <Select 
                     value={selectedAdmin} 
                     onValueChange={setSelectedAdmin}
                     disabled={!selectedDistrict}
                   >
                     <SelectTrigger className="h-9 sm:h-10 text-sm">
                       <SelectValue placeholder={selectedDistrict ? t('admin.permissions.assign.chooseDistrictAdmin') : t('admin.permissions.assign.selectDistrictFirst')} />
                     </SelectTrigger>
                     <SelectContent>
                       {getAdminsForDistrict(selectedDistrict).map((admin) => (
                         <SelectItem key={admin.id} value={admin.id.toString()}>
                           <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                             <span className="truncate">{admin.name}</span>
                             <Badge variant="outline" className="text-xs w-fit">{admin.email}</Badge>
                           </div>
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>

              {/* Quick Select Template removed per requirement */}

              {/* Permissions Selection */}
              <div className="space-y-3 sm:space-y-4">
                <Label className="text-xs sm:text-sm font-medium">{t('admin.permissions.assign.selectPermissions')}</Label>
                <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-96 overflow-y-auto border rounded-lg p-3 sm:p-4">
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
                          <div key={`${category}-${permission.key}`} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg">
                            <div className="flex items-start space-x-2 flex-1 min-w-0">
                            <Checkbox
                              id={permission.key}
                              checked={selectedPermissions.includes(permission.key)}
                              onCheckedChange={() => handlePermissionToggle(permission.key)}
                                className="mt-0.5"
                            />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Label 
                                  htmlFor={permission.key}
                                    className="text-xs sm:text-sm font-medium cursor-pointer"
                                >
                                  {permission.name}
                                </Label>
                                <Badge variant={permission.type === 'permanent' ? 'default' : 'secondary'} className="text-xs">
                                    {permission.type === 'permanent' ? t('admin.permissions.assign.permanent') : t('admin.permissions.assign.timeBased')}
                                </Badge>
                              </div>
                                <p className="text-xs text-gray-500 line-clamp-2">
                                {permission.description}
                              </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedPermissions(prev => prev.includes(permission.key) ? prev : [...prev, permission.key])}
                                className="text-xs h-8 px-2 sm:px-3"
                              >
                                {t('admin.permissions.assign.grant')}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  if (!selectedAdmin) return;
                                  try {
                                    const token = localStorage.getItem('admin_token');
                                    const res = await fetch(`/api/admin/permissions/assign?district_admin_id=${selectedAdmin}&permission=${permission.key}`, { 
                                      method: 'DELETE',
                                      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                                    });
                                    if (res.ok) {
                                      toast.success(t('admin.permissions.assign.permissionRevoked'));
                                      setSelectedPermissions(prev => prev.filter(p => p !== permission.key));
                                      fetchData();
                                    } else {
                                      const err = await res.json();
                                      toast.error(err.error || t('admin.permissions.assign.failedToRevoke'));
                                    }
                                  } catch (_e) {
                                    toast.error(t('admin.permissions.assign.failedToRevoke'));
                                  }
                                }}
                                className="text-xs h-8 px-2 sm:px-3"
                              >
                                {t('admin.permissions.assign.revoke')}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>

              {/* Expiration Settings & Revocation */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Label className="text-xs sm:text-sm font-medium">{t('admin.permissions.assign.permissionDuration')}</Label>
                  <Badge variant="outline" className="text-xs w-fit">
                    {selectedPermissions.some(p => {
                      const permission = availablePermissions.find(ap => ap.key === p);
                      return permission?.type === 'permanent';
                    }) 
                      ? t('admin.permissions.assign.containsPermanent')
                      : t('admin.permissions.assign.allTimeBased')
                    }
                  </Badge>
                </div>
                
                <Alert variant="default" className="bg-blue-50 border-blue-200 p-3 sm:p-4">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    {t('admin.permissions.assign.memberPermissionsNote')}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="permanent"
                      checked={expirationType === 'permanent'}
                      onCheckedChange={() => setExpirationType('permanent')}
                      className="mt-0.5"
                    />
                    <Label htmlFor="permanent" className="text-xs sm:text-sm cursor-pointer">
                      {t('admin.permissions.assign.permanentNoExpiration')}
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="temporary"
                      checked={expirationType === 'temporary'}
                      onCheckedChange={() => setExpirationType('temporary')}
                      className="mt-0.5"
                    />
                    <Label htmlFor="temporary" className="text-xs sm:text-sm cursor-pointer">
                      {t('admin.permissions.assign.temporaryExpiresAfter')}
                    </Label>
                  </div>
                </div>
                
                {expirationType === 'temporary' && (
                  <div className="space-y-2">
                    <Label htmlFor="days" className="text-xs sm:text-sm">{t('admin.permissions.assign.expirationDays')}</Label>
                    <Input
                      id="days"
                      type="number"
                      min="1"
                      max="365"
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(parseInt(e.target.value) || 30)}
                      className="w-full sm:w-32 h-9 sm:h-10 text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      {t('admin.permissions.assign.willExpireOn')} {new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={!selectedAdmin}
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('admin_token');
                        const res = await fetch(`/api/admin/permissions/assign?district_admin_id=${selectedAdmin}`, { 
                          method: 'DELETE',
                          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                        });
                        if (res.ok) {
                          toast.success('All permissions revoked');
                          setSelectedPermissions([]);
                          fetchData();
                        } else {
                          const err = await res.json();
                          toast.error(err.error || 'Failed to revoke');
                        }
                      } catch (_e) {
                        toast.error('Failed to revoke');
                      }
                    }}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    {t('admin.permissions.assign.revokeAllImmediately')}
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs sm:text-sm">{t('admin.permissions.assign.notes')}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('admin.permissions.assign.notesPlaceholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              {/* Submit Button */}
               <Button 
                 type="submit" 
                 className="w-full"
                 size="sm"
                 disabled={submitting || !selectedState || !selectedDistrict || !selectedAdmin || selectedPermissions.length === 0}
               >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="text-xs sm:text-sm">{t('admin.permissions.assign.assigningPermissions')}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    <span className="text-xs sm:text-sm">{t('admin.permissions.assign.assignPermissions')}</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Assignments Preview */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              {t('admin.permissions.assign.currentAssignments')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('admin.permissions.assign.viewExisting')}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
             <div className="space-y-3 sm:space-y-4 max-h-[600px] sm:max-h-[800px] overflow-y-auto">
               {districtAdmins.length === 0 ? (
                 <div className="text-center py-8 text-sm text-gray-500">
                   {t('admin.permissions.assign.noDistrictAdmins')}
                 </div>
               ) : (
                 <div className="space-y-3 sm:space-y-4">
                   {availableStates.map((state) => (
                     <div key={state.id} className="space-y-2 sm:space-y-3">
                       <h4 className="font-medium text-sm sm:text-base text-gray-700 border-b pb-2">
                         {state.name}
                       </h4>
                       {districtAdmins
                         .filter(admin => admin.state === state.name && admin.isActive)
                         .reduce((districts, admin) => {
                           const parts = admin.district?.split(',');
                           const adminDistrict = parts && parts.length >= 2 ? parts[0].trim() : admin.district;
                           if (!districts.includes(adminDistrict)) {
                             districts.push(adminDistrict);
                           }
                           return districts;
                         }, [] as string[])
                         .map((district) => (
                         <div key={district} className="ml-2 sm:ml-4 space-y-2 sm:space-y-3">
                           <h5 className="font-medium text-xs sm:text-sm text-gray-600">
                             {district}
                           </h5>
                           {districtAdmins
                             .filter(admin => {
                               if (!admin.isActive) return false;
                               const parts = admin.district?.split(',');
                               const adminDistrict = parts && parts.length >= 2 ? parts[0].trim() : admin.district;
                               return adminDistrict === district && admin.state === state.name;
                             })
                             .map((admin) => (
                               <div key={admin.id} className="border rounded-lg p-3 sm:p-4 ml-2 sm:ml-4">
                               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                   <div className="min-w-0 flex-1">
                                     <h6 className="font-medium text-sm sm:text-base truncate">{admin.name}</h6>
                                     <p className="text-xs sm:text-sm text-gray-600 truncate">{admin.email}</p>
                                   </div>
                                   <div className="flex items-center gap-2 flex-shrink-0">
                                     <Badge variant="outline" className="text-xs">
                                       {admin.permissions?.length || 0} {t('admin.permissions.assign.permissions')}
                                     </Badge>
                                     <Button size="sm" variant="destructive" onClick={() => revokeAll(admin.id)} className="text-xs h-8 px-2 sm:px-3">
                                       {t('admin.permissions.assign.revokeAll')}
                                     </Button>
                                   </div>
                                 </div>
                                 {admin.permissions && admin.permissions.length > 0 && (
                                   <div className="mt-3 flex flex-wrap gap-2">
                                     {[...new Set(admin.permissions)].map((permission, index) => (
                                       <div key={`${admin.id}-${permission}-${index}`} className="flex items-center gap-1">
                                         <Badge variant="secondary" className="text-xs">{permission}</Badge>
                                         <Button size="icon" variant="destructive" className="h-6 w-6 sm:h-7 sm:w-7 text-xs" onClick={() => revokePermission(admin.id, permission)}>×</Button>
                                       </div>
                                     ))}
                                   </div>
                                 )}
                               </div>
                             ))}
                         </div>
                       ))}
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
