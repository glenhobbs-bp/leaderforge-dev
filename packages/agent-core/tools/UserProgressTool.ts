/**
 * Agent-native, production-ready user progress tool for modular agent orchestration.
 * Enhanced for universal content type support while maintaining backward compatibility.
 */

// Enhanced universal progress interface
export interface UserProgress {
  id: string;
  user_id: string;
  content_id: string;
  tenant_key: string;
  progress_type: 'video' | 'quiz' | 'reading' | 'worksheet' | 'course' | 'custom';
  progress_percentage: number;
  completion_count: number;
  total_sessions: number;
  started_at: string;
  last_viewed_at: string;
  completed_at?: string;
  notes?: string;
  metadata: Record<string, unknown>; // Type-specific data
  sync_status: 'synced' | 'pending' | 'conflict';
  last_synced_at: string;

  // Backward compatibility - computed from metadata
  watch_time_seconds?: number;
  last_position_seconds?: number;
}

// Progress event for tracking user interactions
export interface ProgressEvent {
  userId: string;
  contentId: string;
  tenantKey: string;
  progressType: 'video' | 'quiz' | 'reading' | 'worksheet' | 'course' | 'custom';
  value: number; // 0-100 percentage or custom metric
  metadata?: {
    // Video-specific
    watchTimeSeconds?: number;
    lastPositionSeconds?: number;
    videoDurationSeconds?: number;

    // Quiz-specific
    questionsAnswered?: number;
    totalQuestions?: number;
    score?: number;

    // Reading-specific
    scrollPosition?: number;
    highlightCount?: number;

    // Custom component data
    [key: string]: unknown;
  };
  timestamp?: string;
}

// Progress summary for agent queries
export interface ProgressSummary {
  userId: string;
  tenantKey: string;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  completionPercentage: number;
  totalSessionTime: number;
  lastActivity: string;
  progressByType: Record<string, { completed: number; total: number; percentage: number }>;
}

// Completion statistics for analytics
export interface CompletionStats {
  userId: string;
  tenantKey: string;
  completionsByType: Record<string, number>;
  averageSessionTime: number;
  streakDays: number;
  milestones: Milestone[];
}

// Milestone achievements
export interface Milestone {
  id: string;
  name: string;
  description: string;
  achievedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Enhanced repository interface for universal progress tracking.
 */
export interface UserProgressRepository {
  // Core progress operations (backward compatible)
  getProgress(userId: string, contentId: string, tenantKey: string): Promise<UserProgress | null>;
  listProgressForContentIds(userId: string, contentIds: string[], tenantKey: string): Promise<UserProgress[]>;
  setProgress(userId: string, contentId: string, tenantKey: string, progress: Partial<UserProgress>): Promise<UserProgress>;

  // Enhanced universal operations
  trackProgressEvent(event: ProgressEvent): Promise<UserProgress>;
  getProgressSummary(userId: string, tenantKey: string): Promise<ProgressSummary>;
  getCompletionStats(userId: string, tenantKey: string): Promise<CompletionStats>;
  checkMilestones(userId: string, tenantKey: string): Promise<Milestone[]>;

