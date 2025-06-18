/**
 * Request deduplication system to prevent multiple identical API calls.
 * This is especially important for preventing race conditions during initial page load.
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly TTL = 5000; // 5 seconds TTL for pending requests

  /**
   * Deduplicate a request by its key. If the same request is already in progress,
   * return the existing promise. Otherwise, execute the request function.
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Clean up expired requests
    this.cleanup();

    // Check if we already have this request in progress
    const existing = this.pendingRequests.get(key);
    if (existing) {
      console.log(`[RequestDeduplicator] Using existing request for key: ${key}`);
      return existing.promise;
    }

    // Execute new request
    console.log(`[RequestDeduplicator] Executing new request for key: ${key}`);
    const promise = requestFn().finally(() => {
      // Remove from pending requests when done
      this.pendingRequests.delete(key);
    });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  /**
   * Generate a request key for API calls
   */
  static createKey(method: string, url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramString}`;
  }

  /**
   * Clean up expired pending requests
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.TTL) {
        console.log(`[RequestDeduplicator] Cleaning up expired request: ${key}`);
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Get stats about pending requests (for debugging)
   */
  getStats(): { pendingCount: number; keys: string[] } {
    return {
      pendingCount: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys())
    };
  }

  /**
   * Clear all pending requests (useful for testing)
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

// Global instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Enhanced fetch wrapper with request deduplication
 */
export async function deduplicatedFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const method = options.method || 'GET';
  const key = RequestDeduplicator.createKey(method, url, options.body ? JSON.parse(options.body as string) : undefined);

  return requestDeduplicator.deduplicate(key, async () => {
    const response = await fetch(url, {
      credentials: 'include',
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  });
}

/**
 * Hook into global fetch to provide automatic deduplication (optional)
 */
export function enableGlobalDeduplication(): void {
  if (typeof window === 'undefined') return; // Server-side only

  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';

    // Only deduplicate GET requests to API endpoints
    if (method === 'GET' && url.startsWith('/api/')) {
      return deduplicatedFetch(url, init);
    }

    // Use original fetch for everything else
    return originalFetch(input, init);
  };

  console.log('[RequestDeduplicator] Global deduplication enabled');
}