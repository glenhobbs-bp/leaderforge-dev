"use client";
// File: apps/web/components/ui/ModalManager.tsx
// Purpose: Manages video and worksheet modals with dynamic loading and proper state management
// Owner: Frontend Team
// Tags: #modals #video #worksheet #performance

import React, { Suspense, lazy } from 'react';
import { UniversalWidgetSchema } from '../../../../packages/agent-core/types/UniversalWidgetSchema';
import { FormWidget } from '../forms/FormWidget';

// Dynamic VideoPlayerModal loader to prevent bundle bloat
const DynamicVideoPlayerModal = lazy(() =>
  import('../widgets/VideoPlayerModal').then(module => ({
    default: module.VideoPlayerModal
  }))
);

interface VideoModalData {
  action: string;
  label: string;
  title?: string;
  videoUrl?: string;
  poster?: string;
  description?: string;
  progress?: number;
  parameters?: Record<string, unknown>;
  onCompleteAction?: unknown;
  onRealTimeProgressUpdate?: (progress: number) => void;
  [key: string]: unknown;
}

interface WorksheetModalData {
  contentId: string;
  title: string;
  templateId?: string;
  agentReasoning?: string;
  contentAnalysis?: string;
  [key: string]: unknown;
}

interface ModalManagerProps {
  // Video modal state
  isVideoModalOpen: boolean;
  videoModalData: VideoModalData | null;
  onVideoModalOpenChange: (open: boolean) => void;
  onVideoModalDataChange: (data: VideoModalData | null) => void;

  // Worksheet modal state
  isWorksheetModalOpen: boolean;
  worksheetModalData: WorksheetModalData | null;
  onWorksheetModalOpenChange: (open: boolean) => void;
  onWorksheetModalDataChange: (data: WorksheetModalData | null) => void;

  // Context
  userId?: string;
  tenantKey: string;
}

export function ModalManager({
  isVideoModalOpen,
  videoModalData,
  onVideoModalOpenChange,
  onVideoModalDataChange,
  isWorksheetModalOpen,
  worksheetModalData,
  onWorksheetModalOpenChange,
  onWorksheetModalDataChange,
  userId,
  tenantKey
}: ModalManagerProps) {
  return (
    <>
      {/* Video Modal */}
      {isVideoModalOpen && videoModalData && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 shadow-2xl">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading video player...</span>
              </div>
            </div>
          </div>
        }>
          <DynamicVideoPlayerModal
            schema={{
              type: 'VideoPlayer',
              id: `video-modal-${Date.now()}`,
              data: {
                videoUrl: videoModalData.videoUrl,
                poster: videoModalData.poster,
                description: videoModalData.description,
                progress: videoModalData.progress || 0,
                // Critical: Pass contentId for proper progress tracking correlation
                contentId: (videoModalData.parameters as Record<string, unknown>)?.contentId || (videoModalData as Record<string, unknown>).contentId
              },
              config: {
                title: videoModalData.title,
                autoplay: true,
                actions: videoModalData.onCompleteAction ? [videoModalData.onCompleteAction] : []
              },
              version: '1.0'
            } as unknown as UniversalWidgetSchema}
            open={isVideoModalOpen}
            onOpenChange={(open) => {
              onVideoModalOpenChange(open);
              if (!open) {
                onVideoModalDataChange(null);
              }
            }}
            userId={userId}
            tenantKey={tenantKey}
            onProgressUpdate={(finalProgress: number) => {
              console.log('[ModalManager] Video modal closed with progress:', finalProgress);

              // Update the card's local progress via the onRealTimeProgressUpdate callback
              if (videoModalData?.onRealTimeProgressUpdate && typeof videoModalData.onRealTimeProgressUpdate === 'function') {
                console.log('[ModalManager] Updating card progress via callback:', finalProgress);
                videoModalData.onRealTimeProgressUpdate(finalProgress);
              } else {
                console.warn('[ModalManager] No onRealTimeProgressUpdate callback found in videoModalData');
              }

              // Progress tracking is handled automatically by the video modal
              // No content refresh needed as progress updates don't change content structure
            }}
          />
        </Suspense>
      )}

      {/* Worksheet Modal */}
      {isWorksheetModalOpen && worksheetModalData && (() => {
        // ✅ Memoize videoContext to prevent unnecessary re-renders and multiple template fetches
        const videoContext = {
          id: worksheetModalData.contentId,
          title: worksheetModalData.title
        };

        return (
          <FormWidget
            templateId={worksheetModalData.templateId || '663570eb-babd-41cd-9bfa-18972275863b'}
            isOpen={isWorksheetModalOpen}
            onClose={() => {
              onWorksheetModalOpenChange(false);
              onWorksheetModalDataChange(null);
            }}
            videoContext={videoContext}
            onSubmit={async (submissionData) => {
              console.log('[ModalManager] Worksheet submitted:', submissionData);
              // ✅ No content refresh needed - worksheet submission doesn't change the content state
              // Progress tracking and leaderboard updates happen automatically via Universal Input System
              console.log('[ModalManager] Worksheet submission complete - no ContentPanel refresh needed');
              onWorksheetModalOpenChange(false);
              onWorksheetModalDataChange(null);
            }}
          />
        );
      })()}
    </>
  );
}