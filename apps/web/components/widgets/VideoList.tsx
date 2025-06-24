/**
 * File: apps/web/components/widgets/VideoList.tsx
 * Purpose: Extracted VideoList widget from ComponentSchemaRenderer
 * Owner: Widget Team
 * Tags: #widget #videolist #content #grid
 */

"use client";

import React from 'react';
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
    <div className="mb-8">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {videos.map((video, i) => (
          <div key={video.props.title + i} className="rounded-lg shadow bg-white p-4 flex flex-col items-center">
            <img
              src={video.props.image}
              alt={video.props.title}
              className="w-full h-32 object-cover rounded mb-2"
              onError={e => (e.currentTarget.src = "/icons/placeholder.png")}
            />
            <div className="font-medium text-center">{video.props.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}