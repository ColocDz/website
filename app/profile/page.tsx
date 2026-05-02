'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { useSession } from '@/lib/auth-client';

interface Post {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  images: string[];
  tags: string[];
}

interface UserProfile {
  name: string;
  gender: string;
  birthday: string;
  isPrivate: boolean;
  nameChanged: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile Data
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    gender: '',
    birthday: '',
    isPrivate: false,
    nameChanged: false,
  });
  
  // Posts
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; postId?: string }>({ isOpen: false });
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [saveError, setSaveError] = useState('');

  // Fetch user profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name || '',
            gender: data.gender || '',
            birthday: data.birthday ? new Date(data.birthday).toISOString().split('T')[0] : '',
            isPrivate: data.isPrivate || false,
            nameChanged: data.nameChanged || false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    }
    
    if (session) {
      fetchProfile();
    }
  }, [session]);

  // Fetch user posts
  useEffect(() => {
    async function fetchUserPosts() {
      if (!session?.user?.id) return;
      try {
        const res = await fetch(`/api/posts?userId=${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoadingPosts(false);
      }
    }
    
    if (!isPending) {
      if (session) {
        fetchUserPosts();
      } else {
        router.push('/login');
      }
    }
  }, [session, isPending, router]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }
      
      const updatedUser = await res.json();
      setProfile(prev => ({
        ...prev,
        nameChanged: updatedUser.nameChanged
      }));
      setIsEditMode(false);
      
      // Optionally refresh session or page here to update the navbar name
      router.refresh();
    } catch (error: any) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      handleSaveProfile();
    } else {
      setIsEditMode(true);
    }
  };

  const handleDeletePost = (postId: string) => {
    setDeleteModal({ isOpen: true, postId });
  };

  const confirmDelete = async () => {
    if (!deleteModal.postId) return;
    try {
      const res = await fetch(`/api/posts/${deleteModal.postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== deleteModal.postId));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setDeleteModal({ isOpen: false });
    }
  };

  const handleEditPost = (postId: string) => {
    router.push(`/adding-post?edit=${postId}`);
  };

  if (isPending) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-white">
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false })}
      />

      <Navbar />

      <div>
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
                <div className="flex flex-col items-center md:items-start">
                  <Image
                    src={session?.user?.image || "https://www.w3schools.com/howto/img_avatar2.png"}
                    alt="Profile"
                    width={120}
                    height={120}
                    className="rounded-full mb-4"
                  />
                  <h1 className="text-3xl font-bold text-gray-900 text-center md:text-left">
                    {profile.name || session?.user?.name || 'Account Name'}
                  </h1>
                  <p className="text-gray-600 text-center md:text-left mt-2">
                    {session?.user?.email}
                  </p>

                  <div className="mt-6 flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">Account Privacy:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.isPrivate}
                        disabled={!isEditMode}
                        onChange={(e) => setProfile({ ...profile, isPrivate: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className={`group peer ring-0 rounded-full outline-none duration-300 w-16 h-8 shadow-inner transition-all ${profile.isPrivate ? 'bg-emerald-500' : 'bg-rose-400'} ${!isEditMode && 'opacity-70'}`}>
                        <div className={`absolute top-1 left-1 bg-white rounded-full w-6 h-6 transition-transform duration-300 ${profile.isPrivate ? 'translate-x-8' : ''}`} />
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto md:ml-auto">
                  <button
                    onClick={toggleEditMode}
                    disabled={isSaving}
                    className={`px-8 py-3 rounded font-semibold transition-colors ${
                      isEditMode 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-black hover:bg-gray-800 text-white'
                    }`}
                  >
                    {isSaving ? 'Saving...' : isEditMode ? 'Save Profile' : 'Edit Profile'}
                  </button>
                  <button
                    onClick={() => router.push('/adding-post')}
                    className="border border-gray-300 text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Add Post +
                  </button>
                </div>
              </div>

              {/* Account Information Form */}
              <div className="bg-gray-50 p-8 rounded border border-gray-200 mb-12 relative">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Account Information</h2>
                
                {saveError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
                    {saveError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Name</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!isEditMode || profile.nameChanged}
                      className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black focus:border-transparent ${
                        (!isEditMode || profile.nameChanged) ? 'bg-gray-100 border-transparent text-gray-600' : 'border-gray-300 bg-white'
                      }`}
                      placeholder="Your name" 
                    />
                    
                    {/* Warning Messages */}
                    {isEditMode && profile.nameChanged && (
                      <p className="text-xs text-red-500 mt-2 flex items-start gap-1">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                        You have already changed your name once. You cannot change it again.
                      </p>
                    )}
                    {isEditMode && !profile.nameChanged && (
                      <p className="text-xs text-orange-500 mt-2 flex items-start gap-1">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                        Warning: You can only change your name ONCE after creating your account.
                      </p>
                    )}
                  </div>

                  {/* Gender Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Gender</label>
                    <select 
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      disabled={!isEditMode}
                      className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black focus:border-transparent ${
                        !isEditMode ? 'bg-gray-100 border-transparent text-gray-600 appearance-none' : 'border-gray-300 bg-white'
                      }`}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Birthday Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Birthday</label>
                    <input 
                      type="date" 
                      value={profile.birthday}
                      onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                      disabled={!isEditMode}
                      className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-black focus:border-transparent ${
                        !isEditMode ? 'bg-gray-100 border-transparent text-gray-600' : 'border-gray-300 bg-white'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Posts Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingPosts ? (
                  <p className="text-gray-500">Loading posts...</p>
                ) : posts.length === 0 ? (
                  <p className="text-gray-500">You haven't created any posts yet.</p>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className="border border-gray-300 rounded overflow-hidden hover:shadow-lg transition-shadow">
                      <Image
                        src={post.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'}
                        alt={post.title}
                        width={400}
                        height={300}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <p className="text-sm text-gray-600 mb-2">
                          {post.type} • {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.description}</p>

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
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
