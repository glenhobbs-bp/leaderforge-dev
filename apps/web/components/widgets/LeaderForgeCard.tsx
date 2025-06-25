/**
 * LeaderForgeCard.tsx
 * Purpose: Specialized card widget for LeaderForge platform with video modals, progress tracking, and worksheet status - Design System Compliant
 * Owner: Component System
 * Tags: #widget #leaderforge #video #progress #platform-specific #design-system
 */

"use client";

import React from 'react';
import Image from 'next/image';
import { ComponentSchema } from '../../../../packages/agent-core/types/ComponentSchema';

// CardAction interface from agent-core types
interface CardAction {
  label: string;
  action: string;
  [key: string]: unknown; // Allow extra properties for renderer use
}

interface LeaderForgeCardProps {
  schema: ComponentSchema;
  onAction?: (action: CardAction) => void;
}

export function LeaderForgeCard({ schema, onAction }: LeaderForgeCardProps) {
  // Type guard to ensure we have a Card schema
  if (schema.type !== 'Card') {
    return null;
  }

  const {
    image,
    featuredImage,
    coverImage,
    imageUrl,
    videoUrl,
    title,
    description,
    videoWatched,
    worksheetSubmitted,
    progress,
    actions,
    pills,
  } = schema.props;

  const cardImage = image || featuredImage || coverImage || imageUrl || "/icons/placeholder.png";

  // Use passed progress data (should come from server-side agent response)
  // TODO: Agent responses should include progress data fetched server-side
  const actualProgress = progress || 0;
  const actualVideoWatched = actualProgress >= 90 || videoWatched;

  const handleAction = (action: CardAction) => {
    onAction?.(action);
  };

  return (
    <div className="card-glass-subtle card-glass-interactive h-full">
      {/* Header with Image */}
      {cardImage && (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <Image
            src={cardImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 400px"
            priority={false}
            onError={e => (e.currentTarget.src = '/icons/placeholder.png')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <div
              className="px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-white/20"
              style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                color: actualVideoWatched ? 'var(--success-500)' : 'var(--text-secondary)'
              }}
            >
              <span className="mr-1">{actualVideoWatched ? '✓' : '○'}</span>
              {actualVideoWatched ? 'Watched' : 'Not Watched'}
            </div>
          </div>

          {/* Duration Badge */}
          {videoUrl && (
            <div className="absolute top-3 left-3">
              <div className="px-2 py-1 rounded-full bg-black/70 text-white text-xs font-medium">
                {videoUrl.split('/').pop()?.split('.').slice(0, -1).join('.')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-glass-primary font-semibold text-base leading-tight mb-3">
          {title}
        </h3>

        {description && (
          <p className="text-glass-secondary text-sm leading-relaxed mb-4 flex-1">
            {description}
          </p>
        )}

        {/* Progress Bar */}
        {actualProgress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-glass-muted text-xs font-medium">Progress</span>
              <span className="text-glass-muted text-xs font-medium">{Math.round(actualProgress)}%</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${actualProgress}%`,
                  background: actualProgress === 100 ? 'var(--success-500)' : 'var(--primary)'
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => handleAction(
            actions?.find(a => a.action === 'openVideoModal') ||
            { action: 'openVideoModal', label: 'Watch', videoUrl, title }
          )}
          disabled={!videoUrl}
          className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            !videoUrl
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm hover:shadow-md'
          }`}
        >
          Watch
        </button>
      </div>
    </div>
  );
}