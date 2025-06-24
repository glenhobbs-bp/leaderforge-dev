/**
 * File: apps/web/components/ai/UniversalSchemaRenderer.tsx
 * Purpose: Universal component renderer for agent-generated UI schemas
 * Architecture: Agent-native, registry-based, no hardcoded component logic
 * Owner: Component System
 * Tags: #universal-renderer #agent-native #registry-driven
 */
"use client";

import React, { useState } from 'react';
import { ComponentSchema, CardAction } from "../../../../packages/agent-core/types/ComponentSchema";
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { WidgetDispatcher, isWidgetTypeAvailable } from "../widgets";
import { VideoPlayerModal } from '../widgets/VideoPlayerModal';

interface VideoModalState {
  videoUrl: string;
  title: string;
  poster: string;
  progress: number;
  pills: { label: string; color?: string; }[];
  videoWatched: boolean;
  worksheetSubmitted: boolean;
  onCompleteAction: CardAction;
  description: string;
}

export function UniversalSchemaRenderer({ schema, userId, onProgressUpdate }: {
  schema: ComponentSchema;
  userId?: string;
  onProgressUpdate?: () => void;
}) {
  // Debug: log the received schema
  console.log("[UniversalSchemaRenderer] schema:", schema);

  // Error handling state
  const [error, setError] = useState<string | null>(null);

  // Modal state for VideoPlayer (legacy support)
  const [videoModal, setVideoModal] = useState<VideoModalState | null>(null);

  const handleAction = (action: CardAction) => {
    if (action.action === 'openVideoModal') {
      setVideoModal({
        videoUrl: action.videoUrl as string,
        title: action.title as string,
        poster: action.poster as string,
        progress: action.progress as number,
        pills: action.pills as { label: string; color?: string; }[],
        videoWatched: action.videoWatched as boolean,
        worksheetSubmitted: action.worksheetSubmitted as boolean,
        onCompleteAction: action.onCompleteAction as CardAction,
        description: action.description as string,
      });
    } else if (action.action === 'completeProgress') {
      if (action.contentId) {
        handleProgressUpdate(action.contentId, action.progress as number);
      }
    } else {
      console.log('[UniversalSchemaRenderer] Unknown action:', action);
    }
  };

  // Safely handle progress update
  async function handleProgressUpdate(contentId: string, progress: number) {
    console.log(`[UniversalSchemaRenderer] Progress update request: ${contentId} = ${progress}%`);
    try {
      const response = await fetch('/api/universal-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contentId,
          contextKey: 'leaderforge',
          progress_percentage: typeof progress === 'number' ? progress : 100,
          completed_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Progress update failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[UniversalSchemaRenderer] Progress updated successfully:', result);

      // Trigger parent refresh
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      console.error('[UniversalSchemaRenderer] Progress update failed:', error);
      setError('Failed to update progress. Please try again.');
    }
  }

  // User-friendly error UI
  function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6">
        <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mb-2" />
        <div className="text-lg font-semibold text-red-600 mb-1">No content available</div>
        <div className="text-gray-700 mb-3">{message}</div>
        {onRetry && (
          <button
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--secondary)] transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // If error at top level, show error UI
  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }
  if (!schema || typeof schema !== 'object' || !schema.type) {
    return <ErrorMessage message="Unable to load content. Please try again later." onRetry={() => window.location.reload()} />;
  }

  // **UNIVERSAL RENDERING**: Use WidgetDispatcher for ALL registered widgets
  if (isWidgetTypeAvailable(schema.type)) {
    return (
      <>
        <WidgetDispatcher
          schema={schema}
          userId={userId}
          onAction={handleAction}
          onProgressUpdate={onProgressUpdate}
          UniversalSchemaRenderer={UniversalSchemaRenderer}
        />
        {/* Legacy video modal support - will be removed once all video handling is in widgets */}
        {videoModal && (
          <VideoPlayerModal
            schema={{
              type: 'VideoPlayer',
              props: {
                videoUrl: videoModal.videoUrl,
                title: videoModal.title,
                poster: videoModal.poster,
                progress: videoModal.progress,
                pills: videoModal.pills,
                videoWatched: videoModal.videoWatched,
                worksheetSubmitted: videoModal.worksheetSubmitted,
                onCompleteAction: videoModal.onCompleteAction,
                description: videoModal.description
              }
            }}
            open={!!videoModal}
            onOpenChange={(open) => {
              if (!open) {
                setVideoModal(null);
                if (onProgressUpdate) {
                  console.log('[UniversalSchemaRenderer] Video modal closed, triggering progress update');
                  onProgressUpdate();
                }
              }
            }}
            userId={userId}
            onProgressUpdate={onProgressUpdate}
          />
        )}
      </>
    );
  }

  // **FALLBACK**: Only for unregistered widget types (should be rare in production)
  console.warn(`[UniversalSchemaRenderer] Widget type '${schema.type}' not found in registry, using fallback`);
  return <ErrorMessage message={`Widget type '${schema.type}' is not available. Please register this widget in the widget registry.`} />;
}