'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Heart, ArrowLeft, MessageSquare, Tag } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { useSession } from '@/lib/auth-client';

interface PostDetail {
  id: string;
  title: string;
  type: string;
  wilaya: string | null;
  price: number;
  tags: string[];
  createdAt: string;
  description: string;
  images: string[];
  authorId: string;
  author: {
    id: string;
    name: string;
    lastName: string | null;
    image: string | null;
  };
}

export default function PostDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const unwrappedParams = React.use(params);
  
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    async function checkIdentity() {
      try {
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          setIsPhoneVerified(!!userData.phoneVerified);
        } else {
          setIsPhoneVerified(false);
        }
      } catch (error) {
        console.error('Failed to check phone status');
        setIsPhoneVerified(false);
      }
    }
    
    if (session) {
      checkIdentity();
    } else if (session === null) {
      setIsPhoneVerified(false); // guest user
    }
  }, [session]);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${unwrappedParams.id}`);
        if (!res.ok) {
          throw new Error('Post not found');
        }
        const data = await res.json();
        setPost(data);
      } catch (error: any) {
        setErrorMsg(error.message || 'Error fetching post');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPost();
  }, [unwrappedParams.id]);

  const handleMessageAuthor = async () => {
    if (!session || !post) return;
    
    // Auto-create conversation or redirect to messages tab with selected user
    // For prototype, we'll just go to messages page
    // Note: To fully implement, we'd create the conversation via a POST to /api/messages
    router.push('/messages');
  };

  if (isLoading || isPhoneVerified === null) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500 text-lg">Loading post details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      {/* Verification Block */}
      {!isPhoneVerified ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center shadow-sm max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-800 mb-2">Phone Verification Required</h2>
            <p className="text-red-700 mb-6">
              You need to verify your account phone number in the personal informations before you can view full post details or message authors.
            </p>
            <button
              onClick={() => router.push('/settings')}
              className="w-full px-6 py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors"
            >
              Go to Personal Info
            </button>
            <button
              onClick={() => router.push('/posts')}
              className="w-full px-6 py-3 mt-3 bg-white border border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-50 transition-colors"
            >
              Back to listings
            </button>
          </div>
        </div>
      ) : errorMsg || !post ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-red-500 mb-6">{errorMsg || 'Post not found'}</p>
            <button onClick={() => router.push('/posts')} className="px-6 py-2 bg-black text-white rounded">Back</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-gray-50 pb-12">
          {/* Header Bar */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
              <button 
                onClick={() => router.push('/posts')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft size={20} /> Back to Search
              </button>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium">
                  <Heart size={18} /> Save
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Image Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden cursor-pointer group">
                  <Image 
                    src={post.images?.[activeImageIdx] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'} 
                    alt="Main Image"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded text-sm font-semibold tracking-wide">
                    {post.type}
                  </div>
                </div>
                <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-2">
                  {[1, 2, 3, 4].map((idx) => (
                    <div 
                      key={idx} 
                      onClick={() => post.images?.[idx] && setActiveImageIdx(idx)}
                      className={`relative h-full rounded-xl overflow-hidden ${post.images?.[idx] ? 'cursor-pointer hover:opacity-90' : 'bg-gray-100'}`}
                    >
                      {post.images?.[idx] ? (
                        <Image 
                          src={post.images[idx]} 
                          alt={`Image ${idx}`}
                          fill
                          className="object-cover transition-opacity"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No Image
                        </div>
                      )}
                      
                      {/* Overlay for remaining images if > 5 */}
                      {idx === 4 && post.images?.length > 5 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                          +{post.images.length - 5}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  {/* Title and Price Info */}
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                        {post.title}
                      </h1>
                    </div>
                    
                    <div className="flex items-center gap-6 text-gray-600 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-gray-400" />
                        <span className="font-medium">{post.wilaya || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Posted: {new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Description */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">About this property</h2>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                      {post.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Tag size={20} className="text-gray-400" /> Tags & Amenities
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Sticky Panel */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-gray-900">{post.price}</span>
                      <span className="text-gray-500 font-medium"> DA / month</span>
                    </div>

                    <hr className="border-gray-200 my-6" />

                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Posted By</h3>
                      <div className="flex items-center gap-4">
                        <Image
                          src={post.author?.image || 'https://www.w3schools.com/howto/img_avatar2.png'}
                          alt={post.author?.name || 'Author'}
                          width={56}
                          height={56}
                          className="rounded-full bg-gray-100 object-cover"
                        />
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            {post.author?.name} {post.author?.lastName}
                          </p>
                          <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                            ✓ Identity Verified
                          </p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleMessageAuthor}
                      className="w-full bg-black text-white px-6 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={20} />
                      Message Host
                    </button>
                    
                    <p className="text-xs text-gray-400 text-center mt-4">
                      Never wire money or make advance payments outside the platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
