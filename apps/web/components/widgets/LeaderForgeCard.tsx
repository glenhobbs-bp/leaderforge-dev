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
    <div className="card card-interactive bg-[var(--surface)] rounded-xl shadow-sm border border-[var(--border)] flex flex-col h-full min-h-[340px] transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-[var(--primary)]">
      {/* Video/Image Section */}
      <div className="relative w-full aspect-video rounded-t-xl overflow-hidden">
        {cardImage ? (
          <Image
            src={cardImage}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            priority={false}
            onError={e => (e.currentTarget.src = '/icons/placeholder.png')}
          />
        ) : null}
        {videoUrl && (
          <button
            className="absolute inset-0 flex items-center justify-center z-10 group bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200"
            onClick={() =>
              handleAction(
                actions?.find(a => a.action === 'openVideoModal') ||
                { action: 'openVideoModal', label: 'Watch', videoUrl, title }
              )
            }
            aria-label="Play video"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--primary)] bg-opacity-90 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-200">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white ml-1">
                <path d="M6 4l10 6-10 6V4z" fill="currentColor" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-6 gap-3">
        {/* Title and Pills */}
        <div className="flex flex-row items-start gap-3 mb-2">
          <h3 className="heading-4 text-[var(--text-primary)] line-clamp-2 flex-1">{title}</h3>
          {pills && pills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pills.map((pill, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]"
                  style={pill.color ? {
                    backgroundColor: `${pill.color}20`,
                    color: pill.color,
                    borderColor: pill.color
                  } : {}}
                >
                  {pill.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="body-base text-[var(--text-secondary)] line-clamp-3 mb-3">{description}</p>

        {/* Status indicators - LeaderForge specific: video watched and worksheet submission */}
        <div className="flex flex-row items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${actualVideoWatched ? 'bg-[var(--success-500)]' : 'bg-[var(--border)]'}`}>
              {actualVideoWatched && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white">
                  <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={`caption ${actualVideoWatched ? 'text-[var(--success-600)]' : 'text-[var(--text-secondary)]'}`}>
              {actualProgress > 0 ? `${Math.round(actualProgress)}% watched` : 'Video Not Watched'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${worksheetSubmitted ? 'bg-[var(--success-500)]' : 'bg-[var(--border)]'}`}>
              {worksheetSubmitted && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white">
                  <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={`caption ${worksheetSubmitted ? 'text-[var(--success-600)]' : 'text-[var(--text-secondary)]'}`}>
              Worksheet {worksheetSubmitted ? 'Submitted' : 'Not Submitted'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {typeof actualProgress === 'number' && (
          <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${actualProgress}%`,
                backgroundColor: actualProgress === 100 ? 'var(--success-500)' : 'var(--primary)'
              }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-row gap-3 mt-auto">
          {actions && actions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleAction(action)}
              className={
                action.label.toLowerCase().includes('watch')
                  ? 'btn btn-primary px-4 py-2 text-sm font-medium'
                  : 'btn btn-secondary px-4 py-2 text-sm font-medium'
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