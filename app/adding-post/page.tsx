'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Image from 'next/image';

const postSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(30, 'Title cannot exceed 30 characters'),
  type: z.enum(['Apartment', 'House', 'Studio', 'Room', 'Shared Space']),
  postType: z.enum(['offer', 'request']),
  description: z.string().min(100, 'Description must be at least 100 characters').max(5000, 'Description cannot exceed 5,000 characters'),
  price: z.string().min(1, 'Price is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Price must be a valid positive number'),
  wilaya: z.string().min(1, 'Wilaya is required'),
  location: z.string().min(5, 'Location must be at least 5 characters'),
  bedrooms: z.string().min(1, 'Bedrooms are required'),
  bathrooms: z.string().min(1, 'Bathrooms are required'),
  amenities: z.string().min(1, 'Amenities are required'),
  tags: z.string().min(1, 'Tags are required'),
});

type PostFormData = z.infer<typeof postSchema>;

// Custom resolver to support Zod v4 natively without crashing
const customZodResolver = async (data: any) => {
  const result = await postSchema.safeParseAsync(data);
  
  if (result.success) {
    return { values: result.data, errors: {} };
  } else {
    const formErrors: Record<string, any> = {};
    const issues = result.error.issues || [];
    
    issues.forEach((issue: any) => {
      if (issue.path && issue.path[0]) {
        formErrors[issue.path[0]] = {
          type: issue.code,
          message: issue.message,
        };
      }
    });
    
    return { values: {}, errors: formErrors };
  }
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
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: customZodResolver,
    defaultValues: {
      type: 'Apartment',
      postType: 'offer',
      title: '',
      description: '',
      price: '',
      wilaya: '',
      location: '',
      bedrooms: '',
      bathrooms: '',
      amenities: '',
      tags: '',
    },
  });

  // Fetch post details if in edit mode
  useEffect(() => {
    if (editId) {
      async function fetchPostForEdit() {
        try {
          const res = await fetch(`/api/posts/${editId}`);
          if (res.ok) {
            const postData = await res.json();
            reset({
              title: postData.title || '',
              type: postData.type || 'Apartment',
              postType: postData.postType || 'offer',
              description: postData.description || '',
              price: postData.price || '',
              wilaya: postData.wilaya || '',
              location: postData.location || '',
              bedrooms: postData.bedrooms ? postData.bedrooms.toString() : '',
              bathrooms: postData.bathrooms ? postData.bathrooms.toString() : '',
              amenities: postData.amenities ? postData.amenities.join(', ') : '',
              tags: postData.tags ? postData.tags.join(', ') : '',
            });
            if (postData.images) {
              setImages(postData.images);
            }
          } else {
            setErrorMsg('Failed to load post details for editing.');
          }
        } catch (e) {
          console.error('Failed to load post for editing:', e);
          setErrorMsg('Error loading post details.');
        }
      }
      fetchPostForEdit();
    }
  }, [editId, reset]);

  useEffect(() => {
    async function checkIdentity() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const userData = await res.json();
          setIsFaceVerified(!!userData.faceVerified);
        }
      } catch (e) {
        console.error('Failed to check face status');
      }
    }
    checkIdentity();
  }, []);

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

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    const filesArray = Array.from(files);
    
    if (images.length + filesArray.length > 20) {
      setErrorMsg('You can only upload a maximum of 20 images.');
      return;
    }

    filesArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImages(prev => {
              if (prev.length < 20) return [...prev, e.target!.result as string];
              return prev;
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const submitPost = async (data: PostFormData, status: 'published' | 'draft') => {
    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      const url = isEditMode ? `/api/posts/${editId}` : '/api/posts';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, images, status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} post`);
      }

      router.push('/posts');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        {isEditMode ? 'Edit Listing' : 'Create a new post'}
      </h1>
      <p className="text-gray-600 mb-8">
        {isEditMode ? 'Update the details of your listing' : 'Fill in the details about your space or what you are looking for'}
      </p>
      
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
          {errorMsg}
        </div>
      )}

      {!isFaceVerified ? (
        <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-800 mb-2">Face Verification Required</h2>
          <p className="text-red-700 mb-6">
            You need to verify your identity via real-time face detection in settings before you can create posts.
          </p>
          <button
            onClick={() => router.push('/settings')}
            className="px-6 py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors"
          >
            Go to Settings
          </button>
        </div>
      ) : (
        <form className="space-y-8">
          {/* Post Type */}
          <div className="bg-blue-50 p-6 rounded border border-blue-200">
            <label className="block text-sm font-semibold text-gray-900 mb-4">What are you posting?</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {v:'offer', l:'I\'m Offering', d:'I want to rent out or sell a property'},
                {v:'request', l:'I\'m Looking For', d:'I want to find a place to rent or buy'}
              ].map(opt=>(
                <label key={opt.v} className="flex items-center gap-3 p-4 border-2 rounded cursor-pointer transition-all bg-white" style={{borderColor:postType===opt.v?'#000':'#e5e7eb'}}>
                  <input 
                    type="radio" 
                    value={opt.v} 
                    {...register('postType')}
                    className="w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-gray-900">{opt.l}</span>
                    <p className="text-xs text-gray-600">{opt.d}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-gray-50 p-8 rounded border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Listing Type <span className="text-red-500">*</span></label>
                <select {...register('type')} className="w-full px-4 py-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent">
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Studio">Studio</option>
                  <option value="Room">Room</option>
                  <option value="Shared Space">Shared Space</option>
                </select>
              </div>
              <div>
                <label className="flex justify-between text-sm font-semibold text-gray-900 mb-2">
                  <span>Title <span className="text-red-500">*</span></span>
                  <span className={`text-xs ${watchTitle.length > 30 ? 'text-red-500' : 'text-gray-500'}`}>
                    {watchTitle.length}/30
                  </span>
                </label>
                <input 
                  type="text" 
                  {...register('title')} 
                  maxLength={30}
                  placeholder="e.g., Cozy Studio" 
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                {watchTitle.length === 30 && <p className="text-orange-500 text-xs mt-1">Maximum characters reached.</p>}
              </div>
            </div>
            <div>
              <label className="flex justify-between text-sm font-semibold text-gray-900 mb-2">
                <span>Description <span className="text-red-500">*</span></span>
                <span className={`text-xs ${watchDescription.length < 100 || watchDescription.length > 5000 ? 'text-orange-500' : 'text-green-600'}`}>
                  {watchDescription.length}/5000 (Min 100)
                </span>
              </label>
              <textarea 
                {...register('description')} 
                maxLength={5000}
                placeholder="Describe your space in detail (minimum 100 characters required)." 
                rows={8} 
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              {watchDescription.length === 5000 && <p className="text-orange-500 text-xs mt-1">Maximum characters reached.</p>}
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-gray-50 p-8 rounded border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Bedrooms <span className="text-red-500">*</span></label>
                <input type="number" {...register('bedrooms')} placeholder="0" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
                {errors.bedrooms && <p className="text-red-500 text-xs mt-1">{errors.bedrooms.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Bathrooms <span className="text-red-500">*</span></label>
                <input type="number" {...register('bathrooms')} placeholder="0" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
                {errors.bathrooms && <p className="text-red-500 text-xs mt-1">{errors.bathrooms.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Monthly Price ($) <span className="text-red-500">*</span></label>
                <input type="number" {...register('price')} placeholder="0" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Wilaya (Province) <span className="text-red-500">*</span></label>
                <select {...register('wilaya')} className="w-full px-4 py-2 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent">
                  <option value="">Select Wilaya</option>
                  {wilayas.map(w=><option key={w} value={w}>{w}</option>)}
                </select>
                {errors.wilaya && <p className="text-red-500 text-xs mt-1">{errors.wilaya.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Location <span className="text-red-500">*</span></label>
                <input type="text" {...register('location')} placeholder="Full Address or Street" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
              </div>
            </div>
          </div>

          {/* Amenities & Tags */}
          <div className="bg-gray-50 p-8 rounded border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Amenities &amp; Tags</h2>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Amenities <span className="text-red-500">*</span></label>
              <input type="text" {...register('amenities')} placeholder="e.g., WiFi, Parking, Kitchen" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
              {errors.amenities && <p className="text-red-500 text-xs mt-1">{errors.amenities.message}</p>}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Tags <span className="text-red-500">*</span></label>
              <input type="text" {...register('tags')} placeholder="e.g., Modern, Downtown (comma separated)" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
              <p className="text-xs text-gray-500 mt-1">Add tags separated by commas to help users filter your listing</p>
              {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags.message}</p>}
            </div>
            
            {/* Image Upload Drag and Drop */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-900">Photos (Optional)</label>
                <span className="text-xs text-gray-500">{images.length} / 20 images</span>
              </div>
              
              <div 
                className={`border-2 border-dashed rounded p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={(e) => processFiles(e.target.files)}
                />
                <Upload size={32} className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}/>
                <p className="text-gray-900 font-semibold mb-1">Upload photos</p>
                <p className="text-gray-600 text-sm">Drag and drop images here or click to browse</p>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-6">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group rounded overflow-hidden border border-gray-200 aspect-square">
                      <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={handleSubmit((data) => submitPost(data, 'published'))}
              disabled={isSubmitting}
              className="flex-1 bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : isEditMode ? 'Update Listing' : 'Publish Listing'}
            </button>
            {isEditMode ? (
              <button 
                type="button" 
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1 border border-gray-300 text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed text-center"
              >
                Cancel Edit
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit((data) => submitPost(data, 'draft'))}
                disabled={isSubmitting}
                className="flex-1 border border-gray-300 text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
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
