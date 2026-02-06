'use client';

import React, { useState } from 'react';
import { SidebarLayout } from '@/components/sidebar-layout';
import { Heart, MessageCircle, MoreHorizontal, Search, ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface Post {
  id: number;
  image: string;
  user: {
    name: string;
    avatar: string;
  };
  timeAgo: string;
  likes: number;
  comments: number;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const posts: Post[] = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&h=350&fit=crop',
      user: { name: 'Marya', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marya' },
      timeAgo: '1 day ago',
      likes: 3,
      comments: 41,
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=350&fit=crop',
      user: { name: 'Tatiana', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tatiana' },
      timeAgo: '3 days ago',
      likes: 351,
      comments: 3100,
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=350&fit=crop',
      user: { name: 'Julia', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia' },
      timeAgo: '2 hours ago',
      likes: 245,
      comments: 1800,
    }
  ];

  return (
    <SidebarLayout>
      <main className="flex-1 bg-white min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center justify-between px-8 py-4">
            {/* Search Bar */}
            <div className="flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-full">
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* Explore Dropdown and Profile */}
            <div className="flex items-center gap-6 ml-8">
              <button className="flex items-center gap-2 text-gray-800 font-semibold hover:text-gray-600">
                Explore
                <ChevronDown size={20} />
              </button>
              <div className="flex items-center gap-3 cursor-pointer">
                <Image
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Kiara"
                  alt="User profile"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">Kiara</span>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-8 py-12 text-center bg-gradient-to-b from-gray-50 to-white">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Colocation</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            find trustfull person to live with and live safly with comfortableness with ColocDZ make it happen
          </p>
        </section>

        {/* Posts Grid */}
        <section className="px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                {/* Post Image */}
                <div className="relative h-48 bg-gray-200 group">
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt="Post"
                    fill
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                  
                  {/* Window Controls */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-60">
                    <button className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-xs text-gray-400 hover:bg-gray-100">−</button>
                    <button className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-xs text-gray-400 hover:bg-gray-100">◻</button>
                    <button className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-xs text-gray-400 hover:bg-gray-100">×</button>
                  </div>
                </div>

                {/* Post Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={post.user.avatar || "/placeholder.svg"}
                        alt={post.user.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 text-sm">{post.user.name}</span>
                        <span className="text-gray-500 text-xs">{post.timeAgo}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-6 text-gray-600 text-sm">
                    <button className="flex items-center gap-1 hover:text-pink-500 transition-colors">
                      <Heart size={16} />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                      <MessageCircle size={16} />
                      <span>{post.comments}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </SidebarLayout>
  );
}
