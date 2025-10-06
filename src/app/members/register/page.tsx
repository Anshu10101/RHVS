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
import { Calendar, Upload, User, Mail, Phone, MapPin, Calendar as CalendarIcon, Users, Shield, CheckCircle, ArrowRight, Camera, Sparkles, ChevronDown } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

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
        return data.data.map((district: any) => ({
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
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
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
             profilePhotoPath
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-8 relative overflow-hidden animate-in fade-in-0 duration-1000">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fed7aa' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-in slide-in-from-top-4 duration-700">
          <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-6 shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-700 rounded-full animate-pulse opacity-75 group-hover:opacity-100"></div>
            <User className="h-12 w-12 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="h-4 w-4 text-orange-800" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-800 via-orange-600 to-orange-800 bg-clip-text text-transparent mb-6 animate-in slide-in-from-top-2 duration-700 delay-200">
            Member Registration
          </h1>
          <p className="text-xl md:text-2xl text-orange-700 max-w-4xl mx-auto leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-400">
            Join <span className="font-semibold text-orange-800 relative">
              राष्ट्रीय हिंदू वाहिनी संगठन
              <span className="absolute -bottom-1 left-0 right-0 block h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></span>
            </span> as a new member.
            <br className="hidden md:block" />
            <span className="text-orange-600 font-medium">An existing member must verify your registration.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Existing Member Verification */}
          <Card className="lg:col-span-1 shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 animate-in slide-in-from-left-8 duration-700 delay-600 hover:-translate-y-2">
            <CardHeader className="bg-gradient-to-br from-orange-50 to-orange-100 border-b border-orange-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <CardTitle className="flex items-center gap-3 text-orange-800 text-xl relative z-10">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                Member Verification
              </CardTitle>
              <CardDescription className="text-orange-600 text-base relative z-10">
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
                      <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide">Existing Member Registration Number</FormLabel>
                      <FormControl>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400" />
                            <Input
                              placeholder="Enter existing member's registration number"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (otpSent) {
                                  handleChangeRegNumber();
                                }
                              }}
                              className="pl-10 h-12 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl"
                            />
                          </div>
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
                              'Send OTP'
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
                        <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide">OTP Verification</FormLabel>
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
                  <span className="text-green-700 font-medium">OTP sent to existing member's registered email</span>
                </div>
              )}
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
                Personal Information
                <ArrowRight className="h-5 w-5 text-orange-500 ml-auto animate-pulse" />
              </CardTitle>
              <CardDescription className="text-orange-600 text-base relative z-10">
                Please provide accurate information for registration
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Profile Photo Upload */}
                  <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-300">
                    <Label className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Profile Photo
                    </Label>
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gradient-to-br from-orange-50/50 to-orange-100/30 rounded-2xl border border-orange-200/50">
                      <div className="relative group">
                        <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden shadow-2xl border-4 border-white hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105">
                          {profilePhoto ? (
                            <img
                              src={URL.createObjectURL(profilePhoto)}
                              alt="Profile preview"
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
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
                          className="cursor-pointer inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105 transform"
                        >
                          <Upload className="h-5 w-5" />
                          {profilePhoto ? 'Change Photo' : 'Upload High-Quality Photo'}
                        </Label>
                        <p className="text-sm text-orange-600 mt-3 font-medium flex items-center justify-center sm:justify-start gap-2">
                          <span className="w-2 h-2 bg-orange-400 rounded-full inline-block"></span>
                          JPG, PNG up to 2MB • High resolution recommended • Required
                          <span className="w-2 h-2 bg-orange-400 rounded-full inline-block"></span>
                        </p>
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
                          <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Full Name *
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400 group-focus-within:text-orange-600 transition-colors duration-200" />
                              <Input
                                placeholder="Enter full name"
                                {...field}
                                className="pl-10 h-14 border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium"
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
                                className="pl-10 h-14 border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Phone and Registration Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-700">
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
                                className="pl-10 h-14 border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium"
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
                                  className="w-full justify-start text-left font-normal border-2 border-orange-200 hover:border-orange-400 h-14 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium cursor-pointer"
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
                              className="min-h-[140px] pl-10 border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg resize-none font-medium p-4"
                              {...field}
                            />
                          </div>
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
                          <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
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
                          <FormLabel className="text-orange-700 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
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
                              className="pl-10 border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium p-4"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Family Information */}
                  <div className="space-y-6 p-8 bg-gradient-to-r from-orange-50/60 to-orange-100/40 rounded-3xl border border-orange-200/50 animate-in slide-in-from-bottom-4 duration-500 delay-1100 hover:shadow-lg transition-all duration-300">
                    <h3 className="text-2xl font-bold text-orange-800 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      Family Information
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-orange-300 to-transparent rounded-full ml-4"></div>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                  className="pl-10 h-14 border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium"
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
                                  className="pl-10 h-14 border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-200 hover:shadow-lg font-medium"
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
                          I have paid the membership fee
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="pt-8 border-t border-orange-200/50 animate-in slide-in-from-bottom-4 duration-500 delay-1300">
                    <div className="space-y-6">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !otpSent}
                        className="w-full bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 hover:from-orange-700 hover:via-orange-800 hover:to-orange-900 text-white py-5 text-xl font-bold rounded-3xl shadow-2xl hover:shadow-orange-500/25 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-2xl group relative overflow-hidden cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {isSubmitting ? (
                          <div className="flex items-center gap-4 relative z-10">
                            <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-lg">Registering Member...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 relative z-10">
                            <User className="h-7 w-7 group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-lg">Register New Member</span>
                            <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                          </div>
                        )}
                      </Button>

                      {!otpSent && (
                        <div className="flex items-center justify-center gap-3 mt-6 p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl shadow-lg">
                          <div className="p-2 bg-orange-500 rounded-full shadow-lg">
                            <Shield className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-center">
                            <p className="text-orange-800 font-bold text-lg">
                              Verification Required
                            </p>
                            <p className="text-orange-700 font-medium">
                              Please verify with an existing member first
                            </p>
                          </div>
                        </div>
                      )}

                      {otpSent && (
                        <div className="flex items-center justify-center gap-3 mt-6 p-6 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-2xl shadow-lg">
                          <div className="p-2 bg-green-500 rounded-full shadow-lg animate-bounce">
                            <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-center">
                            <p className="text-green-800 font-bold text-lg">
                              Ready to Register!
                            </p>
                            <p className="text-green-700 font-medium">
                              All verification steps completed
                            </p>
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
