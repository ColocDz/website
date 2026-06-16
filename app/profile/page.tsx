'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Edit2, Trash2, AlertCircle, Phone, Mail, Lock } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { useSession } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';

interface Post {
  id: string;
  type: string;
  postType?: string;
  searchType?: string;
  title: string;
  description: string;
  price?: string;
  maxBudget?: string;
  location?: string;
  wilaya?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  necessities?: string[];
  tags?: string[];
  images?: string[];
  createdAt: string;
  author?: {
    id: string;
    name: string;
    lastName?: string;
    image?: string;
    gender?: string;
  };
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
  const { t } = useI18n();
  
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

  // Tab state & synchronization
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'listings' | 'saved'>('listings');
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [searchTypeFilter, setSearchTypeFilter] = useState<'all' | 'roommate' | 'roommate_and_place'>('all');
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  useEffect(() => {
    if (tabParam === 'saved' && isOwnProfile) {
      setActiveTab('saved');
    } else {
      setActiveTab('listings');
    }
  }, [tabParam, isOwnProfile]);

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
          if (isOwnProfile) {
            setSavedPostIds(data.savedPostIds || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    }
    
    fetchProfile();
  }, [session, targetUserId, isOwnProfile]);

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

  // Fetch saved posts
  useEffect(() => {
    async function fetchSavedPosts() {
      if (!session?.user || !isOwnProfile) return;
      setIsLoadingSaved(true);
      try {
        const res = await fetch('/api/posts?saved=true');
        if (res.ok) {
          const data = await res.json();
          setSavedPosts(data);
        }
      } catch (error) {
        console.error('Failed to fetch saved posts:', error);
      } finally {
        setIsLoadingSaved(false);
      }
    }

    if (activeTab === 'saved') {
      fetchSavedPosts();
    }
  }, [activeTab, session, isOwnProfile]);

  // Toggle Save Post
  const toggleSavePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${postId}/save`, { method: 'POST' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSavedPostIds(prev => {
          const updated = data.saved ? [...prev, postId] : prev.filter(id => id !== postId);
          // If we unsaved a post while on the 'saved' tab, remove it from the list immediately
          if (!data.saved && activeTab === 'saved') {
            setSavedPosts(old => old.filter(p => p.id !== postId));
          }
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to toggle save post:', err);
    }
  };

  const displayedPosts = useMemo(() => {
    const currentList = activeTab === 'listings' ? posts : savedPosts;
    return currentList.filter(post => {
      if (searchTypeFilter === 'all') return true;
      return (post.searchType || 'roommate') === searchTypeFilter;
    });
  }, [activeTab, posts, savedPosts, searchTypeFilter]);

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
          {isOwnProfile ? (
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('listings')}
                className={`py-4 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'listings'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="fa-solid fa-list" />
                My Listings ({posts.length})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`py-4 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'saved'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="fa-solid fa-heart text-red-500" />
                Saved Listings ({savedPosts.length})
              </button>
            </div>
          ) : (
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {profile.name}'s Listings
            </h2>
          )}

          {/* Tag / SearchType Filters */}
          <div className="flex flex-wrap gap-2 mb-8 items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-2 flex items-center gap-1.5">
              <i className="fa-solid fa-filter" />
              Filter by tag:
            </span>
            {[
              { value: 'all', label: 'All', icon: 'fa-solid fa-border-all' },
              { value: 'roommate', label: 'Roommate (Has Place)', icon: 'fa-solid fa-house' },
              { value: 'roommate_and_place', label: 'Roommate + Place (Needs Place)', icon: 'fa-solid fa-magnifying-glass-location' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSearchTypeFilter(opt.value as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                  searchTypeFilter === opt.value
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                }`}
              >
                <i className={opt.icon} />
                {opt.label}
              </button>
            ))}
          </div>

          {isLoadingPosts || (activeTab === 'saved' && isLoadingSaved) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-gray-150 animate-pulse rounded-xl h-64 w-full" />
              ))}
            </div>
          ) : displayedPosts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 p-8">
              <i className="fa-solid fa-folder-open text-gray-300 text-4xl mb-3" />
              <p className="text-gray-500 font-medium">No posts found matching the filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedPosts.map((post) => {
                const isProfilePost = (post.searchType || 'roommate') === 'roommate_and_place';
                
                if (isProfilePost) {
                  // Profile-style card
                  const isFemale = post.author?.gender === 'Female';
                  const theme = isFemale
                    ? {
                        cardBg: 'bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200',
                        avatarBg: 'bg-pink-100 border-2 border-pink-300',
                        avatarIcon: 'text-pink-500',
                        tagBadge: 'bg-pink-600',
                        iconColor: 'text-pink-500',
                        necessityText: 'text-pink-700',
                        necessityBorder: 'border-pink-200'
                      }
                    : {
                        cardBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-200',
                        avatarBg: 'bg-indigo-100 border-2 border-indigo-300',
                        avatarIcon: 'text-indigo-500',
                        tagBadge: 'bg-blue-600',
                        iconColor: 'text-indigo-500',
                        necessityText: 'text-indigo-700',
                        necessityBorder: 'border-indigo-200'
                      };

                  return (
                    <div
                      key={post.id}
                      className={`group relative ${theme.cardBg} rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer justify-between`}
                      onClick={() => router.push(`/post/${post.id}`)}
                    >
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full ${theme.avatarBg} flex items-center justify-center overflow-hidden`}>
                                {post.author?.image ? (
                                  <Image
                                    src={post.author.image}
                                    alt={post.author.name || ''}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                  />
                                ) : (
                                  <i className={`fa-solid fa-user ${theme.avatarIcon} text-base`} />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-xs">{post.author?.name || 'Anonymous'}</p>
                                <p className="text-[10px] text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <button
                              className="bg-white rounded-full p-2 hover:bg-gray-150 shadow-sm transition-all active:scale-90 z-10"
                              onClick={(e) => toggleSavePost(post.id, e)}
                            >
                              <i className={`fa-heart ${savedPostIds.includes(post.id) ? 'fa-solid text-red-500' : 'fa-regular text-gray-400'}`} />
                            </button>
                          </div>

                          <div className="flex gap-1 mb-2.5 flex-wrap">
                            <span className={`${theme.tagBadge} text-white px-2 py-0.5 rounded text-[10px] font-semibold`}>Looking for both</span>
                            {post.author?.gender && (
                              <span className={`text-white px-2 py-0.5 rounded text-[10px] font-semibold ${post.author.gender === 'Female' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                                {post.author.gender === 'Female' ? t('posts.womenOnly') : t('posts.menOnly')}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-1">{post.title}</h3>
                          <p className="text-gray-600 text-xs mb-3 line-clamp-2">{post.description}</p>

                          <div className="space-y-1.5 text-xs text-gray-700">
                            <div className="flex items-center gap-2">
                              <i className={`fa-solid fa-location-dot ${theme.iconColor} w-4 text-center`} />
                              <span>{post.wilaya || 'Any location'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className={`fa-solid fa-wallet ${theme.iconColor} w-4 text-center`} />
                              <span>Max budget: <strong>{post.maxBudget ? `${parseFloat(post.maxBudget).toLocaleString()} DA` : 'Flexible'}</strong></span>
                            </div>
                          </div>
                        </div>

                        {post.necessities && post.necessities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {post.necessities.slice(0, 3).map((n, i) => (
                              <span key={i} className={`inline-block bg-white ${theme.necessityText} text-[10px] px-1.5 py-0.5 rounded border ${theme.necessityBorder}`}>{n}</span>
                            ))}
                            {post.necessities.length > 3 && (
                              <span className="text-[10px] text-indigo-500">+{post.necessities.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      {isOwnProfile && activeTab === 'listings' && (
                        <div className="flex gap-2 border-t border-gray-100 p-4 bg-white">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditPost(post.id); }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-xs font-semibold border border-gray-200"
                            title="Edit post"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-xs font-semibold border border-red-100"
                            title="Delete post"
                          >
                            <i className="fa-solid fa-trash" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                // Standard roommate post card
                return (
                  <div
                    key={post.id}
                    className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer justify-between"
                    onClick={() => router.push(`/post/${post.id}`)}
                  >
                    <div>
                      <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                        <Image
                          src={post.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                        <button
                          className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 shadow-md transition-all active:scale-90 z-10"
                          onClick={(e) => toggleSavePost(post.id, e)}
                        >
                          <i className={`fa-heart ${savedPostIds.includes(post.id) ? 'fa-solid text-red-500' : 'fa-regular text-gray-600'}`} />
                        </button>
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[70%]">
                          <div className="bg-black text-white px-2.5 py-0.5 rounded text-[10px] font-semibold">
                            {post.type}
                          </div>
                          {post.author?.gender && (
                            <div className={`text-white px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                              post.author.gender.toUpperCase() === 'MALE' ? 'bg-blue-600' : post.author.gender.toUpperCase() === 'FEMALE' ? 'bg-pink-600' : 'bg-gray-600'
                            }`}>
                              {post.author.gender.toUpperCase() === 'MALE' ? t('posts.menOnly') : post.author.gender.toUpperCase() === 'FEMALE' ? t('posts.womenOnly') : post.author.gender}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-[10px] text-gray-400 mb-1">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                        <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">{post.title}</h3>
                        <p className="text-gray-600 text-xs mb-3 line-clamp-2">{post.description}</p>
                        
                        {post.price && (
                          <p className="text-sm font-extrabold text-gray-900">
                            {parseFloat(post.price).toLocaleString()} DA <span className="text-[10px] text-gray-400 font-normal">/month</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {isOwnProfile && activeTab === 'listings' && (
                      <div className="flex gap-2 border-t border-gray-100 p-4 bg-white">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditPost(post.id); }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-xs font-semibold border border-gray-200"
                          title="Edit post"
                        >
                          <i className="fa-solid fa-pen-to-square" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-xs font-semibold border border-red-100"
                          title="Delete post"
                        >
                          <i className="fa-solid fa-trash" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
