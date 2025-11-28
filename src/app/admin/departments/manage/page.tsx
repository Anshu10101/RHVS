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
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
  
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
        title: t('admin.departments.manage.error'),
        description: t('admin.departments.manage.failedToLoad'),
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
          title: t('admin.departments.manage.error'),
          description: t('admin.departments.manage.failedToLoadNationalExecutive'),
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
        title: t('admin.departments.manage.validationError'),
        description: t('admin.departments.manage.enterBothNamesDept'),
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
        title: t('admin.departments.manage.success'),
        description: t('admin.departments.manage.departmentUpdated'),
      });
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: t('admin.departments.manage.error'),
        description: error instanceof Error ? error.message : t('admin.departments.manage.failedToUpdate'),
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
        title: t('admin.departments.manage.error'),
        description: t('admin.departments.manage.failedToLoadPosts'),
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
        title: t('admin.departments.manage.validationError'),
        description: t('admin.departments.manage.enterBothNamesPost'),
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
        title: t('admin.departments.manage.success'),
        description: t('admin.departments.manage.postCreated'),
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: t('admin.departments.manage.error'),
        description: error instanceof Error ? error.message : t('admin.departments.manage.failedToCreatePost'),
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
        title: t('admin.departments.manage.validationError'),
        description: t('admin.departments.manage.enterBothNamesPost'),
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
        title: t('admin.departments.manage.success'),
        description: t('admin.departments.manage.postUpdated'),
      });
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: t('admin.departments.manage.error'),
        description: error instanceof Error ? error.message : t('admin.departments.manage.failedToUpdatePost'),
        variant: 'destructive',
      });
    } finally {
      setIsEditingPost(false);
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!selectedDepartment) return;
    
    // Confirm before deleting
    if (!window.confirm(t('admin.departments.manage.deleteConfirm').replace('{name}', post.name_en))) {
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
        title: t('admin.departments.manage.success'),
        description: t('admin.departments.manage.postDeleted'),
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: t('admin.departments.manage.error'),
        description: error instanceof Error ? error.message : t('admin.departments.manage.failedToDeletePost'),
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
        title: t('admin.departments.manage.success'),
        description: t('admin.departments.manage.nationalExecutiveSet'),
      });
    } catch (error) {
      console.error('Error setting National Executive Department:', error);
      toast({
        title: t('admin.departments.manage.error'),
        description: error instanceof Error ? error.message : t('admin.departments.manage.failedToSetNationalExecutive'),
        variant: 'destructive',
      });
    } finally {
      setIsSettingNationalExecutive(false);
    }
  };

  const handleUnsetNationalExecutive = async () => {
    if (!window.confirm(t('admin.departments.manage.unsetConfirm'))) {
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
        title: t('admin.departments.manage.success'),
        description: t('admin.departments.manage.nationalExecutiveUnset'),
      });
    } catch (error) {
      console.error('Error unsetting National Executive Department:', error);
      toast({
        title: t('admin.departments.manage.error'),
        description: error instanceof Error ? error.message : t('admin.departments.manage.failedToUnsetNationalExecutive'),
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
        title: t('admin.departments.manage.error'),
        description: t('admin.departments.manage.cannotChangePresident'),
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
        title: t('admin.departments.manage.success'),
        description: t('admin.departments.manage.postOrderUpdated'),
      });
    } catch (error) {
      console.error('Error updating post order:', error);
      toast({
        title: t('admin.departments.manage.error'),
        description: error instanceof Error ? error.message : t('admin.departments.manage.failedToUpdateOrder'),
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
          <h1 className="text-2xl font-bold">{t('admin.departments.manage.title')}</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/departments')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('admin.departments.manage.backToDepartments')}
          </Button>
        </div>
        
        <Tabs defaultValue="departments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="departments">{t('admin.departments.manage.selectDepartment')}</TabsTrigger>
            <TabsTrigger value="national-executive">{t('admin.departments.manage.manageNationalExecutive')}</TabsTrigger>
            {selectedDepartment && (
              <TabsTrigger value="posts">{t('admin.departments.manage.managePosts')}</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.departments.manage.selectDepartment')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : departments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t('admin.departments.manage.noDepartmentsFound')}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => router.push('/admin/departments/create')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('admin.departments.manage.createDepartment')}
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Search Box */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder={t('admin.departments.manage.searchDepartments')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    {filteredDepartments.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">{t('admin.departments.manage.noMatchingDepartments')}</p>
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
                <CardTitle>{t('admin.departments.manage.manageNationalExecutive')}</CardTitle>
                <p className="text-sm text-gray-500 mt-2">
                  {t('admin.departments.manage.nationalExecutiveDescription')}
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
                                {t('admin.departments.manage.currentNationalExecutive')}
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
                                {t('admin.departments.manage.unsetting')}
                              </>
                            ) : (
                              t('admin.departments.manage.unset')
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                        <p className="text-gray-500">{t('admin.departments.manage.noNationalExecutive')}</p>
                        <p className="text-sm text-gray-400 mt-1">{t('admin.departments.manage.selectBelow')}</p>
                      </div>
                    )}

                    {/* Available Departments to Select */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4">{t('admin.departments.manage.selectDepartmentLabel')}</h3>
                      {departments.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">{t('admin.departments.manage.noDepartmentsAvailable')}</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => router.push('/admin/departments/create')}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {t('admin.departments.manage.createDepartment')}
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
                                      {t('admin.departments.manage.setting')}
                                    </>
                                  ) : (
                                    t('admin.departments.manage.setAsNationalExecutive')
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
                      {t('admin.departments.manage.addPost')}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">{t('admin.departments.manage.noPostsFound')}</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsNewPostDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t('admin.departments.manage.createFirstPost')}
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
                                                {t('admin.departments.manage.president')}
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
            <DialogTitle>{t('admin.departments.manage.addNewPost')}</DialogTitle>
            <DialogDescription>
              {t('admin.departments.manage.createPostFor')} {selectedDepartment?.name_en}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="post_name_en">{t('admin.departments.manage.postNameEn')}</Label>
              <Input
                id="post_name_en"
                placeholder={t('admin.departments.manage.postNameEnPlaceholder')}
                value={newPostNameEn}
                onChange={(e) => setNewPostNameEn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post_name_hi">{t('admin.departments.manage.postNameHi')}</Label>
              <Input
                id="post_name_hi"
                placeholder={t('admin.departments.manage.postNameHiPlaceholder')}
                value={newPostNameHi}
                onChange={(e) => setNewPostNameHi(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPostDialogOpen(false)}>
              {t('admin.departments.manage.cancel')}
            </Button>
            <Button onClick={handleAddPost} disabled={isAddingPost}>
              {isAddingPost ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('admin.departments.manage.adding')}
                </>
              ) : (
                t('admin.departments.manage.addPost')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={isEditPostDialogOpen} onOpenChange={setIsEditPostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.departments.manage.editPost')}</DialogTitle>
            <DialogDescription>
              {t('admin.departments.manage.updatePostDetails')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_post_name_en">{t('admin.departments.manage.postNameEn')}</Label>
              <Input
                id="edit_post_name_en"
                placeholder={t('admin.departments.manage.postNameEnPlaceholder')}
                value={editPostNameEn}
                onChange={(e) => setEditPostNameEn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_post_name_hi">{t('admin.departments.manage.postNameHi')}</Label>
              <Input
                id="edit_post_name_hi"
                placeholder={t('admin.departments.manage.postNameHiPlaceholder')}
                value={editPostNameHi}
                onChange={(e) => setEditPostNameHi(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPostDialogOpen(false)}>
              {t('admin.departments.manage.cancel')}
            </Button>
            <Button onClick={handleEditPost} disabled={isEditingPost}>
              {isEditingPost ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('admin.departments.manage.saving')}
                </>
              ) : (
                t('admin.departments.manage.saveChanges')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDepartmentDialogOpen} onOpenChange={setIsEditDepartmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.departments.manage.editDepartment')}</DialogTitle>
            <DialogDescription>
              {t('admin.departments.manage.updateDepartmentName')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_dept_name_en">{t('admin.departments.manage.deptNameEn')}</Label>
              <Input
                id="edit_dept_name_en"
                placeholder={t('admin.departments.manage.deptNameEnPlaceholder')}
                value={editDeptNameEn}
                onChange={(e) => setEditDeptNameEn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_dept_name_hi">{t('admin.departments.manage.deptNameHi')}</Label>
              <Input
                id="edit_dept_name_hi"
                placeholder={t('admin.departments.manage.deptNameHiPlaceholder')}
                value={editDeptNameHi}
                onChange={(e) => setEditDeptNameHi(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDepartmentDialogOpen(false)}>
              {t('admin.departments.manage.cancel')}
            </Button>
            <Button onClick={handleEditDepartment} disabled={isEditingDepartment}>
              {isEditingDepartment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('admin.departments.manage.saving')}
                </>
              ) : (
                t('admin.departments.manage.saveChanges')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
