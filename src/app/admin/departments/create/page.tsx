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
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateDepartmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAdmin();
  
  const [isLoading, setIsLoading] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');

  // Check if user is superadmin
  useEffect(() => {
    if (currentUser && currentUser.type !== 'superadmin') {
      router.push('/admin');
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!nameEn.trim() || !nameHi.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter both English and Hindi names',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name_en: nameEn,
          name_hi: nameHi,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log the full error for debugging
        console.error('Server error response:', data);
        
        // Check for validation details
        if (data.error === 'Validation failed' && data.details) {
          console.error('Validation errors:', data.details);
          
          // Extract validation errors into a readable format
          const validationErrors = [];
          for (const field in data.details) {
            if (data.details[field]?._errors) {
              validationErrors.push(`${field}: ${data.details[field]._errors.join(', ')}`);
            }
          }
          
          throw new Error(`Validation failed: ${validationErrors.join('; ')}`);
        }
        
        // Handle other error types
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : data.error?.message || JSON.stringify(data.error) || 'Failed to create department';
        throw new Error(errorMessage);
      }

      toast({
        title: 'Success',
        description: 'Department created successfully',
      });

      // Redirect to create posts for this department
      router.push(`/admin/departments/manage?department=${data.department_id}`);
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create department',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || currentUser.type !== 'superadmin') {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create Department</h1>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Department Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* English Name */}
              <div className="space-y-2">
                <Label htmlFor="name_en">Department Name (English)</Label>
                <Input
                  id="name_en"
                  placeholder="Enter department name in English (e.g., Cultural Department)"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                />
              </div>
              
              {/* Hindi Name */}
              <div className="space-y-2">
                <Label htmlFor="name_hi">Department Name (Hindi)</Label>
                <Input
                  id="name_hi"
                  placeholder="विभाग का नाम हिंदी में दर्ज करें (उदाहरण: सांस्कृतिक विभाग)"
                  value={nameHi}
                  onChange={(e) => setNameHi(e.target.value)}
                  required
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">📝 Note:</p>
                <p>After creating the department, you can assign members at different levels (National, State, or District) in the "Assign Members" section.</p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Department'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
    </div>
  );
}
