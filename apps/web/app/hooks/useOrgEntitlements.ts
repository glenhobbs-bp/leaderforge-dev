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
    // Note: onError and onSuccess deprecated in newer React Query versions
  });
}

// TODO: Add test coverage for this hook.