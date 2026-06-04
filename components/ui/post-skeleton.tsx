import React from 'react';

export function PostSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-gray-200" />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2 items-center">
          <div className="h-3 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded-full w-8" />
        </div>
      </div>
    </div>
  );
}

export function PostGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, idx) => (
        <PostSkeleton key={idx} />
      ))}
    </div>
  );
}
