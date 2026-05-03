import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">ColocDZ</h3>
          <p className="text-gray-600 text-sm mb-4">
            Get updates on new listings and platform improvements.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-sm">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            By subscribing you agree to our Privacy Policy and consent to receive updates.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Browse</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/posts" className="text-gray-600 hover:text-gray-900">Find rooms</Link></li>
            <li><Link href="/adding-post" className="text-gray-600 hover:text-gray-900">Post listing</Link></li>
            <li><Link href="/profile" className="text-gray-600 hover:text-gray-900">My posts</Link></li>
            <li><Link href="/messages" className="text-gray-600 hover:text-gray-900">Messages</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="text-gray-600 hover:text-gray-900">Contact us</a></li>
            <li><a href="#" className="text-gray-600 hover:text-gray-900">Help center</a></li>
            <li><a href="#" className="text-gray-600 hover:text-gray-900">Safety tips</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Follow us</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="text-gray-600 hover:text-gray-900">Facebook</a></li>
            <li><a href="#" className="text-gray-600 hover:text-gray-900">Instagram</a></li>
            <li><a href="#" className="text-gray-600 hover:text-gray-900">LinkedIn</a></li>
            <li><a href="#" className="text-gray-600 hover:text-gray-900">YouTube</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-300 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
        <div>
          <a href="#" className="hover:text-gray-900 mr-4">Terms of service</a>
          <a href="#" className="hover:text-gray-900">Privacy Policy</a>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <p className="text-xs text-gray-500">
            © 2026 ColocDZ. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Developed by <span className="font-semibold">MorenaDev</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
