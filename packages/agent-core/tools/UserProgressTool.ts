/**
 * Agent-native, production-ready user progress tool for modular agent orchestration.
 * Enhanced for universal content type support while maintaining backward compatibility.
 */

// Enhanced universal progress interface
export interface UserProgress {
  id: string;
  user_id: string;
  content_id: string;
  context_key: string;
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
  contextKey: string;
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
  contextKey: string;
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
  contextKey: string;
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
  getProgress(userId: string, contentId: string, contextKey: string): Promise<UserProgress | null>;
  listProgressForContentIds(userId: string, contentIds: string[], contextKey: string): Promise<UserProgress[]>;
  setProgress(userId: string, contentId: string, contextKey: string, progress: Partial<UserProgress>): Promise<UserProgress>;

  // Enhanced universal operations
  trackProgressEvent(event: ProgressEvent): Promise<UserProgress>;
  getProgressSummary(userId: string, contextKey: string): Promise<ProgressSummary>;
  getCompletionStats(userId: string, contextKey: string): Promise<CompletionStats>;
  checkMilestones(userId: string, contextKey: string): Promise<Milestone[]>;

  // Batch operations for performance
  batchGetProgress(queries: Array<{ userId: string; contentId: string; contextKey: string }>): Promise<UserProgress[]>;
  batchTrackProgress(events: ProgressEvent[]): Promise<UserProgress[]>;
}

// Import will be provided via dependency injection
// import { supabase } from '../../../../apps/web/app/lib/supabaseClient';

/**
 * Supabase-backed implementation of UserProgressRepository.
 */
export class SupabaseUserProgressRepository implements UserProgressRepository {
  constructor(private supabase: any) {}
  /**
   * Fetch progress for a single user/content/context.
   */
  async getProgress(userId: string, contentId: string, contextKey: string): Promise<UserProgress | null> {
    const { data, error } = await this.supabase
      .schema('core')
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('context_key', contextKey)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Transform and add backward compatibility fields
    return this.transformProgress(data);
  }

  /**
   * Fetch progress for a batch of content IDs for a user/context.
   */
  async listProgressForContentIds(userId: string, contentIds: string[], contextKey: string): Promise<UserProgress[]> {
    if (!contentIds.length) return [];
    const { data, error } = await this.supabase
      .schema('core')
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('context_key', contextKey)
      .in('content_id', contentIds);
    if (error) throw error;

    return (data || []).map(item => this.transformProgress(item));
  }

