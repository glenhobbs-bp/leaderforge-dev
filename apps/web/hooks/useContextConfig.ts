import useSWR from 'swr';

export function useContextConfig(contextKey: string) {
  const shouldFetch = !!contextKey;
  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/context/${contextKey}` : null,
    (url) => fetch(url, { credentials: 'include' }).then((res) => res.json())
  );
  return {
    config: data,
    loading: isLoading,
    error,
  };
}