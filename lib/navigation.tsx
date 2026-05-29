import { FaHome, FaUser, FaCog } from 'react-icons/fa';
import { MdOutlinePostAdd } from 'react-icons/md';
import { AiFillMessage } from 'react-icons/ai';
import { IoIosLogOut } from 'react-icons/io';

export interface NavMenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  isLogout?: boolean;
}

/**
 * Returns the menu items for sidebar navigation.
 * This is a function (not a constant) because React elements
 * must be created inside a component render tree.
 */
export function getMenuItems(): NavMenuItem[] {
  return [
    { label: 'Home', path: '/', icon: <FaHome /> },
    { label: 'Add Post', path: '/adding-post', icon: <MdOutlinePostAdd />, requiresAuth: true },
    { label: 'Profile', path: '/profile', icon: <FaUser />, requiresAuth: true },
    { label: 'Messages', path: '/messages', icon: <AiFillMessage />, requiresAuth: true },
    { label: 'Settings', path: '/settings', icon: <FaCog />, requiresAuth: true },
    { label: 'Log Out', path: '#', icon: <IoIosLogOut />, isLogout: true, requiresAuth: true },
  ];
}

/** Desktop navbar links (subset shown in the top nav) */
export interface NavLink {
  label: string;
  href: string;
}

export const desktopNavLinks: NavLink[] = [
  { label: 'Find housing', href: '/' },
  { label: 'Find roommate', href: '/posts' },
  { label: 'Messages', href: '/messages' },
  { label: 'My posts', href: '/profile' },
  { label: 'Add post', href: '/adding-post' },
];
