/**
 * File: apps/web/components/widgets/VideoList.tsx
 * Purpose: Displays video content grid with glassmorphism design and elegant hover effects
 * Owner: Frontend team
 * Tags: widget, video, content, glassmorphism
 */

"use client";

import React from 'react';
import Image from 'next/image';

interface VideoItem {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  description?: string;
  isWatched?: boolean;
  url?: string;
}

interface VideoListProps {
  title?: string;
  videos?: VideoItem[];
  onVideoClick?: (video: VideoItem) => void;
  maxVideos?: number;
}

export default function VideoList({
  title = "Videos",
  videos = [],
  onVideoClick,
  maxVideos = 6
}: VideoListProps) {
  // Handle undefined or null videos
  const safeVideos = videos || [];
  const displayVideos = safeVideos.slice(0, maxVideos);

  const handleVideoClick = (video: VideoItem) => {
    if (onVideoClick) {
      onVideoClick(video);
    } else if (video.url) {
      window.open(video.url, '_blank');
    }
  };

  return (
    <div className="card-glass-subtle p-6">
      <h3 className="text-glass-primary text-lg font-semibold mb-5">
        {title}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayVideos.map((video) => (
          <div
            key={video.id}
            className="group cursor-pointer rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 hover:transform hover:scale-[1.02]"
            onClick={() => handleVideoClick(video)}
          >
            {/* Video Thumbnail */}
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
              {video.thumbnail ? (
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl">🎥</span>
                </div>
              )}

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                  <div className="w-0 h-0 border-l-[8px] border-l-gray-800 border-y-[6px] border-y-transparent ml-1"></div>
                </div>
              </div>

              {/* Duration Badge */}
              {video.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
              )}

              {/* Watched Indicator */}
              {video.isWatched && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="px-2">
              <h4 className="text-glass-primary font-medium text-sm leading-tight mb-1 line-clamp-2">
                {video.title}
              </h4>
              {video.description && (
                <p className="text-glass-muted text-xs leading-relaxed line-clamp-2">
                  {video.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {safeVideos.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl mb-3 block">🎬</span>
          <span className="text-glass-muted text-sm">No videos available</span>
        </div>
             )}
     </div>
   );
}