import useSWR from 'swr';

async function fetchWithCredentials(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || 'Failed to fetch nav options');
  }
  return res.json();
}

export function useNavOptions(contextKey: string, userId?: string) {
  const shouldFetch = Boolean(contextKey && userId);
  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/nav/${contextKey}?user_id=${encodeURIComponent(userId)}` : null,
    fetchWithCredentials,
    {
      // Optional retry/fallback logic
      // onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
      //   if (retryCount >= 3) return;
      //   setTimeout(() => revalidate({ retryCount }), 2000);
      // }
    }
  );

  return {
    navOptions: Array.isArray(data) ? data : [],
    loading: isLoading,
    error,
  };
}