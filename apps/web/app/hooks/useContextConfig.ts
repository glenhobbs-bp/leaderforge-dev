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
    // Note: onError and onSuccess deprecated in newer React Query versions
  });
}

// TODO: Add test coverage for this hook.