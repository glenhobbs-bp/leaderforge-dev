import { useQuery } from '@tanstack/react-query';
import { fetchNavForContext } from '../lib/apiClient/nav';

/**
 * React Query hook for fetching nav for a context.
 * @param contextKey - The context key to fetch nav for.
 * @param userId - The user ID for entitlement filtering.
 */
export function useNavForContext(contextKey: string, userId: string) {
  return useQuery({
    queryKey: ['nav-for-context', contextKey, userId],
    queryFn: () => fetchNavForContext(contextKey, userId),
    enabled: !!contextKey && !!userId,
    onError: (err) => console.error('[hook] useNavForContext error:', err),
    onSuccess: (data) => console.log('[hook] useNavForContext success:', data),
  });
}

// TODO: Add test coverage for this hook.