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

/**
 * Client-side service for user progress operations.
 * This service makes API calls to authenticated endpoints
 * and is safe to use in React components.
 */
export class ClientUserProgressService {

  /**
   * Track video progress - most common use case
   */
  static async trackVideoProgress(
    userId: string,
    contentId: string,
    contextKey: string,
    watchTime: number,
    position: number,
    duration?: number
  ): Promise<UserProgress> {
    const response = await fetch('/api/universal-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'trackVideoProgress',
        userId,
        contentId,
        contextKey,
        watchTime,
        position,
        duration
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to track video progress: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
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

// Export types for components
export type {
  UserProgress,
  ProgressEvent,
  ProgressSummary,
  CompletionStats,
  Milestone
} from '../../../../packages/agent-core/tools/UserProgressTool';