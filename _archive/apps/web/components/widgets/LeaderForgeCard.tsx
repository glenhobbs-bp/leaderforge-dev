/**
 * LeaderForgeCard.tsx
 * Purpose: Specialized card widget for LeaderForge platform with video modals, progress tracking, and worksheet status - Design System Compliant
 * Owner: Component System
 * Tags: #widget #leaderforge #video #progress #platform-specific #design-system #adr-0009
 */

"use client";

import React from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { UniversalWidgetSchema } from '../../../../packages/agent-core/types/UniversalWidgetSchema';
// CardAction interface for action handling
interface CardAction {
  label: string;
  action: string;
  [key: string]: unknown; // Allow extra properties for renderer use
}

interface LeaderForgeCardProps {
  schema: UniversalWidgetSchema;
  userId?: string;
  onAction?: (action: CardAction) => void;
  onProgressUpdate?: () => void;
}

export function LeaderForgeCard({ schema, userId, onAction, onProgressUpdate }: LeaderForgeCardProps) {

  // Type guard to ensure we have a Card schema
  if (schema.type !== 'Card') {
    console.warn('[LeaderForgeCard] Invalid schema type:', schema.type);
    return null;
  }

  // Extract data from Universal Widget Schema structure
  const data = schema.data as any;
  const config = schema.config as any;

  // Map Universal Schema to component props
  const {
    imageUrl,
    featuredImage,
    coverImage,
    videoUrl,
    description,
    duration,
    progress = 0,
    stats = {},
  } = data;

  const {
    title,
    subtitle,
    actions = [],
  } = config;

  // Determine the best image to use
  const cardImage = imageUrl || featuredImage || coverImage || "/icons/placeholder.png";

  // Progress and completion logic
  const actualProgress = progress || 0;
  const videoWatched = stats.watched || actualProgress >= 90;
  const worksheetSubmitted = stats.completed || false;
  const isFullyCompleted = videoWatched && worksheetSubmitted;

  console.log('[LeaderForgeCard] Rendering with Universal Schema:', {
    id: schema.id,
    title,
    videoUrl,
    actualProgress,
    videoWatched,
    worksheetSubmitted,
    userId
  });

  const handleAction = (action: CardAction) => {
    console.log('[LeaderForgeCard] Action triggered:', action);

    // Only call onAction if it's provided, otherwise just log for now
    if (onAction) {
      onAction(action);
    } else {
      console.log('[LeaderForgeCard] No onAction handler provided - action will be ignored:', action);
    }

    // Only trigger progress update for actions that actually change progress
    // openVideoModal should NOT refresh content - it should open a modal
    // Only completeProgress should refresh content to update UI
    if (action.action === 'completeProgress') {
      console.log('[LeaderForgeCard] Triggering progress update for completion');
      onProgressUpdate?.();
    }
  };

  return (
    <div className="card-glass-elevated group h-full overflow-hidden flex flex-col">
      {/* Header with Image - Fixed Height */}
      {cardImage && (
        <div
          className="relative h-48 overflow-hidden cursor-pointer flex-shrink-0"
          onClick={() => videoUrl && handleAction({
            action: 'openVideoModal',
            label: 'Watch Video',
            videoUrl: videoUrl || '',
            title: title || '',
            poster: cardImage || '',
            progress: actualProgress || 0,
            videoWatched: videoWatched || false,
            worksheetSubmitted: worksheetSubmitted || false,
            description: description || '',
            duration: duration,
            userId,
            onCompleteAction: {
              action: 'completeProgress',
              contentId: schema.id,
              progress: 100
            }
          })}
        >
          <Image
            src={cardImage}
            alt={title || 'Content'}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 100vw, 400px"
            priority={false}
            onError={e => (e.currentTarget.src = '/icons/placeholder.png')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>

          {/* Play Overlay */}
          {videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/30 group-hover:bg-white/60 group-hover:scale-110 transition-all duration-300">
                <Play className="w-4 h-4 text-black ml-0.5" fill="currentColor" />
              </div>
            </div>
          )}

          {/* Status Badge - Only show when fully completed */}
          {isFullyCompleted && (
            <div className="absolute top-4 right-4 z-10">
              <div className="px-2.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border border-white/30 shadow-lg transition-all duration-300 bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white shadow-green-500/25">
                <span className="mr-1">✓</span>
                Completed
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Area - Flexible */}
      <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-white/5 via-transparent to-transparent">
        {/* Variable Content Area - Expands to fill space */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-glass-primary font-medium text-sm leading-tight mb-2 group-hover:text-gray-900 transition-colors duration-300 flex-shrink-0">
            {title}
          </h3>

          {subtitle && (
            <p className="text-glass-muted text-xs mb-2">
              {subtitle}
            </p>
          )}

          {description && (
            <div className="flex-1">
              <p className="text-glass-secondary text-xs leading-relaxed line-clamp-3">
                {description}
              </p>
            </div>
          )}

          {duration && (
            <p className="text-glass-muted text-xs mt-2">
              Duration: {duration}
            </p>
          )}
        </div>

        {/* Fixed Bottom Section - Always at bottom, consistent across all cards */}
        <div className="mt-4 space-y-3 flex-shrink-0">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-glass-muted text-xs font-normal">Progress</span>
              <span className="text-glass-primary text-xs font-medium">{Math.round(actualProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200/60 rounded-full h-2 overflow-hidden">
              <div
                className={`
                  h-full rounded-full transition-all duration-500 ease-out
                  ${actualProgress === 100
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : actualProgress > 0
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : 'bg-gray-300'
                  }
                `}
                style={{ width: `${Math.max(actualProgress, 4)}%` }}
              ></div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="space-y-1">
            {/* Video Status */}
            <div className="flex items-center gap-1.5">
              {videoWatched ? (
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-glass-muted text-xs font-normal">
                Video {videoWatched ? 'Watched' : 'Not Watched'}
              </span>
            </div>

            {/* Worksheet Status */}
            <div className="flex items-center gap-1.5">
              {worksheetSubmitted ? (
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-glass-muted text-xs font-normal">
                Worksheet {worksheetSubmitted ? 'Submitted' : 'Not Submitted'}
              </span>
            </div>
          </div>

          {/* Action Buttons from config.actions */}
          {actions.length > 0 && (
            <div className="flex justify-between items-center pt-2">
              {/* Watch button - left aligned */}
              {actions.filter((action: any) => action.action === 'openVideoModal').map((action: any, index: number) => (
                <button
                  key={`watch-${index}`}
                  onClick={() => handleAction({
                    action: action.action,
                    label: action.label,
                    ...action.parameters
                  })}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md hover:scale-105"
                >
                  <Play className="w-3 h-3" fill="currentColor" />
                  {action.label}
                </button>
              ))}

              {/* Worksheet button - right aligned */}
              {actions.filter((action: any) => action.action === 'openWorksheet').map((action: any, index: number) => (
                <button
                  key={`worksheet-${index}`}
                  onClick={() => handleAction({
                    action: action.action,
                    label: action.label,
                    ...action.parameters
                  })}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md hover:scale-105"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}