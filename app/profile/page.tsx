'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { Menu, X, Upload } from 'lucide-react';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { MdOutlinePostAdd } from 'react-icons/md';
import { IoIosLogOut } from 'react-icons/io';
import { FaHome, FaUser, FaCog } from 'react-icons/fa';
import { SidebarLayout } from '@/components/sidebar-layout';

export default function ProfilePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name:'',  //will have to be auto from the DB
    gender:'',  // will have to be auto from the DB
    title: '',
    type: 'Apartment',
    description: '',
    price: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    amenities: '',
  });

  const menuItems = [
    { label: 'Home', path: '/', icon: <FaHome /> },
    { label: 'Add Post', path: '/adding-post', icon: <MdOutlinePostAdd /> },
    { label: 'Profile', path: '/profile', icon: <FaUser /> },
    { label: 'Settings', path: '/settings', icon: <FaCog /> },
    { label: 'Log Out', path: '/logout', icon: <IoIosLogOut /> },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  const autoFill = () =>{

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
              <span className="text-2xl font-bold text-gray-900">Logo</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="/" className="text-gray-700 hover:text-gray-900">
                Find housing
              </a>
              <a href="/messages" className="text-gray-700 hover:text-gray-900">
                Messages
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900">
                My posts
              </a>
            </div>

            <button className="hidden md:block bg-black text-white px-6 py-2 rounded hover:bg-gray-800">Sign in</button>
          </div>
        </nav>

        {/* Add Post Content */}
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create a new listing</h1>
            <p className="text-gray-600 mb-8">Fill in the details about your space or what you're looking for</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="bg-gray-50 p-8 rounded border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Spacious 2-bedroom apartment downtown"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    />                  
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Gender</label>
                    <input
                      type="text"
                      name="gender"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Spacious 2-bedroom apartment downtown"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                    />
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
