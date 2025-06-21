// File: apps/web/app/lib/userService.ts
// Purpose: User service layer with optimized database operations and caching
// Owner: Backend team
// Tags: service layer, user management, Supabase, performance optimization

import { createSupabaseServerClient } from './supabaseServerClient';
import { cookies } from 'next/headers';
import type { User, VideoProgress } from './types';

/**
 * Service for user profile and preferences logic. All business rules and data access for users live here.
 * Optimized for performance with minimal logging.
 */
export const userService = {
    /**
   * Get a single user by ID.
   */
  async getUser(userId: string): Promise<User | null> {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // SSR Auth: extract tokens from cookies and set session (same pattern as nav API)
    const allCookies = cookieStore.getAll();
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
    const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else {
      console.error('[userService] Missing access or refresh token in cookies');
      throw new Error('Authentication required');
    }

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
  },

  /**
   * Get a single user by email.
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
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
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
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
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
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
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // SSR Auth: extract tokens from cookies and set session
    const allCookies = cookieStore.getAll();
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
    const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else {
      console.error('[userService] Missing access or refresh token in cookies');
      throw new Error('Authentication required');
    }

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
  },

  /**
   * Update both user profile and preferences in a single transaction
   */
  async updateUserProfileAndPreferences(
    userId: string,
    profile: Partial<Pick<User, 'first_name' | 'last_name' | 'full_name' | 'avatar_url'>>,
    preferences: Partial<User['preferences']>
  ): Promise<User | null> {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // SSR Auth: extract tokens from cookies and set session
    const allCookies = cookieStore.getAll();
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pcjaagjqydyqfsthsmac';
    const accessToken = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)?.value;
    const refreshToken = allCookies.find(c => c.name === `sb-${projectRef}-refresh-token`)?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else {
      console.error('[userService] Missing access or refresh token in cookies');
      throw new Error('Authentication required');
    }

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
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

    // Get current preferences
    const user = await this.getUser(userId);
    const currentPrefs = user?.preferences || {};

    const updatedPrefs = {
      ...currentPrefs,
      navigation: {
        lastContextKey: contextKey,
        lastNavOptionId: navOptionId,
        lastVisitedAt: new Date().toISOString()
      }
    };

    const { error } = await supabase
      .schema('core')
      .from('users')
      .update({ preferences: updatedPrefs })
      .eq('id', userId);

    if (error) {
      console.error(`[userService] Error updating navigation state:`, error);
      throw error;
    }
  },

  /**
   * Update video progress (optimized for frequent updates)
   */
  async updateVideoProgress(userId: string, contentId: string, progress: Partial<VideoProgress>): Promise<void> {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);

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
  }
};