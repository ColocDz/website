'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bell, Lock, User, Upload, IdCard } from 'lucide-react';
import { RiArrowGoBackFill } from 'react-icons/ri';
import { Navbar } from '@/components/layout/navbar';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const settingsTabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'emails', label: 'Emails & Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'idcard', label: 'ID National Card', icon: IdCard },
  ];

  const [emails, setEmails] = useState<string[]>(['hello@example.com']);
  const [showNewEmailInput, setShowNewEmailInput] = useState(false);
  const [notificationStates, setNotificationStates] = useState<{ [key: number]: boolean }>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
  });

  const handleNotificationToggle = (index: number) => {
    setNotificationStates(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleBrowserNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Notifications Enabled', {
          body: 'You will now receive browser notifications from COLOCdz.',
          icon: '/logo.png'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Notifications Enabled', {
              body: 'You will now receive browser notifications from COLOCdz.',
              icon: '/logo.png'
            });
          }
        });
      }
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className="bg-white">
      <Navbar />

      {/* Main Content */}
      <div>

        {/* Settings Layout */}
        <div className="flex min-h-[calc(100vh-80px)]">
          {/* Sidebar Menu - Fixed Position */}
          <div className="hidden md:flex fixed left-0 top-20 h-[calc(100vh-80px)] w-80 flex-col bg-white border-r border-gray-200 p-6 overflow-y-auto z-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">User profile<br/>management</h2>
            <nav className="space-y-3">
              {settingsTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Settings Menu */}
          {activeTab === null && (
            <div className="md:hidden w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">User profile<br/>management</h2>
                <nav className="space-y-3">
                  {settingsTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded bg-gray-50 hover:bg-gray-100 transition-colors text-gray-900"
                      >
                        <IconComponent size={20} />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}

          {/* Content Area - Push right on desktop for fixed sidebar */}
          {activeTab !== null && (
            <div className="flex-1 p-8 max-w-4xl w-full md:w-auto md:ml-80">
              {/* Mobile Back Button */}
              <div className="md:hidden mb-6 flex items-center gap-2">
                <button
                  onClick={() => setActiveTab(null)}
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                >
                  <RiArrowGoBackFill size={20} />
                  <span className="text-sm font-medium">Back</span>
                </button>
              </div>

              {/* Saving Changes Indicator */}
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900">
                  {activeTab === 'personal' && 'Personal information'}
                  {activeTab === 'emails' && 'Emails & Password'}
                  {activeTab === 'notifications' && 'Notifications'}
                  {activeTab === 'idcard' && 'National ID Card'}
                </h1>
                {isSaving && <div className="text-emerald-500 text-sm font-medium">Saving changes</div>}
              </div>

              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-8">
                  {/* Profile Picture */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Image
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                        alt="Profile"
                        width={120}
                        height={120}
                        className="rounded-full w-28 h-28 object-cover"
                      />
                      <button className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700">
                        <Upload size={16} />
                      </button>
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold mb-2">Upload Photo</p>
                      <p className="text-gray-600 text-sm">JPG, PNG or GIF. Max 5MB.</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">First Name</label>
                      <input type="text" defaultValue="Arafat" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name</label>
                      <input type="text" defaultValue="Nayeem" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                      <input type="email" defaultValue="hello@fillo.co" className="w-full px-4 py-3 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                      <div className="flex gap-2">
                        <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32">
                          <option>+880</option>
                        </select>
                        <input type="tel" defaultValue="1681 788 203" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Country</label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>Bangladesh</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">City</label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>Sylhet</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Zip Code</label>
                    <input type="text" defaultValue="3100" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  {/* Delete Account */}
                  <div className="pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Account</h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-orange-500">⚠️</span>
                        After making a deletion request, you will have "6 months" to maintain this account.
                      </p>
                    </div>
                    <button className="px-6 py-2 border border-gray-300 text-gray-900 rounded hover:bg-gray-50 font-medium">
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Account notifications</h2>
                    <p className="text-gray-600 mb-6">We will send you notifications to inform you of any updates and/or changes as events occur for you or your business in ProAcc. Select which notifications you want to receive below:</p>

                    <div className="space-y-4">
                      {[
                        { label: 'Website Notification', desc: 'You will receive all the notifications about the messages and the new posts from the page.' },
                        { label: 'Email Notifications', desc: 'You will receive all the notifications about the messages and the new posts from your email.' },
                        { label: 'Whatsapp synchro', desc: 'You will receive all the notifications about the messages and the new posts from your whatsapp account.' },
                        { label: 'Facebook synchro', desc: 'You will receive all the notifications about the messages and the new posts from your facebook account.' },
                        { label: 'New Posts Matching Your Preferences', desc: 'Receive notifications about new posts that match your search criteria and preferences.' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-300 rounded gap-4">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-sm sm:text-base">{item.label}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{item.desc}</p>
                          </div>
                          <button
                            onClick={() => handleNotificationToggle(idx)}
                            className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center ${
                              notificationStates[idx] ? 'bg-blue-500' : 'bg-gray-300'
                            } flex-shrink-0`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full bg-white transition-transform duration-300 ${
                                notificationStates[idx] ? 'translate-x-7' : 'translate-x-1'
                              }`}
                            ></div>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Browser Notification Permission */}
                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-bold text-gray-900 mb-2">Browser Notifications</h3>
                      <p className="text-sm text-gray-600 mb-4">Enable browser notifications to receive instant alerts about new messages and posts.</p>
                      <button
                        onClick={handleBrowserNotification}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                      >
                        Enable Browser Notifications
                      </button>
                    </div>

                    <div className="mt-8">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Push Notification Time-out</label>
                      <select className="w-full md:w-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>10 Minutes</option>
                        <option>5 Minutes</option>
                        <option>15 Minutes</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Email & Password Tab */}
              {activeTab === 'emails' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Current Password</label>
                    <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-gray-900 mb-4">Add new Email</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowNewEmailInput(!showNewEmailInput)}
                          className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
                        >
                          {showNewEmailInput ? 'Cancel' : '+ Add Email'}
                        </button>
                        {showNewEmailInput && (
                          <input
                            type="email"
                            placeholder="Enter new email address"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                      </div>
                    </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
                    <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              )}

              {/* Businesses Tab */}
              {activeTab === 'idcard' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">National ID Card</h1>
                    
                    {/* ID Card Front */}
                    <div className="bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl p-8 mb-8 shadow-lg max-w-2xl">
                      {/* Header with Flag */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-center flex-1">
                          <p className="text-gray-700 font-bold text-sm mb-1">جمهورية الجزائرية الديمقراطية الشعبية</p>
                          <p className="text-gray-600 text-xs">Democratic People's Republic of Algeria</p>
                          <p className="text-gray-600 text-xs">بطاقة الهوية الوطنية</p>
                        </div>
                        <div className="w-12 h-8 rounded flex items-center justify-center bg-white">
                          <span className="text-2xl">🇩🇿</span>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex gap-8">
                        {/* Left side - Photo and small photo */}
                        <div className="flex flex-col items-center gap-4">
                          <Image
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=IDCardUser"
                            alt="ID Photo"
                            width={160}
                            height={180}
                            className="rounded-lg w-40 h-44 object-cover border-4 border-white shadow-md"
                          />
                        </div>

                        {/* Right side - Information */}
                        <div className="flex-1 space-y-3">
                          <div className="bg-white/60 rounded px-3 py-2">
                            <p className="text-gray-600 text-xs">رقم البطاقة - Card Number</p>
                            <p className="text-gray-900 font-bold text-lg tracking-wider">01234567890123</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/60 rounded px-3 py-2">
                              <p className="text-gray-600 text-xs">الاسم الأول - First Name</p>
                              <p className="text-gray-900 font-semibold text-sm">YASMINE</p>
                            </div>
                            <div className="bg-white/60 rounded px-3 py-2">
                              <p className="text-gray-600 text-xs">اللقب - Last Name</p>
                              <p className="text-gray-900 font-semibold text-sm">SLIMANI</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/60 rounded px-3 py-2">
                              <p className="text-gray-600 text-xs">تاريخ الميلاد - Birth Date</p>
                              <p className="text-gray-900 font-semibold text-sm">30/01/1990</p>
                            </div>
                            <div className="bg-white/60 rounded px-3 py-2">
                              <p className="text-gray-600 text-xs">مكان الميلاد - Birth Place</p>
                              <p className="text-gray-900 font-semibold text-sm">MAGHNIA</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/60 rounded px-3 py-2">
                              <p className="text-gray-600 text-xs">الجنس - Gender</p>
                              <p className="text-gray-900 font-semibold text-sm">F</p>
                            </div>
                            <div className="bg-white/60 rounded px-3 py-2">
                              <p className="text-gray-600 text-xs">الدم - Blood Type</p>
                              <p className="text-gray-900 font-semibold text-sm">A+</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer info */}
                      <div className="mt-6 pt-4 border-t border-teal-200 text-center">
                        <p className="text-gray-700 text-xs">صلاحية البطاقة: 15.05.2029</p>
                        <p className="text-gray-600 text-xs">Card Valid Until: 15.05.2029</p>
                      </div>
                    </div>

                    {/* ID Card Back Info */}
                    <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-6 max-w-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Card Information</h3>
                        <div className="text-xs text-gray-600">Issued: 15.05.2019</div>
                      </div>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-teal-200 pb-2">
                          <span className="text-gray-700">Parent/Guardian:</span>
                          <span className="text-gray-900 font-semibold">SLIMANI MOHAMMED</span>
                        </div>
                        <div className="flex justify-between border-b border-teal-200 pb-2">
                          <span className="text-gray-700">Address:</span>
                          <span className="text-gray-900 font-semibold">Algiers, Algeria</span>
                        </div>
                        <div className="flex justify-between border-b border-teal-200 pb-2">
                          <span className="text-gray-700">Signature Index:</span>
                          <span className="text-gray-900 font-mono">|||||||||||||||||||</span>
                        </div>
                        <div className="mt-4 p-3 bg-white rounded border border-teal-300">
                          <p className="text-xs text-gray-600 mb-2">Security Number</p>
                          <p className="text-gray-900 font-bold tracking-wider">01234567 890123 456789</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="border border-gray-300 text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
