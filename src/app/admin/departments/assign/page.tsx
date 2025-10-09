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
  const { currentUser } = useAdmin();
  
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
  
  // Member assignment dialog
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [eligibleMembers, setEligibleMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Check if user is superadmin
  useEffect(() => {
    if (currentUser && currentUser.type !== 'superadmin') {
      router.push('/admin');
    }
  }, [currentUser, router]);

  // Fetch states when component mounts
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('/api/locations?type=states');
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
        const response = await fetch(`/api/locations?type=districts&state=${encodeURIComponent(selectedState)}`);
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
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);

      try {
        const response = await fetch('/api/departments');
        const data = await response.json();
        
        if (data.departments) {
          setDepartments(data.departments);
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
  }, [toast]);

  // Fetch posts and department members when department is selected
  useEffect(() => {
    const fetchDepartmentData = async () => {
      if (!selectedDepartment) return;
      
      setIsLoading(true);
      
      try {
        // Fetch posts
        const postsResponse = await fetch(`/api/departments/${selectedDepartment.id}/posts`);
        const postsData = await postsResponse.json();
        
        if (postsData.posts) {
          setPosts(postsData.posts);
        }

        // Fetch department members
        const membersResponse = await fetch(`/api/departments/${selectedDepartment.id}/members`);
        const membersData = await membersResponse.json();
        
        if (membersData.members) {
          setDepartmentMembers(membersData.members);
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
  }, [selectedDepartment, toast]);

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
        const response = await fetch(url);
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
    
    setIsAssigning(true);

    try {
      // Assign all selected members to the post
      const assignments = await Promise.all(
        selectedMembers.map(async (member) => {
          const response = await fetch(`/api/departments/${selectedDepartment.id}/members`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
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
      const response = await fetch(`/api/departments/${selectedDepartment.id}/members/${assignmentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      // Remove the assignment from the list
      setDepartmentMembers(prev => prev.filter(dm => dm.id !== assignmentId));

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

  const getPostStatus = (postId: number) => {
    const assignment = departmentMembers.find(dm => dm.post_id === postId);
    return assignment ? 'filled' : 'vacant';
  };

  if (!currentUser || currentUser.type !== 'superadmin') {
    return null;
  }

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
        
        <Tabs defaultValue="select" className="space-y-6">
          <TabsList>
            <TabsTrigger value="select">1. Select Department</TabsTrigger>
            {selectedDepartment && (
              <TabsTrigger value="level">2. Select Level</TabsTrigger>
            )}
            {selectedDepartment && selectedLevel && (
              <TabsTrigger value="assign">3. Assign Members</TabsTrigger>
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
              <span className={selectedLevel ? 'text-orange-600 font-medium' : ''}>
                Select Level
              </span>
            </div>
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
                        onClick={() => setSelectedDepartment(department)}
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
          
          <TabsContent value="level" className="space-y-6">
            {selectedDepartment && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Assignment Level</CardTitle>
                  <p className="text-sm text-gray-500">
                    Choose the level for assigning members to <strong>{selectedDepartment.name_en}</strong>
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
                      </div>
                    )}
                    
                    {selectedLevel === 'district' && (
                      <div className="space-y-4">
                        <Label htmlFor="district_selection">District</Label>
                        <Select
                          value={selectedDistrict}
                          onValueChange={setSelectedDistrict}
                          disabled={!selectedState}
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
                    <strong> Level:</strong> {selectedLevel}
                    {selectedLevel === 'state' && selectedState && ` • State: ${selectedState}`}
                    {selectedLevel === 'district' && selectedState && selectedDistrict && ` • State: ${selectedState} • District: ${selectedDistrict}`}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    All members assigned will be assigned at this level. Click "Assign Members" on any post to select members.
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
                        <p className="text-gray-500">No posts found in this department</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => router.push(`/admin/departments/manage?department=${selectedDepartment.id}`)}
                        >
                          Create Posts
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {posts.map((post) => {
                          const status = getPostStatus(post.id);
                          const assignment = departmentMembers.find(dm => dm.post_id === post.id);
                          
                          return (
                            <Card key={post.id} className="overflow-hidden">
                              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                                
                                {status === 'vacant' ? (
                                  <Button
                                    onClick={() => {
                                      setSelectedPost(post);
                                      setIsAssignDialogOpen(true);
                                    }}
                                    className="shrink-0"
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Assign Members
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                        {assignment?.profile_photo_path ? (
                                          <Image
                                            src={assignment.profile_photo_path}
                                            alt={assignment.member_name}
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                          />
                                        ) : (
                                          <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-800 font-semibold">
                                            {assignment?.member_name.charAt(0)}
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium">{assignment?.member_name}</p>
                                        <div className="flex text-xs text-gray-500 space-x-2">
                                          <p>{assignment?.member_reg_number}</p>
                                          <p>• {assignment?.level}</p>
                                          {assignment?.state && <p>• {assignment.state}</p>}
                                          {assignment?.district && <p>• {assignment.district}</p>}
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => assignment && handleRemoveMember(assignment.id)}
                                      className="shrink-0"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
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
                              setSelectedMembers(prev => [...prev, member]);
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
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignMembers} 
                  disabled={isAssigning || selectedMembers.length === 0}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    `Assign ${selectedMembers.length} Member(s)`
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
