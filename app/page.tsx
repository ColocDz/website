'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, Heart } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

interface Post {
  id: string;
  title: string;
  type: string;
  description: string;
  tags: string[];
  images: string[];
  createdAt: string;
  author?: { id: string; name: string; image: string | null };
}

export default function HomePage() {
  const router = useRouter();
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/posts');
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

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Tenant, San Francisco',
      quote: 'Found my perfect roommate in two weeks and couldn\'t be happier with the match.',
    },
    {
      name: 'Marcus Webb',
      role: 'Homeowner, Portland',
      quote: 'The process was simple and I met someone who truly fits our household.',
    },
    {
      name: 'Elena Rodriguez',
      role: 'Renter, Austin',
      quote: 'No more endless searching, just honest listings and real connections.',
    },
  ];

  const faqs = [
    {
      question: 'How do I post a listing?',
      answer: 'Create an account and click the post button on the home page. Fill in your details about the space, add photos, set your price, and publish. You can edit or delete anytime.',
    },
    {
      question: 'Can I message people privately?',
      answer: 'Yes. Once you find a listing that interests you, use the messaging feature to contact the poster directly. All conversations stay private between you and the other person.',
    },
    {
      question: 'What if I change my mind?',
      answer: 'You can delete your post at any time from your account. If you\'ve already connected with someone, let them know through the messaging system before removing your listing.',
    },
    {
      question: 'Is my information safe here?',
      answer: 'We take privacy seriously. Your personal details are only shared when you choose to message someone. Never share payment information through our platform.',
    },
    {
      question: 'How much does it cost?',
      answer: 'Posting and searching are completely free. HomeShare makes money through optional premium features, but the basics cost nothing.',
    },
  ];

  // Helper to format relative time
  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Posted ${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Posted ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `Posted ${days}d ago`;
  }

  return (
    <div className="bg-white">
      <Navbar />

      {/* Main Content */}
      <div>
        {/* Hero Section - Ready to find your place */}
        <section className="py-16 px-6 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Ready to find your place</h1>
          <p className="text-gray-600 mb-8">Post what you need or search for the right fit today</p>
          <div className="flex gap-4 justify-center">
            <button className="bg-black text-white px-8 py-2 rounded hover:bg-gray-800"><a href="/adding-post">Post</a></button>
            <button 
              onClick={() => setShowSearchBar(!showSearchBar)}
              className="border border-gray-300 text-gray-900 px-8 py-2 rounded hover:bg-gray-50"
            >
              Search
            </button>
          </div>

          {/* Search Bar */}
          {showSearchBar && (
            <div className="mt-6 max-w-2xl mx-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for apartments, rooms, houses..."
                className="w-full px-6 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                onClick={() => router.push('/posts')}
                className="mt-4 w-full bg-black text-white px-8 py-2 rounded hover:bg-gray-800"
              >
                Search &amp; View All Posts
              </button>
            </div>
          )}
          <div className="mt-12 bg-gray-200 h-96 rounded flex items-center justify-center">
            <Image
              src="https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=800&h=400&fit=crop"
              alt="Hero"
              width={800}
              height={400}
              className="w-full h-full object-cover rounded"
            />
          </div>
        </section>

        {/* Find your next home Section */}
        <section className="py-16 px-6 bg-gray-50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Find your next home</h2>
              <p className="text-gray-600">Browse available rooms and shared spaces from people looking for roommates</p>
            </div>
            <button
              onClick={() => router.push('/posts')}
              className="border border-gray-300 text-gray-900 px-6 py-2 rounded hover:bg-gray-100"
            >
              View all
            </button>
          </div>
          {isLoadingPosts ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No posts yet. Be the first to post!</p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-300 rounded overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer relative" onClick={() => router.push(`/post/${post.id}`)}>
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  <Image
                    src={post.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'}
                    alt={post.title}
                    width={400}
                    height={300}
                    loading="eager"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Save Button */}
                  <button 
                    className="absolute top-3 right-3 bg-white rounded-full p-1.5 hover:bg-gray-100 shadow-sm transition-all active:scale-90 z-20" 
                    onClick={(e) => toggleSavePost(post.id, e)}
                  >
                    <Heart 
                      size={16} 
                      fill={savedPostIds.includes(post.id) ? "red" : "none"} 
                      className={savedPostIds.includes(post.id) ? "text-red-500" : "text-gray-600"} 
                    />
                  </button>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-10">
                    <div>
                      <p className="text-white text-xs font-semibold">{post.type}</p>
                      <p className="text-white text-xs mt-1">{timeAgo(post.createdAt)}</p>
                    </div>
                    <div className="text-white">
                      <p 
                        className="text-sm font-semibold hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (post.author?.id) {
                            router.push(`/profile?userId=${post.author.id}`);
                          }
                        }}
                      >
                        {post.author?.name || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.description}</p>
                  
                  {/* Tags */}
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
                  
                  <span className="text-gray-900 font-semibold flex items-center gap-1 hover:text-gray-600">
                    View details <span>›</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Real Stories Section */}
        <section className="py-16 px-6">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-2">Real stories</h2>
          <p className="text-gray-600 text-center mb-12">People finding their place</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="border border-gray-300 p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="fill-gray-900 text-gray-900" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <Image
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.name}`}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-6 bg-gray-50">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Questions</h2>
          <p className="text-gray-600 mb-8">Everything you need to know about finding your next home</p>
          <div className="max-w-2xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-300">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-100"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <span className="text-2xl text-blue-600">{activeAccordion === idx ? '−' : '+'}</span>
                </button>
                {activeAccordion === idx && (
                  <div className="p-6 bg-white border-t border-gray-300 text-gray-700">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Get started Section */}
        <section className="py-16 px-6 border border-gray-300 m-6 rounded">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-2">Get started finding your match</h2>
          <p className="text-gray-600 text-center mb-8">Join others who&apos;ve found their place through ColocDZ Platform</p>
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="search ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded"
            />
            <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">Get started</button>
          </div>
          <p className="text-sm text-gray-600 text-center mt-4">
            You can post , message and even search for matches. just with one easy fast click 
          </p>
        </section>

        <Footer />
      </div>
    </div>
  );
}
