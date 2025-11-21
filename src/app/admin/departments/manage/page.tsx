"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { ArrowLeft, Loader2, Plus, MoveVertical, Trash2, Edit, Save, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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

export default function ManageDepartmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currentUser } = useAdmin();
  
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  
  // National Executive Department state
  const [nationalExecutiveDept, setNationalExecutiveDept] = useState<Department | null>(null);
  const [isLoadingNationalExecutive, setIsLoadingNationalExecutive] = useState(false);
  const [isSettingNationalExecutive, setIsSettingNationalExecutive] = useState(false);
  
  // New post dialog
  const [isNewPostDialogOpen, setIsNewPostDialogOpen] = useState(false);
  const [newPostNameEn, setNewPostNameEn] = useState('');
  const [newPostNameHi, setNewPostNameHi] = useState('');
  const [isAddingPost, setIsAddingPost] = useState(false);
  
  // Edit post dialog
  const [isEditPostDialogOpen, setIsEditPostDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editPostNameEn, setEditPostNameEn] = useState('');
  const [editPostNameHi, setEditPostNameHi] = useState('');
  const [isEditingPost, setIsEditingPost] = useState(false);

  // Edit department dialog
  const [isEditDepartmentDialogOpen, setIsEditDepartmentDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editDeptNameEn, setEditDeptNameEn] = useState('');
  const [editDeptNameHi, setEditDeptNameHi] = useState('');
  const [isEditingDepartment, setIsEditingDepartment] = useState(false);

  // Check if user is superadmin
  useEffect(() => {
    if (currentUser && currentUser.type !== 'superadmin') {
      router.push('/admin');
    }
  }, [currentUser, router]);

  // Fetch all departments
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
        setDepartments(data.departments);
        setFilteredDepartments(data.departments);
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

  useEffect(() => {
    fetchDepartments();
  }, [toast]);

  // Fetch National Executive Department
  useEffect(() => {
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
        } else {
          setNationalExecutiveDept(null);
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
  }, [toast]);

  // Filter departments based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDepartments(departments);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = departments.filter(dept => 
        dept.name_en.toLowerCase().includes(query) ||
        dept.name_hi.toLowerCase().includes(query)
      );
      setFilteredDepartments(filtered);
    }
  }, [searchQuery, departments]);

  // Check for department ID in URL and select it
  useEffect(() => {
    const departmentId = searchParams.get('department');
    
    if (departmentId && departments.length > 0) {
      const dept = departments.find(d => d.id === parseInt(departmentId));
      if (dept) {
        setSelectedDepartment(dept);
      }
    }
  }, [departments, searchParams]);

  const handleEditDepartment = async () => {
    if (!editingDepartment) return;
    
    if (!editDeptNameEn.trim() || !editDeptNameHi.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both English and Hindi names for the department',
        variant: 'destructive',
      });
      return;
    }

    setIsEditingDepartment(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/departments/${editingDepartment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name_en: editDeptNameEn,
          name_hi: editDeptNameHi,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update department');
      }

      // Update the department in the list
      setDepartments(prevDepts => prevDepts.map(dept => 
        dept.id === editingDepartment.id 
          ? { ...dept, name_en: editDeptNameEn, name_hi: editDeptNameHi } 
          : dept
      ));

      // Update selected department if it's the one being edited
      if (selectedDepartment?.id === editingDepartment.id) {
        setSelectedDepartment(prev => prev ? {
          ...prev,
          name_en: editDeptNameEn,
          name_hi: editDeptNameHi
        } : null);
      }

      // Refresh departments list
      await fetchDepartments();

      // Close dialog and reset form
      setIsEditDepartmentDialogOpen(false);
      setEditingDepartment(null);
      setEditDeptNameEn('');
      setEditDeptNameHi('');

      toast({
        title: 'Success',
        description: 'Department updated successfully',
      });
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update department',
        variant: 'destructive',
      });
    } finally {
      setIsEditingDepartment(false);
    }
  };

  // Fetch posts when department is selected
  const fetchPosts = async () => {
    if (!selectedDepartment) return;
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/departments/${selectedDepartment.id}/posts?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
      const data = await response.json();
      
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load department posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedDepartment, toast]);

  const handleAddPost = async () => {
    if (!selectedDepartment) return;
    
    if (!newPostNameEn.trim() || !newPostNameHi.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both English and Hindi names for the post',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingPost(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/departments/${selectedDepartment.id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name_en: newPostNameEn,
          name_hi: newPostNameHi,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      // Refresh posts list
      await fetchPosts();

      // Close dialog and reset form
      setIsNewPostDialogOpen(false);
      setNewPostNameEn('');
      setNewPostNameHi('');

      toast({
        title: 'Success',
        description: 'Post created successfully',
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create post',
        variant: 'destructive',
      });
    } finally {
      setIsAddingPost(false);
    }
  };

  const handleEditPost = async () => {
    if (!editingPost) return;
    
    if (!editPostNameEn.trim() || !editPostNameHi.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both English and Hindi names for the post',
        variant: 'destructive',
      });
      return;
    }

    setIsEditingPost(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/departments/${selectedDepartment?.id}/posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name_en: editPostNameEn,
          name_hi: editPostNameHi,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update post');
      }

      // Refresh posts list
      await fetchPosts();

      // Close dialog and reset form
      setIsEditPostDialogOpen(false);
      setEditingPost(null);
      setEditPostNameEn('');
      setEditPostNameHi('');

      toast({
        title: 'Success',
        description: 'Post updated successfully',
      });
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update post',
        variant: 'destructive',
      });
    } finally {
      setIsEditingPost(false);
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!selectedDepartment) return;
    
    // Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete the post "${post.name_en}"?`)) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/departments/${selectedDepartment.id}/posts/${post.id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete post');
      }

      // Refresh posts list
      await fetchPosts();

      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete post',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetNationalExecutive = async (departmentId: number) => {
    setIsSettingNationalExecutive(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/departments/national-executive', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ department_id: departmentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set National Executive Department');
      }

      // Update the National Executive Department state
      const dept = departments.find(d => d.id === departmentId);
      if (dept) {
        setNationalExecutiveDept(dept);
      }

      // Refresh departments list (the selected one will be removed from regular list)
      const token2 = localStorage.getItem('admin_token');
      const deptResponse = await fetch(`/api/departments?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
      });
      const deptData = await deptResponse.json();
      if (deptData.departments) {
        setDepartments(deptData.departments);
        setFilteredDepartments(deptData.departments);
      }

      toast({
        title: 'Success',
        description: 'National Executive Department set successfully',
      });
    } catch (error) {
      console.error('Error setting National Executive Department:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set National Executive Department',
        variant: 'destructive',
      });
    } finally {
      setIsSettingNationalExecutive(false);
    }
  };

  const handleUnsetNationalExecutive = async () => {
    if (!window.confirm('Are you sure you want to unset the National Executive Department?')) {
      return;
    }

    setIsSettingNationalExecutive(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/departments/national-executive', {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unset National Executive Department');
      }

      setNationalExecutiveDept(null);

      // Refresh departments list
      const token2 = localStorage.getItem('admin_token');
      const deptResponse = await fetch(`/api/departments?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
      });
      const deptData = await deptResponse.json();
      if (deptData.departments) {
        setDepartments(deptData.departments);
        setFilteredDepartments(deptData.departments);
      }

      toast({
        title: 'Success',
        description: 'National Executive Department unset successfully',
      });
    } catch (error) {
      console.error('Error unsetting National Executive Department:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unset National Executive Department',
        variant: 'destructive',
      });
    } finally {
      setIsSettingNationalExecutive(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !selectedDepartment) return;
    
    const { source, destination } = result;
    
    // Don't do anything if the position didn't change
    if (source.index === destination.index) return;
    
    // Create a copy of the posts array
    const updatedPosts = Array.from(posts);
    
    // Get the post that was dragged
    const [movedPost] = updatedPosts.splice(source.index, 1);
    
    // Insert the post at the new position
    updatedPosts.splice(destination.index, 0, movedPost);
    
    // Check if trying to move the president post (position_order = 1)
    if (movedPost.position_order === 1 && destination.index !== 0) {
      toast({
        title: 'Error',
        description: 'Cannot change the position of the president post',
        variant: 'destructive',
      });
      return;
    }
    
    // Update the position_order of all posts
    const reorderedPosts = updatedPosts.map((post, index) => ({
      ...post,
      position_order: index + 1,
    }));
    
    // Optimistically update the UI
    setPosts(reorderedPosts);
    
    // Send the update to the server
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/departments/${selectedDepartment.id}/posts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(reorderedPosts.map(post => ({
          id: post.id,
          position_order: post.position_order,
        }))),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Reorder error response:', data);
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : data.message || 'Failed to update post order';
        throw new Error(errorMessage);
      }
      
      toast({
        title: 'Success',
        description: 'Post order updated successfully',
      });
    } catch (error) {
      console.error('Error updating post order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update post order',
        variant: 'destructive',
      });
      
      // If there was an error, fetch the posts again to reset the order
      const token2 = localStorage.getItem('admin_token');
      const response = await fetch(`/api/departments/${selectedDepartment.id}/posts?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token2 ? { 'Authorization': `Bearer ${token2}` } : {}
      });
      const data = await response.json();
      
      if (data.posts) {
        setPosts(data.posts);
      }
    }
  };

  if (!currentUser || currentUser.type !== 'superadmin') {
    return null;
  }

  return (
    <>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Manage Departments</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/departments')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Departments
          </Button>
        </div>
        
        <Tabs defaultValue="departments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="departments">Select Department</TabsTrigger>
            <TabsTrigger value="national-executive">Manage National Executive Department</TabsTrigger>
            {selectedDepartment && (
              <TabsTrigger value="posts">Manage Posts</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="departments" className="space-y-6">
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
                      <Plus className="mr-2 h-4 w-4" />
                      Create Department
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Search Box */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search departments by name (English or Hindi)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    {filteredDepartments.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No departments found matching your search</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDepartments.map((department) => (
                          <Card 
                            key={department.id} 
                            className={`cursor-pointer hover:shadow-md transition-shadow ${
                              selectedDepartment?.id === department.id ? 'ring-2 ring-orange-500' : ''
                            }`}
                            onClick={() => setSelectedDepartment(department)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg">{department.name_hi}</h3>
                                  <p className="text-gray-600 text-sm">{department.name_en}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingDepartment(department);
                                    setEditDeptNameEn(department.name_en);
                                    setEditDeptNameHi(department.name_hi);
                                    setIsEditDepartmentDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="national-executive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage National Executive Department</CardTitle>
                <p className="text-sm text-gray-500 mt-2">
                  Select a department to be marked as the top-most National Executive Department. 
                  Only one department can be marked as National Executive at a time.
                </p>
              </CardHeader>
              <CardContent>
                {isLoadingNationalExecutive ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Current National Executive Department */}
                    {nationalExecutiveDept ? (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded">
                                CURRENT NATIONAL EXECUTIVE DEPARTMENT
                              </span>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">{nationalExecutiveDept.name_hi}</h3>
                            <p className="text-gray-600 text-sm">{nationalExecutiveDept.name_en}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUnsetNationalExecutive}
                            disabled={isSettingNationalExecutive}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {isSettingNationalExecutive ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Unsetting...
                              </>
                            ) : (
                              'Unset'
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                        <p className="text-gray-500">No National Executive Department is currently set.</p>
                        <p className="text-sm text-gray-400 mt-1">Select a department below to set it as National Executive.</p>
                      </div>
                    )}

                    {/* Available Departments to Select */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Select Department</h3>
                      {departments.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No departments available</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => router.push('/admin/departments/create')}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Department
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {departments.map((department) => (
                            <Card 
                              key={department.id} 
                              className="cursor-pointer hover:shadow-md transition-shadow"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg">{department.name_hi}</h3>
                                    <p className="text-gray-600 text-sm">{department.name_en}</p>
                                  </div>
                                </div>
                                <Button
                                  className="w-full mt-4"
                                  onClick={() => handleSetNationalExecutive(department.id)}
                                  disabled={isSettingNationalExecutive}
                                >
                                  {isSettingNationalExecutive ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Setting...
                                    </>
                                  ) : (
                                    'Set as National Executive'
                                  )}
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="posts" className="space-y-6">
            {selectedDepartment && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-bold">{selectedDepartment.name_hi}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{selectedDepartment.name_en}</p>
                    </div>
                    <Button onClick={() => setIsNewPostDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Post
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No posts found</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsNewPostDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create First Post
                        </Button>
                      </div>
                    ) : (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="posts">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-2"
                            >
                              {posts.map((post, index) => (
                                <Draggable 
                                  key={post.id} 
                                  draggableId={post.id.toString()} 
                                  index={index}
                                  isDragDisabled={post.position_order === 1} // President post cannot be moved
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`flex items-center justify-between p-3 rounded-lg border ${
                                        post.position_order === 1 
                                          ? 'bg-orange-50 border-orange-200' 
                                          : 'bg-white hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div 
                                          {...provided.dragHandleProps}
                                          className={`p-1 rounded ${post.position_order === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-grab hover:bg-gray-100'}`}
                                        >
                                          <MoveVertical className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div>
                                          <p className="font-medium">
                                            {post.position_order}. {post.name_en}
                                            {post.position_order === 1 && (
                                              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                                President
                                              </span>
                                            )}
                                          </p>
                                          <p className="text-sm text-gray-500">{post.name_hi}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingPost(post);
                                            setEditPostNameEn(post.name_en);
                                            setEditPostNameHi(post.name_hi);
                                            setIsEditPostDialogOpen(true);
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        {post.position_order !== 1 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeletePost(post);
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* New Post Dialog */}
      <Dialog open={isNewPostDialogOpen} onOpenChange={setIsNewPostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Post</DialogTitle>
            <DialogDescription>
              Create a new post for {selectedDepartment?.name_en}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="post_name_en">Post Name (English)</Label>
              <Input
                id="post_name_en"
                placeholder="Enter post name in English"
                value={newPostNameEn}
                onChange={(e) => setNewPostNameEn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post_name_hi">Post Name (Hindi)</Label>
              <Input
                id="post_name_hi"
                placeholder="Enter post name in Hindi"
                value={newPostNameHi}
                onChange={(e) => setNewPostNameHi(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPostDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPost} disabled={isAddingPost}>
              {isAddingPost ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Post'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={isEditPostDialogOpen} onOpenChange={setIsEditPostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Update the post details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_post_name_en">Post Name (English)</Label>
              <Input
                id="edit_post_name_en"
                placeholder="Enter post name in English"
                value={editPostNameEn}
                onChange={(e) => setEditPostNameEn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_post_name_hi">Post Name (Hindi)</Label>
              <Input
                id="edit_post_name_hi"
                placeholder="Enter post name in Hindi"
                value={editPostNameHi}
                onChange={(e) => setEditPostNameHi(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPostDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPost} disabled={isEditingPost}>
              {isEditingPost ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDepartmentDialogOpen} onOpenChange={setIsEditDepartmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the department name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_dept_name_en">Department Name (English)</Label>
              <Input
                id="edit_dept_name_en"
                placeholder="Enter department name in English"
                value={editDeptNameEn}
                onChange={(e) => setEditDeptNameEn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_dept_name_hi">Department Name (Hindi)</Label>
              <Input
                id="edit_dept_name_hi"
                placeholder="Enter department name in Hindi"
                value={editDeptNameHi}
                onChange={(e) => setEditDeptNameHi(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDepartmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDepartment} disabled={isEditingDepartment}>
              {isEditingDepartment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
