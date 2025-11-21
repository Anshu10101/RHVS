'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Upload,
  Edit,
  Trash2,
  Eye,
  Settings,
  Plus,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Play,
  Pause
} from 'lucide-react';
import Image from 'next/image';

interface HeroImage {
  id: number;
  image_path: string;
  alt_text: string;
  title?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  added_by: number;
  district_id?: number;
  state_id?: number;
  created_at: string;
}

interface HeroSettings {
  marquee_speed: number;
  image_display_duration: number;
  auto_play: boolean;
  show_indicators: boolean;
  transition_effect: string;
}

export function HeroImagesManagement() {
  const { hasPermission, currentUser } = useAdmin();
  const [images, setImages] = useState<HeroImage[]>([]);
  const [settings, setSettings] = useState<HeroSettings>({
    marquee_speed: 30,
    image_display_duration: 3,
    auto_play: true,
    show_indicators: true,
    transition_effect: 'slide'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingImage, setEditingImage] = useState<HeroImage | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchImages();
    fetchSettings();
  }, []);

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/hero-images?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/hero-images/settings?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddImage = async () => {
    if (!uploadFile || !editingImage?.alt_text) return;

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('alt_text', editingImage.alt_text);
    formData.append('title', editingImage.title || '');
    formData.append('description', editingImage.description || '');
    formData.append('display_order', String(editingImage.display_order || images.length));

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/hero-images?_t=${Date.now()}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (response.ok) {
        await fetchImages();
        setEditingImage(null);
        setUploadFile(null);
        setPreviewUrl('');
      } else {
        const errorData = await response.json();
        console.error('Error adding image:', errorData.error);
        alert('Error adding image: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error adding image:', error);
      alert('Error adding image: ' + error);
    }
  };

  const handleUpdateImage = async () => {
    if (!editingImage) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/hero-images/${editingImage.id}?_t=${Date.now()}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editingImage)
      });

      if (response.ok) {
        await fetchImages();
        setEditingImage(null);
      } else {
        const errorData = await response.json();
        console.error('Error updating image:', errorData.error);
        alert('Error updating image: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Error updating image: ' + error);
    }
  };

  const handleDeleteImage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/hero-images/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        await fetchImages();
      } else {
        const errorData = await response.json();
        console.error('Error deleting image:', errorData.error);
        alert('Error deleting image: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image: ' + error);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/hero-images/settings?_t=${Date.now()}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        setShowSettings(false);
      } else {
        const errorData = await response.json();
        console.error('Error updating settings:', errorData.error);
        alert('Error updating settings: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error updating settings: ' + error);
    }
  };

  const moveImage = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const newImages = [...images];
    [newImages[currentIndex], newImages[newIndex]] = [newImages[newIndex], newImages[currentIndex]];

    // Update display orders
    newImages.forEach((img, index) => {
      img.display_order = index;
    });

    setImages(newImages);

    // Update in database
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`/api/hero-images/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ display_order: newImages[currentIndex].display_order })
      });
    } catch (error) {
      console.error('Error updating image order:', error);
    }
  };

  if (!hasPermission('manage_hero_images')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">You don't have permission to manage hero images.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hero Images Management</h2>
          <p className="text-gray-600">Manage the rotating images in the hero section</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            className="gap-2"
          >
            <Settings size={16} />
            Settings
          </Button>
          <Button
            onClick={() => {
              setEditingImage({
                id: 0,
                image_path: '',
                alt_text: '',
                title: '',
                description: '',
                display_order: images.length,
                is_active: true,
                added_by: 0,
                created_at: ''
              });
              setIsEditing(true);
            }}
            className="gap-2"
          >
            <Plus size={16} />
            Add Image
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Hero Section Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marquee_speed">Marquee Speed (seconds)</Label>
              <Input
                id="marquee_speed"
                type="number"
                value={settings.marquee_speed}
                onChange={(e) => setSettings({...settings, marquee_speed: Number(e.target.value)})}
                min="5"
                max="120"
              />
            </div>
            <div>
              <Label htmlFor="image_display_duration">Image Display Duration (seconds)</Label>
              <Input
                id="image_display_duration"
                type="number"
                value={settings.image_display_duration}
                onChange={(e) => setSettings({...settings, image_display_duration: Number(e.target.value)})}
                min="1"
                max="10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto_play"
                checked={settings.auto_play}
                onCheckedChange={(checked) => setSettings({...settings, auto_play: checked})}
              />
              <Label htmlFor="auto_play">Auto Play</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show_indicators"
                checked={settings.show_indicators}
                onCheckedChange={(checked) => setSettings({...settings, show_indicators: checked})}
              />
              <Label htmlFor="show_indicators">Show Indicators</Label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleUpdateSettings} className="gap-2">
              <Save size={16} />
              Save Settings
            </Button>
            <Button onClick={() => setShowSettings(false)} variant="outline" className="gap-2">
              <X size={16} />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Add/Edit Image Form */}
      {isEditing && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingImage?.id ? 'Edit Image' : 'Add New Image'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="image_upload">Image File</Label>
              <Input
                id="image_upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="mb-2"
              />
              {previewUrl && (
                <div className="w-32 h-32 relative border rounded-lg overflow-hidden">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="alt_text">Alt Text *</Label>
                <Input
                  id="alt_text"
                  value={editingImage?.alt_text || ''}
                  onChange={(e) => setEditingImage({...editingImage!, alt_text: e.target.value})}
                  placeholder="Description for screen readers"
                />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingImage?.title || ''}
                  onChange={(e) => setEditingImage({...editingImage!, title: e.target.value})}
                  placeholder="Image title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingImage?.description || ''}
                  onChange={(e) => setEditingImage({...editingImage!, description: e.target.value})}
                  placeholder="Image description"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={editingImage?.id ? handleUpdateImage : handleAddImage}
              className="gap-2"
              disabled={!editingImage?.alt_text || (!uploadFile && !editingImage?.id)}
            >
              <Save size={16} />
              {editingImage?.id ? 'Update' : 'Add'} Image
            </Button>
            <Button 
              onClick={() => {
                setIsEditing(false);
                setEditingImage(null);
                setUploadFile(null);
                setPreviewUrl('');
              }} 
              variant="outline" 
              className="gap-2"
            >
              <X size={16} />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Images List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Current Images ({images.length})</h3>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No images added yet. Click "Add Image" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={image.id} className="border rounded-lg p-4 space-y-3">
                <div className="relative w-full h-32 rounded-lg overflow-hidden">
                  <Image
                    src={image.image_path}
                    alt={image.alt_text}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-sm truncate">{image.title || image.alt_text}</h4>
                  <p className="text-xs text-gray-500 truncate">{image.description}</p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage(image.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp size={12} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage(image.id, 'down')}
                      disabled={index === images.length - 1}
                    >
                      <ArrowDown size={12} />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingImage(image);
                        setIsEditing(true);
                      }}
                    >
                      <Edit size={12} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteImage(image.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
