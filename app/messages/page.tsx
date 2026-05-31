'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Send, Search, Archive, X } from 'lucide-react';
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
  otherUser: { id: string; name: string; lastName: string | null; image: string | null } | null;
  lastMessage: Message | null;
  updatedAt: string;
  archived: boolean;
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString();
};

const formatTimeSeparator = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

// ─── Swipeable Conversation Item (mobile) ───
function SwipeableConvItem({
  conv,
  isSelected,
  isDesktop,
  sessionUserId,
  onSelect,
  onArchive,
}: {
  conv: Conversation;
  isSelected: boolean;
  isDesktop: boolean;
  sessionUserId: string | undefined;
  onSelect: () => void;
  onArchive: () => void;
}) {
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const [swiped, setSwiped] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - touchStartX.current;
    touchDeltaX.current = delta;
    if (itemRef.current && delta > 0) {
      itemRef.current.style.transform = `translateX(${Math.min(delta, 100)}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchDeltaX.current > 80) {
      setSwiped(true);
    }
    if (itemRef.current) {
      itemRef.current.style.transform = '';
    }
  }, []);

  const fullName = conv.otherUser
    ? `${conv.otherUser.name} ${conv.otherUser.lastName || ''}`.trim()
    : 'Unknown User';

  return (
    <div className="relative overflow-hidden">
      {/* Archive background revealed on swipe */}
      {!isDesktop && (
        <div className="absolute inset-0 bg-amber-500 flex items-center pl-5">
          <Archive size={20} className="text-white" />
          <span className="text-white text-xs font-semibold ml-2">Archive</span>
        </div>
      )}

      <div
        ref={itemRef}
        onTouchStart={!isDesktop ? handleTouchStart : undefined}
        onTouchMove={!isDesktop ? handleTouchMove : undefined}
        onTouchEnd={!isDesktop ? handleTouchEnd : undefined}
        onClick={() => { if (!swiped) onSelect(); }}
        className={`relative bg-white w-full p-4 flex items-center gap-3 hover:bg-gray-100 transition-all border-b border-gray-200 text-left cursor-pointer ${
          isSelected ? 'bg-gray-100' : ''
        }`}
        style={{ transition: 'transform 0.2s ease' }}
      >
        <Image
          src={conv.otherUser?.image || 'https://www.w3schools.com/howto/img_avatar2.png'}
          alt={fullName}
          width={48}
          height={48}
          unoptimized
          className="rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 text-sm">{fullName}</p>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <span className="text-xs text-gray-500">
                {conv.updatedAt ? formatTime(conv.updatedAt) : ''}
              </span>
              {/* Desktop: archive button below the time */}
              {isDesktop && (
                <button
                  onClick={(e) => { e.stopPropagation(); onArchive(); }}
                  className="text-[10px] text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-0.5 mt-0.5"
                  title="Archive conversation"
                >
                  <Archive size={11} />
                  <span>Archive</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs truncate text-gray-500 mt-0.5">
            {conv.lastMessage
              ? (conv.lastMessage.senderId === sessionUserId ? 'You: ' : '') + conv.lastMessage.content
              : 'Started a conversation'}
          </p>
        </div>
      </div>

      {/* Mobile swipe confirmation overlay */}
      {swiped && !isDesktop && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center gap-3 z-10 animate-fadeIn">
          <span className="text-sm text-gray-700 font-medium">Archive this chat?</span>
          <button
            onClick={() => { onArchive(); setSwiped(false); }}
            className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors"
          >
            Yes
          </button>
          <button
            onClick={() => setSwiped(false)}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Archive Confirmation Modal (desktop) ───
function ArchiveModal({
  convName,
  onConfirm,
  onCancel,
}: {
  convName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-scaleIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-full">
            <Archive size={20} className="text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Archive Conversation</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to archive your conversation with <strong>{convName}</strong>?
          You can unarchive it later from the archived section.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  );
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
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch conversations and user identity
  useEffect(() => {
    async function fetchConversations() {
      try {
        const userRes = await fetch('/api/user', { credentials: 'include' });
        if (userRes.ok) {
          const userData = await userRes.json();
          setIsFaceVerified(!!userData.faceVerified);
        } else {
          console.warn('[Messages] /api/user failed:', userRes.status);
        }
        
        const res = await fetch('/api/messages', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        } else {
          console.warn('[Messages] /api/messages failed:', res.status);
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
        const res = await fetch(`/api/messages/${selectedChat}`, { credentials: 'include' });
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

  // ─── Search filter (Task 2 fix) ───
  // Search by name, lastName, or last message content — safely handles null values
  const filteredConversations = conversations.filter((conv) => {
    // First filter by archive status
    if (showArchived && !conv.archived) return false;
    if (!showArchived && conv.archived) return false;

    // Then filter by search query
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (conv.otherUser?.name || '').toLowerCase();
    const lastName = (conv.otherUser?.lastName || '').toLowerCase();
    const fullName = `${name} ${lastName}`.trim();
    const lastMsg = (conv.lastMessage?.content || '').toLowerCase();
    return fullName.includes(query) || name.includes(query) || lastName.includes(query) || lastMsg.includes(query);
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;
    
    const content = messageInput;
    setMessageInput(''); // Clear input immediately for better UX
    
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
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

  // ─── Archive handler ───
  const handleArchive = async (conv: Conversation) => {
    if (isDesktop) {
      // Desktop: show confirmation modal
      setArchiveTarget(conv);
    } else {
      // Mobile: already confirmed via swipe overlay
      await performArchive(conv.id);
    }
  };

  const performArchive = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/messages/${conversationId}/archive`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (res.ok) {
        const { archived } = await res.json();
        setConversations(prev =>
          prev.map(c => c.id === conversationId ? { ...c, archived } : c)
        );
        if (selectedChat === conversationId) {
          setSelectedChat(null);
        }
      }
    } catch (error) {
      console.error('Failed to archive:', error);
    }
    setArchiveTarget(null);
  };

  const activeConversation = conversations.find(c => c.id === selectedChat);
  const archivedCount = conversations.filter(c => c.archived).length;

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar />

      {/* Archive Confirmation Modal (desktop) */}
      {archiveTarget && (
        <ArchiveModal
          convName={
            archiveTarget.otherUser
              ? `${archiveTarget.otherUser.name} ${archiveTarget.otherUser.lastName || ''}`.trim()
              : 'Unknown User'
          }
          onConfirm={() => performArchive(archiveTarget.id)}
          onCancel={() => setArchiveTarget(null)}
        />
      )}

      {!isFaceVerified ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center shadow-sm max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-800 mb-2">Face Verification Required</h2>
            <p className="text-red-700 mb-6">
              You need to verify your identity via face detection in settings before you can message other users.
            </p>
            <button
              onClick={() => window.location.href = '/settings'}
              className="w-full px-6 py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition-colors"
            >
              Go to Face Verification
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 h-[calc(100vh-73px)]">
          {/* ─── Conversations List ─── */}
          {(selectedChat === null || isDesktop) && (
          <div className="w-full md:w-80 flex flex-col border-r border-gray-200 bg-gray-50">
            {/* Search bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg pl-10 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                />
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Inbox / Archived toggle */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setShowArchived(false)}
                className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors ${
                  !showArchived ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Inbox
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5 ${
                  showArchived ? 'text-amber-600 border-b-2 border-amber-500' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Archive size={12} />
                Archived
                {archivedCount > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {archivedCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500 text-sm">
                    {showArchived
                      ? 'No archived conversations'
                      : searchQuery
                        ? 'No conversations match your search'
                        : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <SwipeableConvItem
                    key={conv.id}
                    conv={conv}
                    isSelected={selectedChat === conv.id}
                    isDesktop={isDesktop}
                    sessionUserId={session?.user?.id}
                    onSelect={() => setSelectedChat(conv.id)}
                    onArchive={() => handleArchive(conv)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ─── Chat Area ─── */}
        {selectedChat !== null ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button className="md:hidden text-gray-600 hover:text-gray-900" onClick={() => setSelectedChat(null)}>← Back</button>
                <Image
                  src={activeConversation?.otherUser?.image || "https://www.w3schools.com/howto/img_avatar2.png"}
                  alt={activeConversation?.otherUser?.name || "User"}
                  width={40}
                  height={40}
                  unoptimized
                  className="rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {activeConversation?.otherUser 
                      ? `${activeConversation.otherUser.name} ${activeConversation.otherUser.lastName || ''}`.trim() 
                      : 'Unknown User'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === session?.user?.id;
                
                // Determine if we should show a date separator
                const msgDateStr = new Date(msg.createdAt).toDateString();
                const prevMsgDateStr = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
                const showSeparator = msgDateStr !== prevMsgDateStr;
                
                return (
                  <React.Fragment key={msg.id}>
                    {showSeparator && (
                      <div className="flex justify-center my-2">
                        <span className="px-2.5 py-0.5 bg-gray-200/60 rounded-full text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                          {formatTimeSeparator(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                        isMe ? 'bg-black text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <p className={`text-[9px] mt-1 text-right font-medium ${isMe ? 'text-gray-300/80' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

      {/* Inline CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
