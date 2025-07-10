// File: apps/web/app/hooks/useUserPreferences.ts
// Purpose: React Query hooks for user preferences with optimized caching
// Owner: Frontend team
// Tags: React hooks, React Query, user preferences, caching, cross-invalidation

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserPreferences, updateUserPreferences } from '../lib/apiClient/userPreferences';

/**
 * React Query hook for fetching user preferences.
 * Optimized with caching for better performance.
 * @param userId - The user ID to fetch preferences for.
 * @param options - Optional query options to override defaults
 */
export function useUserPreferences(userId: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? !!userId;

  // ✅ FIX: Remove console logging that was causing performance issues and infinite loops
  // Only log in development mode and throttle to prevent spam
  if (process.env.NODE_ENV === 'development') {
    // Use a ref to throttle logs to once per second
    const lastLogTime = React.useRef(0);
    const now = Date.now();
    if (now - lastLogTime.current > 1000) {
      console.log('[useUserPreferences] Hook called:', { userId: userId?.slice(0, 8), enabled });
      lastLogTime.current = now;
    }
  }

  return useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: async () => {
      try {
        const result = await fetchUserPreferences(userId);
        // ✅ FIX: Ensure we never return undefined - React Query expects a value
        return result ?? {};
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useUserPreferences] API call failed:', { userId: userId?.slice(0, 8), error });
        }
        throw error;
      }
    },
    enabled,
    // ✅ FIX: Increase stale time to reduce re-fetching that causes render loops
    staleTime: 5 * 60 * 1000, // 5 minutes - much longer to prevent excessive queries
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: (failureCount, error) => {
      // Don't retry on authentication errors (401, 403)
      if (error instanceof Error && error.message.includes('Authentication')) {
        return false;
      }
      // Only retry once for other errors
      return failureCount < 1;
    },
    refetchOnWindowFocus: false, // Don't refetch on focus to prevent annoying page reloads when switching tabs
    refetchOnReconnect: false, // Don't refetch on reconnect
    refetchOnMount: false, // ✅ FIX: Don't refetch on mount if data exists
    networkMode: 'offlineFirst', // Support offline-first
    throwOnError: false, // Don't throw errors, handle them gracefully
    // ✅ FIX: Remove placeholderData that was causing render loops - let it be undefined initially
    meta: {
      errorMessage: 'Failed to load user preferences'
    }
  });
}

/**
 * React Query mutation hook for updating user preferences.
 * @param userId - The user ID to update preferences for.
 */
export function useUpdateUserPreferences(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Record<string, unknown>) => updateUserPreferences(userId, prefs),
    onSuccess: (data) => {
      // Invalidate and refetch user preferences
      queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
      // Also invalidate avatar cache if avatar_url was updated
      if (data && 'avatar_url' in data) {
        queryClient.invalidateQueries({ queryKey: ['avatar', userId] });
      }
    },
    onError: (err) => console.error('[hook] useUpdateUserPreferences error:', err),
  });
}

// TODO: Add test coverage for these hooks.