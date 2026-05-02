'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, MapPin, Heart } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';

interface Post {
  id: string;
  title: string;
  type: string;
  wilaya: string | null;
  price: number;
  tags: string[];
  createdAt: string;
  user?: { name: string; image: string | null };
  description: string;
  images: string[];
}

export default function PostsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => allPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !selectedType || post.type === selectedType;
    const matchesWilaya = !selectedWilaya || post.wilaya === selectedWilaya;
    return matchesSearch && matchesType && matchesWilaya;
  }), [searchQuery, selectedType, selectedWilaya, allPosts]);

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div>
        {/* Search and Filter */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse All Listings</h1>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-lg px-4">
                  <Search size={20} className="text-gray-400" />
                  <input type="text" placeholder="Search posts, tags, or descriptions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-3 py-3 focus:outline-none text-sm"/>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Type</label>
                  <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="">All Types</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Studio">Studio</option>
                    <option value="Room">Room</option>
                    <option value="Shared Space">Shared Space</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Wilaya</label>
                  <select value={selectedWilaya} onChange={(e) => setSelectedWilaya(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="">All Wilayas</option>
                    <option value="16 - Alger">16 - Alger</option>
                    <option value="31 - Oran">31 - Oran</option>
                    <option value="25 - Constantine">25 - Constantine</option>
                    <option value="09 - Blida">09 - Blida</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="max-w-7xl mx-auto p-6">
          {isLoading ? (
            <div className="text-center py-12"><p className="text-lg text-gray-600">Loading posts...</p></div>
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
                    <div className="absolute top-3 left-3 bg-black text-white px-3 py-1 rounded text-xs font-semibold">{post.type}</div>
                    <button className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); console.log('Saved'); }}><Heart size={18}/></button>
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
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-900">{post.price} DA/month</span>
                      <span className="text-xs text-gray-500">by {post.user?.name || 'Anonymous'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12"><p className="text-lg text-gray-600">No posts found matching your criteria</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
