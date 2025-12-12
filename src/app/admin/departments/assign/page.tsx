"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Loader2, Search, UserPlus, Trash2, UserCheck, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';

type Department = {
  id: number;
  name_en: string;
  name_hi: string;
  level: 'national' | 'state' | 'district';
  state: string | null;
  district: string | null;
  created_at: string;
};

type Post = {
  id: number;
  department_id: number;
  name_en: string;
  name_hi: string;
  position_order: number;
  created_at: string;
};

type Member = {
  id: number;
  name: string;
  email: string;
  phone: string;
  member_reg_number: string;
  profile_photo_path: string | null;
  updated_at?: string | null;
  district: string | null;
  state: string | null;
};

type DepartmentMember = {
  id: number;
  post_id: number;
  member_id: number;
  assigned_at: string;
  post_name_en: string;
  post_name_hi: string;
  position_order: number;
  member_name: string;
  member_email: string;
  member_reg_number: string;
  profile_photo_path: string | null;
  member_updated_at?: string | null;
  level: 'national' | 'state' | 'district' | 'divisional';
  state: string | null;
  district: string | null;
  division: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
};

// Helper function to add cache-busting to image URLs
const getImageUrlWithCacheBust = (photoPath: string | null, updatedAt?: string | null): string => {
  if (!photoPath) return '';
  const baseUrl = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
  // Use updated_at timestamp if available, otherwise use current timestamp
  const cacheBust = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}_t=${cacheBust}`;
};

export default function AssignMembersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, hasPermission } = useAdmin();
  const { t, language } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<DepartmentMember[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  
  // Level selection for department
  const [selectedLevel, setSelectedLevel] = useState<'national' | 'state' | 'district' | 'divisional'>('national');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [divisions, setDivisions] = useState<Array<{id: number, division_name_english: string, division_name_hindi: string}>>([]);
  
  // National Executive Department state
  const [nationalExecutiveDept, setNationalExecutiveDept] = useState<Department | null>(null);
  const [nationalExecutivePosts, setNationalExecutivePosts] = useState<Post[]>([]);
  const [nationalExecutiveMembers, setNationalExecutiveMembers] = useState<DepartmentMember[]>([]);
  const [isLoadingNationalExecutive, setIsLoadingNationalExecutive] = useState(false);
  
  // Member assignment dialog
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [eligibleMembers, setEligibleMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState('select');
  const [customValidUntil, setCustomValidUntil] = useState<string>('');
  const [useCustomValidity, setUseCustomValidity] = useState(false);

  // Check if user is superadmin or district admin with permission
  useEffect(() => {
    if (!currentUser) return;
    
    if (currentUser.type === 'superadmin') {
      return; // Superadmin has full access
    }
    
    if (currentUser.type === 'district_admin') {
      // Check if district admin has the required permission
      if (!hasPermission('assign_members_to_departments')) {
      router.push('/admin');
        toast({
          title: t('admin.departments.assign.accessDenied'),
          description: t('admin.departments.assign.noPermission'),
          variant: 'destructive',
        });
      }
      return;
    }
    
    // Not authorized
    router.push('/admin');
  }, [currentUser, router, toast, hasPermission]);

  // Auto-set default values for district admins (but allow them to change)
  useEffect(() => {
    if (currentUser?.type === 'district_admin' && currentUser.district && currentUser.state) {
      // Default to district level, but don't force it - allow them to choose
      if (!selectedLevel) {
      setSelectedLevel('district');
      }
      if (!selectedState) {
      setSelectedState(currentUser.state);
      }
      if (!selectedDistrict && selectedLevel === 'district') {
      setSelectedDistrict(currentUser.district);
    }
    }
  }, [currentUser, selectedLevel, selectedState, selectedDistrict]);

  // Fetch states when component mounts
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch('/api/locations?type=states', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        if (data.states) {
          setStates(data.states);
        }
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };

    fetchStates();
  }, []);

  // Fetch districts when selected state changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedState) {
        setDistricts([]);
        return;
      }

      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/locations?type=districts&state=${encodeURIComponent(selectedState)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        if (data.districts) {
          setDistricts(data.districts);
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
      }
    };

    fetchDistricts();
  }, [selectedState]);

  // Fetch divisions when selected state changes (for all levels, to enable divisional filtering)
  useEffect(() => {
    const fetchDivisions = async () => {
      if (!selectedState) {
        setDivisions([]);
        // Only clear selectedDivision if level is not divisional (to preserve it when filtering)
        if (selectedLevel !== 'divisional') {
          setSelectedDivision('all');
        }
        return;
      }

      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/divisions?stateName=${encodeURIComponent(selectedState)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        console.log('[Assign Page] Divisions API response:', data);
        if (data.success && data.data) {
          console.log(`[Assign Page] Found ${data.data.length} divisions for state: ${selectedState}`);
          setDivisions(data.data);
        } else {
          console.warn('[Assign Page] No divisions found or API error:', data.error || data);
          setDivisions([]);
        }
      } catch (error) {
        console.error('Error fetching divisions:', error);
        setDivisions([]);
      }
    };

    fetchDivisions();
  }, [selectedState, selectedLevel]);

  // Fetch all departments (no level filtering - level is chosen when assigning)
  // For district admins, filter out National Executive department
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);

      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/departments?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        
        if (data.departments) {
          let depts = data.departments;
          
          // For district admins, filter out National Executive department
          if (currentUser?.type === 'district_admin') {
            // Filter out any department marked as national executive (check directly in the data)
            // We don't need to call the API - just filter based on is_national_executive flag if available
            // Or we can query the database directly, but for now, just skip the API call
            // The departments list should already exclude national executive if the API filters it
            // If not, we'll filter client-side by checking if any dept has is_national_executive flag
            depts = depts.filter((d: Department) => !(d as any).is_national_executive);
          }
          
          setDepartments(depts);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast({
          title: t('admin.departments.assign.error'),
          description: t('admin.departments.assign.failedToLoadDepartments'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, [toast, currentUser]);

  // Fetch National Executive Department and its data (only for superadmins)
  useEffect(() => {
    // District admins should not see National Executive Department
    if (currentUser?.type === 'district_admin') {
      setNationalExecutiveDept(null);
      setNationalExecutivePosts([]);
      setNationalExecutiveMembers([]);
      return;
    }

    const fetchNationalExecutive = async () => {
      setIsLoadingNationalExecutive(true);
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/departments/national-executive?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        
        if (data.success && data.department) {
          setNationalExecutiveDept(data.department);
          
          // Fetch posts for National Executive Department
          const token2 = localStorage.getItem('admin_token');
          const postsResponse = await fetch(`/api/departments/${data.department.id}/posts?_t=${Date.now()}`, {
            cache: 'no-store',
            headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
          });
          const postsData = await postsResponse.json();
          if (postsData.posts) {
            setNationalExecutivePosts(postsData.posts);
          }

          // Fetch members for National Executive Department (national level only)
          const token3 = localStorage.getItem('admin_token');
          const membersResponse = await fetch(`/api/departments/${data.department.id}/members?level=national&_t=${Date.now()}`, {
            cache: 'no-store',
            headers: token3 ? { 'Authorization': `Bearer ${token3}` } : {}
          });
          const membersData = await membersResponse.json();
          if (membersData.members) {
            setNationalExecutiveMembers(membersData.members);
          }
        } else {
          setNationalExecutiveDept(null);
          setNationalExecutivePosts([]);
          setNationalExecutiveMembers([]);
        }
      } catch (error) {
        console.error('Error fetching National Executive Department:', error);
        toast({
          title: t('admin.departments.assign.error'),
          description: t('admin.departments.assign.failedToLoadNationalExecutive'),
          variant: 'destructive',
        });
      } finally {
        setIsLoadingNationalExecutive(false);
      }
    };

    fetchNationalExecutive();
  }, [toast, currentUser]);

  // Reload data when page becomes visible (e.g., after updating member photo)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Reload department members when page becomes visible
        if (selectedDepartment) {
          const fetchDepartmentData = async () => {
            try {
              const token = localStorage.getItem('admin_token');
              const params = new URLSearchParams();
              // If divisional filter is selected, use divisional level for query
              const queryLevel = selectedDivision && selectedDivision !== 'all' ? 'divisional' : selectedLevel;
              params.append('level', queryLevel);
              if (queryLevel === 'state' && selectedState) {
                params.append('state', selectedState);
              } else if (queryLevel === 'district' && selectedState && selectedDistrict) {
                params.append('state', selectedState);
                params.append('district', selectedDistrict);
              } else if (queryLevel === 'divisional' && selectedState && selectedDivision && selectedDivision !== 'all') {
                params.append('state', selectedState);
                params.append('division', selectedDivision);
              }
              params.append('_t', String(Date.now()));

              const membersResponse = await fetch(`/api/departments/${selectedDepartment.id}/members?${params.toString()}`, {
                cache: 'no-store',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
              });
              const membersData = await membersResponse.json();
              if (membersData.members) {
                setDepartmentMembers(membersData.members);
              }
            } catch (error) {
              console.error('Error refreshing department members:', error);
            }
          };
          fetchDepartmentData();
        }

        // Reload National Executive members if applicable
        if (nationalExecutiveDept && currentUser?.type !== 'district_admin') {
          const fetchNationalExecutiveMembers = async () => {
            try {
              const token = localStorage.getItem('admin_token');
              const membersResponse = await fetch(`/api/departments/${nationalExecutiveDept.id}/members?level=national&_t=${Date.now()}`, {
                cache: 'no-store',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
              });
              const membersData = await membersResponse.json();
              if (membersData.members) {
                setNationalExecutiveMembers(membersData.members);
              }
            } catch (error) {
              console.error('Error refreshing national executive members:', error);
            }
          };
          fetchNationalExecutiveMembers();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedDepartment, selectedLevel, selectedState, selectedDistrict, selectedDivision, nationalExecutiveDept, currentUser]);

  // Fetch posts and department members when department/level changes
  useEffect(() => {
    const fetchDepartmentData = async () => {
      if (!selectedDepartment) return;
      
      setIsLoading(true);
      
      try {
        // Fetch posts (ensures latest structure)
        const token = localStorage.getItem('admin_token');
        const postsResponse = await fetch(`/api/departments/${selectedDepartment.id}/posts?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const postsData = await postsResponse.json();
        
        if (postsData.error) {
          console.error('Error fetching posts:', postsData.error);
          toast({
            title: 'Error',
            description: postsData.error || 'Failed to load posts',
            variant: 'destructive',
          });
          setPosts([]);
        } else if (postsData.posts) {
          setPosts(postsData.posts);
        } else {
          setPosts([]);
        }

        // Guard until required filters chosen
        if (selectedLevel === 'state' && !selectedState) {
          setDepartmentMembers([]);
          return;
        }

        if (selectedLevel === 'district' && (!selectedState || !selectedDistrict)) {
          setDepartmentMembers([]);
          return;
        }

        if (selectedLevel === 'divisional' && (!selectedState || !selectedDivision || selectedDivision === 'all')) {
          setDepartmentMembers([]);
          return;
        }

        const params = new URLSearchParams();
        // If divisional filter is selected, use divisional level for query
        const queryLevel = selectedDivision && selectedDivision !== 'all' ? 'divisional' : selectedLevel;
        params.set('level', queryLevel);
        if (queryLevel !== 'national' && selectedState) {
          params.set('state', selectedState);
        }
        if (queryLevel === 'district' && selectedDistrict) {
          params.set('district', selectedDistrict);
        }
        // Add division filter if selected (works for all levels to filter by divisional appointments)
        if (selectedDivision && selectedDivision !== 'all') {
          params.set('division', selectedDivision);
        }

        const token2 = localStorage.getItem('admin_token');
        params.append('_t', Date.now().toString());
        const membersResponse = await fetch(`/api/departments/${selectedDepartment.id}/members?${params.toString()}`, {
          cache: 'no-store',
          headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
        });
        const membersData = await membersResponse.json();
        
        if (membersData.members) {
          setDepartmentMembers(membersData.members);
        } else {
          setDepartmentMembers([]);
        }
      } catch (error) {
        console.error('Error fetching department data:', error);
        toast({
          title: t('admin.departments.assign.error'),
          description: t('admin.departments.assign.failedToLoadData'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentData();
  }, [selectedDepartment, selectedLevel, selectedState, selectedDistrict, selectedDivision, toast]);

  // Fetch eligible members when the assign dialog is opened (based on selected level)
  useEffect(() => {
    const fetchEligibleMembers = async () => {
      if (!isAssignDialogOpen || !selectedDepartment) return;
      
      // Validate required fields based on level
      if (selectedLevel === 'state' && !selectedState) {
        console.log('State level selected but no state chosen');
        setEligibleMembers([]);
        return;
      }
      
      if (selectedLevel === 'district' && (!selectedState || !selectedDistrict)) {
        console.log('District level selected but state or district not chosen');
        setEligibleMembers([]);
        return;
      }
      
      if (selectedLevel === 'divisional' && (!selectedState || !selectedDivision || selectedDivision === 'all')) {
        console.log('Divisional level selected but state or division not chosen');
        setEligibleMembers([]);
        return;
      }
      
      setIsLoading(true);
      
      try {
        let url = `/api/departments/eligible-members?level=${selectedLevel}&departmentId=${selectedDepartment.id}`;
        
        if (selectedLevel !== 'national' && selectedState) {
          url += `&state=${encodeURIComponent(selectedState)}`;
        }
        
        if (selectedLevel === 'district' && selectedDistrict) {
          url += `&district=${encodeURIComponent(selectedDistrict)}`;
        }
        
        if (selectedLevel === 'divisional' && selectedDivision && selectedDivision !== 'all') {
          url += `&division=${encodeURIComponent(selectedDivision)}`;
        }
        
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        console.log('Fetching eligible members with URL:', url);
        const token = localStorage.getItem('admin_token');
        const response = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        
        console.log('Eligible members response:', data);
        
        if (data.members) {
          setEligibleMembers(data.members);
        } else {
          setEligibleMembers([]);
        }
      } catch (error) {
        console.error('Error fetching eligible members:', error);
        toast({
          title: t('admin.departments.assign.error'),
          description: t('admin.departments.assign.failedToLoadEligibleMembers'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEligibleMembers();
  }, [isAssignDialogOpen, selectedDepartment, selectedLevel, selectedState, selectedDistrict, selectedDivision, searchQuery, toast]);

  const handleAssignMembers = async () => {
    if (!selectedDepartment || !selectedPost || selectedMembers.length === 0) return;
    
    // Validate: President post can only have one member
    if (selectedPost.position_order === 1 && selectedMembers.length > 1) {
      toast({
        title: t('admin.departments.assign.error'),
        description: t('admin.departments.assign.presidentOnlyOne'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsAssigning(true);

    try {
      // Assign all selected members to the post
      const assignments = await Promise.all(
        selectedMembers.map(async (member) => {
          const token = localStorage.getItem('admin_token');
          const response = await fetch(`/api/departments/${selectedDepartment.id}/members`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              post_id: selectedPost.id,
              member_id: member.id,
              level: selectedLevel,
              state: selectedLevel !== 'national' ? selectedState : null,
              district: selectedLevel === 'district' ? selectedDistrict : null,
              division: selectedLevel === 'divisional' && selectedDivision && selectedDivision !== 'all' ? selectedDivision : null,
              valid_until: useCustomValidity && customValidUntil ? customValidUntil : undefined,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Failed to assign ${member.name}`);
          }

          const assignedDate = new Date().toISOString().split('T')[0];
          const validUntil = useCustomValidity && customValidUntil 
            ? customValidUntil 
            : (() => {
                const date = new Date();
                date.setFullYear(date.getFullYear() + 1);
                return date.toISOString().split('T')[0];
              })();

          return {
            id: data.assignment_id,
            post_id: selectedPost.id,
            member_id: member.id,
            assigned_at: assignedDate,
            post_name_en: selectedPost.name_en,
            post_name_hi: selectedPost.name_hi,
            position_order: selectedPost.position_order,
            member_name: member.name,
            member_email: member.email,
            member_reg_number: member.member_reg_number,
            profile_photo_path: member.profile_photo_path,
            level: selectedLevel,
            state: selectedLevel !== 'national' ? selectedState : null,
            district: selectedLevel === 'district' ? selectedDistrict : null,
            division: selectedLevel === 'divisional' ? selectedDivision : null,
            valid_from: assignedDate,
            valid_until: validUntil,
          };
        })
      );

      // Add all new assignments to the list
      setDepartmentMembers(prev => [...prev, ...assignments]);

      // If assigning to National Executive Department, refresh its members list
      if (selectedDepartment && nationalExecutiveDept && selectedDepartment.id === nationalExecutiveDept.id) {
        const token2 = localStorage.getItem('admin_token');
        const membersResponse = await fetch(`/api/departments/${nationalExecutiveDept.id}/members?level=national&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
        });
        const membersData = await membersResponse.json();
        if (membersData.members) {
          setNationalExecutiveMembers(membersData.members);
        }
      } else if (selectedDepartment) {
        // Refresh department members list after assignment to ensure it's up to date
        const token2 = localStorage.getItem('admin_token');
        const params = new URLSearchParams();
        // If divisional filter is selected, use divisional level for query
        const queryLevel = selectedDivision && selectedDivision !== 'all' ? 'divisional' : selectedLevel;
        params.set('level', queryLevel);
        if (queryLevel !== 'national' && selectedState) {
          params.set('state', selectedState);
        }
        if (queryLevel === 'district' && selectedDistrict) {
          params.set('district', selectedDistrict);
        }
        // Add division filter if selected (works for all levels to filter by divisional appointments)
        if (selectedDivision && selectedDivision !== 'all') {
          params.set('division', selectedDivision);
        }
        params.append('_t', Date.now().toString());
        
        try {
          const membersResponse = await fetch(`/api/departments/${selectedDepartment.id}/members?${params.toString()}`, {
            cache: 'no-store',
            headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
          });
          const membersData = await membersResponse.json();
          if (membersData.members) {
            setDepartmentMembers(membersData.members);
          }
        } catch (refreshError) {
          console.error('Error refreshing department members after assignment:', refreshError);
          // Don't show error to user - the assignment was successful, just the refresh failed
        }
      }

      // Close dialog and reset form
      setIsAssignDialogOpen(false);
      setSelectedPost(null);
      setSelectedMembers([]);
      setSearchQuery('');
      setCustomValidUntil('');
      setUseCustomValidity(false);

      toast({
        title: t('admin.departments.assign.success'),
        description: t('admin.departments.assign.membersAssignedSuccess').replace('{count}', String(selectedMembers.length)),
      });
    } catch (error) {
      console.error('Error assigning members:', error);
      toast({
        title: t('admin.departments.assign.error'),
        description: error instanceof Error ? error.message : t('admin.departments.assign.failedToAssign'),
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveMember = async (assignmentId: number) => {
    if (!selectedDepartment) return;
    
    // Confirm before removing
    if (!window.confirm(t('admin.departments.assign.removeConfirm'))) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/departments/${selectedDepartment.id}/members/${assignmentId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      // Remove the assignment from the list
      setDepartmentMembers(prev => prev.filter(dm => dm.id !== assignmentId));

      // If removing from National Executive Department, refresh its members list
      if (selectedDepartment && nationalExecutiveDept && selectedDepartment.id === nationalExecutiveDept.id) {
        const token2 = localStorage.getItem('admin_token');
        const membersResponse = await fetch(`/api/departments/${nationalExecutiveDept.id}/members?level=national&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
        });
        const membersData = await membersResponse.json();
        if (membersData.members) {
          setNationalExecutiveMembers(membersData.members);
        }
      }

      toast({
        title: t('admin.departments.assign.success'),
        description: t('admin.departments.assign.memberRemoved'),
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: t('admin.departments.assign.error'),
        description: error instanceof Error ? error.message : t('admin.departments.assign.failedToRemove'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format date as DD/MM/YYYY
  const formatDateDDMMYYYY = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Helper function to calculate days until expiry
  const getDaysUntilExpiry = (validUntil: string | null | undefined): number | null => {
    if (!validUntil) return null;
    const expiryDate = new Date(validUntil);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to format expiry badge
  const getExpiryBadge = (validUntil: string | null | undefined) => {
    if (!validUntil) return null;
    const days = getDaysUntilExpiry(validUntil);
    if (days === null) return null;
    
    if (days < 0) {
      return { text: 'Expired', color: 'bg-red-100 text-red-800 border-red-300' };
    } else if (days <= 30) {
      return { text: `Expires in ${days} day${days !== 1 ? 's' : ''}`, color: 'bg-orange-100 text-orange-800 border-orange-300' };
    } else if (days <= 90) {
      return { text: `Expires in ${days} days`, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    } else {
      return { text: `Valid until ${formatDateDDMMYYYY(validUntil)}`, color: 'bg-green-100 text-green-800 border-green-300' };
    }
  };

  // Calculate default validity date (1 year from today)
  const getDefaultValidUntil = (): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  if (!currentUser || (currentUser.type !== 'superadmin' && currentUser.type !== 'district_admin')) {
    return null;
  }

  const isDistrictAdmin = currentUser.type === 'district_admin';

  return (
    <>
      <div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 overflow-x-hidden min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">{t('admin.departments.assign.title')}</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/departments')}
            className="flex items-center w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('admin.departments.assign.backToDepartments')}
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6 w-full">
          <TabsList className="w-full overflow-x-auto flex sm:inline-flex">
            <TabsTrigger value="select" className="text-xs sm:text-sm whitespace-nowrap">{t('admin.departments.assign.selectDepartment')}</TabsTrigger>
            {!isDistrictAdmin && (
            <TabsTrigger value="national-executive" className="text-xs sm:text-sm whitespace-nowrap">{t('admin.departments.assign.nationalExecutive')}</TabsTrigger>
            )}
            {selectedDepartment && !isDistrictAdmin && (
              <TabsTrigger value="level" className="text-xs sm:text-sm whitespace-nowrap">{t('admin.departments.assign.selectLevel')}</TabsTrigger>
            )}
            {selectedDepartment && (selectedLevel || isDistrictAdmin) && (
              <TabsTrigger value="assign" className="text-xs sm:text-sm whitespace-nowrap">{isDistrictAdmin ? t('admin.departments.assign.assignMembers') : t('admin.departments.assign.assignMembersSuperadmin')}</TabsTrigger>
            )}
          </TabsList>
          
          {/* Step indicator */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                selectedDepartment ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className={selectedDepartment ? 'text-orange-600 font-medium' : ''}>
                {t('admin.departments.assign.stepSelectDepartment')}
              </span>
            </div>
            <div className="hidden sm:block w-8 h-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                selectedLevel ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className={selectedLevel || isDistrictAdmin ? 'text-orange-600 font-medium' : ''}>
                {isDistrictAdmin ? t('admin.departments.assign.readyToAssign') : t('admin.departments.assign.stepSelectLevel')}
              </span>
            </div>
            {!isDistrictAdmin && (
              <>
            <div className="hidden sm:block w-8 h-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                selectedLevel ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className={selectedLevel ? 'text-orange-600 font-medium' : ''}>
                {t('admin.departments.assign.stepAssignMembers') || 'Assign Members'}
              </span>
            </div>
              </>
            )}
          </div>
          
          <TabsContent value="select" className="space-y-6">
            <Card className="transition-all duration-200">
              <CardHeader>
                <CardTitle>{t('admin.departments.assign.stepSelectDepartment')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : departments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t('admin.departments.assign.noDepartmentsFound')}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push('/admin/departments/create')}
                    >
                      {t('admin.departments.manage.createDepartment')}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {departments.map((department) => (
                      <Card 
                        key={department.id} 
                        className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                          selectedDepartment?.id === department.id ? 'ring-2 ring-orange-500 scale-[1.02]' : ''
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedDepartment(department);
                          // For district admins, automatically set level to district and go to assign tab
                          if (isDistrictAdmin) {
                            setSelectedLevel('district');
                            // Use requestAnimationFrame for smooth transition
                            requestAnimationFrame(() => {
                            setActiveTab('assign');
                            });
                          }
                        }}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <h3 className="font-semibold text-base sm:text-lg">{department.name_hi}</h3>
                          <p className="text-gray-600 text-xs sm:text-sm mt-1">{department.name_en}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="national-executive" className="space-y-6">
            {isLoadingNationalExecutive ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : !nationalExecutiveDept ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 mb-4">{t('admin.departments.assign.noNationalExecutiveSet')}</p>
                  <p className="text-sm text-gray-400 mb-6" dangerouslySetInnerHTML={{ __html: t('admin.departments.assign.pleaseGoToManage').replace('<strong>', '<strong>').replace('</strong>', '</strong>') }} />
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/departments/manage')}
                  >
                    {t('admin.departments.assign.goToManageDepartments')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-medium text-orange-800 mb-2 text-sm sm:text-base">{t('admin.departments.assign.nationalExecutiveAssignment')}</h3>
                  <p className="text-xs sm:text-sm text-orange-700 break-words">
                    <strong>{t('admin.departments.assign.department')}</strong> {nationalExecutiveDept.name_hi} ({nationalExecutiveDept.name_en})
                  </p>
                  <p className="text-xs text-orange-600 mt-1 break-words" dangerouslySetInnerHTML={{ __html: t('admin.departments.assign.nationalLevelOnly').replace('<strong>', '<strong>').replace('</strong>', '</strong>') }} />
                </div>
                
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl break-words">{nationalExecutiveDept.name_hi}</CardTitle>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">{nationalExecutiveDept.name_en}</p>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    {nationalExecutivePosts.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <p className="text-gray-500 text-sm sm:text-base">{t('admin.departments.assign.noPostsFound')}</p>
                        <Button 
                          variant="outline" 
                          className="mt-4 w-full sm:w-auto"
                          onClick={() => router.push(`/admin/departments/manage?department=${nationalExecutiveDept.id}`)}
                        >
                          {t('admin.departments.assign.createPosts')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {nationalExecutivePosts.map((post) => {
                          const assignments = nationalExecutiveMembers.filter(dm => dm.post_id === post.id);
                          const hasAssignments = assignments.length > 0;
                          
                          return (
                            <Card key={post.id} className="overflow-hidden">
                              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm sm:text-base break-words">
                                      {post.position_order}. {post.name_hi}
                                      {post.position_order === 1 && (
                                        <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                          President
                                        </span>
                                      )}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">{post.name_en}</p>
                                  </div>
                                  
                                  <Button
                                    onClick={() => {
                                      setSelectedPost(post);
                                      setSelectedDepartment(nationalExecutiveDept);
                                      setSelectedLevel('national');
                                      setSelectedState('');
                                      setSelectedDistrict('');
                                      setCustomValidUntil('');
                                      setUseCustomValidity(false);
                                      setIsAssignDialogOpen(true);
                                    }}
                                    className="w-full sm:w-auto shrink-0 text-xs sm:text-sm"
                                    size="sm"
                                    variant={hasAssignments ? "outline" : "default"}
                                    disabled={post.position_order === 1 && hasAssignments}
                                    title={post.position_order === 1 && hasAssignments ? 'President post can only have one member. Remove existing assignment first.' : ''}
                                  >
                                    <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">
                                    {post.position_order === 1 && hasAssignments 
                                      ? 'Remove Existing First' 
                                      : hasAssignments 
                                        ? 'Assign More' 
                                        : 'Assign Members'}
                                    </span>
                                    <span className="sm:hidden">
                                      {post.position_order === 1 && hasAssignments 
                                        ? 'Remove First' 
                                        : hasAssignments 
                                          ? 'Assign More' 
                                          : 'Assign'}
                                    </span>
                                  </Button>
                                </div>
                                
                                {hasAssignments ? (
                                  <div className="space-y-2 border-t pt-3 sm:pt-4">
                                    {assignments.map((assignment) => (
                                      <div key={assignment.id} className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                            {assignment.profile_photo_path ? (
                                              <Image
                                                src={getImageUrlWithCacheBust(assignment.profile_photo_path, assignment.member_updated_at)}
                                                alt={assignment.member_name}
                                                width={40}
                                                height={40}
                                                className="object-cover w-full h-full"
                                              />
                                            ) : (
                                              <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-800 font-semibold text-xs sm:text-sm">
                                                {assignment.member_name.charAt(0)}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-sm sm:text-base">{assignment.member_name}</p>
                                            <div className="flex text-xs text-gray-500 space-x-1 sm:space-x-2 flex-wrap gap-y-1">
                                              <span className="truncate">{assignment.member_reg_number}</span>
                                              <span>•</span>
                                              <span>{assignment.level}</span>
                                            </div>
                                            {assignment.valid_until && (
                                              <div className="mt-1">
                                                {(() => {
                                                  const badge = getExpiryBadge(assignment.valid_until);
                                                  return badge ? (
                                                    <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium border ${badge.color}`}>
                                                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                      <span className="hidden sm:inline">{badge.text}</span>
                                                      <span className="sm:hidden truncate max-w-[120px]">{badge.text}</span>
                                                    </span>
                                                  ) : null;
                                                })()}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="shrink-0 h-8 w-8 sm:h-10 sm:w-auto sm:px-3 p-0"
                                          onClick={async () => {
                                            if (!nationalExecutiveDept) return;
                                            // Confirm before removing
                                            if (!window.confirm(t('admin.departments.assign.removeConfirm'))) {
                                              return;
                                            }

                                            setIsLoading(true);
                                            try {
                                              const token = localStorage.getItem('admin_token');
                                              const response = await fetch(`/api/departments/${nationalExecutiveDept.id}/members/${assignment.id}`, {
                                                method: 'DELETE',
                                                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                                              });

                                              const data = await response.json();

                                              if (!response.ok) {
                                                throw new Error(data.error || 'Failed to remove member');
                                              }

                                              // Refresh National Executive members after removal
                                              const token2 = localStorage.getItem('admin_token');
        const membersResponse = await fetch(`/api/departments/${nationalExecutiveDept.id}/members?level=national&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
        });
                                              const membersData = await membersResponse.json();
                                              if (membersData.members) {
                                                setNationalExecutiveMembers(membersData.members);
                                              }

                                              toast({
                                                title: t('admin.departments.assign.success'),
                                                description: t('admin.departments.assign.memberRemoved'),
                                              });
                                            } catch (error) {
                                              console.error('Error removing member:', error);
                                              toast({
                                                title: t('admin.departments.assign.error'),
                                                description: error instanceof Error ? error.message : t('admin.departments.assign.failedToRemove'),
                                                variant: 'destructive',
                                              });
                                            } finally {
                                              setIsLoading(false);
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                          <span className="hidden sm:inline ml-2">Remove</span>
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-3 sm:py-4 text-gray-500 text-xs sm:text-sm border-t">
                                    {t('admin.departments.assign.noMembersAssigned')}
                                  </div>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="level" className="space-y-6">
            {selectedDepartment && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.departments.assign.selectAssignmentLevel')}</CardTitle>
                  <p className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: isDistrictAdmin 
                      ? t('admin.departments.assign.districtAdminNote').replace('{name}', selectedDepartment.name_en).replace('<strong>', '<strong>').replace('</strong>', '</strong>')
                      : t('admin.departments.assign.chooseLevelNote').replace('{name}', selectedDepartment.name_en).replace('<strong>', '<strong>').replace('</strong>', '</strong>')
                    }} />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2 sm:space-y-4">
                      <Label htmlFor="level_selection" className="text-sm">{t('admin.departments.assign.assignmentLevel')}</Label>
                      <Select
                        value={selectedLevel}
                        onValueChange={(value) => {
                          setSelectedLevel(value as 'national' | 'state' | 'district' | 'divisional');
                          if (value === 'national') {
                            setSelectedState('');
                            setSelectedDistrict('');
                            setSelectedDivision('');
                          } else if (value === 'state') {
                            setSelectedDistrict('');
                            setSelectedDivision('');
                          } else if (value === 'district') {
                            setSelectedDivision('');
                          } else if (value === 'divisional') {
                            setSelectedDistrict('');
                          }
                        }}
                        disabled={isDistrictAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.departments.assign.selectLevelPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="national">{t('admin.departments.assign.nationalLevel')}</SelectItem>
                          <SelectItem value="state">{t('admin.departments.assign.stateLevel')}</SelectItem>
                          <SelectItem value="district">{t('admin.departments.assign.districtLevel')}</SelectItem>
                          <SelectItem value="divisional">{language === 'hi' ? 'संभाग स्तर' : 'Divisional Level'}</SelectItem>
                        </SelectContent>
                      </Select>
                      {isDistrictAdmin && (
                        <p className="text-xs text-gray-500">
                          {t('admin.departments.assign.districtAdminOnlyDistrict')}
                        </p>
                      )}
                    </div>
                    
                    {selectedLevel !== 'national' && (
                      <div className="space-y-2 sm:space-y-4">
                        <Label htmlFor="state_selection" className="text-sm">{t('admin.departments.assign.state')}</Label>
                        <Select
                          value={selectedState}
                          onValueChange={(value) => {
                            setSelectedState(value);
                            setSelectedDistrict('');
                            setSelectedDivision('');
                          }}
                          disabled={isDistrictAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin.departments.assign.selectStatePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {states.map((stateName) => (
                              <SelectItem key={stateName} value={stateName}>
                                {stateName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isDistrictAdmin && (
                          <p className="text-xs text-gray-500">
                            {t('admin.departments.assign.lockedToState')}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {selectedLevel === 'district' && (
                      <div className="space-y-2 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                        <Label htmlFor="district_selection" className="text-sm">{t('admin.departments.assign.district')}</Label>
                        <Select
                          value={selectedDistrict}
                          onValueChange={setSelectedDistrict}
                          disabled={!selectedState || isDistrictAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin.departments.assign.selectDistrictPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((districtName) => (
                              <SelectItem key={districtName} value={districtName}>
                                {districtName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isDistrictAdmin && (
                          <p className="text-xs text-gray-500">
                            {t('admin.departments.assign.lockedToDistrict')}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {selectedLevel === 'divisional' && (
                      <div className="space-y-2 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                        <Label htmlFor="division_selection" className="text-sm">{language === 'hi' ? 'संभाग' : 'Division'}</Label>
                        <Select
                          value={selectedDivision}
                          onValueChange={setSelectedDivision}
                          disabled={!selectedState || isDistrictAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'hi' ? 'संभाग चुनें' : 'Select Division'} />
                          </SelectTrigger>
                          <SelectContent>
                            {divisions.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {selectedState ? (language === 'hi' ? `${selectedState} के लिए कोई संभाग नहीं मिला` : `No divisions found for ${selectedState}`) : (language === 'hi' ? 'पहले राज्य चुनें' : 'Select state first')}
                              </div>
                            ) : (
                              divisions.map((division) => (
                                <SelectItem key={division.id} value={division.division_name_english}>
                                  {language === 'hi' ? division.division_name_hindi : division.division_name_english}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {isDistrictAdmin && (
                          <p className="text-xs text-gray-500">
                            Locked to your state
                          </p>
                        )}
                        {selectedState && divisions.length === 0 && (
                          <p className="text-xs text-yellow-600">
                            No divisions available for this state. Make sure divisions are added to the database.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Level selection summary */}
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">Selected Configuration:</h3>
                    <p className="text-xs sm:text-sm text-blue-700 break-words">
                      <strong>Department:</strong> {selectedDepartment.name_hi} ({selectedDepartment.name_en})
                    </p>
                    <p className="text-xs sm:text-sm text-blue-700 break-words mt-1">
                      <strong>Level:</strong> {selectedLevel}
                      {selectedLevel === 'state' && selectedState && (
                        <span> • <strong>State:</strong> {selectedState}</span>
                      )}
                      {selectedLevel === 'district' && selectedState && selectedDistrict && (
                        <span> • <strong>State:</strong> {selectedState} • <strong>District:</strong> {selectedDistrict}</span>
                      )}
                      {selectedLevel === 'divisional' && selectedState && selectedDivision && selectedDivision !== 'all' && (
                        <span> • <strong>State:</strong> {selectedState} • <strong>Division:</strong> {selectedDivision}</span>
                      )}
                    </p>
                    <p className="text-xs text-blue-600 mt-2 break-words">
                      All members assigned to this department will be assigned at the {selectedLevel} level
                      {selectedLevel === 'state' && selectedState && ` for ${selectedState}`}
                      {selectedLevel === 'district' && selectedState && selectedDistrict && ` for ${selectedDistrict}, ${selectedState}`}
                      {selectedLevel === 'divisional' && selectedState && selectedDivision && selectedDivision !== 'all' && ` for ${selectedDivision}, ${selectedState}`}.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="assign" className="space-y-6">
            {selectedDepartment && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 transition-all duration-200">
                  <h3 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">{t('admin.departments.assign.assignmentConfiguration')}</h3>
                  <p className="text-xs sm:text-sm text-blue-700 break-words">
                    <strong>{t('admin.departments.assign.department')}</strong> {selectedDepartment.name_hi} • 
                    <strong> {t('admin.departments.assign.level')}</strong> {isDistrictAdmin ? t('admin.departments.assign.districtLevel') : selectedLevel === 'national' ? t('admin.departments.assign.nationalLevel') : selectedLevel === 'state' ? t('admin.departments.assign.stateLevel') : t('admin.departments.assign.districtLevel')}
                    {isDistrictAdmin && currentUser?.state && currentUser?.district && (
                      ` • ${t('admin.departments.assign.state')}: ${currentUser.state} • ${t('admin.departments.assign.district')}: ${currentUser.district}`
                    )}
                    {!isDistrictAdmin && selectedLevel === 'state' && selectedState && ` • ${t('admin.departments.assign.state')}: ${selectedState}`}
                    {!isDistrictAdmin && selectedLevel === 'district' && selectedState && selectedDistrict && ` • ${t('admin.departments.assign.state')}: ${selectedState} • ${t('admin.departments.assign.district')}: ${selectedDistrict}`}
                    {!isDistrictAdmin && selectedLevel === 'divisional' && selectedState && selectedDivision && selectedDivision !== 'all' && ` • ${t('admin.departments.assign.state')}: ${selectedState} • Division: ${selectedDivision}`}
                  </p>
                  <p className="text-xs text-blue-600 mt-1 break-words">
                    {t('admin.departments.assign.allMembersAssignedAtLevel').replace('{level}', isDistrictAdmin ? t('admin.departments.assign.districtLevel') : selectedLevel === 'national' ? t('admin.departments.assign.nationalLevel') : selectedLevel === 'state' ? t('admin.departments.assign.stateLevel') : t('admin.departments.assign.districtLevel'))}
                  </p>
                </div>
                
                <Card>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl break-words">{selectedDepartment.name_hi}</CardTitle>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">{selectedDepartment.name_en}</p>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="mb-4">
                          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium mb-2">No posts found in this department</p>
                        {isDistrictAdmin ? (
                          <p className="text-sm text-gray-500">
                            Please contact the superadmin to create posts for this department.
                          </p>
                        ) : (
                          <>
                            <p className="text-sm text-gray-500 mb-4">
                              You need to create posts for this department before assigning members.
                            </p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => router.push(`/admin/departments/manage?department=${selectedDepartment.id}`)}
                        >
                          Create Posts
                        </Button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {posts.map((post) => {
                          const assignments = departmentMembers.filter(dm => dm.post_id === post.id);
                          const hasAssignments = assignments.length > 0;
                          
                          return (
                            <Card key={post.id} className="overflow-hidden">
                              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm sm:text-base break-words">
                                      {post.position_order}. {post.name_hi}
                                      {post.position_order === 1 && (
                                        <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                          President
                                        </span>
                                      )}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">{post.name_en}</p>
                                  </div>
                                  
                                  <Button
                                    onClick={() => {
                                      setSelectedPost(post);
                                      setCustomValidUntil('');
                                      setUseCustomValidity(false);
                                      setIsAssignDialogOpen(true);
                                    }}
                                    className="w-full sm:w-auto shrink-0 text-xs sm:text-sm"
                                    size="sm"
                                    variant={hasAssignments ? "outline" : "default"}
                                    disabled={post.position_order === 1 && hasAssignments}
                                    title={post.position_order === 1 && hasAssignments ? 'President post can only have one member. Remove existing assignment first.' : ''}
                                  >
                                    <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">
                                    {post.position_order === 1 && hasAssignments 
                                      ? 'Remove Existing First' 
                                      : hasAssignments 
                                        ? 'Assign More' 
                                        : 'Assign Members'}
                                    </span>
                                    <span className="sm:hidden">
                                      {post.position_order === 1 && hasAssignments 
                                        ? 'Remove First' 
                                        : hasAssignments 
                                          ? 'Assign More' 
                                          : 'Assign'}
                                    </span>
                                  </Button>
                                </div>
                                
                                {hasAssignments ? (
                                  <div className="space-y-2 border-t pt-3 sm:pt-4">
                                    {assignments.map((assignment) => (
                                      <div key={assignment.id} className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                            {assignment.profile_photo_path ? (
                                              <Image
                                                src={getImageUrlWithCacheBust(assignment.profile_photo_path, assignment.member_updated_at)}
                                                alt={assignment.member_name}
                                                width={40}
                                                height={40}
                                                className="object-cover w-full h-full"
                                              />
                                            ) : (
                                              <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-800 font-semibold text-xs sm:text-sm">
                                                {assignment.member_name.charAt(0)}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-sm sm:text-base">{assignment.member_name}</p>
                                            <div className="flex text-xs text-gray-500 space-x-1 sm:space-x-2 flex-wrap gap-y-1">
                                              <span className="truncate">{assignment.member_reg_number}</span>
                                              <span>•</span>
                                              <span>{assignment.level}</span>
                                              {assignment.state && (
                                                <>
                                                  <span>•</span>
                                                  <span className="truncate">{assignment.state}</span>
                                                </>
                                              )}
                                              {assignment.district && (
                                                <>
                                                  <span>•</span>
                                                  <span className="truncate">{assignment.district}</span>
                                                </>
                                              )}
                                              {assignment.division && (
                                                <>
                                                  <span>•</span>
                                                  <span className="truncate">{assignment.division}</span>
                                                </>
                                              )}
                                            </div>
                                            {assignment.valid_until && (
                                              <div className="mt-1">
                                                {(() => {
                                                  const badge = getExpiryBadge(assignment.valid_until);
                                                  return badge ? (
                                                    <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium border ${badge.color}`}>
                                                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                      <span className="hidden sm:inline">{badge.text}</span>
                                                      <span className="sm:hidden truncate max-w-[120px]">{badge.text}</span>
                                                    </span>
                                                  ) : null;
                                                })()}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleRemoveMember(assignment.id)}
                                          className="shrink-0 h-8 w-8 sm:h-10 sm:w-auto sm:px-3 p-0"
                                        >
                                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                          <span className="hidden sm:inline ml-2">Remove</span>
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-3 sm:py-4 text-gray-500 text-xs sm:text-sm border-t">
                                    {t('admin.departments.assign.noMembersAssigned')}
                                  </div>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign Member Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent 
          className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col w-[95vw] sm:w-full p-4 sm:p-6 overflow-hidden"
        >
          <DialogHeader className="space-y-2 sm:space-y-3">
            <DialogTitle className="text-base sm:text-lg break-words">{t('admin.departments.assign.assignMembersToPost').replace('{post}', selectedPost?.name_hi || '')}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {t('admin.departments.assign.selectMembersAtLevel').replace('{level}', selectedLevel)}
            </DialogDescription>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 text-xs sm:text-sm">
              <p className="font-medium text-blue-800 mb-1">{t('admin.departments.assign.assignmentConfiguration')}</p>
              <p className="text-blue-700 break-words">
                <strong>{t('admin.departments.assign.department')}</strong> {selectedDepartment?.name_hi} • 
                <strong> {t('admin.departments.assign.post')}</strong> {selectedPost?.name_hi} • 
                <strong> {t('admin.departments.assign.level')}</strong> {selectedLevel}
                {selectedLevel === 'state' && selectedState && (
                  <span> • <strong>{t('admin.departments.assign.state')}</strong> {selectedState}</span>
                )}
                {selectedLevel === 'district' && selectedState && selectedDistrict && (
                  <span> • <strong>{t('admin.departments.assign.state')}</strong> {selectedState} • <strong>{t('admin.departments.assign.district')}</strong> {selectedDistrict}</span>
                )}
                {selectedLevel === 'divisional' && selectedState && selectedDivision && selectedDivision !== 'all' && (
                  <span> • <strong>{t('admin.departments.assign.state')}</strong> {selectedState} • <strong>Division</strong> {selectedDivision}</span>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {t('admin.departments.assign.selectedMembers')} <span className="font-medium">{selectedMembers.length}</span>
              </p>
              {selectedPost?.position_order === 1 && (
                <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800 break-words" dangerouslySetInnerHTML={{ __html: t('admin.departments.assign.presidentPostWarning').replace('<strong>', '<strong>').replace('</strong>', '</strong>') }} />
              )}
            </div>
          </DialogHeader>
          <div className="py-3 sm:py-4 space-y-3 sm:space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">

            <div className="flex items-center space-x-2 flex-shrink-0">
              <Input
                placeholder={t('admin.departments.assign.searchMembers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm sm:text-base h-9 sm:h-10"
              />
              <Button variant="outline" onClick={() => setSearchQuery('')} size="sm" className="h-9 sm:h-10 px-2 sm:px-3">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Validity Date Configuration */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <Label htmlFor="validity-toggle" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  Post Validity Period
                </Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="validity-toggle"
                    checked={useCustomValidity}
                    onChange={(e) => {
                      setUseCustomValidity(e.target.checked);
                      if (e.target.checked && !customValidUntil) {
                        setCustomValidUntil(getDefaultValidUntil());
                      }
                    }}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <Label htmlFor="validity-toggle" className="text-xs text-gray-600 cursor-pointer">
                    Custom validity
                  </Label>
                </div>
              </div>
              {useCustomValidity ? (
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={customValidUntil}
                    onChange={(e) => setCustomValidUntil(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="text-sm h-9 sm:h-10"
                  />
                  <p className="text-xs text-gray-500 break-words">
                    Default: 1 year from assignment date. Choose a custom date if needed (e.g., 2 years, 18 months).
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 break-words">
                  Default validity: <strong>1 year</strong> from assignment date
                  {customValidUntil && ` (will be ${formatDateDDMMYYYY(customValidUntil)})`}
                </p>
              )}
            </div>
            
            {/* Status message for incomplete level selection */}
            {selectedLevel === 'state' && !selectedState && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-medium">{t('admin.departments.assign.selectStateFirst')}</p>
              </div>
            )}
            
            {selectedLevel === 'district' && (!selectedState || !selectedDistrict) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-medium">{t('admin.departments.assign.selectStateDistrictFirst')}</p>
              </div>
            )}
            
            {selectedLevel === 'divisional' && (!selectedState || !selectedDivision || selectedDivision === 'all') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-medium">Please select state and division first</p>
              </div>
            )}

            <div className="border rounded-md overflow-hidden flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : eligibleMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {selectedLevel === 'state' && !selectedState 
                        ? t('admin.departments.assign.selectStateInStep2')
                        : selectedLevel === 'district' && (!selectedState || !selectedDistrict)
                        ? t('admin.departments.assign.selectStateDistrictInStep2')
                        : selectedLevel === 'divisional' && (!selectedState || !selectedDivision || selectedDivision === 'all')
                        ? 'Please select state and division in step 2'
                        : t('admin.departments.assign.noEligibleMembers')
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {eligibleMembers.map((member) => {
                      const isSelected = selectedMembers.some(m => m.id === member.id);
                      return (
                        <div
                          key={member.id}
                          className={`p-2 sm:p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer touch-manipulation ${
                            isSelected ? 'bg-orange-50' : ''
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMembers(prev => prev.filter(m => m.id !== member.id));
                            } else {
                              // For president post: only allow one selection (replace previous)
                              if (selectedPost?.position_order === 1) {
                                setSelectedMembers([member]);
                              } else {
                                setSelectedMembers(prev => [...prev, member]);
                              }
                            }
                          }}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                              {member.profile_photo_path ? (
                                <Image
                                  src={getImageUrlWithCacheBust(member.profile_photo_path, member.updated_at)}
                                  alt={member.name}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-800 font-semibold text-xs sm:text-sm">
                                  {member.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">{member.name}</p>
                              <div className="flex text-xs text-gray-500 space-x-1 sm:space-x-2 flex-wrap gap-y-1">
                                <span className="truncate">{member.member_reg_number}</span>
                                {member.state && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{member.state}</span>
                                  </>
                                )}
                                {member.district && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{member.district}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 ml-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between w-full">
            <div className="text-xs sm:text-sm text-gray-600 w-full sm:w-auto text-center sm:text-left">
                {selectedMembers.length} {t('admin.departments.assign.membersSelected')}
                {selectedPost?.position_order === 1 && selectedMembers.length > 1 && (
                <span className="text-red-600 ml-2 block sm:inline mt-1 sm:mt-0">{t('admin.departments.assign.onlyOneForPresident')}</span>
                )}
              </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} className="flex-1 sm:flex-initial text-sm">
                  {t('admin.departments.assign.cancel')}
                </Button>
                <Button 
                  onClick={handleAssignMembers} 
                  disabled={
                    isAssigning || 
                    selectedMembers.length === 0 || 
                    (selectedPost?.position_order === 1 && selectedMembers.length > 1)
                  }
                className="flex-1 sm:flex-initial text-sm"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">{t('admin.departments.assign.assigning')}</span>
                    <span className="sm:hidden">Assigning...</span>
                    </>
                  ) : (
                    selectedPost?.position_order === 1 
                      ? t('admin.departments.assign.assignMember')
                      : t('admin.departments.assign.assignMembersCount').replace('{count}', String(selectedMembers.length))
                  )}
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
