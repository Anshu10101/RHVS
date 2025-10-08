'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/contexts/AdminContext';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  ArrowLeft, 
  // Eye, 
  // EyeOff,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Store,
  Loader2,
  // CheckCircle,
  Search,
  // Filter,
  Users
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Seller {
  id: string;
  name: string;
  business_name?: string;
  contact_phone: string;
  whatsapp_number?: string;
  email?: string;
  address?: string;
  district: string;
  state: string;
  delivery_info?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  products_count?: number;
}

export default function StoreSellersPage() {
  const router = useRouter();
  const { currentUser } = useAdmin();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [editingSeller, setEditingSeller] = useState<string | null>(null);
  const [editingSellerData, setEditingSellerData] = useState<Seller | null>(null);
  const [addingSeller, setAddingSeller] = useState<boolean>(false);
  const [newSellerData, setNewSellerData] = useState<Partial<Seller>>({
    name: '',
    business_name: '',
    contact_phone: '',
    whatsapp_number: '',
    email: '',
    address: '',
    delivery_info: '',
    district: '',
    state: '',
    is_active: true
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  
  // Filter states (for superadmin only)
  type StateOption = { id: string; name: string };
  type DistrictOption = { id: string; name: string };
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedStateName, setSelectedStateName] = useState<string>('All');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('All');

  // Fetch sellers
  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sellers');
      const result = await response.json();
      
      if (result.success) {
        setSellers(result.data);
      } else {
        console.error('Failed to fetch sellers:', result.message);
        
        // Show user-friendly error for table not found
        if (result.error === 'TABLE_NOT_FOUND') {
          alert('Sellers table not found. Please run the database setup first.\n\nRun this SQL in your database:\nsource database/complete-sellers-setup.sql');
        }
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load states for superadmin location filters
  const loadStates = async () => {
    try {
      const response = await fetch('/api/states');
      const data = await response.json();
      if (data.success) {
        setStateOptions(data.data || []);
      }
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  // Load districts based on selected state
  const loadDistricts = async (stateId: string) => {
    if (!stateId) {
      setDistrictOptions([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/districts?stateId=${stateId}`);
      const data = await response.json();
      if (data.success) {
        setDistrictOptions(data.data || []);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    }
  };

  useEffect(() => {
    fetchSellers();
    
    // Load states for superadmin location filters
    if (currentUser?.role === 'superadmin') {
      loadStates();
    }
  }, [currentUser]);

  // Save seller
  const saveSeller = async () => {
    try {
      setSaving(true);
      
      if (editingSeller) {
        // Update existing seller
        const response = await fetch(`/api/admin/sellers/${editingSeller}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingSellerData)
        });
        
        const result = await response.json();
        if (result.success) {
          setEditingSeller(null);
          setEditingSellerData(null);
          fetchSellers();
        } else {
          alert('Failed to update seller: ' + result.message);
        }
      } else {
        // Create new seller
        const response = await fetch('/api/admin/sellers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSellerData)
        });
        
        const result = await response.json();
        if (result.success) {
          setAddingSeller(false);
          setNewSellerData({
            name: '',
            business_name: '',
            contact_phone: '',
            whatsapp_number: '',
            email: '',
            address: '',
            delivery_info: '',
            district: '',
            state: '',
            is_active: true
          });
          fetchSellers();
        } else {
          alert('Failed to create seller: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error saving seller:', error);
      alert('Error saving seller');
    } finally {
      setSaving(false);
    }
  };

  // Delete seller
  const deleteSeller = async (sellerId: string) => {
    if (!confirm('Are you sure you want to delete this seller?')) return;
    
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        fetchSellers();
      } else {
        alert('Failed to delete seller: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting seller:', error);
      alert('Error deleting seller');
    }
  };

  // Start editing seller
  const startEditing = (seller: Seller) => {
    setEditingSeller(seller.id);
    setEditingSellerData({ ...seller });
    setAddingSeller(false);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSeller(null);
    setEditingSellerData(null);
    setAddingSeller(false);
  };

  // Filtered sellers
  const filteredSellers = (() => {
    let filtered = sellers.filter(seller =>
      seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (seller.business_name && seller.business_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      seller.contact_phone.includes(searchTerm) ||
      (seller.email && seller.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filter by location (superadmin only)
    if (currentUser?.role === 'superadmin') {
      if (selectedStateName !== 'All') {
        filtered = filtered.filter(seller => {
          // Check if seller has state information
          const sellerState = seller.state;
          if (!sellerState) return false;
          
          // Match by state name (case insensitive)
          return sellerState.toLowerCase().includes(selectedStateName.toLowerCase());
        });
      }
      
      if (selectedDistrictName !== 'All') {
        filtered = filtered.filter(seller => {
          // Check if seller has district information
          const sellerDistrict = seller.district;
          if (!sellerDistrict) return false;
          
          // Match by district name (case insensitive)
          return sellerDistrict.toLowerCase().includes(selectedDistrictName.toLowerCase());
        });
      }
    }
    
    return filtered;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Store Sellers Management</h1>
            <p className="text-muted-foreground">
              Manage sellers for your district ({currentUser?.district})
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => {
            setAddingSeller(true);
            setEditingSeller(null);
            setEditingSellerData(null);
          }}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Seller</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sellers by name, business, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          {/* Location Filters (Superadmin only) */}
          {currentUser?.role === 'superadmin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <Select
                  value={selectedStateId || 'all'}
                  onValueChange={async (id) => {
                    const actualId = id === 'all' ? '' : id;
                    setSelectedStateId(actualId);
                    const opt = stateOptions.find(s => s.id === actualId);
                    const name = opt?.name || 'All';
                    setSelectedStateName(name);
                    
                    // Reset district when state changes
                    setSelectedDistrictName('All');
                    
                    // Load districts for selected state
                    if (actualId) {
                      await loadDistricts(actualId);
                    } else {
                      setDistrictOptions([]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {stateOptions.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">District</label>
                <Select
                  value={selectedDistrictName || 'All'}
                  onValueChange={(value) => setSelectedDistrictName(value)}
                  disabled={!selectedStateId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Districts</SelectItem>
                    {districtOptions.map((district) => (
                      <SelectItem key={district.id} value={district.name}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Seller Form */}
      {(addingSeller || editingSeller) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSeller ? 'Edit Seller' : 'Add New Seller'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={editingSeller ? editingSellerData?.name || '' : newSellerData.name || ''}
                  onChange={(e) => {
                    if (editingSeller && editingSellerData) {
                      setEditingSellerData({ ...editingSellerData, name: e.target.value });
                    } else {
                      setNewSellerData({ ...newSellerData, name: e.target.value });
                    }
                  }}
                  placeholder="Seller's full name"
                />
              </div>
              
              {/* District and State fields for superadmin */}
              {currentUser?.role === 'superadmin' && (
                <>
                  <div>
                    <label className="text-sm font-medium">District</label>
                    <Input
                      value={editingSeller ? editingSellerData?.district || '' : newSellerData.district || ''}
                      onChange={(e) => {
                        if (editingSeller && editingSellerData) {
                          setEditingSellerData({ ...editingSellerData, district: e.target.value });
                        } else {
                          setNewSellerData({ ...newSellerData, district: e.target.value });
                        }
                      }}
                      placeholder="District name"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">State</label>
                    <Input
                      value={editingSeller ? editingSellerData?.state || '' : newSellerData.state || ''}
                      onChange={(e) => {
                        if (editingSeller && editingSellerData) {
                          setEditingSellerData({ ...editingSellerData, state: e.target.value });
                        } else {
                          setNewSellerData({ ...newSellerData, state: e.target.value });
                        }
                      }}
                      placeholder="State name"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="text-sm font-medium">Business Name</label>
                <Input
                  value={editingSeller ? editingSellerData?.business_name || '' : newSellerData.business_name || ''}
                  onChange={(e) => {
                    if (editingSeller && editingSellerData) {
                      setEditingSellerData({ ...editingSellerData, business_name: e.target.value });
                    } else {
                      setNewSellerData({ ...newSellerData, business_name: e.target.value });
                    }
                  }}
                  placeholder="Business/store name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Contact Phone *</label>
                <Input
                  value={editingSeller ? editingSellerData?.contact_phone || '' : newSellerData.contact_phone || ''}
                  onChange={(e) => {
                    if (editingSeller && editingSellerData) {
                      setEditingSellerData({ ...editingSellerData, contact_phone: e.target.value });
                    } else {
                      setNewSellerData({ ...newSellerData, contact_phone: e.target.value });
                    }
                  }}
                  placeholder="Primary contact number"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">WhatsApp Number</label>
                <Input
                  value={editingSeller ? editingSellerData?.whatsapp_number || '' : newSellerData.whatsapp_number || ''}
                  onChange={(e) => {
                    if (editingSeller && editingSellerData) {
                      setEditingSellerData({ ...editingSellerData, whatsapp_number: e.target.value });
                    } else {
                      setNewSellerData({ ...newSellerData, whatsapp_number: e.target.value });
                    }
                  }}
                  placeholder="WhatsApp number (if different)"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editingSeller ? editingSellerData?.email || '' : newSellerData.email || ''}
                  onChange={(e) => {
                    if (editingSeller && editingSellerData) {
                      setEditingSellerData({ ...editingSellerData, email: e.target.value });
                    } else {
                      setNewSellerData({ ...newSellerData, email: e.target.value });
                    }
                  }}
                  placeholder="Email address"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingSeller ? editingSellerData?.is_active : newSellerData.is_active}
                  onChange={(e) => {
                    if (editingSeller && editingSellerData) {
                      setEditingSellerData({ ...editingSellerData, is_active: e.target.checked });
                    } else {
                      setNewSellerData({ ...newSellerData, is_active: e.target.checked });
                    }
                  }}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium">Active</label>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Address</label>
              <Textarea
                value={editingSeller ? editingSellerData?.address || '' : newSellerData.address || ''}
                onChange={(e) => {
                  if (editingSeller && editingSellerData) {
                    setEditingSellerData({ ...editingSellerData, address: e.target.value });
                  } else {
                    setNewSellerData({ ...newSellerData, address: e.target.value });
                  }
                }}
                placeholder="Business address"
                rows={2}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Delivery Information</label>
              <Textarea
                value={editingSeller ? editingSellerData?.delivery_info || '' : newSellerData.delivery_info || ''}
                onChange={(e) => {
                  if (editingSeller && editingSellerData) {
                    setEditingSellerData({ ...editingSellerData, delivery_info: e.target.value });
                  } else {
                    setNewSellerData({ ...newSellerData, delivery_info: e.target.value });
                  }
                }}
                placeholder="Delivery terms, areas covered, charges, etc."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button onClick={saveSeller} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingSeller ? 'Update' : 'Create'} Seller
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Count and Active Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {filteredSellers.length} seller{filteredSellers.length !== 1 ? 's' : ''}
          </span>
          
          {/* Active Location Filters (Superadmin only) */}
          {currentUser?.role === 'superadmin' && (
            selectedStateName !== 'All' || selectedDistrictName !== 'All'
          ) && (
            <div className="flex items-center space-x-1">
              {selectedStateName !== 'All' && (
                <Badge variant="secondary" className="text-xs">
                  State: {selectedStateName}
                </Badge>
              )}
              {selectedDistrictName !== 'All' && (
                <Badge variant="secondary" className="text-xs">
                  District: {selectedDistrictName}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sellers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSellers.map((seller) => (
          <Card key={seller.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{seller.name}</CardTitle>
                  {seller.business_name && (
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Store className="h-3 w-3 mr-1" />
                      {seller.business_name}
                    </p>
                  )}
                </div>
                <Badge variant={seller.is_active ? "default" : "secondary"}>
                  {seller.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{seller.contact_phone}</span>
                </div>
                
                {seller.whatsapp_number && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MessageCircle className="h-3 w-3 text-muted-foreground" />
                    <span>{seller.whatsapp_number}</span>
                  </div>
                )}
                
                {seller.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{seller.email}</span>
                  </div>
                )}
                
                {seller.address && (
                  <div className="flex items-start space-x-2 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                    <span className="text-xs">{seller.address}</span>
                  </div>
                )}
              </div>
              
              {seller.delivery_info && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <strong>Delivery:</strong> {seller.delivery_info}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {seller.products_count || 0} products
                </span>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(seller)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSeller(seller.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredSellers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sellers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No sellers match your search criteria.' : 'Get started by adding your first seller.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setAddingSeller(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Seller
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
