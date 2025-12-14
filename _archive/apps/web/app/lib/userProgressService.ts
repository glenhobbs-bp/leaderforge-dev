/**
 * User Progress Service - Web App Integration
 * Purpose: Integrate Universal Progress Tool with web application
 * Owner: Senior Engineering Team
 * Tags: progress-tracking, web-integration, agent-native
 */

import { createSupabaseServerClient } from './supabaseServerClient';
import { cookies } from 'next/headers';
import {
  UserProgressTool,
  SupabaseUserProgressRepository,
  UserProgress,
  ProgressEvent,
  ProgressSummary,
  CompletionStats,
  Milestone
} from '../../../../packages/agent-core/tools/UserProgressTool';

// Helper to get server-side Supabase client
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(cookieStore);
}

// Helper to get tool instance with proper client
async function getUserProgressTool() {
  const supabaseClient = await getSupabaseClient();
  const progressRepository = new SupabaseUserProgressRepository(supabaseClient);
  return new UserProgressTool(progressRepository);
}

/**
 * Web-facing service for user progress operations.
 * This provides a clean interface for React components to track progress.
 */
export class UserProgressService {

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
    const tool = await getUserProgressTool();
    return tool.trackVideoProgress(userId, contentId, contextKey, watchTime, position, duration);
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
    const tool = await getUserProgressTool();
    return tool.trackQuizCompletion(userId, contentId, contextKey, score, totalQuestions, answeredQuestions);
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
    const tool = await getUserProgressTool();
    return tool.trackReadingProgress(userId, contentId, contextKey, scrollPosition, highlights);
  }

  /**
   * Track custom progress event
   */
  static async trackProgressEvent(event: ProgressEvent): Promise<UserProgress> {
    const tool = await getUserProgressTool();
    return tool.trackProgressEvent(event);
  }

  /**
   * Get progress for a single content item
   */
  static async getProgress(
    userId: string,
    contentId: string,
    contextKey: string
  ): Promise<UserProgress | null> {
    const tool = await getUserProgressTool();
    return tool.getProgress(userId, contentId, contextKey);
  }

  /**
   * Get progress for multiple content items - returns a map
   */
  static async getProgressForContentIds(
    userId: string,
    contentIds: string[],
    contextKey: string
  ): Promise<Record<string, UserProgress>> {
    const tool = await getUserProgressTool();
    return tool.listProgressForContentIds(userId, contentIds, contextKey);
  }

  /**
   * Get comprehensive progress summary for user dashboard
   */
  static async getProgressSummary(
    userId: string,
    contextKey: string
  ): Promise<ProgressSummary> {
    const tool = await getUserProgressTool();
    return tool.getProgressSummary(userId, contextKey);
  }

  /**
   * Get completion statistics for analytics
   */
  static async getCompletionStats(
    userId: string,
    contextKey: string
  ): Promise<CompletionStats> {
    const tool = await getUserProgressTool();
    return tool.getCompletionStats(userId, contextKey);
  }

  /**
   * Check for milestone achievements
   */
  static async checkMilestones(
    userId: string,
    contextKey: string
  ): Promise<Milestone[]> {
    const tool = await getUserProgressTool();
    return tool.checkMilestones(userId, contextKey);
  }

  /**
   * Batch operations for performance
   */
  static async batchGetProgress(
    queries: Array<{ userId: string; contentId: string; contextKey: string }>
  ): Promise<UserProgress[]> {
    const tool = await getUserProgressTool();
    return tool.batchGetProgress(queries);
  }

  /**
   * Batch track multiple progress events
   */
  static async batchTrackProgress(events: ProgressEvent[]): Promise<UserProgress[]> {
    const tool = await getUserProgressTool();
    return tool.batchTrackProgress(events);
  }

  /**
   * Legacy method - update progress (backward compatible)
   */
  static async updateProgress(
    userId: string,
    contentId: string,
    contextKey: string,
    progress: Partial<UserProgress>
  ): Promise<UserProgress> {
    const tool = await getUserProgressTool();
    return tool.setProgress(userId, contentId, contextKey, progress);
  }
}

// Export a function to get the tool instance for agent use
export { getUserProgressTool as userProgressTool };

// Export types for components
export type {
  UserProgress,
  ProgressEvent,
  ProgressSummary,
  CompletionStats,
  Milestone
} from '../../../../packages/agent-core/tools/UserProgressTool';