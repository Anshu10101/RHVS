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
  const { currentUser } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [districtAdmins, setDistrictAdmins] = useState<DistrictAdmin[]>([]);
  const [districts, setDistricts] = useState<Array<{id: string, name: string}>>([]);
  const [states, setStates] = useState<Array<{id: number, name: string}>>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // Form states
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [tempPassword, setTempPassword] = useState<string>("");
  
  // Filter states
  const [filterState, setFilterState] = useState<string>("all");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);

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
  
  // Fetch states from database
  const fetchStates = async () => {
    try {
      const response = await fetch('/api/states');
      const data = await response.json();
      if (data.success) {
        setStates(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch states:', err);
    }
  };

  // Fetch districts based on selected state
  const fetchDistricts = async (stateId: string) => {
    if (!stateId || stateId === 'all') {
      setDistricts([]);
      return;
    }

    try {
      setLoadingDistricts(true);
      const response = await fetch(`/api/districts?stateId=${stateId}`);
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data.map((district: { id: number; name: string }) => ({
          id: district.id,
          name: district.name
        })));
      } else {
        setDistricts([]);
      }
    } catch (err) {
      console.error('Failed to fetch districts:', err);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

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
          setFilteredMembers(membersList);
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
    fetchStates();
  }, [isSuperAdmin]);

  // Fetch districts when state filter changes
  useEffect(() => {
    if (filterState && filterState !== 'all') {
      fetchDistricts(filterState);
    } else {
      setDistricts([]);
    }
  }, [filterState]);
  
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
          memberId: selectedMember.id,
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
    setSelectedMember(null);
    setSelectedState("");
    setSelectedDistrict("");
    setTempPassword("");
    setFilterState("all");
    setFilterDistrict("all");
    setDistricts([]);
  };

  // Filter members based on state and district
  useEffect(() => {
    let filtered = [...members];
    
    if (filterState && filterState !== "all") {
      const selectedStateName = states.find(s => s.id.toString() === filterState)?.name;
      if (selectedStateName) {
        filtered = filtered.filter(member => member.state === selectedStateName);
      }
    }
    
    if (filterDistrict && filterDistrict !== "all") {
      const selectedDistrictName = districts.find(d => d.id === filterDistrict)?.name;
      if (selectedDistrictName) {
        filtered = filtered.filter(member => member.district === selectedDistrictName);
      }
    }
    
    setFilteredMembers(filtered);
  }, [members, filterState, filterDistrict, states, districts]);

  const handleMemberSelect = (memberId: string) => {
    const member = filteredMembers.find(m => m.id.toString() === memberId);
    setSelectedMember(member || null);
    
    if (member) {
      setSelectedState(member.state || "");
      setSelectedDistrict(member.district || "");
    } else {
      setSelectedState("");
      setSelectedDistrict("");
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appoint District Admin</DialogTitle>
            <DialogDescription>
              Select a member to appoint as district admin. They will have access to manage their district.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Filter Section */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Filter Members</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterState("all");
                    setFilterDistrict("all");
                    setDistricts([]);
                  }}
                  className="h-8 text-xs"
                >
                  Clear Filters
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter-state" className="text-sm font-medium text-gray-700">State</Label>
                  <Select value={filterState} onValueChange={setFilterState}>
                    <SelectTrigger className="mt-1 h-10">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {states.map(state => (
                        <SelectItem key={state.id} value={state.id.toString()}>{state.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="filter-district" className="text-sm font-medium text-gray-700">District</Label>
                  <Select 
                    value={filterDistrict} 
                    onValueChange={setFilterDistrict}
                    disabled={!filterState || filterState === 'all' || loadingDistricts}
                  >
                    <SelectTrigger className="mt-1 h-10">
                      <SelectValue placeholder={loadingDistricts ? "Loading..." : "All Districts"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      {districts.map(district => (
                        <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing {filteredMembers.length} of {members.length} members
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="member" className="text-sm font-medium text-gray-700">Select Member</Label>
              <Select 
                onValueChange={handleMemberSelect}
                value={selectedMember ? selectedMember.id.toString() : ""}
              >
                <SelectTrigger id="member" className="h-10">
                  <SelectValue placeholder="Choose a member from the filtered list" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredMembers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No members available. Try adjusting your filters.
                    </div>
                  ) : (
                    filteredMembers.map(member => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name} - {member.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Member Confirmation */}
            {selectedMember && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-green-800">Selected Member</span>
                </div>
                <div className="space-y-1 text-sm text-green-700">
                  <p><span className="font-medium">Name:</span> {selectedMember.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedMember.email}</p>
                  <p><span className="font-medium">Location:</span> {selectedMember.district}, {selectedMember.state}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
              <Input
                id="state"
                value={selectedState}
                readOnly
                className="bg-gray-50 h-10"
                placeholder="Will be auto-populated from member data"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="district" className="text-sm font-medium text-gray-700">District</Label>
              <Input
                id="district"
                value={selectedDistrict}
                readOnly
                className="bg-gray-50 h-10"
                placeholder="Will be auto-populated from member data"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="temp-password" className="text-sm font-medium text-gray-700">Temporary Password</Label>
              <Input
                id="temp-password"
                type="password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Set a temporary password"
                className="h-10"
              />
            </div>
            
            
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddDialogOpen(false);
              resetForm();
            }}>
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
