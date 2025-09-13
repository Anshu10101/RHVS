'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff,
  Upload,
  Grid3X3,
  List,
  Package,
  DollarSign,
  Tag,
  Image as ImageIcon
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl: string;
  isVisible: boolean;
  isFeatured: boolean;
  stock: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProductStoreEditor() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [history, setHistory] = useState<{ products: Product[]; categories: ProductCategory[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/content/store');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/content/store/categories');
      const data = await response.json();
      if (data.success) {
        const categoriesData = data.categories || [];
        setCategories(categoriesData);
      } else {
        console.error('Failed to load categories:', data.error);
        // Set default categories as fallback
        setDefaultCategories();
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Set default categories as fallback
      setDefaultCategories();
    }
  };

  const setDefaultCategories = () => {
    const defaultCategories: ProductCategory[] = [
      {
        id: 'cat_default_1',
        name: 'Spiritual Items',
        description: 'Sacred and spiritual products',
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cat_default_2',
        name: 'Puja Items',
        description: 'Essential items for puja',
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cat_default_3',
        name: 'Sacred Items',
        description: 'Holy and blessed items',
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    setCategories(defaultCategories);
  };

  const saveToHistory = (newProducts: Product[], newCategories: ProductCategory[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ products: newProducts, categories: newCategories });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setProducts(prevState.products);
      setCategories(prevState.categories);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setProducts(nextState.products);
      setCategories(nextState.categories);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const addProduct = () => {
    // Ensure we have at least one category before adding a product
    if (categories.length === 0) {
      // Add a default category first
      const defaultCategory: ProductCategory = {
        id: 'cat_default_' + Date.now(),
        name: 'Default Category',
        description: 'Default category for products',
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const newCategories = [...categories, defaultCategory];
      setCategories(newCategories);
      saveToHistory(products, newCategories);
    }

    const newProduct: Product = {
      id: `product_${Date.now()}`,
      name: 'New Product',
      description: '',
      price: 0,
      originalPrice: 0,
      category: categories.length > 0 ? categories[0].id : 'default',
      imageUrl: '',
      isVisible: true,
      isFeatured: false,
      stock: 0,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: 'admin'
    };
    
    const newProducts = [...products, newProduct];
    setProducts(newProducts);
    saveToHistory(newProducts, categories);
    setEditingProduct(newProduct.id);
  };

  const addCategory = () => {
    const newCategory: ProductCategory = {
      id: `category_${Date.now()}`,
      name: 'New Category',
      description: '',
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newCategories = [...categories, newCategory];
    setCategories(newCategories);
    saveToHistory(products, newCategories);
    setEditingCategory(newCategory.id);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const newProducts = products.map(product => 
      product.id === id ? { ...product, ...updates, updatedAt: new Date() } : product
    );
    setProducts(newProducts);
    saveToHistory(newProducts, categories);
  };

  const updateCategory = (id: string, updates: Partial<ProductCategory>) => {
    const newCategories = categories.map(category => 
      category.id === id ? { ...category, ...updates, updatedAt: new Date() } : category
    );
    setCategories(newCategories);
    saveToHistory(products, newCategories);
  };

  const deleteProduct = (id: string) => {
    const newProducts = products.filter(product => product.id !== id);
    setProducts(newProducts);
    saveToHistory(newProducts, categories);
    if (editingProduct === id) {
      setEditingProduct(null);
    }
  };

  const deleteCategory = (id: string) => {
    const newCategories = categories.filter(category => category.id !== id);
    setCategories(newCategories);
    saveToHistory(products, newCategories);
    if (editingCategory === id) {
      setEditingCategory(null);
    }
  };

  const moveProduct = (id: string, direction: 'up' | 'down') => {
    const index = products.findIndex(product => product.id === id);
    if (index === -1) return;

    const newProducts = [...products];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < products.length) {
      [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]];
      setProducts(newProducts);
      saveToHistory(newProducts, categories);
    }
  };

  const handleFileUpload = async (productId: string, file: File) => {
    try {
      setUploadProgress(prev => ({ ...prev, [productId]: 0 }));
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);

      const response = await fetch('/api/upload/store', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        updateProduct(productId, { imageUrl: data.url });
        setUploadProgress(prev => ({ ...prev, [productId]: 100 }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadProgress(prev => ({ ...prev, [productId]: 0 }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, productId: string) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(productId, files[0]);
    }
  };

  const saveChanges = async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/content/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          products, 
          categories, 
          updatedBy: 'admin' 
        }),
      });

      if (response.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Error saving products:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="cursor-pointer hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Store Editor</h1>
            <p className="text-sm text-gray-600">Manage your product catalog</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="cursor-pointer hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="cursor-pointer hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={saveChanges}
            disabled={saveStatus === 'saving'}
            className="cursor-pointer hover:bg-blue-600 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Sidebar - Categories */}
          <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Categories</h3>
              <Button
                onClick={addCategory}
                size="sm"
                className="cursor-pointer hover:bg-blue-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="w-full justify-start cursor-pointer hover:bg-gray-100"
              >
                All Products ({products.length})
              </Button>
              {categories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Button
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex-1 justify-start cursor-pointer hover:bg-gray-100"
                  >
                    {category.name} ({products.filter(p => p.category === category.id).length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCategory(editingCategory === category.id ? null : category.id)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCategory(category.id)}
                    className="cursor-pointer hover:bg-red-100 text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={addProduct}
                  className="cursor-pointer hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {filteredProducts.length} products
                </span>
                {saveStatus === 'saved' && (
                  <Badge variant="outline" className="text-green-600">
                    Saved
                  </Badge>
                )}
                {saveStatus === 'error' && (
                  <Badge variant="outline" className="text-red-600">
                    Error
                  </Badge>
                )}
              </div>
            </div>

            {/* Products Grid/List */}
            <div className="flex-1 overflow-y-auto p-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="relative">
                        <div
                          className="aspect-square bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, product.id)}
                          onClick={() => {
                            const input = document.getElementById(`file-upload-${product.id}`) as HTMLInputElement;
                            input?.click();
                          }}
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center text-gray-400">
                              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                              <p className="text-sm">Click to upload</p>
                            </div>
                          )}
                          <input
                            id={`file-upload-${product.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(product.id, file);
                            }}
                          />
                        </div>
                        
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              const input = document.getElementById(`file-upload-${product.id}`) as HTMLInputElement;
                              input?.click();
                            }}
                            className="h-8 w-8 p-0 cursor-pointer hover:bg-blue-100"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingProduct(editingProduct === product.id ? null : product.id)}
                            className="h-8 w-8 p-0 cursor-pointer hover:bg-gray-100"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => deleteProduct(product.id)}
                            className="h-8 w-8 p-0 cursor-pointer hover:bg-red-100 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm mb-1 truncate">{product.name}</h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-green-600">
                            ₹{product.price}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveProduct(product.id, 'up')}
                              className="h-6 w-6 p-0 cursor-pointer hover:bg-gray-100"
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveProduct(product.id, 'down')}
                              className="h-6 w-6 p-0 cursor-pointer hover:bg-gray-100"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map(product => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-16 h-16 bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, product.id)}
                            onClick={() => {
                              const input = document.getElementById(`file-upload-list-${product.id}`) as HTMLInputElement;
                              input?.click();
                            }}
                          >
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            )}
                            <input
                              id={`file-upload-list-${product.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(product.id, file);
                              }}
                            />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm font-bold text-green-600">
                                ₹{product.price}
                              </span>
                              <span className="text-xs text-gray-500">
                                Stock: {product.stock}
                              </span>
                              <Badge variant={product.isVisible ? 'default' : 'secondary'}>
                                {product.isVisible ? 'Visible' : 'Hidden'}
                              </Badge>
                              {product.isFeatured && (
                                <Badge variant="outline" className="text-yellow-600">
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const input = document.getElementById(`file-upload-list-${product.id}`) as HTMLInputElement;
                                input?.click();
                              }}
                              className="cursor-pointer hover:bg-blue-100"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingProduct(editingProduct === product.id ? null : product.id)}
                              className="cursor-pointer hover:bg-gray-100"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteProduct(product.id)}
                              className="cursor-pointer hover:bg-red-100 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="flex flex-col space-y-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveProduct(product.id, 'up')}
                                className="h-6 w-6 p-0 cursor-pointer hover:bg-gray-100"
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveProduct(product.id, 'down')}
                                className="h-6 w-6 p-0 cursor-pointer hover:bg-gray-100"
                              >
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Editor Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Product</h2>
              <Button
                variant="outline"
                onClick={() => setEditingProduct(null)}
                className="cursor-pointer hover:bg-gray-100"
              >
                ×
              </Button>
            </div>
            
            {(() => {
              const product = products.find(p => p.id === editingProduct);
              if (!product) return null;
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <Input
                        value={product.name}
                        onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                        className="cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={product.category || ''}
                        onChange={(e) => updateProduct(product.id, { category: e.target.value })}
                        className="w-full p-2 border rounded-md cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {categories.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">No categories available. Please add a category first.</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={product.description}
                      onChange={(e) => updateProduct(product.id, { description: e.target.value })}
                      rows={3}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Price (₹)</label>
                      <Input
                        type="number"
                        value={product.price}
                        onChange={(e) => updateProduct(product.id, { price: Number(e.target.value) })}
                        className="cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Original Price (₹)</label>
                      <Input
                        type="number"
                        value={product.originalPrice || 0}
                        onChange={(e) => updateProduct(product.id, { originalPrice: Number(e.target.value) })}
                        className="cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Stock</label>
                      <Input
                        type="number"
                        value={product.stock}
                        onChange={(e) => updateProduct(product.id, { stock: Number(e.target.value) })}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                      <Input
                        value={product.tags.join(', ')}
                        onChange={(e) => updateProduct(product.id, { tags: e.target.value.split(',').map(t => t.trim()) })}
                        placeholder="tag1, tag2, tag3"
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={product.isVisible}
                          onChange={(e) => updateProduct(product.id, { isVisible: e.target.checked })}
                          className="mr-2 cursor-pointer"
                        />
                        Visible
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={product.isFeatured}
                          onChange={(e) => updateProduct(product.id, { isFeatured: e.target.checked })}
                          className="mr-2 cursor-pointer"
                        />
                        Featured
                      </label>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Category Editor Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Category</h2>
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
                className="cursor-pointer hover:bg-gray-100"
              >
                ×
              </Button>
            </div>
            
            {(() => {
              const category = categories.find(c => c.id === editingCategory);
              if (!category) return null;
              
              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                      value={category.name}
                      onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={category.description}
                      onChange={(e) => updateCategory(category.id, { description: e.target.value })}
                      rows={3}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.isVisible}
                        onChange={(e) => updateCategory(category.id, { isVisible: e.target.checked })}
                        className="mr-2 cursor-pointer"
                      />
                      Visible
                    </label>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
