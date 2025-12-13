'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Users,
  Search,
  SortAsc,
  SortDesc,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft as ChevronsLeftIcon,
  ChevronsRight as ChevronsRightIcon,
  Maximize2,
  Minimize2,
  Menu,
  X
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
  const { t } = useLanguage();
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

  // Product list management (search, sort, pagination, compact view)
  const [productSearch, setProductSearch] = useState('');
  const [productsSortBy, setProductsSortBy] = useState<'name' | 'price' | 'stock' | 'updatedAt'>('updatedAt');
  const [productsSortOrder, setProductsSortOrder] = useState<'asc' | 'desc'>('desc');
  const [productsPage, setProductsPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(24);
  const [productsCompactMode, setProductsCompactMode] = useState(false);

  // Category list management (search, pagination, compact view)
  const [categorySearch, setCategorySearch] = useState('');
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [categoriesPerPage] = useState(20);
  const [categoriesCompactMode, setCategoriesCompactMode] = useState(false);

  // Define setDefaultCategories before it's used
  const setDefaultCategories = useCallback(() => {
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
  }, []);

  // Define loadStates before it's used
  const loadStates = useCallback(async () => {
    try {
      const response = await fetch('/api/states', { cache: 'no-store' });
      const data = await response.json();
      if (data?.success && Array.isArray(data.data)) {
        const opts: StateOption[] = data.data.map((s: { id: string | number; name: string }) => ({ id: String(s.id), name: String(s.name) }));
        setStateOptions(opts);
      }
    } catch (error) {
      console.error('Error loading states:', error);
    }
  }, []);

  // Define loadCategories before it's used
  const loadCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      // Use admin endpoint for consistency with creation endpoint
      const response = await fetch(`/api/admin/content/categories?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (data.success) {
        const categoriesData = data.categories || [];
        // Map the response to match ProductCategory interface
        const mappedCategories = categoriesData.map((cat: any) => ({
          id: String(cat.id),
          name: cat.name,
          description: cat.description || '',
          isVisible: Boolean(cat.isVisible),
          createdAt: cat.created_at ? new Date(cat.created_at) : new Date(),
          updatedAt: cat.updated_at ? new Date(cat.updated_at) : new Date()
        }));
        setCategories(mappedCategories);
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
  }, [setDefaultCategories]);

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSellers();
    
    // Load states for superadmin location filters
    if (currentUser?.type === 'superadmin' || currentUser?.role === 'superadmin') {
      loadStates();
    }
  }, [currentUser, loadCategories, loadStates]);

  const loadProducts = async () => {
    try {
      // use admin-scoped API so district admins only see their own, superadmin sees all
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/content/products?_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        const items = (data.data || []).map((row: Record<string, unknown>) => ({
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
          createdAt: (row.created_at && typeof row.created_at === 'string') ? new Date(row.created_at) : new Date(),
          updatedAt: (row.updated_at && typeof row.updated_at === 'string') ? new Date(row.updated_at) : ((row.created_at && typeof row.created_at === 'string') ? new Date(row.created_at) : new Date()),
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


  const loadSellers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/sellers?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
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



  const loadDistricts = async (stateId: string) => {
    try {
      const response = await fetch(`/api/districts?stateId=${encodeURIComponent(stateId)}`, { cache: 'no-store' });
      const data = await response.json();
      if (data?.success && Array.isArray(data.data)) {
        const dOpts = data.data.map((d: { id: string | number; name: string }) => ({ id: String(d.id), name: String(d.name) })) as DistrictOption[];
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

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/content/products?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
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
    
    // Save immediately to database instead of staging
    try {
      const token = localStorage.getItem('admin_token');
      const resp = await fetch(`/api/admin/content/categories?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: newCategory.id,
          name: newCategory.name,
          description: newCategory.description || '',
          isVisible: newCategory.isVisible
        }),
        cache: 'no-store'
      });
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[Add Category] Failed to create category:', errorData);
        alert(`Failed to create category: ${errorData.message || 'Unknown error'}`);
        return;
      }
      
      const result = await resp.json();
      if (!result.success) {
        console.error('[Add Category] Category creation returned success=false:', result);
        alert(`Failed to create category: ${result.message || 'Server returned error'}`);
        return;
      }
      
      // Wait a brief moment to ensure database commit is processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reload categories from server to get the latest data with fresh cache busting
      try {
        const token = localStorage.getItem('admin_token');
        const reloadResp = await fetch(`/api/admin/content/categories?_t=${Date.now()}&_nocache=${Math.random()}`, {
          method: 'GET',
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const reloadData = await reloadResp.json();
        if (reloadData.success && reloadData.categories) {
          const reloadedCategories = reloadData.categories.map((cat: any) => ({
            id: String(cat.id),
            name: cat.name,
            description: cat.description || '',
            isVisible: Boolean(cat.isVisible),
            createdAt: cat.created_at ? new Date(cat.created_at) : new Date(),
            updatedAt: cat.updated_at ? new Date(cat.updated_at) : new Date()
          }));
          setCategories(reloadedCategories);
          saveToHistory(products, reloadedCategories);
          // Find the created category (might have different ID if server generated one)
          const createdCat = reloadedCategories.find((c: ProductCategory) => c.id === newCategory.id || c.name === newCategory.name) || reloadedCategories[reloadedCategories.length - 1];
          if (createdCat) {
            setEditingCategory(createdCat.id);
          }
          console.log('[Add Category] Successfully created and reloaded category:', createdCat?.id || newCategory.id);
          return;
        }
      } catch (reloadError) {
        console.error('[Add Category] Error reloading categories after creation:', reloadError);
      }
      
      // Fallback: add to local state if reload fails
      const optimistic = [...categories, newCategory];
      setCategories(optimistic);
      saveToHistory(products, optimistic);
      setEditingCategory(newCategory.id);
      
      console.log('[Add Category] Successfully created category (using optimistic update):', newCategory.id);
    } catch (error) {
      console.error('[Add Category] Error creating category:', error);
      alert('Failed to create category. Please try again.');
    }
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
      const token = localStorage.getItem('admin_token');
      const resp = await fetch(`/api/admin/content/products?_t=${Date.now()}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
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
    // Navigate to the dedicated edit page (reuse creation page in edit mode)
    // Add timestamp to force page reload and fresh data fetch
    router.push(`/admin/content/store/product-creation?id=${encodeURIComponent(productId)}&_t=${Date.now()}`);
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
      
      // Get admin token and include in Authorization header
      const token = localStorage.getItem('admin_token');
      const resp = await fetch(url, {
        method: 'DELETE',
        cache: 'no-store',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
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
        await fetch(`/api/admin/content/categories?id=${encodeURIComponent(id)}&_t=${Date.now()}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      }

      // Updates
      for (const [id, updates] of Object.entries(pendingCategoryUpdates)) {
        const current = categories.find(c => c.id === id);
        if (!current) continue;
        const token = localStorage.getItem('admin_token');
        console.log('[Save Changes] Updating category:', id, updates);
        const resp = await fetch(`/api/admin/content/categories?_t=${Date.now()}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            id,
            name: updates.name ?? current.name,
            description: updates.description ?? current.description ?? '',
            isVisible: typeof updates.isVisible === 'boolean' ? updates.isVisible : current.isVisible
          }),
          cache: 'no-store'
        });
        
        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({ message: 'Unknown error' }));
          console.error('[Save Changes] Failed to update category:', id, errorData);
          throw new Error(`Failed to update category: ${errorData.message || 'Unknown error'}`);
        }
        
        const result = await resp.json();
        if (!result.success) {
          console.error('[Save Changes] Category update returned success=false:', id, result);
          throw new Error(`Failed to update category: ${result.message || 'Server returned error'}`);
        }
        
        console.log('[Save Changes] Successfully updated category:', id);
      }

      // Creates
      for (const cat of pendingCategoryCreates) {
        const token = localStorage.getItem('admin_token');
        console.log('[Save Changes] Creating category:', cat);
        const resp = await fetch(`/api/admin/content/categories?_t=${Date.now()}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            id: cat.id,
            name: cat.name,
            description: cat.description ?? '',
            isVisible: cat.isVisible
          }),
          cache: 'no-store'
        });
        
        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({ message: 'Unknown error' }));
          console.error('[Save Changes] Failed to create category:', cat.id, errorData);
          throw new Error(`Failed to create category "${cat.name}": ${errorData.message || 'Unknown error'}`);
        }
        
        const result = await resp.json();
        if (!result.success) {
          console.error('[Save Changes] Category creation returned success=false:', cat.id, result);
          throw new Error(`Failed to create category "${cat.name}": ${result.message || 'Server returned error'}`);
        }
        
        console.log('[Save Changes] Successfully created category:', cat.id, result);
      }

      // 2) Persist new products (the editor already stages only creates here)
      // Create any locally-added products (id starts with 'product_') via admin API
      const newProducts = products.filter(p => String(p.id).startsWith('product_'));
      for (const p of newProducts) {
        const token = localStorage.getItem('admin_token');
        const resp = await fetch(`/api/admin/content/products?_t=${Date.now()}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
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

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Filter by location (superadmin only)
    if ((currentUser?.type === 'superadmin' || currentUser?.role === 'superadmin')) {
      if (selectedStateName !== 'All') {
        filtered = filtered.filter(product => {
          const productState = (product as any).state_name || product.state_id || product.added_by_name; // eslint-disable-line @typescript-eslint/no-explicit-any
          if (!productState) return false;
          return String(productState).toLowerCase().includes(selectedStateName.toLowerCase());
        });
      }
      
      if (selectedDistrictName !== 'All') {
        filtered = filtered.filter(product => {
          const productDistrict = (product as any).district_name || product.district_id || product.added_by_name; // eslint-disable-line @typescript-eslint/no-explicit-any
          if (!productDistrict) return false;
          return String(productDistrict).toLowerCase().includes(selectedDistrictName.toLowerCase());
        });
      }
    }

    // Text search
    if (productSearch.trim() !== '') {
      const q = productSearch.toLowerCase();
      filtered = filtered.filter(product => {
        const inName = product.name.toLowerCase().includes(q);
        const inDesc = product.description.toLowerCase().includes(q);
        const inCategory = product.category.toLowerCase().includes(q);
        const inTags = (product.tags || []).some(tag => String(tag).toLowerCase().includes(q));
        return inName || inDesc || inCategory || inTags;
      });
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (productsSortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (productsSortBy === 'price') {
        comparison = a.price - b.price;
      } else if (productsSortBy === 'stock') {
        comparison = a.stock - b.stock;
      } else if (productsSortBy === 'updatedAt') {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        comparison = aTime - bTime;
      }
      return productsSortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [
    products,
    selectedCategory,
    currentUser,
    selectedStateName,
    selectedDistrictName,
    productSearch,
    productsSortBy,
    productsSortOrder
  ]);

  const totalProductsPages = Math.ceil(
    filteredAndSortedProducts.length === 0 ? 1 : filteredAndSortedProducts.length / productsPerPage
  );

  const paginatedProducts = useMemo(() => {
    const startIndex = (productsPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, productsPage, productsPerPage]);

  // Reset to first page when filters/sort/search change
  useEffect(() => {
    setProductsPage(1);
  }, [selectedCategory, selectedStateName, selectedDistrictName, productSearch, productsSortBy, productsSortOrder]);

  // Optimize category counts with memoization
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(product => {
      const catId = product.category || 'uncategorized';
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter and paginate categories
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) {
      return categories;
    }
    const search = categorySearch.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(search) ||
      (cat.description || '').toLowerCase().includes(search)
    );
  }, [categories, categorySearch]);

  const totalCategoriesPages = Math.ceil(
    filteredCategories.length === 0 ? 1 : filteredCategories.length / categoriesPerPage
  );

  const paginatedCategories = useMemo(() => {
    const startIndex = (categoriesPage - 1) * categoriesPerPage;
    const endIndex = startIndex + categoriesPerPage;
    return filteredCategories.slice(startIndex, endIndex);
  }, [filteredCategories, categoriesPage, categoriesPerPage]);

  // Reset categories page when search changes
  useEffect(() => {
    setCategoriesPage(1);
  }, [categorySearch]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-full flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 border-b bg-white">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="cursor-pointer hover:bg-gray-50 flex-shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{t('admin.store.products.back') || 'Back'}</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words leading-tight">{t('admin.store.products.title')}</h1>
            <p className="text-xs sm:text-sm text-gray-600 break-words">{t('admin.store.products.description') || 'Manage your product catalog'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="outline"
            size="sm"
            className="lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            onClick={saveChanges}
            disabled={saveStatus === 'saving'}
            className="cursor-pointer hover:bg-blue-600 disabled:cursor-not-allowed text-xs sm:text-sm flex-1 sm:flex-initial"
            size="sm"
          >
            <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="truncate">{saveStatus === 'saving' ? t('admin.store.products.saving') : t('admin.store.products.saveChanges')}</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="h-full flex relative">
          {/* Sidebar - Categories */}
          <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 lg:z-auto w-72 sm:w-80 border-r bg-gray-50 p-3 sm:p-4 overflow-y-auto transition-transform duration-300 ease-in-out lg:transition-none shadow-lg lg:shadow-none`}>
            <div className="lg:hidden flex items-center justify-between mb-4 pb-4 border-b">
              <h3 className="text-base font-semibold">Categories</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold truncate">{t('admin.store.products.categories')}</h3>
                <span className="text-xs text-gray-500 flex-shrink-0">({categories.length})</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setCategoriesCompactMode(!categoriesCompactMode)}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                  title={categoriesCompactMode ? 'Normal View' : 'Compact View'}
                >
                  {categoriesCompactMode ? <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
                <Button
                  onClick={() => setCreatingCategoryDraft({ id: `category_${Date.now()}`, name: '', description: '', isVisible: true })}
                  size="sm"
                  className="cursor-pointer hover:bg-blue-600 h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
            
            {/* Category Search */}
            <div className="relative mb-2 sm:mb-3">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <Input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="pl-8 sm:pl-10 h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            
            <div className={categoriesCompactMode ? 'space-y-1' : 'space-y-2'}>
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size={categoriesCompactMode ? 'sm' : 'sm'}
                onClick={() => setSelectedCategory('all')}
                className={`w-full justify-start cursor-pointer hover:bg-gray-100 ${categoriesCompactMode ? 'h-8 text-xs' : ''}`}
              >
                {t('admin.store.products.allProducts')} ({products.length})
              </Button>
              {paginatedCategories.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-500">
                  {categorySearch ? 'No categories found' : 'No categories'}
                </div>
              ) : (
                <>
                  {paginatedCategories.map(category => (
                    <div key={category.id} className={`flex items-center space-x-2 ${categoriesCompactMode ? 'gap-1' : 'gap-2'}`}>
                      <Button
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        size={categoriesCompactMode ? 'sm' : 'sm'}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex-1 justify-start cursor-pointer hover:bg-gray-100 ${categoriesCompactMode ? 'h-8 text-xs' : ''}`}
                      >
                        <span className="truncate">{category.name}</span> ({categoryCounts[category.id] || 0})
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
                        className={`cursor-pointer hover:bg-gray-100 ${categoriesCompactMode ? 'h-8 w-8 p-0' : ''}`}
                      >
                        <Edit2 className={categoriesCompactMode ? 'h-3 w-3' : 'h-3 w-3'} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCategory(category.id)}
                        className={`cursor-pointer hover:bg-red-100 text-red-600 ${categoriesCompactMode ? 'h-8 w-8 p-0' : ''}`}
                      >
                        <Trash2 className={categoriesCompactMode ? 'h-3 w-3' : 'h-3 w-3'} />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Category Pagination */}
                  {totalCategoriesPages > 1 && (
                    <div className={`${categoriesCompactMode ? 'p-2' : 'p-3'} border-t border-gray-200 bg-gray-50 mt-3`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-gray-600">
                          Page {categoriesPage} of {totalCategoriesPages}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCategoriesPage(1)}
                            disabled={categoriesPage === 1}
                            className="h-7 w-7 p-0"
                            title="First page"
                          >
                            <ChevronsLeftIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCategoriesPage(prev => Math.max(1, prev - 1))}
                            disabled={categoriesPage === 1}
                            className="h-7 w-7 p-0"
                            title="Previous page"
                          >
                            <ChevronLeftIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCategoriesPage(prev => Math.min(totalCategoriesPages, prev + 1))}
                            disabled={categoriesPage === totalCategoriesPages}
                            className="h-7 w-7 p-0"
                            title="Next page"
                          >
                            <ChevronRightIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCategoriesPage(totalCategoriesPages)}
                            disabled={categoriesPage === totalCategoriesPages}
                            className="h-7 w-7 p-0"
                            title="Last page"
                          >
                            <ChevronsRightIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Location Filters (Superadmin only) */}
            {(currentUser?.type === 'superadmin' || currentUser?.role === 'superadmin') && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4">{t('admin.store.products.locationFilters')}</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">{t('admin.store.sellers.state')}</label>
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
                      <SelectTrigger className="w-full text-xs sm:text-sm h-8 sm:h-9">
                        <SelectValue placeholder={t('admin.store.sellers.allStates')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('admin.store.sellers.allStates')}</SelectItem>
                        {stateOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">{t('admin.store.sellers.district')}</label>
                    <Select
                      value={selectedDistrictName || 'All'}
                      onValueChange={(value) => setSelectedDistrictName(value)}
                      disabled={!selectedStateId}
                    >
                      <SelectTrigger className="w-full text-xs sm:text-sm h-8 sm:h-9">
                        <SelectValue placeholder={t('admin.store.sellers.allDistricts')} />
                      </SelectTrigger>
                      <SelectContent>
                        {districtOptions.length === 0 ? (
                          <SelectItem value="All">{t('admin.store.sellers.allDistricts')}</SelectItem>
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
                    className="w-full text-xs sm:text-sm"
                  >
                    {t('admin.store.products.clearFilters')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-b bg-white">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:space-x-0">
                <Button
                  onClick={startAddingProduct}
                  className="cursor-pointer hover:bg-blue-600 text-xs sm:text-sm flex-1 sm:flex-initial"
                  size="sm"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="truncate">{t('admin.store.products.addProduct')}</span>
                </Button>
                <Button
                  onClick={() => router.push('/admin/content/store/sellers')}
                  variant="outline"
                  className="cursor-pointer hover:bg-green-50 hover:border-green-300 text-xs sm:text-sm flex-1 sm:flex-initial"
                  size="sm"
                >
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline truncate">{t('admin.store.products.manageSellers')}</span>
                  <span className="sm:hidden">Sellers</span>
                </Button>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="cursor-pointer hover:bg-gray-100 h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="cursor-pointer hover:bg-gray-100 h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Search + sort row */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial min-w-[150px] sm:min-w-0">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <Input
                      type="text"
                      placeholder={t('admin.store.products.searchPlaceholder') || 'Search products...'}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-7 pr-2 h-8 text-xs w-full sm:w-48"
                    />
                  </div>

                  <Select
                    value={productsSortBy}
                    onValueChange={(value) => setProductsSortBy(value as typeof productsSortBy)}
                  >
                    <SelectTrigger className="h-8 text-xs w-full sm:w-28 md:w-32">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updatedAt">{t('admin.store.products.recentlyUpdated')}</SelectItem>
                      <SelectItem value="name">{t('admin.store.products.sortByName')}</SelectItem>
                      <SelectItem value="price">{t('admin.store.products.sortByPrice')}</SelectItem>
                      <SelectItem value="stock">{t('admin.store.products.sortByStock')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() =>
                      setProductsSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                    }
                    title={productsSortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
                  >
                    {productsSortOrder === 'asc' ? (
                      <SortAsc className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <SortDesc className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => setProductsCompactMode((prev) => !prev)}
                    title={productsCompactMode ? 'Normal view' : 'Compact view'}
                  >
                    {productsCompactMode ? (
                      <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </Button>

                  <Select
                    value={productsPerPage.toString()}
                    onValueChange={(value) => {
                      setProductsPerPage(parseInt(value));
                      setProductsPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-16 sm:w-20 flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">{t('admin.store.products.itemsPerPage').replace('{count}', '12')}</SelectItem>
                      <SelectItem value="24">{t('admin.store.products.itemsPerPage').replace('{count}', '24')}</SelectItem>
                      <SelectItem value="48">{t('admin.store.products.itemsPerPage').replace('{count}', '48')}</SelectItem>
                      <SelectItem value="96">{t('admin.store.products.itemsPerPage').replace('{count}', '96')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Counts + filters row */}
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                  <span className="break-words">
                    {t('admin.store.products.showingProducts').replace('{showing}', String(paginatedProducts.length)).replace('{total}', String(filteredAndSortedProducts.length))}
                  </span>
                  
                  {(currentUser?.type === 'superadmin' || currentUser?.role === 'superadmin') &&
                    (selectedStateName !== 'All' || selectedDistrictName !== 'All') && (
                      <div className="flex items-center flex-wrap gap-1">
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
                    <Badge variant="outline" className="text-green-600 text-xs">
                      Saved
                    </Badge>
                  )}
                  {saveStatus === 'error' && (
                    <Badge variant="outline" className="text-red-600 text-xs">
                      Error
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4">
              {viewMode === 'grid' ? (
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                    productsCompactMode ? 'gap-2 sm:gap-3' : 'gap-3 sm:gap-4'
                  }`}
                >
                  {paginatedProducts.map(product => (
                    <Card key={product.id} className="overflow-hidden w-full">
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
                            <div className="text-center text-gray-400 p-2">
                              <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-1 sm:mb-2" />
                              <p className="text-xs sm:text-sm">Click to upload</p>
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
                        
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              const input = document.getElementById(`file-upload-${product.id}`) as HTMLInputElement;
                              input?.click();
                            }}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 cursor-pointer hover:bg-blue-100"
                          >
                            <Upload className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingProduct(product.id);
                            }}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 cursor-pointer hover:bg-gray-100"
                          >
                            <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProduct(product.id);
                            }}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 cursor-pointer hover:bg-red-100 text-red-600"
                          >
                            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <CardContent className="p-2 sm:p-3">
                        <h3 className="font-semibold text-xs sm:text-sm mb-1 truncate">{product.name}</h3>
                        <p className="text-xs text-gray-600 mb-1.5 sm:mb-2 line-clamp-2 break-words">{product.description}</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm font-bold text-green-600 truncate">
                            ₹{product.price}
                          </span>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveProduct(product.id, 'up')}
                              className="h-5 w-5 sm:h-6 sm:w-6 p-0 cursor-pointer hover:bg-gray-100"
                            >
                              <ArrowLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveProduct(product.id, 'down')}
                              className="h-5 w-5 sm:h-6 sm:w-6 p-0 cursor-pointer hover:bg-gray-100"
                            >
                              <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className={productsCompactMode ? 'space-y-1.5' : 'space-y-2 sm:space-y-3'}>
                  {paginatedProducts.map(product => (
                    <Card key={product.id} className="w-full overflow-hidden">
                      <CardContent className="p-2.5 sm:p-3 md:p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
                          <div
                            className="w-full sm:w-16 sm:h-16 h-32 bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors flex-shrink-0 rounded"
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
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
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
                          
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <h3 className={`font-semibold text-sm sm:text-base mb-1 break-words ${productsCompactMode ? 'text-xs sm:text-sm' : ''}`}>
                              {product.name}
                            </h3>
                            <p
                              className={`text-gray-600 line-clamp-2 break-words mb-2 ${
                                productsCompactMode ? 'text-xs' : 'text-xs sm:text-sm'
                              }`}
                            >
                              {product.description}
                            </p>
                            <div
                              className={`flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-4 ${
                                productsCompactMode ? 'mt-1' : 'mt-2'
                              }`}
                            >
                              <span className="text-xs sm:text-sm font-bold text-green-600">
                                ₹{product.price}
                              </span>
                              <span className="text-xs text-gray-500">
                                Stock: {product.stock}
                              </span>
                              <Badge variant={product.isVisible ? 'default' : 'secondary'} className="text-xs">
                                {product.isVisible ? 'Visible' : 'Hidden'}
                              </Badge>
                              {product.isFeatured && (
                                <Badge variant="outline" className="text-yellow-600 text-xs">
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const input = document.getElementById(`file-upload-list-${product.id}`) as HTMLInputElement;
                                input?.click();
                              }}
                              className="cursor-pointer hover:bg-blue-100 h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditingProduct(product.id)}
                              className="cursor-pointer hover:bg-gray-100 h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteProduct(product.id)}
                              className="cursor-pointer hover:bg-red-100 text-red-600 h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveProduct(product.id, 'up')}
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 cursor-pointer hover:bg-gray-100"
                              >
                                <ArrowLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveProduct(product.id, 'down')}
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 cursor-pointer hover:bg-gray-100"
                              >
                                <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-bold break-words flex-1 min-w-0">{t('admin.store.products.editProduct')}</h2>
              <Button
                variant="outline"
                onClick={cancelEditingProduct}
                className="cursor-pointer hover:bg-gray-100 h-8 w-8 p-0 flex-shrink-0"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {(() => {
              const product = editingProductData;
              if (!product) return null;
              
              return (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1">Name</label>
                      <Input
                        value={product.name}
                        onChange={(e) => setEditingProductData({ ...product, name: e.target.value })}
                        className="cursor-pointer text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1">Category</label>
                      <Select
                        value={product.category || ''}
                        onValueChange={(value) => setEditingProductData({ ...product, category: value })}
                      >
                        <SelectTrigger className="w-full text-sm">
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
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium mb-1">Seller</label>
                      <Select
                        value={product.seller_id || 'none'}
                        onValueChange={(value) => setEditingProductData({ ...product, seller_id: value === 'none' ? undefined : value })}
                      >
                        <SelectTrigger className="w-full text-sm">
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
                        <p className="text-xs text-gray-500 mt-1 break-words">
                          No sellers available. <a href="/admin/content/store/sellers" className="text-blue-600 hover:underline">Add sellers first</a>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1">Description</label>
                    <Textarea
                      value={product.description || ''}
                      onChange={(e) => setEditingProductData({ ...product, description: e.target.value })}
                      rows={3}
                      className="cursor-pointer text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1">Price (₹)</label>
                      <Input
                        type="number"
                        min={0}
                        value={product.price}
                        onChange={(e) => setEditingProductData({ ...product, price: Math.max(0, Number(e.target.value)) })}
                        className="cursor-pointer text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1">Original Price (₹)</label>
                      <Input
                        type="number"
                        min={0}
                        value={product.originalPrice || 0}
                        onChange={(e) => setEditingProductData({ ...product, originalPrice: Math.max(0, Number(e.target.value)) })}
                        className="cursor-pointer text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1">Stock</label>
                      <Input
                        type="number"
                        value={product.stock}
                        onChange={(e) => setEditingProductData({ ...product, stock: Number(e.target.value) })}
                        className="cursor-pointer text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1">Thumbnail Image</label>
                      <div className="space-y-2 sm:space-y-3">
                        {/* Image Type Selection */}
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                          <label className="flex items-center cursor-pointer text-xs sm:text-sm">
                            <input
                              type="radio"
                              name="editingImageType"
                              value="file"
                              checked={editingProductImageType === 'file'}
                              onChange={() => setEditingProductImageType('file')}
                              className="mr-1.5 sm:mr-2"
                            />
                            Upload File
                          </label>
                          <label className="flex items-center cursor-pointer text-xs sm:text-sm">
                            <input
                              type="radio"
                              name="editingImageType"
                              value="url"
                              checked={editingProductImageType === 'url'}
                              onChange={() => setEditingProductImageType('url')}
                              className="mr-1.5 sm:mr-2"
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
                              className="w-full p-1.5 sm:p-2 border rounded-md cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
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
                            className="cursor-pointer text-sm"
                          />
                        )}
                        
                        {/* Supporting Images manager */}
                        <div className="mt-3 sm:mt-4">
                          <label className="block text-xs sm:text-sm font-medium mb-1">Supporting Images (up to 3)</label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={addEditingGalleryFiles}
                            className="w-full p-1.5 sm:p-2 border rounded-md cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                          />
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(editingProductImages || []).filter(u => u !== editingProductData?.imageUrl).map((url) => (
                              <div key={url} className="relative">
                                <img src={url} alt="" className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border" />
                                <button
                                  type="button"
                                  onClick={() => removeEditingGalleryImage(url)}
                                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs hover:bg-red-600"
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
                      <label className="block text-xs sm:text-sm font-medium mb-1">Tags (comma-separated)</label>
                      <Input
                        value={editingProductTagsInput}
                        onChange={(e) => handleEditingTagsInputChange(e.target.value)}
                        onKeyDown={handleEditingTagsKeyDown}
                        placeholder="tag1, tag2, tag3"
                        className="cursor-pointer text-sm"
                      />
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full break-words"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <label className="flex items-center cursor-pointer text-xs sm:text-sm">
                        <input
                          type="checkbox"
                          checked={product.isVisible}
                          onChange={(e) => setEditingProductData({ ...product, isVisible: e.target.checked })}
                          className="mr-1.5 sm:mr-2 cursor-pointer"
                        />
                        Visible
                      </label>
                      <label className="flex items-center cursor-pointer text-xs sm:text-sm">
                        <input
                          type="checkbox"
                          checked={product.isFeatured}
                          onChange={(e) => setEditingProductData({ ...product, isFeatured: e.target.checked })}
                          className="mr-1.5 sm:mr-2 cursor-pointer"
                        />
                        Featured
                      </label>
                    </div>
                  
                  {/* Save/Cancel Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={cancelEditingProduct}
                      disabled={saveStatus === 'saving'}
                      className="w-full sm:w-auto text-sm"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveEditingProduct}
                      disabled={saveStatus === 'saving'}
                      className="w-full sm:w-auto min-w-[100px] text-sm"
                      size="sm"
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          Saving...
                        </>
                      ) : saveStatus === 'saved' ? (
                        <>
                          <CheckCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-bold break-words flex-1 min-w-0">Add New Product</h2>
              <Button
                variant="outline"
                onClick={cancelAddingProduct}
                className="cursor-pointer hover:bg-gray-100 h-8 w-8 p-0 flex-shrink-0"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Name *</label>
                  <Input
                    value={newProductData.name || ''}
                    onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                    placeholder="Enter product name"
                    className="cursor-pointer text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Category</label>
                  <select
                    value={newProductData.category || ''}
                    onChange={(e) => setNewProductData({ ...newProductData, category: e.target.value })}
                    className="w-full p-1.5 sm:p-2 border rounded-md cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                <label className="block text-xs sm:text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={newProductData.description || ''}
                  onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                  rows={3}
                  placeholder="Enter product description"
                  className="cursor-pointer text-sm"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Price (₹) *</label>
                  <Input
                    type="number"
                    min={0}
                    value={newProductData.price || 0}
                    onChange={(e) => setNewProductData({ ...newProductData, price: Math.max(0, Number(e.target.value)) })}
                    placeholder="0"
                    className="cursor-pointer text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Original Price (₹)</label>
                  <Input
                    type="number"
                    min={0}
                    value={newProductData.originalPrice || 0}
                    onChange={(e) => setNewProductData({ ...newProductData, originalPrice: Math.max(0, Number(e.target.value)) })}
                    placeholder="0"
                    className="cursor-pointer text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Stock</label>
                  <Input
                    type="number"
                    value={newProductData.stock || 10}
                    onChange={(e) => setNewProductData({ ...newProductData, stock: Number(e.target.value) })}
                    placeholder="10"
                    className="cursor-pointer text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Thumbnail Image</label>
                  <div className="space-y-2 sm:space-y-3">
                    {/* Image Type Selection */}
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      <label className="flex items-center cursor-pointer text-xs sm:text-sm">
                        <input
                          type="radio"
                          name="imageType"
                          value="file"
                          checked={newProductImageType === 'file'}
                          onChange={() => setNewProductImageType('file')}
                          className="mr-1.5 sm:mr-2"
                        />
                        Upload File
                      </label>
                      <label className="flex items-center cursor-pointer text-xs sm:text-sm">
                        <input
                          type="radio"
                          name="imageType"
                          value="url"
                          checked={newProductImageType === 'url'}
                          onChange={() => setNewProductImageType('url')}
                          className="mr-1.5 sm:mr-2"
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
                          className="w-full p-1.5 sm:p-2 border rounded-md cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
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
                        className="cursor-pointer text-sm"
                      />
                    )}
                    
                    {/* Image Preview */}
                    {newProductImages.length > 0 && (
                      <div className="mt-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {newProductImages.map((image, index) => (
                            <div key={index} className="relative">
                              <img 
                                src={image} 
                                alt={`Preview ${index + 1}`} 
                                className="w-full h-16 sm:w-16 sm:h-16 object-cover rounded border"
                              />
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs hover:bg-red-600"
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
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border"
                        />
                        <p className="text-xs text-gray-500 mt-1">Image preview</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Supporting Images */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Supporting Images (up to 3)</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImageUpload}
                      className="w-full p-1.5 sm:p-2 border rounded-md cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                    />
                    <p className="text-xs text-gray-500">These will appear as additional gallery images.</p>
                    {newProductImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {newProductImages.map((image, index) => (
                          <img key={index} src={image} alt="" className="w-full h-16 sm:w-16 sm:h-16 object-cover rounded border" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium mb-1">Tags (comma-separated)</label>
                  <Input
                    value={newProductTagsInput}
                    onChange={(e) => handleTagsInputChange(e.target.value)}
                    onKeyDown={handleTagsKeyDown}
                    placeholder="tag1, tag2, tag3"
                    className="cursor-pointer text-sm"
                  />
                  {newProductData.tags && newProductData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newProductData.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full break-words"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <label className="flex items-center cursor-pointer text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={newProductData.isVisible !== false}
                    onChange={(e) => setNewProductData({ ...newProductData, isVisible: e.target.checked })}
                    className="mr-1.5 sm:mr-2 cursor-pointer"
                  />
                  Visible
                </label>
                <label className="flex items-center cursor-pointer text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={newProductData.isFeatured || false}
                    onChange={(e) => setNewProductData({ ...newProductData, isFeatured: e.target.checked })}
                    className="mr-1.5 sm:mr-2 cursor-pointer"
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
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={cancelAddingProduct}
                  disabled={saveStatus === 'saving'}
                  className="w-full sm:w-auto text-sm"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveNewProduct}
                  disabled={saveStatus === 'saving' || !newProductData.name || !newProductData.price}
                  className="w-full sm:w-auto min-w-[100px] text-sm"
                  size="sm"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      <span className="truncate">{newProductImageFiles.length > 0 ? 'Uploading images...' : 'Creating...'}</span>
                    </>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <CheckCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
