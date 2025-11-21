"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/contexts/AdminContext';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Calendar,
  User,
  Building2,
  MapPin,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

interface Certificate {
  id: number;
  member_name: string;
  member_reg_number: string;
  profile_photo_path?: string;
  dept_name_en: string;
  dept_name_hi: string;
  post_name_en: string;
  post_name_hi: string;
  level: 'national' | 'state' | 'district';
  state?: string;
  district?: string;
  certificate_number: string;
  appointment_date: string;
  generated_at: string;
  certificate_path: string;
  status: 'generated' | 'downloaded' | 'emailed';
  email_status: 'pending' | 'sent' | 'failed';
  email_sent_at?: string;
}

interface Member {
  id: number;
  name: string;
  member_reg_number: string;
  profile_photo_path?: string;
  state?: string;
  district?: string;
}

interface Department {
  id: number;
  name_en: string;
  name_hi: string;
}

interface Post {
  id: number;
  name_en: string;
  name_hi: string;
  department_id: number;
}

export default function CertificatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAdmin();
  
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Manual generation dialog
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [assignmentLevel, setAssignmentLevel] = useState<'national' | 'state' | 'district'>('national');
  const [assignmentState, setAssignmentState] = useState('');
  const [assignmentDistrict, setAssignmentDistrict] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Check if user is superadmin
  useEffect(() => {
    if (currentUser && currentUser.type !== 'superadmin') {
      router.push('/admin');
    }
  }, [currentUser, router]);

  // Fetch data
  useEffect(() => {
    fetchCertificates();
    fetchMembers();
    fetchDepartments();
    fetchStates();
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    if (assignmentState) {
      fetchDistricts(assignmentState);
    } else {
      setDistricts([]);
    }
  }, [assignmentState]);

  // Fetch posts when department changes
  useEffect(() => {
    if (selectedDept) {
      fetchPosts(selectedDept.id);
    } else {
      setPosts([]);
    }
  }, [selectedDept]);

  const fetchCertificates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/certificates');
      const data = await response.json();
      if (data.certificates) {
        setCertificates(data.certificates);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load certificates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/members?limit=1000', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (data.data?.members) {
        setMembers(data.data.members);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
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

  const fetchPosts = async (departmentId: number) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}/posts`);
      const data = await response.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

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

  const fetchDistricts = async (state: string) => {
    try {
      const response = await fetch(`/api/locations?type=districts&state=${encodeURIComponent(state)}`);
      const data = await response.json();
      if (data.districts) {
        setDistricts(data.districts);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!selectedMember || !selectedDept || !selectedPost) {
      toast({
        title: 'Error',
        description: 'Please select member, department, and post',
        variant: 'destructive',
      });
      return;
    }

    if (assignmentLevel === 'state' && !assignmentState) {
      toast({
        title: 'Error',
        description: 'Please select a state for state level assignment',
        variant: 'destructive',
      });
      return;
    }

    if (assignmentLevel === 'district' && (!assignmentState || !assignmentDistrict)) {
      toast({
        title: 'Error',
        description: 'Please select both state and district for district level assignment',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: selectedMember.id,
          department_id: selectedDept.id,
          post_id: selectedPost.id,
          level: assignmentLevel,
          state: assignmentLevel !== 'national' ? assignmentState : null,
          district: assignmentLevel === 'district' ? assignmentDistrict : null,
          appointment_date: appointmentDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate certificate');
      }

      toast({
        title: 'Success',
        description: 'Certificate generated successfully',
      });

      // Reset form
      setSelectedMember(null);
      setSelectedDept(null);
      setSelectedPost(null);
      setAssignmentLevel('national');
      setAssignmentState('');
      setAssignmentDistrict('');
      setAppointmentDate(new Date().toISOString().split('T')[0]);
      setIsGenerateDialogOpen(false);

      // Refresh certificates list
      fetchCertificates();

    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate certificate',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      const response = await fetch(`/api/certificates/${certificate.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${certificate.certificate_number}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Update status to downloaded
        setCertificates(prev => 
          prev.map(cert => 
            cert.id === certificate.id 
              ? { ...cert, status: 'downloaded' as const }
              : cert
          )
        );

        toast({
          title: 'Success',
          description: 'Certificate downloaded successfully',
        });
      } else {
        throw new Error('Failed to download certificate');
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to download certificate',
        variant: 'destructive',
      });
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || cert.dept_name_en === selectedDepartment;
    const matchesLevel = selectedLevel === 'all' || cert.level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || cert.status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesLevel && matchesStatus;
  });

  if (!currentUser || currentUser.type !== 'superadmin') {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Certificate Management</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <Button
            onClick={() => setIsGenerateDialogOpen(true)}
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Certificate
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or certificate number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name_en}>
                      {dept.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="level">Level</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="national">National</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="downloaded">Downloaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      <Card>
        <CardHeader>
          <CardTitle>Certificates ({filteredCertificates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No certificates found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCertificates.map((certificate) => (
                <div key={certificate.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                        {certificate.profile_photo_path ? (
                          <Image
                            src={certificate.profile_photo_path}
                            alt={certificate.member_name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-orange-100 text-orange-800 font-semibold">
                            {certificate.member_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{certificate.member_name}</h3>
                        <p className="text-sm text-gray-500">{certificate.member_reg_number}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Building2 className="h-3 w-3" />
                          <span>{certificate.dept_name_en} - {certificate.post_name_en}</span>
                          <Badge variant={certificate.level === 'national' ? 'default' : 'secondary'}>
                            {certificate.level}
                          </Badge>
                          {certificate.state && (
                            <>
                              <MapPin className="h-3 w-3" />
                              <span>{certificate.state}</span>
                            </>
                          )}
                          {certificate.district && (
                            <span>• {certificate.district}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm text-gray-500">
                        <p>Cert: {certificate.certificate_number}</p>
                        <p>Date: {new Date(certificate.appointment_date).toLocaleDateString()}</p>
                        <div className="flex space-x-1">
                          <Badge variant={certificate.status === 'downloaded' ? 'default' : 'outline'}>
                            {certificate.status}
                          </Badge>
                          <Badge 
                            variant={
                              certificate.email_status === 'sent' ? 'default' : 
                              certificate.email_status === 'failed' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            Email: {certificate.email_status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadCertificate(certificate)}
                        className="flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Certificate Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Certificate</DialogTitle>
            <DialogDescription>
              Generate a new appointment certificate for a member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="member">Member</Label>
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
                        {member.name} ({member.member_reg_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={selectedDept?.id.toString() || ''}
                  onValueChange={(value) => {
                    const dept = departments.find(d => d.id.toString() === value);
                    setSelectedDept(dept || null);
                    setSelectedPost(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="post">Post</Label>
                <Select
                  value={selectedPost?.id.toString() || ''}
                  onValueChange={(value) => {
                    const post = posts.find(p => p.id.toString() === value);
                    setSelectedPost(post || null);
                  }}
                  disabled={!selectedDept}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select post" />
                  </SelectTrigger>
                  <SelectContent>
                    {posts.map((post) => (
                      <SelectItem key={post.id} value={post.id.toString()}>
                        {post.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="level">Assignment Level</Label>
                <Select
                  value={assignmentLevel}
                  onValueChange={(value) => {
                    setAssignmentLevel(value as 'national' | 'state' | 'district');
                    if (value === 'national') {
                      setAssignmentState('');
                      setAssignmentDistrict('');
                    } else if (value === 'state') {
                      setAssignmentDistrict('');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {assignmentLevel !== 'national' && (
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={assignmentState}
                    onValueChange={(value) => {
                      setAssignmentState(value);
                      setAssignmentDistrict('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {assignmentLevel === 'district' && (
                <div>
                  <Label htmlFor="district">District</Label>
                  <Select
                    value={assignmentDistrict}
                    onValueChange={setAssignmentDistrict}
                    disabled={!assignmentState}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label htmlFor="appointment_date">Appointment Date</Label>
                <Input
                  id="appointment_date"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateCertificate} 
              disabled={isGenerating || !selectedMember || !selectedDept || !selectedPost}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Certificate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
