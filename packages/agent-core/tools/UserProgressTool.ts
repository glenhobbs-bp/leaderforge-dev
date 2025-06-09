/**
 * Agent-native, production-ready user progress tool for modular agent orchestration.
 */

export interface UserProgress {
  user_id: string;
  content_id: string;
  context_key: string;
  progress_percentage: number;
  watch_time_seconds: number;
  last_position_seconds: number;
  completed_at?: string;
}

/**
 * Repository interface for fetching and updating user progress.
 */
export interface UserProgressRepository {
  getProgress(userId: string, contentId: string, contextKey: string): Promise<UserProgress | null>;
  listProgressForContentIds(userId: string, contentIds: string[], contextKey: string): Promise<UserProgress[]>;
  setProgress(userId: string, contentId: string, contextKey: string, progress: Partial<UserProgress>): Promise<UserProgress>;
}

import { supabase } from '../../../apps/web/app/lib/supabaseClient';

/**
 * Supabase-backed implementation of UserProgressRepository.
 */
export class SupabaseUserProgressRepository implements UserProgressRepository {
  /**
   * Fetch progress for a single user/content/context.
   */
  async getProgress(userId: string, contentId: string, contextKey: string): Promise<UserProgress | null> {
    const { data, error } = await supabase
      .schema('modules')
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('context_key', contextKey)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  /**
   * Fetch progress for a batch of content IDs for a user/context.
   */
  async listProgressForContentIds(userId: string, contentIds: string[], contextKey: string): Promise<UserProgress[]> {
    if (!contentIds.length) return [];
    const { data, error } = await supabase
      .schema('modules')
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('context_key', contextKey)
      .in('content_id', contentIds);
    if (error) throw error;
    return data || [];
  }

  /**
   * Upsert (set) progress for a user/content/context.
   */
  async setProgress(userId: string, contentId: string, contextKey: string, progress: Partial<UserProgress>): Promise<UserProgress> {
    const { data, error } = await supabase
      .schema('modules')
      .from('user_progress')
      .upsert([
        { user_id: userId, content_id: contentId, context_key: contextKey, ...progress }
      ], { onConflict: 'user_id,content_id,context_key' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

/**
 * Agent-facing tool for user progress. Use in agent orchestration.
 */
export class UserProgressTool {
  constructor(private repo: UserProgressRepository) {}

  /**
   * Get progress for a single content item.
   */
  async getProgress(userId: string, contentId: string, contextKey: string): Promise<UserProgress | null> {
    return this.repo.getProgress(userId, contentId, contextKey);
  }

  /**
   * Get progress for a batch of content IDs. Returns a map keyed by content_id.
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
   * Set (upsert) progress for a user/content/context.
   */
  async setProgress(userId: string, contentId: string, contextKey: string, progress: Partial<UserProgress>): Promise<UserProgress> {
    return this.repo.setProgress(userId, contentId, contextKey, progress);
  }
}