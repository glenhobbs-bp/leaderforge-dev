import { useQuery } from '@tanstack/react-query';
import { fetchContentForContext } from '../lib/apiClient/content';

/**
 * React Query hook for fetching content for a context.
 * @param contextKey - The context key to fetch content for.
 * @param userId - The user ID for entitlement filtering.
 */
export function useContentForContext(contextKey: string, userId: string) {
  return useQuery({
    queryKey: ['content-for-context', contextKey, userId],
    queryFn: () => fetchContentForContext(contextKey, userId),
    enabled: !!contextKey && !!userId,
    // Note: onError and onSuccess are deprecated in newer React Query versions
    // Error handling should be done in components using error boundaries or status checks
  });
}

// TODO: Add test coverage for this hook.