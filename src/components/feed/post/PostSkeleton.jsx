// PostSkeleton.jsx — shimmer loading skeleton that matches PostCard layout
import React from 'react';

function Bone({ className }) {
  return (
    <div
      className={`bg-gray-100 rounded-lg animate-pulse ${className}`}
    />
  );
}

export default function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Bone className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-3.5 w-32" />
          <Bone className="h-3 w-48" />
        </div>
        <Bone className="h-5 w-5 rounded" />
      </div>

      {/* Body */}
      <div className="space-y-2 mb-4">
        <Bone className="h-3.5 w-full" />
        <Bone className="h-3.5 w-full" />
        <Bone className="h-3.5 w-3/4" />
      </div>

      {/* Media placeholder */}
      <Bone className="h-48 w-full rounded-xl mb-4" />

      {/* Action bar */}
      <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
        <Bone className="h-4 w-16" />
        <Bone className="h-4 w-16" />
        <Bone className="h-4 w-16" />
        <div className="flex-1" />
        <Bone className="h-4 w-8" />
      </div>
    </div>
  );
}

export function PostSkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
