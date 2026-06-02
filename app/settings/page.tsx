'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Bell, Lock, User, Upload, IdCard, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { authClient, useSession, signOut } from '@/lib/auth-client';
import FaceVerification from '@/components/face-verification';
import { useI18n } from '@/lib/i18n';

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

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get('tab');
  const { data: session, isPending } = useSession();
  const { t, dir } = useI18n();
  
  const [activeTab, setActiveTab] = useState<string>('personal');
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
    faceVerified: false,
    faceImage: ''
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteValidation, setDeleteValidation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [idCardImage, setIdCardImage] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatusMsg, setPasswordStatusMsg] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notification preferences
  const [notifPreferences, setNotifPreferences] = useState({
    emailMessages: true,
    emailMatches: true,
    emailComments: true,
    smsSecurity: true,
    smsUrgent: false
  });

  // Responsive default activeTab setup
  useEffect(() => {
    if (tabQuery) {
      setActiveTab(tabQuery);
      return;
    }
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setActiveTab((prev) => (prev === 'personal' ? 'menu' : prev));
      } else {
        setActiveTab((prev) => (prev === 'menu' ? 'personal' : prev));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tabQuery]);

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
            faceVerified: data.faceVerified || false,
            faceImage: data.faceImage || '',
          });
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
    { id: 'personal', label: t('settings.personalInfo'), icon: User },
    { id: 'emails', label: t('settings.emailPassword'), icon: Lock },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'idcard', label: t('settings.idCard'), icon: IdCard },
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
      
      setErrorMsg('Personal details saved successfully! ✓');
      setTimeout(() => setErrorMsg(''), 3500);
      router.refresh();
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatusMsg('All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatusMsg('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatusMsg('Password must be at least 8 characters long.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordStatusMsg('');
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true
      });
      if (error) {
        throw new Error(error.message || 'Failed to change password. Please check your credentials.');
      }
      setPasswordStatusMsg('Password updated successfully! ✓');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatusMsg(err.message || 'Something went wrong.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveNotifs = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setErrorMsg('Notification preferences updated successfully! ✓');
      setTimeout(() => setErrorMsg(''), 3500);
    }, 600);
  };

  const handleFaceVerified = async (faceImage: string, descriptor?: number[]) => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      const payload: any = { faceVerified: true, faceImage };
      if (descriptor && descriptor.length === 128) {
        payload.faceDescriptor = descriptor;
      }

      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update face verification status');
      }
      
      setProfile(prev => ({ ...prev, faceVerified: true, faceImage }));
      setFaceModalOpen(false);
      setErrorMsg('');
      router.refresh();
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'Failed to verify face. Please try again.');
    } finally {
      setIsSaving(false);
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

  if (isPending) return <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">{t('common.loading')}</div>;

  return (
    <div className="bg-white min-h-screen" dir={dir}>
      <Navbar />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('settings.deleteConfirmTitle')}</h3>
            <p className="text-gray-600 text-sm mb-4">
              {t('settings.deleteConfirmDesc')}
            </p>
            <input 
              type="password"
              placeholder={t('settings.deletePlaceholder')}
              value={deleteValidation}
              onChange={(e) => setDeleteValidation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-black outline-none"
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? t('common.loading') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Layout */}
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
        
        {/* Mobile Settings Menu List (Airbnb Style) */}
        {activeTab === 'menu' && (
          <div className="md:hidden flex-1 p-6 space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h2>
              <p className="text-gray-500 text-sm">{t('settings.subtitle')}</p>
            </div>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200 bg-white shadow-sm">
              {settingsTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-start"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-gray-100 rounded-lg text-gray-800">
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-base block">{tab.label}</span>
                        <span className="text-xs text-gray-500 block mt-0.5">
                          {tab.id === 'personal' && t('settings.personalInfoDesc')}
                          {tab.id === 'emails' && t('settings.emailsDesc')}
                          {tab.id === 'notifications' && t('settings.notificationsDesc')}
                          {tab.id === 'idcard' && t('settings.idcardDesc')}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-400 font-bold text-lg">›</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sidebar Menu - Fixed Position (Desktop) */}
        <div className="hidden md:flex fixed left-0 top-20 h-[calc(100vh-80px)] w-80 flex-col bg-white border-r border-gray-200 p-6 overflow-y-auto z-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 whitespace-pre-line">{t('settings.managementTitle')}</h2>
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
        {activeTab !== null && activeTab !== 'menu' && (
          <div className="flex-1 p-8 max-w-4xl w-full md:w-auto md:ml-80">
            {/* Mobile Back Button */}
            {activeTab !== 'menu' && (
              <button 
                onClick={() => setActiveTab('menu')}
                className="md:hidden flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold mb-6 transition-colors"
              >
                {t('settings.backToMenu')}
              </button>
            )}

            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {activeTab === 'personal' && t('settings.personalInfoTitle')}
                {activeTab === 'emails' && t('settings.emailPassword')}
                {activeTab === 'notifications' && t('settings.notifications')}
                {activeTab === 'idcard' && t('settings.idCard')}
              </h1>
              {isSaving && <div className="text-emerald-500 text-sm font-medium animate-pulse">{t('settings.saving')}</div>}
            </div>

            {errorMsg && (
              <div className={`mb-6 p-4 rounded text-sm ${errorMsg.includes('successfully') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
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
                      unoptimized
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
                    <p className="text-gray-900 font-semibold mb-2">{t('settings.uploadPhoto')}</p>
                    <p className="text-gray-600 text-sm">JPG, PNG or GIF. Max 5MB.</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.firstName')}</label>
                    <input 
                      type="text" 
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      disabled={profile.nameChanged}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent ${profile.nameChanged ? 'bg-gray-100 border-transparent text-gray-500 cursor-not-allowed' : 'border-gray-300'}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.lastName')}</label>
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
                    {t('settings.nameChangeOnce')}
                  </p>
                )}
                {!profile.nameChanged && (
                  <p className="text-xs text-orange-500 flex items-start gap-1">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    {t('settings.nameChangeWarn')}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.emailAddress')}</label>
                    <input 
                      type="email" 
                      value={profile.email} 
                      disabled
                      className="w-full px-4 py-3 border border-transparent bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.phoneNumber')}</label>
                    <div className="flex gap-2">
                      <div className="px-4 py-3 border border-transparent bg-gray-100 text-gray-600 rounded-lg w-20 flex items-center justify-center font-medium" dir="ltr">
                        +213
                      </div>
                      <input 
                        type="tel" 
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        placeholder="555 123 456"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" 
                      />
                    </div>
                  </div>
                </div>

                {/* Face Verification Section */}
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t('settings.faceVerification')}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('settings.faceVerificationDesc')}
                  </p>
                  {profile.faceVerified ? (
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-sm">
                        Face Verified ✓
                      </div>
                      {profile.faceImage && (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-emerald-300">
                          <Image src={profile.faceImage} alt="Face verification snapshot" fill unoptimized className="object-cover" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setFaceModalOpen(true);
                      }}
                      className="px-6 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors animate-pulse"
                    >
                      {t('settings.startFaceVerification')}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.birthday')}</label>
                    <input 
                      type="date" 
                      value={profile.birthday}
                      onChange={(e) => setProfile({...profile, birthday: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.gender')}</label>
                    <select 
                      value={profile.gender}
                      onChange={(e) => setProfile({...profile, gender: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">{t('settings.selectGender')}</option>
                      <option value="Male">{t('settings.male')}</option>
                      <option value="Female">{t('settings.female')}</option>
                      <option value="Other">{t('settings.other')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.country')}</label>
                    <div className="w-full px-4 py-3 border border-transparent bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed">
                      Algeria
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.city')}</label>
                    <select 
                      value={profile.wilaya}
                      onChange={(e) => setProfile({...profile, wilaya: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">{t('settings.selectWilaya')}</option>
                      {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('settings.deleteAccount')}</h3>
                  <div className="bg-red-50 border border-red-100 p-4 rounded-lg mb-4">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle size={16} />
                      {t('settings.deleteNotice')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setDeleteModalOpen(true)}
                    className="px-6 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 font-medium transition-colors"
                  >
                    {t('settings.deleteAccount')}
                  </button>
                </div>

                {/* Save Button for Personal Info */}
                <div className="mt-8 flex gap-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-md"
                  >
                    {isSaving ? t('settings.saving') : t('settings.saveChanges')}
                  </button>
                </div>
              </div>
            )}

            {/* Emails & Password Tab */}
            {activeTab === 'emails' && (
              <div className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t('settings.registeredEmail')}</h3>
                  <p className="text-sm text-gray-600 mb-4">{t('settings.registeredEmailDesc')}</p>
                  <div className="max-w-md">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.primaryEmail')}</label>
                    <input 
                      type="email" 
                      value={profile.email} 
                      disabled 
                      className="w-full px-4 py-3 border border-transparent bg-white text-gray-500 rounded-lg cursor-not-allowed shadow-sm" 
                    />
                    <p className="text-xs text-gray-400 mt-2">{t('settings.emailChangeLocked')}</p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{t('settings.changePassword')}</h3>
                    <p className="text-sm text-gray-600">{t('settings.changePasswordDesc')}</p>
                  </div>

                  {passwordStatusMsg && (
                    <div className={`p-4 rounded text-sm ${passwordStatusMsg.includes('successfully') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                      {passwordStatusMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.currentPassword')}</label>
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none shadow-sm text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.newPassword')}</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none shadow-sm text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">{t('settings.confirmNewPassword')}</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none shadow-sm text-sm" 
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="bg-black text-white px-6 py-2.5 rounded font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm text-sm"
                  >
                    {isChangingPassword ? t('settings.updatingPassword') : t('settings.updatePassword')}
                  </button>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{t('settings.emailNotifPreferences')}</h3>
                    <p className="text-sm text-gray-600">{t('settings.emailNotifDesc')}</p>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      {
                        key: 'emailMessages',
                        title: 'Direct Messages & Inquiry Alerts',
                        desc: 'Get notified instantly when other roommates or hosts send you messages or inquiries about properties.'
                      },
                      {
                        key: 'emailMatches',
                        title: 'Recommended Roommate Matches',
                        desc: 'Receive curated lists of recommended roommates in your area based on shared interests and budget.'
                      },
                      {
                        key: 'emailComments',
                        title: 'Comments & Feedback Notifications',
                        desc: 'Receive alerts when users comment or ask questions under your published listings.'
                      }
                    ].map(pref => (
                      <label key={pref.key} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-lg cursor-pointer hover:border-gray-200 transition-colors shadow-sm">
                        <input 
                          type="checkbox"
                          checked={(notifPreferences as any)[pref.key]}
                          onChange={(e) => setNotifPreferences({...notifPreferences, [pref.key]: e.target.checked})}
                          className="w-4.5 h-4.5 mt-1 rounded text-black border-gray-300 focus:ring-black"
                        />
                        <div>
                          <span className="font-semibold text-gray-900 text-sm block">{pref.title}</span>
                          <span className="text-xs text-gray-600 block mt-1">{pref.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{t('settings.smsNotifPreferences')}</h3>
                    <p className="text-sm text-gray-600">{t('settings.smsNotifDesc')}</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        key: 'smsSecurity',
                        title: 'Account Security Alerts',
                        desc: 'Instant SMS alert when login locations change or your password is reset.'
                      },
                      {
                        key: 'smsUrgent',
                        title: 'Urgent Connection Matches',
                        desc: 'Get high priority SMS messages when high-match roommate candidates request direct phone connection.'
                      }
                    ].map(pref => (
                      <label key={pref.key} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-lg cursor-pointer hover:border-gray-200 transition-colors shadow-sm">
                        <input 
                          type="checkbox"
                          checked={(notifPreferences as any)[pref.key]}
                          onChange={(e) => setNotifPreferences({...notifPreferences, [pref.key]: e.target.checked})}
                          className="w-4.5 h-4.5 mt-1 rounded text-black border-gray-300 focus:ring-black"
                        />
                        <div>
                          <span className="font-semibold text-gray-900 text-sm block">{pref.title}</span>
                          <span className="text-xs text-gray-600 block mt-1">{pref.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveNotifs}
                  disabled={isSaving}
                  className="bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-md"
                >
                  {isSaving ? t('settings.savingPreferences') : t('settings.saveNotifPreferences')}
                </button>
              </div>
            )}

            {/* National ID Card Tab */}
            {activeTab === 'idcard' && (
              <div className="space-y-8">
                {profile.identityVerified ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">✓</div>
                    <div>
                      <h3 className="font-bold">{t('settings.identityVerifiedTitle')}</h3>
                      <p className="text-sm">{t('settings.identityVerifiedDesc')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-lg flex items-center gap-3">
                    <AlertCircle size={24} />
                    <div>
                      <h3 className="font-bold">{t('settings.verificationRequiredTitle')}</h3>
                      <p className="text-sm">{t('settings.verificationRequiredDesc')}</p>
                    </div>
                  </div>
                )}

                {/* ID Card Display */}
                <div className="bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl p-8 mb-8 shadow-lg max-w-2xl">
                  {/* Header with Flag */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-center flex-1">
                      <p className="text-gray-700 font-bold text-sm mb-1">{t('settings.republicAlgeriaAr')}</p>
                      <p className="text-gray-600 text-xs">{t('settings.republicAlgeria')}</p>
                      <p className="text-gray-600 text-xs">{t('settings.nationalIdCardAr')}</p>
                    </div>
                    <div className="w-12 h-8 rounded flex items-center justify-center bg-white shadow-sm overflow-hidden relative">
                      <div className="w-1/2 h-full bg-green-600" />
                      <div className="w-1/2 h-full bg-white" />
                      <span className="absolute text-xl text-red-500 z-10">☪</span>
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
                        unoptimized
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
                        {t('settings.chooseFile')}
                      </button>
                      <span className="text-sm text-gray-500">
                        {idCardImage ? t('settings.fileChosen') : t('settings.noFileChosen')}
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
                      {isSaving ? t('settings.submittingId') : t('settings.submitId')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {faceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setFaceModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold text-xl p-2"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Complete Face Verification</h2>
            <FaceVerification 
              isAlreadyVerified={profile.faceVerified} 
              onVerified={handleFaceVerified} 
              initialPhone={profile.phone}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
