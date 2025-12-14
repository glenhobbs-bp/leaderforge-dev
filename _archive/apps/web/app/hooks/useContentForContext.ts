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
    onError: (err) => console.error('[hook] useContentForContext error:', err),
    onSuccess: (data) => console.log('[hook] useContentForContext success:', data),
  });
}

// TODO: Add test coverage for this hook.