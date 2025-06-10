import useSWR from 'swr';

export function useNavOptions(contextKey: string, userId?: string) {
  const { data, error, isLoading } = useSWR(
    contextKey && userId ? `/api/nav/${contextKey}?user_id=${encodeURIComponent(userId)}` : null,
    (url) => fetch(url).then((res) => res.json())
  );
  return {
    navOptions: Array.isArray(data) ? data : [],
    loading: isLoading,
    error,
  };
}