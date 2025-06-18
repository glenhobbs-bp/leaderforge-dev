import useSWR from 'swr';

export function useContextConfig(contextKey: string, initialData?: any) {
  const shouldFetch = !!contextKey;
  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/context/${contextKey}` : null,
    (url) => fetch(url, { credentials: 'include' }).then((res) => res.json()),
    {
      fallbackData: initialData,
      // Don't revalidate immediately if we have initial data
      revalidateOnMount: !initialData,
    }
  );
  return {
    config: data,
    loading: isLoading,
    error,
  };
}