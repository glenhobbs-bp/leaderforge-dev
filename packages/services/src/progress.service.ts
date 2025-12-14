/**
 * File: packages/services/src/progress.service.ts
 * Purpose: Progress tracking service
 * Owner: Core Team
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserProgress, ProgressMetadata } from '@leaderforge/database';
import type { ServiceResult, UserContext } from './types';

export interface UpdateProgressParams {
  contentId: string;
  progressPercentage: number;
  metadata?: Partial<ProgressMetadata>;
  notes?: string;
  bookmarked?: boolean;
}

export interface UpdateProgressResult {
  progress: UserProgress;
  streak: {
    current: number;
    isNewDay: boolean;
    milestone?: string;
  };
  pointsEarned: number;
}

export interface ProgressStats {
  totalItems: number;
  completed: number;
  inProgress: number;
  completionRate: number;
}

export class ProgressService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Update progress for content
   */
  async updateProgress(
    context: UserContext,
    params: UpdateProgressParams
  ): Promise<ServiceResult<UpdateProgressResult>> {
    const { contentId, progressPercentage, metadata, notes, bookmarked } = params;

    // Check if progress exists
    const { data: existing } = await this.supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', context.userId)
      .eq('content_id', contentId)
      .single();

    const isComplete = progressPercentage >= 100;
    const wasComplete = existing?.completed_at !== null;
    const isNewCompletion = isComplete && !wasComplete;

    // Upsert progress
    const progressData = {
      tenant_id: context.tenantId,
      user_id: context.userId,
      content_id: contentId,
      progress_type: 'video' as const, // Default, should be determined by content type
      progress_percentage: progressPercentage,
      completion_count: existing?.completion_count || 0 + (isNewCompletion ? 1 : 0),
      total_sessions: (existing?.total_sessions || 0) + 1,
      started_at: existing?.started_at || new Date().toISOString(),
      last_viewed_at: new Date().toISOString(),
      completed_at: isComplete ? (existing?.completed_at || new Date().toISOString()) : null,
      metadata: { ...existing?.metadata, ...metadata },
      notes: notes !== undefined ? notes : existing?.notes,
      bookmarked: bookmarked !== undefined ? bookmarked : existing?.bookmarked || false,
    };

    const { data: progress, error } = await this.supabase
      .from('user_progress')
      .upsert(
        existing
          ? { id: existing.id, ...progressData }
          : progressData,
        { onConflict: 'user_id,content_id' }
      )
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error.message,
        },
      };
    }

    // Update streak
    const streakResult = await this.updateStreak(context);
    
    // Calculate points
    let pointsEarned = 0;
    if (isNewCompletion) {
      pointsEarned = 100; // Base points for completion
      await this.awardPoints(context, pointsEarned, 'completion', contentId);
    }

    return {
      success: true,
      data: {
        progress: progress as UserProgress,
        streak: streakResult,
        pointsEarned,
      },
    };
  }

  /**
   * Get user progress stats
   */
  async getProgressStats(context: UserContext): Promise<ServiceResult<ProgressStats>> {
    const { data, error } = await this.supabase
      .from('user_progress')
      .select('progress_percentage, completed_at')
      .eq('user_id', context.userId)
      .eq('tenant_id', context.tenantId);

    if (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error.message,
        },
      };
    }

    const totalItems = data?.length || 0;
    const completed = data?.filter((p) => p.completed_at !== null).length || 0;
    const inProgress = data?.filter((p) => !p.completed_at && p.progress_percentage > 0).length || 0;

    return {
      success: true,
      data: {
        totalItems,
        completed,
        inProgress,
        completionRate: totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0,
      },
    };
  }

  /**
   * Update user streak (internal)
   */
  private async updateStreak(
    context: UserContext
  ): Promise<{ current: number; isNewDay: boolean; milestone?: string }> {
    // Call the database function
    const { data, error } = await this.supabase.rpc('update_streak', {
      p_user_id: context.userId,
      p_tenant_id: context.tenantId,
    });

    if (error) {
      console.error('Failed to update streak:', error);
      return { current: 0, isNewDay: false };
    }

    // Check for milestones
    const milestones = [7, 14, 30, 60, 90, 100, 365];
    const milestone = milestones.find((m) => data.current_streak === m);

    return {
      current: data.current_streak,
      isNewDay: data.is_new_day,
      milestone: milestone ? `${milestone}-day` : undefined,
    };
  }

  /**
   * Award points (internal)
   */
  private async awardPoints(
    context: UserContext,
    points: number,
    reason: string,
    sourceId?: string
  ): Promise<void> {
    await this.supabase.rpc('award_points', {
      p_user_id: context.userId,
      p_tenant_id: context.tenantId,
      p_points: points,
      p_reason: reason,
      p_source_type: 'content',
      p_source_id: sourceId,
    });
  }
}

