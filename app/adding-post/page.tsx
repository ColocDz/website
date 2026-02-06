'use client';

import { SidebarLayout } from '@/components/sidebar-layout';

export default function AddingPostPage() {
  return (
    <SidebarLayout>
      <div className="flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8">Add Post</h1>
        <form className="w-full max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input type="text" className="w-full px-4 py-2 border rounded" placeholder="Post title" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea className="w-full px-4 py-2 border rounded" rows={5} placeholder="Post content"></textarea>
          </div>
          <button type="submit" className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Submit Post
          </button>
        </form>
      </div>
    </SidebarLayout>
  );
}
