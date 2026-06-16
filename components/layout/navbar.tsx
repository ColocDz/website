'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useSession, signOut } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';
import { GenderPromptModal } from '@/components/gender-prompt-modal';

interface NavbarProps {
  brandName?: string;
}

export function Navbar({ brandName = 'ColocDz' }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { t, dir } = useI18n();

  const isLoggedIn = !!session?.user;

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const navLinks = [
    { label: t('nav.findHousing'), href: '/' },
    { label: t('nav.findRoommate'), href: '/posts' },
    { label: t('nav.messages'), href: '/messages' },
    { label: t('nav.myPosts'), href: '/profile' },
    { label: t('nav.addPost'), href: '/adding-post' },
  ];

  const menuItems = isLoggedIn
    ? [
        { label: t('sidebar.home'), path: '/', icon: <i className="fa-solid fa-house w-6 text-center" /> },
        { label: t('sidebar.addPost'), path: '/adding-post', icon: <i className="fa-solid fa-plus w-6 text-center" /> },
        { label: t('sidebar.profile'), path: '/profile', icon: <i className="fa-solid fa-user w-6 text-center" /> },
        { label: t('sidebar.saved'), path: '/profile?tab=saved', icon: <i className="fa-solid fa-heart w-6 text-center text-red-500" /> },
        { label: t('sidebar.messages'), path: '/messages', icon: <i className="fa-solid fa-envelope w-6 text-center" /> },
        { label: t('sidebar.settings'), path: '/settings', icon: <i className="fa-solid fa-gear w-6 text-center" /> },
        { label: t('sidebar.logOut'), path: '#', onClick: handleLogout, icon: <i className="fa-solid fa-right-from-bracket w-6 text-center" /> },
      ]
    : [
        { label: t('sidebar.home'), path: '/', icon: <i className="fa-solid fa-house w-6 text-center" /> },
        { label: t('nav.findRoommate'), path: '/posts', icon: <i className="fa-solid fa-magnifying-glass w-6 text-center" /> },
        { label: t('nav.signIn'), path: '/login', icon: <i className="fa-solid fa-right-to-bracket w-6 text-center" /> },
      ];

  return (
    <>
      <GenderPromptModal />
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <MobileSidebar
            menuItems={menuItems}
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20" dir={dir}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900 no-underline">
              <img 
                src="/ColocDz_Logo.png" 
                alt="ColocDz Logo" 
                className="h-16 w-auto md:h-20 object-contain transition-all" 
              />
              <span className="text-xl md:text-2xl font-bold tracking-tight">{brandName}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-gray-700 hover:text-gray-900 no-underline ${
                  pathname === link.href ? 'font-semibold text-gray-900' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: Language Switcher + Auth */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/settings" className="text-gray-700 hover:text-gray-900 transition-colors" title="Settings">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
                >
                  {t('nav.logOut')}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:block bg-black text-white px-6 py-2 rounded hover:bg-gray-800 no-underline"
              >
                {t('nav.signIn')}
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
