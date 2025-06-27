/**
 * Network Utilities - Enhanced fetch with retry and timeout handling
 * Purpose: Provide robust network operations with automatic retry for transient failures
 * Owner: Infrastructure Team
 * Tags: network-resilience, fetch-utilities, error-handling
 */

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  retryOn?: (error: Error) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  retryOn: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'AbortError' ||
      error.name === 'TimeoutError' ||
      error.message.includes('ConnectTimeoutError') ||
      error.message.includes('fetch failed') ||
      error.message.includes('network')
    );
  },
};

/**
 * Enhanced fetch with automatic retry for network resilience
 */
export async function fetchWithRetry(
  url: RequestInfo | URL,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(opts.timeout),
        headers: {
          ...(options.headers || {}),
          'Keep-Alive': 'timeout=30, max=100',
          'Connection': 'keep-alive',
        },
      });

      // Don't retry on HTTP error responses (4xx, 5xx), just return them
      // The caller can decide how to handle HTTP errors
      return response;
    } catch (error) {
      lastError = error as Error;

      console.warn(`[fetchWithRetry] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed:`, {
        url: typeof url === 'string' ? url : url.toString(),
        error: lastError.message,
        willRetry: attempt < opts.maxRetries && opts.retryOn(lastError),
      });

      // Don't retry if this is the last attempt or if error is not retryable
      if (attempt >= opts.maxRetries || !opts.retryOn(lastError)) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      const delay = opts.retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Supabase-specific fetch wrapper with appropriate retry settings
 */
export function createSupabaseFetch(): (url: RequestInfo | URL, options?: RequestInit) => Promise<Response> {
  return (url: RequestInfo | URL, options: RequestInit = {}) => {
    return fetchWithRetry(url, options, {
      maxRetries: 2, // Conservative for database operations
      retryDelay: 1000,
      timeout: 30000,
      retryOn: (error: Error) => {
        // Only retry on clear network failures, not application errors
        return (
          error.name === 'AbortError' ||
          error.message.includes('ConnectTimeoutError') ||
          error.message.includes('fetch failed') ||
          (error.message.includes('network') && !error.message.includes('401') && !error.message.includes('403'))
        );
      },
    });
  };
}