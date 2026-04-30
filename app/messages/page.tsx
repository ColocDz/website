'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Send, Search } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log('Message sent:', messageInput);
      setMessageInput('');
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      {/* Messages Layout */}
      <div className="flex flex-1 h-[calc(100vh-73px)]">
        {/* ─── Conversations List ─── */}
        {/* Shown on mobile when no chat selected, always on desktop */}
        {(selectedChat === null || isDesktop) && (
          <div className="w-full md:w-80 flex flex-col border-r border-gray-200 bg-gray-50">
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

            {/* Conversation Items — THIS WAS MISSING IN THE ORIGINAL CODE */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No conversations found
                </div>
              ) : (
                filteredConversations.map((conv, index) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedChat(index)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-100 transition-colors border-b border-gray-200 text-left ${
                      selectedChat === index ? 'bg-gray-100' : ''
                    }`}
                  >
                    <Image
                      src={conv.avatar}
                      alt={conv.name}
                      width={48}
                      height={48}
                      className="rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold text-gray-900 text-sm ${conv.unread ? 'font-bold' : ''}`}>
                          {conv.name}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0">{conv.timestamp}</span>
                      </div>
                      <p className={`text-sm truncate ${conv.unread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread && (
                      <div className="w-2.5 h-2.5 bg-black rounded-full flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── Chat Area ─── */}
        {selectedChat !== null ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden text-gray-600 hover:text-gray-900"
                  onClick={() => setSelectedChat(null)}
                >
                  ← Back
                </button>
                <Image
                  src={conversations[selectedChat]?.avatar || "/placeholder.svg"}
                  alt={conversations[selectedChat]?.name || ""}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-900">{conversations[selectedChat]?.name}</p>
                  <p className="text-xs text-gray-600">Active now</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {conversations[selectedChat]?.messages.map((msg) => (
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
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
        ) : (
          /* Empty state when no chat is selected on desktop */
          isDesktop && (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">Select a conversation</p>
                <p className="text-gray-400 text-sm">Choose a conversation from the list to start chatting</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
