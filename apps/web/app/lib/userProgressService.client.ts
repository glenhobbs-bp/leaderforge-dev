/**
 * User Progress Service - Client Side
 * Purpose: Client-compatible progress tracking service using API routes
 * Owner: Senior Engineering Team
 * Tags: progress-tracking, client-side, api-integration
 */

'use client';

import {
  UserProgress,
  ProgressEvent,
  ProgressSummary,
  CompletionStats,
  Milestone
} from './types/progress';

interface PendingEvent extends ProgressEvent {
  _resolve: (value: UserProgress) => void;
  _reject: (reason: Error) => void;
}

/**
 * Batched Progress Service - Optimizes performance by batching progress events
 * Accumulates events for 2-3 seconds then sends in batch to reduce API overhead
 * Fixed memory leak issues with proper timer cleanup
 */
class BatchedProgressService {
  private static instance: BatchedProgressService;
  private pendingEvents: PendingEvent[] = [];
  private batchTimer: number | null = null;
  private readonly batchDelayMs = 2500; // 2.5 second batching window
  private readonly maxBatchSize = 50; // Maximum events per batch
  private isDestroyed = false; // Track destruction state
  private cleanupFunction?: () => void; // Store cleanup function

  private constructor() {
    // ✅ FIX: Add cleanup on page unload to prevent memory leaks
    if (typeof window !== 'undefined') {
      this.cleanupFunction = () => {
        this.destroy();
      };

      window.addEventListener('beforeunload', this.cleanupFunction);
      window.addEventListener('pagehide', this.cleanupFunction);
    }
  }

  static getInstance(): BatchedProgressService {
    if (!BatchedProgressService.instance) {
      BatchedProgressService.instance = new BatchedProgressService();
    }
    return BatchedProgressService.instance;
  }

  /**
   * Destroy the service and clean up all timers
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // Clear timer
    if (this.batchTimer) {
      window.clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Reject all pending events
    this.pendingEvents.forEach(event => {
      event._reject(new Error('Service destroyed'));
    });
    this.pendingEvents = [];

    // Remove event listeners
    if (typeof window !== 'undefined' && this.cleanupFunction) {
      window.removeEventListener('beforeunload', this.cleanupFunction);
      window.removeEventListener('pagehide', this.cleanupFunction);
    }
  }

  /**
   * Add a progress event to the batch queue
   */
  addEvent(event: ProgressEvent): Promise<UserProgress> {
    if (this.isDestroyed) {
      return Promise.reject(new Error('Service is destroyed'));
    }

    return new Promise((resolve, reject) => {
      // Add event with promise resolvers
      const eventWithPromise: PendingEvent = {
        ...event,
        _resolve: resolve,
        _reject: reject
      };

      this.pendingEvents.push(eventWithPromise);

      // If batch is full, flush immediately
      if (this.pendingEvents.length >= this.maxBatchSize) {
        this.flushBatch();
      } else {
        // Set timer to flush batch after delay
        this.resetBatchTimer();
      }
    });
  }

  /**
   * Force immediate flush of pending events
   */
  async flushBatch(): Promise<void> {
    if (this.pendingEvents.length === 0 || this.isDestroyed) return;

    // Clear timer
    if (this.batchTimer) {
      window.clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Extract events and promises
    const eventsToSend = this.pendingEvents.map(e => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _resolve, _reject, ...event } = e;
      return event;
    });
    const promises = this.pendingEvents.map(e => ({
      resolve: e._resolve,
      reject: e._reject
    }));

    // Clear pending events
    this.pendingEvents = [];

