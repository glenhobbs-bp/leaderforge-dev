// File: apps/web/hooks/useNavOptions.ts
// Purpose: Custom hook to fetch entitlement-filtered nav options for a given context from the API, using SWR. Used to drive schema-driven NavPanel.

import useSWR from 'swr';

async function fetchWithCredentials(url: string) {
  console.log('[useNavOptions] Fetching nav options from:', url);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('[useNavOptions] Fetch error:', errorData);
    throw new Error(errorData?.error || 'Failed to fetch nav options');
  }
  const data = await res.json();
  console.log(`[useNavOptions] Fetch success: loaded ${Array.isArray(data) ? data.length : 0} nav options.`);
  return data;
}

export function useNavOptions(contextKey: string, initialData?: unknown) {
  const shouldFetch = !!contextKey;
  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/nav/${contextKey}` : null,
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