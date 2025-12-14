"use client";

import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryClientProviderProps {
  children: ReactNode;
}

export default function QueryClientProvider({ children }: QueryClientProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - more aggressive caching
            gcTime: 30 * 60 * 1000, // 30 minutes - keep data longer
            refetchOnWindowFocus: false, // Don't refetch on focus
            refetchOnReconnect: false, // Don't refetch on reconnect
            retry: 1, // Reduce retries for faster failures
            retryDelay: 1000, // Fixed 1 second delay
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  );
}