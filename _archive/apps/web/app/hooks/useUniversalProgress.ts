/**
 * Universal Progress Hook
 * Purpose: React hook for easy progress tracking in components
 * Owner: Senior Engineering Team
 * Tags: react-hooks, progress-tracking, agent-native
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { ClientUserProgressService } from '../lib/userProgressService.client';
import {
  UserProgress,
  ProgressEvent,
  ProgressSummary,
  CompletionStats,
  Milestone
} from '../lib/types/progress';

export interface UseUniversalProgressOptions {
  userId: string;
  contextKey: string;
  onProgressUpdate?: (progress: UserProgress) => void;
  onError?: (error: Error) => void;
}

export interface UseUniversalProgressReturn {
  // State
  isTracking: boolean;
  lastProgress: UserProgress | null;
  error: Error | null;

  // Video tracking
  trackVideoProgress: (contentId: string, watchTime: number, position: number, duration?: number) => Promise<UserProgress | null>;

  // Quiz tracking
  trackQuizCompletion: (contentId: string, score: number, totalQuestions: number, answeredQuestions: number) => Promise<UserProgress | null>;

  // Reading tracking
  trackReadingProgress: (contentId: string, scrollPosition: number, highlights?: number) => Promise<UserProgress | null>;

  // Custom tracking
  trackProgressEvent: (event: Omit<ProgressEvent, 'userId' | 'contextKey'>) => Promise<UserProgress | null>;

  // Data fetching
  getProgress: (contentId: string) => Promise<UserProgress | null>;
  getProgressForContentIds: (contentIds: string[]) => Promise<Record<string, UserProgress>>;
  getProgressSummary: () => Promise<ProgressSummary>;
  getCompletionStats: () => Promise<CompletionStats>;
  checkMilestones: () => Promise<Milestone[]>;

  // Batch operations
  batchTrackProgress: (events: Array<Omit<ProgressEvent, 'userId' | 'contextKey'>>) => Promise<UserProgress[]>;

  // Utils
  clearError: () => void;
  clearPendingRequests: () => void;
}

/**
 * Hook for universal progress tracking across all content types.
 * Provides a consistent interface for components to track and retrieve progress.
 */
