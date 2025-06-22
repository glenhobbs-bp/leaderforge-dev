// File: apps/web/hooks/useDashboardData.ts
// Purpose: Optimized dashboard data hook - fetches all data in single API call
// Owner: Frontend team
// Tags: React hooks, performance optimization, dashboard, batched queries

import { useQuery } from '@tanstack/react-query';
import type { NavOption } from '../app/lib/types';

interface DashboardData {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    avatar_url: string;
    preferences: Record<string, unknown>;
  } | null;
  navOptions: NavOption[];
  contextConfig: {
    context_key: string;
    display_name: string;
    theme: Record<string, string>;
    i18n: Record<string, string>;
    logo_url: string;
    settings: Record<string, unknown>;
  } | null;
  contextKey: string;
}

/**
 * Optimized dashboard data hook
 * Fetches all dashboard data in a single API call for better performance
 */
export function useDashboardData(userId: string | undefined, contextKey: string = 'brilliant') {
  return useQuery<DashboardData>({
    queryKey: ['dashboardData', userId, contextKey],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const response = await fetch(`/api/dashboard?userId=${userId}&contextKey=${contextKey}`);
      if (!response.ok) {
        throw new Error(`Dashboard API failed: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    retry: 2, // Allow 2 retries for better reliability
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}