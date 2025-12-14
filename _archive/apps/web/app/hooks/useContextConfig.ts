import { useQuery } from '@tanstack/react-query';
import { fetchContextConfig } from '../lib/apiClient/contextConfig';

/**
 * React Query hook for fetching context config.
 * @param contextKey - The context key to fetch config for.
 * @param userId - The user ID for entitlement filtering.
 */
export function useContextConfig(contextKey: string, userId?: string) {
  return useQuery({
    queryKey: ['context-config', contextKey, userId],
    queryFn: () => fetchContextConfig(contextKey, userId),
    enabled: !!contextKey && !!userId,
    onError: (err) => console.error('[hook] useContextConfig error:', err),
    onSuccess: (data) => console.log('[hook] useContextConfig success:', data),
  });
}

// TODO: Add test coverage for this hook.