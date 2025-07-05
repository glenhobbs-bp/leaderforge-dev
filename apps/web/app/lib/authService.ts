// File: apps/web/app/lib/authService.ts
// Purpose: Authentication service layer - extracted from UI components
// Owner: Backend team
// Tags: authentication, Supabase, service layer, session management

import { SupabaseClient } from '@supabase/supabase-js';

export const authService = {
  /**
   * Signs out user and clears session
   * Extracted from NavPanel to follow separation of concerns
   */
  async signOut(supabase: SupabaseClient): Promise<void> {
    try {
      // Create timeout promises for all operations
      const timeout = (ms: number) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
      );

      // Sign out from Supabase with 2-second timeout
      try {
        await Promise.race([
          supabase.auth.signOut(),
          timeout(2000)
        ]);
      } catch (error) {
        console.warn('[authService] Supabase signOut timeout/error:', error);
        // Continue with logout even if Supabase fails
      }

      // Clear server-side session with 1-second timeout
      try {
        await Promise.race([
          fetch('/api/auth/set-session', {
            method: 'POST',
            body: JSON.stringify({ session: null }),
            headers: { 'Content-Type': 'application/json' },
          }),
          timeout(1000)
        ]);
      } catch (error) {
        console.warn('[authService] Set-session timeout/error:', error);
        // Continue with logout even if server call fails
      }

      // Redirect immediately - don't wait for server calls
      window.location.href = '/';
    } catch (error) {
      console.error('[authService] Sign out error:', error);
      // Force redirect even on error to ensure user can log out
      window.location.href = '/';
    }
  },

  /**
   * Gets current session status
   */
  async getSession(supabase: SupabaseClient) {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[authService] Session error:', error);
      throw error;
    }
    return data.session;
  },

  /**
   * Gets current user
   */
  async getCurrentUser(supabase: SupabaseClient) {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('[authService] User error:', error);
      throw error;
    }
    return data.user;
  }
};