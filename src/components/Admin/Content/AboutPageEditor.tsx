"use client";

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Save,
  Edit,
  Eye,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Quote,
  List,
  Image as ImageIcon,
  Link,
  Undo,
  Redo,
} from 'lucide-react';

interface AboutSection {
  id: string;
  type: 'hero' | 'card' | 'quote' | 'paragraph' | 'heading' | 'image';
  title?: string;
  content: string;
  imageUrl?: string;
  order: number;
  isVisible: boolean;
  styling?: {
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    color?: 'gray' | 'orange' | 'red' | 'blue' | 'green';
    imageAlign?: 'left' | 'center' | 'right';
    imageWidth?: 'full' | 'half' | 'third' | 'quarter';
  };
}

export function AboutPageEditor() {
  const { t } = useLanguage();
  const { hasPermission } = useAdmin();
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [history, setHistory] = useState<AboutSection[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  // Load about page content from API
  const loadAboutSections = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/content/about?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          // Sort sections by order to ensure correct display
          const sortedSections = [...result.data].sort((a, b) => (a.order || 0) - (b.order || 0));
          setSections(sortedSections);
          setHistory([sortedSections]);
          setHistoryIndex(0);
        } else {
          // Load default sections if no data exists
          const defaultSections: AboutSection[] = [
            {
              id: '1',
              type: 'hero',
              title: 'सनातन धर्म',
              content: 'सनातन धर्म शाश्वत है — जिसका न आदि है न अंत। यही सनातन परम्परा हिंदू धर्म का मूल स्वरूप है और भारतीय संस्कृति की आत्मा है।',
              order: 1,
              isVisible: true,
              styling: {
                textAlign: 'center',
                fontSize: '5xl',
                fontWeight: 'extrabold',
                color: 'orange'
              }
            },
            {
              id: '2',
              type: 'card',
              title: 'परिचय',
              content: 'सनातन धर्म हिंदू धर्म का ही वैकल्पिक नाम है जिसका उपयोग संस्कृत और अन्य भारतीय भाषाओं में भी किया जाता है। वैदिक काल में भारतीय उपमहाद्वीप के धर्म के लिए \'सनातन धर्म\' नाम मिलता है। \'सनातन\' का अर्थ है - शाश्वत या \'सदा बना रहने वाला\', अर्थात् जिसका न आदि है न अन्त।',
              order: 2,
              isVisible: true,
              styling: {
                textAlign: 'left',
                fontSize: 'base',
                fontWeight: 'normal',
                color: 'gray'
              },
            },
            {
              id: '3',
              type: 'quote',
              title: 'ऋग्वेद 3.18.1',
              content: 'यह पथ सनातन है। समस्त देवता और मनुष्य इसी मार्ग से पैदा हुए हैं तथा प्रगति की है। हे मनुष्यों आप अपने उत्पन्न होने की आधाररूपा अपनी माता को विनष्ट न करें।',
              order: 3,
              isVisible: true,
              styling: {
                textAlign: 'left',
                fontSize: 'lg',
                fontWeight: 'medium',
                color: 'orange'
              },
            },
            {
              id: '4',
              type: 'card',
              title: 'इतिहास',
              content: 'सनातन धर्म जिसे हिन्दू धर्म अथवा वैदिक धर्म भी कहा जाता है। भारत (और आधुनिक पाकिस्तानी क्षेत्र) की सिन्धु घाटी सभ्यता में हिन्दू धर्म के कई चिह्न मिलते हैं — मातृदेवी की मूर्तियाँ, शिव-पशुपति मुद्राएँ, लिंग, पीपल-पूजा आदि।',
              order: 4,
              isVisible: true,
              styling: {
                textAlign: 'left',
                fontSize: 'base',
                fontWeight: 'normal',
                color: 'gray'
              },
            },
            {
              id: '5',
              type: 'card',
              title: 'स्वरूप',
              content: 'सनातन में समय के साथ समसामयिक चुनौतियों का समाधान हुआ — जैसे राजा राम मोहन राय, स्वामी दयानंद, स्वामी विवेकानंद आदि ने कुरीतियों का विरोध कर सुधार किए।',
              order: 5,
              isVisible: true,
              styling: {
                textAlign: 'left',
                fontSize: 'base',
                fontWeight: 'normal',
                color: 'gray'
              },
            }
          ];
          
          setSections(defaultSections);
          setHistory([defaultSections]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Error loading about sections:', error);
      }
    }, []);

  useEffect(() => {
    loadAboutSections();

    // Reload when page becomes visible (user returns from another tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadAboutSections();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadAboutSections]);

  const saveToHistory = (newSections: AboutSection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newSections]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSections([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSections([...history[historyIndex + 1]]);
    }
  };

  const addSection = (type: AboutSection['type']) => {
    const newSection: AboutSection = {
      id: Date.now().toString(),
      type,
      title: '',
      content: '',
      order: sections.length + 1,
      isVisible: true,
      styling: {
        textAlign: 'left',
        fontSize: 'base',
        fontWeight: 'normal',
        color: 'gray'
      }
    };
    
    const newSections = [...sections, newSection];
    setSections(newSections);
    saveToHistory(newSections);
    setEditingSection(newSection.id);
  };

  const updateSection = (id: string, updates: Partial<AboutSection>) => {
    const newSections = sections.map(section =>
      section.id === id ? { ...section, ...updates } : section
    );
    setSections(newSections);
    saveToHistory(newSections);
  };

  const deleteSection = (id: string) => {
    const newSections = sections.filter(section => section.id !== id);
    setSections(newSections);
    saveToHistory(newSections);
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(section => section.id === id);
    if (index === -1) return;

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newSections.length) {
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      newSections.forEach((section, idx) => {
        section.order = idx + 1;
      });
      setSections(newSections);
      saveToHistory(newSections);
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    setSaveStatus('saving');
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/content/about?_t=${Date.now()}`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sections: sections.map(section => ({
            ...section,
            updatedAt: new Date(),
            updatedBy: 'admin' // This should come from the current user context
          })),
          updatedBy: 'admin'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSaveStatus('success');
        // Reload sections from API to get the latest saved data with fresh cache-busting
        // Use a small delay to ensure server has committed the transaction
        setTimeout(async () => {
          await loadAboutSections();
        }, 100);
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error saving about sections:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (sectionId: string, file: File) => {
    try {
      setUploadingImage(sectionId);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'about_page');

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/upload/about', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      if (data.success && data.url) {
        updateSection(sectionId, { imageUrl: data.url });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(t('admin.content.about.imageUploadError') || 'Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const getSectionIcon = (type: AboutSection['type']) => {
    switch (type) {
      case 'hero': return <Heading1 className="h-4 w-4" />;
      case 'card': return <Card className="h-4 w-4" />;
      case 'quote': return <Quote className="h-4 w-4" />;
      case 'paragraph': return <Type className="h-4 w-4" />;
      case 'heading': return <Heading2 className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const getSectionColor = (type: AboutSection['type']) => {
    switch (type) {
      case 'hero': return 'bg-orange-100 text-orange-800';
      case 'image': return 'bg-purple-100 text-purple-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'quote': return 'bg-green-100 text-green-800';
      case 'paragraph': return 'bg-gray-100 text-gray-800';
      case 'heading': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!hasPermission('edit_about')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.content.about.accessDenied')}</h3>
          <p className="text-gray-600">{t('admin.content.about.noPermission')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-2 sm:px-4 md:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{t('admin.content.about.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('admin.content.about.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex-1 sm:flex-initial"
          >
            <Eye className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{previewMode ? t('admin.content.about.editMode') : t('admin.content.about.previewMode')}</span>
            <span className="sm:hidden">{previewMode ? t('admin.content.about.editMode')?.slice(0, 4) : t('admin.content.about.previewMode')?.slice(0, 4)}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="flex-1 sm:flex-initial"
          >
            <Undo className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('admin.content.about.undo')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="flex-1 sm:flex-initial"
          >
            <Redo className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('admin.content.about.redo')}</span>
          </Button>
          <Button
            size="sm"
            onClick={saveChanges}
            disabled={saving}
            className={`flex-1 sm:flex-initial ${saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : saveStatus === 'error' ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            <Save className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">
              {saving ? t('admin.content.about.saving') : saveStatus === 'success' ? t('admin.content.about.saved') : saveStatus === 'error' ? t('admin.content.about.error') : t('admin.content.about.saveChanges')}
            </span>
          </Button>
        </div>
      </div>

      {/* Add Section Buttons */}
      <Card className="p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection('hero')}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:flex-initial sm:min-w-0"
          >
            <Heading1 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{t('admin.content.about.heroSection')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection('card')}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:flex-initial sm:min-w-0"
          >
            <Card className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{t('admin.content.about.cardSection')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection('quote')}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:flex-initial sm:min-w-0"
          >
            <Quote className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{t('admin.content.about.quoteSection')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection('heading')}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:flex-initial sm:min-w-0"
          >
            <Heading2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{t('admin.content.about.heading')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection('paragraph')}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:flex-initial sm:min-w-0"
          >
            <Type className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{t('admin.content.about.paragraph')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection('image')}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:flex-initial sm:min-w-0"
          >
            <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{t('admin.content.about.imageSection') || 'Image'}</span>
          </Button>
        </div>
      </Card>

      {/* Sections List */}
      <div className="flex-1 space-y-3 sm:space-y-4 overflow-y-auto pb-4">
        {sections
          .sort((a, b) => a.order - b.order)
          .map((section, index) => (
            <Card key={section.id} className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${getSectionColor(section.type)}`}>
                    {getSectionIcon(section.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                      {section.title || `${t('admin.content.about.section')} ${section.order}`}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {section.type.charAt(0).toUpperCase() + section.type.slice(1)} • {t('admin.content.about.order')}: {section.order}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={index === 0}
                    className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                  >
                    <MoveUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Up</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={index === sections.length - 1}
                    className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                  >
                    <MoveDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Down</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                    className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                  >
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteSection(section.id)}
                    className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </div>

              {/* Section Preview */}
              {!previewMode && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600 mb-2">{t('admin.content.about.preview')}</div>
                  <div className="prose max-w-none prose-sm sm:prose-base">
                    {section.title && (
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {section.title}
                      </h3>
                    )}
                    {section.type === 'image' && section.imageUrl ? (
                      <div>
                        <img 
                          src={section.imageUrl} 
                          alt={section.content || section.title || 'Section image'} 
                          className="max-w-full h-auto rounded-lg border border-gray-200 max-h-32 sm:max-h-48 object-contain"
                        />
                        {section.content && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-2 italic">{section.content}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">
                        {section.content || t('admin.content.about.noContent')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Section Editor */}
              {editingSection === section.id && (
                <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 border-t pt-3 sm:pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor={`title-${section.id}`} className="text-sm">{t('admin.content.about.titleLabel')}</Label>
                      <Input
                        id={`title-${section.id}`}
                        value={section.title || ''}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder={t('admin.content.about.titlePlaceholder')}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`type-${section.id}`} className="text-sm">{t('admin.content.about.sectionType')}</Label>
                      <Select
                        value={section.type}
                        onValueChange={(value: AboutSection['type']) => updateSection(section.id, { type: value })}
                      >
                        <SelectTrigger className="mt-1 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hero">{t('admin.content.about.heroSection')}</SelectItem>
                          <SelectItem value="card">{t('admin.content.about.cardSection')}</SelectItem>
                          <SelectItem value="quote">{t('admin.content.about.quoteSection')}</SelectItem>
                          <SelectItem value="heading">{t('admin.content.about.heading')}</SelectItem>
                          <SelectItem value="paragraph">{t('admin.content.about.paragraph')}</SelectItem>
                          <SelectItem value="image">{t('admin.content.about.imageSection') || 'Image'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Image Upload for Image Sections */}
                  {section.type === 'image' && (
                    <div>
                      <Label className="text-sm">{t('admin.content.about.imageUpload') || 'Upload Image'}</Label>
                      <div className="mt-2 space-y-2">
                        {section.imageUrl ? (
                          <div className="space-y-2">
                            <img 
                              src={section.imageUrl} 
                              alt={section.title || 'Section image'} 
                              className="max-w-full h-auto rounded-lg border border-gray-200 max-h-48 sm:max-h-64 object-contain"
                            />
                            <div className="flex flex-col sm:flex-row gap-2">
                              <label className="flex-1 cursor-pointer">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  id={`image-upload-${section.id}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(section.id, file);
                                    }
                                  }}
                                  disabled={uploadingImage === section.id}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const input = document.getElementById(`image-upload-${section.id}`) as HTMLInputElement;
                                    input?.click();
                                  }}
                                  disabled={uploadingImage === section.id}
                                  className="w-full text-xs sm:text-sm"
                                >
                                  <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  {uploadingImage === section.id 
                                    ? (t('admin.content.about.uploading') || 'Uploading...')
                                    : (t('admin.content.about.replaceImage') || 'Replace Image')
                                  }
                                </Button>
                              </label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateSection(section.id, { imageUrl: undefined })}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm"
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                {t('admin.content.about.removeImage') || 'Remove'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(section.id, file);
                                }
                              }}
                              disabled={uploadingImage === section.id}
                              className="cursor-pointer text-xs sm:text-sm"
                            />
                            {uploadingImage === section.id && (
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('admin.content.about.uploading') || 'Uploading...'}</p>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {t('admin.content.about.imageUploadHint') || 'Supported formats: JPG, PNG, GIF. Max size: 2MB'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Alignment and Width for Image Sections */}
                  {section.type === 'image' && section.imageUrl && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor={`imageAlign-${section.id}`} className="text-sm">{t('admin.content.about.imageAlignment') || 'Image Alignment'}</Label>
                        <Select
                          value={section.styling?.imageAlign || 'center'}
                          onValueChange={(value: 'left' | 'center' | 'right') => 
                            updateSection(section.id, { 
                              styling: { ...section.styling, imageAlign: value }
                            })
                          }
                        >
                          <SelectTrigger className="mt-1 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">{t('admin.content.about.left')}</SelectItem>
                            <SelectItem value="center">{t('admin.content.about.center')}</SelectItem>
                            <SelectItem value="right">{t('admin.content.about.right')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`imageWidth-${section.id}`} className="text-sm">{t('admin.content.about.imageWidth') || 'Image Width'}</Label>
                        <Select
                          value={section.styling?.imageWidth || 'full'}
                          onValueChange={(value: 'full' | 'half' | 'third' | 'quarter') => 
                            updateSection(section.id, { 
                              styling: { ...section.styling, imageWidth: value }
                            })
                          }
                        >
                          <SelectTrigger className="mt-1 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">{t('admin.content.about.fullWidth') || 'Full Width'}</SelectItem>
                            <SelectItem value="half">{t('admin.content.about.halfWidth') || 'Half Width'}</SelectItem>
                            <SelectItem value="third">{t('admin.content.about.thirdWidth') || 'Third Width'}</SelectItem>
                            <SelectItem value="quarter">{t('admin.content.about.quarterWidth') || 'Quarter Width'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Content for non-image sections */}
                  {section.type !== 'image' && (
                    <div>
                      <Label htmlFor={`content-${section.id}`} className="text-sm">{t('admin.content.about.contentLabel')}</Label>
                      <Textarea
                        id={`content-${section.id}`}
                        value={section.content}
                        onChange={(e) => updateSection(section.id, { content: e.target.value })}
                        placeholder={t('admin.content.about.contentPlaceholder')}
                        rows={6}
                        className="mt-1 text-sm"
                      />
                    </div>
                  )}

                  {/* Caption/Alt text for image sections */}
                  {section.type === 'image' && (
                    <div>
                      <Label htmlFor={`content-${section.id}`} className="text-sm">{t('admin.content.about.imageCaption') || 'Image Caption/Alt Text'}</Label>
                      <Textarea
                        id={`content-${section.id}`}
                        value={section.content}
                        onChange={(e) => updateSection(section.id, { content: e.target.value })}
                        placeholder={t('admin.content.about.imageCaptionPlaceholder') || 'Enter image caption or alt text...'}
                        rows={3}
                        className="mt-1 text-sm"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor={`textAlign-${section.id}`} className="text-sm">{t('admin.content.about.textAlignment')}</Label>
                      <Select
                        value={section.styling?.textAlign || 'left'}
                        onValueChange={(value: 'left' | 'center' | 'right') => 
                          updateSection(section.id, { 
                            styling: { ...section.styling, textAlign: value }
                          })
                        }
                      >
                        <SelectTrigger className="mt-1 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">{t('admin.content.about.left')}</SelectItem>
                          <SelectItem value="center">{t('admin.content.about.center')}</SelectItem>
                          <SelectItem value="right">{t('admin.content.about.right')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`fontSize-${section.id}`} className="text-sm">{t('admin.content.about.fontSize')}</Label>
                      <Select
                        value={section.styling?.fontSize || 'base'}
                        onValueChange={(value: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl') => 
                          updateSection(section.id, { 
                            styling: { ...section.styling, fontSize: value }
                          })
                        }
                      >
                        <SelectTrigger className="mt-1 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">{t('admin.content.about.small')}</SelectItem>
                          <SelectItem value="base">{t('admin.content.about.base')}</SelectItem>
                          <SelectItem value="lg">{t('admin.content.about.large')}</SelectItem>
                          <SelectItem value="xl">{t('admin.content.about.extraLarge')}</SelectItem>
                          <SelectItem value="2xl">{t('admin.content.about.twoXL')}</SelectItem>
                          <SelectItem value="3xl">{t('admin.content.about.threeXL')}</SelectItem>
                          <SelectItem value="4xl">{t('admin.content.about.fourXL')}</SelectItem>
                          <SelectItem value="5xl">{t('admin.content.about.fiveXL')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`color-${section.id}`} className="text-sm">{t('admin.content.about.textColor')}</Label>
                      <Select
                        value={section.styling?.color || 'gray'}
                        onValueChange={(value: 'gray' | 'orange' | 'red' | 'blue' | 'green') => 
                          updateSection(section.id, { 
                            styling: { ...section.styling, color: value }
                          })
                        }
                      >
                        <SelectTrigger className="mt-1 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gray">{t('admin.content.about.gray')}</SelectItem>
                          <SelectItem value="orange">{t('admin.content.about.orange')}</SelectItem>
                          <SelectItem value="red">{t('admin.content.about.red')}</SelectItem>
                          <SelectItem value="blue">{t('admin.content.about.blue')}</SelectItem>
                          <SelectItem value="green">{t('admin.content.about.green')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSection(null)}
                      className="w-full sm:w-auto"
                    >
                      {t('admin.content.about.doneEditing')}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
      </div>

      {/* Preview Mode */}
      {previewMode && (
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('admin.content.about.livePreview')}</h2>
          <div className="prose prose-sm sm:prose-base max-w-none">
            {sections
              .sort((a, b) => a.order - b.order)
              .filter(section => section.isVisible)
              .map((section) => (
                <div key={section.id} className="mb-4 sm:mb-6">
                  {section.title && (
                    <h2 className="text-xl sm:text-2xl font-bold text-orange-800 mb-3 sm:mb-4">
                      {section.title}
                    </h2>
                  )}
                  <div className="text-sm sm:text-base text-gray-800 leading-6 sm:leading-8 whitespace-pre-wrap break-words">
                    {section.content}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
