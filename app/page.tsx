'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useI18n } from '@/lib/i18n';

interface Post {
  id: string;
  title: string;
  type: string;
  description: string;
  tags: string[];
  images: string[];
  createdAt: string;
  wilaya?: string | null;
  location?: string | null;
  author?: { id: string; name: string; image: string | null; gender?: string | null };
}

export default function HomePage() {
  const router = useRouter();
  const { t, dir } = useI18n();
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
          setPosts(data.slice(0, 6)); // Display up to 6 featured listings
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
      initials: 'SC',
      quote: 'Found my perfect roommate in two weeks and couldn\'t be happier with the match.',
    },
    {
      name: 'Marcus Webb',
      role: 'Homeowner, Portland',
      initials: 'MW',
      quote: 'The process was simple and I met someone who truly fits our household.',
    },
    {
      name: 'Elena Rodriguez',
      role: 'Renter, Austin',
      initials: 'ER',
      quote: 'No more endless searching, just honest listings and real connections.',
    },
  ];

  const faqs = [
    { question: 'How do I post a listing?', answer: 'Simply click the "Add Post" button in the navigation bar. Fill in your details, upload photos, and your listing will be live in minutes.' },
    { question: 'Can I message people privately?', answer: 'Yes, our built-in messaging system allows you to coordinate with potential roommates safely and privately.' },
    { question: 'What if I change my mind?', answer: 'You can edit or delete your post at any time from the "My Posts" section in your dashboard.' },
    { question: 'Is my information safe here?', answer: 'Security is our priority. We use industry-standard encryption and verification protocols to protect your personal data.' },
  ];

  return (
    <div className="bg-[#0f131b] min-h-screen text-[#dfe2ec]" dir={dir}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col md:flex-row items-center pt-24 md:pt-32 px-6 max-w-container-max mx-auto overflow-hidden">
        <div className="w-full md:w-1/2 z-10 flex flex-col items-start text-left">
          <div className="mb-6 flex justify-start">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD36iR62xTqjdQxPmmueABQ6OcArKEg_qIqv784CQiBQvx3OOeua6f29WAdPKBXr5wcx5TgvoxL9i1l7z727gyrx3AONksvvR6eF6ufgu8TQPL3P1BJ0mNgsJF87DgJpcBGa5n8ENQK8oPvzbSmvYm7FQgu5SQYgBy441rYWUUYrJMr2rQRep3BkXsj3vFt9ic3ibrBYSx4TtgSc_ZFYfLjzL7mkhqC8XW5-Zbqo9P30wxavdYjoHD8lm87fc7pPJ4QL3QBCeVrD1JY" 
              alt="ColocDz Logo" 
              className="w-auto object-contain h-24 md:h-32"
            />
          </div>
          <h1 className="font-display-lg text-4xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
            Ready to find <br />
            your <span className="serif-italic font-normal">place</span>
          </h1>
          <p className="text-[#d5c1cf] text-base md:text-lg max-w-md mb-8">
            Post what you need or search for the right fit today. We facilitate real connections for better living.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-10">
            <button 
              onClick={() => setShowSearchBar(!showSearchBar)}
              className="bg-[#ffaaf7] text-[#5a005e] px-8 py-4 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-[#ffd6f7] transition-all"
            >
              <span className="font-label-caps uppercase tracking-widest text-xs">Search</span>
              <i className="fa-solid fa-magnifying-glass text-sm" />
            </button>
            <button 
              onClick={() => router.push('/adding-post')}
              className="text-[#dfe2ec] border-b border-[#dfe2ec] pb-1 flex items-center justify-center gap-2 hover:text-[#ffaaf7] hover:border-[#ffaaf7] transition-all"
            >
              <span className="font-label-caps uppercase tracking-widest text-xs">Post listing</span>
            </button>
          </div>

          {/* Search Input Box */}
          {showSearchBar && (
            <div className="w-full max-w-md mb-8 bg-[#1c2027] p-4 rounded-xl border border-[#31353d] transition-all">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by city, keyword, or budget..."
                className="w-full px-4 py-2 bg-[#0f131b] border border-[#31353d] rounded-lg text-[#dfe2ec] focus:outline-none focus:border-[#ffaaf7] placeholder-gray-500 text-sm"
              />
              <button
                onClick={() => router.push(`/posts?search=${encodeURIComponent(search)}`)}
                className="mt-3 w-full bg-[#ffaaf7] text-[#5a005e] px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-semibold hover:bg-[#ffd6f7] transition-all"
              >
                Go to Search
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 opacity-60">
            <span className="text-[10px] font-label-caps uppercase tracking-widest">Global Community</span>
            <i className="fa-solid fa-globe text-xs" />
            <i className="fa-solid fa-users text-xs" />
            <i className="fa-solid fa-shield-halved text-xs" />
          </div>
        </div>

        {/* Right side: Sophisticated workspace image & activity card */}
        <div className="w-full md:w-1/2 relative h-[400px] md:h-[600px] mt-12 md:mt-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f131b] via-transparent to-transparent z-10 hidden md:block"></div>
          <img 
            alt="ColocDz Workspace" 
            className="w-full h-full object-cover rounded-2xl grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl border border-white/5" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCciWUrdrL50YrverkitXqY8kmopXoUKE91fyRTrV8fd4j2xvoPjkGCazQBlFYMG1VfjZ-Kl8EmTg35EDRhJyOgLdutSutulcrNMJuZBEY7Tkwswh9AVNfiSLjdO2UyIPyKcV_TfbcKBPLcaaCd2G3F89zA8_uVvciIB0Ydv5Sd3CA03VDi_yl0ryK9VXaFNIZqN2rThtuH368IvHs_IK6d-vXf6O7J3lmnoCQvfo12NSW1wPslUY3P1w92JYPcIrIUn-059iJ-NhaS"
          />
          {/* Floating Stat Card */}
          <div className="absolute bottom-6 left-6 z-20 bg-[#262a32]/95 backdrop-blur-md p-5 rounded-xl border border-white/10 max-w-[280px] shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <img 
                alt="Latest User" 
                className="w-10 h-10 rounded-full object-cover border border-white/10" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLuQdj5zPotWJjpl5e-Rt1tsHxlttfWWyvBtIfvg6dzlqSuRu_UbwD0AvGF4W4prShAgJ87sahMbCjwsNzfgs4K22qFt5F2Zp4Q-rufEY0AfYIPaySlWzalyHOD0YUmgl4JuxQasuW6yTrYkSucBKal7tWOybGaYCMbnFfHZIq0BM97rI93qh9UBNEfzBGlEPntESSEXl-DawABIhe6g7TkUWChORYFrYXaJYIQ9IYgCRYvcNfDYpz9UjJES"
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#93b4ff]">LATEST ACTIVITY</p>
                <p className="text-xs font-medium italic text-[#dfe2ec]">"Matched in 3 days!"</p>
              </div>
            </div>
            <p className="text-[11px] text-[#d5c1cf]">Ahmad just listed a shared room in Algiers. 14 people are viewing.</p>
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-24 px-6 max-w-container-max mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h2 className="font-display-lg text-3xl md:text-5xl font-bold mb-3">Find your <span className="serif-italic font-normal">next home</span></h2>
            <p className="text-[#d5c1cf] text-sm md:text-base">Browse available rooms and shared spaces from people looking for roommates.</p>
          </div>
          <button
            onClick={() => router.push('/posts')}
            className="text-[#dfe2ec] border-b border-[#dfe2ec] pb-1 flex items-center gap-2 font-label-caps uppercase tracking-widest text-xs hover:text-[#ffaaf7] hover:border-[#ffaaf7] transition-all"
          >
            View all →
          </button>
        </div>

        {isLoadingPosts ? (
          <div className="text-center py-16">
            <p className="text-[#d5c1cf]">{t('home.loadingPosts')}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-[#1c2027] rounded-xl border border-[#31353d]">
            <p className="text-[#d5c1cf]">{t('home.noPosts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => {
              const isFemale = post.author?.gender?.toUpperCase() === 'FEMALE';
              const isMale = post.author?.gender?.toUpperCase() === 'MALE';
              return (
                <div 
                  key={post.id} 
                  className="group bg-[#1c2027] border border-[#31353d] rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between" 
                  onClick={() => router.push(`/post/${post.id}`)}
                >
                  <div>
                    <div className="relative h-52 overflow-hidden bg-[#0f131b]">
                      <Image
                        src={post.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'}
                        alt={post.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[75%]">
                        <span className="bg-black/85 text-white px-2.5 py-0.5 rounded text-[10px] font-semibold">{post.type}</span>
                        {post.author?.gender && (
                          <span className={`text-white px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                            isMale ? 'bg-blue-600' : isFemale ? 'bg-pink-600' : 'bg-gray-600'
                          }`}>
                            {isMale ? t('posts.menOnly') : isFemale ? t('posts.womenOnly') : post.author.gender}
                          </span>
                        )}
                      </div>
                      <button 
                        className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 shadow-md transition-all active:scale-90 z-20" 
                        onClick={(e) => toggleSavePost(post.id, e)}
                      >
                        <Heart 
                          size={16} 
                          fill={savedPostIds.includes(post.id) ? "red" : "none"} 
                          className={savedPostIds.includes(post.id) ? "text-red-500" : "text-gray-600"} 
                        />
                      </button>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                        <span className="font-medium">{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <i className="fa-solid fa-location-dot" />
                        <span>{post.location || 'Algeria'}</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#dfe2ec] mb-2 line-clamp-1 group-hover:text-[#ffaaf7] transition-colors">{post.title}</h3>
                      <p className="text-[#d5c1cf] text-xs mb-4 line-clamp-2">{post.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags?.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="bg-[#0f131b] text-gray-400 text-[10px] px-2 py-0.5 rounded border border-[#31353d]">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    {/* Bottom Gender colored bar */}
                    {post.author?.gender && (
                      <div className={`h-2.5 w-full ${
                        isMale ? 'bg-blue-600' : isFemale ? 'bg-pink-600' : 'bg-gray-600'
                      }`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-[#0a0e15] border-t border-[#31353d]">
        <div className="max-w-container-max mx-auto px-6">
          <h2 className="font-display-lg text-3xl md:text-5xl font-bold mb-16 text-center">Real <span className="serif-italic font-normal">stories</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div 
                key={idx} 
                className="bg-[#181c23] p-8 rounded-xl border border-white/5 flex flex-col justify-between hover:border-[#ffaaf7]/20 transition-all duration-300"
              >
                <div>
                  <i className="fa-solid fa-quote-left text-3xl text-[#ffaaf7] mb-6 block opacity-30" />
                  <p className="font-display-lg text-lg md:text-xl leading-relaxed mb-8 text-[#dfe2ec]">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#8b2b8c] flex items-center justify-center text-[#ffb0f7] font-bold text-sm">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#dfe2ec]">{testimonial.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-[#d5c1cf]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 max-w-3xl mx-auto">
        <h2 className="font-display-lg text-3xl md:text-5xl font-bold mb-4 text-center">Common <span className="serif-italic font-normal">questions</span></h2>
        <p className="text-[#d5c1cf] text-center text-sm md:text-base mb-12">Quick answers to help you get started</p>
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeAccordion === idx;
            return (
              <div key={idx} className="border-b border-[#31353d] pb-5 transition-all">
                <button
                  onClick={() => setActiveAccordion(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left focus:outline-none py-2"
                >
                  <span className="font-display-lg text-lg md:text-xl text-[#dfe2ec] hover:text-[#ffaaf7] transition-colors">
                    {faq.question}
                  </span>
                  <i className={`fa-solid ${isOpen ? 'fa-minus rotate-90 text-[#ffaaf7]' : 'fa-plus text-gray-400'} transition-transform duration-300 text-sm`} />
                </button>
                <div className={`faq-content overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 mt-3' : 'max-h-0'}`}>
                  <p className="text-[#d5c1cf] text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Secondary CTA Section */}
      <section className="bg-[#1c2027] py-24 px-6 text-center border-y border-[#31353d]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display-lg text-3xl md:text-5xl font-bold mb-6">Get started finding <span className="serif-italic font-normal">your match</span></h2>
          <p className="text-sm md:text-base text-[#d5c1cf] mb-10 max-w-xl mx-auto">
            Join others who&apos;ve found their place through ColocDZ Platform. You can post, message and even search for matches, just with one easy fast click.
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Search rooms or roommates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 bg-[#0f131b] border border-[#31353d] rounded-lg text-sm text-[#dfe2ec] focus:outline-none focus:border-[#ffaaf7]"
            />
            <button 
              onClick={() => router.push(`/posts?search=${encodeURIComponent(search)}`)}
              className="bg-[#ffaaf7] text-[#5a005e] px-8 py-3 rounded-lg font-label-caps uppercase tracking-widest text-xs font-semibold hover:bg-[#ffd6f7] transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full pt-20 pb-12 px-6 max-w-container-max mx-auto bg-[#0f131b]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4">
            <div className="font-display-lg text-2xl font-bold italic text-[#dfe2ec]">ColocDz</div>
            <p className="text-[#d5c1cf] text-xs leading-relaxed">
              Quiet Authority in Housing. We curate high-impact living spaces for a mission-driven generation.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-[#ffaaf7] mb-1 font-bold">Browse</span>
            <Link className="text-[#d5c1cf] text-xs hover:text-[#ffaaf7] transition-colors no-underline" href="/posts">Find rooms</Link>
            <Link className="text-[#d5c1cf] text-xs hover:text-[#ffaaf7] transition-colors no-underline" href="/adding-post">Post listing</Link>
            <Link className="text-[#d5c1cf] text-xs hover:text-[#ffaaf7] transition-colors no-underline" href="/profile">My posts</Link>
            <Link className="text-[#d5c1cf] text-xs hover:text-[#ffaaf7] transition-colors no-underline" href="/messages">Messages</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-[#ffaaf7] mb-1 font-bold">Support</span>
            <a className="text-[#d5c1cf] text-xs hover:text-[#ffaaf7] transition-colors" href="#">Contact us</a>
            <a className="text-[#d5c1cf] text-xs hover:text-[#ffaaf7] transition-colors" href="#">Help center</a>
            <a className="text-[#d5c1cf] text-xs hover:text-[#ffaaf7] transition-colors" href="#">Safety tips</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-label-caps text-[10px] uppercase tracking-widest text-[#ffaaf7] font-bold">Newsletter</span>
            <div className="relative">
              <input 
                className="bg-transparent border-b border-[#31353d] w-full py-2 focus:outline-none focus:border-[#ffaaf7] text-xs text-[#dfe2ec] placeholder-gray-500" 
                placeholder="Email address" 
                type="email"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-[#ffaaf7]">
                <i className="fa-solid fa-arrow-right text-xs" />
              </button>
            </div>
            <p className="text-[9px] text-[#d5c1cf] leading-tight uppercase tracking-widest">By subscribing you agree to our Privacy Policy.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#31353d] pt-8 text-[9px] font-label-caps uppercase tracking-[0.2em] text-[#d5c1cf]">
          <div className="text-center md:text-left">© 2026 ColocDz. All rights reserved.</div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a className="hover:text-[#ffaaf7] transition-colors" href="#">Terms of service</a>
            <a className="hover:text-[#ffaaf7] transition-colors" href="#">Privacy Policy</a>
          </div>
          <div className="mt-4 md:mt-0">Developed by MorenaDev</div>
        </div>
      </footer>
    </div>
  );
}
