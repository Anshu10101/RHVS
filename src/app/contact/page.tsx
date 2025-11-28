"use client";

import { useEffect, useState, useCallback } from 'react';
import { MapPin, Phone, Mail, Clock, Building2 } from 'lucide-react';
import { Noto_Serif_Devanagari } from 'next/font/google';
import { useLanguage } from '@/contexts/LanguageContext';

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
  pincode?: string;
  phone?: string;
  email?: string;
  officeType: 'head' | 'regional' | 'branch';
  order: number;
  isVisible: boolean;
}

export default function ContactPage() {
  const { t } = useLanguage();
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [offices, setOffices] = useState<ContactOffice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContactData = useCallback(async () => {
    try {
      const response = await fetch(`/api/content/contact?_t=${Date.now()}`, {
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
  }, []);

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

  // Group contact info by type and sort by order
  const phoneNumbers = contactInfo
    .filter(item => item.contactType === 'phone' && item.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const emails = contactInfo
    .filter(item => item.contactType === 'email' && item.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const emergencyContacts = contactInfo
    .filter(item => item.contactType === 'emergency' && item.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const officeHours = contactInfo
    .filter(item => item.contactType === 'office' && item.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Filter and sort visible offices by order
  const visibleOffices = offices
    .filter(office => office.isVisible)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className={`${devanagari.className} text-4xl md:text-6xl font-bold mb-4 text-orange-900`}>
            {t('contact.title')}
          </h1>
          <p className="text-lg md:text-xl text-orange-700/80 mb-6 max-w-3xl mx-auto">
            {t('contact.subtitle')}
          </p>
          
          {/* Lotus divider */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="h-px w-10 bg-orange-200" />
            <span className="text-2xl">🪷</span>
            <span className="h-px w-10 bg-orange-200" />
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Contact Details */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h2 className={`${devanagari.className} text-3xl font-bold mb-3 text-orange-900`}>
                  {t('contact.ourOffices')}
                </h2>
                <p className="text-orange-700/80 text-lg">
                  {t('contact.officesDescription')}
                </p>
              </div>

              {/* Office Cards */}
              <div className="space-y-4">
                {visibleOffices.length > 0 ? (
                  visibleOffices.map((office) => (
                    <div key={office.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="bg-orange-100 p-3 rounded-full">
                          {office.officeType === 'head' ? (
                            <Building2 className="text-orange-600" size={24} />
                          ) : (
                            <MapPin className="text-orange-600" size={24} />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className={`${devanagari.className} text-xl font-semibold mb-2 text-orange-900`}>
                            {office.nameHindi || office.name}
                          </h3>
                          <p className="text-orange-700/80 leading-relaxed">
                            {office.address.split('\n').map((line, index) => (
                              <span key={index}>
                                {line}
                                {index < office.address.split('\n').length - 1 && <br/>}
                              </span>
                            ))}
                            {office.pincode && (
                              <>
                                <br/>
                                {office.city}, {office.state} - {office.pincode}
                              </>
                            )}
                          </p>
                          {(office.phone || office.email) && (
                            <div className="mt-3 space-y-1">
                              {office.phone && (
                                <p className="text-sm text-orange-600">
                                  📞 {office.phone}
                                </p>
                              )}
                              {office.email && (
                                <p className="text-sm text-orange-600">
                                  ✉️ {office.email}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback static content if no offices in database
                  <>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="bg-orange-100 p-3 rounded-full">
                          <Building2 className="text-orange-600" size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`${devanagari.className} text-xl font-semibold mb-2 text-orange-900`}>
                            {t('contact.centralOffice')}
                          </h3>
                          <p className="text-orange-700/80 leading-relaxed">
                            राष्ट्रीय हिन्दू वाहिनी संगठन &quot;उत्तरायण&quot;<br/>
                            गुरुकुल पब्लिक स्कूल के पास<br/>
                            दतिया (म. प्र.) 475661
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="bg-orange-100 p-3 rounded-full">
                          <MapPin className="text-orange-600" size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`${devanagari.className} text-xl font-semibold mb-2 text-orange-900`}>
                            {t('contact.headOffice')}
                          </h3>
                          <p className="text-orange-700/80 leading-relaxed">
                            D–305, &quot;कान्हा कुंज&quot;<br/>
                            इंदिरा पार्क, नजफगढ़<br/>
                            नई दिल्ली – 110043
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h2 className={`${devanagari.className} text-3xl font-bold mb-3 text-orange-900`}>
                  {t('contact.contactInfo')}
                </h2>
                <p className="text-orange-700/80 text-lg">
                  {t('contact.contactDescription')}
                </p>
              </div>

              {/* Contact Cards */}
              <div className="space-y-4">
                {/* Phone Numbers */}
                {phoneNumbers.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow text-center">
                    <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Phone className="text-orange-600" size={28} />
                    </div>
                    <h3 className={`${devanagari.className} text-2xl font-semibold mb-4 text-orange-900`}>
                      {t('contact.phoneNumbers')}
                    </h3>
                    <div className="space-y-2">
                      {phoneNumbers.map((phone, index) => (
                        <p key={index} className="text-xl font-medium text-orange-800">
                          {phone.value}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email */}
                {emails.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow text-center">
                    <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Mail className="text-orange-600" size={28} />
                    </div>
                    <h3 className={`${devanagari.className} text-2xl font-semibold mb-4 text-orange-900`}>
                      {t('contact.email')}
                    </h3>
                    <div className="space-y-2">
                      {emails.map((email, index) => (
                        <p key={index} className="text-lg text-orange-800">
                          {email.value}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergency Contacts */}
                {emergencyContacts.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow text-center">
                    <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Phone className="text-red-600" size={28} />
                    </div>
                    <h3 className={`${devanagari.className} text-2xl font-semibold mb-4 text-orange-900`}>
                      {t('contact.emergencyContact')}
                    </h3>
                    <div className="space-y-2">
                      {emergencyContacts.map((emergency, index) => (
                        <p key={index} className="text-lg text-orange-800">
                          {emergency.value}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Office Hours */}
                {officeHours.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow text-center">
                    <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Clock className="text-orange-600" size={28} />
                    </div>
                    <h3 className={`${devanagari.className} text-2xl font-semibold mb-4 text-orange-900`}>
                      {t('contact.officeHours')}
                    </h3>
                    <div className="space-y-2">
                      {officeHours.map((hours, index) => (
                        <p key={index} className="text-lg text-orange-800">
                          {hours.value}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback static content if no contact info in database */}
                {phoneNumbers.length === 0 && emails.length === 0 && emergencyContacts.length === 0 && officeHours.length === 0 && (
                  <>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow text-center">
                      <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Phone className="text-orange-600" size={28} />
                      </div>
                      <h3 className={`${devanagari.className} text-2xl font-semibold mb-4 text-orange-900`}>
                        फोन नंबर
                      </h3>
                      <div className="space-y-2">
                        <p className="text-xl font-medium text-orange-800">6290087054</p>
                        <p className="text-xl font-medium text-orange-800">9425119209</p>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow text-center">
                      <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Mail className="text-orange-600" size={28} />
                      </div>
                      <h3 className={`${devanagari.className} text-2xl font-semibold mb-4 text-orange-900`}>
                        ईमेल
                      </h3>
                      <p className="text-lg text-orange-800">
                        help@rashtriyahinduvahinisangathan.org
                      </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-orange-100 hover:shadow-xl transition-shadow text-center">
                      <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Clock className="text-orange-600" size={28} />
                      </div>
                      <h3 className={`${devanagari.className} text-2xl font-semibold mb-4 text-orange-900`}>
                        कार्यालय समय
                      </h3>
                      <div className="space-y-2">
                        <p className="text-lg text-orange-800">सोमवार - शुक्रवार</p>
                        <p className="text-lg text-orange-800">सुबह 9:00 - शाम 6:00</p>
                        <p className="text-lg text-orange-800">शनिवार - रविवार</p>
                        <p className="text-lg text-orange-800">सुबह 10:00 - शाम 4:00</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-gradient-to-r from-orange-100/50 to-orange-50/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className={`${devanagari.className} text-3xl md:text-4xl font-bold mb-6 text-orange-900`}>
            {t('contact.joinUs')}
          </h2>
          <p className="text-lg text-orange-700/80 mb-8 max-w-2xl mx-auto">
            {t('contact.joinDescription')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {phoneNumbers.length > 0 ? (
              <a 
                href={`tel:${phoneNumbers[0].value}`} 
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full font-semibold transition-colors"
              >
                {t('contact.callNow')}
              </a>
            ) : (
              <a 
                href="tel:6290087054" 
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full font-semibold transition-colors"
              >
                {t('contact.callNow')}
              </a>
            )}
            {emails.length > 0 ? (
              <a 
                href={`mailto:${emails[0].value}`} 
                className="bg-white hover:bg-orange-50 text-orange-600 border-2 border-orange-600 px-8 py-3 rounded-full font-semibold transition-colors"
              >
                {t('contact.sendEmail')}
              </a>
            ) : (
              <a 
                href="mailto:help@rashtriyahinduvahinisangathan.org" 
                className="bg-white hover:bg-orange-50 text-orange-600 border-2 border-orange-600 px-8 py-3 rounded-full font-semibold transition-colors"
              >
                {t('contact.sendEmail')}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
