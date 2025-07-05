// File: apps/web/app/lib/authService.ts
// Purpose: Authentication service layer - extracted from UI components
// Owner: Backend team
// Tags: authentication, Supabase, service layer, session management

import { SupabaseClient } from '@supabase/supabase-js';

interface TimeoutPromise extends Promise<never> {
  cleanup?: () => void;
}

export const authService = {
  /**
   * Signs out user and clears session
   * Extracted from NavPanel to follow separation of concerns
   * Fixed memory leak issues with proper timeout cleanup
   */
  async signOut(supabase: SupabaseClient): Promise<void> {
    try {
      // ✅ FIX: Create timeout promises with proper cleanup
      const createTimeoutPromise = (ms: number): TimeoutPromise => {
        let timeoutId: number;
        const promise = new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error('Timeout')), ms);
        }) as TimeoutPromise;

        // Add cleanup method to the promise
        promise.cleanup = () => {
          if (timeoutId) {
            window.clearTimeout(timeoutId);
          }
        };

        return promise;
      };

      // Sign out from Supabase with 2-second timeout
      try {
        const timeoutPromise = createTimeoutPromise(2000);
        await Promise.race([
          supabase.auth.signOut(),
          timeoutPromise
        ]);
        timeoutPromise.cleanup?.();
      } catch (error) {
        console.warn('[authService] Supabase signOut timeout/error:', error);
        // Continue with logout even if Supabase fails
      }

      // Clear server-side session with 1-second timeout
      try {
        const timeoutPromise = createTimeoutPromise(1000);
        await Promise.race([
          fetch('/api/auth/set-session', {
            method: 'POST',
            body: JSON.stringify({ session: null }),
            headers: { 'Content-Type': 'application/json' },
          }),
          timeoutPromise
        ]);
        timeoutPromise.cleanup?.();
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