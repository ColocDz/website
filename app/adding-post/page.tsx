'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';

const baseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(30, 'Title cannot exceed 30 characters'),
  searchType: z.enum(['roommate', 'roommate_and_place']),
  type: z.string().optional(),
  postType: z.enum(['offer', 'request']),
  description: z.string().min(100, 'Description must be at least 100 characters').max(5000, 'Description cannot exceed 5,000 characters'),
  price: z.string().optional(),
  maxBudget: z.string().optional(),
  wilaya: z.string().min(1, 'Wilaya is required'),
  location: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  amenities: z.string().optional(),
  necessities: z.string().optional(),
  tags: z.string().optional(),
});

type PostFormData = z.infer<typeof baseSchema>;

const customZodResolver = async (data: any) => {
  const result = await baseSchema.safeParseAsync(data);
  if (result.success) {
    const d = result.data;
    const errors: Record<string, any> = {};
    if (d.searchType === 'roommate') {
      if (!d.price || isNaN(Number(d.price)) || Number(d.price) < 1000) errors.price = { type: 'validation', message: 'Price must be at least 1,000 DA' };
      if (!d.location || d.location.length < 5) errors.location = { type: 'validation', message: 'Location must be at least 5 characters' };
      if (!d.bedrooms) errors.bedrooms = { type: 'validation', message: 'Required' };
      if (!d.bathrooms) errors.bathrooms = { type: 'validation', message: 'Required' };
    } else {
      if (!d.maxBudget || isNaN(Number(d.maxBudget)) || Number(d.maxBudget) < 1000) errors.maxBudget = { type: 'validation', message: 'Max budget must be at least 1,000 DA' };
    }
    if (Object.keys(errors).length > 0) return { values: {}, errors };
    return { values: result.data, errors: {} };
  }
  const formErrors: Record<string, any> = {};
  (result.error.issues || []).forEach((issue: any) => {
    if (issue.path?.[0]) formErrors[issue.path[0]] = { type: issue.code, message: issue.message };
  });
  return { values: {}, errors: formErrors };
};

function AddingPostFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isFaceVerified, setIsFaceVerified] = useState<boolean | null>(null);
  const [isIdVerified, setIsIdVerified] = useState<boolean>(false);
  const [postCount, setPostCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<PostFormData>({
    resolver: customZodResolver,
    defaultValues: {
      searchType: 'roommate',
      type: 'Apartment',
      postType: 'offer',
      title: '', description: '', price: '', maxBudget: '',
      wilaya: '', location: '', bedrooms: '', bathrooms: '',
      amenities: '', necessities: '', tags: '',
    },
  });

  useEffect(() => {
    if (editId) {
      (async () => {
        try {
          const res = await fetch(`/api/posts/${editId}`);
          if (res.ok) {
            const p = await res.json();
            reset({
              title: p.title || '', type: p.type || 'Apartment', postType: p.postType || 'offer',
              searchType: p.searchType || 'roommate', description: p.description || '',
              price: p.price || '', maxBudget: p.maxBudget || '',
              wilaya: p.wilaya || '', location: p.location || '',
              bedrooms: p.bedrooms ? p.bedrooms.toString() : '', bathrooms: p.bathrooms ? p.bathrooms.toString() : '',
              amenities: p.amenities ? p.amenities.join(', ') : '',
              necessities: p.necessities ? p.necessities.join(', ') : '',
              tags: p.tags ? p.tags.join(', ') : '',
            });
            if (p.images) setImages(p.images);
          } else setErrorMsg('Failed to load post details for editing.');
        } catch { setErrorMsg('Error loading post details.'); }
      })();
    }
  }, [editId, reset]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const u = await res.json();
          setIsFaceVerified(!!u.faceVerified);
          setIsIdVerified(!!u.identityVerified);
          setPostCount(u.postCount || 0);
        }
      } catch { console.error('Failed to check verification status'); }
    })();
  }, []);

  const searchType = watch('searchType');
  const postType = watch('postType');
  const watchTitle = watch('title', '');
  const watchDescription = watch('description', '');

  const wilayas = [
    '01 - Adrar','02 - Chlef','03 - Laghouat','04 - Oum El Bouaghi','05 - Batna',
    '06 - Béjaïa','07 - Biskra','08 - Béchar','09 - Blida','10 - Bouira',
    '11 - Tamanrasset','12 - Tébessa','13 - Tlemcen','14 - Tiaret','15 - Tizi Ouzou',
    '16 - Alger','17 - Djelfa','18 - Jijel','19 - Sétif','20 - Saïda',
    '21 - Skikda','22 - Sidi Bel Abbès','23 - Annaba','24 - Guelma','25 - Constantine',
    '26 - Médéa','27 - Mostaganem','28 - MSila','29 - Mascara','30 - Ouargla',
    '31 - Oran','32 - El Bayadh','33 - Illizi','34 - Bordj Bou Arréridj',
    '35 - Boumerdès','36 - El Tarf','37 - Tindouf','38 - Tissemsilt','39 - El Oued',
    '40 - Khenchela','41 - Souk Ahras','42 - Tipaza','43 - Mila','44 - Aïn Defla',
    '45 - Naâma','46 - Aïn Témouchent','47 - Ghardaïa','48 - Relizane',
    '49 - El MGhair','50 - El Menia','51 - Ouled Djellal','52 - Bordj Baji Mokhtar',
    '53 - Béni Abbès','54 - Timimoun','55 - Touggourt','56 - Djanet','57 - In Salah','58 - In Guezzam',
  ];

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round((h * MAX) / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL('image/jpeg', 0.7)); }
        else resolve(base64Str);
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    if (images.length + arr.length > 20) { setErrorMsg('Max 20 images.'); return; }
    arr.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            const c = await compressImage(e.target.result as string);
            setImages(prev => prev.length < 20 ? [...prev, c] : prev);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const submitPost = async (data: PostFormData, status: 'published' | 'draft') => {
    setIsSubmitting(true); setErrorMsg('');
    try {
      const url = isEditMode ? `/api/posts/${editId}` : '/api/posts';
      const method = isEditMode ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, images, status }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      router.push('/posts'); router.refresh();
    } catch (err: any) { setErrorMsg(err.message || 'Something went wrong'); }
    finally { setIsSubmitting(false); }
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent";
  const labelClass = "block text-sm font-semibold text-gray-900 mb-2";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        {isEditMode ? 'Edit Listing' : 'Create a new post'}
      </h1>
      <p className="text-gray-600 mb-8">
        {isEditMode ? 'Update the details of your listing' : 'Fill in the details about your space or what you are looking for'}
      </p>

      {errorMsg && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded">{errorMsg}</div>}

      {isFaceVerified === null ? (
        <div className="text-center py-12 text-gray-500">Checking verification status...</div>
      ) : !isFaceVerified ? (
        <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-800 mb-2">Face Verification Required</h2>
          <p className="text-red-700 mb-6">You need to verify your identity via real-time face detection in settings before you can create posts.</p>
          <button onClick={() => router.push('/settings')} className="px-6 py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors">Go to Settings</button>
        </div>
      ) : (!editId && postCount >= 3 && !isIdVerified) ? (
        <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-800 mb-2">Identity Verification Required</h2>
          <p className="text-red-700 mb-6">You have already published {postCount} posts. To publish more than 3 posts, you must verify your identity by uploading your National ID Card in settings.</p>
          <button onClick={() => router.push('/settings')} className="px-6 py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors">Go to Settings to Upload ID</button>
        </div>
      ) : (
        <form className="space-y-8">
          {/* Search Type Selector */}
          <div className="bg-blue-50 p-6 rounded border border-blue-200">
            <label className="block text-sm font-semibold text-gray-900 mb-4">What are you looking for?</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { v: 'roommate', l: 'Roommate Only', d: 'I have a place and I\'m looking for a roommate' },
                { v: 'roommate_and_place', l: 'Roommate + Place', d: 'I need both a roommate and a place to stay' },
              ].map(opt => (
                <label key={opt.v} className="flex items-center gap-3 p-4 border-2 rounded cursor-pointer transition-all bg-white" style={{ borderColor: searchType === opt.v ? '#000' : '#e5e7eb' }}>
                  <input type="radio" value={opt.v} {...register('searchType')} className="w-4 h-4" />
                  <div>
                    <span className="font-semibold text-gray-900">{opt.l}</span>
                    <p className="text-xs text-gray-600">{opt.d}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Post Type (offer/request) - only for roommate */}
          {searchType === 'roommate' && (
            <div className="bg-blue-50 p-6 rounded border border-blue-200">
              <label className="block text-sm font-semibold text-gray-900 mb-4">What are you posting?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { v: 'offer', l: "I'm Offering", d: 'I want to rent out or sell a property' },
                  { v: 'request', l: "I'm Looking For", d: 'I want to find a place to rent or buy' },
                ].map(opt => (
                  <label key={opt.v} className="flex items-center gap-3 p-4 border-2 rounded cursor-pointer transition-all bg-white" style={{ borderColor: postType === opt.v ? '#000' : '#e5e7eb' }}>
                    <input type="radio" value={opt.v} {...register('postType')} className="w-4 h-4" />
                    <div>
                      <span className="font-semibold text-gray-900">{opt.l}</span>
                      <p className="text-xs text-gray-600">{opt.d}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-gray-50 p-8 rounded border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {searchType === 'roommate_and_place' ? 'About You' : 'Basic Information'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {searchType === 'roommate' && (
                <div>
                  <label className={labelClass}>Listing Type <span className="text-red-500">*</span></label>
                  <select {...register('type')} className={inputClass + ' bg-white'}>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Studio">Studio</option>
                    <option value="Room">Room</option>
                    <option value="Shared Space">Shared Space</option>
                  </select>
                </div>
              )}
              <div>
                <label className="flex justify-between text-sm font-semibold text-gray-900 mb-2">
                  <span>Title <span className="text-red-500">*</span></span>
                  <span className={`text-xs ${watchTitle.length > 30 ? 'text-red-500' : 'text-gray-500'}`}>{watchTitle.length}/30</span>
                </label>
                <input type="text" {...register('title')} maxLength={30}
                  placeholder={searchType === 'roommate_and_place' ? 'e.g., Looking for a room in Algiers' : 'e.g., Cozy Studio'}
                  className={inputClass} />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
            </div>
            <div>
              <label className="flex justify-between text-sm font-semibold text-gray-900 mb-2">
                <span>Description <span className="text-red-500">*</span></span>
                <span className={`text-xs ${watchDescription.length < 100 || watchDescription.length > 5000 ? 'text-orange-500' : 'text-green-600'}`}>
                  {watchDescription.length}/5000 (Min 100)
                </span>
              </label>
              <textarea {...register('description')} maxLength={5000} rows={8}
                placeholder={searchType === 'roommate_and_place'
                  ? 'Tell potential roommates about yourself: your habits, occupation, schedule, what you\'re looking for in a roommate, etc. (min 100 characters)'
                  : 'Describe your space in detail (minimum 100 characters required).'}
                className={inputClass} />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
          </div>

          {/* Conditional fields based on searchType */}
          {searchType === 'roommate' ? (
            <>
              {/* Property Details */}
              <div className="bg-gray-50 p-8 rounded border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Property Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className={labelClass}>Bedrooms <span className="text-red-500">*</span></label>
                    <input type="number" {...register('bedrooms')} placeholder="0" className={inputClass} />
                    {errors.bedrooms && <p className="text-red-500 text-xs mt-1">{errors.bedrooms.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Bathrooms <span className="text-red-500">*</span></label>
                    <input type="number" {...register('bathrooms')} placeholder="0" className={inputClass} />
                    {errors.bathrooms && <p className="text-red-500 text-xs mt-1">{errors.bathrooms.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Monthly Price (DA) <span className="text-red-500">*</span></label>
                    <input type="number" {...register('price')} placeholder="0" className={inputClass} />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Wilaya (Province) <span className="text-red-500">*</span></label>
                    <select {...register('wilaya')} className={inputClass + ' bg-white'}>
                      <option value="">Select Wilaya</option>
                      {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    {errors.wilaya && <p className="text-red-500 text-xs mt-1">{errors.wilaya.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Location <span className="text-red-500">*</span></label>
                    <input type="text" {...register('location')} placeholder="Full Address or Street" className={inputClass} />
                    {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
                  </div>
                </div>
              </div>

              {/* Amenities & Tags */}
              <div className="bg-gray-50 p-8 rounded border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Amenities &amp; Tags</h2>
                <div className="mb-6">
                  <label className={labelClass}>Amenities</label>
                  <input type="text" {...register('amenities')} placeholder="e.g., WiFi, Parking, Kitchen" className={inputClass} />
                </div>
                <div className="mb-6">
                  <label className={labelClass}>Tags</label>
                  <input type="text" {...register('tags')} placeholder="e.g., Modern, Downtown (comma separated)" className={inputClass} />
                  <p className="text-xs text-gray-500 mt-1">Add tags separated by commas to help users filter your listing</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Preferences for roommate_and_place */}
              <div className="bg-gray-50 p-8 rounded border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Your Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={labelClass}>Preferred Wilaya <span className="text-red-500">*</span></label>
                    <select {...register('wilaya')} className={inputClass + ' bg-white'}>
                      <option value="">Select Wilaya</option>
                      {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    {errors.wilaya && <p className="text-red-500 text-xs mt-1">{errors.wilaya.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Max Budget (DA/month) <span className="text-red-500">*</span></label>
                    <input type="number" {...register('maxBudget')} placeholder="e.g., 25000" className={inputClass} />
                    {errors.maxBudget && <p className="text-red-500 text-xs mt-1">{errors.maxBudget.message}</p>}
                  </div>
                </div>
                <div className="mb-6">
                  <label className={labelClass}>Preferred Location (optional)</label>
                  <input type="text" {...register('location')} placeholder="e.g., Near university, city center" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Necessities You Need</label>
                  <input type="text" {...register('necessities')} placeholder="e.g., WiFi, Furnished, Near Transit, Parking" className={inputClass} />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated list of things you need in a place</p>
                </div>
              </div>
            </>
          )}

          {/* Image Upload */}
          <div className="bg-gray-50 p-8 rounded border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <label className={labelClass}>
                {searchType === 'roommate_and_place' ? 'Your Photo (Optional)' : 'Photos (Optional)'}
              </label>
              <span className="text-xs text-gray-500">{images.length} / 20 images</span>
            </div>
            <div
              className={`border-2 border-dashed rounded p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => processFiles(e.target.files)} />
              <Upload size={32} className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className="text-gray-900 font-semibold mb-1">Upload photos</p>
              <p className="text-gray-600 text-sm">Drag and drop images here or click to browse</p>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-6">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded overflow-hidden border border-gray-200 aspect-square">
                    <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button type="button" onClick={handleSubmit((data) => submitPost(data, 'published'))} disabled={isSubmitting}
              className="flex-1 bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed">
              {isSubmitting ? 'Processing...' : isEditMode ? 'Update Listing' : 'Publish Listing'}
            </button>
            {isEditMode ? (
              <button type="button" onClick={() => router.back()} disabled={isSubmitting}
                className="flex-1 border border-gray-300 text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed text-center">
                Cancel Edit
              </button>
            ) : (
              <button type="button" onClick={handleSubmit((data) => submitPost(data, 'draft'))} disabled={isSubmitting}
                className="flex-1 border border-gray-300 text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed">
                Save as Draft
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

export default function AddingPostPage() {
  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <section className="py-12 px-6">
        <Suspense fallback={<div className="max-w-3xl mx-auto p-12 text-center text-gray-500">Loading form...</div>}>
          <AddingPostFormContent />
        </Suspense>
      </section>
    </div>
  );
}
