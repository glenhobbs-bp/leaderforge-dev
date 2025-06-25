/**
 * File: apps/web/components/widgets/VideoList.tsx
 * Purpose: Extracted VideoList widget from ComponentSchemaRenderer - Design System Compliant
 * Owner: Widget Team
 * Tags: #widget #video #media #design-system
 */

"use client";

import React from 'react';
import Image from 'next/image';
import { BaseWidgetProps } from '@leaderforge/asset-core';

export interface VideoListProps extends BaseWidgetProps {
  schema: {
    type: 'VideoList';
    props: {
      title: string;
      videos: Array<{
        props: {
          title: string;
          image: string;
          description?: string;
          duration?: string;
        };
      }>;
    };
  };
}

export function VideoList({ schema }: VideoListProps) {
  if (schema.type !== 'VideoList') {
    return null;
  }

  const { title, videos } = schema.props;

  return (
    <div className="card bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
      <h3 className="heading-4 text-[var(--text-primary)] mb-6">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos && videos.map((video, i) => (
          <div
            key={i}
            className="group relative cursor-pointer rounded-lg overflow-hidden bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] transition-all duration-200 hover:shadow-md"
          >
            <div className="relative aspect-video">
              {video.props.image && (
                <Image
                  src={video.props.image}
                  alt={video.props.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              )}
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200">
                <div className="w-12 h-12 rounded-full bg-[var(--primary)] bg-opacity-90 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-200">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white ml-1">
                    <path d="M6 4l10 6-10 6V4z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              {/* Duration badge */}
              {video.props.duration && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded">
                  {video.props.duration}
                </div>
              )}
            </div>
            <div className="p-3">
              <h4 className="body-base font-medium text-[var(--text-primary)] line-clamp-2 mb-1">
                {video.props.title}
              </h4>
              {video.props.description && (
                <p className="body-small text-[var(--text-secondary)] line-clamp-2">
                  {video.props.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}