  /**
   * Upsert (set) progress for a user/content/context.
   */
  async setProgress(userId: string, contentId: string, contextKey: string, progress: Partial<UserProgress>): Promise<UserProgress> {
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
          context_key: contextKey,
          progress_type: progress.progress_type || 'video',
          metadata,
          ...progress
        }
      ], { onConflict: 'user_id,content_id,context_key' })
      .select()
      .single();
    if (error) throw error;
    return this.transformProgress(data);
  }

  /**
   * Track a progress event and update progress accordingly.
   */
  async trackProgressEvent(event: ProgressEvent): Promise<UserProgress> {
    const existingProgress = await this.getProgress(event.userId, event.contentId, event.contextKey);

    // Update progress based on event
    const updatedProgress: Partial<UserProgress> = {
      progress_type: event.progressType,
      progress_percentage: event.value,
      metadata: { ...existingProgress?.metadata, ...event.metadata },
      total_sessions: (existingProgress?.total_sessions || 0) + 1
    };

    // Mark as completed if 100%
    if (event.value >= 100) {
      updatedProgress.completed_at = event.timestamp || new Date().toISOString();
      updatedProgress.completion_count = (existingProgress?.completion_count || 0) + 1;
    }

    return this.setProgress(event.userId, event.contentId, event.contextKey, updatedProgress);
  }

  /**
   * Get progress summary for a user in a context.
   */
  async getProgressSummary(userId: string, contextKey: string): Promise<ProgressSummary> {
    const { data, error } = await this.supabase
      .schema('core')
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('context_key', contextKey);

    if (error) throw error;

    const items = (data || []) as Array<Record<string, unknown>>;
    const completed = items.filter((item: Record<string, unknown>) => item.completed_at).length;
    const inProgress = items.filter((item: Record<string, unknown>) => !item.completed_at && (item.progress_percentage as number) > 0).length;

    // Group by progress type
    const progressByType: Record<string, { completed: number; total: number; percentage: number }> = {};
    const typeGroups = items.reduce((acc: Record<string, Array<Record<string, unknown>>>, item: Record<string, unknown>) => {
      const type = (item.progress_type as string) || 'video';
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {} as Record<string, Array<Record<string, unknown>>>);

        Object.entries(typeGroups).forEach(([type, typeItems]) => {
      const typeCompleted = typeItems.filter((item: Record<string, unknown>) => item.completed_at).length;
      progressByType[type] = {
        completed: typeCompleted,
        total: typeItems.length,
        percentage: typeItems.length > 0 ? Math.round((typeCompleted / typeItems.length) * 100) : 0
      };
    });

    return {
      userId,
      contextKey,
      totalItems: items.length,
      completedItems: completed,
      inProgressItems: inProgress,
      completionPercentage: items.length > 0 ? Math.round((completed / items.length) * 100) : 0,
      totalSessionTime: items.reduce((sum: number, item: Record<string, unknown>) => {
        const metadata = item.metadata as Record<string, unknown> || {};
        return sum + ((metadata.watchTimeSeconds as number) || 0);
      }, 0),
      lastActivity: items.reduce((latest: string, item: Record<string, unknown>) =>
        (item.last_viewed_at as string) > latest ? (item.last_viewed_at as string) : latest, ''),
      progressByType
    };
  }

  /**
   * Get completion statistics for analytics.
   */
  async getCompletionStats(userId: string, contextKey: string): Promise<CompletionStats> {
    // This would typically involve more complex analytics queries
    // For now, return basic stats from progress summary
    const summary = await this.getProgressSummary(userId, contextKey);

    return {
      userId,
      contextKey,
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
  async checkMilestones(_userId: string, _contextKey: string): Promise<Milestone[]> {
    // This would implement milestone detection logic
    // For now, return empty array - to be implemented based on business rules
    return [];
  }

  /**
   * Batch get progress for multiple queries.
   */
  async batchGetProgress(queries: Array<{ userId: string; contentId: string; contextKey: string }>): Promise<UserProgress[]> {
    if (!queries.length) return [];

    // Build complex query for batch retrieval
    // For simplicity, execute individual queries in parallel
    const results = await Promise.all(
      queries.map(query => this.getProgress(query.userId, query.contentId, query.contextKey))
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
      context_key: record.context_key as string,
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
  async getProgress(userId: string, contentId: string, contextKey: string): Promise<UserProgress | null> {
    return this.repo.getProgress(userId, contentId, contextKey);
  }

  /**
   * Get progress for a batch of content IDs. Returns a map keyed by content_id. (Backward compatible)
   */
  async listProgressForContentIds(userId: string, contentIds: string[], contextKey: string): Promise<Record<string, UserProgress>> {
    const results = await this.repo.listProgressForContentIds(userId, contentIds, contextKey);
    const map: Record<string, UserProgress> = {};
    for (const progress of results) {
      map[progress.content_id] = progress;
    }
    return map;
  }

  /**
   * Set (upsert) progress for a user/content/context. (Backward compatible)
   */
  async setProgress(userId: string, contentId: string, contextKey: string, progress: Partial<UserProgress>): Promise<UserProgress> {
    return this.repo.setProgress(userId, contentId, contextKey, progress);
  }

  /**
   * Track a progress event - universal method for all content types.
   */
  async trackProgressEvent(event: ProgressEvent): Promise<UserProgress> {
    return this.repo.trackProgressEvent(event);
  }

  /**
   * Get comprehensive progress summary for agent decision making.
   */
  async getProgressSummary(userId: string, contextKey: string): Promise<ProgressSummary> {
    return this.repo.getProgressSummary(userId, contextKey);
  }

  /**
   * Get completion statistics for analytics and insights.
   */
  async getCompletionStats(userId: string, contextKey: string): Promise<CompletionStats> {
    return this.repo.getCompletionStats(userId, contextKey);
  }

  /**
   * Check for milestone achievements based on progress.
   */
  async checkMilestones(userId: string, contextKey: string): Promise<Milestone[]> {
    return this.repo.checkMilestones(userId, contextKey);
  }

  /**
   * Batch operations for performance optimization.
   */
  async batchGetProgress(queries: Array<{ userId: string; contentId: string; contextKey: string }>): Promise<UserProgress[]> {
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
  async trackVideoProgress(userId: string, contentId: string, contextKey: string, watchTime: number, position: number, duration?: number): Promise<UserProgress> {
    return this.trackProgressEvent({
      userId,
      contentId,
      contextKey,
      progressType: 'video',
      value: duration ? Math.round((watchTime / duration) * 100) : 0,
      metadata: {
        watchTimeSeconds: watchTime,
        lastPositionSeconds: position,
        videoDurationSeconds: duration
      }
    });
  }

  /**
   * Quick helper for quiz completion.
   */
  async trackQuizCompletion(userId: string, contentId: string, contextKey: string, score: number, totalQuestions: number, answeredQuestions: number): Promise<UserProgress> {
    return this.trackProgressEvent({
      userId,
      contentId,
      contextKey,
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
  async trackReadingProgress(userId: string, contentId: string, contextKey: string, scrollPosition: number, highlights?: number): Promise<UserProgress> {
    return this.trackProgressEvent({
      userId,
      contentId,
      contextKey,
      progressType: 'reading',
      value: Math.round(scrollPosition * 100),
      metadata: {
        scrollPosition,
        highlightCount: highlights || 0
      }
    });
  }
}