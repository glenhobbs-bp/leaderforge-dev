// File: apps/web/hooks/useAvatar.ts
// Purpose: React Query hook for optimized avatar fetching with caching
// Owner: Frontend team
// Tags: React hooks, React Query, avatar, performance, caching

import { useQuery, QueryClient } from '@tanstack/react-query';

interface UseAvatarOptions {
  enabled?: boolean;
  staleTime?: number;
}

// ✅ FIX: Avatar fallback hierarchy for better reliability
const AVATAR_FALLBACKS = [
  "/icons/default-avatar.svg",
  "/icons/user.svg",
  "/icons/users.svg",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='%23666'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4 20c0-4 8-4 8-4s8 0 8 4'/%3E%3C/svg%3E" // Inline SVG as ultimate fallback
];

export function useAvatar(userId: string | null, options: UseAvatarOptions = {}) {
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options; // Default 5 minutes cache

  return useQuery({
    queryKey: ['avatar', userId],
    queryFn: async (): Promise<string> => {
      // ✅ FIX: Always return default avatar if no userId
      if (!userId) {
        return AVATAR_FALLBACKS[0];
      }

      try {
        const response = await fetch(`/api/user/avatar?userId=${userId}`, {
          // Include credentials for authentication
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache', // ✅ FIX: Prevent browser caching issues
          },
        });

        if (!response.ok) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useAvatar] Avatar API failed, using default:', response.status);
          }
          return AVATAR_FALLBACKS[0];
        }

                const data = await response.json();
        const avatarUrl = data.url || AVATAR_FALLBACKS[0];

        // ✅ FIX: Validate that the returned URL is accessible
        if (!AVATAR_FALLBACKS.includes(avatarUrl)) {
          try {
            const validateResponse = await fetch(avatarUrl, { method: 'HEAD' });
            if (!validateResponse.ok) {
              return AVATAR_FALLBACKS[0];
            }
          } catch {
            return AVATAR_FALLBACKS[0];
          }
        }

        return avatarUrl;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[useAvatar] Error fetching avatar, using default:', error);
        }
        return AVATAR_FALLBACKS[0];
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