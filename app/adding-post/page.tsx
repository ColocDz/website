'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Upload } from 'lucide-react';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { MdOutlinePostAdd } from 'react-icons/md';
import { IoIosLogOut } from 'react-icons/io';
import { FaHome, FaUser, FaCog } from 'react-icons/fa';
import { AiFillMessage } from 'react-icons/ai';

export default function AddingPostPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Apartment',
    postType: 'offer', // 'offer' for selling/renting, 'request' for looking for
    description: '',
    price: '',
    location: '',
    wilaya: '',
    bedrooms: '',
    bathrooms: '',
    amenities: '',
    tags: '',
  });

  const handleLogoutClick = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/');
  };

  const menuItems = [
    { label: 'Home', path: '/', icon: <FaHome /> },
    { label: 'Add Post', path: '/adding-post', icon: <MdOutlinePostAdd /> },
    { label: 'Profile', path: '/profile', icon: <FaUser /> },
    { label: 'Messages', path: '/messages', icon: <AiFillMessage /> },
    { label: 'Settings', path: '/settings', icon: <FaCog /> },
    { label: 'Log Out', path: '#', icon: <IoIosLogOut />, onClick: handleLogoutClick },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="bg-white">
      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <MobileSidebar menuItems={menuItems} onClose={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div>
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button className="md:hidden text-gray-800" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <span className="text-2xl font-bold text-gray-900">ColocDZ</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="/" className="text-gray-700 hover:text-gray-900">
                Find housing
              </a>
              <a href="/" className="text-gray-700 hover:text-gray-900">
                Find roommate
              </a>
              <a href="/messages" className="text-gray-700 hover:text-gray-900">
                Messages
              </a>
              <a href="/profile" className="text-gray-700 hover:text-gray-900">
                My posts
              </a>
            </div>

            <button className="hidden md:block bg-black text-white px-6 py-2 rounded hover:bg-gray-800">Sign in</button>
          </div>
        </nav>

        {/* Add Post Content */}
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create a new post</h1>
            <p className="text-gray-600 mb-8">Fill in the details about your space or what you're looking for</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Post Type Selection */}
              <div className="bg-blue-50 p-6 rounded border border-blue-200">
                <label className="block text-sm font-semibold text-gray-900 mb-4">What are you posting?</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-4 border-2 rounded cursor-pointer transition-all" style={{ borderColor: formData.postType === 'offer' ? '#000' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="postType"
                      value="offer"
                      checked={formData.postType === 'offer'}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold text-gray-900">I'm Offering</span>
                      <p className="text-xs text-gray-600">I want to rent out or sell a property</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 rounded cursor-pointer transition-all" style={{ borderColor: formData.postType === 'request' ? '#000' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="postType"
                      value="request"
                      checked={formData.postType === 'request'}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold text-gray-900">I'm Looking For</span>
                      <p className="text-xs text-gray-600">I want to find a place to rent or buy</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-gray-50 p-8 rounded border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Listing Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option>Apartment</option>
                      <option>House</option>
                      <option>Studio</option>
                      <option>Room</option>
                      <option>Shared Space</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Spacious 2-bedroom apartment downtown"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your space in detail. What makes it special?"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              {/* Property Details */}
              <div className="bg-gray-50 p-8 rounded border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Property Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Bedrooms</label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Bathrooms</label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Monthly Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Wilaya (Province)</label>
                    <select
                      name="wilaya"
                      value={formData.wilaya}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">Select Wilaya</option>
                      <option>01 - Adrar</option>
                      <option>02 - Chlef</option>
                      <option>03 - Laghouat</option>
                      <option>04 - Oum El Bouaghi</option>
                      <option>05 - Batna</option>
                      <option>06 - Béjaïa</option>
                      <option>07 - Biskra</option>
                      <option>08 - Béchar</option>
                      <option>09 - Blida</option>
                      <option>10 - Bouira</option>
                      <option>11 - Tamanrasset</option>
                      <option>12 - Tébessa</option>
                      <option>13 - Tlemcen</option>
                      <option>14 - Tiaret</option>
                      <option>15 - Tizi Ouzou</option>
                      <option>16 - Alger</option>
                      <option>17 - Djelfa</option>
                      <option>18 - Jijel</option>
                      <option>19 - Sétif</option>
                      <option>20 - Saïda</option>
                      <option>21 - Skikda</option>
                      <option>22 - Sidi Bel Abbès</option>
                      <option>23 - Annaba</option>
                      <option>24 - Guelma</option>
                      <option>25 - Constantine</option>
                      <option>26 - Médéa</option>
                      <option>27 - Mostaganem</option>
                      <option>28 - M'Sila</option>
                      <option>29 - Mascara</option>
                      <option>30 - Ouargla</option>
                      <option>31 - Oran</option>
                      <option>32 - El Bayadh</option>
                      <option>33 - Illizi</option>
                      <option>34 - Bordj Bou Arréridj</option>
                      <option>35 - Boumerdès</option>
                      <option>36 - El Tarf</option>
                      <option>37 - Tindouf</option>
                      <option>38 - Tissemsilt</option>
                      <option>39 - El Oued</option>
                      <option>40 - Khenchela</option>
                      <option>41 - Souk Ahras</option>
                      <option>42 - Tipaza</option>
                      <option>43 - Mila</option>
                      <option>44 - Aïn Defla</option>
                      <option>45 - Naâma</option>
                      <option>46 - Aïn Témouchent</option>
                      <option>47 - Ghardaïa</option>
                      <option>48 - Relizane</option>
                      <option>49 - El M'Ghair</option>
                      <option>50 - El Menia</option>
                      <option>51 - Ouled Djellal</option>
                      <option>52 - Bordj Baji Mokhtar</option>
                      <option>53 - Béni Abbès</option>
                      <option>54 - Timimoun</option>
                      <option>55 - Touggourt</option>
                      <option>56 - Djanet</option>
                      <option>57 - In Salah</option>
                      <option>58 - In Guezzam</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Full Address or Street"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities & Images */}
              <div className="bg-gray-50 p-8 rounded border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Amenities & Tags</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Amenities</label>
                  <input
                    type="text"
                    name="amenities"
                    value={formData.amenities}
                    onChange={handleChange}
                    placeholder="e.g., WiFi, Parking, Kitchen, Laundry, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g., Modern, Downtown, Furnished (comma separated)"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Add tags separated by commas to help users filter your listing</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-900 font-semibold mb-1">Upload photos</p>
                  <p className="text-gray-600 text-sm">Drag and drop images here or click to browse</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-800"
                >
                  Publish Listing
                </button>
                <button
                  type="button"
                  className="flex-1 border border-gray-300 text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-50"
                >
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
