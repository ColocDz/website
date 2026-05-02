'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Send, Search } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { useSession } from '@/lib/auth-client';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  otherUser: { id: string; name: string; image: string | null } | null;
  lastMessage: Message | null;
  updatedAt: string;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDesktop, setIsDesktop] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch conversations and user identity
  useEffect(() => {
    async function fetchConversations() {
      try {
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          setIsPhoneVerified(!!userData.phoneVerified);
        }
        
        const res = await fetch('/api/messages');
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (session) {
      fetchConversations();
    }
  }, [session]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    async function fetchMessages() {
      if (!selectedChat) return;
      try {
        const res = await fetch(`/api/messages/${selectedChat}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    }
    
    fetchMessages();
    
    // Simple polling for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedChat]);

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;
    
    const content = messageInput;
    setMessageInput(''); // Clear input immediately for better UX
    
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedChat,
          content
        })
      });
      
      if (res.ok) {
        const newMessage = await res.json();
        setMessages(prev => [...prev, newMessage]);
        
        // Update conversation list with new last message
        setConversations(prev => prev.map(c => 
          c.id === selectedChat 
            ? { ...c, lastMessage: newMessage, updatedAt: newMessage.createdAt }
            : c
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const activeConversation = conversations.find(c => c.id === selectedChat);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      {!isPhoneVerified ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center shadow-sm max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-800 mb-2">Phone Verification Required</h2>
            <p className="text-red-700 mb-6">
              You need to verify your account phone number in the personal informations before you can message other users.
            </p>
            <button
              onClick={() => window.location.href = '/settings'}
              className="w-full px-6 py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors"
            >
              Go to Personal Info
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 h-[calc(100vh-73px)]">
          {/* ─── Conversations List ─── */}
          {(selectedChat === null || isDesktop) && (
          <div className="w-full md:w-80 flex flex-col border-r border-gray-200 bg-gray-50">
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

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No conversations found</div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedChat(conv.id)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-100 transition-colors border-b border-gray-200 text-left ${
                      selectedChat === conv.id ? 'bg-gray-100' : ''
                    }`}
                  >
                    <Image
                      src={conv.otherUser?.image || 'https://www.w3schools.com/howto/img_avatar2.png'}
                      alt={conv.otherUser?.name || 'User'}
                      width={48}
                      height={48}
                      className="rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">{conv.otherUser?.name || 'Unknown User'}</p>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-sm truncate text-gray-600">
                        {conv.lastMessage?.content || 'Started a conversation'}
                      </p>
                    </div>
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
                <button className="md:hidden text-gray-600 hover:text-gray-900" onClick={() => setSelectedChat(null)}>← Back</button>
                <Image
                  src={activeConversation?.otherUser?.image || "https://www.w3schools.com/howto/img_avatar2.png"}
                  alt={activeConversation?.otherUser?.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-900">{activeConversation?.otherUser?.name || 'Unknown User'}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col">
              {messages.map((msg) => {
                const isMe = msg.senderId === session?.user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${isMe ? 'bg-black text-white' : 'bg-white border border-gray-300 text-gray-900'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-gray-300' : 'text-gray-600'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
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
      )}
    </div>
  );
}
