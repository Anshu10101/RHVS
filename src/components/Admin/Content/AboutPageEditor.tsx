"use client";

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
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
  type: 'hero' | 'card' | 'quote' | 'paragraph' | 'heading';
  title?: string;
  content: string;
  order: number;
  isVisible: boolean;
  styling?: {
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
    color?: 'gray' | 'orange' | 'red' | 'blue' | 'green';
  };
}

export function AboutPageEditor() {
  const { hasPermission } = useAdmin();
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [history, setHistory] = useState<AboutSection[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Load about page content from API
  useEffect(() => {
    const loadAboutSections = async () => {
      try {
        const response = await fetch('/api/content/about');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          setSections(result.data);
          setHistory([result.data]);
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
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: 'system'
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
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: 'system'
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
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: 'system'
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
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: 'system'
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
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: 'system'
            }
          ];
          
          setSections(defaultSections);
          setHistory([defaultSections]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Error loading about sections:', error);
      }
    };

    loadAboutSections();
  }, []);

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
      const response = await fetch('/api/content/about', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  const getSectionIcon = (type: AboutSection['type']) => {
    switch (type) {
      case 'hero': return <Heading1 className="h-4 w-4" />;
      case 'card': return <Card className="h-4 w-4" />;
      case 'quote': return <Quote className="h-4 w-4" />;
      case 'paragraph': return <Type className="h-4 w-4" />;
      case 'heading': return <Heading2 className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const getSectionColor = (type: AboutSection['type']) => {
    switch (type) {
      case 'hero': return 'bg-orange-100 text-orange-800';
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to edit the about page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About Page Editor</h1>
          <p className="text-gray-600">Edit the about page content, headings, and sections</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
          <Button
            variant="outline"
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4 mr-2" />
            Undo
          </Button>
          <Button
            variant="outline"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4 mr-2" />
            Redo
          </Button>
          <Button
            onClick={saveChanges}
            disabled={saving}
            className={saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : saveStatus === 'error' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Add Section Buttons */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection('hero')}
          >
            <Heading1 className="h-4 w-4 mr-2" />
            Hero Section
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection('card')}
          >
            <Card className="h-4 w-4 mr-2" />
            Card Section
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection('quote')}
          >
            <Quote className="h-4 w-4 mr-2" />
            Quote Section
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection('heading')}
          >
            <Heading2 className="h-4 w-4 mr-2" />
            Heading
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addSection('paragraph')}
          >
            <Type className="h-4 w-4 mr-2" />
            Paragraph
          </Button>
        </div>
      </Card>

      {/* Sections List */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {sections
          .sort((a, b) => a.order - b.order)
          .map((section, index) => (
            <Card key={section.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getSectionColor(section.type)}`}>
                    {getSectionIcon(section.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {section.title || `Section ${section.order}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {section.type.charAt(0).toUpperCase() + section.type.slice(1)} • Order: {section.order}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={index === sections.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteSection(section.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Section Preview */}
              {!previewMode && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Preview:</div>
                  <div className="prose max-w-none">
                    {section.title && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {section.title}
                      </h3>
                    )}
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {section.content || 'No content yet...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Section Editor */}
              {editingSection === section.id && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`title-${section.id}`}>Title</Label>
                      <Input
                        id={`title-${section.id}`}
                        value={section.title || ''}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder="Section title..."
                      />
                    </div>
                    <div>
                      <Label htmlFor={`type-${section.id}`}>Section Type</Label>
                      <Select
                        value={section.type}
                        onValueChange={(value: AboutSection['type']) => updateSection(section.id, { type: value })}
                      >
                        <option value="hero">Hero Section</option>
                        <option value="card">Card Section</option>
                        <option value="quote">Quote Section</option>
                        <option value="heading">Heading</option>
                        <option value="paragraph">Paragraph</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`content-${section.id}`}>Content</Label>
                    <Textarea
                      id={`content-${section.id}`}
                      value={section.content}
                      onChange={(e) => updateSection(section.id, { content: e.target.value })}
                      placeholder="Section content..."
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`textAlign-${section.id}`}>Text Alignment</Label>
                      <Select
                        value={section.styling?.textAlign || 'left'}
                        onValueChange={(value: 'left' | 'center' | 'right') => 
                          updateSection(section.id, { 
                            styling: { ...section.styling, textAlign: value }
                          })
                        }
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`fontSize-${section.id}`}>Font Size</Label>
                      <Select
                        value={section.styling?.fontSize || 'base'}
                        onValueChange={(value: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl') => 
                          updateSection(section.id, { 
                            styling: { ...section.styling, fontSize: value }
                          })
                        }
                      >
                        <option value="sm">Small</option>
                        <option value="base">Base</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                        <option value="2xl">2X Large</option>
                        <option value="3xl">3X Large</option>
                        <option value="4xl">4X Large</option>
                        <option value="5xl">5X Large</option>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`color-${section.id}`}>Text Color</Label>
                      <Select
                        value={section.styling?.color || 'gray'}
                        onValueChange={(value: 'gray' | 'orange' | 'red' | 'blue' | 'green') => 
                          updateSection(section.id, { 
                            styling: { ...section.styling, color: value }
                          })
                        }
                      >
                        <option value="gray">Gray</option>
                        <option value="orange">Orange</option>
                        <option value="red">Red</option>
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setEditingSection(null)}
                    >
                      Done Editing
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
      </div>

      {/* Preview Mode */}
      {previewMode && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
          <div className="prose max-w-none">
            {sections
              .sort((a, b) => a.order - b.order)
              .filter(section => section.isVisible)
              .map((section) => (
                <div key={section.id} className="mb-6">
                  {section.title && (
                    <h2 className="text-2xl font-bold text-orange-800 mb-4">
                      {section.title}
                    </h2>
                  )}
                  <div className="text-gray-800 leading-8 whitespace-pre-wrap">
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
