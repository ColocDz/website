'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Bell, Lock, LogOut, User, Upload } from 'lucide-react';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { RiArrowGoBackFill } from 'react-icons/ri';
import { MdOutlinePostAdd } from 'react-icons/md';
import { IoIosLogOut } from 'react-icons/io';
import { FaHome, FaUser, FaCog } from 'react-icons/fa';
import { AiFillMessage } from 'react-icons/ai';
import { IdCard } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const settingsTabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'emails', label: 'Emails & Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'idCard', label: 'ID National Card', icon: IdCard },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
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
              <button className="md:hidden text-gray-800" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <span className="text-2xl font-bold text-gray-900">Logo</span>
            </div>

            <button className="hidden md:block bg-black text-white px-6 py-2 rounded hover:bg-gray-800">Sign in</button>
          </div>
        </nav>

        {/* Settings Layout */}
        <div className="flex min-h-[calc(100vh-80px)]">
          {/* Sidebar Menu */}
          <div className="hidden md:flex flex-col w-80 bg-white border-r border-gray-200 p-6">
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

          {/* Content Area */}
          {activeTab !== null && (
            <div className="flex-1 p-8 max-w-4xl w-full md:w-auto">
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
                  {activeTab === 'businesses' && 'Businesses'}
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
                      <input type="text" defaultValue="here we will have the user.name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name</label>
                      <input type="text" defaultValue="here we will have the user.Lastname" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                      <input type="email" defaultValue="here we will have the user.email" className="w-full px-4 py-3 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                      <div className="flex gap-2">
                        <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32">
                          <option>+231</option>
                        </select>
                        <input type="tel"  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Birthday</label>
                      <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">City</label>
                      <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option>Select Your Willaya</option>
                          <option>Adrar</option>
                          <option>Chlef</option>
                          <option>Laghouat</option>
                          <option>Oum El Bouaghi</option>
                          <option>Batna</option>
                          <option>Béjaïa</option>
                          <option>Biskra</option>
                          <option>Béchar</option>
                          <option>Blida</option>
                          <option>Bouira</option>
                          <option>Tamanrasset</option>
                          <option>Tébessa</option>
                          <option>Tlemcen</option>
                          <option>Tiaret</option>
                          <option>Tizi Ouzou</option>
                          <option>Algiers</option>
                          <option>Djelfa</option>
                          <option>Jijel</option>
                          <option>Sétif</option>
                          <option>Saïda</option>
                          <option>Skikda</option>
                          <option>Sidi Bel Abbès</option>
                          <option>Annaba</option>
                          <option>Guelma</option>
                          <option>Constantine</option>
                          <option>Médéa</option>
                          <option>Mostaganem</option>
                          <option>M’Sila</option>
                          <option>Mascara</option>
                          <option>Ouargla</option>
                          <option>Oran</option>
                          <option>El Bayadh</option>
                          <option>Illizi</option>
                          <option>Bordj Bou Arréridj</option>
                          <option>Boumerdès</option>
                          <option>El Tarf</option>
                          <option>Tindouf</option>
                          <option>Tissemsilt</option>
                          <option>El Oued</option>
                          <option>Khenchela</option>
                          <option>Souk Ahras</option>
                          <option>Tipaza</option>
                          <option>Mila</option>
                          <option>Aïn Defla</option>
                          <option>Naâma</option>
                          <option>Aïn Témouchent</option>
                          <option>Ghardaïa</option>
                          <option>Relizane</option>
                          <option>Timimoun</option>
                          <option>Bordj Badji Mokhtar</option>
                          <option>Ouled Djellal</option>
                          <option>Béni Abbès</option>
                          <option>In Salah</option>
                          <option>In Guezzam</option>
                          <option>Touggourt</option>
                          <option>Djanet</option>
                          <option>El M’Ghair</option>
                          <option>El Menia</option>
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
                        { label: 'Accounting', desc: 'When accounting and bookkeeping transactions need your attention.' },
                        { label: 'Sales', desc: 'When relevant sales-related activity occurs such as when an invoice is overdue.' },
                        { label: 'Payments', desc: 'When you\'ve been paid or need to be notified to keep your Wave Payments operating.' },
                        { label: 'Purchases', desc: 'When receipt exports are ready and when receipts you\'ve emailed to Wave need to be posted into accounting.' },
                        { label: 'Bills', desc: 'When you need to be reminded of upcoming and / or late bills.' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border border-gray-300 rounded">
                          <div>
                            <p className="font-bold text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                          <div className="relative inline-flex h-8 w-14 items-center rounded-full bg-blue-500">
                            <button className="inline-flex h-6 w-6 transform rounded-full bg-white transition duration-200"></button>
                          </div>
                        </div>
                      ))}
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
                  <h2 className="text-3xl font-bold text-gray-600 mb-8">Password</h2>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Current Password</label>
                    <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">New Password</label>
                    <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
                    <input type="a" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  
                  <div className="Settings-email-part">
                    <h2 className="text-3xl font-bold text-gray-600 mb-8">Email</h2>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Current Email</label>
                      <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Add new Email</label>
                      <input type="emaila" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>

                    </div>
                  </div>
                </div>

              )}

              {/* ID Card Tab */}
              {activeTab === 'businesses' && (
                <div className="text-center py-12">
                  <p className="text-gray-600">Manage your business accounts here.</p>
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
