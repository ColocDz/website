'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Navbar } from '@/components/layout/navbar';
import { useI18n } from '@/lib/i18n';
import { PostGridSkeleton } from '@/components/ui/post-skeleton';

interface Post {
  id: string;
  title: string;
  type: string;
  searchType?: string;
  wilaya: string | null;
  price: string;
  maxBudget?: string | null;
  necessities?: string[];
  tags: string[];
  createdAt: string;
  author?: { id: string; name: string; image: string | null; gender?: string | null };
  description: string;
  images: string[];
}

export default function PostsPage() {
  const router = useRouter();
  const { t, dir } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedSearchType, setSelectedSearchType] = useState('');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) setAllPosts(await res.json());
      } catch (error) { console.error('Failed to fetch posts:', error); }
      finally { setIsLoading(false); }
    }
    async function fetchSavedPosts() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) { const u = await res.json(); setSavedPostIds(u.savedPostIds || []); }
      } catch { }
    }
    fetchPosts();
    fetchSavedPosts();
  }, []);

  const toggleSavePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/posts/${postId}/save`, { method: 'POST' });
      if (res.status === 401) { router.push('/login'); return; }
      if (res.ok) {
        const data = await res.json();
        setSavedPostIds(prev => data.saved ? [...prev, postId] : prev.filter(id => id !== postId));
      }
    } catch { }
  };

  const filteredPosts = useMemo(() => allPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !selectedType || post.type === selectedType;
    const matchesWilaya = !selectedWilaya || post.wilaya === selectedWilaya;
    const matchesGender = !selectedGender || post.author?.gender === selectedGender;
    const matchesSearchType = !selectedSearchType || (post.searchType || 'roommate') === selectedSearchType;
    return matchesSearch && matchesType && matchesWilaya && matchesGender && matchesSearchType;
  }), [searchQuery, selectedType, selectedWilaya, selectedGender, selectedSearchType, allPosts]);

  return (
    <div className="bg-white min-h-screen" dir={dir}>
      <Navbar />
      <div>
        {/* Search and Filter */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('posts.title')}</h1>
            <div className="space-y-4">
              {/* Search Type Toggle */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: '', label: 'All Posts', icon: '' },
                  { value: 'roommate', label: 'Roommate', icon: 'fa-solid fa-house' },
                  { value: 'roommate_and_place', label: 'Roommate + Place', icon: 'fa-solid fa-magnifying-glass-location' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedSearchType(opt.value)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${
                      selectedSearchType === opt.value
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {opt.icon && <i className={`${opt.icon} mr-1.5`} />}{opt.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-lg px-4">
                  <i className="fa-solid fa-magnifying-glass text-gray-400" />
                  <input type="text" placeholder={t('posts.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-3 py-3 focus:outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedSearchType !== 'roommate_and_place' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t('posts.type')}</label>
                    <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                      <option value="">{t('posts.allTypes')}</option>
                      <option value="Apartment">{t('type.Apartment')}</option>
                      <option value="House">{t('type.House')}</option>
                      <option value="Studio">{t('type.Studio')}</option>
                      <option value="Room">{t('type.Room')}</option>
                      <option value="Shared Space">{t('type.SharedSpace')}</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">{t('posts.wilaya')}</label>
                  <select value={selectedWilaya} onChange={(e) => setSelectedWilaya(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="">{t('posts.allWilayas')}</option>
                    {[
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
                    ].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">{t('posts.gender')}</label>
                  <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="">{t('posts.allGenders')}</option>
                    <option value="Male">{t('posts.menOnly')}</option>
                    <option value="Female">{t('posts.womenOnly')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="max-w-7xl mx-auto p-6">
          {isLoading ? (
            <PostGridSkeleton />
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => {
                const isProfilePost = (post.searchType || 'roommate') === 'roommate_and_place';

                if (isProfilePost) {
                  // Profile-style card for "roommate + place" posts
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
                    <div key={post.id} className={`group ${theme.cardBg} rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer`} onClick={() => router.push(`/post/${post.id}`)}>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full ${theme.avatarBg} flex items-center justify-center overflow-hidden`}>
                              {post.author?.image ? (
                                <Image src={post.author.image} alt={post.author.name || ''} width={48} height={48} className="object-cover w-full h-full" />
                              ) : (
                                <i className={`fa-solid fa-user ${theme.avatarIcon} text-xl`} />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{post.author?.name || 'Anonymous'}</p>
                              <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <button className="bg-white rounded-full p-2 hover:bg-gray-100 shadow-sm transition-all active:scale-90 z-10" onClick={(e) => toggleSavePost(post.id, e)}>
                            <i className={`fa-heart ${savedPostIds.includes(post.id) ? 'fa-solid text-red-500' : 'fa-regular text-gray-400'}`} />
                          </button>
                        </div>

                        <div className="flex gap-1.5 mb-3 flex-wrap">
                          <span className={`${theme.tagBadge} text-white px-2.5 py-0.5 rounded text-xs font-semibold`}>Looking for both</span>
                          {post.author?.gender && (
                            <span className={`text-white px-2.5 py-0.5 rounded text-xs font-semibold ${post.author.gender === 'Female' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                              {post.author.gender === 'Female' ? t('posts.womenOnly') : t('posts.menOnly')}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.description}</p>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <i className={`fa-solid fa-location-dot ${theme.iconColor} w-4 text-center`} />
                            <span>{post.wilaya || 'Any location'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <i className={`fa-solid fa-wallet ${theme.iconColor} w-4 text-center`} />
                            <span>Max budget: <strong>{post.maxBudget ? `${parseFloat(post.maxBudget).toLocaleString()} DA` : 'Flexible'}</strong></span>
                          </div>
                        </div>

                        {post.necessities && post.necessities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {post.necessities.slice(0, 4).map((n, i) => (
                              <span key={i} className={`inline-block bg-white ${theme.necessityText} text-xs px-2 py-0.5 rounded border ${theme.necessityBorder}`}>{n}</span>
                            ))}
                            {post.necessities.length > 4 && (
                              <span className="text-xs text-indigo-500">+{post.necessities.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Standard property card for "roommate" posts
                return (
                  <div key={post.id} className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => router.push(`/post/${post.id}`)}>
                    <div className="relative h-48 overflow-hidden bg-gray-200">
                      <Image
                        src={post.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'}
                        alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[70%]">
                        <div className="bg-black text-white px-3 py-1 rounded text-xs font-semibold">{post.type}</div>
                        {post.author?.gender && (
                          <div className={`text-white px-3 py-1 rounded text-xs font-semibold ${post.author.gender === 'Male' ? 'bg-indigo-600' : post.author.gender === 'Female' ? 'bg-pink-600' : 'bg-gray-600'}`}>
                            {post.author.gender === 'Male' ? t('posts.menOnly') : post.author.gender === 'Female' ? t('posts.womenOnly') : post.author.gender}
                          </div>
                        )}
                      </div>
                      <button className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 shadow-md transition-all active:scale-90 z-10" onClick={(e) => toggleSavePost(post.id, e)}>
                        <i className={`fa-heart ${savedPostIds.includes(post.id) ? 'fa-solid text-red-500' : 'fa-regular text-gray-600'}`} />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span className="text-xs font-medium text-gray-600">{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs">•</span>
                        <i className="fa-solid fa-location-dot text-gray-400" />
                        <span className="text-xs">{post.wilaya || 'N/A'}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{tag}</span>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="font-bold text-gray-900">{parseFloat(post.price || '0').toLocaleString()} DA<span className="text-sm font-normal text-gray-500">{t('posts.perMonth')}</span></span>
                        <span className="text-xs text-gray-500 hover:underline hover:text-black cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); if (post.author?.id) router.push(`/profile?userId=${post.author.id}`); }}>
                          {t('posts.by')} {post.author?.name || 'Anonymous'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12"><p className="text-lg text-gray-600">{t('posts.noResults')}</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
