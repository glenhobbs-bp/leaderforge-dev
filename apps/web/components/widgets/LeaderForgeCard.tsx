/**
 * LeaderForgeCard.tsx
 * Purpose: Specialized card widget for LeaderForge platform with video modals, progress tracking, and worksheet status
 * Owner: Component System
 * Tags: #widget #leaderforge #video #progress #platform-specific
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
    <div className="bg-[var(--card-bg)] rounded-xl shadow border border-[var(--bg-neutral)] flex flex-col h-full min-h-[340px] transition-transform hover:shadow-lg hover:scale-[1.025] duration-150">
      <div className="relative w-full aspect-video rounded-t-xl overflow-hidden px-0 lg:px-4">
        {cardImage ? (
          <Image
            src={cardImage}
            alt={title}
            fill
            className="object-cover rounded-t-xl"
            sizes="(max-width: 768px) 100vw, 400px"
            priority={false}
            onError={e => (e.currentTarget.src = '/icons/placeholder.png')}
          />
        ) : null}
        {videoUrl && (
          <button
            className="absolute inset-0 flex items-center justify-center z-10 group"
            onClick={() =>
              handleAction(
                actions?.find(a => a.action === 'openVideoModal') ||
                { action: 'openVideoModal', label: 'Watch', videoUrl, title }
              )
            }
            style={{ background: 'rgba(0,0,0,0.2)' }}
            aria-label="Play video"
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#fff" fillOpacity="0.7" />
              <polygon points="20,16 34,24 20,32" fill="#222" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col p-4 gap-2">
        <div className="flex flex-row items-center gap-2 mb-1">
          <span className="font-semibold text-base line-clamp-1">{title}</span>
          {pills && pills.length > 0 && (
            <div className="flex flex-row gap-1 ml-auto">
              {pills.map((pill, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700" style={pill.color ? { background: pill.color } : {}}>
                  {pill.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600 line-clamp-2 mb-2">{description}</div>
        {/* Status indicators - LeaderForge specific: video watched and worksheet submission */}
        <div className="flex flex-row items-center gap-4 mb-2">
          <div className="flex items-center gap-1 text-xs">
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="8" fill={actualVideoWatched ? '#22c55e' : '#d1d5db'} />
              {actualVideoWatched ? (
                <path d="M5 8.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 8l3 3 5-5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            <span className={actualVideoWatched ? 'text-green-600' : 'text-gray-400'}>
              {actualProgress > 0 ? `${Math.round(actualProgress)}% watched` : 'Video Not Watched'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="8" fill={worksheetSubmitted ? '#22c55e' : '#d1d5db'} />
              {worksheetSubmitted ? (
                <path d="M5 8.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 8l3 3 5-5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            <span className={worksheetSubmitted ? 'text-green-600' : 'text-gray-400'}>
              Worksheet {worksheetSubmitted ? 'Submitted' : 'Not Submitted'}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        {typeof actualProgress === 'number' && (
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${actualProgress}%`, background: actualProgress === 100 ? 'var(--accent)' : 'var(--primary)' }}
            />
          </div>
        )}
        {/* Action buttons */}
        <div className="flex flex-row gap-2 mt-auto">
          {actions && actions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleAction(action)}
              className={
                `px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 shadow-sm ` +
                (action.label.toLowerCase().includes('watch')
                  ? 'bg-[var(--primary)] text-white hover:bg-[var(--secondary)] hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)] hover:text-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98]')
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}