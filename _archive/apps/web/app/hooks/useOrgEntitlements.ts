import { useQuery } from '@tanstack/react-query';
import { fetchOrgEntitlements } from '../lib/apiClient/orgEntitlements';

/**
 * React Query hook for fetching org entitlements.
 * @param orgId - The org ID to fetch entitlements for.
 */
export function useOrgEntitlements(orgId: string) {
  return useQuery({
    queryKey: ['org-entitlements', orgId],
    queryFn: () => fetchOrgEntitlements(orgId),
    enabled: !!orgId,
    onError: (err) => console.error('[hook] useOrgEntitlements error:', err),
    onSuccess: (data) => console.log('[hook] useOrgEntitlements success:', data),
  });
}

// TODO: Add test coverage for this hook.