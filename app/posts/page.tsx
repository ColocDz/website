'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, MapPin, Heart } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { useI18n } from '@/lib/i18n';

interface Post {
  id: string;
  title: string;
  type: string;
  wilaya: string | null;
  price: string;
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
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const data = await res.json();
          setAllPosts(data);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    }
    async function fetchSavedPosts() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const user = await res.json();
          setSavedPostIds(user.savedPostIds || []);
        }
      } catch (e) {
        console.error('Not logged in or failed to fetch user saved posts');
      }
    }
    fetchPosts();
    fetchSavedPosts();
  }, []);

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
        if (data.saved) {
          setSavedPostIds(prev => [...prev, postId]);
        } else {
          setSavedPostIds(prev => prev.filter(id => id !== postId));
        }
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const filteredPosts = useMemo(() => allPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !selectedType || post.type === selectedType;
    const matchesWilaya = !selectedWilaya || post.wilaya === selectedWilaya;
    const matchesGender = !selectedGender || post.author?.gender === selectedGender;
    return matchesSearch && matchesType && matchesWilaya && matchesGender;
  }), [searchQuery, selectedType, selectedWilaya, selectedGender, allPosts]);

  return (
    <div className="bg-white min-h-screen" dir={dir}>
      <Navbar />
      <div>
        {/* Search and Filter */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('posts.title')}</h1>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-lg px-4">
                  <Search size={20} className="text-gray-400" />
                  <input type="text" placeholder={t('posts.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-3 py-3 focus:outline-none text-sm"/>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="text-center py-12"><p className="text-lg text-gray-600">{t('posts.loading')}</p></div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <div key={post.id} className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => router.push(`/post/${post.id}`)}>
                  <div className="relative h-48 overflow-hidden bg-gray-200">
                    <Image 
                      src={post.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'} 
                      alt={post.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[70%]">
                      <div className="bg-black text-white px-3 py-1 rounded text-xs font-semibold">{post.type}</div>
                      {post.author?.gender && (
                        <div className={`text-white px-3 py-1 rounded text-xs font-semibold ${
                          post.author.gender === 'Male' ? 'bg-indigo-600' : post.author.gender === 'Female' ? 'bg-pink-600' : 'bg-gray-600'
                        }`}>
                          {post.author.gender === 'Male' ? t('posts.menOnly') : post.author.gender === 'Female' ? t('posts.womenOnly') : post.author.gender}
                        </div>
                      )}
                    </div>
                    <button 
                      className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 shadow-md transition-all active:scale-90 z-10" 
                      onClick={(e) => toggleSavePost(post.id, e)}
                    >
                      <Heart 
                        size={18} 
                        fill={savedPostIds.includes(post.id) ? "red" : "none"} 
                        className={savedPostIds.includes(post.id) ? "text-red-500" : "text-gray-600"} 
                      />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <span className="text-xs font-medium text-gray-600">{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs">•</span>
                      <MapPin size={14} className="text-gray-400"/>
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
                      <span 
                        className="text-xs text-gray-500 hover:underline hover:text-black cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (post.author?.id) {
                            router.push(`/profile?userId=${post.author.id}`);
                          }
                        }}
                      >
                        {t('posts.by')} {post.author?.name || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12"><p className="text-lg text-gray-600">{t('posts.noResults')}</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
