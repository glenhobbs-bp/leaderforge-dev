// File: apps/web/app/hooks/useVideoProgress.ts
// Purpose: React hook for video progress tracking with optimistic updates
// Owner: Frontend team
// Tags: React hooks, video progress, debouncing, optimistic updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserPreferences } from './useUserPreferences';
import type { VideoProgress, UserPreferences } from '../lib/types';

interface UseVideoProgressProps {
  userId: string;
  contentId: string;
  duration?: number;
}

interface UseVideoProgressReturn {
  progress: VideoProgress | null;
  updateProgress: (currentTime: number, duration?: number) => void;
  markCompleted: () => void;
  isCompleted: boolean;
  progressPercentage: number;
}

/**
 * Hook for tracking video progress with optimistic updates and debounced persistence
 */
export function useVideoProgress({ userId, contentId, duration = 0 }: UseVideoProgressProps): UseVideoProgressReturn {
  const { data: userPrefs } = useUserPreferences(userId);
  const queryClient = useQueryClient();

    // Local state for optimistic updates
  const [localProgress, setLocalProgress] = useState<VideoProgress | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Get initial progress from user preferences
  const preferences = userPrefs?.preferences as UserPreferences;
  const serverProgress = preferences?.videoProgress?.[contentId] || null;
  const currentProgress = localProgress || serverProgress;

  // Mutation for saving progress
  const saveProgressMutation = useMutation({
    mutationFn: async (progress: Partial<VideoProgress>) => {
      const response = await fetch(`/api/user/${userId}/video-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, progress })
      });

      if (!response.ok) {
        throw new Error('Failed to save video progress');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate user preferences to sync with server
      queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
    },
    onError: (error) => {
      console.error('Failed to save video progress:', error);
      // Reset local state on error
      setLocalProgress(null);
    }
  });

    // Debounced save function
  const debouncedSave = useCallback((progress: Partial<VideoProgress>) => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveProgressMutation.mutate(progress);
    }, 2000); // Save after 2 seconds of inactivity
  }, [saveProgressMutation]);

  // Update progress with optimistic updates
  const updateProgress = useCallback((currentTime: number, videoDuration?: number) => {
    const actualDuration = videoDuration || duration;
    if (!actualDuration) return;

    const progressPercentage = Math.min((currentTime / actualDuration) * 100, 100);
    const isCompleted = progressPercentage >= 90; // Consider 90% as completed

    const newProgress: VideoProgress = {
      contentId,
      currentTime,
      duration: actualDuration,
      completed: isCompleted,
      lastWatchedAt: new Date().toISOString(),
      watchTime: (currentProgress?.watchTime || 0) + 1 // Increment watch time
    };

    // Optimistic update
    setLocalProgress(newProgress);

    // Debounced save
    debouncedSave(newProgress);
  }, [contentId, duration, currentProgress?.watchTime, debouncedSave]);

  // Mark as completed
  const markCompleted = useCallback(() => {
    const newProgress: VideoProgress = {
      contentId,
      currentTime: duration,
      duration,
      completed: true,
      lastWatchedAt: new Date().toISOString(),
      watchTime: (currentProgress?.watchTime || 0)
    };

    setLocalProgress(newProgress);
    saveProgressMutation.mutate(newProgress);
  }, [contentId, duration, currentProgress?.watchTime, saveProgressMutation]);

  // Calculate progress percentage
  const progressPercentage = currentProgress && currentProgress.duration > 0
    ? Math.min((currentProgress.currentTime / currentProgress.duration) * 100, 100)
    : 0;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    progress: currentProgress,
    updateProgress,
    markCompleted,
    isCompleted: currentProgress?.completed || false,
    progressPercentage
  };
}