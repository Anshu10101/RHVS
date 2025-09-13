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
  Camera,
  Image as ImageIcon,
  Upload,
  Folder,
  FolderPlus,
  X,
  Undo,
  Redo,
  Search,
  Filter,
  Grid3X3,
  List,
} from 'lucide-react';

interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  albumId: string;
  order: number;
  isVisible: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

interface GalleryAlbum {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export function GalleryPageEditor() {
  const { hasPermission } = useAdmin();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<{images: GalleryImage[], albums: GalleryAlbum[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // Load gallery content from API
  useEffect(() => {
    const loadGalleryContent = async () => {
      try {
        const response = await fetch('/api/content/gallery');
        const data = await response.json();
        if (data.success) {
          setImages(data.images || []);
          setAlbums(data.albums || []);
          saveToHistory({ images: data.images || [], albums: data.albums || [] });
        }
      } catch (error) {
        console.error('Error loading gallery content:', error);
      }
    };

    loadGalleryContent();
  }, []);

  const saveToHistory = (newState: {images: GalleryImage[], albums: GalleryAlbum[]}) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setImages(history[newIndex].images);
      setAlbums(history[newIndex].albums);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setImages(history[newIndex].images);
      setAlbums(history[newIndex].albums);
    }
  };

  const addAlbum = () => {
    const newAlbum: GalleryAlbum = {
      id: `album_${Date.now()}`,
      name: 'New Album',
      description: '',
      order: albums.length + 1,
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: 'admin'
    };
    
    const newAlbums = [...albums, newAlbum];
    setAlbums(newAlbums);
    saveToHistory({ images, albums: newAlbums });
    setEditingAlbum(newAlbum.id);
  };

  const addImage = (albumId: string) => {
    const newImage: GalleryImage = {
      id: `img_${Date.now()}`,
      title: 'New Image',
      description: '',
      imageUrl: '',
      albumId,
      order: images.filter(img => img.albumId === albumId).length + 1,
      isVisible: true,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: 'admin'
    };
    
    const newImages = [...images, newImage];
    setImages(newImages);
    saveToHistory({ images: newImages, albums });
    setEditingImage(newImage.id);
  };

  const handleFileUpload = async (file: File, imageId: string) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageId', imageId);

