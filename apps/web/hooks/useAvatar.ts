import { useQuery, QueryClient } from '@tanstack/react-query';

interface UseAvatarOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useAvatar(userId: string | null, options: UseAvatarOptions = {}) {
  const { enabled = true, staleTime = 10 * 60 * 1000 } = options; // Default 10 minutes cache

  return useQuery({
    queryKey: ['avatar', userId],
    queryFn: async (): Promise<string> => {
      if (!userId) {
        return "/icons/default-avatar.svg";
      }

      try {
        const response = await fetch(`/api/user/avatar?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`Avatar fetch failed: ${response.status}`);
        }

        const data = await response.json();
        return data.url || "/icons/default-avatar.svg";
      } catch (error) {
        console.error('[useAvatar] Error fetching avatar:', error);
        return "/icons/default-avatar.svg";
      }
    },
    enabled: enabled && !!userId,
    staleTime, // Cache for specified time
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (updated from cacheTime)
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

// Global cache invalidation function for avatar updates
export function invalidateAvatarCache(userId: string, queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['avatar', userId] });
}

// Force refetch avatar (for after uploads)
export function refetchAvatar(userId: string, queryClient: QueryClient) {
  return queryClient.refetchQueries({ queryKey: ['avatar', userId] });
}