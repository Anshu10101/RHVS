'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProductCreationPage() {
	const router = useRouter();
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
	const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

	const uploadImage = async (file: File, key: string) => {
		const form = new FormData();
		form.append('file', file);
		form.append('productId', key);
		const res = await fetch('/api/upload/store', { method: 'POST', credentials: 'include', body: form });
		if (!res.ok) throw new Error('upload failed');
		const data = await res.json();
		return data.url as string;
	};

	useEffect(() => {
		(async () => {
			try {
				// Load categories
				const res = await fetch('/api/content/store/categories', { cache: 'no-store' });
				const data = await res.json();
				if (data?.success && Array.isArray(data.categories)) {
					setCategories(data.categories.map((c: any) => ({ id: String(c.id), name: c.name })));
					if (!category && data.categories.length) setCategory(String(data.categories[0].id));
				}
				
				// Load sellers
				const sellersRes = await fetch('/api/admin/sellers', { cache: 'no-store' });
				const sellersData = await sellersRes.json();
				if (sellersData?.success && Array.isArray(sellersData.data)) {
					setSellers(sellersData.data.map((s: any) => ({ 
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
	}, []);

	const onPickSupporting = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		const limited = [...supportingFiles, ...files].slice(0, 3);
		setSupportingFiles(limited);
		setSupportingPreviews(limited.map(f => URL.createObjectURL(f)));
	};

	const create = async () => {
		if (!name || !price) return;
		setSaving('saving');
		try {
			let image_url = '';
			// Upload thumbnail first if file
			if (thumbType === 'file' && thumbFile) {
				image_url = await uploadImage(thumbFile, `new_thumb_${Date.now()}`);
			} else if (thumbType === 'url' && thumbUrl) {
				image_url = thumbUrl;
			}
			// Upload supporting (max 3)
			const gallery: string[] = [];
			for (let i = 0; i < supportingFiles.length; i++) {
				const url = await uploadImage(supportingFiles[i], `new_sup_${Date.now()}_${i}`);
				gallery.push(url);
			}
			// Ensure main first
			const images = image_url ? [image_url, ...gallery] : gallery;
			const resp = await fetch('/api/admin/content/products', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					name,
					description,
					price,
					original_price: originalPrice || price,
					category: category || 'default',
					seller_id: sellerId === 'none' ? null : sellerId || null,
					image_url,
					images,
					stock,
					is_featured: isFeatured,
					tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
					features: features.filter(f => f.trim() !== ''),
					specifications: specs,
					isVisible
				})
			});
			if (!resp.ok) throw new Error('create failed');
			setSaving('saved');
			setTimeout(() => router.push('/admin/content/store'), 800);
		} catch (e) {
			console.error(e);
			setSaving('error');
			setTimeout(() => setSaving('idle'), 2000);
		}
	};

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Create Product</h1>
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
							No sellers available. Click "Add Seller" above to create your first seller.
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
						<input type="file" accept="image/*" onChange={e=>setThumbFile(e.target.files?.[0]||null)} className="w-full p-2 border rounded" />
					) : (
						<Input placeholder="https://..." value={thumbUrl} onChange={e=>setThumbUrl(e.target.value)} />
					)}
				</div>
				<div>
					<label className="block text-sm font-medium mb-1">Supporting Images (max 3)</label>
					<input type="file" accept="image/*" multiple onChange={onPickSupporting} className="w-full p-2 border rounded" />
					{supportingPreviews.length>0 && (
						<div className="flex gap-2 mt-2 flex-wrap">
							{supportingPreviews.map((u,i)=>(
								<img key={i} src={u} className="w-16 h-16 object-cover rounded border" />
							))}
						</div>
					)}
				</div>
			</div>

			<div className="mt-6">
				<label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
				<Input value={tagsInput} onChange={e=>setTagsInput(e.target.value)} placeholder="tag1, tag2" />
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
				<Button onClick={create} disabled={saving==='saving' || !name || !price} className="min-w-[130px]">
					{saving==='saving' ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating...</>) : saving==='saved' ? (<><CheckCircle className="mr-2 h-4 w-4"/>Created!</>) : saving==='error' ? 'Retry' : 'Create Product'}
				</Button>
			</div>
		</div>
	);
}


