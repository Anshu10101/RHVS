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
import { Upload, User, Mail, Phone, MapPin, Calendar as CalendarIcon, Users, Shield, CheckCircle, ArrowRight, Camera, Lock } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AsyncSearchableSelect } from '@/components/ui/async-searchable-select';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
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
      <div className="min-h-screen bg-white py-4 sm:py-6 md:py-8">
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
          <div className="text-center mb-6 sm:mb-8">
            <div className="h-6 sm:h-8 bg-slate-200 rounded-lg mb-2 animate-pulse max-w-xs mx-auto"></div>
            <div className="h-4 sm:h-5 bg-slate-200 rounded-lg animate-pulse max-w-md mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-4 sm:gap-6 md:gap-8">
            <div className="h-48 bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm animate-pulse"></div>
            <div className="h-[600px] bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl py-4 sm:py-6 md:py-10">

        <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-4 sm:gap-6 md:gap-8">
          {/* Admin Info Card */}
         

          {/* Main Registration Form */}
          <Card className="rounded-2xl sm:rounded-3xl border border-slate-100 shadow-lg bg-white">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/40 rounded-t-2xl sm:rounded-t-3xl p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 text-lg sm:text-xl md:text-2xl">
                <div className="p-2 sm:p-3 bg-orange-500/15 rounded-lg sm:rounded-xl text-orange-600">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-500" />
                </div>
                <span className="flex-1">Member Information</span>
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs sm:text-sm mt-1">
                Please provide accurate information for direct registration
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                  {/* Profile & Signature Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">
                      <Label className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                        <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                        Profile Photo
                      </Label>
                      <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 bg-white">
                        <div className="relative group">
                          <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200">
                            {profilePhoto ? (
                              <img
                                src={URL.createObjectURL(profilePhoto)}
                                alt="Profile preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-slate-300" />
                            )}
                          </div>
                          {profilePhoto && (
                            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center shadow">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 w-full text-center space-y-2 sm:space-y-3">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="profile-photo"
                          />
                          <Label
                            htmlFor="profile-photo"
                            className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-orange-200 text-orange-600 font-semibold bg-white hover:bg-orange-50 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto"
                          >
                            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                          </Label>
                          <p className="text-xs sm:text-sm text-slate-500 px-2">
                            Up to 500KB • Passport-size photo on white background
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <Label className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500">
                          <path d="M4 22h16"></path>
                          <path d="M4 15s.5-9 8-9 8 9 8 9"></path>
                          <path d="M8 10.5s1.5-3.5 4-3.5 4 3.5 4 3.5"></path>
                        </svg>
                        Member Signature
                      </Label>
                      <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 bg-white">
                        <div className="relative group">
                          <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200">
                            {signature ? (
                              <img
                                src={URL.createObjectURL(signature)}
                                alt="Signature preview"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300">
                                <path d="M4 22h16"></path>
                                <path d="M4 15s.5-9 8-9 8 9 8 9"></path>
                                <path d="M8 10.5s1.5-3.5 4-3.5 4 3.5 4 3.5"></path>
                              </svg>
                            )}
                          </div>
                          {signature && (
                            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center shadow">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 w-full text-center space-y-2 sm:space-y-3">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureUpload}
                            className="hidden"
                            id="signature-upload"
                          />
                          <Label
                            htmlFor="signature-upload"
                            className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-blue-200 text-blue-600 font-semibold bg-white hover:bg-blue-50 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto"
                          >
                            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            {signature ? 'Change Signature' : 'Upload Signature'}
                          </Label>
                          <p className="text-xs sm:text-sm text-slate-500 px-2">
                            Up to 100KB • Clear signature on white background
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                            Full Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter full name"
                              {...field}
                              className="h-11 sm:h-12 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 bg-white focus-visible:ring-orange-200 focus-visible:border-orange-300 text-sm sm:text-base"
                            />
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
                          <FormLabel className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                            Email Address *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              {...field}
                              className="h-11 sm:h-12 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 bg-white focus-visible:ring-orange-200 focus-visible:border-orange-300 text-sm sm:text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Phone and Registration Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                            Phone Number *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="Enter phone number"
                              {...field}
                              className="h-11 sm:h-12 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 bg-white focus-visible:ring-orange-200 focus-visible:border-orange-300 text-sm sm:text-base"
                            />
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
                          <FormLabel className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                            <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                            Registration Date *
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal border border-slate-200 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-white focus-visible:ring-orange-200 focus-visible:border-orange-300 text-sm sm:text-base px-3 sm:px-4"
                                >
                                  <CalendarIcon className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                                  <span className="truncate">{field.value ? format(field.value, "PPP") : "Select date"}</span>
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 shadow-lg border border-slate-200 rounded-xl sm:rounded-2xl bg-white" align="start">
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
                                className="rounded-2xl"
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
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                          Address *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter complete address"
                            className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px] border border-slate-200 focus-visible:ring-orange-200 focus-visible:border-orange-300 rounded-xl sm:rounded-2xl bg-white resize-none font-medium p-3 sm:p-4 text-sm sm:text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* State and District */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="stateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                            State *
                          </FormLabel>
                          <FormControl>
                            {currentUser?.type === 'district_admin' ? (
                              <div className="w-full h-11 sm:h-12 border border-slate-200 rounded-xl sm:rounded-2xl bg-slate-50 flex items-center px-3 sm:px-4">
                                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 mr-2 sm:mr-3 flex-shrink-0" />
                                <span className="text-slate-800 font-medium truncate text-sm sm:text-base">
                                  {adminStateName || 'Loading...'}
                                </span>
                                <div className="ml-auto flex items-center flex-shrink-0">
                                  <Lock className="h-3 w-3 text-slate-400 mr-1" />
                                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">Locked</span>
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
                                  form.setValue('districtId', '');
                                }}
                                placeholder="Search or select state..."
                                searchPlaceholder="Type state name..."
                                emptyText="No states found."
                                className="w-full text-sm sm:text-base"
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
                          <FormLabel className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                            District *
                          </FormLabel>
                          <FormControl>
                            {currentUser?.type === 'district_admin' ? (
                              <div className="w-full h-11 sm:h-12 border border-slate-200 rounded-xl sm:rounded-2xl bg-slate-50 flex items-center px-3 sm:px-4">
                                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 mr-2 sm:mr-3 flex-shrink-0" />
                                <span className="text-slate-800 font-medium truncate text-sm sm:text-base">
                                  {adminDistrictName || 'Loading...'}
                                </span>
                                <div className="ml-auto flex items-center flex-shrink-0">
                                  <Lock className="h-3 w-3 text-slate-400 mr-1" />
                                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">Locked</span>
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
                                className="w-full text-sm sm:text-base"
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
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                          Aadhar Card Number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 12-digit Aadhar card number"
                            maxLength={12}
                            className="h-11 sm:h-12 border border-slate-200 focus-visible:ring-orange-200 focus-visible:border-orange-300 rounded-xl sm:rounded-2xl bg-white px-3 sm:px-4 text-sm sm:text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Family Information */}
                  <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 uppercase tracking-wide">Family Information</h3>
                      <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 sm:px-3 py-1 rounded-full">Required</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="fatherHusbandName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                              Father/Husband Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter father or husband name"
                                {...field}
                                className="h-11 sm:h-12 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 bg-white focus-visible:ring-orange-200 focus-visible:border-orange-300 text-sm sm:text-base"
                              />
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
                            <FormLabel className="text-slate-700 font-semibold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                              Mother/Wife Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter mother or wife name"
                                {...field}
                                className="h-11 sm:h-12 border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 bg-white focus-visible:ring-orange-200 focus-visible:border-orange-300 text-sm sm:text-base"
                              />
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
                      <FormItem>
                        <Label
                          htmlFor="feePaid"
                          className="flex items-center gap-2 sm:gap-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer select-none"
                        >
                          <input
                            id="feePaid"
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 sm:h-5 sm:w-5 rounded-md border-slate-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-slate-800 font-semibold text-sm sm:text-base">I have paid the membership fee</span>
                        </Label>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="pt-4 sm:pt-6 md:pt-8 border-t border-slate-200">
                    <div className="space-y-4 sm:space-y-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center gap-2 sm:gap-3">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 sm:border-4 border-white/60 border-t-transparent rounded-full animate-spin" />
                            <span>Registering member…</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 sm:gap-3">
                            <span>Register new member</span>
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
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
