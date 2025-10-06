"use client";

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { AdminPageTitle } from '@/components/Admin/Layout/AdminPageTitle';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, RefreshCw, Shield, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

interface Member {
  id: number;
  name: string;
  email: string;
  district: string;
  state: string;
}

interface DistrictAdmin {
  id: number;
  memberId: number;
  name: string;
  email: string;
  district: string;
  state: string;
  isActive: boolean;
  appointmentDate: string;
  expiryDate: string | null;
  lastLogin: string | null;
  permissions: string[];
}


export default function AdminsManagementPage() {
  const { currentUser, hasPermission } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [districtAdmins, setDistrictAdmins] = useState<DistrictAdmin[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // Form states
  const [selectedMember, setSelectedMember] = useState<number>(0);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [tempPassword, setTempPassword] = useState<string>("");

  // Safe date parsing/formatting for MySQL timestamps like 'YYYY-MM-DD HH:mm:ss'
  const parseDate = (value?: string | null) => {
    if (!value) return null;
    const iso = value.includes('T') ? value : value.replace(' ', 'T');
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (value?: string | null, pattern: string = 'dd MMM yyyy') => {
    const d = parseDate(value);
    return d ? format(d, pattern) : null;
  };

  // Check if user is superadmin
  const isSuperAdmin = currentUser?.role === 'superadmin';
  
  // Load data
  const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch members
        const membersRes = await fetch('/api/admin/members');
        if (membersRes.ok) {
          const data = await membersRes.json();
          const membersList = data.data?.members || data.members || [];
          setMembers(membersList);
          
          // Extract unique districts from members
          const uniqueDistricts = [...new Set(membersList.map((m: any) => m.district).filter(Boolean))];
          setDistricts(uniqueDistricts);
        }
        
        // Fetch district admins
        const adminsRes = await fetch('/api/admin/members/admins');
        if (adminsRes.ok) {
          const data = await adminsRes.json();
          setDistrictAdmins(data.admins || []);
        } else {
          console.error('Failed to fetch district admins:', adminsRes.status, await adminsRes.text());
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
  
  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchData();
  }, [isSuperAdmin]);
  
  const handleAddAdmin = async () => {
    if (!selectedMember || !selectedState || !selectedDistrict || !tempPassword) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/members/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: selectedMember,
          state: selectedState,
          district: selectedDistrict,
          password: tempPassword,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setDistrictAdmins(prev => [...prev, data.admin]);
        toast.success('District admin added successfully');
        setAddDialogOpen(false);
        resetForm();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to add district admin');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Failed to add district admin');
    }
  };
  
  
  const handleDeleteAdmin = async (id: number) => {
    if (!confirm('Are you sure you want to remove this district admin?')) return;
    
    try {
      const res = await fetch(`/api/admin/members/admins/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setDistrictAdmins(prev => prev.filter(admin => admin.id !== id));
        toast.success('District admin removed successfully');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to remove district admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Failed to remove district admin');
    }
  };
  
  
  
  
  const resetForm = () => {
    setSelectedMember(0);
    setSelectedState("");
    setSelectedDistrict("");
    setTempPassword("");
  };

  const handleMemberSelect = (memberId: string) => {
    const memberIdNum = Number(memberId);
    setSelectedMember(memberIdNum);
    
    // Find the selected member and auto-populate state and district
    const selectedMemberData = members.find(member => member.id === memberIdNum);
    if (selectedMemberData) {
      setSelectedState(selectedMemberData.state);
      setSelectedDistrict(selectedMemberData.district);
    }
  };
  
  
  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-40 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-yellow-500" />
            <h3 className="mt-2 text-sm font-medium text-yellow-800">Access Restricted</h3>
            <p className="mt-1 text-sm text-yellow-700">
              Only superadmins can access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <AdminPageTitle 
        title="District Admins Management" 
        description="Appoint and manage district-level admins"
        icon={<Shield className="h-6 w-6" />}
      />
      
      <div className="my-6 flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
        <Button onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Appoint District Admin
        </Button>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>State</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Appointed On</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : districtAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  No district admins found. Appoint one now.
                </TableCell>
              </TableRow>
            ) : (
              districtAdmins.map(admin => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.state}</TableCell>
                  <TableCell>{admin.district}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      admin.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(admin.appointmentDate) ?? '—'}</TableCell>
                  <TableCell>
                    {admin.expiryDate 
                      ? (formatDate(admin.expiryDate) ?? 'No expiry')
                      : 'No expiry'}
                  </TableCell>
                  <TableCell>
                    {admin.lastLogin
                      ? (formatDate(admin.lastLogin, 'dd MMM yyyy, HH:mm') ?? 'Never logged in')
                      : 'Never logged in'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        className="cursor-pointer"
                      >
                        <Link href={`/admin/permissions/assign?admin=${admin.id}`}>
                          <Shield className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                        onClick={() => handleDeleteAdmin(admin.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Add Admin Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Appoint District Admin</DialogTitle>
            <DialogDescription>
              Select a member to appoint as district admin. They will have access to manage their district.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="member">Select Member</Label>
              <Select 
                onValueChange={handleMemberSelect}
                value={selectedMember.toString()}
              >
                <SelectTrigger id="member">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name} - {member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={selectedState}
                readOnly
                className="bg-gray-50"
                placeholder="Will be auto-populated from member data"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                value={selectedDistrict}
                readOnly
                className="bg-gray-50"
                placeholder="Will be auto-populated from member data"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="temp-password">Temporary Password</Label>
              <Input
                id="temp-password"
                type="password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Set a temporary password"
              />
            </div>
            
            
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdmin}>
              <Check className="h-4 w-4 mr-2" />
              Appoint Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      
    </div>
  );
}
