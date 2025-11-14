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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, User, UserRound, Mail, Phone, Home, MapPin, Map, IdCard, Calendar as CalendarIcon, Shield, CheckCircle, ArrowRight, Camera, Sparkles, ChevronDown, Bell, Send } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Image from 'next/image';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AsyncSearchableSelect } from '@/components/ui/async-searchable-select';
import { format } from 'date-fns';

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
  existingMemberRegNumber: z.string().min(1, 'Existing member registration number is required'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
  feePaid: z.boolean(),
  hasSignature: z.boolean().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface State {
  id: number;
  name: string;
  code: string;
}

interface District {
  id: number;
  name: string;
}

export default function MemberRegistrationPage() {
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [showInitiatedNotice, setShowInitiatedNotice] = useState(false);
  const [initiatedNoticeDetails, setInitiatedNoticeDetails] = useState<{ token?: string | null; expiresAt?: string | null; name?: string | null } | null>(null);

  // Fetch states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('/api/states');
        const data = await response.json();
        if (data.success) {
          setStates(data.data);
        }
      } catch (error) {
        console.error('Error fetching states:', error);
      }
    };
    
    fetchStates();
    
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
        return data.data.map((district: { id: string | number; name: string }) => ({
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
  const fetchDistricts = async (stateId: string) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }
    
    setLoadingDistricts(true);
    try {
      const response = await fetch(`/api/districts?stateId=${stateId}`);
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

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
      otp: '',
      feePaid: false,
    },
    mode: 'onChange',
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 500KB)
      if (file.size > 500 * 1024) {
        alert('Profile photo size must be less than 500KB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
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
        alert('Signature image size must be less than 100KB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setSignature(file);
      form.setValue('hasSignature', true);
    }
  };

  const handleSendOTP = async () => {
    const existingMemberRegNumber = form.getValues('existingMemberRegNumber');
    
    if (!existingMemberRegNumber.trim()) {
      form.setError('existingMemberRegNumber', { message: 'Please enter existing member registration number' });
      return;
    }
    
    try {
      // Show OTP field immediately for better UX
    setOtpSent(true);
       const response = await fetch('/api/register-token', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           action: 'send-otp',
           data: { existingMemberRegNumber }
         }),
       });

      const result = await response.json();
      
      if (!result.success) {
        setOtpSent(false);
        form.setError('existingMemberRegNumber', { message: result.message });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setOtpSent(false);
      form.setError('existingMemberRegNumber', { message: 'Failed to send OTP. Please try again.' });
    }
  };

  const handleChangeRegNumber = () => {
    setOtpSent(false);
    form.setValue('otp', '');
    form.clearErrors('existingMemberRegNumber');
    form.clearErrors('otp');
  };

  const onSubmit = async (data: MemberFormData) => {
    setIsSubmitting(true);
    
    try {
      // Validate profile photo is required
      if (!profilePhoto) {
        form.setError('root', { message: 'Profile photo is required for registration' });
        setIsSubmitting(false);
        return;
      }
      
      // Validate signature is required
      if (!signature) {
        form.setError('root', { message: 'Signature image is required for registration' });
        setIsSubmitting(false);
        return;
      }
       // First verify OTP
       const otpResponse = await fetch('/api/register-token', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           action: 'verify-otp',
           data: {
             existingMemberRegNumber: data.existingMemberRegNumber,
             otp: data.otp
           }
         }),
       });

      const otpResult = await otpResponse.json();
      
      if (!otpResult.success) {
        form.setError('otp', { message: otpResult.message });
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
            form.setError('root', { message: 'Failed to upload profile photo: ' + uploadResult.error });
            setIsSubmitting(false);
            return;
          }
        } catch (error) {
          form.setError('root', { message: 'Failed to upload profile photo' });
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
            form.setError('root', { message: 'Failed to upload signature: ' + uploadResult.error });
            setIsSubmitting(false);
            return;
          }
        } catch (error) {
          form.setError('root', { message: 'Failed to upload signature' });
          setIsSubmitting(false);
          return;
        }
      }

       // Register the member (generates token for admin verification)
       const registerResponse = await fetch('/api/register-token', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           action: 'register-member',
           data: {
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
             existingMemberRegNumber: data.existingMemberRegNumber,
             profilePhotoPath,
             signaturePath
           }
         }),
       });

      const registerResult = await registerResponse.json();
      
      if (registerResult.success) {
        // Success message for token-based registration
        alert(`Registration token generated successfully! Please check your email for the verification token: ${registerResult.token}. Bring this token to the RHVS admin office for final verification and membership approval.`);
        
        // Reset form
        form.reset();
        setProfilePhoto(null);
        setOtpSent(false);
        setCurrentStep(0);
      } else {
        if (registerResult.code === 'REGISTRATION_PENDING') {
          setInitiatedNoticeDetails({
            token: registerResult.token || form.getValues('existingMemberRegNumber'),
            expiresAt: registerResult.expiresAt || null,
            name: registerResult.name || data.name,
          });
          setShowInitiatedNotice(true);
          setIsSubmitting(false);
          return;
        }
        form.setError('root', { message: registerResult.message });
      }
    } catch (error) {
      console.error('Registration error:', error);
      form.setError('root', { message: 'Registration failed. Please try again.' });
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
    <div className="min-h-screen bg-[#fefaf6] text-slate-900">
      <div className="container mx-auto px-4 max-w-6xl py-10">

        <Dialog open={showInitiatedNotice} onOpenChange={setShowInitiatedNotice}>
          <DialogContent className="sm:max-w-md rounded-2xl border border-orange-200 bg-white/95">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-orange-800">
                <Bell className="h-5 w-5 text-orange-500" />
                Already initiated?
              </DialogTitle>
              <DialogDescription className="text-sm text-orange-700 leading-relaxed space-y-2">
                <span>
                  {initiatedNoticeDetails?.token ? (
                    <>
                      A registration for this email is already pending for{' '}
                      <span className="font-semibold">{initiatedNoticeDetails.name || 'the same member'}</span> with token{' '}
                      <span className="font-semibold">{initiatedNoticeDetails.token}</span>. Please bring this token to the RHVS admin for verification instead of submitting the form again.
                      {initiatedNoticeDetails.expiresAt && (
                        <span className="block text-xs text-orange-600 mt-2">
                          Valid until: {new Date(initiatedNoticeDetails.expiresAt).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </>
                  ) : (
                    <>A registration for this email is already pending. Please bring the previously issued token for verification—no need to submit this form again.</>
                  )}
                </span>
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => setShowInitiatedNotice(false)} className="w-full bg-orange-600 hover:bg-orange-700">
              Got it, continue
            </Button>
          </DialogContent>
        </Dialog>
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center">
            <Image
              src="/rhvs_logo.png"
              alt="RHVS"
              width={144}
              height={144}
              className="w-32 h-32 sm:w-36 sm:h-36 object-contain drop-shadow-xl"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Member Registration
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Join <span className="font-semibold text-orange-600">राष्ट्रीय हिन्दू वाहिनी संगठन</span> and represent your region with integrity. Every application is verified by an existing member to keep the community authentic and accountable.
          </p>
        </div>

        <div className="mb-10">
          <div className="rounded-3xl border border-slate-100 bg-white/95 shadow-sm p-6 grid grid-cols-1 md:grid-cols-[auto,1fr] items-center gap-4 text-sm text-slate-600 leading-relaxed">
            <div className="font-semibold text-slate-800">Transparent, patient, trusted.</div>
            <p>Generated Token remains active for 10 days. Share it with the RHVS admin and avoid duplicate submissions our team will guide you through the final verification.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-8">
          {/* Existing Member Verification */}
          <Card className="rounded-3xl border border-slate-100 shadow-lg bg-white">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-orange-50 to-white rounded-t-3xl">
              <CardTitle className="flex items-center gap-3 text-slate-900 text-lg">
                <div className="p-2 bg-orange-500/10 rounded-xl text-orange-600">
                  <Shield className="h-5 w-5 text-orange-500" />
                </div>
                Member Verification
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                An existing member must verify this registration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="existingMemberRegNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                        <IdCard className="h-4 w-4 text-orange-500" />
                        Existing Member Registration Number
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-3">
                          <Input
                            placeholder="Enter existing member's registration number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (otpSent) {
                                handleChangeRegNumber();
                              }
                            }}
                            className="flex-1 h-12 border border-slate-200 rounded-2xl px-4 focus-visible:ring-orange-200 focus-visible:border-orange-300"
                          />
                          <Button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={otpSent}
                            className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 h-12 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 cursor-pointer"
                          >
                            {otpSent ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Sent
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Send className="h-4 w-4" />
                                <span>Send OTP</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {otpSent && (
                  <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                          <Shield className="h-4 w-4 text-orange-500" />
                          OTP Verification
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 6-digit OTP"
                            {...field}
                            maxLength={6}
                            className="text-center text-xl tracking-[0.5em] h-12 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl font-mono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </Form>

              {otpSent && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="p-1 bg-green-500 rounded-full">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-green-700 font-medium">OTP sent to existing member&apos;s registered email</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Registration Form */}
          <Card className="rounded-3xl border border-slate-100 shadow-lg bg-white">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/40 rounded-t-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-orange-100/40 rounded-full -translate-y-16 -translate-x-10" />
              <CardTitle className="flex items-center gap-3 text-slate-900 text-2xl relative z-10">
                <div className="p-3 bg-orange-500/15 rounded-xl text-orange-600">
                  <User className="h-6 w-6 text-orange-500" />
                </div>
                Personal Information
                <ArrowRight className="h-5 w-5 text-orange-500 ml-auto animate-pulse" />
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm relative z-10">
                Please provide accurate information for registration
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Profile & Signature Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                        <Camera className="h-4 w-4 text-orange-500" />
                        Profile Photo
                      </Label>
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border border-slate-100 bg-white">
                        <div className="relative group">
                          <div className="w-36 h-36 rounded-3xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200">
                            {profilePhoto ? (
                              <img
                                src={URL.createObjectURL(profilePhoto)}
                                alt="Profile preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-16 w-16 text-slate-300" />
                            )}
                          </div>
                          {profilePhoto && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-3">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="profile-photo"
                          />
                          <Label
                            htmlFor="profile-photo"
                            className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-orange-200 text-orange-600 font-semibold bg-white hover:bg-orange-50 transition-colors duration-200"
                          >
                            <Upload className="h-4 w-4" />
                            {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                          </Label>
                          <p className="text-sm text-slate-500">
                            Up to 500KB • Passport-size photo on white background
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-orange-500">
                          <path d="M4 22h16"></path>
                          <path d="M4 15s.5-9 8-9 8 9 8 9"></path>
                          <path d="M8 10.5s1.5-3.5 4-3.5 4 3.5 4 3.5"></path>
                        </svg>
                        Member Signature
                      </Label>
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border border-slate-100 bg-white">
                        <div className="relative group">
                          <div className="w-36 h-36 rounded-3xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200">
                            {signature ? (
                              <img
                                src={URL.createObjectURL(signature)}
                                alt="Signature preview"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-slate-300">
                                <path d="M4 22h16"></path>
                                <path d="M4 15s.5-9 8-9 8 9 8 9"></path>
                                <path d="M8 10.5s1.5-3.5 4-3.5 4 3.5 4 3.5"></path>
                              </svg>
                            )}
                          </div>
                          {signature && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow">
                              <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-3">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureUpload}
                            className="hidden"
                            id="signature-upload"
                          />
                          <Label
                            htmlFor="signature-upload"
                            className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-blue-200 text-blue-600 font-semibold bg-white hover:bg-blue-50 transition-colors duration-200"
                          >
                            <Upload className="h-4 w-4" />
                            {signature ? 'Change Signature' : 'Upload Signature'}
                          </Label>
                          <p className="text-sm text-slate-500">
                            Up to 100KB • Clear signature on white background
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-500">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-orange-500" />
                            Full Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter full name"
                              {...field}
                              className="h-12 border border-slate-200 rounded-2xl px-4 bg-white focus-visible:ring-orange-200 focus-visible:border-orange-300"
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
                          <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <Mail className="h-4 w-4 text-orange-500" />
                            Email Address *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              {...field}
                              className="h-12 border border-slate-200 rounded-2xl px-4 bg-white focus-visible:ring-orange-200 focus-visible:border-orange-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Phone and Registration Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <Phone className="h-4 w-4 text-orange-500" />
                            Phone Number *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="Enter phone number"
                              {...field}
                              className="h-12 border border-slate-200 rounded-2xl px-4 bg-white focus-visible:ring-orange-200 focus-visible:border-orange-300"
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
                          <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-orange-500" />
                            Registration Date *
                          </FormLabel>
                          <Input
                            value={field.value ? format(field.value, 'dd MMM yyyy') : ''}
                            readOnly
                            className="h-12 border border-slate-200 rounded-2xl bg-slate-50 cursor-not-allowed px-4"
                          />
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
                        <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                          <Home className="h-4 w-4 text-orange-500" />
                          Address *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter complete address"
                            className="min-h-[140px] border border-slate-200 focus-visible:ring-orange-200 focus-visible:border-orange-300 rounded-2xl bg-white resize-none font-medium p-4"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* State and District */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-1000">
                    <FormField
                      control={form.control}
                      name="stateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            State *
                          </FormLabel>
                          <FormControl>
                            <SearchableSelect
                              options={states.map(state => ({
                                value: state.id.toString(),
                                label: state.name
                              }))}
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('districtId', ''); // Reset district when state changes
                                if (value) {
                                  fetchDistricts(value);
                                } else {
                                  setDistricts([]);
                                }
                              }}
                              placeholder="Search or select state..."
                              searchPlaceholder="Type state name..."
                              emptyText="No states found."
                              className="w-full"
                            />
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
                          <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <Map className="h-4 w-4 text-orange-500" />
                            District *
                          </FormLabel>
                          <FormControl>
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
                        <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                          <IdCard className="h-4 w-4 text-orange-500" />
                          Aadhar Card Number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 12-digit Aadhar card number"
                            maxLength={12}
                            className="h-12 border border-slate-200 focus-visible:ring-orange-200 focus-visible:border-orange-300 rounded-2xl bg-white px-4"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Family Information */}
                  <div className="space-y-6 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900 uppercase tracking-wide">Family Information</h3>
                      <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">Required</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="fatherHusbandName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                              <UserRound className="h-4 w-4 text-orange-500" />
                              Father/Husband Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter father or husband name"
                                {...field}
                                className="h-12 border border-slate-200 rounded-2xl px-4 bg-white focus-visible:ring-orange-200 focus-visible:border-orange-300"
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
                            <FormLabel className="text-slate-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                              <UserRound className="h-4 w-4 text-orange-500" />
                              Mother/Wife Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter mother or wife name"
                                {...field}
                                className="h-12 border border-slate-200 rounded-2xl px-4 bg-white focus-visible:ring-orange-200 focus-visible:border-orange-300"
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
                          className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 cursor-pointer select-none"
                        >
                          <Checkbox
                            id="feePaid"
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                            className="h-5 w-5 border-2 border-slate-300 rounded-md text-orange-600 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                          />
                          <span className="text-slate-800 font-semibold">I have paid the membership fee</span>
                        </Label>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="pt-8 border-t border-slate-200">
                    <div className="space-y-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !otpSent}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 text-lg font-semibold rounded-2xl shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-4 border-white/60 border-t-transparent rounded-full animate-spin" />
                            <span>Registering member…</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <span>Register new member</span>
                            <ArrowRight className="h-5 w-5" />
                          </div>
                        )}
                      </Button>

                      {!otpSent && (
                        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-sm text-orange-800">
                          <Shield className="h-5 w-5" />
                          <div>
                            <p className="font-semibold">Verification required</p>
                            <p>Please confirm OTP with an existing member before submitting.</p>
                          </div>
                        </div>
                      )}

                      {otpSent && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-sm text-green-800">
                          <CheckCircle className="h-5 w-5" />
                          <div>
                            <p className="font-semibold">Ready to register</p>
                            <p>Identity verification complete. Finish the form to submit.</p>
                          </div>
                        </div>
                      )}
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
