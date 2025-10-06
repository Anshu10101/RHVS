"use client";

import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Globe,
  Camera,
  Store,
  Calendar,
  Save,
  Edit,
  Upload,
  Plus,
  Trash2,
  Eye,
  Image as ImageIcon,
  Building2,
  Building,
  Users,
  Phone,
  Menu,
  Search,
  FileText,
  Settings,
  Mail,
  MapPin,
  Clock,
  Link,
  Tag,
  Newspaper,
  CalendarDays,
} from 'lucide-react';
import { NewsManagement } from '../Events/NewsManagement';
import { EventsManagement } from '../Events/EventsManagement';

interface ContentSection {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  modifiedBy: string;
}

export function ContentManagement() {
  const { hasPermission, currentUser } = useAdmin();
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const contentSections: Record<string, ContentSection[]> = {
    about: [
      {
        id: '1',
        title: 'Organization Overview',
        content: 'Rashtriya Hindu Vahini Sangathan is a dedicated organization...',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '2',
        title: 'Mission Statement',
        content: 'Our mission is to serve and unite the Hindu community...',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '3',
        title: 'Vision Statement',
        content: 'Our vision is to create a united and strong Hindu community...',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '4',
        title: 'Core Values',
        content: 'Dharma, Seva, Unity, and Spiritual Growth...',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '5',
        title: 'History & Background',
        content: 'Founded in 2020, RHVS has been serving the community...',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '6',
        title: 'Leadership Team',
        content: 'Meet our dedicated leaders and their contributions...',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
    ],
    gallery: [
      {
        id: '1',
        title: 'Festival Celebrations',
        content: 'Images from various Hindu festivals and celebrations',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '2',
        title: 'Community Events',
        content: 'Photos from community gatherings and events',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '3',
        title: 'Spiritual Activities',
        content: 'Images from puja, meditation, and spiritual sessions',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '4',
        title: 'Volunteer Activities',
        content: 'Photos of community service and volunteer work',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
    ],
    store: [
      {
        id: '1',
        title: 'Featured Products',
        content: 'Sacred items and spiritual products for our community',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '2',
        title: 'Product Categories',
        content: 'Spiritual Items, Puja Items, Sacred Items, Jewelry',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '3',
        title: 'Product Descriptions',
        content: 'Detailed descriptions and features of each product',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '4',
        title: 'Pricing & Offers',
        content: 'Special discounts and pricing information',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
    ],
    events: [
      {
        id: '1',
        title: 'Upcoming Events',
        content: 'List of upcoming community events and gatherings',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '2',
        title: 'Event Descriptions',
        content: 'Detailed information about each event',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '3',
        title: 'Event Registration',
        content: 'Registration forms and requirements',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '4',
        title: 'Event Venues',
        content: 'Information about event locations and facilities',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
    ],
    departments: [
      {
        id: '1',
        title: 'IT Department',
        content: 'Information Technology and digital services',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '2',
        title: 'Finance Department',
        content: 'Financial management and accounting',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '3',
        title: 'Event Management',
        content: 'Planning and organizing community events',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '4',
        title: 'Media & Communications',
        content: 'Social media and public relations',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
    ],
    offices: [
      {
        id: '1',
        title: 'Head Office - Delhi',
        content: 'Main administrative office in Delhi',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '2',
        title: 'Regional Office - Mumbai',
        content: 'Regional office for Western India',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '3',
        title: 'Regional Office - Bangalore',
        content: 'Regional office for Southern India',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
    ],
    'karya-samiti': [
      {
        id: '1',
        title: 'Executive Committee',
        content: 'Core leadership and decision-making body',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '2',
        title: 'Advisory Board',
        content: 'Senior advisors and spiritual guides',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '3',
        title: 'Working Committees',
        content: 'Specialized committees for different activities',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
    ],
    contact: [
      {
        id: '1',
        title: 'Contact Information',
        content: 'Phone numbers, emails, and addresses',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '2',
        title: 'Office Hours',
        content: 'Working hours and availability',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '3',
        title: 'Emergency Contacts',
        content: '24/7 emergency contact information',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
    ],
    navigation: [
      {
        id: '1',
        title: 'Main Navigation',
        content: 'Primary website navigation menu',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '2',
        title: 'Footer Links',
        content: 'Footer navigation and quick links',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '3',
        title: 'Sidebar Links',
        content: 'Sidebar navigation and widgets',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
    ],
    seo: [
      {
        id: '1',
        title: 'Meta Tags',
        content: 'Title tags, descriptions, and keywords',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '2',
        title: 'Social Media',
        content: 'Open Graph and Twitter Card settings',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
      {
        id: '3',
        title: 'Analytics',
        content: 'Google Analytics and tracking codes',
        lastModified: new Date(),
        modifiedBy: 'Admin User',
      },
    ],
  };

  const tabs = [
    {
      id: 'about',
      name: 'About Page',
      icon: Globe,
      permission: 'edit_about',
    },
    {
      id: 'news',
      name: 'News Management',
      icon: Newspaper,
      permission: 'edit_news',
    },
    {
      id: 'events',
      name: 'Events Management',
      icon: CalendarDays,
      permission: 'edit_events',
    },
    {
      id: 'photos',
      name: 'Photo Management',
      icon: Camera,
      permission: 'manage_gallery',
    },
    {
      id: 'store',
      name: 'Product Store',
      icon: Store,
      permission: 'edit_store',
    },
    {
      id: 'departments',
      name: 'Departments',
      icon: Building2,
      permission: 'edit_departments',
    },
    {
      id: 'offices',
      name: 'Offices',
      icon: Building,
      permission: 'edit_offices',
    },
    {
      id: 'karya-samiti',
      name: 'Karya Samiti',
      icon: Users,
      permission: 'edit_karya_samiti',
    },
    {
      id: 'contact',
      name: 'Contact Info',
      icon: Phone,
      permission: 'edit_contact',
    },
    {
      id: 'navigation',
      name: 'Navigation',
      icon: Menu,
      permission: 'edit_navigation',
    },
    {
      id: 'seo',
      name: 'SEO & Meta',
      icon: Search,
      permission: 'edit_seo',
    },
  ];

  const canEdit = (permission: string) => {
    return hasPermission(permission) || hasPermission('all');
  };

  const handleEdit = (content: string) => {
    setEditedContent(content);
    setIsEditing(true);
  };

  const handleSave = () => {
    // Save logic here
    setIsEditing(false);
    setEditedContent('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="text-gray-600">Manage website content and media</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs
            .filter(tab => canEdit(tab.permission))
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'about' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">About Page Content</h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open('/about', '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Live Page
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/admin/content/about'}
                    disabled={!canEdit('edit_about')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Open Editor
                  </Button>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">About Page Editor</h3>
                <p className="text-orange-700 mb-4">
                  Use the advanced editor to modify the about page with headings, sections, quotes, and rich content.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-1">Hero Sections</h4>
                    <p className="text-sm text-gray-600">Main page headers and introductions</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-1">Content Cards</h4>
                    <p className="text-sm text-gray-600">Information sections and paragraphs</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-1">Quotes</h4>
                    <p className="text-sm text-gray-600">Sacred texts and important quotes</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-1">Styling</h4>
                    <p className="text-sm text-gray-600">Font sizes, colors, and alignment</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {contentSections.about.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{section.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = '/admin/content/about'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{section.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Last modified: {section.lastModified.toLocaleDateString()} by {section.modifiedBy}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Gallery Management</h2>
                <div className="flex items-center space-x-2">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Images
                  </Button>
                  <Button disabled={!canEdit('manage_gallery')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Album
                  </Button>
                </div>
              </div>
              
              {/* Gallery Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="relative group">
                    <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                        <Button size="sm" variant="secondary">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Product Store Management</h2>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={() => window.location.href = '/admin/content/store'}
                    className="cursor-pointer hover:bg-blue-600"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Open Editor
                  </Button>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </Button>
                </div>
              </div>
              
              {/* Product Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {['Spiritual Items', 'Puja Items', 'Sacred Items', 'Jewelry'].map((category) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900 mb-2">{category}</h3>
                    <p className="text-sm text-gray-600 mb-3">12 products</p>
                    <Button size="sm" variant="outline" className="w-full">
                      Manage
                    </Button>
                  </div>
                ))}
              </div>

              {/* Recent Products */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Products</h3>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Store className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Product {i}</p>
                          <p className="text-sm text-gray-600">₹1,500</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-6">
            <NewsManagement />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <EventsManagement />
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Department Management</h2>
                <Button disabled={!canEdit('edit_departments')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </div>
              <div className="space-y-4">
                {contentSections.departments.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{section.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" disabled={!canEdit('edit_departments')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{section.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Last modified: {section.lastModified.toLocaleDateString()} by {section.modifiedBy}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'offices' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Office Management</h2>
                <Button disabled={!canEdit('edit_offices')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Office
                </Button>
              </div>
              <div className="space-y-4">
                {contentSections.offices.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{section.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" disabled={!canEdit('edit_offices')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{section.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Last modified: {section.lastModified.toLocaleDateString()} by {section.modifiedBy}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'karya-samiti' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Karya Samiti Management</h2>
                <Button disabled={!canEdit('edit_karya_samiti')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
              <div className="space-y-4">
                {contentSections['karya-samiti'].map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{section.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" disabled={!canEdit('edit_karya_samiti')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{section.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Last modified: {section.lastModified.toLocaleDateString()} by {section.modifiedBy}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information Management</h2>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open('/contact', '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Live Page
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/admin/content/contact'}
                    disabled={!canEdit('edit_contact')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Open Editor
                  </Button>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Contact Page Editor</h3>
                <p className="text-orange-700 mb-4">
                  Manage contact information, office locations, phone numbers, emails, and office hours for the contact page.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-1">Contact Info</h4>
                    <p className="text-sm text-gray-600">Phone numbers, emails, emergency contacts</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-1">Office Locations</h4>
                    <p className="text-sm text-gray-600">Head office, regional offices, branch offices</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-1">Office Hours</h4>
                    <p className="text-sm text-gray-600">Working hours and availability</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-1">Visibility Control</h4>
                    <p className="text-sm text-gray-600">Show/hide specific contact information</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {contentSections.contact.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{section.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = '/admin/content/contact'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{section.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Last modified: {section.lastModified.toLocaleDateString()} by {section.modifiedBy}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'navigation' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Navigation Management</h2>
                <Button disabled={!canEdit('edit_navigation')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
              <div className="space-y-4">
                {contentSections.navigation.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{section.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" disabled={!canEdit('edit_navigation')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{section.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Last modified: {section.lastModified.toLocaleDateString()} by {section.modifiedBy}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">SEO & Meta Management</h2>
                <Button disabled={!canEdit('edit_seo')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Meta Tag
                </Button>
              </div>
              <div className="space-y-4">
                {contentSections.seo.map((section) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{section.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" disabled={!canEdit('edit_seo')}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{section.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Last modified: {section.lastModified.toLocaleDateString()} by {section.modifiedBy}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Content</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={10}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
