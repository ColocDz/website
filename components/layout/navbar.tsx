'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { useSession, signOut } from '@/lib/auth-client';
import { getMenuItems, desktopNavLinks } from '@/lib/navigation';

interface NavbarProps {
  /** Override for the brand name display */
  brandName?: string;
}

export function Navbar({ brandName = 'ColocDZ' }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isLoggedIn = !!session?.user;

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  // Build menu items with the logout handler attached
  const menuItems = getMenuItems().map((item) => {
    if (item.isLogout) {
      return { ...item, onClick: handleLogout };
    }
    return item;
  });

  return (
    <>
      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <MobileSidebar
            menuItems={menuItems}
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" className="text-2xl font-bold text-gray-900 no-underline">
              {brandName}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {desktopNavLinks.map((link) => (
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

          {/* Auth Button */}
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="hidden md:block bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden md:block bg-black text-white px-6 py-2 rounded hover:bg-gray-800 no-underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
