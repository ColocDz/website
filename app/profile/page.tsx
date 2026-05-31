'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Edit2, Trash2, AlertCircle, Phone, Mail, Lock } from 'lucide-react';
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
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  birthday: string;
  isPrivate: boolean;
  nameChanged: boolean;
  image: string;
  identityVerified?: boolean;
  faceVerified?: boolean;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  
  const targetUserId = searchParams.get('userId');
  const isOwnProfile = !targetUserId || targetUserId === session?.user?.id;

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile Data
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    birthday: '',
    isPrivate: false,
    nameChanged: false,
    image: '',
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
        const url = targetUserId ? `/api/user?userId=${targetUserId}` : '/api/user';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setProfile({
            id: data.id || '',
            name: data.name || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            gender: data.gender || '',
            birthday: data.birthday ? new Date(data.birthday).toISOString().split('T')[0] : '',
            isPrivate: data.isPrivate || false,
            nameChanged: data.nameChanged || false,
            image: data.image || '',
            identityVerified: data.identityVerified || false,
            faceVerified: data.faceVerified || false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    }
    
    fetchProfile();
  }, [session, targetUserId]);

  // Fetch user posts
  useEffect(() => {
    async function fetchUserPosts() {
      const activeId = targetUserId || session?.user?.id;
      if (!activeId) return;
      try {
        const res = await fetch(`/api/posts?userId=${activeId}`);
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
      fetchUserPosts();
    }
  }, [session, isPending, targetUserId]);

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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading...</div>;
  }

  const avatarUrl = profile.image || (profile.email ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.email)}` : "https://www.w3schools.com/howto/img_avatar2.png");

  return (
    <div className="bg-gray-50 min-h-screen">
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false })}
      />

      <Navbar />

      <div className="max-w-6xl mx-auto py-12 px-6">
        {/* Profile Card / Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-8 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative">
            <Image
              src={avatarUrl}
              alt={`${profile.name}'s Avatar`}
              width={140}
              height={140}
              unoptimized
              className="rounded-full w-32 h-32 object-cover border-4 border-gray-100 shadow-sm bg-gray-100"
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <h1 className="text-3xl font-extrabold text-gray-900">
              {profile.name} {profile.lastName || ''}
            </h1>
            
            {/* Contact details */}
            <div className="flex flex-col md:flex-row gap-4 text-sm justify-center md:justify-start">
              {profile.email ? (
                <div className="flex items-center gap-2 justify-center text-gray-600">
                  <Mail size={16} className="text-gray-400" />
                  <span>{profile.email}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center text-gray-400 italic">
                  <Mail size={16} className="text-gray-300" />
                  <span>Private email</span>
                </div>
              )}

              {profile.phone ? (
                <div className="flex items-center gap-2 justify-center text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <span>+213 {profile.phone}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center text-gray-400 italic">
                  <Phone size={16} className="text-gray-300" />
                  <span>Private phone number</span>
                </div>
              )}
            </div>

            {/* Verification badging */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${profile.faceVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-500'}`}>
                {profile.faceVerified ? '✓ Face Verified' : 'Face Not Verified'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${profile.identityVerified ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-gray-100 text-gray-500'}`}>
                {profile.identityVerified ? '✓ Identity Verified' : 'Identity Not Verified'}
              </span>
            </div>

            {/* Privacy toggle for own profile */}
            {isOwnProfile && (
              <div className="mt-4 flex items-center justify-center md:justify-start gap-3 pt-2">
                <span className="text-sm font-semibold text-gray-700">Account Privacy:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.isPrivate}
                    disabled={!isEditMode}
                    onChange={(e) => setProfile({ ...profile, isPrivate: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className={`group peer ring-0 rounded-full outline-none duration-300 w-14 h-7 shadow-inner transition-all ${profile.isPrivate ? 'bg-emerald-500' : 'bg-rose-400'} ${!isEditMode && 'opacity-70'}`}>
                    <div className={`absolute top-0.5 left-0.5 bg-white rounded-full w-6 h-6 transition-transform duration-300 ${profile.isPrivate ? 'translate-x-7' : ''}`} />
                  </div>
                </label>
                <span className="text-xs text-gray-500">
                  {profile.isPrivate ? 'Visible but contact info is hidden' : 'Fully visible'}
                </span>
              </div>
            )}

            {/* Notice if viewing a private profile */}
            {!isOwnProfile && profile.isPrivate && (
              <div className="mt-4 flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-100 px-4 py-2.5 rounded-lg text-xs justify-center md:justify-start">
                <Lock size={14} className="flex-shrink-0" />
                <span>This user's profile is set to private. Contact details are hidden.</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto md:ml-auto">
            {isOwnProfile ? (
              <>
                <button
                  onClick={toggleEditMode}
                  disabled={isSaving}
                  className={`px-8 py-3 rounded-lg font-semibold transition-colors shadow-sm ${
                    isEditMode 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-black hover:bg-gray-800 text-white'
                  }`}
                >
                  {isSaving ? 'Saving...' : isEditMode ? 'Save Profile' : 'Edit Profile'}
                </button>
                <button
                  onClick={() => router.push('/adding-post')}
                  className="border border-gray-300 bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Add Post +
                </button>
              </>
            ) : (
              session?.user && (
                <button
                  onClick={() => router.push(`/messages?startChat=${profile.id}`)}
                  className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-sm"
                >
                  Message User
                </button>
              )
            )}
          </div>
        </div>

        {/* Account Information Form */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Details</h2>
          
          {saveError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {saveError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">First Name</label>
              <input 
                type="text" 
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                disabled={!isEditMode || profile.nameChanged}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  (!isEditMode || profile.nameChanged) ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed' : 'border-gray-300 bg-white'
                }`}
                placeholder="First name" 
              />
              
              {isEditMode && profile.nameChanged && (
                <p className="text-xs text-red-500 mt-2 flex items-start gap-1">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  First name can only be changed once.
                </p>
              )}
            </div>

            {/* Last Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name</label>
              <input 
                type="text" 
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                disabled={!isEditMode || profile.nameChanged}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  (!isEditMode || profile.nameChanged) ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed' : 'border-gray-300 bg-white'
                }`}
                placeholder="Last name" 
              />
            </div>

            {/* Gender Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Gender</label>
              <select 
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                disabled={!isEditMode}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                  !isEditMode ? 'bg-gray-50 border-gray-200 text-gray-600 appearance-none' : 'border-gray-300 bg-white'
                }`}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Birthday Input */}
            {isOwnProfile && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Birthday</label>
                <input 
                  type="date" 
                  value={profile.birthday}
                  onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                  disabled={!isEditMode}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${
                    !isEditMode ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed' : 'border-gray-300 bg-white'
                  }`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Posts Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isOwnProfile ? 'Your Listings' : `${profile.name}'s Listings`}
          </h2>
          {isLoadingPosts ? (
            <p className="text-gray-500">Loading listings...</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-500 italic">No listings found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col cursor-pointer" onClick={() => router.push(`/post/${post.id}`)}>
                  <div className="relative h-48 w-full bg-gray-100">
                    <Image
                      src={post.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-2">
                        {post.type} • {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{post.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.description}</p>
                    </div>

                    <div className="flex gap-2 border-t border-gray-100 pt-4 mt-2 w-full">
                      {isOwnProfile ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditPost(post.id); }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-xs font-semibold border border-gray-200"
                            title="Edit post"
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-xs font-semibold border border-red-100"
                            title="Delete post"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/post/${post.id}`); }}
                          className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors text-xs font-bold text-center"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
