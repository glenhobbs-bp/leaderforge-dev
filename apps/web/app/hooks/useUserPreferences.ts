import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserPreferences, updateUserPreferences } from '../lib/apiClient/userPreferences';

/**
 * React Query hook for fetching user preferences.
 * @param userId - The user ID to fetch preferences for.
 */
export function useUserPreferences(userId: string) {
  return useQuery({
    queryKey: ['user-preferences', userId],
    queryFn: () => fetchUserPreferences(userId),
    enabled: !!userId,
  });
}

/**
 * React Query mutation hook for updating user preferences.
 * @param userId - The user ID to update preferences for.
 */
export function useUpdateUserPreferences(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: any) => updateUserPreferences(userId, prefs),
    onSuccess: (data) => {
      console.log('[hook] useUpdateUserPreferences success:', data);
      queryClient.invalidateQueries({ queryKey: ['user-preferences', userId] });
    },
    onError: (err) => console.error('[hook] useUpdateUserPreferences error:', err),
  });
}

// TODO: Add test coverage for these hooks.