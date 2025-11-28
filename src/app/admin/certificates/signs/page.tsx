"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
  
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
  const [copyFromOtherType, setCopyFromOtherType] = useState(false);
  const [otherTypeSignatures, setOtherTypeSignatures] = useState<Signature[]>([]);
  const [selectedSourceSignature, setSelectedSourceSignature] = useState<Signature | null>(null);

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
    // Reset copy checkbox and source signature when certificate type changes
    setCopyFromOtherType(false);
    setSelectedSourceSignature(null);
    setOtherTypeSignatures([]);
  }, [certificateType]);

  // Fetch signatures from the other certificate type when copy checkbox is checked
  useEffect(() => {
    if (copyFromOtherType) {
      fetchOtherTypeSignatures();
    } else {
      setOtherTypeSignatures([]);
      setSelectedSourceSignature(null);
    }
  }, [copyFromOtherType, certificateType]);

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
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/certificates/signatures?type=${certificateType}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
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

  const fetchOtherTypeSignatures = async () => {
    try {
      const otherType = certificateType === 'membership' ? 'appointment' : 'membership';
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/certificates/signatures?type=${otherType}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setOtherTypeSignatures(data.signatures);
      }
    } catch (error) {
      console.error('Error fetching other type signatures:', error);
      toast({
        title: t('admin.certificates.signs.error'),
        description: t('admin.certificates.signs.failedToLoadSignatures'),
        variant: 'destructive',
      });
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/departments?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
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
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/certificates/signatures/members?department_id=${deptId}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: t('admin.certificates.signs.error'),
        description: t('admin.certificates.signs.failedToLoadMembers'),
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
          title: t('admin.certificates.signs.error'),
          description: t('admin.certificates.signs.signatureFileSizeError'),
          variant: 'destructive',
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('admin.certificates.signs.error'),
          description: t('admin.certificates.signs.signatureMustBeImage'),
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
        title: t('admin.certificates.signs.error'),
        description: t('admin.certificates.signs.maxSignaturesReached'),
        variant: 'destructive',
      });
      return;
    }

    // When copying from other type, ensure a source signature is selected
    if (copyFromOtherType && !selectedSourceSignature) {
      toast({
        title: t('admin.certificates.signs.error'),
        description: t('admin.certificates.signs.selectSignatureToCopyError'),
        variant: 'destructive',
      });
      return;
    }

    if (method === 'manual') {
      if (!nameEn || !designationEn || !signatureFile) {
        toast({
          title: t('admin.certificates.signs.error'),
          description: t('admin.certificates.signs.fillAllRequiredFields'),
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!selectedMember) {
        toast({
          title: t('admin.certificates.signs.error'),
          description: t('admin.certificates.signs.selectMemberError'),
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
            title: t('admin.certificates.signs.error'),
            description: t('admin.certificates.signs.selectMemberError'),
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        formData.append('member_id', selectedMember.id.toString());
        formData.append('department_id', selectedMember.departmentId);
        formData.append('post_id', selectedMember.postId.toString());
      }

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/certificates/signatures', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('admin.certificates.signs.failedToAddSignature'));
      }

      toast({
        title: t('admin.certificates.signs.success'),
        description: t('admin.certificates.signs.signatureAdded'),
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
        title: t('admin.certificates.signs.error'),
        description: error instanceof Error ? error.message : t('admin.certificates.signs.failedToAddSignature'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSignature = async (signature: Signature) => {
    try {
      // Fetch full signature details
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/certificates/signatures/${signature.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('admin.certificates.signs.failedToLoadSignatureDetails'));
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
        title: t('admin.certificates.signs.error'),
        description: error instanceof Error ? error.message : t('admin.certificates.signs.failedToLoadSignatureDetails'),
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
          title: t('admin.certificates.signs.error'),
          description: t('admin.certificates.signs.signatureFileSizeError'),
          variant: 'destructive',
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('admin.certificates.signs.error'),
          description: t('admin.certificates.signs.signatureMustBeImage'),
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
        title: t('admin.certificates.signs.error'),
        description: t('admin.certificates.signs.fillAllRequiredFields'),
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

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/certificates/signatures/${editingSignature.id}`, {
        method: 'PUT',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('admin.certificates.signs.failedToUpdateSignature'));
      }

      toast({
        title: t('admin.certificates.signs.success'),
        description: t('admin.certificates.signs.signatureUpdated'),
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
        title: t('admin.certificates.signs.error'),
        description: error instanceof Error ? error.message : t('admin.certificates.signs.failedToUpdateSignature'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSignature = async (signatureId: number) => {
    if (!confirm(t('admin.certificates.signs.deleteConfirm'))) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/certificates/signatures/${signatureId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('admin.certificates.signs.failedToDeleteSignature'));
      }

      toast({
        title: t('admin.certificates.signs.success'),
        description: t('admin.certificates.signs.signatureDeleted'),
      });

      fetchExistingSignatures();
    } catch (error) {
      console.error('Error deleting signature:', error);
      toast({
        title: t('admin.certificates.signs.error'),
        description: error instanceof Error ? error.message : t('admin.certificates.signs.failedToDeleteSignature'),
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
          <h1 className="text-2xl font-bold">{t('admin.certificates.signs.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.certificates.signs.description')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/certificates')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('admin.certificates.signs.backToCertificates')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Signature Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.certificates.signs.addNewSignature')}</CardTitle>
            <CardDescription>
              {t('admin.certificates.signs.addSignatureDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="certificate_type">{t('admin.certificates.signs.certificateType')}</Label>
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
                    <SelectItem value="membership">{t('admin.certificates.signs.membershipCertificate')}</SelectItem>
                    <SelectItem value="appointment">{t('admin.certificates.signs.appointmentCertificate')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('admin.certificates.signs.currentSignatures')} {existingSignatures.length}/4</Label>
                {existingSignatures.length >= 4 && (
                  <p className="text-sm text-red-500 mt-1">{t('admin.certificates.signs.maximumReached')}</p>
                )}
              </div>

              {/* Copy from other certificate type */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="copy_from_other"
                  checked={copyFromOtherType}
                  onCheckedChange={(checked) => {
                    setCopyFromOtherType(checked as boolean);
                    if (checked) {
                      // Force manual entry mode when copying
                      setMethod('manual');
                      setSelectedMember(null);
                      setSelectedDepartment('');
                    } else {
                      // Reset form when unchecking
                      setNameEn('');
                      setNameHi('');
                      setDesignationEn('');
                      setDesignationHi('');
                      setSignatureFile(null);
                      setSignaturePreview(null);
                      setSelectedSourceSignature(null);
                    }
                  }}
                />
                <Label
                  htmlFor="copy_from_other"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {t('admin.certificates.signs.copyFromOther').replace('{otherType}', certificateType === 'membership' ? t('admin.certificates.signs.appointmentCertificate') : t('admin.certificates.signs.membershipCertificate'))}
                </Label>
              </div>

              {copyFromOtherType && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <Label htmlFor="source_signature">{t('admin.certificates.signs.selectSignatureToCopy')}</Label>
                    {otherTypeSignatures.length === 0 ? (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          {t('admin.certificates.signs.noSignaturesFound').replace('{type}', certificateType === 'membership' ? t('admin.certificates.signs.appointmentCertificate') : t('admin.certificates.signs.membershipCertificate'))}
                        </p>
                      </div>
                    ) : (
                      <Select
                        value={selectedSourceSignature?.id.toString() || ''}
                        onValueChange={(value) => {
                          const sig = otherTypeSignatures.find(s => s.id.toString() === value);
                          setSelectedSourceSignature(sig || null);
                          if (sig) {
                            // Auto-populate form fields
                            setNameEn(sig.nameEn);
                            setNameHi(sig.nameHi || '');
                            setDesignationEn(sig.designationEn);
                            setDesignationHi(sig.designationHi || '');
                            // Note: We can't copy the signature image file directly, user needs to upload it
                            setSignatureFile(null);
                            setSignaturePreview(null);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.certificates.signs.selectSignaturePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {otherTypeSignatures.map((sig) => (
                            <SelectItem key={sig.id} value={sig.id.toString()}>
                              {sig.nameEn} - {sig.designationEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {selectedSourceSignature && (
                    <div className="p-3 bg-white rounded border">
                      <p className="text-sm font-semibold mb-2">{t('admin.certificates.signs.selectedSignature')}</p>
                      <p className="text-sm">{t('admin.certificates.signs.nameEn')} {selectedSourceSignature.nameEn}</p>
                      {selectedSourceSignature.nameHi && (
                        <p className="text-sm">{t('admin.certificates.signs.nameHi')} {selectedSourceSignature.nameHi}</p>
                      )}
                      <p className="text-sm">{t('admin.certificates.signs.designationEn')} {selectedSourceSignature.designationEn}</p>
                      {selectedSourceSignature.designationHi && (
                        <p className="text-sm">{t('admin.certificates.signs.designationHi')} {selectedSourceSignature.designationHi}</p>
                      )}
                      <p className="text-xs text-orange-600 mt-2">
                        {t('admin.certificates.signs.uploadSignatureNote')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Tabs value={method} onValueChange={(value) => {
                if (!copyFromOtherType) {
                  setMethod(value as 'manual' | 'member');
                  setSelectedMember(null);
                  setSelectedDepartment('');
                }
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual" disabled={copyFromOtherType}>{t('admin.certificates.signs.manualEntry')}</TabsTrigger>
                  <TabsTrigger value="member" disabled={copyFromOtherType}>{t('admin.certificates.signs.fromMember')}</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name_en">{t('admin.certificates.signs.nameEnRequired')}</Label>
                    <Input
                      id="name_en"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      required
                      disabled={copyFromOtherType && !!selectedSourceSignature}
                    />
                  </div>

                  <div>
                    <Label htmlFor="name_hi">{t('admin.certificates.signs.nameHi')}</Label>
                    <Input
                      id="name_hi"
                      value={nameHi}
                      onChange={(e) => setNameHi(e.target.value)}
                      disabled={copyFromOtherType && !!selectedSourceSignature}
                    />
                  </div>

                  <div>
                    <Label htmlFor="designation_en">{t('admin.certificates.signs.designationEnRequired')}</Label>
                    <Input
                      id="designation_en"
                      value={designationEn}
                      onChange={(e) => setDesignationEn(e.target.value)}
                      required
                      disabled={copyFromOtherType && !!selectedSourceSignature}
                    />
                  </div>

                  <div>
                    <Label htmlFor="designation_hi">{t('admin.certificates.signs.designationHi')}</Label>
                    <Input
                      id="designation_hi"
                      value={designationHi}
                      onChange={(e) => setDesignationHi(e.target.value)}
                      disabled={copyFromOtherType && !!selectedSourceSignature}
                    />
                  </div>

                  <div>
                    <Label htmlFor="signature">{t('admin.certificates.signs.signatureImage')}</Label>
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
                            alt={t('admin.certificates.signs.signaturePreview')}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="member" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="department">{t('admin.certificates.signs.department')}</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.certificates.signs.selectDepartment')} />
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
                      <Label htmlFor="member">{t('admin.certificates.signs.memberWithAppointment')}</Label>
                      <Select
                        value={selectedMember?.id.toString() || ''}
                        onValueChange={(value) => {
                          const member = members.find(m => m.id.toString() === value);
                          setSelectedMember(member || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.certificates.signs.selectMember')} />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id.toString()}>
                              {member.name} ({member.memberRegNumber}) - {member.postNameEn}
                              {!member.hasSignature && t('admin.certificates.signs.noSignature')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {members.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">{t('admin.certificates.signs.noMembersWithAppointments')}</p>
                      )}
                    </div>
                  )}

                  {selectedMember && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold">{t('admin.certificates.signs.selectedMember')}</p>
                      <p className="text-sm">{t('admin.certificates.signs.name')} {selectedMember.name}</p>
                      <p className="text-sm">{t('admin.certificates.signs.department')}: {selectedMember.deptNameEn}</p>
                      <p className="text-sm">{t('admin.certificates.signs.post')} {selectedMember.postNameEn}</p>
                      {!selectedMember.hasSignature && (
                        <p className="text-sm text-red-500 mt-2">{t('admin.certificates.signs.memberNoSignatureWarning')}</p>
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
                    {t('admin.certificates.signs.adding')}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('admin.certificates.signs.addSignature')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Signatures */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.certificates.signs.currentSignaturesTitle').replace('{type}', certificateType)}</CardTitle>
            <CardDescription>
              {t('admin.certificates.signs.signaturesConfigured').replace('{count}', String(existingSignatures.length))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {existingSignatures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>{t('admin.certificates.signs.noSignaturesAdded')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {existingSignatures.map((sig) => (
                  <div key={sig.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {t('admin.certificates.signs.order')} {sig.displayOrder}
                          </span>
                          {sig.memberId && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {t('admin.certificates.signs.fromMemberBadge')}
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
                          alt={t('admin.certificates.signs.signaturePreview')}
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
            <DialogTitle>{t('admin.certificates.signs.editSignature')}</DialogTitle>
            <DialogDescription>
              {t('admin.certificates.signs.editSignatureDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSignature} className="space-y-4">
            <div>
              <Label htmlFor="edit_name_en">{t('admin.certificates.signs.nameEnRequired')}</Label>
              <Input
                id="edit_name_en"
                value={editNameEn}
                onChange={(e) => setEditNameEn(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_name_hi">{t('admin.certificates.signs.nameHi')}</Label>
              <Input
                id="edit_name_hi"
                value={editNameHi}
                onChange={(e) => setEditNameHi(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit_designation_en">{t('admin.certificates.signs.designationEnRequired')}</Label>
              <Input
                id="edit_designation_en"
                value={editDesignationEn}
                onChange={(e) => setEditDesignationEn(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_designation_hi">{t('admin.certificates.signs.designationHi')}</Label>
              <Input
                id="edit_designation_hi"
                value={editDesignationHi}
                onChange={(e) => setEditDesignationHi(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit_signature">{t('admin.certificates.signs.signatureImageOptional')}</Label>
              <p className="text-xs text-gray-500 mb-2">
                {t('admin.certificates.signs.leaveEmptyNote')}
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
                      alt={t('admin.certificates.signs.signaturePreview')}
                      className="max-w-full max-h-full object-contain"
                      key={`edit-preview-${editingSignature?.id || 'new'}`}
                    />
                  </div>
                )}
              </div>
            </div>

            {editingSignature?.memberId && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800" dangerouslySetInnerHTML={{ __html: t('admin.certificates.signs.memberSignatureNote').replace('<strong>', '<strong>').replace('</strong>', '</strong>') }} />
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
                {t('admin.certificates.signs.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('admin.certificates.signs.updating')}
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('admin.certificates.signs.updateSignature')}
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

