'use client';

import { SidebarLayout } from '@/components/sidebar-layout';

export default function ProfilePage() {
  return (
    <SidebarLayout>
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8">User Profile</h1>
        <div className="w-full max-w-md bg-white p-6 rounded shadow">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Username</label>
              <input type="text" className="w-full px-4 py-2 border rounded" placeholder="Your username" />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input type="email" className="w-full px-4 py-2 border rounded" placeholder="Your email" />
            </div>
            <button className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Update Profile
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
