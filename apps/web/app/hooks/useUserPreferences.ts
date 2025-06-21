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
 */
export function useUserPreferences(userId: string) {
  return useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: () => fetchUserPreferences(userId),
    enabled: !!userId,
    // Optimize caching similar to avatar hook
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1, // Reduce retries for faster fallback
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    networkMode: 'offlineFirst', // Support offline-first
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