  // Batch operations for performance
  batchGetProgress(queries: Array<{ userId: string; contentId: string; tenantKey: string }>): Promise<UserProgress[]>;
  batchTrackProgress(events: ProgressEvent[]): Promise<UserProgress[]>;
}

// Import will be provided via dependency injection
// import { supabase } from '../../../../apps/web/app/lib/supabaseClient';

/**
 * Supabase-backed implementation of UserProgressRepository.
 */
export class SupabaseUserProgressRepository implements UserProgressRepository {
  constructor(private supabase: {
    schema: (name: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
    auth: { uid: () => string | undefined };
  }) {}
  /**
   * Fetch progress for a single user/content/context.
   */
  async getProgress(userId: string, contentId: string, tenantKey: string): Promise<UserProgress | null> {
    const { data, error } = await this.supabase
      .schema('core')
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('tenant_key', tenantKey)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Transform and add backward compatibility fields
    return this.transformProgress(data);
  }

  /**
   * Fetch progress for a batch of content IDs for a user/context.
   */
  async listProgressForContentIds(userId: string, contentIds: string[], tenantKey: string): Promise<UserProgress[]> {
    if (!contentIds.length) return [];

    try {
      // Try batch query first
      const { data, error } = await this.supabase
        .schema('core')
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_key', tenantKey)
        .in('content_id', contentIds);

      if (error) {
        console.warn('[UserProgressTool] Batch query failed, falling back to individual queries:', error);
        // Fallback to individual queries
        return this.listProgressForContentIdsIndividual(userId, contentIds, tenantKey);
      }

      return (data || []).map(item => this.transformProgress(item));
    } catch (error) {
      console.warn('[UserProgressTool] Batch query exception, falling back to individual queries:', error);
      // Fallback to individual queries
      return this.listProgressForContentIdsIndividual(userId, contentIds, tenantKey);
    }
  }

  /**
   * Fallback method: Fetch progress using individual queries (for RLS compatibility)
   */
  private async listProgressForContentIdsIndividual(userId: string, contentIds: string[], tenantKey: string): Promise<UserProgress[]> {
    // Execute individual queries in parallel
    const promises = contentIds.map(async (contentId) => {
      try {
        const progress = await this.getProgress(userId, contentId, tenantKey);
        return progress;
      } catch (error) {
        console.warn(`[UserProgressTool] Failed to fetch progress for ${contentId}:`, error);
        return null;
      }
    });

    const progressResults = await Promise.all(promises);

    // Filter out nulls and return valid progress records
    return progressResults.filter((result): result is UserProgress => result !== null);
  }

  /**
   * Upsert (set) progress for a user/content/context.
   */
  async setProgress(userId: string, contentId: string, tenantKey: string, progress: Partial<UserProgress>): Promise<UserProgress> {
    // Prepare metadata from backward compatibility fields
    const metadata = { ...progress.metadata };
    if (progress.watch_time_seconds !== undefined) {
      metadata.watchTimeSeconds = progress.watch_time_seconds;
    }
    if (progress.last_position_seconds !== undefined) {
      metadata.lastPositionSeconds = progress.last_position_seconds;
    }

    const { data, error } = await this.supabase
      .schema('core')
      .from('user_progress')
      .upsert([
        {
          user_id: userId,
          content_id: contentId,
          tenant_key: tenantKey,
          progress_percentage: progress.progress_percentage || 0,
          metadata,
        },
      ], {
        onConflict: 'user_id,content_id,tenant_key',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;

    return this.transformProgress(data);
  }

  /**
   * Track a progress event and update progress accordingly.
   */
  async trackProgressEvent(event: ProgressEvent): Promise<UserProgress> {
    const existingProgress = await this.getProgress(event.userId, event.contentId, event.tenantKey);

    // Determine if this is a new session
    const isNewSession = this.isNewSession(existingProgress, event);

    // Determine if this is a completion transition (incomplete -> complete)
    const isCompletionTransition = this.isCompletionTransition(existingProgress, event);

    // ✅ CRITICAL FIX: Round decimal values for video progress events to prevent database errors
    let processedMetadata = { ...event.metadata };
    if (event.progressType === 'video' && event.metadata) {
      processedMetadata = {
        ...event.metadata,
        watchTimeSeconds: event.metadata.watchTimeSeconds ? Math.round(Number(event.metadata.watchTimeSeconds)) : event.metadata.watchTimeSeconds,
        lastPositionSeconds: event.metadata.lastPositionSeconds ? Math.round(Number(event.metadata.lastPositionSeconds)) : event.metadata.lastPositionSeconds,
        videoDurationSeconds: event.metadata.videoDurationSeconds ? Math.round(Number(event.metadata.videoDurationSeconds)) : event.metadata.videoDurationSeconds,
      };
    }

    // Update progress based on event
    const updatedProgress: Partial<UserProgress> = {
      progress_type: event.progressType,
      progress_percentage: event.value,
      metadata: { ...existingProgress?.metadata, ...processedMetadata },
      last_viewed_at: event.timestamp || new Date().toISOString()
    };

    // Only increment total_sessions for new sessions
    if (isNewSession) {
      updatedProgress.total_sessions = (existingProgress?.total_sessions || 0) + 1;
    }

    // Mark as completed and increment completion_count only on transition to complete
    if (event.value >= 100) {
      updatedProgress.completed_at = event.timestamp || new Date().toISOString();

      // Only increment completion_count if transitioning from incomplete to complete
      if (isCompletionTransition) {
        updatedProgress.completion_count = (existingProgress?.completion_count || 0) + 1;
      }
    }

    return this.setProgress(event.userId, event.contentId, event.tenantKey, updatedProgress);
  }

  /**
   * Determine if this event represents a new session.
   * A new session is when:
   * - No existing progress (first time)
   * - Last viewed was more than 30 minutes ago
   * - Progress went from 0 to > 0 (restarting content)
   */
  private isNewSession(existingProgress: UserProgress | null, event: ProgressEvent): boolean {
    // First time watching
    if (!existingProgress) {
      return true;
    }

    // Check if enough time has passed since last view (30 minutes = session timeout)
    const lastViewedAt = new Date(existingProgress.last_viewed_at);
    const now = new Date(event.timestamp || new Date().toISOString());
    const timeDifferenceMinutes = (now.getTime() - lastViewedAt.getTime()) / (1000 * 60);

    if (timeDifferenceMinutes > 30) {
      return true;
    }

    // Check if restarting content (progress was 0 and now > 0)
    if (existingProgress.progress_percentage === 0 && event.value > 0) {
      return true;
    }

    return false;
  }

  /**
   * Determine if this event represents a completion transition.
   * Only count as completion if going from incomplete to complete state.
   */
  private isCompletionTransition(existingProgress: UserProgress | null, event: ProgressEvent): boolean {
    // If no existing progress and reaching 100%, this is a completion
    if (!existingProgress && event.value >= 100) {
      return true;
    }

    // If existing progress was incomplete and now reaching 100%, this is a completion
    if (existingProgress &&
        existingProgress.progress_percentage < 100 &&
        event.value >= 100) {
      return true;
    }

    return false;
  }

  /**
   * Get progress summary for a user in a context.
   */
  async getProgressSummary(userId: string, tenantKey: string): Promise<ProgressSummary> {
    const { data, error } = await this.supabase
      .schema('core')
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_key', tenantKey);

    if (error) throw error;

    const progressRecords = (data || []).map(item => this.transformProgress(item));

    return {
      userId,
      tenantKey,
      totalItems: progressRecords.length,
      completedItems: progressRecords.filter(item => !!item.completed_at).length,
      inProgressItems: progressRecords.filter(item => item.progress_percentage > 0 && !item.completed_at).length,
      completionPercentage: progressRecords.length > 0
        ? (progressRecords.filter(item => !!item.completed_at).length / progressRecords.length) * 100
        : 0,
      totalSessionTime: progressRecords.reduce((sum, item) => sum + (item.total_sessions || 0), 0),
      lastActivity: progressRecords.reduce((latest, item) => {
        const itemDate = item.last_viewed_at || item.started_at;
        return itemDate > latest ? itemDate : latest;
      }, ''),
      progressByType: {} // Simplified for now - would need proper grouping
    };
  }

  /**
   * Get completion statistics for analytics.
   */
  async getCompletionStats(userId: string, tenantKey: string): Promise<CompletionStats> {
    // This would typically involve more complex analytics queries
    // For now, return basic stats from progress summary
    const summary = await this.getProgressSummary(userId, tenantKey);

    return {
      userId,
      tenantKey,
      completionsByType: Object.fromEntries(
        Object.entries(summary.progressByType).map(([type, stats]) => [type, stats.completed])
      ),
      averageSessionTime: summary.totalSessionTime / (summary.totalItems || 1),
      streakDays: 0, // Would require date-based analysis
      milestones: [] // Would be calculated based on achievements
    };
  }

  /**
   * Check for milestone achievements.
   */
  async checkMilestones(userId: string, tenantKey: string): Promise<Milestone[]> {
    // This would implement milestone detection logic
    // For now, return empty array - to be implemented based on business rules
    console.log('Checking milestones for user:', userId, 'tenant:', tenantKey);
    return [];
  }

  /**
   * Batch get progress for multiple queries.
   */
  async batchGetProgress(queries: Array<{ userId: string; contentId: string; tenantKey: string }>): Promise<UserProgress[]> {
    if (!queries.length) return [];

    // Build complex query for batch retrieval
    // For simplicity, execute individual queries in parallel
    const results = await Promise.all(
      queries.map(query => this.getProgress(query.userId, query.contentId, query.tenantKey))
    );

    return results.filter((result): result is UserProgress => result !== null);
  }

  /**
   * Batch track multiple progress events.
   */
  async batchTrackProgress(events: ProgressEvent[]): Promise<UserProgress[]> {
    if (!events.length) return [];

    // Execute events in parallel
    const results = await Promise.all(
      events.map(event => this.trackProgressEvent(event))
    );

    return results;
  }

  /**
   * Transform database record to UserProgress with backward compatibility.
   */
  private transformProgress(data: unknown): UserProgress | null {
    if (!data) return null;

    const record = data as Record<string, unknown>;
    const metadata = (record.metadata as Record<string, unknown>) || {};

    return {
      id: record.id as string,
      user_id: record.user_id as string,
      content_id: record.content_id as string,
      tenant_key: record.tenant_key as string,
      progress_type: (record.progress_type as UserProgress['progress_type']) || 'video',
      progress_percentage: (record.progress_percentage as number) || 0,
      completion_count: (record.completion_count as number) || 0,
      total_sessions: (record.total_sessions as number) || 0,
      started_at: record.started_at as string,
      last_viewed_at: record.last_viewed_at as string,
      completed_at: record.completed_at as string | undefined,
      notes: record.notes as string | undefined,
      metadata,
      sync_status: (record.sync_status as UserProgress['sync_status']) || 'synced',
      last_synced_at: record.last_synced_at as string,

      // Backward compatibility
      watch_time_seconds: metadata.watchTimeSeconds as number | undefined,
      last_position_seconds: metadata.lastPositionSeconds as number | undefined
    };
  }
}

/**
 * Enhanced agent-facing tool for universal progress tracking.
 * Provides backward compatibility while enabling new universal capabilities.
 */
export class UserProgressTool {
  constructor(private repo: UserProgressRepository) {}

  /**
   * Get progress for a single content item. (Backward compatible)
   */
  async getProgress(userId: string, contentId: string, tenantKey: string): Promise<UserProgress | null> {
    return this.repo.getProgress(userId, contentId, tenantKey);
  }

  /**
   * Get progress for a batch of content IDs. Returns a map keyed by content_id. (Backward compatible)
   */
  async listProgressForContentIds(userId: string, contentIds: string[], tenantKey: string): Promise<Record<string, UserProgress>> {
    const results = await this.repo.listProgressForContentIds(userId, contentIds, tenantKey);
    const map: Record<string, UserProgress> = {};
    for (const progress of results) {
      map[progress.content_id] = progress;
    }
    return map;
  }

  /**
   * Set (upsert) progress for a user/content/context. (Backward compatible)
   */
  async setProgress(userId: string, contentId: string, tenantKey: string, progress: Partial<UserProgress>): Promise<UserProgress> {
    return this.repo.setProgress(userId, contentId, tenantKey, progress);
  }

  /**
   * Track a progress event - universal method for all content types.
   */
  async trackProgressEvent(event: ProgressEvent): Promise<UserProgress> {
    const existingProgress = await this.getProgress(event.userId, event.contentId, event.tenantKey);

    // Determine if this is a new session
    const isNewSession = this.isNewSession(existingProgress, event);

    // Determine if this is a completion transition (incomplete -> complete)
    const isCompletionTransition = this.isCompletionTransition(existingProgress, event);

    // ✅ CRITICAL FIX: Round decimal values for video progress events to prevent database errors
    let processedMetadata = { ...event.metadata };
    if (event.progressType === 'video' && event.metadata) {
      processedMetadata = {
        ...event.metadata,
        watchTimeSeconds: event.metadata.watchTimeSeconds ? Math.round(Number(event.metadata.watchTimeSeconds)) : event.metadata.watchTimeSeconds,
        lastPositionSeconds: event.metadata.lastPositionSeconds ? Math.round(Number(event.metadata.lastPositionSeconds)) : event.metadata.lastPositionSeconds,
        videoDurationSeconds: event.metadata.videoDurationSeconds ? Math.round(Number(event.metadata.videoDurationSeconds)) : event.metadata.videoDurationSeconds,
      };
    }

    // Update progress based on event
    const updatedProgress: Partial<UserProgress> = {
      progress_type: event.progressType,
      progress_percentage: event.value,
      metadata: { ...existingProgress?.metadata, ...processedMetadata },
      last_viewed_at: event.timestamp || new Date().toISOString()
    };

    // Only increment total_sessions for new sessions
    if (isNewSession) {
      updatedProgress.total_sessions = (existingProgress?.total_sessions || 0) + 1;
    }

    // Mark as completed and increment completion_count only on transition to complete
    if (event.value >= 100) {
      updatedProgress.completed_at = event.timestamp || new Date().toISOString();

      // Only increment completion_count if transitioning from incomplete to complete
      if (isCompletionTransition) {
        updatedProgress.completion_count = (existingProgress?.completion_count || 0) + 1;
      }
    }

    return this.setProgress(event.userId, event.contentId, event.tenantKey, updatedProgress);
  }

  /**
   * Get comprehensive progress summary for agent decision making.
   */
  async getProgressSummary(userId: string, tenantKey: string): Promise<ProgressSummary> {
    return this.repo.getProgressSummary(userId, tenantKey);
  }

  /**
   * Get completion statistics for analytics and insights.
   */
  async getCompletionStats(userId: string, tenantKey: string): Promise<CompletionStats> {
    return this.repo.getCompletionStats(userId, tenantKey);
  }

  /**
   * Check for milestone achievements based on progress.
   */
  async checkMilestones(userId: string, tenantKey: string): Promise<Milestone[]> {
    return this.repo.checkMilestones(userId, tenantKey);
  }

  /**
   * Batch operations for performance optimization.
   */
  async batchGetProgress(queries: Array<{ userId: string; contentId: string; tenantKey: string }>): Promise<UserProgress[]> {
    return this.repo.batchGetProgress(queries);
  }

  /**
   * Batch track multiple progress events efficiently.
   */
  async batchTrackProgress(events: ProgressEvent[]): Promise<UserProgress[]> {
    return this.repo.batchTrackProgress(events);
  }

  /**
   * Quick helper for video progress (backward compatibility).
   */
  async trackVideoProgress(userId: string, contentId: string, tenantKey: string, watchTime: number, position: number, duration?: number): Promise<UserProgress> {
    // ✅ CRITICAL FIX: Round decimal video times to integers for database compatibility
    const watchTimeInt = Math.round(watchTime);
    const positionInt = Math.round(position);
    const durationInt = duration ? Math.round(duration) : undefined;

    return this.trackProgressEvent({
      userId,
      contentId,
      tenantKey,
      progressType: 'video',
      value: durationInt ? Math.round((positionInt / durationInt) * 100) : 0,
      metadata: {
        watchTimeSeconds: watchTimeInt,
        lastPositionSeconds: positionInt,
        videoDurationSeconds: durationInt
      }
    });
  }

  /**
   * Quick helper for quiz completion.
   */
  async trackQuizCompletion(userId: string, contentId: string, tenantKey: string, score: number, totalQuestions: number, answeredQuestions: number): Promise<UserProgress> {
    return this.trackProgressEvent({
      userId,
      contentId,
      tenantKey,
      progressType: 'quiz',
      value: Math.round((answeredQuestions / totalQuestions) * 100),
      metadata: {
        score,
        totalQuestions,
        questionsAnswered: answeredQuestions
      }
    });
  }

  /**
   * Quick helper for reading progress.
   */
  async trackReadingProgress(userId: string, contentId: string, tenantKey: string, scrollPosition: number, highlights?: number): Promise<UserProgress> {
    return this.trackProgressEvent({
      userId,
      contentId,
      tenantKey,
      progressType: 'reading',
      value: Math.round(scrollPosition * 100),
      metadata: {
        scrollPosition,
        highlightCount: highlights || 0
      }
    });
  }

  /**
   * Determine if this event represents a new session.
   * A new session is when:
   * - No existing progress (first time)
   * - Last viewed was more than 30 minutes ago
   * - Progress went from 0 to > 0 (restarting content)
   */
  private isNewSession(existingProgress: UserProgress | null, event: ProgressEvent): boolean {
    // First time watching
    if (!existingProgress) {
      return true;
    }

    // Check if enough time has passed since last view (30 minutes = session timeout)
    const lastViewedAt = new Date(existingProgress.last_viewed_at);
    const now = new Date(event.timestamp || new Date().toISOString());
    const timeDifferenceMinutes = (now.getTime() - lastViewedAt.getTime()) / (1000 * 60);

    if (timeDifferenceMinutes > 30) {
      return true;
    }

    // Check if restarting content (progress was 0 and now > 0)
    if (existingProgress.progress_percentage === 0 && event.value > 0) {
      return true;
    }

    return false;
  }

  /**
   * Determine if this event represents a completion transition.
   * Only count as completion if going from incomplete to complete state.
   */
  private isCompletionTransition(existingProgress: UserProgress | null, event: ProgressEvent): boolean {
    // If no existing progress and reaching 100%, this is a completion
    if (!existingProgress && event.value >= 100) {
      return true;
    }

    // If existing progress was incomplete and now reaching 100%, this is a completion
    if (existingProgress &&
        existingProgress.progress_percentage < 100 &&
        event.value >= 100) {
      return true;
    }

    return false;
  }
}