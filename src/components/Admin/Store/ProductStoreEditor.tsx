'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdmin } from '@/contexts/AdminContext';
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
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Users
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  seller_id?: string;
  imageUrl: string;
  isVisible: boolean;
  isFeatured: boolean;
  stock: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  // extra for superadmin view badges
  district_id?: string | null;
  state_id?: string | null;
  added_by_name?: string | null;
  // seller info
  seller_name?: string;
  seller_phone?: string;
  seller_whatsapp?: string;
  seller_email?: string;
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Seller {
  id: string;
  name: string;
  business_name?: string;
  contact_phone: string;
  whatsapp_number?: string;
  email?: string;
  is_active: boolean;
}

export default function ProductStoreEditor() {
  const router = useRouter();
  const { currentUser } = useAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingProductData, setEditingProductData] = useState<Product | null>(null);
  const [editingProductImageFile, setEditingProductImageFile] = useState<File | null>(null);
  const [editingProductImageUrl, setEditingProductImageUrl] = useState<string>('');
  const [editingProductImageType, setEditingProductImageType] = useState<'file' | 'url'>('url');
  const [editingProductImages, setEditingProductImages] = useState<string[]>([]);
  const [editingProductImageFiles, setEditingProductImageFiles] = useState<File[]>([]);
  const [editingProductTagsInput, setEditingProductTagsInput] = useState<string>('');
  const [editingCategoryDraft, setEditingCategoryDraft] = useState<ProductCategory | null>(null);
  const [creatingCategoryDraft, setCreatingCategoryDraft] = useState<{ id: string; name: string; description: string; isVisible: boolean } | null>(null);
  // Batch-change queues (apply only on Save Changes)
  const [pendingCategoryCreates, setPendingCategoryCreates] = useState<ProductCategory[]>([]);
  const [pendingCategoryUpdates, setPendingCategoryUpdates] = useState<Record<string, Partial<ProductCategory>>>({});
  const [pendingCategoryDeletes, setPendingCategoryDeletes] = useState<Set<string>>(new Set());
  const [editingProductFeatures, setEditingProductFeatures] = useState<string[]>(['']);
  const [editingProductSpecifications, setEditingProductSpecifications] = useState<{ [key: string]: string }>({});
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [addingProduct, setAddingProduct] = useState<boolean>(false);
  const [newProductData, setNewProductData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    category: '',
    imageUrl: '',
    isVisible: true,
    isFeatured: false,
    stock: 10,
    tags: []
  });
  const [newProductImageFile, setNewProductImageFile] = useState<File | null>(null);
  const [newProductImageUrl, setNewProductImageUrl] = useState<string>('');
  const [newProductImageType, setNewProductImageType] = useState<'file' | 'url'>('file');
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [newProductImageFiles, setNewProductImageFiles] = useState<File[]>([]);
  const [newProductTagsInput, setNewProductTagsInput] = useState<string>('');
  const [newProductFeatures, setNewProductFeatures] = useState<string[]>(['']);
  const [newProductSpecifications, setNewProductSpecifications] = useState<{ [key: string]: string }>({});
  const [history, setHistory] = useState<{ products: Product[]; categories: ProductCategory[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Location filter states (for superadmin only)
  type StateOption = { id: string; name: string };
  type DistrictOption = { id: string; name: string };
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedStateName, setSelectedStateName] = useState<string>('All');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('All');

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSellers();
    
    // Load states for superadmin location filters
    if (currentUser?.type === 'superadmin' || currentUser?.role === 'superadmin') {
      loadStates();
    }
  }, [currentUser]);

  const loadProducts = async () => {
    try {
      // use admin-scoped API so district admins only see their own, superadmin sees all
      const response = await fetch('/api/admin/content/products', { cache: 'no-store', credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        const items = (data.data || []).map((row: any) => ({
          id: String(row.id),
          name: row.name || row.title || `Product ${row.id}`,
          description: row.description || '',
          price: Number(row.price ?? 0),
          originalPrice: Number(row.original_price ?? row.price ?? 0),
          category: String(row.category || 'default'),
          imageUrl: row.image_url || row.imageUrl || '',
          isVisible: Boolean(row.is_visible ?? true),
          isFeatured: Boolean(row.is_featured ?? false),
          stock: Number(row.stock ?? 0),
          tags: Array.isArray(row.tags) ? row.tags : [],
          createdAt: new Date(row.created_at || Date.now()),
          updatedAt: new Date(row.updated_at || row.created_at || Date.now()),
          updatedBy: row.updated_by || 'admin',
          district_id: row.district_id ?? null,
          state_id: row.state_id ?? null,
          added_by_name: row.added_by_name ?? null,
        })) as Product[];
        // Remove duplicates based on product ID
        const uniqueProducts = items.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        );
        setProducts(uniqueProducts);
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

  const loadSellers = async () => {
    try {
      const response = await fetch('/api/admin/sellers');
      const data = await response.json();
      if (data.success) {
        setSellers(data.data || []);
      } else {
        console.error('Failed to load sellers:', data.message);
      }
    } catch (error) {
      console.error('Error loading sellers:', error);
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

  const loadStates = async () => {
    try {
      const response = await fetch('/api/states', { cache: 'no-store' });
      const data = await response.json();
      if (data?.success && Array.isArray(data.data)) {
        const opts: StateOption[] = data.data.map((s: any) => ({ id: String(s.id), name: String(s.name) }));
        setStateOptions(opts);
      }
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  const loadDistricts = async (stateId: string) => {
    try {
      const response = await fetch(`/api/districts?stateId=${encodeURIComponent(stateId)}`, { cache: 'no-store' });
      const data = await response.json();
      if (data?.success && Array.isArray(data.data)) {
        const dOpts = data.data.map((d: any) => ({ id: String(d.id), name: String(d.name) })) as DistrictOption[];
        setDistrictOptions([{ id: 'all', name: 'All' }, ...dOpts]);
      } else {
        setDistrictOptions([{ id: 'all', name: 'All' }]);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
      setDistrictOptions([{ id: 'all', name: 'All' }]);
    }
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

  const startAddingProduct = () => {
    router.push('/admin/content/store/product-creation');
  };

  const cancelAddingProduct = () => {
    setAddingProduct(false);
    setNewProductData({
      name: '',
      description: '',
      price: 0,
      originalPrice: 0,
      category: '',
      imageUrl: '',
      isVisible: true,
      isFeatured: false,
      stock: 10,
      tags: []
    });
    setNewProductImageFile(null);
    setNewProductImageUrl('');
    setNewProductImageType('file');
    setNewProductImages([]);
    setNewProductImageFiles([]);
    setNewProductTagsInput('');
    setNewProductFeatures(['']);
    setNewProductSpecifications({});
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewProductImageFile(file);
      setNewProductImageType('file');
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setNewProductData({ ...newProductData, imageUrl: previewUrl });
    }
  };

  const handleImageUrlChange = (url: string) => {
    setNewProductImageUrl(url);
    setNewProductImageType('url');
    setNewProductImageFile(null);
    setNewProductData({ ...newProductData, imageUrl: url });
  };

  const handleMultipleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      // limit to 3 supporting images
      const limited = files.slice(0, 3);
      setNewProductImageFiles(limited);
      const previewUrls = limited.map(file => URL.createObjectURL(file));
      setNewProductImages(previewUrls);
    }
  };

  const removeImage = (index: number) => {
    const newImages = newProductImages.filter((_, i) => i !== index);
    const newFiles = newProductImageFiles.filter((_, i) => i !== index);
    setNewProductImages(newImages);
    setNewProductImageFiles(newFiles);
    if (newImages.length > 0) {
      setNewProductData({ ...newProductData, imageUrl: newImages[0] });
    } else {
      setNewProductData({ ...newProductData, imageUrl: '' });
    }
  };

  const addFeature = () => {
    setNewProductFeatures([...newProductFeatures, '']);
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...newProductFeatures];
    newFeatures[index] = value;
    setNewProductFeatures(newFeatures);
  };

  const removeFeature = (index: number) => {
    const newFeatures = newProductFeatures.filter((_, i) => i !== index);
    setNewProductFeatures(newFeatures);
  };

  const addSpecification = () => {
    setNewProductSpecifications({ ...newProductSpecifications, '': '' });
  };

  const updateSpecification = (key: string, value: string, oldKey?: string) => {
    const newSpecs = { ...newProductSpecifications };
    if (oldKey && oldKey !== key) {
      delete newSpecs[oldKey];
    }
    newSpecs[key] = value;
    setNewProductSpecifications(newSpecs);
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...newProductSpecifications };
    delete newSpecs[key];
    setNewProductSpecifications(newSpecs);
  };

  const handleTagsInputChange = (value: string) => {
    setNewProductTagsInput(value);
    // Convert to tags array, filtering out empty strings
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setNewProductData({ ...newProductData, tags });
  };

  const handleTagsKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && newProductTagsInput.endsWith(',')) {
      // Remove the last comma and the last tag
      const newValue = newProductTagsInput.slice(0, -1);
      setNewProductTagsInput(newValue);
      const tags = newValue.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setNewProductData({ ...newProductData, tags });
      event.preventDefault();
    }
  };

  const uploadImage = async (file: File, productId?: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    if (productId) {
      formData.append('productId', productId);
    }
    
    const response = await fetch('/api/upload/store', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }
    
    const data = await response.json();
    return data.url;
  };

  const saveNewProduct = async () => {
    if (!newProductData.name || !newProductData.price) {
      alert('Please fill in product name and price');
      return;
    }

    // Prevent multiple submissions
    if (saveStatus === 'saving') {
      console.log('Already saving, ignoring duplicate request');
      return;
    }

    setSaveStatus('saving');
    
    try {
      let imageUrl = newProductData.imageUrl || '';
      let uploadedImages: string[] = [];
      
      // Upload images if files are selected
      if (newProductImageFiles.length > 0 && newProductImageType === 'file') {
        try {
          console.log(`Uploading ${newProductImageFiles.length} images...`);
          // Upload all image files sequentially to avoid conflicts
          const productId = `product_${Date.now()}`;
          for (let i = 0; i < newProductImageFiles.length; i++) {
            console.log(`Uploading image ${i + 1}/${newProductImageFiles.length}`);
            const uploadedUrl = await uploadImage(newProductImageFiles[i], `${productId}_${i}`);
            uploadedImages.push(uploadedUrl);
          }
          // Set first uploaded image as main image
          imageUrl = uploadedImages[0] || '';
          console.log('All images uploaded successfully:', uploadedImages);
        } catch (error) {
          console.error('Image upload failed:', error);
          // Continue without images if upload fails
          imageUrl = '';
          uploadedImages = [];
        }
      } else if (newProductImageType === 'url' && newProductImageUrl) {
        imageUrl = newProductImageUrl;
        uploadedImages = [newProductImageUrl];
      }

      const response = await fetch('/api/admin/content/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newProductData.name,
          description: newProductData.description || '',
          price: newProductData.price,
          original_price: newProductData.originalPrice || newProductData.price,
          category: newProductData.category || 'default',
          image_url: imageUrl,
          images: uploadedImages,
          stock: newProductData.stock || 10,
          is_featured: newProductData.isFeatured || false,
          tags: newProductData.tags || [],
          features: newProductFeatures.filter(f => f.trim() !== ''),
          specifications: newProductSpecifications,
          isVisible: newProductData.isVisible !== false
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Product created successfully:', data.id);
        
        // Reload products to get the new one from server
        await loadProducts();
        
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('idle');
          setAddingProduct(false);
          setNewProductData({
            name: '',
            description: '',
            price: 0,
            originalPrice: 0,
            category: '',
            imageUrl: '',
            isVisible: true,
            isFeatured: false,
            stock: 10,
            tags: []
          });
          setNewProductImageFile(null);
          setNewProductImageUrl('');
          setNewProductImageType('file');
          setNewProductImages([]);
          setNewProductImageFiles([]);
          setNewProductTagsInput('');
          setNewProductFeatures(['']);
          setNewProductSpecifications({});
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('Failed to create product:', errorData.message || 'Unknown error');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (e) {
      console.error('Create product error', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const addCategory = async () => {
    const newCategory: ProductCategory = {
      id: `category_${Date.now()}`,
      name: 'New Category',
      description: '',
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Stage create and only persist on Save Changes
    setPendingCategoryCreates(prev => [...prev, newCategory]);
    const optimistic = [...categories, newCategory];
    setCategories(optimistic);
    saveToHistory(products, optimistic);
    setEditingCategory(newCategory.id);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const newProducts = products.map(product => 
      product.id === id ? { ...product, ...updates, updatedAt: new Date() } : product
    );
    setProducts(newProducts);
    saveToHistory(newProducts, categories);
  };

  const saveProduct = async (product: Product, images?: string[]) => {
    try {
      const resp = await fetch('/api/admin/content/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          original_price: product.originalPrice,
          category: product.category,
          seller_id: product.seller_id,
          image_url: product.imageUrl,
          stock: product.stock,
          is_featured: product.isFeatured,
          tags: product.tags,
          isVisible: product.isVisible,
          images
        })
      });
      
      if (resp.ok) {
        console.log('Product saved successfully');
        return true;
      } else {
        const errorData = await resp.json();
        console.error('Failed to save product:', errorData.message || 'Unknown error');
        return false;
      }
    } catch (e) {
      console.error('Save product error', e);
      return false;
    }
  };

  const startEditingProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditingProductData({ ...product });
      setEditingProductTagsInput(product.tags.join(', '));
      setEditingProductImageFile(null);
      setEditingProductImageUrl(product.imageUrl || '');
      setEditingProductImageType('url');
      setEditingProduct(productId);

      // Load existing gallery images for this product
      (async () => {
        try {
          const res = await fetch(`/api/products/${productId}`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data?.success && Array.isArray(data.product?.images)) {
              const imgs: string[] = data.product.images.slice(0, 4);
              setEditingProductImages(imgs);
              if (imgs.length > 0) {
                setEditingProductData(prev => prev ? { ...prev, imageUrl: imgs[0] } : prev);
              }
            }
          }
        } catch (e) {
          console.error('Failed to load product gallery', e);
        }
      })();
    }
  };

  const startEditingCategory = (categoryId: string) => {
    const c = categories.find(c => c.id === categoryId) || null;
    if (c) {
      setEditingCategoryDraft({ ...c });
      setEditingCategory(categoryId);
    }
  };

  const cancelEditingProduct = () => {
    setEditingProduct(null);
    setEditingProductData(null);
    setEditingProductImageFile(null);
    setEditingProductImageUrl('');
    setEditingProductImageType('url');
    setEditingProductTagsInput('');
  };

  const handleEditingImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditingProductImageFile(file);
      setEditingProductImageType('file');
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setEditingProductData({ ...editingProductData!, imageUrl: previewUrl });
    }
  };

  const handleEditingImageUrlChange = (url: string) => {
    setEditingProductImageUrl(url);
    setEditingProductImageType('url');
    setEditingProductImageFile(null);
    setEditingProductData({ ...editingProductData!, imageUrl: url });
  };

  // Edit product gallery handlers (up to 4 including main)
  const addEditingGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!editingProductData) return;
    // cap supporting to 3 (excluding thumbnail)
    const currentSupporting = (editingProductImages || []).filter(u => u !== editingProductData.imageUrl);
    const remaining = Math.max(0, 3 - currentSupporting.length);
    const toProcess = files.slice(0, remaining);
    const uploaded: string[] = [];
    for (let i = 0; i < toProcess.length; i++) {
      try {
        const url = await uploadImage(toProcess[i], `${editingProductData.id}_${Date.now()}_${i}`);
        uploaded.push(url);
      } catch (err) {
        console.error('Gallery image upload failed', err);
      }
    }
    const base = [editingProductData.imageUrl].filter(Boolean) as string[];
    const newSupporting = [...currentSupporting, ...uploaded].slice(0, 3);
    const unique = [...base, ...newSupporting].filter((v, i, a) => a.indexOf(v) === i);
    setEditingProductImages(unique);
    if (unique.length > 0) {
      setEditingProductData({ ...editingProductData, imageUrl: unique[0] });
    }
  };

  const setEditingMainImage = (url: string) => {
    if (!editingProductData) return;
    const rest = (editingProductImages || []).filter(u => u !== url);
    const ordered = [url, ...rest];
    setEditingProductImages(ordered);
    setEditingProductData({ ...editingProductData, imageUrl: url });
  };

  const removeEditingGalleryImage = (url: string) => {
    if (!editingProductData) return;
    const filtered = (editingProductImages || []).filter(u => u !== url);
    setEditingProductImages(filtered);
    // if removing main, shift main to first remaining or keep current imageUrl
    if (editingProductData.imageUrl === url) {
      const next = filtered[0] || '';
      setEditingProductData({ ...editingProductData, imageUrl: next });
    }
  };

  const handleEditingTagsInputChange = (value: string) => {
    setEditingProductTagsInput(value);
    // Convert to tags array, filtering out empty strings
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setEditingProductData({ ...editingProductData!, tags });
  };

  const handleEditingTagsKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && editingProductTagsInput.endsWith(',')) {
      // Remove the last comma and the last tag
      const newValue = editingProductTagsInput.slice(0, -1);
      setEditingProductTagsInput(newValue);
      const tags = newValue.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setEditingProductData({ ...editingProductData!, tags });
      event.preventDefault();
    }
  };

  const saveEditingProduct = async () => {
    if (!editingProductData) return;
    
    setSaveStatus('saving');
    
    try {
      let imageUrl = editingProductData.imageUrl;
      // If user selected a new thumbnail file, upload it first and replace imageUrl
      if (editingProductImageType === 'file' && editingProductImageFile) {
        try {
          const uploadedThumb = await uploadImage(editingProductImageFile, `${editingProductData.id}_thumb_${Date.now()}`);
          imageUrl = uploadedThumb;
        } catch (err) {
          console.error('Thumbnail upload failed', err);
        }
      }
      // Ensure gallery array includes current main image first
      let gallery = (editingProductImages && editingProductImages.length > 0)
        ? editingProductImages
        : (imageUrl ? [imageUrl] : []);
      // Force the uploaded/selected thumbnail to be first in gallery
      if (imageUrl) {
        const rest = (gallery || []).filter(u => u !== imageUrl);
        gallery = [imageUrl, ...rest].slice(0, 4);
      }

      const success = await saveProduct({
        ...editingProductData,
        imageUrl
      }, gallery);
      
      if (success) {
        // Update the product in the local state
        updateProduct(editingProductData.id, { ...editingProductData, imageUrl });
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus('idle');
          setEditingProduct(null);
          setEditingProductData(null);
          setEditingProductImageFile(null);
          setEditingProductImageUrl('');
          setEditingProductImageType('url');
          setEditingProductTagsInput('');
        }, 1000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (e) {
      console.error('Save product error', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const updateCategory = async (id: string, updates: Partial<ProductCategory>) => {
    // Stage update and optimistic update
    const newCategories = categories.map(category => 
      category.id === id ? { ...category, ...updates, updatedAt: new Date() } : category
    );
    setCategories(newCategories);
    saveToHistory(products, newCategories);
    setPendingCategoryUpdates(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...updates } }));
  };

  const deleteProductLocal = (id: string) => {
    const newProducts = products.filter(product => product.id !== id);
    setProducts(newProducts);
    saveToHistory(newProducts, categories);
    if (editingProduct === id) setEditingProduct(null);
  };

  const deleteProduct = async (id: string) => {
    try {
      console.log('Deleting product with ID:', id, 'Type:', typeof id);
      
      // Safety check for valid ID
      if (!id || id === 'undefined' || id === 'null') {
        console.error('Invalid product ID:', id);
        return;
      }
      
      const encodedId = encodeURIComponent(id);
      const url = `/api/admin/content/products?id=${encodedId}`;
      console.log('Delete URL:', url, 'Encoded ID:', encodedId);
      
      // Try alternative URL construction
      const altUrl = new URL('/api/admin/content/products', window.location.origin);
      altUrl.searchParams.set('id', id);
      console.log('Alternative URL:', altUrl.toString());
      
      const resp = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      console.log('Delete response status:', resp.status);
      if (resp.ok) {
        console.log('Product deleted successfully');
        deleteProductLocal(id);
      } else {
        const errorData = await resp.json();
        console.error('Failed to delete product:', errorData.message || 'Unknown error', 'Status:', resp.status);
      }
    } catch (e) {
      console.error('Delete product error', e);
    }
  };

  const deleteCategory = async (id: string) => {
    // Stage delete and optimistic UI
    const newCategories = categories.filter(category => category.id !== id);
    setCategories(newCategories);
    saveToHistory(products, newCategories);
    if (editingCategory === id) {
      setEditingCategory(null);
    }
    setPendingCategoryDeletes(prev => new Set([...Array.from(prev), id]));
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
      // 1) Persist category changes (creates, updates, deletes)
      // Deletes first to avoid FK conflicts when renaming/creating with same ids
      for (const id of Array.from(pendingCategoryDeletes)) {
        await fetch(`/api/admin/content/categories?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      }

      // Updates
      for (const [id, updates] of Object.entries(pendingCategoryUpdates)) {
        const current = categories.find(c => c.id === id);
        if (!current) continue;
        await fetch('/api/admin/content/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id,
            name: updates.name ?? current.name,
            description: updates.description ?? current.description ?? '',
            isVisible: typeof updates.isVisible === 'boolean' ? updates.isVisible : current.isVisible
          })
        });
      }

      // Creates
      for (const cat of pendingCategoryCreates) {
        await fetch('/api/admin/content/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: cat.id,
            name: cat.name,
            description: cat.description ?? '',
            isVisible: cat.isVisible
          })
        });
      }

      // 2) Persist new products (the editor already stages only creates here)
      // Create any locally-added products (id starts with 'product_') via admin API
      const newProducts = products.filter(p => String(p.id).startsWith('product_'));
      for (const p of newProducts) {
        const resp = await fetch('/api/admin/content/products', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: p.name,
            price: p.price,
            image_url: p.imageUrl,
            description: p.description,
            category: p.category,
            original_price: p.originalPrice,
          }),
        });
        if (!resp.ok) throw new Error('create failed');
        const data = await resp.json();
        if (data?.success && data.id) {
          // replace temp id with real id in local state
          setProducts(prev => prev.map(item => item.id === p.id ? { ...item, id: String(data.id) } as Product : item));
        }
      }

      // 3) Clear staged queues and refresh categories
      setPendingCategoryCreates([]);
      setPendingCategoryUpdates({});
      setPendingCategoryDeletes(new Set());
      await loadCategories();

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving products:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const filteredProducts = (() => {
    let filtered = products;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Filter by location (superadmin only)
    if ((currentUser?.type === 'superadmin' || currentUser?.role === 'superadmin')) {
      if (selectedStateName !== 'All') {
        filtered = filtered.filter(product => {
          // Check if product has state information
          const productState = product.state_id || product.added_by_name;
          if (!productState) return false;
          
          // Match by state name (case insensitive)
          return productState.toLowerCase().includes(selectedStateName.toLowerCase());
        });
      }
      
      if (selectedDistrictName !== 'All') {
        filtered = filtered.filter(product => {
          // Check if product has district information
          const productDistrict = product.district_id || product.added_by_name;
          if (!productDistrict) return false;
          
          // Match by district name (case insensitive)
          return productDistrict.toLowerCase().includes(selectedDistrictName.toLowerCase());
        });
      }
    }
    
    return filtered;
  })();

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
                onClick={() => setCreatingCategoryDraft({ id: `category_${Date.now()}`, name: '', description: '', isVisible: true })}
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
                    onClick={() => {
                      if (editingCategory === category.id) {
                        setEditingCategory(null);
                        setEditingCategoryDraft(null);
                      } else {
                        setEditingCategory(category.id);
                        setEditingCategoryDraft({ ...category });
                      }
                    }}
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
            
            {/* Location Filters (Superadmin only) */}
            {(currentUser?.type === 'superadmin' || currentUser?.role === 'superadmin') && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Location Filters</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">State</label>
                    <Select
                      value={selectedStateId || 'all'}
                      onValueChange={async (id) => {
                        const actualId = id === 'all' ? '' : id;
                        setSelectedStateId(actualId);
                        const opt = stateOptions.find(s => s.id === actualId);
                        const name = opt?.name || 'All';
                        setSelectedStateName(name);
                        
                        if (actualId) {
                          await loadDistricts(actualId);
                          setSelectedDistrictName('All');
                        } else {
                          setDistrictOptions([]);
                          setSelectedDistrictName('All');
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All States" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {stateOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">District</label>
                    <Select
                      value={selectedDistrictName || 'All'}
                      onValueChange={(value) => setSelectedDistrictName(value)}
                      disabled={!selectedStateId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Districts" />
                      </SelectTrigger>
                      <SelectContent>
                        {districtOptions.length === 0 ? (
                          <SelectItem value="All">All Districts</SelectItem>
                        ) : (
                          districtOptions.map((d) => (
                            <SelectItem key={d.id || d.name} value={d.name}>{d.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStateId('');
                      setSelectedStateName('All');
                      setSelectedDistrictName('All');
                      setDistrictOptions([]);
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={startAddingProduct}
                  className="cursor-pointer hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
                <Button
                  onClick={() => router.push('/admin/content/store/sellers')}
                  variant="outline"
                  className="cursor-pointer hover:bg-green-50 hover:border-green-300"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Sellers
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
                
                {/* Active Location Filters (Superadmin only) */}
                {(currentUser?.type === 'superadmin' || currentUser?.role === 'superadmin') && (
                  selectedStateName !== 'All' || selectedDistrictName !== 'All'
                ) && (
                  <div className="flex items-center space-x-1">
                    {selectedStateName !== 'All' && (
                      <Badge variant="secondary" className="text-xs">
                        State: {selectedStateName}
                      </Badge>
                    )}
                    {selectedDistrictName !== 'All' && (
                      <Badge variant="secondary" className="text-xs">
                        District: {selectedDistrictName}
                      </Badge>
                    )}
                  </div>
                )}
                
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
                            onClick={() => startEditingProduct(product.id)}
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
                          <div className="flex items-center space-x-2">
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
                              onClick={() => startEditingProduct(product.id)}
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
                onClick={cancelEditingProduct}
                className="cursor-pointer hover:bg-gray-100"
              >
                ×
              </Button>
            </div>
            
            {(() => {
              const product = editingProductData;
              if (!product) return null;
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <Input
                        value={product.name}
                        onChange={(e) => setEditingProductData({ ...product, name: e.target.value })}
                        className="cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <Select
                        value={product.category || ''}
                        onValueChange={(value) => setEditingProductData({ ...product, category: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {categories.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">No categories available. Please add a category first.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Seller</label>
                      <Select
                        value={product.seller_id || 'none'}
                        onValueChange={(value) => setEditingProductData({ ...product, seller_id: value === 'none' ? undefined : value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a seller" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No seller</SelectItem>
                          {sellers.map(seller => (
                            <SelectItem key={seller.id} value={seller.id}>
                              {seller.name} {seller.business_name && `(${seller.business_name})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {sellers.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          No sellers available. <a href="/admin/content/store/sellers" className="text-blue-600 hover:underline">Add sellers first</a>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={product.description || ''}
                      onChange={(e) => setEditingProductData({ ...product, description: e.target.value })}
                      rows={3}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Price (₹)</label>
                      <Input
                        type="number"
                        min={0}
                        value={product.price}
                        onChange={(e) => setEditingProductData({ ...product, price: Math.max(0, Number(e.target.value)) })}
                        className="cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Original Price (₹)</label>
                      <Input
                        type="number"
                        min={0}
                        value={product.originalPrice || 0}
                        onChange={(e) => setEditingProductData({ ...product, originalPrice: Math.max(0, Number(e.target.value)) })}
                        className="cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Stock</label>
                      <Input
                        type="number"
                        value={product.stock}
                        onChange={(e) => setEditingProductData({ ...product, stock: Number(e.target.value) })}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Thumbnail Image</label>
                      <div className="space-y-3">
                        {/* Image Type Selection */}
                        <div className="flex space-x-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="editingImageType"
                              value="file"
                              checked={editingProductImageType === 'file'}
                              onChange={() => setEditingProductImageType('file')}
                              className="mr-2"
                            />
                            Upload File
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="editingImageType"
                              value="url"
                              checked={editingProductImageType === 'url'}
                              onChange={() => setEditingProductImageType('url')}
                              className="mr-2"
                            />
                            Image URL
                          </label>
                        </div>
                        
                        {/* File Upload */}
                        {editingProductImageType === 'file' && (
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditingImageUpload}
                              className="w-full p-2 border rounded-md cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500">Set one thumbnail image.</p>
                          </div>
                        )}
                        
                        {/* URL Input */}
                        {editingProductImageType === 'url' && (
                          <Input
                            value={editingProductImageUrl}
                            onChange={(e) => handleEditingImageUrlChange(e.target.value)}
                            placeholder="Enter image URL"
                            className="cursor-pointer"
                          />
                        )}
                        
                        {/* Supporting Images manager */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium mb-1">Supporting Images (up to 3)</label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={addEditingGalleryFiles}
                            className="w-full p-2 border rounded-md cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(editingProductImages || []).filter(u => u !== editingProductData?.imageUrl).map((url) => (
                              <div key={url} className="relative">
                                <img src={url} alt="" className="w-16 h-16 object-cover rounded border" />
                                <button
                                  type="button"
                                  onClick={() => removeEditingGalleryImage(url)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Thumbnail is set above. These are additional gallery images.</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                      <Input
                        value={editingProductTagsInput}
                        onChange={(e) => handleEditingTagsInputChange(e.target.value)}
                        onKeyDown={handleEditingTagsKeyDown}
                        placeholder="tag1, tag2, tag3"
                        className="cursor-pointer"
                      />
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                    </div>
                      )}
                    </div>
                  </div>
                  
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={product.isVisible}
                          onChange={(e) => setEditingProductData({ ...product, isVisible: e.target.checked })}
                          className="mr-2 cursor-pointer"
                        />
                        Visible
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={product.isFeatured}
                          onChange={(e) => setEditingProductData({ ...product, isFeatured: e.target.checked })}
                          className="mr-2 cursor-pointer"
                        />
                        Featured
                      </label>
                    </div>
                  
                  {/* Save/Cancel Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={cancelEditingProduct}
                      disabled={saveStatus === 'saving'}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveEditingProduct}
                      disabled={saveStatus === 'saving'}
                      className="min-w-[100px]"
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : saveStatus === 'saved' ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Saved!
                        </>
                      ) : saveStatus === 'error' ? (
                        'Retry'
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {addingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add New Product</h2>
              <Button
                variant="outline"
                onClick={cancelAddingProduct}
                className="cursor-pointer hover:bg-gray-100"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <Input
                    value={newProductData.name || ''}
                    onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                    placeholder="Enter product name"
                    className="cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={newProductData.category || ''}
                    onChange={(e) => setNewProductData({ ...newProductData, category: e.target.value })}
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
                  value={newProductData.description || ''}
                  onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                  rows={3}
                  placeholder="Enter product description"
                  className="cursor-pointer"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                  <Input
                    type="number"
                    min={0}
                    value={newProductData.price || 0}
                    onChange={(e) => setNewProductData({ ...newProductData, price: Math.max(0, Number(e.target.value)) })}
                    placeholder="0"
                    className="cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Original Price (₹)</label>
                  <Input
                    type="number"
                    min={0}
                    value={newProductData.originalPrice || 0}
                    onChange={(e) => setNewProductData({ ...newProductData, originalPrice: Math.max(0, Number(e.target.value)) })}
                    placeholder="0"
                    className="cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock</label>
                  <Input
                    type="number"
                    value={newProductData.stock || 10}
                    onChange={(e) => setNewProductData({ ...newProductData, stock: Number(e.target.value) })}
                    placeholder="10"
                    className="cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Thumbnail Image</label>
                  <div className="space-y-3">
                    {/* Image Type Selection */}
                    <div className="flex space-x-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="imageType"
                          value="file"
                          checked={newProductImageType === 'file'}
                          onChange={() => setNewProductImageType('file')}
                          className="mr-2"
                        />
                        Upload File
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="imageType"
                          value="url"
                          checked={newProductImageType === 'url'}
                          onChange={() => setNewProductImageType('url')}
                          className="mr-2"
                        />
                        Image URL
                      </label>
                    </div>
                    
                    {/* File Upload */}
                    {newProductImageType === 'file' && (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleMultipleImageUpload}
                          className="w-full p-2 border rounded-md cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500">Select multiple images (up to 4)</p>
                      </div>
                    )}
                    
                    {/* URL Input */}
                    {newProductImageType === 'url' && (
                      <Input
                        value={newProductImageUrl}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        placeholder="Enter image URL"
                        className="cursor-pointer"
                      />
                    )}
                    
                    {/* Image Preview */}
                    {newProductImages.length > 0 && (
                      <div className="mt-2">
                        <div className="grid grid-cols-4 gap-2">
                          {newProductImages.map((image, index) => (
                            <div key={index} className="relative">
                              <img 
                                src={image} 
                                alt={`Preview ${index + 1}`} 
                                className="w-16 h-16 object-cover rounded border"
                              />
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {newProductImages.length} image(s) selected
                        </p>
                      </div>
                    )}
                    
                    {/* Single Image Preview for URL */}
                    {newProductImageType === 'url' && newProductData.imageUrl && (
                      <div className="mt-2">
                        <img 
                          src={newProductData.imageUrl} 
                          alt="Preview" 
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <p className="text-xs text-gray-500 mt-1">Image preview</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Supporting Images */}
                <div>
                  <label className="block text-sm font-medium mb-1">Supporting Images (up to 3)</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImageUpload}
                      className="w-full p-2 border rounded-md cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500">These will appear as additional gallery images.</p>
                    {newProductImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {newProductImages.map((image, index) => (
                          <img key={index} src={image} alt="" className="w-16 h-16 object-cover rounded border" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                  <Input
                    value={newProductTagsInput}
                    onChange={(e) => handleTagsInputChange(e.target.value)}
                    onKeyDown={handleTagsKeyDown}
                    placeholder="tag1, tag2, tag3"
                    className="cursor-pointer"
                  />
                  {newProductData.tags && newProductData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newProductData.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProductData.isVisible !== false}
                    onChange={(e) => setNewProductData({ ...newProductData, isVisible: e.target.checked })}
                    className="mr-2 cursor-pointer"
                  />
                  Visible
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProductData.isFeatured || false}
                    onChange={(e) => setNewProductData({ ...newProductData, isFeatured: e.target.checked })}
                    className="mr-2 cursor-pointer"
                  />
                  Featured
                </label>
              </div>
              
              {/* Features Section */}
              <div>
                <label className="block text-sm font-medium mb-2">Key Features</label>
                <div className="space-y-2">
                  {newProductFeatures.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        className="px-3"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeature}
                    className="w-full"
                  >
                    + Add Feature
                  </Button>
                </div>
              </div>
              
              {/* Specifications Section */}
              <div>
                <label className="block text-sm font-medium mb-2">Specifications</label>
                <div className="space-y-2">
                  {Object.entries(newProductSpecifications).map(([key, value], index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={key}
                        onChange={(e) => updateSpecification(e.target.value, value, key)}
                        placeholder="Specification name"
                        className="flex-1"
                      />
                      <Input
                        value={value}
                        onChange={(e) => updateSpecification(key, e.target.value)}
                        placeholder="Value"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSpecification(key)}
                        className="px-3"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSpecification}
                    className="w-full"
                  >
                    + Add Specification
                  </Button>
                </div>
              </div>
              
              {/* Save/Cancel Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={cancelAddingProduct}
                  disabled={saveStatus === 'saving'}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveNewProduct}
                  disabled={saveStatus === 'saving' || !newProductData.name || !newProductData.price}
                  className="min-w-[100px]"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {newProductImageFiles.length > 0 ? 'Uploading images...' : 'Creating...'}
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Created!
                    </>
                  ) : saveStatus === 'error' ? (
                    'Retry'
                  ) : (
                    'Create Product'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Editor Modal */}
      {editingCategory && editingCategoryDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Category</h2>
              <Button
                variant="outline"
                onClick={() => { setEditingCategory(null); setEditingCategoryDraft(null); }}
                className="cursor-pointer hover:bg-gray-100"
              >
                ×
              </Button>
            </div>
            
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                  value={editingCategoryDraft.name}
                  onChange={(e) => setEditingCategoryDraft({ ...editingCategoryDraft, name: e.target.value })}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                  value={editingCategoryDraft.description || ''}
                  onChange={(e) => setEditingCategoryDraft({ ...editingCategoryDraft, description: e.target.value })}
                      rows={3}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                    checked={editingCategoryDraft.isVisible}
                    onChange={(e) => setEditingCategoryDraft({ ...editingCategoryDraft, isVisible: e.target.checked })}
                        className="mr-2 cursor-pointer"
                      />
                      Visible
                    </label>
                  </div>
                </div>

            <div className="flex justify-end gap-2 mt-6 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => { setEditingCategory(null); setEditingCategoryDraft(null); }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!editingCategoryDraft) return;
                  await updateCategory(editingCategoryDraft.id, {
                    name: editingCategoryDraft.name,
                    description: editingCategoryDraft.description,
                    isVisible: editingCategoryDraft.isVisible
                  });
                  setEditingCategory(null);
                  setEditingCategoryDraft(null);
                  await loadCategories();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {creatingCategoryDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Category</h2>
              <Button
                variant="outline"
                onClick={() => setCreatingCategoryDraft(null)}
                className="cursor-pointer hover:bg-gray-100"
              >
                ×
              </Button>
            </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                  value={creatingCategoryDraft.name}
                  onChange={(e) => setCreatingCategoryDraft({ ...creatingCategoryDraft, name: e.target.value })}
                  placeholder="e.g. Books"
                      className="cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Textarea
                  value={creatingCategoryDraft.description}
                  onChange={(e) => setCreatingCategoryDraft({ ...creatingCategoryDraft, description: e.target.value })}
                      rows={3}
                  placeholder="Optional"
                      className="cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                    checked={creatingCategoryDraft.isVisible}
                    onChange={(e) => setCreatingCategoryDraft({ ...creatingCategoryDraft, isVisible: e.target.checked })}
                        className="mr-2 cursor-pointer"
                      />
                      Visible
                    </label>
                  </div>
                </div>

            <div className="flex justify-end gap-2 mt-6 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setCreatingCategoryDraft(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!creatingCategoryDraft?.name.trim()) return;
                  const cat: ProductCategory = {
                    id: creatingCategoryDraft.id,
                    name: creatingCategoryDraft.name.trim(),
                    description: creatingCategoryDraft.description.trim(),
                    isVisible: creatingCategoryDraft.isVisible,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  };
                  // Stage create for Save Changes
                  setPendingCategoryCreates(prev => {
                    // avoid duplicate ids if user reopens modal
                    if (prev.find(p => p.id === cat.id)) return prev;
                    return [...prev, cat];
                  });
                  const optimistic = [...categories, cat];
                  setCategories(optimistic);
                  saveToHistory(products, optimistic);
                  setSelectedCategory(cat.id);
                  setCreatingCategoryDraft(null);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
