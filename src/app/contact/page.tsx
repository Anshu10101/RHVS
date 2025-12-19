"use client";

import { useEffect, useState, useCallback } from 'react';
import { MapPin, Phone, Mail, Clock, Building2, Globe, AlertCircle } from 'lucide-react';
import { Noto_Serif_Devanagari } from 'next/font/google';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700'],
});

interface ContactInfo {
  id: string;
  contactType: 'phone' | 'email' | 'address' | 'social' | 'emergency' | 'office';
  title: string;
  value: string;
  description?: string;
  district?: string | null;
  order: number;
  isVisible: boolean;
}

interface ContactOffice {
  id: string;
  name: string;
  nameHindi?: string;
  address: string;
  city?: string;
  state?: string;
  district?: string | null;
  pincode?: string;
  phone?: string;
  email?: string;
  officeType: 'head' | 'regional' | 'branch';
  order: number;
  isVisible: boolean;
}

interface State {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
}

export default function ContactPage() {
  const { t } = useLanguage();
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [offices, setOffices] = useState<ContactOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [officePage, setOfficePage] = useState(1);
  const [officeTypeFilter, setOfficeTypeFilter] = useState<
    "all" | ContactOffice["officeType"]
  >("all");
  const [contactPage, setContactPage] = useState(1);
  const [contactTypeFilter, setContactTypeFilter] = useState<
    "all" | ContactInfo["contactType"]
  >("all");
  
  // Filter states
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedStateName, setSelectedStateName] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('');

  // Fetch states
  useEffect(() => {
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
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    if (selectedStateId) {
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
  }, [selectedStateId]);

  const loadContactData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStateName) params.append('state', selectedStateName);
      if (selectedDistrictName) params.append('district', selectedDistrictName);
      params.append('_t', Date.now().toString());

      const response = await fetch(`/api/content/contact?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setContactInfo(data.data.contactInfo || []);
        setOffices(data.data.offices || []);
      }
    } catch (error) {
      console.error('Error fetching contact data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStateName, selectedDistrictName]);

  useEffect(() => {
    loadContactData();

    // Reload when page becomes visible (user returns from admin panel or switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadContactData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadContactData]);

  // Group contact info by type and sort by order (for fallback display)
  const phoneNumbers = contactInfo
    .filter(item => item.contactType === 'phone' && item.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const emails = contactInfo
    .filter(item => item.contactType === 'email' && item.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const addresses = contactInfo
    .filter(item => item.contactType === 'address' && item.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const socialContacts = contactInfo
    .filter(item => item.contactType === 'social' && item.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const emergencyContacts = contactInfo
    .filter(item => item.contactType === 'emergency' && item.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const officeHours = contactInfo
    .filter(item => item.contactType === 'office' && item.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Filter contacts by type and district (show only superadmin items by default)
  const filteredContacts = contactInfo
    .filter(item => {
      if (!item.isVisible) return false;
      
      // By default, show only superadmin items (district is null)
      // When filters are applied, show matching district items
      const hasFilters = selectedStateName || selectedDistrictName;
      if (!hasFilters && item.district !== null && item.district !== undefined && item.district !== '') {
        return false;
      }
      
      // Apply contact type filter
      if (contactTypeFilter === "all") return true;
      return item.contactType === contactTypeFilter;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Group filtered contacts by type for display
  const groupedFilteredContacts: Record<string, ContactInfo[]> = {};
  filteredContacts.forEach(contact => {
    if (!groupedFilteredContacts[contact.contactType]) {
      groupedFilteredContacts[contact.contactType] = [];
    }
    groupedFilteredContacts[contact.contactType].push(contact);
  });

  // Pagination for contacts (group contacts by type, then paginate the groups)
  const CONTACTS_PER_PAGE = 2; // Show 2 contact type groups per page
  const contactTypeGroups = Object.keys(groupedFilteredContacts);
  const totalContactPages = Math.max(1, Math.ceil(contactTypeGroups.length / CONTACTS_PER_PAGE));
  const currentContactPage = Math.min(contactPage, totalContactPages);
  const paginatedContactTypes = contactTypeGroups.slice(
    (currentContactPage - 1) * CONTACTS_PER_PAGE,
    currentContactPage * CONTACTS_PER_PAGE
  );

  // Ensure current page stays in range when contact list changes
  useEffect(() => {
    if (contactPage > totalContactPages) {
      setContactPage(totalContactPages);
    }
  }, [contactPage, totalContactPages]);
  
  // Filter and sort visible offices by office type, district, and order
  // By default, show only superadmin items (district is null)
  // When filters are applied, show matching district items
  const hasOfficeFilters = selectedStateName || selectedDistrictName || officeTypeFilter !== "all";
  const visibleOffices = offices
    .filter((office) => {
      if (!office.isVisible) return false;
      
      // By default, show only superadmin items (district is null)
      // When filters are applied, show matching district items
      if (!hasOfficeFilters && office.district !== null && office.district !== undefined && office.district !== '') {
        return false;
      }
      
      // Apply office type filter
      if (officeTypeFilter === "all") return true;
      return office.officeType === officeTypeFilter;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Remove test/placeholder offices (e.g., "superadmin testing 3", "JHANSI OFFICE")
  const filteredOffices = visibleOffices.filter((office) => {
    const name = `${office.name || ''} ${office.nameHindi || ''}`.toLowerCase();
    if (!name) return false;
    if (name.includes('superadmin testing 3')) return false;
    if (name.includes('jhansi office')) return false;
    return true;
  });

  // Simple pagination for offices to keep UI clean when many offices exist
  const OFFICES_PER_PAGE = 4;
  const totalOfficePages = Math.max(1, Math.ceil(filteredOffices.length / OFFICES_PER_PAGE));
  const currentOfficePage = Math.min(officePage, totalOfficePages);
  const paginatedOffices = filteredOffices.slice(
    (currentOfficePage - 1) * OFFICES_PER_PAGE,
    currentOfficePage * OFFICES_PER_PAGE
  );

  // Ensure current page stays in range when office list changes
  useEffect(() => {
    if (officePage > totalOfficePages) {
      setOfficePage(totalOfficePages);
    }
  }, [officePage, totalOfficePages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className={`${devanagari.className} text-4xl md:text-6xl font-bold mb-4 text-orange-900`}>
              {t('contact.title')}
            </h1>
            <p className="text-orange-700">{t('contact.loading')}</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Hero Section */}
      <section className="pt-8 pb-6 sm:pt-10 sm:pb-8 md:pt-12 md:pb-10 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-orange-500 mb-2">
              {t('common.connectWithUs') || 'Reach Out • Support • Connect'}
            </p>
            <h1 className={`${devanagari.className} text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-bold tracking-tight text-orange-900`}>
              {t('contact.title')}
            </h1>
            <p className="mt-3 text-sm sm:text-base md:text-lg text-orange-700/80 max-w-xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="pb-10 sm:pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Contact Details / Offices */}
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-4">
                <div className="text-center lg:text-left">
                  <h2 className={`${devanagari.className} text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 text-orange-900`}>
                    {t('contact.ourOffices')}
                  </h2>
                  <p className="text-orange-700/80 text-xs sm:text-sm md:text-base">
                    {t('contact.officesDescription')}
                  </p>
                </div>

                {/* Location & type filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-orange-100 px-2.5 py-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    {/* State */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <Label htmlFor="filter-state" className="text-[10px] sm:text-[11px] md:text-xs font-medium text-orange-900">
                        State
                      </Label>
                      <Select
                        value={selectedStateId || 'all'}
                        onValueChange={async (id) => {
                          const actualId = id === 'all' ? '' : id;
                          setSelectedStateId(actualId);
                          const state = states.find(s => s.id === actualId);
                          setSelectedStateName(state?.name || '');
                          setSelectedDistrictId('');
                          setSelectedDistrictName('');
                          setOfficePage(1); // Reset to first page when filter changes
                          if (actualId) {
                            try {
                              const res = await fetch(`/api/districts?stateId=${encodeURIComponent(actualId)}&_t=${Date.now()}`, {
                                cache: 'no-store',
                                headers: {
                                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                                  'Pragma': 'no-cache',
                                }
                              });
                              const data = await res.json();
                              if (data?.success && Array.isArray(data.data)) {
                                setDistricts(data.data.map((d: { id: string | number; name: string }) => ({
                                  id: String(d.id),
                                  name: String(d.name)
                                })));
                              }
                            } catch (error) {
                              console.error('Failed to load districts:', error);
                            }
                          } else {
                            setDistricts([]);
                          }
                        }}
                      >
                        <SelectTrigger id="filter-state" className="h-8 sm:h-9 text-xs sm:text-sm border-orange-200 focus:border-orange-400 bg-white/90">
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
                    </div>

                    {/* District */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <Label htmlFor="filter-district" className="text-[10px] sm:text-[11px] md:text-xs font-medium text-orange-900">
                        District
                      </Label>
                      <Select
                        value={selectedDistrictId || 'all'}
                        onValueChange={(id) => {
                          const actualId = id === 'all' ? '' : id;
                          setSelectedDistrictId(actualId);
                          const district = districts.find(d => d.id === actualId);
                          setSelectedDistrictName(district?.name || '');
                          setOfficePage(1); // Reset to first page when filter changes
                        }}
                        disabled={!selectedStateId || districts.length === 0}
                      >
                        <SelectTrigger id="filter-district" className="h-8 sm:h-9 text-xs sm:text-sm border-orange-200 focus:border-orange-400 bg-white/90">
                          <SelectValue placeholder={
                            !selectedStateId
                              ? "Select state first"
                              : districts.length === 0
                                ? "Loading..."
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
                    </div>

                    {/* Office type */}
                    <div className="space-y-0.5 sm:space-y-1 col-span-2 md:col-span-1">
                      <Label
                        htmlFor="office-type-filter"
                        className="text-[10px] sm:text-[11px] md:text-xs font-medium text-orange-900"
                      >
                        Office Type
                      </Label>
                      <Select
                        value={officeTypeFilter}
                        onValueChange={(value) => {
                          setOfficeTypeFilter(
                            value as "all" | ContactOffice["officeType"]
                          );
                          setOfficePage(1); // Reset to first page when filter changes
                        }}
                      >
                        <SelectTrigger
                          id="office-type-filter"
                          className="h-8 sm:h-9 text-xs sm:text-sm border-orange-200 focus:border-orange-400 bg-white/90"
                        >
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="head">Head Office</SelectItem>
                          <SelectItem value="regional">Regional Office</SelectItem>
                          <SelectItem value="branch">Branch Office</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {hasOfficeFilters && (
                    <div className="mt-2 sm:mt-2.5 pt-2 border-t border-orange-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] sm:text-[11px] text-orange-700">
                      <span className="break-words">
                        Showing offices for{" "}
                        <span className="font-semibold">
                          {selectedDistrictName || selectedStateName || 'All locations'}
                        </span>
                        {officeTypeFilter !== 'all' && (
                          <> • <span className="capitalize">{officeTypeFilter}</span></>
                        )}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedStateId('');
                          setSelectedStateName('');
                          setSelectedDistrictId('');
                          setSelectedDistrictName('');
                          setDistricts([]);
                          setOfficeTypeFilter('all');
                          setOfficePage(1); // Reset to first page when filters cleared
                        }}
                        className="text-orange-600 hover:text-orange-800 underline whitespace-nowrap"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Office Cards */}
              <div className="space-y-3.5 sm:space-y-4">
                {paginatedOffices.length > 0 ? (
                  paginatedOffices.map((office) => (
                    <div key={office.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-3 sm:p-3.5 md:p-4 shadow border border-orange-100/80 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-2.5 sm:gap-3 md:gap-3.5">
                        <div className="bg-orange-50 p-1.5 sm:p-2 md:p-2.5 rounded-full flex-shrink-0 flex items-center justify-center">
                          {office.officeType === 'head' ? (
                            <Building2 className="text-orange-600 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                          ) : (
                            <MapPin className="text-orange-600 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`${devanagari.className} text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-1.5 text-orange-900 break-words`}>
                            {office.nameHindi || office.name}
                          </h3>
                          <p className="text-orange-700/80 text-[11px] sm:text-xs md:text-sm leading-relaxed break-words">
                            {office.address.split('\n').map((line, index) => (
                              <span key={index}>
                                {line}
                                {index < office.address.split('\n').length - 1 && <br/>}
                              </span>
                            ))}
                            {office.pincode && (
                              <>
                                <br />
                                {office.city}, {office.state} - {office.pincode}
                              </>
                            )}
                          </p>
                          {(office.phone || office.email) && (
                            <div className="mt-1.5 sm:mt-2 md:mt-2.5 space-y-0.5">
                              {office.phone && (
                                <p className="text-[10px] sm:text-[11px] md:text-xs text-orange-600 break-all">
                                  📞 {office.phone}
                                </p>
                              )}
                              {office.email && (
                                <p className="text-[10px] sm:text-[11px] md:text-xs text-orange-600 break-all">
                                  ✉️ {office.email}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredOffices.length === 0 ? (
                  // Fallback static content if no offices in database
                  <>
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow border border-orange-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="bg-orange-100 p-2.5 sm:p-3 rounded-full flex items-center justify-center">
                          <Building2 className="text-orange-600" size={22} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`${devanagari.className} text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2 text-orange-900`}>
                            {t('contact.centralOffice')}
                          </h3>
                          <p className="text-orange-700/80 text-sm sm:text-base leading-relaxed">
                            राष्ट्रीय हिन्दू वाहिनी संगठन &quot;उत्तरायण&quot;<br/>
                            गुरुकुल पब्लिक स्कूल के पास<br/>
                            दतिया (म. प्र.) 475661
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow border border-orange-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="bg-orange-100 p-2.5 sm:p-3 rounded-full flex items-center justify-center">
                          <MapPin className="text-orange-600" size={22} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`${devanagari.className} text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2 text-orange-900`}>
                            {t('contact.headOffice')}
                          </h3>
                          <p className="text-orange-700/80 text-sm sm:text-base leading-relaxed">
                            D–305, &quot;कान्हा कुंज&quot;<br/>
                            इंदिरा पार्क, नजफगढ़<br/>
                            नई दिल्ली – 110043
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                {/* Offices pagination */}
                {totalOfficePages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 pt-2 text-[11px] sm:text-xs md:text-sm text-orange-700/80">
                    <p className="text-center sm:text-left">
                      {t('contact.ourOffices')}: {filteredOffices.length} • Page {currentOfficePage}/{totalOfficePages}
                    </p>
                    <div className="inline-flex gap-1 sm:gap-1.5 flex-wrap justify-center">
                      <button
                        type="button"
                        onClick={() => setOfficePage((p) => Math.max(1, p - 1))}
                        disabled={currentOfficePage === 1}
                        className="px-2 sm:px-2.5 py-1 rounded-full border border-orange-200 bg-white text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm hover:bg-orange-50 transition min-w-[32px]"
                      >
                        ‹
                      </button>
                      {Array.from({ length: Math.min(totalOfficePages, 5) }).map((_, idx) => {
                        let page: number;
                        if (totalOfficePages <= 5) {
                          page = idx + 1;
                        } else {
                          const start = Math.max(1, currentOfficePage - 2);
                          const end = Math.min(totalOfficePages, start + 4);
                          page = start + idx;
                          if (page > end) return null;
                        }
                        const isActive = page === currentOfficePage;
                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setOfficePage(page)}
                            className={`px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm transition min-w-[32px] ${
                              isActive
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'border border-orange-200 bg-white text-orange-700 hover:bg-orange-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      {totalOfficePages > 5 && currentOfficePage < totalOfficePages - 2 && (
                        <span className="px-1 text-orange-700">...</span>
                      )}
                      {totalOfficePages > 5 && (
                        <button
                          type="button"
                          onClick={() => setOfficePage(totalOfficePages)}
                          className={`px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm transition min-w-[32px] border border-orange-200 bg-white text-orange-700 hover:bg-orange-50 ${
                            currentOfficePage === totalOfficePages ? 'bg-orange-600 text-white' : ''
                          }`}
                        >
                          {totalOfficePages}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setOfficePage((p) => Math.min(totalOfficePages, p + 1))}
                        disabled={currentOfficePage === totalOfficePages}
                        className="px-2 sm:px-2.5 py-1 rounded-full border border-orange-200 bg-white text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm hover:bg-orange-50 transition min-w-[32px]"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-5 sm:space-y-6">
              <div className="text-center lg:text-left">
                <h2 className={`${devanagari.className} text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 text-orange-900`}>
                  {t('contact.contactInfo')}
                </h2>
                <p className="text-orange-700/80 text-xs sm:text-sm md:text-base">
                  {t('contact.contactDescription')}
                </p>
              </div>

              {/* Contact type filter */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-orange-100 px-2.5 py-2.5 sm:px-3 sm:py-3 md:px-4 md:py-3.5">
                <div className="space-y-0.5 sm:space-y-1">
                  <Label
                    htmlFor="contact-type-filter"
                    className="text-[10px] sm:text-[11px] md:text-xs font-medium text-orange-900"
                  >
                    Contact Type
                  </Label>
                  <Select
                    value={contactTypeFilter}
                    onValueChange={(value) => {
                      setContactTypeFilter(
                        value as "all" | ContactInfo["contactType"]
                      );
                      setContactPage(1); // Reset to first page when filter changes
                    }}
                  >
                    <SelectTrigger
                      id="contact-type-filter"
                      className="h-8 sm:h-9 text-xs sm:text-sm border-orange-200 focus:border-orange-400 bg-white/90"
                    >
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="address">Address</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="office">Office Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {contactTypeFilter !== 'all' && (
                  <div className="mt-2 sm:mt-2.5 pt-2 border-t border-orange-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] sm:text-[11px] text-orange-700">
                    <span className="break-words">
                      Showing <span className="font-semibold capitalize">{contactTypeFilter}</span> contacts
                    </span>
                    <button
                      onClick={() => {
                        setContactTypeFilter("all");
                        setContactPage(1);
                      }}
                      className="text-orange-600 hover:text-orange-700 underline whitespace-nowrap"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Contact Cards */}
              <div className="space-y-3.5 sm:space-y-4">
                {paginatedContactTypes.length > 0 ? (
                  paginatedContactTypes.map((contactType) => {
                    const contacts = groupedFilteredContacts[contactType];
                    if (!contacts || contacts.length === 0) return null;

                    const firstContact = contacts[0];
                    let icon, title, bgColor, iconColor;

                    switch (contactType) {
                      case 'phone':
                        icon = <Phone className="text-orange-600" size={20} />;
                        title = t('contact.phoneNumbers');
                        bgColor = 'bg-orange-50';
                        iconColor = 'text-orange-600';
                        break;
                      case 'email':
                        icon = <Mail className="text-orange-600" size={20} />;
                        title = t('contact.email');
                        bgColor = 'bg-orange-50';
                        iconColor = 'text-orange-600';
                        break;
                      case 'emergency':
                        icon = <Phone className="text-red-600" size={20} />;
                        title = t('contact.emergencyContact');
                        bgColor = 'bg-red-50';
                        iconColor = 'text-red-600';
                        break;
                      case 'address':
                        icon = <MapPin className="text-orange-600" size={20} />;
                        title = firstContact.title || 'Address';
                        bgColor = 'bg-orange-50';
                        iconColor = 'text-orange-600';
                        break;
                      case 'social':
                        icon = <Globe className="text-orange-600" size={20} />;
                        title = firstContact.title || 'Social Media';
                        bgColor = 'bg-orange-50';
                        iconColor = 'text-orange-600';
                        break;
                      case 'office':
                        icon = <Clock className="text-orange-600" size={20} />;
                        title = t('contact.officeHours');
                        bgColor = 'bg-orange-50';
                        iconColor = 'text-orange-600';
                        break;
                      default:
                        return null;
                    }

                    return (
                      <div key={contactType} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 shadow border border-orange-100 hover:shadow-md transition-shadow text-center">
                        <div className={`${bgColor} p-2.5 sm:p-3 md:p-3.5 rounded-full w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto mb-2.5 sm:mb-3 md:mb-3.5 flex items-center justify-center`}>
                          {icon}
                        </div>
                        <h3 className={`${devanagari.className} text-lg sm:text-xl md:text-2xl font-semibold mb-2.5 sm:mb-3 md:mb-4 text-orange-900`}>
                          {title}
                        </h3>
                        <div className="space-y-1.5 sm:space-y-1.5">
                          {contacts.map((contact, index) => {
                            if (contactType === 'social') {
                              return (
                                <a
                                  key={index}
                                  href={contact.value.startsWith('http') ? contact.value : `https://${contact.value}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs sm:text-sm text-orange-600 hover:text-orange-800 hover:underline"
                                >
                                  {contact.description || contact.value}
                                </a>
                              );
                            } else if (contactType === 'address') {
                              return (
                                <div key={index} className="text-xs sm:text-sm text-orange-800">
                                  {contact.description && (
                                    <p className="font-medium mb-1">{contact.description}</p>
                                  )}
                                  <p className="whitespace-pre-line">{contact.value}</p>
                                </div>
                              );
                            } else if (contactType === 'office') {
                              return (
                                <div key={index}>
                                  {contact.description && (
                                    <p className="font-medium text-xs sm:text-sm mb-1 text-orange-700">{contact.description}</p>
                                  )}
                                  <p className="text-xs sm:text-sm text-orange-800 whitespace-pre-line">{contact.value}</p>
                                </div>
                              );
                            } else if (contactType === 'email') {
                              return (
                                <p key={index} className="text-xs sm:text-sm text-orange-800 break-all">
                                  {contact.value}
                                </p>
                              );
                            } else {
                              return (
                                <p key={index} className={contactType === 'phone' ? "text-base sm:text-lg font-medium text-orange-800" : "text-xs sm:text-sm text-orange-800"}>
                                  {contact.value}
                                </p>
                              );
                            }
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Fallback static content if no contact info in database */
                  filteredContacts.length === 0 && (
                  <>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-7 md:p-8 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow text-center">
                      <div className="bg-orange-100 p-3 sm:p-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <Phone className="text-orange-600" size={24} />
                      </div>
                      <h3 className={`${devanagari.className} text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-orange-900`}>
                        फोन नंबर
                      </h3>
                      <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-lg sm:text-xl font-medium text-orange-800">6290087054</p>
                        <p className="text-lg sm:text-xl font-medium text-orange-800">9425119209</p>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-7 md:p-8 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow text-center">
                      <div className="bg-orange-100 p-3 sm:p-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <Mail className="text-orange-600" size={24} />
                      </div>
                      <h3 className={`${devanagari.className} text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-orange-900`}>
                        ईमेल
                      </h3>
                      <p className="text-sm sm:text-lg text-orange-800 break-all">
                        help@rashtriyahinduvahinisangathan.org
                      </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-7 md:p-8 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow text-center">
                      <div className="bg-orange-100 p-3 sm:p-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <Clock className="text-orange-600" size={24} />
                      </div>
                      <h3 className={`${devanagari.className} text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-orange-900`}>
                        कार्यालय समय
                      </h3>
                      <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-sm sm:text-lg text-orange-800">सोमवार - शुक्रवार</p>
                        <p className="text-sm sm:text-lg text-orange-800">सुबह 9:00 - शाम 6:00</p>
                        <p className="text-sm sm:text-lg text-orange-800">शनिवार - रविवार</p>
                        <p className="text-sm sm:text-lg text-orange-800">सुबह 10:00 - शाम 4:00</p>
                      </div>
                    </div>
                  </>
                  )
                )}

                {/* Contacts pagination */}
                {totalContactPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 pt-2 text-[11px] sm:text-xs md:text-sm text-orange-700/80">
                    <p className="text-center sm:text-left">
                      {t('contact.contactInfo')}: {contactTypeGroups.length} • Page {currentContactPage}/{totalContactPages}
                    </p>
                    <div className="inline-flex gap-1 sm:gap-1.5 flex-wrap justify-center">
                      <button
                        type="button"
                        onClick={() => setContactPage((p) => Math.max(1, p - 1))}
                        disabled={currentContactPage === 1}
                        className="px-2 sm:px-2.5 py-1 rounded-full border border-orange-200 bg-white text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm hover:bg-orange-50 transition min-w-[32px]"
                      >
                        ‹
                      </button>
                      {Array.from({ length: Math.min(totalContactPages, 5) }).map((_, idx) => {
                        let page: number;
                        if (totalContactPages <= 5) {
                          page = idx + 1;
                        } else {
                          const start = Math.max(1, currentContactPage - 2);
                          const end = Math.min(totalContactPages, start + 4);
                          page = start + idx;
                          if (page > end) return null;
                        }
                        const isActive = page === currentContactPage;
                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setContactPage(page)}
                            className={`px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm transition min-w-[32px] ${
                              isActive
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'border border-orange-200 bg-white text-orange-700 hover:bg-orange-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      {totalContactPages > 5 && currentContactPage < totalContactPages - 2 && (
                        <span className="px-1 text-orange-700">...</span>
                      )}
                      {totalContactPages > 5 && (
                        <button
                          type="button"
                          onClick={() => setContactPage(totalContactPages)}
                          className={`px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm transition min-w-[32px] border border-orange-200 bg-white text-orange-700 hover:bg-orange-50 ${
                            currentContactPage === totalContactPages ? 'bg-orange-600 text-white' : ''
                          }`}
                        >
                          {totalContactPages}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setContactPage((p) => Math.min(totalContactPages, p + 1))}
                        disabled={currentContactPage === totalContactPages}
                        className="px-2 sm:px-2.5 py-1 rounded-full border border-orange-200 bg-white text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm hover:bg-orange-50 transition min-w-[32px]"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - removed as per request */}
    </div>
  );
}
