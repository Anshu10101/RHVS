'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProductCreationPage() {
	const router = useRouter();
  const searchParams = useSearchParams();
  // detect edit mode via URL ?id= - use searchParams to detect URL changes
  const editId = searchParams?.get('id') || '';
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [price, setPrice] = useState<number>(0);
	const [originalPrice, setOriginalPrice] = useState<number>(0);
	const [category, setCategory] = useState('');
	const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
	const [sellers, setSellers] = useState<Array<{ id: string; name: string; business_name?: string; district: string; state: string }>>([]);
	const [sellerId, setSellerId] = useState('');
	const [stock, setStock] = useState<number>(10);
	const [isVisible, setIsVisible] = useState<boolean>(true);
	const [isFeatured, setIsFeatured] = useState<boolean>(false);
	const [tagsInput, setTagsInput] = useState('');
	const [features, setFeatures] = useState<string[]>(['']);
	const [specs, setSpecs] = useState<Record<string, string>>({});
	const [thumbType, setThumbType] = useState<'file' | 'url'>('file');
	const [thumbFile, setThumbFile] = useState<File | null>(null);
	const [thumbUrl, setThumbUrl] = useState('');
	const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
	const [supportingPreviews, setSupportingPreviews] = useState<string[]>([]);
	const [existingSupportingUrls, setExistingSupportingUrls] = useState<string[]>([]);
	const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

	const uploadImage = async (file: File, key: string) => {
		// Log file info before upload
		console.log('Uploading file:', {
			name: file.name,
			type: file.type,
			size: file.size,
			sizeKB: (file.size / 1024).toFixed(2),
			sizeMB: (file.size / (1024 * 1024)).toFixed(2)
		});
		
		const form = new FormData();
		form.append('file', file);
		form.append('productId', key);
		const token = localStorage.getItem('admin_token');
		const res = await fetch('/api/upload/store', { 
      method: 'POST', 
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: form 
    });
		if (!res.ok) {
			const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
			const errorMessage = errorData.error || errorData.message || `Upload failed with status ${res.status}`;
			console.error('Upload error:', errorMessage, errorData);
			throw new Error(errorMessage);
		}
		const data = await res.json();
		if (!data.success || !data.url) {
			throw new Error(data.error || 'Upload succeeded but no URL returned');
		}
		return data.url as string;
	};

  useEffect(() => {
		(async () => {
			try {
				// Load categories
				const token = localStorage.getItem('admin_token');
				const res = await fetch(`/api/content/store/categories?_t=${Date.now()}`, { 
					cache: 'no-store',
					headers: token ? { 'Authorization': `Bearer ${token}` } : {}
				});
				const data = await res.json();
				if (data?.success && Array.isArray(data.categories)) {
					setCategories(data.categories.map((c: { id: number; name: string }) => ({ id: String(c.id), name: c.name })));
					if (!category && data.categories.length) setCategory(String(data.categories[0].id));
				}
				
				// Load sellers (reuse token from above)
				const sellersRes = await fetch(`/api/admin/sellers?_t=${Date.now()}`, { 
					cache: 'no-store',
					headers: token ? { 'Authorization': `Bearer ${token}` } : {}
				});
				const sellersData = await sellersRes.json();
				if (sellersData?.success && Array.isArray(sellersData.data)) {
					setSellers(sellersData.data.map((s: { id: number; name: string; business_name: string; district: string; state: string }) => ({ 
						id: s.id, 
						name: s.name, 
						business_name: s.business_name,
						district: s.district,
						state: s.state
					})));
				}
      } catch (e) {
				console.error('Failed to load data', e);
			}
		})();
	}, [category]);

  // Load existing product in edit mode - reload whenever editId or URL changes
  useEffect(() => {
    if (!editId) {
      // Reset form when not in edit mode
      setName('');
      setDescription('');
      setPrice(0);
      setOriginalPrice(0);
      setCategory('');
      setSellerId('');
      setStock(10);
      setIsVisible(true);
      setIsFeatured(false);
      setTagsInput('');
      setFeatures(['']);
      setSpecs({});
      setThumbType('file');
      setThumbFile(null);
      setThumbUrl('');
      setSupportingFiles([]);
      setSupportingPreviews([]);
      setExistingSupportingUrls([]);
      return;
    }
    (async () => {
      try {
        const token = localStorage.getItem('admin_token');
        // Always use fresh timestamp to bypass cache
        const timestamp = Date.now();
        const res = await fetch(`/api/products/${encodeURIComponent(editId)}?_t=${timestamp}`, { 
          cache: 'no-store',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && data.product) {
          const p = data.product as Record<string, unknown>;
          setName((p.name as string) || '');
          setDescription((p.description as string) || '');
          setPrice(Number(p.price || 0));
          setOriginalPrice(p.originalPrice != null ? Number(p.originalPrice) : 0);
          setCategory((p.category as string) || (p.categoryId as string) || '');
          setSellerId((p.seller_id as string) || (p.sellerId as string) || '');
          setStock(typeof p.stock === 'number' ? p.stock : 0);
          setIsVisible(Boolean(p.isVisible ?? true));
          setIsFeatured(Boolean(p.isFeatured ?? false));
          setTagsInput(Array.isArray(p.tags) ? p.tags.join(', ') : '');
          setFeatures(Array.isArray(p.features) ? p.features : ['']);
          setSpecs((p.specifications as Record<string, string>) || {});
          // images - always reload fresh with cache-busting
          const imgs: string[] = Array.isArray(p.images) ? p.images : (p.imageUrl ? [p.imageUrl] : []);
          const main = imgs[0] || '';
          if (main) {
            setThumbType('url');
            // Strip any existing cache-busting params before storing
            let cleanMain = main;
            try {
              const isAbsolute = main.startsWith('http://') || main.startsWith('https://');
              const urlObj = isAbsolute ? new URL(main) : new URL(main, window.location.origin);
              urlObj.searchParams.delete('_t');
              urlObj.searchParams.delete('v');
              // Preserve original format (relative or absolute)
              cleanMain = isAbsolute ? urlObj.toString() : urlObj.pathname + (urlObj.search ? urlObj.search : '');
            } catch {
              // If URL parsing fails, use original (remove query params as fallback)
              cleanMain = main.split('?')[0];
            }
            setThumbUrl(cleanMain); // Store clean URL without cache-busting
          } else {
            setThumbType('file');
            setThumbUrl('');
          }
          const supporting = imgs.slice(1).map(url => {
            // Strip cache-busting params from supporting images too
            try {
              const isAbsolute = url.startsWith('http://') || url.startsWith('https://');
              const urlObj = isAbsolute ? new URL(url) : new URL(url, window.location.origin);
              urlObj.searchParams.delete('_t');
              urlObj.searchParams.delete('v');
              // Preserve original format (relative or absolute)
              return isAbsolute ? urlObj.toString() : urlObj.pathname + (urlObj.search ? urlObj.search : '');
            } catch {
              return url.split('?')[0]; // At least remove query params
            }
          });
          setExistingSupportingUrls(supporting);
          setSupportingPreviews(supporting);
          setSupportingFiles([]); // Clear any pending file uploads
        }
      } catch (e) {
        console.error('Failed to load product for edit', e);
      }
    })();
  }, [editId, searchParams?.toString()]); // Reload when editId or search params change

	const onPickSupporting = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		// Merge existing URLs with new files, but limit total to 3
		const existingCount = existingSupportingUrls.length;
		const maxNew = Math.max(0, 3 - existingCount);
		const newFiles = files.slice(0, maxNew);
		const limited = [...supportingFiles, ...newFiles];
		setSupportingFiles(limited);
		// Combine existing URL previews with new file previews
		const newPreviews = newFiles.map(f => URL.createObjectURL(f));
		setSupportingPreviews([...existingSupportingUrls, ...newPreviews]);
		// Clear the input so same file can be selected again
		e.target.value = '';
	};

	const create = async () => {
		if (!name || !price) return;
		setSaving('saving');
		try {
			let image_url = '';
			// Upload thumbnail first if file (with 1MB size validation)
			if (thumbType === 'file' && thumbFile) {
				const maxSize = 1 * 1024 * 1024; // 1MB
				if (thumbFile.size > maxSize) {
					const fileSizeMB = (thumbFile.size / (1024 * 1024)).toFixed(2);
					throw new Error(`Main image is ${fileSizeMB}MB. Maximum size is 1MB. Please compress or resize the image.`);
				}
				image_url = await uploadImage(thumbFile, `new_thumb_${Date.now()}`);
			} else if (thumbType === 'url' && thumbUrl) {
				// Strip cache-busting query parameters before saving
				try {
					const isAbsolute = thumbUrl.startsWith('http://') || thumbUrl.startsWith('https://');
					const urlObj = isAbsolute ? new URL(thumbUrl) : new URL(thumbUrl, window.location.origin);
					urlObj.searchParams.delete('_t');
					urlObj.searchParams.delete('v');
					// Preserve original format (relative or absolute)
					image_url = isAbsolute ? urlObj.toString() : urlObj.pathname + (urlObj.search ? urlObj.search : '');
				} catch {
					// If URL parsing fails, use original URL (shouldn't happen, but safe fallback)
					image_url = thumbUrl.split('?')[0]; // At least remove query params
				}
			}
			// Upload supporting (max 3) - preserve existing URLs, upload new files
			const gallery: string[] = [];
			// First add existing URLs that weren't replaced (strip cache-busting params)
			for (let i = 0; i < existingSupportingUrls.length && gallery.length < 3; i++) {
				let cleanUrl = existingSupportingUrls[i];
				// Strip cache-busting query parameters
				try {
					const isAbsolute = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://');
					const urlObj = isAbsolute ? new URL(cleanUrl) : new URL(cleanUrl, window.location.origin);
					urlObj.searchParams.delete('_t');
					urlObj.searchParams.delete('v');
					// Preserve original format (relative or absolute)
					cleanUrl = isAbsolute ? urlObj.toString() : urlObj.pathname + (urlObj.search ? urlObj.search : '');
				} catch {
					// If URL parsing fails, use original URL
					cleanUrl = existingSupportingUrls[i].split('?')[0]; // At least remove query params
				}
				gallery.push(cleanUrl);
			}
			// Then upload new files (with 1MB size validation)
			for (let i = 0; i < supportingFiles.length && gallery.length < 3; i++) {
				const file = supportingFiles[i];
				const maxSize = 1 * 1024 * 1024; // 1MB
				if (file.size > maxSize) {
					const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
					throw new Error(`Supporting image "${file.name}" is ${fileSizeMB}MB. Maximum size is 1MB. Please compress or resize the image.`);
				}
				const url = await uploadImage(file, `${editId || 'new'}_sup_${Date.now()}_${i}`);
				gallery.push(url);
			}
			// Ensure main first - when editing, always include existing images
			let finalImages: string[] = [];
			if (editId) {
				// When editing: include main image (new or existing) + existing supporting + new supporting
				const mainImg = image_url || thumbUrl || '';
				if (mainImg) {
					finalImages = [mainImg, ...gallery];
				} else {
					finalImages = gallery;
				}
			} else {
				// When creating: just use what we have
				finalImages = image_url ? [image_url, ...gallery] : gallery;
			}
			
      const body: Record<string, unknown> = {
        name,
        description,
        price,
        original_price: originalPrice || price,
        category: category || 'default',
        seller_id: sellerId === 'none' ? null : sellerId || null,
        image_url: image_url || thumbUrl || undefined,
        stock,
        is_featured: isFeatured,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        features: features.filter(f => f.trim() !== ''),
        specifications: specs,
        isVisible
      };
      
      // Always include images array - it will preserve existing images if unchanged
      body.images = finalImages;
      
      const token = localStorage.getItem('admin_token');
      const resp = await fetch(`/api/admin/content/products?_t=${Date.now()}`, {
        method: editId ? 'PUT' : 'POST',
        cache: 'no-store',
				headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editId ? { id: editId, ...body } : body)
			});
			
			if (!resp.ok) {
				const errorData = await resp.json().catch(() => ({ message: 'Unknown error' }));
				const errorMessage = errorData.message || `Failed to ${editId ? 'update' : 'create'} product (${resp.status})`;
				console.error('Product creation failed:', errorMessage, errorData);
				throw new Error(errorMessage);
			}
			
			setSaving('saved');
			// Reload product data to get updated image URLs
			if (editId) {
				try {
					const token = localStorage.getItem('admin_token');
					const refreshRes = await fetch(`/api/products/${encodeURIComponent(editId)}?_t=${Date.now()}`, { 
            cache: 'no-store',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
					if (refreshRes.ok) {
						const refreshData = await refreshRes.json();
						if (refreshData?.success && refreshData.product) {
							const p = refreshData.product as Record<string, unknown>;
							const imgs: string[] = Array.isArray(p.images) ? p.images : (p.imageUrl ? [p.imageUrl] : []);
							const main = imgs[0] || '';
							if (main) {
								// Strip cache-busting params before storing
								let cleanMain = main;
								try {
									const isAbsolute = main.startsWith('http://') || main.startsWith('https://');
									const urlObj = isAbsolute ? new URL(main) : new URL(main, window.location.origin);
									urlObj.searchParams.delete('_t');
									urlObj.searchParams.delete('v');
									// Preserve original format (relative or absolute)
									cleanMain = isAbsolute ? urlObj.toString() : urlObj.pathname + (urlObj.search ? urlObj.search : '');
								} catch {
									cleanMain = main.split('?')[0]; // At least remove query params
								}
								setThumbUrl(cleanMain);
								setThumbType('url');
							}
							const supporting = imgs.slice(1).map(url => {
								// Strip cache-busting params
								try {
									const isAbsolute = url.startsWith('http://') || url.startsWith('https://');
									const urlObj = isAbsolute ? new URL(url) : new URL(url, window.location.origin);
									urlObj.searchParams.delete('_t');
									urlObj.searchParams.delete('v');
									// Preserve original format (relative or absolute)
									return isAbsolute ? urlObj.toString() : urlObj.pathname + (urlObj.search ? urlObj.search : '');
								} catch {
									return url.split('?')[0]; // At least remove query params
								}
							});
							setExistingSupportingUrls(supporting);
							setSupportingPreviews(supporting);
							setSupportingFiles([]);
						}
					}
				} catch (e) {
					console.error('Failed to refresh product data', e);
				}
			}
			setTimeout(() => router.push('/admin/content/store'), 800);
		} catch (e) {
			console.error('Error creating/updating product:', e);
			const errorMessage = e instanceof Error ? e.message : 'Failed to save product';
			alert(errorMessage); // Show user-friendly error
			setSaving('error');
			setTimeout(() => setSaving('idle'), 2000);
		}
	};

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">{editId ? 'Edit Product' : 'Create Product'}</h1>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => router.push('/admin/content/store/sellers')}>
						Manage Sellers
					</Button>
					<Button variant="outline" onClick={() => router.back()}>Back</Button>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium mb-1">Name *</label>
					<Input value={name} onChange={e => setName(e.target.value)} />
				</div>
				<div>
					<label className="block text-sm font-medium mb-1">Category</label>
					{categories.length > 0 ? (
						<Select value={category} onValueChange={(v) => setCategory(v)}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select a category" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((c) => (
									<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Enter category (no categories found)" />
					)}
				</div>
				<div>
					<div className="flex items-center justify-between mb-1">
						<label className="block text-sm font-medium">Seller</label>
						<Button 
							variant="outline" 
							size="sm" 
							onClick={() => router.push('/admin/content/store/sellers')}
							className="text-xs"
						>
							+ Add Seller
						</Button>
					</div>
					{sellers.length > 0 ? (
						<Select value={sellerId} onValueChange={(v) => setSellerId(v)}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select a seller" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">No seller</SelectItem>
								{sellers.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name} {s.business_name && `(${s.business_name})`} - {s.district}, {s.state}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<div className="text-sm text-gray-500 border rounded p-3 bg-gray-50">
							No sellers available. Click &quot;Add Seller&quot; above to create your first seller.
						</div>
					)}
				</div>
				<div className="col-span-2">
					<label className="block text-sm font-medium mb-1">Description</label>
					<Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} />
				</div>
				<div>
					<label className="block text-sm font-medium mb-1">Price (₹) *</label>
					<Input type="number" min={0} value={price} onChange={e => setPrice(Math.max(0, Number(e.target.value)))} />
				</div>
				<div>
					<label className="block text-sm font-medium mb-1">Original Price (₹)</label>
					<Input type="number" min={0} value={originalPrice} onChange={e => setOriginalPrice(Math.max(0, Number(e.target.value)))} />
				</div>
				<div>
					<label className="block text-sm font-medium mb-1">Stock</label>
					<Input type="number" value={stock} onChange={e => setStock(Math.max(0, Number(e.target.value)))} />
				</div>
			</div>

			<div className="grid grid-cols-2 gap-6 mt-6">
				<div>
					<label className="block text-sm font-medium mb-1">Thumbnail</label>
					<div className="flex gap-6 mb-2">
						<label className="flex items-center"><input type="radio" name="thumbType" checked={thumbType==='file'} onChange={()=>setThumbType('file')} className="mr-2"/>File</label>
						<label className="flex items-center"><input type="radio" name="thumbType" checked={thumbType==='url'} onChange={()=>setThumbType('url')} className="mr-2"/>URL</label>
					</div>
					{thumbType==='file' ? (
						<div>
							<input type="file" accept="image/*" onChange={e=>{
								const file = e.target.files?.[0]||null;
								if (file) {
									const maxSize = 1 * 1024 * 1024; // 1MB
									if (file.size > maxSize) {
										const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
										alert(`File size must be less than 1MB. Your file is ${fileSizeMB}MB. Please compress or resize the image.`);
										e.target.value = ''; // Clear the input
										return;
									}
									setThumbFile(file);
									const previewUrl = URL.createObjectURL(file);
									setThumbUrl(previewUrl);
								}
							}} className="w-full p-2 border rounded" />
							{thumbFile && thumbUrl && (
								<div className="mt-2 relative inline-block">
									<Image src={thumbUrl} width={100} height={100} alt="Thumbnail preview" className="w-24 h-24 object-cover rounded border" />
								</div>
							)}
						</div>
					) : (
						<div>
						<Input placeholder="https://..." value={thumbUrl} onChange={e=>setThumbUrl(e.target.value)} />
							{thumbUrl && (
								<div className="mt-2 relative inline-block">
									<Image src={thumbUrl} width={100} height={100} alt="Thumbnail preview" className="w-24 h-24 object-cover rounded border" />
								</div>
							)}
						</div>
					)}
				</div>
				<div>
					<label className="block text-sm font-medium mb-1">Supporting Images (max 3, 1MB each)</label>
					<input type="file" accept="image/*" multiple onChange={(e)=>{
						const files = Array.from(e.target.files || []);
						const maxSize = 1 * 1024 * 1024; // 1MB
						const validFiles = files.filter(file => {
							if (file.size > maxSize) {
								const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
								alert(`File "${file.name}" is ${fileSizeMB}MB. Maximum size is 1MB. Please compress or resize the image.`);
								return false;
							}
							return true;
						});
						if (validFiles.length > 0) {
							// Create a DataTransfer object to properly construct FileList
							const dataTransfer = new DataTransfer();
							validFiles.forEach(file => dataTransfer.items.add(file));
							const syntheticEvent = {
								...e,
								target: {
									...e.target,
									files: dataTransfer.files,
								},
							} as React.ChangeEvent<HTMLInputElement>;
							onPickSupporting(syntheticEvent);
						} else {
							e.target.value = ''; // Clear the input if all files were invalid
						}
					}} className="w-full p-2 border rounded" />
					{supportingPreviews.length>0 && (
						<div className="flex gap-2 mt-2 flex-wrap">
							{supportingPreviews.map((u,i)=>{
								const isExisting = i < existingSupportingUrls.length;
								return (
									<div key={i} className="relative group">
										<Image src={u} width={64} height={64} alt={`Supporting image ${i+1}`} className="w-16 h-16 object-cover rounded border" />
										<button
											type="button"
											onClick={() => {
												if (isExisting) {
													// Remove from existing URLs
													const newExisting = existingSupportingUrls.filter((_, idx) => idx !== i);
													setExistingSupportingUrls(newExisting);
													setSupportingPreviews(newExisting.concat(supportingPreviews.slice(existingSupportingUrls.length)));
												} else {
													// Remove from new files
													const fileIndex = i - existingSupportingUrls.length;
													const newFiles = supportingFiles.filter((_, idx) => idx !== fileIndex);
													setSupportingFiles(newFiles);
													setSupportingPreviews([...existingSupportingUrls, ...newFiles.map(f => URL.createObjectURL(f))]);
												}
											}}
											className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
											title="Remove image"
										>
											×
										</button>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			<div className="mt-6">
				<label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
				<Input value={tagsInput} onChange={e=>setTagsInput(e.target.value)} placeholder="tag1, tag2" />
			</div>

			{/* Visibility & Featured toggles */}
			<div className="mt-4 grid grid-cols-2 gap-4">
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={isVisible} onChange={e=>setIsVisible(e.target.checked)} />
					<span>Visible</span>
				</label>
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" checked={isFeatured} onChange={e=>setIsFeatured(e.target.checked)} />
					<span>Featured</span>
				</label>
			</div>

			<div className="mt-6">
				<label className="block text-sm font-medium mb-2">Key Features</label>
				<div className="space-y-2">
					{features.map((f,idx)=> (
						<div key={idx} className="flex gap-2">
							<Input className="flex-1" value={f} onChange={e=>{
								const arr=[...features]; arr[idx]=e.target.value; setFeatures(arr);
							}} />
							<Button type="button" variant="outline" size="sm" onClick={()=> setFeatures(features.filter((_,i)=>i!==idx))}>×</Button>
						</div>
					))}
					<Button type="button" variant="outline" size="sm" onClick={()=> setFeatures([...features,''])}>+ Add Feature</Button>
				</div>
			</div>

			<div className="mt-6">
				<label className="block text-sm font-medium mb-2">Specifications</label>
				<div className="space-y-2">
					{Object.entries(specs).map(([k,v],i)=> (
						<div key={i} className="flex gap-2">
							<Input className="flex-1" value={k} onChange={e=>{ const n={...specs}; delete n[k]; n[e.target.value]=v; setSpecs(n); }} placeholder="Name" />
							<Input className="flex-1" value={v} onChange={e=>{ const n={...specs}; n[k]=e.target.value; setSpecs(n); }} placeholder="Value" />
							<Button type="button" variant="outline" size="sm" onClick={()=>{ const n={...specs}; delete n[k]; setSpecs(n); }}>×</Button>
						</div>
					))}
					<Button type="button" variant="outline" size="sm" onClick={()=> setSpecs({ ...specs, '': '' })}>+ Add Specification</Button>
				</div>
			</div>

			<div className="flex justify-end gap-2 mt-8 border-t pt-4">
				<Button variant="outline" onClick={()=> router.push('/admin/content/store')}>Cancel</Button>
				<Button onClick={create} disabled={saving==='saving' || !name || !price} className="min-w-[150px]">
					{saving==='saving' 
						? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>{editId ? 'Saving...' : 'Creating...'}</>) 
						: saving==='saved' 
							? (<><CheckCircle className="mr-2 h-4 w-4"/>{editId ? 'Saved!' : 'Created!'}</>) 
							: saving==='error' 
								? 'Retry' 
								: (editId ? 'Save Changes' : 'Create Product')}
				</Button>
			</div>
		</div>
	);
}