      // Upload file
      const response = await fetch('/api/upload/gallery', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update the image with the new URL
        updateImage(imageId, { imageUrl: result.url });
        setUploadProgress(100);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, imageId: string) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileUpload(imageFile, imageId);
    }
  };

  const updateImage = (id: string, updates: Partial<GalleryImage>) => {
    const newImages = images.map(image =>
      image.id === id ? { ...image, ...updates, updatedAt: new Date() } : image
    );
    setImages(newImages);
    saveToHistory({ images: newImages, albums });
  };

  const updateAlbum = (id: string, updates: Partial<GalleryAlbum>) => {
    const newAlbums = albums.map(album =>
      album.id === id ? { ...album, ...updates, updatedAt: new Date() } : album
    );
    setAlbums(newAlbums);
    saveToHistory({ images, albums: newAlbums });
  };

  const deleteImage = (id: string) => {
    const newImages = images.filter(image => image.id !== id);
    setImages(newImages);
    saveToHistory({ images: newImages, albums });
  };

  const deleteAlbum = (id: string) => {
    const newAlbums = albums.filter(album => album.id !== id);
    const newImages = images.filter(image => image.albumId !== id);
    setAlbums(newAlbums);
    setImages(newImages);
    saveToHistory({ images: newImages, albums: newAlbums });
  };

  const moveImage = (id: string, direction: 'up' | 'down') => {
    const image = images.find(img => img.id === id);
    if (!image) return;

    const albumImages = images.filter(img => img.albumId === image.albumId).sort((a, b) => a.order - b.order);
    const index = albumImages.findIndex(img => img.id === id);
    if (index === -1) return;

    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < albumImages.length) {
      const targetImage = albumImages[targetIndex];
      const currentOrder = image.order;
      const targetOrder = targetImage.order;
      
      newImages.forEach(img => {
        if (img.id === id) img.order = targetOrder;
        if (img.id === targetImage.id) img.order = currentOrder;
      });
      
      setImages(newImages);
      saveToHistory({ images: newImages, albums });
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    setSaveStatus('saving');
    
    try {
      const response = await fetch('/api/content/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: images.map(image => ({
            ...image,
            updatedAt: new Date(),
            updatedBy: 'admin'
          })),
          albums: albums.map(album => ({
            ...album,
            updatedAt: new Date(),
            updatedBy: 'admin'
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
      console.error('Error saving gallery content:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const filteredImages = images.filter(image => {
    const matchesAlbum = selectedAlbum === 'all' || image.albumId === selectedAlbum;
    const matchesSearch = searchQuery === '' || 
      image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesAlbum && matchesSearch;
  });

  if (!hasPermission('edit_gallery')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to edit the gallery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery Editor</h1>
          <p className="text-gray-600">Manage gallery albums and images</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="cursor-pointer hover:bg-purple-50 hover:border-purple-300"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
          <Button
            variant="outline"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="cursor-pointer hover:bg-gray-50 hover:border-gray-400 disabled:cursor-not-allowed"
          >
            <Undo className="h-4 w-4 mr-2" />
            Undo
          </Button>
          <Button
            variant="outline"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="cursor-pointer hover:bg-gray-50 hover:border-gray-400 disabled:cursor-not-allowed"
          >
            <Redo className="h-4 w-4 mr-2" />
            Redo
          </Button>
          <Button
            onClick={saveChanges}
            disabled={saving}
            className={`cursor-pointer ${saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : saveStatus === 'error' ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-orange-600'} disabled:cursor-not-allowed`}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedAlbum}
            onValueChange={setSelectedAlbum}
          >
            <option value="all">All Albums</option>
            {albums.map(album => (
              <option key={album.id} value={album.id}>{album.name}</option>
            ))}
          </Select>
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="cursor-pointer hover:bg-gray-50 hover:border-gray-400"
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Add Buttons */}
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={addAlbum} 
          className="flex items-center cursor-pointer hover:bg-orange-600"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          Add Album
        </Button>
        <Button 
          variant="outline" 
          onClick={() => addImage(selectedAlbum === 'all' ? albums[0]?.id || '' : selectedAlbum)}
          disabled={albums.length === 0}
          className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 disabled:cursor-not-allowed"
        >
          <Upload className="h-4 w-4 mr-2" />
          Add Image
        </Button>
        <div className="flex items-center">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              const albumId = selectedAlbum === 'all' ? albums[0]?.id || '' : selectedAlbum;
              
              if (albumId && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  // Create new image first
                  const newImage: GalleryImage = {
                    id: `img_${Date.now()}_${i}`,
                    title: file.name.split('.')[0] || 'New Image',
                    description: '',
                    imageUrl: '',
                    albumId,
                    order: images.filter(img => img.albumId === albumId).length + i + 1,
                    isVisible: true,
                    tags: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    updatedBy: 'admin'
                  };
                  
                  // Add image to state
                  const newImages = [...images, newImage];
                  setImages(newImages);
                  saveToHistory({ images: newImages, albums });
                  
                  // Upload file
                  await handleFileUpload(file, newImage.id);
                }
              }
            }}
            className="hidden"
            id="bulk-upload"
            disabled={albums.length === 0}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('bulk-upload')?.click()}
            disabled={albums.length === 0}
            className="cursor-pointer hover:bg-green-50 hover:border-green-300 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Multiple
          </Button>
        </div>
      </div>

      {/* Albums */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Albums</h2>
        {albums.map((album) => (
          <Card key={album.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Folder className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">{album.name}</h3>
                  <p className="text-sm text-gray-500">
                    {images.filter(img => img.albumId === album.id).length} images
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingAlbum(editingAlbum === album.id ? null : album.id)}
                  className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addImage(album.id)}
                  className="cursor-pointer hover:bg-green-50 hover:border-green-300"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteAlbum(album.id)}
                  className="text-red-600 hover:text-red-700 cursor-pointer hover:bg-red-50 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Album Editor */}
            {editingAlbum === album.id && (
              <div className="mt-4 space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`album-name-${album.id}`}>Album Name</Label>
                    <Input
                      id={`album-name-${album.id}`}
                      value={album.name}
                      onChange={(e) => updateAlbum(album.id, { name: e.target.value })}
                      placeholder="Album name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor={`album-cover-${album.id}`}>Cover Image URL</Label>
                    <Input
                      id={`album-cover-${album.id}`}
                      value={album.coverImageUrl || ''}
                      onChange={(e) => updateAlbum(album.id, { coverImageUrl: e.target.value })}
                      placeholder="Cover image URL..."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`album-desc-${album.id}`}>Description</Label>
                  <Textarea
                    id={`album-desc-${album.id}`}
                    value={album.description || ''}
                    onChange={(e) => updateAlbum(album.id, { description: e.target.value })}
                    placeholder="Album description..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={album.isVisible}
                      onChange={(e) => updateAlbum(album.id, { isVisible: e.target.checked })}
                      className="mr-2"
                    />
                    Visible
                  </label>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Images */}
      <div className="flex-1 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Images</h2>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <Card key={image.id} className="p-4">
                <div 
                  className={`aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center border-2 border-dashed transition-colors cursor-pointer ${
                    dragOver ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, image.id)}
                  onClick={() => document.getElementById(`file-upload-${image.id}`)?.click()}
                >
                  {image.imageUrl ? (
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Drop image here or click to upload</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 truncate">{image.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{image.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {albums.find(a => a.id === image.albumId)?.name || 'No Album'}
                    </span>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById(`file-upload-${image.id}`)?.click()}
                        disabled={uploading}
                        className="cursor-pointer hover:bg-orange-50 hover:border-orange-300"
                      >
                        <Upload className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingImage(editingImage === image.id ? null : image.id)}
                        className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteImage(image.id)}
                        className="text-red-600 hover:text-red-700 cursor-pointer hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredImages.map((image) => (
              <Card key={image.id} className="p-4">
                {/* Hidden file input for quick upload */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, image.id);
                    }
                  }}
                  className="hidden"
                  id={`file-upload-list-${image.id}`}
                  disabled={uploading}
                />
                <div className="flex items-center space-x-4">
                  <div 
                    className={`w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border-2 border-dashed transition-colors cursor-pointer ${
                      dragOver ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, image.id)}
                    onClick={() => document.getElementById(`file-upload-list-${image.id}`)?.click()}
                  >
                    {image.imageUrl ? (
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{image.title}</h3>
                    <p className="text-sm text-gray-500">{image.description}</p>
                    <p className="text-xs text-gray-400">
                      {albums.find(a => a.id === image.albumId)?.name || 'No Album'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById(`file-upload-list-${image.id}`)?.click()}
                      disabled={uploading}
                      className="cursor-pointer hover:bg-orange-50 hover:border-orange-300"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage(image.id, 'up')}
                      className="cursor-pointer hover:bg-gray-50 hover:border-gray-400"
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImage(image.id, 'down')}
                      className="cursor-pointer hover:bg-gray-50 hover:border-gray-400"
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingImage(editingImage === image.id ? null : image.id)}
                      className="cursor-pointer hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteImage(image.id)}
                      className="text-red-600 hover:text-red-700 cursor-pointer hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Hidden file input for quick upload */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, image.id);
                    }
                  }}
                  className="hidden"
                  id={`file-upload-${image.id}`}
                  disabled={uploading}
                />

                {/* Image Editor */}
                {editingImage === image.id && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`image-title-${image.id}`}>Title</Label>
                        <Input
                          id={`image-title-${image.id}`}
                          value={image.title}
                          onChange={(e) => updateImage(image.id, { title: e.target.value })}
                          placeholder="Image title..."
                        />
                      </div>
                      <div>
                        <Label htmlFor={`image-url-${image.id}`}>Image URL</Label>
                        <Input
                          id={`image-url-${image.id}`}
                          value={image.imageUrl}
                          onChange={(e) => updateImage(image.id, { imageUrl: e.target.value })}
                          placeholder="Image URL..."
                        />
                      </div>
                    </div>
                    
                    {/* File Upload Section */}
                    <div>
                      <Label>Upload Image</Label>
                      <div className="mt-2">
                        <div className="flex items-center space-x-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById(`file-upload-${image.id}`)?.click()}
                            disabled={uploading}
                            className="flex items-center cursor-pointer hover:bg-orange-50 hover:border-orange-300"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </Button>
                          <span className="text-sm text-gray-500">
                            or drag & drop image above
                          </span>
                        </div>
                        {uploading && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`image-desc-${image.id}`}>Description</Label>
                      <Textarea
                        id={`image-desc-${image.id}`}
                        value={image.description || ''}
                        onChange={(e) => updateImage(image.id, { description: e.target.value })}
                        placeholder="Image description..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`image-album-${image.id}`}>Album</Label>
                        <Select
                          value={image.albumId}
                          onValueChange={(value) => updateImage(image.id, { albumId: value })}
                        >
                          {albums.map(album => (
                            <option key={album.id} value={album.id}>{album.name}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`image-tags-${image.id}`}>Tags (comma-separated)</Label>
                        <Input
                          id={`image-tags-${image.id}`}
                          value={image.tags.join(', ')}
                          onChange={(e) => updateImage(image.id, { 
                            tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                          })}
                          placeholder="tag1, tag2, tag3..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={image.isVisible}
                          onChange={(e) => updateImage(image.id, { isVisible: e.target.checked })}
                          className="mr-2"
                        />
                        Visible
                      </label>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
