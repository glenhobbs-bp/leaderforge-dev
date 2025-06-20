// File: apps/web/app/lib/authService.ts
// Purpose: Authentication service layer - extracted from UI components
// Handles sign out and session management according to architecture principles

import { SupabaseClient } from '@supabase/supabase-js';

export const authService = {
  /**
   * Signs out user and clears session
   * Extracted from NavPanel to follow separation of concerns
   */
  async signOut(supabase: SupabaseClient): Promise<void> {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear server-side session
      await fetch('/api/auth/set-session', {
        method: 'POST',
        body: JSON.stringify({ session: null }),
        headers: { 'Content-Type': 'application/json' },
      });

      // Redirect to home/login
      window.location.href = '/';
    } catch (error) {
      console.error('[authService] Sign out error:', error);
      throw error;
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