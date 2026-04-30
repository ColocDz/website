'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';

export default function AddingPostPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '', type: 'Apartment', postType: 'offer',
    description: '', price: '', location: '', wilaya: '',
    bedrooms: '', bathrooms: '', amenities: '', tags: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

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

  return (
    <div className="bg-white">
      <Navbar />
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create a new post</h1>
          <p className="text-gray-600 mb-8">Fill in the details about your space or what you are looking for</p>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Post Type */}
            <div className="bg-blue-50 p-6 rounded border border-blue-200">
              <label className="block text-sm font-semibold text-gray-900 mb-4">What are you posting?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[{v:'offer',l:'I\'m Offering',d:'I want to rent out or sell a property'},{v:'request',l:'I\'m Looking For',d:'I want to find a place to rent or buy'}].map(opt=>(
                  <label key={opt.v} className="flex items-center gap-3 p-4 border-2 rounded cursor-pointer transition-all" style={{borderColor:formData.postType===opt.v?'#000':'#e5e7eb'}}>
                    <input type="radio" name="postType" value={opt.v} checked={formData.postType===opt.v} onChange={handleChange} className="w-4 h-4"/>
                    <div><span className="font-semibold text-gray-900">{opt.l}</span><p className="text-xs text-gray-600">{opt.d}</p></div>
                  </label>
                ))}
              </div>
            </div>
            {/* Basic Info */}
            <div className="bg-gray-50 p-8 rounded border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Listing Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent">
                    <option>Apartment</option><option>House</option><option>Studio</option><option>Room</option><option>Shared Space</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Spacious 2-bedroom apartment downtown" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe your space in detail." rows={4} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
              </div>
            </div>
            {/* Property Details */}
            <div className="bg-gray-50 p-8 rounded border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {[{n:'bedrooms',l:'Bedrooms'},{n:'bathrooms',l:'Bathrooms'},{n:'price',l:'Monthly Price ($)'}].map(f=>(
                  <div key={f.n}>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{f.l}</label>
                    <input type="number" name={f.n} value={(formData as any)[f.n]} onChange={handleChange} placeholder="0" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Wilaya (Province)</label>
                  <select name="wilaya" value={formData.wilaya} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="">Select Wilaya</option>
                    {wilayas.map(w=><option key={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Full Address or Street" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
                </div>
              </div>
            </div>
            {/* Amenities */}
            <div className="bg-gray-50 p-8 rounded border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Amenities &amp; Tags</h2>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Amenities</label>
                <input type="text" name="amenities" value={formData.amenities} onChange={handleChange} placeholder="e.g., WiFi, Parking, Kitchen" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tags</label>
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g., Modern, Downtown (comma separated)" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"/>
                <p className="text-xs text-gray-500 mt-1">Add tags separated by commas to help users filter your listing</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <Upload size={32} className="mx-auto text-gray-400 mb-4"/>
                <p className="text-gray-900 font-semibold mb-1">Upload photos</p>
                <p className="text-gray-600 text-sm">Drag and drop images here or click to browse</p>
              </div>
            </div>
            {/* Submit */}
            <div className="flex gap-4">
              <button type="submit" className="flex-1 bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-800">Publish Listing</button>
              <button type="button" className="flex-1 border border-gray-300 text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-50">Save as Draft</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
