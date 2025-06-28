// File: apps/web/app/lib/userService.ts
// Purpose: User service layer with optimized database operations and caching
// Owner: Backend team
// Tags: service layer, user management, Supabase, performance optimization

/**
 * ⚠️ DEPRECATED: This userService violates our SSR-first authentication architecture
 *
 * 🏗️ ARCHITECTURAL COMPLIANCE VIOLATION:
 * - Uses service role to bypass RLS policies (violates SSR-first auth)
 * - Creates custom authentication pattern (violates single auth flow)
 * - Bypasses established session management (violates auth consistency)
 *
 * ✅ MIGRATED TO SSR-COMPLIANT API ENDPOINTS:
 * - User Profile: /api/user/[user_id]/profile (GET, PATCH)
 * - User Preferences: /api/user/[user_id]/preferences (GET, PUT)
 * - Navigation State: /api/user/[user_id]/navigation-state (POST)
 * - Video Progress: /api/user/[user_id]/video-progress (POST)
 *
 * 🔄 TODO: Remove all remaining references to this service
 * 📝 Use authenticated API routes with proper SSR session validation instead
 */

import type { User, VideoProgress } from './types';

/**
 * Create a Supabase client with service role permissions
 * ⚠️ Use sparingly - only for operations that require elevated permissions
 */
// ❌ REMOVED: Service role helper violated SSR-only architecture
// All user operations must use authenticated Supabase client from SSR


/**
 * Service for user profile and preferences logic. All business rules and data access for users live here.
 * ✅ ARCHITECTURE COMPLIANCE: Always requires user-authenticated Supabase client (SSR)
 * Optimized for performance with minimal logging.
 */
export const userService = {
    /**
   * Get a single user by ID.
   * ✅ SSR COMPLIANCE: Uses authenticated client, not service role
   */
  async getUser(supabase: any, userId: string): Promise<User | null> {
    try {
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
   * ✅ SSR COMPLIANCE: Uses authenticated client, not service role
   */
  async getUserByEmail(supabase: any, email: string): Promise<User | null> {
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
   * ✅ SSR COMPLIANCE: Uses authenticated client, not service role
   */
  async getUsersByIds(supabase: any, userIds: string[]): Promise<User[]> {
    if (!userIds.length) return [];
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
   * ✅ SSR COMPLIANCE: Uses authenticated client, not service role
   */
  async updateUserPreferences(supabase: any, userId: string, preferences: Partial<User['preferences']>): Promise<User | null> {
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
   * ✅ SSR COMPLIANCE: Uses authenticated client, not service role
   */
  async updateUserProfile(supabase: any, userId: string, profile: Partial<Pick<User, 'first_name' | 'last_name' | 'full_name' | 'avatar_url'>>): Promise<User | null> {
    try {
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
   * ✅ SSR COMPLIANCE: Uses authenticated client, not service role
   */
  async updateUserProfileAndPreferences(
    supabase: any,
    userId: string,
    profile: Partial<Pick<User, 'first_name' | 'last_name' | 'full_name' | 'avatar_url'>>,
    preferences: Partial<User['preferences']>
  ): Promise<User | null> {
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
   * ✅ SSR COMPLIANCE: Uses authenticated client, not service role
   */
  async updateNavigationState(supabase: any, userId: string, contextKey: string, navOptionId: string): Promise<void> {
    try {
      // Update user preferences with navigation state
      const user = await userService.getUser(supabase, userId);
      const currentPrefs = user?.preferences || {};

      const updatedPrefs = {
        ...currentPrefs,
        navigationState: {
          ...currentPrefs.navigationState,
          lastTenant: contextKey,
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
   * ✅ SSR COMPLIANCE: Uses authenticated client, not service role
   */
  async updateVideoProgress(supabase: any, userId: string, contentId: string, progress: Partial<VideoProgress>): Promise<void> {
    try {
      // Get current preferences
      const user = await userService.getUser(supabase, userId);
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