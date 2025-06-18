import { supabase } from './supabaseClient';
import type { User } from './types';

/**
 * Service for user profile and preferences logic. All business rules and data access for users live here.
 * All methods are robustly logged for observability.
 */
export const userService = {
  /**
   * Get a single user by ID.
   */
  async getUser(userId: string): Promise<User | null> {
    console.log(`[userService] Fetching user: ${userId}`);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error(`[userService] Error fetching user:`, error);
      throw error;
    }
    console.log(`[userService] Found user: ${data?.id ?? 'none'}`);
    return data as User || null;
  },

  /**
   * Get a single user by email.
   */
  async getUserByEmail(email: string): Promise<User | null> {
    console.log(`[userService] Fetching user by email: ${email}`);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) {
      console.error(`[userService] Error fetching user by email:`, error);
      throw error;
    }
    console.log(`[userService] Found user: ${data?.id ?? 'none'}`);
    return data as User || null;
  },

  /**
   * Get multiple users by their IDs.
   */
  async getUsersByIds(userIds: string[]): Promise<User[]> {
    console.log(`[userService] Fetching users by IDs: ${userIds.join(', ')}`);
    if (!userIds.length) return [];
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds);
    if (error) {
      console.error(`[userService] Error fetching users by IDs:`, error);
      throw error;
    }
    console.log(`[userService] Found ${data?.length ?? 0} users`);
    return (data || []) as User[];
  },

  /**
   * Update user preferences (partial update).
   */
  async updateUserPreferences(userId: string, preferences: Partial<User['preferences']>): Promise<User | null> {
    console.log(`[userService] Updating preferences for user: ${userId}`);
    const { data, error } = await supabase
      .from('users')
      .update({ preferences })
      .eq('id', userId)
      .select()
      .single();
    if (error) {
      console.error(`[userService] Error updating user preferences:`, error);
      throw error;
    }
    console.log(`[userService] Updated preferences for user: ${data?.id ?? 'none'}`);
    return data as User || null;
  },
};