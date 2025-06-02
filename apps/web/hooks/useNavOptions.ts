import useSWR from 'swr';

export function useNavOptions(contextKey: string) {
  const { data, error, isLoading } = useSWR(
    contextKey ? `/api/nav/${contextKey}` : null,
    (url) => fetch(url).then((res) => res.json())
  );
  return {
    navOptions: Array.isArray(data) ? data : [],
    loading: isLoading,
    error,
  };
}