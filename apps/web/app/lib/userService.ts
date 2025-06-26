// File: apps/web/app/lib/userService.ts
// Purpose: User service layer with optimized database operations and caching
// Owner: Backend team
// Tags: service layer, user management, Supabase, performance optimization

import { createSupabaseServerClient } from './supabaseServerClient';
import { cookies } from 'next/headers';
import type { User, VideoProgress } from './types';

/**
 * Create authenticated Supabase client following our standard SSR authentication pattern
 * This is our single source of truth for server-side authentication
 */
async function createAuthenticatedSupabaseClient() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  // Standard session hydration following our established SSR pattern
  const allCookies = cookieStore.getAll();
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
  const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
  const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return supabase;
}


/**
 * Service for user profile and preferences logic. All business rules and data access for users live here.
 * Optimized for performance with minimal logging.
 */
export const userService = {
    /**
   * Get a single user by ID.
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const supabase = await createAuthenticatedSupabaseClient();

      const { data, error } = await supabase
        .schema('core')
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(`[userService] Error fetching user:`, error);
        throw error;
      }

      return data as User || null;
    } catch (error) {
      console.error(`[userService] getUser failed:`, error);
      throw error;
    }
  },

  /**
   * Get a single user by email.
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const supabase = await createAuthenticatedSupabaseClient();
    const { data, error } = await supabase
      .schema('core')
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) {
      console.error(`[userService] Error fetching user by email:`, error);
      throw error;
    }
    return data as User || null;
  },

  /**
   * Get multiple users by their IDs.
   */
  async getUsersByIds(userIds: string[]): Promise<User[]> {
    if (!userIds.length) return [];
    const supabase = await createAuthenticatedSupabaseClient();
    const { data, error } = await supabase
      .schema('core')
      .from('users')
      .select('*')
      .in('id', userIds);
    if (error) {
      console.error(`[userService] Error fetching users by IDs:`, error);
      throw error;
    }
    return (data || []) as User[];
  },

  /**
   * Update user preferences (partial update).
   */
  async updateUserPreferences(userId: string, preferences: Partial<User['preferences']>): Promise<User | null> {
    const supabase = await createAuthenticatedSupabaseClient();
    const { data, error } = await supabase
      .schema('core')
      .from('users')
      .update({ preferences })
      .eq('id', userId)
      .select()
      .single();
    if (error) {
      console.error(`[userService] Error updating user preferences:`, error);
      throw error;
    }
    return data as User || null;
  },

  /**
   * Update user profile information (first_name, last_name, full_name, etc.)
   */
  async updateUserProfile(userId: string, profile: Partial<Pick<User, 'first_name' | 'last_name' | 'full_name' | 'avatar_url'>>): Promise<User | null> {
    try {
      const supabase = await createAuthenticatedSupabaseClient();

      const { data, error } = await supabase
        .schema('core')
        .from('users')
        .update({
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error(`[userService] Error updating user profile:`, error);
        throw error;
      }

      return data as User || null;
    } catch (error) {
      console.error(`[userService] updateUserProfile failed:`, error);
      throw error;
    }
  },

  /**
   * Update both user profile and preferences in a single transaction
   */
  async updateUserProfileAndPreferences(
    userId: string,
    profile: Partial<Pick<User, 'first_name' | 'last_name' | 'full_name' | 'avatar_url'>>,
    preferences: Partial<User['preferences']>
  ): Promise<User | null> {
    const supabase = await createAuthenticatedSupabaseClient();

    const { data, error } = await supabase
      .schema('core')
      .from('users')
      .update({
        ...profile,
        preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`[userService] Error updating user profile and preferences:`, error);
      throw error;
    }

    return data as User || null;
  },

  /**
   * Update user navigation state (optimized for frequent updates)
   */
  async updateNavigationState(userId: string, contextKey: string, navOptionId: string): Promise<void> {
    try {
      const supabase = await createAuthenticatedSupabaseClient();

      // Update user preferences with navigation state
      const user = await this.getUser(userId);
      const currentPrefs = user?.preferences || {};

      const updatedPrefs = {
        ...currentPrefs,
        navigationState: {
          ...currentPrefs.navigationState,
          lastContext: contextKey,
          lastNavOption: navOptionId,
          lastUpdated: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .schema('core')
        .from('users')
        .update({ preferences: updatedPrefs })
        .eq('id', userId);

      if (error) {
        console.warn(`[userService] Navigation state update failed: ${error.message}`);
        // Don't throw - this is not critical
      }
    } catch (error) {
      console.warn('[userService] Navigation state update error:', error);
      // Don't throw - this is not critical for user experience
    }
  },

  /**
   * Update video progress (optimized for frequent updates)
   */
  async updateVideoProgress(userId: string, contentId: string, progress: Partial<VideoProgress>): Promise<void> {
    try {
      const supabase = await createAuthenticatedSupabaseClient();

      // Get current preferences
      const user = await this.getUser(userId);
      const currentPrefs = user?.preferences || {};
      const currentVideoProgress = currentPrefs.videoProgress || {};

      const updatedProgress = {
        ...currentVideoProgress[contentId],
        ...progress,
        contentId,
        lastWatchedAt: new Date().toISOString()
      };

      const updatedPrefs = {
        ...currentPrefs,
        videoProgress: {
          ...currentVideoProgress,
          [contentId]: updatedProgress
        }
      };

      const { error } = await supabase
        .schema('core')
        .from('users')
        .update({ preferences: updatedPrefs })
        .eq('id', userId);

      if (error) {
        console.error(`[userService] Error updating video progress:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`[userService] updateVideoProgress failed:`, error);
      throw error;
    }
  }
};