    try {
      // Send batch using the existing API
      const results = await this.batchTrackProgressDirect(eventsToSend);

      // Resolve individual promises with their results
      promises.forEach((promise, index) => {
        promise.resolve(results[index] || results[0]); // Fallback to first result
      });
    } catch (error) {
      // Reject all promises with the same error
      promises.forEach(promise => promise.reject(error instanceof Error ? error : new Error('Batch progress failed')));
    }
  }

  /**
   * Batch track progress directly via API call
   */
  private async batchTrackProgressDirect(events: ProgressEvent[]): Promise<UserProgress[]> {
    if (this.isDestroyed) {
      throw new Error('Service is destroyed');
    }

    const response = await fetch('/api/universal-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        events,
        batch: true
      })
    });

    if (!response.ok) {
      throw new Error(`Progress API error: ${response.status}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result : [result];
  }

  /**
   * Reset the batch timer with proper cleanup
   */
  private resetBatchTimer(): void {
    if (this.isDestroyed) return;

    // Clear existing timer
    if (this.batchTimer) {
      window.clearTimeout(this.batchTimer);
    }

    // Set new timer
    this.batchTimer = window.setTimeout(() => {
      if (!this.isDestroyed) {
        this.flushBatch();
      }
    }, this.batchDelayMs);
  }

  /**
   * Track video progress with batching optimization
   */
  async trackVideoProgress(
    userId: string,
    contentId: string,
    contextKey: string,
    watchTime: number,
    position: number,
    duration?: number
  ): Promise<UserProgress> {
    // ✅ FIX: Round floating-point video times to integers for database compatibility
    const watchTimeInt = Math.round(watchTime);
    const positionInt = Math.round(position);
    const durationInt = duration ? Math.round(duration) : undefined;

    // ✅ DEBUG: Log the conversion to verify rounding is working
    console.log('[BatchedProgressService] Rounding video values:', {
      original: { watchTime, position, duration },
      rounded: { watchTimeInt, positionInt, durationInt }
    });

    // ✅ CRITICAL FIX: Round progress percentage to integer for database compatibility
    const progressPercentage = durationInt ? Math.min(100, (positionInt / durationInt) * 100) : 0;
    const progressValue = Math.round(progressPercentage);

    const event: ProgressEvent = {
      userId,
      contentId,
      tenantKey: contextKey,
      progressType: 'video',
      value: progressValue,
      metadata: {
        watchTimeSeconds: watchTimeInt,
        lastPositionSeconds: positionInt,
        videoDurationSeconds: durationInt
      },
      timestamp: new Date().toISOString()
    };

    return this.addEvent(event);
  }

  /**
   * Track quiz completion
   */
  static async trackQuizCompletion(
    userId: string,
    contentId: string,
    contextKey: string,
    score: number,
    totalQuestions: number,
    answeredQuestions: number
  ): Promise<UserProgress> {
    const response = await fetch('/api/universal-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ Include cookies for authentication
      body: JSON.stringify({
        action: 'trackQuizCompletion',
        userId,
        contentId,
        contextKey,
        score,
        totalQuestions,
        answeredQuestions
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to track quiz completion: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Track reading progress
   */
  static async trackReadingProgress(
    userId: string,
    contentId: string,
    contextKey: string,
    scrollPosition: number,
    highlights?: number
  ): Promise<UserProgress> {
    const response = await fetch('/api/universal-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ Include cookies for authentication
      body: JSON.stringify({
        action: 'trackReadingProgress',
        userId,
        contentId,
        contextKey,
        scrollPosition,
        highlights
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to track reading progress: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Track custom progress event
   */
  static async trackProgressEvent(event: ProgressEvent): Promise<UserProgress> {
    const response = await fetch('/api/universal-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ Include cookies for authentication
      body: JSON.stringify({
        action: 'trackProgressEvent',
        event
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to track progress event: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get progress for a single content item
   */
  static async getProgress(
    userId: string,
    contentId: string,
    contextKey: string
  ): Promise<UserProgress | null> {
    const response = await fetch('/api/universal-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ Include cookies for authentication
      body: JSON.stringify({
        action: 'getProgress',
        userId,
        contentId,
        contextKey
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get progress: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get progress for multiple content items - returns a map
   */
  static async getProgressForContentIds(
    userId: string,
    contentIds: string[],
    contextKey: string
  ): Promise<Record<string, UserProgress>> {
    const response = await fetch('/api/universal-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ Include cookies for authentication
      body: JSON.stringify({
        action: 'getProgressForContentIds',
        userId,
        contentIds,
        contextKey
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get progress for content IDs: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get comprehensive progress summary for user dashboard
   */
  static async getProgressSummary(
    userId: string,
    contextKey: string
  ): Promise<ProgressSummary> {
    const response = await fetch('/api/universal-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ Include cookies for authentication
      body: JSON.stringify({
        action: 'getProgressSummary',
        userId,
        contextKey
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get progress summary: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get completion statistics for analytics
   */
  static async getCompletionStats(
    userId: string,
    contextKey: string
  ): Promise<CompletionStats> {
    const response = await fetch('/api/universal-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ Include cookies for authentication
      body: JSON.stringify({
        action: 'getCompletionStats',
        userId,
        contextKey
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get completion stats: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Check for milestone achievements
   */
  static async checkMilestones(
    userId: string,
    contextKey: string
  ): Promise<Milestone[]> {
    const response = await fetch('/api/universal-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ Include cookies for authentication
      body: JSON.stringify({
        action: 'checkMilestones',
        userId,
        contextKey
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to check milestones: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Batch track multiple progress events
   */
  static async batchTrackProgress(events: ProgressEvent[]): Promise<UserProgress[]> {
    const response = await fetch('/api/universal-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ Include cookies for authentication
      body: JSON.stringify({
        action: 'batchTrackProgress',
        events
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to batch track progress: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }
}

/**
 * Client-side service for user progress operations.
 * This service makes API calls to authenticated endpoints
 * and is safe to use in React components.
 */
export class ClientUserProgressService {

  /**
   * Track video progress - OPTIMIZED with batching
   */
  static async trackVideoProgress(
    userId: string,
    contentId: string,
    contextKey: string,
    watchTime: number,
    position: number,
    duration?: number
  ): Promise<UserProgress> {
    // Use batched service for video progress (most frequent calls)
    return BatchedProgressService.getInstance().trackVideoProgress(
      userId, contentId, contextKey, watchTime, position, duration
    );
  }

  // ... existing code ...
}

// Export types for components
export type {
  UserProgress,
  ProgressEvent,
  ProgressSummary,
  CompletionStats,
  Milestone
} from '../../../../packages/agent-core/tools/UserProgressTool';