"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, User, Mail, Phone, MapPin, Calendar as CalendarIcon, Users, Shield, CheckCircle, ArrowRight, Camera, Sparkles, Lock } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AsyncSearchableSelect } from '@/components/ui/async-searchable-select';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useAdmin } from '@/contexts/AdminContext';

const memberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  stateId: z.string().min(1, 'State is required'),
  districtId: z.string().min(1, 'District is required'),
  aadharCardNumber: z.string().min(12, 'Aadhar card number must be 12 digits').max(12, 'Aadhar card number must be 12 digits').regex(/^\d{12}$/, 'Aadhar card number must contain only digits'),
  fatherHusbandName: z.string().min(2, 'Father/Husband name is required'),
  motherWifeName: z.string().min(2, 'Mother/Wife name is required'),
  registrationDate: z.date().refine((date) => date !== null, {
    message: 'Registration date is required',
  }),
  existingMemberRegNumber: z.string().optional(),
  feePaid: z.boolean(),
  hasSignature: z.boolean().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface State {
  id: number;
  name: string;
  code: string;
}

// interface District {
//   id: number;
//   name: string;
// }

export default function AdminAddMemberPage() {
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [states, setStates] = useState<State[]>([]);
  // const [districts, setDistricts] = useState<District[]>([]);
  // const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [adminStateName, setAdminStateName] = useState<string>('');
  const [adminDistrictName, setAdminDistrictName] = useState<string>('');
  const router = useRouter();
  const { currentUser } = useAdmin();

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      stateId: '',
      districtId: '',
      aadharCardNumber: '',
      fatherHusbandName: '',
      motherWifeName: '',
      registrationDate: new Date(),
      existingMemberRegNumber: '',
      feePaid: false,
    },
    mode: 'onChange',
  });

  // Fetch states on component mount and set district admin's state/district
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('/api/states');
        const data = await response.json();
        if (data.success) {
          setStates(data.data);
          
          // Auto-set state and district for district admins
          if (currentUser?.type === 'district_admin' && currentUser?.district && currentUser?.state) {
            console.log('Setting up district admin location:', currentUser);
            console.log('District admin state:', currentUser.state);
            console.log('District admin district:', currentUser.district);
            
            // Immediately show the state and district names we know
            setAdminStateName(currentUser.state);
            setAdminDistrictName(currentUser.district);
            
            // Find the state and district IDs for the form
            const findStateAndDistrictIds = async () => {
              try {
                // Find state ID
                const stateData = data.data.find((state: { id: number; name: string }) => 
                  state.name.toLowerCase() === currentUser.state?.toLowerCase()
                );
                
                if (stateData) {
                  form.setValue('stateId', stateData.id.toString());
                  console.log('Set state ID:', stateData.id);
                  
                  // Find district ID
                  const districtResponse = await fetch(`/api/districts?stateId=${stateData.id}`);
                  const districtData = await districtResponse.json();
                  
                  if (districtData.success && districtData.data.length > 0) {
                    const matchingDistrict = districtData.data.find((d: { id: number; name: string }) => 
                      d.name.toLowerCase() === currentUser.district?.toLowerCase()
                    );
                    
                    if (matchingDistrict) {
                      form.setValue('districtId', matchingDistrict.id.toString());
                      console.log('Set district ID:', matchingDistrict.id);
                    }
                  }
                  
                  // Load districts for the state
                  // await fetchDistricts(stateData.id.toString());
                } else {
                  console.log('State not found in states list:', currentUser.state);
                }
              } catch (error) {
                console.error('Error finding state and district IDs:', error);
              }
            };
            
            findStateAndDistrictIds();
          } else if (currentUser?.type === 'district_admin' && currentUser?.district) {
            // Fallback if state is not available
            console.log('District admin without state info, using fallback');
            setAdminDistrictName(currentUser.district);
            setAdminStateName('Unknown State');
          }
        }
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    
    fetchStates();
    
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [currentUser, form]);

  // Fetch districts function for async searchable select
  const fetchDistrictsAsync = async (searchTerm: string) => {
    const stateId = form.getValues('stateId');
    if (!stateId) {
      return [];
    }
    
    try {
      const url = searchTerm.trim() 
        ? `/api/districts?stateId=${stateId}&search=${encodeURIComponent(searchTerm)}`
        : `/api/districts?stateId=${stateId}`;
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        return data.data.map((district: { id: number; name: string }) => ({
          value: district.id.toString(),
          label: district.name
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching districts:', error);
      return [];
    }
  };

  // Fetch districts when state changes (for backward compatibility)
  // const fetchDistricts = async (stateId: string) => {
  //   if (!stateId) {
  //     setDistricts([]);
  //     return;
  //   }
    
  //   setLoadingDistricts(true);
  //   try {
  //     const response = await fetch(`/api/districts?stateId=${stateId}`);
  //     const data = await response.json();
  //     if (data.success) {
  //       setDistricts(data.data);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching districts:', error);
  //   } finally {
  //     setLoadingDistricts(false);
  //   }
  // };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 500KB)
      if (file.size > 500 * 1024) {
        toast({
          title: "File too large",
          description: "Profile photo must be less than 500KB",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      setProfilePhoto(file);
    }
  };
  
  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 100KB)
      if (file.size > 100 * 1024) {
        toast({
          title: "File too large",
          description: "Signature image must be less than 100KB",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      setSignature(file);
      form.setValue('hasSignature', true);
    }
  };

  const onSubmit = async (data: MemberFormData) => {
    setIsSubmitting(true);
    
    try {
      // Validate profile photo is required
      if (!profilePhoto) {
        toast({
          title: "Profile photo required",
          description: "Profile photo is required for registration",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Validate signature is required
      if (!signature) {
        toast({
          title: "Signature required",
          description: "Signature image is required for registration",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Upload profile photo
      let profilePhotoPath = null;
      if (profilePhoto) {
        try {
          const formData = new FormData();
          formData.append('file', profilePhoto);
          
          const uploadResponse = await fetch('/api/upload/profile', {
            method: 'POST',
            body: formData,
          });
          
          const uploadResult = await uploadResponse.json();
          
          if (uploadResult.success) {
            profilePhotoPath = uploadResult.url;
          } else {
            toast({
              title: "Upload failed",
              description: 'Failed to upload profile photo: ' + uploadResult.error,
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        } catch (_error) {
          toast({
            title: "Upload failed",
            description: 'Failed to upload profile photo',
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Upload signature
      let signaturePath = null;
      if (signature) {
        try {
          const formData = new FormData();
          formData.append('file', signature);
          
          const uploadResponse = await fetch('/api/upload/signature', {
            method: 'POST',
            body: formData,
          });
          
          const uploadResult = await uploadResponse.json();
          
          if (uploadResult.success) {
            signaturePath = uploadResult.url;
          } else {
            toast({
              title: "Upload failed",
              description: 'Failed to upload signature: ' + uploadResult.error,
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        } catch (_error) {
          toast({
            title: "Upload failed",
            description: 'Failed to upload signature',
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Register the member directly (bypass OTP/token verification)
      const registerResponse = await fetch('/api/admin/members/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          stateId: data.stateId,
          districtId: data.districtId,
          aadharCardNumber: data.aadharCardNumber,
          fatherHusbandName: data.fatherHusbandName,
          motherWifeName: data.motherWifeName,
          registrationDate: data.registrationDate.toISOString().split('T')[0],
          existingMemberRegNumber: data.existingMemberRegNumber || '',
          profilePhotoPath,
          signaturePath,
          feePaid: data.feePaid
        }),
      });

      let registerResult;
      try {
        registerResult = await registerResponse.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        toast({
          title: "Registration failed",
          description: `Server returned invalid response. Status: ${registerResponse.status}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (registerResult.success) {
        toast({
          title: "Member registered successfully",
          description: `Member ${data.name} has been registered with ID: ${registerResult.memberRegNumber}`,
        });
        
        // Reset form
        form.reset();
        setProfilePhoto(null);
        setSignature(null);
        
        // Redirect to members list
        router.push('/admin/members');
      } else {
        toast({
          title: "Registration failed",
          description: registerResult.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: 'Registration failed. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading skeleton component
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-8 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full mb-6 shadow-lg animate-pulse">
              <User className="h-10 w-10 text-orange-200" />
            </div>
            <div className="h-12 bg-gradient-to-r from-orange-300 to-orange-400 rounded-xl mb-4 animate-pulse max-w-md mx-auto"></div>
            <div className="h-6 bg-orange-200 rounded-lg animate-pulse max-w-2xl mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="h-96 bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl animate-pulse"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-[600px] bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-8 relative overflow-hidden animate-in fade-in-0 duration-1000">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fed7aa' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 animate-in slide-in-from-top-4 duration-700">
          <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-4 sm:mb-6 shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-700 rounded-full animate-pulse opacity-75 group-hover:opacity-100"></div>
            <User className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-orange-800" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-orange-800 via-orange-600 to-orange-800 bg-clip-text text-transparent mb-4 sm:mb-6 animate-in slide-in-from-top-2 duration-700 delay-200">
            Add New Member
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-orange-700 max-w-4xl mx-auto leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-400 px-2">
            Direct member registration by admin
            <br className="hidden md:block" />
            <span className="text-orange-600 font-medium">Bypass OTP verification for direct office registration</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Admin Info Card */}
          <Card className="lg:col-span-1 shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 animate-in slide-in-from-left-8 duration-700 delay-600 hover:-translate-y-2">
            <CardHeader className="bg-gradient-to-br from-orange-50 to-orange-100 border-b border-orange-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <CardTitle className="flex items-center gap-3 text-orange-800 text-xl relative z-10">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                Admin Registration
              </CardTitle>
              <CardDescription className="text-orange-600 text-base relative z-10">
                Direct member registration by admin
                <br />
                <span className="text-sm text-orange-500">
                  {currentUser?.role === 'superadmin' ? 'Superadmin verification (RHVS000000)' : 'District admin verification'}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="p-1 bg-green-500 rounded-full flex-shrink-0">
                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm text-green-700 font-medium">
                    {currentUser?.role === 'superadmin' 
                      ? 'Superadmin verification (RHVS000000 reference)' 
                      : 'District admin verification (auto-referenced)'
                    }
                  </span>
                </div>
                
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="p-1 bg-blue-500 rounded-full flex-shrink-0">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm text-blue-700 font-medium">Member will receive welcome email</span>
                </div>

                <div className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="p-1 bg-purple-500 rounded-full flex-shrink-0">
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm text-purple-700 font-medium">Certificate will be generated</span>
                </div>

                {currentUser?.type === 'district_admin' && (
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="p-1 bg-gray-500 rounded-full flex-shrink-0">
                      <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700 font-medium">
                      <div>Location locked to your district</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {adminStateName && adminDistrictName 
                          ? `State: ${adminStateName}, District: ${adminDistrictName}` 
                          : 'State & District auto-set and cannot be changed'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Registration Form */}
          <Card className="lg:col-span-2 shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 animate-in slide-in-from-right-8 duration-700 delay-800 hover:-translate-y-2">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-orange-200/20 to-transparent rounded-full -translate-y-20 -translate-x-20"></div>
              <CardTitle className="flex items-center gap-3 text-orange-800 text-2xl relative z-10">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <User className="h-6 w-6 text-white" />
                </div>
                Member Information
                <ArrowRight className="h-5 w-5 text-orange-500 ml-auto animate-pulse" />
              </CardTitle>
              <CardDescription className="text-orange-600 text-base relative z-10">
                Please provide accurate information for direct registration
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                  {/* Profile Photo Upload */}
                  <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-300">
                    <Label className="text-orange-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                      <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Profile Photo
                    </Label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-gradient-to-br from-orange-50/50 to-orange-100/30 rounded-xl sm:rounded-2xl border border-orange-200/50">
                      <div className="relative group">
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden shadow-2xl border-4 border-white hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105">
                          {profilePhoto ? (
                            <Image
                              src={URL.createObjectURL(profilePhoto)}
                              alt="Profile preview"
                              fill
                              className="object-cover hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <User className="h-16 w-16 text-orange-400 group-hover:scale-110 transition-transform duration-300" />
                          )}
                        </div>
                        {profilePhoto && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="profile-photo"
                        />
                        <Label
                          htmlFor="profile-photo"
                          className="cursor-pointer inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105 transform text-xs sm:text-sm"
                        >
                          <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="whitespace-nowrap">{profilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
                        </Label>
                        <p className="text-xs sm:text-sm text-orange-600 mt-2 sm:mt-3 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-2">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full inline-block"></span>
                          <span className="text-center sm:text-left">JPG, PNG up to 500KB • Passport size recommended • Required</span>
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full inline-block"></span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Signature Upload */}
                  <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-400">
                    <Label className="text-orange-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                        <path d="M4 22h16"></path>
                        <path d="M4 15s.5-9 8-9 8 9 8 9"></path>
                        <path d="M8 10.5s1.5-3.5 4-3.5 4 3.5 4 3.5"></path>
                      </svg>
                      Member Signature
                    </Label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-xl sm:rounded-2xl border border-blue-200/50">
                      <div className="relative group">
                        <div className="relative w-28 h-16 sm:w-32 sm:h-18 lg:w-36 lg:h-20 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden shadow-2xl border-4 border-white hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
                          {signature ? (
                            <Image
                              src={URL.createObjectURL(signature)}
                              alt="Signature preview"
                              fill
                              className="object-contain hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400 group-hover:scale-110 transition-transform duration-300">
                              <path d="M4 22h16"></path>
                              <path d="M4 15s.5-9 8-9 8 9 8 9"></path>
                              <path d="M8 10.5s1.5-3.5 4-3.5 4 3.5 4 3.5"></path>
                            </svg>
                          )}
                        </div>
                        {signature && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden"
                          id="signature-upload"
                        />
                        <Label
                          htmlFor="signature-upload"
                          className="cursor-pointer inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105 transform text-xs sm:text-sm"
                        >
                          <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="whitespace-nowrap">{signature ? 'Change Signature' : 'Upload Signature'}</span>
                        </Label>
                        <p className="text-xs sm:text-sm text-blue-600 mt-2 sm:mt-3 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-2">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full inline-block"></span>
                          <span className="text-center sm:text-left">JPG, PNG up to 100KB • Clear signature on white background • Required</span>
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full inline-block"></span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-500">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-orange-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Full Name *
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-400 group-focus-within:text-orange-600 transition-colors duration-200" />
                              <Input
                                placeholder="Enter full name"
                                {...field}
                                className="pl-9 sm:pl-10 h-12 sm:h-14 text-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address *
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400 group-focus-within:text-orange-600 transition-colors duration-200" />
                              <Input
                                type="email"
                                placeholder="Enter email address"
                                {...field}
                                className="pl-9 sm:pl-10 h-12 sm:h-14 text-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Phone and Registration Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-700">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number *
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400 group-focus-within:text-orange-600 transition-colors duration-200" />
                              <Input
                                type="tel"
                                placeholder="Enter phone number"
                                {...field}
                                className="pl-9 sm:pl-10 h-12 sm:h-14 text-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="registrationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            Registration Date *
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal border-2 border-orange-200 hover:border-orange-400 h-12 sm:h-14 text-sm rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium cursor-pointer"
                                >
                                  <CalendarIcon className="mr-3 h-4 w-4 text-orange-400" />
                                  {field.value ? format(field.value, "PPP") : "Select date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 shadow-2xl border-0 rounded-2xl bg-white/95 backdrop-blur-sm" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                                captionLayout="dropdown"
                                fromYear={1900}
                                toYear={new Date().getFullYear() + 10}
                                className="rounded-2xl border-0"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="animate-in slide-in-from-bottom-4 duration-500 delay-900">
                        <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Address *
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-orange-400 group-focus-within:text-orange-600 transition-colors duration-200" />
                            <Textarea
                              placeholder="Enter complete address"
                              className="min-h-[100px] sm:min-h-[140px] pl-9 sm:pl-10 text-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg resize-none font-medium p-3 sm:p-4"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* State and District */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-1000">
                    <FormField
                      control={form.control}
                      name="stateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            State *
                          </FormLabel>
                          <FormControl>
                            {currentUser?.type === 'district_admin' ? (
                              <div className="w-full h-12 sm:h-14 text-sm border border-gray-200 rounded-xl sm:rounded-2xl bg-gray-50/50 flex items-center px-3 sm:px-4 relative">
                                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 mr-2 sm:mr-3 flex-shrink-0" />
                                <span className="text-gray-800 font-medium truncate">
                                  {adminStateName || 'Loading...'}
                                </span>
                                <div className="ml-auto flex items-center flex-shrink-0">
                                  <Lock className="h-3 w-3 text-gray-400 mr-1" />
                                  <span className="text-xs text-gray-500 font-medium">Locked</span>
                                </div>
                              </div>
                            ) : (
                              <SearchableSelect
                                options={states.map(state => ({
                                  value: state.id.toString(),
                                  label: state.name
                                }))}
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue('districtId', ''); // Reset district when state changes
                                  // if (value) {
                                  //   fetchDistricts(value);
                                  // } else {
                                  //   setDistricts([]);
                                  // }
                                }}
                                placeholder="Search or select state..."
                                searchPlaceholder="Type state name..."
                                emptyText="No states found."
                                className="w-full"
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="districtId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            District *
                          </FormLabel>
                          <FormControl>
                            {currentUser?.type === 'district_admin' ? (
                              <div className="w-full h-12 sm:h-14 text-sm border border-gray-200 rounded-xl sm:rounded-2xl bg-gray-50/50 flex items-center px-3 sm:px-4 relative">
                                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 mr-2 sm:mr-3 flex-shrink-0" />
                                <span className="text-gray-800 font-medium truncate">
                                  {adminDistrictName || 'Loading...'}
                                </span>
                                <div className="ml-auto flex items-center flex-shrink-0">
                                  <Lock className="h-3 w-3 text-gray-400 mr-1" />
                                  <span className="text-xs text-gray-500 font-medium">Locked</span>
                                </div>
                              </div>
                            ) : (
                              <AsyncSearchableSelect
                                fetchOptions={fetchDistrictsAsync}
                                value={field.value}
                                onValueChange={field.onChange}
                                placeholder={!form.watch('stateId') ? "Select state first" : "Search or select district..."}
                                searchPlaceholder="Type district name..."
                                emptyText="No districts found."
                                disabled={!form.watch('stateId')}
                                className="w-full"
                                maxHeight={250}
                                debounceMs={300}
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Aadhar Card Number */}
                  <FormField
                    control={form.control}
                    name="aadharCardNumber"
                    render={({ field }) => (
                      <FormItem className="animate-in slide-in-from-bottom-4 duration-500 delay-1100">
                        <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Aadhar Card Number *
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400 group-focus-within:text-orange-600 transition-colors duration-200" />
                            <Input
                              placeholder="Enter 12-digit Aadhar card number"
                              maxLength={12}
                              className="pl-9 sm:pl-10 text-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium p-3 sm:p-4"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Family Information */}
                  <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-orange-50/60 to-orange-100/40 rounded-2xl sm:rounded-3xl border border-orange-200/50 animate-in slide-in-from-bottom-4 duration-500 delay-1100 hover:shadow-lg transition-all duration-300">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-800 flex items-center gap-2 sm:gap-3">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                      </div>
                      <span>Family Information</span>
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-orange-300 to-transparent rounded-full ml-2 sm:ml-4"></div>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="fatherHusbandName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Father/Husband Name *
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400 group-focus-within:text-orange-600 transition-colors duration-200" />
                                <Input
                                  placeholder="Enter father or husband name"
                                  {...field}
                                  className="pl-9 sm:pl-10 h-12 sm:h-14 text-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="motherWifeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Mother/Wife Name *
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400 group-focus-within:text-orange-600 transition-colors duration-200" />
                                <Input
                                  placeholder="Enter mother or wife name"
                                  {...field}
                                  className="pl-9 sm:pl-10 h-12 sm:h-14 text-sm border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-xl sm:rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>


                  {/* Fee Paid Checkbox */}
                  <FormField
                    control={form.control}
                    name="feePaid"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <input
                          id="feePaid"
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-5 w-5 rounded-md border-orange-300 text-orange-600 focus:ring-orange-500"
                        />
                        <FormLabel htmlFor="feePaid" className="text-orange-800 font-semibold">
                          Membership fee has been paid
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="pt-4 sm:pt-6 lg:pt-8 border-t border-orange-200/50 animate-in slide-in-from-bottom-4 duration-500 delay-1300">
                    <div className="space-y-4 sm:space-y-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 hover:from-orange-700 hover:via-orange-800 hover:to-orange-900 text-white py-4 sm:py-5 text-base sm:text-lg lg:text-xl font-bold rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-orange-500/25 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-2xl group relative overflow-hidden cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {isSubmitting ? (
                          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 border-3 sm:border-4 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm sm:text-base lg:text-lg">Registering Member...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                            <User className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-sm sm:text-base lg:text-lg">Register New Member</span>
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 group-hover:translate-x-2 transition-transform duration-300" />
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
