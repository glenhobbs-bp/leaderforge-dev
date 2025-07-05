// File: apps/web/app/hooks/useUserPreferences.ts
// Purpose: React Query hooks for user preferences with optimized caching
// Owner: Frontend team
// Tags: React hooks, React Query, user preferences, caching, cross-invalidation

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserPreferences, updateUserPreferences } from '../lib/apiClient/userPreferences';

/**
 * React Query hook for fetching user preferences.
 * Optimized with caching for better performance.
 * @param userId - The user ID to fetch preferences for.
 * @param options - Optional query options to override defaults
 */
export function useUserPreferences(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: async () => {
      const result = await fetchUserPreferences(userId);
      // ✅ FIX: Ensure we never return undefined - React Query expects a value
      return result ?? {};
    },
    enabled: options?.enabled ?? !!userId,
    // Reduce stale time to prevent navigation state staleness
    staleTime: 30 * 1000, // 30 seconds (matches API cache)
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
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
    networkMode: 'offlineFirst', // Support offline-first
    throwOnError: false, // Don't throw errors, handle them gracefully
    // ✅ FIX: Provide default data to prevent undefined state
    placeholderData: {},
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