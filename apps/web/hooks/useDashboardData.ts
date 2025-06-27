// File: apps/web/hooks/useDashboardData.ts
// Purpose: React Query hook for fetching optimized dashboard data from agent/context API
// Owner: Frontend team
// Tags: React hooks, React Query, dashboard, agent context, performance

import { useQuery } from '@tanstack/react-query';

interface DashboardResponse {
  type: string;
  content?: {
    type: string;
    data?: unknown;
    config?: unknown;
    style?: unknown;
  };
  schema?: {
    widgets?: unknown[];
  };
  widgets?: unknown[];
}

// Hook for fetching dashboard data from agent/context endpoint
export function useDashboardData(userId: string | undefined, tenantKey: string = 'brilliant') {
  return useQuery<DashboardResponse>({
    queryKey: ['dashboardData', userId, tenantKey],
    queryFn: async (): Promise<DashboardResponse> => {
      if (!userId) throw new Error('No user ID provided');
      const response = await fetch(`/api/dashboard?userId=${userId}&tenantKey=${tenantKey}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Dashboard fetch failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!userId && !!tenantKey,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}