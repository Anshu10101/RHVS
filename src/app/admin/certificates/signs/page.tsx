"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { 
  ArrowLeft, 
  Upload, 
  User, 
  Loader2,
  X,
  Edit,
  Image as ImageIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Signature {
  id: number;
  certificateType: 'membership' | 'appointment';
  nameEn: string;
  nameHi?: string;
  designationEn: string;
  designationHi?: string;
  signaturePath?: string;
  displayOrder: number;
  memberId?: number;
  memberName?: string;
  deptNameEn?: string;
  postNameEn?: string;
}

interface Department {
  id: string;
  name_en: string;
  name_hi?: string;
}

interface Member {
  id: number;
  name: string;
  memberRegNumber: string;
  hasSignature: boolean;
  departmentId: string;
  deptNameEn: string;
  deptNameHi?: string;
  postId: number;
  postNameEn: string;
  postNameHi?: string;
  level: string;
  state?: string;
  district?: string;
}

export default function AddSignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAdmin();
  
  const [certificateType, setCertificateType] = useState<'membership' | 'appointment'>('membership');
  const [method, setMethod] = useState<'manual' | 'member'>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSignatures, setExistingSignatures] = useState<Signature[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  
  // Manual entry form fields
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [designationEn, setDesignationEn] = useState('');
  const [designationHi, setDesignationHi] = useState('');
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSignature, setEditingSignature] = useState<Signature | null>(null);
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameHi, setEditNameHi] = useState('');
  const [editDesignationEn, setEditDesignationEn] = useState('');
  const [editDesignationHi, setEditDesignationHi] = useState('');
  const [editSignatureFile, setEditSignatureFile] = useState<File | null>(null);
  const [editSignaturePreview, setEditSignaturePreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if user is superadmin
  useEffect(() => {
    if (currentUser && currentUser.type !== 'superadmin') {
      router.push('/admin');
    }
  }, [currentUser, router]);

  useEffect(() => {
    fetchExistingSignatures();
    fetchDepartments();
  }, [certificateType]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchMembers(selectedDepartment);
    } else {
      setMembers([]);
      setSelectedMember(null);
    }
  }, [selectedDepartment]);

  const fetchExistingSignatures = async () => {
    try {
      const response = await fetch(`/api/admin/certificates/signatures?type=${certificateType}&_t=${Date.now()}`);
      const data = await response.json();
      if (data.success) {
        // Add cache-busting timestamp to signature paths
        const timestamp = Date.now();
        const signaturesWithCacheBust = data.signatures.map((sig: Signature) => {
          let updatedPath = sig.signaturePath;
          if (updatedPath) {
            // Remove existing cache-busting parameter if present
            updatedPath = updatedPath.split('?')[0].split('&')[0];
            // Add new cache-busting parameter
            updatedPath = `${updatedPath}?_t=${timestamp}`;
          }
          return {
            ...sig,
            signaturePath: updatedPath
          };
        });
        setExistingSignatures(signaturesWithCacheBust);
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      if (data.departments) {
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchMembers = async (deptId: string) => {
    try {
      const response = await fetch(`/api/admin/certificates/signatures/members?department_id=${deptId}`);
      const data = await response.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (100KB)
      if (file.size > 102400) {
        toast({
          title: 'Error',
          description: 'Signature file must be less than 100KB',
          variant: 'destructive',
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Signature must be an image file',
          variant: 'destructive',
        });
        return;
      }

      setSignatureFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (existingSignatures.length >= 4) {
      toast({
        title: 'Error',
        description: 'Maximum 4 signatures allowed per certificate type',
        variant: 'destructive',
      });
      return;
    }

    if (method === 'manual') {
      if (!nameEn || !designationEn || !signatureFile) {
        toast({
          title: 'Error',
          description: 'Please fill all required fields',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!selectedMember) {
        toast({
          title: 'Error',
          description: 'Please select a member',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('certificate_type', certificateType);
      formData.append('method', method);

      if (method === 'manual') {
        formData.append('name_en', nameEn);
        formData.append('name_hi', nameHi);
        formData.append('designation_en', designationEn);
        formData.append('designation_hi', designationHi);
        if (signatureFile) {
          formData.append('signature', signatureFile);
        }
      } else {
        if (!selectedMember) {
          toast({
            title: 'Error',
            description: 'Please select a member',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        formData.append('member_id', selectedMember.id.toString());
        formData.append('department_id', selectedMember.departmentId);
        formData.append('post_id', selectedMember.postId.toString());
      }

      const response = await fetch('/api/admin/certificates/signatures', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add signature');
      }

      toast({
        title: 'Success',
        description: 'Signature added successfully',
      });

      // Reset form
      setNameEn('');
      setNameHi('');
      setDesignationEn('');
      setDesignationHi('');
      setSignatureFile(null);
      setSignaturePreview(null);
      setSelectedMember(null);
      setSelectedDepartment('');

      // Refresh signatures list
      fetchExistingSignatures();

    } catch (error) {
      console.error('Error adding signature:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add signature',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSignature = async (signature: Signature) => {
    try {
      // Fetch full signature details
      const response = await fetch(`/api/admin/certificates/signatures/${signature.id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch signature details');
      }

      setEditingSignature(data.signature);
      setEditNameEn(data.signature.nameEn);
      setEditNameHi(data.signature.nameHi || '');
      setEditDesignationEn(data.signature.designationEn);
      setEditDesignationHi(data.signature.designationHi || '');
      // Add cache-busting to preview
      let previewPath = data.signature.signaturePath;
      if (previewPath) {
        // Remove existing cache-busting parameter if present
        previewPath = previewPath.split('?')[0].split('&')[0];
        // Add new cache-busting parameter
        previewPath = `${previewPath}?_t=${Date.now()}`;
      }
      setEditSignaturePreview(previewPath);
      setEditSignatureFile(null);
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Error fetching signature details:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load signature details',
        variant: 'destructive',
      });
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (100KB)
      if (file.size > 102400) {
        toast({
          title: 'Error',
          description: 'Signature file must be less than 100KB',
          variant: 'destructive',
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Signature must be an image file',
          variant: 'destructive',
        });
        return;
      }

      setEditSignatureFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSignature) return;

    if (!editNameEn || !editDesignationEn) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('name_en', editNameEn);
      formData.append('name_hi', editNameHi);
      formData.append('designation_en', editDesignationEn);
      formData.append('designation_hi', editDesignationHi);
      
      if (editSignatureFile) {
        formData.append('signature', editSignatureFile);
      }

      const response = await fetch(`/api/admin/certificates/signatures/${editingSignature.id}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update signature');
      }

      toast({
        title: 'Success',
        description: 'Signature updated successfully',
      });

      // Reset edit form
      setIsEditDialogOpen(false);
      setEditingSignature(null);
      setEditNameEn('');
      setEditNameHi('');
      setEditDesignationEn('');
      setEditDesignationHi('');
      setEditSignatureFile(null);
      setEditSignaturePreview(null);

      // Refresh signatures list with cache-busting
      // Small delay to ensure DB update is complete
      setTimeout(() => {
        fetchExistingSignatures();
        // Force a re-render by updating a state that triggers refresh
        setExistingSignatures([]);
        setTimeout(() => {
          fetchExistingSignatures();
        }, 200);
      }, 100);

    } catch (error) {
      console.error('Error updating signature:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update signature',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSignature = async (signatureId: number) => {
    if (!confirm('Are you sure you want to delete this signature?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/certificates/signatures/${signatureId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete signature');
      }

      toast({
        title: 'Success',
        description: 'Signature deleted successfully',
      });

      fetchExistingSignatures();
    } catch (error) {
      console.error('Error deleting signature:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete signature',
        variant: 'destructive',
      });
    }
  };

  if (!currentUser || currentUser.type !== 'superadmin') {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Add Certificate Signatures</h1>
          <p className="text-gray-500 mt-1">Manage signatures for membership and appointment certificates</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/certificates')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Certificates
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Signature Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Signature</CardTitle>
            <CardDescription>
              Add signatures for certificates. Maximum 4 signatures per certificate type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="certificate_type">Certificate Type</Label>
                <Select value={certificateType} onValueChange={(value: 'membership' | 'appointment') => {
                  setCertificateType(value);
                  setMethod('manual');
                  setSelectedMember(null);
                  setSelectedDepartment('');
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membership">Membership Certificate</SelectItem>
                    <SelectItem value="appointment">Appointment Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Current Signatures: {existingSignatures.length}/4</Label>
                {existingSignatures.length >= 4 && (
                  <p className="text-sm text-red-500 mt-1">Maximum signatures reached. Delete one to add a new one.</p>
                )}
              </div>

              <Tabs value={method} onValueChange={(value) => {
                setMethod(value as 'manual' | 'member');
                setSelectedMember(null);
                setSelectedDepartment('');
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="member">From Member</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name_en">Name (English) *</Label>
                    <Input
                      id="name_en"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="name_hi">Name (Hindi)</Label>
                    <Input
                      id="name_hi"
                      value={nameHi}
                      onChange={(e) => setNameHi(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="designation_en">Designation (English) *</Label>
                    <Input
                      id="designation_en"
                      value={designationEn}
                      onChange={(e) => setDesignationEn(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="designation_hi">Designation (Hindi)</Label>
                    <Input
                      id="designation_hi"
                      value={designationHi}
                      onChange={(e) => setDesignationHi(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="signature">Signature Image * (Max 100KB)</Label>
                    <div className="mt-2">
                      <Input
                        id="signature"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                      />
                      {signaturePreview && (
                        <div className="mt-4 w-48 h-24 border rounded overflow-hidden flex items-center justify-center bg-white">
                          <img
                            src={signaturePreview}
                            alt="Signature preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="member" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedDepartment && (
                    <div>
                      <Label htmlFor="member">Member with Appointment</Label>
                      <Select
                        value={selectedMember?.id.toString() || ''}
                        onValueChange={(value) => {
                          const member = members.find(m => m.id.toString() === value);
                          setSelectedMember(member || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.name} ({member.memberRegNumber}) - {member.postNameEn}
                              {!member.hasSignature && ' - No signature'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {members.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">No members with appointments in this department</p>
                      )}
                    </div>
                  )}

                  {selectedMember && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold">Selected Member:</p>
                      <p className="text-sm">Name: {selectedMember.name}</p>
                      <p className="text-sm">Department: {selectedMember.deptNameEn}</p>
                      <p className="text-sm">Post: {selectedMember.postNameEn}</p>
                      {!selectedMember.hasSignature && (
                        <p className="text-sm text-red-500 mt-2">⚠️ This member does not have a signature on file</p>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button
                type="submit"
                disabled={isSubmitting || existingSignatures.length >= 4}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Add Signature
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Signatures */}
        <Card>
          <CardHeader>
            <CardTitle>Current Signatures ({certificateType})</CardTitle>
            <CardDescription>
              {existingSignatures.length} of 4 signatures configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {existingSignatures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No signatures added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {existingSignatures.map((sig) => (
                  <div key={sig.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Order: {sig.displayOrder}
                          </span>
                          {sig.memberId && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              From Member
                            </span>
                          )}
                        </div>
                        <p className="font-semibold">{sig.nameEn}</p>
                        {sig.nameHi && <p className="text-sm text-gray-600">{sig.nameHi}</p>}
                        <p className="text-sm text-gray-500 mt-1">{sig.designationEn}</p>
                        {sig.designationHi && <p className="text-sm text-gray-500">{sig.designationHi}</p>}
                        {sig.deptNameEn && (
                          <p className="text-xs text-gray-400 mt-1">
                            {sig.deptNameEn} - {sig.postNameEn}
                          </p>
                        )}
                        {sig.signaturePath && (
                          <div className="mt-2 w-32 h-16 border rounded overflow-hidden flex items-center justify-center bg-white">
                            <img
                              src={sig.signaturePath}
                              alt="Signature"
                              className="max-w-full max-h-full object-contain"
                              key={`sig-img-${sig.id}-${sig.signaturePath}`}
                              onError={(e) => {
                                // Force reload on error (cache issue)
                                const target = e.target as HTMLImageElement;
                                if (target.src && !target.src.includes('_t=')) {
                                  target.src = `${target.src}${target.src.includes('?') ? '&' : '?'}_t=${Date.now()}`;
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSignature(sig)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSignature(sig.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Signature Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Signature</DialogTitle>
            <DialogDescription>
              Update signature details and image. Leave signature image unchanged if you don't want to update it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSignature} className="space-y-4">
            <div>
              <Label htmlFor="edit_name_en">Name (English) *</Label>
              <Input
                id="edit_name_en"
                value={editNameEn}
                onChange={(e) => setEditNameEn(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_name_hi">Name (Hindi)</Label>
              <Input
                id="edit_name_hi"
                value={editNameHi}
                onChange={(e) => setEditNameHi(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit_designation_en">Designation (English) *</Label>
              <Input
                id="edit_designation_en"
                value={editDesignationEn}
                onChange={(e) => setEditDesignationEn(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_designation_hi">Designation (Hindi)</Label>
              <Input
                id="edit_designation_hi"
                value={editDesignationHi}
                onChange={(e) => setEditDesignationHi(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit_signature">Signature Image (Optional - Max 100KB)</Label>
              <p className="text-xs text-gray-500 mb-2">
                Leave empty to keep current signature, or upload a new one to replace it.
              </p>
              <div className="mt-2">
                <Input
                  id="edit_signature"
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileChange}
                />
                {editSignaturePreview && (
                  <div className="mt-4 w-48 h-24 border rounded overflow-hidden flex items-center justify-center bg-white">
                    <img
                      src={editSignaturePreview}
                      alt="Signature preview"
                      className="max-w-full max-h-full object-contain"
                      key={`edit-preview-${editingSignature?.id || 'new'}`}
                    />
                  </div>
                )}
              </div>
            </div>

            {editingSignature?.memberId && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This signature was originally fetched from a member. 
                  You can edit the displayed name and designation, but the member reference will remain.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingSignature(null);
                  setEditNameEn('');
                  setEditNameHi('');
                  setEditDesignationEn('');
                  setEditDesignationHi('');
                  setEditSignatureFile(null);
                  setEditSignaturePreview(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Signature
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

