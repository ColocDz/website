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
  const { data: session, isPending } = useSession();
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
    { label: t('sidebar.settings') || 'Settings', href: '/settings' },
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

      <nav className="glass-nav border-b border-surface-variant sticky top-0 z-20" dir={dir}>
        <div className="px-6 py-4 flex items-center justify-between max-w-container-max mx-auto">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-on-surface"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" className="flex items-center gap-2 no-underline">
              <img 
                src="/ColocDz_Logo.png" 
                alt="ColocDz Logo" 
                className="h-12 w-auto md:h-16 object-contain transition-all" 
              />
              <span className="font-display-lg text-2xl italic text-on-surface tracking-tight">{brandName}</span>
            </Link>
          </div>
 
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-label-caps text-[12px] tracking-widest uppercase transition-colors no-underline ${
                  pathname === link.href ? 'text-primary border-b border-primary pb-1 font-semibold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
 
          {/* Right side: Language Switcher + Auth */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isPending ? (
              <div className="w-20 h-8 bg-gray-100/80 rounded-lg animate-pulse hidden md:block" />
            ) : isLoggedIn ? (
              <div className="hidden md:flex items-center gap-3">
                <Link 
                  href="/settings" 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs transition-colors no-underline"
                  title="Settings"
                >
                  <i className="fa-solid fa-gear text-sm" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="border border-error text-error hover:bg-error-container/20 px-4 py-1.5 rounded-lg font-label-caps text-[12px] tracking-widest uppercase scale-95 active:scale-90 transition-all"
                >
                  {t('nav.logOut')}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:block border border-primary text-primary px-6 py-2 rounded-lg font-label-caps text-[12px] tracking-widest uppercase scale-95 active:scale-90 transition-transform hover:bg-primary/10 no-underline"
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
