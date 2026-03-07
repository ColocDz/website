'use client';

import { SidebarMenu } from "@/components/ui/sidebar"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Star } from 'lucide-react';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { MdOutlinePostAdd } from 'react-icons/md';
import { IoIosLogOut } from 'react-icons/io';
import { FaHome, FaUser, FaCog } from 'react-icons/fa';
import { AiFillMessage } from 'react-icons/ai';

export default function HomePage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);

  useEffect(() => {
    const handleLogout = async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('logout') === 'true') {
        localStorage.removeItem('isLoggedIn');
        router.replace('/');
      }
    };
    handleLogout();
  }, [router]);

  const handleLogoutClick = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/');
  };

  const menuItems = [
    { label: 'Home', path: '/', icon: <FaHome /> },
    { label: 'Add Post', path: '/adding-post', icon: <MdOutlinePostAdd /> },
    { label: 'Profile', path: '/profile', icon: <FaUser /> },
    { label: 'Messages', path: '/messages', icon: <AiFillMessage /> },
    { label: 'Settings', path: '/settings', icon: <FaCog /> },
    { label: 'Log Out', path: '#', icon: <IoIosLogOut />, onClick: handleLogoutClick },
  ];

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

  const posts = [
    {
      id: 1,
      type: 'Apartment',
      title: 'Spacious room in downtown with natural light',
      description: 'Modern apartment near transit with utilities included in rent',
      timeAgo: 'Posted 2 hours ago',
      user: 'Ahmed Kari',
      tags: ['Modern', 'Downtown', 'Furnished'],
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      type: 'House',
      title: 'Quiet neighborhood seeking responsible roommate',
      description: 'Established household needs someone for the spare bedroom',
      timeAgo: 'Posted 1 day ago',
      user: 'Fatima Azizi',
      tags: ['Quiet', 'Shared', 'Utilities Included'],
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    },
    {
      id: 3,
      type: 'Studio',
      title: 'Cozy studio available for immediate occupancy',
      description: 'Furnished unit with kitchen and bathroom in walkable area',
      timeAgo: 'Posted 2 days ago',
      user: 'Karim Ben',
      tags: ['Modern', 'Balcony', 'Near Park'],
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    },
  ];

  return (
    <div className="bg-white">
      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <MobileSidebar menuItems={menuItems} onClose={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div>
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button className="md:hidden text-gray-800" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <span className="text-2xl font-bold text-gray-900">ColocDZ</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-gray-700 hover:text-gray-900">
                Find housing
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900">
                Find roommate
              </a>
              <a href="/messages" className="text-gray-700 hover:text-gray-900">
                Messages
              </a>
              <a href="/profile" className="text-gray-700 hover:text-gray-900">
                My posts
              </a>
              <a href="/adding-post" className="text-gray-700 hover:text-gray-900">
                Add post
              </a>

            </div>

            <button className="hidden md:block bg-black text-white px-6 py-2 rounded hover:bg-gray-800"><a href="/login">login</a></button>
          </div>
        </nav>

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
                Search & View All Posts
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
            <button className="border border-gray-300 text-gray-900 px-6 py-2 rounded hover:bg-gray-100">View all</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-300 rounded overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    width={400}
                    height={300}
                    loading="eager"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                    <div>
                      <p className="text-white text-xs font-semibold">{post.type}</p>
                      <p className="text-white text-xs mt-1">{post.timeAgo}</p>
                    </div>
                    <div className="text-white">
                      <p className="text-sm font-semibold">{post.user}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{post.description}</p>
                  
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
                  
                  <a href="/posts" className="text-gray-900 font-semibold flex items-center gap-1 hover:text-gray-600">
                    View details <span>›</span>
                  </a>
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
                <p className="text-gray-700 mb-4">"{testimonial.quote}"</p>
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
          <p className="text-gray-600 text-center mb-8">Join others who've found their place through ColocDZ Platform</p>
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

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 py-16 px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">ColocDZ</h3>
              <p className="text-gray-600 text-sm mb-4">Get updates on new listings and platform improvements.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Your email" className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm" />
                <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-sm">Subscribe</button>
              </div>
              <p className="text-xs text-gray-600 mt-2">By subscribing you agree to our Privacy Policy and consent to receive updates.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Browse</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Find rooms</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Post listing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Edit post</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Delete post</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Connect</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Messages</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Help center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Safety tips</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Follow us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Facebook</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Instagram</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Instagram</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">LinkedIn</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">YouTube</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">© 2025 ColocDZ. All rights reserved.</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <div>
              <a href="#" className="hover:text-gray-900 mr-4">Terms of service</a>
              <a href="#" className="hover:text-gray-900">Privacy Policy</a>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-xs text-gray-500">Developed by <span className="font-semibold">MorenaDev</span></p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