export function useUniversalProgress(options: UseUniversalProgressOptions): UseUniversalProgressReturn {
  const { userId, contextKey, onProgressUpdate, onError } = options;

  const [isTracking, setIsTracking] = useState(false);
  const [lastProgress, setLastProgress] = useState<UserProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Request deduplication - prevent multiple simultaneous calls
  const pendingRequests = useRef<Map<string, Promise<any>>>(new Map());

  // Helper to handle async operations with error handling
  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void
  ): Promise<T | null> => {
    try {
      setIsTracking(true);
      setError(null);

      const result = await operation();

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);
      return null;
    } finally {
      setIsTracking(false);
    }
  }, [onError]);

  // Video progress tracking
  const trackVideoProgress = useCallback(async (
    contentId: string,
    watchTime: number,
    position: number,
    duration?: number
  ): Promise<UserProgress | null> => {
    return handleAsyncOperation(
      () => ClientUserProgressService.trackVideoProgress(userId, contentId, contextKey, watchTime, position, duration),
      (progress) => {
        setLastProgress(progress);
        onProgressUpdate?.(progress);
      }
    );
  }, [userId, contextKey, handleAsyncOperation, onProgressUpdate]);

  // Quiz completion tracking
  const trackQuizCompletion = useCallback(async (
    contentId: string,
    score: number,
    totalQuestions: number,
    answeredQuestions: number
  ): Promise<UserProgress | null> => {
    return handleAsyncOperation(
      () => ClientUserProgressService.trackQuizCompletion(userId, contentId, contextKey, score, totalQuestions, answeredQuestions),
      (progress) => {
        setLastProgress(progress);
        onProgressUpdate?.(progress);
      }
    );
  }, [userId, contextKey, handleAsyncOperation, onProgressUpdate]);

  // Reading progress tracking
  const trackReadingProgress = useCallback(async (
    contentId: string,
    scrollPosition: number,
    highlights?: number
  ): Promise<UserProgress | null> => {
    return handleAsyncOperation(
      () => ClientUserProgressService.trackReadingProgress(userId, contentId, contextKey, scrollPosition, highlights),
      (progress) => {
        setLastProgress(progress);
        onProgressUpdate?.(progress);
      }
    );
  }, [userId, contextKey, handleAsyncOperation, onProgressUpdate]);

  // Custom progress event tracking
  const trackProgressEvent = useCallback(async (
    event: Omit<ProgressEvent, 'userId' | 'contextKey'>
  ): Promise<UserProgress | null> => {
    const fullEvent: ProgressEvent = {
      ...event,
      userId,
      contextKey
    };

    return handleAsyncOperation(
      () => ClientUserProgressService.trackProgressEvent(fullEvent),
      (progress) => {
        setLastProgress(progress);
        onProgressUpdate?.(progress);
      }
    );
  }, [userId, contextKey, handleAsyncOperation, onProgressUpdate]);

  // Get progress for single content with request deduplication
  const getProgress = useCallback(async (contentId: string): Promise<UserProgress | null> => {
    const requestKey = `getProgress-${userId}-${contentId}-${contextKey}`;

    // Return existing promise if already in progress
    if (pendingRequests.current.has(requestKey)) {
      return pendingRequests.current.get(requestKey)!;
    }

    // Create new request and cache the promise
    const requestPromise = handleAsyncOperation(
      () => ClientUserProgressService.getProgress(userId, contentId, contextKey)
    );

    pendingRequests.current.set(requestKey, requestPromise);

    // Clean up after completion
    requestPromise.finally(() => {
      pendingRequests.current.delete(requestKey);
    });

    return requestPromise;
  }, [userId, contextKey, handleAsyncOperation]);

  // Get progress for multiple content items
  const getProgressForContentIds = useCallback(async (contentIds: string[]): Promise<Record<string, UserProgress>> => {
    const result = await handleAsyncOperation(
      () => ClientUserProgressService.getProgressForContentIds(userId, contentIds, contextKey)
    );
    return result || {};
  }, [userId, contextKey, handleAsyncOperation]);

  // Get progress summary
  const getProgressSummary = useCallback(async (): Promise<ProgressSummary> => {
    const result = await handleAsyncOperation(
      () => ClientUserProgressService.getProgressSummary(userId, contextKey)
    );

    // Return empty summary if operation failed
    return result || {
      userId,
      contextKey,
      totalItems: 0,
      completedItems: 0,
      inProgressItems: 0,
      completionPercentage: 0,
      totalSessionTime: 0,
      lastActivity: '',
      progressByType: {}
    };
  }, [userId, contextKey, handleAsyncOperation]);

  // Get completion statistics
  const getCompletionStats = useCallback(async (): Promise<CompletionStats> => {
    const result = await handleAsyncOperation(
      () => ClientUserProgressService.getCompletionStats(userId, contextKey)
    );

    // Return empty stats if operation failed
    return result || {
      userId,
      contextKey,
      completionsByType: {},
      averageSessionTime: 0,
      streakDays: 0,
      milestones: []
    };
  }, [userId, contextKey, handleAsyncOperation]);

  // Check milestones
  const checkMilestones = useCallback(async (): Promise<Milestone[]> => {
    const result = await handleAsyncOperation(
      () => ClientUserProgressService.checkMilestones(userId, contextKey)
    );
    return result || [];
  }, [userId, contextKey, handleAsyncOperation]);

  // Batch track multiple events
  const batchTrackProgress = useCallback(async (
    events: Array<Omit<ProgressEvent, 'userId' | 'contextKey'>>
  ): Promise<UserProgress[]> => {
    const fullEvents: ProgressEvent[] = events.map(event => ({
      ...event,
      userId,
      contextKey
    }));

    const result = await handleAsyncOperation(
      () => ClientUserProgressService.batchTrackProgress(fullEvents)
    );
    return result || [];
  }, [userId, contextKey, handleAsyncOperation]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear pending requests (useful for cleanup)
  const clearPendingRequests = useCallback(() => {
    pendingRequests.current.clear();
  }, []);

  return {
    // State
    isTracking,
    lastProgress,
    error,

    // Tracking methods
    trackVideoProgress,
    trackQuizCompletion,
    trackReadingProgress,
    trackProgressEvent,

    // Data fetching
    getProgress,
    getProgressForContentIds,
    getProgressSummary,
    getCompletionStats,
    checkMilestones,

    // Batch operations
    batchTrackProgress,

    // Utils
    clearError,
    clearPendingRequests
  };
}