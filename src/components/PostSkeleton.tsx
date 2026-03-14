"use client";

import React from "react";

const PostSkeleton = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 mb-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
          <div className="space-y-2">
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
            <div className="w-16 h-2 bg-gray-100 rounded"></div>
          </div>
        </div>
        <div className="w-12 h-6 bg-gray-100 rounded-full"></div>
      </div>
      
      <div className="space-y-2 mb-6">
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="w-16 h-8 bg-gray-100 rounded-xl"></div>
          <div className="w-16 h-8 bg-gray-100 rounded-xl"></div>
        </div>
        <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  );
};

export const PostFeedSkeleton = () => {
  return (
    <div className="p-4">
      <PostSkeleton />
      <PostSkeleton />
      <PostSkeleton />
    </div>
  );
};

export default PostSkeleton;
