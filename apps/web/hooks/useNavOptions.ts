// File: apps/web/hooks/useNavOptions.ts
// Purpose: React hook for fetching navigation options from the database
// Owner: Frontend team
// Tags: React hooks, navigation, SWR, database

import useSWR from 'swr';

// Fetch function with credentials and timeout - Fixed memory leak issues
const fetchWithCredentials = (url: string) => {
  // 15-second timeout to accommodate slow entitlement queries
  const controller = new AbortController();
  let timeoutId: number | undefined;

  // ✅ FIX: Ensure timeout is always cleared
  const cleanup = () => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  timeoutId = window.setTimeout(() => {
    cleanup();
    controller.abort();
  }, 15000);

  return fetch(url, {
    credentials: 'include',
    signal: controller.signal
  }).then((res) => {
    cleanup(); // Clear timeout on success
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }).catch((error) => {
    cleanup(); // Clear timeout on error
    if (error.name === 'AbortError') {
      console.warn('[useNavOptions] Navigation API request timed out');
      throw new Error('Navigation request timeout');
    }
    throw error;
  });
};

export function useNavOptions(tenantKey: string, initialData?: unknown) {
  const shouldFetch = !!tenantKey;
  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/nav/${tenantKey}` : null,
    fetchWithCredentials,
    {
      fallbackData: initialData,
      // Aggressive caching for performance
      revalidateOnMount: !initialData,
      revalidateOnFocus: false, // Don't refetch on window focus
      revalidateOnReconnect: false, // Don't refetch on reconnect
      dedupingInterval: 10 * 60 * 1000, // 10 minutes deduping
      focusThrottleInterval: 5 * 60 * 1000, // 5 minutes focus throttle
      // Cache for 10 minutes
      errorRetryInterval: 30 * 1000, // 30 seconds retry on error
      errorRetryCount: 2, // Only retry twice
    }
  );

  if (error) {
    console.error('[useNavOptions] Error:', error);
  }

  return {
    navOptions: data,
    loading: isLoading,
    error,
  };
}