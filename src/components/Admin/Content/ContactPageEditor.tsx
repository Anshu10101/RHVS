"use client";

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface ContactInfo {
  id: string;
  contactType: 'phone' | 'email' | 'address' | 'social' | 'emergency' | 'office';
  title: string;
  value: string;
  description?: string | null;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface ContactOffice {
  id: string;
  name: string;
  nameHindi: string | null;
  address: string;
  city: string;
  state: string;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  officeType: 'head' | 'regional' | 'branch';
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
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

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/content/contact?_t=${Date.now()}`, {
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
  };

  const handleSaveContact = async () => {
    if (!currentUser) return;

    try {
      const data = {
        contactInfo: editingContact 
          ? contactInfo.map(c => c.id === editingContact.id ? { ...contactForm, id: editingContact.id, createdAt: editingContact.createdAt } : c)
          : [...contactInfo, { ...contactForm, id: `contact_${Date.now()}`, createdAt: new Date() }],
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
      const data = {
        contactInfo,
        offices: editingOffice 
          ? offices.map(o => o.id === editingOffice.id ? { ...officeForm, id: editingOffice.id, createdAt: editingOffice.createdAt } : o)
          : [...offices, { ...officeForm, id: `office_${Date.now()}`, createdAt: new Date() }],
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

  const filteredContacts = contactInfo.filter(item => {
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.value.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && item.contactType !== filterType) return false;
    return true;
  });

  const filteredOffices = offices.filter(office => {
    if (searchQuery && !office.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !office.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && office.officeType !== filterType) return false;
    return true;
  });

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

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={activeTab === 'contact-info' ? t('admin.contact.searchContactInfo') : t('admin.contact.searchOffices')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
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
        <div className="space-y-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getContactIcon(contact.contactType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{contact.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContactTypeColor(contact.contactType)}`}>
                          {contact.contactType}
                        </span>
                        {contact.isVisible ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-700 mb-1">{contact.value}</p>
                      {contact.description && (
                        <p className="text-sm text-gray-600">{contact.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Order: {contact.order}</span>
                        <span>{new Date(contact.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditContact(contact)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Offices List */}
      {activeTab === 'offices' && (
        <div className="space-y-4">
          {filteredOffices.map((office) => (
            <Card key={office.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{office.name}</h3>
                        {office.nameHindi && (
                          <span className="text-sm text-gray-600">({office.nameHindi})</span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          office.officeType === 'head' ? 'bg-red-100 text-red-800' :
                          office.officeType === 'regional' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {office.officeType}
                        </span>
                        {office.isVisible ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-700 mb-1">{office.address}</p>
                      <p className="text-sm text-gray-600 mb-1">
                        {office.city}, {office.state} {office.pincode}
                      </p>
                      {(office.phone || office.email) && (
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {office.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{office.phone}</span>
                            </div>
                          )}
                          {office.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{office.email}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Order: {office.order}</span>
                        <span>{new Date(office.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditOffice(office)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOffice(office.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {((activeTab === 'contact-info' && filteredContacts.length === 0) || 
        (activeTab === 'offices' && filteredOffices.length === 0)) && (
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
