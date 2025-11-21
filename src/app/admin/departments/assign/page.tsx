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
import { ArrowLeft, Loader2, Search, UserPlus, Trash2, UserCheck } from 'lucide-react';
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
  level: 'national' | 'state' | 'district';
  state: string | null;
  district: string | null;
};

export default function AssignMembersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, hasPermission } = useAdmin();
  
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<DepartmentMember[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  
  // Level selection for department
  const [selectedLevel, setSelectedLevel] = useState<'national' | 'state' | 'district'>('national');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  
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
          title: 'Access Denied',
          description: 'You do not have permission to assign members to departments.',
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

  // Fetch all departments (no level filtering - level is chosen when assigning)
  // For district admins, filter out National Executive department
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);

      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch('/api/departments', {
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
          title: 'Error',
          description: 'Failed to load departments',
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
        const response = await fetch('/api/departments/national-executive', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        
        if (data.success && data.department) {
          setNationalExecutiveDept(data.department);
          
          // Fetch posts for National Executive Department
          const token2 = localStorage.getItem('admin_token');
          const postsResponse = await fetch(`/api/departments/${data.department.id}/posts`, {
            headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
          });
          const postsData = await postsResponse.json();
          if (postsData.posts) {
            setNationalExecutivePosts(postsData.posts);
          }

          // Fetch members for National Executive Department (national level only)
          const token3 = localStorage.getItem('admin_token');
          const membersResponse = await fetch(`/api/departments/${data.department.id}/members?level=national`, {
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
          title: 'Error',
          description: 'Failed to load National Executive Department',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingNationalExecutive(false);
      }
    };

    fetchNationalExecutive();
  }, [toast, currentUser]);

  // Fetch posts and department members when department/level changes
  useEffect(() => {
    const fetchDepartmentData = async () => {
      if (!selectedDepartment) return;
      
      setIsLoading(true);
      
      try {
        // Fetch posts (ensures latest structure)
        const token = localStorage.getItem('admin_token');
        const postsResponse = await fetch(`/api/departments/${selectedDepartment.id}/posts`, {
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

        const params = new URLSearchParams();
        params.set('level', selectedLevel);
        if (selectedLevel !== 'national' && selectedState) {
          params.set('state', selectedState);
        }
        if (selectedLevel === 'district' && selectedDistrict) {
          params.set('district', selectedDistrict);
        }

        const token2 = localStorage.getItem('admin_token');
        const membersResponse = await fetch(`/api/departments/${selectedDepartment.id}/members?${params.toString()}`, {
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
          title: 'Error',
          description: 'Failed to load department data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentData();
  }, [selectedDepartment, selectedLevel, selectedState, selectedDistrict, toast]);

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
      
      setIsLoading(true);
      
      try {
        let url = `/api/departments/eligible-members?level=${selectedLevel}&departmentId=${selectedDepartment.id}`;
        
        if (selectedLevel !== 'national' && selectedState) {
          url += `&state=${encodeURIComponent(selectedState)}`;
        }
        
        if (selectedLevel === 'district' && selectedDistrict) {
          url += `&district=${encodeURIComponent(selectedDistrict)}`;
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
          title: 'Error',
          description: 'Failed to load eligible members',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEligibleMembers();
  }, [isAssignDialogOpen, selectedDepartment, selectedLevel, selectedState, selectedDistrict, searchQuery, toast]);

  const handleAssignMembers = async () => {
    if (!selectedDepartment || !selectedPost || selectedMembers.length === 0) return;
    
    // Validate: President post can only have one member
    if (selectedPost.position_order === 1 && selectedMembers.length > 1) {
      toast({
        title: 'Error',
        description: 'President post can only have one member. Please select only one member.',
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
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Failed to assign ${member.name}`);
          }

          return {
            id: data.assignment_id,
            post_id: selectedPost.id,
            member_id: member.id,
            assigned_at: new Date().toISOString(),
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
          };
        })
      );

      // Add all new assignments to the list
      setDepartmentMembers(prev => [...prev, ...assignments]);

      // If assigning to National Executive Department, refresh its members list
      if (selectedDepartment && nationalExecutiveDept && selectedDepartment.id === nationalExecutiveDept.id) {
        const token2 = localStorage.getItem('admin_token');
        const membersResponse = await fetch(`/api/departments/${nationalExecutiveDept.id}/members?level=national`, {
          headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
        });
        const membersData = await membersResponse.json();
        if (membersData.members) {
          setNationalExecutiveMembers(membersData.members);
        }
      }

      // Close dialog and reset form
      setIsAssignDialogOpen(false);
      setSelectedPost(null);
      setSelectedMembers([]);
      setSearchQuery('');

      toast({
        title: 'Success',
        description: `${selectedMembers.length} member(s) assigned successfully`,
      });
    } catch (error) {
      console.error('Error assigning members:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign members',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveMember = async (assignmentId: number) => {
    if (!selectedDepartment) return;
    
    // Confirm before removing
    if (!window.confirm('Are you sure you want to remove this member from the post?')) {
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
        const membersResponse = await fetch(`/api/departments/${nationalExecutiveDept.id}/members?level=national`, {
          headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
        });
        const membersData = await membersResponse.json();
        if (membersData.members) {
          setNationalExecutiveMembers(membersData.members);
        }
      }

      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || (currentUser.type !== 'superadmin' && currentUser.type !== 'district_admin')) {
    return null;
  }

  const isDistrictAdmin = currentUser.type === 'district_admin';

  return (
    <>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Assign Members to Departments</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/departments')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Departments
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="select">1. Select Department</TabsTrigger>
            {!isDistrictAdmin && (
            <TabsTrigger value="national-executive">National Executive Department</TabsTrigger>
            )}
            {selectedDepartment && !isDistrictAdmin && (
              <TabsTrigger value="level">2. Select Level</TabsTrigger>
            )}
            {selectedDepartment && (selectedLevel || isDistrictAdmin) && (
              <TabsTrigger value="assign">{isDistrictAdmin ? '2. Assign Members' : '3. Assign Members'}</TabsTrigger>
            )}
          </TabsList>
          
          {/* Step indicator */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                selectedDepartment ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className={selectedDepartment ? 'text-orange-600 font-medium' : ''}>
                Select Department
              </span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                selectedLevel ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className={selectedLevel || isDistrictAdmin ? 'text-orange-600 font-medium' : ''}>
                {isDistrictAdmin ? 'Ready to Assign' : 'Select Level'}
              </span>
            </div>
            {!isDistrictAdmin && (
              <>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                selectedLevel ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className={selectedLevel ? 'text-orange-600 font-medium' : ''}>
                Assign Members
              </span>
            </div>
              </>
            )}
          </div>
          
          <TabsContent value="select" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Department</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : departments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No departments found</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push('/admin/departments/create')}
                    >
                      Create Department
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((department) => (
                      <Card 
                        key={department.id} 
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          selectedDepartment?.id === department.id ? 'ring-2 ring-orange-500' : ''
                        }`}
                        onClick={() => {
                          setSelectedDepartment(department);
                          // For district admins, automatically set level to district and go to assign tab
                          if (isDistrictAdmin) {
                            setSelectedLevel('district');
                            setActiveTab('assign');
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg">{department.name_en}</h3>
                          <p className="text-gray-600 text-sm">{department.name_hi}</p>
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
                  <p className="text-gray-500 mb-4">No National Executive Department is currently set.</p>
                  <p className="text-sm text-gray-400 mb-6">
                    Please go to <strong>Manage Departments</strong> and set a department as National Executive first.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/departments/manage')}
                  >
                    Go to Manage Departments
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-medium text-orange-800 mb-2">📋 National Executive Department Assignment</h3>
                  <p className="text-sm text-orange-700">
                    <strong>Department:</strong> {nationalExecutiveDept.name_en} ({nationalExecutiveDept.name_hi})
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    All members assigned here will be at <strong>National Level</strong> only. This is the top-most department of the organization.
                  </p>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>{nationalExecutiveDept.name_en}</CardTitle>
                    <p className="text-sm text-gray-500">{nationalExecutiveDept.name_hi}</p>
                  </CardHeader>
                  <CardContent>
                    {nationalExecutivePosts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No posts found in this department</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => router.push(`/admin/departments/manage?department=${nationalExecutiveDept.id}`)}
                        >
                          Create Posts
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {nationalExecutivePosts.map((post) => {
                          const assignments = nationalExecutiveMembers.filter(dm => dm.post_id === post.id);
                          const hasAssignments = assignments.length > 0;
                          
                          return (
                            <Card key={post.id} className="overflow-hidden">
                              <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-semibold">
                                      {post.position_order}. {post.name_en}
                                      {post.position_order === 1 && (
                                        <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                          President
                                        </span>
                                      )}
                                    </h3>
                                    <p className="text-sm text-gray-500">{post.name_hi}</p>
                                  </div>
                                  
                                  <Button
                                    onClick={() => {
                                      setSelectedPost(post);
                                      setSelectedDepartment(nationalExecutiveDept);
                                      setSelectedLevel('national');
                                      setSelectedState('');
                                      setSelectedDistrict('');
                                      setIsAssignDialogOpen(true);
                                    }}
                                    className="shrink-0"
                                    variant={hasAssignments ? "outline" : "default"}
                                    disabled={post.position_order === 1 && hasAssignments}
                                    title={post.position_order === 1 && hasAssignments ? 'President post can only have one member. Remove existing assignment first.' : ''}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {post.position_order === 1 && hasAssignments 
                                      ? 'Remove Existing First' 
                                      : hasAssignments 
                                        ? 'Assign More' 
                                        : 'Assign Members'}
                                  </Button>
                                </div>
                                
                                {hasAssignments ? (
                                  <div className="space-y-2 border-t pt-4">
                                    {assignments.map((assignment) => (
                                      <div key={assignment.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3 flex-1">
                                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                            {assignment.profile_photo_path ? (
                                              <Image
                                                src={assignment.profile_photo_path}
                                                alt={assignment.member_name}
                                                width={40}
                                                height={40}
                                                className="object-cover w-full h-full"
                                              />
                                            ) : (
                                              <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-800 font-semibold">
                                                {assignment.member_name.charAt(0)}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{assignment.member_name}</p>
                                            <div className="flex text-xs text-gray-500 space-x-2 flex-wrap">
                                              <p>{assignment.member_reg_number}</p>
                                              <p>• {assignment.level}</p>
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={async () => {
                                            if (!nationalExecutiveDept) return;
                                            // Confirm before removing
                                            if (!window.confirm('Are you sure you want to remove this member from the post?')) {
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
        const membersResponse = await fetch(`/api/departments/${nationalExecutiveDept.id}/members?level=national`, {
          headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
        });
                                              const membersData = await membersResponse.json();
                                              if (membersData.members) {
                                                setNationalExecutiveMembers(membersData.members);
                                              }

                                              toast({
                                                title: 'Success',
                                                description: 'Member removed successfully',
                                              });
                                            } catch (error) {
                                              console.error('Error removing member:', error);
                                              toast({
                                                title: 'Error',
                                                description: error instanceof Error ? error.message : 'Failed to remove member',
                                                variant: 'destructive',
                                              });
                                            } finally {
                                              setIsLoading(false);
                                            }
                                          }}
                                          className="shrink-0"
                                        >
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500 text-sm border-t">
                                    No members assigned yet
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
                  <CardTitle>Select Assignment Level</CardTitle>
                  <p className="text-sm text-gray-500">
                    {isDistrictAdmin 
                      ? `Assign members to <strong>${selectedDepartment.name_en}</strong> at district level`
                      : `Choose the level for assigning members to <strong>${selectedDepartment.name_en}</strong>`
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-4">
                      <Label htmlFor="level_selection">Assignment Level</Label>
                      <Select
                        value={selectedLevel}
                        onValueChange={(value) => {
                          setSelectedLevel(value as 'national' | 'state' | 'district');
                          if (value === 'national') {
                            setSelectedState('');
                            setSelectedDistrict('');
                          } else if (value === 'state') {
                            setSelectedDistrict('');
                          }
                        }}
                        disabled={isDistrictAdmin}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="national">National Level</SelectItem>
                          <SelectItem value="state">State Level</SelectItem>
                          <SelectItem value="district">District Level</SelectItem>
                        </SelectContent>
                      </Select>
                      {isDistrictAdmin && (
                        <p className="text-xs text-gray-500">
                          District admins can only assign members at district level
                        </p>
                      )}
                    </div>
                    
                    {selectedLevel !== 'national' && (
                      <div className="space-y-4">
                        <Label htmlFor="state_selection">State</Label>
                        <Select
                          value={selectedState}
                          onValueChange={(value) => {
                            setSelectedState(value);
                            setSelectedDistrict('');
                          }}
                          disabled={isDistrictAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
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
                            Locked to your assigned state
                          </p>
                        )}
                      </div>
                    )}
                    
                    {selectedLevel === 'district' && (
                      <div className="space-y-4">
                        <Label htmlFor="district_selection">District</Label>
                        <Select
                          value={selectedDistrict}
                          onValueChange={setSelectedDistrict}
                          disabled={!selectedState || isDistrictAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select district" />
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
                            Locked to your assigned district
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Level selection summary */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Selected Configuration:</h3>
                    <p className="text-sm text-blue-700">
                      <strong>Department:</strong> {selectedDepartment.name_en} ({selectedDepartment.name_hi})
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Level:</strong> {selectedLevel}
                      {selectedLevel === 'state' && selectedState && (
                        <span> • <strong>State:</strong> {selectedState}</span>
                      )}
                      {selectedLevel === 'district' && selectedState && selectedDistrict && (
                        <span> • <strong>State:</strong> {selectedState} • <strong>District:</strong> {selectedDistrict}</span>
                      )}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      All members assigned to this department will be assigned at the {selectedLevel} level
                      {selectedLevel === 'state' && selectedState && ` for ${selectedState}`}
                      {selectedLevel === 'district' && selectedState && selectedDistrict && ` for ${selectedDistrict}, ${selectedState}`}.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="assign" className="space-y-6">
            {selectedDepartment && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">📋 Assignment Configuration</h3>
                  <p className="text-sm text-blue-700">
                    <strong>Department:</strong> {selectedDepartment.name_en} • 
                    <strong> Level:</strong> {isDistrictAdmin ? 'district' : selectedLevel}
                    {isDistrictAdmin && currentUser?.state && currentUser?.district && (
                      ` • State: ${currentUser.state} • District: ${currentUser.district}`
                    )}
                    {!isDistrictAdmin && selectedLevel === 'state' && selectedState && ` • State: ${selectedState}`}
                    {!isDistrictAdmin && selectedLevel === 'district' && selectedState && selectedDistrict && ` • State: ${selectedState} • District: ${selectedDistrict}`}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    All members assigned will be assigned at {isDistrictAdmin ? 'district' : selectedLevel} level. Click "Assign Members" on any post to select members.
                  </p>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedDepartment.name_en}</CardTitle>
                    <p className="text-sm text-gray-500">{selectedDepartment.name_hi}</p>
                  </CardHeader>
                  <CardContent>
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
                      <div className="space-y-4">
                        {posts.map((post) => {
                          const assignments = departmentMembers.filter(dm => dm.post_id === post.id);
                          const hasAssignments = assignments.length > 0;
                          
                          return (
                            <Card key={post.id} className="overflow-hidden">
                              <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-semibold">
                                      {post.position_order}. {post.name_en}
                                      {post.position_order === 1 && (
                                        <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                          President
                                        </span>
                                      )}
                                    </h3>
                                    <p className="text-sm text-gray-500">{post.name_hi}</p>
                                  </div>
                                  
                                  <Button
                                    onClick={() => {
                                      setSelectedPost(post);
                                      setIsAssignDialogOpen(true);
                                    }}
                                    className="shrink-0"
                                    variant={hasAssignments ? "outline" : "default"}
                                    disabled={post.position_order === 1 && hasAssignments}
                                    title={post.position_order === 1 && hasAssignments ? 'President post can only have one member. Remove existing assignment first.' : ''}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {post.position_order === 1 && hasAssignments 
                                      ? 'Remove Existing First' 
                                      : hasAssignments 
                                        ? 'Assign More' 
                                        : 'Assign Members'}
                                  </Button>
                                </div>
                                
                                {hasAssignments ? (
                                  <div className="space-y-2 border-t pt-4">
                                    {assignments.map((assignment) => (
                                      <div key={assignment.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3 flex-1">
                                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                            {assignment.profile_photo_path ? (
                                              <Image
                                                src={assignment.profile_photo_path}
                                                alt={assignment.member_name}
                                                width={40}
                                                height={40}
                                                className="object-cover w-full h-full"
                                              />
                                            ) : (
                                              <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-800 font-semibold">
                                                {assignment.member_name.charAt(0)}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{assignment.member_name}</p>
                                            <div className="flex text-xs text-gray-500 space-x-2 flex-wrap">
                                              <p>{assignment.member_reg_number}</p>
                                              <p>• {assignment.level}</p>
                                              {assignment.state && <p>• {assignment.state}</p>}
                                              {assignment.district && <p>• {assignment.district}</p>}
                                            </div>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleRemoveMember(assignment.id)}
                                          className="shrink-0"
                                        >
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500 text-sm border-t">
                                    No members assigned yet
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
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign Members to {selectedPost?.name_en}</DialogTitle>
            <DialogDescription>
              Select members to assign to this post at {selectedLevel} level
            </DialogDescription>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-800">Assignment Configuration:</p>
              <p className="text-blue-700">
                <strong>Department:</strong> {selectedDepartment?.name_en} • 
                <strong> Post:</strong> {selectedPost?.name_en} • 
                <strong> Level:</strong> {selectedLevel}
                {selectedLevel === 'state' && selectedState && (
                  <span> • <strong>State:</strong> {selectedState}</span>
                )}
                {selectedLevel === 'district' && selectedState && selectedDistrict && (
                  <span> • <strong>State:</strong> {selectedState} • <strong>District:</strong> {selectedDistrict}</span>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Selected members: <span className="font-medium">{selectedMembers.length}</span>
              </p>
              {selectedPost?.position_order === 1 && (
                <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
                  ⚠️ <strong>President Post:</strong> Only one member can be assigned. Select only one member.
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">

            <div className="flex items-center space-x-2 flex-shrink-0">
              <Input
                placeholder="Search by name, email, or registration number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Status message for incomplete level selection */}
            {selectedLevel === 'state' && !selectedState && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-medium">⚠️ Please go back and select a state in Step 2</p>
              </div>
            )}
            
            {selectedLevel === 'district' && (!selectedState || !selectedDistrict) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-medium">⚠️ Please go back and select both state and district in Step 2</p>
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
                        ? 'Please select a state in Step 2 first'
                        : selectedLevel === 'district' && (!selectedState || !selectedDistrict)
                        ? 'Please select state and district in Step 2 first'
                        : 'No eligible members found'
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
                          className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
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
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                              {member.profile_photo_path ? (
                                <Image
                                  src={member.profile_photo_path}
                                  alt={member.name}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-800 font-semibold">
                                  {member.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <div className="flex text-xs text-gray-500 space-x-2">
                                <p>{member.member_reg_number}</p>
                                {member.state && <p>• {member.state}</p>}
                                {member.district && <p>• {member.district}</p>}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <UserCheck className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-600">
                {selectedMembers.length} member(s) selected
                {selectedPost?.position_order === 1 && selectedMembers.length > 1 && (
                  <span className="text-red-600 ml-2">⚠️ Only one member allowed for President post</span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignMembers} 
                  disabled={
                    isAssigning || 
                    selectedMembers.length === 0 || 
                    (selectedPost?.position_order === 1 && selectedMembers.length > 1)
                  }
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    selectedPost?.position_order === 1 
                      ? `Assign 1 Member`
                      : `Assign ${selectedMembers.length} Member(s)`
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
