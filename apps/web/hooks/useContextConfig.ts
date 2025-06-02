import useSWR from 'swr';

export function useContextConfig(contextKey: string) {
  const { data, error, isLoading } = useSWR(
    `/api/context/${contextKey}`,
    (url) => fetch(url).then((res) => res.json())
  );
  return {
    config: data,
    loading: isLoading,
    error,
  };
}