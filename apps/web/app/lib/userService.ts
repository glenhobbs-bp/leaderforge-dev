import { createSupabaseServerClient } from './supabaseServerClient';
import { cookies } from 'next/headers';
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
    console.log(`[userService] Found user: ${data?.id ?? 'none'}`);
    return data as User || null;
  },

  /**
   * Get a single user by email.
   */
  async getUserByEmail(email: string): Promise<User | null> {
    console.log(`[userService] Fetching user by email: ${email}`);
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
    console.log(`[userService] Found user: ${data?.id ?? 'none'}`);
    return data as User || null;
  },

  /**
   * Get multiple users by their IDs.
   */
  async getUsersByIds(userIds: string[]): Promise<User[]> {
    console.log(`[userService] Fetching users by IDs: ${userIds.join(', ')}`);
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
    console.log(`[userService] Found ${data?.length ?? 0} users`);
    return (data || []) as User[];
  },

  /**
   * Update user preferences (partial update).
   */
  async updateUserPreferences(userId: string, preferences: Partial<User['preferences']>): Promise<User | null> {
    console.log(`[userService] Updating preferences for user: ${userId}`);
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
    console.log(`[userService] Updated preferences for user: ${data?.id ?? 'none'}`);
    return data as User || null;
  },
};