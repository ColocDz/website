'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Menu, X, Send, Search } from 'lucide-react';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { MdOutlinePostAdd } from 'react-icons/md';
import { IoIosLogOut } from 'react-icons/io';
import { FaHome, FaUser, FaCog } from 'react-icons/fa';
import { AiFillMessage } from "react-icons/ai";


export default function MessagesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(0);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
      { label: "Home", path: "/", icon: <FaHome /> },
      { label: "Add Post", path: "/adding-post", icon: <MdOutlinePostAdd /> },
      { label: "Profile", path: "/profile", icon: <FaUser /> },
      { label: "Messages", path: "/messages", icon: <AiFillMessage /> },
      { label: "Settings", path: "/settings", icon: <FaCog /> },
      {label: "Log Out", path: "/logout", icon: <IoIosLogOut />},
  ];

  const conversations = [
    {
      id: 1,
      name: 'Sarah Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      lastMessage: 'Sounds great! When can we schedule a viewing?',
      timestamp: '2 hours ago',
      unread: true,
      messages: [
        { id: 1, sender: 'Sarah', text: 'Hi, I\'m interested in your listing', time: '10:30 AM' },
        { id: 2, sender: 'You', text: 'Great! It\'s available to view anytime', time: '10:35 AM' },
        { id: 3, sender: 'Sarah', text: 'Sounds great! When can we schedule a viewing?', time: '10:40 AM' },
      ]
    },
    {
      id: 2,
      name: 'Marcus Webb',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
      lastMessage: 'I\'ll send you the lease details',
      timestamp: '5 hours ago',
      unread: false,
      messages: [
        { id: 1, sender: 'Marcus', text: 'Hi, interested in roommate matching', time: '9:00 AM' },
        { id: 2, sender: 'You', text: 'Tell me more about yourself', time: '9:15 AM' },
        { id: 3, sender: 'Marcus', text: 'I\'ll send you the lease details', time: '9:30 AM' },
      ]
    },
    {
      id: 3,
      name: 'Elena Rodriguez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
      lastMessage: 'Perfect! See you then',
      timestamp: '1 day ago',
      unread: false,
      messages: [
        { id: 1, sender: 'Elena', text: 'Love your apartment listing!', time: 'Yesterday' },
        { id: 2, sender: 'You', text: 'Thanks, want to schedule a tour?', time: 'Yesterday' },
        { id: 3, sender: 'Elena', text: 'Perfect! See you then', time: 'Yesterday' },
      ]
    },
  ];

  const currentChat = conversations[selectedChat];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log('Message sent:', messageInput);
      setMessageInput('');
    }
  };

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
              <span className="text-2xl font-bold text-gray-900">Logo</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="/" className="text-gray-700 hover:text-gray-900">
                Find housing
              </a>
              <a href="/adding-post" className="text-gray-700 hover:text-gray-900">
                Post listing
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900">
                My posts
              </a>
            </div>

            <button className="hidden md:block bg-black text-white px-6 py-2 rounded hover:bg-gray-800">Sign in</button>
          </div>
        </nav>

        {/* Messages Layout */}
        <div className="flex h-[calc(100vh-80px)]">
          {/* Conversations List - Hidden on mobile, visible on tablet and up */}
          <div className="hidden md:flex flex-col w-80 border-r border-gray-200 bg-gray-50">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded pl-10 focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation, idx) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedChat(idx)}
                  className={`w-full p-4 border-b border-gray-200 text-left hover:bg-gray-100 transition-colors ${
                    selectedChat === idx ? 'bg-white border-l-4 border-l-black' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={conversation.avatar || "/placeholder.svg"}
                      alt={conversation.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold text-gray-900 ${conversation.unread ? 'font-bold' : ''}`}>
                          {conversation.name}
                        </p>
                        <span className="text-xs text-gray-600">{conversation.timestamp}</span>
                      </div>
                      <p className={`text-sm truncate ${conversation.unread ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="md:hidden" onClick={() => setSelectedChat(null)}>
                  <X size={24} />
                </button>
                <Image
                  src={currentChat.avatar || "/placeholder.svg"}
                  alt={currentChat.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-900">{currentChat.name}</p>
                  <p className="text-xs text-gray-600">Active now</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {currentChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender === 'You'
                        ? 'bg-black text-white'
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'You' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 flex items-center gap-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
