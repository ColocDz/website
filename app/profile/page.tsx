'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Edit2, Trash2 } from 'lucide-react';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { MdOutlinePostAdd } from 'react-icons/md';
import { IoIosLogOut } from 'react-icons/io';
import { FaHome, FaUser, FaCog } from 'react-icons/fa';
import { AiFillMessage } from 'react-icons/ai';

export default function ProfilePage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; postId?: number }>({ isOpen: false });

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/?logout=true');
  };

  const menuItems = [
    { label: 'Home', path: '/', icon: <FaHome /> },
    { label: 'Add Post', path: '/adding-post', icon: <MdOutlinePostAdd /> },
    { label: 'Profile', path: '/profile', icon: <FaUser /> },
    { label: 'Messages', path: '/messages', icon: <AiFillMessage /> },
    { label: 'Settings', path: '/settings', icon: <FaCog /> },
    { label: 'Log Out', path: '#', icon: <IoIosLogOut />, onClick: handleLogout },
  ];

  const posts = [
    {
      id: 1,
      type: 'Apartment',
      title: 'Spacious room in downtown with natural light',
      description: 'Modern apartment near transit with utilities included in rent',
      timeAgo: 'Posted yesterday',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      tags: ['Modern', 'Downtown', 'Furnished'],
    },
    {
      id: 2,
      type: 'House',
      title: 'Quiet neighborhood seeking responsible roommate',
      description: 'Established household needs someone for the spare bedroom',
      timeAgo: 'Posted two days ago',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
      tags: ['Quiet', 'Shared', 'Utilities Included'],
    },
    {
      id: 3,
      type: 'Studio',
      title: 'Cozy studio available for immediate occupancy',
      description: 'Furnished unit with kitchen and bathroom in walkable area',
      timeAgo: 'Posted three days ago',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
      tags: ['Modern', 'Balcony', 'Near Park'],
    },
  ];

  const handleDeletePost = (postId: number) => {
    setDeleteModal({ isOpen: true, postId });
  };

  const confirmDelete = () => {
    console.log('Deleting post:', deleteModal.postId);
    setDeleteModal({ isOpen: false });
  };

  const handleEditPost = (postId: number) => {
    router.push(`/adding-post?edit=${postId}`);
  };

  return (
    <div className="bg-white">
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false })}
      />

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <MobileSidebar menuItems={menuItems} onClose={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="md:hidden text-gray-800" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <span className="text-2xl font-bold text-gray-900">ColocDZ</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="/" className="text-gray-700 hover:text-gray-900">Find housing</a>
              <a href="/" className="text-gray-700 hover:text-gray-900">Find roommate</a>
              <a href="/messages" className="text-gray-700 hover:text-gray-900">Messages</a>
              <a href="/adding-post" className="text-gray-700 hover:text-gray-900">Add post</a>
            </div>

            <button className="hidden md:block bg-black text-white px-6 py-2 rounded hover:bg-gray-800">Sign in</button>
          </div>
        </nav>

        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
                <div className="flex flex-col items-center md:items-start">
                  <Image
                    src="https://www.w3schools.com/howto/img_avatar2.png"
                    alt="Profile"
                    width={120}
                    height={120}
                    className="rounded-full mb-4"
                  />
                  <h1 className="text-3xl font-bold text-gray-900 text-center md:text-left">Account Name</h1>
                  <p className="text-gray-600 text-center md:text-left mt-2">Person bio goes here</p>

                  <div className="mt-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="group peer ring-0 bg-rose-400 rounded-full outline-none duration-300 after:duration-300 w-24 h-12 shadow-md peer-checked:bg-emerald-500 peer-focus:outline-none after:content-[''] after:rounded-full after:absolute after:bg-gray-50 after:outline-none after:h-10 after:w-10 after:top-1 after:left-1 after:flex after:justify-center after:items-center peer-checked:after:translate-x-12 peer-hover:after:scale-95 transition-all">
                        <svg className="absolute top-1 left-12 stroke-gray-900 w-10 h-10" height="100" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100" width="100" x="0" xmlns="http://www.w3.org/2000/svg" y="0">
                          <path className="svg-fill-primary" d="M50,18A19.9,19.9,0,0,0,30,38v8a8,8,0,0,0-8,8V74a8,8,0,0,0,8,8H70a8,8,0,0,0,8-8V54a8,8,0,0,0-8-8H38V38a12,12,0,0,1,23.6-3,4,4,0,1,0,7.8-2A20.1,20.1,0,0,0,50,18Z"></path>
                        </svg>
                        <svg className="absolute top-1 left-1 stroke-gray-900 w-10 h-10" height="100" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100" width="100" x="0" xmlns="http://www.w3.org/2000/svg" y="0">
                          <path d="M30,46V38a20,20,0,0,1,40,0v8a8,8,0,0,1,8,8V74a8,8,0,0,1-8,8H30a8,8,0,0,1-8-8V54A8,8,0,0,1,30,46Zm32-8v8H38V38a12,12,0,0,1,24,0Z" fillRule="evenodd"></path>
                        </svg>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto md:ml-auto">
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-800 transition-colors"
                  >
                    {isEditMode ? 'Done Editing' : 'Edit Profile'}
                  </button>
                  <button
                    onClick={() => router.push('/adding-post')}
                    className="border border-gray-300 text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Add Post +
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-8 rounded border border-gray-200 mb-12">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Account Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Name</label>
                    <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Gender</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent">
                      <option>Select gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Birthday</label>
                    <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <div key={post.id} className="border border-gray-300 rounded overflow-hidden hover:shadow-lg transition-shadow">
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-2">
                        {post.type} • {post.timeAgo}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{post.description}</p>

                      {post.tags && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {isEditMode ? (
                        <div className="flex gap-2 border-t border-gray-200 pt-3 mt-3">
                          <button
                            onClick={() => handleEditPost(post.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                            title="Edit post"
                          >
                            <Edit2 size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                            title="Delete post"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      ) : (
                        <a href="#" className="text-gray-900 font-semibold flex items-center gap-1 hover:text-gray-600">
                          Read more <span>›</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
