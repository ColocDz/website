'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { useSession } from '@/lib/auth-client';

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    lastName: string | null;
    image: string | null;
  };
}

interface PostDetail {
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
  description: string;
  images: string[];
  authorId: string;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  amenities?: string[];
  author: {
    id: string;
    name: string;
    lastName: string | null;
    image: string | null;
    email?: string | null;
    identityVerified?: boolean;
    faceVerified?: boolean;
  };
  comments?: Comment[];
}

const getUserAvatar = (user?: { image?: string | null; email?: string | null; name?: string | null } | null) => {
  if (user?.image) return user.image;
  if (user?.email) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email)}`;
  }
  if (user?.name) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
  }
  return 'https://www.w3schools.com/howto/img_avatar2.png';
};

export default function PostDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const unwrappedParams = React.use(params);
  
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isFaceVerified, setIsFaceVerified] = useState<boolean | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Comments and message overlay states
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [initialMessageText, setInitialMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    async function checkIdentity() {
      try {
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          setIsFaceVerified(!!userData.faceVerified);
          const savedIds = userData.savedPostIds || [];
          setIsSaved(savedIds.includes(unwrappedParams.id));
        } else {
          setIsFaceVerified(false);
        }
      } catch (error) {
        console.error('Failed to check face status');
        setIsFaceVerified(false);
      }
    }
    
    if (session) {
      checkIdentity();
    } else if (session === null) {
      setIsFaceVerified(false); // guest user
    }
  }, [session, unwrappedParams.id]);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${unwrappedParams.id}`);
        if (!res.ok) {
          throw new Error('Post not found');
        }
        const data = await res.json();
        setPost(data);
        if ((data.searchType || 'roommate') === 'roommate_and_place') {
          setInitialMessageText(`Hi ${data.author?.name || 'there'}! I saw your roommate + place search profile: "${data.title}" and would love to chat!`);
        } else {
          setInitialMessageText(`Hi ${data.author?.name || 'there'}! I am interested in your property listing: "${data.title}"`);
        }
      } catch (error: any) {
        setErrorMsg(error.message || 'Error fetching post');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPost();
  }, [unwrappedParams.id]);

  const toggleSavePost = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    try {
      const res = await fetch(`/api/posts/${unwrappedParams.id}/save`, { method: 'POST' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.saved);
      }
    } catch (error) {
      console.error('Error toggling save post:', error);
    }
  };

  const handleMessageAuthor = () => {
    if (!session || !post) return;
    setMessageModalOpen(true);
  };

  const handleSendMessageSubmit = async () => {
    if (!initialMessageText.trim() || !post) return;
    setIsSendingMessage(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: post.authorId,
          content: initialMessageText.trim()
        })
      });
      if (res.ok) {
        router.push('/messages');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while sending message');
    } finally {
      setIsSendingMessage(false);
      setMessageModalOpen(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText.trim() })
      });
      if (res.ok) {
        const newComment = await res.json();
        setPost(prev => prev ? {
          ...prev,
          comments: [newComment, ...(prev.comments || [])]
        } : null);
        setCommentText('');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to post comment');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while posting comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading || isFaceVerified === null) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500 text-lg">Loading post details...</p>
        </div>
      </div>
    );
  }

  const isProfilePost = post && (post.searchType || 'roommate') === 'roommate_and_place';

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      {/* Verification Block */}
      {!isFaceVerified ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center shadow-sm max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-800 mb-2">Face Verification Required</h2>
            <p className="text-red-700 mb-6">
              You need to verify your identity via face detection before you can view full post details or message authors.
            </p>
            <button
              onClick={() => router.push('/settings')}
              className="w-full px-6 py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors"
            >
              Go to Face Verification
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
                <i className="fa-solid fa-arrow-left" /> Back to Search
              </button>
              <button 
                onClick={toggleSavePost}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium active:scale-95 shadow-sm"
              >
                <i className={`fa-heart ${isSaved ? 'fa-solid text-red-500' : 'fa-regular text-gray-600'}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* Image Gallery (Roommate post) or Profile Banner (Roommate + Place post) */}
              {!isProfilePost ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                  <div 
                    onClick={() => setIsLightboxOpen(true)}
                    className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden cursor-pointer group"
                  >
                    <Image 
                      src={post.images?.[activeImageIdx] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'} 
                      alt="Main Image"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded text-sm font-semibold tracking-wide z-10">
                      {post.type}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-sm text-white px-3 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to zoom
                    </div>
                  </div>
                  <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-2">
                    {(() => {
                      const otherImages = (post.images || []).map((img, originalIdx) => ({ img, originalIdx }))
                        .filter(item => item.originalIdx !== activeImageIdx);

                      return [0, 1, 2, 3].map((slotIdx) => {
                        const item = otherImages[slotIdx];
                        return (
                          <div 
                            key={slotIdx} 
                            onClick={() => {
                              if (item) {
                                setActiveImageIdx(item.originalIdx);
                              }
                            }}
                            className={`relative h-full rounded-xl overflow-hidden ${item ? 'cursor-pointer hover:opacity-90' : 'bg-gray-100'}`}
                          >
                            {item ? (
                              <Image 
                                src={item.img} 
                                alt={`Gallery image ${slotIdx + 1}`}
                                fill
                                className="object-cover transition-opacity"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50/50 text-sm font-medium">
                                No Image
                              </div>
                            )}
                            
                            {/* Overlay for remaining images if total > 5 and this is the 4th thumbnail slot */}
                            {slotIdx === 3 && otherImages.length > 4 && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsLightboxOpen(true);
                                }}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl cursor-pointer hover:bg-black/60 transition-colors"
                              >
                                +{otherImages.length - 3}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white flex flex-col md:flex-row items-center gap-6">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">
                    {post.author?.image ? (
                      <Image 
                        src={post.author.image} 
                        alt={post.author.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <i className="fa-solid fa-user text-5xl text-gray-400" />
                    )}
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                      Roommate + Place Search
                    </span>
                    <h1 className="text-3xl font-extrabold">{post.title}</h1>
                    <p className="text-white/90 font-medium">
                      Posted by {post.author?.name} {post.author?.lastName}
                    </p>
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  {/* Title and Price Info */}
                  <div>
                    {!isProfilePost && (
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                        {post.title}
                      </h1>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-6 text-gray-600 text-sm">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-location-dot text-gray-400" />
                        <span className="font-medium">{post.wilaya || 'N/A'}</span>
                      </div>
                      {post.location && (
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-map-pin text-gray-400" />
                          <span className="font-medium">{post.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-calendar-days text-gray-400" />
                        <span className="font-medium">Posted: {new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Bedrooms/Bathrooms/Amenities info for roommate posts */}
                  {!isProfilePost && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                          <i className="fa-solid fa-bed text-2xl text-indigo-500 mb-2" />
                          <span className="text-xs text-gray-500 font-medium">Bedrooms</span>
                          <span className="text-lg font-bold text-gray-900">{post.bedrooms || '0'}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                          <i className="fa-solid fa-bath text-2xl text-indigo-500 mb-2" />
                          <span className="text-xs text-gray-500 font-medium">Bathrooms</span>
                          <span className="text-lg font-bold text-gray-900">{post.bathrooms || '0'}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
                          <i className="fa-solid fa-house-user text-2xl text-indigo-500 mb-2" />
                          <span className="text-xs text-gray-500 font-medium">Property Type</span>
                          <span className="text-lg font-bold text-gray-900">{post.type}</span>
                        </div>
                      </div>
                      <hr className="border-gray-200" />
                    </>
                  )}

                  {/* Description */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      {isProfilePost ? 'About Me' : 'About this property'}
                    </h2>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                      {post.description}
                    </p>
                  </div>

                  {/* Amenities (Roommate) or Necessities (Roommate + Place) */}
                  {isProfilePost ? (
                    post.necessities && post.necessities.length > 0 && (
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <i className="fa-solid fa-list-check text-gray-400" /> Roommate & Place Necessities
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {post.necessities.map((item, idx) => (
                            <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-full text-sm font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  ) : (
                    post.amenities && post.amenities.length > 0 && (
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <i className="fa-solid fa-list-check text-gray-400" /> Amenities
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {post.amenities.map((item, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-tags text-gray-400" /> Tags
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <hr className="border-gray-200" />

                  {/* Comments Section */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">Comments ({post.comments?.length || 0})</h2>
                    
                    {session ? (
                      <form onSubmit={handleCommentSubmit} className="space-y-3">
                        <textarea
                          placeholder="Ask a question or leave a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={3}
                          maxLength={300}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none text-sm"
                        />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{300 - commentText.length} characters remaining</span>
                          <button
                            type="submit"
                            disabled={isSubmittingComment || !commentText.trim()}
                            className="px-5 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                          >
                            {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-600">
                          Please <a href="/login" className="underline font-bold text-black">login</a> to ask questions or post comments.
                        </p>
                      </div>
                    )}

                    <div className="space-y-4 mt-6">
                      {!post.comments || post.comments.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No comments yet. Be the first to ask a question!</p>
                      ) : (
                        post.comments.map((comment) => (
                          <div key={comment.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-start gap-4">
                            <Image
                              src={getUserAvatar(comment.author)}
                              alt={comment.author?.name || 'User'}
                              width={40}
                              height={40}
                              unoptimized
                              className="rounded-full bg-gray-100 object-cover flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                              onClick={() => {
                                if (comment.author?.id) {
                                  router.push(`/profile?userId=${comment.author.id}`);
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span 
                                  className="font-semibold text-gray-900 text-sm hover:underline cursor-pointer"
                                  onClick={() => {
                                    if (comment.author?.id) {
                                      router.push(`/profile?userId=${comment.author.id}`);
                                    }
                                  }}
                                >
                                  {comment.author?.name} {comment.author?.lastName}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm whitespace-pre-line">{comment.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar Sticky Panel */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="mb-6">
                      {isProfilePost ? (
                        <>
                          <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider mb-1">Max Budget</span>
                          <span className="text-3xl font-bold text-gray-900">{post.maxBudget ? parseFloat(post.maxBudget).toLocaleString() : 'N/A'}</span>
                          <span className="text-gray-500 font-medium"> DA / month</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-gray-500 font-semibold block uppercase tracking-wider mb-1">Price</span>
                          <span className="text-3xl font-bold text-gray-900">{parseFloat(post.price || '0').toLocaleString()}</span>
                          <span className="text-gray-500 font-medium"> DA / month</span>
                        </>
                      )}
                    </div>

                    <hr className="border-gray-200 my-6" />

                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Posted By</h3>
                      <div 
                        className="flex items-center gap-4 cursor-pointer group"
                        onClick={() => {
                          if (post.author?.id) {
                            router.push(`/profile?userId=${post.author.id}`);
                          }
                        }}
                      >
                        <Image
                          src={getUserAvatar(post.author)}
                          alt={post.author?.name || 'Author'}
                          width={56}
                          height={56}
                          unoptimized
                          className="rounded-full bg-gray-100 object-cover group-hover:opacity-85 transition-opacity"
                        />
                        <div>
                          <p className="font-bold text-gray-900 text-lg group-hover:underline">
                            {post.author?.name} {post.author?.lastName}
                          </p>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {post.author?.identityVerified ? (
                              <span className="text-xs text-indigo-600 font-medium">✓ Identity Verified</span>
                            ) : (
                              <span className="text-xs text-gray-400 font-normal">Identity Unverified</span>
                            )}
                            {post.author?.faceVerified && (
                              <span className="text-xs text-emerald-600 font-medium">✓ Face Verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleMessageAuthor}
                      className="w-full bg-black text-white px-6 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mb-3"
                    >
                      <i className="fa-solid fa-message text-lg" />
                      Message User
                    </button>

                    <button 
                      onClick={toggleSavePost}
                      className="w-full border border-gray-300 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-50 hover:text-black transition-colors flex items-center justify-center gap-2"
                    >
                      <i className={`fa-heart ${isSaved ? 'fa-solid text-red-500' : 'fa-regular text-gray-500'}`} />
                      {isSaved ? 'Saved' : 'Save Post'}
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

      {/* Message Modal Overlay */}
      {messageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setMessageModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold text-lg p-1"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Send Message</h2>
            <p className="text-sm text-gray-500 mb-4">Start a conversation with {post?.author?.name}.</p>
            
            <textarea
              value={initialMessageText}
              onChange={(e) => setInitialMessageText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none text-sm mb-4"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setMessageModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessageSubmit}
                disabled={isSendingMessage || !initialMessageText.trim()}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && post && post.images && post.images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 transition-all duration-300">
          {/* Close & Header */}
          <div className="flex justify-between items-center text-white p-2">
            <span className="text-sm font-medium">
              Image {activeImageIdx + 1} of {post.images.length}
            </span>
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white font-bold text-lg"
            >
              ✕
            </button>
          </div>

          {/* Main Large Image in Lightbox */}
          <div className="flex-1 flex items-center justify-center relative max-h-[85vh] w-full">
            {post.images.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIdx((prev) => (prev === 0 ? post.images.length - 1 : prev - 1));
                }}
                className="absolute left-4 z-10 p-3 bg-white/15 hover:bg-white/25 rounded-full text-white transition-colors"
              >
                <i className="fa-solid fa-chevron-left text-2xl" />
              </button>
            )}

            <div className="relative w-full h-full max-w-4xl aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center">
              <img 
                src={post.images[activeImageIdx]} 
                alt={`Image ${activeImageIdx + 1}`}
                className="w-full h-full object-contain"
              />
            </div>

            {post.images.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIdx((prev) => (prev === post.images.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 z-10 p-3 bg-white/15 hover:bg-white/25 rounded-full text-white transition-colors"
              >
                <i className="fa-solid fa-chevron-right text-2xl" />
              </button>
            )}
          </div>

          {/* Thumbnail Slider in Lightbox */}
          <div className="py-4 flex justify-center gap-2 overflow-x-auto max-w-full">
            {post.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`relative w-16 h-12 rounded overflow-hidden flex-shrink-0 transition-all ${
                  activeImageIdx === idx ? 'ring-2 ring-white scale-105' : 'opacity-50 hover:opacity-80'
                }`}
              >
                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
