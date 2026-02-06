'use client';

import { SidebarLayout } from '@/components/sidebar-layout';

export default function SettingsPage() {
  return (
    <SidebarLayout>
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>
        <div className="w-full max-w-md bg-white p-6 rounded shadow space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              <input type="checkbox" className="mr-2" />
              Dark Mode
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              <input type="checkbox" className="mr-2" defaultChecked />
              Notifications
            </label>
          </div>
          <button className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Save Settings
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
}
