'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bell, Lock, User, Upload, IdCard, AlertCircle } from 'lucide-react';
import { RiArrowGoBackFill } from 'react-icons/ri';
import { Navbar } from '@/components/layout/navbar';
import { useSession, signOut } from '@/lib/auth-client';

const wilayas = [
  '01 - Adrar','02 - Chlef','03 - Laghouat','04 - Oum El Bouaghi','05 - Batna',
  '06 - Béjaïa','07 - Biskra','08 - Béchar','09 - Blida','10 - Bouira',
  '11 - Tamanrasset','12 - Tébessa','13 - Tlemcen','14 - Tiaret','15 - Tizi Ouzou',
  '16 - Alger','17 - Djelfa','18 - Jijel','19 - Sétif','20 - Saïda',
  '21 - Skikda','22 - Sidi Bel Abbès','23 - Annaba','24 - Guelma','25 - Constantine',
  '26 - Médéa','27 - Mostaganem','28 - MSila','29 - Mascara','30 - Ouargla',
  '31 - Oran','32 - El Bayadh','33 - Illizi','34 - Bordj Bou Arréridj',
  '35 - Boumerdès','36 - El Tarf','37 - Tindouf','38 - Tissemsilt','39 - El Oued',
  '40 - Khenchela','41 - Souk Ahras','42 - Tipaza','43 - Mila','44 - Aïn Defla',
  '45 - Naâma','46 - Aïn Témouchent','47 - Ghardaïa','48 - Relizane',
  '49 - El MGhair','50 - El Menia','51 - Ouled Djellal','52 - Bordj Baji Mokhtar',
  '53 - Béni Abbès','54 - Timimoun','55 - Touggourt','56 - Djanet','57 - In Salah','58 - In Guezzam',
];

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    wilaya: '',
    city: '',
    image: '',
    gender: '',
    birthday: '',
    nameChanged: false,
    identityVerified: false,
    phoneVerified: false
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteValidation, setDeleteValidation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [idCardImage, setIdCardImage] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            wilaya: data.wilaya || '',
            city: data.city || '',
            image: data.image || '',
            gender: data.gender || '',
            birthday: data.birthday ? new Date(data.birthday).toISOString().split('T')[0] : '',
            nameChanged: data.nameChanged || false,
            identityVerified: data.identityVerified || false,
            phoneVerified: data.phoneVerified || false,
          });
          if (data.phoneVerified) setPhoneVerified(true);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    }
    
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const settingsTabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'emails', label: 'Emails & Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'idcard', label: 'ID National Card', icon: IdCard },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfile({ ...profile, image: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setIdCardImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }
      
      const updatedUser = await res.json();
      setProfile(prev => ({
        ...prev,
        nameChanged: updatedUser.nameChanged,
        identityVerified: updatedUser.identityVerified
      }));
      
      router.refresh();
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendOTP = async () => {
    if (!profile.phone || profile.phone.length < 8) {
      setErrorMsg('Please enter a valid phone number (at least 8 digits)');
      return;
    }
    setIsSendingOTP(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/phone-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+213${profile.phone}` })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setOtpSent(true);
      
      if (data.dev) {
        setErrorMsg('DEV MODE: Check your pnpm dev terminal for the OTP code');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to send OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      setErrorMsg('Please enter the OTP code');
      return;
    }
    setIsVerifyingOTP(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/phone-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP code');
      
      setPhoneVerified(true);
      setOtpSent(false);
      setProfile(prev => ({ ...prev, phoneVerified: true }));
      setErrorMsg('');
      router.refresh();
    } catch (error: any) {
      setErrorMsg(error.message || 'Invalid OTP code');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteValidation) {
      setErrorMsg('Please enter your validation code or password');
      return;
    }
    
    setIsDeleting(true);
    try {
      const res = await fetch('/api/user', { method: 'DELETE' });
      if (res.ok) {
        await signOut();
        window.location.href = '/';
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error: any) {
      setErrorMsg(error.message);
      setIsDeleting(false);
    }
  };

  const handleVerifyIdentity = async () => {
    if (!profile.name || !profile.lastName || !profile.birthday || !profile.gender || !profile.wilaya) {
      setErrorMsg('Please complete all your personal information before verifying your identity.');
      return;
    }

    if (!idCardImage) {
      setErrorMsg('Please upload a photo of your National ID card.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, identityVerified: true })
      });
      
      if (!res.ok) throw new Error('Failed to verify identity');
      
      setProfile({ ...profile, identityVerified: true });
      setErrorMsg('');
      router.refresh();
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isPending) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account</h3>
            <p className="text-gray-600 text-sm mb-4">
              Please validate your action. If this is a normal account, enter your password. If it was created via social media, enter the code sent to your phone.
            </p>
            <input 
              type="password"
              placeholder="Password or OTP Code"
              value={deleteValidation}
              onChange={(e) => setDeleteValidation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-black outline-none"
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* Content Area */}
        {activeTab !== null && (
          <div className="flex-1 p-8 max-w-4xl w-full md:w-auto md:ml-80">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900">
                {activeTab === 'personal' && 'Personal information'}
                {activeTab === 'emails' && 'Emails & Password'}
                {activeTab === 'notifications' && 'Notifications'}
                {activeTab === 'idcard' && 'National ID Card'}
              </h1>
              {isSaving && <div className="text-emerald-500 text-sm font-medium animate-pulse">Saving changes...</div>}
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
                {errorMsg}
              </div>
            )}

            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-8">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Image
                      src={profile.image || session?.user?.image || "https://www.w3schools.com/howto/img_avatar2.png"}
                      alt="Profile"
                      width={120}
                      height={120}
                      className="rounded-full w-28 h-28 object-cover border border-gray-200"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 shadow-lg"
                    >
                      <Upload size={16} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
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
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      disabled={profile.nameChanged}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${profile.nameChanged ? 'bg-gray-100 border-transparent text-gray-500 cursor-not-allowed' : 'border-gray-300'}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name</label>
                    <input 
                      type="text" 
                      value={profile.lastName}
                      onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                      disabled={profile.nameChanged}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${profile.nameChanged ? 'bg-gray-100 border-transparent text-gray-500 cursor-not-allowed' : 'border-gray-300'}`} 
                    />
                  </div>
                </div>
                
                {profile.nameChanged && (
                  <p className="text-xs text-red-500 flex items-start gap-1">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    You have already changed your name once. You cannot change it again.
                  </p>
                )}
                {!profile.nameChanged && (
                  <p className="text-xs text-orange-500 flex items-start gap-1">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    Warning: You can only change your name ONCE after creating your account.
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-3 border border-transparent bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number</label>
                    <div className="flex gap-2 mb-2">
                      <div className="px-4 py-3 border border-transparent bg-gray-100 text-gray-600 rounded-lg w-20 flex items-center justify-center font-medium">
                        +213
                      </div>
                      <input 
                        type="tel" 
                        value={profile.phone}
                        onChange={(e) => {
                           setProfile({...profile, phone: e.target.value});
                           setPhoneVerified(false);
                        }}
                        disabled={phoneVerified || otpSent}
                        placeholder="555 123 456"
                        className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${phoneVerified || otpSent ? 'bg-gray-100 text-gray-500 border-transparent cursor-not-allowed' : 'border-gray-300'}`} 
                      />
                      {!phoneVerified && !otpSent && (
                        <button 
                          onClick={handleSendOTP}
                          disabled={isSendingOTP || !profile.phone}
                          className="px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
                        >
                          {isSendingOTP ? 'Sending...' : 'Verify'}
                        </button>
                      )}
                      {phoneVerified && (
                        <div className="px-4 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg flex items-center justify-center font-medium">
                          Verified ✓
                        </div>
                      )}
                    </div>
                    
                    {otpSent && !phoneVerified && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Enter OTP Code"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button 
                          onClick={handleVerifyOTP}
                          disabled={isVerifyingOTP || !otpCode}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isVerifyingOTP ? 'Verifying...' : 'Confirm'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Birthday</label>
                    <input 
                      type="date" 
                      value={profile.birthday}
                      onChange={(e) => setProfile({...profile, birthday: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Gender</label>
                    <select 
                      value={profile.gender}
                      onChange={(e) => setProfile({...profile, gender: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Country</label>
                    <div className="w-full px-4 py-3 border border-transparent bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed">
                      Algeria
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">City (Birth Place/Residence)</label>
                    <select 
                      value={profile.wilaya}
                      onChange={(e) => setProfile({...profile, wilaya: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">Select Wilaya</option>
                      {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Account</h3>
                  <div className="bg-red-50 border border-red-100 p-4 rounded-lg mb-4">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle size={16} />
                      Deleting your account will archive your posts and messages. They will no longer be displayed publicly.
                    </p>
                  </div>
                  <button 
                    onClick={() => setDeleteModalOpen(true)}
                    className="px-6 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 font-medium transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* National ID Card Tab */}
            {activeTab === 'idcard' && (
              <div className="space-y-8">
                {profile.identityVerified ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">✓</div>
                    <div>
                      <h3 className="font-bold">Identity Verified</h3>
                      <p className="text-sm">You are now fully verified to publish, message, and view all posts.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-lg flex items-center gap-3">
                    <AlertCircle size={24} />
                    <div>
                      <h3 className="font-bold">Verification Required</h3>
                      <p className="text-sm">Verify your identity by uploading your ID card to enable publishing and messaging features.</p>
                    </div>
                  </div>
                )}

                {/* ID Card Display */}
                <div className="bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl p-8 mb-8 shadow-lg max-w-2xl">
                  {/* Header with Flag */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-center flex-1">
                      <p className="text-gray-700 font-bold text-sm mb-1">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                      <p className="text-gray-600 text-xs">Democratic People's Republic of Algeria</p>
                      <p className="text-gray-600 text-xs">بطاقة الهوية الوطنية</p>
                    </div>
                    <div className="w-12 h-8 rounded flex items-center justify-center bg-white shadow-sm overflow-hidden">
                      <div className="w-1/2 h-full bg-green-600" />
                      <div className="w-1/2 h-full bg-white" />
                      {/* Note: Simplified flag representation for UI */}
                      <span className="absolute text-xl text-red-500">☪</span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex gap-8">
                    {/* Left side - Photo */}
                    <div className="flex flex-col items-center gap-4">
                      <Image
                        src={profile.image || session?.user?.image || "https://www.w3schools.com/howto/img_avatar2.png"}
                        alt="ID Photo"
                        width={160}
                        height={180}
                        className="rounded-lg w-40 h-44 object-cover border-4 border-white shadow-md"
                      />
                    </div>

                    {/* Right side - Information */}
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/60 rounded px-3 py-2">
                          <p className="text-gray-600 text-[10px]">الاسم الأول - First Name</p>
                          <p className="text-gray-900 font-bold text-sm uppercase">{profile.name || 'NOT SET'}</p>
                        </div>
                        <div className="bg-white/60 rounded px-3 py-2">
                          <p className="text-gray-600 text-[10px]">اللقب - Last Name</p>
                          <p className="text-gray-900 font-bold text-sm uppercase">{profile.lastName || 'NOT SET'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/60 rounded px-3 py-2">
                          <p className="text-gray-600 text-[10px]">تاريخ الميلاد - Birth Date</p>
                          <p className="text-gray-900 font-semibold text-sm">{profile.birthday || 'DD/MM/YYYY'}</p>
                        </div>
                        <div className="bg-white/60 rounded px-3 py-2">
                          <p className="text-gray-600 text-[10px]">مكان الميلاد - Birth Place</p>
                          <p className="text-gray-900 font-semibold text-sm uppercase">{profile.wilaya || 'NOT SET'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/60 rounded px-3 py-2">
                          <p className="text-gray-600 text-[10px]">الجنس - Gender</p>
                          <p className="text-gray-900 font-semibold text-sm">{profile.gender === 'Female' ? 'F' : profile.gender === 'Male' ? 'M' : '-'}</p>
                        </div>
                        <div className="bg-white/60 rounded px-3 py-2">
                          <p className="text-gray-600 text-[10px]">فصيلة الدم - Blood Type</p>
                          <p className="text-gray-900 font-semibold text-sm">N/A</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {!profile.identityVerified && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Upload ID to Verify</h3>
                    <p className="text-sm text-gray-600 mb-6">Please upload a clear picture of your National ID card. Ensure all text is readable and the photo is clear.</p>
                    
                    <div className="flex gap-4 items-center mb-6">
                      <button 
                        onClick={() => idFileInputRef.current?.click()}
                        className="px-6 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium"
                      >
                        Choose File
                      </button>
                      <span className="text-sm text-gray-500">
                        {idCardImage ? 'ID Selected ✓' : 'No file chosen'}
                      </span>
                      <input 
                        type="file" 
                        ref={idFileInputRef} 
                        onChange={handleIdUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>

                    <button 
                      onClick={handleVerifyIdentity}
                      disabled={isSaving || !idCardImage}
                      className="w-full py-3 bg-black text-white rounded font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? 'Verifying...' : 'Submit ID for Verification'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'personal' && activeTab !== 'idcard' && (
              <div className="py-12 text-center text-gray-500">
                <p>This tab functionality is not fully implemented in this demo.</p>
              </div>
            )}

            {/* Save Button for Personal Info */}
            {activeTab === 'personal' && (
              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
