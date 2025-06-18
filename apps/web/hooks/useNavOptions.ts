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

export function useNavOptions(contextKey: string, initialData?: any) {
  const shouldFetch = !!contextKey;
  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/nav/${contextKey}` : null,
    fetchWithCredentials,
    {
      fallbackData: initialData,
      // Don't revalidate immediately if we have initial data
      revalidateOnMount: !initialData,
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