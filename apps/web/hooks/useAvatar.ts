import { useQuery, QueryClient } from '@tanstack/react-query';

interface UseAvatarOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useAvatar(userId: string | null, options: UseAvatarOptions = {}) {
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options; // Default 5 minutes cache

  return useQuery({
    queryKey: ['avatar', userId],
    queryFn: async (): Promise<string> => {
      if (!userId) {
        return "/icons/default-avatar.svg";
      }

      try {
        const response = await fetch(`/api/user/avatar?userId=${userId}`, {
          // Add cache headers for browser-level caching
          headers: {
            'Cache-Control': 'public, max-age=300', // 5 minutes browser cache
          },
        });

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
    staleTime, // 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    retry: 1, // Reduce retries for faster fallback
    retryDelay: 1000, // Fixed 1 second delay
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
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