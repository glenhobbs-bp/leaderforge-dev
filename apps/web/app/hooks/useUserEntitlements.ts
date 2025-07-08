import { useQuery } from '@tanstack/react-query';
import { fetchUserEntitlements } from '../lib/apiClient/entitlements';

/**
 * React Query hook for fetching user entitlements.
 * @param userId - The user ID to fetch entitlements for.
 */
export function useUserEntitlements(userId: string) {
  return useQuery({
    queryKey: ['entitlements', userId],
    queryFn: () => fetchUserEntitlements(userId),
    enabled: !!userId,
    // Note: onError and onSuccess deprecated in newer React Query versions
  });
}

// TODO: Add test coverage for this hook.