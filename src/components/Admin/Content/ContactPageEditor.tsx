"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Save,
  Edit,
  Plus,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Building2,
  AlertTriangle,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Grid3X3,
  List,
} from 'lucide-react';

interface ContactInfo {
  id: string;
  contactType: 'phone' | 'email' | 'address' | 'social' | 'emergency' | 'office';
  title: string;
  value: string;
  description?: string | null;
  district?: string | null;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  ownerAdminId?: number | null;
}

interface ContactOffice {
  id: string;
  name: string;
  nameHindi: string | null;
  address: string;
  city: string;
  state: string;
  district?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  officeType: 'head' | 'regional' | 'branch';
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  ownerAdminId?: number | null;
}

export function ContactPageEditor() {
  const { currentUser } = useAdmin();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'contact-info' | 'offices'>('contact-info');
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [offices, setOffices] = useState<ContactOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<ContactInfo | null>(null);
  const [editingOffice, setEditingOffice] = useState<ContactOffice | null>(null);
  const [isCreatingContact, setIsCreatingContact] = useState(false);
  const [isCreatingOffice, setIsCreatingOffice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // State and district filters (superadmin only)
  const isSuperAdmin = currentUser?.type === 'superadmin' || currentUser?.role === 'superadmin';
  const [states, setStates] = useState<Array<{ id: string; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedStateName, setSelectedStateName] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('');

  // List management state (pagination, sorting, compact mode)
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [itemsSortBy, setItemsSortBy] = useState<'date' | 'title' | 'type' | 'order'>('order');
  const [itemsSortOrder, setItemsSortOrder] = useState<'asc' | 'desc'>('asc');
  const [compactMode, setCompactMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Contact form state
  const [contactForm, setContactForm] = useState({
    contactType: 'phone' as ContactInfo['contactType'],
    title: '',
    value: '',
    description: '',
    order: 0,
    isVisible: true,
  });

  // Office form state
  const [officeForm, setOfficeForm] = useState({
    name: '',
    nameHindi: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    officeType: 'branch' as ContactOffice['officeType'],
    order: 0,
    isVisible: true,
  });

  // Fetch states (superadmin only)
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchStates = async () => {
        try {
          const response = await fetch('/api/states', { cache: 'no-store' });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setStates(data.data.map((s: { id: string | number; name: string }) => ({
                id: String(s.id),
                name: s.name
              })));
            }
          }
        } catch (error) {
          console.error('Error fetching states:', error);
        }
      };
      fetchStates();
    }
  }, [isSuperAdmin]);

  // Fetch districts when state changes (superadmin only)
  useEffect(() => {
    if (isSuperAdmin && selectedStateId) {
      const fetchDistricts = async () => {
        try {
          const response = await fetch(`/api/districts?stateId=${selectedStateId}`, { cache: 'no-store' });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setDistricts(data.data.map((d: { id: string | number; name: string }) => ({
                id: String(d.id),
                name: d.name
              })));
            }
          }
        } catch (error) {
          console.error('Error fetching districts:', error);
        }
      };
      fetchDistricts();
    } else {
      setDistricts([]);
      setSelectedDistrictId('');
      setSelectedDistrictName('');
    }
  }, [isSuperAdmin, selectedStateId]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams();
      if (isSuperAdmin && selectedStateName) params.append('state', selectedStateName);
      if (isSuperAdmin && selectedDistrictName) params.append('district', selectedDistrictName);
      params.append('_t', Date.now().toString());

      const response = await fetch(`/api/content/contact?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        const data = await response.json();
        setContactInfo(data.data.contactInfo || []);
        setOffices(data.data.offices || []);
      }
    } catch (error) {
      console.error('Error fetching contact data:', error);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, selectedStateName, selectedDistrictName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveContact = async () => {
    if (!currentUser) return;

    try {
      const isSuperAdmin = currentUser.type === 'superadmin' || currentUser.role === 'superadmin';
      const district = isSuperAdmin ? null : (currentUser.district || null);
      const adminId = isSuperAdmin ? null : (currentUser.id ? parseInt(currentUser.id) : null);

      const data = {
        contactInfo: editingContact 
          ? contactInfo.map(c => c.id === editingContact.id ? { 
              ...contactForm, 
              id: editingContact.id, 
              createdAt: editingContact.createdAt,
              district: editingContact.district || district,
              ownerAdminId: editingContact.ownerAdminId || adminId
            } : c)
          : [...contactInfo, { 
              ...contactForm, 
              id: `contact_${Date.now()}`, 
              createdAt: new Date(),
              district: district,
              ownerAdminId: adminId
            }],
        offices,
        updatedBy: currentUser.name
      };

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/content/contact?_t=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchData();
        resetContactForm();
      }
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleSaveOffice = async () => {
    if (!currentUser) return;

    try {
      const isSuperAdmin = currentUser.type === 'superadmin' || currentUser.role === 'superadmin';
      const district = isSuperAdmin ? null : (currentUser.district || null);
      const adminState = isSuperAdmin ? null : (currentUser.state || null);
      const adminId = isSuperAdmin ? null : (currentUser.id ? parseInt(currentUser.id) : null);

      // For district admins, ensure state matches their assigned state
      const officeState = isSuperAdmin ? officeForm.state : (adminState || officeForm.state);

      const data = {
        contactInfo,
        offices: editingOffice 
          ? offices.map(o => o.id === editingOffice.id ? { 
              ...officeForm, 
              state: officeState,
              id: editingOffice.id, 
              createdAt: editingOffice.createdAt,
              district: editingOffice.district || district,
              ownerAdminId: editingOffice.ownerAdminId || adminId
            } : o)
          : [...offices, { 
              ...officeForm, 
              state: officeState,
              id: `office_${Date.now()}`, 
              createdAt: new Date(),
              district: district,
              ownerAdminId: adminId
            }],
        updatedBy: currentUser.name
      };

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/content/contact?_t=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchData();
        resetOfficeForm();
      }
    } catch (error) {
      console.error('Error saving office:', error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm(t('admin.contact.deleteContactConfirm'))) return;

    try {
      const data = {
        contactInfo: contactInfo.filter(c => c.id !== id),
        offices,
        updatedBy: currentUser?.name || 'admin'
      };

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/content/contact?_t=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleDeleteOffice = async (id: string) => {
    if (!confirm(t('admin.contact.deleteOfficeConfirm'))) return;

    try {
      const data = {
        contactInfo,
        offices: offices.filter(o => o.id !== id),
        updatedBy: currentUser?.name || 'admin'
      };

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/content/contact?_t=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting office:', error);
    }
  };

  const resetContactForm = () => {
    setEditingContact(null);
    setIsCreatingContact(false);
    setContactForm({
      contactType: 'phone',
      title: '',
      value: '',
      description: '',
      order: 0,
      isVisible: true,
    });
  };

  const resetOfficeForm = () => {
    setEditingOffice(null);
    setIsCreatingOffice(false);
    setOfficeForm({
      name: '',
      nameHindi: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      officeType: 'branch',
      order: 0,
      isVisible: true,
    });
  };

  const startEditContact = (contact: ContactInfo) => {
    setEditingContact(contact);
    setIsCreatingContact(false);
    setContactForm({
      contactType: contact.contactType,
      title: contact.title,
      value: contact.value,
      description: contact.description || '',
      order: contact.order,
      isVisible: contact.isVisible,
    });
    // Preserve district and ownerAdminId when editing
  };

  const startEditOffice = (office: ContactOffice) => {
    setEditingOffice(office);
    setIsCreatingOffice(false);
    setOfficeForm({
      name: office.name,
      nameHindi: office.nameHindi || '',
      address: office.address,
      city: office.city,
      state: office.state,
      pincode: office.pincode || '',
      phone: office.phone || '',
      email: office.email || '',
      officeType: office.officeType,
      order: office.order,
      isVisible: office.isVisible,
    });
  };

  const getContactIcon = (type: ContactInfo['contactType']) => {
    switch (type) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'address': return <MapPin className="h-4 w-4" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      case 'office': return <Clock className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const getContactTypeColor = (type: ContactInfo['contactType']) => {
    switch (type) {
      case 'phone': return 'bg-blue-100 text-blue-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'address': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'office': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort contacts
  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contactInfo.filter(item => {
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !item.value.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType !== 'all' && item.contactType !== filterType) return false;
      // Filter by district if selected (superadmin only)
      if (isSuperAdmin && selectedDistrictName && item.district !== selectedDistrictName) {
        return false;
      }
      return true;
    });

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (itemsSortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (itemsSortBy === 'date') {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        comparison = aTime - bTime;
      } else if (itemsSortBy === 'type') {
        comparison = a.contactType.localeCompare(b.contactType);
      } else if (itemsSortBy === 'order') {
        comparison = a.order - b.order;
      }
      return itemsSortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [contactInfo, searchQuery, filterType, itemsSortBy, itemsSortOrder, isSuperAdmin, selectedDistrictName]);

  // Filter and sort offices
  const filteredAndSortedOffices = useMemo(() => {
    let filtered = offices.filter(office => {
      if (searchQuery && !office.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !office.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType !== 'all' && office.officeType !== filterType) return false;
      // Filter by district/state if selected (superadmin only)
      if (isSuperAdmin && selectedDistrictName && office.district !== selectedDistrictName) {
        return false;
      }
      if (isSuperAdmin && selectedStateName && !selectedDistrictName && office.state !== selectedStateName) {
        return false;
      }
      return true;
    });

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (itemsSortBy === 'title') {
        comparison = a.name.localeCompare(b.name);
      } else if (itemsSortBy === 'date') {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        comparison = aTime - bTime;
      } else if (itemsSortBy === 'type') {
        comparison = a.officeType.localeCompare(b.officeType);
      } else if (itemsSortBy === 'order') {
        comparison = a.order - b.order;
      }
      return itemsSortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [offices, searchQuery, filterType, itemsSortBy, itemsSortOrder, isSuperAdmin, selectedStateName, selectedDistrictName]);

  // Get current filtered items based on active tab
  const filteredAndSortedItems = activeTab === 'contact-info' 
    ? filteredAndSortedContacts 
    : filteredAndSortedOffices;

  const totalItemsPages = Math.ceil(
    filteredAndSortedItems.length === 0 ? 1 : filteredAndSortedItems.length / itemsPerPage
  );

  const paginatedItems = useMemo(() => {
    const startIndex = (itemsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedItems.slice(startIndex, endIndex);
  }, [filteredAndSortedItems, itemsPage, itemsPerPage]);

  // Reset to page 1 when filters/sort/search/tab changes
  useEffect(() => {
    setItemsPage(1);
  }, [searchQuery, filterType, itemsSortBy, itemsSortOrder, activeTab, selectedStateName, selectedDistrictName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">{t('admin.newsEvents.loading')}</p>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.contact.title')}</h1>
          <p className="text-gray-600">{t('admin.contact.description')}</p>
        </div>
        <Button 
          onClick={() => activeTab === 'contact-info' ? setIsCreatingContact(true) : setIsCreatingOffice(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {activeTab === 'contact-info' ? t('admin.contact.addContactInfo') : t('admin.contact.addOffice')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('contact-info')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'contact-info'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Phone className="h-4 w-4 inline mr-2" />
          {t('admin.contact.contactInfo')}
        </button>
        <button
          onClick={() => setActiveTab('offices')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'offices'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building2 className="h-4 w-4 inline mr-2" />
          {t('admin.contact.offices')}
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={activeTab === 'contact-info' ? t('admin.contact.searchContactInfo') : t('admin.contact.searchOffices')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* State filter (superadmin only) */}
            {isSuperAdmin && (
              <Select
                value={selectedStateId || 'all'}
                onValueChange={async (id) => {
                  const actualId = id === 'all' ? '' : id;
                  setSelectedStateId(actualId);
                  const state = states.find(s => s.id === actualId);
                  setSelectedStateName(state?.name || '');
                  setSelectedDistrictId('');
                  setSelectedDistrictName('');
                }}
              >
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* District filter (superadmin only) */}
            {isSuperAdmin && (
              <Select
                value={selectedDistrictId || 'all'}
                onValueChange={(id) => {
                  const actualId = id === 'all' ? '' : id;
                  setSelectedDistrictId(actualId);
                  const district = districts.find(d => d.id === actualId);
                  setSelectedDistrictName(district?.name || '');
                }}
                disabled={!selectedStateId || districts.length === 0}
              >
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder={
                    !selectedStateId
                      ? "Select state first"
                      : districts.length === 0
                        ? "Loading districts..."
                        : "All Districts"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Clear filters button (superadmin only, when filters are active) */}
            {isSuperAdmin && (selectedStateName || selectedDistrictName) && (
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setSelectedStateId('');
                  setSelectedStateName('');
                  setSelectedDistrictId('');
                  setSelectedDistrictName('');
                  setDistricts([]);
                }}
              >
                Clear Location
              </Button>
            )}

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder={t('admin.newsEvents.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.newsEvents.allTypes')}</SelectItem>
                {activeTab === 'contact-info' ? (
                  <>
                    <SelectItem value="phone">{t('admin.contact.phone')}</SelectItem>
                    <SelectItem value="email">{t('admin.contact.email')}</SelectItem>
                    <SelectItem value="address">{t('admin.contact.address')}</SelectItem>
                    <SelectItem value="emergency">{t('admin.contact.emergency')}</SelectItem>
                    <SelectItem value="office">{t('admin.contact.officeHours')}</SelectItem>
                    <SelectItem value="social">{t('admin.contact.social')}</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="head">{t('admin.contact.headOffice')}</SelectItem>
                    <SelectItem value="regional">{t('admin.contact.regional')}</SelectItem>
                    <SelectItem value="branch">{t('admin.contact.branch')}</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            <Select
              value={itemsSortBy}
              onValueChange={(value) => setItemsSortBy(value as typeof itemsSortBy)}
            >
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order">Sort by Order</SelectItem>
                <SelectItem value="title">Sort by Title</SelectItem>
                <SelectItem value="type">Sort by Type</SelectItem>
                <SelectItem value="date">Sort by Date</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2"
              onClick={() => setItemsSortOrder(itemsSortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${itemsSortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              {itemsSortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>

            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setItemsPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12/page</SelectItem>
                <SelectItem value="24">24/page</SelectItem>
                <SelectItem value="48">48/page</SelectItem>
                <SelectItem value="96">96/page</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-9 px-2"
              title="List view"
            >
              <List className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2"
              onClick={() => setCompactMode(!compactMode)}
              title={compactMode ? 'Normal view' : 'Compact view'}
            >
              {compactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 pt-2 border-t">
          Showing {paginatedItems.length} of {filteredAndSortedItems.length} {activeTab === 'contact-info' ? 'contact info' : 'offices'} ({activeTab === 'contact-info' ? contactInfo.length : offices.length} total)
        </div>
      </div>

      {/* Contact Info Form */}
      {(isCreatingContact || editingContact) && (
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-orange-800">
                {isCreatingContact ? t('admin.contact.addNewContact') : t('admin.contact.editContact')} {t('admin.contact.contactInformation')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetContactForm}>
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactType">{t('admin.contact.type')}</Label>
                  <Select value={contactForm.contactType} onValueChange={(value) => setContactForm({ ...contactForm, contactType: value as ContactInfo['contactType'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">{t('admin.contact.phone')}</SelectItem>
                      <SelectItem value="email">{t('admin.contact.email')}</SelectItem>
                      <SelectItem value="address">{t('admin.contact.address')}</SelectItem>
                      <SelectItem value="emergency">{t('admin.contact.emergency')}</SelectItem>
                      <SelectItem value="office">{t('admin.contact.officeHours')}</SelectItem>
                      <SelectItem value="social">{t('admin.contact.social')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="order">{t('admin.contact.order')}</Label>
                  <Input
                    id="order"
                    type="number"
                    value={contactForm.order}
                    onChange={(e) => setContactForm({ ...contactForm, order: parseInt(e.target.value) || 0 })}
                    placeholder={t('admin.contact.displayOrder')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">{t('admin.contact.titleLabel')}</Label>
                <Input
                  id="title"
                  value={contactForm.title}
                  onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                  placeholder={t('admin.contact.titlePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="value">{t('admin.contact.value')}</Label>
                <Input
                  id="value"
                  value={contactForm.value}
                  onChange={(e) => setContactForm({ ...contactForm, value: e.target.value })}
                  placeholder={t('admin.contact.valuePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="description">{t('admin.contact.description')}</Label>
                <Textarea
                  id="description"
                  value={contactForm.description}
                  onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })}
                  placeholder={t('admin.contact.descriptionPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isVisible"
                  checked={contactForm.isVisible}
                  onCheckedChange={(checked) => setContactForm({ ...contactForm, isVisible: checked })}
                />
                <Label htmlFor="isVisible">{t('admin.contact.visibleOnWebsite')}</Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={resetContactForm}>
                  {t('admin.newsEvents.cancel')}
                </Button>
                <Button onClick={handleSaveContact} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isCreatingContact ? t('admin.contact.create') : t('admin.contact.update')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Office Form */}
      {(isCreatingOffice || editingOffice) && (
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-orange-800">
                {isCreatingOffice ? t('admin.contact.addNewContact') : t('admin.contact.editContact')} {t('admin.contact.offices').slice(0, -1)}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetOfficeForm}>
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('admin.contact.officeName')}</Label>
                  <Input
                    id="name"
                    value={officeForm.name}
                    onChange={(e) => setOfficeForm({ ...officeForm, name: e.target.value })}
                    placeholder={t('admin.contact.officeNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="nameHindi">{t('admin.contact.officeNameHindi')}</Label>
                  <Input
                    id="nameHindi"
                    value={officeForm.nameHindi}
                    onChange={(e) => setOfficeForm({ ...officeForm, nameHindi: e.target.value })}
                    placeholder={t('admin.contact.officeNameHindiPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">{t('admin.contact.address')} *</Label>
                <Textarea
                  id="address"
                  value={officeForm.address}
                  onChange={(e) => setOfficeForm({ ...officeForm, address: e.target.value })}
                  placeholder={t('admin.contact.addressPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">{t('admin.contact.city')}</Label>
                  <Input
                    id="city"
                    value={officeForm.city}
                    onChange={(e) => setOfficeForm({ ...officeForm, city: e.target.value })}
                    placeholder={t('admin.contact.cityPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="state">{t('admin.store.sellers.state')} *</Label>
                  <Input
                    id="state"
                    value={officeForm.state}
                    onChange={(e) => setOfficeForm({ ...officeForm, state: e.target.value })}
                    placeholder={t('admin.contact.statePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">{t('admin.contact.pincode')}</Label>
                  <Input
                    id="pincode"
                    value={officeForm.pincode}
                    onChange={(e) => setOfficeForm({ ...officeForm, pincode: e.target.value })}
                    placeholder={t('admin.contact.pincodePlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">{t('admin.contact.phone')}</Label>
                  <Input
                    id="phone"
                    value={officeForm.phone}
                    onChange={(e) => setOfficeForm({ ...officeForm, phone: e.target.value })}
                    placeholder={t('admin.contact.phoneNumber')}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('admin.contact.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={officeForm.email}
                    onChange={(e) => setOfficeForm({ ...officeForm, email: e.target.value })}
                    placeholder={t('admin.contact.emailAddress')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="officeType">{t('admin.contact.officeType')}</Label>
                  <Select value={officeForm.officeType} onValueChange={(value) => setOfficeForm({ ...officeForm, officeType: value as ContactOffice['officeType'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="head">{t('admin.contact.headOffice')}</SelectItem>
                      <SelectItem value="regional">{t('admin.contact.regional')} {t('admin.contact.offices').slice(0, -1)}</SelectItem>
                      <SelectItem value="branch">{t('admin.contact.branch')} {t('admin.contact.offices').slice(0, -1)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="order">{t('admin.contact.order')}</Label>
                  <Input
                    id="order"
                    type="number"
                    value={officeForm.order}
                    onChange={(e) => setOfficeForm({ ...officeForm, order: parseInt(e.target.value) || 0 })}
                    placeholder={t('admin.contact.displayOrder')}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isVisible"
                  checked={officeForm.isVisible}
                  onCheckedChange={(checked) => setOfficeForm({ ...officeForm, isVisible: checked })}
                />
                <Label htmlFor="isVisible">{t('admin.contact.visibleOnWebsite')}</Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={resetOfficeForm}>
                  {t('admin.newsEvents.cancel')}
                </Button>
                <Button onClick={handleSaveOffice} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isCreatingOffice ? t('admin.contact.create') : t('admin.contact.update')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Info List */}
      {activeTab === 'contact-info' && (
        <div className={compactMode ? 'space-y-2' : 'space-y-4'}>
          {paginatedItems.map((contact) => {
            const contactItem = contact as ContactInfo;
            return (
              <Card key={contactItem.id} className={`hover:shadow-lg transition-shadow ${compactMode ? 'border border-gray-200' : ''}`}>
                <CardContent className={compactMode ? 'p-3' : 'p-4'}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`${compactMode ? 'p-1.5' : 'p-2'} bg-gray-100 rounded-lg`}>
                        {getContactIcon(contactItem.contactType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`${compactMode ? 'text-sm' : ''} font-semibold text-gray-900`}>{contactItem.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContactTypeColor(contactItem.contactType)}`}>
                            {contactItem.contactType}
                          </span>
                          {contactItem.isVisible ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <p className={`${compactMode ? 'text-sm' : ''} text-gray-700 mb-1`}>{contactItem.value}</p>
                        {contactItem.description && (
                          <p className={`${compactMode ? 'text-xs' : 'text-sm'} text-gray-600`}>{contactItem.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>Order: {contactItem.order}</span>
                          <span>{new Date(contactItem.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditContact(contactItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contactItem.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Offices List */}
      {activeTab === 'offices' && (
        <div className={compactMode ? 'space-y-2' : 'space-y-4'}>
          {paginatedItems.map((office) => {
            const officeItem = office as ContactOffice;
            return (
              <Card key={officeItem.id} className={`hover:shadow-lg transition-shadow ${compactMode ? 'border border-gray-200' : ''}`}>
                <CardContent className={compactMode ? 'p-3' : 'p-4'}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`${compactMode ? 'p-1.5' : 'p-2'} bg-gray-100 rounded-lg`}>
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`${compactMode ? 'text-sm' : ''} font-semibold text-gray-900`}>{officeItem.name}</h3>
                          {officeItem.nameHindi && (
                            <span className={`${compactMode ? 'text-xs' : 'text-sm'} text-gray-600`}>({officeItem.nameHindi})</span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            officeItem.officeType === 'head' ? 'bg-red-100 text-red-800' :
                            officeItem.officeType === 'regional' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {officeItem.officeType}
                          </span>
                          {officeItem.isVisible ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <p className={`${compactMode ? 'text-sm' : ''} text-gray-700 mb-1`}>{officeItem.address}</p>
                        <p className={`${compactMode ? 'text-xs' : 'text-sm'} text-gray-600 mb-1`}>
                          {officeItem.city}, {officeItem.state} {officeItem.pincode}
                        </p>
                        {(officeItem.phone || officeItem.email) && (
                          <div className={`flex items-center space-x-4 ${compactMode ? 'text-xs' : 'text-sm'} text-gray-600`}>
                            {officeItem.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{officeItem.phone}</span>
                              </div>
                            )}
                            {officeItem.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{officeItem.email}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>Order: {officeItem.order}</span>
                          <span>{new Date(officeItem.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditOffice(officeItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOffice(officeItem.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalItemsPages > 1 && filteredAndSortedItems.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">
            Page {itemsPage} of {totalItemsPages}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setItemsPage(1)}
              disabled={itemsPage === 1}
              className="h-8 w-8 p-0"
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setItemsPage(Math.max(1, itemsPage - 1))}
              disabled={itemsPage === 1}
              className="h-8 w-8 p-0"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setItemsPage(Math.min(totalItemsPages, itemsPage + 1))}
              disabled={itemsPage === totalItemsPages}
              className="h-8 w-8 p-0"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setItemsPage(totalItemsPages)}
              disabled={itemsPage === totalItemsPages}
              className="h-8 w-8 p-0"
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {activeTab === 'contact-info' ? <Phone className="h-12 w-12 mx-auto" /> : <Building2 className="h-12 w-12 mx-auto" />}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'contact-info' ? t('admin.contact.noContactInfo') : t('admin.contact.noOffices')}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : activeTab === 'contact-info' ? t('admin.contact.addFirstContact') : t('admin.contact.addFirstOffice')
            }
          </p>
          {(!searchQuery && filterType === 'all') && (
            <Button 
              onClick={() => activeTab === 'contact-info' ? setIsCreatingContact(true) : setIsCreatingOffice(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {activeTab === 'contact-info' ? t('admin.contact.addContactInfo') : t('admin.contact.addOffice')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
